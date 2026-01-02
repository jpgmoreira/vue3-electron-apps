import { Oj } from '@common/types/oj';
import { getEmptyOjContext, OjContext } from './ojContext';
import { AuthPage } from '@common/types/authPage';

export type Profile = {
  id: string;
  name: string;
  page: AuthPage;
  currOj: Oj;
  currContestId: string | null;
  ojContext: OjContext;
};

export type ProfileRecord = {
  id: string;
  name: string;
  createdAt: number;
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
    page: '/problems',
    currOj: 'cf',
    currContestId: null,
    ojContext: getEmptyOjContext(),
  };
}
