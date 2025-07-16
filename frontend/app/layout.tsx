import type { Metadata } from "next";
import Link from "next/link";
import { DepartureMono, GeistSans } from "./_fonts";

import "./globals.css";

export const metadata: Metadata = {
  title: "Rising Tide Research Foundation",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${DepartureMono.variable}`}>
        <header
          style={{
            position: "fixed",
            width: "100%",
            padding: "0.5rem",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href={"/"}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <svg
              className="logo"
              stroke="darkgreen"
              fill="none"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M3 17h13.4a3 3 0 0 0 2.5 -1.34l3.1 -4.66h0h-6.23a4 4 0 0 0 -1.49 .29l-3.56 1.42a4 4 0 0 1 -1.49 .29h-3.73h0h-1l-1.5 4z"></path>
              <path d="M6 13l1.5 -5"></path>
              <path d="M6 8h8l2 3"></path>
            </svg>
            <h1
              className={'uppercase-mono'}
              style={{
                fontSize: "1rem",
                color: "darkgreen",
              }}
            >
              Solander 38
            </h1>
          </Link>
          <div style={{ display: 'inline-flex', flexDirection: 'row', gap: '1rem'}}>
            <Link href="/part">Parts</Link>
            <Link href="/anatomy">Anatomy</Link>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
