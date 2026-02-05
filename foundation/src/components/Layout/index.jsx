import React, { useState, useEffect } from 'react'
import { cn } from '@uniweb/kit'

/**
 * Documentation Layout Component
 *
 * A layout optimized for documentation sites with:
 * - Sticky header
 * - Left sidebar navigation (hidden on mobile, visible on md+)
 * - Main content area with prose styling
 * - Optional right sidebar (hidden on mobile, visible on xl+)
 * - Mobile sidebar drawer
 *
 * Receives pre-rendered areas from the runtime Layout:
 * - header: Header component
 * - body: Main page content
 * - footer: Footer component (prev/next navigation for docs)
 * - left/leftPanel: Left sidebar navigation
 * - right/rightPanel: Right sidebar (table of contents, etc.)
 */

/**
 * Mobile sidebar drawer component
 */
function MobileSidebar({ isOpen, onClose, children }) {
  // Close on route change
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar drawer */}
      <div
        className={cn(
          'md:hidden fixed top-16 left-0 w-72 h-[calc(100vh-4rem)] bg-white z-50',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md hover:bg-gray-100"
          aria-label="Close sidebar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Sidebar content */}
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  )
}

/**
 * Menu toggle button for mobile
 */
function MenuButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden fixed bottom-4 left-4 z-30 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors"
      aria-label="Open navigation"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  )
}

/**
 * Main Layout component
 */
export default function Layout({
  page,
  website,
  header,
  body,
  footer,
  left,
  right,
  leftPanel,
  rightPanel,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Use left or leftPanel (backwards compatibility)
  const leftContent = left || leftPanel
  const rightContent = right || rightPanel

  // Close sidebar on page navigation
  const activeRoute = page?.route
  useEffect(() => {
    setSidebarOpen(false)
  }, [activeRoute])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        {header}
      </header>

      {/* Mobile Sidebar */}
      {leftContent && (
        <MobileSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        >
          {leftContent}
        </MobileSidebar>
      )}

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto">
        <div className="flex">
          {/* Left Sidebar - Desktop */}
          {leftContent && (
            <aside className="hidden md:block sticky top-16 w-64 flex-shrink-0 h-[calc(100vh-4rem)] overflow-y-auto border-r border-gray-200">
              {leftContent}
            </aside>
          )}

          {/* Center Content */}
          <main className="flex-1 min-w-0">
            <div className={cn(
              'px-4 py-8 sm:px-6 lg:px-8',
              // Constrain width when there's no right panel
              !rightContent && 'max-w-3xl mx-auto'
            )}>
              {/* Prose wrapper for body content */}
              <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-primary hover:prose-a:text-primary-dark prose-code:bg-code-bg prose-code:text-code-text prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                {body}
              </div>

              {/* Footer (prev/next navigation) */}
              {footer && (
                <footer className="mt-12 pt-8 border-t border-gray-200">
                  {footer}
                </footer>
              )}
            </div>
          </main>

          {/* Right Sidebar - Desktop */}
          {rightContent && (
            <aside className="hidden xl:block sticky top-16 w-64 flex-shrink-0 h-[calc(100vh-4rem)] overflow-y-auto border-l border-gray-200">
              {rightContent}
            </aside>
          )}
        </div>
      </div>

      {/* Mobile Menu Button */}
      {leftContent && (
        <MenuButton onClick={() => setSidebarOpen(true)} />
      )}
    </div>
  )
}
