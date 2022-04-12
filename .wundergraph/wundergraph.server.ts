import { configureWunderGraphServer } from '@wundergraph/sdk'
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql'

import { GraphQLExecutionContext } from './generated/wundergraph.server'
import { configureWunderGraphHooksWithClient } from './generated/wundergraph.hooks.configuration'
import type { HooksConfig } from './generated/wundergraph.hooks'
import type { InternalClient } from './generated/wundergraph.internal.client'

const superAdmins = [
  'jens@wundergraph.com',
  // replace or add your own github email address
  // to make yourself a super admin as well
]

export default configureWunderGraphServer<HooksConfig, InternalClient>(
  (serverContext) => ({
    hooks: {
      global: {
        httpTransport: {
          onRequest: {
            hook: async (ctx, request) => {
              console.log(`onRequest hook: ${JSON.stringify(request)}`)
              return {
                ...request,
              }
            },
            enableForOperations: ['Countries'],
          },
        },
      },
      authentication: {
        postAuthentication: async (user) => {
          if (user.email) {
            try {
              await serverContext.internalClient.mutations.SetLastLogin({
                email: user.email,
              })
            } catch (e) {
              console.log(e)
            }
          }
        },
        mutatingPostAuthentication: async (user) => {
          console.log(
            `mutatingPostAuthentication hook: ${JSON.stringify(user)}`
          )

          if (!user.email) {
            return {
              status: 'deny',
              message: 'No email address provided',
            }
          }

          if (superAdmins.find((s) => s === user.email) !== undefined) {
            return {
              status: 'ok',
              user: {
                ...user,
                roles: ['user', 'superadmin'],
              },
            }
          }

          return {
            status: 'ok',
            user: {
              ...user,
              roles: ['user'],
            },
          }
        },
      },
      queries: {
        MockQuery: {
          mockResolve: async () => {
            return {
              data: {
                findFirstusers: {
                  id: 1,
                  email: 'jens@wundergraph.com',
                  name: 'Jens',
                },
              },
            }
          },
        },
      },
      mutations: {},
    },
    graphqlServers: [
      {
        apiNamespace: 'gql',
        serverName: 'gql',
        schema: new GraphQLSchema({
          query: new GraphQLObjectType<any, GraphQLExecutionContext>({
            name: 'RootQueryType',
            fields: {
              hello: {
                type: GraphQLString,
                resolve(root, args, ctx) {
                  ctx.log.info(
                    `headers: ${JSON.stringify(
                      ctx.requestContext.clientRequest.headers
                    )}`
                  )
                  return (
                    ctx.requestContext.clientRequest.headers['User-Agent'] ||
                    'world'
                  )
                },
              },
            },
          }),
        }),
      },
    ],
  })
)
