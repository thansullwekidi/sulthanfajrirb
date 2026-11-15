import type { Project } from "@/contracts/domain";
import type { ProjectInput } from "@/contracts/project.contract";
import { readDatabase, withTransaction } from "@/server/db/store";
import { DomainError, conflictSlug, notFound } from "@/server/errors";
import { appendAudit, createCommitHash, createEntityId } from "./audit.repository";

/**
 * LAPISAN 2 — Repositori proyek.
 * Semua mutasi berjalan dalam transaksi + normalisasi urutan + audit log.
 */

export function normalizeSortOrder(projects: Project[]): void {
  const active = projects
    .filter((project) => project.status !== "ARCHIVED")
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)
    );

  const archived = projects
    .filter((project) => project.status === "ARCHIVED")
    .sort((a, b) => (b.archivedAt ?? "").localeCompare(a.archivedAt ?? ""));

  [...active, ...archived].forEach((project, index) => {
    project.sortOrder = index + 1;
  });
}

function sortActive(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => a.sortOrder - b.sortOrder);
}

function assertSlugAvailable(projects: Project[], slug: string, excludeId?: string): void {
  const duplicate = projects.find(
    (project) => project.slug === slug && project.id !== excludeId
  );
  if (duplicate) throw conflictSlug(slug);
}

export async function listPublishedProjects(): Promise<Project[]> {
  const database = await readDatabase();
  return sortActive(database.projects.filter((project) => project.status === "PUBLISHED"));
}

export async function listFeaturedProjects(): Promise<Project[]> {
  const published = await listPublishedProjects();
  return published.filter((project) => project.isFeatured);
}

export async function findProjectBySlug(slug: string): Promise<Project | null> {
  const database = await readDatabase();
  return (
    database.projects.find(
      (project) => project.slug === slug && project.status === "PUBLISHED"
    ) ?? null
  );
}

export async function listAllProjects(): Promise<Project[]> {
  const database = await readDatabase();
  const active = sortActive(database.projects.filter((p) => p.status !== "ARCHIVED"));
  const archived = database.projects.filter((project) => project.status === "ARCHIVED");
  return [...active, ...archived];
}

export async function createProject(input: ProjectInput): Promise<Project> {
  return withTransaction((draft) => {
    assertSlugAvailable(draft.projects, input.slug);
    const timestamp = new Date().toISOString();
    const commitHash = createCommitHash(input.slug);
    const maxOrder = draft.projects.reduce(
      (max, project) => Math.max(max, project.sortOrder),
      0
    );

    const project: Project = {
      id: createEntityId("prj"),
      slug: input.slug,
      title: input.title,
      subtitle: input.subtitle,
      category: input.category,
      techStack: input.techStack,
      metricLabel: input.metricLabel,
      metricValue: input.metricValue,
      diagramType: input.diagramType,
      codeSnippet: input.codeSnippet ?? "",
      challenge: input.challenge,
      solution: input.solution,
      caseStudy: input.caseStudy ?? "",
      links: input.links,
      status: input.status,
      isFeatured: input.isFeatured,
      sortOrder: maxOrder + 1,
      commitHash,
      createdAt: timestamp,
      updatedAt: timestamp,
      archivedAt: input.status === "ARCHIVED" ? timestamp : null
    };

    draft.projects.push(project);
    normalizeSortOrder(draft.projects);
    appendAudit(draft, {
      action: "CREATE",
      entityType: "PROJECT",
      entitySlug: project.slug,
      commitHash,
      summary: `Menambahkan proyek "${project.title}" dengan status ${project.status}.`
    });

    return structuredClone(project);
  });
}

export async function updateProject(id: string, input: ProjectInput): Promise<Project> {
  return withTransaction((draft) => {
    const project = draft.projects.find((item) => item.id === id);
    if (!project) throw notFound("Proyek");
    assertSlugAvailable(draft.projects, input.slug, id);

    const timestamp = new Date().toISOString();
    const commitHash = createCommitHash(`${input.slug}:${timestamp}`);
    const wasArchived = project.status === "ARCHIVED";

    project.slug = input.slug;
    project.title = input.title;
    project.subtitle = input.subtitle;
    project.category = input.category;
    project.techStack = input.techStack;
    project.metricLabel = input.metricLabel;
    project.metricValue = input.metricValue;
    project.diagramType = input.diagramType;
    project.codeSnippet = input.codeSnippet ?? "";
    project.challenge = input.challenge;
    project.solution = input.solution;
    project.caseStudy = input.caseStudy ?? "";
    project.links = input.links;
    project.status = input.status;
    project.isFeatured = input.isFeatured;
    project.commitHash = commitHash;
    project.updatedAt = timestamp;
    project.archivedAt =
      input.status === "ARCHIVED" ? (wasArchived ? project.archivedAt : timestamp) : null;

    normalizeSortOrder(draft.projects);
    appendAudit(draft, {
      action: "UPDATE",
      entityType: "PROJECT",
      entitySlug: project.slug,
      commitHash,
      summary: `Memperbarui proyek "${project.title}" (${project.status}).`
    });

    return structuredClone(project);
  });
}

