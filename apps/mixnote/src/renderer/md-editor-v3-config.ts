import 'md-editor-v3/lib/style.css';
import 'highlight.js/styles/atom-one-dark.css';
import 'katex/dist/katex.css';
import prettier from 'prettier/standalone';
import parserMarkdown from 'prettier/plugins/markdown';
import katex from 'katex';
import hljs from 'highlight.js';
import type MarkdownIt from 'markdown-it';
import { config } from 'md-editor-v3';
import { lineNumbers } from '@codemirror/view';

const atomDarkCss = new URL('node_modules/highlight.js/styles/atom-one-dark.css', import.meta.url)
  .href;
const katexCss = new URL('node_modules/katex/dist/katex.css', import.meta.url).href;

const SPACE_WIDTH = 0.7; // ch.

function getSpaceSpan(match: string) {
  const width = SPACE_WIDTH * match.length;
  return `<span style="display: inline-block; width: ${width}ch"></span>`;
}

/**
 * - These rules can be used to allow spaces in the start of a line,
 *   and also more than one space between words in the preview.
 * - This is not the default markdown behavior, and I decided to
 *   keep these rules disabled.
 */
function setSpacingRules(md: MarkdownIt) {
  return;
  // Replace spaces in the start of lines (outside code blocks):
  md.core.ruler.before('normalize', 'preserve_leading_spaces', (state) => {
    const segments = state.src.split(/(```[\s\S]*?```)/g);
    for (let i = 0; i < segments.length; i++) {
      if (/^```/.test(segments[i])) continue;
      segments[i] = segments[i].replace(/^ +/gm, getSpaceSpan);
    }
    state.src = segments.join('');
  });
  // Replace spaces in the middle of the text:
  md.renderer.rules.text = (tokens, idx) => tokens[idx].content.replace(/ +/gm, getSpaceSpan);
}

function setArrowRules(md: MarkdownIt) {
  // Arrows:
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
}

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
    md.set({ typographer: true });
    setSpacingRules(md);
    setArrowRules(md);
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
