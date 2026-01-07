import { Ref } from 'vue';

export type LoginActionsType<ProfileRecord> = {
  modals: {
    create: boolean;
    rename: boolean;
    delete: boolean;
  };
  names: {
    create: string;
    rename: string;
  };
  isDeleting: Ref<boolean>;
  selected: Ref<ProfileRecord | null>;
  createProfile: () => void;
  applyRename: () => void;
  deleteProfile: () => void;
};

export const LoginActionsKey = Symbol('LoginActions');
