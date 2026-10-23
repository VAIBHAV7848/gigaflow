/**
 * ENGINE 02: Verification & Evidence Engine (DSA & Software Engineering)
 * Primary Student Owner: Darshan Kittur (02FE24BCS053)
 * Module: Hierarchical Merkle Evidence Tree
 * 
 * Requirements Supported: FR-04, NFR-03
 * Data Structure: Binary/N-ary Cryptographic Hash Tree
 * Purpose: Aggregates disparate dispute artifacts (specs, code hashes, chat logs, approvals)
 * into a single tamper-evident Merkle Root. Single-bit tampering in any artifact is immediately
 * detected in O(log N) time.
 */

import { CryptographicHasher } from "./hasher";

export interface MerkleArtifact {
  id: string;
  name: string;
  type: string; // CODE, SPEC, CHAT, COMMIT, APPROVAL
  hash: string; // SHA-256 digest of artifact content
  timestamp?: string;
}

export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  artifact?: MerkleArtifact;
  isLeaf: boolean;
}

export class MerkleEvidenceTree {
  private leaves: MerkleNode[] = [];
  private root: MerkleNode | null = null;

  constructor(artifacts: MerkleArtifact[] = []) {
    if (artifacts.length > 0) {
      this.build(artifacts);
    }
  }

  /**
   * Constructs the Merkle Tree from a list of evidence artifacts.
   */
  build(artifacts: MerkleArtifact[]): string {
    if (artifacts.length === 0) {
      this.root = null;
      return "";
    }

    // 1. Create sorted canonical leaves to ensure deterministic hashing
    const sorted = [...artifacts].sort((a, b) => a.id.localeCompare(b.id));
    this.leaves = sorted.map((artifact) => ({
      hash: artifact.hash,
      artifact,
      isLeaf: true,
    }));

    // 2. Pairwise hashing upwards
    let currentLevel: MerkleNode[] = [...this.leaves];

    while (currentLevel.length > 1) {
      const nextLevel: MerkleNode[] = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        // If odd count of nodes, duplicate the last node
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;

        const combinedPayload = left.hash + right.hash;
        const parentHash = CryptographicHasher.sha256(combinedPayload);

        nextLevel.push({
          hash: parentHash,
          left,
          right,
          isLeaf: false,
        });
      }

      currentLevel = nextLevel;
    }

    this.root = currentLevel[0];
    return this.root.hash;
  }

  /**
   * Returns the current Merkle Root hash (the project state fingerprint).
   */
  getRootHash(): string {
    return this.root ? this.root.hash : "";
  }

  /**
   * Verifies if any artifact within the tree has been modified.
   * Compares the actual artifacts re-hashed against the stored expected root.
   */
  static verifyIntegrity(artifacts: MerkleArtifact[], expectedRoot: string): { isValid: boolean; computedRoot: string } {
    const tree = new MerkleEvidenceTree(artifacts);
    const computedRoot = tree.getRootHash();
    return {
      isValid: computedRoot.toLowerCase() === expectedRoot.toLowerCase(),
      computedRoot,
    };
  }

  /**
   * Generates a Merkle Inclusion Proof (audit path of sibling hashes)
   * allowing verification that an artifact belongs to the tree without revealing all other artifacts.
   */
  generateProof(artifactId: string): string[] {
    const proof: string[] = [];
    if (!this.root || this.leaves.length === 0) return proof;

    let targetIndex = this.leaves.findIndex((l) => l.artifact?.id === artifactId);
    if (targetIndex === -1) return proof;

    let currentLevel: MerkleNode[] = [...this.leaves];

    while (currentLevel.length > 1) {
      const isRightNode = targetIndex % 2 === 1;
      const siblingIndex = isRightNode ? targetIndex - 1 : targetIndex + 1;

      if (siblingIndex < currentLevel.length) {
        proof.push(currentLevel[siblingIndex].hash);
      } else {
        // Handled self-pairing for odd node count
        proof.push(currentLevel[targetIndex].hash);
      }

      // Move to parent level
      const nextLevel: MerkleNode[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        nextLevel.push({
          hash: CryptographicHasher.sha256(left.hash + right.hash),
          left,
          right,
          isLeaf: false,
        });
      }

      targetIndex = Math.floor(targetIndex / 2);
      currentLevel = nextLevel;
    }

    return proof;
  }

  /**
   * Returns a serializable hierarchy of the tree for frontend visual graph rendering.
   */
  serializeTree(): unknown {
    const formatNode = (node: MerkleNode | undefined): unknown => {
      if (!node) return null;
      return {
        hash: node.hash,
        isLeaf: node.isLeaf,
        artifact: node.artifact,
        left: formatNode(node.left),
        right: formatNode(node.right),
      };
    };
    return formatNode(this.root || undefined);
  }
}
