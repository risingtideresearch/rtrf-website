import { Drawing } from "@/app/drawings/types";

export function searchDrawings(drawings, query: string): Array<unknown> {
  const lowerQuery = query.toLowerCase();

  return drawings
    .filter((file: Drawing) => {
      const regex = new RegExp(`\\b${lowerQuery}`, "i");
      return (
        regex.test(file.title) ||
        // regex.test(file.extracted_text || '') ||
        file.id.toLowerCase().includes(lowerQuery)
      );
    })
    .map((file: Drawing) => {
      // const filenameMatch = file.clean_filename
      //   .toLowerCase()
      //   .includes(lowerQuery);
      // const textMatch = file.extracted_text?.toLowerCase().includes(lowerQuery);

      // let matchedSnippet = "";
      // let matchStart = -1;

      // if (textMatch && file.extracted_text) {
      //   const text = file.extracted_text;
      //   const lowerText = text.toLowerCase();
      //   const index = lowerText.indexOf(lowerQuery);
      //   matchStart = index;

      //   const contextStart = Math.max(0, index - 40);
      //   const contextEnd = Math.min(
      //     text.length,
      //     index + lowerQuery.length + 40,
      //   );

      //   matchedSnippet = text.substring(contextStart, contextEnd);

      //   if (contextStart > 0) matchedSnippet = "..." + matchedSnippet;
      //   if (contextEnd < text.length) matchedSnippet = matchedSnippet + "...";
      // }

      return {
        ...file,
        _type: "drawing",
        // matchType: filenameMatch ? "filename" : "text",
        // matchedSnippet: matchedSnippet || file.clean_filename,
        query: query,
      };
    })
    .slice(0, 20);
}
