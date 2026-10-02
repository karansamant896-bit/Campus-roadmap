import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus Roadmap — Syllabus to YouTube",
  description: "A cinematic syllabus-to-YouTube roadmap for college exam preparation.",
  icons: {
    icon: "/assets/favicon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
