import { deepFreeze } from '@interapp/utils/utils';

export const FREQUENCY_OPTIONS = deepFreeze([
  {
    text: 'Low',
    value: 'low',
  },
  {
    text: 'Normal',
    value: 'normal',
  },
  {
    text: 'High',
    value: 'high',
  },
] as const);

export const YES_OR_NO_OPTIONS = deepFreeze([
  {
    text: 'Yes',
    value: 'yes',
  },
  {
    text: 'No',
    value: 'no',
  },
] as const);
