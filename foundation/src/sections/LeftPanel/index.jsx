import React, { useState, useCallback } from 'react'
import { Link, cn, useRouting, useWebsite } from '@uniweb/kit'

/**
 * LeftPanel Component for Documentation Sites
 *
 * A sidebar navigation component with collapsible sections and
 * category filtering support.
 *
 * Features:
 * - Collapsible navigation tree
 * - Active page highlighting
 * - Category filtering (shows only pages within current category)
 * - Responsive design (hidden on mobile, shown in drawer)
 */
function LeftPanel({ content, params, block }) {
  const { website } = useWebsite()

  // Runtime guarantees: params have defaults from meta.js
  const { collapsible, categories, default_open } = params

  // Get navigation data from website
  const pages = website.getPageHierarchy({ for: 'header' })

  // Use SSG-safe useLocation for reactive route updates during client-side navigation
  const { useLocation } = useRouting()
  const location = useLocation()
  const activeRoute = location?.pathname?.replace(/^\//, '').replace(/\/$/, '') || ''
  const firstSegment = activeRoute.split('/')[0]

  // Initialize open state for collapsible sections
  const [openSections, setOpenSections] = useState(() => {
    const state = {}
    if (default_open) {
      // Open all sections by default
      const registerOpen = (items) => {
        items.forEach((item) => {
          if (item.children?.length) {
            state[item.id || item.route] = true
            registerOpen(item.children)
          }
        })
      }
      registerOpen(pages)
    }
    return state
  })

  // Toggle section open/closed
  const toggleSection = useCallback((id) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }, [])

  // Normalize route by removing leading/trailing slashes
  const normalizeRoute = (route) => {
    return (route || '').replace(/^\//, '').replace(/\/$/, '')
  }

  // Filter navigation based on categories mode
  let navigation = pages
  if (categories) {
    // Find the root section that matches the current route
    const match = pages.find((p) => normalizeRoute(p.route) === firstSegment)
    if (match?.children?.length) {
      // Show children of the matched root section
      navigation = match.children
    } else if (match) {
      // No children, show the root itself
      navigation = [match]
    }
  }

  // Check if a page is active
  const isActive = (page) => {
    return normalizeRoute(page.route) === activeRoute
  }

  // Check if a page is in the active path
  const isInActivePath = (page) => {
    const pageRoute = normalizeRoute(page.route)
    return activeRoute.startsWith(pageRoute + '/') || pageRoute === activeRoute
  }

  return (
    <aside className="h-full border-r border-sidebar-border">
      <div className="h-full overflow-y-auto py-6 px-4">
        <nav>
          <NavigationTree
            items={navigation}
            activeRoute={activeRoute}
            collapsible={collapsible}
            openSections={openSections}
            toggleSection={toggleSection}
            isActive={isActive}
            isInActivePath={isInActivePath}
            level={0}
          />
        </nav>
      </div>
    </aside>
  )
}

/**
 * Recursive navigation tree component
 */
function NavigationTree({
  items,
  activeRoute,
  collapsible,
  openSections,
  toggleSection,
  isActive,
  isInActivePath,
  level,
}) {
  if (!items?.length) return null

  return (
    <ul className={cn('space-y-1', level > 0 && 'mt-1 ml-4 border-l border-gray-200 pl-3')}>
      {items.map((page) => {
        const hasChildren = page.children?.length > 0
        const id = page.id || page.route
        const isOpen = openSections[id] || !collapsible
        const showChildren = hasChildren && isOpen

        return (
          <li key={id}>
            <div className="flex items-center gap-1">
              {/* Collapse toggle */}
              {hasChildren && collapsible && (
                <button
                  onClick={() => toggleSection(id)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-500"
                  aria-expanded={isOpen}
                >
                  <svg
                    className={cn(
                      'w-3 h-3 transition-transform',
                      isOpen && 'rotate-90'
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}

              {/* Spacer when no toggle button */}
              {(!hasChildren || !collapsible) && (
                <span className="w-5" />
              )}

              {/* Page link or label */}
              {page.hasContent ? (
                <Link
                  href={page.route}
                  className={cn(
                    'flex-1 px-2 py-1.5 text-sm rounded transition-colors',
                    isActive(page)
                      ? 'text-primary font-medium bg-primary/5'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100',
                    level === 0 && 'font-medium'
                  )}
                >
                  {page.label || page.title}
                </Link>
              ) : (
                <span
                  className={cn(
                    'flex-1 px-2 py-1.5 text-sm text-gray-600',
                    level === 0 && 'font-medium'
                  )}
                >
                  {page.label || page.title}
                </span>
              )}
            </div>

            {/* Children */}
            {showChildren && (
              <NavigationTree
                items={page.children}
                activeRoute={activeRoute}
                collapsible={collapsible}
                openSections={openSections}
                toggleSection={toggleSection}
                isActive={isActive}
                isInActivePath={isInActivePath}
                level={level + 1}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default LeftPanel
