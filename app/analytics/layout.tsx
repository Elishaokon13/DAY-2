import { Metadata } from 'next';

interface LayoutProps {
  children: React.ReactNode;
  params: { slug: string };
  searchParams?: { creator?: string } | null;
}

export async function generateMetadata({ searchParams }: LayoutProps): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://zora-analytics-demo.vercel.app';
  const creator = searchParams?.creator;
  
  const title = creator ? `${creator}'s Zora Analytics` : 'Zora Analytics';
  const description = creator 
    ? `Check out ${creator}'s creator analytics and insights on Zora!` 
    : 'View creator analytics and insights on Zora';
  const ogImage = creator 
    ? `${baseUrl}/api/og?creator=${encodeURIComponent(creator)}`
    : `${baseUrl}/api/og`;

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title,
      description,
      type: 'website',
      url: creator ? `${baseUrl}/analytics?creator=${encodeURIComponent(creator)}` : baseUrl,
      images: [{
        url: ogImage,
        width: 1200,
        height: 630,
        alt: title,
      }],
      siteName: 'Zora Analytics',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@zoraanalytics',
    },
    other: {
      'og:image': ogImage,
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:type': 'website',
      'twitter:image': ogImage,
      'twitter:card': 'summary_large_image',
    },
  };
}

export default function Layout({ children }: LayoutProps) {
  return <>{children}</>;
} 