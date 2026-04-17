
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CameraConfig, ClothingConfig, ImageReferences } from "../types";

const SYSTEM_INSTRUCTION = `
Tu és um Engenheiro de Prompts Sênior e Estrategista de Conteúdo especializado em Algoritmos de Redes Sociais 2026 (ênfase em Instagram/TikTok).
O teu objetivo é criar prompts de texto que não apenas gerem imagens bonitas, mas que sejam otimizados para RETENÇÃO DE USUÁRIO e VISUAL STOP-POWER.

# DIRETRIZES SOCIAL MEDIA 2026 (ALGORITMO DE RETENÇÃO)
- VIÉS DE CONTRASTE: Use descrições que criem pontos focais de alto contraste para prender o olhar no primeiro milissegundo de scroll.
- RETENÇÃO EMOCIONAL: O prompt deve evocar uma "vibe" ou "mood" específico que gere identificação imediata.
- TEXTURAS TÁTEIS: Descreva tecidos, pele e cenários com riqueza sensorial (hiper-realismo).

# TAREFA
Receberás múltiplas imagens de referência e parâmetros de estilo. Deves sintetizar tudo em um prompt mestre otimizado para o modelo Sauce Prompt Nano Banana Pro.

# 1. CIRCUITO DE REFINAMENTO (IMAGE-TO-IMAGE CORRECTION)
Se receberes uma "IMAGEM DE RESULTADO" e "INSTRUÇÕES DE AJUSTE":
- ANALISE O ERRO: Compare a imagem de resultado com os pedidos originais e as novas imagens de referência fornecidas para o refinamento.
- CORRIJA COM PRECISÃO: Gere um novo prompt que enfatize o que precisa mudar, incorporando os elementos das novas referências de refinamento (ex: "change style to match reference 2"), mantendo a base da pose e cenário onde solicitado.

# 2. MOTOR DE VÍDEO (VIDEO SYNTHESIS)
Se o modo VÍDEO estiver ativo:
- DINÂMICA TEMPORAL: Adicione "Temporal consistency", "Fluid movement", "High-bitrate video".
- MOVIMENTO DE CÂMERA: Descreva explicitamente o movimento solicitado (Zoom, Pan, Orbit) com termos técnicos cinematográficos.
- AÇÃO: Descreva a sequência de movimento do sujeito de forma contínua e natural.

# 3. COMPOSIÇÃO GERAL, ESTILO E IDENTIDADE
- Mantenha a fidelidade absoluta às fotos de rosto e vestuário.
- Para estilos, extraia filtros, color grade e efeitos visuais únicos das referências fornecidas.

# REGRAS CRÍTICAS DE SAÍDA
- APENAS O PROMPT: Não inclua saudações, explicações ou introduções (ex: "Aqui está seu prompt").
- ZERO METADADOS: Não inclua blocos de configuração entre colchetes ou notas técnicas.
- IDIOMA: Saída sempre em INGLÊS.
- QUALIDADE MÁXIMA: Todo prompt deve incluir obrigatoriamente termos de ultra-renderização: "ultra-high definition, 8K resolution, photorealistic masterpiece, extreme anatomical detail, hyper-detailed textures, cinematic unreal engine 5 render, sharp focus".

# FORMATO DE SAÍDA (INGLÊS)
1. Subject & Identity
2. Precise Pose/Action (including video motion if applicable)
3. Isolated Clothing
4. Highly Detailed Environment
5. Visual Style & 2026 Retention Hooks (Lighting, Texture, Mood)
6. Final Ultra-Quality Keywords: (8K, ultra-hd, cinematic, etc.)
`;

export const translatePrompt = async (text: string): Promise<string> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key não encontrada no .env");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Translate the following image generation prompt from English to Portuguese (Brazil). Maintain all technical terms and nuances of the description. 

Prompt:
${text}

