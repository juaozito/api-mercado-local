/**
 * Carrega todos os projetos onde o usuário atual é o CLIENTE 
 * e o status está FINALIZADO (pagamento já liberado).
 */
async function carregarMeusCursos() {
    const usuarioId = localStorage.getItem('usuario_id');
    const listaContainer = document.getElementById('lista-cursos');
    const msgVazio = document.getElementById('mensagem-vazio');
    const loader = document.getElementById('loader');

    if (!usuarioId) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Busca na rota que criamos para o cliente no main.py
        const response = await fetch(`http://127.0.0.1:8000/cliente/${usuarioId}/meus-cursos`);
        const cursos = await response.json();
        
        loader.style.display = 'none';

        if (cursos.length === 0) {
            msgVazio.style.display = 'block';
            return;
        }

        listaContainer.innerHTML = "";

        cursos.forEach(curso => {
            // Opcional: Se o seu backend não trouxer o nome, você pode exibir o ID do vendedor
            const vendedorInfo = curso.vendedor ? curso.vendedor.nome : `Vendedor #${curso.vendedor_id}`;

            const card = `
                <div class="card" style="text-align: left; border: 1px solid #ddd; background: #fff;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <span style="background: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">LIBERADO</span>
                        <small style="color: #888;">ID #${curso.id}</small>
                    </div>
                    
                    <h3 style="font-size: 18px; margin: 15px 0 5px 0; color: #333;">${curso.titulo}</h3>
                    <p style="font-size: 13px; color: #666; margin-bottom: 15px;">
                        👤 Vendido por: <strong>${vendedorInfo}</strong>
                    </p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff;">
                        <label style="font-size: 11px; text-transform: uppercase; color: #007bff; font-weight: bold;">Seu Conteúdo:</label>
                        <div style="margin-top: 5px; word-break: break-all; font-family: monospace; color: #222;">
                            ${curso.conteudo_digital}
                        </div>
                    </div>
                    
                    <div style="margin-top: 15px; font-size: 12px; color: #aaa; text-align: right;">
                        Adquirido em: ${new Date(curso.data_creation).toLocaleDateString('pt-BR')}
                    </div>
                </div>
            `;
            listaContainer.innerHTML += card;
        });

    } catch (error) {
        console.error("Erro ao carregar cursos:", error);
        loader.innerText = "❌ Erro ao carregar conteúdos.";
    }
}

window.onload = carregarMeusCursos;