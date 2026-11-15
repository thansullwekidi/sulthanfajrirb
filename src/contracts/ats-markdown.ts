import {
  CATEGORY_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  WORK_MODE_LABELS,
  type Certification,
  type Experience,
  type Project,
  type SiteConfig,
  type Skill
} from "./domain";
import { formatDateId } from "./primitives";

/** Generator dokumen CV ATS 1 halaman dalam format Markdown polos. */
export function buildAtsMarkdown(input: {
  config: SiteConfig;
  experiences: Experience[];
  projects: Project[];
  certifications: Certification[];
  skills: Skill[];
}): string {
  const { config, experiences, projects, certifications, skills } = input;
  const lines: string[] = [];

  lines.push(`# ${config.fullName}`);
  lines.push(config.headline);
  lines.push(
    [
      config.location,
      config.email,
      config.phone,
      config.website,
      config.github,
      config.linkedin
    ]
      .filter(Boolean)
      .join(" · ")
  );
  lines.push("");
  lines.push("## Ringkasan Profesional");
  lines.push(config.bio);
  lines.push("");

  lines.push("## Pengalaman");
  for (const experience of experiences) {
    lines.push(`### ${experience.role} — ${experience.organization}`);
    const meta = [
      experience.period,
      experience.type,
      EMPLOYMENT_TYPE_LABELS[experience.employmentType],
      experience.location,
      experience.workMode !== "ON_SITE" ? WORK_MODE_LABELS[experience.workMode] : ""
    ]
      .filter(Boolean)
      .join(" · ");
    lines.push(meta);
    for (const highlight of experience.highlights) lines.push(`- ${highlight}`);
    if (experience.skills.length > 0) {
      lines.push(`- Keahlian: ${experience.skills.join(", ")}`);
    }
    lines.push("");
  }

  if (projects.length > 0) {
    lines.push("## Proyek Unggulan");
    for (const project of projects) {
      lines.push(`### ${project.title}`);
      lines.push(project.subtitle);
      lines.push(`- Metrik: ${project.metricLabel} — ${project.metricValue}`);
      lines.push(`- Teknologi: ${project.techStack.join(", ")}`);
      if (project.links.github) lines.push(`- Repositori: ${project.links.github}`);
      lines.push("");
    }
  }

  lines.push("## Pendidikan");
  lines.push(config.education);
  if (config.nim) lines.push(`NIM ${config.nim}`);
  lines.push("");

  if (certifications.length > 0) {
    lines.push("## Sertifikasi");
    for (const certification of certifications) {
      lines.push(
        `- ${certification.title} — ${certification.issuer} (${formatDateId(certification.issueDate)}` +
          (certification.expiryDate
            ? ` — ${formatDateId(certification.expiryDate)}`
            : "") +
          ")" +
          (certification.credentialId ? ` · ID ${certification.credentialId}` : "")
      );
    }
    lines.push("");
  }

  lines.push("## Keahlian");
  const domains = [...new Set(skills.map((skill) => skill.category))];
  for (const domain of domains) {
    const scoped = skills.filter((skill) => skill.category === domain);
    lines.push(`- ${CATEGORY_LABELS[domain]}: ${scoped.map((skill) => skill.name).join(", ")}`);
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
