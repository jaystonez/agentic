import type { JsonArray, JsonValue } from 'type-fest'

export type BaseMeta = Record<string, unknown>

// TODO
export type Dataset = {}

export namespace Judge {
  /** The score of the Task's output. */
  export type Score<Meta extends BaseMeta = BaseMeta> = {
    name: string
    score: number
    meta?: Meta
  }

  /** Judge arguments. */
  export type Args<Input, Output, Expected> = {
    input?: Input
    output: Output
    expected?: Expected
  }

  /** Base/generic Judge. */
  export type BaseJudge<
    Input,
    Output,
    Expected,
    Meta extends BaseMeta = BaseMeta
  > = (
    args: Args<Input, Output, Expected>
  ) => Promise<Score<Meta>> | Score<Meta>

  /** Compare strings. */
  export type String = BaseJudge<string, string, string>

  /** Compare numbers. */
  export type Number = BaseJudge<number, number, number>

  /** Compare Boolean values. */
  export type Boolean = BaseJudge<boolean, boolean, boolean>

  /** Compare JSON values. */
  export type JSON = BaseJudge<JsonValue, JsonValue, JsonValue>

  /** Compare arrays of JSON values. */
  export type Array = BaseJudge<JsonArray, JsonArray, JsonArray>

  /** Compare any values for equality. */
  export type Equality = BaseJudge<unknown, unknown, unknown>
}

export namespace Experiment {
  /** The task to be evaluated. */
  export type Task<Input, Output> = (input: Input) => Promise<Output>

  /** Example data used to run evaluations. */
  export interface Example<Input, Output, Expected> {
    input: Input
    output?: Output
    expected?: Expected
  }

  /** Records are example and metadata used by experiments. */
  export interface Record<
    Input,
    Output,
    Expected,
    Meta extends BaseMeta = BaseMeta
  > {
    id: string
    createdAt: Date
    updatedAt: Date | null
    tags: string[]
    metadata: Meta | null
    archived: boolean
    example: Example<Input, Output, Expected>
    revisionCount: number
  }

  /** Perform evaluation on a single example. */
  export type Evaluator<Input, Output, Expected> = (
    record: Record<Input, Output, Expected>
  ) => Promise<{
    output: Output
    scores: Judge.Score[]
    sentryTraceId?: string
  }>

  /** The result of evaluating a single example. */
  export type EvalResult<Input, Output, Expected> = {
    record: Record<Input, Output, Expected>
    output: Output
    scores: Judge.Score[]
  }

  /**
   * Perform evaluation on a batch of records.
   * The records arg is optional because the experiment can be initialized
   * with a function to call to get the records.
   */
  export type Experiment<Input, Output, Expected> = (
    records?: Record<Input, Output, Expected>[]
  ) => Promise<void>
}
