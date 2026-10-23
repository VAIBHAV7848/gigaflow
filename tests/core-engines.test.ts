import { describe, it, expect } from "vitest";
import { EscrowStateMachine, MilestoneState } from "../src/core/engine-01-os/escrow-fsm";
import { WatchdogScheduler } from "../src/core/engine-01-os/watchdog";
import { CryptographicHasher } from "../src/core/engine-02-dsa-se/hasher";
import { MerkleEvidenceTree } from "../src/core/engine-02-dsa-se/evidence-tree";
import { ProposalMatcher } from "../src/core/engine-02-dsa-se/matcher";
import { RBACGuard } from "../src/core/engine-04-web/rbac";
import { Role } from "@prisma/client";

describe("ENGINE 01 (OS): Escrow & State Scheduler", () => {
  it("enforces legal FSM transitions (LOCKED -> FUNDED -> SUBMITTED -> APPROVED)", () => {
    expect(EscrowStateMachine.canTransition("LOCKED", "FUNDED")).toBe(true);
    expect(EscrowStateMachine.canTransition("FUNDED", "IN_DEVELOPMENT")).toBe(true);
    expect(EscrowStateMachine.canTransition("IN_DEVELOPMENT", "SUBMITTED")).toBe(true);
    expect(EscrowStateMachine.canTransition("SUBMITTED", "APPROVED")).toBe(true);
  });

  it("rejects illegal transitions (e.g. LOCKED directly to APPROVED or SUBMITTED)", () => {
    const directApproval = EscrowStateMachine.transition("LOCKED", "APPROVED");
    expect(directApproval.success).toBe(false);
    expect(directApproval.error).toContain("Illegal state transition");

    const directSubmit = EscrowStateMachine.transition("LOCKED", "SUBMITTED");
    expect(directSubmit.success).toBe(false);
  });

  it("enforces sequential execution (Milestone 2 cannot start if Milestone 1 is still LOCKED)", () => {
    const milestones = [
      { sequenceIndex: 1, status: "LOCKED" as MilestoneState },
      { sequenceIndex: 2, status: "LOCKED" as MilestoneState },
    ];
    const check = EscrowStateMachine.validateSequentialExecution(2, milestones);
    expect(check.eligible).toBe(false);
    expect(check.reason).toContain("Milestone #1 is currently in 'LOCKED' state");
  });

  it("evaluates 7-day watchdog expiration correctly", () => {
    const recentDate = new Date();
    const evalRecent = WatchdogScheduler.evaluateTimeout(recentDate);
    expect(evalRecent.hasExpired).toBe(false);

    const expiredDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
    const evalExpired = WatchdogScheduler.evaluateTimeout(expiredDate);
    expect(evalExpired.hasExpired).toBe(true);
  });
});

describe("ENGINE 02 (DSA & SE): Verification & Merkle Evidence Tree", () => {
  it("generates deterministic SHA-256 digests", () => {
    const hash1 = CryptographicHasher.sha256("test_payload");
    const hash2 = CryptographicHasher.sha256("test_payload");
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("builds Merkle tree and detects single-bit tampering", () => {
    const artifacts = [
      { id: "1", name: "Spec", type: "SPEC", hash: CryptographicHasher.sha256("spec_content") },
      { id: "2", name: "Code", type: "CODE", hash: CryptographicHasher.sha256("code_commit_a") },
    ];

    const tree = new MerkleEvidenceTree(artifacts);
    const root = tree.getRootHash();
    expect(root).toHaveLength(64);

    // Verify valid tree
    const checkValid = MerkleEvidenceTree.verifyIntegrity(artifacts, root);
    expect(checkValid.isValid).toBe(true);

    // Simulate single-character tampering in artifact 2
    const tampered = [
      { id: "1", name: "Spec", type: "SPEC", hash: CryptographicHasher.sha256("spec_content") },
      { id: "2", name: "Code", type: "CODE", hash: CryptographicHasher.sha256("code_commit_TAMPERED") },
    ];

    const checkTampered = MerkleEvidenceTree.verifyIntegrity(tampered, root);
    expect(checkTampered.isValid).toBe(false);
  });

  it("calculates Jaccard skill overlap & heuristic match score correctly", () => {
    const candidate = {
      freelancerSkills: ["TypeScript", "Next.js", "PostgreSQL"],
      bidAmount: 2000,
      reputationScore: 5.0,
    };
    const requirement = {
      requiredSkills: ["TypeScript", "Next.js", "PostgreSQL"],
      targetBudget: 2000,
    };

    const match = ProposalMatcher.computeMatchScore(candidate, requirement);
    expect(match.jaccardSimilarity).toBe(100);
    expect(match.overallScore).toBe(100);
  });
});

describe("ENGINE 04 (Web & Security): Least-Privilege RBAC Matrix", () => {
  it("enforces strict role boundaries", () => {
    // Client can fund escrow, but cannot rule disputes
    expect(RBACGuard.hasPermission(Role.CLIENT, "FUND_ESCROW")).toBe(true);
    expect(RBACGuard.hasPermission(Role.CLIENT, "RULE_DISPUTE")).toBe(false);

    // Freelancer can submit proposal, but cannot fund escrow
    expect(RBACGuard.hasPermission(Role.FREELANCER, "SUBMIT_PROPOSAL")).toBe(true);
    expect(RBACGuard.hasPermission(Role.FREELANCER, "FUND_ESCROW")).toBe(false);

    // Arbiter can rule disputes, but cannot post jobs
    expect(RBACGuard.hasPermission(Role.ARBITER, "RULE_DISPUTE")).toBe(true);
    expect(RBACGuard.hasPermission(Role.ARBITER, "POST_JOB")).toBe(false);

    // Admin has superuser privileges
    expect(RBACGuard.hasPermission(Role.ADMIN, "MANAGE_SYSTEM")).toBe(true);
  });
});
