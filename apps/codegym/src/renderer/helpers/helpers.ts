import { Oj } from '@common/schemas/oj';
import { OjProblem } from '@common/schemas/problems';
import { copyUrlToClipboard } from '@interapp/helpers/helpers';

function buildOjProblemUrl(oj: Oj, path: string): string {
  let result = '';
  switch (oj) {
    case 'cf':
      result = `https://codeforces.com/problemset/problem/${path}`;
      break;
    case 'neps':
      result = `https://neps.academy/exercise/${path}`;
      break;
    case 'leetcode':
      result = `https://leetcode.com/problems/${path}`;
      break;
    case 'uva':
      result = `https://onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=859&page=show_problem&problem=${path}`;
      break;
    case 'kattis':
      result = `https://open.kattis.com/problems/${path}`;
      break;
    case 'timus':
      result = `https://acm.timus.ru/problem.aspx?num=${path}`;
      break;
  }
  return result;
}

export function handleProblemClick(problem: OjProblem[Oj]) {
  const url = buildOjProblemUrl(problem.oj, problem.path);
  copyUrlToClipboard(url);
}
