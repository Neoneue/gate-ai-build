import * as React from 'react';

/**
 * Constellation Gate AI logomark.
 *
 * Source asset: `public/logomark.svg` (7-path constellation mark, 280×280
 * viewbox). Fill is `currentColor` so consumers can color via Tailwind:
 * `<BrandMark className="size-8 text-blue-700" />` for brand-blue,
 * `<BrandMark className="size-8 text-white" />` for inverted contexts,
 * etc.
 *
 * The literal asset color is `#1F2FCE`, which is what `--color-blue-700`
 * resolves to — applying `text-blue-700` matches the asset exactly.
 */
export function BrandMark({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 280 280"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
      {...props}
    >
      <path d="M22.6631 212.738L136.936 278.285L175.028 212.738H22.6631Z" />
      <path d="M140.001 90.9127L98.8467 114.483V161.757L140.001 185.328L181.289 161.757V114.483L140.001 90.9127Z" />
      <path d="M21.3311 68.4014L57.5576 131.036L130.277 5.89954L21.3311 68.4014Z" />
      <path d="M104.971 63.5018H250.143L141.33 1L104.971 63.5018Z" />
      <path d="M187.413 70.652L259.999 195.788V70.652H187.413Z" />
      <path d="M222.307 145.204L187.412 205.587L186.346 207.309L149.854 270.34L258.666 207.839L222.307 145.204Z" />
      <path d="M20 205.588H92.5862L20 80.4517V205.588Z" />
    </svg>
  );
}
