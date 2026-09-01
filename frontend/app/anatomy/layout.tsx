import type { Metadata } from "next";

import "./../globals.scss";
import Search from "./../components/Search/Search";
import { AcuminPro } from "../_fonts";
import { SITE_URL } from "@/app/consts";

export const metadata: Metadata = {
  title: "Anatomy | Solander 38",
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
        <Search type="float" />
        {children}
      </body>
    </html>
  );
}
