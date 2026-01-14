import { Status } from '@interapp/types/status';
import { defineStore } from 'pinia';

export const useToastStore = defineStore('toast', {
  state: () => ({
    visible: false,
    message: '',
    type: 'success' as Status,
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
  }),
  actions: {
    showToast(message: string, type: Status, duration: number = 3000) {
      this.message = message;
      this.type = type;
      this.visible = true;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => (this.visible = false), duration);
    },
  },
});
