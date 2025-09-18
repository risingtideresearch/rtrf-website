"use client";

import { useState } from "react";
import AnatomyDrawer from "./AnatomyDrawer";
import ThreeDContainer from "./ThreeDContainer";
import styles from './page.module.scss';
import { BiCollapseAlt, BiExpandAlt } from "react-icons/bi";

interface IAnatomy {
  content: {
    annotations: Array<unknown>
  }
}

export default function Anatomy({
  content
}: IAnatomy) {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState<{
    key: string;
    type: "system" | "material";
  } | null>(null);

  function navTo(to: { key: string; type: "system" | "material" }) {
    if (to) {
      setActive({
        ...to,
      });
    } else {
      setActive(null);
    }
  }

  return (
    <div className={`${styles.page} ${collapsed ? styles.collapsed : '' }`}>
      <div>
        <ThreeDContainer active={active} content={content}  />
      </div>
      <div>
        <button style={{ position: 'absolute', right: 1, color: 'black', zIndex: 1 }} onClick={() => setCollapsed(prev => !prev)}>
          {collapsed ? <BiExpandAlt size={18} /> : <BiCollapseAlt size={18} />}
        </button>
        {collapsed ? <></> : <AnatomyDrawer content={content} navTo={navTo} active={active} />}
      </div>
    </div>
  );
}
