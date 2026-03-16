import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HaulYeah LoadCalc",
  description: "Dump truck haul and material calculator",
  applicationName: "HaulYeah LoadCalc",
  icons: {
    icon: "/haulyeah-icon.png",
    shortcut: "/haulyeah-icon.png",
    apple: "/haulyeah-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="HaulYeah LoadCalc" />
        <meta name="theme-color" content="#f97316" />
      </head>
      <body>{children}</body>
    </html>
  );
}