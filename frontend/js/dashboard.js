/**
 * DASHBOARD COMPLETO
 * Gerencia o resumo de vendas, a listagem de projetos e a validação de códigos.
 */

async function carregarDashboard() {
    const usuarioId = localStorage.getItem('usuario_id');
    const nome = localStorage.getItem('usuario_nome');

    // Proteção de rota: se não estiver logado, volta para o login
    if (!usuarioId) {
        window.location.href = 'login.html';
        return;
    }

    // Exibe o nome do usuário no cabeçalho
    const elementoNome = document.getElementById('nome-usuario');
    if (elementoNome) elementoNome.innerText = nome;

    try {
        // 1. Busca resumo de vendas concluídas (Bloco Financeiro)
        const resVendas = await fetch(`http://127.0.0.1:8000/vendedor/${usuarioId}/total-vendas`);
        const dataVendas = await resVendas.json();
        
        const elementoTotal = document.getElementById('total-vendas');
        if (elementoTotal) {
            elementoTotal.innerText = dataVendas.total_vendas_concluidas || "0";
        }

        // 2. Busca TODOS os projetos do sistema para filtrar os seus
        const resProjetos = await fetch(`http://127.0.0.1:8000/projetos/`); 
        const projetos = await resProjetos.json();
        
        const tabela = document.getElementById('tabela-projetos');
        if (!tabela) return;
        tabela.innerHTML = ""; 

        // Filtra projetos onde você é o VENDEDOR ou o COMPRADOR (Cliente)
        const meusEnvolvimentos = projetos.filter(p => p.vendedor_id == usuarioId || p.cliente_id == usuarioId);

        meusEnvolvimentos.forEach(p => {
            let acaoBotao = "";
            let papel = p.vendedor_id == usuarioId ? "Vendedor" : "Comprador";

            // LÓGICA DO BOTÃO DE VALIDAÇÃO
            // Se o pagamento está retido e você é o comprador, aparece o botão para validar
            if (p.status === 'pagamento_retido') {
                acaoBotao = `
                    <button onclick="abrirValidacao(${p.id})" 
                        style="background: #f39c12; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        🔑 Validar Código
                    </button>`;
            } 
            else if (p.status === 'finalizado') {
                acaoBotao = `<span style="color: green; font-weight: bold;">✅ Concluído</span>`;
            } 
            else {
                acaoBotao = `<span style="color: #888;">Aguardando...</span>`;
            }

            const row = `
                <tr>
                    <td><strong>${p.titulo}</strong></td>
                    <td>R$ ${p.valor.toFixed(2)}</td>
                    <td><small>${papel}</small></td>
                    <td><span class="status-${p.status}">${p.status.replace('_', ' ').toUpperCase()}</span></td>
                    <td>${acaoBotao}</td>
                </tr>
            `;
            tabela.innerHTML += row;
        });

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
    }
}

/**
 * FUNÇÃO PARA VALIDAR O CÓDIGO DE ESCROW
 * Transforma o status de 'pagamento_retido' para 'finalizado'.
 */
async function abrirValidacao(projetoId) {
    const codigo = prompt("Digite o código de 6 dígitos que você recebeu ao comprar na loja:");
    
    if (!codigo) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/projetos/${projetoId}/liberar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo: codigo })
        });

        if (response.ok) {
            alert("✅ Sucesso! O pagamento foi liberado e o curso já está disponível em 'Meus Conteúdos'.");
            window.location.href = 'meus_cursos.html'; 
        } else {
            const erro = await response.json();
            alert("❌ Erro: " + (erro.detail || "Código inválido"));
        }
    } catch (e) {
        alert("Erro ao conectar com o servidor.");
    }
}

// Inicialização ao carregar a página
window.onload = carregarDashboard;