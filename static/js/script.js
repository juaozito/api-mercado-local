/**
 * RYZER ENTERPRISE - JAVASCRIPT CORE
 * Visual 100% Customizado (Sem alerts padrões)
 */

// CONEXÃO COM SEU SERVIDOR NO RENDER
const API_BASE = 'https://api-mercado-local.onrender.com'; 

// --- 1. SISTEMA DE NOTIFICAÇÕES (TOASTS BONITOS) ---
function toast(msg, type = 'success') {
    const box = document.getElementById('toast-container');
    if (!box) return;

    // Ícones baseados no tipo
    let icon = 'check-circle';
    let color = 'var(--primary)';
    
    if (type === 'error') { icon = 'times-circle'; color = '#ff3b30'; }
    if (type === 'info') { icon = 'info-circle'; color = '#007aff'; }
    if (type === 'warning') { icon = 'exclamation-triangle'; color = '#ffcc00'; }

    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.innerHTML = `
        <i class="fas fa-${icon}" style="color: ${color}; font-size: 18px;"></i>
        <span>${msg}</span>
    `;

    // Adiciona ao container
    box.appendChild(div);

    // Remove automaticamente após 4 segundos
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateX(100%)';
        setTimeout(() => div.remove(), 300);
    }, 4000);
}

// --- 2. IMAGENS INTELIGENTES ---
function getImagemProduto(titulo) {
    if (!titulo) return 'https://placehold.co/600x600/eee/ccc?text=Ryzer';
    const t = titulo.toLowerCase();
    
    // Hardware High-End
    if(t.includes('rtx') || t.includes('gtx')) return 'https://m.media-amazon.com/images/I/71tDu30-mZL._AC_SL1500_.jpg';
    if(t.includes('ryzen') || t.includes('intel')) return 'https://m.media-amazon.com/images/I/51f2hkWjTlL._AC_SL1000_.jpg';
    if(t.includes('placa mãe')) return 'https://m.media-amazon.com/images/I/81bc-5l-uwL._AC_SL1500_.jpg';
    
    // Periféricos
    if(t.includes('mouse')) return 'https://resource.logitech.com/content/dam/gaming/en/products/g502-lightspeed-gaming-mouse/g502-lightspeed-gallery-1.png';
    if(t.includes('teclado')) return 'https://resource.logitechg.com/w_692,c_lpad,ar_4:3,q_auto:best,f_auto,b_rgb:000000/content/dam/gaming/en/products/pro-x-keyboard/pro-x-keyboard-gallery-1.png';
    if(t.includes('headset') || t.includes('fone')) return 'https://m.media-amazon.com/images/I/61CGHv6kmWL._AC_SL1000_.jpg';
    if(t.includes('monitor')) return 'https://www.lg.com/br/images/monitores/md06155636/gallery/medium01.jpg';

    // Software
    if(t.includes('curso') || t.includes('python')) return 'https://placehold.co/600x600/00bf63/ffffff?text=Curso+Pro';
    
    return `https://placehold.co/600x600/f8f9fa/333333?text=${encodeURIComponent(titulo.substring(0,10))}`;
}

