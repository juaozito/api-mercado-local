async function enviarAnuncio() {
    const titulo = document.getElementById('titulo').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const conteudo = document.getElementById('conteudo').value;
    const msg = document.getElementById('mensagem');
    const vendedorId = localStorage.getItem('usuario_id'); 

    if (!vendedorId) {
        msg.innerText = "❌ Erro: Faça login novamente.";
        return;
    }

    if (!titulo || !valor || !conteudo) {
        msg.innerText = "⚠️ Preencha tudo corretamente.";
        return;
    }

    const dadosAnuncio = {
        titulo: titulo,
        valor: valor,
        conteudo_digital: conteudo,
        vendedor_id: parseInt(vendedorId)
    };

    try {
        msg.innerText = "🚀 Publicando...";
        
        // URL CORRIGIDA PARA O RENDER
        const response = await fetch('/projetos/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAnuncio)
        });

        if (response.ok) {
            msg.innerText = "✅ Publicado com sucesso!";
            setTimeout(() => { window.location.href = '/dashboard'; }, 1500);
        } else {
            const erroData = await response.json();
            msg.innerText = "❌ Erro: " + (erroData.detail || "Dados inválidos");
        }
    } catch (error) {
        msg.innerText = "❌ Erro ao conectar ao servidor.";
    }
}