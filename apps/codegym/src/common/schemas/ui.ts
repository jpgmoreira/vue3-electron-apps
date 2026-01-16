import { Oj } from './oj';

export type UISettings = {
  page: string;
  currOj: Oj;
};

export function getEmptyUISettings(): UISettings {
  return {
    page: '/problems',
    currOj: 'cf',
  };
}
