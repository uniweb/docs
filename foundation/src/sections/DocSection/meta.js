/**
 * DocSection Component Metadata (v2)
 *
 * Main documentation content section with typography and navigation.
 */
export default {
  title: 'Doc Section',
  description: 'Main documentation content section with typography and navigation',
  category: 'content',
  purpose: 'Inform',

  content: {
    pretitle: 'Category label',
    title: 'Page title',
    subtitle: 'Brief description',
    paragraphs: 'Documentation text',
    lists: 'Bullet or numbered lists',
    links: 'External or internal links',
  },

  params: {
    show_navigation: {
      type: 'boolean',
      label: 'Show Navigation',
      description: 'Display previous/next page links',
      default: true,
    },
    max_width: {
      type: 'select',
      label: 'Content Width',
      options: [
        { value: 'prose', label: 'Prose (65ch)' },
        'lg',
        'xl',
        { value: 'full', label: 'Full Width' },
      ],
      default: 'prose',
    },
  },

  presets: {
    default: {
      label: 'Standard Docs',
      params: { show_navigation: true, max_width: 'prose' },
    },
    wide: {
      label: 'Wide Content',
      params: { show_navigation: true, max_width: 'xl' },
    },
  },
}
