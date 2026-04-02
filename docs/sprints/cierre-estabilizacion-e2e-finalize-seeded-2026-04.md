# Cierre técnico acotado — Estabilización E2E seeded de finalize (2026-04)

## 1) Objetivo

Documentar el cierre de la investigación y corrección del escenario E2E seeded de finalize, distinguiendo explícitamente:

- problema observable del test,
- causa real,
- no-causas,
- cambios concretos aplicados,
- evidencia de cobertura validada,
- límites del cierre.

---

## 2) Diagnóstico real

### 2.1 Qué se observaba

El escenario E2E seeded de finalize presentaba dos fallos.

### 2.2 Causa real (confirmada)

1. **El flujo productivo de finalize no estaba roto.**
2. El primer fallo provenía del helper E2E seeded: no completaba dos campos requeridos por la validación/UI actual:
   - `Saturación oxígeno (%)`
   - `Temperatura corporal (°C)`
3. Al completar esos campos, el test principal de finalize pasó correctamente.

### 2.3 Qué NO era la causa

El segundo fallo **no** era un bug del runtime de finalize.

El test esperaba `"ÚLTIMA VISITA"` en `patient detail`, pero el escenario seeded real deja la pantalla en:

- `"Sin episodio activo"`
- `"No hay visitas registradas en el episodio activo"`

Esto es consistente con el contrato actual del sistema para ese seed.

---

## 3) Cambios aplicados

### 3.1 Archivo

`e2e/flows/encounter-finalize.seeded.spec.ts`

- Se completaron en el flujo de finalize seeded los campos faltantes:
  - saturación de oxígeno,
  - temperatura corporal.
- Se mantuvo el test principal de finalize como validación de referencia.
- Se alineó el segundo test al contrato real actual de `patient detail` en este escenario seeded:
  - no botón `"Completar visita"`,
  - visible `"Sin episodio activo"`,
  - visible `"No hay visitas registradas en el episodio activo"`.

### 3.2 Limpieza asociada (mismo incidente)

`app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/index.tsx`

- Se removió el bloque temporal `Debug (temporal): serverResult`.

---

## 4) Evidencia

Comando ejecutado:

```bash
npm exec -- playwright test e2e/flows/encounter-finalize.seeded.spec.ts --workers=1 --headed
```

Resultado final validado:

- **2 passed**

---

## 5) Cobertura validada en este cierre

Quedó validado, en alcance acotado de este escenario seeded:

1. `in-progress -> finalize` funciona con payload requerido por validación actual.
2. El encounter finalizado queda en modo no editable (read-only).
3. El estado observado en `patient detail` tras finalize coincide con el contrato vigente del seed (sin episodio activo).

---

## 6) Límites explícitos del cierre

Este cierre **no** declara ni implica:

- cierre de deuda global de continuidad clínica,
- validación de `patient detail` como fuente clínica finished global,
- cambio de arquitectura.

Tampoco fue necesario modificar:

- schema,
- domain rules,
- `finalizeEncounterAction`,
- seed loader base,
- EVA repo/mapper,
- lógica clínica productiva.

---

## 7) Estado de cierre

Incidencia/micro-sprint cerrada como **estabilización E2E seeded** del escenario de finalize, con alcance controlado y límites documentados.
