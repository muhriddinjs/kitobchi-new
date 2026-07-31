"use client";

import { useState } from "react";
import { apiFetch, authHeaders } from "@/lib/api";
import type { Book } from "@/lib/types";

type Step = "isbn" | "details";

export default function NewListingPage() {
  const [step, setStep] = useState<Step>("isbn");
  const [isbn, setIsbn] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [book, setBook] = useState<Partial<Book>>({});

  const [type, setType] = useState<"SALE" | "DONATION">("SALE");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("GOOD");
  const [city, setCity] = useState("Toshkent");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleIsbnLookup() {
    setLookingUp(true);
    setLookupError(null);
    try {
      const found = await apiFetch<Book>(
        `/books/lookup?isbn=${encodeURIComponent(isbn)}`,
      );
      setBook(found);
    } catch {
      setLookupError(
        "Kitob avtomatik topilmadi. Maʼlumotlarni qoʻlda kiriting.",
      );
      setBook({ isbn, title: "", authors: [] });
    } finally {
      setLookingUp(false);
      setStep("details");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiFetch("/listings", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          book,
          type,
          price: type === "DONATION" ? null : Number(price) || null,
          condition,
          city,
          description,
        }),
      });
      setSubmitted(true);
    } catch {
      setSubmitError(
        "Eʼlonni saqlab boʻlmadi. Tizimga kirganingizni tekshirib, qayta urinib koʻring.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-serif text-2xl text-ink">Eʼlon joylandi</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Eʼloningiz moderatsiyadan oʻtgach koʻrinadi.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <h1 className="font-serif text-2xl text-ink">Yangi eʼlon joylash</h1>

      {step === "isbn" && (
        <div className="mt-6 rounded-xl border border-border bg-white p-5">
          <label className="text-sm font-medium text-ink">
            ISBN raqami
          </label>
          <p className="mt-1 text-xs text-ink-soft">
            Kitob orqa muqovasidagi shtrix-kod ostidagi raqam. Topilsa,
            sarlavha va muallif avtomatik toʻldiriladi.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="978-..."
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={!isbn || lookingUp}
              onClick={handleIsbnLookup}
              className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {lookingUp ? "Qidirilmoqda..." : "Qidirish"}
            </button>
          </div>
          {lookupError && (
            <p className="mt-2 text-xs text-amber-700">{lookupError}</p>
          )}
          <button
            type="button"
            onClick={() => {
              setBook({ isbn: "", title: "", authors: [] });
              setStep("details");
            }}
            className="mt-3 text-xs text-ink-soft underline hover:text-ink"
          >
            ISBN yoʻq, qoʻlda kiritaman
          </button>
        </div>
      )}

      {step === "details" && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-4 rounded-xl border border-border bg-white p-5"
        >
          <div>
            <label className="text-xs font-medium text-ink-soft">
              Sarlavha
            </label>
            <input
              required
              type="text"
              value={book.title ?? ""}
              onChange={(e) => setBook({ ...book, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-ink-soft">
              Muallif(lar)
            </label>
            <input
              type="text"
              value={book.authors?.join(", ") ?? ""}
              onChange={(e) =>
                setBook({
                  ...book,
                  authors: e.target.value
                    .split(",")
                    .map((a) => a.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Vergul bilan ajrating"
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-ink-soft">
                Turi
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "SALE" | "DONATION")}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              >
                <option value="SALE">Sotiladi</option>
                <option value="DONATION">Hadya</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-soft">
                Holati
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              >
                <option value="NEW">Yangidek</option>
                <option value="GOOD">Yaxshi</option>
                <option value="FAIR">Oʻrtacha</option>
                <option value="WORN">Eskirgan</option>
              </select>
            </div>
          </div>

          {type === "SALE" && (
            <div>
              <label className="text-xs font-medium text-ink-soft">
                Narxi (soʻm)
              </label>
              <input
                required
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-ink-soft">
              Shahar
            </label>
            <input
              required
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-ink-soft">
              Tavsif
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
            />
          </div>

          <p className="text-xs text-ink-soft">
            Rasm yuklash keyingi bosqichda ushbu forma orqali qoʻshiladi.
          </p>

          {submitError && (
            <p className="text-xs text-red-700">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {submitting ? "Saqlanmoqda..." : "Eʼlonni joylash"}
          </button>
        </form>
      )}
    </div>
  );
}
