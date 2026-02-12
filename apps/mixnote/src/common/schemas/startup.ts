import { GraphRecord } from './graph';
import { Profile, ProfileRegistry } from './profile';
import { TabGroup } from './tabs';
import { UISettings } from './ui';

export type StartupData = {
  currProfile: Profile | null;
  profileRegistry: ProfileRegistry;
  ui: UISettings | null;
  graph: GraphRecord[] | null;
  tabGroups: TabGroup[] | null;
};
