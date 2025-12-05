/**
 * GLM (Z.AI) Vision Service
 * Uses GLM-4.5V to analyze clothing images and generate detailed descriptions
 */

const GLM_API_URL = process.env.GLM_API_URL || 'https://api.z.ai/api/paas/v4';
const GLM_API_KEY = process.env.GLM_API_KEY;

interface GLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Analyze a clothing image and generate a detailed description
 * @param imageUrl - URL of the clothing image to analyze
 * @returns Detailed description of the clothing item
 */
export async function describeClothing(imageUrl: string): Promise<string> {
  if (!GLM_API_KEY) {
    console.warn('GLM API key not configured, skipping clothing description');
    return '';
  }

  try {
    const response = await fetch(`${GLM_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4v-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
              {
                type: 'text',
                text: `Analyze this clothing item image and provide a detailed description for virtual try-on purposes. Include:
1. Type of garment (e.g., t-shirt, dress, jacket, pants)
2. Color(s) and any patterns
3. Style details (neckline, sleeves, fit, length)
4. Notable design elements (logos, prints, embellishments)
5. Material appearance (if visible)

Provide a concise but comprehensive description in 2-3 sentences that would help an AI accurately place this garment on a person's body.`,
              },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GLM API error:', response.status, errorText);
      return '';
    }

    const data: GLMResponse = await response.json();
    const description = data.choices?.[0]?.message?.content || '';

    console.log('GLM clothing description:', description);
    return description;
  } catch (error) {
    console.error('GLM description error:', error);
    return '';
  }
}

/**
 * Check if GLM service is configured
 */
export function isGLMConfigured(): boolean {
  return !!GLM_API_KEY;
}
