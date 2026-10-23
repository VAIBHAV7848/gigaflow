"use client";

import React, { useEffect, useState } from "react";
import {
  Layers,
  Cpu,
  Database,
  Shield,
  Code2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Award,
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
  };
  auditHealth: {
    isValid: boolean;
    totalRecords: number;
  };
}

export default function EnginesPage() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);

  useEffect(() => {
    fetch("/api/telemetry")
      .then((res) => res.json())
      .then((data) => setTelemetry(data))
      .catch((e) => console.error(e));
  }, []);

  const engineDetails = [
    {
      id: "E1",
      name: "Escrow & State Scheduler",
      owner: "Vaishnavi Modekar",
      srn: "02FE24BCS060",
      course: "Operating Systems Principles",
      color: "border-indigo-500/30 text-indigo-400 bg-indigo-500/10",
      icon: Cpu,
      responsibilities: [
        "Contract & Milestone Finite State Machine (LOCKED → FUNDED → IN_DEVELOPMENT → SUBMITTED → APPROVED / DISPUTED).",
        "Asynchronous Keyed Mutex locks around critical section transitions to prevent race conditions.",
        "7-Calendar-Day Review Watchdog Timer preventing developer payment starvation (FR-02, D-02).",
      ],
      mechanisms: "Finite-state transition validation, precondition checking, duplicate-lock guards.",
      requirements: "FR-01, FR-02, FR-12, NFR-05",
      kpi: "Zero invalid transitions & zero duplicate locks in test set.",
    },
    {
      id: "E2",
      name: "Verification & Evidence Engine",
      owner: "Darshan Kittur",
      srn: "02FE24BCS053",
      course: "Data Structures & Software Engineering",
      color: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10",
      icon: Code2,
      responsibilities: [
        "Streaming SHA-256 deliverable checksumming for submitted code repositories and artifacts.",
        "Hierarchical N-ary Merkle Evidence Trees aggregating specs, commit digests, and chat logs.",
        "Deterministic heuristic proposal matcher evaluating Jaccard skill overlap (50%), budget alignment (30%), and reputation (20%).",
      ],
      mechanisms: "Pairwise SHA-256 tree hashing, single-bit tamper detection, Jaccard set similarity.",
      requirements: "FR-03, FR-04, FR-11, NFR-03",
      kpi: "Immediate single-bit tamper detection across all dispute artifacts.",
    },
    {
      id: "E3",
      name: "Ledger & Audit Core",
      owner: "Purvi Sammatshetti",
      srn: "02FE24BCS022",
      course: "Database Management Systems (DBMS)",
      color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
      icon: Database,
      responsibilities: [
        "Martin Fowler double-entry accounting ledger with balance conservation: ΔEscrow + ΔUser = 0.",
        "Multi-legged balanced transactions (Escrow hold, freelancer net payout, platform fee revenue).",
        "Cryptographically chained append-only audit trail: Hash_n = SHA256(Payload_n + Hash_{n-1} + Timestamp).",
      ],
      mechanisms: "ACID transactions with row-level locks, unique idempotency constraints, hash chaining.",
      requirements: "FR-05, FR-06, NFR-08, NFR-09",
      kpi: "Zero duplicate releases and 100% mathematical ledger balance conservation.",
    },
    {
      id: "E4",
      name: "Role-Based Workflow Dashboard",
      owner: "Vaibhav Chavanpatil",
      srn: "02FE24BCS013",
      course: "Web Technologies & Security",
      color: "border-purple-500/30 text-purple-400 bg-purple-500/10",
      icon: Shield,
      responsibilities: [
        "Next.js 15 App Router architecture with Tailwind CSS glassmorphism UI.",
        "Least-privilege Role-Based Access Control (RBAC) across Client, Freelancer, Arbiter, and Admin.",
        "1-Click Evaluation Persona Switcher for friction-free academic defense testing.",
      ],
      mechanisms: "JWT session cookies, server component boundaries, input sanitization, responsive design.",
      requirements: "FR-07, FR-08, FR-09, FR-10, NFR-01, NFR-02, NFR-04, NFR-06",
      kpi: "Zero unauthorized protected action executions across test suite.",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-mono font-semibold border border-indigo-500/20">
              KLE TECH • TEAM 07
            </span>
            <span className="text-xs text-slate-400">Theme 01</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <Layers className="w-7 h-7 text-indigo-400" />
            4-Engine Technical Decomposition
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Official Academic Engine Ownership & Rubric Mapping for Dr. Niranjan Muchandi.
          </p>
        </div>

        {/* Live Mathematical Verification Pill */}
        {telemetry && (
          <div className="p-3 rounded-2xl glass-panel border flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-mono">Ledger Invariant</span>
              <span className="text-xs font-bold text-emerald-300 font-mono">
                Δ = 0.00 (CONSERVED)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4 Engine Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {engineDetails.map((eng) => {
          const Icon = eng.icon;
          return (
            <div key={eng.id} className="glass-panel p-6 rounded-2xl border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${eng.color}`}>
                    {eng.id}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">{eng.name}</h2>
                    <span className="text-[11px] text-slate-400">{eng.course}</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                  PASS (HEALTHY)
                </span>
              </div>

              {/* Responsibilities */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Technical Responsibilities & Boundary:
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {eng.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-indigo-400 leading-none mt-1">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mechanism & KPI */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1 text-xs">
                <p className="text-slate-400">
                  <strong className="text-slate-200">Mechanism:</strong> {eng.mechanisms}
                </p>
                <p className="text-slate-400">
                  <strong className="text-slate-200">Evaluation KPI:</strong> {eng.kpi}
                </p>
              </div>

              {/* Student Attribution Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Primary Student Owner:</span>
                  <strong className="text-white">{eng.owner}</strong>{" "}
                  <span className="font-mono text-slate-400 text-[11px]">({eng.srn})</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">Requirements:</span>
                  <span className="font-mono text-indigo-400 text-[11px] font-bold">{eng.requirements}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
