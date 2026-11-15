import type { DiagramType } from "@/contracts/domain";
import { DIAGRAM_LABELS } from "@/contracts/domain";

/**
 * LAPISAN 5 — Generator Skema Cetak Biru SVG.
 * Diagram dirender dari data node + aliran deterministik, bukan gambar statis.
 * Setiap tipe memiliki tata letak orthogonal dan rasio grid teknis sendiri.
 */

interface BlueprintProps {
  type: DiagramType;
  compact?: boolean;
  title?: string;
}

interface NodeSpec {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  tone?: "accent" | "muted";
}

interface EdgeSpec {
  d: string;
  tone?: "accent" | "muted";
  dashed?: boolean;
}

const GRID = 20;

function nodesFor(type: DiagramType): NodeSpec[] {
  switch (type) {
    case "WEB_ARCH":
      return [
        { x: 20, y: 34, w: 104, h: 42, label: "CLIENT", sub: "RSC / BROWSER" },
        { x: 164, y: 34, w: 104, h: 42, label: "EDGE", sub: "MIDDLEWARE", tone: "accent" },
        { x: 164, y: 128, w: 104, h: 42, label: "ACTION", sub: "CONTROLLER" },
        { x: 308, y: 128, w: 112, h: 42, label: "REPOSITORY", sub: "SCHEMA + TXN" },
        { x: 308, y: 34, w: 112, h: 42, label: "POSTGRES", sub: "PRIMARY" }
      ];
    case "ML_PIPELINE":
      return [
        { x: 20, y: 30, w: 96, h: 42, label: "CORPUS", sub: "48.210 DOK" },
        { x: 148, y: 30, w: 96, h: 42, label: "PRA-PROSES", sub: "NORMALISASI" },
        { x: 276, y: 30, w: 144, h: 42, label: "TF-IDF", sub: "120K FITUR · BIGRAM" },
        { x: 276, y: 126, w: 144, h: 42, label: "LINEARSVC", sub: "C = 0,8", tone: "accent" },
        { x: 148, y: 126, w: 96, h: 42, label: "VALIDASI", sub: "SPLIT KRONOLOGIS" },
        { x: 20, y: 126, w: 96, h: 42, label: "METRIK", sub: "F1 MAKRO 96,8%" }
      ];
    case "BROWSER_AUTOMATION":
      return [
        { x: 20, y: 28, w: 104, h: 42, label: "QUEUE", sub: "BULLMQ" },
        { x: 164, y: 28, w: 104, h: 42, label: "WORKER", sub: "6 KONKUREN", tone: "accent" },
        { x: 308, y: 28, w: 112, h: 42, label: "CONTEXT", sub: "PLAYWRIGHT" },
        { x: 164, y: 128, w: 104, h: 42, label: "KEY POOL", sub: "12 KUNCI" },
        { x: 308, y: 128, w: 112, h: 42, label: "ARTEFAK", sub: "OBJECT STORE" }
      ];
    case "MEDIA_ENGINE":
      return [
        { x: 20, y: 26, w: 96, h: 42, label: "INGEST", sub: "MASTER 4K" },
        { x: 148, y: 26, w: 96, h: 42, label: "TRANSKODE", sub: "H.264 1080P" },
        { x: 276, y: 26, w: 144, h: 42, label: "MANIFEST", sub: "EPOCH + JADWAL", tone: "accent" },
        { x: 20, y: 142, w: 96, h: 34, label: "LED-01", sub: "SINKRON" },
        { x: 148, y: 142, w: 96, h: 34, label: "LED-02", sub: "SINKRON" },
        { x: 276, y: 142, w: 144, h: 34, label: "LED-03 — 12", sub: "WEBSOCKET" }
      ];
    case "OAUTH_ROUTER":
      return [
        { x: 20, y: 30, w: 96, h: 42, label: "REQUEST", sub: "SUBDOMAIN" },
        { x: 148, y: 30, w: 116, h: 42, label: "RESOLVER", sub: "TENANT ID", tone: "accent" },
        { x: 296, y: 30, w: 124, h: 42, label: "REDIS CACHE", sub: "TTL 300 S" },
        { x: 148, y: 128, w: 116, h: 42, label: "SESSION", sub: "HMAC SIGNED" },
        { x: 296, y: 128, w: 124, h: 42, label: "OAUTH CONFIG", sub: "PER TENANT" }
      ];
  }
}

function edgesFor(type: DiagramType): EdgeSpec[] {
  switch (type) {
    case "WEB_ARCH":
      return [
        { d: "M124 55H160", tone: "accent" },
        { d: "M216 76V124", tone: "accent" },
        { d: "M268 55H336V76" },
        { d: "M216 149H304", tone: "accent" },
        { d: "M364 128V80", tone: "accent" },
        { d: "M124 55V149H160", dashed: true }
      ];
    case "ML_PIPELINE":
      return [
        { d: "M116 51H144", tone: "accent" },
        { d: "M244 51H272", tone: "accent" },
        { d: "M348 72V122" },
        { d: "M276 147H248", tone: "accent" },
        { d: "M148 147H120", tone: "accent" },
        { d: "M164 72V92H400V68", dashed: true, tone: "muted" }
      ];
    case "BROWSER_AUTOMATION":
      return [
        { d: "M124 49H160", tone: "accent" },
        { d: "M268 49H304", tone: "accent" },
        { d: "M216 70V124", tone: "accent" },
        { d: "M304 149H344V74", dashed: true },
        { d: "M268 149H304", tone: "accent" }
      ];
    case "MEDIA_ENGINE":
      return [
        { d: "M116 47H144", tone: "accent" },
        { d: "M244 47H272", tone: "accent" },
        { d: "M348 68V108H68V138", tone: "accent" },
        { d: "M196 108V138", tone: "accent" },
        { d: "M348 108V138", tone: "accent" }
      ];
    case "OAUTH_ROUTER":
      return [
        { d: "M116 51H144", tone: "accent" },
        { d: "M264 51H292", tone: "accent" },
        { d: "M206 72V124", tone: "accent" },
        { d: "M264 149H292", tone: "accent" },
        { d: "M420 51V95H36V72", dashed: true, tone: "muted" }
      ];
  }
}

