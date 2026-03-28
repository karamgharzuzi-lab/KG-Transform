import { GoogleGenAI } from '@google/genai';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generateProductImage(base64Image: string, mimeType: string, prompt: string, retries = 3): Promise<string> {
  // Instantiate right before the call to pick up the latest API key from the environment
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image generated");
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota');
      if (isRateLimit && attempt < retries - 1) {
        // Exponential backoff: 2s, 4s, 8s
        const backoffTime = Math.pow(2, attempt) * 2000;
        console.warn(`Rate limit hit. Retrying in ${backoffTime}ms... (Attempt ${attempt + 1} of ${retries})`);
        await delay(backoffTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Failed to generate image after multiple attempts");
}

