interface ClinicalFieldReferenceHintProps {
  technicalRangeText: string;
  referenceRangeText?: string;
  helperText?: string;
}

export function ClinicalFieldReferenceHint({
  technicalRangeText,
  referenceRangeText,
  helperText,
}: ClinicalFieldReferenceHintProps) {
  return (
    <p className="mt-1 text-xs text-muted">
      Captura: {technicalRangeText}
      {referenceRangeText ? ` · Referencia: ${referenceRangeText}` : ""}
      {helperText ? ` · ${helperText}` : ""}
    </p>
  );
}
