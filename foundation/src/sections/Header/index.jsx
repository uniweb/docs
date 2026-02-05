import React, { useState, useEffect } from 'react'
import { Link, cn, useActiveRoute, useScrolled, useMobileMenu, useWebsite, useVersion, getLocaleLabel, useRouting } from '@uniweb/kit'
import { useSearchShortcut, useSearchWithIntent } from '@uniweb/kit/search'
import SearchModal from '../SearchModal'

/**
 * Header Component for Documentation Sites
 *
 * A responsive navigation header with:
 * - Logo/name + version badge (left)
 * - Wide search input with keyboard shortcut (center)
 * - Language switcher + external links + CTA (right)
 * - Optional category tabs below main header
 *
 * Features:
 * - Sticky header with scroll effects
 * - Integrated search with Cmd/Ctrl+K shortcut
 * - Version switcher as prominent badge
 * - Smart locale switcher (inline badges or dropdown based on count)
 * - Responsive mobile menu
 */
function Header({ content, params, block }) {
  const { website } = useWebsite()
  const { useLocation, useNavigate } = useRouting()
  const location = useLocation()
  const navigate = useNavigate()

  // Kit hooks for common patterns
  const scrolled = useScrolled(0)
  const { isOpen: mobileMenuOpen, toggle: toggleMobileMenu, close: closeMobileMenu } = useMobileMenu()
  const { isActiveOrAncestor, route: currentRoute } = useActiveRoute()

  // Local state
  const [searchOpen, setSearchOpen] = useState(false)
  const [localeMenuOpen, setLocaleMenuOpen] = useState(false)
  const [versionMenuOpen, setVersionMenuOpen] = useState(false)

  // Runtime guarantees: content fields exist, params have defaults from meta.js
  const { sticky, categories, transparency, showSearch, showLocale, showVersion } = params
  const { title, imgs, links } = content

  // Get logo and links from content
  const logo = imgs[0]
  const siteName = title || website.name || 'Docs'

  // Separate CTA link from external links
  // First link is CTA, rest are external links (GitHub, etc.)
  const ctaLink = links.find(l => !l.href?.startsWith('http'))
  const externalLinks = links.filter(l => l.href?.startsWith('http'))

  // Get page hierarchy for navigation
  const allPages = website.getPageHierarchy({ for: 'header' })

  // Search configuration
  const searchEnabled = website.isSearchEnabled()
  const shouldShowSearch = showSearch === 'always' || (showSearch === 'auto' && searchEnabled)

  // Intent-based search preloading
  const { triggerPreload, client: searchClient } = useSearchWithIntent(website)

  // Search keyboard shortcut (Cmd/Ctrl+K)
  useSearchShortcut({
    onOpen: () => setSearchOpen(true),
    onPreload: triggerPreload,
  })

  // Locale configuration
  const locales = website.getLocales()
  const activeLocale = website.getActiveLocale()
  const hasMultipleLocales = website.hasMultipleLocales()
  const shouldShowLocale = showLocale === 'always' || (showLocale === 'auto' && hasMultipleLocales)
  // Use inline badges for 2-4 locales, dropdown for more
  const useInlineLocales = locales.length >= 2 && locales.length <= 4

  // Version configuration
  const { isVersioned, currentVersion, versions, getVersionUrl, hasVersionedContent } = useVersion()
  const shouldShowVersion = showVersion === 'always' || (showVersion === 'auto' && isVersioned && versions.length > 1)

  // When using category tabs on a versioned site, filter pages to only show
  // those matching the current version (otherwise both v1 and v2 pages appear)
  const pages = (categories && isVersioned && currentVersion)
    ? allPages.filter(p => p.version?.id === currentVersion.id)
    : allPages

  // Auto-navigate to first page on root route if no content at root
  useEffect(() => {
    // Only on initial mount at root route
    if (location?.pathname === '/' && pages.length > 0) {
      // Check if there's a page that serves as the homepage
      const homePage = pages.find(p => p.route === '' || p.route === '/')
      if (!homePage) {
        // No homepage configured, navigate to first page
        const firstPage = pages[0]
        if (firstPage?.navigableRoute) {
          navigate(firstPage.navigableRoute, { replace: true })
        }
      }
    }
  }, []) // Only run once on mount

  // Header styles based on scroll state
  const getHeaderStyles = () => {
    const base = 'transition-all duration-300'
    if (scrolled) {
      if (transparency) {
        return cn(base, 'bg-white/95 backdrop-blur-lg shadow-sm')
      }
      return cn(base, 'bg-white shadow-sm')
    }
    return cn(base, 'bg-white border-b border-gray-200')
  }

  // Version Badge Component (shows next to logo)
  const VersionBadge = () => {
    if (!shouldShowVersion) return null

    return (
      <div className="relative">
        <button
          onClick={() => setVersionMenuOpen(!versionMenuOpen)}
          className={cn(
            'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors',
            'bg-primary/10 text-primary hover:bg-primary/20',
            currentVersion?.deprecated && 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          )}
          aria-label="Change version"
        >
          <span>{currentVersion?.label || currentVersion?.id || 'Version'}</span>
          <ChevronIcon className={cn('w-3 h-3 transition-transform', versionMenuOpen && 'rotate-180')} />
        </button>

        {versionMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setVersionMenuOpen(false)}
            />
            <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px]">
              {versions.map(version => (
                <a
                  key={version.id}
                  href={getVersionUrl(version.id)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 text-sm transition-colors',
                    version.id === currentVersion?.id
                      ? 'bg-primary/5 text-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                  onClick={() => setVersionMenuOpen(false)}
                >
                  <span>{version.label || version.id}</span>
                  {version.latest && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                      latest
                    </span>
                  )}
                  {version.deprecated && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                      deprecated
                    </span>
                  )}
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // Search Input Component (wide, in center)
  const SearchInput = () => {
    if (!shouldShowSearch) return null

    return (
      <button
        onClick={() => setSearchOpen(true)}
        onMouseEnter={triggerPreload}
        onFocus={triggerPreload}
        className="hidden md:flex items-center gap-3 w-full max-w-md px-4 py-2 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-text"
        aria-label="Search documentation"
      >
        <SearchIcon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left">Search documentation...</span>
        <kbd className="flex items-center gap-0.5 px-2 py-0.5 text-xs text-gray-400 bg-white rounded border border-gray-200">
          <span>⌘</span>K
        </kbd>
      </button>
    )
  }

  // Compact search button for mobile
  const SearchButtonMobile = () => {
    if (!shouldShowSearch) return null

    return (
      <button
        onClick={() => setSearchOpen(true)}
        onMouseEnter={triggerPreload}
        className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        aria-label="Search"
      >
        <SearchIcon className="w-5 h-5" />
      </button>
    )
  }

  // Locale Switcher - Inline badges for few languages
  const LocaleSwitcherInline = () => {
    if (!shouldShowLocale || !useInlineLocales) return null

    return (
      <div className="hidden sm:flex items-center gap-0.5 p-1 bg-gray-100 rounded-lg">
        {locales.map(locale => (
          <a
            key={locale.code}
            href={website.getLocaleUrl(locale.code)}
            className={cn(
              'px-2 py-1 text-xs font-medium rounded-md transition-colors uppercase',
              locale.code === activeLocale
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
            title={getLocaleLabel(locale)}
          >
            {locale.code}
          </a>
        ))}
      </div>
    )
  }

  // Locale Switcher - Dropdown for many languages
  const LocaleSwitcherDropdown = () => {
    if (!shouldShowLocale || useInlineLocales) return null

    const currentLocale = locales.find(l => l.code === activeLocale)

    return (
      <div className="relative hidden sm:block">
        <button
          onClick={() => setLocaleMenuOpen(!localeMenuOpen)}
          className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Change language"
        >
          <GlobeIcon className="w-4 h-4" />
          <span className="uppercase text-xs font-medium">{activeLocale}</span>
          <ChevronIcon className={cn('w-3 h-3 transition-transform', localeMenuOpen && 'rotate-180')} />
        </button>

        {localeMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setLocaleMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px]">
              {locales.map(locale => (
                <a
                  key={locale.code}
                  href={website.getLocaleUrl(locale.code)}
                  className={cn(
                    'block px-4 py-2 text-sm transition-colors',
                    locale.code === activeLocale
                      ? 'bg-primary/5 text-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                  onClick={() => setLocaleMenuOpen(false)}
                >
                  {getLocaleLabel(locale)}
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // External Links (GitHub, etc.)
  const ExternalLinks = () => {
    if (externalLinks.length === 0) return null

    return (
      <div className="hidden sm:flex items-center gap-1">
        {externalLinks.map((link, i) => {
          const isGitHub = link.href?.includes('github.com')
          return (
            <a
              key={i}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
              title={link.label || (isGitHub ? 'GitHub' : 'External link')}
            >
              {isGitHub ? (
                <GitHubIcon className="w-5 h-5" />
              ) : (
                <ExternalLinkIcon className="w-5 h-5" />
              )}
            </a>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-50',
          getHeaderStyles()
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main header row */}
          <div className="flex items-center h-16 gap-4">
            {/* Left: Logo + Version */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link href="/" className="flex items-center gap-2">
                {logo ? (
                  <img
                    src={logo.url || logo.src}
                    alt={logo.alt || siteName}
                    className="h-8 w-auto"
                  />
                ) : (
                  <span className="text-xl font-bold text-gray-900">{siteName}</span>
                )}
              </Link>
              <VersionBadge />
            </div>

            {/* Center: Search (grows to fill space) */}
            <div className="flex-1 flex justify-center px-4">
              <SearchInput />
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <SearchButtonMobile />
              <LocaleSwitcherInline />
              <LocaleSwitcherDropdown />
              <ExternalLinks />

              {/* CTA button */}
              {ctaLink && (
                <Link
                  href={ctaLink.href}
                  className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {ctaLink.label}
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                type="button"
                onClick={toggleMobileMenu}
                className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                aria-expanded={mobileMenuOpen}
              >
                <span className="sr-only">Toggle menu</span>
                {mobileMenuOpen ? (
                  <CloseIcon className="h-6 w-6" />
                ) : (
                  <MenuIcon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Category Tabs (when enabled) */}
          {categories && pages.length > 0 && (
            <div className="hidden lg:flex items-center gap-1 -mb-px overflow-x-auto">
              {pages.map((page) => (
                <Link
                  key={page.route}
                  href={page.navigableRoute}
                  className={cn(
                    'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    isActiveOrAncestor(page)
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  )}
                >
                  {page.label || page.title}
                </Link>
              ))}
            </div>
          )}

          {/* Desktop Navigation (when categories is disabled) */}
          {!categories && pages.length > 0 && (
            <div className="hidden lg:flex items-center gap-1 -mb-px overflow-x-auto">
              {pages.map((page) => (
                <Link
                  key={page.route}
                  href={page.navigableRoute}
                  className={cn(
                    'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    isActiveOrAncestor(page)
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  )}
                >
                  {page.label || page.title}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-4 space-y-2">
              {/* Mobile search */}
              {shouldShowSearch && (
                <button
                  onClick={() => {
                    closeMobileMenu()
                    setSearchOpen(true)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-base text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  <SearchIcon className="w-5 h-5" />
                  Search
                </button>
              )}

              {/* Mobile nav links */}
              {pages.map((page) => (
                <Link
                  key={page.route}
                  href={page.navigableRoute}
                  className={cn(
                    'block px-3 py-2 text-base font-medium rounded-md',
                    isActiveOrAncestor(page)
                      ? 'text-primary bg-primary/5'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  )}
                  onClick={closeMobileMenu}
                >
                  {page.label || page.title}
                </Link>
              ))}

              {/* Mobile version switcher */}
              {shouldShowVersion && versions.length > 1 && (
                <div className="pt-2 mt-2 border-t border-gray-200">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Version
                  </div>
                  {versions.map(version => (
                    <a
                      key={version.id}
                      href={getVersionUrl(version.id)}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 text-base rounded-md',
                        version.id === currentVersion?.id
                          ? 'text-primary font-medium bg-primary/5'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      )}
                      onClick={closeMobileMenu}
                    >
                      <span>{version.label || version.id}</span>
                      {version.latest && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                          latest
                        </span>
                      )}
                      {version.deprecated && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                          deprecated
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              )}

              {/* Mobile locale switcher */}
              {shouldShowLocale && locales.length > 1 && (
                <div className="pt-2 mt-2 border-t border-gray-200">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Language
                  </div>
                  {locales.map(locale => (
                    <a
                      key={locale.code}
                      href={website.getLocaleUrl(locale.code)}
                      className={cn(
                        'block px-3 py-2 text-base rounded-md',
                        locale.code === activeLocale
                          ? 'text-primary font-medium bg-primary/5'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      )}
                      onClick={closeMobileMenu}
                    >
                      {getLocaleLabel(locale)}
                    </a>
                  ))}
                </div>
              )}

              {/* Mobile external links */}
              {externalLinks.length > 0 && (
                <div className="pt-2 mt-2 border-t border-gray-200">
                  {externalLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2 text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                      onClick={closeMobileMenu}
                    >
                      {link.href?.includes('github.com') ? (
                        <GitHubIcon className="w-5 h-5" />
                      ) : (
                        <ExternalLinkIcon className="w-5 h-5" />
                      )}
                      {link.label || 'External Link'}
                    </a>
                  ))}
                </div>
              )}

              {/* Mobile CTA */}
              {ctaLink && (
                <Link
                  href={ctaLink.href}
                  className="block px-3 py-2 text-base font-medium text-white bg-primary hover:bg-primary/90 rounded-md text-center mt-4"
                  onClick={closeMobileMenu}
                >
                  {ctaLink.label}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Spacer for fixed header - always uses height for tabs since we show tabs by default now */}
      <div className={pages.length > 0 ? 'h-[104px]' : 'h-16'} />

      {/* Search Modal */}
      {shouldShowSearch && (
        <SearchModal
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          searchClient={searchClient}
        />
      )}
    </>
  )
}

// Icons
const MenuIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const CloseIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const GlobeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
)

const ChevronIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const GitHubIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
)

const ExternalLinkIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
)

export default Header
