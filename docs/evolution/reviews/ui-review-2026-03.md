> **Nota:** Este documento es una revisión histórica. No refleja necesariamente el estado actual del sistema. Ver [`guia-rapida.md`](../../guia-rapida.md) para navegar la documentación vigente.

> **Nota de revisión histórica**
> 
> Este documento es un informe de revisión puntual (artefacto de evaluación), no una fuente de verdad operativa ni técnica.
> La documentación de autoridad actual está en `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`, `docs/write-phase-architecture.md`, y `docs/validation/validacion-arquitectonica.md`.
> 
'll review your app's UI thoroughly. Let me start by exploring the project structure and all the UI-related files.He revisado a fondo toda la capa UI de tu aplicación FHIR Flow. A continuación te presento el informe completo:
🏥 Informe de Revisión de UI — FHIR Flow
Archivos analizados
Área	Archivos
Layout global	layout.tsx, globals.css, page.tsx
Componentes globales	Header, Footer, NavLinks, HamburgerMenu
Pacientes (listado)	patients/page.tsx, PatientList, PatientCard, EmptyState, loading.tsx, error.tsx
Paciente (detalle)	[id]/page.tsx, SectionCard, PatientPersonalSection, PatientContactSection, EpisodeOfCareSection, InitialEvaluationSection, LastEncounterSection
Evaluaciones	BarthelCard, NecpalCard, PlanOfCareView
Encuentros	encounters/page.tsx, EncounterList, EncounterCard, EncounterVitalSignsSection, EncounterEvaSection, EncounterAssessmentsSection, EpisodeChartsPanel
✅ Puntos Fuertes
1. Arquitectura y separación de capas — Excelente

    La UI nunca llama fetch ni consume JSON FHIR crudo. Toda la data llega como modelos de dominio limpios.
    Uso correcto del patrón factory → repository → domain → UI.
    Los componentes de presentación son puros: reciben props tipados y renderizan. Cero lógica de negocio en la capa visual.

2. Sistema de Design Tokens — Muy bien estructurado

    globals.css define un sistema completo de CSS custom properties (colores, tipografía, radio, sombras, espaciado) mapeados a Tailwind v4 via @theme inline.
    Esto permite cambiar el tema completo tocando un solo archivo. Excelente para mantenibilidad.

3. Accesibilidad (a11y) — Base sólida

    Skip link ("Ir al contenido principal") en el Header.
    Roles ARIA explícitos: role="banner", role="navigation", role="contentinfo", role="alert", role="status".
    aria-label, aria-expanded, aria-controls, aria-current="page" usados consistentemente.
    :focus-visible ring global definido en CSS base.
    Idioma lang="es" en el <html>.

4. UX de carga y error — Completa

    Skeleton loaders (loading.tsx) tanto en listado como en detalle, con animate-pulse que replica la estructura real del contenido.
    Error boundary (error.tsx) con mensaje amigable, indicador visual, y botón "Reintentar" que llama a reset().
    Empty states explícitos (sin pacientes, sin episodio, sin visitas, sin evaluaciones).

5. Responsividad — Bien resuelta

    Grid responsive: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 para la lista de pacientes.
    Header con NavLinks en desktop y HamburgerMenu en móvil.
    Tipografía mobile-first: 15px → 16px, headings escalan en md.
    Padding adaptativos: p-4 md:p-5, px-4 md:px-6.

6. Componentes reutilizables bien diseñados

    SectionCard centraliza el shell visual (borde, sombra, padding, heading) → un solo lugar para cambiar el diseño de todas las tarjetas.
    PatientCard, BarthelCard, NecpalCard con patrón expandible limpio.
    Formatters externalizados en lib/patient/formatters — la UI no calcula nada.

7. Manejo defensivo de datos

    Filtro de IDs inválidos antes de renderizar (page.tsx de patients).
    PatientRenderError como error tipado (no console.log).
    Guards explícitos en componentes (hasValidId, hasDetails, etc.).

