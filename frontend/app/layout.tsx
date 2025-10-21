import type { Metadata } from "next";
import { DepartureMono, GeistSans } from "./_fonts";

import "./globals.scss";
import Search from "./components/Search/Search";

export const metadata: Metadata = {
  title: "Rising Tide Research Foundation",
  description: "",
  icons: "/rising-tide.svg"
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
        <Search />
      </body>
    </html>
  );
}
