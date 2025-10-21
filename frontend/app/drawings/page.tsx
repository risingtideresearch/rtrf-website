import { promises as fs } from 'fs';
import path from 'path';
import TableOfContents from "../toc/TableOfContents";
import Navigation from '../components/Navigation';
import Drawings from './Drawings';

export default async function Page() {
  const drawingsPath = path.join(process.cwd(), 'public/drawings/output_images/conversion_manifest.json');
  
  const drawingsData = await fs.readFile(drawingsPath, 'utf8');
  
  const drawings = JSON.parse(drawingsData);

  return (
    <>
      <TableOfContents>
        <Navigation />
        <main style={{ paddingLeft: "16.5rem" }}>
          <Drawings
            drawings={drawings}
          />
        </main>
      </TableOfContents>
    </>
  );
}
