"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, apiFetch, authHeaders } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Paginated } from "@/lib/types";

interface AdminUser {
  id: string;
  name: string;
  phone: string;
  role: "USER" | "ADMIN";
  bannedAt: string | null;
  banReason: string | null;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  _count: { listings: number };
}

export default function AdminUsers() {
  // `queryInput` is what's being typed; `search` is what was actually
  // submitted. Keeping them apart means the fetch never runs on a keystroke
  // and never reads a stale value out of a memoised closure.
  const [queryInput, setQueryInput] = useState("");
  const [search, setSearch] = useState("");
  const [banned, setBanned] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  // Which user's ban form is open, and what reason has been typed into it.
  const [banningId, setBanningId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");

  // The fetch lives inside the effect rather than in a memoised callback:
  // React 19's lint rule rejects calling one that updates state. The
  // handlers below flip `loading` on; this only ever turns it back off.
  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (search) params.set("q", search);
        if (banned) params.set("banned", banned);
        const res = await apiFetch<Paginated<AdminUser>>(
          `/admin/users?${params}`,
          { headers: authHeaders() },
        );
        if (cancelled) return;
        setData(res);
        setError(null);
      } catch {
        if (!cancelled) setError("Foydalanuvchilarni yuklab boʻlmadi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [page, search, banned]);

  function replaceUser(updated: AdminUser) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((u) => (u.id === updated.id ? updated : u)),
          }
        : prev,
    );
  }

  async function ban(id: string) {
    setActingOn(id);
    setError(null);
    try {
      const res = await apiFetch<{ user: AdminUser; hiddenListings: number }>(
        `/admin/users/${id}/ban`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ reason: banReason }),
        },
      );
      replaceUser(res.user);
      setBanningId(null);
      setBanReason("");
    } catch (err) {
      setError(
        err instanceof ApiError && err.message
          ? err.message
          : "Bloklab boʻlmadi. Qayta urinib koʻring.",
      );
    } finally {
      setActingOn(null);
    }
  }

  async function unban(id: string) {
    setActingOn(id);
    setError(null);
    try {
      const updated = await apiFetch<AdminUser>(`/admin/users/${id}/unban`, {
        method: "POST",
        headers: authHeaders(),
      });
      replaceUser(updated);
    } catch (err) {
      setError(
        err instanceof ApiError && err.message
          ? err.message
          : "Blokdan chiqarib boʻlmadi. Qayta urinib koʻring.",
      );
    } finally {
      setActingOn(null);
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="mt-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setPage(1);
          setSearch(queryInput);
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <input
          type="search"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="Ism yoki telefon raqami..."
          className="min-w-48 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm"
        />
        <select
          value={banned}
          onChange={(e) => {
            setLoading(true);
            setBanned(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="">Barchasi</option>
          <option value="false">Faqat faollar</option>
          <option value="true">Faqat bloklanganlar</option>
        </select>
        <button
          type="submit"
          className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Qidirish
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-ink-soft">Yuklanmoqda...</p>
      ) : !data || data.items.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">Foydalanuvchi topilmadi.</p>
      ) : (
        <>
          <p className="mt-4 text-xs text-ink-soft">Jami: {data.total}</p>
          <ul className="mt-2 flex flex-col gap-3">
            {data.items.map((user) => (
              <li
                key={user.id}
                className="rounded-xl border border-border bg-white p-4"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <Link
                    href={`/sellers/${user.id}`}
                    className="text-sm font-medium text-ink hover:underline"
                  >
                    {user.name}
                  </Link>
                  {user.role === "ADMIN" && (
                    <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-medium text-brand-dark">
                      ADMIN
                    </span>
                  )}
                  {user.bannedAt && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
                      Bloklangan
                    </span>
                  )}
                </div>

                <p className="mt-0.5 text-xs text-ink-soft">
                  {user.phone} · {user._count.listings} eʼlon ·{" "}
                  {user.ratingCount > 0
                    ? `${user.ratingAvg.toFixed(1)} ★ (${user.ratingCount})`
                    : "bahosiz"}{" "}
                  · {formatDate(user.createdAt)} dan beri
                </p>

                {user.bannedAt && user.banReason && (
                  <p className="mt-1 text-xs text-red-700">
                    Sabab: {user.banReason}
                  </p>
                )}

                {user.role !== "ADMIN" && (
                  <div className="mt-3">
                    {user.bannedAt ? (
                      <button
                        type="button"
                        disabled={actingOn === user.id}
                        onClick={() => void unban(user.id)}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-brand hover:text-brand-dark disabled:opacity-50"
                      >
                        Blokdan chiqarish
                      </button>
                    ) : banningId === user.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          void ban(user.id);
                        }}
                        className="flex flex-col gap-2"
                      >
                        <input
                          required
                          autoFocus
                          maxLength={300}
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          placeholder="Blok sababi"
                          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                        />
                        <p className="text-xs text-ink-soft">
                          Bloklansa, bu foydalanuvchining barcha faol eʼlonlari
                          ham yashiriladi.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={actingOn === user.id}
                            className="rounded-full bg-status-sold px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                          >
                            Tasdiqlash
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBanningId(null);
                              setBanReason("");
                            }}
                            className="text-xs text-ink-soft underline hover:text-ink"
                          >
                            Bekor qilish
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setBanningId(user.id);
                          setBanReason("");
                        }}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-red-300 hover:text-red-700"
                      >
                        Bloklash
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setLoading(true);
                  setPage((p) => p - 1);
                }}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-ink-soft disabled:opacity-40"
              >
                Oldingi
              </button>
              <span className="text-xs text-ink-soft">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => {
                  setLoading(true);
                  setPage((p) => p + 1);
                }}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-ink-soft disabled:opacity-40"
              >
                Keyingi
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
