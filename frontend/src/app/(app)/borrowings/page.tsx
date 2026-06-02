"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, RotateCcw, DollarSign, AlertTriangle, RefreshCw } from "lucide-react";
import {
  getBorrowings, borrowBook, returnBook, payFine, renewBorrowing,
  getBooks, getMembers,
  type Borrowing, type Book, type Member
} from "@/lib/api";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";

type Filter = "all" | "active" | "overdue" | "returned";

function BorrowForm({ onSave, onCancel }: { onSave: (d: { book_id: string; member_id: string; due_days: number; notes?: string }) => Promise<void>; onCancel: () => void }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState({ book_id: "", member_id: "", due_days: 14, notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getBooks({ available_only: "true" }).then(setBooks);
    getMembers({ active_only: "true" }).then(setMembers);
  }, []);

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.book_id || !form.member_id) return setError("Select a book and member");
    setLoading(true); setError("");
    try { await onSave(form); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-crimson text-sm bg-crimson/10 px-3 py-2 rounded-lg">{error}</p>}
      <div>
        <label className="text-xs font-medium text-ink/60 mb-1 block">Book *</label>
        <select className="input" value={form.book_id} onChange={(e) => set("book_id", e.target.value)}>
          <option value="">— Select a book —</option>
          {books.map((b) => <option key={b.id} value={b.id}>{b.title} ({b.available_copies} available)</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-ink/60 mb-1 block">Member *</label>
        <select className="input" value={form.member_id} onChange={(e) => set("member_id", e.target.value)}>
          <option value="">— Select a member —</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-ink/60 mb-1 block">Loan Period (days)</label>
        <input className="input" type="number" min={1} max={90} value={form.due_days} onChange={(e) => set("due_days", Number(e.target.value))} />
      </div>
      <div>
        <label className="text-xs font-medium text-ink/60 mb-1 block">Notes (optional)</label>
        <input className="input" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any notes..." />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={loading}>{loading ? "Processing…" : "Borrow Book"}</button>
      </div>
    </div>
  );
}

function RenewForm({ borrowing, onSave, onCancel }: { borrowing: Borrowing; onSave: (days: number) => Promise<void>; onCancel: () => void }) {
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isOverdue = new Date(borrowing.due_date) < new Date();

  const submit = async () => {
    setLoading(true); setError("");
    try { await onSave(days); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-crimson text-sm bg-crimson/10 px-3 py-2 rounded-lg">{error}</p>}
      <div className="text-sm text-ink/70 bg-parchment rounded-lg px-4 py-3 space-y-1">
        <p><span className="font-medium">Book:</span> {borrowing.book?.title}</p>
        <p><span className="font-medium">Member:</span> {borrowing.member?.name}</p>
        <p><span className="font-medium">Current due:</span> {new Date(borrowing.due_date).toLocaleDateString()}</p>
      </div>
      {isOverdue && borrowing.accrued_fine > 0 && (
        <div className="text-sm bg-crimson/10 text-crimson px-4 py-3 rounded-lg">
          <AlertTriangle size={14} className="inline mr-1.5" />
          Accrued fine of <strong>${borrowing.accrued_fine.toFixed(2)}</strong> will be locked in before renewal.
        </div>
      )}
      <div>
        <label className="text-xs font-medium text-ink/60 mb-1 block">Extend by (days)</label>
        <input className="input" type="number" min={1} max={30} value={days} onChange={(e) => setDays(Number(e.target.value))} />
        <p className="text-xs text-ink/40 mt-1">
          New due date: {new Date(Date.now() + days * 86400000).toLocaleDateString()}
        </p>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={loading}>
          {loading ? "Renewing…" : "Confirm Renewal"}
        </button>
      </div>
    </div>
  );
}

export default function BorrowingsPage() {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [renewTarget, setRenewTarget] = useState<Borrowing | null>(null);
  const { show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter === "active") params.active_only = "true";
      if (filter === "overdue") params.overdue_only = "true";
      let data = await getBorrowings(params);
      if (filter === "returned") data = data.filter((b) => !!b.returned_at);
      setBorrowings(data);
    } catch { show("Failed to load borrowings", "error"); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleBorrow = async (d: Parameters<typeof borrowBook>[0]) => {
    await borrowBook(d);
    show("Book borrowed successfully");
    setModal(false);
    load();
  };

  const handleReturn = async (b: Borrowing) => {
    if (!confirm(`Mark "${b.book?.title}" as returned?`)) return;
    try {
      await returnBook(b.id);
      const fine = b.accrued_fine;
      show("Book returned" + (fine > 0 ? ` — fine $${fine.toFixed(2)}` : ""));
      load();
    }
    catch (e: any) { show(e.message, "error"); }
  };

  const handlePayFine = async (b: Borrowing) => {
    try { await payFine(b.id); show("Fine paid"); load(); }
    catch (e: any) { show(e.message, "error"); }
  };

  const handleRenew = async (days: number) => {
    if (!renewTarget) return;
    await renewBorrowing(renewTarget.id, days);
    show(`Borrowing renewed — new due date in ${days} days`);
    setRenewTarget(null);
    load();
  };

  const isOverdue = (b: Borrowing) => !b.returned_at && new Date(b.due_date) < new Date();
  const filterBtns: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Overdue", value: "overdue" },
    { label: "Returned", value: "returned" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Borrowings</h1>
          <p className="text-ink/50 text-sm mt-1">{borrowings.length} records</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <Plus size={15} /> Borrow Book
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {filterBtns.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === value ? "bg-ink text-parchment" : "bg-white border border-parchment-dark text-ink/60 hover:bg-parchment"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Book</th>
                <th>Member</th>
                <th>Borrowed</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Fine</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-ink/30">Loading…</td></tr>
              ) : borrowings.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-ink/30">No borrowings found</td></tr>
              ) : borrowings.map((b) => {
                const overdue = isOverdue(b);
                const fine = b.accrued_fine;
                return (
                  <tr key={b.id}>
                    <td><p className="font-medium">{b.book?.title ?? b.book_id}</p><p className="text-xs text-ink/40">{b.book?.author}</p></td>
                    <td><p className="font-medium text-sm">{b.member?.name ?? b.member_id}</p><p className="text-xs text-ink/40">{b.member?.email}</p></td>
                    <td className="text-sm text-ink/60">{new Date(b.borrowed_at).toLocaleDateString()}</td>
                    <td className={`text-sm font-medium ${overdue ? "text-crimson" : "text-ink/70"}`}>
                      {overdue && <AlertTriangle size={12} className="inline mr-1" />}
                      {new Date(b.due_date).toLocaleDateString()}
                    </td>
                    <td>
                      {b.returned_at
                        ? <span className="badge bg-parchment-dark text-ink/50">Returned {new Date(b.returned_at).toLocaleDateString()}</span>
                        : overdue
                          ? <span className="badge bg-crimson/10 text-crimson">Overdue</span>
                          : <span className="badge bg-sage/10 text-sage">Active</span>}
                    </td>
                    <td>
                      {fine > 0 ? (
                        <span className={`badge ${b.fine_paid ? "bg-parchment-dark text-ink/50" : "bg-crimson/10 text-crimson"}`}>
                          {!b.returned_at && "~"}${fine.toFixed(2)}{b.fine_paid ? " (paid)" : ""}
                        </span>
                      ) : "—"}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {!b.returned_at && (
                          <>
                            <button className="btn-success py-1 px-2 text-xs" onClick={() => handleReturn(b)}>
                              <RotateCcw size={12} /> Return
                            </button>
                            <button className="btn-secondary py-1 px-2 text-xs" onClick={() => setRenewTarget(b)}>
                              <RefreshCw size={12} /> Renew
                            </button>
                          </>
                        )}
                        {b.fine_amount > 0 && !b.fine_paid && b.returned_at && (
                          <button className="btn-danger py-1 px-2 text-xs" onClick={() => handlePayFine(b)}>
                            <DollarSign size={12} /> Pay Fine
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title="Borrow a Book" onClose={() => setModal(false)}>
          <BorrowForm onSave={handleBorrow} onCancel={() => setModal(false)} />
        </Modal>
      )}

      {renewTarget && (
        <Modal title="Renew Borrowing" onClose={() => setRenewTarget(null)}>
          <RenewForm
            borrowing={renewTarget}
            onSave={handleRenew}
            onCancel={() => setRenewTarget(null)}
          />
        </Modal>
      )}
    </div>
  );
}
