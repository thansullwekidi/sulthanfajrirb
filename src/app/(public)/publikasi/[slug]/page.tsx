import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownBlock } from "@/components/editorial/MarkdownBlock";
import { Icon } from "@/components/ui/Icon";
import { formatDateId } from "@/contracts/primitives";
import { getPublishedArticleBySlug } from "@/server/repositories/content.repository";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return { title: "Artikel tidak ditemukan" };

  return {
    title: `${article.title} — Publikasi`,
    description: article.summary
  };
}

export default async function PublicationPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) notFound();

  return (
    <div className="shell">
      <article className="publication-detail">
        <Link href="/#publikasi" className="link-inline publication-detail__back">
          Semua publikasi
        </Link>
        <header className="publication-detail__header">
          <span className="badge badge--accent">{article.category}</span>
          <h1 className="display">{article.title}</h1>
          <p className="publication-detail__summary">{article.summary}</p>
          <div className="publication-detail__meta mono">
            <span>{formatDateId(article.publishedAt)}</span>
            <span>{article.readTime} menit baca</span>
          </div>
          {article.externalUrl ? (
            <a
              href={article.externalUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn--primary"
            >
              Buka tautan publikasi
              <Icon name="arrow-up-right" size={13} />
            </a>
          ) : null}
        </header>
        <MarkdownBlock content={article.content} />
      </article>
    </div>
  );
}
