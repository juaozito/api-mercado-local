/**
 * RYZER ENTERPRISE - SCRIPT DE INTEGRAÇÃO FULL
 * Conecta o visual Pro ao Backend FastAPI.
 */

// URL do Backend (Deixe vazio para usar a mesma origem em produção)
const API_BASE = ''; 

// --- UTILS & HELPERS ---

// Gera imagens baseadas no nome do produto (já que o backend não tem upload de imagem)
function getImagemProduto(titulo) {
    if (!titulo) return 'https://placehold.co/600x400/eee/ccc?text=No+Image';
    const t = titulo.toLowerCase();
    
    // Hardware
    if(t.includes('rtx') || t.includes('gtx') || t.includes('placa de vídeo')) return 'https://m.media-amazon.com/images/I/71tDu30-mZL._AC_SL1500_.jpg';
    if(t.includes('ryzen') || t.includes('intel') || t.includes('processador')) return 'https://m.media-amazon.com/images/I/51f2hkWjTlL._AC_SL1000_.jpg';
    if(t.includes('placa mãe') || t.includes('motherboard')) return 'https://m.media-amazon.com/images/I/81bc-5l-uwL._AC_SL1500_.jpg';
    if(t.includes('ram') || t.includes('memória')) return 'https://m.media-amazon.com/images/I/61p3lA4N3uL._AC_SL1134_.jpg';
    
    // Periféricos
    if(t.includes('mouse')) return 'https://m.media-amazon.com/images/I/61mpMH5TzkL._AC_SL1500_.jpg';
    if(t.includes('teclado')) return 'https://m.media-amazon.com/images/I/71jG+e7roXL._AC_SL1500_.jpg';
    if(t.includes('headset') || t.includes('fone')) return 'https://m.media-amazon.com/images/I/61CGHv6kmWL._AC_SL1000_.jpg';
    if(t.includes('monitor')) return 'https://m.media-amazon.com/images/I/71sxlhYhKWL._AC_SL1500_.jpg';
    
    // Software
    if(t.includes('curso') || t.includes('python') || t.includes('java')) return 'https://placehold.co/600x400/00bf63/ffffff?text=Curso+Dev';
    if(t.includes('windows') || t.includes('office')) return 'https://placehold.co/600x400/0078d7/ffffff?text=Software';

    // Fallback Genérico
    return `https://placehold.co/600x400/f8f9fa/333333?text=${encodeURIComponent(titulo.substring(0,15))}`;
}

