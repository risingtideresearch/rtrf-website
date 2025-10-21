import { PortableText } from "next-sanity";
import { Canvas3D } from "../anatomy/three-d/Canvas3D";
import styles from "./page.module.scss";
import TogglePane from "../components/TogglePane/TogglePane";
import Link from "next/link";
import { LiaArrowLeftSolid, LiaArrowRightSolid } from "react-icons/lia";
import ImageSet from "../components/ImageSet";

const components = {
  types: {
    imageSet: ({ value }) => (
      <figure>
        <ImageSet assets={value.imageSet} title={value.title} variableSize={false} />
        {value.caption && <figcaption>{value.caption}</figcaption>}
      </figure>
    ),
  },
};

export default async function Article({ data, navigation }) {
  console.log(data);
  const updated = new Date(data._updatedAt);
  const published = new Date(data._createdAt);
  return (
    <>
      {/* <input
        type="text"
        placeholder="search"
        // value={search}
        style={{
          border: "1px solid",
          position: "fixed",
          top: "3.25rem",
          left: "0.5rem",
          width: "15rem",
          zIndex: "1",
        }}
        // onChange={(e) => {
        //   const val = e.target.value;
        //   setSearch(val);
        // }}
      /> */}

      <div className={styles.page__metadata}>
        <div>
          <h6>Author</h6>
          <h6>Name(s)</h6>
        </div>
        <div>
          <h6>Published</h6>

          <h6>{published.toLocaleDateString()}</h6>
        </div>
        {updated.toLocaleDateString() != published.toLocaleDateString() && (
          <div>
            <h6>Updated</h6>

            <h6>{updated.toLocaleDateString()}</h6>
          </div>
        )}
        {navigation.next && (
          <div>
            <h6>Next</h6>
            <a href={`/article/${navigation.next.slug}`}>
              <LiaArrowRightSolid size={18} />
              <h6>{navigation.next.title}</h6>
            </a>
          </div>
        )}
        {navigation.prev && (
          <div>
            <h6>Prev</h6>

            <a href={`/article/${navigation.prev.slug}`}>
              <LiaArrowLeftSolid size={18} />
              <h6>{navigation.prev.title}</h6>
            </a>
          </div>
        )}
      </div>
      <main className={styles.page}>
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "1fr 30rem",
          }}
          className={styles.page__header}
        >
          <div>
            <Link href={"/articles/"}>
              <h6>{data.section || ""}</h6>
            </Link>
            <h1>{data.title}</h1>
            <p>{data.subtitle}</p>
          </div>
          {data.relatedModels && (
            <TogglePane
              title={`Anatomy / ${data.title}`}
              defaultSize={{ maxHeight: "30rem", aspectRatio: 1 }}
              expandedSize={{ height: "100%" }}
            >
              <div
                className="bg--grid"
                style={{
                  border: "1px solid #eee",
                  borderLeft: "none",
                  height: "100%",
                  width: "100%",
                }}
              >
                <Canvas3D
                  height={"100%"}
                  clippingPlanes={{}}
                  filteredLayers={data.relatedModels}
                  content={{
                    annotations: [],
                  }}
                  settings={{
                    expand: false,
                  }}
                />
              </div>
            </TogglePane>
          )}
        </div>

        <PortableText value={data.content} components={components} />
      </main>
    </>
  );
}
