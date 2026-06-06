const { GoogleGenAI } = require('@google/genai');

// Coloque a sua chave que funcionou aqui dentro das aspas
const ai = new GoogleGenAI({ apiKey: "AIzaSyB-RGNynnI-QxplJSzXu-ScrzYtTwccy0M" });

async function rodarTutor() {
    // Corrigido para um loop tradicional à prova de falhas
    const modelosParaTentar = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    let respostaGerada = null;

    for (let i = 0; i < modelosParaTentar.length; i++) {
        const modelo = modelosParaTentar[i];
        
        try {
            console.log(`🤖 Tentando conectar ao modelo: ${modelo}...`);

            const response = await ai.models.generateContent({
                model: modelo,
                contents: 'Explique brevemente o que é álgebra booleana',
                config: {
                    systemInstruction: "Você é um Tutor Especialista em Matemática no SkillSwap. Seja didático e direto.",
                    temperature: 0.7
                }
            });

            respostaGerada = response.text;
            break; // Se funcionou, interrompe o loop e vai para o resultado

        } catch (error) {
            console.warn(`⚠️ O modelo ${modelo} falhou ou está instável agora.`);
        }
    }

    // Exibe o resultado final na tela
    if (respostaGerada) {
        console.log("\n🎓 Resposta do Tutor:");
        console.log(respostaGerada);
    } else {
        console.error("\n🚨 Não foi possível obter resposta dos servidores do Gemini. Tente novamente em alguns instantes.");
    }
}

rodarTutor();