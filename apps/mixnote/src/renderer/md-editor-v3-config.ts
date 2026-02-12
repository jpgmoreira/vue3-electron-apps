import 'md-editor-v3/lib/style.css';
import 'highlight.js/styles/atom-one-dark.css';
import 'katex/dist/katex.css';
import prettier from 'prettier/standalone';
import parserMarkdown from 'prettier/plugins/markdown';
import katex from 'katex';
import hljs from 'highlight.js';
import { config } from 'md-editor-v3';
import { lineNumbers } from '@codemirror/view';

const atomDarkCss = new URL('node_modules/highlight.js/styles/atom-one-dark.css', import.meta.url)
  .href;
const katexCss = new URL('node_modules/katex/dist/katex.css', import.meta.url).href;

config({
  editorExtensions: {
    highlight: {
      instance: hljs,
      css: {
        atom: {
          light: atomDarkCss,
          dark: atomDarkCss,
        },
      },
    },
    katex: {
      instance: katex,
      css: katexCss,
    },
    prettier: {
      prettierInstance: prettier,
      parserMarkdownInstance: parserMarkdown,
    },
  },
  editorConfig: {
    renderDelay: 0,
    languageUserDefined: {
      'en-US': {
        toolbarTips: {
          bold: 'Bold',
          underline: 'Underline',
          italic: 'Italic',
          strikeThrough: 'Strike-through',
          sub: 'Subscript',
          sup: 'Superscript',
          quote: 'Quote',
          unorderedList: 'Unordered list',
          orderedList: 'Ordered list',
          task: 'Task list',
          link: 'Link',
          table: 'Table',
          revoke: 'Undo',
          next: 'Redo',
          prettier: 'Pretty',
          preview: 'Preview',
          previewOnly: 'Preview only',
        },
      },
    },
  },
  markdownItConfig(md) {
    md.set({
      typographer: true,
    });
    md.core.ruler.after('inline', 'arrows', (state) => {
      state.tokens.forEach((token) => {
        if (token.type === 'inline' && token.children) {
          token.children.forEach((child) => {
            if (child.type === 'text') {
              child.content = child.content
                .replace(/-->/g, '→')
                .replace(/->/g, '→')
                .replace(/<-/g, '←')
                .replace(/==>/g, '⇒')
                .replace(/=>/g, '⇒');
            }
          });
        }
      });
    });
  },
  codeMirrorExtensions(extensions) {
    return [
      ...extensions,
      {
        type: 'lineNumbers',
        extension: lineNumbers(),
      },
    ];
  },
});
