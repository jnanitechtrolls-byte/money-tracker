import { useState } from "react";
import { useGetExpenseSummary, useListAccounts, useCreateAccount, useDeleteAccount } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function monthLabel(ym: string) {
  const [, m] = ym.split("-");
  return `${MONTHS_SHORT[parseInt(m)-1]}`;
}

const ACCOUNT_ICONS = ["💳","🏦","💵","💰","🪙","🏧","📱","💼","🐷","🔐"];
const ACCOUNT_TYPES = ["Default","Savings","Credit Card","Investment","Loan","Cash"];
const CURRENCIES = ["USD","EUR","GBP","INR","JPY","AUD","CAD","SGD"];

export default function ReportsPage() {
  const [tab, setTab] = useState<"analytics"|"accounts">("analytics");
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showManageAccounts, setShowManageAccounts] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number|null>(null);

  // Add account form state
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState("Default");
  const [accCurrency, setAccCurrency] = useState("USD");
  const [accAmount, setAccAmount] = useState("0");
  const [accIcon, setAccIcon] = useState("💳");
  const [accInclude, setAccInclude] = useState(true);

  const queryClient = useQueryClient();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;

  const { data: summary } = useGetExpenseSummary({ month: currentMonth });
  const { data: accounts = [], isLoading: accountsLoading } = useListAccounts();

  const createAccount = useCreateAccount({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
        setShowAddAccount(false);
        resetForm();
      },
    },
  });

  const deleteAccount = useDeleteAccount({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
        setDeleteConfirmId(null);
      },
    },
  });

  function resetForm() {
    setAccName(""); setAccType("Default"); setAccCurrency("USD");
    setAccAmount("0"); setAccIcon("💳"); setAccInclude(true);
  }

  function saveAccount() {
    if (!accName.trim()) return;
    createAccount.mutate({
      data: {
        name: accName,
        type: accType,
        currency: accCurrency,
        amount: parseFloat(accAmount) || 0,
        icon: accIcon,
        includeInTotal: accInclude,
      },
    });
  }

  const monthlyStats = summary?.monthlyStats || [];
  const totalExpenses = summary?.totalExpenses || 0;
  const budget = 0;
  const remaining = budget - totalExpenses;
  const budgetPct = budget > 0 ? Math.min(totalExpenses/budget, 1) : 0;

  const netWorth = accounts.filter(a => a.includeInTotal).reduce((s,a) => s + a.amount, 0);
  const assets = accounts.filter(a => a.includeInTotal && a.amount >= 0).reduce((s,a) => s+a.amount, 0);
  const liabilities = accounts.filter(a => a.includeInTotal && a.amount < 0).reduce((s,a) => s+Math.abs(a.amount), 0);

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-white font-bold text-base text-center mb-4">Reports</h1>
        <div className="flex rounded-full bg-[#2a2a2a] p-1 gap-1 mb-4">
          {(["analytics","accounts"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-full text-sm font-semibold capitalize transition-colors ${
                tab === t ? "bg-white text-black" : "text-muted-foreground"
              }`}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 px-4 flex flex-col gap-4">
        {tab === "analytics" && (
          <>
            <div className="bg-[#222] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-semibold">Monthly Statistics</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-xs text-muted-foreground mb-2 border-b border-[#333] pb-2">
                <span>Month</span>
                <span className="text-right">Expenses</span>
                <span className="text-right">Income</span>
                <span className="text-right">Balance</span>
              </div>
              {monthlyStats.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No data yet</p>
              ) : (
                <>
                  <p className="text-muted-foreground text-xs mb-1">{now.getFullYear()}</p>
                  {monthlyStats.filter(s => s.month.startsWith(String(now.getFullYear()))).map(s => (
                    <div key={s.month} className="grid grid-cols-4 gap-1 text-sm py-1.5 border-b border-[#2a2a2a] last:border-0">
                      <span className="text-white font-medium">{monthLabel(s.month)}</span>
                      <span className="text-right text-red-400">{s.expenses.toFixed(0)}</span>
                      <span className="text-right text-green-400">{s.income.toFixed(0)}</span>
                      <span className={`text-right font-medium ${s.balance >= 0 ? "text-green-400" : "text-red-400"}`}>{s.balance.toFixed(0)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="bg-[#222] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold">Monthly Budget</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="relative w-20 h-20 shrink-0">
                  <svg viewBox="0 0 80 80" width="80" height="80">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#333" strokeWidth="10"/>
                    {budget > 0 && (
                      <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(48 100% 52%)"
                        strokeWidth="10" strokeDasharray={`${budgetPct*201} 201`}
                        strokeLinecap="round" transform="rotate(-90 40 40)"/>
                    )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-muted-foreground text-xs">--</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2.5">
                  <div className="flex justify-between text-sm border-b border-[#2a2a2a] pb-2">
                    <span className="text-muted-foreground">Remaining :</span>
                    <span className={remaining >= 0 ? "text-white" : "text-red-400"}>{remaining.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-[#2a2a2a] pb-2">
                    <span className="text-muted-foreground">Budget :</span>
                    <span className="text-white">{budget.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expenses :</span>
                    <span className="text-white">{totalExpenses.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "accounts" && (
          <>
            <div className="bg-[#222] rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Net Worth</p>
                    <p className={`text-2xl font-bold ${netWorth >= 0 ? "text-white" : "text-red-400"}`}>{netWorth.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-8">
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Assets</p>
                      <p className="text-green-400 font-semibold">{assets.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Liabilities</p>
                      <p className="text-red-400 font-semibold">{liabilities.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <span className="text-4xl">💰</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowAddAccount(true)} className="bg-[#222] rounded-2xl py-4 text-white font-semibold text-sm active:bg-[#2a2a2a]">
                + Add Account
              </button>
              <button onClick={() => setShowManageAccounts(true)} className="bg-[#222] rounded-2xl py-4 text-white font-semibold text-sm active:bg-[#2a2a2a]">
                Manage Accounts
              </button>
            </div>

            {accountsLoading && (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
              </div>
            )}

            {!accountsLoading && accounts.length > 0 && (
              <div className="bg-[#222] rounded-2xl overflow-hidden">
                {accounts.map((acc, i) => (
                  <div key={acc.id} className={`flex items-center gap-3 px-4 py-3 ${i < accounts.length-1 ? "border-b border-[#2a2a2a]" : ""}`}>
                    <span className="text-2xl">{acc.icon}</span>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{acc.name}</p>
                      <p className="text-muted-foreground text-xs">{acc.type} · {acc.currency}</p>
                    </div>
                    <span className={`text-sm font-semibold ${acc.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {acc.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Account full screen */}
      {showAddAccount && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#1a1a1a]">
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#2a2a2a]">
            <button onClick={() => { setShowAddAccount(false); resetForm(); }} className="text-muted-foreground text-sm font-medium">Cancel</button>
            <span className="text-white font-semibold">Add</span>
            <button onClick={saveAccount} disabled={!accName.trim() || createAccount.isPending} className="text-primary text-sm font-semibold disabled:opacity-40">
              {createAccount.isPending ? "…" : "✓"}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
            <div>
              <div className="w-0.5 h-4 bg-primary mb-1"/>
              <label className="text-primary text-sm font-semibold block mb-2">Account name</label>
              <input type="text" value={accName} onChange={e => setAccName(e.target.value)}
                placeholder="Enter account name"
                className="w-full bg-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm outline-none placeholder-muted-foreground"/>
            </div>
            <div>
              <div className="w-0.5 h-4 bg-primary mb-1"/>
              <label className="text-primary text-sm font-semibold block mb-2">Type</label>
              <select value={accType} onChange={e => setAccType(e.target.value)}
                className="w-full bg-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm outline-none [color-scheme:dark]">
                {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div className="w-0.5 h-4 bg-primary mb-1"/>
              <label className="text-primary text-sm font-semibold block mb-2">Currency</label>
              <select value={accCurrency} onChange={e => setAccCurrency(e.target.value)}
                className="w-full bg-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm outline-none [color-scheme:dark]">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div className="w-0.5 h-4 bg-primary mb-1"/>
              <label className="text-primary text-sm font-semibold block mb-2">Amount</label>
              <input type="number" value={accAmount} onChange={e => setAccAmount(e.target.value)}
                className="w-full bg-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm outline-none [color-scheme:dark]"/>
            </div>
            <div>
              <div className="w-0.5 h-4 bg-primary mb-1"/>
              <label className="text-primary text-sm font-semibold block mb-2">Icon</label>
              <div className="grid grid-cols-5 gap-2">
                {ACCOUNT_ICONS.map(ic => (
                  <button key={ic} onClick={() => setAccIcon(ic)}
                    className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all ${
                      accIcon === ic ? "bg-primary scale-110" : "bg-[#2a2a2a]"
                    }`}>{ic}</button>
                ))}
              </div>
            </div>
            <button onClick={() => setAccInclude(!accInclude)}
              className="flex items-center justify-between bg-[#2a2a2a] rounded-xl px-4 py-3">
              <span className="text-white text-sm">Do not include in total balance</span>
              <div className={`w-10 h-6 rounded-full transition-colors relative ${!accInclude ? "bg-primary" : "bg-[#333]"}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${!accInclude ? "translate-x-5" : "translate-x-1"}`}/>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Manage Accounts full screen */}
      {showManageAccounts && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#1a1a1a]">
          <div className="flex items-center gap-3 px-4 py-4 border-b border-[#2a2a2a]">
            <button onClick={() => setShowManageAccounts(false)} className="p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5m0 0l7-7m-7 7l7 7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <span className="text-white font-bold text-base flex-1 text-center">Manage Accounts</span>
            <div className="w-8"/>
          </div>
          <div className="flex-1 overflow-y-auto">
            {accountsLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
              </div>
            ) : accounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <p className="text-sm">No records</p>
              </div>
            ) : (
              <div className="px-4 py-4 flex flex-col gap-3">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex items-center gap-3 bg-[#222] rounded-2xl px-4 py-3">
                    <span className="text-2xl">{acc.icon}</span>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{acc.name}</p>
                      <p className="text-muted-foreground text-xs">{acc.type} · {acc.currency}</p>
                    </div>
                    <span className={`text-sm font-semibold mr-3 ${acc.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {acc.amount.toFixed(2)}
                    </span>
                    <button onClick={() => setDeleteConfirmId(acc.id)} className="p-1">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="hsl(0 70% 55%)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-4 pb-6 pt-2">
            <button onClick={() => { setShowManageAccounts(false); setShowAddAccount(true); }}
              className="w-full py-4 rounded-2xl bg-primary text-black font-bold text-base">
              + Add
            </button>
          </div>
        </div>
      )}

      {/* Delete account confirm */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-6">
          <div className="bg-[#2a2a2a] rounded-2xl p-6 w-full max-w-sm">
            <p className="text-white font-semibold text-center mb-2">Delete Account?</p>
            <p className="text-muted-foreground text-sm text-center mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 rounded-xl bg-[#333] text-white font-semibold text-sm">Cancel</button>
              <button onClick={() => deleteAccount.mutate({ id: deleteConfirmId })} disabled={deleteAccount.isPending}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm">
                {deleteAccount.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
