import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Rubicon | Let AI agents pay to read your work",
  description:
    "Publish premium articles, choose a price per word, and earn whenever an AI agent reads. Every word is paid, and agents can stop as soon as they have enough information.",
  icons: {
    icon: "/rubicon-new.png",
    apple: "/rubicon-new.png",
  },
  other: {
    "talentapp:project_verification":
      "ddf155a996a3d9a7ad4e932f705ec157a9cfd9bccfe1fe27682a973365a76570b58c5adc376dbe7cd35abebe8d71f03f23fa97c43752c7d1c7d4ab350a7f779f",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <script
          // Apply the saved color theme before paint to avoid a flash. Defaults
          // to "system" (follows prefers-color-scheme).
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=localStorage.getItem('theme')||'system';var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(_){}})();`,
          }}
        />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
