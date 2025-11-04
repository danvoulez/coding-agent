/**
 * Web search and browsing tools
 */

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { Tool, ToolResult } from './types'
import { requestPermission } from './permissions'

/**
 * Search the web using DuckDuckGo HTML
 */
export const webSearchTool: Tool = {
  name: 'web_search',
  description:
    'Search the internet for information. Returns a list of search results with titles, snippets, and URLs. Use this when you need current information, documentation, or answers not in your training data.',
  parameters: [
    {
      name: 'query',
      type: 'string',
      description: 'The search query',
      required: true,
    },
    {
      name: 'num_results',
      type: 'number',
      description: 'Number of results to return (default: 5, max: 10)',
      required: false,
    },
  ],
  execute: async (params): Promise<ToolResult> => {
    const { query, num_results = 5 } = params

    try {
      const permission = await requestPermission({
        action: 'execute',
        command: `web search: "${query}"`,
        details: 'Search the internet',
      })

      if (!permission.approved) {
        return {
          success: false,
          error: permission.reason || 'Permission denied',
        }
      }

      // Use DuckDuckGo HTML (no API key needed)
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      const results: Array<{ title: string; snippet: string; url: string }> = []

      $('.result').each((i, elem) => {
        if (results.length >= Math.min(num_results, 10)) return

        const title = $(elem).find('.result__title').text().trim()
        const snippet = $(elem).find('.result__snippet').text().trim()
        const url = $(elem).find('.result__url').attr('href') || ''

        if (title && url) {
          results.push({ title, snippet, url })
        }
      })

      if (results.length === 0) {
        return {
          success: false,
          error: 'No results found',
        }
      }

      const formatted = results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}\n   ${r.url}`).join('\n\n')

      return {
        success: true,
        output: formatted,
        data: results,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search web',
      }
    }
  },
}

/**
 * Fetch and extract text content from a webpage
 */
export const fetchWebpageTool: Tool = {
  name: 'fetch_webpage',
  description:
    'Fetch and extract the main text content from a webpage. Use this to read documentation, articles, or any web content.',
  parameters: [
    {
      name: 'url',
      type: 'string',
      description: 'The URL of the webpage to fetch',
      required: true,
    },
  ],
  execute: async (params): Promise<ToolResult> => {
    const { url } = params

    try {
      const permission = await requestPermission({
        action: 'execute',
        command: `fetch webpage: ${url}`,
        details: 'Download and read webpage content',
      })

      if (!permission.approved) {
        return {
          success: false,
          error: permission.reason || 'Permission denied',
        }
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Remove script, style, and other non-content elements
      $('script, style, nav, header, footer, aside, iframe, noscript').remove()

      // Try to find main content area
      const mainContent =
        $('main').text() || $('article').text() || $('#content').text() || $('.content').text() || $('body').text()

      // Clean up whitespace
      const cleanText = mainContent
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim()

      // Truncate if too long
      const maxLength = 8000
      const truncated = cleanText.length > maxLength ? cleanText.substring(0, maxLength) + '...' : cleanText

      return {
        success: true,
        output: truncated,
        data: {
          url,
          title: $('title').text().trim(),
          length: cleanText.length,
          truncated: cleanText.length > maxLength,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch webpage',
      }
    }
  },
}

export const webTools = [webSearchTool, fetchWebpageTool]
