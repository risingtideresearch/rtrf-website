"use client";

import { useContext, useState, useMemo, useEffect } from "react";
import { TOCContext } from "../toc/TableOfContents";
import { FocusedView } from "./FocusedView";
import { Drawing, DrawingGroup } from "./types";
import { SYSTEM_ORDER } from "../consts";
import ImageSet from "../components/ImageSet";

function GroupHeader({ label, count }) {
  return (
    <div
      style={{
        position: "sticky",
        top: "3.25rem",
        zIndex: 10,
        marginBottom: "2rem",
        marginLeft: "0.5rem",
        height: "min-content",
        width: "11.5rem",
      }}
    >
      <div
        style={{
          margin: 0,
          border: "1px solid",
          display: "block",
          padding: "0.25rem 0.5rem",
        }}
      >
        <h5 style={{ margin: "0 0 0.5rem 0" }}>{label}</h5>
        <h6>
          {count} drawing{count > 1 ? "s" : ""}
        </h6>
      </div>
    </div>
  );
}

function filterDrawings(drawings, searchTerm, section) {
  if (!searchTerm) {
    return drawings;
  }
  const lowerSearch = searchTerm.toLowerCase();
  return drawings.filter((d) => {
    const group = d.group?.toLowerCase() || "";
    if (!section || section == group) {
      if (lowerSearch.length > 0) {
        return (
          d.filename.toLowerCase().includes(lowerSearch) ||
          group.includes(lowerSearch) ||
          d.id.toLowerCase().includes(lowerSearch) ||
          d.extracted_text
            .replaceAll("/n", " ")
            .toLowerCase()
            .includes(lowerSearch)
        );
      }
      return true;
    }
    return false;
  });
}

function sortDrawingsByTime(drawings) {
  return [...drawings]
    .sort((a, b) => a.filename.localeCompare(b.filename))
    .sort((a, b) =>
      (b.date_info?.date || "2024-01-01").localeCompare(
        a.date_info?.date || "2024-01-01"
      )
    );
}

function sortDrawingsByGroup(drawings: Array<Drawing>) {
  return [...drawings]
    .sort((a, b) => a.rel_path.localeCompare(b.rel_path))
    .sort((a, b) => {
      const aGroup = a.group.toLowerCase();
      const bGroup = b.group.toLowerCase();
      return SYSTEM_ORDER.indexOf(aGroup) - SYSTEM_ORDER.indexOf(bGroup);
    });
}

function getGroupKey(drawing: Drawing, mode): string {
  if (mode === "date") {
    return drawing.date_info?.date || "2024-01-01";
  }
  return drawing.group;
}

function getGroupLabel(drawing: Drawing, mode) {
  if (mode === "date") {
    if (drawing.date_info) {
      const date = new Date(drawing.date_info.date);
      return date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
    }
    return "Undated";
  }
  return drawing.group;
}
function groupDrawings(drawings: Drawing[], mode): DrawingGroup[] {
  const groups: DrawingGroup[] = [];

  drawings.forEach((drawing) => {
    const groupKey = getGroupKey(drawing, mode);

    let currentGroup = groups.find((g) => g.key === groupKey);

    if (!currentGroup) {
      currentGroup = {
        key: groupKey,
        label: getGroupLabel(drawing, mode),
        drawings: [],
      };
      groups.push(currentGroup);
    }

    currentGroup.drawings.push(drawing);
  });

  return groups;
}

interface DrawingsGalleryProps {
  drawings: {
    files: Array<Drawing>;
  };
  search?: string;
  defaultUUID?: string;
}

export default function DrawingsGallery({
  drawings,
  search = "",
  defaultUUID,
}: DrawingsGalleryProps) {
  const toc = useContext(TOCContext);
  const filteredAndSorted = useMemo(() => {
    const sourceData = drawings.files;

    const filtered = filterDrawings(sourceData, search, null); //toc.section);

    return toc.mode === "date"
      ? sortDrawingsByTime(filtered)
      : sortDrawingsByGroup(filtered);
  }, [drawings, toc.mode, toc.section, search]);

  const [focusIndex, setFocusIndex] = useState(
    defaultUUID ? filteredAndSorted.findIndex((d) => d.uuid == defaultUUID) : -1
  );

  // useEffect(() => {
  //   window.history.pushState(null, '', `/drawings${focusIndex > -1 ? '/' + filteredAndSorted[focusIndex].uuid : ''}`)
  // }, [focusIndex])

  // useEffect(() => {
  //   if (focusIndex > -1) {
  //     setFocusIndex(-1);
  //   }
  // }, [toc.mode]);

  const groupedDrawings: Array<DrawingGroup> = groupDrawings(
    filteredAndSorted,
    toc.mode
  );

  const handlePrev = () => {
    if (focusIndex > 0) setFocusIndex(focusIndex - 1);
  };

  const handleNext = () => {
    if (focusIndex < filteredAndSorted.length - 1)
      setFocusIndex(focusIndex + 1);
  };

  useEffect(() => {
    if (focusIndex == -1) {
      window.history.pushState(null, "", "/drawings");
      // router.push("/drawings");
    } else {
      window.history.pushState(
        null,
        "",
        `/drawings/file/${filteredAndSorted[focusIndex].uuid}`
      );
      // router.push(`/drawings/file/${filteredAndSorted[focusIndex].uuid}`)
    }
  }, [focusIndex]);

  return (
    <>
      {focusIndex > -1 ? (
        <FocusedView
          asset={filteredAndSorted[focusIndex]}
          index={focusIndex}
          all={filteredAndSorted}
          onPrev={handlePrev}
          onNext={handleNext}
          onClose={() => setFocusIndex(-1)}
        />
      ) : (
        <div>
          {groupedDrawings.map((group, groupIndex) => (
            <section
              style={{
                marginTop: groupIndex === 0 ? 0 : "4rem",
                display: "grid",
                gridTemplateColumns: "1fr 12rem ",
              }}
              key={group.label + groupIndex}
            >
              <ImageSet
                assets={group.drawings}
                onClick={(drawing) =>
                  setFocusIndex(filteredAndSorted.indexOf(drawing))
                }
              />
              <GroupHeader label={group.label} count={group.drawings.length} />
            </section>
          ))}
        </div>
      )}
    </>
  );
}
