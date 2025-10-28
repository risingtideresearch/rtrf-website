export enum Units {
  Meters = "Meters",
  Feet = "Feet",
}

export const processModels = (
  models_manifest
): { filename: string; file_size: number; materials: string[] }[] => {
  return models_manifest.exported_layers
    .filter(
      (d) =>
        d.file_size > 0 &&
        d.file_size < 10000000 
    )
    .map((d) => ({
      filename: d.filename,
      file_size: d.file_size,
      materials: ["Alum 5052"],
    }));
};

export type SystemsMap = { [key: string]: { children: string[]; i: number } };
export const getSystemMap = (
  layers: Array<{ filename: string; file_size: number }>
): SystemsMap => {
  const systemsMap: SystemsMap = {};

  layers.forEach((layer: { filename: string; file_size: number }) => {
    const systemParts = layer.filename
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
      systemsMap[sys].children.push(layer.filename);
      // }
    });
  });

  return systemsMap;
};
