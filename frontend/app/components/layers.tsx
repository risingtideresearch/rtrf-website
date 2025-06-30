import XMLtoSVG from "./XMLtoSVG";

interface ILayersProps {
  layers: any[];
}

export default function Layers({ layers }: ILayersProps) {
  return (
    <div>
      {/* <input
        type="range"
        min={0}
        max={layers.length}
        value={index}
        onChange={(e) => setIndex(0)}
      /> */}
      {layers.map((layer, i) => {
        return (
            <XMLtoSVG key={layer.layerName} url={layer.photo.asset.url} />
        );
      })}
    </div>
  );
}
