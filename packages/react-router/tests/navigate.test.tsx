import { afterEach, describe, expect, it, vi } from 'vitest'

import { z } from 'zod'
import {
  createMemoryHistory,
  createRootRoute,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  linkOptions,
  redirect,
} from '../src'
import { cancelNavigation } from '../src/cancelNavigation'
import type { RouterHistory } from '../src'

afterEach(() => {
  vi.clearAllMocks()
})

function createTestRouter(initialHistory?: RouterHistory) {
  const history =
    initialHistory ?? createMemoryHistory({ initialEntries: ['/'] })

  const rootRoute = createRootRoute({})
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/' })
  const postsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/posts',
  })
  const postIdRoute = createRoute({
    getParentRoute: () => postsRoute,
    path: '/$slug',
  })
  const projectRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/p',
  })
  const projectIdRoute = createRoute({
    getParentRoute: () => projectRoute,
    path: '/$projectId',
  })
  const projectVersionRoute = createRoute({
    getParentRoute: () => projectIdRoute,
    path: '/$version',
  })
  const projectFrameRoute = createRoute({
    getParentRoute: () => projectVersionRoute,
    path: '/$framework',
  })

  const uRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/u',
  })
  const uLayoutRoute = createRoute({
    id: '_layout',
    getParentRoute: () => uRoute,
  })
  const uUsernameRoute = createRoute({
    getParentRoute: () => uLayoutRoute,
    path: '$username',
  })

  const gRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/g',
  })
  const gLayoutRoute = createRoute({
    id: 'layout',
    getParentRoute: () => gRoute,
  })
  const gUsernameRoute = createRoute({
    getParentRoute: () => gLayoutRoute,
    path: '$username',
  })
  const searchRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'search',
    validateSearch: (search: Record<string, unknown>) => {
      return {
        ['foo=bar']: Number(search['foo=bar'] ?? 1),
      }
    },
  })

  const projectTree = projectRoute.addChildren([
    projectIdRoute.addChildren([
      projectVersionRoute.addChildren([projectFrameRoute]),
    ]),
  ])
  const uTree = uRoute.addChildren([uLayoutRoute.addChildren([uUsernameRoute])])
  const gTree = gRoute.addChildren([gLayoutRoute.addChildren([gUsernameRoute])])

  const routeTree = rootRoute.addChildren([
    indexRoute,
    postsRoute.addChildren([postIdRoute]),
    projectTree,
    uTree,
    gTree,
    searchRoute,
  ])
  const router = createRouter({ routeTree, history })

  return {
    router,
    routes: {
      indexRoute,
      postsRoute,
      postIdRoute,
      projectRoute,
      projectIdRoute,
      projectVersionRoute,
      projectFrameRoute,
    },
  }
}

describe('router.navigate navigation using a single path param - object syntax for updates', () => {
  it('should change $slug in "/posts/$slug" from "tanner" to "tkdodo"', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/posts/tanner'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/posts/tanner')

    await router.navigate({
      to: '/posts/$slug',
      params: { slug: 'tkdodo' },
    })
    await router.invalidate()

    expect(router.state.location.pathname).toBe('/posts/tkdodo')
  })

  it('should change $slug in "/posts/$slug" from "tanner" to "tkdodo" w/o "to" path being provided', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/posts/tanner'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/posts/tanner')

    await router.navigate({
      params: { slug: 'tkdodo' },
    } as any)
    await router.invalidate()

    expect(router.state.location.pathname).toBe('/posts/tkdodo')
  })
})

describe('router.navigate navigation using a single path param - function syntax for updates', () => {
  it('should change $slug in "/posts/$slug" from "tanner" to "tkdodo"', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/posts/tanner'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/posts/tanner')

    await router.navigate({
      to: '/posts/$slug',
      params: (p: any) => ({ ...p, slug: 'tkdodo' }),
    })
    await router.invalidate()

    expect(router.state.location.pathname).toBe('/posts/tkdodo')
  })

  it('should change $slug in "/posts/$slug" from "tanner" to "tkdodo" w/o "to" path being provided', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/posts/tanner'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/posts/tanner')

    await router.navigate({
      params: (p: any) => ({ ...p, slug: 'tkdodo' }),
    } as any)
    await router.invalidate()

    expect(router.state.location.pathname).toBe('/posts/tkdodo')
  })
})

