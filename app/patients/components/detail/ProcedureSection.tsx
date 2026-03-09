import React from "react";
import type { Procedure } from "../../../../domain/procedures/procedure";
import { SectionCard } from "./SectionCard";
import {
  formatProcedureCategory,
  getProcedureStatusBadge,
  groupProceduresByCategory,
} from "../../../../lib/patient/formatters";

interface Props {
  procedures: Procedure[];
}

export const ProcedureSection: React.FC<Props> = ({ procedures }) => {
  if (!procedures || procedures.length === 0) {
    return (
      <SectionCard title="Procedimientos">
        <p className="text-sm text-muted italic">
          No hay procedimientos registrados en esta visita
        </p>
      </SectionCard>
    );
  }

  const grouped = groupProceduresByCategory(procedures);

  return (
    <SectionCard title="Procedimientos">
      {[...grouped.entries()].map(([category, procs]) => (
        <div key={category} className="mb-4">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
            {formatProcedureCategory(category)}
          </h3>
          <ul className="space-y-2">
            {procs.map((proc) => {
              const badge = getProcedureStatusBadge(proc.status);
              return (
                <li
                  key={proc.id}
                  className="p-2 bg-background border border-border rounded-md"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">
                      {proc.display}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.colorClass}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  {proc.bodySite && (
                    <p className="text-xs text-muted mt-0.5">{proc.bodySite}</p>
                  )}
                  {proc.performerName && (
                    <p className="text-xs text-muted mt-0.5">
                      {proc.performerName}
                    </p>
                  )}
                  {proc.note && (
                    <p className="text-xs text-muted italic mt-1">
                      {proc.note}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </SectionCard>
  );
};
