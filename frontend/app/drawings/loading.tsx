import TableOfContents from "@/app/toc/TableOfContents";
import Navigation from "../components/Navigation";
import { fetchSections } from "@/sanity/lib/utils";

export default async function Loading() {
  const sections = await fetchSections();
  return (
    <>
      <Navigation />
      <div>
        <TableOfContents sections={sections.data?.sections || []} modes={["system", "material"]}>
          <></>
        </TableOfContents>
      </div>
    </>
  );
}
