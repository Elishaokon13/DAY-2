import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const creator = searchParams.get('creator');

    if (!creator) {
      return new Response('Missing creator parameter', { status: 400 });
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a1e2e',
            padding: '40px 60px',
          }}
        >
          {/* Logo and Title */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                fontSize: 60,
                fontWeight: 'bold',
                background: 'linear-gradient(to right, #84cc16, #10b981)',
                backgroundClip: 'text',
                color: 'transparent',
                marginBottom: '10px',
              }}
            >
              ZORA ANALYTICS
            </div>
          </div>

          {/* Creator Info */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: 40,
                color: '#ffffff',
                marginBottom: '10px',
              }}
            >
              {creator}'s Creator Dashboard
            </div>
            <div
              style={{
                fontSize: 24,
                color: '#9ca3af',
              }}
            >
              View detailed analytics and insights
            </div>
          </div>

          {/* Stats Preview */}
          <div
            style={{
              display: 'flex',
              gap: '20px',
              marginBottom: '40px',
            }}
          >
            {['Earnings', 'Volume', 'Holders'].map((stat) => (
              <div
                key={stat}
                style={{
                  padding: '20px 40px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '12px',
                  border: '1px solid rgba(107, 114, 128, 0.3)',
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    color: '#9ca3af',
                    marginBottom: '8px',
                  }}
                >
                  {stat.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    color: '#84cc16',
                  }}
                >
                  •••
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              fontSize: 24,
              color: '#6b7280',
            }}
          >
            Generated with Zora Analytics
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
} 