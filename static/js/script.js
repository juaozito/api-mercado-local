/** RYZER SCRIPT VAREJO PRO **/
const API_BASE = ''; // URL Relativa (Mesma origem)

// --- IMAGENS INTELIGENTES ---
function getImagemProduto(titulo) {
    const t = titulo.toLowerCase();
    if(t.includes('rtx') || t.includes('gtx') || t.includes('placa')) 
        return 'https://http2.mlstatic.com/D_NQ_NP_626737-MLA47780826229_102021-O.webp'; // Exemplo GPU
    if(t.includes('mouse')) 
        return 'https://resource.logitech.com/content/dam/gaming/en/products/g502-lightspeed-gaming-mouse/g502-lightspeed-gallery-1.png';
    if(t.includes('teclado')) 
        return 'https://resource.logitechg.com/w_692,c_lpad,ar_4:3,q_auto:best,f_auto,b_rgb:000000/content/dam/gaming/en/products/pro-x-keyboard/pro-x-keyboard-gallery-1.png';
    if(t.includes('monitor')) 
        return 'https://www.lg.com/br/images/monitores/md06155636/gallery/medium01.jpg';
    if(t.includes('processador') || t.includes('ryzen') || t.includes('intel')) 
        return 'https://m.media-amazon.com/images/I/51f2hkWjTlL._AC_UF894,1000_QL80_.jpg';
    
    // Fallback genérico bonito
    return `https://placehold.co/600x600/ffffff/333333?text=${encodeURIComponent(titulo.substring(0,15))}`;
}

// --- UTILITÁRIOS ---
function toast(msg, type='success') {
    const box = document.getElementById('toast-box');
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.innerHTML = type === 'success' ? `✅ ${msg}` : `⚠️ ${msg}`;
    box.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// --- ROTEADOR ---
function router(tela) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    const sec = document.getElementById(`sec-${tela}`);
    if(sec) sec.classList.remove('hidden');

    const uid = localStorage.getItem('usuario_id');
    const nav = document.getElementById('navbar');

    if (uid) {
        nav.classList.remove('hidden');
        updateBadge();
        if(tela === 'loja') carregarLoja();
        if(tela === 'carrinho') renderCarrinho();
        if(tela === 'dashboard') carregarDashboard();
        if(tela === 'meus-pedidos') carregarPedidos();
        if(tela === 'login' || tela === 'cadastro') router('loja');
    } else {
        nav.classList.add('hidden');
        if(tela !== 'login' && tela !== 'cadastro') router('login');
    }
}
window.onload = () => localStorage.getItem('usuario_id') ? router('loja') : router('login');

// --- AUTH ---
async function fazerLogin() {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    const msg = document.getElementById('msg-login');
    msg.innerText = "Verificando...";
    
    try {
        const res = await fetch(`${API_BASE}/login/`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, senha})
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('usuario_id', data.usuario_id);
            localStorage.setItem('usuario_nome', data.nome);
            toast(`Olá, ${data.nome}!`);
            router('loja');
        } else {
            msg.innerText = data.detail || "Erro no login";
        }
    } catch (e) { msg.innerText = "Erro de conexão"; }
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

function logout() { localStorage.clear(); router('login'); }

// --- LOJA ---
let cacheProds = [];
async function carregarLoja() {
    const grid = document.getElementById('grid-produtos');
    grid.innerHTML = "<p>Carregando...</p>";
    try {
        const res = await fetch(`${API_BASE}/projetos/`);
        const data = await res.json();
        cacheProds = data.filter(p => p.status === 'aberto');
        renderGrid(cacheProds);
    } catch (e) { grid.innerHTML = "Erro ao carregar loja."; }
}

function renderGrid(lista) {
    const grid = document.getElementById('grid-produtos');
    const busca = document.getElementById('campo-busca').value.toLowerCase();
    grid.innerHTML = "";
    
    const filtrados = lista.filter(p => p.titulo.toLowerCase().includes(busca));
    
    if(filtrados.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:30px;">Nada encontrado. <a onclick="router('anunciar')" style="color:blue;cursor:pointer">Venda algo!</a></p>`;
        return;
    }

    filtrados.forEach(p => {
        const img = getImagemProduto(p.titulo);
        grid.innerHTML += `
            <div class="product-card">
                <div class="prod-img-box" onclick="verDetalhes(${p.id})" style="cursor:pointer">
                    <img src="${img}" class="prod-img">
                </div>
                <div class="prod-info">
                    <h3>${p.titulo}</h3>
                    <div class="old-price">R$ ${(p.valor * 1.3).toFixed(2)}</div>
                    <div class="prod-price">R$ ${p.valor.toFixed(2)}</div>
                    <span class="prod-pix">à vista no PIX</span>
                </div>
                <button onclick="addCart(${p.id})" class="btn-cart">
                    <i class="fas fa-cart-plus"></i> Comprar
                </button>
            </div>`;
    });
}
function buscarProduto() { renderGrid(cacheProds); }

function verDetalhes(id) {
    const p = cacheProds.find(i => i.id === id);
    if(!p) return;
    document.getElementById('det-img-container').innerHTML = `<img src="${getImagemProduto(p.titulo)}" style="max-width:100%; max-height:350px;">`;
    document.getElementById('det-titulo').innerText = p.titulo;
    document.getElementById('det-valor').innerText = `R$ ${p.valor.toFixed(2)}`;
    document.getElementById('det-desc').innerText = `Vendedor ID: #${p.vendedor_id}\n\nGarantia Ryzer de 7 dias.\nEntrega digital imediata após confirmação do pagamento.`;
    
    const btn = document.getElementById('btn-add-cart-detail');
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.onclick = () => { addCart(p.id); toast("Adicionado!"); };
    
    router('detalhes');
}

