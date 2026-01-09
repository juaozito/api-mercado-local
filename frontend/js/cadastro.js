/**
 * Lógica para criação de novos usuários (Clientes/Vendedores).
 * Conecta o formulário de cadastro à rota POST /usuarios/ do FastAPI.
 */
async function cadastrar() {
    // --- BLOCO 1: CAPTURA DE INPUTS ---
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const msg = document.getElementById('mensagem');

    // --- BLOCO 2: VALIDAÇÃO BÁSICA NO FRONTEND ---
    if (!nome || !email || !senha) {
        msg.innerText = "⚠️ Preencha todos os campos.";
        msg.style.color = "orange";
        return;
    }

    if (senha.length < 3) {
        msg.innerText = "⚠️ A senha deve ter pelo menos 3 caracteres.";
        msg.style.color = "orange";
        return;
    }

    // --- BLOCO 3: ENVIO PARA A API ---
    try {
        msg.innerText = "⏳ Criando sua conta...";
        msg.style.color = "blue";

        const response = await fetch('http://127.0.0.1:8000/usuarios/', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            // Enviamos os dados no formato que o 'UsuarioCreate' do Backend espera
            body: JSON.stringify({ nome, email, senha })
        });

        // --- BLOCO 4: TRATAMENTO DE RESPOSTA ---
        if (response.ok) {
            msg.innerText = "✅ Conta criada com sucesso! Redirecionando para o login...";
            msg.style.color = "green";

            // Limpa os campos para segurança
            document.getElementById('nome').value = "";
            document.getElementById('email').value = "";
            document.getElementById('senha').value = "";

            // Redireciona após 2 segundos para o usuário ler a mensagem
            setTimeout(() => { 
                window.location.href = 'login.html'; 
            }, 2000);

        } else {
            // Caso o e-mail já exista ou os dados sejam inválidos
            const erroData = await response.json();
            
            // Tratamento amigável para o erro de e-mail duplicado vindo do CRUD
            const mensagemErro = erroData.detail || "Erro ao realizar cadastro.";
            msg.innerText = "❌ " + mensagemErro;
            msg.style.color = "red";
        }

    } catch (error) {
        // Caso o servidor esteja desligado
        console.error("Erro de conexão:", error);
        msg.innerText = "❌ Erro ao conectar com o servidor. Verifique se o Backend está rodando.";
        msg.style.color = "red";
    }
}