describe('router.navigate navigation using multiple path params - object syntax for updates', () => {
  it('should change $projectId in "/p/$projectId/$version/$framework" from "router" to "query"', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/p/router/v1/react'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/p/router/v1/react')

    await router.navigate({
      to: '/p/$projectId/$version/$framework',
      params: { projectId: 'query' },
    })
    await router.invalidate()

    expect(router.state.location.pathname).toBe('/p/query/v1/react')
  })

  it('should change $projectId in "/p/$projectId/$version/$framework" from "router" to "query" w/o "to" path being provided', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/p/router/v1/react'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/p/router/v1/react')

    await router.navigate({
      params: { projectId: 'query' },
    } as any)
    await router.invalidate()

    expect(router.state.location.pathname).toBe('/p/query/v1/react')
  })

  it('should change $version in "/p/$projectId/$version/$framework" from "v1" to "v3"', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/p/router/v1/react'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/p/router/v1/react')

    await router.navigate({
      to: '/p/$projectId/$version/$framework',
      params: { version: 'v3' },
    })
    await router.invalidate()

    expect(router.state.location.pathname).toBe('/p/router/v3/react')
  })

  it('should change $version in "/p/$projectId/$version/$framework" from "v1" to "v3" w/o "to" path being provided', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/p/router/v1/react'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/p/router/v1/react')

    await router.navigate({
      params: { version: 'v3' },
    } as any)
    await router.invalidate()

    expect(router.state.location.pathname).toBe('/p/router/v3/react')
  })

  it('should change $framework in "/p/$projectId/$version/$framework" from "react" to "vue"', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/p/router/v1/react'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/p/router/v1/react')

    await router.navigate({
      to: '/p/$projectId/$version/$framework',
      params: { framework: 'vue' },
    })
    await router.invalidate()

    expect(router.state.location.pathname).toBe('/p/router/v1/vue')
  })

  it('should change $framework in "/p/$projectId/$version/$framework" from "react" to "vue" w/o "to" path being provided', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/p/router/v1/react'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/p/router/v1/react')

    await router.navigate({
      params: { framework: 'vue' },
    } as any)
    await router.invalidate()

    expect(router.state.location.pathname).toBe('/p/router/v1/vue')
  })
})

describe('router.navigate navigation using multiple path params - function syntax for updates', () => {
  it('should change $projectId in "/p/$projectId/$version/$framework" from "router" to "query"', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/p/router/v1/react'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/p/router/v1/react')

    await router.navigate({
      to: '/p/$projectId/$version/$framework',
      params: (p: any) => ({ ...p, projectId: 'query' }),
    })
    await router.invalidate()

    expect(router.state.location.pathname).toBe('/p/query/v1/react')
  })

  it('should change $projectId in "/p/$projectId/$version/$framework" from "router" to "query" w/o "to" path being provided', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/p/router/v1/react'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/p/router/v1/react')

    await router.navigate({
      params: (p: any) => ({ ...p, projectId: 'query' }),
    } as any)
    await router.invalidate()

    expect(router.state.location.pathname).toBe('/p/query/v1/react')
  })

  it('should change $version in "/p/$projectId/$version/$framework" from "v1" to "v3"', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/p/router/v1/react'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/p/router/v1/react')

    await router.navigate({
      to: '/p/$projectId/$version/$framework',
      params: (p: any) => ({ ...p, version: 'v3' }),
    })
    await router.invalidate()

    expect(router.state.location.pathname).toBe('/p/router/v3/react')
  })

  it('should change $version in "/p/$projectId/$version/$framework" from "v1" to "v3" w/o "to" path being provided', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/p/router/v1/react'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/p/router/v1/react')

    await router.navigate({
      params: (p: any) => ({ ...p, version: 'v3' }),
    } as any)
    await router.invalidate()

    expect(router.state.location.pathname).toBe('/p/router/v3/react')
  })

  it('should change $framework in "/p/$projectId/$version/$framework" from "react" to "vue"', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/p/router/v1/react'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/p/router/v1/react')

    await router.navigate({
      to: '/p/$projectId/$version/$framework',
      params: (p: any) => ({ ...p, framework: 'vue' }),
    })
    await router.invalidate()

    expect(router.state.location.pathname).toBe('/p/router/v1/vue')
  })

  it('should change $framework in "/p/$projectId/$version/$framework" from "react" to "vue" w/o "to" path being provided', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/p/router/v1/react'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/p/router/v1/react')

    await router.navigate({
      params: (p: any) => ({ ...p, framework: 'vue' }),
    } as any)
    await router.invalidate()

    expect(router.state.location.pathname).toBe('/p/router/v1/vue')
  })
})

