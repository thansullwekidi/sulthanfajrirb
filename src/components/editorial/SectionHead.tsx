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
