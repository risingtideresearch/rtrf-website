import { Model } from "./anatomy/three-d/util";

export function sortPeople(people: any[]): any[] {
  return [...people].sort((a, b) =>
    a.name === "Avi Bryant" ? -1 : b.name === "Avi Bryant" ? 1 : a.name.localeCompare(b.name)
  );
}

export function toISODate(date: Date | string): string {
  let d: Date;
  if (typeof date === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      d = new Date(date + "T00:00:00Z");
    } else {
      d = new Date(date.endsWith("Z") ? date : date + "Z");
    }
  } else if (date instanceof Date) {
    d = date;
  } else {
    return "";
  }
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toISOYearMonth(date: string | undefined | null): string {
  if (!date) return "";
  let normalized: string;
  if (/^\d{4}:\d{2}:\d{2}/.test(date)) {
    normalized = date.substring(0, 10).replace(/:/g, "-") + "T00:00:00Z";
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    normalized = date + "T00:00:00Z";
  } else {
    normalized = date.endsWith("Z") ? date : date + "Z";
  }
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return "";
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes < 0) return "";
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export function formatDate(date: Date | string) {
  let d;

  if (typeof date === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      d = new Date(date + "T00:00:00Z");
    } else {
      d = new Date(date.endsWith("Z") ? date : date + "Z");
    }
  } else if (date instanceof Date) {
    d = date;
  } else {
    return "";
  }

  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");

  return `${year}–${month}–${day}`;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatMonthYear(date: string | undefined | null): string {
  if (!date) return "";
  let normalized: string;
  if (/^\d{4}:\d{2}:\d{2}/.test(date)) {
    // EXIF "YYYY:MM:DD HH:MM:SS" → normalize to ISO
    normalized = date.substring(0, 10).replace(/:/g, "-") + "T00:00:00Z";
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    normalized = date + "T00:00:00Z";
  } else {
    normalized = date.endsWith("Z") ? date : date + "Z";
  }
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * Helper function for Rhino to Sanity associations
 * @param slug
 * @returns
 */
export const slugToRhinoSystem = (slug: string): string => {
  switch (slug) {
    case "water-heating-systems":
      return "water_heating systems".toUpperCase();
    case "outfitting-interior":
      return slug.replaceAll("-", "_").toUpperCase();
    default:
      return slug.replaceAll("-", " ").toUpperCase();
  }
};

/**
 *  Returns only visible models
 *  These are fine detail or internal parts (and often large files) that can be hidden for big picture views
 *  Used on landing page and Overview stories (when clipping planes are not present)
 *
 *  @param minimal - true for most reduced set; used on homepage
 */
export const getReducedModelSet = (
  layers: Array<Model>,
  minimal: boolean,
): Array<Model> => {
  const minimalOnlyModels = [
    "OUTFITTING_INTERIOR__DECK ACCESS STAIRLADDER",
    "OUTFITTING_INTERIOR__Isotherm",
    "OUTFITTING_INTERIOR__SIMPLIFIED CTR DECK TRACKS",
    "SUPERSTRUCTURE__ALUM. PARTS+__RAILINGS & POSTS__railing flanges",
    "SUPERSTRUCTURE__instr panel & wireway__instrument panel",
    "SUPERSTRUCTURE__WINDOWS__rough window hardware & trim",
    "SUPERSTRUCTURE__ALUM. PARTS+__flat bar base__5_ X 3_8_ baseplate surfs",
    "CONTROL__ELECTRONIC CONTROL",
    "BODY__CTR BEAM__ctr beam inside surfaces",
    "WATER_HEATING SYSTEMS__KEEL COOLERS__keel cooler surfaces",
    "OUTFITTING_INTERIOR__COMPANIONWAY HATCH__HDPE guide & coaming",
  ];

  const hiddenModels = [
    ...(minimal ? minimalOnlyModels : []),
    "BODY__INTERNALS",
    "BODY__CTR BEAM__ctr beam console bhd",
    "BODY__CTR BEAM__scupper",
    "BODY__HULLS & DECKS__PORTLIGHTS__portlight cut-out",
    "SUPERSTRUCTURE__WIREWAYS__ww parts surfs",
    "SUPERSTRUCTURE__ALUM. PARTS+__FASCIA__fascia flange brackets",
    "SUPERSTRUCTURE__ALUM. PARTS+__TOE-KICKS__TOE-KICK 1_4_ FHMS.glb",
    "SUPERSTRUCTURE__ALUM. PARTS+__TOE-KICKS__TOE-KICK FLANGES",
    "SUPERSTRUCTURE__ALUM. PARTS+__flat bar base__G10 backing plates",
    "SUPERSTRUCTURE__ALUM. PARTS+__flat bar base__3_8_ 316L SS bolts",
    "POWER ARCHITECTURE__SMARTPLUG INLET SYSTEM",
    "POWER ARCHITECTURE__ELEC BOARD COMPONENTS",
    "POWER ARCHITECTURE__SIMPLIFIED",
    "POWER ARCHITECTURE__ELEC BOARD COMPONENTS",
    "PROPULSION__MOTOR MOUNT",
    "PROPULSION__20W Bell Marine Motor",
    "PROPULSION__SHAFTLINE COMPONENTS__PSS shaft seal",
    "PROPULSION__SHAFTLINE COMPONENTS__Cutless Bearing",
    "WATER_HEATING SYSTEMS__TANKS_",
    "WATER_HEATING SYSTEMS__HEAT PUMP VENTS",
    "WATER_HEATING SYSTEMS__heat pump",
    "WATER_HEATING SYSTEMS__Headhunter",
    "WATER_HEATING SYSTEMS__dehumidifer",
    "OUTFITTING_INTERIOR__SHOWER AFT STBD",
    "OUTFITTING_INTERIOR__galley, workbench, shelving, etc.__CABINETS",
    "OUTFITTING_INTERIOR__galley, workbench, shelving, etc.__SHELF SURFS",
    "OUTFITTING_INTERIOR__galley, workbench, shelving, etc.__CABINETS__watermaker cabinet.glb",
    "OUTFITTING_INTERIOR__galley, workbench, shelving, etc.__workbench",
    "OUTFITTING_INTERIOR__galley, workbench, shelving, etc.__GALLEY",
    "OUTFITTING_INTERIOR__COMPANIONWAY HATCH__MF-02-110-60 sliding door",
    "OUTFITTING_INTERIOR__BATTERY CMPT",
    "OUTFITTING_INTERIOR__INT. FURNISHING__dbl mattress",
    "OUTFITTING_INTERIOR___ugly corner",
    "CONTROL__rudder assembly__SS thrust bearing",
    "CONTROL__rudder assembly__foil top wedge contoured",
    "CONTROL__rudder assembly__SS sleeve",
    "CONTROL__MECHANICAL STEERING__STEERING COMPONENTS__tillers",
    "CONTROL__MECHANICAL STEERING__STEERING COMPONENTS__Washer, delrin",
    "CONTROL__MECHANICAL STEERING__STEERING COMPONENTS__50mm dummy",
    "CONTROL__MECHANICAL STEERING__STEERING COMPONENTS__locking rings",
    "CONTROL__MECHANICAL STEERING__STEERING SHELVES__port dummy ",
    "CONTROL__MECHANICAL STEERING__steering tunnels",
    "CONTROL__MECHANICAL STEERING__STEERING SHELVES",
    "CONTROL__rudder assembly__Rudder tube",
    "CONTROL__rudder assembly__Turcite",
  ];

  const filtered = layers.filter(
    (layer) => !hiddenModels.find((n) => layer.filename.startsWith(n)),
  );
  return filtered;
};
