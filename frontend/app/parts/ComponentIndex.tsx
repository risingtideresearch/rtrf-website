export default function ComponentIndex({ componentIndex, part }) {
  const index = componentIndex.parts.indexOf(part._id) + 1 || "-";
  return (
    <span className={'uppercase-mono'}>
      {index < 10 ? <>&nbsp;</> : ""}
      {index}
      {part._type == "customPart" ? "*" : <>&nbsp;</>}
      {/* {part.title}{" "} */}
    </span>
  );
}
