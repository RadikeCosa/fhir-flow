"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  buildBreadcrumbs,
  BreadcrumbItem,
} from "@/lib/breadcrumbs/breadcrumbs";

export interface BreadcrumbsProps {
  patientName?: string;
}

export default function Breadcrumbs({
  patientName,
}: BreadcrumbsProps): React.JSX.Element {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname, patientName);

  return (
    <nav aria-label="Navegación de ubicación">
      <ol role="list" className="flex items-center gap-1 text-sm flex-wrap">
        {crumbs.map((crumb: BreadcrumbItem, index: number) => {
          const isLast = index === crumbs.length - 1;
          const content =
            crumb.href && !crumb.current ? (
              <Link
                href={crumb.href}
                className="text-muted hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className="text-foreground font-medium"
                aria-current={crumb.current ? "page" : undefined}
              >
                {crumb.label}
              </span>
            );

          return (
            <li
              key={`${crumb.label}-${index}`}
              className="flex items-center gap-1"
            >
              {content}
              {!isLast ? (
                <span aria-hidden="true" className="text-muted select-none">
                  ›
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
