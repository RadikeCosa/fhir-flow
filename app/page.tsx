import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4 md:px-0">
      <div className="flex flex-col gap-6">
        <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight">
          Fhir Flow
        </h1>
        <p className="max-w-md text-sm leading-6">
          Proyecto de aprendizaje sobre interoperabilidad en salud:
          Implementación de un cliente web para la gestión de pacientes bajo el
          estándar FHIR R4, conectado a un servidor local HAPI mediante Docker
        </p>
        <Link
          href="/patients"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover underline-offset-4 hover:underline transition-colors duration-150"
        >
          Ir a la gestión de pacientes
        </Link>
      </div>
    </div>
  );
}
