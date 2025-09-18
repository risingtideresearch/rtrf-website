"use client";

// import { sanityFetch } from "@/sanity/lib/live";
// import { allPartsQuery } from "@/sanity/lib/queries";
import styles from "./../styles/common.module.scss";
import { useMemo, useState } from "react";
import { BiCube, BiGrid } from "react-icons/bi";
import { CanvasAndControls } from "./three-d/CanvasAndControls";
import PartCatalogGrid from "./PartCatalogGrid";
import { CanvasLayersControls } from "./three-d/CanvasLayersControls";
import { getSystemMap, models, materialIndex } from "./three-d/util";
import { materialsQuery } from "@/sanity/lib/queries";

enum VIEWS {
  THREE_D,
  GRID,
}

export default function Navigation({ componentIndex, parts, anatomies }) {
  const [selectedSystems, setSelectedSystems] = useState<Array<string>>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<Array<string>>([]);
  const [view, setView] = useState(VIEWS.THREE_D);

  const systems = useMemo(() => getSystemMap(models), []);
  const materials = materialIndex.grouped_materials;

  const containerStyle =
    view == VIEWS.THREE_D
      ? {
          backgroundImage:
            "repeating-linear-gradient(0deg,#eee 0px,#eee 1px,transparent 1px,transparent 20px), repeating-linear-gradient( 90deg, #eee 0px, #eee 1px, transparent 1px, transparent 20px)",
          backgroundSize: "20px 20px",
        }
      : {};

  const filteredLayers = useMemo(() => {
    if (selectedSystems.length === 0 && selectedMaterials.length === 0) {
      return models;
    }

    return models.filter((url) => {
      const includeBySystem =
        selectedSystems.length === 0 ||
        selectedSystems.includes(url) ||
        selectedSystems.some((selectedSystem) =>
          systems[selectedSystem]?.children.includes(url)
        );

      const includeByMaterial =
        selectedMaterials.length === 0 ||
        selectedMaterials.some((selectedSignature) => {
          const material = materials.find(
            (m) => m.name === selectedSignature
          );
          if (!material) return false;

          const urlFilename = url.replace('models/', '');

          return material.associated_layers.some(
            (model) => model.filename === urlFilename
          );
        });

      return includeBySystem && includeByMaterial;
    });
  }, [models, selectedSystems, systems, selectedMaterials, materials]);

  return (
    <div style={containerStyle}>
      <div
        className={styles.dialog}
        style={{
          top: "3.5rem",
          right: "1rem",
          zIndex: 10,
        }}
      >
        <button
          type="button"
          style={{ marginLeft: "auto", display: "block" }}
          onClick={() =>
            setView((prev) =>
              prev == VIEWS.THREE_D ? VIEWS.GRID : VIEWS.THREE_D
            )
          }
        >
          {view == VIEWS.GRID ? <BiCube size={18} /> : <BiGrid size={18} />}
        </button>
      </div>
      {view == VIEWS.THREE_D ? (
        <CanvasAndControls filteredLayers={filteredLayers} />
      ) : (
        <PartCatalogGrid
          componentIndex={componentIndex}
          parts={parts}
          anatomies={anatomies}
        />
      )}

      <CanvasLayersControls
        systems={systems}
        materials={materials}
        setSelectedSystems={setSelectedSystems}
        selectedSystems={selectedSystems}
        setSelectedMaterials={setSelectedMaterials}
        selectedMaterials={selectedMaterials}
      />
    </div>
  );
}
