export type UvaResponseDTO = [
  problemId: number, // 0 - Problem ID
  problemNumber: number, // 1 - Problem Number
  problemTitle: string, // 2 - Problem Title
  distinctAcceptedUser: number, // 3 - Number of Distinct Accepted User (DACU)
  bestRuntime: number, // 4 - Best Runtime of an Accepted Submission
  bestMemory: number, // 5 - Best Memory used of an Accepted Submission
  noVerdictGiven: number, // 6 - Number of No Verdict Given (can be ignored)
  submissionError: number, // 7 - Number of Submission Error
  cantBeJudged: number, // 8 - Number of Can't be Judged
  inQueue: number, // 9 - Number of In Queue
  compilationError: number, // 10 - Number of Compilation Error
  restrictedFunction: number, // 11 - Number of Restricted Function
  runtimeError: number, // 12 - Number of Runtime Error
  outputLimitExceeded: number, // 13 - Number of Output Limit Exceeded
  timeLimitExceeded: number, // 14 - Number of Time Limit Exceeded
  memoryLimitExceeded: number, // 15 - Number of Memory Limit Exceeded
  wrongAnswer: number, // 16 - Number of Wrong Answer
  presentationError: number, // 17 - Number of Presentation Error
  accepted: number, // 18 - Number of Accepted
  runTimeLimitMs: number, // 19 - Problem Run-Time Limit (milliseconds)
  status: number, // 20 - Problem Status (0 = unavailable, 1 = normal, 2 = special judge)
][];
