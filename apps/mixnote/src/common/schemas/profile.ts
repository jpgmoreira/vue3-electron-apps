export type Profile = {
  id: string;
  name: string;
};

export type ProfileRecord = {
  id: string;
  name: string;
  createdAt: number;
  lastAccess: number;
  notes: number;
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
