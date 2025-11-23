import React, { useState, useEffect, useRef } from 'react';
import { VocabularyItem, Language } from '../types';
import { generateSceneImage, generateSpeech, pcmToAudioBuffer } from '../services/geminiService';

interface WordViewerProps {
  item: VocabularyItem;
  scenarioName: string;
  targetLanguage: Language;
}

export const WordViewer: React.FC<WordViewerProps> = ({ item, scenarioName, targetLanguage }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [audioLoading, setAudioLoading] = useState<'word' | 'sentence' | null>(null);
  
  // Audio contexts
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchImage = async () => {
      setImageLoading(true);
      // Reset image when word changes
      setImageUrl(null);
      
      const url = await generateSceneImage(item.word, scenarioName);
      if (isMounted) {
        setImageUrl(url);
        setImageLoading(false);
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [item, scenarioName]);

  const playAudio = async (text: string, type: 'word' | 'sentence') => {
    if (audioLoading) return;
    setAudioLoading(type);

    try {
      if (!audioContextRef.current) {
        const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtor({ sampleRate: 24000 });
      }

      // Resume context if suspended (browser policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const audioBufferData = await generateSpeech(text, targetLanguage);
      
      if (audioBufferData && audioContextRef.current) {
         // Use helper to convert raw PCM to AudioBuffer manually
         // native decodeAudioData fails because the API returns raw PCM without headers
         const audioBuffer = pcmToAudioBuffer(audioBufferData, audioContextRef.current);
         
         const source = audioContextRef.current.createBufferSource();
         source.buffer = audioBuffer;
         source.connect(audioContextRef.current.destination);
         source.start();
      }
    } catch (err) {
      console.error("Error playing audio", err);
    } finally {
      setAudioLoading(null);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto p-4 h-full md:h-auto overflow-y-auto">
      {/* Image Section */}
      <div className="w-full md:w-1/2 aspect-square bg-slate-100 rounded-3xl overflow-hidden shadow-inner relative flex items-center justify-center">
        {imageLoading ? (
          <div className="flex flex-col items-center gap-2 text-slate-400 animate-pulse">
            <svg className="w-10 h-10 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium">Generating Scene...</span>
          </div>
        ) : imageUrl ? (
          <img src={imageUrl} alt={item.word} className="w-full h-full object-cover animate-in fade-in duration-700" />
        ) : (
          <div className="text-slate-400">Image unavailable</div>
        )}
      </div>

      {/* Content Section */}
      <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6">
        
        {/* Word Header */}
        <div className="space-y-2">
           <div className="flex items-center gap-3">
             <h2 className="text-4xl md:text-5xl font-bold text-slate-800">{item.word}</h2>
             <button 
                onClick={() => playAudio(item.word, 'word')}
                disabled={!!audioLoading}
                className={`p-3 rounded-full transition-colors ${audioLoading === 'word' ? 'bg-slate-200 cursor-wait' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}
             >
                {audioLoading === 'word' ? (
                   <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                    <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                  </svg>
                )}
             </button>
           </div>
           <div className="flex items-baseline gap-3">
             <span className="text-xl text-slate-500 font-mono">{item.pronunciation}</span>
             <span className="text-xl text-indigo-600 font-bold">{item.meaning}</span>
           </div>
        </div>

        <div className="h-px bg-slate-200 w-full"></div>

        {/* Example Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Example / 例句</p>
            <p className="text-lg text-slate-800 font-medium leading-relaxed mb-2">{item.exampleSentence}</p>
            <p className="text-slate-500">{item.exampleTranslation}</p>
            
            <button 
                onClick={() => playAudio(item.exampleSentence, 'sentence')}
                disabled={!!audioLoading}
                className="mt-4 flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
                {audioLoading === 'sentence' ? (
                   <span className="flex items-center gap-2">
                     <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                     Loading audio...
                   </span>
                ) : (
                   <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                    </svg>
                    Play Sentence
                   </>
                )}
            </button>
        </div>

      </div>
    </div>
  );
};