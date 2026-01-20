import { Filters } from './filters';
import { Profile, ProfileRegistry } from './profile';
import { TagsMap } from './tags';
import { UISettings } from './ui';

export type StartupData = {
  currProfile: Profile | null;
  profileRegistry: ProfileRegistry;
  ui: UISettings | null;
  filters: Filters | null;
  tags: TagsMap | null;
};
