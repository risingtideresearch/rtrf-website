import { Image } from "../components/Image";
import PhotoMetadata from "./PhotoMetadata";
import SubNav from "../components/Navigation/SubNav";
import { URLS } from "../components/Navigation/Navigation";

export function PhotoPage({ asset, next, prev }) {
  if (!asset) {
    return <></>;
  }

  return (
    <>
      <SubNav prev={prev} next={next} urlPrefix={`${URLS.PHOTOS}/image`} />
      <div className="section--two-col detail-page">
        <div>
          <div style={{ position: "sticky", top: "3rem" }}>
            <PhotoMetadata asset={asset} stories={asset.usedInArticles} />
          </div>
        </div>
        <div>
          <div className="detail-page__image-container">
            <div
              style={{
                maxWidth: asset.metadata?.dimensions?.width
                  ? `${asset.metadata.dimensions.width}px`
                  : undefined,
                margin: "0 auto",
              }}
            >
              <Image
                loading="eager"
                src={{ asset: asset }}
                alt={
                  asset.altText ||
                  asset.description ||
                  asset.title ||
                  asset.originalFilename
                }
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
