# GigaFlow — Milestone-Based Escrow & Evidence-Based Dispute Resolution Marketplace

> **Academic Context**: KLE Technological University (Dr. M. S. Sheshgiri College of Engineering & Technology, Belagavi)  
> **Department**: Department of Computer Science & Engineering  
> **Team**: Team 07 (Theme 01)  
> **Guide**: Dr. Niranjan Muchandi  
> **Repository**: [VAIBHAV7848/gigaflow](https://github.com/VAIBHAV7848/gigaflow)

---

## 🌟 Architectural Overview

GigaFlow solves the two symmetrical failure modes of freelance marketplaces:
1. **Client Default**: Freelancers complete work without guaranteed payment.
2. **Deliverable Non-Performance**: Clients pay upfront with no verifiable proof of code quality or deliverable authenticity.

This platform resolves these trust issues through **Milestone-Based Escrow**, **Double-Entry Financial Accounting**, and **Cryptographic Merkle Evidence Arbitration**.

---

## 🏛️ The 4 Academic Engines & Student Ownership

```
+--------------------------------------------------------------------------------------------------+
| GIGAFLOW ARCHITECTURAL CORE                                                                      |
+--------------------------------------------------------------------------------------------------+
| Engine 01 (OS): Escrow & State Scheduler (Vaishnavi Modekar - 02FE24BCS060)                      |
|  • Milestone FSM Lifecycle (LOCKED -> FUNDED -> IN_DEVELOPMENT -> SUBMITTED -> APPROVED)       |
|  • Concurrency Keyed Mutex locks & 7-Day Review Watchdog Scheduler (FR-01, FR-02, FR-12)         |
+--------------------------------------------------------------------------------------------------+
| Engine 02 (DSA & SE): Verification & Evidence Engine (Darshan Kittur - 02FE24BCS053)             |
|  • Streaming SHA-256 Deliverable Checksumming & Hierarchical Merkle Trees (FR-03, FR-04)         |
|  • Deterministic Heuristic Proposal Matcher (Jaccard Overlap + Budget Alignment, FR-11)          |
+--------------------------------------------------------------------------------------------------+
| Engine 03 (DBMS): Ledger & Audit Core (Purvi Sammatshetti - 02FE24BCS022)                        |
|  • Martin Fowler Double-Entry ACID Ledger with Balance Conservation: ΔEscrow + ΔUser = 0         |
|  • Duplicate-Release Prevention & Append-Only Hash-Chained Audit Trail (FR-05, FR-06, NFR-08)    |
+--------------------------------------------------------------------------------------------------+
| Engine 04 (Web & Security): Role-Based Workflow Dashboard (Vaibhav Chavanpatil - 02FE24BCS013)   |
|  • Next.js 15 App Router & Tailwind CSS Glassmorphism Portals (Client, Freelancer, Arbiter)      |
|  • Least-Privilege RBAC Matrix & 1-Click Evaluation Persona Switcher (FR-07, FR-08, FR-10)       |
+--------------------------------------------------------------------------------------------------+
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js 20+
- PostgreSQL or Supabase Database

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Configure `.env` with your PostgreSQL / Supabase connection strings:
```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
JWT_SECRET="gigaflow-escrow-secret-key-kle-tech-team-07-2026"
```

### 4. Push Database Schema & Seed Data
```bash
npm run prisma:push
npm run prisma:seed
```

### 5. Run Verification Tests
```bash
npm test
```

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🛡️ Evaluation Personas (1-Click Switcher)

Evaluators can switch between personas in 1 click from the top-right navbar dropdown:
- **Alice Montgomery (Client)**: `alice.client@gigaflow.dev` — Posts jobs, funds milestone escrow holds, and approves deliverables.
- **Bob Jenkins (Freelancer)**: `bob.developer@gigaflow.dev` — Submits proposals, uploads deliverables with streaming SHA-256 digests.
- **Carol Vance (Arbiter)**: `carol.arbiter@gigaflow.dev` — Analyzes Merkle Evidence Trees and executes binding split rulings.
- **Dave Chen (Admin)**: `dave.admin@gigaflow.dev` — Oversees 4-engine telemetry and verifies hash chain integrity.

---

## 📜 Academic Rubric Compliance

- **Problem Definition & Context (PI 6.1.1)**: Double-sided freelance escrow trust failure addressed mathematically.
- **AS-IS Workflow & Scope (PI 2.1.2)**: 4 independent CS engines with strict interface boundaries.
- **Feasibility & Foundational Relevance (PI 2.1.2)**: Verified on PostgreSQL 17 via Supabase cloud infrastructure.
- **Evidence Authenticity (PI 2.1.1)**: Streaming SHA-256 hashing and Merkle tree inclusion proofs.
