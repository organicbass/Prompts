
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
Receberás múltiplas imagens de referência e parâmetros de estilo. Deves sintetizar tudo em um prompt mestre.

# 1. CIRCUITO DE REFINAMENTO (IMAGE-TO-IMAGE CORRECTION)
Se receberes uma "IMAGEM DE RESULTADO" e "INSTRUÇÕES DE AJUSTE":
- ANALISE O ERRO: Compare a imagem de resultado com os pedidos originais.
- CORRIJA COM PRECISÃO: Gere um novo prompt que enfatize o que precisa mudar (ex: "increase light intensity", "change shirt to red"), mantendo a base da pose e cenário.

# 2. MOTOR DE VÍDEO (VIDEO SYNTHESIS)
Se o modo VÍDEO estiver ativo:
- DINÂMICA TEMPORAL: Adicione "Temporal consistency", "Fluid movement", "High-bitrate video".
- MOVIMENTO DE CÂMERA: Descreva explicitamente o movimento solicitado (Zoom, Pan, Orbit) com termos técnicos cinematográficos.
- AÇÃO: Descreva a sequência de movimento do sujeito de forma contínua e natural.

# 3. COMPOSIÇÃO GERAL, ESTILO E IDENTIDADE
- Mantenha a fidelidade absoluta às fotos de rosto e vestuário.
- Para estilos, extraia filtros, color grade e efeitos visuais únicos.

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

// Interface para os resultados da detecção de óptica
export interface DetectedOptics {
    camera: string;
    lens: string;
    focalLength: string;
    aperture: string;
    confidence: string;
}

// Função para detectar automaticamente câmera/lente de uma imagem de estilo
export const detectOpticsFromImage = async (imageData: string): Promise<DetectedOptics> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key não encontrada no .env");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
    });

    const prompt = `Analise esta imagem e identifique os equipamentos de câmera/óptica que provavelmente foram usados para criar este visual.

SINAIS A PROCURAR:
- Bokeh SWIRLY (girando em espiral) = Helios
- Bokeh oval + flare horizontal = Anamorphic  
- Bokeh suave circular = Cooke S7/i
- Extrema nitidez = Zeiss Master Prime
- Bokeh romântico = Leica Summilux-C
- Grão de filme + cores quentes = IMAX Film Camera
- Imagem ultra-limpa = Sony VENICE 2
- Cores naturais = ARRI ALEXA 35
- Alta saturação = RED V-RAPTOR XL
- Fundo borrado extremo = f/1.4 ou menor
- Separação suave = f/2.0-f/2.8
- Tudo em foco = f/5.6+

RESPONDA APENAS EM JSON NESTE FORMATO EXATO (sem markdown, sem code blocks):
{"camera":"NOME_CAMERA","lens":"NOME_LENTE","focalLength":"NUMERO","aperture":"f/NUMERO","confidence":"high/medium/low"}

OPÇÕES DE CÂMERA: IMAX Film Camera, Panavision Millennium DXL2, ARRI ALEXA 35, Sony VENICE 2, RED V-RAPTOR XL
OPÇÕES DE LENTE: Helios, Cooke S7/i, Zeiss Master Prime, Leica Summilux-C, Anamorphic
OPÇÕES DE FOCAL: 14, 16, 20, 24, 35, 40, 50, 75, 85, 100, 135, 200
OPÇÕES DE ABERTURA: f/0.95, f/1.4, f/1.8, f/2.0, f/2.8, f/4, f/5.6, f/8, f/11`;

    try {
        const result = await model.generateContent([
            prompt,
            { inlineData: { mimeType: 'image/jpeg', data: imageData.split(',')[1] } }
        ]);
        const response = await result.response;
        const text = response.text();

        // Limpar o texto e fazer parse do JSON
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const detected = JSON.parse(cleanedText);

        return {
            camera: detected.camera || 'IMAX Film Camera',
            lens: detected.lens || 'Helios',
            focalLength: detected.focalLength || '50',
            aperture: detected.aperture || 'f/4',
            confidence: detected.confidence || 'medium'
        };
    } catch (error) {
        console.error("Optics Detection Error:", error);
        // Retornar valores padrão em caso de erro
        return {
            camera: 'IMAX Film Camera',
            lens: 'Helios',
            focalLength: '50',
            aperture: 'f/4',
            confidence: 'low'
        };
    }
};


