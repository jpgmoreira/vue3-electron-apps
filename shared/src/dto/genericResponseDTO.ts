export type GenericResponseDTO =
  | {
      status: 'error';
      errorMsg: string;
    }
  | {
      status: 'success';
    };
