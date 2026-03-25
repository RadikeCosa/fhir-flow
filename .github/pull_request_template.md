## 🧪 Clinical consistency checklist (ADR-002)

Si este PR modifica alguno de estos:

- CLINICAL_RANGES
- EVA_RANGES
- clinical-ranges.adapter
- formatters clínicos
- visualización de charts o badges

Entonces verificar:

- [ ] No hay lógica clínica nueva en UI (componentes, charts, tooltips)
- [ ] No se duplican thresholds fuera del adapter o fuentes de verdad
- [ ] `getValueSeverity` sigue siendo la única fuente de clasificación
- [ ] Badge, chart y tooltip usan la misma semántica clínica
- [ ] Se actualizaron tests del adapter si cambian rangos
- [ ] Se revisó `clinical-model.md` si cambia el modelo clínico
- [ ] Se revisó `validacion-arquitectonica.md` si cambia el comportamiento observable

---

## 🧱 Architecture rules (ADR-002)

- La UI no contiene lógica clínica
- El adapter es la única capa que traduce semántica clínica a visual
- No se importan CLINICAL_RANGES ni EVA_RANGES desde UI