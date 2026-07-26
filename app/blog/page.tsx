import Link from 'next/link';
import type { Metadata } from 'next';
import { BLOG_POSTS } from '@/lib/blogPosts';

export const metadata: Metadata = {
  title: 'Blog - SammyStore',
  description: 'Guides on virtual numbers, SMM growth, social media accounts, and funding your wallet in Nigeria.',
};

export default function BlogIndexPage() {
  const posts = [...BLOG_POSTS].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Blog</h1>
      <p className="text-gray-500 mb-8">Guides and tips on numbers, SMM growth, accounts, and funding your wallet.</p>

      <div className="space-y-6">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block card p-5 hover:shadow-md transition-shadow"
          >
            <p className="text-xs text-gray-400 mb-1">
              {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h2 className="text-lg font-bold text-gray-800 mb-1">{post.title}</h2>
            <p className="text-sm text-gray-600">{post.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
