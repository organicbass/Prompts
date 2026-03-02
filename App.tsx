
import React, { useState, useRef, useEffect } from 'react';
import { analyzeImageWithConfig, translatePrompt } from './services/geminiService';
import { AppState, CameraConfig, ClothingConfig, ImageReferences } from './types';
import { UploadIcon, CameraIcon, CopyIcon, TrashIcon, SparklesIcon, CheckIcon } from './components/Icons';

const RENDERING_MODES = [
    { id: 'photo', name: 'Photorealistic', icon: '📸' },
    { id: '3d_gamer', name: '3D Style Gamer', icon: '🎮' },
    { id: '3d_cartoon', name: '3D Cartoon', icon: '🐣' },
    { id: '3d_poly', name: '3D Poly', icon: '💎' },
    { id: '2d', name: '2D Style', icon: '✏️' },
];

const ReferenceSlot: React.FC<{
    label: string;
    image: string | null;
    onUpload: (data: string | null) => void;
    aspect?: string;
    highlight?: boolean;
}> = ({ label, image, onUpload, aspect = "aspect-[3/4]", highlight }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => onUpload(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col gap-2 group/slot">
            <div
                onClick={() => !image && inputRef.current?.click()}
                className={`relative ${aspect} rounded-2xl border flex flex-col items-center justify-center transition-all overflow-hidden ${image ? 'border-white/10 bg-neutral-900' : highlight ? 'border-blue-500/50 bg-blue-500/5' : 'border-dashed border-white/5 bg-[#121212] hover:bg-white/[0.02] cursor-pointer'
                    }`}
            >
                {!image ? (
                    <div className="flex flex-col items-center gap-2 px-4 text-center">
                        <UploadIcon className={`w-5 h-5 ${highlight ? 'text-blue-500' : 'text-neutral-600'} group-hover/slot:text-blue-500 transition-colors`} />
                        <span className={`text-[9px] font-bold ${highlight ? 'text-blue-400' : 'text-neutral-500'} uppercase tracking-widest leading-tight`}>{label}</span>
                    </div>
                ) : (
                    <>
                        <img src={image} className="w-full h-full object-cover" alt={label} />
                        <button
                            onClick={(e) => { e.stopPropagation(); onUpload(null); }}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 rounded-full text-white backdrop-blur-md transition-all opacity-0 group-hover/slot:opacity-100"
                        >
                            <TrashIcon className="w-3 h-3" />
                        </button>
                    </>
                )}
                <input type="file" className="hidden" accept="image/*" ref={inputRef} onChange={handleChange} />
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [state, setState] = useState<AppState>({
        images: {
            general: [],
            faces: [],
            shirt: null, pants: null, footwear: null,
            styles: [],
            resultImage: null,
            refinementReferences: []
        },
        clothing: { shirt: '', pants: '', footwear: '', accessories: '', tattoos: '' },
        cameraConfig: { camera: 'IMAX Film Camera', lens: 'Helios', focalLength: '50', aperture: 'f/4' },
        renderingStyle: 'Photorealistic',
        manualGeneral: [],
        manualStyles: [],
        customDirections: '',
        correctionInstructions: '',
        videoMovement: '',
        videoAction: '',
        isVideoMode: false,
        includeFaceIdentity: true,
        analyzing: false,
        translating: false,
        result: null,
        error: null,
    });
    const [copied, setCopied] = useState(false);
    const [copiedTrans, setCopiedTrans] = useState(false);

    const handleUpload = async (type: keyof ImageReferences, data: string | null, index?: number) => {
        setState(prev => {
            const newImages = { ...prev.images };
            if (Array.isArray(newImages[type])) {
                const arr = [...(newImages[type] as string[])];
                if (data === null && index !== undefined) {
                    arr.splice(index, 1);
                    if (type === 'general') {
                        const newManual = [...prev.manualGeneral];
                        newManual.splice(index, 1);
                        return { ...prev, images: { ...newImages, [type]: arr }, manualGeneral: newManual, result: null };
                    }
                    if (type === 'styles') {
                        const newManual = [...prev.manualStyles];
                        newManual.splice(index, 1);
                        return { ...prev, images: { ...newImages, [type]: arr }, manualStyles: newManual, result: null };
                    }
                } else if (data !== null) {
                    arr.push(data);
                }
                newImages[type] = arr as any;
            } else {
                (newImages[type] as any) = data;
            }
            return { ...prev, images: newImages, result: null };
        });
    };

    const handleManualChange = (type: 'general' | 'style', index: number, value: string) => {
        setState(prev => {
            if (type === 'general') {
                const newManual = [...prev.manualGeneral];
                newManual[index] = value;
                return { ...prev, manualGeneral: newManual };
            } else {
                const newManual = [...prev.manualStyles];
                newManual[index] = value;
                return { ...prev, manualStyles: newManual };
            }
        });
    };

    const handleAnalyze = async (mode: 'initial' | 'refinement' | 'video' = 'initial') => {
        setState(prev => ({ ...prev, analyzing: true, error: null, isVideoMode: mode === 'video' }));
        try {
            const prompt = await analyzeImageWithConfig(
                state.images,
                state.clothing,
                state.cameraConfig,
                state.renderingStyle,
                state.manualGeneral,
                state.manualStyles,
                state.customDirections,
                mode === 'refinement' ? state.correctionInstructions : '',
                mode === 'video' ? state.videoMovement : '',
                mode === 'video' ? state.videoAction : '',
                mode === 'video'
            );

            setState(prev => ({
                ...prev,
                analyzing: false,
                translating: true,
                result: { prompt, timestamp: Date.now() },
            }));

            // Traduzir automaticamente
            const trans = await translatePrompt(prompt);
            setState(prev => ({
                ...prev,
                translating: false,
                result: prev.result ? { ...prev.result, translatedPrompt: trans } : null
            }));

        } catch (err: any) {
            setState(prev => ({ ...prev, analyzing: false, error: err.message }));
        }
    };

    const copyToClipboard = (text: string, isTrans: boolean) => {
        navigator.clipboard.writeText(text);
        if (isTrans) {
            setCopiedTrans(true);
            setTimeout(() => setCopiedTrans(false), 2000);
        } else {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-[#050505] px-4 py-8 md:px-8 text-neutral-200">
            {/* Header */}
            <header className="w-full max-w-7xl mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter">
                        SAUCE <span className="text-blue-500 underline decoration-4 underline-offset-8">PROMPT</span>
                    </h1>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[9px] text-neutral-600 uppercase font-black tracking-widest mb-1">Status Studio</p>
                        <p className="text-xs text-blue-500 font-bold uppercase">NANO BANANA PRO ATIVO</p>
                    </div>
                </div>
            </header>

            <main className="w-full max-w-7xl grid grid-cols-1 xl:grid-cols-12 gap-10">

                {/* Left: Rendering Mode (3 cols) */}
                <div className="xl:col-span-3 space-y-6">
                    <section className="bg-[#0c0c0c] rounded-[32px] p-6 border border-white/5">
                        <h2 className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                            <div className="w-6 h-[1px] bg-neutral-800"></div>
                            Modo de Render
                        </h2>
                        <div className="grid grid-cols-1 gap-2">
                            {RENDERING_MODES.map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => setState(prev => ({ ...prev, renderingStyle: mode.name, result: null }))}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${state.renderingStyle === mode.name ? 'bg-blue-500 text-white border-blue-400' : 'bg-[#1a1a1a] border-white/5 text-neutral-500 hover:border-white/20'
                                        }`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest">{mode.name}</span>
                                    <span className="text-lg">{mode.icon}</span>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Center: References (6 cols) */}
                <div className="xl:col-span-6 space-y-10">

                    {/* Reference Slots */}
                    <section className="bg-[#0c0c0c] rounded-[40px] p-10 border border-white/5">
                        <h2 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
                            <div className="w-10 h-[1px] bg-neutral-800"></div>
                            01. Referências de Imagem
                        </h2>

                        <div className="space-y-12">
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Cena e Composição</h3>
                                <div className="grid grid-cols-3 gap-6">
                                    {state.images.general.map((img, i) => (
                                        <div key={`general-${i}`} className="space-y-4">
                                            <ReferenceSlot
                                                label={`Geral ${i + 1}`}
                                                image={img}
                                                onUpload={(d) => handleUpload('general', d, i)}
                                                aspect="aspect-video"
                                            />
                                            <div className="bg-[#121212] rounded-xl p-3 border border-white/5">
                                                <textarea
                                                    placeholder="Descreva a cena..."
                                                    value={state.manualGeneral[i] || ''}
                                                    onChange={(e) => handleManualChange('general', i, e.target.value)}
                                                    className="w-full bg-transparent border-none outline-none text-[10px] text-neutral-400 font-medium placeholder:text-neutral-700 resize-none h-12 custom-scrollbar"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <ReferenceSlot
                                        label="+ Geral"
                                        image={null}
                                        onUpload={(d) => handleUpload('general', d)}
                                        aspect="aspect-video"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6 pt-8 border-t border-white/5">
                                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Estilo e Look</h3>
                                <div className="grid grid-cols-3 gap-6">
                                    {state.images.styles.map((img, i) => (
                                        <div key={`style-${i}`} className="space-y-4">
                                            <ReferenceSlot
                                                label={`Estilo ${i + 1}`}
                                                image={img}
                                                onUpload={(d) => handleUpload('styles', d, i)}
                                                aspect="aspect-video"
                                                highlight
                                            />
                                            <div className="bg-[#121212] rounded-xl p-3 border border-blue-500/10">
                                                <textarea
                                                    placeholder="Moody, vintage..."
                                                    value={state.manualStyles[i] || ''}
                                                    onChange={(e) => handleManualChange('style', i, e.target.value)}
                                                    className="w-full bg-transparent border-none outline-none text-[10px] text-blue-200/50 font-medium placeholder:text-neutral-700 resize-none h-12 custom-scrollbar"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <ReferenceSlot
                                        label="+ Estilo"
                                        image={null}
                                        onUpload={(d) => handleUpload('styles', d)}
                                        aspect="aspect-video"
                                        highlight
                                    />
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/5">
                                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-4 border border-purple-500/20">
                                    <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <span>✨</span> O Que Adicionar no Prompt
                                    </h3>
                                    <textarea
                                        placeholder="Ex: CTA em português, estilo minimalista..."
                                        value={state.customDirections}
                                        onChange={(e) => setState(p => ({ ...p, customDirections: e.target.value }))}
                                        className="w-full bg-black/40 border border-purple-500/20 rounded-xl p-3 text-[11px] text-purple-100 font-medium placeholder:text-neutral-600 resize-none h-20 custom-scrollbar focus:border-purple-500/50 focus:outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/5">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setState(prev => ({ ...prev, includeFaceIdentity: !prev.includeFaceIdentity }))}
                                            className={`w-12 h-6 rounded-full transition-all ${state.includeFaceIdentity ? 'bg-blue-500' : 'bg-neutral-700'} relative`}
                                        >
                                            <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all ${state.includeFaceIdentity ? 'left-6' : 'left-0.5'}`} />
                                        </button>
                                        <div>
                                            <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">02. Motor de Identidade (Face Identity)</h3>
                                        </div>
                                    </div>
                                    {state.includeFaceIdentity && <span className="text-[10px] font-black text-blue-500">{state.images.faces.length}/10</span>}
                                </div>
                                {state.includeFaceIdentity && (
                                    <div className="grid grid-cols-5 gap-4">
                                        {state.images.faces.map((face, i) => (
                                            <ReferenceSlot key={i} label={`Face ${i + 1}`} image={face} onUpload={(d) => handleUpload('faces', d, i)} />
                                        ))}
                                        {state.images.faces.length < 10 && (
                                            <ReferenceSlot label="+ Rosto" image={null} onUpload={(d) => handleUpload('faces', d)} />
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-3 xl:grid-cols-5 gap-6 pt-8 border-t border-white/5">
                                <div className="space-y-3">
                                    <ReferenceSlot label="Camisa" image={state.images.shirt} onUpload={(d) => handleUpload('shirt', d)} />
                                    <div className="bg-[#121212] rounded-xl p-3 border border-white/5">
                                        <textarea
                                            placeholder="Ex: Camisa social..."
                                            value={state.clothing.shirt}
                                            onChange={(e) => setState(p => ({ ...p, clothing: { ...p.clothing, shirt: e.target.value } }))}
                                            className="w-full bg-transparent border-none outline-none text-[9px] text-neutral-400 font-medium placeholder:text-neutral-700 resize-none h-10 custom-scrollbar"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <ReferenceSlot label="Calça" image={state.images.pants} onUpload={(d) => handleUpload('pants', d)} />
                                    <div className="bg-[#121212] rounded-xl p-3 border border-white/5">
                                        <textarea
                                            placeholder="Ex: Calça jeans..."
                                            value={state.clothing.pants}
                                            onChange={(e) => setState(p => ({ ...p, clothing: { ...p.clothing, pants: e.target.value } }))}
                                            className="w-full bg-transparent border-none outline-none text-[9px] text-neutral-400 font-medium placeholder:text-neutral-700 resize-none h-10 custom-scrollbar"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <ReferenceSlot label="Calçados" image={state.images.footwear} onUpload={(d) => handleUpload('footwear', d)} />
                                    <div className="bg-[#121212] rounded-xl p-3 border border-white/5">
                                        <textarea
                                            placeholder="Ex: Tênis..."
                                            value={state.clothing.footwear}
                                            onChange={(e) => setState(p => ({ ...p, clothing: { ...p.clothing, footwear: e.target.value } }))}
                                            className="w-full bg-transparent border-none outline-none text-[9px] text-neutral-400 font-medium placeholder:text-neutral-700 resize-none h-10 custom-scrollbar"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="aspect-[3/4] rounded-2xl border border-dashed border-white/5 bg-[#121212] flex flex-col items-center justify-center p-4 text-center">
                                        <SparklesIcon className="w-5 h-5 text-neutral-600 mb-2" />
                                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Acessórios</span>
                                    </div>
                                    <div className="bg-[#121212] rounded-xl p-3 border border-white/5">
                                        <textarea
                                            placeholder="Relógio, etc..."
                                            value={state.clothing.accessories}
                                            onChange={(e) => setState(p => ({ ...p, clothing: { ...p.clothing, accessories: e.target.value } }))}
                                            className="w-full bg-transparent border-none outline-none text-[9px] text-neutral-400 font-medium placeholder:text-neutral-700 resize-none h-10 custom-scrollbar"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="aspect-[3/4] rounded-2xl border border-dashed border-white/5 bg-[#121212] flex flex-col items-center justify-center p-4 text-center">
                                        <SparklesIcon className="w-5 h-5 text-neutral-600 mb-2" />
                                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Tatuagem</span>
                                    </div>
                                    <div className="bg-[#121212] rounded-xl p-3 border border-white/5">
                                        <textarea
                                            placeholder="Descrição..."
                                            value={state.clothing.tattoos}
                                            onChange={(e) => setState(p => ({ ...p, clothing: { ...p.clothing, tattoos: e.target.value } }))}
                                            className="w-full bg-transparent border-none outline-none text-[9px] text-neutral-400 font-medium placeholder:text-neutral-700 resize-none h-10 custom-scrollbar"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right: Output (3 cols) */}
                <div className="xl:col-span-3">
                    <div className="bg-[#0c0c0c] rounded-[40px] p-8 border border-white/5 flex flex-col min-h-[700px] sticky top-8">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em]">Saída Studio</h2>
                            {state.result && (
                                <button onClick={() => copyToClipboard(state.result!.prompt, false)} className="p-2 hover:bg-white/5 rounded-full transition-all text-neutral-600 hover:text-blue-500">
                                    {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                                </button>
                            )}
                        </div>

                        {state.result?.prompt && (
                            <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
                                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 font-mono text-[10px] leading-[1.7] text-blue-100/90 h-[250px] overflow-y-auto custom-scrollbar">
                                    {state.result.prompt}
                                </div>

                                <div className="pt-6 border-t border-white/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Google Tradutor (PT-BR)</h3>
                                        {state.result.translatedPrompt && (
                                            <button onClick={() => copyToClipboard(state.result!.translatedPrompt!, true)} className="p-2 hover:bg-white/5 rounded-full transition-all text-neutral-600 hover:text-blue-500">
                                                {copiedTrans ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                    <div className="bg-black/40 border border-white/5 rounded-2xl p-6 font-mono text-[10px] leading-[1.7] text-orange-200/70 h-[250px] overflow-y-auto custom-scrollbar">
                                        {state.translating ? (
                                            <div className="flex items-center gap-2 animate-pulse">
                                                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                                <span>Traduzindo para Português...</span>
                                            </div>
                                        ) : (
                                            state.result.translatedPrompt || 'Aguardando geração do prompt para tradução...'
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {!state.result && !state.analyzing && (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-10 text-center">
                                <SparklesIcon className="w-16 h-16 mb-4" />
                                <p className="text-[9px] font-black uppercase tracking-widest">Sincronize as referências para começar</p>
                            </div>
                        )}

                        {state.analyzing && (
                            <div className="flex-1 flex flex-col justify-center space-y-6">
                                <div className="h-2 bg-white/5 rounded-full w-full animate-pulse"></div>
                                <div className="h-40 bg-white/5 rounded-3xl w-full animate-pulse"></div>
                                <div className="h-2 bg-white/5 rounded-full w-2/3 animate-pulse"></div>
                            </div>
                        )}

                        <button
                            onClick={() => handleAnalyze('initial')}
                            disabled={state.analyzing}
                            className="mt-8 w-full py-5 bg-white text-black font-black text-[10px] uppercase tracking-[0.3em] rounded-[20px] hover:bg-blue-600 hover:text-white transition-all shadow-lg disabled:opacity-50 active:scale-[0.98]"
                        >
                            {state.analyzing ? 'Sincronizando...' : 'Sintetizar Imagem'}
                        </button>
                    </div>
                </div>
            </main>

            {/* Refinement & Video Section */}
            <section className="w-full max-w-7xl mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Refinement Loop */}
                <div className="bg-[#0c0c0c] rounded-[40px] p-8 border border-white/5">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                            <UploadIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Circuito de Refinamento</h3>
                            <p className="text-[9px] text-neutral-600 uppercase">Ajuste técnico com novas referências</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <ReferenceSlot
                                label="Resultado Atual"
                                image={state.images.resultImage}
                                onUpload={(d) => handleUpload('resultImage', d)}
                                aspect="aspect-square"
                            />

                            <div className="space-y-4">
                                <h4 className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Ajuste de Instrução</h4>
                                <div className="bg-orange-500/5 rounded-2xl p-4 border border-orange-500/10 h-[150px]">
                                    <textarea
                                        placeholder="Ex: Não era para gerar o personagem masculino e sim o robô..."
                                        value={state.correctionInstructions}
                                        onChange={(e) => setState(p => ({ ...p, correctionInstructions: e.target.value }))}
                                        className="w-full bg-transparent border-none outline-none text-[10px] text-orange-100/70 font-medium placeholder:text-neutral-700 resize-none h-full custom-scrollbar"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* New: Dynamic Refinement References */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h4 className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Novas Referências de Correção</h4>
                            <div className="grid grid-cols-4 gap-4">
                                {state.images.refinementReferences.map((img, i) => (
                                    <ReferenceSlot
                                        key={`refinement-${i}`}
                                        label={`Ref ${i + 1}`}
                                        image={img}
                                        onUpload={(d) => handleUpload('refinementReferences', d, i)}
                                        aspect="aspect-square"
                                        highlight
                                    />
                                ))}
                                <ReferenceSlot
                                    label="+ Ref"
                                    image={null}
                                    onUpload={(d) => handleUpload('refinementReferences', d)}
                                    aspect="aspect-square"
                                    highlight
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => handleAnalyze('refinement')}
                            disabled={state.analyzing || !state.images.resultImage}
                            className="w-full py-4 bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-orange-500 transition-all disabled:opacity-30 shadow-lg shadow-orange-900/10"
                        >
                            {state.analyzing ? 'Refinando...' : 'Refinar Resultado'}
                        </button>
                    </div>
                </div>

                {/* Video Module */}
                <div className="bg-[#0c0c0c] rounded-[40px] p-8 border border-white/5">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                                <CameraIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Motor de Vídeo</h3>
                                <p className="text-[9px] text-neutral-600 uppercase">Sintetizar Movimento</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setState(prev => ({ ...prev, isVideoMode: !prev.isVideoMode }))}
                            className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${state.isVideoMode ? 'bg-blue-500 text-white' : 'bg-neutral-800 text-neutral-500'}`}
                        >
                            {state.isVideoMode ? 'Ativo' : 'Desativado'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-[#121212] rounded-2xl p-4 border border-white/5">
                            <h4 className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-2">Movimento de Câmera</h4>
                            <input
                                type="text"
                                placeholder="Ex: Slow zoom in..."
                                value={state.videoMovement}
                                onChange={(e) => setState(p => ({ ...p, videoMovement: e.target.value }))}
                                className="w-full bg-transparent border-none outline-none text-[11px] text-white font-medium placeholder:text-neutral-700"
                            />
                        </div>
                        <div className="bg-[#121212] rounded-2xl p-4 border border-white/5">
                            <h4 className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-2">Ação/Dinamismo</h4>
                            <textarea
                                placeholder="O sujeito sorri..."
                                value={state.videoAction}
                                onChange={(e) => setState(p => ({ ...p, videoAction: e.target.value }))}
                                className="w-full bg-transparent border-none outline-none text-[11px] text-white font-medium placeholder:text-neutral-700 resize-none h-20 custom-scrollbar"
                            />
                        </div>
                        <button
                            onClick={() => handleAnalyze('video')}
                            disabled={state.analyzing || !state.isVideoMode}
                            className="w-full py-4 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/10 disabled:opacity-30"
                        >
                            {state.analyzing ? 'Sintetizando...' : 'Gerar Prompt Vídeo'}
                        </button>
                    </div>
                </div>
            </section>

            <footer className="mt-24 py-12 border-t border-white/5 w-full max-w-7xl flex flex-col items-center gap-6">
                <div className="flex gap-12 opacity-10 grayscale">
                    <div className="text-[9px] font-black uppercase tracking-[0.4em]">Engine de Consistência Studio</div>
                    <div className="text-[9px] font-black uppercase tracking-[0.4em]">Mapeamento de Estilo v4.8</div>
                </div>
            </footer>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2a2a2a; }
            `}</style>
        </div>
    );
};

export default App;
