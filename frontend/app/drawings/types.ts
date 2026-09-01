export type Drawing = {
  id: string;
  filename: string;
  clean_filename: string;
  title?: string | null;
  uuid: string;
  rel_path: string;
  source_pdf_full_path: string;
  height: number;
  width: number;
  group: string;
  extracted_text: string;
  date_info: {
    date: string;
    month: number;
    year: number;
  } | null;
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
