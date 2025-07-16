import styles from "./../styles/timeline.module.scss";
import { Image } from "./Image";

export default async function Timeline({ data }) {
  return (
    <div className={styles.timeline}>
      {data.timeline?.map((event, i) => {
        return (
          <>
            <div key={event._id} className={styles.event}>
              <p className={"uppercase-mono"} style={{ fontSize: "0.75rem" }}>
                ├─{event.dates.start}
              </p>

              <p style={{ fontSize: "0.875rem" }}>{event.title}</p>

              {event.media?.map((media) => {
                return (
                  <div key={media._id} style={{ position: "relative" }}>
                    <Image
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
                className={"uppercase-mono"}
                style={{ fontSize: "0.75rem" }}
              >
                │<br/>│<br/>│
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
