/**
 * Lógica para enviar o formulário de anúncio para o Backend.
 * Este script faz a ponte entre o HTML e a rota POST /projetos/ do FastAPI.
 */
async function enviarAnuncio() {
    // --- BLOCO 1: CAPTURA DE DADOS ---
    const titulo = document.getElementById('titulo').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const conteudo = document.getElementById('conteudo').value;
    const msg = document.getElementById('mensagem');
    
    // Recuperamos o ID do usuário que está logado (salvo no login.js)
    const vendedorId = localStorage.getItem('usuario_id'); 

    // --- BLOCO 2: VALIDAÇÕES PRÉ-ENVIO ---
    if (!vendedorId) {
        msg.innerText = "❌ Erro: Você precisa estar logado para anunciar.";
        msg.style.color = "red";
        return;
    }

    if (!titulo || !valor || !conteudo) {
        msg.innerText = "⚠️ Preencha todos os campos corretamente.";
        msg.style.color = "orange";
        return;
    }

    // --- BLOCO 3: MONTAGEM DO OBJETO (JSON) ---
    // Deve bater exatamente com o "ProjetoCreate" do seu schemas.py no Backend
    const dadosAnuncio = {
        titulo: titulo,
        valor: valor,
        conteudo_digital: conteudo,
        vendedor_id: parseInt(vendedorId) 
    };

    // --- BLOCO 4: ENVIO PARA A API (FETCH) ---
    try {
        msg.innerText = "🚀 Publicando anúncio...";
        msg.style.color = "blue";

        const response = await fetch('http://127.0.0.1:8000/projetos/', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(dadosAnuncio)
        });

        // --- BLOCO 5: TRATAMENTO DE RESPOSTA ---
        if (response.ok) {
            msg.innerText = "✅ Projeto publicado com sucesso!";
            msg.style.color = "green";

            // Aguarda 1.5 segundos para o usuário ler a mensagem e redireciona
            setTimeout(() => { 
                window.location.href = 'dashboard.html'; 
            }, 1500);

        } else {
            // Tenta ler o erro enviado pelo FastAPI (Pydantic)
            const erroData = await response.json();
            console.error("Erro da API:", erroData);
            
            // Se o erro for de validação do FastAPI, ele vem em uma lista 'detail'
            const mensagemErro = erroData.detail && Array.isArray(erroData.detail) 
                ? erroData.detail[0].msg 
                : (erroData.detail || "Dados inválidos");

            msg.innerText = "❌ Erro ao publicar: " + mensagemErro;
            msg.style.color = "red";
        }
    } catch (error) {
        // Caso o fetch falhe (servidor desligado ou erro de rede)
        console.error("Erro de conexão:", error);
        msg.innerText = "❌ Servidor offline ou erro de rede.";
        msg.style.color = "red";
    }
}