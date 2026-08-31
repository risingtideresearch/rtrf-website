import {
  fetchAssetWithNavigation,
  fetchPhotoOrder,
  fetchVideosStatic,
  fetchVideoWithNavigation,
} from "@/sanity/lib/utils";
import { getMediaSiblings, orderMedia } from "@/app/media-navigation";
import { VideoPage } from "../VideoPage";
import Navigation, { URLS } from "@/app/components/Navigation/Navigation";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVideoUUID } from "../util";

export async function generateStaticParams() {
  const videos = await fetchVideosStatic();

  return videos.data.map((video: { _id: string }) => ({ uuid: getVideoUUID(video) }));
}

export async function generateMetadata({ params }): Promise<Metadata> {
  const { uuid } = await params;

  const idPrefix = "file-" + uuid;

  const { data } = await fetchVideoWithNavigation(idPrefix);
  const current = data.allVideos.find((v: { _id: string }) => v._id.startsWith(idPrefix));

  if (!current) return {};

  const title = current.title || current.originalFilename;
  const description = current.description || `Video of ${title}`;

  return {
    title: `${title} | Solander 38`,
    description,
    openGraph: {
      type: "video.other",
      description,
      videos: [
        {
          url: current.url,
          type: current.mimeType,
        },
      ],
    },
    publisher: "Rising Tide Research Foundation",
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;

  const idPrefix = "file-" + uuid;

  const [{ data }, { data: imageData }, { data: orderData }] = await Promise.all([
    fetchVideoWithNavigation(idPrefix),
    fetchAssetWithNavigation(idPrefix),
    fetchPhotoOrder(),
  ]);

  // Videos sit in the same gallery sequence as photos, so prev/next walks both.
  const allSorted = orderMedia(imageData.allImages, data.allVideos, orderData);

  const current = allSorted.find((v) => v._id.startsWith(idPrefix));
  if (!current) notFound();

  const isNoGallery = current.tags?.includes("no-gallery");
  const system =
    (!isNoGallery && (current.usedInArticles?.[0]?.system || current.taggedSystem)) || null;

  const { prev, next } = getMediaSiblings(allSorted, idPrefix);

  return (
    <>
      <Navigation type={"top-bar"} active={URLS.VIDEO} system={system?.slug} />
      <VideoPage asset={current} next={next} prev={prev} />
    </>
  );
}
