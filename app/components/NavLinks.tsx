"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";

type LinkItem = {
  href: string;
  label: string;
};

export default function NavLinks({
  links,
}: {
  links: LinkItem[];
}): React.JSX.Element {
  const pathname = usePathname() || "/";

  return (
    <nav className="hidden md:flex gap-6">
      {links.map((l) => {
        const isActive = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`transition-colors duration-150 ${
              isActive
                ? "text-[var(--color-primary)] font-semibold"
                : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
