/**
 * Lógica da Vitrine: Busca todos os projetos com status 'aberto'
 * e permite que o usuário inicie o processo de compra.
 */

async function carregarLoja() {
    const vitrine = document.getElementById('vitrine-cursos');
    const loader = document.getElementById('loader-loja');
    const usuarioLogadoId = localStorage.getItem('usuario_id');

    try {
        // Busca todos os projetos. No backend, você pode filtrar apenas por 'aberto'
        const response = await fetch('http://127.0.0.1:8000/projetos/');
        const projetos = await response.json();
        
        loader.style.display = 'none';
        vitrine.innerHTML = "";

        // Filtramos para mostrar apenas o que ainda não foi vendido
        const disponiveis = projetos.filter(p => p.status === 'aberto');

        if (disponiveis.length === 0) {
            vitrine.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>Nenhum curso disponível no momento.</p>";
            return;
        }

        disponiveis.forEach(p => {
            const eMeuProprioCurso = p.vendedor_id == usuarioLogadoId;

            const card = `
                <div class="card" style="text-align: left; background: #fff; border: 1px solid #ddd; position: relative;">
                    ${eMeuProprioCurso ? '<span style="position:absolute; top:10px; right:10px; font-size:10px; background:#eee; padding:2px 5px;">SEU ANÚNCIO</span>' : ''}
                    <h3 style="font-size: 18px; color: #333; margin-bottom: 10px;">${p.titulo}</h3>
                    <p style="color: #28a745; font-size: 22px; font-weight: bold; margin-bottom: 20px;">
                        R$ ${p.valor.toFixed(2)}
                    </p>
                    
                    <button onclick="comprarCurso(${p.id})" 
                            style="width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                        Comprar Agora
                    </button>
                </div>
            `;
            vitrine.innerHTML += card;
        });

    } catch (error) {
        console.error("Erro ao carregar loja:", error);
        loader.innerText = "❌ Erro ao conectar com o mercado.";
    }
}

async function comprarCurso(projetoId) {
    if (!confirm("Confirmar a compra? O valor será retido em Escrow até a validação do código.")) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/projetos/${projetoId}/pagar`, {
            method: 'POST'
        });
        const data = await response.json();

        if (response.ok) {
            alert(`✅ Sucesso!\n\nSeu código de liberação é: ${data.codigo_verificacao}\n\nUse este código no Dashboard para liberar o acesso.`);
            window.location.href = 'dashboard.html';
        } else {
            alert("Erro ao processar compra: " + (data.detail || "Tente novamente."));
        }
    } catch (error) {
        alert("Erro de conexão com o servidor.");
    }
}

window.onload = carregarLoja;