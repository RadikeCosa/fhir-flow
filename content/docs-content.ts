import type { DocsPageContent } from "./docs-content.types";

export const docsPageContent: DocsPageContent = {
    title: "Arquitectura",
    intro:
        "Una vista de alto nivel sobre las decisiones de diseño y las capas principales de este proyecto.",
    sections: [
        {
            title: "Capas principales",
            items: [
                {
                    label: "UI",
                    description:
                        "Componentes de React que consumen modelos de dominio y no conocen detalles de FHIR.",
                },
                {
                    label: "Dominio",
                    description:
                        "Entidades y contratos (repositorios) que definen la lógica de negocio.",
                },
                {
                    label: "Infraestructura",
                    description:
                        "Adaptadores que consultan al servidor FHIR, validan con Zod y mapean a modelos de dominio.",
                },
            ],
        },
        {
            title: "Principios clave",
            items: [
                {
                    label: "Validación en tiempo de ejecución",
                    description: "Validación con Zod antes de mapear datos.",
                },
                {
                    label: "Una sola entrada HTTP",
                    description: "Todos los requests pasan por lib/fhir/fhir-client.ts.",
                },
                {
                    label: "Dominio independiente de FHIR",
                    description: "El modelo de dominio nunca depende directamente de recursos FHIR.",
                },
                {
                    label: "App Router y server components",
                    description: "Uso de rutas de la App Router y componentes del servidor por defecto.",
                },
            ],
        },
    ],
    backLinkLabel: "← Volver al inicio",
    backLinkHref: "/",
};
