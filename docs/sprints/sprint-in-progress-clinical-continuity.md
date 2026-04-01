# 🧩 Sprint — In-progress clinical continuity (draft + rehydration)

## 1. Objetivo

Habilitar continuidad clínica real en encounters in-progress, permitiendo:

- carga parcial de datos clínicos
- persistencia incremental (draft)
- rehidratación consistente en UI
- transición segura a finished

Sin romper el modelo encounter-centric ni el canonical read existente.

## 2. Problema

Actualmente:

- el sistema permite:
	- crear encounter (planned)
	- finalizar encounter (finished)
- pero no permite trabajar clínicamente durante el encounter

Esto genera:

- ausencia de draft clínico
- pérdida de continuidad
- dependencia de una única acción de finalización

## 3. Alcance

### Incluye:

- definición del modelo de draft en in-progress
- persistencia parcial de datos clínicos
- rehidratación en UI
- coherencia con finalize

### No incluye:

- cambios en finished read model
- rediseño de charts
- nuevas features clínicas

## 4. Riesgos

- mezclar draft con datos finalizados
- romper aislamiento por encounterId
- introducir inconsistencias en finalize
- sobrecomplicar UI

## 5. Definition of Done

- in-progress permite persistencia parcial
- UI puede rehidratar datos existentes
- finalize consolida correctamente
- no hay mezcla entre encounters
- no se rompe canonical read de finished

## 6. Plan

### T1 — Diagnóstico actual de in-progress

- qué soporta hoy
- qué falta
- cómo se comporta UI

### T2 — Modelo de draft

definir:

- qué se guarda
- cuándo
- cómo

### T3 — Write flow

- implementar persistencia parcial

### T4 — Read / rehydration

- UI carga datos existentes

### T5 — Tests + docs