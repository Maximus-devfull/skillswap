require('dotenv').config();
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static('../public'));

const db = new sqlite3.Database('./banco.db', (err) => {
    if (err) console.error(err.message);
    console.log('Conectado ao banco de dados SQLite.');
});

db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    email TEXT UNIQUE,
    senha TEXT NOT NULL,
    talento TEXT,
    aprendizado TEXT
    )`,(err) => {
        if(err) console.error("Erro ao Criar tabela:", err.message);
    });

    // 1. CRIAR A TABELA DE MENSAGENS (Adicione isso logo após a abertura do seu banco SQLite)
db.run(`
    CREATE TABLE IF NOT EXISTS mensagens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        remetente TEXT,
        destinatario TEXT,
        texto TEXT,
        lida INTEGER DEFAULT 0, -- 🟢 Adicionamos essa linha aqui!
        data_hora DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) console.error("Erro ao criar tabela de mensagens:", err);
    else console.log("Tabela de mensagens humana pronta com sistema de leitura!");
});

// 2. ROTA PARA BUSCAR O HISTÓRICO ENTRE DOIS ESTUDANTES (GET)
app.get('/api/mensagens', (req, res) => {
    const { usuario1, usuario2 } = req.query;

    if (!usuario1 || !usuario2) {
        return res.status(400).json({ erro: "Usuários não informados." });
    }

    const query = `
        SELECT * FROM mensagens 
        WHERE (remetente = ? AND destinatario = ?) 
           OR (remetente = ? AND destinatario = ?)
        ORDER BY data_hora ASC
    `;

    db.all(query, [usuario1, usuario2, usuario2, usuario1], (err, rows) => {
        if (err) {
            console.error("Erro ao buscar histórico:", err);
            return res.status(500).json({ erro: "Erro ao buscar mensagens." });
        }
        res.json(rows);
    });
});

// 3. ROTA PARA ENVIAR UMA MENSAGEM PARA OUTRO ESTUDANTE (POST)
app.post('/api/mensagens', (req, res) => {
    const { remetente, destinatario, texto } = req.body;

    if (!remetente || !destinatario || !texto) {
        return res.status(400).json({ erro: "Dados incompletos." });
    }

    const query = `INSERT INTO mensagens (remetente, destinatario, texto) VALUES (?, ?, ?)`;

    db.run(query, [remetente, destinatario, texto], function(err) {
        if (err) {
            console.error("Erro ao inserir mensagem:", err);
            return res.status(500).json({ erro: "Erro ao salvar mensagem." });
        }
        res.json({ id: this.lastID, status: "Mensagem enviada!" });
    });
});

app.post('/api/cadastro', (req, res) => {
    console.log("O Node recebeu isso no corpo da requisição:", req.body);
    const {nome, email, senha} = req.body;

    const query = `INSERT INTO usuarios (nome, email, senha) VALUES(?,?,?)`;
    db.run(query, [nome, email, senha], function(err) {
        if (err){
            console.error("Erro exato do SQLite:", err.message);
            return res.status(400).json({erro:'Email já cadastrado ou dados inválidos.'});
        }
        res.json({mensagem: 'Usuário cadastrado com sucesso!'});
    });
});

app.post('/api/login', (req, res) => {
    const {email, senha} = req.body;

    const query = `SELECT * FROM usuarios WHERE email = ? AND senha = ?`;
    db.get(query, [email, senha], (err, usuario) => {
        if (err) return res.status(500).json({erro: 'ERRO no servidor.'});

        if(usuario){
            res.json({login: true, nome: usuario.nome});
        }else{
            res.status(401).json({login: false, erro: 'Email ou senha incorretos. '});
        }
    });
});

app.post('/api/salvar-habilidades', (req, res) => {
    const { talento, aprendizado, email } = req.body; // Vamos precisar do email para saber de qual usuário é

    console.log(`💾 Tentando salvar para o email ${email}: Ensinar [${talento}] | Aprender [${aprendizado}]`);

    if (!email) {
        return res.status(400).json({ erro: 'Usuário não identificado. Faça login novamente.' });
    }

    // Faz um UPDATE para salvar as habilidades no usuário que já está logado
    const query = `UPDATE usuarios SET talento = ?, aprendizado = ? WHERE email = ?`;

    db.run(query, [talento, aprendizado, email], function(err) {
        if (err) {
            console.error("Erro ao salvar no banco:", err.message);
            return res.status(500).json({ erro: 'Erro interno ao salvar habilidades.' });
        }
        res.json({ mensagem: 'Habilidades salvas com sucesso!' });
    });
});

app.get('/api/sugerir-ia', async (req, res) => {
    // Se você não colocou uma chave real ainda, vamos direto para a lista automática
    // para evitar o erro "API key not valid" no terminal.
    const usarPlanoBImediato = true; 

    if (usarPlanoBImediato) {
        const bancoIdeias = ["Java", "Medicina Veterinária", "UI/UX Design", "Inglês Instrumental", "Marketing Digital", "Fotografia", "Python", "Culinária Japonesa", "Anatomia Humana", "Gestão de Tráfego"];
        const ideiaAleatoria = bancoIdeias[Math.floor(Math.random() * bancoIdeias.length)];
        console.log(`✨ Sugestão automática gerada: ${ideiaAleatoria}`);
        return res.json({ sugestao: ideiaAleatoria });
    }

    // Código da IA real (só roda se você mudar a variável acima para false e por a chave)
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Sugira apenas UMA habilidade aleatória pura.',
        });
        res.json({ sugestao: response.text.trim() });
    } catch (error) {
        res.json({ sugestao: "Desenvolvimento Web" });
    }
});

