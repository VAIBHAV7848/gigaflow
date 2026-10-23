"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  DollarSign,
  Calendar,
  CheckCircle,
  Star,
  Award,
  Sparkles,
  ArrowLeft,
  Send,
  User,
} from "lucide-react";

interface Proposal {
  id: string;
  bidAmount: number;
  deliveryDays: number;
  coverLetter: string;
  heuristicScore: number;
  status: string;
  createdAt: string;
  freelancer: {
    id: string;
    name: string;
    email: string;
    profile?: {
      headline?: string;
      reputationScore: number;
      skills: string[];
      completedJobsCount: number;
    };
  };
}

interface JobDetails {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  currency: string;
  status: string;
  requiredSkills: string[];
  createdAt: string;
  client: { id: string; name: string; email: string };
  contract?: { id: string; status: string } | null;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<JobDetails | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [awardingId, setAwardingId] = useState<string | null>(null);

  const fetchJobData = async () => {
    try {
      const [jobsRes, propRes] = await Promise.all([
        fetch("/api/projects"),
        fetch(`/api/projects/${jobId}/proposals`),
      ]);
      const jobsData = await jobsRes.json();
      const propData = await propRes.json();

      if (jobsData.jobs) {
        const found = jobsData.jobs.find((j: JobDetails) => j.id === jobId);
        if (found) setJob(found);
      }
      if (propData.proposals) {
        setProposals(propData.proposals);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) fetchJobData();
  }, [jobId]);

  const handleAwardContract = async (proposalId: string) => {
    setAwardingId(proposalId);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/award`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/contracts");
      } else {
        alert(data.error || "Failed to award contract");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAwardingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-slate-400 text-sm">Loading project requirements...</div>;
  }

  if (!job) {
    return (
      <div className="glass-panel p-8 text-center rounded-2xl text-slate-400 text-sm">
        Project not found.{" "}
        <Link href="/projects" className="text-indigo-400 hover:underline">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Marketplace
        </Link>
      </div>

      {/* Job Header Card */}
      <div className="glass-panel p-6 rounded-2xl border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                {job.category}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono uppercase">
                {job.status}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">{job.title}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Posted by <strong className="text-slate-200">{job.client.name}</strong> • {new Date(job.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Target Budget</span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">
              ${job.budget.toLocaleString()} {job.currency}
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
          {job.description}
        </p>

        {job.requiredSkills.length > 0 && (
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Required Technical Stack:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {job.requiredSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-indigo-950/70 border border-indigo-800/40 text-xs text-indigo-300 font-mono"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Proposals Evaluation Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              Applicant Proposals & Heuristic Match Scores (FR-11)
            </h2>
            <p className="text-xs text-slate-400">
              Evaluated via multi-attribute heuristics: 50% Jaccard skill fit, 30% budget ratio, 20% reputation.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 font-semibold">
            {proposals.length} Proposals Submitted
          </span>
        </div>

        {proposals.length === 0 ? (
          <div className="glass-panel p-8 text-center rounded-2xl text-slate-400 text-sm">
            No proposals submitted yet for this project.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {proposals.map((prop) => (
              <div
                key={prop.id}
                className="glass-panel p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Freelancer & Proposal */}
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center font-bold text-white text-xs">
                      {prop.freelancer.name[0]}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {prop.freelancer.name}
                        <span className="text-[11px] text-amber-400 flex items-center gap-0.5 font-mono">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {prop.freelancer.profile?.reputationScore || "5.0"}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {prop.freelancer.profile?.headline || "Full-Stack Engineer"} • {prop.freelancer.profile?.completedJobsCount || 0} completed jobs
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 italic bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    "{prop.coverLetter}"
                  </p>

                  {/* Skills tags */}
                  {prop.freelancer.profile?.skills && (
                    <div className="flex flex-wrap gap-1">
                      {prop.freelancer.profile.skills.map((s, i) => (
                        <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Heuristic Match Score & Award Button */}
                <div className="flex flex-col sm:flex-row md:flex-col items-end justify-between gap-3 min-w-[200px]">
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-indigo-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Match Score: {prop.heuristicScore}%</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-xl font-extrabold text-white font-mono">
                        ${prop.bidAmount.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        in {prop.deliveryDays} days
                      </span>
                    </div>
                  </div>

                  {prop.status === "PENDING" && (
                    <button
                      onClick={() => handleAwardContract(prop.id)}
                      disabled={awardingId === prop.id}
                      className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                    >
                      <Award className="w-3.5 h-3.5" />
                      Award & Create Contract
                    </button>
                  )}

                  {prop.status === "ACCEPTED" && (
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Awarded & Active
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
