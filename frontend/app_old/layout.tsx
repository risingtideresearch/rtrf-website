import type { Metadata } from "next";
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
        {children}
      </body>
    </html>
  );
}
