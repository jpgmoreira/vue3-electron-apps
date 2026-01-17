export type LeetcodeResponseDTO = {
  stat_status_pairs: {
    stat: {
      question__title: string;
      question__title_slug: string;
      total_acs: number;
      total_submitted: number;
    };
    difficulty: {
      level: number;
    };
    paid_only: boolean;
  }[];
};
