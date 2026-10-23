"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  Briefcase,
  FileText,
  Scale,
  Activity,
  Layers,
  ChevronDown,
  UserCheck,
  Moon,
  Sun,
  Wallet,
} from "lucide-react";

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "FREELANCER" | "ARBITER" | "ADMIN";
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loadingPersona, setLoadingPersona] = useState(false);

  // Fetch session
  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setSession({
          id: data.user.userId,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        });
      }
    } catch (e) {
      console.error("Session fetch error:", e);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [pathname]);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("light");
      setIsDarkMode(false);
    } else {
      root.classList.remove("light");
      setIsDarkMode(true);
    }
  };

  const switchPersona = async (targetRole: string) => {
    setLoadingPersona(true);
    try {
      const res = await fetch("/api/auth/switch-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.user);
        setSwitcherOpen(false);
        router.refresh();
      }
    } catch (e) {
      console.error("Persona switch failed:", e);
    } finally {
      setLoadingPersona(false);
    }
  };

  const navLinks = [
    { label: "Marketplace", href: "/projects", icon: Briefcase },
    { label: "Contracts", href: "/contracts", icon: FileText },
    { label: "Disputes & Merkle", href: "/disputes", icon: Scale },
    { label: "Chained Audit", href: "/audit", icon: Activity },
    { label: "Engine Showcase", href: "/engines", icon: Layers },
  ];

  const roleColors: Record<string, string> = {
    CLIENT: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    FREELANCER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    ARBITER: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    ADMIN: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b px-4 lg:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Academic Tag */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                GigaFlow
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 uppercase">
                Team 07 • KLE Tech
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Persona Switcher & Controls */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* 1-Click Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => setSwitcherOpen(!switcherOpen)}
              disabled={loadingPersona}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                session ? roleColors[session.role] : "bg-slate-800/80 text-slate-300 border-slate-700"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <div className="text-left hidden sm:block">
                <span className="font-semibold block leading-tight">{session ? session.name.split(" ")[0] : "Demo Persona"}</span>
                <span className="text-[10px] opacity-75 uppercase tracking-wider">{session ? session.role : "Switch"}</span>
              </div>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {switcherOpen && (
              <div className="absolute right-0 mt-2 w-64 glass-panel rounded-2xl shadow-2xl p-2 z-50 border border-slate-700/80 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-800 text-[11px] text-slate-400 font-medium">
                  Instant Evaluator Persona Switch
                </div>
                <div className="mt-1 space-y-1">
                  <button
                    onClick={() => switchPersona("CLIENT")}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-indigo-600/15 transition-colors group"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400">Alice (Client)</p>
                      <p className="text-[11px] text-slate-400">Posts jobs & funds escrow</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">CLIENT</span>
                  </button>

                  <button
                    onClick={() => switchPersona("FREELANCER")}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-emerald-600/15 transition-colors group"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400">Bob (Senior Freelancer)</p>
                      <p className="text-[11px] text-slate-400">Submits bids & deliverables</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">DEV</span>
                  </button>

                  <button
                    onClick={() => switchPersona("ARBITER")}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-amber-600/15 transition-colors group"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-amber-400">Carol (Arbiter)</p>
                      <p className="text-[11px] text-slate-400">Verifies Merkle tree & rules</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">ARBITER</span>
                  </button>

                  <button
                    onClick={() => switchPersona("ADMIN")}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-rose-600/15 transition-colors group"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-rose-400">Dave (System Admin)</p>
                      <p className="text-[11px] text-slate-400">Audit logs & 4-engine health</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">ADMIN</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
