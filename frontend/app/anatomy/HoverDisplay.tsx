import { useState, useEffect, useContext, useMemo } from "react";
import {
  MaterialIndex,
  Model,
  systemWeightData,
  Units,
  weightData,
} from "./three-d/util";
import { TOCContext } from "../toc/TableOfContents";
import { ControlSettings } from "./Anatomy";
import styles from "./hover-display.module.scss";
import { Component } from "@/sanity/sanity.types";

interface HoverDisplayProps {
  layer: Model | null;
  materials: MaterialIndex;
  settings: ControlSettings;
  componentParts: Array<Component>;
  // the picked instance inside the layer, when the caller resolves that far
  partName?: string;
  lockedAt?: { x: number; y: number } | null;
  // align to this element's top rather than the viewport
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export default function HoverDisplay({
  layer,
  materials,
  settings,
  componentParts,
  partName,
  lockedAt,
  containerRef,
}: HoverDisplayProps) {
  const [displayLayer, setDisplayLayer] = useState(layer);
  const [isVisible, setIsVisible] = useState(false);
  const { article } = useContext(TOCContext);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [tooltipSize, setTooltipSize] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (layer && layer.layer_name) {
      setDisplayLayer(layer);
      setIsVisible(true);
    } else {
      const timeout = setTimeout(() => {
        setIsVisible(false);
      }, 50);

      return () => clearTimeout(timeout);
    }
  }, [layer]);

  const tooltipWidth = 304;
  const getTooltipPosition = () => {
    const offset = 0;
    const padding = 10;
    let flip = "";
    if (typeof window === "undefined") {
      return { x: 0, y: 0 };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const tooltipHeight = tooltipSize.height || 200;

    const pos = lockedAt ?? mouse;
    let x = Math.round(pos.x + offset);
    const containerTop = containerRef?.current?.getBoundingClientRect().top;
    let y =
      containerTop !== undefined
        ? Math.max(containerTop, padding)
        : window?.innerWidth < 800
          ? 130
          : 80;

    if (x + tooltipWidth + padding > viewportWidth) {
      x = pos.x - tooltipWidth - offset;
      flip = "x";
    }

    if (y + tooltipHeight + padding > viewportHeight) {
      y = pos.y - tooltipHeight - offset;
      flip = "y";
    }

    if (x < padding) {
      x = padding;
    }

    if (y < padding) {
      y = padding;
    }

    return { x, y, flip };
  };

  const position = getTooltipPosition();

  const componentPart = useMemo(() => {
    return componentParts.find(
      (part: Component) => part.relatedModel == displayLayer?.filename,
    );
  }, [componentParts, displayLayer]);

  if (!displayLayer || !displayLayer.layer_name) {
    return <></>;
  }

  const parts = displayLayer.layer_name.split("::");
  const last = parts[parts.length - 1];

  const roundToSignificantDigit = (num: number) => {
    if (settings.units == Units.Meters) {
      num /= 2.205;
    }
    const magnitude = Math.min(Math.pow(10, Math.floor(Math.log10(num))), 100);
    return Math.round(num / magnitude) * magnitude;
  };

  const rows = (
    <>
      {componentPart ? (
        <>
          <div className={styles.row}>
            <h6 className={`${styles.cell} ${styles["cell--label"]}`}>Part</h6>
            <h6 className={styles.cell}>{componentPart.title}</h6>
          </div>
          {componentPart.componentPart && (
            <div className={styles.row}>
              <h6 className={`${styles.cell} ${styles["cell--label"]}`}>
                Model
              </h6>
              <h6 className={styles.cell}>{componentPart.componentPart}</h6>
            </div>
          )}
        </>
      ) : (
        <div className={styles.row}>
          <h6 className={`${styles.cell} ${styles["cell--label"]}`}>Part</h6>
          <h6 className={`${styles.cell} ${styles["cell--value"]}`}>
            {partName ??
              last
              .toLowerCase()
              .replace(
                /\b(surfs|surfaces|mesh|simplified|approx\.|outside)\b/g,
                "",
              )
              .replace(/_/g, " ")
              .replace(/\bctr\b/g, "center")
              .replace(/\bbhds\b/g, "bulkheads")
              .replace(/\s{2,}/g, " ")}
          </h6>
        </div>
      )}

      {materials[displayLayer?.filename] && (
        <div className={styles.row}>
          <h6 className={`${styles.cell} ${styles["cell--label"]}`}>
            Material
          </h6>
          <h6 className={styles.cell}>
            {materials[displayLayer?.filename]?.join(", ")}
          </h6>
        </div>
      )}

      {systemWeightData[displayLayer?.system] && !article ? (
        <div className={styles.row}>
          <h6 className={`${styles.cell} ${styles["cell--label"]}`}>
            {`${displayLayer.system} weight (${settings.units == Units.Feet ? "lb" : "kg"})`}
          </h6>
          <h6 className={styles.cell}>
            {roundToSignificantDigit(
              systemWeightData[displayLayer?.system].weight,
            )}
          </h6>
        </div>
      ) : weightData[displayLayer?.filename] ? (
        <>
          {weightData[displayLayer?.filename].quantity > 1 && (
            <div className={styles.row}>
              <h6 className={`${styles.cell} ${styles["cell--label"]}`}>
                Quantity
              </h6>
              <h6 className={styles.cell}>
                {weightData[displayLayer?.filename].quantity}
              </h6>
            </div>
          )}
          <div className={styles.row}>
            <h6 className={`${styles.cell} ${styles["cell--label"]}`}>
              {`Approx Wt (${settings.units == Units.Feet ? "lb" : "kg"})`}
            </h6>
            <h6 className={styles.cell}>
              {roundToSignificantDigit(
                weightData[displayLayer?.filename].quantity *
                  weightData[displayLayer?.filename].weightPerUnit,
              )}
              {weightData[displayLayer?.filename].quantity > 1
                ? ` (${parseFloat(
                    (
                      roundToSignificantDigit(
                        weightData[displayLayer?.filename].quantity *
                          weightData[displayLayer?.filename].weightPerUnit,
                      ) / weightData[displayLayer?.filename].quantity
                    ).toFixed(1),
                  )} / unit)`
                : ""}
            </h6>
          </div>
        </>
      ) : null}
    </>
  );

  if (isMobile) {
    return (
      <div
        className={`pane ${styles.panel} ${isVisible ? styles["panel--visible"] : ""}`}
      >
        {rows}
      </div>
    );
  }

  return (
    <>
      <div
        ref={(el) => {
          if (el && el.offsetHeight !== tooltipSize.height) {
            setTooltipSize({ width: el.offsetWidth, height: el.offsetHeight });
          }
        }}
        className={`pane ${styles.tooltip} ${isVisible ? styles["tooltip--visible"] : ""}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: tooltipWidth,
        }}
      >
        {rows}
        <div
          className={`${styles.connector} ${isVisible ? styles["connector--visible"] : ""} ${position.flip == "x" ? styles["connector--right"] : styles["connector--left"]}`}
          style={{
            height: Math.abs((lockedAt ?? mouse).y - position.y) - tooltipSize.height,
            top: tooltipSize.height,
            left: Math.abs(position.x - (lockedAt ?? mouse).x) - (position.flip == "x" ? 2 : 1),
          }}
        ></div>
      </div>
    </>
  );
}
