/**
 * RYZER ENTERPRISE - JAVASCRIPT CORE
 * Integração completa com FastAPI e UX avançada.
 */

// API CONFIG (Deixe vazio se estiver na mesma origem)
const API_BASE = 'http://127.0.0.1:8000'; 

// --- 1. IMAGENS INTELIGENTES (Mockup de Qualidade) ---
function getImagemProduto(titulo) {
    if (!titulo) return 'https://placehold.co/600x600/eee/ccc?text=No+Image';
    const t = titulo.toLowerCase();
    
    // Hardware
    if(t.includes('rtx') || t.includes('gtx')) return 'https://m.media-amazon.com/images/I/71tDu30-mZL._AC_SL1500_.jpg'; // GPU
    if(t.includes('ryzen') || t.includes('intel')) return 'https://m.media-amazon.com/images/I/51f2hkWjTlL._AC_SL1000_.jpg'; // CPU
    if(t.includes('memória') || t.includes('ram')) return 'https://m.media-amazon.com/images/I/61p3lA4N3uL._AC_SL1134_.jpg'; // RAM
    if(t.includes('ssd') || t.includes('nvme')) return 'https://m.media-amazon.com/images/I/71F9+Wc-kOL._AC_SL1500_.jpg'; // SSD
    
    // Periféricos
    if(t.includes('mouse')) return 'https://m.media-amazon.com/images/I/61mpMH5TzkL._AC_SL1500_.jpg';
    if(t.includes('teclado')) return 'https://m.media-amazon.com/images/I/71jG+e7roXL._AC_SL1500_.jpg';
    if(t.includes('monitor')) return 'https://m.media-amazon.com/images/I/71sxlhYhKWL._AC_SL1500_.jpg';
    if(t.includes('headset') || t.includes('fone')) return 'https://m.media-amazon.com/images/I/61CGHv6kmWL._AC_SL1000_.jpg';

    // Software/Cursos
    if(t.includes('curso') || t.includes('python')) return 'https://placehold.co/600x600/00bf63/ffffff?text=Curso+Dev';
    if(t.includes('windows') || t.includes('office')) return 'https://placehold.co/600x600/0078d7/ffffff?text=Software+Key';

    return `https://placehold.co/600x600/f8f9fa/333333?text=${encodeURIComponent(titulo.substring(0,10))}`;
}

// --- 2. HELPERS (Formatação e UI) ---
function formatMoney(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function toast(msg, type='success') {
    const box = document.getElementById('toast-container');
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.innerHTML = type === 'success' 
        ? `<i class="fas fa-check-circle" style="color:var(--primary)"></i> ${msg}`
        : `<i class="fas fa-exclamation-triangle" style="color:var(--secondary)"></i> ${msg}`;
    box.appendChild(div);
    setTimeout(() => div.remove(), 4000);
}

// --- 3. ROTEADOR (SPA) ---
function router(tela) {
    // Esconde tudo
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    
    // Mostra alvo
    const target = document.getElementById(`sec-${tela}`);
    if (target) {
        target.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Controle Navbar e Footer
    const uid = localStorage.getItem('usuario_id');
    const nav = document.getElementById('navbar');
    const footer = document.getElementById('footer');

    if (uid) {
        nav.classList.remove('hidden');
        footer.classList.remove('hidden');
        updateCartBadge();
        
        // Carregamento Lazy
        if(tela === 'loja') carregarLoja();
        if(tela === 'carrinho') renderCarrinho();
        if(tela === 'dashboard') carregarDashboard();
        if(tela === 'meus-pedidos') carregarPedidos();
        
        // Redireciona se tentar logar
        if(tela === 'login' || tela === 'cadastro') router('loja');
        
        // Nome no topo
        document.getElementById('user-name-display').innerText = localStorage.getItem('usuario_nome') || 'Cliente';
    } else {
        nav.classList.add('hidden');
        footer.classList.add('hidden');
        if(tela !== 'login' && tela !== 'cadastro') router('login');
    }
}

window.onload = () => localStorage.getItem('usuario_id') ? router('loja') : router('login');

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
        else toast("Erro no cadastro", "error");
    } catch (e) { toast("Erro de conexão", "error"); }
}

function logout() {
    localStorage.clear();
    router('login');
}

// --- 5. LOJA ---
let produtosCache = [];

async function carregarLoja() {
    const grid = document.getElementById('grid-produtos');
    
    try {
        const res = await fetch(`${API_BASE}/projetos/`);
        const data = await res.json();
        produtosCache = data.filter(p => p.status === 'aberto');
        renderGrid(produtosCache);
    } catch (e) {
        grid.innerHTML = "<p>Erro ao carregar produtos.</p>";
    }
}

