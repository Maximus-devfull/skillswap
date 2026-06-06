document.addEventListener("DOMContentLoaded", async () => {
    const emailUsuario = localStorage.getItem('usuario_email');
    const nomeDoUsuario = localStorage.getItem('usuario_nome');
    const containerMatches = document.getElementById('lista-matches');

    // 1. Vincula o nome do usuário no mesmo ID do header
    if (emailUsuario && nomeDoUsuario) {
        document.getElementById('nome-usuario').innerText = `Olá, ${nomeDoUsuario}! 🚀`;
    } else {
        window.location.href = 'index.html';
        return;
    }

    // 2. Configura o clique do botão Voltar
    const btnVoltar = document.getElementById('btn-voltar');
    if (btnVoltar) {
        btnVoltar.addEventListener('click', () => {
            window.location.href = './pagina_Inicial.html';
        });
    }

    // 3. Busca a lista de conexões no backend
    try {
        const resposta = await fetch(`http://localhost:3000/api/matches?email=${emailUsuario}`);
        const matches = await resposta.json();

        if (matches.length === 0) {
            containerMatches.innerHTML = `
                <div class="sem-matches">
                    <p style="color: #ff7675;">Nenhum match perfeito encontrado por enquanto... 🥲</p>
                    <small style="opacity: 0.7;">Dica: Tente ajustar suas habilidades no perfil!</small>
                </div>`;
            return;
        }

// Limpa a mensagem inicial
        containerMatches.innerHTML = ""; 

        // Monta os cards com os boxes e as tags estilo página inicial
        matches.forEach(pessoa => {
            const card = document.createElement('div');
            card.className = 'card-match';

            // Separamos as strings de talentos e aprendizados em arrays (listas)
            const listaTalentos = pessoa.talento ? pessoa.talento.split(',').map(t => t.trim()) : [];
            const listaAprendizados = pessoa.aprendizado ? pessoa.aprendizado.split(',').map(a => a.trim()) : [];

            // Geramos o HTML das tags de Ensinar
            const tagsEnsinarHTML = listaTalentos.map(t => `<span class="tag-skill">${t}</span>`).join('');
            
            // Geramos o HTML das tags de Aprender (usando a classe amarela)
            const tagsAprenderHTML = listaAprendizados.map(a => `<span class="tag-skill tag-aprender">${a}</span>`).join('');

            card.innerHTML = `
                <h3>👤 ${pessoa.nome}</h3>
                <div class="info-skills">
                    <p><strong>💡 Sabe ensinar:</strong></p>
                    <div class="tags-container">${tagsEnsinarHTML || '<span style="opacity:0.5">Nenhum</span>'}</div>
                    
                    <p><strong>🎯 Quer aprender:</strong></p>
                    <div class="tags-container">${tagsAprenderHTML || '<span style="opacity:0.5">Nenhum</span>'}</div>
                </div>
                <button class="btn-contato" onclick="abrirChatHumano('${pessoa.email}', '${pessoa.nome}')">
                    💬 Conversar com ${pessoa.nome}
                </button>
            `;

            containerMatches.appendChild(card);
        });

    } catch (erro) {
        console.error("Erro ao carregar matches:", erro);
        containerMatches.innerHTML = "<p>Não foi possível carregar os dados agora.</p>";
    }
});

// Função chamada ao clicar no botão de um Tutor IA
function abrirChatTutor(tema) {
    alert(`🤖 Você está iniciando uma sessão de estudos com o Tutor IA especialista em ${tema}!\n\n(Aqui no futuro nós podemos abrir um chat integrado com a API do Gemini para ele tirar suas dúvidas de verdade!)`);
    
    // Ideia futura: window.location.href = `./chat_tutor.html?tema=${tema}`;
}

// Mantém a função global de logout funcionando
function fazerLogout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// Variável global para sabermos qual tutor está ativo na janela flutuante
let temaTutorAtivo = "";

// 1. Função para ABRIR o pop-up do chat
function abrirChatTutor(tema) {
    temaTutorAtivo = tema;
    
    // Atualiza o título e limpa o chat anterior
    document.getElementById('titulo-chat').innerText = `🤖 Tutor: Especialista em ${tema}`;
    const historico = document.getElementById('historico');
    historico.innerHTML = ""; 

    // Adiciona o modal na tela aplicando a classe CSS "ativo"
    const modal = document.getElementById('modal-chat');
    modal.classList.add('ativo');

    // Mensagem inicial de boas-vindas do robô
    adicionarMensagemNaTela(`Olá! Eu sou o seu tutor especialista em **${tema}**. O que você quer aprender ou tirar de dúvida hoje?`, 'tutor');

    // Configura os botões de envio internos do modal (se for a primeira vez abrindo)
    configurarEventosDoModal();
}

// 2. Função para FECHAR o pop-up do chat
function fecharChatTutor() {
    const modal = document.getElementById('modal-chat');
    modal.classList.remove('ativo');
    temaTutorAtivo = "";
}

