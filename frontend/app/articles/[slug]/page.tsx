
import { fetchSections } from "@/sanity/lib/utils";
import Navigation from "../../components/Navigation";

export default async function Page({ params }) {
  const { slug } = await params;
  const { data } = await fetchSections(slug);

  // const modelsManifestPath = path.join(
  //   process.cwd(),
  //   "public/models/export_manifest.json"
  // );
  // const modelsManifestData = await fs.readFile(modelsManifestPath, "utf8");
  // const models_manifest = JSON.parse(modelsManifestData);

  console.log(data);

  return (
    <div>
      {/* <TableOfContents modes={["system"]}> */}
        <Navigation />
      {/* </TableOfContents> */}
    </div>
  );
}