function renderGrid(lista) {
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
                <div class="prod-img-box" onclick="verDetalhes(${p.id})" style="cursor:pointer">
                    <img src="${img}" class="prod-img">
                </div>
                <div class="prod-info">
                    <h3 title="${p.titulo}">${p.titulo}</h3>
                    <span class="old-price">R$ ${(p.valor * 1.2).toFixed(2)}</span>
                    <span class="prod-price">${formatMoney(p.valor)}</span>
                    <span class="pix-label">à vista no PIX</span>
                </div>
                <button onclick="addCart(${p.id})" class="btn-cart">
                    <i class="fas fa-shopping-cart"></i> COMPRAR
                </button>
            </div>`;
    });
}

function buscarProduto() { renderGrid(produtosCache); }

// Filtro Fake (Front-end)
function filtrarCategoria(cat) {
    // Como o backend não tem campo categoria, simulamos resetando a busca
    document.querySelectorAll('.cat-link').forEach(b => b.classList.remove('active'));
    // Lógica real viria aqui se tivesse campo no DB
    renderGrid(produtosCache); 
}

// --- 6. DETALHES ---
function verDetalhes(id) {
    const p = produtosCache.find(i => i.id === id);
    if (!p) return;

    document.getElementById('det-img-container').innerHTML = `<img src="${getImagemProduto(p.titulo)}" style="max-width:100%; max-height:100%;">`;
    document.getElementById('det-titulo').innerText = p.titulo;
    document.getElementById('det-valor').innerText = formatMoney(p.valor);
    document.getElementById('det-desc').innerText = `Produto ID: #${p.id}\nVendedor: Ryzer Partner #${p.vendedor_id}\n\nEste produto é digital ou físico com garantia de entrega via Ryzer Escrow. O pagamento fica retido até você confirmar o recebimento.`;
    
    // Breadcrumbs
    document.getElementById('bread-nome').innerText = p.titulo.substring(0, 20) + '...';

    // Botão Adicionar
    const btn = document.getElementById('btn-add-cart-detail');
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.onclick = () => { addCart(p.id); toast("Adicionado ao carrinho!"); };

    router('detalhes');
}

// --- 7. CARRINHO ---
function addCart(id) {
    let cart = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    if (!cart.includes(id)) {
        cart.push(id);
        localStorage.setItem('ryzer_cart', JSON.stringify(cart));
        updateCartBadge();
        toast("Adicionado ao carrinho!");
    } else {
        toast("Item já está no carrinho", "error");
    }
}

function updateCartBadge() {
    const count = (JSON.parse(localStorage.getItem('ryzer_cart')) || []).length;
    document.getElementById('cart-badge').innerText = count;
}

function renderCarrinho() {
    const container = document.getElementById('lista-carrinho');
    const cart = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    container.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = "<p class='text-center' style='padding:40px'>Seu carrinho está vazio.</p>";
        document.getElementById('cart-total').innerText = "R$ 0,00";
        document.getElementById('cart-subtotal').innerText = "R$ 0,00";
        return;
    }

    if (produtosCache.length === 0) { carregarLoja().then(renderCarrinho); return; }

    cart.forEach((id, idx) => {
        const p = produtosCache.find(i => i.id === id);
        if (p) {
            total += p.valor;
            const img = getImagemProduto(p.titulo);
            container.innerHTML += `
                <div class="cart-item fade-in">
                    <img src="${img}">
                    <div style="flex:1">
                        <strong>${p.titulo}</strong><br>
                        <small>Vendedor #${p.vendedor_id}</small>
                    </div>
                    <div class="text-right">
                        <div style="font-weight:bold; color:var(--primary)">${formatMoney(p.valor)}</div>
                        <button onclick="remCart(${idx})" style="color:#ff5555; background:none; font-size:12px; margin-top:5px; text-decoration:underline;">Remover</button>
                    </div>
                </div>`;
        }
    });

    document.getElementById('cart-total').innerText = formatMoney(total);
    document.getElementById('cart-subtotal').innerText = formatMoney(total);
}

function remCart(index) {
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
    for (let id of cart) {
        try {
            const res = await fetch(`${API_BASE}/projetos/${id}/pagar`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                codes.push(data.codigo_verificacao);
            }
        } catch (e) { console.error(e); }
    }

    if (codes.length > 0) {
        alert(`✅ Sucesso! Seus códigos de liberação:\n\n${codes.join('\n')}\n\nAcesse 'Meus Pedidos' para ver os produtos.`);
        localStorage.setItem('ryzer_cart', JSON.stringify([]));
        updateCartBadge();
        router('meus-pedidos');
    } else {
        toast("Erro ao processar. Tente novamente.", "error");
    }
}

