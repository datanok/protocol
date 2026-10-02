import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/components/Providers";
import { Toaster } from "sonner";

// Fonts are self-hosted (latin subset, sourced from Google Fonts) so builds
// don't depend on fetching from fonts.googleapis.com.
const publicSans = localFont({
  variable: "--font-sans",
  src: "./fonts/PublicSans-Variable-latin.woff2",
  weight: "400 600",
  style: "normal",
  display: "swap",
});

const spaceMono = localFont({
  variable: "--font-mono",
  src: [
    {
      path: "./fonts/SpaceMono-Regular-latin.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/SpaceMono-Bold-latin.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
});

const lora = localFont({
  variable: "--font-serif-display",
  src: [
    {
      path: "./fonts/Lora-Variable-latin.woff2",
      weight: "400 600",
      style: "normal",
    },
    {
      path: "./fonts/Lora-Italic-Variable-latin.woff2",
      weight: "400 600",
      style: "italic",
    },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Protocol",
  description: "Personal life OS — track, build, stay consistent.",
};

const themeBootstrapScript = `
(() => {
  try {
    const dark = localStorage.getItem('protocol-dark') === 'true';
    const accent = localStorage.getItem('protocol-accent') || 'vermillion';
    const root = document.documentElement;
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    root.setAttribute('data-accent', accent);
  } catch {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'light');
    root.setAttribute('data-accent', 'vermillion');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body
        className={`${publicSans.variable} ${spaceMono.variable} ${lora.variable} antialiased min-h-screen`}
        style={{
          background: "var(--protocol-surface)",
          color: "var(--protocol-ink)",
        }}
      >
        <Providers>{children}</Providers>

        <Toaster
          toastOptions={{
            style: {
              background: "var(--protocol-surface)",
              border: "1px solid var(--protocol-rule)",
              color: "var(--protocol-ink)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              borderRadius: "0px",
            },
          }}
        />
      </body>
    </html>
  );
}
