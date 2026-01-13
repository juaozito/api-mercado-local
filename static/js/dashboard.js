async function carregarDashboard() {
    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) { window.location.href = '/'; return; }

    try {
        // URLS CORRIGIDAS PARA O RENDER
        const resVendas = await fetch(`/vendedor/${usuarioId}/total-vendas`);
        const dataVendas = await resVendas.json();
        document.getElementById('total-vendas').innerText = dataVendas.total_vendas || "0";

        const resProjetos = await fetch('/projetos/');
        const projetos = await resProjetos.json();
        
        // ... lógica de popular a tabela (mantenha a sua) ...
    } catch (error) {
        console.error("Erro no dashboard:", error);
    }
}

async function liberarProjeto(projetoId) {
    const codigo = prompt("Digite o código de liberação:");
    if (!codigo) return;

    try {
        // URL CORRIGIDA PARA O RENDER
        const response = await fetch(`/projetos/${projetoId}/liberar/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo: codigo })
        });

        if (response.ok) {
            alert("✅ Pagamento liberado!");
            location.reload();
        } else {
            alert("❌ Código inválido.");
        }
    } catch (error) {
        alert("❌ Erro de conexão.");
    }
}