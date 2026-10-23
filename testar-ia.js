require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

// Configure GEMINI_API_KEY apenas no arquivo .env local.
if (!process.env.GEMINI_API_KEY) {
  console.error('Defina GEMINI_API_KEY no arquivo .env antes de testar o tutor.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function rodarTutor() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Explique brevemente o que é álgebra booleana',
      config: {
        systemInstruction: 'Você é um tutor de matemática no SkillSwap. Seja didático e direto.',
        temperature: 0.7
      }
    });
    console.log('Resposta do tutor:', response.text);
  } catch (error) {
    console.error('Falha ao testar tutor. Verifique sua chave, permissões e conectividade.');
    process.exitCode = 1;
  }
}

rodarTutor();