function formatMoney(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// --- 3. ROTEADOR (NAVEGAÇÃO) ---
function router(tela) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    
    const target = document.getElementById(`sec-${tela}`);
    if (target) {
        target.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const uid = localStorage.getItem('usuario_id');
    const nav = document.getElementById('navbar');
    const footer = document.getElementById('footer');

    if (uid) {
        if(nav) nav.classList.remove('hidden');
        if(footer) footer.classList.remove('hidden');
        updateCartBadge();
        
        // Atualiza nome do usuário
        const nameDisplay = document.getElementById('user-name-display');
        if(nameDisplay) nameDisplay.innerText = localStorage.getItem('usuario_nome') || 'Cliente';

        if(tela === 'loja') carregarLoja();
        if(tela === 'carrinho') renderCarrinho();
        if(tela === 'dashboard') carregarDashboard();
        if(tela === 'meus-pedidos') carregarPedidos();
        if(tela === 'login' || tela === 'cadastro') router('loja');
    } else {
        if(nav) nav.classList.add('hidden');
        if(footer) footer.classList.add('hidden');
        if(tela !== 'login' && tela !== 'cadastro') router('login');
    }
}

// Inicializa
window.onload = () => localStorage.getItem('usuario_id') ? router('loja') : router('login');

// Menu Mobile (Substitui o alert feio)
function toggleMenu() {
    toast("Versão Mobile otimizada em breve!", "info");
}

// --- 4. AUTH ---
async function fazerLogin() {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    const msg = document.getElementById('msg-login');
    const btn = document.querySelector('#sec-login button');

    if (!email || !senha) return toast("Preencha todos os campos", "warning");

    msg.innerText = "Conectando...";
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/login/`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, senha})
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('usuario_id', data.usuario_id);
            localStorage.setItem('usuario_nome', data.nome);
            toast(`Bem-vindo, ${data.nome}!`, "success");
            router('loja');
        } else {
            msg.innerText = data.detail || "Login incorreto";
            toast(data.detail || "Dados inválidos", "error");
        }
    } catch (e) {
        msg.innerText = "";
        toast("Erro de conexão com o servidor", "error");
    } finally {
        btn.disabled = false;
    }
}

async function cadastrar() {
    const nome = document.getElementById('cad-nome').value;
    const email = document.getElementById('cad-email').value;
    const senha = document.getElementById('cad-senha').value;
    
    if (!nome || !email || !senha) return toast("Preencha todos os campos", "warning");

    try {
        const res = await fetch(`${API_BASE}/usuarios/`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({nome, email, senha})
        });
        if (res.ok) {
            toast("Conta criada com sucesso!", "success");
            router('login');
        } else {
            const err = await res.json();
            toast(err.detail || "Erro no cadastro", "error");
        }
    } catch (e) {
        toast("Erro de conexão", "error");
    }
}

function logout() {
    localStorage.clear();
    location.reload();
}

// --- 5. LOJA ---
let produtosCache = [];

async function carregarLoja() {
    const grid = document.getElementById('grid-produtos');
    
    // Skeleton Loading (Visual enquanto carrega)
    grid.innerHTML = `
        <div class="skeleton-card"></div><div class="skeleton-card"></div>
        <div class="skeleton-card"></div><div class="skeleton-card"></div>
    `;

    try {
        const res = await fetch(`${API_BASE}/projetos/`);
        const data = await res.json();
        produtosCache = data.filter(p => p.status === 'aberto');
        renderGrid(produtosCache);
    } catch (e) {
        grid.innerHTML = '<p style="text-align:center; grid-column:1/-1; padding:20px;">Falha ao carregar ofertas.</p>';
        toast("Erro ao carregar loja", "error");
    }
}

function renderGrid(lista) {
    const grid = document.getElementById('grid-produtos');
    const termo = document.getElementById('campo-busca').value.toLowerCase();
    grid.innerHTML = "";

    const filtrados = lista.filter(p => p.titulo.toLowerCase().includes(termo));

    if (filtrados.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px; color:#888;">Nenhum produto encontrado.</div>`;
        return;
    }

    filtrados.forEach(p => {
        const img = getImagemProduto(p.titulo);
        grid.innerHTML += `
            <div class="product-card fade-in">
                <div class="prod-img-box" onclick="verDetalhes(${p.id})" style="cursor: pointer;">
                    <img src="${img}" class="prod-img">
                </div>
                <div class="prod-info">
                    <h3 title="${p.titulo}">${p.titulo}</h3>
                    <div class="old-price">R$ ${(p.valor * 1.35).toFixed(2)}</div>
                    <span class="prod-price">${formatMoney(p.valor)}</span>
                    <span class="payment-info">à vista no PIX</span>
                </div>
                <button onclick="addCart(${p.id})" class="btn-cart">
                    <i class="fas fa-shopping-cart"></i> COMPRAR
                </button>
            </div>`;
    });
}

function buscarProduto() { renderGrid(produtosCache); }
function filtrarCategoria(cat) { 
    toast(`Filtrando por: ${cat.toUpperCase()}`, "info");
    renderGrid(produtosCache); 
}

// --- 6. DETALHES ---
function verDetalhes(id) {
    const p = produtosCache.find(i => i.id === id);
    if (!p) return;

    document.getElementById('det-img-container').innerHTML = `<img src="${getImagemProduto(p.titulo)}" style="max-width:100%; max-height:100%;">`;
    document.getElementById('det-titulo').innerText = p.titulo;
    document.getElementById('det-valor').innerText = formatMoney(p.valor);
    document.getElementById('det-desc').innerText = `Vendedor ID: #${p.vendedor_id}\n\nGarantia Ryzer de proteção ao comprador. O valor fica retido até você receber o produto/acesso.`;
    
    // Botão Clonado para limpar eventos
    const btn = document.getElementById('btn-add-cart-detail');
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.onclick = () => { addCart(p.id); };

    router('detalhes');
}

