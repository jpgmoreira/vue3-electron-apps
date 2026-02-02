import { DEFAULT_HIGH_FREQUENCY_INTERVAL, DEFAULT_LOW_FREQUENCY_INTERVAL } from '@common/constants';

export type Settings = {
  highInterval: number;
  lowInterval: number;
};

export function getEmptySettings(): Settings {
  return {
    highInterval: DEFAULT_HIGH_FREQUENCY_INTERVAL,
    lowInterval: DEFAULT_LOW_FREQUENCY_INTERVAL,
  };
}
