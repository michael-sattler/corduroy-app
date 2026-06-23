import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corduroy — Staff Console",
  description: "Corduroy staff dashboard",
};

export default function StaffLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
