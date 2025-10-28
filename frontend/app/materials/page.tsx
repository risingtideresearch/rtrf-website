import { promises as fs } from "fs";
import path from "path";
import { fetchAnnotations, fetchSections } from "@/sanity/lib/utils";
import TableOfContents from "@/app/toc/TableOfContents";
// import styles from "./page.module.scss";
import Navigation from "../components/Navigation";
import { Canvas3D } from "../anatomy/three-d/Canvas3D";

export default async function Page() {
  const modelsManifestPath = path.join(
    process.cwd(),
    "public/models/export_manifest.json"
  );
  const modelsManifestData = await fs.readFile(modelsManifestPath, "utf8");
  const models_manifest = JSON.parse(modelsManifestData);

  const materialsIndexPath = path.join(
    process.cwd(),
    "public/script-output/material_index_simple.json"
  );
  const materialsIndexData = await fs.readFile(materialsIndexPath, "utf8");
  const materials_index = JSON.parse(materialsIndexData) || {};

  console.log(materials_index);
  const sections = await fetchSections();

  delete materials_index.materials_to_models["Default_Material"];

  materials_index.materials_to_models["Plastic"] = [
    ...materials_index.materials_to_models["Black plastic"],
    ...materials_index.materials_to_models["Bronze tinted acrylic"],
    ...materials_index.materials_to_models["Plastic"],
    ...materials_index.materials_to_models["Starboard (HDPE)"],
  ];

  materials_index.materials_to_models["Stainless steel"] = [
    ...materials_index.materials_to_models["Matte Stainless Steel"],
    ...materials_index.materials_to_models["Polished Stainless Steel"],
  ];

  delete materials_index.materials_to_models["Black plastic"];
  delete materials_index.materials_to_models["Bronze tinted acrylic"];
  delete materials_index.materials_to_models["Polished stainless steel"];
  delete materials_index.materials_to_models["Starboard (HDPE)"];

  delete materials_index.materials_to_models["Plywood"];
  delete materials_index.materials_to_models["Particle board"];

  delete materials_index.materials_to_models["Matte Stainless Steel"];
  delete materials_index.materials_to_models["Polished Stainless Steel"];

  return (
    <div>
      {/* <TableOfContents
        sections={sections?.data.sections || []}
        modes={["system", "material"]}
        materials={materials_index.unique_materials}
      > */}
      <Navigation />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          margin: "5rem auto",
          maxWidth: "70rem",
        }}
      >
        {Object.keys(materials_index.materials_to_models)
          .sort()
          .map((material) => (
            <div key={material}>
              <h3 style={{ marginBottom: "-2rem" }}>{material}</h3>
              <div
                className="bg--grid"
                style={{
                  border: "1px solid #eee",
                  borderLeft: "none",
                  height: "30rem",
                  width: "100%",
                }}
              >
                <Canvas3D
                  height={"100%"}
                  clippingPlanes={{}}
                  filteredLayers={materials_index.materials_to_models[material]}
                  content={{
                    annotations: [],
                  }}
                  settings={{
                    expand: false,
                  }}
                />
              </div>
            </div>
          ))}
      </div>
      {/* </TableOfContents> */}
    </div>
  );
}
