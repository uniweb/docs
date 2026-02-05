import React from 'react'
import { H1, H2, H3, P, Link, cn, useWebsite } from '@uniweb/kit'

/**
 * DocSection Component
 *
 * Main documentation content component that displays markdown content
 * with proper typography, code blocks, and navigation.
 *
 * Features:
 * - Clean typography for documentation
 * - Support for headings, paragraphs, lists, links
 * - Previous/Next page navigation
 * - Responsive design
 */
function DocSection({ content, params, block }) {
  const { website } = useWebsite()

  // Runtime guarantees: content fields exist, params have defaults from meta.js
  const { title, pretitle, subtitle, paragraphs, links, lists, items } = content

  const { show_navigation, max_width } = params

  // Get adjacent pages for navigation
  const allPages = website.getPageHierarchy({ nested: false })
  const currentRoute = website.activePage?.route || ''
  const currentIndex = allPages.findIndex((p) => p.route === currentRoute)
  const prevPage = currentIndex > 0 ? allPages[currentIndex - 1] : null
  const nextPage = currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null

  // Width classes
  const widthClass = {
    prose: 'max-w-prose',
    lg: 'max-w-4xl',
    xl: 'max-w-5xl',
    full: 'max-w-none',
  }[max_width] || 'max-w-prose'

  return (
    <article className={cn('py-8 px-6 lg:px-8', widthClass, 'mx-auto')}>
      {/* Header */}
      {(pretitle || title || subtitle) && (
        <header className="mb-8 pb-6 border-b border-gray-200">
          {pretitle && (
            <p className="text-sm font-medium text-primary mb-2">{pretitle}</p>
          )}
          {title && (
            <H1
              text={title}
              className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight"
            />
          )}
          {subtitle && (
            <p className="mt-3 text-lg text-gray-600">{subtitle}</p>
          )}
        </header>
      )}

      {/* Main content */}
      <div className="prose prose-gray max-w-none">
        {/* First paragraph as lead */}
        {paragraphs[0] && (
          <P
            text={paragraphs[0]}
            className="text-lg text-gray-600 leading-relaxed mb-6"
          />
        )}

        {/* Remaining paragraphs */}
        {paragraphs.slice(1).map((para, index) => (
          <P
            key={index}
            text={para}
            className="text-gray-700 leading-relaxed mb-4"
          />
        ))}

        {/* Lists */}
        {lists.map((list, index) => (
          <RenderList key={index} list={list} />
        ))}

        {/* Links as a link list */}
        {links.length > 0 && (
          <div className="my-6">
            {links.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="inline-flex items-center gap-1 text-primary hover:text-primary-dark mr-4 mb-2"
              >
                {link.label}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            ))}
          </div>
        )}

        {/* Items (H3 sections) */}
        {items.map((item, index) => (
          <section key={index} className="mt-10">
            {item.title && (
              <H3
                text={item.title}
                className="text-xl font-semibold text-gray-900 mb-4"
              />
            )}
            {item.paragraphs?.map((para, pIndex) => (
              <P
                key={pIndex}
                text={para}
                className="text-gray-700 leading-relaxed mb-4"
              />
            ))}
            {item.lists?.map((list, lIndex) => (
              <RenderList key={lIndex} list={list} />
            ))}
          </section>
        ))}
      </div>

      {/* Page navigation */}
      {show_navigation && (prevPage || nextPage) && (
        <nav className="mt-12 pt-6 border-t border-gray-200">
          <div className="flex justify-between">
            {prevPage ? (
              <Link
                href={prevPage.route}
                className="group flex flex-col"
              >
                <span className="text-sm text-gray-500 mb-1">Previous</span>
                <span className="text-primary group-hover:text-primary-dark font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {prevPage.label || prevPage.title}
                </span>
              </Link>
            ) : (
              <div />
            )}

            {nextPage ? (
              <Link
                href={nextPage.route}
                className="group flex flex-col text-right"
              >
                <span className="text-sm text-gray-500 mb-1">Next</span>
                <span className="text-primary group-hover:text-primary-dark font-medium flex items-center gap-1">
                  {nextPage.label || nextPage.title}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </nav>
      )}
    </article>
  )
}

/**
 * Render a list (ordered or unordered)
 */
function RenderList({ list }) {
  if (!list?.items?.length) return null

  const ListTag = list.ordered ? 'ol' : 'ul'
  const listClass = list.ordered
    ? 'list-decimal list-inside space-y-2 mb-4'
    : 'list-disc list-inside space-y-2 mb-4'

  return (
    <ListTag className={listClass}>
      {list.items.map((item, index) => (
        <li key={index} className="text-gray-700">
          {typeof item === 'string' ? item : item.text || item.content}
        </li>
      ))}
    </ListTag>
  )
}

export default DocSection
