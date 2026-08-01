import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Uzbek Latin (oʻ, gʻ) lives in the standard latin set; Russian needs cyrillic explicitly.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

const DESCRIPTION =
  "Kitobchi orqali kerakli kitobingizni toping yoki oʻqib boʻlgan kitobingizni soting, hadya qiling.";

export const metadata: Metadata = {
  // Lets every page below use relative canonical and Open Graph URLs.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kitobchi — ishlatilgan kitoblar bozori",
    // Pages set only their own title; the brand is appended here so it
    // isn't repeated in every generateMetadata.
    template: "%s — Kitobchi",
  },
  description: DESCRIPTION,
  openGraph: {
    siteName: "Kitobchi",
    locale: "uz_UZ",
    type: "website",
    title: "Kitobchi — ishlatilgan kitoblar bozori",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uz"
      className={`${inter.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
