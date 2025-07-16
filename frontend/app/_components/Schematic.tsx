"use client";

import { useState } from "react";
import { Image } from "./Image";

interface ISchematicProps {
  data: any[];
}

export default function Schematic({ data }: ISchematicProps) {
  const [visible, setVisible] = useState(data.layers.length);

  console.log(visible);

  return (
    <div>
      <div key={data._id} style={{ position: "relative", height: 560, width: 800 }}>
        <input
          type="range"
          value={visible}
          min={0}
          max={data.layers.length}
          onChange={(e) => setVisible(parseInt(e.target.value))}
        />
        <div style={{position: 'absolute', right: 0}}>
          {data.layers.map((layer, i) => {
            return (
              <div key={layer._id} style={{ opacity: i >= visible ? 0 : 1, margin: '0.5rem 0', textTransform: 'uppercase', fontSize: '0.875rem', fontWeight: 'bold' }}>
                <p>{layer.part.title}</p>
              </div>
            );
          })}
        </div>
        {data.layers.map((layer, i) => {
          return (
            <div
              key={layer._id}
              style={{ position: "absolute", opacity: i >= visible ? 0 : 1 }}
            >
              <Image
                src={layer.image.url}
                height={800 / layer.image.metadata.dimensions.aspectRatio}
                width={800}
                alt={layer.image.altText}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
