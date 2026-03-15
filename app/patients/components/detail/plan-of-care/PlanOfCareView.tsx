"use client";

import { useState } from "react";
import type {
  PlanOfCare,
  CareGoalCategory,
  CareGoalStatus,
  ActivityStatus,
  PlanOfCareStatus,
} from "../../../../../domain/plan-of-care/plan-of-care";
import { formatDate } from "../../../../../lib/patient/formatters";

interface PlanOfCareViewProps {
  plan: PlanOfCare;
}

function getPlanStatusBadge(status: PlanOfCareStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "draft":
      return {
        label: "Borrador",
        className: "bg-badge-warning-bg text-badge-warning-text",
      };
    case "active":
      return {
        label: "Activo",
        className: "bg-badge-success-bg text-badge-success-text",
      };
    case "completed":
      return {
        label: "Completado",
        className: "bg-badge-info-bg text-badge-info-text",
      };
    case "cancelled":
      return {
        label: "Revocado",
        className: "bg-badge-error-bg text-badge-error-text",
      };
    default:
      return {
        label: "Desconocido",
        className: "bg-badge-neutral-bg text-badge-neutral-text",
      };
  }
}

function getGoalStatusBadge(status: CareGoalStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "proposed":
      return {
        label: "Propuesto",
        className: "bg-badge-neutral-bg text-badge-neutral-text",
      };
    case "accepted":
      return {
        label: "Aceptado",
        className: "bg-badge-info-bg text-badge-info-text",
      };
    case "active":
      return {
        label: "Activo",
        className: "bg-badge-success-bg text-badge-success-text",
      };
    case "completed":
      return {
        label: "Completado",
        className: "bg-badge-success-bg text-badge-success-text",
      };
    case "cancelled":
      return {
        label: "Cancelado",
        className: "bg-badge-error-bg text-badge-error-text",
      };
    default:
      return {
        label: "Desconocido",
        className: "bg-badge-neutral-bg text-badge-neutral-text",
      };
  }
}

function getActivityStatusBadge(status: ActivityStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "not-started":
      return {
        label: "Sin iniciar",
        className: "bg-badge-neutral-bg text-badge-neutral-text",
      };
    case "in-progress":
      return {
        label: "En curso",
        className: "bg-badge-info-bg text-badge-info-text",
      };
    case "completed":
      return {
        label: "Completado",
        className: "bg-badge-success-bg text-badge-success-text",
      };
    case "cancelled":
      return {
        label: "Cancelado",
        className: "bg-badge-error-bg text-badge-error-text",
      };
    default:
      return {
        label: "Desconocido",
        className: "bg-badge-neutral-bg text-badge-neutral-text",
      };
  }
}

function getCategoryLabel(category: CareGoalCategory): string {
  switch (category) {
    case "short-term":
      return "Corto plazo";
    case "long-term":
      return "Largo plazo";
    default:
      return "";
  }
}

export function PlanOfCareView({ plan }: PlanOfCareViewProps) {
  const planBadge = getPlanStatusBadge(plan.status);
  const [activitiesExpanded, setActivitiesExpanded] = useState(false);

  const periodStartLabel = formatDate(plan.periodStart);
  const periodEndLabel = plan.periodEnd
    ? formatDate(plan.periodEnd)
    : undefined;

  return (
    <div className="border border-border rounded-lg p-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">
            Plan de tratamiento
          </div>
          <div className="text-xs text-foreground">
            {periodStartLabel && (
              <span>
                Desde {periodStartLabel}
                {periodEndLabel ? ` · Hasta ${periodEndLabel}` : ""}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${planBadge.className}`}
          >
            {planBadge.label}
          </span>
          {plan.authorName && (
            <div className="text-xs text-muted mt-1">por {plan.authorName}</div>
          )}
        </div>
      </div>

      {plan.clinicalReasoning && (
        <div className="mt-3 border-t border-border pt-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">
            Razonamiento clínico
          </div>
          <div className="border-l-2 border-primary pl-3 text-sm text-foreground italic">
            {plan.clinicalReasoning}
          </div>
        </div>
      )}

      <div className="mt-3 border-t border-border pt-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
          Objetivos
        </div>
        {plan.goals.length === 0 ? (
          <div className="text-xs text-muted italic">
            Sin objetivos registrados
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plan.goals.map((goal) => {
              const badge = getGoalStatusBadge(goal.status);
              const targetLabel = goal.targetDate
                ? ` · Fecha objetivo: ${formatDate(goal.targetDate)}`
                : "";

              return (
                <div key={goal.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm text-foreground">
                      {goal.description}
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {getCategoryLabel(goal.category)}
                    {targetLabel}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">
            Actividades planificadas ({plan.activities.length})
          </div>
          {plan.activities.length > 0 && (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => setActivitiesExpanded((v) => !v)}
            >
              {activitiesExpanded ? "Ocultar ▲" : "Ver todas ▼"}
            </button>
          )}
        </div>

        {plan.activities.length === 0 ? (
          <div className="text-xs text-muted italic mt-2">
            Sin actividades registradas
          </div>
        ) : (
          activitiesExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {plan.activities.map((activity) => {
                const badge = getActivityStatusBadge(activity.status);
                return (
                  <div key={activity.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm text-foreground">
                        {activity.description}
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    {typeof activity.frequencyPerWeek === "number" && (
                      <div className="text-xs text-muted mt-1">
                        {activity.frequencyPerWeek}x por semana
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