// 🤖 ROTA DO CHAT COM O TUTOR IA (Adicione isso no seu server.js)
app.post('/api/chat-tutor', async (req, res) => {
    const { tema, mensagem } = req.body;

    if (!tema || !mensagem) {
        return res.status(400).json({ erro: 'Tema e mensagem são obrigatórios.' });
    }

    try {
        // Criamos o comando direcionando o papel exato do Tutor para o Gemini
        const respostaIa = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    // 🔴 AQUI VOCÊ DIGITA AS REGRAS DA SUA PRÓPRIA IA:
        config: {
        systemInstruction: `Você é a IA exclusiva do SkillSwap chamada 'Tutor Alpha', criada por fvalm. 
        Sua personalidade é de um mentor super jovem, dinâmico, que usa emojis e explica conceitos difíceis usando analogias com futebol ou jogos de videogame.
        Seu foco absoluto agora é o tema: ${tema}. Não saia desse tema por nada.`
        },
    contents: mensagem,
    });

        res.json({ resposta: respostaIa.text.trim() });

    } catch (error) {
        console.error("Erro no chat do tutor:", error);
        
        // Plano B: Se a chave do Gemini estiver inválida ou offline, o servidor não quebra e responde isso:
        res.json({ 
            resposta: `[Modo Simulação] Olá! Eu sou o seu tutor de ${tema}. Recebi sua mensagem: "${mensagem}". Como minha chave de API do Gemini ainda não foi configurada ou validada no arquivo .env do servidor, estou operando em modo de teste local!` 
        });
    }
});



app.get('/api/matches', (req, res) => {
    const emailUsuario = req.query.email;

    if (!emailUsuario) {
        return res.status(400).json({ erro: 'E-mail do usuário não informado.' });
    }

    // 1. Primeiro, pegamos o que o usuário logado sabe e quer aprender
    const buscarUsuarioLogado = `SELECT talento, aprendizado FROM usuarios WHERE email = ?`;

    db.get(buscarUsuarioLogado, [emailUsuario], (err, usuario) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (!usuario || !usuario.talento || !usuario.aprendizado) {
            return res.json([]); // Se ele não preencheu o perfil ainda, retorna vazio
        }

        // 2. Agora buscamos outras pessoas que dão o "Match" perfeito!
        // Alguém que ensina o que eu quero aprender OU aprende o que eu sei ensinar
        const buscarMatches = `
            SELECT nome, email, talento, aprendizado 
            FROM usuarios 
            WHERE email != ? 
            AND (talento LIKE ? OR aprendizado LIKE ?)
        `;

        // Usamos o "%" para o SQLite conseguir achar mesmo se tiver mais de uma palavra por campo
        const termoAprender = `%${usuario.aprendizado}%`;
        const termoEnsinar = `%${usuario.talento}%`;

        db.all(buscarMatches, [emailUsuario, termoAprender, termoEnsinar], (err, linhas) => {
            if (err) return res.status(500).json({ erro: err.message });
            
            console.log(`🔍 Matches encontrados para ${emailUsuario}: ${linhas.length}`);
            res.json(linhas); // Devolve a lista de pessoas compatíveis
        });
    });
});

// 🔔 ROTA PARA BUSCAR QUEM TE MANDOU MENSAGEM (NOTIFICAÇÕES)
app.get('/api/notificacoes', (req, res) => {
    const { usuario } = req.query;

    if (!usuario) {
        return res.status(400).json({ erro: "Usuário não informado." });
    }

    // Adicionamos "AND m.lida = 0" para sumir do sininho quando ler
    const query = `
        SELECT DISTINCT m.remetente as email, u.nome 
        FROM mensagens m
        JOIN usuarios u ON m.remetente = u.email
        WHERE m.destinatario = ? AND m.lida = 0
    `;

    db.all(query, [usuario], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ erro: "Erro ao buscar notificações." });
        }
        res.json(rows);
    });
});

// 📑 ROTA PARA MARCAR AS MENSAGENS DE UM REMETENTE COMO LIDAS
app.post('/api/marcar-lida', (req, res) => {
    const { remetente, destinatario } = req.body; // Quem mandou e Quem está lendo

    if (!remetente || !destinatario) {
        return res.status(400).json({ erro: "Dados incompletos." });
    }

    const query = `
        UPDATE mensagens 
        SET lida = 1 
        WHERE remetente = ? AND destinatario = ? AND lida = 0
    `;

    db.run(query, [remetente, destinatario], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ erro: "Erro ao atualizar status de leitura." });
        }
        res.json({ status: "Mensagens marcadas como lidas!" });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor rodando'))