// --- 8. DASHBOARD ---
async function carregarDashboard() {
    const uid = localStorage.getItem('usuario_id');
    document.getElementById('dash-user-name').innerText = localStorage.getItem('usuario_nome');

    try {
        const res = await fetch(`${API_BASE}/vendedor/${uid}/total-vendas`);
        const data = await res.json();
        document.getElementById('dash-total').innerText = formatMoney(data.total_vendas_concluidas || 0);

        const res2 = await fetch(`${API_BASE}/projetos/`);
        const prods = await res2.json();
        const meus = prods.filter(p => p.vendedor_id == uid || p.cliente_id == uid);
        
        document.getElementById('dash-count').innerText = meus.filter(p => p.vendedor_id == uid).length;

        const tbody = document.getElementById('lista-vendas-table');
        tbody.innerHTML = "";
        
        meus.forEach(p => {
            let acao = "-";
            let status = `<span style="color:#555">${p.status}</span>`;
            
            if(p.status === 'pagamento_retido') {
                status = `<span style="color:#ff6500; font-weight:bold;">Pendente</span>`;
                if(p.cliente_id == uid) acao = `<button onclick="liberar(${p.id})" style="padding:5px; background:var(--primary); color:white; border-radius:4px;">Liberar</button>`;
            }
            if(p.status === 'finalizado') status = `<span style="color:green; font-weight:bold;">Pago</span>`;

            tbody.innerHTML += `
                <tr>
                    <td>${p.titulo}</td>
                    <td>${formatMoney(p.valor)}</td>
                    <td>${status}</td>
                    <td>${acao}</td>
                </tr>`;
        });
    } catch(e) {}
}

async function liberar(id) {
    const code = prompt("Código:");
    if(!code) return;
    const res = await fetch(`${API_BASE}/projetos/${id}/liberar`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({codigo: code})
    });
    if(res.ok) { toast("Liberado!"); carregarDashboard(); }
    else toast("Código inválido", "error");
}

async function publicarAnuncio() {
    const titulo = document.getElementById('anun-titulo').value;
    const valor = document.getElementById('anun-valor').value;
    const cont = document.getElementById('anun-conteudo').value;
    const uid = localStorage.getItem('usuario_id');

    if(!titulo || !valor || !cont) return toast("Preencha tudo", "error");

    try {
        const res = await fetch(`${API_BASE}/projetos/`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                titulo, valor: parseFloat(valor), conteudo_digital: cont, vendedor_id: parseInt(uid)
            })
        });
        if(res.ok) { toast("Publicado!"); router('dashboard'); }
        else toast("Erro ao publicar", "error");
    } catch(e) {}
}

function switchDashTab(tab) {
    document.getElementById('tab-vendas').classList.add('hidden');
    document.getElementById('tab-compras').classList.add('hidden');
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    
    // Atualiza botões
    document.querySelectorAll('.dash-menu-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    if(tab === 'compras') {
        // Renderiza grid de compras dentro do dashboard
        const grid = document.getElementById('grid-meus-pedidos');
        // Reusa a lógica de carregar pedidos...
        carregarPedidos(); 
    }
}

async function carregarPedidos() {
    const uid = localStorage.getItem('usuario_id');
    const grid = document.getElementById('grid-meus-pedidos');
    grid.innerHTML = "<p>Carregando...</p>";
    
    try {
        const res = await fetch(`${API_BASE}/cliente/${uid}/meus-cursos`);
        const data = await res.json();
        grid.innerHTML = "";
        
        if(data.length === 0) {
            grid.innerHTML = "<p>Sem compras.</p>";
            return;
        }

        data.forEach(p => {
            grid.innerHTML += `
                <div class="product-card fade-in" style="border-top: 4px solid var(--primary);">
                    <div class="prod-img-box" style="height:120px;">
                        <img src="${getImagemProduto(p.titulo)}" class="prod-img">
                    </div>
                    <div class="prod-info">
                        <h3>${p.titulo}</h3>
                        <div style="background:#f0fdf4; padding:10px; border-radius:6px; margin-top:10px; font-size:13px; color:#166534; border:1px solid #bbf7d0;">
                            <strong>Entregue:</strong><br>${p.conteudo_digital}
                        </div>
                    </div>
                </div>`;
        });
    } catch(e) {}
}
