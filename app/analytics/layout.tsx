import { Metadata } from 'next';

interface LayoutProps {
  children: React.ReactNode;
  params: { slug: string };
  searchParams?: { creator?: string } | null;
}

export async function generateMetadata({ searchParams }: LayoutProps): Promise<Metadata> {
  // Default metadata for static generation
  const defaultMetadata: Metadata = {
    title: 'Zora Analytics',
    description: 'View creator analytics and insights on Zora',
    openGraph: {
      title: 'Zora Analytics',
      description: 'View creator analytics and insights on Zora',
      images: [{
        url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/og`,
        width: 1200,
        height: 630,
        alt: 'Zora Analytics',
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Zora Analytics',
      description: 'View creator analytics and insights on Zora',
      images: [`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/og`],
    },
  };

  // If no searchParams or no creator, return default metadata
  if (!searchParams?.creator) {
    return defaultMetadata;
  }

  const creator = searchParams.creator;
  const title = `${creator}'s Zora Analytics`;
  const description = `Check out ${creator}'s creator analytics and insights on Zora!`;
  const ogImage = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/og?creator=${encodeURIComponent(creator)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{
        url: ogImage,
        width: 1200,
        height: 630,
        alt: title,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function Layout({ children }: LayoutProps) {
  return <>{children}</>;
} 