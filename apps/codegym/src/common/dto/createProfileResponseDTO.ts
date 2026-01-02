import { StartupData } from '@common/schemas/startup';

export type CreateProfileResponseDTO =
  | {
      status: 'error';
      errorMsg: string;
    }
  | {
      status: 'success';
      data: StartupData;
    };