⚠️ Puntos Débiles
1. Duplicación de links de navegación

    Header.tsx define links = [{ href: "/patients", label: "Pacientes" }] como array local.
    HamburgerMenu.tsx define LINKS como constante separada con el mismo contenido.
    Riesgo: Si agregas una ruta, tenés que acordarte de actualizar en dos lugares.

2. No hay Dark Mode

    El sistema de tokens ya tiene la infraestructura perfecta para soportarlo (:root → @media (prefers-color-scheme: dark) o clase .dark), pero no está implementado. En aplicaciones clínicas, el dark mode es especialmente valioso para turnos nocturnos.

3. Landing page demasiado simple

    page.tsx (home) es un bloque de texto estático con un solo link. No comunica el valor de la app ni da contexto visual. Un dashboard inicial o resumen rápido sería más útil.

4. Colores hardcoded fuera del sistema de tokens

    En BarthelCard: bg-green-100 text-green-800, bg-yellow-100 text-yellow-800, bg-red-100 text-red-800, etc.
    En EncounterCard: bg-blue-50 border-blue-200.
    Estos colores no pasan por los design tokens, lo que rompe la consistencia si se cambia el tema.

5. Sin breadcrumbs ni contexto de navegación en profundidad

    En rutas profundas como /patients/[id]/encounters, solo hay un link ← Volver. El usuario no sabe exactamente dónde está en la jerarquía.

6. Sin búsqueda ni filtrado de pacientes

    La lista de pacientes se renderiza completa sin opción de buscar, filtrar por nombre/estado, ni paginar. Con muchos registros, la UX se degrada rápido.

7. Menú hamburguesa sin animación ni cierre al clickear fuera

    El menú se abre/cierra con toggle simple, pero no se cierra al hacer click fuera (onClickOutside). Tampoco tiene animación de transición, lo cual se siente abrupto.

8. Sin feedback visual en acciones

    El botón "Reintentar" en error.tsx no muestra estado de loading mientras reintenta.
    No hay toasts ni notificaciones para confirmar acciones exitosas.

9. Iconografía ausente

    No hay un sistema de íconos. Se usan div con formas CSS (w-3 h-3 rounded-full bg-error) como sustitutos y flechas de texto (← Volver, Ver ▼, Ver historial →). Esto limita la comunicación visual.

10. El page.tsx de detalle del paciente es muy largo (~150 líneas de data fetching)

    Mezcla la orquestación de 7+ repositorios con la composición de UI. Es difícil de leer y testear.

