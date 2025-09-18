// "use client";

// import { useEffect, useState } from "react";

// interface IXMLtoSVGProps {
//   url: string;
// }

// export default function XMLtoSVG({ url }: IXMLtoSVGProps) {
//   const [xmlContent, setXmlContent] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchXML = async () => {
//       try {
//         const response = await fetch(url, {
//           headers: {
//             Authorization: `Bearer ${process.env.SANITY_API_READ_TOKEN}`,
//           },
//         });

//         // if (!response.ok) {
//         //   throw new Error(`Error fetching XML: ${response.statusText}`);
//         // }

//         const text = await response.text();
//         setXmlContent(text);
//       } catch (error) {
//         console.error("Failed to fetch XML:", error);
//       }
//     };

//     fetchXML();
//   }, [url]);

//   if (!xmlContent) {
//     return <div>Loading...</div>;
//   }

//   return <div dangerouslySetInnerHTML={{ __html: xmlContent }} />;
// }

interface IXMLtoSVGProps {
  url: string;
}

export default async function XMLtoSVG({ url }: IXMLtoSVGProps) {
  const xmlResponse = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.SANITY_API_READ_TOKEN}`,
    },
  });
  const xmlContent = await xmlResponse.text();

  return <div dangerouslySetInnerHTML={{ __html: xmlContent }} />;
}
