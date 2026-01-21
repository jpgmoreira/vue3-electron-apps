export function useDrop() {
  /*
   * Due to some problems and difficulties related to drop events
   * in JavaScript, the only thing you are allowed to drop are
   * image files from your operating system.
   */
  function drop(e: DragEvent) {
    e.preventDefault();
    if (!e.dataTransfer) return;
    for (const item of e.dataTransfer.items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (!file) return;
        console.log('-> drop an image from the operating system.');
        const reader = new FileReader();
        reader.onload = (fileEvent) => {
          focus();
          const result = fileEvent.target?.result;
          if (typeof result !== 'string') return;
          document.execCommand('insertImage', false, result);
        };
        reader.readAsDataURL(file);
      }
    }
  }
  return { drop };
}
