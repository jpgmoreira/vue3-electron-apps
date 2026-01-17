import { GraphRecord } from './graph';
import { OjContext } from './ojContext';
import { OjMeta } from './ojMeta';
import { Profile, ProfileRegistry } from './profile';
import { UISettings } from './ui';

export type StartupData = {
  currProfile: Profile | null;
  profileRegistry: ProfileRegistry;
  ojMeta: OjMeta;
  ojContext: OjContext | null;
  ui: UISettings | null;
  graphData: GraphRecord[];
};
