import { Status } from '@interapp/types/status';
import { defineStore } from 'pinia';

export const useToastStore = defineStore('toast', {
  state: () => ({
    toast: {
      visible: false,
      message: '',
      type: 'success' as Status,
    },
  }),
  actions: {
    showToast(message: string, type: Status, duration: number = 3000) {
      this.toast.message = message;
      this.toast.type = type;
      if (this.toast.visible) return;
      this.toast.visible = true;
      setTimeout(() => {
        this.toast.visible = false;
      }, duration);
    },
  },
});
