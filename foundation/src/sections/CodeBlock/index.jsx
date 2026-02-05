import React, { useState } from 'react'
import { cn } from '@uniweb/kit'
import { Code } from '@uniweb/kit/styled'

/**
 * CodeBlock Component
 *
 * Displays syntax-highlighted code snippets with optional language label and copy button.
 * Uses Shiki via kit's Code component for syntax highlighting.
 * Designed for documentation sites that need to show code examples.
 */
function CodeBlock({ content, params }) {
  const [copied, setCopied] = useState(false)

  const { title, paragraphs = [] } = content || {}

  const {
    language = 'javascript',
    show_copy = true,
    show_language = true,
  } = params || {}

  // Get code from first paragraph (code is typically in a paragraph)
  const code = paragraphs[0] || ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="my-6 rounded-lg overflow-hidden">
      {/* Header with language and copy button */}
      {(show_language || show_copy || title) && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-3">
            {show_language && (
              <span className="text-xs font-mono text-gray-400 uppercase">
                {language}
              </span>
            )}
            {title && (
              <span className="text-sm text-gray-300">{title}</span>
            )}
          </div>
          {show_copy && (
            <button
              onClick={handleCopy}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Syntax-highlighted code content */}
      <Code
        content={code}
        language={language}
        className="rounded-none"
      />
    </div>
  )
}

export default CodeBlock
