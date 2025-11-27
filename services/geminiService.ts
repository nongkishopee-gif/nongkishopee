import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { StoryboardShot, StoryboardCampaign } from "../types";

/**
 * Helper to strip the Data URL prefix from base64 strings
 * because the Gemini API expects raw base64.
 * 
 * Uses string splitting instead of regex to handle large strings safely.
 */
export const extractBase64Data = (dataUrl: string) => {
  // Check if it's a data URL
  if (dataUrl.startsWith('data:')) {
    const splitIndex = dataUrl.indexOf(',');
    if (splitIndex !== -1) {
      const metadata = dataUrl.substring(0, splitIndex);
      const data = dataUrl.substring(splitIndex + 1);
      
      // Extract mime type from "data:image/jpeg;base64"
      // metadata example: "data:image/png;base64"
      const mimeTypeMatch = metadata.match(/:(.*?);/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
      
      return { mimeType, data };
    }
  }
  
  // Fallback for raw base64 or unexpected formats
  return { mimeType: "image/jpeg", data: dataUrl };
};

/**
 * Step 1: Analyze the product image and generate a textual storyboard plan.
 * This returns the JSON structure for the video prompts, SEO, and TTS instructions.
 */
export const generateStoryboardPlan = async (
  productImageBase64: string,
  language: string
): Promise<StoryboardCampaign> => {
  // Initialize inside function to ensure we use the latest API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash";
  
  const { mimeType, data } = extractBase64Data(productImageBase64);

  const systemInstruction = `You are an expert Fashion Director and Video Producer. 
  Your task is to analyze a product image and create a comprehensive B-Roll video marketing campaign.
  
  The output must be a JSON object containing:
  1. 'shots': A 12-shot visual storyboard.
  2. 'seo': Video title, engaging description, and relevant hashtags.
  3. 'tts_instructions': A guide for the voice actor on how to deliver the script (tone, pace, emotion).
  
  For each shot, provide:
  - Title
  - Visual Description (detailed enough to generate a static image representation).
  - Voiceover Text (A short, engaging script for a narrator or text-to-speech engine).
  - Video Generation Prompt (A specific JSON object optimized for a video generation AI).
  
  Language requirement: ${language}.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      shots: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            shot_number: { type: Type.INTEGER },
            title: { type: Type.STRING },
            visual_description: { type: Type.STRING },
            voiceover_text: { type: Type.STRING, description: "Script for text-to-speech" },
            video_generation_prompt: {
              type: Type.OBJECT,
              properties: {
                prompt: { type: Type.STRING, description: "The core prompt for video generation" },
                negative_prompt: { type: Type.STRING, description: "Elements to avoid" },
                camera_movement: { type: Type.STRING, description: "e.g., Pan Right, Zoom In, Static" }
              },
              required: ["prompt", "camera_movement"]
            }
          },
          required: ["shot_number", "title", "visual_description", "voiceover_text", "video_generation_prompt"]
        }
      },
      seo: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          hashtags: { type: Type.STRING, description: "Space separated hashtags" }
        },
        required: ["title", "description", "hashtags"]
      },
      tts_instructions: { type: Type.STRING, description: "Instructions for the voice style and tone" }
    },
    required: ["shots", "seo", "tts_instructions"]
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: "Create a 12-shot fashion B-roll storyboard campaign based on this product." }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as StoryboardCampaign;
    }
    throw new Error("No JSON response received");
  } catch (error) {
    console.error("Error generating plan:", error);
    throw error;
  }
};

/**
 * Step 2: Generate a visual representation (Image) for a specific shot.
 */
export const generateShotImage = async (
  visualDescription: string,
  productImageBase64: string,
  aspectRatio: string = "9:16"
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { mimeType, data } = extractBase64Data(productImageBase64);
  const model = "gemini-2.5-flash-image"; 

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: `Create a photorealistic fashion storyboard shot: ${visualDescription}. Ensure the product looks similar to the reference image provided.` }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Error generating shot image:", error);
    return `https://picsum.photos/seed/${Math.random()}/300/500`; 
  }
};

/**
 * Image Editor: Edit an image using a text prompt.
 */
export const editImage = async (
  imageBase64: string,
  prompt: string,
  aspectRatio: string,
  supportingImageBase64?: string | null,
  backgroundImageBase64?: string | null
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [];
  const mainImg = extractBase64Data(imageBase64);
  parts.push({
    inlineData: {
      data: mainImg.data,
      mimeType: mainImg.mimeType,
    },
  });

  if (supportingImageBase64) {
    const suppImg = extractBase64Data(supportingImageBase64);
    parts.push({
      inlineData: {
        data: suppImg.data,
        mimeType: suppImg.mimeType,
      },
    });
  }

  if (backgroundImageBase64) {
    const bgImg = extractBase64Data(backgroundImageBase64);
    parts.push({
      inlineData: {
        data: bgImg.data,
        mimeType: bgImg.mimeType,
      },
    });
  }

  parts.push({ text: prompt });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: parts },
      config: {
        imageConfig: { aspectRatio: aspectRatio }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated from edit.");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};

/**
 * Generate a video using Veo model.
 */
export const generateVeoVideo = async (
  imageBase64: string,
  prompt: string,
  aspectRatio: '16:9' | '9:16'
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { mimeType, data } = extractBase64Data(imageBase64);

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    image: {
      imageBytes: data,
      mimeType: mimeType,
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("No video link returned.");

  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

/**
 * Generate Speech using Gemini TTS
 */
export const generateSpeech = async (
    text: string, 
    voice: string = 'Zephyr',
    instruction?: string,
    temperature?: number
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const promptText = instruction ? `${instruction}: ${text}` : text;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
        },
        temperature: temperature
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    
    return base64Audio;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};