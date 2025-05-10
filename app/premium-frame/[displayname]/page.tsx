import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { displayname: string } }): Promise<Metadata> {
  const displayName = params.displayname;
  const encodedDisplayName = encodeURIComponent(displayName);
  const blobUrl = `https://${process.env.BLOB_ACCOUNT}.public.blob.vercel-storage.com/images/${encodedDisplayName}.png`;

  const frame = {
    version: "next",
    imageUrl: blobUrl,
    // Premium frame has a different title and branding
    title: `✨ Premium Art: ${displayName}'s Zora Collage`,
    ogImage: blobUrl,
    button: {
      title: "Create Your Premium Zora Art",
      action: {
        type: "launch_frame",
        name: "Launch App",
        url: process.env.NEXT_PUBLIC_URL,
        splashImageUrl: `${process.env.NEXT_PUBLIC_URL}/images/premium-splash.png`,
        splashBackgroundColor: "#0f1121",
      },
    },
    // Add fancy styling for premium frame
    style: {
      borderGradient: {
        from: "#84cc16",  // lime-500
        to: "#10b981",    // emerald-500
      },
      borderWidth: "6px", // Thicker premium border
      backgroundColor: "#0f1121",
    }
  };

  return {
    title: "Premium Zora Collage Art",
    description: `${displayName}'s Premium NFT Collage by Zora Mini - Exclusive Premium Edition`,
    openGraph: {
      title: "Premium Zora Collage Art",
      description: `${displayName}'s Premium NFT Collage by Zora Mini - Exclusive Premium Edition`,
      images: [{ url: blobUrl }],
    },
    other: {
      "fc:frame": JSON.stringify(frame),
      "fc:frame:image:aspect_ratio": "1.91:1",
      "fc:frame:premium": "true",
    },
  };
}

export default function PremiumFramePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-[#0f1121] to-[#161a2c] text-white p-4">
      <div className="bg-gradient-to-r from-lime-500/30 to-emerald-500/30 p-[1px] rounded-lg">
        <div className="bg-black p-6 rounded-lg">
          <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-lime-400 to-emerald-400 inline-block text-transparent bg-clip-text">
            Premium Zora Collage Art
          </h1>
          
          <p className="text-lg text-gray-300 mb-4">
            This is an exclusive premium edition NFT collage.
          </p>
          
          <p className="mt-4 text-gray-400">
            This premium collage is only visible on Farcaster.
          </p>
          
          <div className="mt-6 flex items-center justify-center">
            <div className="px-4 py-2 bg-gradient-to-r from-lime-900/50 to-emerald-900/50 rounded text-sm text-lime-400 font-mono">
              PREMIUM EDITION
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 