import { MetadataRoute } from 'next';
import { BLOG_POSTS } from '@/lib/blogPosts';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.sammystorelogs.com';
  const staticRoutes = [
    '',
    '/numbers',
    '/smm',
    '/accounts',
    '/logs',
    '/catalog',
    '/search',
    '/login',
    '/register',
    '/terms',
    '/privacy',
    '/refund-policy',
    '/support',
    '/blog',
  ];

  const blogRoutes = BLOG_POSTS.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: (route === '' ? 'daily' : 'weekly') as 'daily' | 'weekly',
      priority: route === '' ? 1 : 0.7,
    })),
    ...blogRoutes,
  ];
}