// Formata moeda (BRL)
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Sistema de Notificações (Toasts)
function toast(msg, type='success') {
    const box = document.getElementById('toast-box');
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.innerHTML = type === 'success' 
        ? `<i class="fas fa-check-circle" style="color:var(--primary)"></i> ${msg}` 
        : `<i class="fas fa-exclamation-triangle" style="color:var(--danger)"></i> ${msg}`;
    box.appendChild(div);
    setTimeout(() => {
        div.style.opacity = '0';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

// --- ROTEADOR (SPA NAVIGATION) ---
function router(tela) {
    // 1. Esconde todas as seções
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    
    // 2. Mostra a seção alvo
    const target = document.getElementById(`sec-${tela}`);
    if (target) target.classList.remove('hidden');
    else console.error(`Tela ${tela} não encontrada`);

    // 3. Controle de Navbar e Auth
    const userId = localStorage.getItem('usuario_id');
    const navbar = document.getElementById('navbar');

    // Scrola para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (userId) {
        navbar.classList.remove('hidden');
        updateCartBadge();
        
        // Lazy Load dos dados
        if (tela === 'loja') carregarLoja();
        if (tela === 'carrinho') renderCarrinho();
        if (tela === 'meus-pedidos') carregarMeusPedidos();
        if (tela === 'dashboard') carregarDashboard();
        
        // Redireciona se tentar acessar login logado
        if (tela === 'login' || tela === 'cadastro') router('loja');
    } else {
        navbar.classList.add('hidden');
        if (tela !== 'login' && tela !== 'cadastro') router('login');
    }
}

// Inicialização
window.onload = () => {
    const uid = localStorage.getItem('usuario_id');
    if (uid) router('loja');
    else router('login');
};

function toggleMenu() {
    // Implementar menu mobile se necessário (add class active)
    alert("Menu Mobile em breve!");
}

// --- MÓDULO: AUTENTICAÇÃO ---
async function fazerLogin() {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    const btn = document.getElementById('btn-login');
    const txt = document.getElementById('txt-login');
    const msg = document.getElementById('msg-login');

    if (!email || !senha) return toast("Preencha todos os campos", "error");

    // UI Loading
    btn.disabled = true;
    txt.innerText = "Verificando...";
    msg.innerText = "";

    try {
        const res = await fetch(`${API_BASE}/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('usuario_id', data.usuario_id);
            localStorage.setItem('usuario_nome', data.nome);
            toast(`Bem-vindo de volta, ${data.nome}!`);
            router('loja');
        } else {
            msg.innerText = data.detail || "E-mail ou senha incorretos.";
            toast("Falha no login", "error");
        }
    } catch (e) {
        msg.innerText = "Erro de conexão com o servidor.";
        console.error(e);
    } finally {
        btn.disabled = false;
        txt.innerText = "Entrar na Plataforma";
    }
}

async function cadastrar() {
    const nome = document.getElementById('cad-nome').value;
    const email = document.getElementById('cad-email').value;
    const senha = document.getElementById('cad-senha').value;
    const btn = document.getElementById('btn-cadastro');

    if (!nome || !email || !senha) return toast("Preencha tudo", "error");

    btn.disabled = true;
    btn.innerText = "Criando...";

    try {
        const res = await fetch(`${API_BASE}/usuarios/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        if (res.ok) {
            toast("Conta criada com sucesso! Faça login.");
            router('login');
        } else {
            const err = await res.json();
            toast(err.detail || "Erro ao criar conta", "error");
        }
    } catch (e) {
        toast("Erro de conexão", "error");
    } finally {
        btn.disabled = false;
        btn.innerText = "Finalizar Cadastro";
    }
}

function logout() {
    localStorage.clear();
    router('login');
    toast("Você saiu do sistema.", "info");
}

// --- MÓDULO: LOJA (VITRINE) ---
let produtosCache = [];

async function carregarLoja() {
    const grid = document.getElementById('grid-produtos');
    grid.innerHTML = '<div class="loading-box">Carregando ofertas...</div>';

    try {
        const res = await fetch(`${API_BASE}/projetos/`);
        const data = await res.json();
        
        // Filtra apenas produtos 'aberto'
        produtosCache = data.filter(p => p.status === 'aberto');
        renderizarGrid(produtosCache);
    } catch (e) {
        grid.innerHTML = '<p class="text-center">Erro ao carregar produtos. Verifique sua conexão.</p>';
        console.error(e);
    }
}

function renderizarGrid(lista) {
    const grid = document.getElementById('grid-produtos');
    const termo = document.getElementById('campo-busca').value.toLowerCase();
    grid.innerHTML = "";

    const filtrados = lista.filter(p => p.titulo.toLowerCase().includes(termo));

    if (filtrados.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <i class="fas fa-search" style="font-size: 40px; color: #ddd; margin-bottom: 20px;"></i>
                <p>Nenhum produto encontrado com "${termo}".</p>
            </div>`;
        return;
    }

    filtrados.forEach(p => {
        const img = getImagemProduto(p.titulo);
        const card = `
            <div class="product-card fade-in">
                <div class="prod-img-box" onclick="verDetalhes(${p.id})" style="cursor: pointer;">
                    <img src="${img}" class="prod-img" alt="${p.titulo}">
                </div>
                <div class="prod-info">
                    <h3 title="${p.titulo}">${p.titulo}</h3>
                    <div class="old-price">R$ ${(p.valor * 1.4).toFixed(2)}</div>
                    <span class="prod-price">${formatCurrency(p.valor)}</span>
                    <span class="pix-label">no PIX (15% off)</span>
                </div>
                <button onclick="addCart(${p.id})" class="btn-cart">
                    <i class="fas fa-cart-plus"></i> Comprar
                </button>
            </div>
        `;
        grid.innerHTML += card;
    });
}

function buscarProduto() {
    renderizarGrid(produtosCache);
}

function filtrarCategoria(cat) {
    // Simulação de filtro por categoria (já que o backend não tem campo categoria real)
    // Em produção, você adicionaria ?categoria=hardware na URL da API
    document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    // Aqui resetamos para mostrar todos porque não temos o campo no DB ainda
    // Mas a UI reage
    renderizarGrid(produtosCache);
}

// --- MÓDULO: DETALHES DO PRODUTO ---
function verDetalhes(id) {
    const p = produtosCache.find(i => i.id === id);
    if (!p) return;

    document.getElementById('det-img-container').innerHTML = `<img src="${getImagemProduto(p.titulo)}" style="width: 100%; border-radius: 12px;">`;
    document.getElementById('det-titulo').innerText = p.titulo;
    document.getElementById('det-valor').innerText = formatCurrency(p.valor);
    document.getElementById('det-desc').innerText = `Vendedor ID: #${p.vendedor_id}\n\nProduto verificado pela equipe Ryzer. Garantia de procedência e entrega imediata após a confirmação do pagamento via sistema seguro de Escrow.`;

    // Atualiza o botão de adicionar ao carrinho
    const btn = document.getElementById('btn-add-cart-detail');
    // Remove listeners antigos clonando o nó
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.onclick = () => {
        addCart(p.id);
        toast("Produto adicionado ao carrinho!");
    };

    router('detalhes');
}

// --- MÓDULO: CARRINHO DE COMPRAS ---
function addCart(id) {
    let cart = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    if (!cart.includes(id)) {
        cart.push(id);
        localStorage.setItem('ryzer_cart', JSON.stringify(cart));
        toast("Adicionado ao carrinho");
    } else {
        toast("Já está no carrinho", "warning");
    }
    updateCartBadge();
}

function updateCartBadge() {
    const count = (JSON.parse(localStorage.getItem('ryzer_cart')) || []).length;
    const badge = document.getElementById('cart-badge');
    if(badge) badge.innerText = count;
}

function renderCarrinho() {
    const container = document.getElementById('lista-carrinho');
    const emptyMsg = document.getElementById('carrinho-vazio-msg');
    const cartIds = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    
    container.innerHTML = "";
    let total = 0;

    if (cartIds.length === 0) {
        emptyMsg.classList.remove('hidden');
        document.getElementById('cart-total').innerText = "R$ 0,00";
        document.getElementById('cart-subtotal').innerText = "R$ 0,00";
        return;
    }
    emptyMsg.classList.add('hidden');

    // Se o cache estiver vazio (reload na pagina de carrinho), busca dados
    if (produtosCache.length === 0) {
        carregarLoja().then(renderCarrinho);
        return;
    }

    cartIds.forEach((id, idx) => {
        const p = produtosCache.find(i => i.id === id);
        if (p) {
            total += p.valor;
            const img = getImagemProduto(p.titulo);
            
            const itemHtml = `
                <div class="cart-item fade-in">
                    <img src="${img}" alt="${p.titulo}">
                    <div style="flex: 1;">
                        <h4 style="font-size: 16px; margin-bottom: 5px;">${p.titulo}</h4>
                        <span style="font-size: 13px; color: #888;">Vendido por: Ryzer ID #${p.vendedor_id}</span>
                    </div>
                    <div class="text-right">
                        <div style="font-weight: 800; color: var(--primary); font-size: 18px;">${formatCurrency(p.valor)}</div>
                        <button onclick="removeCart(${idx})" style="background: none; border: none; color: #ff5555; font-size: 13px; text-decoration: underline; margin-top: 5px;">Remover</button>
                    </div>
                </div>
            `;
            container.innerHTML += itemHtml;
        }
    });

    document.getElementById('cart-subtotal').innerText = formatCurrency(total);
    document.getElementById('cart-total').innerText = formatCurrency(total);
}

function removeCart(index) {
    let cart = JSON.parse(localStorage.getItem('ryzer_cart'));
    cart.splice(index, 1);
    localStorage.setItem('ryzer_cart', JSON.stringify(cart));
    renderCarrinho();
    updateCartBadge();
}

async function finalizarCompra() {
    const cart = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    if (cart.length === 0) return toast("Carrinho vazio!", "error");
    
    if (!confirm("Confirmar compra de " + cart.length + " itens?")) return;

    let successCount = 0;
    let codes = [];

    // Processa cada item (Simulando checkout em lote)
    for (const id of cart) {
        try {
            const res = await fetch(`${API_BASE}/projetos/${id}/pagar`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                codes.push(data.codigo_verificacao);
                successCount++;
            }
        } catch (e) {
            console.error(e);
        }
    }

    if (successCount > 0) {
        alert(`✅ Compra realizada com sucesso!\n\nGuarde seus códigos de desbloqueio:\n${codes.join('\n')}\n\nEles estão disponíveis em 'Meus Pedidos'.`);
        localStorage.setItem('ryzer_cart', JSON.stringify([]));
        updateCartBadge();
        router('meus-pedidos');
    } else {
        toast("Erro ao processar compra. Tente novamente.", "error");
    }
}

// --- MÓDULO: MEUS PEDIDOS ---
async function carregarMeusPedidos() {
    const uid = localStorage.getItem('usuario_id');
    const grid = document.getElementById('grid-meus-pedidos');
    const emptyMsg = document.getElementById('msg-sem-pedidos');
    
    grid.innerHTML = '<div class="loading-skeleton"></div>';

    try {
        const res = await fetch(`${API_BASE}/cliente/${uid}/meus-cursos`);
        const data = await res.json();
        
        grid.innerHTML = "";
        
        if (data.length === 0) {
            emptyMsg.classList.remove('hidden');
            return;
        }
        emptyMsg.classList.add('hidden');

        data.forEach(p => {
            const img = getImagemProduto(p.titulo);
            grid.innerHTML += `
                <div class="product-card fade-in" style="border-top: 4px solid var(--primary);">
                    <div class="prod-img-box" style="height: 120px;">
                        <img src="${img}" class="prod-img">
                    </div>
                    <div class="prod-info">
                        <h3>${p.titulo}</h3>
                        <span class="badge" style="background: var(--primary); color: white; position: static;">COMPRADO</span>
                        
                        <div style="margin-top: 15px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 6px;">
                            <strong style="font-size: 12px; color: var(--primary-dark); text-transform: uppercase;">Dados de Acesso:</strong>
                            <p style="font-family: monospace; font-size: 14px; margin-top: 5px; word-break: break-all;">${p.conteudo_digital}</p>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (e) {
        console.error(e);
        grid.innerHTML = "Erro ao carregar pedidos.";
    }
}

// --- MÓDULO: DASHBOARD & VENDAS ---
async function carregarDashboard() {
    const uid = localStorage.getItem('usuario_id');
    
    try {
        // 1. Saldo Total
        const resTotal = await fetch(`${API_BASE}/vendedor/${uid}/total-vendas`);
        const dataTotal = await resTotal.json();
        const total = dataTotal.total_vendas_concluidas || 0;
        document.getElementById('dash-total').innerText = formatCurrency(total);

        // 2. Histórico
        const resProjs = await fetch(`${API_BASE}/projetos/`);
        const todos = await resProjs.json();
        const meus = todos.filter(p => p.vendedor_id == uid || p.cliente_id == uid);
        
        document.getElementById('dash-count').innerText = meus.length;
        
        const tbody = document.getElementById('lista-transacoes');
        tbody.innerHTML = "";

        if (meus.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma transação encontrada.</td></tr>';
            return;
        }

        meus.forEach(p => {
            let acao = "-";
            let statusClass = "badge"; // css class
            let statusText = p.status;

            if (p.status === 'pagamento_retido') {
                statusClass = "badge pending"; // Laranja
                statusText = "Aguardando Liberação";
                
                // Se sou o cliente, posso liberar
                if (p.cliente_id == uid) {
                    acao = `<button onclick="liberarPagamento(${p.id})" class="btn-cart" style="height: 30px; font-size: 12px; padding: 0 10px;">Liberar Pagamento</button>`;
                }
            } else if (p.status === 'finalizado') {
                statusClass = "badge paid"; // Verde
                statusText = "Concluído";
                acao = '<i class="fas fa-check" style="color: var(--primary);"></i>';
            }

            const tipo = p.vendedor_id == uid ? '<span style="color:blue">Venda</span>' : '<span style="color:purple">Compra</span>';

            tbody.innerHTML += `
                <tr>
                    <td><strong>${p.titulo}</strong></td>
                    <td>${tipo}</td>
                    <td>${formatCurrency(p.valor)}</td>
                    <td><span class="${statusClass}" style="position:static;">${statusText}</span></td>
                    <td>${acao}</td>
                </tr>
            `;
        });

    } catch (e) {
        console.error(e);
    }
}

async function liberarPagamento(id) {
    const codigo = prompt("Digite o código de liberação recebido na compra:");
    if (!codigo) return;

    try {
        const res = await fetch(`${API_BASE}/projetos/${id}/liberar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo: codigo })
        });

        if (res.ok) {
            toast("Pagamento liberado com sucesso!");
            carregarDashboard();
        } else {
            const err = await res.json();
            toast(err.detail || "Código inválido", "error");
        }
    } catch (e) {
        toast("Erro de conexão", "error");
    }
}

// --- MÓDULO: ANUNCIAR ---
async function publicarAnuncio() {
    const titulo = document.getElementById('anun-titulo').value;
    const valor = document.getElementById('anun-valor').value;
    const conteudo = document.getElementById('anun-conteudo').value;
    const uid = localStorage.getItem('usuario_id');
    const btn = document.getElementById('btn-publicar');

    if (!titulo || !valor || !conteudo) return toast("Preencha todos os campos", "error");

    btn.disabled = true;
    btn.innerHTML = "Publicando...";

    try {
        const res = await fetch(`${API_BASE}/projetos/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                titulo: titulo,
                valor: parseFloat(valor),
                conteudo_digital: conteudo,
                vendedor_id: parseInt(uid)
            })
        });

        if (res.ok) {
            toast("Anúncio publicado com sucesso!");
            router('dashboard');
        } else {
            const err = await res.json();
            // Lida com erro de validação do Pydantic (lista) ou string simples
            let msg = err.detail;
            if (Array.isArray(msg)) msg = msg[0].msg;
            toast("Erro: " + msg, "error");
        }
    } catch (e) {
        toast("Erro ao conectar", "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Publicar Agora';
    }
}
