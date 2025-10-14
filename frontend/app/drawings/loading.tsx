import TableOfContents from "@/app/toc/TableOfContents";
import Navigation from "../components/Navigation";

export default async function Loading() {
  return (
    <>
      <Navigation />
      <div >
        <TableOfContents modes={["system", "material"]}>
          <></>
        </TableOfContents>
      </div>
    </>
  );
}
