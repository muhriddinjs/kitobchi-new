"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, apiFetch, authHeaders, getAccessToken } from "@/lib/api";

interface Me {
  id: string;
  name: string;
  phone: string;
  telegramUsername: string | null;
}

type Status = "loading" | "unauthorized" | "ready";

export default function SettingsPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!getAccessToken()) {
        setStatus("unauthorized");
        return;
      }
      try {
        const me = await apiFetch<Me>("/users/me", { headers: authHeaders() });
        setName(me.name);
        setPhone(me.phone);
        setTelegram(me.telegramUsername ?? "");
        setStatus("ready");
      } catch {
        setStatus("unauthorized");
      }
    }
    void load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await apiFetch("/users/me", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          // Store without the @ prefix; links are built as t.me/<username>.
          telegramUsername: telegram.trim().replace(/^@/, "") || null,
        }),
      });
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiError && err.message
          ? err.message
          : "Saqlab boʻlmadi. Qayta urinib koʻring.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-ink-soft sm:px-6">
        Yuklanmoqda...
      </div>
    );
  }

  if (status === "unauthorized") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
        <h1 className="font-serif text-xl text-ink">Tizimga kiring</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Sozlamalarni koʻrish uchun{" "}
          <Link href="/login" className="underline hover:text-ink">
            tizimga kiring
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <h1 className="font-serif text-2xl text-ink">Profil sozlamalari</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Bu maʼlumotlar eʼlonlaringizda xaridorlarga koʻrinadi.
      </p>

      <form
        onSubmit={save}
        className="mt-6 flex flex-col gap-4 rounded-xl border border-border bg-white p-5"
      >
        <div>
          <label className="text-xs font-medium text-ink-soft">Ism</label>
          <input
            required
            type="text"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-ink-soft">
            Telefon raqami
          </label>
          <input
            type="tel"
            value={phone}
            disabled
            className="mt-1 w-full rounded-lg border border-border bg-paper-muted px-3 py-2 text-sm text-ink-soft"
          />
          <p className="mt-1 text-xs text-ink-soft">
            Telefon raqami login uchun ishlatiladi va oʻzgartirilmaydi.
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-ink-soft">
            Telegram username (ixtiyoriy)
          </label>
          <input
            type="text"
            value={telegram}
            maxLength={32}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="@username"
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-ink-soft">
            Kiritsangiz, xaridorlar sizga Telegram orqali yoza oladi.
          </p>
        </div>

        {error && <p className="text-xs text-red-700">{error}</p>}
        {saved && <p className="text-xs text-brand-dark">Saqlandi ✓</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </form>
    </div>
  );
}