function gridMeta(type: DiagramType): string {
  switch (type) {
    case "WEB_ARCH":
      return "RASIO 5:7 · 22 × 11 · SKALA 1:1";
    case "ML_PIPELINE":
      return "RASIO 8:5 · 22 × 11 · SPLIT 80/20";
    case "BROWSER_AUTOMATION":
      return "RASIO 3:2 · 22 × 11 · CONCURRENCY 6";
    case "MEDIA_ENGINE":
      return "RASIO 16:9 · 22 × 11 · EPOCH SYNC";
    case "OAUTH_ROUTER":
      return "RASIO 4:3 · 22 × 11 · TTL 300 S";
  }
}

export function TechnicalBlueprintSVG({ type, compact = false, title }: BlueprintProps) {
  const nodes = nodesFor(type);
  const edges = edgesFor(type);
  const caption = title ?? DIAGRAM_LABELS[type];
  const marker = `bp-arrow-${type}`;
  const markerMuted = `bp-arrow-muted-${type}`;
  const gridId = `bp-grid-${type}`;

  return (
    <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <svg
        className="blueprint"
        viewBox="0 0 440 214"
        role="img"
        aria-label={`Diagram cetak biru: ${caption}`}
        preserveAspectRatio="xMidYMid meet"
        style={compact ? { maxHeight: 190 } : undefined}
      >
        <defs>
          <pattern id={gridId} width={GRID} height={GRID} patternUnits="userSpaceOnUse">
            <path
              d={`M ${GRID} 0 H 0 V ${GRID}`}
              fill="none"
              stroke="var(--line)"
              strokeWidth="0.5"
              opacity="0.55"
            />
          </pattern>
          <marker
            id={marker}
            viewBox="0 0 8 8"
            refX="6"
            refY="4"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0 L8 4 L0 8 Z" fill="var(--accent)" />
          </marker>
          <marker
            id={markerMuted}
            viewBox="0 0 8 8"
            refX="6"
            refY="4"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0 L8 4 L0 8 Z" fill="var(--line-strong)" />
          </marker>
        </defs>

        <rect x="0" y="0" width="440" height="214" fill="var(--bg)" />
        <rect x="0" y="0" width="440" height="214" fill={`url(#${gridId})`} />
        <path d="M0 190 H440" stroke="var(--line)" strokeWidth="1" />
        <path d="M0 20 H440" stroke="var(--line)" strokeWidth="1" opacity="0.5" />

        {edges.map((edge, index) => (
          <path
            key={`${type}-edge-${index}`}
            d={edge.d}
            fill="none"
            stroke={edge.tone === "accent" ? "var(--accent)" : "var(--line-strong)"}
            strokeWidth={edge.tone === "accent" ? 1.25 : 1}
            strokeDasharray={edge.dashed ? "3 3" : undefined}
            markerEnd={`url(#${edge.tone === "accent" ? marker : markerMuted})`}
            opacity={edge.tone === "muted" ? 0.75 : 1}
          />
        ))}

        {nodes.map((node, index) => (
          <g key={`${type}-node-${index}`}>
            <rect
              x={node.x}
              y={node.y}
              width={node.w}
              height={node.h}
              fill="var(--bg)"
              stroke={node.tone === "accent" ? "var(--accent)" : "var(--line-strong)"}
              strokeWidth={node.tone === "accent" ? 1.25 : 1}
            />
            <text
              x={node.x + 8}
              y={node.y + 17}
              fontSize="7.2"
              fill="var(--text)"
              letterSpacing="0.06em"
            >
              {node.label}
            </text>
            {node.sub ? (
              <text
                x={node.x + 8}
                y={node.y + 30}
                fontSize="5.8"
                fill="var(--muted)"
                letterSpacing="0.02em"
              >
                {node.sub}
              </text>
            ) : null}
            <text
              x={node.x + node.w - 7}
              y={node.y + 10}
              fontSize="4.6"
              fill="var(--muted)"
              textAnchor="end"
            >
              {String(index + 1).padStart(2, "0")}
            </text>
          </g>
        ))}

        <text x="20" y="204" fontSize="5.4" fill="var(--muted)" letterSpacing="0.08em">
          {gridMeta(type)}
        </text>
        <text
          x="420"
          y="204"
          fontSize="5.4"
          fill="var(--muted)"
          textAnchor="end"
          letterSpacing="0.08em"
        >
          {type}
        </text>
      </svg>
    </figure>
  );
}