// --- CARRINHO ---
function addCart(id) {
    let cart = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    if(!cart.includes(id)) {
        cart.push(id);
        localStorage.setItem('ryzer_cart', JSON.stringify(cart));
        toast("Adicionado ao carrinho!");
        updateBadge();
    }
}
function updateBadge() {
    const count = (JSON.parse(localStorage.getItem('ryzer_cart')) || []).length;
    document.getElementById('cart-badge').innerText = count;
}

function renderCarrinho() {
    const lista = document.getElementById('lista-carrinho');
    const cart = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    lista.innerHTML = "";
    let total = 0;
    
    if(cart.length === 0) { 
        lista.innerHTML = "<p style='text-align:center; padding:30px;'>Carrinho vazio.</p>"; 
        document.getElementById('cart-subtotal').innerText = "R$ 0,00";
        document.getElementById('cart-total').innerText = "R$ 0,00";
        return; 
    }

    if(cacheProds.length === 0) { carregarLoja().then(renderCarrinho); return; }

    cart.forEach((id, idx) => {
        const p = cacheProds.find(i => i.id === id);
        if(p) {
            total += p.valor;
            lista.innerHTML += `
                <div class="cart-item">
                    <img src="${getImagemProduto(p.titulo)}">
                    <div style="flex:1;">
                        <strong>${p.titulo}</strong><br>
                        <small>Vendedor #${p.vendedor_id}</small>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:bold; color:var(--primary); font-size:18px;">R$ ${p.valor.toFixed(2)}</div>
                        <a onclick="remCart(${idx})" style="color:red; cursor:pointer; font-size:12px;">Remover</a>
                    </div>
                </div>`;
        }
    });
    document.getElementById('cart-subtotal').innerText = `R$ ${total.toFixed(2)}`;
    document.getElementById('cart-total').innerText = `R$ ${total.toFixed(2)}`;
}
function remCart(idx) {
    let cart = JSON.parse(localStorage.getItem('ryzer_cart'));
    cart.splice(idx, 1);
    localStorage.setItem('ryzer_cart', JSON.stringify(cart));
    renderCarrinho(); updateBadge();
}

async function finalizarCompra() {
    const cart = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    if(cart.length === 0) return toast("Carrinho vazio", "error");
    if(!confirm("Confirmar compra?")) return;
    
    let codes = [];
    for (let id of cart) {
        try {
            const res = await fetch(`${API_BASE}/projetos/${id}/pagar`, {method: 'POST'});
            if(res.ok) { const d = await res.json(); codes.push(d.codigo_verificacao); }
        } catch(e) {}
    }
    if(codes.length > 0) {
        alert(`Sucesso! Códigos de liberação: \n${codes.join('\n')}`);
        localStorage.setItem('ryzer_cart', JSON.stringify([]));
        updateBadge();
        router('meus-pedidos');
    }
}

// --- ANUNCIAR ---
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
        if(res.ok) { toast("Anunciado!"); router('dashboard'); }
        else toast("Erro ao publicar", "error");
    } catch(e) {}
}

// --- DASHBOARD & PEDIDOS ---
async function carregarDashboard() {
    const uid = localStorage.getItem('usuario_id');
    try {
        const res = await fetch(`${API_BASE}/vendedor/${uid}/total-vendas`);
        const data = await res.json();
        document.getElementById('dash-total').innerText = `R$ ${(data.total_vendas_concluidas || 0).toFixed(2)}`;
        
        const res2 = await fetch(`${API_BASE}/projetos/`);
        const prods = await res2.json();
        const meus = prods.filter(p => p.vendedor_id == uid || p.cliente_id == uid);
        
        const tbody = document.getElementById('lista-transacoes');
        tbody.innerHTML = "";
        meus.forEach(p => {
            let acao = "";
            let statusStyle = "color:#555;";
            if(p.status === 'pagamento_retido') statusStyle = "color:orange; font-weight:bold;";
            if(p.status === 'finalizado') statusStyle = "color:green; font-weight:bold;";
            
            if(p.status === 'pagamento_retido' && p.cliente_id == uid) {
                acao = `<button onclick="liberar(${p.id})" style="padding:5px 10px; background:var(--primary); color:white; border:none; border-radius:4px; cursor:pointer;">Liberar</button>`;
            }
            
            tbody.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid #eee;">
                    <div><strong>${p.titulo}</strong><br><small>${p.vendedor_id == uid ? 'Venda' : 'Compra'}</small></div>
                    <div style="text-align:right;">
                        <div>R$ ${p.valor.toFixed(2)}</div>
                        <div style="${statusStyle}">${p.status.toUpperCase()}</div>
                        ${acao}
                    </div>
                </div>`;
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
    else toast("Código errado", "error");
}

async function carregarPedidos() {
    const uid = localStorage.getItem('usuario_id');
    const grid = document.getElementById('grid-meus-pedidos');
    try {
        const res = await fetch(`${API_BASE}/cliente/${uid}/meus-cursos`);
        const data = await res.json();
        grid.innerHTML = "";
        if(data.length === 0) grid.innerHTML = "<p>Nenhuma compra ainda.</p>";
        data.forEach(p => {
            grid.innerHTML += `
                <div class="product-card" style="border-top: 4px solid var(--primary);">
                    <div class="prod-img-box" style="height:120px;">
                        <img src="${getImagemProduto(p.titulo)}" class="prod-img">
                    </div>
                    <div class="prod-info">
                        <h3>${p.titulo}</h3>
                        <p style="font-size:13px; background:#f4f4f4; padding:10px; border-radius:6px; margin-top:10px; word-break:break-all;">
                            <strong>Entregue:</strong> ${p.conteudo_digital}
                        </p>
                    </div>
                </div>`;
        });
    } catch(e) {}
}
