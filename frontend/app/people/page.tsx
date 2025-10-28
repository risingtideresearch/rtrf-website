import { fetchPeople, fetchSections } from "@/sanity/lib/utils";
import Navigation from "../components/Navigation";


export default async function Page() {
  const people = await fetchPeople();
  console.log(people)

  return (
    <div>
      {/* <TableOfContents
        sections={sections?.data.sections || []}
        modes={["system", "material"]}
        materials={materials_index.unique_materials}
      > */}
      <Navigation />
      <main>
        {people.data.sort((a,b) => a.name.localeCompare(b.name)).map(person => {
          return (
            <div key={person._id}>
              {person.name}
            </div>
          )
        })}
      </main>
      {/* </TableOfContents> */}
    </div>
  );
}
