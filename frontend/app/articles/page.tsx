import TableOfContents from "@/app/toc/TableOfContents";
import Navigation from "../components/Navigation";
import Articles from "./Articles";

export default async function Page() {

  return (
    <div>
      {/* <TableOfContents modes={["system"]}> */}
        <Navigation />
        <Articles />
      {/* </TableOfContents> */}
    </div>
  );
}
