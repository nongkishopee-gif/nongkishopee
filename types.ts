
export interface StoryboardShot {
  shot_number: number;
  title: string;
  visual_description: string; // Used to generate the static image
  voiceover_text: string; // Text for TTS
  video_generation_prompt: {
    prompt: string;
    negative_prompt?: string;
    camera_movement: string;
  }; // The JSON the user wants
}

export interface GeneratedShot extends StoryboardShot {
  imageUrl?: string;
  isLoadingImage: boolean;
}

export interface SEOData {
  title: string;
  description: string;
  hashtags: string;
}

export interface StoryboardCampaign {
  shots: StoryboardShot[];
  seo: SEOData;
  tts_instructions: string;
}

export interface InputState {
  productImage: string | null;
  faceImage: string | null;
  backgroundImage: string | null;
  productDescription: string;
  selectedColor: string | null; // New field for optional clothing color
  orientation: 'Portrait (9:16)' | 'Landscape (16:9)' | 'Square (1:1)';
  language: 'Bahasa Indonesia' | 'English' | 'Bahasa Malaysia';
  additionalPrompt: string;
}

export type ViewState = 'storyboard' | 'image-editor' | 'text-to-speech';

export const MOCK_SHOTS: StoryboardShot[] = [
  {
    shot_number: 1,
    title: "Product Reveal",
    visual_description: "A close-up of the fabric texture.",
    voiceover_text: "Rasakan kelembutan tekstur premium yang memanjakan kulit Anda.",
    video_generation_prompt: {
      prompt: "Cinematic close up, macro shot of fabric texture",
      camera_movement: "Slow Pan"
    }
  }
];
