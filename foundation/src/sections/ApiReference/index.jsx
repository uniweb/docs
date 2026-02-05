import React, { useState } from 'react'
import { cn } from '@uniweb/kit'
import { Code } from '@uniweb/kit/styled'

/**
 * ApiReference Component
 *
 * Displays API endpoint documentation with:
 * - HTTP method badge (GET, POST, PUT, DELETE, PATCH)
 * - Endpoint path with parameter highlighting
 * - Parameters table (path, query, header, body)
 * - Request/response examples with syntax highlighting
 *
 * Uses dataBlock (yaml:api or json:api) for structured definition.
 */
function ApiReference({ content, params }) {
  const { title, paragraphs } = content
  const { show_try_it, compact } = params

  // API config from dataBlock
  const api = content.data.api || {}
  const method = api.method || 'GET'
  const path = api.path || ''
  const parameters = api.parameters || []
  const requestBody = api.requestBody
  const response = api.response
  const responses = api.responses || []

  // Method color mapping
  const methodColors = {
    GET: 'bg-emerald-500',
    POST: 'bg-blue-500',
    PUT: 'bg-amber-500',
    PATCH: 'bg-orange-500',
    DELETE: 'bg-red-500',
  }

  // Highlight path parameters (e.g., {id} -> styled span)
  const renderPath = (pathStr) => {
    if (!pathStr) return null
    const parts = pathStr.split(/(\{[^}]+\})/)
    return parts.map((part, i) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        return (
          <span key={i} className="text-amber-400">
            {part}
          </span>
        )
      }
      return part
    })
  }

  // Group parameters by location
  const paramsByLocation = parameters.reduce((acc, param) => {
    const loc = param.in || 'query'
    if (!acc[loc]) acc[loc] = []
    acc[loc].push(param)
    return acc
  }, {})

  const locationLabels = {
    path: 'Path Parameters',
    query: 'Query Parameters',
    header: 'Headers',
    body: 'Body Parameters',
  }

  return (
    <article className="py-8">
      {/* Header: Method + Path */}
      <div className="mb-6">
        {title && (
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>
        )}

        <div className="flex items-center gap-3 p-4 bg-gray-900 rounded-lg font-mono text-sm">
          <span
            className={cn(
              'px-3 py-1 rounded font-bold text-white text-xs uppercase',
              methodColors[method.toUpperCase()] || 'bg-gray-500'
            )}
          >
            {method}
          </span>
          <code className="text-gray-100">{renderPath(path)}</code>
          {show_try_it && (
            <button className="ml-auto px-3 py-1 text-xs bg-primary hover:bg-primary-dark text-white rounded transition-colors">
              Try it
            </button>
          )}
        </div>

        {paragraphs[0] && (
          <p className="mt-4 text-gray-600">{paragraphs[0]}</p>
        )}
      </div>

      {/* Parameters */}
      {parameters.length > 0 && (
        <div className="mb-8">
          {Object.entries(paramsByLocation).map(([location, params]) => (
            <div key={location} className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {locationLabels[location] || location}
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-gray-700">Name</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-700">Type</th>
                      {!compact && (
                        <th className="text-left px-4 py-2 font-medium text-gray-700">Description</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {params.map((param, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3">
                          <code className="text-sm font-mono text-gray-900">
                            {param.name}
                          </code>
                          {param.required && (
                            <span className="ml-2 text-xs text-red-500 font-medium">
                              required
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-600">{param.type || 'string'}</span>
                        </td>
                        {!compact && (
                          <td className="px-4 py-3 text-gray-600">
                            {param.description}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Body */}
      {requestBody && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Body</h3>
          <CodeExample
            code={typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody, null, 2)}
            language="json"
          />
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Response
            {response.status && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                {response.status}
              </span>
            )}
          </h3>
          <CodeExample
            code={typeof response.body === 'string' ? response.body : JSON.stringify(response.body, null, 2)}
            language="json"
          />
        </div>
      )}

      {/* Multiple Responses */}
      {responses.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Responses</h3>
          <div className="space-y-4">
            {responses.map((res, i) => (
              <div key={i}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      res.status >= 200 && res.status < 300
                        ? 'bg-emerald-100 text-emerald-800'
                        : res.status >= 400
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    )}
                  >
                    {res.status}
                  </span>
                  {res.description && (
                    <span className="text-sm text-gray-600">{res.description}</span>
                  )}
                </div>
                {res.body && (
                  <CodeExample
                    code={typeof res.body === 'string' ? res.body : JSON.stringify(res.body, null, 2)}
                    language="json"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

/**
 * CodeExample - Code block with header and copy button, using Shiki for syntax highlighting
 */
function CodeExample({ code, language = 'json' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Silent fail
    }
  }

  return (
    <div className="rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs font-mono text-gray-400 uppercase">
          {language}
        </span>
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
      </div>
      <Code content={code} language={language} className="rounded-none" />
    </div>
  )
}

export default ApiReference
