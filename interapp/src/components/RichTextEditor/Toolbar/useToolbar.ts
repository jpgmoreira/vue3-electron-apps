export function useToolbar() {
  function undo() {
    document.execCommand('undo');
  }

  function redo() {
    document.execCommand('redo');
  }
  function bold() {
    document.execCommand('bold');
  }

  function italic() {
    document.execCommand('italic');
  }

  function underline() {
    document.execCommand('underline');
  }

  function strikeThrough() {
    document.execCommand('strikeThrough');
  }

  function superscript() {
    document.execCommand('superscript');
  }

  function subscript() {
    document.execCommand('subscript');
  }

  function increaseFontSize() {
    const current = Number(document.queryCommandValue('fontSize')) || 3;
    const next = Math.min(7, current + 1).toString();
    document.execCommand('fontSize', false, next);
  }

  function decreaseFontSize() {
    const current = Number(document.queryCommandValue('fontSize')) || 3;
    const next = Math.max(1, current - 1).toString();
    document.execCommand('fontSize', false, next);
  }

  function clear() {
    const selection = window.getSelection();
    if (selection?.type === 'Caret') {
      // the current selection is collapsed.
      document.execCommand('insertText', false, ' ');
      selection.modify('extend', 'left', 'character');
    }
    // trick to remove subscript and superscript.
    document.execCommand('superscript');
    document.execCommand('subscript');
    document.execCommand('subscript');
    // necessary to call twice because of a bug with clearing the text background color.
    document.execCommand('removeFormat');
    document.execCommand('removeFormat');
  }

  function changeTextColor(color: string) {
    document.execCommand('foreColor', false, color);
  }

  function changeBackgroundColor(color: string) {
    document.execCommand('backColor', false, color);
  }

  return {
    undo,
    redo,
    bold,
    italic,
    underline,
    strikeThrough,
    superscript,
    subscript,
    increaseFontSize,
    decreaseFontSize,
    clear,
    changeTextColor,
    changeBackgroundColor,
  };
}
