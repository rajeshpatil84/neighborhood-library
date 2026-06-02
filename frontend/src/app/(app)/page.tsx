"use client";
import { useEffect, useState } from "react";
import { BookOpen, Users, ArrowLeftRight, AlertTriangle, DollarSign, TrendingUp } from "lucide-react";
import { getStats, getBorrowings, type Stats, type Borrowing } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [overdue, setOverdue] = useState<Borrowing[]>([]);
  const [recent, setRecent] = useState<Borrowing[]>([]);

  useEffect(() => {
    getStats().then(setStats).catch(console.error);
    getBorrowings({ overdue_only: "true", limit: "5" }).then(setOverdue).catch(console.error);
    getBorrowings({ active_only: "true", limit: "5" }).then(setRecent).catch(console.error);
  }, []);

  const statCards = stats
    ? [
        { label: "Total Books",        value: stats.total_books,        icon: BookOpen,        color: "text-amber-library" },
        { label: "Members",            value: stats.total_members,      icon: Users,           color: "text-sage" },
        { label: "Active Borrowings",  value: stats.active_borrowings,  icon: ArrowLeftRight,  color: "text-ink" },
        { label: "Overdue",            value: stats.overdue_borrowings, icon: AlertTriangle,   color: "text-crimson" },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-ink/50 mt-1 text-sm">Welcome back — here's what's happening at the library.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-ink/40 font-medium uppercase tracking-wider">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <span className="font-display text-3xl font-bold">{value}</span>
          </div>
        ))}
        {stats && (
          <div className="stat-card col-span-2 lg:col-span-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-ink/40 font-medium uppercase tracking-wider">Outstanding Fines</span>
                <p className="font-display text-3xl font-bold mt-1 text-crimson">
                  ${stats.total_fines_outstanding.toFixed(2)}
                </p>
              </div>
              <DollarSign size={40} className="text-crimson/10" />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-crimson" />
            <h2 className="font-semibold text-sm uppercase tracking-wider text-ink/60">Overdue Books</h2>
          </div>
          {overdue.length === 0 ? (
            <p className="text-ink/40 text-sm py-4 text-center">No overdue books 🎉</p>
          ) : (
            <div className="space-y-3">
              {overdue.map((b) => (
                <div key={b.id} className="flex justify-between items-start py-2 border-b border-parchment-dark last:border-0">
                  <div>
                    <p className="font-medium text-sm">{b.book?.title ?? "—"}</p>
                    <p className="text-xs text-ink/50">{b.member?.name}</p>
                  </div>
                  <span className="badge bg-crimson/10 text-crimson">
                    Due {new Date(b.due_date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent active */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-sage" />
            <h2 className="font-semibold text-sm uppercase tracking-wider text-ink/60">Active Borrowings</h2>
          </div>
          {recent.length === 0 ? (
            <p className="text-ink/40 text-sm py-4 text-center">No active borrowings</p>
          ) : (
            <div className="space-y-3">
              {recent.map((b) => (
                <div key={b.id} className="flex justify-between items-start py-2 border-b border-parchment-dark last:border-0">
                  <div>
                    <p className="font-medium text-sm">{b.book?.title ?? "—"}</p>
                    <p className="text-xs text-ink/50">{b.member?.name}</p>
                  </div>
                  <span className="badge bg-sage/10 text-sage">
                    Due {new Date(b.due_date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
