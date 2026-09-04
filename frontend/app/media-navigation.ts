import { getPhotoURL } from "./photos/util";
import { getVideoURL } from "./videos/util";

/**
 * Photos and videos share one gallery sequence, so the /photos/image/[slug]
 * and /video/[uuid] pages have to walk that same combined list — stepping
 * "next" off a photo can land on a video and vice versa.
 */
export interface SystemRef {
  name?: string;
  slug?: string;
}

export interface MediaAsset {
  _id: string;
  _type?: string;
  tags?: string[];
  taggedSystem?: SystemRef | null;
  usedInArticles?: { system?: SystemRef | null }[];
  [key: string]: unknown;
}

export interface MediaOrderData {
  systems?: {
    slug?: string;
    articles?: { imageRefs?: string[]; videoRefs?: string[] }[];
  }[];
}

export interface NavigationTarget {
  uuid: string;
  href: string;
}

export const isVideoAsset = (asset?: { _type?: string }) =>
  asset?._type === "sanity.fileAsset";

export const getMediaURL = (asset: MediaAsset) =>
  isVideoAsset(asset) ? getVideoURL(asset) : getPhotoURL(asset);

/** The id fragment used in both /photos/image/<uuid> and /video/<uuid>. */
export const getMediaUUID = (asset: MediaAsset) => asset._id.split("-")[1] || "";

/**
 * An asset appears in the gallery — and so in the prev/next sequence — when it
 * is used in a story or carries a system tag, and is not tagged `no-gallery`.
 */
const isNavigable = (asset: MediaAsset) =>
  !asset.tags?.includes("no-gallery") &&
  ((asset.usedInArticles?.length ?? 0) > 0 || (asset.tags?.length ?? 0) > 0);

/**
 * Order photos and videos the way the gallery presents them: system by system,
 * story images and videos in the order they appear, then anything merely tagged
 * with that system. Assets that match nothing keep their incoming order — the
 * queries return newest first — at the end.
 */
export function orderMedia<T extends MediaAsset>(
  images: T[],
  videos: T[],
  orderData?: MediaOrderData,
): T[] {
  const all = [...images, ...videos];
  const orderedIds: string[] = [];
  const seen = new Set<string>();

  for (const system of orderData?.systems ?? []) {
    for (const article of system.articles ?? []) {
      for (const ref of [
        ...(article.imageRefs ?? []),
        ...(article.videoRefs ?? []),
      ]) {
        if (ref && !seen.has(ref)) {
          seen.add(ref);
          orderedIds.push(ref);
        }
      }
    }

    if (!system.slug) continue;
    for (const asset of all) {
      if (seen.has(asset._id) || asset.tags?.includes("no-gallery")) continue;
      const tag = asset.tags?.find((t) => t !== "no-gallery");
      const inSystem = asset.usedInArticles?.some(
        (a) => a.system?.slug === system.slug,
      );
      if (tag === system.slug || inSystem) {
        seen.add(asset._id);
        orderedIds.push(asset._id);
      }
    }
  }

  const rank = new Map(orderedIds.map((id, i) => [id, i]));
  // unranked assets must compare equal (Infinity - Infinity is NaN, which makes
  // sort() discard their incoming order)
  const rankOf = (asset: T) => rank.get(asset._id) ?? orderedIds.length;
  return all.sort((a, b) => rankOf(a) - rankOf(b));
}

/**
 * Previous and next entries in the combined sequence, wrapping at both ends.
 * Returns hrefs because neighbours may be a different media type.
 */
export function getMediaSiblings(
  ordered: MediaAsset[],
  idPrefix: string,
): { prev: NavigationTarget | null; next: NavigationTarget | null } {
  const navigable = ordered.filter(isNavigable);
  const index = navigable.findIndex((asset) => asset._id.startsWith(idPrefix));

  if (index === -1 || navigable.length < 2) return { prev: null, next: null };

  const toTarget = (asset: MediaAsset): NavigationTarget => ({
    uuid: getMediaUUID(asset),
    href: getMediaURL(asset),
  });

  return {
    prev: toTarget(navigable[(index - 1 + navigable.length) % navigable.length]),
    next: toTarget(navigable[(index + 1) % navigable.length]),
  };
}
