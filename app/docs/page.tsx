import Link from "next/link";
import type React from "react";
import { docsPageContent } from "@/content/docs-content";

export default function DocsPage(): React.JSX.Element {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {docsPageContent.title}
        </h1>
        <p className="text-muted">{docsPageContent.intro}</p>
      </header>

      {docsPageContent.sections.map((section) => (
        <section key={section.title} className="space-y-4">
          <h2 className="text-xl font-semibold border-l-2 border-primary pl-3">
            {section.title}
          </h2>
          <dl>
            {section.items.map((item) => (
              <div
                key={item.label}
                className="py-3 border-b border-border last:border-b-0"
              >
                <dt className="text-sm font-medium text-foreground">
                  {item.label}
                </dt>
                <dd className="mt-0.5 text-sm text-muted">
                  {item.description}
                </dd>
              </div>
            ))}
          </dl>
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
