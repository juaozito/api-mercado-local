/**
 * RYZER ENTERPRISE - CORE LOGIC v6.0
 * Integração completa com FastAPI + UX Avançada
 */

// API CONFIG
const API_BASE = 'http://127.0.0.1:8000'; 

// --- 1. IMAGENS INTELIGENTES ---
function getImagemProduto(titulo) {
    if (!titulo) return 'https://placehold.co/600x600/eee/ccc?text=No+Image';
    const t = titulo.toLowerCase();
    
    // Hardware
    if(t.includes('rtx') || t.includes('gtx')) return 'https://m.media-amazon.com/images/I/71tDu30-mZL._AC_SL1500_.jpg';
    if(t.includes('ryzen') || t.includes('intel')) return 'https://m.media-amazon.com/images/I/51f2hkWjTlL._AC_SL1000_.jpg';
    if(t.includes('memória') || t.includes('ram')) return 'https://m.media-amazon.com/images/I/61p3lA4N3uL._AC_SL1134_.jpg';
    if(t.includes('ssd') || t.includes('nvme')) return 'https://m.media-amazon.com/images/I/71F9+Wc-kOL._AC_SL1500_.jpg';
    
    // Periféricos
    if(t.includes('mouse')) return 'https://resource.logitech.com/content/dam/gaming/en/products/g502-lightspeed-gaming-mouse/g502-lightspeed-gallery-1.png';
    if(t.includes('teclado')) return 'https://resource.logitechg.com/w_692,c_lpad,ar_4:3,q_auto:best,f_auto,b_rgb:000000/content/dam/gaming/en/products/pro-x-keyboard/pro-x-keyboard-gallery-1.png';
    if(t.includes('monitor')) return 'https://www.lg.com/br/images/monitores/md06155636/gallery/medium01.jpg';
    if(t.includes('headset') || t.includes('fone')) return 'https://m.media-amazon.com/images/I/61CGHv6kmWL._AC_SL1000_.jpg';

    // Software/Cursos
    if(t.includes('curso') || t.includes('python')) return 'https://placehold.co/600x600/00bf63/ffffff?text=Curso+Dev';
    if(t.includes('windows') || t.includes('office')) return 'https://placehold.co/600x600/0078d7/ffffff?text=Software+Key';

    return `https://placehold.co/600x600/f8f9fa/333333?text=${encodeURIComponent(titulo.substring(0,10))}`;
}

// --- 2. UTILS ---
function formatMoney(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function toast(msg, type='success') {
    const box = document.getElementById('toast-container');
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.innerHTML = type === 'success' 
        ? `<i class="fas fa-check-circle" style="color:var(--primary)"></i> ${msg}` 
        : `<i class="fas fa-exclamation-triangle" style="color:#dc3545"></i> ${msg}`;
    box.appendChild(div);
    setTimeout(() => div.remove(), 4000);
}

// --- 3. ROTEADOR ---
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
        nav.classList.remove('hidden');
        footer.classList.remove('hidden');
        updateCartBadge();
        
        if(tela === 'loja') carregarLoja();
        if(tela === 'carrinho') renderCarrinho();
        if(tela === 'dashboard') carregarDashboard();
        if(tela === 'meus-pedidos') carregarPedidos();
        if(tela === 'login' || tela === 'cadastro') router('loja');
        
        document.getElementById('user-name-display').innerText = localStorage.getItem('usuario_nome') || 'Cliente';
    } else {
        nav.classList.add('hidden');
        footer.classList.add('hidden');
        if(tela !== 'login' && tela !== 'cadastro') router('login');
    }
}

window.onload = () => localStorage.getItem('usuario_id') ? router('loja') : router('login');

function toggleMenu() { alert("Menu Mobile em desenvolvimento."); }

