export function usePaste() {
  /**
   * Class to identify spans that were copied from inside of the editor.
   * Remember that all text styles are applied to SPAN tags only.
   * I only allow styling content that was copied from inside of the
   * editor, outside content that is pasted will never be styled.
   */
  const styledSpanClass = 'xrte';
  const allowedSpanStyles = Object.freeze([
    'font-weight',
    'font-style',
    'font-size',
    'text-decoration',
    'text-decoration-line',
    'color',
    'background-color',
    'vertical-align',
  ]);

  function manualPaste(e: ClipboardEvent) {
    e.preventDefault();
    const data = e.clipboardData;
    if (!data) return;
    handlePaste(data);
  }

  function handlePaste(data: DataTransfer) {
    // 1. Check if pasting an image from the clipboard:
    const items = data.items;
    if (items && items.length && items[0].kind === 'file' && items[0].type.startsWith('image/')) {
      const file = items[0].getAsFile();
      if (!file) return;
      console.log('-> paste an image from the clipboard.');
      const reader = new FileReader();
      reader.onload = (fileEvent) => {
        const result = fileEvent.target?.result;
        if (typeof result !== 'string') return;
        document.execCommand('insertImage', false, result);
      };
      reader.readAsDataURL(file);
      return;
    }
    // 2. Check if pasting HTML content.
    const html = data.getData('text/html').trim();
    if (html) {
      console.log('-> paste as html');
      const cleaned = cleanPastedHTML(html);
      setTimeout(() => {
        document.execCommand('insertHTML', false, cleaned);
      }, 0);
      return;
    }
    // 3. Paste as plaintext:
    const text = data.getData('text/plain').trim();
    if (text) {
      console.log('-> paste as plaintext');
      setTimeout(() => {
        document.execCommand('insertText', false, text);
      }, 0);
    }
  }

  function cleanPastedHTML(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    sanitizeNode(doc.body);
    return doc.body.innerHTML;
  }

  /**
   * Removes all unwanted style attributes from a Span element.
   * This is needed because in contenteditable, even if we copied a span from
   * inside the editor, sometimes when pasting it, it shows unwanted style
   * attributes that were not present in the original span copied.
   */
  function cleanSpanStyle(el: HTMLSpanElement) {
    const style = el.getAttribute('style');
    if (style) {
      const styleMap = style
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);
      const filtered = styleMap.filter((s) => {
        const prop = s.split(':')[0].trim();
        return allowedSpanStyles.includes(prop);
      });
      if (filtered.length > 0) {
        el.setAttribute('style', filtered.join('; ') + ';');
      } else {
        el.removeAttribute('style');
      }
    }
  }

  /**
   * Sanitizes pasted HTML.
   * Remember that styled content pasted from outside of the editor will have their styles removed.
   * Only SPAN tags copied from inside the editor will keep their styles.
   */
  function sanitizeNode(node: Node) {
    const allowedAttributes = ['src', 'class', 'width'];
    const allowedClasses = [styledSpanClass];
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;

      // --- Attributes: ---
      const attributes = [...el.attributes];
      for (const attr of attributes) {
        const name = attr.name.toLowerCase();
        // Exception: keep "style" attribute for spans copied from the editor.
        if (
          name === 'style' && // Attribute is "style".
          el.tagName === 'SPAN' && // Element is a span.
          el.classList.contains(styledSpanClass) // Element was copied from inside the editor.
        ) {
          // Remove possible unwanted style attributes added automatically.
          cleanSpanStyle(el);
          continue;
        }
        if (!allowedAttributes.includes(name)) {
          el.removeAttribute(name);
        }
      }

      // --- Classes: ---
      if (el.hasAttribute('class')) {
        const finalClasses = el.classList.value
          .split(/\s+/)
          .filter((cls) => allowedClasses.includes(cls));
        if (finalClasses.length > 0) {
          el.className = finalClasses.join(' ');
        } else {
          el.removeAttribute('class');
        }
      }

      // --- Images: ---
      // I deliberately will not add images that came copied from other HTML sources,
      // and that have their source as an HTTP or HTTPS url.
      // This was done because I don't style content pasted from outside of the editor,
      // and I don't think it is important to keep the images in these cases.
      // Also images copied and pasted from inside of the editor will be base64 images.
      if (el.tagName === 'IMG') {
        try {
          const url = new URL((el as HTMLImageElement).src);
          if (url.protocol.startsWith('http')) {
            el.remove();
            return;
          }
        } catch {
          el.remove();
          return;
        }
      }
    }
    node.childNodes.forEach(sanitizeNode);
  }

  /**
   * Paste from the context menu.
   */
  async function contextPaste() {
    try {
      const clipboardItems = await navigator.clipboard.read();
      const dataTransfer = new DataTransfer();
      let html = '';
      let plainText = '';
      for (const item of clipboardItems) {
        for (const type of item.types) {
          const blob = await item.getType(type);
          // 1. If it is an image:
          if (type.startsWith('image/')) {
            const file = new File([blob], 'pasted-image', { type });
            dataTransfer.items.add(file);
            continue;
          }
          // 2. If it is HTML:
          if (type === 'text/html') {
            html = await blob.text();
            dataTransfer.setData('text/html', html);
            continue;
          }
          // 3. If it is plain text:
          if (type === 'text/plain') {
            plainText = await blob.text();
            dataTransfer.setData('text/plain', plainText);
            continue;
          }
        }
      }
      // Fallback for plain text:
      if (!plainText) {
        const txt = await navigator.clipboard.readText();
        if (txt) dataTransfer.setData('text/plain', txt);
      }
      handlePaste(dataTransfer);
    } catch (err) {
      console.warn('contextPaste failed:', err);
    }
  }

  return {
    manualPaste,
    contextPaste,
  };
}
