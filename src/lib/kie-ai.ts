/**
 * Kie.ai Virtual Try-On Service
 * Uses the nano-banana-edit model for virtual clothing try-on
 */

const KIE_AI_API_URL = process.env.KIE_AI_API_URL || 'https://api.kie.ai';
const KIE_AI_API_KEY = process.env.KIE_AI_API_KEY;

interface CreateTaskResponse {
  data: {
    taskId: string;
  };
}

interface TaskStatusResponse {
  data: {
    state: 'waiting' | 'success' | 'fail';
    resultJson?: {
      resultUrls: string[];
    };
    failReason?: string;
  };
}

interface TryOnResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

interface MaskRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Convert local URL to full public URL
 */
function toPublicUrl(url: string): string {
  // If already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Convert local path to full URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${appUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Generate a virtual try-on image using Kie.ai
 * @param userPhotoUrl - URL of the user's photo
 * @param garmentImageUrl - URL of the clothing item image
 * @param clothingDescription - Optional detailed description of the clothing from GLM
 * @param maskRegion - Optional region specifying where the garment is in the image (percentage-based)
 * @returns Result with the generated image URL or error
 */
export async function generateTryOn(
  userPhotoUrl: string,
  garmentImageUrl: string,
  clothingDescription?: string,
  maskRegion?: MaskRegion
): Promise<TryOnResult> {
  if (!KIE_AI_API_KEY) {
    return { success: false, error: 'Kie.ai API key not configured' };
  }

  // Convert to public URLs
  const publicUserPhotoUrl = toPublicUrl(userPhotoUrl);
  const publicGarmentUrl = toPublicUrl(garmentImageUrl);

  console.log('Kie.ai try-on request:', {
    userPhoto: publicUserPhotoUrl,
    garment: publicGarmentUrl,
    maskRegion,
  });

  try {
    // Create the try-on task
    const taskId = await createTask(publicUserPhotoUrl, publicGarmentUrl, clothingDescription, maskRegion);
    console.log('Kie.ai task created:', taskId);

    // Poll for results
    const result = await pollForResult(taskId);
    console.log('Kie.ai result:', result);

    return result;
  } catch (error) {
    console.error('Kie.ai try-on error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Create a try-on task with Kie.ai
 */
async function createTask(
  userPhotoUrl: string,
  garmentImageUrl: string,
  clothingDescription?: string,
  maskRegion?: MaskRegion
): Promise<string> {
  // Build prompt for virtual try-on
  // The model needs clear instructions about what to do with the two images
  let prompt = `Edit the first image (person photo) to wear the clothing from the second image (garment).`;

  if (clothingDescription) {
    prompt += ` The garment is: ${clothingDescription}`;
  }

  // Add mask region info if provided
  if (maskRegion) {
    prompt += ` The garment is located in the second image at approximately: ${Math.round(maskRegion.x)}% from left, ${Math.round(maskRegion.y)}% from top, covering ${Math.round(maskRegion.width)}% width and ${Math.round(maskRegion.height)}% height of the image.`;
  }

  prompt += ` Replace the person's current top/clothing with this garment. Keep the person's face, pose, and body unchanged. Make it look natural and realistic.`;

  console.log('Kie.ai prompt:', prompt);

  const response = await fetch(`${KIE_AI_API_URL}/api/v1/jobs/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIE_AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'google/nano-banana-edit',
      input: {
        prompt,
        image_urls: [userPhotoUrl, garmentImageUrl],
        output_format: 'png',
        image_size: '1:1',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create task: ${response.status} - ${errorText}`);
  }

  const data: CreateTaskResponse = await response.json();

  if (!data.data?.taskId) {
    throw new Error('No task ID returned from Kie.ai');
  }

  return data.data.taskId;
}

/**
 * Poll Kie.ai for task completion
 */
async function pollForResult(
  taskId: string,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<TryOnResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(
      `${KIE_AI_API_URL}/api/v1/jobs/recordInfo?taskId=${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${KIE_AI_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to check task status: ${response.status}`);
    }

    const data: TaskStatusResponse = await response.json();
    const state = data.data?.state;

    if (state === 'success') {
      console.log('Kie.ai success response:', JSON.stringify(data, null, 2));

      // resultJson might be a string that needs parsing
      let resultJson = data.data?.resultJson;
      if (typeof resultJson === 'string') {
        try {
          resultJson = JSON.parse(resultJson);
        } catch {
          console.error('Failed to parse resultJson string:', resultJson);
        }
      }

      const resultUrls = resultJson?.resultUrls;
      if (resultUrls && resultUrls.length > 0) {
        return {
          success: true,
          imageUrl: resultUrls[0],
        };
      }

      // Check alternative response formats
      const output = (data.data as any)?.output;
      if (output?.image_url) {
        return {
          success: true,
          imageUrl: output.image_url,
        };
      }
      if (output?.images && output.images.length > 0) {
        return {
          success: true,
          imageUrl: output.images[0],
        };
      }
      console.error('Kie.ai no result URLs in response:', data);
      throw new Error('No result URLs returned');
    }

    if (state === 'fail') {
      const failReason = data.data?.failReason || 'Task failed';
      console.error('Kie.ai task failed:', failReason);
      return {
        success: false,
        error: failReason,
      };
    }

    // Still waiting, continue polling
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return {
    success: false,
    error: 'Task timed out after maximum polling attempts',
  };
}

/**
 * Check if Kie.ai service is configured
 */
export function isKieAiConfigured(): boolean {
  return !!KIE_AI_API_KEY;
}
