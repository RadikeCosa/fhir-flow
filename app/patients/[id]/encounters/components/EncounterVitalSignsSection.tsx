import { SectionCard } from "../../../components/SectionCard";
import type { VitalSignRecord } from "../../../../../domain/vital-sign-record/vital-sign-record";
import EncounterVitalSignsValueList from "./EncounterVitalSignsValueList";

interface Props {
  records: VitalSignRecord[];
}

export default function EncounterVitalSignsSection({ records }: Props) {
  if (!records || records.length === 0) {
    return (
      <SectionCard title="Signos vitales">
        <p className="text-xs text-muted">No hay registros de signos vitales</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Signos vitales">
      <div className="space-y-3">
        {records.map((record, index) => (
          <div key={record.id} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Registro {index + 1}
            </p>
            <EncounterVitalSignsValueList record={record} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
