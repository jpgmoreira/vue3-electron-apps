export type Profile = {
  id: string;
  name: string;
};

export type ProfileRecord = {
  id: string;
  name: string;
  nCards: number;
  nSessions: number;
  createdAt: number;
  lastAccess: number;
};

export type ProfileRegistry = {
  currProfileId: string | null;
  profileRecords: ProfileRecord[];
};

export function getEmptyProfileRegistry(): ProfileRegistry {
  return {
    currProfileId: null,
    profileRecords: [],
  };
}

export function getEmptyProfile(id: string, name: string): Profile {
  return {
    id,
    name,
  };
}
