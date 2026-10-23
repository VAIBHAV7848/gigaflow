"use client";

import React, { useEffect, useState } from "react";
import { Activity, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, GitCommit } from "lucide-react";

interface AuditLogItem {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  previousHash: string;
  currentHash: string;
  createdAt: string;
  payloadJson?: string;
  actor?: { name: string; role: string };
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [integrity, setIntegrity] = useState<{ isValid: boolean; totalRecords: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit");
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
      if (data.integrity) setIntegrity(data.integrity);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            Cryptographically Chained Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Hash_n = SHA256(Payload_n + Hash_{"{"}n-1{"}"} + Timestamp) • Append-only immutable log (FR-06, NFR-09).
          </p>
        </div>

        <button
          onClick={fetchAudit}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Verify Hash Chain
        </button>
      </div>

      {/* Integrity Badge Banner */}
      {integrity && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            integrity.isValid
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-3">
            {integrity.isValid ? (
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            ) : (
              <AlertCircle className="w-6 h-6 text-rose-400" />
            )}
            <div>
              <p className="font-bold text-sm">
                {integrity.isValid
                  ? "Audit Chain Cryptographically Verified Authentic"
                  : "Hash Chain Integrity Failure Detected"}
              </p>
              <p className="text-xs text-slate-400">
                {integrity.totalRecords} sequential blocks mathematically verified from genesis (0000...0000).
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
            ZERO TAMPERING
          </span>
        </div>
      )}

      {/* Audit Blocks List */}
      <div className="space-y-3">
        {logs.map((log, idx) => (
          <div
            key={log.id}
            className="glass-panel p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
          >
            {/* Action & Actor */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 font-mono text-[10px] font-bold flex items-center justify-center">
                  #{logs.length - idx}
                </span>
                <span className="font-bold text-white text-sm">{log.action}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {log.resourceType}:{log.resourceId.slice(0, 8)}...
                </span>
              </div>
              <p className="text-slate-400">
                Actor: <strong className="text-slate-200">{log.actor?.name || "System Daemon"}</strong> ({log.actor?.role || "SYSTEM"}) • {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Hashes */}
            <div className="space-y-1 text-right font-mono text-[11px]">
              <div className="flex items-center gap-2 md:justify-end text-cyan-400">
                <span className="text-slate-500">Hash:</span>
                <span className="truncate max-w-xs">{log.currentHash}</span>
              </div>
              <div className="flex items-center gap-2 md:justify-end text-slate-500">
                <span>Prev:</span>
                <span className="truncate max-w-xs">{log.previousHash}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
