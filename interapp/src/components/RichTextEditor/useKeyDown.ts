export function useKeyDown() {
  /*
   * Allowed keyboard shortcuts:
   * - CTRL + c: Copy.
   * - CTRL + v: Paste.
   * - CTRL + x: Cut.
   * - CTRL + z: Undo.
   * - CTRL + y: Redo.
   * - CTRL + b: Toggle bold.
   * - CTRL + i: Toggle italic.
   * - CTRL + u: Toggle underline.
   * - CTRL + a: Select all.
   * - CTRL + s: Toggle strikethrough.
   * - CTRL + <arrow_keys>: Jump whole words.
   * - CTRL + SHIFT + <arrow_keys>: Jump whole words selecting.
   * - CTRL + SHIFT + v: Paste as plaintext.
   */
  function keydown(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    if (e.ctrlKey) {
      switch (key) {
        case 'c':
        case 'v':
        case 'z':
        case 'y':
        case 'b':
        case 'i':
        case 'u':
        case 'a':
        case 'arrowup':
        case 'arrowdown':
        case 'arrowleft':
        case 'arrowright':
          break;
        case 's':
          document.execCommand('strikeThrough');
          break;
        case 'x':
          document.execCommand('cut');
          break;
        default:
          e.preventDefault();
          return;
      }
    }
    if (key === ' ') {
      e.preventDefault();
      document.execCommand('insertHtml', false, '&nbsp;');
    } else if (key === 'tab') {
      e.preventDefault();
      document.execCommand('insertHtml', false, '&nbsp;'.repeat(8));
    }
  }
  return { keydown };
}
