import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VocabularyItem, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to decode base64 audio string to ArrayBuffer
export const decodeBase64ToArrayBuffer = (base64String: string): ArrayBuffer => {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Helper to convert raw PCM data to AudioBuffer
// Gemini TTS returns raw PCM 16-bit, 24kHz (usually), mono.
export const pcmToAudioBuffer = (
  buffer: ArrayBuffer,
  ctx: AudioContext,
  sampleRate: number = 24000
): AudioBuffer => {
  const pcm16 = new Int16Array(buffer);
  const audioBuffer = ctx.createBuffer(1, pcm16.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  
  for (let i = 0; i < pcm16.length; i++) {
    // Normalize 16-bit integer to float range [-1, 1]
    channelData[i] = pcm16[i] / 32768.0;
  }
  
  return audioBuffer;
};

export const generateVocabularyList = async (
  scenario: string,
  targetLanguage: Language
): Promise<VocabularyItem[]> => {
  
  const prompt = `Generate 5 useful and common vocabulary words related to the scenario: "${scenario}".
  The target language for learning is ${targetLanguage}.
  The "meaning" and "exampleTranslation" should be in Chinese (Simplified).
  
  If Target is English: Word is English, Pronunciation is IPA.
  If Target is Japanese: Word is Kanji/Kana, Pronunciation is Romaji (e.g. "arigatou").
  If Target is Chinese: Word is Hanzi, Pronunciation is Pinyin.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            pronunciation: { type: Type.STRING },
            meaning: { type: Type.STRING },
            exampleSentence: { type: Type.STRING },
            exampleTranslation: { type: Type.STRING },
          },
          required: ["word", "pronunciation", "meaning", "exampleSentence", "exampleTranslation"],
        },
      },
    },
  });

  if (response.text) {
    return JSON.parse(response.text) as VocabularyItem[];
  }
  return [];
};

export const generateSceneImage = async (word: string, scenario: string): Promise<string | null> => {
  try {
    const prompt = `A clean, colorful, vector-style educational illustration of the word "${word}" in the context of "${scenario}". Minimalist background. High quality.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed", error);
    return "https://picsum.photos/400/400"; // Fallback
  }
};

export const generateSpeech = async (text: string, language: Language): Promise<ArrayBuffer | null> => {
  try {
    // Select voice based on language roughly
    let voiceName = 'Kore'; 
    if (language === Language.JAPANESE) voiceName = 'Puck'; 
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return decodeBase64ToArrayBuffer(base64Audio);
    }
    return null;
  } catch (error) {
    console.error("Audio generation failed", error);
    return null;
  }
};