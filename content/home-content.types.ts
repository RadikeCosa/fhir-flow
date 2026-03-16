export interface HeroButton {
  label: string;
  href: string;
}

export interface HeroContent {
  title: string;
  subtitle: string;
  description: string;
  badges: string[];
  primaryButton: HeroButton;
  secondaryButton: HeroButton;
}

export interface FhirExplanationCard {
  title: string;
  description: string;
}

export interface FhirExplanationContent {
  title: string;
  sections: FhirExplanationCard[];
}
