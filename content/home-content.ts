import type {
  FhirExplanationContent,
  HeroContent,
} from "./home-content.types";

export const heroContent: HeroContent = {
  title: "FHIR Flow",
  subtitle: "Healthcare learning lab built with FHIR R4 and clean architecture.",
  description:
    "This project models a home healthcare workflow where professionals perform patient visits and record clinical data such as vital signs, assessments and procedures.",
  badges: ["Next.js", "TypeScript", "FHIR R4", "Zod", "Clean Architecture"],
  primaryButton: {
    label: "Explore patients",
    href: "/patients",
  },
  secondaryButton: {
    label: "View architecture",
    href: "/docs",
  },
};

export const fhirExplanationContent: FhirExplanationContent = {
  title: "What is FHIR and how this project uses it",
  sections: [
    {
      title: "FHIR in simple terms",
      description:
        "FHIR (Fast Healthcare Interoperability Resources) is a healthcare data standard designed to enable different systems to exchange clinical data using structured resources such as Patient, Observation and Encounter.",
    },
    {
      title: "Implementation challenges",
      description:
        "FHIR models are highly normalized and responses often contain many resources. Applications must also deal with large schemas and external system data.",
    },
    {
      title: "How this project approaches it",
      description:
        "This project treats FHIR as an external system. Responses are validated with Zod and mapped into domain models so the UI never depends directly on raw FHIR resources.",
    },
  ],
};
