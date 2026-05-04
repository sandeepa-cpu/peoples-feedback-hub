import "./globals.css";

import type { Metadata } from "next";
import { Cormorant_Garamond, Noto_Sans_Sinhala } from "next/font/google";
import type { ReactNode } from "react";

const peoplesBakersDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-peoples-bakers",
  weight: ["500", "600", "700"],
  display: "swap",
});

const notoSansSinhala = Noto_Sans_Sinhala({
  subsets: ["latin", "sinhala"],
  variable: "--font-noto-sinhala",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Peoples Bakers | Customer Feedback",
  description:
    "Share feedback with Peoples Bakers—your name, rating, and message help us serve you better.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${peoplesBakersDisplay.variable} ${notoSansSinhala.variable}`}
    >
      <body
        className={`${notoSansSinhala.className} min-h-screen bg-stone-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