// --- 4. AUTH ---
async function fazerLogin() {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    const msg = document.getElementById('msg-login');
    msg.innerText = "Conectando...";

    try {
        const res = await fetch(`${API_BASE}/login/`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, senha})
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('usuario_id', data.usuario_id);
            localStorage.setItem('usuario_nome', data.nome);
            toast(`Bem-vindo, ${data.nome}!`);
            router('loja');
        } else {
            msg.innerText = data.detail || "Login falhou.";
        }
    } catch (e) { msg.innerText = "Erro de conexão."; }
}

async function cadastrar() {
    const nome = document.getElementById('cad-nome').value;
    const email = document.getElementById('cad-email').value;
    const senha = document.getElementById('cad-senha').value;
    
    try {
        const res = await fetch(`${API_BASE}/usuarios/`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({nome, email, senha})
        });
        if (res.ok) { toast("Conta criada!"); router('login'); }
        else { 
            const err = await res.json();
            toast(err.detail || "Erro no cadastro", "error"); 
        }
    } catch (e) { toast("Erro de conexão", "error"); }
}

function logout() { localStorage.clear(); router('login'); }

// --- 5. LOJA ---
let produtosCache = [];

async function carregarLoja() {
    const grid = document.getElementById('grid-produtos');
    
    try {
        const res = await fetch(`${API_BASE}/projetos/`);
        const data = await res.json();
        produtosCache = data.filter(p => p.status === 'aberto');
        renderizarGrid(produtosCache);
    } catch (e) {
        grid.innerHTML = "<p class='text-center'>Erro ao carregar ofertas.</p>";
    }
}

function renderizarGrid(lista) {
    const grid = document.getElementById('grid-produtos');
    const termo = document.getElementById('campo-busca').value.toLowerCase();
    grid.innerHTML = "";

    const filtrados = lista.filter(p => p.titulo.toLowerCase().includes(termo));

    if (filtrados.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px;">Nenhum produto encontrado.</div>`;
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
                    <div class="old-price">R$ ${(p.valor * 1.3).toFixed(2)}</div>
                    <span class="prod-price">${formatMoney(p.valor)}</span>
                    <span class="payment-info">à vista no PIX</span>
                </div>
                <button onclick="addCart(${p.id})" class="btn-cart">
                    <i class="fas fa-shopping-cart"></i> COMPRAR
                </button>
            </div>`;
    });
}

function buscarProduto() { renderizarGrid(produtosCache); }

function filtrarCategoria(cat) {
    // Simula filtro (Como não há campo categoria no backend, reseta)
    renderizarGrid(produtosCache); 
}

// --- 6. DETALHES ---
function verDetalhes(id) {
    const p = produtosCache.find(i => i.id === id);
    if (!p) return;

    document.getElementById('det-img-container').innerHTML = `<img src="${getImagemProduto(p.titulo)}" style="width: 100%; border-radius: 12px;">`;
    document.getElementById('det-titulo').innerText = p.titulo;
    document.getElementById('det-valor').innerText = formatMoney(p.valor);
    document.getElementById('det-desc').innerText = `Vendedor ID: #${p.vendedor_id}\nProduto verificado pela Ryzer.`;
    document.getElementById('bread-nome').innerText = p.titulo.substring(0, 20) + '...';

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
        toast("Adicionado ao carrinho!");
        updateCartBadge();
    } else {
        toast("Já no carrinho!", "error");
    }
}

function updateCartBadge() {
    const count = (JSON.parse(localStorage.getItem('ryzer_cart')) || []).length;
    document.getElementById('cart-badge').innerText = count;
}

