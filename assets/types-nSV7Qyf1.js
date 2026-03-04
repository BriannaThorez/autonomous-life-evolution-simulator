const t=`export interface Message {\r
    role: 'user' | 'model';\r
    text: string;\r
}\r
\r
export interface ChatConfig {\r
    systemInstruction?: string;\r
    title?: string;\r
    placeholder?: string;\r
    welcomeMessage?: string;\r
    simState?: SimulationState;\r
}`;export{t as default};
