export default function Footer() {
  return (
    <footer className="border-t border-border bg-paper-muted">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-ink-soft sm:px-6">
        <p className="font-serif text-base text-ink">Kitobchi</p>
        <p className="mt-1">
          Ishlatilgan kitoblarni sotish, sotib olish va hadya qilish uchun
          platforma. Toshkent, Oʻzbekiston.
        </p>
        <p className="mt-4 text-xs">
          © {new Date().getFullYear()} Kitobchi. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </footer>
  );
}
