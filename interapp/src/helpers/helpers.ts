import { useToastStore } from '@interapp/store/toast';

export function copyUrlToClipboard(url: string) {
  const store = useToastStore();
  navigator.clipboard
    .writeText(url)
    .then(() => {
      store.showToast('URL copied to the clipboard!', 'success');
    })
    .catch(() => {
      store.showToast('Error on copying URL!', 'error');
    });
}
