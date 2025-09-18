"use client";

export const scaleValues = [
  {
    title: "Large (10m)",
    value: "10m",
  },
  {
    title: "Medium (1m)",
    value: "1m",
  },
  {
    title: "Small (0.1m)",
    value: "0.1m",
  },
];

export default function PartCatalogFilters({ anatomies, filters, setFilters }) {
  const update = (key: "scales" | "anatomies" | "types", value: string) => {
    setFilters((prev) => {
      const prevVal = prev[key];
      if (prevVal.includes(value)) {
        return {
          ...prev,
          [key]: prevVal.filter((d) => d != value),
        };
      }
      return {
        ...prev,
        [key]: [...prevVal, value],
      };
    });
  };
  return (
    <>
      <div style={{ display: "flex", gap: "1rem" }}>
        {anatomies.map((anat) => {
          return (
            <span
              key={anat._id}
              style={{
                background: filters.anatomies.includes(anat._id)
                  ? "#f0f0f0"
                  : "",
                cursor: "pointer",
                marginBottom: "2rem",
              }}
              onClick={() => {
                update("anatomies", anat._id);
              }}
            >
              {anat.title}
            </span>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "1rem" }}>
        {scaleValues.map((scale) => {
          return (
            <span
              key={scale.value}
              style={{
                background: filters.scales.includes(scale.value)
                  ? "#f0f0f0"
                  : "",
                cursor: "pointer",
                marginBottom: "2rem",
              }}
              onClick={() => {
                update("scales", scale.value);
              }}
            >
              {scale.title}
            </span>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "1rem" }}>
        {[
          { value: "customPart", title: "custom" },
          { value: "component", title: "off the shelf" },
        ].map((type) => {
          return (
            <span
              key={type.value}
              style={{
                background: filters.types.includes(type.value) ? "#f0f0f0" : "",
                cursor: "pointer",
                marginBottom: "2rem",
              }}
              onClick={() => {
                update("types", type.value);
              }}
            >
              {type.title}
            </span>
          );
        })}
      </div>
    </>
  );
}
