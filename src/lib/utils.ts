import type { Message } from './types'

export type Aggregation = [string, number][]

export const getMessagesByUser = (messages: Message[] = []): Aggregation => {
  return Object.entries(
    messages.reduce((res, { users }) => {
      return {
        ...res,
        [users.email]: (res[users.email] || 0) + 1,
      }
    }, {})
  )
}
