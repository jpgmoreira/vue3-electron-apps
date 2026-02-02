import { Filters } from './filters';
import { Settings } from './settings';
import { GraphRecord } from './graph';
import { Profile, ProfileRegistry } from './profile';
import { SessionsMap } from './session';
import { TagsMap } from './tags';
import { UISettings } from './ui';

export type StartupData = {
  currProfile: Profile | null;
  profileRegistry: ProfileRegistry;
  ui: UISettings | null;
  filters: Filters | null;
  tags: TagsMap | null;
  sessions: SessionsMap | null;
  graph: GraphRecord[] | null;
  settings: Settings | null;
};
