"use client";

import { Icon } from "@/components/ui/Icon";
import { CopyButton } from "@/components/editorial/CopyButton";

export function CvToolbar({ markdown }: { markdown: string }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <button type="button" className="btn btn--primary" onClick={() => window.print()}>
        <Icon name="print" size={13} />
        Cetak / Simpan PDF
      </button>
      <CopyButton
        value={markdown}
        label="Salin Markdown CV"
        className="btn"
      />
    </div>
  );
}
