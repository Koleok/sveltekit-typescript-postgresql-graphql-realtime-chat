import type { MessagesResponse } from '../../.wundergraph/generated/models'

export type Message = MessagesResponse['data']['findManymessages'][0]
