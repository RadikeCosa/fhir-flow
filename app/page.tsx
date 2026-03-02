export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center ">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight">
            Fhir Flow
          </h1>
          <p className="max-w-md text-lg leading-8">
            Proyecto de aprendizaje sobre interoperabilidad en salud:
            Implementación de un cliente web para la gestión de pacientes bajo
            el estándar FHIR R4, conectado a un servidor local HAPI mediante
            Docker
          </p>
        </div>
      </main>
    </div>
  );
}
