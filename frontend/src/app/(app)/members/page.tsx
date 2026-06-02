"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Edit2, Trash2, UserCheck, UserX } from "lucide-react";
import { getMembers, createMember, updateMember, deleteMember, type Member } from "@/lib/api";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";

function MemberForm({ member, onSave, onCancel }: { member?: Member; onSave: (d: Partial<Member>) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: member?.name ?? "",
    email: member?.email ?? "",
    phone: member?.phone ?? "",
    address: member?.address ?? "",
    is_active: member?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.email) return setError("Name and Email are required");
    setLoading(true); setError("");
    try { await onSave(form); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-crimson text-sm bg-crimson/10 px-3 py-2 rounded-lg">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-ink/60 mb-1 block">Full Name *</label>
          <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Doe" />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-ink/60 mb-1 block">Email *</label>
          <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@example.com" />
        </div>
        <div>
          <label className="text-xs font-medium text-ink/60 mb-1 block">Phone</label>
          <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1-555-0000" />
        </div>
        <div>
          <label className="text-xs font-medium text-ink/60 mb-1 block">Status</label>
          <select className="input" value={form.is_active ? "active" : "inactive"} onChange={(e) => set("is_active", e.target.value === "active")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-ink/60 mb-1 block">Address</label>
          <textarea className="input resize-none h-16" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street address..." />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={loading}>
          {loading ? "Saving…" : member ? "Update Member" : "Add Member"}
        </button>
      </div>
    </div>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | Member | null>(null);
  const { show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { setMembers(await getMembers(search ? { search } : undefined)); }
    catch { show("Failed to load members", "error"); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: Partial<Member>) => {
    if (modal === "create") { await createMember(data); show("Member registered"); }
    else if (modal && typeof modal === "object") { await updateMember(modal.id, data); show("Member updated"); }
    setModal(null); load();
  };

  const handleDelete = async (m: Member) => {
    if (!confirm(`Remove member "${m.name}"?`)) return;
    try { await deleteMember(m.id); show("Member removed"); load(); }
    catch (e: any) { show(e.message, "error"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Members</h1>
          <p className="text-ink/50 text-sm mt-1">{members.length} registered members</p>
        </div>
        <button className="btn-primary" onClick={() => setModal("create")}>
          <Plus size={15} /> Add Member
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
        <input className="input pl-9" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-ink/30">Loading…</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-ink/30">No members found</td></tr>
              ) : members.map((m) => (
                <tr key={m.id}>
                  <td><p className="font-medium">{m.name}</p></td>
                  <td className="text-ink/60">{m.email}</td>
                  <td className="text-ink/60 text-sm">{m.phone || "—"}</td>
                  <td>
                    {m.is_active
                      ? <span className="badge bg-sage/10 text-sage flex items-center gap-1 w-fit"><UserCheck size={11} /> Active</span>
                      : <span className="badge bg-crimson/10 text-crimson flex items-center gap-1 w-fit"><UserX size={11} /> Inactive</span>}
                  </td>
                  <td className="text-ink/50 text-sm">{new Date(m.joined_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 rounded hover:bg-parchment text-ink/50 hover:text-ink transition" onClick={() => setModal(m)}><Edit2 size={13} /></button>
                      <button className="p-1.5 rounded hover:bg-crimson/10 text-ink/50 hover:text-crimson transition" onClick={() => handleDelete(m)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={modal === "create" ? "Register Member" : `Edit: ${(modal as Member).name}`} onClose={() => setModal(null)}>
          <MemberForm member={modal === "create" ? undefined : (modal as Member)} onSave={handleSave} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
