import type { Metadata } from "next";
import { Public_Sans, Space_Mono, Lora } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { Toaster } from "sonner";

const publicSans = Public_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const lora = Lora({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
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
