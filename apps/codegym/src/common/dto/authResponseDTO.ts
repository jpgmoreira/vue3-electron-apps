import { StartupData } from '@common/schemas/startup';

export type AuthResponseDTO =
  | {
      status: 'error';
      message: string;
    }
  | {
      status: 'success';
      data: StartupData;
    };
