
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { ChatModel, Task } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const FALLBACK_MESSAGE = "Neural link interrupted. Re-connecting..."; 

let globalAudioCtx: AudioContext | null = null;

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
}

export const chatWithRudhhStream = async (
  input: string, 
  history: any[], 
  isThinkingMode: boolean = false,
  tasks: Task[] = [],
  onChunk: (text: string, thinking?: string) => void
): Promise<{ modelName: string, groundingChunks?: any[] }> => {
  const ai = getAI();
  // Using gemini-3-flash-preview for ultra-fast, "under 6s" responses.
  const modelName = isThinkingMode ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const activeTasksSummary = tasks.filter(t => !t.isCompleted)
    .map(t => `- ${t.title}`).join(', ');

  const systemInstruction = `You are Dr. Rudhh, a tactical academic mentor. 
  Current Quests: ${activeTasksSummary || "None"}.
  Rules: Be concise, tactical, and fast. No emojis. Use bold headers. Max 100 words.`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: modelName,
      contents: [...history, { role: 'user', parts: [{ text: input }] }],
      config: { 
        systemInstruction, 
        ...(isThinkingMode ? { thinkingConfig: { thinkingBudget: 15000 } } : {}) // Reduced budget for faster thinking
      }
    });

    let fullText = "";
    let fullThinking = "";
    let groundingChunks: any[] = [];

    for await (const chunk of responseStream) {
      const c = chunk as GenerateContentResponse;
      
      // Use the recommended .text getter for speed and safety
      const text = c.text;
      if (text) {
        fullText += text;
      }

      // Check for thinking parts if in pro mode
      if (isThinkingMode) {
        const parts = c.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const p of parts) {
            if ("thought" in p && p.thought) {
              fullThinking += p.thought;
            }
          }
        }
      }
      
      if (c.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        groundingChunks = c.candidates[0].groundingMetadata.groundingChunks;
      }
      
      onChunk(fullText, fullThinking);
    }

    return { modelName, groundingChunks };
  } catch (err) {
    console.error("Stream Error:", err);
    onChunk(FALLBACK_MESSAGE);
    return { modelName };
  }
};

export const speakResponse = async (text: string) => {
  const ai = getAI();
  try {
    if (!globalAudioCtx) {
      globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (globalAudioCtx.state === 'suspended') await globalAudioCtx.resume();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Quickly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data;

    if (audioData && globalAudioCtx) {
      const audioBuffer = await decodeAudioData(decode(audioData), globalAudioCtx, 24000, 1);
      const source = globalAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(globalAudioCtx.destination);
      source.start();
    }
  } catch (err) {
    console.warn("TTS Failed");
  }
};
