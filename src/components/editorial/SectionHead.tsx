import type { ReactNode } from "react";

interface SectionHeadProps {
  index: string;
  title: string;
  meta?: string;
  action?: ReactNode;
}

export function SectionHead({ index, title, meta, action }: SectionHeadProps) {
  return (
    <div className="section-head">
      <span className="section-head__index">{index}</span>
      <h2 className="section-head__title">{title}</h2>
      <div className="section-head__meta">
        {action ?? meta}
      </div>
    </div>
  );
}

interface SparklineProps {
  values: number[];
  accent?: boolean;
}

export function Sparkline({ values, accent = false }: SparklineProps) {
  if (values.length < 2) return null;
  const width = 120;
  const height = 16;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);
  const points = values
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / span) * (height - 3) - 1.5;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      className="kpi__spark"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={accent ? { color: "var(--accent)" } : undefined}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
