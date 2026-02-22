
export interface AnalysisResult {
  prompt: string;
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
  general1: string | null;
  general2: string | null;
  general3: string | null;
  faces: string[]; // Up to 10 images for the face
  shirt: string | null;
  pants: string | null;
  footwear: string | null;
  style1: string | null;
  style2: string | null;
  style3: string | null;
  resultImage: string | null; // For refinement/correction
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
  selectedModel: string;
  renderingStyle: string; // Ex: Photorealistic, 3D Gamer, etc.
  artisticStyle: string; // Ex: Layer mixed media, Sketch, etc.
  manualGeneral1: string;
  manualGeneral2: string;
  manualGeneral3: string;
  manualStyle1: string;
  manualStyle2: string;
  manualStyle3: string;
  customDirections: string;
  correctionInstructions: string;
  videoMovement: string;
  videoAction: string;
  isVideoMode: boolean;
  includeFaceIdentity: boolean;
  analyzing: boolean;
  result: AnalysisResult | null;
  error: string | null;
}