// --- 7. CARRINHO ---
function addCart(id) {
    let cart = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    if (!cart.includes(id)) {
        cart.push(id);
        localStorage.setItem('ryzer_cart', JSON.stringify(cart));
        updateCartBadge();
        toast("Produto adicionado ao carrinho!", "success");
    } else {
        toast("Este item já está no carrinho.", "warning");
    }
}

function updateCartBadge() {
    const count = (JSON.parse(localStorage.getItem('ryzer_cart')) || []).length;
    const badge = document.getElementById('cart-badge');
    if(badge) badge.innerText = count;
}

function renderCarrinho() {
    const container = document.getElementById('lista-carrinho');
    const cartIds = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    container.innerHTML = "";
    let total = 0;

    if (cartIds.length === 0) {
        container.innerHTML = "<p style='text-align:center; padding:40px; color:#888'>Seu carrinho está vazio.</p>";
        document.getElementById('cart-total').innerText = "R$ 0,00";
        document.getElementById('cart-subtotal').innerText = "R$ 0,00";
        return;
    }

    if (produtosCache.length === 0) { carregarLoja().then(renderCarrinho); return; }

    cartIds.forEach((id, idx) => {
        const p = produtosCache.find(i => i.id === id);
        if (p) {
            total += p.valor;
            container.innerHTML += `
                <div class="cart-item fade-in">
                    <img src="${getImagemProduto(p.titulo)}">
                    <div style="flex:1">
                        <strong>${p.titulo}</strong><br>
                        <small>Vendedor #${p.vendedor_id}</small>
                    </div>
                    <div class="text-right">
                        <div style="color:var(--primary); font-weight:bold;">${formatMoney(p.valor)}</div>
                        <button onclick="removeCart(${idx})" style="color:#ff3b30; font-size:12px; text-decoration:underline; margin-top:5px;">Remover</button>
                    </div>
                </div>`;
        }
    });

    document.getElementById('cart-subtotal').innerText = formatMoney(total);
    document.getElementById('cart-total').innerText = formatMoney(total);
}

function removeCart(idx) {
    let cart = JSON.parse(localStorage.getItem('ryzer_cart'));
    cart.splice(idx, 1);
    localStorage.setItem('ryzer_cart', JSON.stringify(cart));
    renderCarrinho();
    updateCartBadge();
    toast("Item removido.", "info");
}

async function finalizarCompra() {
    const cart = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    if (cart.length === 0) return toast("Carrinho vazio!", "error");
    
    // Substitui o confirm() feio por uma lógica direta ou modal (aqui simplificado para ação direta)
    const btn = document.querySelector('#sec-carrinho .btn-checkout');
    const originalText = btn.innerText;
    
    btn.innerText = "Processando...";
    btn.disabled = true;

    let codes = [];
    for (const id of cart) {
        try {
            const res = await fetch(`${API_BASE}/projetos/${id}/pagar`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                codes.push(data.codigo_verificacao);
            }
        } catch (e) { console.error(e); }
    }

    if (codes.length > 0) {
        // Sucesso
        toast("Compra realizada com sucesso!", "success");
        // Mostra os códigos em um alert customizado ou redireciona
        alert(`✅ SEUS CÓDIGOS DE ENTREGA:\n\n${codes.join('\n')}\n\nGuarde-os! Eles também estão em 'Meus Pedidos'.`);
        
        localStorage.setItem('ryzer_cart', JSON.stringify([]));
        updateCartBadge();
        router('meus-pedidos');
    } else {
        toast("Erro ao processar compra.", "error");
    }
    
    btn.innerText = originalText;
    btn.disabled = false;
}

