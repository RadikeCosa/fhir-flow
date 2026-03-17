import type React from "react";
import { fhirExplanationContent } from "@/content/home-content";

export default function FhirExplanationSection(): React.JSX.Element {
  return (
    <section className="w-full py-12 md:py-20 bg-surface">
      <div className="max-w-5xl mx-auto px-4">
        <header className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            {fhirExplanationContent.title}
          </h2>
        </header>

        <div className="mt-8 md:mt-12 grid gap-6 md:grid-cols-3">
          {fhirExplanationContent.sections.map((section) => (
            <article
              key={section.title}
              className="rounded-lg border border-border bg-surface p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold">{section.title}</h3>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                {section.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
