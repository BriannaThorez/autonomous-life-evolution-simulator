import { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai";
import { Message } from './types';
import { SystemObserver } from './SystemObserver';
import { SimulationState } from '../../../types';

export interface ChatConfig {
  systemInstruction?: string;
  simState?: SimulationState;
}

export function useChat({ systemInstruction, simState }: ChatConfig) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<ChatSession | null>(null);
  const [codebaseContext, setCodebaseContext] = useState<string>('');
  const [isContextLoaded, setIsContextLoaded] = useState(false);

  // Load codebase on mount
  useEffect(() => {
    const loadCodebase = async () => {
      try {
        // @ts-ignore - Vite specific feature
        const modules = import.meta.glob('/src/**/*.{ts,tsx}', { query: '?raw', import: 'default' });
        let context = '';
        for (const path in modules) {
          // @ts-ignore
          const content = await modules[path]();
          context += `\n\n// --- File: ${path} ---\n${content}`;
        }
        setCodebaseContext(context);
        setIsContextLoaded(true);
      } catch (e) {
        console.error("Failed to load codebase context", e);
        setIsContextLoaded(true); // Proceed without context if fail
      }
    };
    loadCodebase();
  }, []);

  // Initialize Chat Session when codebase is ready
  useEffect(() => {
    if (!isContextLoaded) return;

    const initChat = () => {
      const apiKey = process.env.GEMINI_API_KEY || '';
      if (!apiKey) {
        console.warn("GEMINI_API_KEY is not set. Chat will not function.");
        return;
      }

      const ai = new GoogleGenerativeAI(apiKey);

      // Build full system instruction with codebase context and module map
      const moduleMap = SystemObserver.getModuleMap();
      const fullSystemInstruction = `
${systemInstruction || 'You are a helpful assistant.'}

${moduleMap}

--- SOURCE CODE CONTEXT ---
The following is the complete source code of the application. Use this to answer technical questions about the simulation logic, rendering, or genetics.
${codebaseContext}
`;

      try {
        const model = ai.getGenerativeModel({
          model: "gemini-2.0-flash",
          systemInstruction: fullSystemInstruction,
        });

        chatSessionRef.current = model.startChat();
      } catch (e) {
        console.error("Failed to init chat session", e);
      }
    };

    initChat();
  }, [isContextLoaded, codebaseContext, systemInstruction]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      if (!chatSessionRef.current) {
        if (!isContextLoaded) {
          throw new Error("Initializing neural core... please wait.");
        }
        throw new Error("Connection to Oracle lost. Please retry.");
      }

      // Inject live biosphere state via SystemObserver
      let messageToSend = text;
      if (simState) {
        const biosphereSummary = SystemObserver.getBiosphereSummary(simState);
        messageToSend = `[CURRENT BIOSPHERE STATE]\n${biosphereSummary}\n\n[USER QUERY]\n${text}`;
      }

      const result = await chatSessionRef.current.sendMessageStream(messageToSend);

      let fullResponse = "";
      // Add an empty message for the model that we will update
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'model') {
            lastMessage.text = fullResponse;
          }
          return newMessages;
        });
      }
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${error.message || "Failed to process request."}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => setMessages([]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages
  };
}
