/**
 * Footer Component Metadata (v2)
 *
 * Simple documentation footer with copyright and links.
 */
export default {
  title: 'Footer',
  description: 'Simple documentation footer with copyright and links',
  category: 'navigation',
  purpose: 'Navigate',

  content: {
    title: 'Site name (for copyright)',
    paragraphs: 'Custom copyright notice',
    links: 'Footer links (Privacy, Terms, etc.)',
  },

  params: {
    layout: {
      type: 'select',
      label: 'Layout',
      options: [
        { value: 'simple', label: 'Simple (left/right)' },
        'centered',
      ],
      default: 'simple',
    },
  },

  presets: {
    default: {
      label: 'Simple Footer',
      params: { layout: 'simple' },
    },
    centered: {
      label: 'Centered Footer',
      params: { layout: 'centered' },
    },
  },
}
