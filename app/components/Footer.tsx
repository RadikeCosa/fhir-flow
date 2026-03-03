import type React from "react";

export default function Footer(): React.JSX.Element {
  return (
    <footer
      role="contentinfo"
      className="border-t border-border py-4 md:py-6 text-center"
    >
      <p className="text-sm text-muted">
        FhirFlow · FHIR R4 · Proyecto de aprendizaje
      </p>
    </footer>
  );
}
