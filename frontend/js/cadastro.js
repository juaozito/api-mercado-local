async function cadastrar() {
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const msg = document.getElementById('mensagem');

    if (!nome || !email || !senha) {
        msg.innerText = "⚠️ Preencha todos os campos.";
        msg.style.color = "orange";
        return;
    }

    try {
        msg.innerText = "⏳ Criando sua conta...";
        msg.style.color = "blue";

        // URL CORRIGIDA PARA O RENDER
        const response = await fetch('/usuarios/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        if (response.ok) {
            msg.innerText = "✅ Conta criada! Redirecionando...";
            msg.style.color = "green";
            setTimeout(() => { window.location.href = '/'; }, 2000);
        } else {
            const erroData = await response.json();
            msg.innerText = "❌ " + (erroData.detail || "Erro no cadastro");
            msg.style.color = "red";
        }
    } catch (error) {
        msg.innerText = "❌ Erro de conexão com o servidor.";
    }
}