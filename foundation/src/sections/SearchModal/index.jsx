import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link, useWebsite, cn } from '@uniweb/kit'

/**
 * SearchModal Component
 *
 * A modal search interface for documentation sites.
 * Uses Fuse.js for fuzzy search (must be installed in foundation).
 *
 * Features:
 * - Keyboard navigation (↑↓ to navigate, Enter to select, Escape to close)
 * - Cmd/Ctrl+K shortcut to open (via useSearchShortcut hook)
 * - Highlighted search matches
 * - Mobile-responsive
 * - Intent-based index preloading
 */
function SearchModal({ isOpen, onClose, searchClient }) {
  const { website } = useWebsite()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [client, setClient] = useState(searchClient || null)

  const inputRef = useRef(null)
  const resultsRef = useRef(null)

  // Initialize search client if not provided via props
  useEffect(() => {
    if (searchClient) {
      setClient(searchClient)
      return
    }

    if (!website.isSearchEnabled()) return

    async function initSearch() {
      try {
        const { createSearchClient } = await import('@uniweb/kit/search')
        setClient(createSearchClient(website))
      } catch (err) {
        console.warn('Search not available:', err.message)
      }
    }

    initSearch()
  }, [website, searchClient])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Perform search
  const performSearch = useCallback(async (searchQuery) => {
    if (!client || !searchQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const searchResults = await client.query(searchQuery, { limit: 10 })
      setResults(searchResults)
      setSelectedIndex(0)
    } catch (err) {
      console.error('Search error:', err)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [client])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
    }, 150)
    return () => clearTimeout(timer)
  }, [query, performSearch])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(i => Math.min(i + 1, results.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(i => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            window.location.href = results[selectedIndex].href
            onClose()
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, onClose])

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selected = resultsRef.current.children[selectedIndex]
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex, results.length])

  if (!isOpen) return null

  const searchEnabled = website.isSearchEnabled()

  // Use portal to render at document body level, escaping any parent stacking contexts
  const modalContent = (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center pt-[15vh] px-4">
        <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
            <SearchIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchEnabled ? "Search documentation..." : "Search not enabled"}
              disabled={!searchEnabled}
              className="flex-1 text-base outline-none placeholder:text-gray-400 disabled:opacity-50 bg-transparent"
            />
            {isLoading && (
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin flex-shrink-0" />
            )}
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-gray-400 bg-gray-100 rounded border border-gray-200">
              ESC
            </kbd>
          </div>

          {/* Results */}
          {searchEnabled && query && (
            <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto">
              {results.length === 0 && !isLoading ? (
                <div className="px-4 py-12 text-center text-gray-500">
                  <p className="text-sm">No results found for "{query}"</p>
                  <p className="text-xs mt-1 text-gray-400">Try different keywords</p>
                </div>
              ) : (
                <div className="py-2">
                  {results.map((result, index) => (
                    <Link
                      key={result.id}
                      href={result.href}
                      onClick={onClose}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'block px-4 py-3 transition-colors',
                        index === selectedIndex
                          ? 'bg-primary/5'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {result.type === 'section' && result.component && (
                          <span className="text-[10px] uppercase tracking-wide text-primary/70 font-medium">
                            {result.component}
                          </span>
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {result.title}
                        </span>
                      </div>
                      {result.pageTitle && result.type === 'section' && (
                        <div className="text-xs text-gray-500 mb-1">
                          in {result.pageTitle}
                        </div>
                      )}
                      {result.snippetHtml && (
                        <p
                          className="text-sm text-gray-600 line-clamp-2 [&>mark]:bg-yellow-100 [&>mark]:text-gray-900 [&>mark]:px-0.5 [&>mark]:rounded"
                          dangerouslySetInnerHTML={{ __html: result.snippetHtml }}
                        />
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty state when no query */}
          {searchEnabled && !query && (
            <div className="px-4 py-8 text-center text-gray-500">
              <p className="text-sm">Start typing to search</p>
            </div>
          )}

          {/* Footer hint */}
          {searchEnabled && (
            <div className="flex items-center justify-between gap-4 px-4 py-2 border-t border-gray-200 text-xs text-gray-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">↵</kbd>
                  to select
                </span>
              </div>
              <span className="hidden sm:flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">⌘</kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">K</kbd>
                to search
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Render via portal to escape parent stacking contexts
  // During SSR, render inline (portal target doesn't exist)
  if (typeof document === 'undefined') {
    return modalContent
  }

  return createPortal(modalContent, document.body)
}

/**
 * SearchButton Component
 *
 * A button that opens the search modal.
 * Shows Cmd/Ctrl+K keyboard shortcut hint.
 */
export function SearchButton({ onClick, onMouseEnter, onFocus, className, compact }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      className={cn(
        'flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors',
        compact
          ? 'p-2 hover:bg-gray-100 rounded-md'
          : 'px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg',
        className
      )}
      aria-label="Search documentation"
    >
      <SearchIcon className="w-4 h-4" />
      {!compact && (
        <>
          <span className="hidden sm:inline text-sm">Search</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-gray-400 bg-white rounded border border-gray-200">
            <span className="text-xs">⌘</span>K
          </kbd>
        </>
      )}
    </button>
  )
}

// Search icon
const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

export default SearchModal
