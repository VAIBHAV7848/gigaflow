import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SessionService } from "@/core/engine-04-web/session";
import { CryptographicHasher } from "@/core/engine-02-dsa-se/hasher";
import { MerkleEvidenceTree } from "@/core/engine-02-dsa-se/evidence-tree";
import { ChainedAuditLogger } from "@/core/engine-03-dbms/audit-logger";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: disputeId } = await params;
    const { artifactName, artifactType, artifactContent } = await req.json();

    if (!artifactName || !artifactContent) {
      return NextResponse.json({ error: "Artifact name and content are required." }, { status: 400 });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { evidenceNodes: true },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found." }, { status: 404 });
    }

    // Compute SHA-256 hash of this artifact
    const payloadHash = CryptographicHasher.sha256(artifactContent);
    const nextIndex = dispute.evidenceNodes.length;

    // Create the evidence node
    const newNode = await prisma.evidenceNode.create({
      data: {
        disputeId,
        uploaderId: session.userId,
        artifactName,
        artifactType: artifactType || "DELIVERABLE",
        payloadHash,
        merkleIndex: nextIndex,
      },
    });

    // Rebuild Merkle Tree with all nodes
    const allNodes = await prisma.evidenceNode.findMany({
      where: { disputeId },
      orderBy: { merkleIndex: "asc" },
    });

    const tree = new MerkleEvidenceTree(
      allNodes.map((n) => ({
        id: n.id,
        name: n.artifactName,
        type: n.artifactType,
        hash: n.payloadHash,
      }))
    );

    const rootHash = tree.getRootHash();

    // Update dispute with new root hash
    await prisma.dispute.update({
      where: { id: disputeId },
      data: { evidenceRootHash: rootHash },
    });

    await ChainedAuditLogger.recordEvent({
      actorId: session.userId,
      actorRole: session.role,
      action: "EVIDENCE_SUBMITTED",
      resourceType: "EvidenceNode",
      resourceId: newNode.id,
      payload: { disputeId, artifactName, payloadHash, newRootHash: rootHash },
    });

    return NextResponse.json({
      success: true,
      node: newNode,
      rootHash,
      treeVisualization: tree.serializeTree(),
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Submit evidence error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit evidence." }, { status: 400 });
  }
}
