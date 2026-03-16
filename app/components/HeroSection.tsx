import Link from "next/link";
import type React from "react";
import { heroContent } from "@/content/home-content";

export default function HeroSection(): React.JSX.Element {
  return (
    <section className="w-full py-24">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {heroContent.title}
        </h1>
        <p className="mt-4 text-lg text-muted sm:text-xl">
          {heroContent.subtitle}
        </p>

        <p className="mt-6 max-w-2xl mx-auto text-base leading-relaxed text-muted/90">
          {heroContent.description}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {heroContent.badges.map((tech) => (
            <span
              key={tech}
              className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-muted shadow-sm"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href={heroContent.primaryButton.href}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-primary"
          >
            {heroContent.primaryButton.label}
          </Link>

          <Link
            href={heroContent.secondaryButton.href}
            className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors duration-150 hover:bg-surface/80 focus-visible:outline-2 focus-visible:outline-primary"
          >
            {heroContent.secondaryButton.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
