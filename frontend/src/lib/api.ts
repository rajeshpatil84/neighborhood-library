const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const V1 = `${BASE}/api/v1`;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Books ──────────────────────────────────────────────────
export const getBooks = (params?: Record<string, string>) => {
  const q = params ? "?" + new URLSearchParams(params).toString() : "";
  return request<Book[]>(`${V1}/books${q}`);
};
export const getBook = (id: string) => request<Book>(`${V1}/books/${id}`);
export const createBook = (data: Partial<Book>) =>
  request<Book>(`${V1}/books`, { method: "POST", body: JSON.stringify(data) });
export const updateBook = (id: string, data: Partial<Book>) =>
  request<Book>(`${V1}/books/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteBook = (id: string) =>
  request<void>(`${V1}/books/${id}`, { method: "DELETE" });

// ─── Members ────────────────────────────────────────────────
export const getMembers = (params?: Record<string, string>) => {
  const q = params ? "?" + new URLSearchParams(params).toString() : "";
  return request<Member[]>(`${V1}/members${q}`);
};
export const getMember = (id: string) => request<Member>(`${V1}/members/${id}`);
export const createMember = (data: Partial<Member>) =>
  request<Member>(`${V1}/members`, { method: "POST", body: JSON.stringify(data) });
export const updateMember = (id: string, data: Partial<Member>) =>
  request<Member>(`${V1}/members/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteMember = (id: string) =>
  request<void>(`${V1}/members/${id}`, { method: "DELETE" });

// ─── Borrowings ─────────────────────────────────────────────
export const getBorrowings = (params?: Record<string, string>) => {
  const q = params ? "?" + new URLSearchParams(params).toString() : "";
  return request<Borrowing[]>(`${V1}/borrowings${q}`);
};
export const borrowBook = (data: { book_id: string; member_id: string; due_days?: number; notes?: string }) =>
  request<Borrowing>(`${V1}/borrowings/borrow`, { method: "POST", body: JSON.stringify(data) });
export const returnBook = (id: string, notes?: string) =>
  request<Borrowing>(`${V1}/borrowings/${id}/return`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
export const payFine = (id: string) =>
  request<Borrowing>(`${V1}/borrowings/${id}/pay-fine`, { method: "POST" });
export const renewBorrowing = (id: string, renew_days: number = 14) =>
  request<Borrowing>(`${V1}/borrowings/${id}/renew`, {
    method: "POST",
    body: JSON.stringify({ renew_days }),
  });

// ─── Stats ───────────────────────────────────────────────────
export const getStats = () => request<Stats>(`${V1}/stats`);

// ─── Types ───────────────────────────────────────────────────
export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  genre?: string;
  total_copies: number;
  available_copies: number;
  published_year?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface Borrowing {
  id: string;
  book_id: string;
  member_id: string;
  borrowed_at: string;
  due_date: string;
  returned_at?: string;
  fine_amount: number;
  accrued_fine: number;
  fine_paid: boolean;
  notes?: string;
  book?: Book;
  member?: Member;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  total_books: number;
  total_members: number;
  active_borrowings: number;
  overdue_borrowings: number;
  total_fines_outstanding: number;
}
