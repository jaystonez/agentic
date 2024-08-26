import {
  type Attributes,
  type AttributeValue,
  type Span,
  type SpanOptions,
  SpanStatusCode,
  trace,
  type Tracer
} from '@opentelemetry/api'

import type * as types from '../types'
import { noopTracer } from './noop-tracer'

export type AgenticSpanOptions = {
  attributes?: {
    [attributeKey: string]:
      | AttributeValue
      | { input: () => AttributeValue | undefined }
      | { output: () => AttributeValue | undefined }
      | undefined
  }
}

export class Telemetry {
  public readonly isEnabled: boolean
  public readonly tracer: Tracer
  public readonly recordInputs: boolean
  public readonly recordOutputs: boolean
  public readonly metadata: Record<string, AttributeValue>

  constructor({
    tracer,
    isEnabled = true,
    recordInputs = true,
    recordOutputs = true,
    metadata = {}
  }: {
    tracer?: Tracer

    /**
     * Enable or disable telemetry. Disabled by default.
     */
    isEnabled?: boolean

    /**
     * Enable or disable input recording. Enabled by default.
     *
     * You might want to disable input recording to avoid recording sensitive
     * information, to reduce data transfers, or to increase performance.
     */
    recordInputs?: boolean

    /**
     * Enable or disable output recording. Enabled by default.
     *
     * You might want to disable output recording to avoid recording sensitive
     * information, to reduce data transfers, or to increase performance.
     */
    recordOutputs?: boolean

    /**
     * Additional information to include in the telemetry data.
     */
    metadata?: Record<string, AttributeValue>
  }) {
    this.isEnabled = !!isEnabled
    this.tracer =
      tracer ?? (this.isEnabled ? trace.getTracer('agentic') : noopTracer)
    this.recordInputs = recordInputs
    this.recordOutputs = recordOutputs
    this.metadata = metadata
  }

  recordSpan<T>(
    {
      name,
      attributes = {},
      endWhenDone = true,
      ...spanOptions
    }: {
      name: string
      endWhenDone?: boolean
    } & Omit<SpanOptions, 'attributes'> &
      AgenticSpanOptions,
    implementation: (span: Span) => types.MaybePromise<T>
  ): Promise<T> {
    const spanAttributes = this.convertAttributes({ attributes })

    return this.tracer.startActiveSpan(
      name,
      {
        ...spanOptions,
        attributes: spanAttributes
      },
      async (span) => {
        try {
          const result: Awaited<T> = await Promise.resolve(implementation(span))

          if (endWhenDone) {
            span.end()
          }

          return result
        } catch (err) {
          try {
            if (err instanceof Error) {
              span.recordException({
                name: err.name,
                message: err.message,
                stack: err.stack
              })

              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: err.message
              })
            } else {
              span.setStatus({ code: SpanStatusCode.ERROR })
            }
          } finally {
            // Always end the span when there is an error.
            span.end()
          }

          throw err
        }
      }
    )
  }

  convertAttributes({ attributes = {} }: AgenticSpanOptions): Attributes {
    return {
      ...Object.fromEntries(
        Object.entries(attributes)
          .map(([key, value]) => {
            if (value === undefined) {
              return [key, value]
            }

            // input value, check if it should be recorded:
            if (
              typeof value === 'object' &&
              'input' in value &&
              typeof value.input === 'function'
            ) {
              if (!this.recordInputs) {
                return undefined
              }

              const result = value.input()
              if (result === undefined) {
                return undefined
              } else {
                return [key, result]
              }
            }

            // output value, check if it should be recorded:
            if (
              typeof value === 'object' &&
              'output' in value &&
              typeof value.output === 'function'
            ) {
              if (!this.recordOutputs) {
                return undefined
              }

              const result = value.output()
              if (result === undefined) {
                return undefined
              } else {
                return [key, result]
              }
            }

            return [key, value]
          })
          .filter(Boolean)
      ),

      ...Object.fromEntries(
        Object.entries(this.metadata).map(([key, value]) => {
          return [`agentic.telemetry.metadata.${key}`, value]
        })
      )
    }
  }
}
