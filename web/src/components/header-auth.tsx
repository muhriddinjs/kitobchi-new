"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, authHeaders, getAccessToken } from "@/lib/api";

interface Me {
  id: string;
  name: string;
  role: string;
}

export default function HeaderAuth() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      if (!getAccessToken()) {
        setChecked(true);
        return;
      }
      try {
        const user = await apiFetch<Me>("/users/me", {
          headers: authHeaders(),
        });
        setMe(user);
      } catch {
        setMe(null);
      } finally {
        setChecked(true);
      }
    }
    void load();
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function logout() {
    localStorage.removeItem("kitobchi_access_token");
    localStorage.removeItem("kitobchi_refresh_token");
    setMe(null);
    setOpen(false);
    router.push("/");
  }

  if (!checked) return null;

  if (!me) {
    return (
      <Link href="/login" className="hidden text-ink-soft hover:text-ink sm:inline">
        Kirish
      </Link>
    );
  }

  const initial = /[a-zA-ZЀ-ӿ]/.test(me.name.charAt(0))
    ? me.name.charAt(0).toUpperCase()
    : "";

  return (
    <div ref={menuRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-ink hover:border-brand"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-medium text-brand-dark">
          {initial}
        </span>
        Profilim
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-border bg-white p-1 shadow-md">
          <Link
            href={`/sellers/${me.id}`}
            onClick={() => setOpen(false)}
            className="block rounded-md px-3 py-2 text-sm text-ink hover:bg-paper-muted"
          >
            Profil
          </Link>
          {me.role === "ADMIN" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm text-ink hover:bg-paper-muted"
            >
              Shikoyatlar
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-700 hover:bg-paper-muted"
          >
            Chiqish
          </button>
        </div>
      )}
    </div>
  );
}
