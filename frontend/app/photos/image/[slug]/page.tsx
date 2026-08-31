import {
  fetchAssetWithNavigation,
  fetchPhotoOrder,
  fetchPhotosStatic,
  fetchVideoWithNavigation,
} from "@/sanity/lib/utils";
import { getMediaSiblings, orderMedia } from "@/app/media-navigation";
import { PhotoPage } from "../../PhotoPage";
import Navigation, { URLS } from "@/app/components/Navigation/Navigation";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const photos = await fetchPhotosStatic();

  return photos.data.map((photo: { _id: string }) => ({ slug: photo._id.split("-")[1] }));
}

export async function generateMetadata({ params }): Promise<Metadata> {
   const { slug } = await params;

  const idPrefix = "image-" + slug;

  const { data } = await fetchAssetWithNavigation(idPrefix);
  const current = data.allImages.find((img: { _id: string }) => img._id.startsWith(idPrefix));

  return {
    title: `${current.title || current.originalFilename} | | Solander 38`,
    description: `${current.description || `Photo of ${current.title}`}`,
    openGraph: {
      type: 'article',
      description: current.description || `Photo of ${current.title}`,
      modifiedTime: current.metadata?.date ?? current._updatedAt,
      images: [
        {
          url: current.url,
          width: current.metadata?.dimensions?.width,
          height: current.metadata?.dimensions?.height,
          alt: current.title,
        },
      ],
    },
    publisher: 'Rising Tide Research Foundation'
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const idPrefix = "image-" + slug;

  const [{ data }, { data: videoData }, { data: orderData }] = await Promise.all([
    fetchAssetWithNavigation(idPrefix),
    fetchVideoWithNavigation(idPrefix),
    fetchPhotoOrder(),
  ]);

  // Photos and videos share one gallery sequence, so prev/next walks both.
  const allSorted = orderMedia(data.allImages, videoData.allVideos, orderData);

  const current = allSorted.find((img) => img._id.startsWith(idPrefix));
  if (!current) notFound();

  const isNoGallery = current.tags?.includes("no-gallery");
  const system =
    (!isNoGallery && (current.usedInArticles?.[0]?.system || current.taggedSystem)) || null;

  const { prev, next } = getMediaSiblings(allSorted, idPrefix);

  return (
    <>
      <Navigation
        type={"top-bar"}
        active={URLS.PHOTOS}
        system={system?.slug}
      />
      <PhotoPage asset={current} next={next} prev={prev} />
    </>
  );
}
