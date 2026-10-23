"use client";

import React, { useEffect, useState } from "react";
import { Briefcase, Plus, Send, Sparkles, DollarSign, Calendar, CheckCircle } from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  currency: string;
  status: string;
  requiredSkills: string[];
  createdAt: string;
  client: { name: string; email: string };
  proposals: Array<{ id: string; bidAmount: number; heuristicScore: number }>;
}

export default function ProjectsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [skills, setSkills] = useState("");

  // Proposal states
  const [bidAmount, setBidAmount] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("14");
  const [coverLetter, setCoverLetter] = useState("");
  const [bidMessage, setBidMessage] = useState("");

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.jobs) setJobs(data.jobs);
    } catch (e) {
      console.error("Fetch jobs error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          budget,
          requiredSkills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPostModal(false);
        setTitle("");
        setDescription("");
        setBudget("");
        setSkills("");
        fetchJobs();
      } else {
        alert(data.error || "Failed to post job");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    try {
      const res = await fetch(`/api/projects/${selectedJob.id}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bidAmount,
          deliveryDays,
          coverLetter,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBidMessage(`Proposal submitted! Heuristic Match Score: ${data.matchAnalysis.overallScore}%`);
        setTimeout(() => {
          setSelectedJob(null);
          setBidMessage("");
          setBidAmount("");
          setCoverLetter("");
          fetchJobs();
        }, 1800);
      } else {
        alert(data.error || "Failed to submit proposal");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-400" />
            Project & Service Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Publish technical requirements or bid with deterministic heuristic proposal scoring (FR-11).
          </p>
        </div>

        <button
          onClick={() => setShowPostModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Post New Requirement
        </button>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading verified marketplace projects...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {job.category}
                  </span>
                  <span className="font-semibold text-emerald-400 font-mono text-sm">
                    ${job.budget.toLocaleString()} {job.currency}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white">{job.title}</h3>
                <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                  {job.description}
                </p>

                {job.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {job.requiredSkills.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-indigo-950/70 border border-indigo-800/40 text-[11px] text-indigo-300 font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  By <strong className="text-slate-200">{job.client.name}</strong> • {job.proposals.length} Bids
                </span>
                <button
                  onClick={() => {
                    setSelectedJob(job);
                    setBidAmount(job.budget.toString());
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Bid
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Job Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border space-y-4">
            <h2 className="text-lg font-bold text-white">Post New Project Requirement</h2>
            <form onSubmit={handleCreateJob} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Double-Entry Escrow Microservice"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain scope, deliverables, and acceptance criteria..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Target Budget ($)</label>
                  <input
                    type="number"
                    required
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="2500"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Required Skills (CSV)</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="Next.js, TypeScript, PostgreSQL"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
                >
                  Publish Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply / Proposal Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Submit Proposal</h2>
              <span className="text-xs font-mono text-indigo-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Engine 02 Matching
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Applying for: <strong className="text-white">{selectedJob.title}</strong> (Budget: ${selectedJob.budget})
            </p>

            {bidMessage ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs text-center flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {bidMessage}
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Bid Amount ($)</label>
                    <input
                      type="number"
                      required
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Estimated Days</label>
                    <input
                      type="number"
                      required
                      value={deliveryDays}
                      onChange={(e) => setDeliveryDays(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Proposal & Technical Approach</label>
                  <textarea
                    required
                    rows={4}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Outline your architecture, deliverable verification strategy, and milestones..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedJob(null)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Proposal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
