import { Oj } from './oj';

export type UISettings = {
  page: string;
  currOj: Oj;
  currContestId: string | null;
};

export function getEmptyUISettings(): UISettings {
  return {
    page: '/problems',
    currOj: 'cf',
    currContestId: null,
  };
}
