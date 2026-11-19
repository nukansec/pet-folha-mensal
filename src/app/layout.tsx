import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import "./design-pet-sd.css";
import "./mobile.css";
import { PROGRAM } from "@/config/program";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const title = `${PROGRAM.acronym} ${PROGRAM.campus}: Folha de Frequência Mensal`;
const description = `Registro mensal de frequência e atividades dos participantes do ${PROGRAM.name} (${PROGRAM.acronym}/${PROGRAM.campus}).`;

// Ícones: arquivos especiais em src/app/ (favicon.ico, icon.png, apple-icon.png);
// o Next 16 cria as tags <link> sozinho. A imagem de compartilhamento fica em
// public/ e é declarada aqui para levar texto alternativo (og:image:alt).
// Todos são gerados por scripts/brand/gerar-marca.py.
const shareImage = {
  url: "/images/pet-sd/compartilhamento.png",
  width: 1200,
  height: 630,
  alt: `Logo do ${PROGRAM.name}`,
};
export const metadata: Metadata = {
  metadataBase: new URL(PROGRAM.links.site),
  title,
  description,
  applicationName: `${PROGRAM.acronym} ${PROGRAM.campus}`,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: `${PROGRAM.acronym} ${PROGRAM.campus}`,
    title,
    description,
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [shareImage],
  },
};

import { DialogProvider } from "@/context/DialogContext";
import { Analytics } from "@vercel/analytics/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="light" suppressHydrationWarning>
      <head>
        <Script
          id="pet-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var p = new URLSearchParams(window.location.search);
                  var requested = p.get('theme');
                  var saved = localStorage.getItem('pet_theme');
                  var t = requested === "light" || requested === "dark" ? requested : saved === "dark" ? "dark" : "light";
                  document.documentElement.setAttribute('data-theme', t);
                  if (requested === 'light' || requested === 'dark') localStorage.setItem('pet_theme', t);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <DialogProvider>{children}</DialogProvider>
        <Analytics />
      </body>
    </html>
  );
}
