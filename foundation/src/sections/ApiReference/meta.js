/**
 * ApiReference Component Metadata (v2)
 *
 * API endpoint documentation with method, parameters, and examples.
 * Uses tagged YAML blocks for structured API definitions.
 */
export default {
  title: 'API Reference',
  description: 'API endpoint documentation with method, parameters, and examples',
  category: 'content',
  purpose: 'Inform',

  content: {
    title: 'Endpoint name',
    paragraphs: 'Endpoint description',
    data: 'API definition (yaml:api block)',
  },

  params: {
    show_try_it: {
      type: 'boolean',
      label: 'Show Try It',
      description: 'Display a "Try it" button',
      default: false,
    },
    compact: {
      type: 'boolean',
      label: 'Compact Mode',
      description: 'Use compact layout for parameter tables',
      default: false,
    },
  },

  presets: {
    default: {
      label: 'Standard',
      params: { show_try_it: false, compact: false },
    },
    interactive: {
      label: 'Interactive',
      params: { show_try_it: true, compact: false },
    },
  },

  // Data configuration: schema for tagged data blocks
  data: {
    schemas: {
      api: {
        method: {
          type: 'select',
          default: 'GET',
          label: 'HTTP Method',
          options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        },
        path: {
          type: 'string',
          default: '',
          label: 'Endpoint Path',
          description: 'URL path with optional {param} placeholders',
        },
        parameters: {
          type: 'array',
          default: [],
          label: 'Parameters',
          of: {
            name: { type: 'string', label: 'Parameter name' },
            in: { type: 'string', default: 'query', label: 'Location' },
            type: { type: 'string', default: 'string', label: 'Data type' },
            required: { type: 'boolean', default: false, label: 'Required' },
            description: { type: 'string', default: '', label: 'Description' },
          },
        },
        requestBody: {
          type: 'string',
          label: 'Request Body',
          description: 'Example request body (JSON)',
        },
        response: {
          type: 'object',
          label: 'Response',
          schema: {
            status: { type: 'number', default: 200, label: 'Status code' },
            body: { type: 'string', default: '', label: 'Response body' },
          },
        },
        responses: {
          type: 'array',
          default: [],
          label: 'Multiple Responses',
          of: {
            status: { type: 'number', default: 200, label: 'Status code' },
            description: { type: 'string', default: '', label: 'Description' },
            body: { type: 'string', default: '', label: 'Response body' },
          },
        },
      },
    },
  },
}
