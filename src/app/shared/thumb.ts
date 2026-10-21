/**
 * srcset for a catalog photo: the 400px "-xs" copy (scripts/build-thumbs.mjs)
 * and the 640px original. Pair it with sizes="auto, …" on lazy images so the
 * browser picks by the box the card actually draws. Other images get none.
 */
export function catalogSrcset(src: string | null | undefined): string | null {
  if (!src || !/^images\/catalog\/.+(?<!-lg|-xs)\.webp$/.test(src)) return null;
  return `${src.replace(/\.webp$/, '-xs.webp')} 400w, ${src} 640w`;
}
