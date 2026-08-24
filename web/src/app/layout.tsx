import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Property Video Pro",
  description: "Turn listing photos into polished property videos with Remotion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
