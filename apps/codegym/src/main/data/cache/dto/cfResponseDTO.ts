export type CfResponseDTO = {
  result: {
    problems: {
      contestId?: number;
      index?: string;
      name: string;
      rating?: number;
      tags: string[];
    }[];
    problemStatistics: {
      contestId?: number;
      index: string;
      solvedCount: number;
    }[];
  };
};
