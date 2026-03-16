import Link from "next/link";
import type React from "react";
import { docsPageContent } from "@/content/docs-content";

export default function DocsPage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {docsPageContent.title}
        </h1>
        <p className="text-muted">{docsPageContent.intro}</p>
      </header>

      {docsPageContent.sections.map((section) => (
        <section key={section.title} className="space-y-4">
          <h2 className="text-xl font-semibold">{section.title}</h2>
          <ul className="list-disc list-inside space-y-2 text-muted">
            {section.items.map((item) => (
              <li key={item.label}>
                <strong>{item.label}</strong>: {item.description}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="pt-6 border-t border-border">
        <Link
          href={docsPageContent.backLinkHref}
          className="text-sm font-medium text-primary hover:underline"
        >
          {docsPageContent.backLinkLabel}
        </Link>
      </div>
    </div>
  );
}
