/**
 * CodeBlock Component Metadata (v2)
 *
 * Display code snippets with syntax highlighting and copy button.
 */
export default {
  title: 'Code Block',
  description: 'Display code snippets with syntax highlighting and copy button',
  category: 'content',
  purpose: 'Inform',

  content: {
    title: 'Optional filename or description',
    paragraphs: 'The code to display',
  },

  params: {
    language: {
      type: 'select',
      label: 'Language',
      options: [
        'javascript',
        'typescript',
        'jsx',
        'tsx',
        'html',
        'css',
        'json',
        'yaml',
        'markdown',
        'bash',
        'python',
        'go',
        'rust',
      ],
      default: 'javascript',
    },
    show_copy: {
      type: 'boolean',
      label: 'Show Copy Button',
      default: true,
    },
    show_language: {
      type: 'boolean',
      label: 'Show Language Label',
      default: true,
    },
  },

  presets: {
    default: {
      label: 'JavaScript',
      params: { language: 'javascript', show_copy: true },
    },
    bash: {
      label: 'Terminal',
      params: { language: 'bash', show_copy: true },
    },
  },
}
