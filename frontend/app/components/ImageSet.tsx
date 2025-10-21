"use client";

import { useState, useEffect } from "react";
import styles from "./../drawings/styles.module.scss";
import { DrawingCard } from "../drawings/DrawingCard";
import { Image } from "../components/Image";
import { FocusedView } from "../drawings/FocusedView";
import { Drawing } from "../drawings/types";

interface ImageSetProps {
  assets: unknown[];
  defaultUUID?: string;
  updateURL?: boolean;
  variableSize?: boolean;
  title?: string;
}

export default function ImageSet({
  assets,
  defaultUUID,
  updateURL = false,
  variableSize = false,
  title,
}: ImageSetProps) {
  const [focusIndex, setFocusIndex] = useState(
    defaultUUID ? assets.findIndex((a: any) => a.uuid === defaultUUID) : -1
  );

  const handlePrev = () => {
    if (focusIndex > 0) setFocusIndex(focusIndex - 1);
  };

  const handleNext = () => {
    if (focusIndex < assets.length - 1) setFocusIndex(focusIndex + 1);
  };

  useEffect(() => {
    if (updateURL) {
      if (focusIndex === -1) {
        window.history.pushState(null, "", "/drawings");
      } else {
        const asset = assets[focusIndex] as any;
        if (asset?.uuid) {
          window.history.pushState(null, "", `/drawings/file/${asset.uuid}`);
        }
      }
    }
  }, [focusIndex, updateURL, assets]);

  const focusedAsset = focusIndex > -1 ? assets[focusIndex] : null;

  return (
    <>
      {focusIndex > -1 ? (
        <FocusedView
          asset={focusedAsset as Drawing}
          index={focusIndex}
          all={assets as Drawing[]}
          onPrev={handlePrev}
          onNext={handleNext}
          onClose={() => setFocusIndex(-1)}
          popover={true}
          title={title}
        />
      ) : (
        <></>
      )}
      <div>
        {title && <h3>{title}</h3>}
        <div
          className={styles.gallery}
          style={
            variableSize
              ? {
                  gridTemplateColumns:
                    assets.length < 3
                      ? (assets || []).map((d) => "1fr").join(" ")
                      : "",
                }
              : {}
          }
        >
          {assets.map((asset, index) =>
            (asset as any)._type === "image" ? (
              <Image
                className={"image-set--photo"}
                key={(asset as any)._key}
                src={asset}
                alt={"todo: add alt text"}
                onClick={() => setFocusIndex(index)}
              />
            ) : (
              <DrawingCard
                key={(asset as any).id}
                drawing={asset as Drawing}
                onClick={() => setFocusIndex(index)}
              />
            )
          )}
        </div>
      </div>
    </>
  );
}
