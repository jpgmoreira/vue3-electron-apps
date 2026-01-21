import { Ref } from 'vue';

export function useEvents(editorRef: Ref<HTMLElement | null>) {
  /**
   * Current image selected for resizing.
   * There will be at most one with this class at a time.
   */
  const selectedImageClass = 'selected-image';

  function click(e: MouseEvent) {
    if (!editorRef.value) throw new Error('Editor not set!');
    const element = e.target as HTMLElement;
    const si = [...editorRef.value.querySelectorAll(`.${selectedImageClass}`)];
    clearSelectedImage();
    if (element.tagName === 'IMG' && !si.includes(element)) {
      element.classList.add(selectedImageClass);
    }
  }

  function wheel(e: WheelEvent) {
    const el = e.target as HTMLElement;
    if (el.tagName === 'IMG' && el.classList.contains(selectedImageClass)) {
      e.preventDefault();
      const img = el as HTMLImageElement;
      const factor = e.ctrlKey ? 60 : 6;
      let scale = img.width ? Math.max(img.width / factor, 3) : 3;
      if (e.deltaY > 0) scale *= -1;
      img.width += scale;
    }
  }

  function clearSelectedImage() {
    if (!editorRef.value) throw new Error('Editor not set!');
    const si = [...editorRef.value.querySelectorAll(`.${selectedImageClass}`)];
    si.forEach((element) => element.classList.remove(selectedImageClass));
  }

  return { click, wheel, clearSelectedImage };
}
