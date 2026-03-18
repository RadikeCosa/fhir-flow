import type { Encounter } from "../../../../../domain/encounters/encounter";
import {
  getEncounterStatusBadge,
  getVisitTypeBadge,
} from "../../../../../lib/patient/formatters/encounter.formatters";

interface Props {
  status: Encounter["status"];
  visitType: Encounter["visitType"];
  showStatusBadge?: boolean;
}

export default function EncounterBadgesRow({
  status,
  visitType,
  showStatusBadge = true,
}: Props) {
  const statusBadge = getEncounterStatusBadge(status);
  const visitTypeBadge = getVisitTypeBadge(visitType);

  return (
    <div className="flex items-center gap-2">
      {showStatusBadge && (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.colorClass}`}
        >
          {statusBadge.label}
        </span>
      )}

      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${visitTypeBadge.colorClass}`}
      >
        {visitTypeBadge.label}
      </span>
    </div>
  );
}
