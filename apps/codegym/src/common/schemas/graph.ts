// "date" is a number in the format YYYYMMDD. It is calculated based on the user's local time.
export type GraphRecord = {
  date: number;
  cf: number;
  neps: number;
  leetcode: number;
  timus: number;
  uva: number;
  kattis: number;
  contests: number;
};

export function getEmptyGraphRecord(date: number): GraphRecord {
  return {
    date,
    cf: 0,
    neps: 0,
    leetcode: 0,
    timus: 0,
    uva: 0,
    kattis: 0,
    contests: 0,
  };
}
