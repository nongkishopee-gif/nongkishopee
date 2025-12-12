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
  language: string,
  additionalPrompt?: string
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

  const userPrompt = additionalPrompt 
    ? `Create a 12-shot fashion B-roll storyboard campaign based on this product. Important Requirement: ${additionalPrompt}`
    : "Create a 12-shot fashion B-roll storyboard campaign based on this product.";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: userPrompt }
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
 * Image Editor: Edit an image using a text prompt, producing 8 angles/poses.
 * Returns an array of objects containing the image URL and the corresponding video generation prompt JSON.
 */
export const editImage = async (
  imageBase64: string,
  prompt: string,
  aspectRatio: string,
  faceImageBase64?: string | null,
  backgroundImageBase64?: string | null
): Promise<{ imageUrl: string; videoPrompt: any }[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Define 8 distinct pose and angle combinations
  // Also map them to cinematic camera movements for the video prompt
  const variations = [
    { 
      angle: "Front View", 
      pose: "Standing confidently with hands naturally by sides",
      cameraMovement: "Static shot with subtle motion"
    },
    { 
      angle: "Right Profile (Side View)", 
      pose: "Walking motion with a dynamic stride",
      cameraMovement: "Truck Left following the subject"
    },
    { 
      angle: "Left Profile (Side View)", 
      pose: "Standing candidly, looking slightly away",
      cameraMovement: "Truck Right following the subject"
    },
    { 
      angle: "Three-Quarter Left", 
      pose: "Relaxed pose, shifting weight to one leg, hand in pocket or on hip",
      cameraMovement: "Slow Arc Right"
    },
    { 
      angle: "Three-Quarter Right", 
      pose: "Dynamic fashion pose, interacting with outfit or accessory",
      cameraMovement: "Slow Arc Left"
    },
    { 
      angle: "High Angle", 
      pose: "Sitting or looking up towards the camera",
      cameraMovement: "Boom Down / Crane Down"
    },
    { 
      angle: "Low Angle", 
      pose: "Strong power pose, looking down at the camera",
      cameraMovement: "Boom Up / Crane Up"
    },
    { 
      angle: "Close-up Face", 
      pose: "Detailed facial expression, engaging with the camera, hands near face",
      cameraMovement: "Slow Zoom In"
    }
  ];

  const generateSingleVariation = async (variation: { angle: string, pose: string, cameraMovement: string }): Promise<{ imageUrl: string; videoPrompt: any } | null> => {
      const parts: any[] = [];
      const mainImg = extractBase64Data(imageBase64);
      
      parts.push({
        inlineData: {
          data: mainImg.data,
          mimeType: mainImg.mimeType,
        },
      });

      if (faceImageBase64) {
        const faceImg = extractBase64Data(faceImageBase64);
        parts.push({
          inlineData: {
            data: faceImg.data,
            mimeType: faceImg.mimeType,
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

      // Construct prompt to emphasize pose change and face swap
      let fullPrompt = `${prompt}. 
      View/Camera Angle: ${variation.angle}. 
      Pose Action: ${variation.pose}.
      IMPORTANT: Change the body pose to match the description.`;

      if (faceImageBase64) {
          fullPrompt += " FACE SWAP REQUIRED: Replace the face of the subject in the main image with the face provided in the reference image. The resulting face MUST match the identity of the reference image, but keep the outfit and general scene from the main image.";
      }

      parts.push({ text: fullPrompt });
      
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: parts },
          config: {
            imageConfig: { aspectRatio: aspectRatio }
          }
        });

        let imageUrl = "";
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }

        if (imageUrl) {
            // Construct the JSON prompt for video generation
            const videoPrompt = {
                prompt: `Fashion video. ${prompt}. ${variation.pose}. ${variation.angle}.`,
                camera_movement: variation.cameraMovement,
                negative_prompt: "distortion, blurry, low quality, deformed, ugly"
            };
            return { imageUrl, videoPrompt };
        }
        return null; // Fail silently for this variation
      } catch (error) {
        console.error(`Error generating variation ${variation.angle}:`, error);
        return null;
      }
  };

  try {
      // Execute all 8 requests in parallel
      const results = await Promise.all(variations.map(v => generateSingleVariation(v)));
      // Filter out nulls
      return results.filter((res): res is { imageUrl: string; videoPrompt: any } => res !== null);
  } catch (error) {
      console.error("Error in batch generation:", error);
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
        // Temperature omitted as it causes errors with the current TTS model version
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