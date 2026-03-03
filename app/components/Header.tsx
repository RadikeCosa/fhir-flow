import Link from "next/link";
import NavLinks from "./NavLinks";
import HamburgerMenu from "./HamburgerMenu";
import type React from "react";

export default function Header(): React.JSX.Element {
  const links = [{ href: "/patients", label: "Pacientes" }];

  return (
    <header
      role="banner"
      className="fixed top-0 left-0 right-0 z-50 bg-surface border-b border-border shadow-sm h-14 md:h-16"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-surface focus:text-primary focus:rounded-md focus:shadow-md text-sm font-medium"
      >
        Ir al contenido principal
      </a>
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-full">
        <Link
          href="/"
          aria-label="Ir al inicio"
          className="font-semibold text-foreground"
        >
          Fhir Flow
        </Link>

        <div className="flex items-center gap-4">
          <NavLinks links={links} />
          <HamburgerMenu />
        </div>
      </div>
    </header>
  );
}
