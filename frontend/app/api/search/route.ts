import { client } from "@/sanity/lib/client";
import { searchQuery } from "@/sanity/lib/queries";
import { fetchArticleIdMap } from "@/sanity/lib/utils";
import { getDrawingsManifest } from "@/app/manifest-util";
import { NextResponse } from "next/server";

const { files: allDrawings } = getDrawingsManifest();

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const [results, articleIdMap] = await Promise.all([
      client.fetch(searchQuery(), { query: query }),
      fetchArticleIdMap(),
    ]);

    const enriched = results.map((result: any) =>
      result._type === "article"
        ? { ...result, articleId: articleIdMap[result._id] }
        : result
    );

    const lowerQuery = query.toLowerCase();
    const pattern = new RegExp(`\\b${lowerQuery}`, "i");
    const drawingResults = allDrawings
      .filter((f) => pattern.test(f.title) || f.id.toLowerCase().includes(lowerQuery))
      .slice(0, 20)
      .map((f) => ({
        title: f.title,
        uuid: f.uuid,
        id: f.id,
        thumbnailUrl: f.thumbnail_path || f.rel_path,
        // Full-size dimensions, but the thumbnail preserves aspect ratio, so this
        // is what next/image needs to reserve the right space.
        width: f.width,
        height: f.height,
        _type: "drawing",
      }));

    return NextResponse.json({ results: enriched.concat(drawingResults) });
  } catch (error) {
    console.error("Sanity search error:", error);
    return NextResponse.json(
      { results: [], error: "Search failed" },
      { status: 500 },
    );
  }
}
