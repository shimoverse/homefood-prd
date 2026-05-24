import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LocalPlate - Foodie Agent",
  description: "WhatsApp-first buyer concierge and Pantry inventory agent for local home food discovery."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
