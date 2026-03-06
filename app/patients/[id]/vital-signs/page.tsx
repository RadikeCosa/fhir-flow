import Link from "next/link";
import { redirect } from "next/navigation";
import { createVitalSignRecordRepository } from "../../../../infrastructure/fhir/vital-sign-record.factory";
import { VitalSignsChartSection } from "../../components/vital-signs/VitalSignsChartSection";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
};

export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  const { view } = await searchParams;
  const showAll = view === "all";
  if (!id) {
    redirect("/patients");
  }

  const repo = createVitalSignRecordRepository();
  const records = await repo.findAllByPatientId(id);
  const displayRecords = showAll ? records : records.slice(0, 15);

  return (
    <>
      <div className="mb-4">
        <Link href={`/patients/${id}`} className="text-sm text-primary">
          ← Volver
        </Link>
      </div>

      <h1 className="text-xl font-semibold text-foreground mb-6">
        Signos vitales
      </h1>

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted">
          {showAll
            ? `${records.length} registros`
            : `Últimos ${Math.min(15, records.length)} de ${records.length} registros`}
        </p>
        {records.length > 15 && (
          <Link
            href={
              showAll
                ? `/patients/${id}/vital-signs`
                : `/patients/${id}/vital-signs?view=all`
            }
            className="text-xs text-primary hover:underline"
          >
            {showAll ? "Ver últimos 15" : "Ver historial completo"}
          </Link>
        )}
      </div>

      <VitalSignsChartSection records={displayRecords} />
    </>
  );
}
