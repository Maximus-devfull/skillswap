async function salvarCadastro(event) {
    if (event) event.preventDefault(); 

    const nome = document.getElementById('cad_nome').value;
    const email = document.getElementById('cad_email').value;
    const senha = document.getElementById('cad_senha').value;

    // TESTE 1: Veja no console do seu navegador se os dados saem daqui vazios ou preenchidos
    console.log("Dados que estou tentando enviar:", { nome, email, senha });

    try {
        const resposta = await fetch('http://localhost:3000/api/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha }) // Os nomes aqui (nome, email, senha) precisam ser idênticos aos do server.js
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            alert(dados.mensagem);
            window.location.href = './pagina_Inicial.html'; // Manda para o login
        } else {
            // TESTE 2: Exibe o motivo real que o Node rejeitou (ex: "Email já cadastrado")
            alert("Erro do Servidor: " + dados.erro);
        }
    } catch (erro) {
        console.error("Erro na requisição:", erro);
    }
}