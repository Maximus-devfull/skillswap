async function fazerLogin() {

    if (event) event.preventDefault();

    const email = document.getElementById('login_email').value;
    const senha = document.getElementById('login_senha').value;

    const respuesta = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
    });

    const dados = await respuesta.json();

    console.log("Resposta do Servidor:", dados);

    if (respuesta.ok && dados.login) {
        // Guarda o nome enviado pelo backend para usar na próxima página
        localStorage.setItem('usuario_nome', dados.nome);
        localStorage.setItem('usuario_email', email);
        window.location.href = 'pagina_Inicial.html';
    } else {
        alert(dados.erro || 'Erro ao fazer login');
    }
}