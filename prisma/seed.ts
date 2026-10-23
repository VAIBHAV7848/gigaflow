/**
 * GigaFlow Seed Script
 * Pre-populates the database with evaluation accounts, contracts, milestones, and ledger accounts.
 */

import { PrismaClient, Role, JobStatus, ProposalStatus, ContractStatus, MilestoneStatus, DisputeStatus, AccountType } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function main() {
  console.log("🌱 Starting GigaFlow database seeding on Supabase...");

  // Clean existing data for clean re-seed
  await prisma.auditLog.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.ledgerTransaction.deleteMany();
  await prisma.ledgerAccount.deleteMany();
  await prisma.evidenceNode.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.job.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash("Password123!", 10);

  // 1. Create Core Personas
  console.log("👤 Creating 4 Evaluation Personas...");
  const clientUser = await prisma.user.create({
    data: {
      email: "alice.client@gigaflow.dev",
      name: "Alice Montgomery (Client)",
      role: Role.CLIENT,
      passwordHash: defaultPassword,
      profile: {
        create: {
          headline: "Product Lead at NextGen Ventures",
          bio: "Commissioning elite developers for audited cryptographic applications.",
          walletBalance: 25000.0,
          reputationScore: 4.9,
          skills: ["Project Management", "FinTech", "System Design"],
        },
      },
    },
  });

  const freelancerUser = await prisma.user.create({
    data: {
      email: "bob.developer@gigaflow.dev",
      name: "Bob Jenkins (Senior Freelancer)",
      role: Role.FREELANCER,
      passwordHash: defaultPassword,
      profile: {
        create: {
          headline: "Senior Full-Stack & Cryptography Engineer",
          bio: "Specializing in Next.js 15, PostgreSQL double-entry ledgers, and Merkle tree systems.",
          walletBalance: 3200.0,
          reputationScore: 5.0,
          hourlyRate: 85.0,
          completedJobsCount: 14,
          skills: ["Next.js", "TypeScript", "PostgreSQL", "Prisma", "Cryptography", "Tailwind CSS"],
        },
      },
    },
  });

  const arbiterUser = await prisma.user.create({
    data: {
      email: "carol.arbiter@gigaflow.dev",
      name: "Carol Vance (Independent Arbiter)",
      role: Role.ARBITER,
      passwordHash: defaultPassword,
      profile: {
        create: {
          headline: "Certified Technical Arbitrator & Dispute Inspector",
          bio: "Analyzing cryptographic proof trails and issuing mathematically binding rulings.",
          walletBalance: 1000.0,
          reputationScore: 5.0,
          skills: ["Arbitration", "Smart Contracts", "Audit Verification"],
        },
      },
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: "dave.admin@gigaflow.dev",
      name: "Dave Chen (System Admin)",
      role: Role.ADMIN,
      passwordHash: defaultPassword,
      profile: {
        create: {
          headline: "Platform Infrastructure Overseer",
          bio: "Supervising 4-engine telemetry and double-entry ledger balance conservation.",
          walletBalance: 50000.0,
          reputationScore: 5.0,
          skills: ["DevOps", "Database Administration", "Security Auditing"],
        },
      },
    },
  });

  // 2. Initialize Seeded Jobs
  console.log("💼 Creating Sample Jobs & Proposals...");
  const job1 = await prisma.job.create({
    data: {
      clientId: clientUser.id,
      title: "Full-Stack Escrow & Evidence-Based Dispute Platform",
      description: "Build a production-grade freelance marketplace featuring double-entry accounting ledgers and Merkle tree dispute verification.",
      category: "Full-Stack Development",
      budget: 4500.0,
      currency: "USD",
      status: JobStatus.IN_PROGRESS,
      requiredSkills: ["Next.js", "TypeScript", "PostgreSQL", "Prisma", "Tailwind CSS"],
    },
  });

  const job2 = await prisma.job.create({
    data: {
      clientId: clientUser.id,
      title: "High-Throughput Financial Ledger API with PostgreSQL",
      description: "Design an ACID-compliant microservice implementing Martin Fowler double-entry accounting patterns.",
      category: "Backend & Systems",
      budget: 3000.0,
      currency: "USD",
      status: JobStatus.OPEN,
      requiredSkills: ["PostgreSQL", "TypeScript", "Prisma", "Docker"],
    },
  });

  // 3. Create Proposal
  const proposal1 = await prisma.proposal.create({
    data: {
      jobId: job1.id,
      freelancerId: freelancerUser.id,
      bidAmount: 4200.0,
      deliveryDays: 14,
      coverLetter: "I specialize in double-entry financial architectures, streaming SHA-256 deliverable checksumming, and Merkle tree evidence structures. Ready to start immediately.",
      heuristicScore: 94.2, // Matcher result: High skill overlap & budget fit
      status: ProposalStatus.ACCEPTED,
    },
  });

  // 4. Create Active Contract with 3 Sequential Milestones
  console.log("📜 Initializing Active Contract & Sequential Milestones...");
  const contract1 = await prisma.contract.create({
    data: {
      jobId: job1.id,
      clientId: clientUser.id,
      freelancerId: freelancerUser.id,
      title: "Escrow & Dispute Platform Contract",
      totalAmount: 4200.0,
      status: ContractStatus.ACTIVE,
    },
  });

  // Milestone 1: Approved & Released
  const milestone1 = await prisma.milestone.create({
    data: {
      contractId: contract1.id,
      sequenceIndex: 1,
      title: "Architecture Design & Core Engines Scaffold",
      description: "Decompose system into 4 academic engines, implement FSM state scheduler and double-entry ledger models.",
      amount: 1400.0,
      status: MilestoneStatus.APPROVED,
      deliverableUrl: "https://github.com/VAIBHAV7848/gigaflow/releases/tag/v0.1.0",
      deliverableHash: sha256("milestone_1_scaffold_payload_verified"),
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  // Milestone 2: Submitted & Pending Review (With Active Watchdog Timer)
  const milestone2SubmissionDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const milestone2Deadline = new Date(milestone2SubmissionDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  const milestone2 = await prisma.milestone.create({
    data: {
      contractId: contract1.id,
      sequenceIndex: 2,
      title: "Cryptographic Evidence Tree & SHA-256 Hasher",
      description: "Implement hierarchical Merkle tree structure, streaming file checksumming, and arbiter view.",
      amount: 1400.0,
      status: MilestoneStatus.SUBMITTED,
      deliverableUrl: "https://github.com/VAIBHAV7848/gigaflow/releases/tag/v0.2.0",
      deliverableHash: sha256("milestone_2_merkle_tree_code_payload"),
      submittedAt: milestone2SubmissionDate,
      reviewDeadline: milestone2Deadline,
    },
  });

  // Milestone 3: Funded in Escrow (Locked)
  const milestone3 = await prisma.milestone.create({
    data: {
      contractId: contract1.id,
      sequenceIndex: 3,
      title: "Frontend Portals, Integration & Review Verification",
      description: "Deliver high-polish UI dashboards for Client, Freelancer, and Arbiter with full test suite.",
      amount: 1400.0,
      status: MilestoneStatus.FUNDED,
    },
  });

  // 5. Initialize Ledger Accounts & Transactions (Double-Entry Invariants)
  console.log("🏦 Setting up Double-Entry Ledger Accounts...");
  const clientAvailable = await prisma.ledgerAccount.create({
    data: {
      accountType: AccountType.USER_AVAILABLE,
      userId: clientUser.id,
    },
  });

  const freelancerAvailable = await prisma.ledgerAccount.create({
    data: {
      accountType: AccountType.USER_AVAILABLE,
      userId: freelancerUser.id,
    },
  });

  const platformRevenue = await prisma.ledgerAccount.create({
    data: {
      accountType: AccountType.PLATFORM_REVENUE,
    },
  });

  const escrowM1 = await prisma.ledgerAccount.create({
    data: {
      accountType: AccountType.ESCROW_HOLD,
      milestoneId: milestone1.id,
      contractId: contract1.id,
    },
  });

  const escrowM2 = await prisma.ledgerAccount.create({
    data: {
      accountType: AccountType.ESCROW_HOLD,
      milestoneId: milestone2.id,
      contractId: contract1.id,
    },
  });

  const escrowM3 = await prisma.ledgerAccount.create({
    data: {
      accountType: AccountType.ESCROW_HOLD,
      milestoneId: milestone3.id,
      contractId: contract1.id,
    },
  });

  // Post Milestone 1 Release Entries:
  // Paid: $1400 total => $1260 Freelancer Net, $140 Platform Fee
  const txM1Release = await prisma.ledgerTransaction.create({
    data: {
      txType: "ESCROW_RELEASE",
      referenceId: milestone1.id,
      idempotencyKey: `SEED_M1_RELEASE_${milestone1.id}`,
      description: "Disbursed $1400 for Milestone #1: $1260 to Freelancer, $140 Platform Fee",
    },
  });

  await prisma.ledgerEntry.createMany({
    data: [
      { transactionId: txM1Release.id, accountId: escrowM1.id, entryType: "DEBIT", amount: 1400.0 },
      { transactionId: txM1Release.id, accountId: freelancerAvailable.id, entryType: "CREDIT", amount: 1260.0 },
      { transactionId: txM1Release.id, accountId: platformRevenue.id, entryType: "CREDIT", amount: 140.0 },
    ],
  });

  // Post Milestone 2 & 3 Lock Entries (Client funded $1400 each):
  const txM2Lock = await prisma.ledgerTransaction.create({
    data: {
      txType: "ESCROW_LOCK",
      referenceId: milestone2.id,
      idempotencyKey: `SEED_M2_LOCK_${milestone2.id}`,
      description: "Locked $1400 in Escrow for Milestone #2",
    },
  });
  await prisma.ledgerEntry.createMany({
    data: [
      { transactionId: txM2Lock.id, accountId: clientAvailable.id, entryType: "DEBIT", amount: 1400.0 },
      { transactionId: txM2Lock.id, accountId: escrowM2.id, entryType: "CREDIT", amount: 1400.0 },
    ],
  });

  const txM3Lock = await prisma.ledgerTransaction.create({
    data: {
      txType: "ESCROW_LOCK",
      referenceId: milestone3.id,
      idempotencyKey: `SEED_M3_LOCK_${milestone3.id}`,
      description: "Locked $1400 in Escrow for Milestone #3",
    },
  });
  await prisma.ledgerEntry.createMany({
    data: [
      { transactionId: txM3Lock.id, accountId: clientAvailable.id, entryType: "DEBIT", amount: 1400.0 },
      { transactionId: txM3Lock.id, accountId: escrowM3.id, entryType: "CREDIT", amount: 1400.0 },
    ],
  });

  // 6. Create Dispute with Merkle Evidence Tree
  console.log("⚖️ Initializing Sample Dispute with Cryptographic Merkle Evidence Tree...");
  const dispute1 = await prisma.dispute.create({
    data: {
      contractId: contract1.id,
      milestoneId: milestone2.id,
      initiatorId: clientUser.id,
      arbiterId: arbiterUser.id,
      reason: "Client requests proof of performance for test coverage and specific commit checksum before full release.",
      status: DisputeStatus.UNDER_REVIEW,
      clientClaimRatio: 0.3,
      freelancerClaimRatio: 0.7,
      evidenceRootHash: "", // Will be computed from nodes below
    },
  });

  // Create 4 cryptographic evidence artifacts (leaves)
  const node1Hash = sha256("spec_requirements_v1_signed");
  const node2Hash = sha256("milestone2_git_commit_sha_8f9e12a");
  const node3Hash = sha256("test_suite_coverage_report_98_percent");
  const node4Hash = sha256("client_freelancer_chat_transcript_audit");

  await prisma.evidenceNode.createMany({
    data: [
      { disputeId: dispute1.id, uploaderId: clientUser.id, artifactName: "Specification Requirements Doc", artifactType: "SPEC", payloadHash: node1Hash, merkleIndex: 0 },
      { disputeId: dispute1.id, uploaderId: freelancerUser.id, artifactName: "Git Deliverable Commit Digest", artifactType: "COMMIT", payloadHash: node2Hash, merkleIndex: 1 },
      { disputeId: dispute1.id, uploaderId: freelancerUser.id, artifactName: "Vitest Coverage Report (98%)", artifactType: "CODE", payloadHash: node3Hash, merkleIndex: 2 },
      { disputeId: dispute1.id, uploaderId: clientUser.id, artifactName: "Communication Log Transcript", artifactType: "CHAT", payloadHash: node4Hash, merkleIndex: 3 },
    ],
  });

  // Compute Root Hash: H(H(node1, node2), H(node3, node4))
  const parent1 = sha256(node1Hash + node2Hash);
  const parent2 = sha256(node3Hash + node4Hash);
  const rootHash = sha256(parent1 + parent2);

  await prisma.dispute.update({
    where: { id: dispute1.id },
    data: { evidenceRootHash: rootHash },
  });

  // 7. Seed Initial Cryptographically Chained Audit Trail
  console.log("🔗 Writing Genesis Chained Audit Trail...");
  let prevHash = "0000000000000000000000000000000000000000000000000000000000000000";
  const events = [
    { actor: clientUser.id, role: "CLIENT", action: "JOB_POSTED", res: "Job", id: job1.id, note: "Alice posted Job #1" },
    { actor: freelancerUser.id, role: "FREELANCER", action: "PROPOSAL_SUBMITTED", res: "Proposal", id: proposal1.id, note: "Bob submitted Proposal (Score 94.2%)" },
    { actor: clientUser.id, role: "CLIENT", action: "CONTRACT_AWARDED", res: "Contract", id: contract1.id, note: "Contract awarded to Bob" },
    { actor: clientUser.id, role: "CLIENT", action: "ESCROW_LOCKED", res: "Milestone", id: milestone1.id, note: "Milestone #1 $1400 funded" },
    { actor: freelancerUser.id, role: "FREELANCER", action: "DELIVERABLE_SUBMITTED", res: "Milestone", id: milestone1.id, note: "Deliverable SHA-256 uploaded" },
    { actor: clientUser.id, role: "CLIENT", action: "MILESTONE_APPROVED", res: "Milestone", id: milestone1.id, note: "Milestone #1 approved; $1400 disbursed" },
    { actor: clientUser.id, role: "CLIENT", action: "DISPUTE_OPENED", res: "Dispute", id: dispute1.id, note: "Dispute raised for Milestone #2" },
  ];

  for (const ev of events) {
    const raw = `${prevHash}|${ev.actor}|${ev.action}|${ev.res}:${ev.id}|${JSON.stringify({ note: ev.note })}|${new Date().toISOString()}`;
    const currHash = sha256(raw);
    await prisma.auditLog.create({
      data: {
        actorId: ev.actor,
        actorRole: ev.role,
        action: ev.action,
        resourceType: ev.res,
        resourceId: ev.id,
        payloadJson: JSON.stringify({ note: ev.note }),
        previousHash: prevHash,
        currentHash: currHash,
      },
    });
    prevHash = currHash;
  }

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
