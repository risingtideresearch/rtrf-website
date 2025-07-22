import styles from "./../styles/timeline.module.scss";
import { Image } from "./Image";

export default async function Timeline({ data }) {
  return (
    <div className={styles.timeline}>
      {data.timeline?.map((event, i) => {
        return (
          <>
            <div key={event._id} className={styles.event}>
              <p>
                <span className={"uppercase-mono"} style={{ fontSize: "0.75rem" }}>• </span>{event.dates.start}
              </p>

              {event.media ? (
                event.media.map((media) => {
                  return (
                    <div key={media._id} style={{ position: "relative" }}>
                      <p>{event.title}</p>
                      <Image
                        src={media.asset.url}
                        height={700}
                        width={
                          700 * media.asset.metadata.dimensions.aspectRatio
                        }
                        alt={media.asset.altText}
                      />
                    </div>
                  );
                })
              ) : (
                <p>{event.title}</p>
              )}
            </div>
            {i < data.timeline.length - 1 ? (
              <div className={"uppercase-mono"} style={{ fontSize: "0.75rem" }}>
                │<br />│<br />│
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
