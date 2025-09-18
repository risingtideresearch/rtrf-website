import { sanityFetch } from "@/sanity/lib/live";
import { anatomyQuery } from "@/sanity/lib/queries";

export async function fetchHierarchyWithIndexing() {
  const { data } = await sanityFetch({ query: anatomyQuery });
  const { roots, componentIndex, map } = buildHierarchy(data);

  return { roots, componentIndex, data, map }
}

/**
 *
 */
export function buildHierarchy(data: unknown[]) {
  const map = new Map();
  const roots: unknown[] = [];

  const componentIndex = {
    anatomy: [] as string[], 
    parts: [] as string[],  
  };

  data.forEach((item: unknown) => {
    map.set(item._id, { ...item, children: [] });
  });

  data.forEach((item) => {
    if (item.parent && item.parent._id) {
      const parent = map.get(item.parent._id);
      if (parent) {
        parent.children.push(map.get(item._id));
      } else {
        roots.push(map.get(item._id)); // Orphaned node
      }
    } else {
      roots.push(map.get(item._id)); // Root node
    }
  });

  function traverse(node: any) {
    componentIndex.anatomy.push(node._id);

    if (node.parts && Array.isArray(node.parts)) {
      node.parts.forEach((part: any) => {
        componentIndex.parts.push(part._id);
      });
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  }

  roots.forEach(traverse);

  return { roots, componentIndex, map };
}
