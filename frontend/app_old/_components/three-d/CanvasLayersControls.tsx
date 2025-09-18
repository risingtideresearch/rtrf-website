import { useEffect, useState } from "react";
import { BiLayer, BiCollapseAlt, BiColor } from "react-icons/bi";
import styles from "./../../styles/common.module.scss";

enum Types {
  LAYER = "layer",
  MATERIAL = "material",
  SIZE = "size",
}

export const CanvasLayersControls = ({
  systems,
  selectedSystems,
  setSelectedSystems,
  materials,
  setSelectedMaterials,
  selectedMaterials,
}) => {
  // const [collapsed, setCollapsed] = useState(false);
  const [type, setType] = useState(Types.LAYER);
  return (
    <div
      style={{
        position: "fixed",
        top: "3.5rem",
        left: "1rem",
      }}
    >
      <button
        type="button"
        style={{
          border: "1px solid var(--foreground)",
          position: "relative",
          zIndex: 1,
          borderBottomColor:
            type == Types.LAYER ? "rgba(0,0,0,0)" : "var(--foreground)",
        }}
        onClick={() => setType(() => Types.LAYER)}
      >
        {/* {collapsed ? <BiLayer size={18} /> : <BiCollapseAlt size={18} />} */}
        <BiLayer size={18} />
      </button>
      <button
        type="button"
        style={{
          border: "1px solid var(--foreground)",
          position: "relative",
          zIndex: 1,
          borderLeft: "none",
          borderBottomColor:
            type == Types.MATERIAL ? "rgba(0,0,0,0)" : "var(--foreground)",
        }}
        onClick={() => setType(() => Types.MATERIAL)}
      >
        <BiColor size={18} />
      </button>
      {!!type ? (
        <div
          className={styles.dialog}
          style={{
            maxHeight: "calc(100vh - 6rem)",
            overflow: "auto",
            maxWidth: "20rem",
            marginTop: "-1px",
            paddingTop: "1rem",
          }}
        >
          <button
            type="button"
            style={{
              right: 0,
              top: 0,
              position: "absolute",
            }}
            onClick={() => setType(null)}
          >
            <BiCollapseAlt size={18} />
          </button>
          {type == Types.LAYER ? (
            <>
              {Object.keys(systems).map((system) => {
                return (
                  <div key={system}>
                    <label
                      style={{
                        fontSize: "0.875rem",
                        display: "flex",
                        flexDirection: "row",
                        gap: "0.5rem",
                        padding: "1rem",
                        alignItems: "flex-start",
                        marginLeft: `${systems[system].i * 2}rem`,
                      }}
                    >
                      <input
                        type={"checkbox"}
                        onChange={(e) =>
                          e.target.checked
                            ? setSelectedSystems((prev) => [...prev, system])
                            : setSelectedSystems((prev) =>
                                prev.filter((d) => d != system)
                              )
                        }
                        checked={selectedSystems.includes(system)}
                      />
                      <span>{system}</span>
                    </label>
                  </div>
                );
              })}
            </>
          ) : (
            <>
              {materials.map((material) => {
                return (
                  <div key={material.name}>
                    <label
                      style={{
                        fontSize: "0.875rem",
                        display: "flex",
                        flexDirection: "row",
                        gap: "0.5rem",
                        padding: "1rem",
                        alignItems: "flex-start",
                      }}
                    >
                      <input
                        type={"checkbox"}
                        checked={selectedMaterials.includes(material.name)}
                        onChange={(e) =>
                          e.target.checked
                            ? setSelectedMaterials((prev) => [...prev, material.name])
                            : setSelectedMaterials((prev) =>
                                prev.filter((d) => d != material.name)
                              )
                        }
                      />
                      <div>
                        <span>{material.name}</span>
                      </div>
                    </label>
                  </div>
                );
              })}
            </>
          )}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};
