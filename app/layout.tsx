import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IBDP Portal | DPS R.K. Puram",
  description: "Daily class notes, homework, and attendance follow-up"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
