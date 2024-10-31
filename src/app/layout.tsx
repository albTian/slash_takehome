import { Metadata } from "next";
// Import your global CSS files here
import "./globals.css"; // If you have a globals.css file
// If you're using Tailwind, make sure to import it
// import "tailwind.css"; // or whatever your Tailwind import path is

export const metadata: Metadata = {
  title: "Transaction Dashboard | Slash",
  description: "View and manage your transaction history with Slash",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
