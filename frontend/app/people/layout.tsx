import type { Metadata } from "next";

import Navigation, { URLS } from "../components/Navigation/Navigation";
import Search from "./../components/Search/Search";
import Footer from "../components/Footer";
import { AcuminPro } from "../_fonts";
import { SITE_URL } from "@/app/consts";
// import Search from "./components/Search/Search";

export const metadata: Metadata = {
  title: "People | Solander 38",
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
        <Navigation active={URLS.PEOPLE} type={'top-bar'} />
        <Search />
        {children}
        <Footer />
      </body>
    </html>
  );
}
