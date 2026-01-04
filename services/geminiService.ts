
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ChatModel, PracticeQuestion, MasteryChallenge, SuggestedTask, Task } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const AI_TIMEOUT_MS = 15000; 
const FALLBACK_MESSAGE = "Sensor interference detected. Maintain mission parameters and re-attempt contact."; 

async function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => resolve(fallback), AI_TIMEOUT_MS);
  });

  return Promise.race([
    promise.then(val => {
      clearTimeout(timeoutId);
      return val;
    }).catch(() => {
      clearTimeout(timeoutId);
      return fallback;
    }),
    timeoutPromise
  ]);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  try {
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, Math.floor(data.byteLength / 2));
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  } catch (e) {
    console.error("Audio Decoding Failure:", e);
    return ctx.createBuffer(numChannels, 1, sampleRate);
  }
}

export const chatWithRudhh = async (
  input: string, 
  history: any[], 
  isThinkingMode: boolean = false,
  tasks: Task[] = []
): Promise<{ text: string, modelName: string, groundingChunks?: any[], thinking?: string }> => {
  const ai = getAI();
  const needsSearch = /latest|news|current|who is|weather|today's|price|events/i.test(input);
  
  // Requirement: Fast responses use flash-lite, complex use pro-preview with thinkingBudget
  const modelName = isThinkingMode ? 'gemini-3-pro-preview' : 'gemini-2.5-flash-lite-latest';
  
  const systemInstruction = `You are Dr. Rudhh, a legendary academic mentor and tactical productivity coach. 
  Context: The student has ${tasks.length} active quests.
  Rules:
  - Professional, tactical, and slightly eccentric tone.
  - Bullet points for structure.
  - No emojis.
  - Max 250 words.
  - If in thinking mode, provide profound, multi-layered academic strategy.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [...history, { role: 'user', parts: [{ text: input }] }],
      config: { 
        systemInstruction, 
        tools: needsSearch ? [{ googleSearch: {} }] : [],
        ...(isThinkingMode ? { thinkingConfig: { thinkingBudget: 32768 } } : {})
      }
    });

    let thinkingText = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if ("thought" in part && part.thought) {
          thinkingText += part.thought;
        }
      }
    }

    return {
      text: response.text || FALLBACK_MESSAGE,
      modelName,
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks,
      thinking: thinkingText || undefined
    };
  } catch (err) {
    console.error("Tactical Link Failure:", err);
    return { text: FALLBACK_MESSAGE, modelName };
  }
};

export const speakResponse = async (text: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Speak concisely: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    const audioPart = parts?.find(p => p.inlineData?.data);
    const base64Audio = audioPart?.inlineData?.data;

    if (base64Audio) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
    }
  } catch (err) {
    console.warn("TTS Module Offline:", err);
  }
};