// 3. Gerenciador de Envio de Mensagens para o Backend
async function enviarMensagemTutor() {
    const inputMensagem = document.getElementById('input-mensagem');
    const texto = inputMensagem.value.trim();
    if (!texto) return;

    inputMensagem.value = ""; // Limpa o campo
    adicionarMensagemNaTela(texto, 'usuario'); // Põe a fala do usuário na tela

    // Coloca o balão de "Digitando..." temporário
    const idIndicador = adicionarMensagemNaTela("Digitando...", 'tutor');

    try {
        const resposta = await fetch('http://localhost:3000/api/chat-tutor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tema: temaTutorAtivo, mensagem: texto })
        });

        const dados = await resposta.json();
        
        // Substitui o "Digitando..." pelo texto real da IA
        document.getElementById(idIndicador).innerText = dados.resposta;

    } catch (erro) {
        console.error(erro);
        document.getElementById(idIndicador).innerText = "Erro ao conectar com o tutor.";
    }
}

// Auxiliar para colocar os balões no histórico
function adicionarMensagemNaTela(texto, remetente) {
    const historico = document.getElementById('historico');
    const div = document.createElement('div');
    const idUnico = 'msg-' + Date.now();
    div.id = idUnico;
    div.className = `mensagem ${remetente}`;
    div.innerText = texto;
    historico.appendChild(div);
    historico.scrollTop = historico.scrollHeight; // Rola para baixo
    return idUnico;
}

// Garante que o clique no enviar e o Enter funcionem dentro do pop-up
function configurarEventosDoModal() {
    const btnEnviar = document.getElementById('btn-enviar');
    const inputMensagem = document.getElementById('input-mensagem');

    // Remove ouvintes antigos para não duplicar envios
    btnEnviar.onclick = enviarMensagemTutor;
    inputMensagem.onkeypress = (e) => {
        if (e.key === 'Enter') enviarMensagemTutor();
    };
}

let emailDestinatarioAtivo = "";
let intervaloChat = null; // Guardará o atualizador automático do chat

// 1. ABRIR O CHAT HUMANO
async function abrirChatHumano(emailDestinatario, nomeDestinatario) {
    emailDestinatarioAtivo = emailDestinatario;
    const emailRemetente = localStorage.getItem('usuario_email');

    document.getElementById('titulo-chat-humano').innerText = `👤 Conversando com ${nomeDestinatario}`;
    document.getElementById('historico-humano').innerHTML = "";

    const modal = document.getElementById('modal-chat-humano');
    modal.classList.add('ativo');

    // Carrega o histórico de mensagens
    await atualizarMensagensHumano();

    // 🟢 ESTA LINHA UNE O SEU BOTÃO HTML À FUNÇÃO DO JAVASCRIPT:
    document.getElementById('btn-enviar-humano').onclick = enviarMensagemHumano;

    // Configura o "Enter" no teclado para também enviar
    document.getElementById('input-mensagem-humano').onkeypress = (e) => {
        if (e.key === 'Enter') enviarMensagemHumano();
    };

    // Atualização em tempo real a cada 3 segundos
    clearInterval(intervaloChat);
    intervaloChat = setInterval(atualizarMensagensHumano, 3000);
}

// 2. FECHAR O CHAT HUMANO
function fecharChatHumano() {
    document.getElementById('modal-chat-humano').classList.remove('ativo');
    emailDestinatarioAtivo = "";
    clearInterval(intervaloChat); // Para de consumir processamento do servidor
}

// 3. BUSCAR MENSAGENS DO BACKEND E DESENHAR NA TELA
async function atualizarMensagensHumano() {
    if (!emailDestinatarioAtivo) return;

    const emailRemetente = localStorage.getItem('usuario_email');
    const historico = document.getElementById('historico-humano');

    // 1. Marcar como lida
    try {
        await fetch('http://localhost:3000/api/marcar-lida', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ remetente: emailDestinatarioAtivo, destinatario: emailRemetente })
        });
        if (typeof buscarNotificacoes === "function") buscarNotificacoes();
    } catch (e) {
        console.error("Erro ao marcar como lida:", e);
    }

    // 2. Buscar histórico
    try {
        const resposta = await fetch(`http://localhost:3000/api/mensagens?usuario1=${emailRemetente}&usuario2=${emailDestinatarioAtivo}`);
        
        if (!resposta.ok) {
            throw new Error(`O servidor respondeu com status ${resposta.status}`);
        }

        const mensagens = await resposta.json();
        historico.innerHTML = "";

        if (!mensagens || mensagens.length === 0) {
            historico.innerHTML = `<p id="msg-vazia" style="color: #b9bbbe; text-align: center; margin-top: 20px; font-size: 0.9rem;">Nenhuma mensagem ainda. Diga um "Olá" para iniciar os estudos!</p>`;
            return;
        }

        mensagens.forEach(msg => {
            const div = document.createElement('div');
            const classeRemetente = (msg.remetente === emailRemetente) ? 'usuario' : 'tutor';
            div.className = `mensagem ${classeRemetente}`;
            div.innerText = msg.texto;
            historico.appendChild(div);
        });

        historico.scrollTop = historico.scrollHeight;

    } catch (erro) {
        console.error("Erro ao atualizar chat:", erro);
        historico.innerHTML = `<p style="color: #ff7675; text-align: center; margin-top: 20px;">⚠️ Erro ao carregar mensagens.</p>`;
    }
}

