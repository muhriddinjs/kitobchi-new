"use client";

import { useState } from "react";
import { ApiError, apiFetch, storeTokens } from "@/lib/api";
import { safeNextPath } from "@/lib/auth-redirect";

type Step = "phone" | "otp";

// Accept "+998 90 123-45-67", "90 123 45 67" etc. and send the API the
// canonical +998XXXXXXXXX form it validates against.
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("998")) return `+${digits}`;
  return `+998${digits}`;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError && err.message ? err.message : fallback;
}

export default function LoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+998");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ phone: normalizePhone(phone) }),
      });
      setStep("otp");
    } catch (err) {
      setError(
        errorMessage(err, "SMS yuborilmadi. Telefon raqamni tekshiring."),
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ accessToken: string; refreshToken: string }>(
        "/auth/verify-otp",
        {
          method: "POST",
          body: JSON.stringify({ phone: normalizePhone(phone), code }),
        },
      );
      storeTokens(res.accessToken, res.refreshToken);
      // Back to whatever sent them here, so a half-filled listing form isn't
      // a dead end. Read at click time rather than with useSearchParams,
      // which would force this prerendered page to render on the client.
      const next = safeNextPath(
        new URLSearchParams(window.location.search).get("next"),
      );
      // Full reload so the header picks up the logged-in state.
      window.location.assign(next);
    } catch (err) {
      setError(errorMessage(err, "Kod notoʻgʻri yoki muddati oʻtgan."));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-16 sm:px-6">
      <h1 className="font-serif text-2xl text-ink">Kitobchiga xush kelibsiz</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Telefon raqamingiz orqali kiring — SMS kod yuboramiz.
      </p>

      {step === "phone" && (
        <form onSubmit={requestOtp} className="mt-6 flex flex-col gap-3">
          <label className="text-xs font-medium text-ink-soft">
            Telefon raqami
          </label>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 90 123 45 67"
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm"
          />
          {error && <p className="text-xs text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "Yuborilmoqda..." : "SMS kod olish"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={verifyOtp} className="mt-6 flex flex-col gap-3">
          <label className="text-xs font-medium text-ink-soft">
            {normalizePhone(phone)} raqamiga yuborilgan kod
          </label>
          <input
            required
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm tracking-widest"
          />
          {error && <p className="text-xs text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "Tekshirilmoqda..." : "Tasdiqlash"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
              setError(null);
            }}
            className="text-xs text-ink-soft underline hover:text-ink"
          >
            Raqamni oʻzgartirish
          </button>
        </form>
      )}
    </div>
  );
}
