/**
 * Lógica de Autenticação do Usuário.
 * Conecta o formulário de login à rota POST /login/ do FastAPI.
 */
async function fazerLogin() {
    // --- BLOCO 1: CAPTURA DE CAMPOS E FEEDBACK INICIAL ---
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const msgElement = document.getElementById('mensagem');

    // Mostra um feedback visual imediato para o usuário
    msgElement.innerText = "⏳ Verificando credenciais...";
    msgElement.style.color = "#555";

    // --- BLOCO 2: REQUISIÇÃO PARA O SERVIDOR ---
    try {
        const response = await fetch('http://127.0.0.1:8000/login/', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            // Enviamos email e senha para serem verificados pelo security.py no Back-end
            body: JSON.stringify({ email: email, senha: senha })
        });

        const data = await response.json();

        // --- BLOCO 3: TRATAMENTO DE RESPOSTA ---
        if (response.ok) {
            /**
             * SUCESSO: O usuário foi validado.
             * Armazenamos os dados no LocalStorage para que as outras páginas 
             * (Dashboard, Anunciar) saibam quem é o usuário atual.
             */
            localStorage.setItem('usuario_id', data.usuario_id);
            localStorage.setItem('usuario_nome', data.nome);
            
            msgElement.innerText = "✅ Login realizado! Entrando...";
            msgElement.style.color = "green";

            // Redireciona para o painel principal após um breve delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 800);

        } else {
            /**
             * ERRO DE CREDENCIAIS: E-mail não cadastrado ou senha incorreta.
             * O FastAPI devolve o erro no campo 'detail'.
             */
            msgElement.innerText = "❌ " + (data.detail || "E-mail ou senha inválidos.");
            msgElement.style.color = "red";
        }

    } catch (error) {
        /**
         * ERRO DE REDE: Servidor desligado ou URL incorreta.
         */
        console.error("Erro de conexão:", error);
        msgElement.innerText = "❌ Erro: Não foi possível conectar ao servidor.";
        msgElement.style.color = "red";
    }
}