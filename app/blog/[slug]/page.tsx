import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BLOG_POSTS, getPostBySlug } from '@/lib/blogPosts';

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} - SammyStore Blog`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/blog" className="text-sm text-gray-500 hover:text-[#f97316] mb-6 inline-block">
        ← Back to Blog
      </Link>

      <p className="text-xs text-gray-400 mb-2">
        {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">{post.title}</h1>

      <div className="prose prose-sm md:prose-base max-w-none text-gray-700 space-y-4">
        {post.content.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap gap-3">
        <Link href="/numbers" className="btn-primary text-sm py-2 px-4 inline-block">
          Browse Virtual Numbers
        </Link>
        <Link href="/smm" className="btn-secondary text-sm py-2 px-4 inline-block">
          Browse SMM Services
        </Link>
      </div>
    </div>
  );
}
