import type { SVGProps } from "react";

export type IconName =
  | "arrow-right"
  | "arrow-up-right"
  | "chevron-up"
  | "chevron-down"
  | "chevron-right"
  | "search"
  | "copy"
  | "check"
  | "close"
  | "sun"
  | "moon"
  | "command"
  | "plus"
  | "trash"
  | "pencil"
  | "star"
  | "archive"
  | "restore"
  | "download"
  | "upload"
  | "external"
  | "mail"
  | "lock"
  | "logout"
  | "refresh"
  | "print"
  | "github"
  | "linkedin"
  | "book"
  | "grid"
  | "table"
  | "alert"
  | "clock"
  | "eye"
  | "code"
  | "location"
  | "spark"
  | "user";

const PATHS: Record<Exclude<IconName, "github" | "linkedin">, string> = {
  "arrow-right": "M4 12h16M14 6l6 6-6 6",
  "arrow-up-right": "M7 17 17 7M8 7h9v9",
  "chevron-up": "m6 15 6-6 6 6",
  "chevron-down": "m6 9 6 6 6-6",
  "chevron-right": "m9 6 6 6-6 6",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
  copy: "M9 9h10v10H9zM5 15H4V4h11v1",
  check: "m4 12 5 5L20 6",
  close: "M6 6l12 12M18 6 6 18",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z",
  command: "M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3Z",
  plus: "M12 5v14M5 12h14",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6",
  pencil: "M4 20h4L20 8l-4-4L4 16v4ZM14 6l4 4",
  star: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z",
  archive: "M3 6h18v4H3zM5 10v10h14V10M9 14h6",
  restore: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5",
  download: "M12 3v13M7 11l5 5 5-5M4 21h16",
  upload: "M12 20V7M7 12l5-5 5 5M4 3h16",
  external: "M14 4h6v6M20 4 10 14M18 14v6H4V6h6",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  lock: "M6 11V8a6 6 0 0 1 12 0v3M4 11h16v10H4z",
  logout: "M9 4H4v16h5M14 8l4 4-4 4M18 12H8",
  refresh: "M20 11a8 8 0 1 0-2 6M20 5v6h-6",
  print: "M6 9V3h12v6M6 18H3V9h18v9h-3M6 14h12v7H6z",
  book: "M4 4h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4zM20 4h-3a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h3z",
  grid: "M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18",
  table: "M3 4h18v16H3zM3 9h18M3 14h18M9 4v16",
  alert: "M12 3 2 21h20L12 3ZM12 9v5M12 17.5v.5",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  code: "m8 6-6 6 6 6M16 6l6 6-6 6M14 3l-4 18",
  location: "M12 22s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  spark: "M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 21a7.5 7.5 0 0 1 15 0"
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 16, ...rest }: IconProps) {
  if (name === "github") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        {...rest}
      >
        <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.98 3.23 9.2 7.7 10.69.56.1.77-.24.77-.54v-1.9c-3.13.68-3.79-1.5-3.79-1.5-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.72.39-1.22.71-1.5-2.5-.28-5.13-1.25-5.13-5.57 0-1.23.44-2.24 1.16-3.03-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.16a10.8 10.8 0 0 1 5.65 0c2.14-1.46 3.09-1.16 3.09-1.16.61 1.55.23 2.7.11 2.98.72.79 1.16 1.8 1.16 3.03 0 4.33-2.64 5.29-5.15 5.56.4.35.76 1.03.76 2.08v3.08c0 .3.2.65.78.54a11.26 11.26 0 0 0 7.69-10.69C23.25 5.48 18.27.5 12 .5Z" />
      </svg>
    );
  }

  if (name === "linkedin") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        {...rest}
      >
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.75V21h-4v-5.5c0-1.31-.03-3-1.85-3-1.85 0-2.13 1.42-2.13 2.9V21h-4z" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
