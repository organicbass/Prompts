
import React, { useState, useRef } from 'react';
import { analyzeImageWithConfig, detectOpticsFromImage } from './services/geminiService';
import { AppState, CameraConfig, ClothingConfig, ImageReferences, AIModel } from './types';
import { UploadIcon, CameraIcon, CopyIcon, TrashIcon, SparklesIcon, CheckIcon } from './components/Icons';

const MODELS: AIModel[] = [
  { id: 'soul', name: 'Higgsfield Soul', description: 'Visual de moda ultra-realista' },
  { id: 'popcorn', name: 'Higgsfield Popcorn', description: 'Storyboard, edição e criação' },
  { id: 'banana', name: 'Nano Banana Pro', description: 'O melhor modelo de imagem 4K' },
  { id: 'seeddream', name: 'Seeddream 4.5', description: 'Modelo de imagem 4K de próxima geração' },
  { id: 'gpt', name: 'GPT Image 1.5', description: 'Renderização de precisão com cores reais' },
  { id: 'flux', name: 'FLUX.2', description: 'Detalhes otimizados para velocidade' },
  { id: 'zimage', name: 'Z-Image', description: 'Retratos instantâneos realistas' },
  { id: 'kling', name: 'Kling 01 Image', description: 'Imagens fotorrealistas e precisas' },
  { id: 'wan', name: 'Wan 2.2 Image', description: 'Imagens realistas de alta qualidade' },
  { id: 'reve', name: 'Reve', description: 'Modelo avançado de edição de imagem' },
  { id: 'topaz', name: 'Topaz', description: 'Upscaler de alta resolução' },
];

const RENDERING_MODES = [
  { id: 'photo', name: 'Photorealistic', icon: '📸' },
  { id: '3d_gamer', name: '3D Style Gamer', icon: '🎮' },
  { id: '3d_cartoon', name: '3D Cartoon', icon: '🐣' },
  { id: '3d_poly', name: '3D Poly', icon: '💎' },
  { id: '2d', name: '2D Style', icon: '✏️' },
];

const ARTISTIC_STYLES = [
  // Row 1
  'Layer mixed media', 'Sketch', 'Canvas', 'Overexposed', 'Paper', 'Noir',
  // Row 2
  'Particles', 'Hand paint', 'Toxic', 'Tracking', 'Ultraviolet', 'Windows',
  // Row 3
  'Acid', 'Palette', 'Comic', 'Akrill', 'Two color', 'Multiverse', 'Fragments', 'Origami', 'Random Glow',
  // Row 4
  'Vintage', 'Cannabis', 'Bubbles', 'Magazine', 'Cold vision', 'Modern', 'LSD', 'Broken mirror', 'Lava',
  // Row 5
  'Flash comic', 'Flash cosmic', 'Marble', 'Ocean'
];

const CAMERA_PRESETS = [
  { id: 'imax', name: 'IMAX Film Camera', lens: 'Helios', focal: '50mm', aperture: 'f/4' },
  { id: 'dxl2', name: 'Panavision Millennium DXL2', lens: 'Panavision C-Series', focal: '35mm', aperture: 'f/1.4' },
  { id: 'alexa35', name: 'ARRI ALEXA 35', lens: 'ARRI Signature Prime', focal: '50mm', aperture: 'f/1.8' },
  { id: 'venice2', name: 'Sony VENICE 2', lens: 'Zeiss Master Prime', focal: '85mm', aperture: 'f/2.0' },
  { id: 'vraptor', name: 'RED V-RAPTOR XL', lens: 'Cooke Anamorphic', focal: '40mm', aperture: 'f/2.3' },
  { id: 'ursa12k', name: 'Blackmagic URSA 12K', lens: 'Angenieux Optimo', focal: '24mm', aperture: 'f/2.8' },
  { id: 'pocket3', name: 'Osmo Pocket 3', lens: 'Fixed Wide', focal: '20mm', aperture: 'f/2.0' },
  { id: 'iphone16', name: 'iPhone 16 Pro Max', lens: 'Default Wide', focal: '24mm', aperture: 'f/1.78' },
];

const LENSES = ['Helios', 'Panavision C-Series', 'Cooke Anamorphic', 'ARRI Signature', 'Zeiss Master Prime', 'Angenieux Optimo', 'Leica Summilux', 'Petzval', 'Anamorphic'];
const FOCAL_LENGTHS = ['14', '16', '20', '24', '35', '40', '50', '75', '85', '100', '135', '200'];
const APERTURES = ['f/0.95', 'f/1.4', 'f/1.8', 'f/2.0', 'f/2.8', 'f/4', 'f/5.6', 'f/8', 'f/11'];

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

