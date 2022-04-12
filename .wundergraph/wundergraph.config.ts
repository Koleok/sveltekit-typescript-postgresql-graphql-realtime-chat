import {
  Application,
  authProviders,
  configureWunderGraphApplication,
  cors,
  introspect,
  templates,
} from '@wundergraph/sdk'
import operations from './wundergraph.operations'
import server from './wundergraph.server'

const db = introspect.postgresql({
  apiNamespace: 'db',
  databaseURL: 'postgresql://admin:admin@localhost:54322/example?schema=public',
})

const myApplication = new Application({
  name: 'app',
  apis: [db],
})

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
  application: myApplication,
  codeGenerators: [
    {
      templates: [
        templates.typescript.client,
        templates.typescript.inputModels,
        templates.typescript.jsonSchema,
        templates.typescript.linkBuilder,
        templates.typescript.operations,
        templates.typescript.responseModels,
      ],
    },
  ],
  cors: {
    ...cors.allowAll,
    allowedOrigins:
      process.env.NODE_ENV === 'production'
        ? ['http://localhost:3000']
        : ['http://localhost:3000'],
  },
  authorization: {
    roles: ['user', 'superadmin'],
  },
  authentication: {
    cookieBased: {
      providers: [authProviders.demo()],
      authorizedRedirectUris: ['http://localhost:3000'],
    },
  },
  operations,
  server,
})
