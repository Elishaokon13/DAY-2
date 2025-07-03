import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const creator = searchParams.get('creator');

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(to bottom right, #1a1e2e, #0f1121)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 60,
                fontWeight: 'bold',
                color: '#84cc16',
                marginBottom: '20px',
              }}
            >
              {creator ? `${creator}'s Analytics` : 'Zora Analytics'}
            </div>
            <div
              style={{
                fontSize: 32,
                color: '#9ca3af',
                marginBottom: '40px',
              }}
            >
              Creator Analytics Dashboard
            </div>
            <div
              style={{
                display: 'flex',
                gap: '20px',
                marginTop: '20px',
              }}
            >
              <div
                style={{
                  background: 'rgba(132, 204, 22, 0.1)',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid rgba(132, 204, 22, 0.2)',
                  color: '#84cc16',
                }}
              >
                View Analytics
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch {
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
} 