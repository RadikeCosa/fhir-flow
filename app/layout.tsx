import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fhir Flow",
  description:
    "Proyecto de aprendizaje sobre interoperabilidad en salud: Implementación de un cliente web para la gestión de pacientes bajo el estándar FHIR R4, conectado a un servidor local HAPI mediante Docker.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} text-base antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
