import Link from "next/link";
import HeaderAuth from "@/components/header-auth";
import MessagesLink from "@/components/messages-link";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="font-serif text-xl font-medium tracking-tight text-brand-dark"
        >
          Kitobchi
        </Link>

        <form
          action="/search"
          className="ml-2 hidden flex-1 items-center sm:flex"
        >
          <input
            type="search"
            name="q"
            placeholder="Kitob yoki muallif qidiring..."
            className="w-full rounded-full border border-border bg-white px-4 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-brand focus:outline-none"
          />
        </form>

        <nav className="ml-auto flex items-center gap-3 text-sm">
          <Link
            href="/search"
            className="text-ink-soft hover:text-ink sm:hidden"
          >
            Qidirish
          </Link>
          <Link
            href="/favorites"
            className="hidden text-ink-soft hover:text-ink sm:inline"
          >
            Sevimlilar
          </Link>
          <MessagesLink />
          <Link
            href="/listings/new"
            className="rounded-full bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark"
          >
            Eʼlon joylash
          </Link>
          <HeaderAuth />
        </nav>
      </div>
    </header>
  );
}
