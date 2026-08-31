import { VideoPlayer } from "../components/VideoPlayer";
import VideoMetadata from "./VideoMetadata";
import SubNav from "../components/Navigation/SubNav";
import { URLS } from "../components/Navigation/Navigation";

export function VideoPage({ asset, next, prev }) {
  if (!asset) {
    return <></>;
  }

  return (
    <>
      <SubNav prev={prev} next={next} urlPrefix={URLS.VIDEO} />
      <div className="section--two-col detail-page">
        <div>
          <div style={{ position: "sticky", top: "3rem" }}>
            <VideoMetadata asset={asset} stories={asset.usedInArticles} />
          </div>
        </div>
        <div>
          <div className="detail-page__image-container">
            <VideoPlayer asset={asset} preload="auto" />
          </div>
        </div>
      </div>
    </>
  );
}
