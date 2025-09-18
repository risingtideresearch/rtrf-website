"use client";

import { IAnatomyDrawerSection } from "./AnatomyDrawer";

export default function AnnotationsList({
  navTo,
  active,
  content
}: IAnatomyDrawerSection) {
  return (
    <>
      <h6>Annotations</h6>
      <div>
        {content.map((item, i) => (
          <p key={item._id} style={{whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'}}>
            <strong>{i + 1}</strong> &nbsp;
            {item.note}
          </p>
        ))}
      </div>
    </>
  );
}
