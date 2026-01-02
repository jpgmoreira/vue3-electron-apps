import { randomId } from '@common/utils/utils';

export type ContestProblemFlag = 'todo' | 'favorite' | 'solved';

// "solvedDate" is a number in the format YYYYMMDD. It is calculated based on the user's local time.
export type ContestProblem = {
  id: string;
  title: string;
  accepted: string;
  notes: string;
  solved: boolean;
  todo: boolean;
  favorite: boolean;
  solvedDate: number | null;
};

export type Contest = {
  id: string;
  name: string;
  createdAt: number;
  notes: string;
  problems: ContestProblem[];
};

export function getEmptyContest(id: string, name: string, createdAt: number): Contest {
  name = name.trim();
  return {
    id,
    name,
    createdAt,
    notes: '',
    problems: [],
  };
}

export function getEmptyContestProblem(): ContestProblem {
  const id = randomId();
  return {
    id,
    title: '',
    accepted: '',
    notes: '',
    solved: false,
    todo: false,
    favorite: false,
    solvedDate: null,
  };
}
