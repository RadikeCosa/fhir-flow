import Link from "next/link";
import NavLinks from "./NavLinks";
import HamburgerMenu from "./HamburgerMenu";
import type React from "react";

export default function Header(): React.JSX.Element {
  const links = [{ href: "/patients", label: "Pacientes" }];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface border-b border-border shadow-sm h-14 md:h-16">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-full">
        <Link href="/" className="font-semibold text-foreground">
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
