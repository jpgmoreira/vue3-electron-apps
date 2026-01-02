/**
 * Allowed communication channels between main and renderer processes.
 */
export enum Channels {
  loadStartupData = 'load-startup-data',
  updateCurrOj = 'update-curr-oj',
  updateCurrPage = 'update-curr-page',
  createProfile = 'create-profile',
  login = 'login',
  logout = 'logout',
  updateOjCache = 'update-oj-cache',
  getOjProblem = 'get-oj-problem',
  setCurrSnapshotSolvedDate = 'set-curr-snapshot-solved-date',
  updateOjFilters = 'update-oj-filters',
  fetchHistoryPage = 'fetch-history-page',
  setCurrOjSnapshot = 'set-curr-oj-snapshot',
  renameCurrProfile = 'rename-curr-profile',
  deleteCurrProfile = 'delete-curr-profile',
  getContest = 'get-contest',
  addCurrContestProblem = 'add-curr-contest-problem',
  updateCurrContestNotes = 'update-curr-contest-notes',
  updateCurrContestProblem = 'update-curr-contest-problem',
  toggleCurrContestProblemFlag = 'toggle-curr-contest-problem-flag',
  deleteCurrContestProblem = 'delete-curr-contest-problem',
}
