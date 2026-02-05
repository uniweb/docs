import React, { useState } from 'react'
import { cn, useVersion } from '@uniweb/kit'

/**
 * DeprecationBanner Component
 *
 * Warning banner that appears when viewing deprecated documentation versions.
 * Automatically detects deprecation status using the useVersion hook.
 * Provides a link to navigate to the latest version.
 *
 * Features:
 * - Auto-detection of deprecated versions
 * - Link to latest version
 * - Optional dismissible behavior
 * - Amber/yellow warning styling
 */
function DeprecationBanner({ params }) {
  const [dismissed, setDismissed] = useState(false)
  const { dismissible } = params
  const {
    isVersioned,
    isDeprecatedVersion,
    currentVersion,
    latestVersionId,
    versions,
    getVersionUrl,
  } = useVersion()

  // Don't show if not in versioned content, not deprecated, or dismissed
  if (!isVersioned || !isDeprecatedVersion || dismissed) {
    return null
  }

  const latestVersion = versions.find(v => v.id === latestVersionId)
  const latestUrl = getVersionUrl(latestVersionId)

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <WarningIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <span className="font-medium">
                You are viewing documentation for {currentVersion?.label || currentVersion?.id}.
              </span>
              {' '}
              This version is deprecated.
              {latestUrl && (
                <>
                  {' '}
                  <a
                    href={latestUrl}
                    className="font-medium text-amber-900 underline hover:text-amber-700"
                  >
                    View {latestVersion?.label || latestVersionId} documentation
                  </a>
                </>
              )}
            </p>
          </div>

          {dismissible && (
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="flex-shrink-0 p-1 rounded-md text-amber-600 hover:text-amber-800 hover:bg-amber-100 transition-colors"
              aria-label="Dismiss"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Icons
const WarningIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
)

const CloseIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export default DeprecationBanner
