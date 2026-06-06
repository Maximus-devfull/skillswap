// Tudo o que roda assim que a página carrega fica aqui dentro:
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Validação e Boas-vindas ao Usuário
    const nomeDoUsuario = localStorage.getItem('usuario_nome');
    if (nomeDoUsuario) {
        document.getElementById('nome-usuario').innerText = `Olá, ${nomeDoUsuario}! 🚀`;
    } else {
        // Se tentarem burlar a URL sem logar, chuta de volta
        window.location.href = 'index.html';
    }

    // 2. Sistema de clicar nas tags e preencher o campo de aprendizado
    const campoAprendizado = document.getElementById("aprendizado");
    const linksOpcoes = document.querySelectorAll("#opcoes a");

    linksOpcoes.forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault(); 

            const habilidadeSelecionada = link.textContent.trim();
            const valorAtual = campoAprendizado.value.trim();

            if (valorAtual === "") {
                campoAprendizado.value = habilidadeSelecionada;
            } else {
                const habilidadesFatiadas = valorAtual.split(",").map(h => h.trim());
                
                if (!habilidadesFatiadas.includes(habilidadeSelecionada)) {
                    campoAprendizado.value = `${valorAtual}, ${habilidadeSelecionada}`;
                }
            }
        });
    });

    // 3. Botão de sugestão de TALENTO (Colocado aqui dentro!)
    const btnTalento = document.getElementById('btn') || document.querySelector('.ensinar button');
    const campoTalento = document.getElementById('talento');

    if (btnTalento && campoTalento) {
        btnTalento.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                campoTalento.placeholder = "Buscando...";
                const resposta = await fetch('http://localhost:3000/api/sugerir-ia');
                const dados = await resposta.json();
                campoTalento.value = dados.sugestao;
            } catch (err) { 
                console.error("Erro ao sugerir talento:", err); 
            } finally { 
                campoTalento.placeholder = "Ex: Java, inglês, Fotografia"; 
            }
        });
    }

    // 4. Botão de sugestão de APRENDIZADO (Colocado aqui dentro!)
    const btnAprendizado = document.querySelector('.aprender button:not(#opcoes a)');

    if (btnAprendizado && campoAprendizado) {
        btnAprendizado.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                campoAprendizado.placeholder = "Buscando...";
                const resposta = await fetch('http://localhost:3000/api/sugerir-ia');
                const dados = await resposta.json();
                campoAprendizado.value = dados.sugestao;
            } catch (err) { 
                console.error("Erro ao sugerir aprendizado:", err); 
            } finally { 
                campoAprendizado.placeholder = "Ex: Espanhol, Culinária, Python"; 
            }
        });
    }

    // 5. Vinculando o botão de Salvar Habilidades de forma limpa
    const btnSalvar = document.getElementById('save-skills');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', (e) => {
            e.preventDefault();
            salvarHabilidades();
        });
    }

    // 6. Vinculando o botão de Matches de forma limpa
    const btnMatches = document.getElementById('views-matches');
    if (btnMatches) {
        btnMatches.addEventListener('click', (e) => {
            e.preventDefault();
            irParaMatches();
        });
    }

}); // 👈 Esse parêntese e chave fecham o DOMContentLoaded de forma segura!


// ==========================================
// FUNÇÕES GLOBAIS (Ficam soltas aqui embaixo)
// ==========================================

// Função para Salvar as Habilidades no Banco de Dados
async function salvarHabilidades() {
    const talento = document.getElementById('talento').value.trim();
    const aprendizado = document.getElementById('aprendizado').value.trim();
    const emailUsuario = localStorage.getItem('usuario_email'); 

    if (!talento || !aprendizado) {
        alert("Por favor, preencha os campos antes de salvar!");
        return;
    }

    try {
        const resposta = await fetch('http://localhost:3000/api/salvar-habilidades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ talento, aprendizado, email: emailUsuario })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            alert(dados.mensagem);
        } else {
            alert("Erro: " + dados.erro);
        }
    } catch (erro) {
        console.error("Erro na requisição:", erro);
        alert("Não foi possível conectar ao servidor.");
    }
}

// Fazer Logout limpando tudo com segurança
function fazerLogout() {
    localStorage.clear(); 
    window.location.href = 'index.html';
}

// Mudar para a página de matches
function irParaMatches() {
    window.location.href = './matches.html';
}