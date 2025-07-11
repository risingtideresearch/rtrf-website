import { sanityFetch } from "@/sanity/lib/live";
import { componentPartQuery } from "@/sanity/lib/queries";
import { DepartureMono } from "../layout";

import styles from "./../styles/common.module.scss";
import Link from "next/link";
import { Image } from "next-sanity/image";
import Timeline from "./Timeline";

interface IComponentMetadataProps {
  slug: string;
  indexing: { anatomy: string[]; parts: string[] };
}

export default async function ComponentMetadata({
  slug,
  indexing,
}: IComponentMetadataProps) {
  const { data } = await sanityFetch({
    query: componentPartQuery(slug),
  });

  const { component, connections, anatomy, timelines } = data;

  console.log(data, indexing);

  return (
    <>
      {anatomy ? (
        <div style={{ textAlign: "right" }}>
          <h6>System</h6>
          {anatomy.map((d) => {
            return (
              <p>
                <Link key={d.slug} href={`/anatomy/${d?.slug}`}>
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
              width={component.image.metadata.dimensions.aspectRatio * 240}
              height={240}
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
          <p className={DepartureMono.className}>
            {indexing.parts.indexOf(component._id) + 1}
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
                  className={DepartureMono.className}
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                  }}
                >
                  {d.componentTo?.slug != component.slug ? (
                    <Link href={`/part/${d.componentTo?.slug}`}>
                      &rarr; {d.componentTo?.title}&nbsp;
                    </Link>
                  ) : (
                    <></>
                  )}
                  {d.componentFrom?.slug != component.slug ? (
                    <Link href={`/part/${d.componentFrom?.slug}`}>
                      &rarr; {d.componentFrom?.title}&nbsp;
                    </Link>
                  ) : (
                    <></>
                  )}
                </p>

                <p style={{ fontSize: "0.875rem" }}>
                  <span
                    className={DepartureMono.className}
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
            return <Timeline data={timeline} />;
          })}
        </section>
      ) : (
        <></>
      )}
    </>
  );
}
