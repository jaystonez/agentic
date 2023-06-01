import { ZodRawShape, ZodTypeAny, z } from 'zod'

import * as types from './types'

/**
 * A `Task` is a typed, async function call that may be non-deterministic.
 *
 * Examples of tasks include:
 *    - LLM calls with structured input and output
 *    - API calls
 *    - Native function calls
 *    - Invoking sub-agents
 */
export abstract class BaseTaskCallBuilder<
  TInput extends ZodRawShape | ZodTypeAny = ZodTypeAny,
  TOutput extends ZodRawShape | ZodTypeAny = z.ZodTypeAny
> {
  protected _timeoutMs: number | undefined
  protected _retryConfig: types.RetryConfig | undefined

  constructor(options: types.BaseTaskOptions = {}) {
    this._timeoutMs = options.timeoutMs
    this._retryConfig = options.retryConfig
  }

  public abstract get inputSchema(): TInput

  public abstract get outputSchema(): TOutput

  public retryConfig(retryConfig: types.RetryConfig) {
    this._retryConfig = retryConfig
    return this
  }

  public abstract call(
    input?: types.ParsedData<TInput>
  ): Promise<types.ParsedData<TOutput>>

  // TODO
  // abstract stream({
  //   input: TInput,
  //   onProgress: types.ProgressFunction
  // }): Promise<TOutput>
}
