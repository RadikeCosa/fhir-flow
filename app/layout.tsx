import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

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
    <html lang="es">
      <body
        className="text-base antialiased"
      >
        <Header />
        <main id="main-content" className="pt-14 md:pt-16 min-h-screen">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
            {children}
          </div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
