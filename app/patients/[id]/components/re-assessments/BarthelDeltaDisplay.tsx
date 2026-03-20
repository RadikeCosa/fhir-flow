interface BarthelDeltaDisplayProps {
  currentScore: number;
  initialScore: number;
}

export default function BarthelDeltaDisplay({
  currentScore,
  initialScore,
}: BarthelDeltaDisplayProps) {
  const delta = currentScore - initialScore;

  if (delta > 0) {
    return (
      <p className="text-xs text-green-700">
        ▲ +{delta} pts respecto a evaluación inicial
      </p>
    );
  }

  if (delta < 0) {
    return (
      <p className="text-xs text-red-700">
        ▼ {delta} pts respecto a evaluación inicial
      </p>
    );
  }

  return (
    <p className="text-xs text-muted">
      Sin cambio respecto a evaluación inicial
    </p>
  );
}
