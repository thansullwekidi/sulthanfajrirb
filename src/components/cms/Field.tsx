"use client";

import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  full?: boolean;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, full, children }: FieldProps) {
  return (
    <div className={`field ${error ? "field--error" : ""} ${full ? "field--full" : ""}`}>
      <label htmlFor={htmlFor}>
        {label}
        {hint ? <span className="field__hint">{hint}</span> : null}
      </label>
      {children}
      {error ? <span className="field__error">{error}</span> : null}
    </div>
  );
}
