import type { Metadata } from "next";

import "./../globals.scss";
import Search from "./../components/Search/Search";
import Footer from "../components/Footer";
import { AcuminPro } from "../_fonts";
import { SITE_URL } from "@/app/consts";

export const metadata: Metadata = {
  title: "Photos | Solander 38",
  description: "",
  icons: `${SITE_URL}/rising-tide.svg`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={AcuminPro.variable}>
        <Search />
        {children}
        <Footer />
      </body>
    </html>
  );
}
