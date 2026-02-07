import DOMPurify from 'dompurify';
import { Ref } from 'vue';

export function useGetContent(editorRef: Ref<HTMLElement | null>) {
  function getContent() {
    if (!editorRef.value) throw new Error('Editor not set!');
    // Create a clone for precaution.
    const clone = editorRef.value.cloneNode(true) as HTMLElement;
    let content = normalizeLines(clone);
    content = linkifyText(content);
    content = DOMPurify.sanitize(content, {
      ADD_URI_SAFE_ATTR: ['src', 'width'],
      ALLOWED_URI_REGEXP: /^(https?|safe-file:|data:image\/[a-zA-Z0-9\.]+;base64,)/,
    });
    return content;
  }

  function linkifyText(html: string): string {
    const urlRegex = new RegExp(
      '(?:https?:\\/\\/|ftp:\\/\\/|www\\.)' + // protocol (http, https, ftp) or "www."
        '(?:' +
        '(?:localhost)' + // match "localhost"
        '|' +
        '(?:\\d{1,3}(?:\\.\\d{1,3}){3})' + // match IPv4 addresses
        '|' +
        '(?:[\\p{L}0-9.-]+\\.[\\p{L}]{2,})' + // match domain names with TLD (Unicode supported)
        ')' +
        '(?::\\d+)?' + // optional port number
        '(?:[^\\s<]*)', // match the rest of the URL (path, query, fragment) until whitespace or "<"
      'giu'
    );
    return html.replace(urlRegex, (match) => {
      return `<a href="#">${match}</a>`;
    });
  }

  /**
   * Written by ChatGPT and tested.
   * Returns a simplified version of a RTE's contents as a HTML string, by reducing
   * the amount of HTML bloat that happens in a contenteditable element.
   */
  function normalizeLines(rte: HTMLElement): string {
    const lines: string[] = [];
    let currentLine: string[] = [];
    const pushCurrentLineIfAny = () => {
      if (currentLine.length > 0) {
        lines.push(currentLine.join(''));
        currentLine = [];
      }
    };
    rte.childNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.tagName === 'DIV') {
          // Before processing the DIV, flush the current line
          pushCurrentLineIfAny();
          // Check if the DIV is "empty" (only spaces / &nbsp; / <br>)
          const divInner = el.innerHTML ?? '';
          const divText = el.textContent ?? '';
          const isEmptyDiv =
            divText.trim() === '' &&
            // If there are tags, ensure they are only <br> or &nbsp;
            // remove comments/spaces and check if innerHTML contains anything "visible"
            divInner.replace(/<!--[\s\S]*?-->/g, '').replace(/(\s|&nbsp;|<br\/?>)*/gi, '') === '';
          if (isEmptyDiv) {
            // Empty line
            lines.push('');
          } else {
            // DIV with content -> use the div's innerHTML as a line
            lines.push(divInner);
          }
        } else {
          // Inline elements (img, span, b, etc.) stay in the current line
          // use outerHTML to preserve attributes
          currentLine.push(el.outerHTML);
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        // Preserve text as-is; do not trim here to avoid losing meaningful spaces
        const txt = node.textContent ?? '';
        // Avoid pushing purely empty \n\r nodes; keep significant text
        if (txt !== null && txt !== '') currentLine.push(txt);
      }
      // Ignore comments and other node types
    });
    // If there's inline content after the last DIV, flush it
    pushCurrentLineIfAny();
    // Join the lines with <br> between them.
    // IMPORTANT: do not use join('') — we want to keep line breaks.
    let content = lines.join('<br>');
    // Safe trim on the edges: remove br/nbsp/whitespace only at start and end
    content = content
      .replace(/^(?:\s|&nbsp;|(?:<br\s*\/?>))+/, '')
      .replace(/(?:\s|&nbsp;|(?:<br\s*\/?>))+$/, '')
      .trim();
    return content;
  }

  return {
    getContent,
  };
}
