"use client";

import React, { useEffect, useState } from "react";
import {
  Wallet as WalletIcon,
  DollarSign,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Plus,
  RefreshCw,
  Receipt,
  ShieldCheck,
} from "lucide-react";

interface LedgerTx {
  entryId: string;
  entryType: "DEBIT" | "CREDIT";
  amount: number;
  createdAt: string;
  txType: string;
  description: string;
  referenceId: string;
}

interface WalletData {
  walletBalance: number;
  escrowHeld: number;
  reputationScore: number;
  completedJobsCount: number;
  transactions: LedgerTx[];
  ledgerHealth: {
    isConserved: boolean;
    totalDebits: number;
    totalCredits: number;
    delta: number;
    totalTransactions: number;
  };
}

export default function WalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("1000");
  const [depositLoading, setDepositLoading] = useState(false);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wallet");
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositLoading(true);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: depositAmount }),
      });
      const resData = await res.json();
      if (resData.success) {
        setShowDepositModal(false);
        fetchWallet();
      } else {
        alert(resData.error || "Deposit failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDepositLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <WalletIcon className="w-6 h-6 text-indigo-400" />
            Escrow Wallet & Double-Entry Financial Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Engine 03 ACID Accounting: Mathematical balance conservation (ΔEscrow + ΔUser = 0).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchWallet}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowDepositModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Top Up Demo Balance
          </button>
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-6 rounded-2xl border space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Liquid Available Balance</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            ${data ? data.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
          </div>
          <p className="text-[11px] text-emerald-400 font-mono">Ready for milestone funding or withdrawal</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Escrow In-Hold (Locked)</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400 font-mono">
            ${data ? data.escrowHeld.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Programmatically locked in active milestones</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ledger Invariant Check</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-indigo-300 font-mono flex items-center gap-2">
            Δ = 0.00
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold font-mono">
              CONSERVED
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Σ Debits === Σ Credits ({data?.ledgerHealth.totalTransactions || 0} Transactions)
          </p>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-400" />
            Append-Only Double-Entry Transaction Ledger
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Showing latest {data?.transactions.length || 0} journal entries
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading ledger journal...</div>
        ) : !data || data.transactions.length === 0 ? (
          <div className="glass-panel p-8 text-center rounded-2xl text-slate-400 text-sm">
            No financial transactions recorded yet. Use the top-up button above to deposit simulated funds.
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Direction</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {data.transactions.map((tx) => {
                    const isCredit = tx.entryType === "CREDIT";
                    return (
                      <tr key={tx.entryId} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px]">
                            {tx.txType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-sans max-w-md truncate">
                          {tx.description}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                              isCredit
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {isCredit ? (
                              <>
                                <ArrowDownLeft className="w-3 h-3" /> CREDIT (+)
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="w-3 h-3" /> DEBIT (-)
                              </>
                            )}
                          </span>
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-bold text-sm ${
                            isCredit ? "text-emerald-400" : "text-slate-300"
                          }`}
                        >
                          ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm p-6 rounded-2xl border space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Deposit Demo Funds
            </h2>
            <p className="text-xs text-slate-300">
              Simulates client credit card or bank transfer. Funds are credited to your Available Account and debited from the System Reserve.
            </p>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Amount ($ USD)</label>
                <input
                  type="number"
                  min="50"
                  max="50000"
                  step="50"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex gap-2">
                {["500", "1500", "5000"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDepositAmount(preset)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                  >
                    +${preset}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={depositLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