describe('router.navigate navigation using layout routes resolves correctly', () => {
  it('should resolve "/u/tanner" in "/u/_layout/$username" to "/u/tkdodo"', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/u/tanner'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/u/tanner')

    await router.navigate({
      to: '/u/$username',
      params: { username: 'tkdodo' },
    })

    await router.invalidate()

    expect(router.state.location.pathname).toBe('/u/tkdodo')
  })

  it('should resolve "/u/tanner" in "/u/_layout/$username" to "/u/tkdodo" w/o "to" path being provided', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/u/tanner'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/u/tanner')

    await router.navigate({
      params: { username: 'tkdodo' },
    } as any)
    await router.invalidate()

    expect(router.state.location.pathname).toBe('/u/tkdodo')
  })

  it('should resolve "/g/tanner" in "/g/layout/$username" to "/g/tkdodo"', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/g/tanner'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/g/tanner')

    await router.navigate({
      to: '/g/$username',
      params: { username: 'tkdodo' },
    })

    await router.invalidate()

    expect(router.state.location.pathname).toBe('/g/tkdodo')
  })

  it('should resolve "/g/tanner" in "/g/layout/$username" to "/g/tkdodo" w/o "to" path being provided', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/g/tanner'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/g/tanner')

    await router.navigate({
      params: { username: 'tkdodo' },
    } as any)
    await router.invalidate()

    expect(router.state.location.pathname).toBe('/g/tkdodo')
  })

  it('should handle search params with special characters', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/search?foo%3Dbar=2'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/search')
    expect(router.state.location.search).toStrictEqual({ 'foo=bar': 2 })

    await router.navigate({
      search: { 'foo=bar': 3 },
    } as any)
    await router.invalidate()

    expect(router.state.location.search).toStrictEqual({ 'foo=bar': 3 })
  })
})

describe('relative navigation', () => {
  it('should navigate to a child route', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/posts'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/posts')

    await router.navigate({
      from: '/posts',
      to: './$slug',
      params: { slug: 'tkdodo' },
    })

    await router.invalidate()

    expect(router.state.location.pathname).toBe('/posts/tkdodo')
  })

  it('should navigate to a parent route', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/posts/tanner'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/posts/tanner')

    await router.navigate({
      to: '..',
    })

    await router.invalidate()

    expect(router.state.location.pathname).toBe('/posts')
  })

  it('should navigate to a sibling route', async () => {
    const { router } = createTestRouter(
      createMemoryHistory({ initialEntries: ['/posts/tanner'] }),
    )

    await router.load()

    expect(router.state.location.pathname).toBe('/posts/tanner')

    await router.navigate({
      from: '/posts/$slug',
      to: '.',
      params: { slug: 'tkdodo' },
    })

    await router.invalidate()

    expect(router.state.location.pathname).toBe('/posts/tkdodo')
  })
})

