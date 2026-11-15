"use client";

import { useMemo, useState } from "react";
import { apiPatch, apiPost } from "@/client/state/api-client";
import { useAdminAction } from "@/client/state/useAdminAction";
import { useStudio } from "@/client/state/StudioProvider";
import { useToast } from "@/client/state/ToastProvider";
import { Field } from "@/components/cms/Field";
import { TechnicalBlueprintSVG } from "@/components/editorial/TechnicalBlueprintSVG";
import { Icon } from "@/components/ui/Icon";
import {
  CATEGORY_LABELS,
  DIAGRAM_LABELS,
  DIAGRAM_TYPES,
  PROJECT_CATEGORIES,
  type Project,
  type ProjectCategory,
  type DiagramType,
  type ProjectStatus
} from "@/contracts/domain";
import { normalizeSlug, parseCsvList } from "@/contracts/primitives";
import {
  projectInputSchema,
  type ProjectInput
} from "@/contracts/project.contract";
import { fieldErrorsFromZod } from "@/contracts/validation";

interface ProjectEditorProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectEditor({ project, onClose }: ProjectEditorProps) {
  const { refresh } = useStudio();
  const { toast } = useToast();
  const { run, isSubmitting, fieldErrors, reset } = useAdminAction();

  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(project));
  const [subtitle, setSubtitle] = useState(project?.subtitle ?? "");
  const [category, setCategory] = useState<ProjectCategory>(
    project?.category ?? "REKAYASA_WEB"
  );
  const [status, setStatus] = useState<ProjectStatus>(
    project?.status === "ARCHIVED" ? "DRAFT" : (project?.status ?? "DRAFT")
  );
  const [isFeatured, setIsFeatured] = useState(project?.isFeatured ?? false);
  const [techStack, setTechStack] = useState(project?.techStack.join(", ") ?? "");
  const [metricLabel, setMetricLabel] = useState(project?.metricLabel ?? "");
  const [metricValue, setMetricValue] = useState(project?.metricValue ?? "");
  const [diagramType, setDiagramType] = useState<DiagramType>(
    project?.diagramType ?? "WEB_ARCH"
  );
  const [challenge, setChallenge] = useState(project?.challenge ?? "");
  const [solution, setSolution] = useState(project?.solution ?? "");
  const [caseStudy, setCaseStudy] = useState(project?.caseStudy ?? "");
  const [codeSnippet, setCodeSnippet] = useState(project?.codeSnippet ?? "");
  const [github, setGithub] = useState(project?.links.github ?? "");
  const [live, setLive] = useState(project?.links.live ?? "");
  const [notebook, setNotebook] = useState(project?.links.notebook ?? "");
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const errors = useMemo(() => ({ ...localErrors, ...fieldErrors }), [localErrors, fieldErrors]);
  const previewTags = useMemo(() => parseCsvList(techStack), [techStack]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(normalizeSlug(value));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setLocalErrors({});
    setBanner(null);

    const payload: ProjectInput = {
      title,
      slug,
      subtitle,
      category,
      techStack: techStack as unknown as string[],
      metricLabel,
      metricValue,
      diagramType,
      codeSnippet,
      challenge,
      solution,
      caseStudy,
      links: { github, live, notebook },
      status,
      isFeatured
    };

    const parsed = projectInputSchema.safeParse(payload);
    if (!parsed.success) {
      setLocalErrors(fieldErrorsFromZod(parsed.error));
      setBanner("Kontrak skema belum terpenuhi. Perbaiki kolom yang ditandai sebelum menyimpan.");
      return;
    }

    const envelope = project
      ? await run(
          () => apiPatch<Project>(`/api/v1/projects/${project.id}`, parsed.data),
          {
            successTitle: "Proyek diperbarui",
            successDescription: `${parsed.data.title} tersinkron ke halaman publik.`
          }
        )
      : await run(() => apiPost<Project>("/api/v1/projects", parsed.data), {
          successTitle: "Proyek ditambahkan",
          successDescription: `${parsed.data.title} masuk ke katalog Studio.`
        });

    if (envelope?.ok) onClose();
  };

  const archive = async () => {
    if (!project) return;
    const envelope = await run(
      () => apiPost<Project>(`/api/v1/projects/${project.id}/actions`, { action: "ARCHIVE" }),
      {
        successTitle: "Proyek diarsipkan",
        toastOnSuccess: false,
        onSuccess: () => {
          toast({
            tone: "info",
            title: "Dipindahkan ke Tempat Sampah",
            description: project.title,
            duration: 9000,
            action: {
              label: "Batalkan",
              onClick: async () => {
                const restored = await apiPost<Project>(
                  `/api/v1/projects/${project.id}/actions`,
                  { action: "RESTORE" }
                );
                await refresh();
                toast({
                  tone: restored.ok ? "success" : "error",
                  title: restored.ok ? "Proyek dipulihkan" : "Pemulihan gagal",
                  description: restored.ok ? project.title : restored.error?.message
                });
              }
            }
          });
        }
      }
    );
    if (envelope?.ok) onClose();
  };

  return (
    <div>
      <div className="admin-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Kembali">
              <Icon name="arrow-right" size={14} style={{ transform: "rotate(180deg)" }} />
            </button>
            <span className="eyebrow eyebrow--accent">
              {project ? "Sunting Entri" : "Entri Baru"}
            </span>
            <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
              {project ? project.commitHash : "DRAFT BARU"}
            </span>
          </div>
          <h2 className="admin-head__title" style={{ fontSize: 31, marginTop: 8 }}>
            {project ? "Sunting proyek" : "Tambah proyek"}
          </h2>
          <p className="admin-head__sub">
            Formulir di kiri memakai kontrak skema yang sama dengan server. Pratinjau di kanan
            berubah seketika tanpa menyentuh basis data.
          </p>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {project ? (
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={archive}
              disabled={isSubmitting}
            >
              <Icon name="archive" size={12} />
              Arsipkan
            </button>
          ) : null}
          <button type="submit" form="project-form" className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Icon name="refresh" size={13} />
                Menyimpan…
              </>
            ) : (
              <>
                <Icon name="check" size={13} />
                {project ? "Simpan Perubahan" : "Simpan Proyek"}
              </>
            )}
          </button>
        </div>
      </div>

      <form id="project-form" onSubmit={submit} noValidate>
        {banner ? (
          <div className="form-status" style={{ marginTop: 16 }} role="alert">
            <Icon name="alert" size={14} />
            <span>{banner}</span>
          </div>
        ) : null}

        <div className="split-editor" style={{ marginTop: 16 }}>
          <div className="split-editor__form">
            <span className="form-section-title">01 / Identitas</span>

            <Field label="Judul Proyek" htmlFor="p-title" error={errors.title} hint="5—140 karakter">
              <input
                id="p-title"
                className="input"
                value={title}
                onChange={(event) => handleTitleChange(event.target.value)}
                placeholder="Contoh: Router OAuth Multi-Tenant"
              />
            </Field>

            <Field label="Slug URL" htmlFor="p-slug" error={errors.slug} hint="/karya/{slug}">
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  id="p-slug"
                  className="input mono"
                  value={slug}
                  onChange={(event) => {
                    setSlug(event.target.value);
                    setSlugTouched(true);
                  }}
                  placeholder="router-oauth-multi-tenant"
                  spellCheck={false}
                />
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={() => {
                    setSlug(normalizeSlug(title));
                    setSlugTouched(false);
                  }}
                  title="Hasilkan ulang dari judul"
                >
                  <Icon name="refresh" size={12} />
                </button>
              </div>
            </Field>

            <Field label="Ringkasan Faktual" htmlFor="p-subtitle" error={errors.subtitle} hint="min. 20 karakter">
              <textarea
                id="p-subtitle"
                className="textarea"
                rows={3}
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
                placeholder="Satu kalimat dengan angka capaian yang spesifik."
              />
            </Field>

            <span className="form-section-title">02 / Klasifikasi</span>
            <div className="form-row-2">
              <Field label="Kategori" htmlFor="p-category" error={errors.category}>
                <select
                  id="p-category"
                  className="select"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as ProjectCategory)}
                >
                  {PROJECT_CATEGORIES.map((option) => (
                    <option key={option} value={option}>
                      {CATEGORY_LABELS[option]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status" htmlFor="p-status" error={errors.status}>
                <select
                  id="p-status"
                  className="select"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ProjectStatus)}
                >
                  <option value="DRAFT">DRAF</option>
                  <option value="PUBLISHED">TERBIT</option>
                </select>
              </Field>
            </div>

            <Field label="Tech Stack" htmlFor="p-stack" error={errors.techStack} hint="pisahkan dengan koma">
              <input
                id="p-stack"
                className="input"
                value={techStack}
                onChange={(event) => setTechStack(event.target.value)}
                placeholder="Next.js 15, TypeScript, PostgreSQL"
              />
            </Field>

            <label className="check-row">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(event) => setIsFeatured(event.target.checked)}
              />
              Tandai sebagai karya unggulan di Ringkasan
            </label>

            <span className="form-section-title">03 / Metrik & Diagram</span>
            <div className="form-row-2">
              <Field label="Label Metrik" htmlFor="p-metric-label" error={errors.metricLabel}>
                <input
                  id="p-metric-label"
                  className="input"
                  value={metricLabel}
                  onChange={(event) => setMetricLabel(event.target.value)}
                  placeholder="Overhead Routing"
                />
              </Field>
              <Field label="Nilai Metrik" htmlFor="p-metric-value" error={errors.metricValue}>
                <input
                  id="p-metric-value"
                  className="input"
                  value={metricValue}
                  onChange={(event) => setMetricValue(event.target.value)}
                  placeholder="0,4 ms p95"
                />
              </Field>
            </div>

            <Field
              label="Jenis Diagram Cetak Biru"
              htmlFor="p-diagram"
              error={errors.diagramType}
            >
              <select
                id="p-diagram"
                className="select"
                value={diagramType}
                onChange={(event) => setDiagramType(event.target.value as DiagramType)}
              >
                {DIAGRAM_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option} — {DIAGRAM_LABELS[option]}
                  </option>
                ))}
              </select>
            </Field>

            <span className="form-section-title">04 / Narasi Teknis</span>
            <Field label="Tantangan Teknis" htmlFor="p-challenge" error={errors.challenge} hint="min. 20 karakter">
              <textarea
                id="p-challenge"
                className="textarea"
                rows={4}
                value={challenge}
                onChange={(event) => setChallenge(event.target.value)}
                placeholder="Masalah nyata, batasan, dan dampak yang terukur."
              />
            </Field>

            <Field label="Solusi Arsitektur" htmlFor="p-solution" error={errors.solution} hint="min. 20 karakter">
              <textarea
                id="p-solution"
                className="textarea"
                rows={4}
                value={solution}
                onChange={(event) => setSolution(event.target.value)}
                placeholder="Keputusan desain, mekanisme, dan alasan pemilihannya."
              />
            </Field>

            <Field
              label="Studi Kasus (Markdown)"
              htmlFor="p-case"
              error={errors.caseStudy}
              hint="opsional"
            >
              <textarea
                id="p-case"
                className="textarea"
                rows={4}
                value={caseStudy}
                onChange={(event) => setCaseStudy(event.target.value)}
                placeholder={"## Hasil\n- Metrik sebelum/sesudah"}
              />
            </Field>

            <span className="form-section-title">05 / Tautan Artefak</span>
            <Field label="GitHub" htmlFor="p-github" error={errors["links.github"]} hint="https://">
              <input
                id="p-github"
                className="input mono"
                value={github}
                onChange={(event) => setGithub(event.target.value)}
                placeholder="https://github.com/…"
                spellCheck={false}
              />
            </Field>
            <Field label="Demo Live" htmlFor="p-live" error={errors["links.live"]} hint="opsional">
              <input
                id="p-live"
                className="input mono"
                value={live}
                onChange={(event) => setLive(event.target.value)}
                placeholder="https://…"
                spellCheck={false}
              />
            </Field>
            <Field label="Notebook .ipynb" htmlFor="p-notebook" error={errors["links.notebook"]} hint="opsional">
              <input
                id="p-notebook"
                className="input mono"
                value={notebook}
                onChange={(event) => setNotebook(event.target.value)}
                placeholder="https://…/notebook.ipynb"
                spellCheck={false}
              />
            </Field>

            <span className="form-section-title">06 / Cuplikan Kode Produksi</span>
            <Field label="codeSnippet" htmlFor="p-code" error={errors.codeSnippet} hint="maks. 8000 karakter">
              <textarea
                id="p-code"
                className="textarea mono"
                rows={8}
                value={codeSnippet}
                onChange={(event) => setCodeSnippet(event.target.value)}
                placeholder={"// potongan fungsi inti"}
                style={{ fontSize: 11 }}
                spellCheck={false}
              />
            </Field>

            <div className="form-actions">
              <span className="form-note">
                {isSubmitting ? "Mutex aktif — klik ganda diabaikan." : "Kontrak: SchemaLayer → RepositoryLayer."}
              </span>
              <button type="button" className="btn" onClick={onClose} disabled={isSubmitting}>
                Batal
              </button>
              <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan…" : project ? "Simpan Perubahan" : "Simpan Proyek"}
              </button>
            </div>
          </div>

          <aside className="split-editor__preview">
            <div className="split-editor__preview-label">
              <span>Pratinjau Real-Time</span>
              <span className="badge badge--accent">
                {status === "PUBLISHED" ? "TERBIT" : "DRAF"}
              </span>
            </div>

            <div className="preview-card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span className="eyebrow">{CATEGORY_LABELS[category]}</span>
                <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)" }}>
                  {diagramType}
                </span>
              </div>
              <h3 className="preview-card__title">{title || "Judul proyek belum diisi"}</h3>
              <p style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.6 }}>
                {subtitle || "Ringkasan faktual akan muncul di sini saat Anda mengetik."}
              </p>

              <TechnicalBlueprintSVG type={diagramType} compact />

              <div className="tag-row">
                {previewTags.slice(0, 6).map((tech) => (
                  <span key={tech} className="tag">
                    {tech}
                  </span>
                ))}
                {previewTags.length === 0 ? <span className="tag">tech-stack</span> : null}
              </div>

              <div className="preview-card__metric">
                <span className="eyebrow">{metricLabel || "Metrik"}</span>
                <strong>{metricValue || "—"}</strong>
              </div>

              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                <span className="eyebrow">Slug publik</span>
                <div className="mono" style={{ fontSize: 9.5, marginTop: 3, wordBreak: "break-all" }}>
                  /karya/{slug || "slug-proyek"}
                </div>
              </div>
            </div>

            <div className="stack" style={{ gap: 6 }}>
              <span className="eyebrow">Cuplikan Kode</span>
              <pre className="preview-code">
                {codeSnippet || "// cuplikan kode produksi akan tampil di pembaca spesifikasi"}
              </pre>
            </div>

            {project ? (
              <div className="stack" style={{ gap: 4 }}>
                <span className="eyebrow">Metadata</span>
                <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
                  {project.id.toUpperCase()} · commit {project.commitHash} · urutan{" "}
                  {String(project.sortOrder).padStart(2, "0")}
                </span>
              </div>
            ) : null}
          </aside>
        </div>
      </form>
    </div>
  );
}
