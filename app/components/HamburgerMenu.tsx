"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type React from "react";
import type { NavLink } from "@/config/navigation";

type HamburgerMenuProps = {
  links: NavLink[];
};

export default function HamburgerMenu({
  links,
}: HamburgerMenuProps): React.JSX.Element {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  return (
    <div className="flex md:hidden relative">
      <button
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label="Toggle menu"
        className="p-2"
      >
        <div className="flex flex-col gap-y-1">
          <span className="w-5 h-px bg-foreground block" />
          <span className="w-5 h-px bg-foreground block" />
          <span className="w-5 h-px bg-foreground block" />
        </div>
      </button>

      {open && (
        <nav
          id="mobile-menu"
          role="navigation"
          aria-label="Menú móvil"
          className="absolute top-full right-0 min-w-40 bg-surface border border-border shadow-md rounded-md py-2 z-50"
        >
          {links.map((l) => {
            const isActive = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block px-4 py-2 ${
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