// --- 8. DASHBOARD ---
async function carregarDashboard() {
    const uid = localStorage.getItem('usuario_id');
    try {
        const resTotal = await fetch(`${API_BASE}/vendedor/${uid}/total-vendas`);
        const dataTotal = await resTotal.json();
        document.getElementById('dash-total').innerText = formatMoney(dataTotal.total_vendas_concluidas || 0);

        const resProjs = await fetch(`${API_BASE}/projetos/`);
        const todos = await resProjs.json();
        const meus = todos.filter(p => p.vendedor_id == uid || p.cliente_id == uid);
        
        document.getElementById('dash-count').innerText = meus.filter(p => p.vendedor_id == uid).length;

        const tbody = document.getElementById('lista-vendas-table');
        tbody.innerHTML = "";

        if(meus.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhuma transação.</td></tr>';
            return;
        }

        meus.forEach(p => {
            let acao = "-";
            let statusBadge = `<span class="status-badge status-info">${p.status}</span>`;

            if (p.status === 'pagamento_retido') {
                statusBadge = `<span class="status-badge status-pending">Pendente</span>`;
                if (p.cliente_id == uid) {
                    acao = `<button onclick="liberarPagamento(${p.id})" style="color:blue; font-weight:bold; font-size:12px;">Liberar</button>`;
                }
            } else if (p.status === 'finalizado') {
                statusBadge = `<span class="status-badge status-success">Concluído</span>`;
            }

            tbody.innerHTML += `
                <tr>
                    <td>${p.titulo}</td>
                    <td>${formatMoney(p.valor)}</td>
                    <td>${statusBadge}</td>
                    <td>${acao}</td>
                </tr>`;
        });
    } catch (e) {}
}

async function liberarPagamento(id) {
    // Aqui ainda usamos prompt pois criar um modal HTML dinâmico seria muito extenso,
    // mas o toast avisa o resultado.
    const codigo = prompt("Digite o código de liberação:");
    if (!codigo) return;

    try {
        const res = await fetch(`${API_BASE}/projetos/${id}/liberar`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo: codigo })
        });
        if (res.ok) { 
            toast("Pagamento liberado!", "success"); 
            carregarDashboard(); 
        } else { 
            toast("Código inválido.", "error"); 
        }
    } catch (e) { toast("Erro de conexão.", "error"); }
}

async function publicarAnuncio() {
    const titulo = document.getElementById('anun-titulo').value;
    const valor = document.getElementById('anun-valor').value;
    const conteudo = document.getElementById('anun-conteudo').value;
    const uid = localStorage.getItem('usuario_id');

    if (!titulo || !valor || !conteudo) return toast("Preencha todos os campos", "warning");

    try {
        const res = await fetch(`${API_BASE}/projetos/`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                titulo: titulo,
                valor: parseFloat(valor),
                conteudo_digital: conteudo,
                vendedor_id: parseInt(uid)
            })
        });
        if (res.ok) { 
            toast("Anúncio publicado com sucesso!", "success"); 
            router('dashboard'); 
        } else { 
            toast("Erro ao publicar anúncio", "error"); 
        }
    } catch (e) { toast("Erro de conexão", "error"); }
}

function switchDashTab(tab) {
    document.getElementById('tab-vendas').classList.add('hidden');
    document.getElementById('tab-compras').classList.add('hidden');
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    
    document.querySelectorAll('.dash-menu-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    if(tab === 'compras') carregarPedidos(); 
}

async function carregarPedidos() {
    const uid = localStorage.getItem('usuario_id');
    const grid = document.getElementById('grid-meus-pedidos');
    grid.innerHTML = '<div class="skeleton-card"></div>';
    
    try {
        const res = await fetch(`${API_BASE}/cliente/${uid}/meus-cursos`);
        const data = await res.json();
        grid.innerHTML = "";
        
        if (data.length === 0) { 
            grid.innerHTML = "<p>Nenhuma compra realizada.</p>"; 
            return; 
        }

        data.forEach(p => {
            const img = getImagemProduto(p.titulo);
            grid.innerHTML += `
                <div class="product-card fade-in" style="border-top: 4px solid var(--primary);">
                    <div class="prod-img-box" style="height:120px;">
                        <img src="${img}" class="prod-img">
                    </div>
                    <div class="prod-info">
                        <h3>${p.titulo}</h3>
                        <div style="background:#e6ffef; padding:10px; border-radius:6px; margin-top:10px; font-size:12px; color:#155724; border:1px solid #c3e6cb;">
                            <strong style="display:block; margin-bottom:5px;">📦 DADOS DE ACESSO:</strong>
                            <span style="font-family:monospace;">${p.conteudo_digital}</span>
                        </div>
                    </div>
                </div>`;
        });
    } catch (e) { toast("Erro ao carregar pedidos", "error"); }
}
