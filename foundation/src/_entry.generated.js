// Auto-generated foundation entry point
// DO NOT EDIT - This file is regenerated during build

import './styles.css'
import capabilities from './foundation.js'
import ApiReference from './sections/ApiReference/index.jsx'
import CodeBlock from './sections/CodeBlock/index.jsx'
import DeprecationBanner from './sections/DeprecationBanner/index.jsx'
import DocSection from './sections/DocSection/index.jsx'
import Footer from './sections/Footer/index.jsx'
import Header from './sections/Header/index.jsx'
import LeftPanel from './sections/LeftPanel/index.jsx'
import SearchModal from './sections/SearchModal/index.jsx'

export const components = { ApiReference, CodeBlock, DeprecationBanner, DocSection, Footer, Header, LeftPanel, SearchModal }

export { ApiReference, CodeBlock, DeprecationBanner, DocSection, Footer, Header, LeftPanel, SearchModal }

export { capabilities }

// Per-component runtime metadata (from meta.js)
export const meta = {
  "ApiReference": {
    "schemas": {
      "api": {
        "method": {
          "type": "select",
          "default": "GET",
          "options": [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE"
          ]
        },
        "path": {
          "type": "string",
          "default": ""
        },
        "parameters": {
          "type": "array",
          "default": [],
          "of": {
            "name": "string",
            "in": {
              "type": "string",
              "default": "query"
            },
            "type": {
              "type": "string",
              "default": "string"
            },
            "required": {
              "type": "boolean",
              "default": false
            },
            "description": {
              "type": "string",
              "default": ""
            }
          }
        },
        "requestBody": "string",
        "response": {
          "type": "object",
          "schema": {
            "status": {
              "type": "number",
              "default": 200
            },
            "body": {
              "type": "string",
              "default": ""
            }
          }
        },
        "responses": {
          "type": "array",
          "default": [],
          "of": {
            "status": {
              "type": "number",
              "default": 200
            },
            "description": {
              "type": "string",
              "default": ""
            },
            "body": {
              "type": "string",
              "default": ""
            }
          }
        }
      }
    },
    "defaults": {
      "show_try_it": false,
      "compact": false
    }
  },
  "CodeBlock": {
    "defaults": {
      "language": "javascript",
      "show_copy": true,
      "show_language": true
    }
  },
  "DeprecationBanner": {
    "defaults": {
      "dismissible": false
    }
  },
  "DocSection": {
    "defaults": {
      "show_navigation": true,
      "max_width": "prose"
    }
  },
  "Footer": {
    "defaults": {
      "layout": "simple"
    }
  },
  "Header": {
    "defaults": {
      "sticky": true,
      "categories": false,
      "transparency": true,
      "showSearch": "auto",
      "showLocale": "auto",
      "showVersion": "auto"
    }
  },
  "LeftPanel": {
    "defaults": {
      "collapsible": true,
      "categories": false,
      "default_open": true
    }
  }
}