const ModelItem: React.FC<{ model: AIModel; active: boolean; onClick: () => void }> = ({ model, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-3 rounded-2xl border transition-all ${active ? 'bg-white/5 border-white/20' : 'bg-transparent border-transparent hover:bg-white/[0.02]'
      }`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${active ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-neutral-900 border-white/5 text-neutral-600'}`}>
      <SparklesIcon className="w-5 h-5" />
    </div>
    <div className="flex-1 text-left">
      <div className="flex items-center gap-2">
        <span className={`text-[11px] font-black uppercase tracking-wider ${active ? 'text-white' : 'text-neutral-400'}`}>{model.name}</span>
      </div>
      <p className="text-[10px] text-neutral-600 font-medium">{model.description}</p>
    </div>
  </button>
);

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    images: {
      general1: null, general2: null, general3: null,
      faces: [],
      shirt: null, pants: null, footwear: null,
      style1: null, style2: null, style3: null
    },
    clothing: { shirt: '', pants: '', footwear: '', accessories: '', tattoos: '' },
    cameraConfig: { camera: 'IMAX Film Camera', lens: 'Helios', focalLength: '50', aperture: 'f/4' },
    selectedModel: 'banana',
    renderingStyle: 'Photorealistic',
    artisticStyle: 'None',
    manualGeneral1: '',
    manualGeneral2: '',
    manualGeneral3: '',
    manualStyle1: '',
    manualStyle2: '',
    manualStyle3: '',
    customDirections: '',
    correctionInstructions: '',
    videoMovement: '',
    videoAction: '',
    isVideoMode: false,
    includeFaceIdentity: true,
    analyzing: false,
    result: null,
    error: null,
  });
  const [copied, setCopied] = useState(false);

  const [detectingOptics, setDetectingOptics] = useState(false);

  const handleUpload = async (type: keyof ImageReferences, data: string | null, index?: number) => {
    setState(prev => {
      const newImages = { ...prev.images };
      if (type === 'faces') {
        if (data === null && index !== undefined) {
          newImages.faces = newImages.faces.filter((_, i) => i !== index);
        } else if (data !== null) {
          if (newImages.faces.length < 10) {
            newImages.faces = [...newImages.faces, data];
          }
        }
      } else {
        (newImages[type] as any) = data;
      }
      return { ...prev, images: newImages, result: null };
    });
  };

  const handleAnalyze = async (mode: 'initial' | 'refinement' | 'video' = 'initial') => {
    setState(prev => ({ ...prev, analyzing: true, error: null, isVideoMode: mode === 'video' }));
    try {
      const activeModelName = MODELS.find(m => m.id === state.selectedModel)?.name || 'Nano Banana Pro';
      const prompt = await analyzeImageWithConfig(
        state.images,
        state.clothing,
        state.cameraConfig,
        activeModelName,
        state.renderingStyle,
        state.artisticStyle,
        [state.manualGeneral1, state.manualGeneral2, state.manualGeneral3],
        [state.manualStyle1, state.manualStyle2, state.manualStyle3],
        state.customDirections,
        mode === 'refinement' ? state.correctionInstructions : '',
        mode === 'video' ? state.videoMovement : '',
        mode === 'video' ? state.videoAction : '',
        mode === 'video'
      );
      setState(prev => ({
        ...prev,
        analyzing: false,
        result: { prompt, timestamp: Date.now() },
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, analyzing: false, error: err.message }));
    }
  };

  const copyToClipboard = () => {
    if (state.result?.prompt) {
      navigator.clipboard.writeText(state.result.prompt);
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
            <p className="text-[9px] text-neutral-600 uppercase font-black tracking-widest mb-1">Status do Motor</p>
            <p className="text-xs text-blue-500 font-bold uppercase">{MODELS.find(m => m.id === state.selectedModel)?.name} ATIVO</p>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl grid grid-cols-1 xl:grid-cols-12 gap-10">

        {/* Left: Models Selection & Style (3 cols) */}
        <div className="xl:col-span-3 space-y-6">
          <section className="bg-[#0c0c0c] rounded-[32px] p-6 border border-white/5">
            <h2 className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
              <div className="w-6 h-[1px] bg-neutral-800"></div>
              Motor Alvo
            </h2>
            <div className="space-y-1 h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {MODELS.map(model => (
                <ModelItem
                  key={model.id}
                  model={model}
                  active={state.selectedModel === model.id}
                  onClick={() => setState(prev => ({ ...prev, selectedModel: model.id, result: null }))}
                />
              ))}
            </div>
          </section>

          {/* Rendering Mode Selector */}
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

        {/* Center: References & Artistic Styles (6 cols) */}
        <div className="xl:col-span-6 space-y-10">

          {/* Reference Slots */}
          <section className="bg-[#0c0c0c] rounded-[40px] p-10 border border-white/5">
            <h2 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
              <div className="w-10 h-[1px] bg-neutral-800"></div>
              01. Referências de Imagem
            </h2>

            <div className="space-y-12">
              {/* Reference Slots: Geral 01, 02, 03 */}
              <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3].map((num) => (
                  <div key={`geral-${num}`} className="space-y-4">
                    <ReferenceSlot
                      label={`0${num}. Geral`}
                      image={state.images[`general${num}` as keyof ImageReferences] as string | null}
                      onUpload={(d) => handleUpload(`general${num}` as keyof ImageReferences, d)}
                      aspect="aspect-video"
                    />
                    <div className="bg-[#121212] rounded-xl p-3 border border-white/5">
                      <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Composição Geral</h3>
                      <textarea
                        placeholder="Descreva a cena manualmente..."
                        value={state[`manualGeneral${num}` as keyof AppState] as string}
                        onChange={(e) => setState(p => ({ ...p, [`manualGeneral${num}`]: e.target.value }))}
                        className="w-full bg-transparent border-none outline-none text-[10px] text-neutral-400 font-medium placeholder:text-neutral-700 resize-none h-12 custom-scrollbar"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Reference Slots: Estilo 01, 02, 03 */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/5">
                {[1, 2, 3].map((num) => (
                  <div key={`style-${num}`} className="space-y-4">
                    <ReferenceSlot
                      label={`Copiar Estilo 0${num}`}
                      image={state.images[`style${num}` as keyof ImageReferences] as string | null}
                      onUpload={(d) => handleUpload(`style${num}` as keyof ImageReferences, d)}
                      aspect="aspect-video"
                      highlight
                    />
                    <div className="bg-[#121212] rounded-xl p-3 border border-blue-500/10">
                      <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Filtro e Cores</h3>
                      <textarea
                        placeholder="Moody, vintage, etc..."
                        value={state[`manualStyle${num}` as keyof AppState] as string}
                        onChange={(e) => setState(p => ({ ...p, [`manualStyle${num}`]: e.target.value }))}
                        className="w-full bg-transparent border-none outline-none text-[10px] text-blue-200/50 font-medium placeholder:text-neutral-700 resize-none h-12 custom-scrollbar"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* User Custom Directions */}
              <div className="pt-8 border-t border-white/5">
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-4 border border-purple-500/20">
                  <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span>✨</span> O Que Adicionar no Prompt
                  </h3>
                  <textarea
                    placeholder="Ex: CTA em português, estilo minimalista, foco no produto, tom profissional, incluir call-to-action..."
                    value={state.customDirections}
                    onChange={(e) => setState(p => ({ ...p, customDirections: e.target.value }))}
                    className="w-full bg-black/40 border border-purple-500/20 rounded-xl p-3 text-[11px] text-purple-100 font-medium placeholder:text-neutral-600 resize-none h-20 custom-scrollbar focus:border-purple-500/50 focus:outline-none transition-all"
                  />
                  <p className="text-[9px] text-neutral-600 mt-2">Suas instruções serão seguidas com prioridade máxima</p>
                </div>
              </div>

              {/* Artistic Style Library */}
              <div className="pt-8 border-t border-white/5">
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-4">Estilo Artístico (Cinema Studio)</h3>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 h-48 overflow-y-auto custom-scrollbar pr-2 p-1">
                  <button
                    onClick={() => setState(prev => ({ ...prev, artisticStyle: 'None', result: null }))}
                    className={`p-2 rounded-lg text-[8px] font-black uppercase border transition-all ${state.artisticStyle === 'None' ? 'bg-white text-black border-white' : 'bg-[#1a1a1a] border-white/5 text-neutral-600 hover:border-white/20'
                      }`}
                  >
                    Nenhum
                  </button>
                  {ARTISTIC_STYLES.map(style => (
                    <button
                      key={style}
                      onClick={() => setState(prev => ({ ...prev, artisticStyle: style, result: null }))}
                      className={`p-2 rounded-lg text-[8px] font-black uppercase border transition-all leading-tight text-center ${state.artisticStyle === style ? 'bg-blue-500 text-white border-blue-400' : 'bg-[#1a1a1a] border-white/5 text-neutral-600 hover:border-white/20'
                        }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Face Multi-Slot with Toggle */}
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
                      <p className="text-[10px] text-neutral-600 leading-relaxed">{state.includeFaceIdentity ? 'Carregue até 10 fotos para precisão 100%.' : 'Desativado - sem foco em rosto'}</p>
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
                    {Array.from({ length: Math.max(0, 10 - Math.max(state.images.faces.length + 1, 0)) }).map((_, i) => (
                      state.images.faces.length < 10 ? <div key={`empty-${i}`} className="aspect-[3/4] rounded-2xl border border-white/[0.02] bg-black/20"></div> : null
                    ))}
                  </div>
                )}
              </div>

              {/* Clothing, Accessories & Tattoos */}
              <div className="grid grid-cols-3 xl:grid-cols-5 gap-6 pt-8 border-t border-white/5">
                <div className="space-y-3">
                  <ReferenceSlot label="Camisa" image={state.images.shirt} onUpload={(d) => handleUpload('shirt', d)} />
                  <div className="bg-[#121212] rounded-xl p-3 border border-white/5">
                    <textarea
                      placeholder="Ex: Camisa social preta..."
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
                      placeholder="Ex: Calça jeans azul..."
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
                      placeholder="Ex: Tênis esportivo..."
                      value={state.clothing.footwear}
                      onChange={(e) => setState(p => ({ ...p, clothing: { ...p.clothing, footwear: e.target.value } }))}
                      className="w-full bg-transparent border-none outline-none text-[9px] text-neutral-400 font-medium placeholder:text-neutral-700 resize-none h-10 custom-scrollbar"
                    />
                  </div>
                </div>
                {/* Accessories */}
                <div className="space-y-3">
                  <div className="aspect-[3/4] rounded-2xl border border-dashed border-white/5 bg-[#121212] flex flex-col items-center justify-center p-4 text-center">
                    <SparklesIcon className="w-5 h-5 text-neutral-600 mb-2" />
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest leading-tight">Acessórios</span>
                  </div>
                  <div className="bg-[#121212] rounded-xl p-3 border border-white/5">
                    <textarea
                      placeholder="Brincos, relógio, etc..."
                      value={state.clothing.accessories}
                      onChange={(e) => setState(p => ({ ...p, clothing: { ...p.clothing, accessories: e.target.value } }))}
                      className="w-full bg-transparent border-none outline-none text-[9px] text-neutral-400 font-medium placeholder:text-neutral-700 resize-none h-10 custom-scrollbar"
                    />
                  </div>
                </div>
                {/* Tattoos */}
                <div className="space-y-3">
                  <div className="aspect-[3/4] rounded-2xl border border-dashed border-white/5 bg-[#121212] flex flex-col items-center justify-center p-4 text-center">
                    <SparklesIcon className="w-5 h-5 text-neutral-600 mb-2" />
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest leading-tight">Tatuagem</span>
                  </div>
                  <div className="bg-[#121212] rounded-xl p-3 border border-white/5">
                    <textarea
                      placeholder="Descrição das tattoos..."
                      value={state.clothing.tattoos}
                      onChange={(e) => setState(p => ({ ...p, clothing: { ...p.clothing, tattoos: e.target.value } }))}
                      className="w-full bg-transparent border-none outline-none text-[9px] text-neutral-400 font-medium placeholder:text-neutral-700 resize-none h-10 custom-scrollbar"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Removed Cinema Studio Setup - using only optics detection */}
        </div>

        {/* Right: Output (3 cols) */}
        <div className="xl:col-span-3">
          <div className="bg-[#0c0c0c] rounded-[40px] p-8 border border-white/5 flex flex-col min-h-[700px] sticky top-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em]">Saída Studio</h2>
              {state.result && (
                <button onClick={copyToClipboard} className="p-2 hover:bg-white/5 rounded-full transition-all text-neutral-600 hover:text-blue-500">
                  {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                </button>
              )}
            </div>

            {state.result?.prompt && (
              <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-6 font-mono text-[10px] leading-[1.7] text-blue-100/90 overflow-y-auto custom-scrollbar">
                {state.result.prompt}
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
                <div className="text-center mt-10">
                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em] animate-pulse">
                    {state.isVideoMode ? 'Sintetizando Movimento...' : 'Sincronizando Studio...'}
                  </p>
                  <p className="text-[8px] text-neutral-600 mt-2 uppercase">Integrando estilos: {state.renderingStyle} + {state.artisticStyle}</p>
                  <p className="text-[7px] text-neutral-700 mt-1 uppercase">Otimizando para Algoritmo 2026</p>
                </div>
              </div>
            )}

            <button
              onClick={() => handleAnalyze('initial')}
              disabled={state.analyzing}
              className="mt-8 w-full py-5 bg-white text-black font-black text-[10px] uppercase tracking-[0.3em] rounded-[20px] hover:bg-blue-600 hover:text-white transition-all shadow-lg disabled:opacity-50 active:scale-[0.98]"
            >
              {state.analyzing && !state.isVideoMode && !state.correctionInstructions ? 'Sincronizando...' : 'Sintetizar Imagem'}
            </button>
          </div>
        </div>
      </main>

      {/* NEW: Refinement & Video Section */}
      <section className="w-full max-w-7xl mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Refinement Loop */}
        <div className="bg-[#0c0c0c] rounded-[40px] p-8 border border-white/5">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
              <UploadIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Circuito de Refinamento</h3>
              <p className="text-[9px] text-neutral-600 uppercase">Cole a imagem gerada e peça ajustes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ReferenceSlot
              label="Resultado Atual"
              image={state.images.resultImage}
              onUpload={(d) => handleUpload('resultImage', d)}
              aspect="aspect-square"
            />
            <div className="space-y-4">
              <div className="bg-orange-500/5 rounded-2xl p-4 border border-orange-500/10 h-full">
                <h4 className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-2">Instruções de Correção</h4>
                <textarea
                  placeholder="Ex: Mude a iluminação para dourado, ajuste o caimento da camisa..."
                  value={state.correctionInstructions}
                  onChange={(e) => setState(p => ({ ...p, correctionInstructions: e.target.value }))}
                  className="w-full bg-transparent border-none outline-none text-[10px] text-orange-100/70 font-medium placeholder:text-neutral-700 resize-none h-20 custom-scrollbar"
                />
                <button
                  onClick={() => handleAnalyze('refinement')}
                  disabled={state.analyzing || !state.images.resultImage}
                  className="mt-2 w-full py-3 bg-orange-600 text-white font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-orange-500 transition-all disabled:opacity-30"
                >
                  {state.analyzing ? 'Refinando...' : 'Refinar Resultado'}
                </button>
              </div>
            </div>
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
                <p className="text-[9px] text-neutral-600 uppercase">Sintetizar Movimento e Câmera</p>
              </div>
            </div>
            <button
              onClick={() => setState(prev => ({ ...prev, isVideoMode: !prev.isVideoMode }))}
              className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${state.isVideoMode ? 'bg-blue-500 text-white' : 'bg-neutral-800 text-neutral-500'
                }`}
            >
              {state.isVideoMode ? 'Ativo' : 'Desativado'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-[#121212] rounded-2xl p-4 border border-white/5">
              <h4 className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-2">Movimento de Câmera</h4>
              <input
                type="text"
                placeholder="Ex: Slow zoom in, orbit right, crane up..."
                value={state.videoMovement}
                onChange={(e) => setState(p => ({ ...p, videoMovement: e.target.value }))}
                className="w-full bg-transparent border-none outline-none text-[11px] text-white font-medium placeholder:text-neutral-700"
              />
            </div>
            <div className="bg-[#121212] rounded-2xl p-4 border border-white/5">
              <h4 className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-2">Ação/Dinamismo (Hook de Vídeo)</h4>
              <textarea
                placeholder="Ex: O sujeito sorri e olha para a câmera enquanto caminha lentamente..."
                value={state.videoAction}
                onChange={(e) => setState(p => ({ ...p, videoAction: e.target.value }))}
                className="w-full bg-transparent border-none outline-none text-[11px] text-white font-medium placeholder:text-neutral-700 resize-none h-20 custom-scrollbar"
              />
            </div>
            <button
              onClick={() => handleAnalyze('video')}
              disabled={state.analyzing || !state.isVideoMode}
              className="w-full py-4 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-blue-500 transition-all shadow-lg disabled:opacity-30"
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
          <div className="text-[9px] font-black uppercase tracking-[0.4em]">Deep-Face Intelligence</div>
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
