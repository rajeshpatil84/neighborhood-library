"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Edit2, Trash2, BookOpen } from "lucide-react";
import { getBooks, createBook, updateBook, deleteBook, type Book } from "@/lib/api";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";

const GENRES = ["Fiction", "Non-Fiction", "Science Fiction", "Dystopian", "Self-Help", "Technology", "History", "Mystery", "Biography", "Other"];

function BookForm({ book, onSave, onCancel }: { book?: Book; onSave: (data: Partial<Book>) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState({
    title: book?.title ?? "",
    author: book?.author ?? "",
    isbn: book?.isbn ?? "",
    genre: book?.genre ?? "",
    total_copies: book?.total_copies ?? 1,
    published_year: book?.published_year ?? "",
    description: book?.description ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title || !form.author) return setError("Title and Author are required");
    setLoading(true); setError("");
    try {
      await onSave({ ...form, total_copies: Number(form.total_copies), published_year: form.published_year ? Number(form.published_year) : undefined });
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-crimson text-sm bg-crimson/10 px-3 py-2 rounded-lg">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-ink/60 mb-1 block">Title *</label>
          <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Book title" />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-ink/60 mb-1 block">Author *</label>
          <input className="input" value={form.author} onChange={(e) => set("author", e.target.value)} placeholder="Author name" />
        </div>
        <div>
          <label className="text-xs font-medium text-ink/60 mb-1 block">ISBN</label>
          <input className="input" value={form.isbn} onChange={(e) => set("isbn", e.target.value)} placeholder="ISBN" />
        </div>
        <div>
          <label className="text-xs font-medium text-ink/60 mb-1 block">Genre</label>
          <select className="input" value={form.genre} onChange={(e) => set("genre", e.target.value)}>
            <option value="">— Select —</option>
            {GENRES.map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-ink/60 mb-1 block">Total Copies</label>
          <input className="input" type="number" min={1} value={form.total_copies} onChange={(e) => set("total_copies", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-ink/60 mb-1 block">Year Published</label>
          <input className="input" type="number" value={form.published_year} onChange={(e) => set("published_year", e.target.value)} placeholder="e.g. 2001" />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-ink/60 mb-1 block">Description</label>
          <textarea className="input resize-none h-20" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Short description..." />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={loading}>
          {loading ? "Saving…" : book ? "Update Book" : "Add Book"}
        </button>
      </div>
    </div>
  );
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | Book | null>(null);
  const { show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { setBooks(await getBooks(search ? { search } : undefined)); }
    catch { show("Failed to load books", "error"); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: Partial<Book>) => {
    if (modal === "create") {
      await createBook(data);
      show("Book added successfully");
    } else if (modal && typeof modal === "object") {
      await updateBook(modal.id, data);
      show("Book updated");
    }
    setModal(null);
    load();
  };

  const handleDelete = async (b: Book) => {
    if (!confirm(`Delete "${b.title}"?`)) return;
    try { await deleteBook(b.id); show("Book deleted"); load(); }
    catch (e: any) { show(e.message, "error"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Books</h1>
          <p className="text-ink/50 text-sm mt-1">{books.length} books in collection</p>
        </div>
        <button className="btn-primary" onClick={() => setModal("create")}>
          <Plus size={15} /> Add Book
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
        <input
          className="input pl-9"
          placeholder="Search by title, author or ISBN…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title / Author</th>
                <th>Genre</th>
                <th>ISBN</th>
                <th>Copies</th>
                <th>Available</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-ink/30">Loading…</td></tr>
              ) : books.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-ink/30">No books found</td></tr>
              ) : books.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-10 bg-parchment-dark rounded flex items-center justify-center shrink-0">
                        <BookOpen size={14} className="text-ink/40" />
                      </div>
                      <div>
                        <p className="font-medium">{b.title}</p>
                        <p className="text-xs text-ink/50">{b.author}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    {b.genre && <span className="badge bg-parchment-dark text-ink/60">{b.genre}</span>}
                  </td>
                  <td className="font-mono text-xs text-ink/50">{b.isbn || "—"}</td>
                  <td>{b.total_copies}</td>
                  <td>
                    <span className={`badge ${b.available_copies > 0 ? "bg-sage/10 text-sage" : "bg-crimson/10 text-crimson"}`}>
                      {b.available_copies} / {b.total_copies}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 rounded hover:bg-parchment text-ink/50 hover:text-ink transition" onClick={() => setModal(b)}>
                        <Edit2 size={13} />
                      </button>
                      <button className="p-1.5 rounded hover:bg-crimson/10 text-ink/50 hover:text-crimson transition" onClick={() => handleDelete(b)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal
          title={modal === "create" ? "Add New Book" : `Edit: ${(modal as Book).title}`}
          onClose={() => setModal(null)}
        >
          <BookForm
            book={modal === "create" ? undefined : (modal as Book)}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
