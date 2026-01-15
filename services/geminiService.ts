
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { StoryboardShot, StoryboardCampaign } from "../types";

/**
 * Helper to strip the Data URL prefix from base64 strings
 */
export const extractBase64Data = (dataUrl: string) => {
  if (dataUrl.startsWith('data:')) {
    const splitIndex = dataUrl.indexOf(',');
    if (splitIndex !== -1) {
      const metadata = dataUrl.substring(0, splitIndex);
      const data = dataUrl.substring(splitIndex + 1);
      const mimeTypeMatch = metadata.match(/:(.*?);/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
      return { mimeType, data };
    }
  }
  return { mimeType: "image/jpeg", data: dataUrl };
};

/**
 * Analyze the product image to provide a grounding description.
 */
export const analyzeProductImage = async (productImageBase64: string, language: string, selectedColor: string | null): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  const { mimeType, data } = extractBase64Data(productImageBase64);

  const colorContext = selectedColor ? `Preference: The product should primarily be ${selectedColor}.` : "";

  const prompt = `Analyze this fashion product image carefully. 
  Describe exactly what it is (e.g., "A long-sleeved floral silk dress"). 
  ${colorContext}
  Include material, patterns, and style. 
  Keep the description concise but highly specific (1-2 sentences). 
  
  CRITICAL: You MUST write this description in ${language}.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: prompt }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

/**
 * Step 1: Generate a textual storyboard plan.
 * Strengthened instructions for highly detailed video generation prompts optimized for Google Veo 3.1.
 */
export const generateStoryboardPlan = async (
  productImageBase64: string,
  language: string,
  productDescription: string,
  selectedColor: string | null,
  additionalPrompt?: string
): Promise<StoryboardCampaign> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-pro-preview"; 
  const { mimeType, data } = extractBase64Data(productImageBase64);

  const colorRule = selectedColor ? `The product MUST be rendered in ${selectedColor}.` : "";

  const systemInstruction = `You are a world-class Fashion Creative Director and Video AI Prompt Engineer for Google Veo 3.1. 
  Your task is to create a 12-shot B-Roll storyboard for: "${productDescription}".
  ${colorRule}
  
  CRITICAL VIDEO PROMPT ENGINEERING (For Google Veo 3.1):
  1. AUDIO FOCUS: The 'video_generation_prompt.prompt' MUST specify that the audio is NATURALLY SPOKEN VOICEOVER or DIALOGUE. Explicitly forbid background music or singing in the prompt text. Use phrases like "natural human speech", "clear vocal delivery", "strictly no background music".
  2. REALISM: Use keywords like "ultra-realistic", "hyper-photorealistic", "8k resolution", "highly detailed skin textures", "physically accurate fabric physics".
  3. LIGHTING & CAMERA: Describe "cinematic lighting", "soft rim light", "85mm lens", "Arri Alexa look".
  4. NO ASPECT RATIO: Do NOT include mentions of "9:16", "16:9", or "Vertical/Horizontal" in the prompt text itself, as the UI handles this.
  5. NO LAPTOPS/OFFICE: Forbidden items.

  Output a JSON object with:
  - 'shots': 12 shots with Title, Visual Description, Voiceover, and Video Prompt.
  - 'seo': Title, Description, Hashtags.
  - 'tts_instructions': Performance guide.
  
  Language: ${language}.
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
            voiceover_text: { type: Type.STRING },
            video_generation_prompt: {
              type: Type.OBJECT,
              properties: {
                prompt: { type: Type.STRING },
                negative_prompt: { type: Type.STRING },
                camera_movement: { type: Type.STRING }
              },
              required: ["prompt", "camera_movement", "negative_prompt"]
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
          hashtags: { type: Type.STRING }
        },
        required: ["title", "description", "hashtags"]
      },
      tts_instructions: { type: Type.STRING }
    },
    required: ["shots", "seo", "tts_instructions"]
  };

  const userPrompt = additionalPrompt 
    ? `Create a 12-shot campaign. Product: ${productDescription}. ${selectedColor ? `Color: ${selectedColor}.` : ''} Extra Context: ${additionalPrompt}`
    : `Create a 12-shot campaign for this product: ${productDescription}. ${selectedColor ? `Color: ${selectedColor}.` : ''}`;

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
  aspectRatio: string = "9:16",
  faceImageBase64?: string | null,
  backgroundImageBase64?: string | null
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash-image"; 
  const productImg = extractBase64Data(productImageBase64);
  
  const parts: any[] = [
    { inlineData: { mimeType: productImg.mimeType, data: productImg.data } }
  ];

  let prompt = `MANDATORY PRODUCT IDENTITY: Generate a photorealistic image of the EXACT product shown in the first reference image. 
  Scenario: ${visualDescription}. 
  Quality: High-end editorial, sharp focus, 8k resolution, realistic textures.`;

  if (faceImageBase64) {
    const faceImg = extractBase64Data(faceImageBase64);
    parts.push({ inlineData: { mimeType: faceImg.mimeType, data: faceImg.data } });
    prompt += " FACE SWAP: Use the exact facial features from the second image.";
  }

  if (backgroundImageBase64) {
    const bgImg = extractBase64Data(backgroundImageBase64);
    parts.push({ inlineData: { mimeType: bgImg.mimeType, data: bgImg.data } });
    prompt += " ENVIRONMENT: Place in the specific environment/lighting shown in the third image.";
  }

  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        imageConfig: { aspectRatio: aspectRatio as any }
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
 * Image Editor: Edit an image producing 8 angles/poses.
 * Improved video generation prompts for Veo 3.1 with Speech focus and NO aspect ratio mentions.
 */