describe('beforeNavigate', () => {
  type CustomRouterContext = {
    greeting: string
    universe: {
      alpha: string
      beta: number
    }
  }

  function createTestRouterWithBeforeNavigate(initialHistory?: RouterHistory) {
    const postIdRouteBeforeLoad = vi.fn()
    const lineItemIdRouteBeforeNavigate = vi.fn()
    const history =
      initialHistory ?? createMemoryHistory({ initialEntries: ['/'] })

    
    const rootRoute = createRootRouteWithContext<CustomRouterContext>()({})
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
    })
    const postsRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: 'posts',
    })
    const postsIndexRoute = createRoute({
      getParentRoute: () => postsRoute,
      path: '/',
      beforeNavigate: () => {
        throw redirect({
          to: '/posts/$postId1',
          search: { redirect: true },
          params: { postId1: '1' },
        })
      },
    })
    const postIdRoute = createRoute({
      getParentRoute: () => postsRoute,
      path: '$postId',
      validateSearch: z.object({ redirect: z.boolean().optional() }),
      beforeLoad: postIdRouteBeforeLoad,
    })
    const usersRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: 'users',
    })
    const userIdRoute = createRoute({
      getParentRoute: () => usersRoute,
      path: '$userId',
      beforeNavigate: ({ params }) => {
        if (params.userId === 'user1') {
          throw cancelNavigation()
        }
      },
    })
    const invoicesRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: 'invoices',
      validateSearch: z.object({ invoicesRouteSearchParam: z.string() }),
    })
    const invoiceIdRoute = createRoute({
      getParentRoute: () => invoicesRoute,
      path: '$invoiceId',
      validateSearch: z.object({
        invoiceIdRouteSearchParam: z.string().catch('default-invoice-id-route'),
      }),
    })
    const lineItemIdRoute = createRoute({
      getParentRoute: () => invoiceIdRoute,
      path: '$lineItemId',
      validateSearch: z.object({ lineItemIdRouteSearchParam: z.string() }),
      beforeNavigate: lineItemIdRouteBeforeNavigate,
    })

    const routeTree = rootRoute.addChildren([
      indexRoute,
      postsRoute.addChildren([postsIndexRoute, postIdRoute]),
      usersRoute.addChildren([userIdRoute]),
      invoicesRoute.addChildren([
        invoiceIdRoute.addChildren([lineItemIdRoute]),
      ]),
    ])
    const context : CustomRouterContext = { greeting: 'hello world', universe: { alpha: 'a', beta: 123 } }
    const router = createRouter({ routeTree, history, context })
    return {
      router,
      context,
      mocks: { postIdRouteBeforeLoad, lineItemIdRouteBeforeNavigate },
    }
  }

  it('should navigate to /posts/1?redirect=true if beforeNavigate in /posts throws redirect', async () => {
    const { router, mocks } = createTestRouterWithBeforeNavigate()

    await router.load()
    await router.navigate({ to: '/posts' })
    expect(router.state.location.href).toBe('/posts/1?redirect=true')
    expect(router.state.location.search).toEqual({ redirect: true })
    expect(mocks.postIdRouteBeforeLoad).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { postId: '1' },
        search: { redirect: true },
      }),
    )
  })

  it('should cancel navigation if beforeNavigate in /users/user1 throws cancelNavigation', async () => {
    const { router } = createTestRouterWithBeforeNavigate()

    await router.load()
    await router.navigate({ to: '/users/user1' })
    expect(router.state.location.pathname).toBe('/')
  })

  it('beforeNavigate is called with all parent path, search params and router context', async () => {
    const { router, context, mocks } = createTestRouterWithBeforeNavigate()

    await router.load()
    const link = linkOptions({
      to: '/invoices/$invoiceId/$lineItemId',
      params: { invoiceId: 'invoice-1', lineItemId: 'line-item-5' },
      search: {
        invoicesRouteSearchParam: 'foo',
        lineItemIdRouteSearchParam: 'bar',
      },
    })
    const location = router.buildLocation(link)
    await router.navigate(link)
    expect(router.state.location.pathname).toBe(location.pathname)
    expect(mocks.lineItemIdRouteBeforeNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        params: link.params,
        search: {
          ...link.search,
          invoiceIdRouteSearchParam: 'default-invoice-id-route',
        },
        context
      }),
    )
  })
})