🗺️ Plan de Mejora — Priorizado
🔴 Prioridad ALTA (Impacto inmediato en UX y mantenibilidad)
#	Tarea	Esfuerzo	Impacto
1	Centralizar links de navegación — Extraer a un archivo config/navigation.ts e importar tanto en Header como en HamburgerMenu.	🟢 Bajo	Elimina duplicación y riesgo de desincronización
2	Migrar colores de badges al sistema de tokens — Crear tokens semánticos (--color-badge-success-bg, --color-badge-warning-bg, etc.) en globals.css y usarlos en BarthelCard, NecpalCard, PlanOfCareView, EncounterCard.	🟡 Medio	Consistencia visual + preparación para dark mode
3	Agregar búsqueda/filtro en lista de pacientes — Un <input> con filtrado client-side por nombre. Considerar paginación o virtualización para +100 registros.	🟡 Medio	UX crítica para uso real
4	Agregar cierre del menú hamburguesa al clickear fuera — Usar un useEffect con listener en document o un overlay transparente. Agregar animación de entrada/salida con transition.	🟢 Bajo	UX pulida en móvil
🟡 Prioridad MEDIA (Mejora significativa de experiencia)
#	Tarea	Esfuerzo	Impacto
5	Implementar Dark Mode — Agregar variantes :root.dark o @media (prefers-color-scheme: dark) al sistema de tokens existente. Toggle en el header.	🟡 Medio	Valor alto para uso clínico nocturno
6	Agregar breadcrumbs — Componente reutilizable que renderice la jerarquía Pacientes > Juan Pérez > Encuentros. Usar usePathname() + datos del paciente.	🟡 Medio	Navegación clara en rutas profundas
7	Integrar sistema de íconos — Usar lucide-react (ligera, tree-shakeable). Reemplazar las flechas de texto y los círculos div por íconos semánticos.	🟡 Medio	Comunicación visual profesional
8	Extraer lógica de data fetching del detalle del paciente — Crear funciones getPatientDetailData(id) en un archivo separado (ej: app/patients/[id]/data.ts) que orqueste los repos y retorne un objeto limpio. El page.tsx solo renderiza.	🟡 Medio	Legibilidad + testabilidad
🟢 Prioridad BAJA (Polish y funcionalidad futura)
#	Tarea	Esfuerzo	Impacto
9	Rediseñar la landing page — Mostrar un mini-dashboard con métricas rápidas (pacientes activos, próximo encuentro, etc.) en vez de texto estático.	🟡 Medio	Primera impresión del producto
10	Agregar loading state al botón Reintentar — Spinner o texto "Reintentando…" mientras reset() se ejecuta.	🟢 Bajo	Feedback visual
11	Agregar sistema de toasts/notificaciones — Para acciones futuras (crear paciente, registrar encuentro). Preparar la infraestructura con un ToastProvider en el layout.	🟡 Medio	Preparación para funcionalidad de escritura
12	Agregar meta tags Open Graph y favicon mejorado — Título dinámico por ruta (`Paciente: Juan Pérez	FHIR Flow`).	🟢 Bajo
📊 Resumen Ejecutivo
Área	Calificación
Arquitectura de componentes	⭐⭐⭐⭐⭐
Sistema de Design Tokens	⭐⭐⭐⭐
Accesibilidad	⭐⭐⭐⭐
Estados de carga/error/vacío	⭐⭐⭐⭐⭐
Responsividad	⭐⭐⭐⭐
Consistencia visual	⭐⭐⭐ (colores fuera de tokens)
Navegación	⭐⭐⭐ (sin breadcrumbs, nav duplicada)
Interactividad	⭐⭐⭐ (sin búsqueda, íconos, dark mode)

Veredicto: La base arquitectónica es excelente para un proyecto de aprendizaje — la separación de capas, los tokens, la accesibilidad y el manejo de estados son de muy buen nivel. Las mejoras más impactantes están en la capa de interacción (búsqueda, navegación, dark mode) y en la consistencia del sistema de diseño.
BloodPressureChart.tsx
BodyTemperatureChart.tsx
EvaScoreChart.tsx
HeartRateChart.tsx
OxygenSaturationChart.tsx
RespiratoryRateChart.tsx
You said: revisa los charts
revisa los charts
Copilot said: Revisé los 6 componentes de charts que

Revisé los 6 componentes de charts que compartiste. Acá va el análisis detallado:
📊 Revisión de Charts Clínicos — FHIR Flow
Archivos revisados
Componente	Archivo
BloodPressureChart	charts/BloodPressureChart.tsx
BodyTemperatureChart	charts/BodyTemperatureChart.tsx
EvaScoreChart	charts/EvaScoreChart.tsx
HeartRateChart	charts/HeartRateChart.tsx
OxygenSaturationChart	charts/OxygenSaturationChart.tsx
RespiratoryRateChart	charts/RespiratoryRateChart.tsx
✅ Puntos Fuertes
1. Rangos clínicos con ReferenceArea — Excelente decisión

Cada chart marca la zona normal con una banda semitransparente (fillOpacity={0.08}). Esto es clave para software clínico: el profesional ve inmediatamente si un valor está fuera de rango sin interpretar números.

    Presión arterial: 90–120 mmHg sistólica
    Temperatura: 36.1–37.2°C
    FC: 60–100 lpm
    SpO₂: 95–100%
    FR: 12–20 rpm
    EVA: zonas verde (0–3), amarilla (3–6), roja (6–10)

2. Constantes centralizadas

Los colores (CLINICAL_CHART_COLORS) y rangos (CLINICAL_CHART_RANGES) están externalizados en encounter-charts.formatters, no hardcodeados en cada chart. Si cambian los umbrales clínicos, se tocan en un solo lugar.
3. Dominio fijo del eje Y

