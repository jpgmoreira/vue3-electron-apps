import { Filters } from './filters';
import { GraphRecord } from './graph';
import { Profile, ProfileRegistry } from './profile';
import { Settings } from './settings';
import { TabGroup } from './tabs';
import { UISettings } from './ui';

export type StartupData = {
  currProfile: Profile | null;
  profileRegistry: ProfileRegistry;
  ui: UISettings | null;
  graph: GraphRecord[] | null;
  tabGroups: TabGroup[] | null;
  settings: Settings | null;
  filters: Filters | null;
};
