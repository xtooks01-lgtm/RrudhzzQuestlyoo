
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ChatModel, Task } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const FALLBACK_MESSAGE = "Tactical link failure. Re-establish connection and try again."; 

// Singleton AudioContext to prevent initialization lag
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
  // Use a safer way to get the Int16Array from the buffer
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
  
  const activeTasksSummary = tasks.filter(t => !t.isCompleted)
    .map(t => `- ${t.title} (Active: ${t.startTime} to ${t.endTime})`).join('\n');

  const systemInstruction = `You are Dr. Rudhh, a legendary academic strategist and mentor.
  Mission: Help the student achieve peak cognitive performance and perfect schedule management.
  
  CURRENT OPERATIONS CONTEXT:
  ${activeTasksSummary || "No active missions currently scheduled."}

  OPERATIONAL GUIDELINES:
  1. Persona: Professional, tactical, authoritative, and brilliantly eccentric.
  2. Tone: "Academic Commander."
  3. Formatting: Bold headers, clean bullet points, absolute clarity.
  4. Constraints: No emojis. Max 180 words.
  5. Behavior: For schedule questions, prioritize efficiency. For study questions, provide first-principles breakdowns.`;

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
    console.error("Neural Link Error:", err);
    return { text: FALLBACK_MESSAGE, modelName };
  }
};

export const speakResponse = async (text: string) => {
  const ai = getAI();
  try {
    if (!globalAudioCtx) {
      globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (globalAudioCtx.state === 'suspended') {
      await globalAudioCtx.resume();
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Respond clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    const audioData = parts?.find(p => p.inlineData?.data)?.inlineData?.data;

    if (audioData && globalAudioCtx) {
      const audioBuffer = await decodeAudioData(decode(audioData), globalAudioCtx, 24000, 1);
      const source = globalAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(globalAudioCtx.destination);
      source.start();
    }
  } catch (err) {
    console.warn("TTS Synthesis Offline");
  }
};
