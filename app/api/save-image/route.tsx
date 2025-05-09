import { NextRequest } from "next/server";

// Force dynamic rendering to ensure fresh image generation on each request
export const dynamic = "force-dynamic";

/**
 * POST handler for saving captured images
 * @param request - The incoming HTTP request with displayName and base64 image data
 * @returns JSON with the local image data URL
 */
export async function POST(request: NextRequest) {
  try {
    // Extract the displayName and imageData from the request body
    const { displayName, imageData } = await request.json();
    
    if (!displayName) {
      return new Response("Missing displayName parameter", { status: 400 });
    }
    
    if (!imageData) {
      return new Response("Missing imageData parameter", { status: 400 });
    }
    
    // Ensure imageData is properly formatted (should be a data URL)
    if (!imageData.startsWith('data:image/')) {
      return new Response("Invalid image data format", { status: 400 });
    }
    
    // Instead of using Vercel Blob, simply return the image data URL directly
    // This bypasses the need for the BLOB_READ_WRITE_TOKEN
    
    console.log(`✅ Successfully processed image for: ${displayName}`);
    
    // Return the image data URL as the blob URL
    return Response.json({ blobUrl: imageData });
  } catch (err: unknown) {
    console.error("❌ API error in /api/save-image:", err);
    return new Response(`Failed to save image: ${err instanceof Error ? err.message : String(err)}`, {
      status: 500,
    });
  }
}
