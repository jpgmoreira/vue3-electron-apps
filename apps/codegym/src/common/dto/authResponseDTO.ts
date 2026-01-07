import { StartupData } from '@common/schemas/startup';

export type AuthResponseDTO =
  | {
      status: 'error';
      errorMsg: string;
    }
  | {
      status: 'success';
      data: StartupData;
    };