Usar domain fijo en vez de autoescala es correcto clínicamente: un SpO₂ de 96% se ve diferente si el eje va de 0–100 vs 90–100. Los rangos fijos dan contexto visual consistente entre pacientes.
4. Empty states consistentes

Todos los charts tienen el mismo patrón de empty state con role="status" y mensaje descriptivo en español. Bien resuelto.
5. Custom Tooltip en BloodPressureChart

El tooltip de presión arterial muestra sistólica y diastólica con dot de color correspondiente. Es más claro que el tooltip default de Recharts.
6. "use client" correcto

Todos los charts son Client Components (necesario por Recharts) y están correctamente marcados.
⚠️ Puntos Débiles
1. Duplicación masiva de estructura — 🔴 Crítico para mantenibilidad

Los 5 charts de una sola serie (BodyTemperature, HeartRate, OxygenSaturation, RespiratoryRate, EvaScore) son prácticamente idénticos. Solo cambian 4 cosas:
Parámetro	Varía por chart
dataKey / name	"Temp (°C)", "FC (lpm)", etc.
stroke color	CLINICAL_CHART_COLORS.heartRate, etc.
domain range	CLINICAL_CHART_RANGES.heartRate, etc.
ReferenceArea y1/y2	Rangos normales específicos

Todo lo demás (imports, ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, empty state) es copiar/pegar.

Ejemplo concreto — HeartRateChart vs RespiratoryRateChart:
RadikeCosa / fhir-flow / app / patients / %5Bid%5D / encounters / components / charts / HeartRateChart.tsx

        <Line
          type="monotone"
          dataKey="value"
          name="FC (lpm)"
          stroke={CLINICAL_CHART_COLORS.heartRate}
          dot={false}

RadikeCosa / fhir-flow / app / patients / %5Bid%5D / encounters / components / charts / RespiratoryRateChart.tsx

        <Line
          type="monotone"
          dataKey="value"
          name="FR (rpm)"
          stroke={CLINICAL_CHART_COLORS.respiratoryRate}
          dot={false}

Literalmente el mismo componente con strings distintos.
2. Colores hardcodeados en EvaScoreChart
RadikeCosa / fhir-flow / app / patients / %5Bid%5D / encounters / components / charts / EvaScoreChart.tsx

        <ReferenceArea y1={0} y2={3} fill="#16a34a" fillOpacity={0.08} />
        <ReferenceArea y1={3} y2={6} fill="#d97706" fillOpacity={0.08} />
        <ReferenceArea y1={6} y2={10} fill="#dc2626" fillOpacity={0.08} />

Usa #16a34a, #d97706, #dc2626 directamente en vez de CLINICAL_CHART_COLORS o los design tokens. Esto rompe la consistencia con los demás charts que usan CLINICAL_CHART_COLORS.normal.
3. Sin accesibilidad para datos del chart

    Recharts no es accesible por defecto. Los charts son <svg> sin role, aria-label, ni tabla de datos alternativa.
    Un lector de pantalla no puede interpretar ninguna tendencia.
    Falta al menos un aria-label descriptivo en el contenedor (ej: "Gráfico de frecuencia cardíaca — últimas 15 mediciones").

4. Sin manejo de un solo dato

Si data tiene un solo punto, Recharts renderiza un chart vacío visualmente (una línea necesita ≥2 puntos para ser visible). No hay feedback al usuario tipo "Se necesitan al menos 2 mediciones para graficar tendencia".
5. Tooltip inconsistente

    BloodPressureChart tiene un CustomTooltip con diseño alineado al design system (tokens border-border, bg-surface, etc.).
    Los otros 5 charts usan el tooltip default de Recharts, que tiene su propio estilo (fondo blanco, borde gris, fuente distinta). Esto crea inconsistencia visual.

6. formatChartDate duplicado en Tooltip y XAxis

