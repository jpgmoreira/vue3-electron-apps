import { defineStore } from 'pinia';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export const useUIStore = defineStore('ui', {
  state: () => ({
    toast: {
      visible: false,
      message: '',
      type: 'success',
      timer: null,
    },
  }),
  actions: {
    showToast(message: string, type: ToastType, duration: number = 3000) {
      if (this.toast.visible) return;
      this.toast.message = message;
      this.toast.type = type;
      this.toast.visible = true;
      setTimeout(() => {
        this.toast.visible = false;
      }, duration);
    },
  },
});