// 4. ENVIAR MENSAGEM DO ENTRADA PARA O BANCO
async function enviarMensagemHumano() {
    const input = document.getElementById('input-mensagem-humano');
    if (!input) return;

    const texto = input.value.trim();
    const emailRemetente = localStorage.getItem('usuario_email');

    if (!texto) return;
    
    if (!emailRemetente) {
        alert("Erro: Seu e-mail de usuário não foi encontrado no LocalStorage. Faça login novamente!");
        return;
    }

    if (!emailDestinatarioAtivo) {
        alert("Erro: Destinatário não definido!");
        return;
    }

    // Limpa o input
    input.value = "";

    try {
        const resposta = await fetch('http://localhost:3000/api/mensagens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                remetente: emailRemetente,
                destinatario: emailDestinatarioAtivo,
                texto: texto
            })
        });

        if (!resposta.ok) {
            const erroTexto = await resposta.text();
            alert(`Erro no servidor ao enviar (${resposta.status}): ${erroTexto}`);
            return;
        }

        // Se o envio deu certo, força atualizar a tela
        await atualizarMensagensHumano();

    } catch (erro) {
        alert("Não foi possível conectar ao servidor. O backend está ligado?");
        console.error("Erro crítico:", erro);
    }
}

// 1. ABRE E FECHA O MENU DE NOTIFICAÇÕES AO CLICAR NO SININHO
function toggleMenuNotificacoes() {
    const menu = document.getElementById('menu-notificacoes');
    if (menu.style.display === 'none') {
        menu.style.display = 'block';
        buscarNotificacoes(); // Atualiza a lista ao abrir
    } else {
        menu.style.display = 'none';
    }
}

// 2. BUSCA AS NOTIFICAÇÕES NO BACKEND
async function buscarNotificacoes() {
    const emailLogado = localStorage.getItem('usuario_email');
    if (!emailLogado) return;

    try {
        const resposta = await fetch(`http://localhost:3000/api/notificacoes?usuario=${emailLogado}`);
        const notificacoes = await resposta.json();

        const badge = document.getElementById('badge-notificacao');
        const listaItens = document.getElementById('lista-notificacoes-itens');

        if (notificacoes.length > 0) {
            // Mostra a bolinha vermelha com o número de pessoas que te chamaram
            badge.innerText = notificacoes.length;
            badge.style.display = 'block';

            // Monta a lista de links dentro da caixinha
            listaItens.innerHTML = notificacoes.map(notif => `
                <div style="padding: 10px; border-bottom: 1px solid #21233d; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #fff; font-size: 0.9rem;">💬 <strong>${notif.nome}</strong> te chamou!</span>
                    <button onclick="irParaOChateFecharMenu('${notif.email}', '${notif.nome}')" style="background: #6c5ce7; border: none; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">
                        Abrir
                    </button>
                </div>
            `).join('');
        } else {
            badge.style.display = 'none';
            listaItens.innerHTML = `<p style="color: #b9bbbe; font-size: 0.85rem; margin: 10px 5px;">Nenhuma mensagem nova.</p>`;
        }

    } catch (erro) {
        console.error("Erro ao buscar notificações:", erro);
    }
}

// 3. ABRE O CHAT AUTOMATICAMENTE E FECHA A CAIXINHA
function irParaOChateFecharMenu(email, nome) {
    document.getElementById('menu-notificacoes').style.display = 'none'; // Fecha o menu do sininho
    abrirChatHumano(email, nome); // Dispara a função do chat humano que criamos antes!
}

// 4. ATIVA A BUSCA AUTOMÁTICA (Fica monitorando o sininho a cada 5 segundos)
document.addEventListener("DOMContentLoaded", () => {
    buscarNotificacoes(); // Roda a primeira vez logo ao carregar a página
    setInterval(buscarNotificacoes, 5000); // Fica atualizando sozinho de 5 em 5 segundos
    
    // Fecha o menu se o usuário clicar em qualquer outro lugar da tela
    document.addEventListener('click', (e) => {
        const area = document.getElementById('area-notificacao');
        const menu = document.getElementById('menu-notificacoes');
        if (area && !area.contains(e.target) && menu) {
            menu.style.display = 'none';
        }
    });
});

function deslogarUsuario() {
    // 1. Limpa os dados de login salvos no navegador
    localStorage.removeItem('usuario_email');
    
    // 2. Redireciona de volta para a sua página inicial de Login/Cadastro
    // Se a sua página inicial tiver outro nome (ex: login.html), mude aqui abaixo:
    window.location.href = 'index.html'; 
}