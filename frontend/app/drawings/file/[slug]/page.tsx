import { fetchArticles } from "@/sanity/lib/utils";
import {
  getDrawingArticleDictionary,
  getSlugFromDrawingGroup,
} from "../../util";
import { DrawingPage } from "../../DrawingPage";
import Navigation, { URLS } from "@/app/components/Navigation/Navigation";
import { getDrawingsManifest } from "@/app/manifest-util";
import { SITE_URL } from "@/app/consts";
import { Metadata } from "next";

export async function generateStaticParams() {
  const drawings = getDrawingsManifest();

  return drawings.files.map((d) => ({
    slug: d.uuid,
  }));
}

export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;
  const drawings = getDrawingsManifest();
  const drawing = drawings.files.find((d) => d.uuid === slug);

  if (!drawing) {
    return { title: "Drawing Not Found | Solander 38" };
  }

  const description = `${drawing.id} — ${drawing.group}`;

  return {
    title: `${drawing.title} | Solander 38`,
    description,
    icons: `${SITE_URL}/rising-tide.svg`,
    authors: drawing.author ? [{ name: drawing.author.name }] : undefined,
    publisher: "Rising Tide Research Foundation",
    openGraph: {
      type: "article",
      description,
      images: [
        {
          url: `${SITE_URL}${drawing.rel_path}`,
          width: drawing.width,
          height: drawing.height,
          alt: drawing.title,
        },
      ],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const drawings = getDrawingsManifest();

  const articles = await fetchArticles();
  const drawingsArticleDictionary = getDrawingArticleDictionary(articles.data);
  const index = drawings.files?.findIndex((d) => d.uuid == slug);
  
  const currentDrawing = drawings.files[index];
  
  const nextDrawing = drawings.files[index + 1] || drawings.files[0];
  const prevDrawing = drawings.files[index - 1] || drawings.files[drawings.files.length - 1];

  return (
    <>
      <Navigation
        type={"top-bar"}
        active={URLS.DRAWINGS}
        system={getSlugFromDrawingGroup(
          currentDrawing?.group,
        ).toLowerCase()}
      />
      <DrawingPage
        asset={currentDrawing}
        next={nextDrawing}
        prev={prevDrawing}
        drawingsArticleDictionary={drawingsArticleDictionary}
      />
    </>
  );
}