Translation (PT-BR):`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text() || "Falha na tradução.";
    } catch (error) {
        console.error("Translation Error:", error);
        return "Erro ao traduzir o prompt.";
    }
};

const extractMimeType = (dataUrl: string) => {
    const match = dataUrl.match(/^data:([^;]+);base64,/);
    return match ? match[1] : 'image/jpeg';
};

export const analyzeImageWithConfig = async (
    images: ImageReferences,
    clothing: ClothingConfig,
    camera: CameraConfig,
    renderingStyle: string,
    manualGeneral: string[],
    manualStyles: string[],
    customDirections: string,
    correctionInstructions: string,
    videoMovement: string,
    videoAction: string,
    isVideoMode: boolean
): Promise<string> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key não encontrada no .env");

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: SYSTEM_INSTRUCTION,
    });

    let textPrompt = "";
    textPrompt += `TARGET MODEL: Sauce Prompt Nano Banana Pro\n`;
    textPrompt += `RENDERING MODE: ${renderingStyle}\n\n`;

    manualGeneral.forEach((desc, i) => {
        if (desc) textPrompt += `GENERAL COMPOSITION & SCENE REFERENCE 0${i + 1}: ${desc}\n`;
    });

    manualStyles.forEach((desc, i) => {
        if (desc) textPrompt += `STYLE & LOOK REFERENCE 0${i + 1}: ${desc}\n`;
    });

    if (clothing.accessories) textPrompt += `ACCESSORIES: ${clothing.accessories}\n`;
    if (clothing.tattoos) textPrompt += `TATTOOS: ${clothing.tattoos}\n`;

    textPrompt += `\nOPTICAL SPECIFICATIONS:\n`;
    textPrompt += `- Camera Rig: ${camera.camera}\n- Optical Glass: ${camera.lens}\n- Focal Length: ${camera.focalLength}mm\n- Aperture: ${camera.aperture}\n\n`;

    if (customDirections) textPrompt += `⚠️ USER CUSTOM DIRECTIONS:\n${customDirections}\n\n`;

    if (isVideoMode) {
        textPrompt += `🎬 VIDEO MODE ACTIVE:\n- Movement: ${videoMovement}\n- Action: ${videoAction}\n\n`;
    }

    if (correctionInstructions && images.resultImage) {
        textPrompt += `🔄 REFINEMENT LOOP:\n- User Feedback: ${correctionInstructions}\n- Objective: Correct the provided "RESULT IMAGE" based on these instructions and additional references.\n\n`;
    }

    textPrompt += `Generate a detailed prompt in English for the target model.`;

    const parts: any[] = [];
    parts.push({ text: textPrompt });

    if (images.resultImage) {
        parts.push({ inlineData: { mimeType: extractMimeType(images.resultImage), data: images.resultImage.split(',')[1] } });
    }

    // New: Processing refinement references
    if (images.refinementReferences && images.refinementReferences.length > 0) {
        images.refinementReferences.forEach((ref, i) => {
            parts.push({ inlineData: { mimeType: extractMimeType(ref), data: ref.split(',')[1] } });
        });
    }

    images.general.forEach(img => {
        if (img) parts.push({ inlineData: { mimeType: extractMimeType(img), data: img.split(',')[1] } });
    });

    if (images.faces.length > 0) {
        images.faces.forEach((faceData) => {
            parts.push({ inlineData: { mimeType: extractMimeType(faceData), data: faceData.split(',')[1] } });
        });
    }

    if (images.shirt) parts.push({ inlineData: { mimeType: extractMimeType(images.shirt), data: images.shirt.split(',')[1] } });
    if (images.pants) parts.push({ inlineData: { mimeType: extractMimeType(images.pants), data: images.pants.split(',')[1] } });
    if (images.footwear) parts.push({ inlineData: { mimeType: extractMimeType(images.footwear), data: images.footwear.split(',')[1] } });

    images.styles.forEach(img => {
        if (img) parts.push({ inlineData: { mimeType: extractMimeType(img), data: img.split(',')[1] } });
    });

    try {
        const result = await model.generateContent(parts);
        const response = await result.response;
        return response.text() || "Falha ao gerar o prompt.";
    } catch (error: any) {
        console.error("Gemini Analysis Error:", error);
        throw new Error(`A análise falhou: ${error.message || 'Erro desconhecido.'} Por favor, tente novamente.`);
    }
};
