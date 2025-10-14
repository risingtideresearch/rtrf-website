import { promises as fs } from 'fs';
import path from 'path';
import DrawingsGallery from "./DrawingsGallery";
import TableOfContents from "../toc/TableOfContents";
import Navigation from '../components/Navigation';

export default async function Page() {
  const drawingsPath = path.join(process.cwd(), 'public/drawings/output_images/conversion_manifest.json');
  const chronologicalPath = path.join(process.cwd(), 'public/drawings/output_images/chronological_manifest.json');
  
  const drawingsData = await fs.readFile(drawingsPath, 'utf8');
  const chronologicalData = await fs.readFile(chronologicalPath, 'utf8');
  
  const drawings = JSON.parse(drawingsData);
  const drawings_chronological = JSON.parse(chronologicalData);

  return (
    <>
      <TableOfContents>
        <Navigation />
        <main style={{ paddingLeft: "16.5rem" }}>
          <DrawingsGallery
            drawings={drawings}
            drawings_chronological={drawings_chronological}
          />
        </main>
      </TableOfContents>
    </>
  );
}
