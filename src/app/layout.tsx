import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "GigaFlow — Milestone-Based Escrow & Cryptographic Dispute Marketplace",
  description: "Academic Mini-Project (Team 07, Theme 01) at KLE Technological University. Engineered with Next.js 15, Prisma ORM, PostgreSQL, double-entry accounting, and Merkle Evidence Trees.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
