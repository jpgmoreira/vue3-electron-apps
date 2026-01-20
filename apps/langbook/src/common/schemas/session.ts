export type Session = {
  id: string;
  name: string;
  count: number;
  createdAt: number;
};

export type SessionsMap = Record<string, Session>;

export function getEmptySession(id: string, name: string, timestamp: number): Session {
  return {
    id,
    name,
    count: 0,
    createdAt: timestamp,
  };
}
