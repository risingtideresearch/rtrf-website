import { DepartureMono } from "../layout";
import styles from "./../styles/timeline.module.scss";
import { Image } from "./Image";

export default async function Timeline({ data }) {
  console.log(data);
  return (
    <div className={styles.timeline}>
      {data.timeline?.map((event, i) => {
        return (
          <>
            <div key={event._id} className={styles.event}>
              <p className={DepartureMono.className} style={{ fontSize: '0.675rem'}}>{event.dates.start}</p>

              <p>{event.title}</p>

              {event.media?.map((media) => {
                return (
                  <div key={media._id} style={{position: 'relative'}}>
                    <Image
                      style={{ position: "absolute" }}
                      src={media.asset.url}
                      height={120 / media.asset.metadata.dimensions.aspectRatio}
                      width={120}
                      alt={media.asset.altText}
                    />
                  </div>
                );
              })}
            </div>
            {i < data.timeline.length - 1 ? (
              <div
                style={{
                  height: "2rem",
                  width: "1rem",
                  borderLeft: "1px solid #000",
                  margin: "-0.25rem 1rem 0.25rem 0",
                }}
                className={DepartureMono.className} 
              >
              </div>
            ) : (
              <></>
            )}
          </>
        );
      })}
    </div>
  );
}
