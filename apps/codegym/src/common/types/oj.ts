export const OjNames = Object.freeze({
  cf: 'Codeforces',
  kattis: 'Kattis',
  neps: 'Neps',
  uva: 'UVA',
  timus: 'Timus',
  leetcode: 'Leetcode',
});

export const OjList = Object.freeze(['cf', 'kattis', 'neps', 'uva', 'timus', 'leetcode'] as const);

export type Oj = (typeof OjList)[number];

export type OjWithContests = Oj | 'contests';

export const OjColors = Object.freeze({
  cf: '#E6194B',
  kattis: '#3CB44B',
  neps: '#FF7F00',
  uva: '#4363D8',
  timus: '#009A9A',
  leetcode: '#911EB4',
  contests: '#800000',
  total: '#333333',
} as const);
