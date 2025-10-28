"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import ThreeDContainer from "./ThreeDContainer";
import { TOCContext } from "../toc/TableOfContents";
import AnnotationsList from "./AnnotationsList";
import { processModels, getSystemMap } from "./three-d/util";
import { arrayBuffer } from "stream/consumers";

interface IAnatomy {
  content: {
    annotations?: Array<unknown>;
    models_manifest: unknown;
    materials_index: unknown;
  };
}

export default function Anatomy({ content }: IAnatomy) {
  const toc = useContext(TOCContext);
  const [visibleAnnotations, setVisibleAnnotations] = useState(false);
  const [activeAnnotation, setActiveAnnotation] = useState<unknown>(null);
  const [search, setSearch] = useState("");
  const memoModels = useMemo(() => processModels(content.models_manifest), []);
  const systems = useMemo(() => getSystemMap(memoModels), [memoModels]);

  console.log(toc.article, content.articles)

  const active =
    toc.mode == "system"
      ? toc.section != "overview"
        ? toc.section == "water-heating-systems"
          ? {
              type: "system",
              key: "water_heating systems".toUpperCase(),
            }
          : toc.section == "outfitting-interior"
          ? {
              type: "system",
              key: toc.section.replaceAll("-", "_").toUpperCase(),
            }
          : {
              type: "system",
              key: toc.section.replaceAll("-", " ").toUpperCase(),
            }
        : null
      : {
          type: toc.mode,
          key: toc.section,
        };

  // useEffect(() => {
  //   if (toc.mode == "system") {
  //     window.history.pushState(null, "", `/anatomy/${toc.section}`);
  //   } else {
  //     window.history.pushState(null, "", `/anatomy/overview`);
  //   }
  // }, [toc.section]);

  const filteredLayers = useMemo(() => {
    // for overview, show everything
    let arr: string[] = memoModels.map((m) => m.filename) || [];

    if (active && active.key != "overview") {
      if (active.type == "system") {
        arr = systems[active.key]?.children;
      } else if (active.type == "material") {
        arr = arr.filter((m) =>
          (content.materials_index.material_index[m] || []).includes(active.key)
        );
      }
    }

    // if (activeAnnotation && activeAnnotation.relatedModels) {
    //   // include any cross-system models with selected annotations
    //   activeAnnotation.relatedModels?.forEach((model) => {
    //     if (!arr.includes(model)) {
    //       arr = [...arr, model];
    //     }
    //   });

    //   return arr.filter((layer) => {
    //     return activeAnnotation.relatedModels.includes(layer);
    //   });
    // }

    if (search) {
      return arr.filter((layer) => {
        return layer.toLowerCase().includes(search.toLowerCase());
      });
    }

    if (toc.article) {
      console.log((content.articles || []).find(d => d.slug == toc.article))
      return (content.articles || []).find(d => d.slug == toc.article)?.relatedModels || arr
    }

    return arr

  }, [active, systems, search, activeAnnotation, toc.article]);

  const filteredContent = useMemo(
    () => ({
      ...content,
      annotations: activeAnnotation
        ? [activeAnnotation]
        : content.annotations.filter((note) => {
            // show annotation only when assocated model(s) are visible
            return note.relatedModels.find((model) =>
              filteredLayers.includes(model)
            );
          }),
    }),
    [filteredLayers]
  );

  useEffect(() => {
    if (activeAnnotation && !visibleAnnotations) {
      setVisibleAnnotations(true);
      toc.setSection(activeAnnotation.system);
    }
    if (activeAnnotation) {
      setSearch("");
    }
  }, [activeAnnotation]);

  return (
    <div>
      <input
        type="text"
        placeholder="search"
        value={search}
        style={{
          border: "1px solid",
          position: "fixed",
          top: "3.25rem",
          left: "0.5rem",
          width: "15rem",
          zIndex: "1",
        }}
        onChange={(e) => {
          const val = e.target.value;
          setSearch(val);
        }}
      />
      <ThreeDContainer
        content={filteredContent}
        setActiveAnnotation={(note) =>
          setActiveAnnotation((prev) =>
            !prev || prev?._id != note._id ? note : null
          )
        }
        filteredLayers={filteredLayers}
      />
      <AnnotationsList
        content={filteredContent.annotations}
        activeAnnotation={activeAnnotation}
        setActiveAnnotation={(note) => setActiveAnnotation(note)}
        visible={visibleAnnotations}
        setVisible={setVisibleAnnotations}
      />
    </div>
  );
}
