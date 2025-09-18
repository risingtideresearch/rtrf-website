import Link from "next/link";
import Navigation from "./components/Navigation";
import { tempPhotoMapping } from "./temp-utils";

export default async function Page() {
  return (
    <div>
      <Navigation />

      <main>
        <div className="narrow">
          <h1 className="uppercase-mono">Solander 38</h1>
          <p className="large">
            A self-sufficient, solar-electric, coastal cruising power catamaran.
          </p>
          <figure>
            <img
              width={tempPhotoMapping.default.width}
              height={tempPhotoMapping.default.height}
              style={{ width: "100%", height: "auto" }}
              alt="Solander 38"
              src={tempPhotoMapping.default.url}
            />
            <figcaption>
              {tempPhotoMapping.default.caption}
            </figcaption>
          </figure>
          <p>
            The Solander 38 was designed to bring the self-sufficiency and low
            environmental impact of a cruising sailboat to boaters who prefer
            the practicality and ease of motoring.
          </p>
          <p>
            The goal: to be able to slowly cruise remote coastal waterways, like
            BC’s Inside Passage, for days or weeks at a time, without ever
            needing to wait for the right wind, take on fuel or water, or plug
            into shore power.
          </p>
        </div>
        <div className="big-nav">
          <p>
            <Link href={"/anatomy"}>Anatomy &#8594;</Link>
          </p>
          <p>
            <Link href={"/parts"}>Parts &#8594;</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
