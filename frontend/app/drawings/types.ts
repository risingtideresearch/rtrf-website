export type Drawing = {
  id: string;
  filename: string;
  title: string;
  uuid: string;
  rel_path: string;
  source_pdf_full_path: string;
  source_pdf_size_bytes: number;
  height: number;
  width: number;
  group: string;
  extracted_text: string;
  date: string | null;
  author: {
    slug: string;
    name: string;
  } | null;
};

export type DrawingGroup = {
  drawings: Array<Drawing>;
  label: string;
  key: string;
};