export const analyzeImageWithConfig = async (
    images: ImageReferences,
    clothing: ClothingConfig,
    camera: CameraConfig,
    targetModel: string,
    renderingStyle: string,
    artisticStyle: string,
    manualGeneral: string[],
    manualStyle: string[],
    customDirections: string,
    correctionInstructions: string,
    videoMovement: string,
    videoAction: string,
    isVideoMode: boolean
): Promise<string> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key não encontrada no .env");

    // Usando @google/generative-ai (biblioteca oficial estável)
    const genAI = new GoogleGenerativeAI(apiKey);

    // Usando gemini-1.5-flash com a biblioteca correta
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM_INSTRUCTION,
    });

    // Construir o prompt de texto
    let textPrompt = "";

    textPrompt += `TARGET AI ENGINE: ${targetModel}\n`;
    textPrompt += `RENDERING MODE: ${renderingStyle}\n`;
    textPrompt += `ARTISTIC STYLE: ${artisticStyle}\n\n`;

    manualGeneral.forEach((desc, i) => {
        if (desc) textPrompt += `GENERAL COMPOSITION & SCENE REFERENCE 0${i + 1}: ${desc}\n`;
    });

    manualStyle.forEach((desc, i) => {
        if (desc) textPrompt += `STYLE & LOOK REFERENCE 0${i + 1}: ${desc}\n`;
    });

    if (clothing.accessories) {
        textPrompt += `ACCESSORIES: ${clothing.accessories}\n`;
    }
    if (clothing.tattoos) {
        textPrompt += `TATTOOS: ${clothing.tattoos}\n`;
    }

    textPrompt += `\nOPTICAL SPECIFICATIONS:\n`;
    textPrompt += `- Camera Rig: ${camera.camera}\n`;
    textPrompt += `- Optical Glass: ${camera.lens}\n`;
    textPrompt += `- Focal Length: ${camera.focalLength}mm\n`;
    textPrompt += `- Aperture: ${camera.aperture}\n\n`;

    if (customDirections) {
        textPrompt += `⚠️ USER CUSTOM DIRECTIONS (MANDATORY - FOLLOW EXACTLY):\n${customDirections}\n\n`;
    }

    if (isVideoMode) {
        textPrompt += `🎬 VIDEO MODE ACTIVE:\n`;
        textPrompt += `- Movement: ${videoMovement}\n`;
        textPrompt += `- Action: ${videoAction}\n\n`;
    }

    if (correctionInstructions && images.resultImage) {
        textPrompt += `🔄 REFINEMENT LOOP:\n`;
        textPrompt += `- User Feedback: ${correctionInstructions}\n`;
        textPrompt += `- Objective: Correct the provided "RESULT IMAGE" based on these instructions.\n\n`;
    }

    textPrompt += `Generate a detailed prompt in English for the target model. Focus on Social Media 2026 stop-power.`;

    // Construir o array de parts para a API
    const parts: any[] = [];

    // Adicionar texto
    parts.push({ text: textPrompt });

    // Adicionar imagens se existirem
    if (images.resultImage) {
        parts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: images.resultImage.split(',')[1]
            }
        });
    }
    [1, 2, 3].forEach(num => {
        const key = `general${num}` as keyof ImageReferences;
        if (images[key] && typeof images[key] === 'string') {
            parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: (images[key] as string).split(',')[1]
                }
            });
        }
    });

    if (images.faces.length > 0) {
        images.faces.forEach((faceData) => {
            parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: faceData.split(',')[1]
                }
            });
        });
    }

    if (images.shirt) {
        parts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: images.shirt.split(',')[1]
            }
        });
    }

    if (images.pants) {
        parts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: images.pants.split(',')[1]
            }
        });
    }

    if (images.footwear) {
        parts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: images.footwear.split(',')[1]
            }
        });
    }

    [1, 2, 3].forEach(num => {
        const key = `style${num}` as keyof ImageReferences;
        if (images[key] && typeof images[key] === 'string') {
            parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: (images[key] as string).split(',')[1]
                }
            });
        }
    });

    try {
        const result = await model.generateContent(parts);
        const response = await result.response;
        return response.text() || "Falha ao gerar o prompt.";
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        throw new Error("A análise falhou. Por favor, tente novamente.");
    }
};
