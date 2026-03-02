/// <reference types="vite/client" />
import { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SystemObserver } from './SystemObserver';
import { SimulationState } from '../../../types';

interface UseChatProps {
  systemInstruction: string;
  title: string;
  welcomeMessage: string;
  simState: SimulationState;
}

export const useChat = ({ systemInstruction, simState }: UseChatProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<any>(null);

  const updateSystemContext = async () => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined");
      }
      const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

      // Load codebase (filtered for key files to save tokens)
      const modules = import.meta.glob('/src/**/*.{ts,tsx}', { query: '?raw', import: 'default' });
      let codebase = '';
      const importantPaths = [
        '/src/core/SimulationEngine.ts',
        '/src/entities/Fauna/Cognition/Brain.ts',
        '/src/App.tsx',
        '/types.ts'
      ];

      for (const path in modules) {
        if (importantPaths.some(p => path.includes(p))) {
          const code = await modules[path]();
          codebase += `\n\n--- File: ${path} ---\n${code}`;
        }
      }

      const biosphereSummary = SystemObserver.getBiosphereSummary(simState);
      const moduleMap = SystemObserver.getModuleMap();

      const fullSystemInstruction = `
${systemInstruction}

${moduleMap}

${biosphereSummary}

Here is the current core codebase for reference:
${codebase}
      `.trim();

      const model = ai.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: fullSystemInstruction,
      });

      chatRef.current = model.startChat({
        history: [],
      });
    } catch (error) {
      console.error("Failed to initialize chat:", error);
    }
  };

  useEffect(() => {
    updateSystemContext();
  }, [systemInstruction]);

  const sendMessage = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsLoading(true);

    try {
      if (!chatRef.current) {
        throw new Error("Chat not initialized");
      }

      // Dynamic refresh of state before sending message
      const biosphereSummary = SystemObserver.getBiosphereSummary(simState);
      const response = await chatRef.current.sendMessage({
        message: `${text}\n\n[Current Context Update]:\n${biosphereSummary}`
      });

      setMessages(prev => [...prev, { role: 'assistant', text: response.text }]);
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, isLoading, sendMessage };
};
