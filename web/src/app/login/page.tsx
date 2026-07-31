"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
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
        body: JSON.stringify({ phone }),
      });
      setStep("otp");
    } catch {
      setError("SMS yuborilmadi. Telefon raqamni tekshiring.");
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
          body: JSON.stringify({ phone, code }),
        },
      );
      localStorage.setItem("kitobchi_access_token", res.accessToken);
      localStorage.setItem("kitobchi_refresh_token", res.refreshToken);
      router.push("/");
    } catch {
      setError("Kod notoʻgʻri yoki muddati oʻtgan.");
    } finally {
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
            {phone} raqamiga yuborilgan kod
          </label>
          <input
            required
            type="text"
            inputMode="numeric"
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
            onClick={() => setStep("phone")}
            className="text-xs text-ink-soft underline hover:text-ink"
          >
            Raqamni oʻzgartirish
          </button>
        </form>
      )}
    </div>
  );
}
