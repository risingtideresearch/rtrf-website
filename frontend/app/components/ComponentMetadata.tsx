import { sanityFetch } from "@/sanity/lib/live";
import { componentPartQuery } from "@/sanity/lib/queries";
import { DepartureMono } from "../layout";

import styles from "./../styles/common.module.scss";
import Link from "next/link";
import { Image } from "next-sanity/image";
import { PortableText } from "next-sanity";

interface IComponentMetadataProps {
  slug: string;
}

export default async function ComponentMetadata({
  slug,
}: IComponentMetadataProps) {
  const { data } = await sanityFetch({
    query: componentPartQuery(slug),
  });

  const { component, connections, anatomy } = data;

  console.log(data);

  return (
    <>
      <div className={styles.table}>
        {component.image ? (
          <div style={{ padding: "0.5rem", margin: "0 0 0 auto" }}>
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
          <p
            style={{
              textTransform: "uppercase",
              fontSize: "0.625rem",
              fontWeight: "bold",
            }}
          >
            part
          </p>
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
      {/* <AnatomyHierarchy slug={anatomy[0]?.slug} /> */}

      {connections ? (
        <div>
          <h3>
            Connections
          </h3>
          {connections.map((d) => {
            return (
              <div>
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

                <p style={{ fontSize: "0.875rem" }}>{d.description}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <></>
      )}

      {anatomy ? (
        <div className={styles.table}>
          <div>
            <p
              style={{
                textTransform: "uppercase",
                fontSize: "0.625rem",
                fontWeight: "bold",
              }}
            >
              Part of
            </p>

            <div>
              {anatomy.map((d) => {
                return (
                  <p>
                    <Link href={`/anatomy/${d?.slug}`}>{d?.title}&nbsp;</Link>
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}
