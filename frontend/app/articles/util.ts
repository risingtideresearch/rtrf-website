interface Drawing {
  filename: string;
  id: string;
  uuid: string;
  rel_path: string;
  group: string;
  source_pdf: string;
  page_number: number;
  width: number;
  height: number;
}

interface ImageSetItem {
  _key: string;
  _type: string;
  drawing: string; // This is the uuid
}

interface ImageSet {
  _key: string;
  _type: string;
  caption?: string;
  imageSet: ImageSetItem[];
}

interface MatchedDrawing extends Drawing {
  _key: string;
}

interface MatchedImageSet extends Omit<ImageSet, 'imageSet'> {
  imageSet: MatchedDrawing[];
}

/**
 * Matches drawing UUIDs in Sanity content with their corresponding drawing files
 */
export function matchDrawings(
  drawings: Drawing[],
  imageSet: ImageSet
): MatchedImageSet {
  // Create a lookup map for O(1) access
  const drawingMap = new Map<string, Drawing>();
  drawings.forEach(drawing => {
    drawingMap.set(drawing.uuid, drawing);
  });

  // Match each drawing in the imageSet
  const matchedImageSet = imageSet.imageSet
    .map(item => {
      if (item._type == 'image') {
        return item;
      }
      const drawing = drawingMap.get(item.drawing);
      if (!drawing) {
        console.warn(`Drawing not found for UUID: ${item.drawing}`);
        return null;
      }
      return {
        ...drawing,
        _key: item._key,
      };
    })
    .filter((item): item is MatchedDrawing => item !== null);

  return {
    ...imageSet,
    imageSet: matchedImageSet,
  };
}

/**
 * Processes all imageSets in article content
 */
export function matchArticleDrawings(
  drawings: Drawing[],
  data
) {
  data.content = (data.content || []).map(block => {
    if (block._type === 'imageSet') {
      return matchDrawings(drawings, block);
    }
    return block;
  });

  return data;
}

/**
 * Utility to get drawing by UUID
 */
export function getDrawingByUuid(
  drawings: Drawing[],
  uuid: string
): Drawing | undefined {
  return drawings.find(drawing => drawing.uuid === uuid);
}

/**
 * Batch match multiple articles
 */
export function matchMultipleArticles(
  drawings: Drawing[],
  articles: any[]
): any[] {
  return articles.map(article => ({
    ...article,
    content: matchArticleDrawings(drawings, article.content || []),
  }));
}

// Usage example:
/*
import drawingsData from './drawings.json';

const article = // ... your Sanity article data

// Process single article
const processedContent = matchArticleDrawings(drawingsData, article.content);

// Or process entire article
const processedArticle = {
  ...article,
  content: matchArticleDrawings(drawingsData, article.content)
};

// Now use in your component:
<PortableText 
  value={processedArticle.content} 
  components={{
    types: {
      imageSet: ({value}) => (
        <figure>
          {value.imageSet.map((drawing) => (
            <img 
              key={drawing._key}
              src={drawing.rel_path}
              alt={drawing.filename}
              width={drawing.width}
              height={drawing.height}
            />
          ))}
          {value.caption && <figcaption>{value.caption}</figcaption>}
        </figure>
      )
    }
  }}
/>
*/
