import { promises as fs } from "fs";
import path from "path";
import TableOfContents from "@/app/toc/TableOfContents";
import Drawings from "../../Drawings";
import Navigation from "@/app/components/Navigation";

// export default async function Page({
//   params,
// }: {
//   params: Promise<{ slug: string }>;
// }) {
//   const { slug } = await params;

//   const drawingsPath = path.join(
//     process.cwd(),
//     "public/drawings/output_images/conversion_manifest.json"
//   );
//   const chronologicalPath = path.join(
//     process.cwd(),
//     "public/drawings/output_images/chronological_manifest.json"
//   );

//   const drawingsData = await fs.readFile(drawingsPath, "utf8");
//   const chronologicalData = await fs.readFile(chronologicalPath, "utf8");

//   const drawings = JSON.parse(drawingsData);
//   const drawings_chronological = JSON.parse(chronologicalData);

//   console.log(slug);

//   return (
//     <>
//       <TableOfContents defaultSystem={slug?.[0]}>
//         <Navigation defaultSystem={slug?.[0]} />
//         <main style={{ paddingLeft: "16.5rem" }}>
//           <DrawingsGallery
//             drawings={drawings}
//             drawings_chronological={drawings_chronological}
//             defaultUUID={slug[0] || null}
//           />
//         </main>
//       </TableOfContents>
//     </>
//   );
// }

export async function generateStaticParams() {
  const drawingsPath = path.join(
    process.cwd(),
    "public/drawings/output_images/conversion_manifest.json"
  );

  const drawingsData = await fs.readFile(drawingsPath, "utf8");

  const drawings = JSON.parse(drawingsData);

  return drawings.files.map((d) => ({
    slug: d.uuid,
  }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const drawingsPath = path.join(
    process.cwd(),
    "public/drawings/output_images/conversion_manifest.json"
  );

  const drawingsData = await fs.readFile(drawingsPath, "utf8");

  const drawings = JSON.parse(drawingsData);

  return (
    <>
      <TableOfContents>
        <Navigation />
        <main style={{ paddingLeft: "16.5rem" }}>
          <Drawings
            drawings={drawings}
            defaultUUID={slug}
          />
        </main>
      </TableOfContents>
    </>
  );
}
