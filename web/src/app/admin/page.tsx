"use client";

import { useEffect, useState } from "react";
import { apiFetch, authHeaders, getAccessToken } from "@/lib/api";

interface AdminReport {
  id: string;
  reason: string;
  createdAt: string;
  reporter: { id: string; name: string; phone: string };
  listing: {
    id: string;
    city: string;
    book: { title: string };
    seller: { id: string; name: string };
  };
}

type Status = "loading" | "unauthorized" | "ready";

export default function AdminPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!getAccessToken()) {
        setStatus("unauthorized");
        return;
      }
      try {
        const me = await apiFetch<{ role: string }>("/users/me", {
          headers: authHeaders(),
        });
        if (me.role !== "ADMIN") {
          setStatus("unauthorized");
          return;
        }
        const openReports = await apiFetch<AdminReport[]>("/admin/reports", {
          headers: authHeaders(),
        });
        setReports(openReports);
        setStatus("ready");
      } catch {
        setStatus("unauthorized");
      }
    }
    void load();
  }, []);

  async function act(id: string, action: "resolve" | "dismiss") {
    setActingOn(id);
    setError(null);
    try {
      await apiFetch(`/admin/reports/${id}/${action}`, {
        method: "POST",
        headers: authHeaders(),
      });
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Amalni bajarib boʻlmadi. Qayta urinib koʻring.");
    } finally {
      setActingOn(null);
    }
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-ink-soft sm:px-6">
        Yuklanmoqda...
      </div>
    );
  }

  if (status === "unauthorized") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-serif text-xl text-ink">Ruxsat yoʻq</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Bu sahifa faqat administratorlar uchun.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-serif text-2xl text-ink">Shikoyatlar</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Hozircha koʻrib chiqilmagan shikoyatlar roʻyxati.
      </p>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      {reports.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">
          Hozircha ochiq shikoyatlar yoʻq.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {reports.map((report) => (
            <li
              key={report.id}
              className="rounded-xl border border-border bg-white p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-serif text-base text-ink">
                    {report.listing.book.title}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    Sotuvchi: {report.listing.seller.name} ·{" "}
                    {report.listing.city}
                  </p>
                  <p className="mt-2 text-sm text-ink">{report.reason}</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    Shikoyatchi: {report.reporter.name} (
                    {report.reporter.phone})
                  </p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={actingOn === report.id}
                  onClick={() => act(report.id, "resolve")}
                  className="rounded-full bg-status-sold px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  Yashirish
                </button>
                <button
                  type="button"
                  disabled={actingOn === report.id}
                  onClick={() => act(report.id, "dismiss")}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-brand hover:text-brand-dark disabled:opacity-50"
                >
                  Rad etish
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
