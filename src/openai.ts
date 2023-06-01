import { type SetOptional } from 'type-fest'
import { ZodTypeAny, z } from 'zod'

import * as types from './types'
import { defaultOpenAIModel } from './constants'
import { BaseChatModelBuilder } from './llm'

export class OpenAIChatModelBuilder<
  TInput extends ZodTypeAny = ZodTypeAny,
  TOutput extends ZodTypeAny = z.ZodType<string>
> extends BaseChatModelBuilder<
  TInput,
  TOutput,
  SetOptional<Omit<types.openai.ChatCompletionParams, 'messages'>, 'model'>,
  types.openai.ChatCompletionResponse
> {
  _client: types.openai.OpenAIClient

  constructor(
    client: types.openai.OpenAIClient,
    options: types.ChatModelOptions<
      TInput,
      TOutput,
      SetOptional<Omit<types.openai.ChatCompletionParams, 'messages'>, 'model'>
    >
  ) {
    super({
      provider: 'openai',
      model: options.modelParams?.model || defaultOpenAIModel,
      ...options
    })

    this._client = client
  }

  protected override async _createChatCompletion(
    messages: types.ChatMessage[]
  ): Promise<
    types.BaseChatCompletionResponse<types.openai.ChatCompletionResponse>
  > {
    return this._client.createChatCompletion({
      ...this._modelParams,
      model: this._model,
      messages
    })
  }
}
