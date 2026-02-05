/**
 * LeftPanel Component Metadata (v2)
 *
 * Sidebar navigation with collapsible sections and category filtering.
 */
export default {
  title: 'Left Panel',
  description: 'Sidebar navigation with collapsible sections and category filtering',
  category: 'navigation',
  purpose: 'Navigate',

  // LeftPanel uses website.getPageHierarchy() for navigation
  content: {},

  params: {
    collapsible: {
      type: 'boolean',
      label: 'Collapsible Sections',
      description: 'Allow sections to be collapsed/expanded',
      default: true,
    },
    categories: {
      type: 'boolean',
      label: 'Category Filtering',
      description: 'Show only pages within the current category (pairs with Header categories)',
      default: false,
    },
    default_open: {
      type: 'boolean',
      label: 'Default Open',
      description: 'Start with all sections expanded',
      default: true,
    },
  },

  presets: {
    default: {
      label: 'Full Navigation',
      params: { collapsible: true, default_open: true },
    },
    categories: {
      label: 'Category Filtered',
      params: { collapsible: true, categories: true, default_open: true },
    },
  },
}
