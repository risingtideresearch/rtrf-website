import { URLS } from "../components/Navigation/Navigation";

/** File asset ids look like `file-<hash>-<ext>`; the hash is the public id. */
export const getVideoUUID = (asset?: { _id?: string }) =>
  asset?._id?.split("-")[1] || "";

export const getVideoURL = (asset?: { _id?: string }) =>
  `${URLS.VIDEO}/${getVideoUUID(asset)}`;
