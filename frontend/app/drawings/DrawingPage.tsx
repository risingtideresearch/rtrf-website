import DrawingMetadata from "./DrawingMetadata";
import SubNav from "../components/Navigation/SubNav";
import { URLS } from "../components/Navigation/Navigation";
import Image from "next/image";

export function DrawingPage({ asset, next, prev, drawingsArticleDictionary }) {
  if (!asset) {
    return <></>;
  }

  return (
    <>
      <SubNav prev={prev} next={next} urlPrefix={`${URLS.DRAWINGS}/file`} showTitles={false} />
      <div className="section--two-col detail-page">
        <div>
          <div style={{ position: "sticky", top: "3rem" }}>
            <DrawingMetadata
              drawing={asset}
              stories={drawingsArticleDictionary[asset.uuid]}
            />
          </div>
        </div>
        <div>
          <div className="detail-page__image-container"
            style={asset.width && asset.height ? { aspectRatio: `${asset.width} / ${asset.height}` } : undefined}
          >
            <Image
              src={asset.rel_path}
              height={asset.height}
              width={asset.width}
              priority
              alt={`${asset.title}`}
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
