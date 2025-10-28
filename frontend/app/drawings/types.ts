export type Drawing = {
  id: string;
  uuid: string;
  rel_path: string;
  height: number;
  width: number;
  group: string;
  date_info: {
    date: string;
    month: number;
    year: number;
  };
};

export type DrawingGroup = {
  drawings: Array<Drawing>;
  label: string;
  key: string;
};
