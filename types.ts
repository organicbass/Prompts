export interface AnalysisResult {
  prompt: string;
  translatedPrompt?: string;
  timestamp: number;
}

export interface CameraConfig {
  camera: string;
  lens: string;
  focalLength: string;
  aperture: string;
}

export interface ClothingConfig {
  shirt: string;
  pants: string;
  footwear: string;
  accessories: string;
  tattoos: string;
}

export interface ImageReferences {
  general: string[];
  faces: string[]; // Up to 10 images for the face
  shirt: string | null;
  pants: string | null;
  footwear: string | null;
  styles: string[];
  resultImage: string | null; // The generated image to be corrected
  refinementReferences: string[]; // Additional reference images for refinement
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
}

export interface AppState {
  images: ImageReferences;
  clothing: ClothingConfig;
  cameraConfig: CameraConfig;
  renderingStyle: string;
  manualGeneral: string[];
  manualStyles: string[];
  customDirections: string;
  correctionInstructions: string;
  videoMovement: string;
  videoAction: string;
  isVideoMode: boolean;
  includeFaceIdentity: boolean;
  analyzing: boolean;
  translating: boolean; // For translation status
  result: AnalysisResult | null;
  error: string | null;
}
