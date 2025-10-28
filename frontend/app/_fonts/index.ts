
import localFont from "next/font/local";
import { Geist, Averia_Libre } from "next/font/google";

export const DepartureMono = localFont({
  src: "./DepartureMono-1.500.woff2",
  variable: "--font-departure-mono",
});

export const GeistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const AveriaLibre = Averia_Libre({
  variable: "--font-averia-serif",
  style: 'normal',
  weight: '400'
});
