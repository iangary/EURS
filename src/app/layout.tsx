import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { getLocale, getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = getT();
  return {
    title: t("brand.title"),
    description: t("brand.description"),
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  const htmlLang = locale === "en" ? "en" : "zh-Hant";
  return (
    <html lang={htmlLang}>
      <body className="min-h-screen font-sans">
        <Providers initialLocale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
