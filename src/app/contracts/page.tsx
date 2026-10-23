"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  Upload,
  Clock,
  ExternalLink,
  MessageSquare,
  Send,
  Star,
  RotateCcw,
  Scale,
} from "lucide-react";

interface Milestone {
  id: string;
  sequenceIndex: number;
  title: string;
  description: string;
  amount: number;
  status: "LOCKED" | "FUNDED" | "IN_DEVELOPMENT" | "SUBMITTED" | "APPROVED" | "DISPUTED" | "REFUNDED";
  deliverableUrl?: string;
  deliverableHash?: string;
  revisionNotes?: string;
  reviewDeadline?: string;
}

interface Contract {
  id: string;
  title: string;
  totalAmount: number;
  status: string;
  client: { id: string; name: string; email: string };
  freelancer: { id: string; name: string; email: string };
  milestones: Milestone[];
}

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: { name: string; role: string };
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Deliverable submit modal
  const [submitMilestone, setSubmitMilestone] = useState<{ contractId: string; milestone: Milestone } | null>(null);
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [commitSha, setCommitSha] = useState("8f9e12a");

  // In-Contract Chat Drawer
  const [chatContract, setChatContract] = useState<Contract | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Revision Modal
  const [revisionMilestone, setRevisionMilestone] = useState<{ contractId: string; milestoneId: string } | null>(null);
  const [revisionNotes, setRevisionNotes] = useState("");

  // Review Rating Modal
  const [reviewContract, setReviewContract] = useState<Contract | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState("");

  const fetchContracts = async () => {
    try {
      const res = await fetch("/api/contracts");
      const data = await res.json();
      if (data.contracts) setContracts(data.contracts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  // Fetch messages when chatContract opens
  useEffect(() => {
    if (chatContract) {
      setMessagesLoading(true);
      fetch(`/api/contracts/${chatContract.id}/messages`)
        .then((res) => res.json())
        .then((data) => {
          if (data.messages) setMessages(data.messages);
        })
        .finally(() => setMessagesLoading(false));
    }
  }, [chatContract]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatContract || !newMessage.trim()) return;

    try {
      const res = await fetch(`/api/contracts/${chatContract.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
      }
    } catch (e) {
      console.error("Failed to send message:", e);
    }
  };

  const handleMilestoneAction = async (contractId: string, milestoneId: string, action: string, extra: object = {}) => {
    setActionLoading(`${milestoneId}-${action}`);
    try {
      const res = await fetch(`/api/contracts/${contractId}/milestones/${milestoneId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (data.success) {
        fetchContracts();
      } else {
        alert(data.error || "Action failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewContract) return;

    try {
      const res = await fetch(`/api/contracts/${reviewContract.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, feedback: reviewFeedback }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Review submitted! Recalculated Reputation: ${data.newReputation} ★`);
        setReviewContract(null);
        setReviewFeedback("");
      } else {
        alert(data.error || "Failed to submit review");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: Milestone["status"]) => {
    switch (status) {
      case "LOCKED":
        return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[11px] flex items-center gap-1"><Lock className="w-3 h-3" /> LOCKED</span>;
      case "FUNDED":
        return <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-mono text-[11px] flex items-center gap-1"><Unlock className="w-3 h-3" /> FUNDED IN ESCROW</span>;
      case "SUBMITTED":
        return <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono text-[11px] flex items-center gap-1"><Clock className="w-3 h-3" /> UNDER 7-DAY REVIEW</span>;
      case "APPROVED":
        return <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono text-[11px] flex items-center gap-1"><CheckCircle className="w-3 h-3" /> APPROVED & PAID</span>;
      case "DISPUTED":
        return <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 font-mono text-[11px] flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> IN ARBITRATION</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[11px]">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-400" />
          Milestone Sequencing & Contract Manager
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Enforces strict sequential dependencies (FR-02, FR-12) and ACID double-entry fund disbursement.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading active contracts...</div>
      ) : contracts.length === 0 ? (
        <div className="glass-panel p-8 text-center rounded-2xl text-slate-400 text-sm">
          No active contracts found. Award a proposal from the Marketplace to initialize milestone sequencing.
        </div>
      ) : (
        <div className="space-y-6">
          {contracts.map((contract) => (
            <div key={contract.id} className="glass-panel p-6 rounded-2xl border space-y-6">
              {/* Contract Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{contract.title}</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono uppercase">
                      {contract.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Client: <strong className="text-slate-200">{contract.client.name}</strong> • Freelancer: <strong className="text-slate-200">{contract.freelancer.name}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Chat button */}
                  <button
                    onClick={() => setChatContract(contract)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    Direct Messages
                  </button>

                  {/* Rate / Review button if completed */}
                  {contract.status === "COMPLETED" && (
                    <button
                      onClick={() => setReviewContract(contract)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
                    >
                      <Star className="w-3.5 h-3.5" />
                      Leave Review
                    </button>
                  )}

                  <div className="text-right pl-3 border-l border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Value</span>
                    <span className="text-lg font-extrabold text-white font-mono">
                      ${contract.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Milestones Stepper List */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Sequential Milestone Execution Steps
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {contract.milestones.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Left: Info */}
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px] font-bold flex items-center justify-center">
                            {m.sequenceIndex}
                          </span>
                          <h4 className="text-sm font-bold text-white">{m.title}</h4>
                          {getStatusBadge(m.status)}
                        </div>
                        <p className="text-xs text-slate-300">{m.description}</p>

                        {/* Deliverable SHA256 Checksum display */}
                        {m.deliverableHash && (
                          <div className="pt-1 flex items-center gap-2 text-[11px] font-mono text-slate-400">
                            <span className="text-cyan-400">SHA-256:</span>
                            <span className="truncate max-w-xs">{m.deliverableHash}</span>
                            {m.deliverableUrl && (
                              <a
                                href={m.deliverableUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-400 hover:underline flex items-center gap-0.5"
                              >
                                Artifact <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions & Amount */}
                      <div className="flex items-center gap-3 justify-between md:justify-end">
                        <div className="text-right">
                          <span className="text-sm font-bold text-white font-mono block">
                            ${m.amount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400">Milestone Budget</span>
                        </div>

                        {/* Lifecycle Buttons */}
                        <div className="flex items-center gap-1.5">
                          {m.status === "LOCKED" && (
                            <button
                              onClick={() => handleMilestoneAction(contract.id, m.id, "fund")}
                              disabled={actionLoading === `${m.id}-fund`}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-md shadow-indigo-600/20"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              Fund Escrow
                            </button>
                          )}

                          {m.status === "FUNDED" && (
                            <button
                              onClick={() => {
                                setSubmitMilestone({ contractId: contract.id, milestone: m });
                                setDeliverableUrl("https://github.com/VAIBHAV7848/gigaflow/commit/8f9e12a");
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              Submit Work
                            </button>
                          )}

                          {m.status === "SUBMITTED" && (
                            <>
                              <button
                                onClick={() => handleMilestoneAction(contract.id, m.id, "approve")}
                                disabled={actionLoading === `${m.id}-approve`}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Approve & Pay
                              </button>
                              <button
                                onClick={() => handleMilestoneAction(contract.id, m.id, "check_watchdog")}
                                title="Checks 7-day review watchdog expiration"
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs transition-colors flex items-center gap-1"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                Watchdog Check
                              </button>
                            </>
                          )}

                          {m.status === "APPROVED" && (
                            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" /> Settled
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Direct Messaging Drawer */}
      {chatContract && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  Direct Project Messaging
                </h3>
                <p className="text-[11px] text-slate-400">{chatContract.title}</p>
              </div>
              <button
                onClick={() => setChatContract(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg"
              >
                Close
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {messagesLoading ? (
                <div className="text-center py-8 text-xs text-slate-400">Loading conversation...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No messages yet. Send a message to coordinate deliverable requirements!
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-indigo-300">{msg.sender.name} ({msg.sender.role})</span>
                      <span className="text-slate-500">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="text-xs text-slate-200">{msg.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                required
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Deliverable Submission Modal */}
      {submitMilestone && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border space-y-4">
            <h2 className="text-lg font-bold text-white">Submit Milestone Deliverable</h2>
            <p className="text-xs text-slate-300">
              Submitting for: <strong className="text-white">{submitMilestone.milestone.title}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Deliverable URL (GitHub / Preview)</label>
                <input
                  type="url"
                  required
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Git Commit SHA</label>
                <input
                  type="text"
                  value={commitSha}
                  onChange={(e) => setCommitSha(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 space-y-1">
                <p className="font-semibold">Engine 02 Streaming Digest Checksum:</p>
                <p className="text-slate-400">
                  A canonical SHA-256 digest will be computed upon submission to cryptographically seal this deliverable against retrospective tampering.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmitMilestone(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleMilestoneAction(submitMilestone.contractId, submitMilestone.milestone.id, "submit", {
                      deliverableUrl,
                      commitSha,
                    });
                    setSubmitMilestone(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Seal & Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewContract && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              Contract Performance Rating
            </h2>
            <p className="text-xs text-slate-300">
              Contract: <strong className="text-white">{reviewContract.title}</strong>
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-2">Rating (1 to 5 Stars)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className={`p-2 rounded-xl border text-sm font-bold flex items-center justify-center flex-1 transition-colors ${
                        rating >= s
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                          : "bg-slate-900 border-slate-800 text-slate-500"
                      }`}
                    >
                      {s} ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Feedback & Notes</label>
                <textarea
                  rows={3}
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Share feedback on technical quality, communication, and adherence to milestones..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewContract(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs"
                >
                  Submit Official Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