El labelFormatter del Tooltip y el tickFormatter del XAxis ambos llaman a formatChartDate. Si las fechas son ISO strings, esto funciona, pero si los datos ya vienen formateados, se formatea dos veces. No hay validación.
7. Altura fija de 180px

Todos los charts usan height={180}, lo cual está bien en desktop pero puede ser muy pequeño en móvil para leer valores y demasiado grande si se apilan 5 charts verticalmente. No hay responsividad en la altura.
🗺️ Plan de Mejora — Priorizado
🔴 Prioridad ALTA
#	Tarea	Detalle	Esfuerzo
1	Crear SingleSeriesChart genérico	Extraer un componente base que reciba { data, label, unit, color, domain, normalRange, emptyMessage } y renderice el chart completo. Los 5 charts de una serie se vuelven configuraciones de ese componente.	🟡 Medio
2	Migrar colores de EVA al sistema centralizado	Mover #16a34a, #d97706, #dc2626 a CLINICAL_CHART_COLORS (ej: painLow, painModerate, painHigh).	🟢 Bajo
3	Unificar Tooltips	Crear un ChartTooltip genérico que use los design tokens (bg-surface, border-border, tipografía) y reutilizarlo en todos los charts.	🟢 Bajo
🟡 Prioridad MEDIA
#	Tarea	Detalle	Esfuerzo
4	Agregar aria-label a cada chart	Envolver cada ResponsiveContainer en un <div role="img" aria-label="...">. Alternativamente, agregar una tabla <table> oculta con sr-only que presente los datos tabulados.	🟢 Bajo
5	Manejar caso de un solo dato	Si data.length === 1, mostrar el valor como texto grande tipo KPI en vez de un chart vacío, o agregar un mensaje.	🟢 Bajo
6	Hacer la altura responsive	Usar height condicional: h-[140px] md:h-[180px] lg:h-[220px] o pasar height como prop.	🟢 Bajo
🟢 Prioridad BAJA
#	Tarea	Detalle	Esfuerzo
7	Agregar dots en la posición del último valor	Mostrar solo el dot del último punto para indicar "valor actual" visualmente.	🟢 Bajo
8	Agregar interacción hover con crosshair	Usar <Tooltip cursor={{ strokeDasharray: '3 3' }} para mostrar línea vertical al hacer hover.	🟢 Bajo
💡 Ejemplo concreto: SingleSeriesChart genérico

Así se vería la refactorización del punto #1, que elimina ~300 líneas de código duplicado:
charts/SingleSeriesChart.tsx

"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  CartesianGrid, ResponsiveContainer, ReferenceArea,
} from "recharts";

Y cada chart se reduce a una configuración:
charts/HeartRateChart.tsx

import SingleSeriesChart from "./SingleSeriesChart";
import { CLINICAL_CHART_COLORS, CLINICAL_CHART_RANGES } from "../../../../../../lib/patient/formatters/encounter-charts.formatters";

export default function HeartRateChart({ data }: { data: { date: string; value: number }[] }) {
  return (
    <SingleSeriesChart

De ~75 líneas por chart → ~15 líneas. BloodPressureChart se mantiene separado porque tiene 2 series, pero también podría usar un MultiSeriesChart base.
📊 Resumen
Área	Calificación
Decisiones clínicas (rangos, zonas)	⭐⭐⭐⭐⭐
Constantes centralizadas	⭐⭐⭐⭐
Empty states	⭐⭐⭐⭐⭐
DRY / Reutilización	⭐⭐ (duplicación masiva)
Consistencia visual	⭐⭐⭐ (tooltip default vs custom, colores hardcoded en EVA)
Accesibilidad	⭐⭐ (sin aria-labels en SVGs)
Responsividad	⭐⭐⭐ (altura fija)

Veredicto: Los charts tienen excelente criterio clínico (rangos normales, zonas de dolor, dominio fijo) pero sufren de una deuda técnica importante en duplicación. La refactorización a un SingleSeriesChart genérico es el cambio de mayor impacto: elimina ~300 líneas, unifica tooltips y facilita agregar futuros charts (ej: Barthel longitudinal) en minutos.