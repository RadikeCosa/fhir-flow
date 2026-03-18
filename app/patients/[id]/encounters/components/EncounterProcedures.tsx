import type { Procedure } from "../../../../../domain/procedures/procedure";
import {
  formatProcedureCategory,
  groupProceduresByCategory,
} from "../../../../../lib/patient/formatters";

interface Props {
  procedures: Procedure[];
}

export default function EncounterProcedures({ procedures }: Props) {
  if (procedures.length === 0) return null;

  const groupedProcedures = groupProceduresByCategory(procedures);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
        Procedimientos
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {Array.from(groupedProcedures.entries()).map(([category, procs]) => (
          <span
            key={category}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
          >
            {formatProcedureCategory(category)}
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold">
              {procs.length}
            </span>
          </span>
        ))}
      </div>

      <div className="space-y-3">
        {Array.from(groupedProcedures.entries()).map(([category, procs]) => (
          <div key={category}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">
              {formatProcedureCategory(category)}
            </p>
            <ul className="space-y-2">
              {procs.map((procedure) => (
                <li key={procedure.id}>
                  <p className="text-sm text-foreground">
                    {procedure.display}
                    {procedure.bodySite ? (
                      <span className="text-xs text-muted">
                        {" "}
                        — {procedure.bodySite}
                      </span>
                    ) : null}
                  </p>
                  {procedure.note ? (
                    <p className="text-xs text-muted ml-2">{procedure.note}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
