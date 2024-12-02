import { Link, createFileRoute } from '@tanstack/react-router'
import { PostErrorComponent } from './posts.$postId'

export const Route = createFileRoute('/posts_/$postId/deep')({
  // loader: async ({ params: { postId } }) => fetchPost(postId),
  errorComponent: PostErrorComponent,
  component: PostDeepComponent,
})

function PostDeepComponent() {
  // const post = Route.useLoaderData()

  return (
    <div className="p-2 space-y-2">
      <Link
        to="/posts"
        className="block py-1 text-blue-800 hover:text-blue-600"
      >
        ← All Posts
      </Link>
      <h4 className="text-xl font-bold underline">Post</h4>
      <div className="text-sm">Body</div>
    </div>
  )
}
