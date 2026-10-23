"use client";

import React, { useEffect, useState } from "react";
import {
  Scale,
  GitBranch,
  ShieldCheck,
  CheckCircle,
  Plus,
  Sliders,
  FileCheck,
  AlertOctagon,
  Sparkles,
} from "lucide-react";

interface EvidenceNode {
  id: string;
  artifactName: string;
  artifactType: string;
  payloadHash: string;
  merkleIndex: number;
}

interface Dispute {
  id: string;
  reason: string;
  status: string;
  evidenceRootHash: string;
  clientClaimRatio: number;
  freelancerClaimRatio: number;
  rulingRatioClient?: number;
  rulingRatioFreelancer?: number;
  rulingSummary?: string;
  contract: { title: string; client: { name: string }; freelancer: { name: string } };
  milestone: { id: string; title: string; amount: number };
  evidenceNodes: EvidenceNode[];
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);

  // Evidence upload modal
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [artifactName, setArtifactName] = useState("");
  const [artifactType, setArtifactType] = useState("CODE");
  const [artifactContent, setArtifactContent] = useState("");

  // Ruling slider state (0.0 to 1.0 client ratio)
  const [clientRatio, setClientRatio] = useState(0.5);
  const [rulingSummary, setRulingSummary] = useState("");
  const [rulingLoading, setRulingLoading] = useState(false);

  const fetchDisputes = async () => {
    try {
      const res = await fetch("/api/disputes");
      const data = await res.json();
      if (data.disputes) {
        setDisputes(data.disputes);
        if (!selectedDispute && data.disputes.length > 0) {
          setSelectedDispute(data.disputes[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    try {
      const res = await fetch(`/api/disputes/${selectedDispute.id}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artifactName,
          artifactType,
          artifactContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowEvidenceModal(false);
        setArtifactName("");
        setArtifactContent("");
        fetchDisputes();
      } else {
        alert(data.error || "Failed to upload evidence");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecuteRuling = async () => {
    if (!selectedDispute) return;
    setRulingLoading(true);

    try {
      const res = await fetch(`/api/disputes/${selectedDispute.id}/ruling`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rulingRatioClient: clientRatio,
          rulingSummary,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchDisputes();
      } else {
        alert(data.error || "Failed to execute ruling");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRulingLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Scale className="w-6 h-6 text-amber-400" />
          Evidence-Based Dispute Resolution & Merkle Trees
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Engine 02 Merkle Hash Tree aggregation with Engine 03 double-entry split rulings (FR-04, FR-09).
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading dispute cases...</div>
      ) : disputes.length === 0 ? (
        <div className="glass-panel p-8 text-center rounded-2xl text-slate-400 text-sm">
          No contested disputes found. Milestone contracts are currently progressing smoothly without conflict.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dispute Case Selector */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Contested Dispute Cases
            </h2>

            <div className="space-y-2">
              {disputes.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedDispute(d)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedDispute?.id === d.id
                      ? "bg-amber-500/10 border-amber-500/40 text-white"
                      : "glass-panel hover:border-slate-600 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-white">{d.contract.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                      {d.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{d.reason}</p>
                  <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Disputed: ${d.milestone.amount}</span>
                    <span>{d.evidenceNodes.length} Merkle Artifacts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dispute Details & Merkle Tree Inspector */}
          {selectedDispute && (
            <div className="lg:col-span-2 space-y-6">
              {/* Active Case Banner */}
              <div className="glass-panel p-6 rounded-2xl border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Dispute for {selectedDispute.milestone.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Client: <strong className="text-slate-200">{selectedDispute.contract.client.name}</strong> • Freelancer: <strong className="text-slate-200">{selectedDispute.contract.freelancer.name}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Contested Escrow Hold</span>
                    <span className="text-xl font-bold text-amber-400 font-mono">
                      ${selectedDispute.milestone.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                  <span className="text-slate-400 font-semibold block mb-0.5">Dispute Reason / Claim:</span>
                  {selectedDispute.reason}
                </div>

                {/* Merkle Root Visual Fingerprint */}
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4 text-cyan-400" />
                      Cryptographic Merkle Root Fingerprint
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> TAMPER-SEALED
                    </span>
                  </div>
                  <p className="text-xs font-mono text-cyan-300 break-all bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                    {selectedDispute.evidenceRootHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
                  </p>
                </div>

                {/* Evidence Artifacts (Leaves) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Merkle Evidence Leaves ({selectedDispute.evidenceNodes.length} Verified Artifacts)
                    </h3>
                    <button
                      onClick={() => setShowEvidenceModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 font-semibold text-xs transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Evidence Node
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedDispute.evidenceNodes.map((node) => (
                      <div
                        key={node.id}
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200">{node.artifactName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {node.artifactType}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 truncate">
                          Leaf #{node.merkleIndex}: {node.payloadHash}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Arbiter Split Ruling Controls */}
                {selectedDispute.status !== "RESOLVED" ? (
                  <div className="pt-4 border-t border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-4 h-4" /> Arbiter Split Settlement Ruling
                      </h3>
                      <span className="text-xs font-mono text-slate-400">
                        Client: {Math.round(clientRatio * 100)}% | Freelancer: {Math.round((1 - clientRatio) * 100)}%
                      </span>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={clientRatio}
                        onChange={(e) => setClientRatio(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                        <span>100% Freelancer Payout ($0 / ${selectedDispute.milestone.amount})</span>
                        <span>50/50 Split</span>
                        <span>100% Client Refund (${selectedDispute.milestone.amount} / $0)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <span className="text-[11px] text-indigo-300 block">Client Refund</span>
                        <span className="text-lg font-bold text-white font-mono">
                          ${Math.round(selectedDispute.milestone.amount * clientRatio)}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[11px] text-emerald-300 block">Freelancer Payout</span>
                        <span className="text-lg font-bold text-white font-mono">
                          ${Math.round(selectedDispute.milestone.amount * (1 - clientRatio))}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleExecuteRuling}
                      disabled={rulingLoading}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
                    >
                      <Scale className="w-4 h-4" />
                      Execute Binding Double-Entry Split Settlement
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Dispute Officially Settled & Recorded
                    </p>
                    <p className="text-slate-300">{selectedDispute.rulingSummary}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border space-y-4">
            <h2 className="text-lg font-bold text-white">Append Merkle Evidence Leaf</h2>
            <form onSubmit={handleUploadEvidence} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Artifact Name</label>
                <input
                  type="text"
                  required
                  value={artifactName}
                  onChange={(e) => setArtifactName(e.target.value)}
                  placeholder="e.g. Test Coverage Report or Chat Transcript"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Artifact Type</label>
                <select
                  value={artifactType}
                  onChange={(e) => setArtifactType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="CODE">CODE (Source Checksum)</option>
                  <option value="SPEC">SPEC (Signed Requirement)</option>
                  <option value="CHAT">CHAT (Communication Audit)</option>
                  <option value="COMMIT">COMMIT (Git Digest)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Raw Payload / Content</label>
                <textarea
                  required
                  rows={3}
                  value={artifactContent}
                  onChange={(e) => setArtifactContent(e.target.value)}
                  placeholder="Paste artifact contents or commit verification payload..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEvidenceModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Recompute Merkle Root
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
