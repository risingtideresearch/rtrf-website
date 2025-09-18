export enum Units {
  Meters = "Meters",
  Feet = "Feet",
}

export const models = await fetch("models/export_manifest.json")
  .then((res) => res.json())
  .then((data) => {
    return data.exported_layers
      .filter(
        (d) =>
          d.file_size > 0
          // && d.file_size < 200000 
          // && !d.filename.toLowerCase().includes("marks") 
      )
      .map((d) => "models/" + d.filename);
  });

export const materialIndex = await fetch("script-output/material_index.json")
  .then((res) => res.json())
  .then((data) => {
    return data
  })

export type SystemsMap = { [key: string]: { children: string[]; i: number } };
export const getSystemMap = (layers: string[]): SystemsMap => {
  const systemsMap: SystemsMap = {};

  layers.forEach((layer: string) => {
    const systemParts = layer
      .replace("models/", "")
      .replaceAll(".", "")
      .replace("glb", "")
      .split("__");

    systemParts.forEach((sys, i) => {
      // if (i < 3) {
        if (!systemsMap[sys]) {
          systemsMap[sys] = {
            children: [],
            i: i,
          };
        }
        systemsMap[sys].children.push(layer);
      // }
    });
  });

  return systemsMap;
};
