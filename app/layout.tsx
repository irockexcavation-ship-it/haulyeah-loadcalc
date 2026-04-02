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
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-QLWJS9V77L"></script>
<script
  dangerouslySetInnerHTML={{
    __html: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-QLWJS9V77L');
    `,
  }}
/>
      </head>
      <body>{children}</body>
    </html>
  );
}