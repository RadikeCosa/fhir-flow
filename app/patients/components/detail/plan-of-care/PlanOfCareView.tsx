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
      return { label: "Borrador", className: "bg-yellow-100 text-yellow-800" };
    case "active":
      return { label: "Activo", className: "bg-green-100 text-green-800" };
    case "completed":
      return { label: "Completado", className: "bg-blue-100 text-blue-800" };
    case "cancelled":
      return { label: "Revocado", className: "bg-red-100 text-red-800" };
    default:
      return { label: "Desconocido", className: "bg-gray-100 text-gray-800" };
  }
}

function getGoalStatusBadge(status: CareGoalStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "proposed":
      return { label: "Propuesto", className: "bg-gray-100 text-gray-600" };
    case "accepted":
      return { label: "Aceptado", className: "bg-blue-100 text-blue-800" };
    case "active":
      return { label: "Activo", className: "bg-green-100 text-green-800" };
    case "completed":
      return { label: "Completado", className: "bg-green-100 text-green-800" };
    case "cancelled":
      return { label: "Cancelado", className: "bg-red-100 text-red-800" };
    default:
      return { label: "Desconocido", className: "bg-gray-100 text-gray-800" };
  }
}

function getActivityStatusBadge(status: ActivityStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "not-started":
      return { label: "Sin iniciar", className: "bg-gray-100 text-gray-600" };
    case "in-progress":
      return { label: "En curso", className: "bg-blue-100 text-blue-800" };
    case "completed":
      return { label: "Completado", className: "bg-green-100 text-green-800" };
    case "cancelled":
      return { label: "Cancelado", className: "bg-red-100 text-red-800" };
    default:
      return { label: "Desconocido", className: "bg-gray-100 text-gray-800" };
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
          <div className="space-y-2">
            {plan.goals.map((goal, index) => {
              const badge = getGoalStatusBadge(goal.status);
              const isLast = index === plan.goals.length - 1;
              const targetLabel = goal.targetDate
                ? ` · Fecha objetivo: ${formatDate(goal.targetDate)}`
                : "";

              return (
                <div
                  key={goal.id}
                  className={`pb-2 ${isLast ? "" : "border-b border-border"}`}
                >
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
            <div className="mt-2 space-y-2">
              {plan.activities.map((activity) => {
                const badge = getActivityStatusBadge(activity.status);
                return (
                  <div
                    key={activity.id}
                    className="pb-2 border-b border-border last:border-b-0"
                  >
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
