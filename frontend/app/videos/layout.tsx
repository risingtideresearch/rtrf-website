import type { Metadata } from "next";

import "./../globals.scss";
import Search from "./../components/Search/Search";
import Footer from "../components/Footer";
import { AcuminPro } from "../_fonts";

export const metadata: Metadata = {
  title: "Video | Solander 38",
  description: "",
  icons: "https://solander38.netlify.app/rising-tide.svg",
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
