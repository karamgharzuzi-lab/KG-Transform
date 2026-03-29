import { GoogleGenAI, Type } from '@google/genai';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface ImagePart {
  name: string;
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
}

export async function analyzeImageForRecoloring(base64Image: string, mimeType: string): Promise<ImagePart[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: 'Analyze this product image. Identify 4 to 8 distinct parts, objects, or environmental elements that could be recolored. This MUST include both parts of the main product (e.g., "The vase", "The cap", "The label") AND background/environmental elements (e.g., "The background", "The wall", "The floor", "The table surface"). Return ONLY a valid JSON array of objects. Each object must have a "name" (string) and a "box" (array of 4 numbers: [ymin, xmin, ymax, xmax] normalized between 0 and 1000 representing the bounding box of that part). Do not include markdown formatting or any other text.',
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              box: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER }
              }
            },
            required: ["name", "box"]
          },
        },
      },
    });
    
    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Failed to analyze image:", error);
    return [];
  }
}

export async function generateProductImage(base64Image: string, mimeType: string, prompt: string, aspectRatio: string = '1:1', retries = 2): Promise<string> {
  // Instantiate right before the call to pick up the latest API key from the environment.
  // We use process.env.API_KEY first (which is the user's selected key if they connected one),
  // and fall back to the default GEMINI_API_KEY.
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
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: "1K"
          }
        }
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image generated");
    } catch (error: any) {
      const isRetryable = error?.status === 429 || error?.status === 503 || error?.message?.includes('429') || error?.message?.includes('503') || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('UNAVAILABLE');
      if (isRetryable && attempt < retries - 1) {
        // Exponential backoff: 2s
        const backoffTime = 2000;
        console.warn(`API busy or rate limit hit. Retrying in ${backoffTime}ms... (Attempt ${attempt + 1} of ${retries})`);
        await delay(backoffTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Failed to generate image after multiple attempts");
}

