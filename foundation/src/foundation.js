/**
 * Documentation Foundation Configuration
 *
 * This file defines foundation-level configuration:
 * - vars: CSS custom properties that sites can override in theme.yml
 * - Layout: Custom layout component (optional)
 *
 * Identity (name, version, description) comes from package.json.
 */

/**
 * CSS custom properties that sites can override in theme.yml
 */
export const vars = {
  // Layout
  'header-height': {
    default: '4rem',
    description: 'Fixed header height',
  },
  'sidebar-width': {
    default: '280px',
    description: 'Left sidebar width',
  },
  'content-max-width': {
    default: '48rem',
    description: 'Maximum content width (768px)',
  },

  // Typography
  'prose-font-size': {
    default: '1rem',
    description: 'Base font size for prose content',
  },
}

// Custom Layout for documentation sites
import Layout from './components/Layout'

/**
 * Runtime exports (Layout and props)
 *
 * The Layout component receives pre-rendered page areas as props:
 * - page, website: Runtime context
 * - header, body, footer: Core page regions (pre-rendered React elements)
 * - left/leftPanel, right/rightPanel: Sidebar panels
 */
export default {
  Layout,

  // Foundation-wide props (accessible via website.foundationProps):
  props: {},
}
