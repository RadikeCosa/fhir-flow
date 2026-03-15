"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  return (
    <div ref={menuRef} className="flex md:hidden relative">
      <button
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label="Toggle menu"
        className="p-2"
      >
        {open ? (
          <X size={20} aria-hidden="true" />
        ) : (
          <Menu size={20} aria-hidden="true" />
        )}
      </button>

      <nav
        id="mobile-menu"
        role="navigation"
        aria-label="Menú móvil"
        aria-hidden={!open}
        className={`absolute top-full right-0 min-w-40 bg-surface border border-border shadow-md rounded-md py-2 z-50 transition-all duration-150 origin-top-right ${
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
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
    </div>
  );
}
