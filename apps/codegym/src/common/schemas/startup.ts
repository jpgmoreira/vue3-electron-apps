import { OjMeta } from './ojMeta';
import { Profile, ProfileRegistry } from './profile';
import { GraphRecord } from './graph';

export type StartupData = {
  ojMeta: OjMeta;
  currProfile: Profile | null;
  profileRegistry: ProfileRegistry;
  graphData: GraphRecord[];
};
