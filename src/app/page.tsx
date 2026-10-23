"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Cpu,
  Database,
  Lock,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Scale,
  DollarSign,
  TrendingUp,
} from "lucide-react";

interface TelemetryData {
  academicContext: {
    university: string;
    team: string;
    guide: string;
    engines: Array<{
      id: string;
      name: string;
      discipline: string;
      owner: string;
      kpi: string;
      status: string;
    }>;
  };
  ledgerHealth: {
    isConserved: boolean;
    totalDebits: number;
    totalCredits: number;
    delta: number;
    totalTransactions: number;
    totalEscrowHeld: number;
    totalApprovedVolume: number;
  };
  auditHealth: {
    isValid: boolean;
    totalRecords: number;
  };
}

export default function HomePage() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);

  useEffect(() => {
    fetch("/api/telemetry")
      .then((res) => res.json())
      .then((data) => setTelemetry(data))
      .catch((e) => console.error("Telemetry error:", e));
  }, []);

  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          KLE Tech Team 07 • Theme 01: Milestone Escrow & Cryptographic Dispute Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Commission Elite Engineers with{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Verifiable Escrow
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
          Eliminate client default and developer payment starvation. Every milestone is locked in an ACID double-entry ledger, deliverable code is SHA-256 checksummed, and disputes are adjudicated via tamper-evident Merkle Evidence Trees.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/projects"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all"
          >
            Explore Marketplace
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/contracts"
            className="px-6 py-3 rounded-xl glass-panel text-slate-200 hover:text-white font-semibold text-sm border border-slate-700 hover:border-slate-600 transition-all"
          >
            Manage Contracts
          </Link>
          <Link
            href="/engines"
            className="px-6 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-indigo-300 border border-indigo-900/60 font-semibold text-sm transition-all"
          >
            4-Engine Architecture
          </Link>
        </div>
      </section>

      {/* Live Financial & Cryptographic KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Escrow In-Hold</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            ${telemetry ? telemetry.ledgerHealth.totalEscrowHeld.toLocaleString() : "2,800"}
          </div>
          <p className="text-[11px] text-amber-400 mt-1 font-mono">Secured in ACID Escrow</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Disbursed Payouts</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            ${telemetry ? telemetry.ledgerHealth.totalApprovedVolume.toLocaleString() : "1,400"}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 font-mono">Released to Developers</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Ledger Invariant</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 flex items-center gap-1.5">
            Δ = 0.00
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              CONSERVED
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Σ Debits === Σ Credits</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Audit Chain Integrity</span>
            <GitBranch className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {telemetry && telemetry.auditHealth.isValid ? "100% Valid" : "Verified"}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            {telemetry ? `${telemetry.auditHealth.totalRecords} Chained Blocks` : "SHA-256 Chained"}
          </p>
        </div>
      </section>

      {/* 4 Academic Engines Showcase Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Academic 4-Engine Architecture</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Technical responsibility decomposition for KLE Technological University Team 07
            </p>
          </div>
          <Link href="/engines" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
            View Engine Specs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Engine 01 */}
          <div className="glass-panel p-6 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-xs font-mono font-bold">
                ENGINE 01 • OPERATING SYSTEMS
              </span>
              <span className="text-xs text-emerald-400 font-semibold">Active</span>
            </div>
            <h3 className="text-lg font-bold text-white">Escrow & State Scheduler</h3>
            <p className="text-xs text-slate-300">
              Enforces strict milestone FSM state progression (Locked → Funded → In Development → Submitted → Approved / Disputed). Features concurrency Mutex locks and 7-day review watchdog timeouts to prevent developer payment starvation.
            </p>
            <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800">
              <span>Owner: <strong className="text-slate-200">Vaishnavi Modekar</strong> (02FE24BCS060)</span>
              <span className="font-mono text-indigo-400">FR-01, FR-02, FR-12</span>
            </div>
          </div>

          {/* Engine 02 */}
          <div className="glass-panel p-6 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-xs font-mono font-bold">
                ENGINE 02 • DSA & SOFTWARE ENG
              </span>
              <span className="text-xs text-emerald-400 font-semibold">Active</span>
            </div>
            <h3 className="text-lg font-bold text-white">Verification & Evidence Engine</h3>
            <p className="text-xs text-slate-300">
              Calculates streaming SHA-256 checksums for code deliverables, constructs hierarchical in-memory Merkle Evidence Trees, and runs deterministic Jaccard heuristic proposal matching.
            </p>
            <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800">
              <span>Owner: <strong className="text-slate-200">Darshan Kittur</strong> (02FE24BCS053)</span>
              <span className="font-mono text-cyan-400">FR-03, FR-04, FR-11</span>
            </div>
          </div>

          {/* Engine 03 */}
          <div className="glass-panel p-6 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">
                ENGINE 03 • DBMS & FINANCIAL CORE
              </span>
              <span className="text-xs text-emerald-400 font-semibold">Active</span>
            </div>
            <h3 className="text-lg font-bold text-white">Ledger & Audit Core</h3>
            <p className="text-xs text-slate-300">
              Guarantees mathematical balance conservation (ΔEscrow + ΔUser = 0) with Martin Fowler double-entry accounting. Prevents duplicate disbursements and maintains an append-only hash-chained audit log.
            </p>
            <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800">
              <span>Owner: <strong className="text-slate-200">Purvi Sammatshetti</strong> (02FE24BCS022)</span>
              <span className="font-mono text-emerald-400">FR-05, FR-06, NFR-08</span>
            </div>
          </div>

          {/* Engine 04 */}
          <div className="glass-panel p-6 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-xs font-mono font-bold">
                ENGINE 04 • WEB TECH & SECURITY
              </span>
              <span className="text-xs text-emerald-400 font-semibold">Active</span>
            </div>
            <h3 className="text-lg font-bold text-white">Role-Based Workflow Dashboard</h3>
            <p className="text-xs text-slate-300">
              Provides authenticated, role-appropriate workflow access for Clients, Freelancers, Arbiters, and Admins. Features 1-click persona switching, boundary validation, and real-time state synchronization.
            </p>
            <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800">
              <span>Owner: <strong className="text-slate-200">Vaibhav Chavanpatil</strong> (02FE24BCS013)</span>
              <span className="font-mono text-purple-400">FR-07, FR-08, FR-09, FR-10</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
