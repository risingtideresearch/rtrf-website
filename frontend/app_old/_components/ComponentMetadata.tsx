import { sanityFetch } from "@/sanity/lib/live";
import { componentPartQuery } from "@/sanity/lib/queries";

import styles from "./../styles/common.module.scss";
import Link from "next/link";
import { Image } from "next-sanity/image";
import Timeline from "./Timeline";

interface IComponentMetadataProps {
  slug: string;
  componentIndex: { anatomy: string[]; parts: string[] };
}

export default async function ComponentMetadata({
  slug,
  componentIndex,
}: IComponentMetadataProps) {
  const { data } = await sanityFetch({
    query: componentPartQuery(slug),
  });

  const { component, connections, anatomy, timelines } = data;

  return (
    <>
      {anatomy ? (
        <div className={styles.border} style={{ textAlign: "right" }}>
          <h6>Anatomical system</h6>
          {anatomy.map((d) => {
            return (
              <p key={d.slug}>
                <Link href={`/anatomy/${d?.slug}`}>
                  {d?.title}
                </Link>
              </p>
            );
          })}
        </div>
      ) : (
        <></>
      )}
      <div className={styles.table}>
        {component.image ? (
          <div style={{ padding: "0.5rem" }}>
            <Image
              style={{ display: "block" }}
              src={component.image.url}
              width={Math.min(component.image.metadata.dimensions.aspectRatio * 240, 500)}
              height={Math.min(component.image.metadata.dimensions.aspectRatio * 240, 500) / component.image.metadata.dimensions.aspectRatio}
              alt={component.image.altText}
            />
          </div>
        ) : (
          <></>
        )}
        <div>
          <div>
            <h6>No.</h6>
          </div>
          <p className={'uppercase-mono'}>
            {componentIndex.parts.indexOf(component._id) + 1}
            {component._type == "customPart" ? "*" : ""}
          </p>
        </div>
        <div>
          <div>
            <h6>name</h6>
          </div>
          <p>{component.title}</p>
        </div>
        {component.componentPart ? (
          <div>
            <p
              style={{
                textTransform: "uppercase",
                fontSize: "0.625rem",
                fontWeight: "bold",
              }}
            >
              mfg
            </p>
            <p>{component.componentPart}</p>
          </div>
        ) : (
          <div>
            <div>
              <h6>Type</h6>
            </div>
            <p>Custom part</p>
          </div>
        )}
        {component.count ? (
          <div>
            <p
              style={{
                textTransform: "uppercase",
                fontSize: "0.625rem",
                fontWeight: "bold",
              }}
            >
              count
            </p>
            <p>{component.count}</p>
          </div>
        ) : (
          <></>
        )}
        {component.materials ? (
          <div>
            <p
              style={{
                textTransform: "uppercase",
                fontSize: "0.625rem",
                fontWeight: "bold",
              }}
            >
              materials
            </p>
            <p>{component.materials?.map((m) => m.name)}</p>
          </div>
        ) : (
          <></>
        )}
        {component.specs ? (
          component.specs.map((spec) => (
            <div key={spec._id}>
              <p
                style={{
                  textTransform: "uppercase",
                  fontSize: "0.625rem",
                  fontWeight: "bold",
                }}
              >
                {spec.key}
              </p>
              <p>
                {spec.value} {spec.unit}
              </p>
            </div>
          ))
        ) : (
          <></>
        )}
      </div>

      {connections ? (
        <div>
          <h3>Connections</h3>
          {connections.map((d, i) => {
            return (
              <div key={i}>
                <p
                  className={'uppercase-mono'}
                  style={{
                    fontSize: "0.875rem",
                    textTransform: "uppercase",
                  }}
                >
                  {d.componentTo?.slug != component.slug ? (
                    <Link href={`/part/${d.componentTo?.slug}`}>
                      ──→ {d.componentTo?.title}
                    </Link>
                  ) : (
                    <></>
                  )}
                  {d.componentFrom?.slug != component.slug ? (
                    <Link href={`/part/${d.componentFrom?.slug}`}>
                      ──→ {d.componentFrom?.title}
                    </Link>
                  ) : (
                    <></>
                  )}
                </p>

                <p style={{ fontSize: "0.875rem" }}>
                  <span
                    className={'uppercase-mono'}
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                    }}
                  >
                    &nbsp;&nbsp;
                  </span>
                  {d.description}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <></>
      )}

      {timelines.length > 0 ? (
        <section>
          <h3>Timeline</h3>
          {timelines.map((timeline) => {
            return <Timeline key={timeline._id} data={timeline} />;
          })}
        </section>
      ) : (
        <></>
      )}
    </>
  );
}