export const editImage = async (
  imageBase64: string,
  prompt: string,
  aspectRatio: string,
  faceImageBase64?: string | null,
  backgroundImageBase64?: string | null,
  selectedColor?: string | null
): Promise<{ imageUrl: string; videoPrompt: any }[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const variations = [
    { angle: "Front View", pose: "Standing confidently", cameraMovement: "Static" },
    { angle: "Right Profile", pose: "Walking motion", cameraMovement: "Truck Left" },
    { angle: "Left Profile", pose: "Looking away", cameraMovement: "Truck Right" },
    { angle: "Three-Quarter Left", pose: "Relaxed pose", cameraMovement: "Slow Arc Right" },
    { angle: "Three-Quarter Right", pose: "Interacting with accessory", cameraMovement: "Slow Arc Left" },
    { angle: "High Angle", pose: "Looking up", cameraMovement: "Boom Down" },
    { angle: "Low Angle", pose: "Power pose", cameraMovement: "Boom Up" },
    { angle: "Close-up Face", pose: "Engaging facial expression", cameraMovement: "Slow Zoom In" }
  ];

  const generateSingleVariation = async (variation: typeof variations[0]) => {
      const parts: any[] = [];
      const mainImg = extractBase64Data(imageBase64);
      parts.push({ inlineData: { data: mainImg.data, mimeType: mainImg.mimeType } });

      if (faceImageBase64) {
        const faceImg = extractBase64Data(faceImageBase64);
        parts.push({ inlineData: { data: faceImg.data, mimeType: faceImg.mimeType } });
      }

      if (backgroundImageBase64) {
        const bgImg = extractBase64Data(backgroundImageBase64);
        parts.push({ inlineData: { data: bgImg.data, mimeType: bgImg.mimeType } });
      }

      let fullPrompt = `STRICT PRODUCT PRESERVATION: Generate the same subject from the main image in a new pose: ${variation.pose}. Angle: ${variation.angle}. Color: ${selectedColor || 'original'}. Ultra-realistic detail.`;
      
      if (prompt) fullPrompt += ` Instruction: ${prompt}.`;
      if (faceImageBase64) fullPrompt += " Use the face from reference.";

      parts.push({ text: fullPrompt });
      
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts },
          config: { imageConfig: { aspectRatio: aspectRatio as any } }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const videoPromptText = `Hyper-realistic 8k fashion video for Google Veo 3.1. The subject is a professional model in ${selectedColor || 'clothing'} performing a ${variation.pose} at a ${variation.angle}. AUDIO: Crisp, natural human voiceover narration, strictly no music or singing. VISUALS: Deep cinematic bokeh, 85mm lens, highly detailed fabric textures, natural skin pores, Arri Alexa color science. No distortions, no text, no aspect ratio mentions.`;
            
            return { 
                imageUrl: `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`,
                videoPrompt: {
                    model: "veo-3.1-generate-preview",
                    prompt: videoPromptText,
                    config: {
                        camera_movement: variation.cameraMovement,
                        negative_prompt: "music, background music, singing, distorted anatomy, blurry, low resolution, watermark, text, signature, grainy, low quality, 3d render, cartoon, flicker, aspect ratio bars",
                        resolution: "1080p"
                    }
                }
            };
          }
        }
        return null;
      } catch (error) {
        return null;
      }
  };

  const results = await Promise.all(variations.map(v => generateSingleVariation(v)));
  return results.filter((res): res is { imageUrl: string; videoPrompt: any } => res !== null);
};

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
    image: { imageBytes: data, mimeType: mimeType },
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: aspectRatio }
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
 * Generates speech from text.
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
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        temperature: temperature,
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    return base64Audio;
  } catch (error) {
    throw error;
  }
};
