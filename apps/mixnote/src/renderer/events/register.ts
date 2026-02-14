import { eventEmitter } from './emitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import { StartupData } from '@common/schemas/startup';
import { useProfileStore } from '@renderer/store/profile';
import { useGraphStore } from '@renderer/store/graph';
import { useTabsStore } from '@renderer/store/tabs';
import { useUIStore } from '@renderer/store/uiStore';
import { useNotesStore } from '@renderer/store/notes';
import { useSettingsStore } from '@renderer/store/settings';
import { useFiltersStore } from '@renderer/store/filters';
import { useStatisticsStore } from '@renderer/store/statistics';

eventEmitter.on(CommonEvents.loadInitialData, async (data: StartupData) => {
  useProfileStore().initFromStartupData(data);
  useGraphStore().initFromStartupData(data);
  useTabsStore().initFromStartupData(data);
  useUIStore().initFromStartupData(data);
  useSettingsStore().initFromStartupData(data);
  useFiltersStore().initFromStartupData(data);
  await useNotesStore().initFromStartupData(data);
});

eventEmitter.on(CommonEvents.clearProfileData, () => {
  useGraphStore().clear();
  useTabsStore().clear();
  useUIStore().clear();
  useSettingsStore().clear();
  useFiltersStore().clear();
  useNotesStore().clear();
  useStatisticsStore().clear();
});