export async function archiveProject(id: string): Promise<Project> {
  return withTransaction((draft) => {
    const project = draft.projects.find((item) => item.id === id);
    if (!project) throw notFound("Proyek");
    if (project.status === "ARCHIVED") {
      throw new DomainError(409, "ALREADY_ARCHIVED", "Proyek sudah berada di tempat sampah.");
    }

    const timestamp = new Date().toISOString();
    const commitHash = createCommitHash(`archive:${project.slug}:${timestamp}`);

    project.status = "ARCHIVED";
    project.archivedAt = timestamp;
    project.isFeatured = false;
    project.commitHash = commitHash;
    project.updatedAt = timestamp;

    normalizeSortOrder(draft.projects);
    appendAudit(draft, {
      action: "ARCHIVE",
      entityType: "PROJECT",
      entitySlug: project.slug,
      commitHash,
      summary: `Mengarsipkan proyek "${project.title}" ke tempat sampah.`
    });

    return structuredClone(project);
  });
}

export async function restoreProject(id: string): Promise<Project> {
  return withTransaction((draft) => {
    const project = draft.projects.find((item) => item.id === id);
    if (!project) throw notFound("Proyek");
    if (project.status !== "ARCHIVED") {
      throw new DomainError(409, "NOT_ARCHIVED", "Proyek ini tidak berada di tempat sampah.");
    }

    const timestamp = new Date().toISOString();
    const commitHash = createCommitHash(`restore:${project.slug}:${timestamp}`);
    const maxOrder = draft.projects.reduce(
      (max, item) => Math.max(max, item.sortOrder),
      0
    );

    project.status = "PUBLISHED";
    project.archivedAt = null;
    project.sortOrder = maxOrder + 1;
    project.commitHash = commitHash;
    project.updatedAt = timestamp;

    normalizeSortOrder(draft.projects);
    appendAudit(draft, {
      action: "RESTORE",
      entityType: "PROJECT",
      entitySlug: project.slug,
      commitHash,
      summary: `Memulihkan proyek "${project.title}" ke halaman publik.`
    });

    return structuredClone(project);
  });
}

export async function purgeProject(id: string, confirmSlug: string): Promise<{ slug: string }> {
  return withTransaction((draft) => {
    const index = draft.projects.findIndex((item) => item.id === id);
    if (index < 0) throw notFound("Proyek");
    const project = draft.projects[index];
    if (!project) throw notFound("Proyek");

    if (project.status !== "ARCHIVED") {
      throw new DomainError(
        409,
        "PURGE_REQUIRES_ARCHIVE",
        "Hapus permanen hanya tersedia untuk item di tempat sampah."
      );
    }

    if (confirmSlug.trim() !== project.slug) {
      throw new DomainError(
        400,
        "CONFIRMATION_MISMATCH",
        "Konfirmasi slug tidak cocok. Penghapusan dibatalkan.",
        { confirmSlug: "Ketik slug persis seperti yang tertera." }
      );
    }

    const commitHash = createCommitHash(`purge:${project.slug}`);
    draft.projects.splice(index, 1);
    normalizeSortOrder(draft.projects);
    appendAudit(draft, {
      action: "PURGE",
      entityType: "PROJECT",
      entitySlug: project.slug,
      commitHash,
      summary: `Menghapus permanen proyek "${project.title}" dari basis data.`
    });

    return { slug: project.slug };
  });
}

export async function moveProject(
  id: string,
  direction: "UP" | "DOWN"
): Promise<Project[]> {
  return withTransaction((draft) => {
    const active = sortActive(draft.projects.filter((item) => item.status !== "ARCHIVED"));
    const index = active.findIndex((item) => item.id === id);
    if (index < 0) throw notFound("Proyek aktif");

    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= active.length) {
      throw new DomainError(
        400,
        "ORDER_BOUNDARY",
        direction === "UP"
          ? "Proyek sudah berada di urutan teratas."
          : "Proyek sudah berada di urutan terbawah."
      );
    }

    const current = active[index];
    const neighbour = active[targetIndex];
    if (!current || !neighbour) throw notFound("Proyek");
    const swap = current.sortOrder;
    current.sortOrder = neighbour.sortOrder;
    neighbour.sortOrder = swap;

    normalizeSortOrder(draft.projects);
    const commitHash = createCommitHash(`reorder:${current.slug}:${Date.now()}`);
    appendAudit(draft, {
      action: "REORDER",
      entityType: "PROJECT",
      entitySlug: current.slug,
      commitHash,
      summary: `Menggeser "${current.title}" ${direction === "UP" ? "ke atas" : "ke bawah"}.`
    });

    return sortActive(draft.projects.filter((item) => item.status !== "ARCHIVED")).map(
      (project) => structuredClone(project)
    );
  });
}

export async function setProjectFeatured(id: string, isFeatured: boolean): Promise<Project> {
  return withTransaction((draft) => {
    const project = draft.projects.find((item) => item.id === id);
    if (!project) throw notFound("Proyek");
    if (project.status === "ARCHIVED") {
      throw new DomainError(409, "ARCHIVED_PROJECT", "Proyek di tempat sampah tidak dapat disorot.");
    }

    const commitHash = createCommitHash(`feature:${project.slug}:${isFeatured}`);
    project.isFeatured = isFeatured;
    project.commitHash = commitHash;
    project.updatedAt = new Date().toISOString();

    appendAudit(draft, {
      action: "UPDATE",
      entityType: "PROJECT",
      entitySlug: project.slug,
      commitHash,
      summary: `${isFeatured ? "Menandai" : "Melepas"} "${project.title}" sebagai karya unggulan.`
    });

    return structuredClone(project);
  });
}
