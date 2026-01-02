export type NepsResponseDTO = {
  data: {
    id: number;
    score: number;
    solved: number;
    title: {
      value: string; // May be an empty string.
    };
  }[];
};
