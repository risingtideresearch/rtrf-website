import styles from "./page.module.scss";
import AnnotationsList from "./AnnotationsList";
import AnatomyMaterials from "./AnatomyMaterials";
import AnatomySystems from "./AnatomySystems";
import { tempPhotoMapping } from "../temp-utils";

export interface IAnatomyDrawerSection {
  navTo: (to: { key: string; type: "system" | "material" } | null) => void;
  active: {
    key: string;
    type: "system" | "material";
  } | null;
}

interface IAnatomyDrawer extends IAnatomyDrawerSection {
  content: {
    annotations: Array<unknown>;
  };
}

export default function AnatomyDrawer({
  navTo,
  active,
  content,
}: IAnatomyDrawer) {
  const img = active
    ? tempPhotoMapping[active.key] || tempPhotoMapping.default
    : tempPhotoMapping.default;

  console.log(img, active);

  return (
    <div className={styles["navigation-drawer"]}>
      {!active ? (
        <>
          <h6>Solander 38</h6>
          <p className="large">
            A self-sufficient, solar-electric, coastal cruising power catamaran.
          </p>
        </>
      ) : (
        <>
          <h6 className="link" onClick={() => navTo(null)}>
            &larr;Solander 38
          </h6>
          <p className="large">{active.key}</p>
        </>
      )}
      <figure>
        <img
          key={active?.key || "default"}
          width={img.width}
          height={img.height}
          style={{ width: "100%", height: "auto" }}
          alt={img.caption}
          src={img.url}
        />
        <figcaption>{img.caption}</figcaption>
      </figure>

      <AnatomySystems navTo={navTo} active={active} />
      <AnatomyMaterials navTo={navTo} active={active} />
      {!active && (
        <>
          <AnnotationsList
            content={content.annotations}
            navTo={navTo}
            active={active}
          />

          <h6>Research</h6>
          <p
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <span>Rudder study</span>
            <span>Brant R. Savander, Ph.D., P.E.</span>
          </p>
        </>
      )}
    </div>
  );
}
