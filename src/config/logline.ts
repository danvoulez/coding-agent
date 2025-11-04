/**
 * LogLine API configuration and client
 */

export interface LogLineConfig {
  apiUrl: string
  wsUrl?: string
  tenant: string
  token: string
}

export interface BootRequest<T = any> {
  boot_function_id: string
  input: T
}

export interface SpanRequest {
  type: string
  [key: string]: any
}

export interface ApiResponse<T = any> {
  status?: string
  data?: T
  output?: any
  error?: string | { code?: string; message?: string; details?: any }
}

/**
 * LogLine API Client
 */
export class LogLineClient {
  private config: LogLineConfig

  constructor(config: LogLineConfig) {
    this.config = config
  }

  /**
   * Execute a boot kernel
   */
  async boot<TInput = any, TOutput = any>(
    bootFunctionId: string,
    input: TInput,
  ): Promise<ApiResponse<TOutput>> {
    const response = await fetch(`${this.config.apiUrl}/boot`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-logline-tenant': this.config.tenant,
        authorization: this.config.token,
      },
      body: JSON.stringify({
        boot_function_id: bootFunctionId,
        input,
      } as BootRequest<TInput>),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`LogLine boot failed: ${response.status} ${error}`)
    }

    return response.json()
  }

  /**
   * Create a span
   */
  async createSpan(span: SpanRequest): Promise<ApiResponse> {
    const response = await fetch(`${this.config.apiUrl}/spans`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-logline-tenant': this.config.tenant,
        authorization: this.config.token,
      },
      body: JSON.stringify(span),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`LogLine span creation failed: ${response.status} ${error}`)
    }

    return response.json()
  }
}

// Known boot function IDs from Blueprint4 spec
export const BOOT_FUNCTIONS = {
  PROVIDER_EXEC: '00000000-0000-4000-8000-000000000005',
  PROMPT_FETCH: '00000000-0000-4000-8000-000000000006',
  MEMORY_STORE: '00000000-0000-4000-8000-000000000007',
  APP_ENROLLMENT: '00000000-0000-4000-8000-000000000008',
} as const
