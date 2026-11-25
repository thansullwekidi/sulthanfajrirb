import Image from "next/image";
import type { CSSProperties } from "react";

const SUPABASE_PUBLIC_IMAGE_RE =
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/.+\.(?:png|jpe?g|webp|avif)(?:\?.*)?$/i;

export function isOptimizableSupabaseImage(src: string): boolean {
  return SUPABASE_PUBLIC_IMAGE_RE.test(src);
}

interface PortfolioImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function PortfolioImage({
  src,
  alt,
  width,
  height,
  sizes,
  priority = false,
  className,
  style
}: PortfolioImageProps) {
  if (isOptimizableSupabaseImage(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        {...(sizes ? { sizes } : {})}
        quality={80}
        {...(priority ? { priority: true } : { loading: "eager" as const })}
        decoding={priority ? "sync" : "async"}
        className={className}
        style={style}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="eager"
      fetchPriority={priority ? "high" : "auto"}
      decoding={priority ? "sync" : "async"}
      className={className}
      style={style}
    />
  );
}
