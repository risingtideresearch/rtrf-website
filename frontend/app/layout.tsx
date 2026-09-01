// must stay above every other import: Turbopack's production build orders CSS
// chunks by module-graph traversal, so any JS import listed first pulls in the
// component tree's CSS modules and emits them *before* globals
import "./globals.scss";

import type { Metadata } from "next";
import { AcuminPro } from "./_fonts";
import { SanityLive } from "@/sanity/lib/live";
import { SITE_URL } from "@/app/consts";

export const metadata: Metadata = {
  title: "Solander 38 | Rising Tide Research Foundation",
  description:
    "A self-sufficient, solar-electric, coastal cruising power catamaran.",
  icons: `${SITE_URL}/rising-tide.svg`,
  openGraph: {
    images: [
      {
        url: `https://cdn.sanity.io/images/qjczz6gi/production/5d507d27f9b7a0f0cd351429c559057b92b7c23e-1200x630.png`,
        width: 1200,
        height: 630,
        alt: `Solander 38`,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={AcuminPro.variable}>
      <body>
        {children}
        {process.env.NEXT_PUBLIC_PREVIEW_SITE === "true" && <SanityLive />}
      </body>
    </html>
  );
}
