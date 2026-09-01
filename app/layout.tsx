import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://lighttable.greenshoegarage.chatgpt.site"),
  title: "LIGHTTABLE | PCB Manufacturing Data Workbench",
  description:
    "A local-first Field Instrument for reading, inspecting, marking up, lightly editing, and re-exporting PCB manufacturing data.",
  applicationName: "LIGHTTABLE",
  other: {
    "codex-preview": "development",
  },
  keywords: [
    "Gerber viewer",
    "PCB inspection",
    "Excellon",
    "KiCad",
    "manufacturing data",
  ],
  openGraph: {
    type: "website",
    title: "LIGHTTABLE | PCB Manufacturing Data Workbench",
    description:
      "Inspect, measure, mark up, lightly edit, and re-export PCB manufacturing data locally in your browser.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "LIGHTTABLE PCB manufacturing data workbench",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LIGHTTABLE | PCB Manufacturing Data Workbench",
    description:
      "Inspect, measure, mark up, lightly edit, and re-export PCB manufacturing data locally in your browser.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
