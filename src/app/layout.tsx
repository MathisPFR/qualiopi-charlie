import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Qualiopi Charlie — POC",
  description: "Automatisation administrative des formations Qualiopi",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
