import { Icon } from "@/components/ui/Icon";
import {
  SOCIAL_PLATFORM_LABELS,
  type SocialLink,
  type SocialPlatform
} from "@/contracts/domain";

/**
 * Deretan tautan media sosial pada profil publik.
 * Hanya tautan yang `visible` yang dirender; urutan mengikuti `sortOrder`
 * yang diatur dari Studio, sehingga pengguna dapat menyusun prioritasnya.
 */

/** Ikon yang tersedia di sistem; platform lain memakai ikon generik. */
const PLATFORM_ICON: Partial<Record<SocialPlatform, "github" | "linkedin" | "mail" | "external">> = {
  LINKEDIN: "linkedin",
  GITHUB: "github",
  TELEGRAM: "mail",
  WHATSAPP: "mail",
  WEBSITE: "external"
};

function handle(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function SocialLinks({
  links,
  variant = "inline"
}: {
  links: SocialLink[];
  variant?: "inline" | "list";
}) {
  const visible = links
    .filter((link) => link.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (visible.length === 0) return null;

  if (variant === "list") {
    return (
      <div className="stack" style={{ gap: 0 }}>
        {visible.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer noopener"
            className="meta-row"
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12,
              padding: "7px 0",
              borderBottom: "1px solid var(--line)"
            }}
          >
            <dt
              className="mono"
              style={{
                fontSize: 9,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--muted)"
              }}
            >
              {link.label || SOCIAL_PLATFORM_LABELS[link.platform]}
            </dt>
            <dd
              style={{
                margin: 0,
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
                textAlign: "right",
                wordBreak: "break-all"
              }}
            >
              {handle(link.url)}
              <Icon name="external" size={10} />
            </dd>
          </a>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {visible.map((link) => {
        const icon = PLATFORM_ICON[link.platform] ?? "external";
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer noopener"
            className="btn btn--sm btn--quiet"
            title={handle(link.url)}
            aria-label={`${link.label || SOCIAL_PLATFORM_LABELS[link.platform]} — ${handle(link.url)}`}
          >
            <Icon name={icon} size={11} />
            {link.label || SOCIAL_PLATFORM_LABELS[link.platform]}
          </a>
        );
      })}
    </div>
  );
}
