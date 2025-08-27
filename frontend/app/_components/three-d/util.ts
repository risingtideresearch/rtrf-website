export enum Units {
  Meters = 'Meters',
  Feet = 'Feet',
}

export const models = await fetch("models/export_manifest.json")
  .then((res) => res.json())
  .then((data) => {
    return data.exported_layers
      .filter((d) => d.file_size > 0 && d.file_size < 2000000 && !d.filename.includes('SMARTPLUG'))
      .map((d) => "models/" + d.filename);
  });

//   [,

//     "models/PROPULSION__SHAFTLINE COMPONENTS__shaft__surfs.glb",
//     "models/PROPULSION__rudder assembly__foil top wedge contoured.glb",
//     "models/PROPULSION__rudder assembly__rudder shaft & foil.glb",
//     "models/PROPULSION__rudder assembly__Turcite bushings.glb",
//     "models/PROPULSION__rudder assembly__SS thrust bearing, polished top.glb",
//     "models/PROPULSION__rudder assembly__SS sleeve.glb",
//     "models/PROPULSION__rudder assembly__Rudder tube__G10 tube 3_ OD X 2.75_ ID.glb",
//     "models/PROPULSION__rudder assembly__Rudder tube__Molded tube ends for turc bushings.glb",
//     "models/PROPULSION__MOTOR MOUNT__marks.glb",
//     "models/HULLS, INTERNALS, ETC.__steering shelf concepts__P&S rudder shelf.glb",

// ]

// export const tempMapping = {
//   hull: "models/HULLS, INTERNALS, ETC.__hull.glb",
//   bridgedeck: "models/HULLS, INTERNALS, ETC.__deck.glb",
//   "multifunction-display": "",
//   "smart-plug-inlet-box": "",
//   "dc-disconnect": "",
//   propeller: "",
//   "motor-mount": "models/PROPULSION__MOTOR MOUNT__surfs.glb",
//   "aft-beam-hatch": "",
//   "battery-management-system": "",
//   "dinghy-davit-block-and-tackle": "",
//   "center-beam": "models/HULLS, INTERNALS, ETC.__CTR BEAM FROM EXIST. PART MSMTS__ctr beam outside surfaces.glb",
//   "propeller-strut": "models/PROPULSION__propeller & strut.glb",
//   "solar-controller": "",
//   "solar-panel": "",
//   "propeller-shaft": "",
//   "battery-compartment": "",
//   motor: "",
//   "heat-pump": "",
//   rudder: "",
//   "dc-distributor": "",
//   "ac-charger": "",
//   superstructure: "models/Superstructure.gltf",
//   "stern-tube": "models/PROPULSION__SHAFTLINE COMPONENTS__stern tube 2_ OD X 1.5_ ID GRP source from fisheries supply.glb",
//   bearing: "models/PROPULSION__SHAFTLINE COMPONENTS__Cutless Bearing brass _Bale_ size.glb",
//   "shaft-seal": "models/PROPULSION__SHAFTLINE COMPONENTS__PSS shaft seal 02-100-200__surfs.glb",
//   battery: "",
//   "motor-controllor": "",
// };

export const tempMapping = {
  "HULLS, INTERNALS, ETC.__hull": "hull",
  "HULLS, INTERNALS, ETC.__deck": "bridgedeck",
  "PROPULSION__MOTOR MOUNT__surfs": "motor-mount",
  "HULLS, INTERNALS, ETC.__CTR BEAM FROM EXIST. PART MSMTS__ctr beam outside surfaces":
    "center-beam",
  "PROPULSION__propeller & strut": "propeller-strut",
  "Superstructure.gltf": "superstructure",
  "PROPULSION__SHAFTLINE COMPONENTS__stern tube 2_ OD X 1.5_ ID GRP source from fisheries supply":
    "stern-tube",
  "PROPULSION__SHAFTLINE COMPONENTS__Cutless Bearing brass _Bale_ size":
    "bearing",
  "PROPULSION__SHAFTLINE COMPONENTS__PSS shaft seal 02-100-200__surfs":
    "shaft-seal",
  "PROPULSION__SHAFTLINE COMPONENTS__shaft__surfs": "propeller-shaft",
};
