"use client";

import { useEffect, useState } from "react";
import { apiFetch, authHeaders, getAccessToken } from "@/lib/api";
import AdminReports from "@/components/admin-reports";
import AdminListings from "@/components/admin-listings";
import AdminUsers from "@/components/admin-users";

type Status = "loading" | "unauthorized" | "ready";
type Tab = "reports" | "listings" | "users";

const TABS: { id: Tab; label: string }[] = [
  { id: "reports", label: "Shikoyatlar" },
  { id: "listings", label: "Eʼlonlar" },
  { id: "users", label: "Foydalanuvchilar" },
];

export default function AdminPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [tab, setTab] = useState<Tab>("reports");

  useEffect(() => {
    async function load() {
      if (!getAccessToken()) {
        setStatus("unauthorized");
        return;
      }
      try {
        // The API enforces the ADMIN role on every /admin route; this check
        // only decides what to render.
        const me = await apiFetch<{ role: string }>("/users/me", {
          headers: authHeaders(),
        });
        setStatus(me.role === "ADMIN" ? "ready" : "unauthorized");
      } catch {
        setStatus("unauthorized");
      }
    }
    void load();
  }, []);

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
      <h1 className="font-serif text-2xl text-ink">Boshqaruv paneli</h1>

      <div className="mt-5 flex gap-2 border-b border-border">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === id
                ? "border-brand text-brand-dark"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "reports" && <AdminReports />}
      {tab === "listings" && <AdminListings />}
      {tab === "users" && <AdminUsers />}
    </div>
  );
}