function renderCarrinho() {
    const container = document.getElementById('lista-carrinho');
    const cartIds = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    container.innerHTML = "";
    let total = 0;

    if (cartIds.length === 0) {
        container.innerHTML = "<p class='text-center' style='padding:40px'>Seu carrinho está vazio.</p>";
        document.getElementById('cart-total').innerText = "R$ 0,00";
        document.getElementById('cart-subtotal').innerText = "R$ 0,00";
        return;
    }

    if (produtosCache.length === 0) { carregarLoja().then(renderCarrinho); return; }

    cartIds.forEach((id, idx) => {
        const p = produtosCache.find(i => i.id === id);
        if (p) {
            total += p.valor;
            const img = getImagemProduto(p.titulo);
            container.innerHTML += `
                <div class="cart-item fade-in">
                    <img src="${img}">
                    <div style="flex: 1;">
                        <h4 style="font-size: 15px; margin-bottom: 5px;">${p.titulo}</h4>
                        <span style="font-size: 13px; color: #888;">Vendedor #${p.vendedor_id}</span>
                    </div>
                    <div class="text-right">
                        <div style="font-weight: 800; color: var(--primary);">${formatMoney(p.valor)}</div>
                        <button onclick="removeCart(${idx})" style="color:#dc3545; font-size:12px; margin-top:5px; text-decoration:underline;">Remover</button>
                    </div>
                </div>`;
        }
    });

    document.getElementById('cart-subtotal').innerText = formatMoney(total);
    document.getElementById('cart-total').innerText = formatMoney(total);
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
    if (!confirm("Confirmar compra?")) return;

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
        alert(`✅ Compra realizada!\nCódigos: \n${codes.join('\n')}`);
        localStorage.setItem('ryzer_cart', JSON.stringify([]));
        updateCartBadge();
        router('meus-pedidos');
    } else {
        toast("Erro ao processar.", "error");
    }
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

        if (meus.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Sem histórico.</td></tr>';
            return;
        }

        meus.forEach(p => {
            let acao = "-";
            let statusClass = "status-badge";
            let statusText = p.status;

            if (p.status === 'pagamento_retido') {
                statusClass += " status-pending"; 
                statusText = "Pendente";
                if (p.cliente_id == uid) {
                    acao = `<button onclick="liberarPagamento(${p.id})" style="color:blue; font-weight:bold; font-size:12px;">Liberar</button>`;
                }
            } else if (p.status === 'finalizado') {
                statusClass += " status-success"; 
                statusText = "Pago";
            }

            tbody.innerHTML += `
                <tr>
                    <td>${p.titulo}</td>
                    <td>${formatMoney(p.valor)}</td>
                    <td><span class="${statusClass}">${statusText}</span></td>
                    <td>${acao}</td>
                </tr>`;
        });
    } catch (e) {}
}

async function liberarPagamento(id) {
    const codigo = prompt("Código de liberação:");
    if (!codigo) return;
    try {
        const res = await fetch(`${API_BASE}/projetos/${id}/liberar`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo: codigo })
        });
        if (res.ok) { toast("Liberado!"); carregarDashboard(); }
        else toast("Código inválido", "error");
    } catch (e) { toast("Erro de conexão", "error"); }
}

async function publicarAnuncio() {
    const titulo = document.getElementById('anun-titulo').value;
    const valor = document.getElementById('anun-valor').value;
    const conteudo = document.getElementById('anun-conteudo').value;
    const uid = localStorage.getItem('usuario_id');

    if (!titulo || !valor || !conteudo) return toast("Preencha tudo", "error");

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
        if (res.ok) { toast("Publicado!"); router('dashboard'); }
        else toast("Erro ao publicar", "error");
    } catch (e) { toast("Erro de conexão", "error"); }
}

function switchDashTab(tab) {
    document.getElementById('tab-vendas').classList.add('hidden');
    document.getElementById('tab-compras').classList.add('hidden');
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    if(tab === 'compras') carregarPedidos(); 
}

async function carregarPedidos() {
    const uid = localStorage.getItem('usuario_id');
    const grid = document.getElementById('grid-meus-pedidos');
    grid.innerHTML = "<p>Carregando...</p>";
    try {
        const res = await fetch(`${API_BASE}/cliente/${uid}/meus-cursos`);
        const data = await res.json();
        grid.innerHTML = "";
        if (data.length === 0) { grid.innerHTML = "<p>Sem compras.</p>"; return; }

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
                            <strong>Entrega:</strong><br>${p.conteudo_digital}
                        </div>
                    </div>
                </div>`;
        });
    } catch (e) {}
}
