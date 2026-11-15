"use client";

import { useMemo, useState } from "react";
import { apiDelete, apiPatch, apiPost } from "@/client/state/api-client";
import { useAdminAction } from "@/client/state/useAdminAction";
import { ConfirmModal } from "@/components/cms/ConfirmModal";
import { Field } from "@/components/cms/Field";
import { Icon } from "@/components/ui/Icon";
import { articleInputSchema } from "@/contracts/content.contract";
import {
  ARTICLE_STATUSES,
  ARTICLE_STATUS_LABELS,
  type Article,
  type ArticleStatus
} from "@/contracts/domain";
import { formatDateId, normalizeSlug } from "@/contracts/primitives";
import { fieldErrorsFromZod } from "@/contracts/validation";

function ArticleForm({
  article,
  onSaved
}: {
  article: Article | null;
  onSaved: () => void;
}) {
  const { run, isSubmitting, fieldErrors, reset } = useAdminAction();
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(article));
  const [category, setCategory] = useState(article?.category ?? "");
  const [publishedAt, setPublishedAt] = useState(article?.publishedAt ?? "");
  const [summary, setSummary] = useState(article?.summary ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [externalUrl, setExternalUrl] = useState(article?.externalUrl ?? "");
  const [status, setStatus] = useState<ArticleStatus>(article?.status ?? "DRAFT");
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const errors = { ...localErrors, ...fieldErrors };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(normalizeSlug(value));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setLocalErrors({});
    setBanner(null);

    const parsed = articleInputSchema.safeParse({
      slug,
      title,
      category,
      publishedAt,
      summary,
      content,
      externalUrl,
      status
    });

    if (!parsed.success) {
      setLocalErrors(fieldErrorsFromZod(parsed.error));
      setBanner("Kontrak artikel belum terpenuhi. Perbaiki kolom yang ditandai.");
      return;
    }

    const envelope = article
      ? await run(
          () => apiPatch<Article>(`/api/v1/collections/articles/${article.id}`, parsed.data),
          {
            successTitle: "Artikel diperbarui",
            successDescription: parsed.data.title
          }
        )
      : await run(() => apiPost<Article>("/api/v1/collections/articles", parsed.data), {
          successTitle: "Artikel dibuat",
          successDescription: parsed.data.title
        });

    if (envelope?.ok) onSaved();
  };

  return (
    <div className="panel">
      <div className="panel__head">
        <span className="panel__title">{article ? "Sunting Artikel" : "Artikel Baru"}</span>
        <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)" }}>
          {article ? article.id.toUpperCase() : "DRAFT"}
        </span>
      </div>

      <form className="panel__body stack" style={{ gap: 14 }} onSubmit={submit} noValidate>
        {banner ? (
          <div className="form-status" role="alert">
            <Icon name="alert" size={14} />
            <span>{banner}</span>
          </div>
        ) : null}

        <Field label="Judul Artikel" htmlFor="art-title" error={errors.title}>
          <input
            id="art-title"
            className="input"
            value={title}
            onChange={(event) => handleTitleChange(event.target.value)}
            placeholder="Kalibrasi ambang batas pada pipeline klasifikasi berita"
          />
        </Field>

        <Field label="Slug internal" htmlFor="art-slug" error={errors.slug}>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              id="art-slug"
              className="input mono"
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value);
                setSlugTouched(true);
              }}
              placeholder="kalibrasi-ambang-batas"
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

        <div className="form-row-2">
          <Field label="Kategori" htmlFor="art-category" error={errors.category}>
            <input
              id="art-category"
              className="input"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Machine Learning"
            />
          </Field>
          <Field label="Tanggal Terbit" htmlFor="art-date" error={errors.publishedAt}>
            <input
              id="art-date"
              type="date"
              className="input mono"
              value={publishedAt}
              onChange={(event) => setPublishedAt(event.target.value)}
            />
          </Field>
        </div>

        <Field label="Status" htmlFor="art-status" error={errors.status}>
          <select
            id="art-status"
            className="select"
            value={status}
            onChange={(event) => setStatus(event.target.value as ArticleStatus)}
          >
            {ARTICLE_STATUSES.map((option) => (
              <option key={option} value={option}>
                {ARTICLE_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Ringkasan"
          htmlFor="art-summary"
          error={errors.summary}
          hint="20—320 karakter"
        >
          <textarea
            id="art-summary"
            className="textarea"
            rows={3}
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Ringkasan teknis yang menjelaskan masalah, metode, dan hasil."
          />
        </Field>

        <Field
          label="Tautan publikasi"
          htmlFor="art-external-url"
          error={errors.externalUrl}
          hint="opsional, digunakan sebagai tautan artikel di beranda"
        >
          <input
            id="art-external-url"
            className="input"
            type="url"
            value={externalUrl}
            onChange={(event) => setExternalUrl(event.target.value)}
            placeholder="https://contoh.com/artikel"
          />
        </Field>

        <Field
          label="Isi Artikel (Markdown)"
          htmlFor="art-content"
          error={errors.content}
          hint="min. 40 karakter"
        >
          <textarea
            id="art-content"
            className="textarea mono"
            rows={12}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={"## Konteks\nUraikan masalah dan batasan.\n\n## Metode\n- Langkah reproduksi"}
            style={{ fontSize: 11 }}
          />
        </Field>

        <div className="form-actions">
          <span className="form-note">
            {isSubmitting
              ? "Mutex aktif — klik ganda diabaikan."
              : "Waktu baca dihitung otomatis dari isi."}
          </span>
          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting
              ? "Menyimpan…"
              : article
                ? "Simpan Perubahan"
                : status === "PUBLISHED"
                  ? "Terbitkan Artikel"
                  : "Simpan Draf"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function PublicationsModule({ articles }: { articles: Article[] }) {
  const { run, isSubmitting } = useAdminAction();
  const [statusFilter, setStatusFilter] = useState<"ALL" | ArticleStatus>("ALL");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);

  const sorted = useMemo(
    () => [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    [articles]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return sorted.filter((article) => {
      if (statusFilter !== "ALL" && article.status !== statusFilter) return false;
      if (!term) return true;
      return `${article.title} ${article.slug} ${article.category}`
        .toLowerCase()
        .includes(term);
    });
  }, [query, sorted, statusFilter]);

  const editing = articles.find((article) => article.id === editingId) ?? null;

  const remove = async () => {
    if (!deleteTarget) return;
    const envelope = await run(
      () => apiDelete<{ id: string }>(`/api/v1/collections/articles/${deleteTarget.id}`),
      {
        successTitle: "Artikel dihapus",
        successDescription: deleteTarget.title
      }
    );
    if (envelope?.ok) {
      if (editingId === deleteTarget.id) setEditingId(null);
      setNonce((current) => current + 1);
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="admin-head">
        <div>
          <span className="eyebrow eyebrow--accent">06 / Publikasi Artikel</span>
          <h2 className="admin-head__title" style={{ marginTop: 6 }}>
            Publikasi dan artikel
          </h2>
          <p className="admin-head__sub">
            Artikel berstatus TERBIT tampil di bagian Publikasi pada beranda. Tambahkan tautan
            publikasi agar pengunjung dapat membuka artikel; DRAF tetap tersimpan untuk peninjauan.
            Waktu baca dihitung ulang oleh server dari isi Markdown.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            setEditingId(null);
            setNonce((current) => current + 1);
          }}
        >
          <Icon name="plus" size={13} />
          Artikel Baru
        </button>
      </div>

      <div className="admin-toolbar">
        <label className="admin-toolbar__search">
          <Icon name="search" size={12} />
          <span className="sr-only">Cari artikel</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari judul, slug, atau kategori…"
            type="search"
          />
        </label>

        <div style={{ display: "flex", gap: 0 }}>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => setStatusFilter("ALL")}
            style={
              statusFilter === "ALL"
                ? { background: "var(--text)", color: "var(--bg)", borderColor: "var(--text)" }
                : { borderColor: "var(--line)", color: "var(--muted)" }
            }
          >
            Semua ({articles.length})
          </button>
          {ARTICLE_STATUSES.map((option) => (
            <button
              key={option}
              type="button"
              className="btn btn--sm"
              onClick={() => setStatusFilter(option)}
              style={
                statusFilter === option
                  ? { background: "var(--text)", color: "var(--bg)", borderColor: "var(--text)" }
                  : { borderColor: "var(--line)", color: "var(--muted)" }
              }
            >
              {ARTICLE_STATUS_LABELS[option]} (
              {articles.filter((article) => article.status === option).length})
            </button>
          ))}
        </div>

        <div className="admin-toolbar__spacer" />
        <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
          {String(filtered.length).padStart(2, "0")} DARI {String(articles.length).padStart(2, "0")}{" "}
          ARTIKEL
        </span>
      </div>

      <div className="admin-panel admin-grid-2">
        <div className="panel">
          <div className="panel__head">
            <span className="panel__title">Indeks Artikel</span>
            <span className="mono" style={{ fontSize: 8.5, color: "var(--muted)" }}>
              {isSubmitting ? "MUTASI BERJALAN…" : "SIAP"}
            </span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Artikel</th>
                  <th style={{ width: 120 }}>Kategori</th>
                  <th style={{ width: 100 }}>Status</th>
                  <th style={{ width: 90, textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((article) => (
                  <tr key={article.id}>
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(article.id);
                          setNonce((current) => current + 1);
                        }}
                        style={{ textAlign: "left" }}
                      >
                        <span className="admin-table__title">{article.title}</span>
                        <span className="admin-table__sub">
                          /{article.slug} · {article.readTime} menit · {formatDateId(article.publishedAt)}
                        </span>
                      </button>
                    </td>
                    <td>
                      <span className="badge">{article.category}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          article.status === "PUBLISHED" ? "badge--ok" : "badge--warn"
                        }`}
                      >
                        {ARTICLE_STATUS_LABELS[article.status].toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table__actions">
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ width: 28, height: 28 }}
                          onClick={() => {
                            setEditingId(article.id);
                            setNonce((current) => current + 1);
                          }}
                          aria-label={`Sunting ${article.title}`}
                          title="Sunting"
                        >
                          <Icon name="pencil" size={12} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ width: 28, height: 28, color: "var(--danger)" }}
                          onClick={() => setDeleteTarget(article)}
                          disabled={isSubmitting}
                          aria-label={`Hapus ${article.title}`}
                          title="Hapus"
                        >
                          <Icon name="trash" size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 ? (
              <div className="admin-empty">
                Tidak ada artikel pada filter ini. Ubah status atau kata kunci pencarian.
              </div>
            ) : null}
          </div>
        </div>

        <ArticleForm
          key={`article-${editingId ?? "new"}-${nonce}`}
          article={editing}
          onSaved={() => {
            setEditingId(null);
            setNonce((current) => current + 1);
          }}
        />
      </div>

      {deleteTarget ? (
        <ConfirmModal
          title={`Hapus artikel ${deleteTarget.title}?`}
          description="Artikel beserta tautan publiknya akan dihapus dari basis data dan tidak dapat dipulihkan. Entri PURGE ditulis ke log audit."
          confirmLabel="Hapus Artikel"
          tone="danger"
          busy={isSubmitting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={remove}
        />
      ) : null}
    </div>
  );
}
