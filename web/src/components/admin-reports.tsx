"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, authHeaders } from "@/lib/api";

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

export default function AdminReports() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const open = await apiFetch<AdminReport[]>("/admin/reports", {
          headers: authHeaders(),
        });
        setReports(open);
      } catch {
        setError("Shikoyatlarni yuklab boʻlmadi.");
      } finally {
        setLoading(false);
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

  if (loading) {
    return <p className="mt-6 text-sm text-ink-soft">Yuklanmoqda...</p>;
  }

  return (
    <div className="mt-6">
      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      {reports.length === 0 ? (
        <p className="text-sm text-ink-soft">Hozircha ochiq shikoyatlar yoʻq.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reports.map((report) => (
            <li
              key={report.id}
              className="rounded-xl border border-border bg-white p-4"
            >
              <Link
                href={`/listings/${report.listing.id}`}
                className="font-serif text-base text-ink hover:underline"
              >
                {report.listing.book.title}
              </Link>
              <p className="mt-0.5 text-xs text-ink-soft">
                Sotuvchi:{" "}
                <Link
                  href={`/sellers/${report.listing.seller.id}`}
                  className="hover:underline"
                >
                  {report.listing.seller.name}
                </Link>{" "}
                · {report.listing.city}
              </p>
              <p className="mt-2 text-sm text-ink">{report.reason}</p>
              <p className="mt-1 text-xs text-ink-soft">
                Shikoyatchi: {report.reporter.name} ({report.reporter.phone})
              </p>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={actingOn === report.id}
                  onClick={() => act(report.id, "resolve")}
                  className="rounded-full bg-status-sold px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  Eʼlonni yashirish
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
