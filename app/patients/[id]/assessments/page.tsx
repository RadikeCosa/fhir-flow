import Link from "next/link";
import { redirect } from "next/navigation";
import { createAssessmentRepository } from "../../../../infrastructure/fhir/factories/assessment.factory";
import { VitalSignsChart } from "../../components/vital-signs/VitalSignsChart";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  if (!id) {
    redirect("/patients");
  }

  const assessmentRepo = createAssessmentRepository();
  const evaRecords = await assessmentRepo.findEvaByPatientId(id);

  const chartData = [...evaRecords]
    .reverse()
    .map((r) => ({ date: r.date, value: r.score }));

  return (
    <>
      <div className="mb-4">
        <Link href={`/patients/${id}`} className="text-sm text-primary">
          ← Volver
        </Link>
      </div>

      <h1 className="text-base font-semibold text-foreground mb-4">
        Dolor — EVA
      </h1>

      {evaRecords.length === 0 ? (
        <p className="text-sm text-muted italic">Sin registros de EVA</p>
      ) : (
        <div className="bg-surface border border-border rounded-lg shadow-sm p-4">
          <VitalSignsChart
            title="Escala visual analógica de dolor (0–10)"
            data={chartData}
            lines={[{ dataKey: "value", color: "#f97316", label: "EVA" }]}
          />
        </div>
      )}
    </>
  );
}
