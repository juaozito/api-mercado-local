/**
 * RYZER SCRIPT - INTEGRAÇÃO COM BACKEND PYTHON
 */
const API_BASE = ''; // Endereço do seu FastAPI

// --- ROTEADOR ---
function router(tela) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    const sec = document.getElementById(`sec-${tela}`);
    if(sec) sec.classList.remove('hidden');

    const userId = localStorage.getItem('usuario_id');
    const navbar = document.getElementById('navbar');

    if (userId) {
        navbar.classList.remove('hidden');
        updateCartBadge();
        if (tela === 'loja') carregarLoja();
        if (tela === 'carrinho') renderCarrinho();
        if (tela === 'meus-pedidos') carregarMeusPedidos();
        if (tela === 'dashboard') carregarDashboard();
    } else {
        navbar.classList.add('hidden');
        if (tela !== 'login' && tela !== 'cadastro') router('login');
    }
}
window.onload = () => localStorage.getItem('usuario_id') ? router('loja') : router('login');

// --- UX (TOAST) ---
function toast(msg, tipo='success') {
    const box = document.getElementById('toast-box');
    const div = document.createElement('div');
    div.className = `toast ${tipo}`;
    div.innerHTML = `<i class="fas fa-${tipo==='success'?'check':'times'}-circle"></i> ${msg}`;
    box.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// --- AUTH (Rotas originais: /login/ e /usuarios/) ---
async function fazerLogin() {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    const msg = document.getElementById('msg-login');
    msg.innerText = "Conectando..."; 

    try {
        const response = await fetch(`${API_BASE}/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('usuario_id', data.usuario_id);
            localStorage.setItem('usuario_nome', data.nome);
            toast("Bem-vindo!");
            router('loja');
        } else {
            msg.innerText = "Erro: " + (data.detail || "Falha no login");
        }
    } catch (e) { msg.innerText = "Erro de conexão com o Python."; }
}

async function cadastrar() {
    const nome = document.getElementById('cad-nome').value;
    const email = document.getElementById('cad-email').value;
    const senha = document.getElementById('cad-senha').value;
    
    try {
        const response = await fetch(`${API_BASE}/usuarios/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });
        if (response.ok) { toast("Conta criada!"); router('login'); }
        else { 
            const err = await response.json(); 
            toast(err.detail || "Erro no cadastro", "error"); 
        }
    } catch (e) { toast("Erro de conexão", "error"); }
}

function logout() { localStorage.clear(); router('login'); }

// --- LOJA (Rota original: /projetos/) ---
let produtosCache = [];

async function carregarLoja() {
    const grid = document.getElementById('grid-produtos');
    grid.innerHTML = "<p style='padding:20px'>Carregando...</p>";

    try {
        const response = await fetch(`${API_BASE}/projetos/`);
        const data = await response.json();
        
        // Filtra status 'aberto' igual ao seu arquivo loja.js
        produtosCache = data.filter(p => p.status === 'aberto');
        renderizarGrid(produtosCache);
    } catch (e) { grid.innerHTML = "<p>Erro ao carregar. O servidor tá on?</p>"; }
}

function renderizarGrid(lista) {
    const grid = document.getElementById('grid-produtos');
    const termo = document.getElementById('campo-busca').value.toLowerCase();
    grid.innerHTML = "";

    const filtrados = lista.filter(p => p.titulo.toLowerCase().includes(termo));

    filtrados.forEach(p => {
        // Imagem placeholder pois seu DB não salva foto ainda
        const img = `https://placehold.co/400x400/181818/00bf63?text=${encodeURIComponent(p.titulo)}`;
        
        grid.innerHTML += `
            <div class="product-card fade-in">
                <div onclick="verDetalhes(${p.id})" style="cursor:pointer">
                    <div class="prod-img-container"><img src="${img}" class="prod-img"></div>
                    <div class="prod-title">${p.titulo}</div>
                    <div class="prod-price">R$ ${p.valor.toFixed(2)}</div>
                </div>
                <button onclick="addCart(${p.id})" class="btn-buy">Comprar</button>
            </div>`;
    });
}

function buscarProduto() { renderizarGrid(produtosCache); }

function verDetalhes(id) {
    const p = produtosCache.find(i => i.id === id);
    if(!p) return;
    document.getElementById('det-img-container').innerHTML = `<img src="https://placehold.co/600x400/181818/00bf63?text=${p.titulo}" style="max-width:100%">`;
    document.getElementById('det-titulo').innerText = p.titulo;
    document.getElementById('det-valor').innerText = `R$ ${p.valor.toFixed(2)}`;
    document.getElementById('det-desc').innerText = `Vendedor ID: ${p.vendedor_id}\nProduto garantido pela Ryzer.`;
    
    // Clona botão para limpar eventos anteriores
    const btn = document.getElementById('btn-add-cart-detail');
    const novoBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(novoBtn, btn);
    novoBtn.onclick = () => addCart(p.id);
    
    router('detalhes');
}

// --- CARRINHO ---
function addCart(id) {
    let cart = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    if(!cart.includes(id)) {
        cart.push(id);
        localStorage.setItem('ryzer_cart', JSON.stringify(cart));
        toast("Adicionado!");
    }
    updateCartBadge();
}

function updateCartBadge() {
    const count = (JSON.parse(localStorage.getItem('ryzer_cart')) || []).length;
    document.getElementById('cart-badge').innerText = count;
}

function renderCarrinho() {
    const lista = document.getElementById('lista-carrinho');
    const cartIds = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    lista.innerHTML = "";
    let total = 0;

    if(produtosCache.length === 0) { carregarLoja().then(renderCarrinho); return; }

    cartIds.forEach((id, idx) => {
        const p = produtosCache.find(i => i.id === id);
        if(p) {
            total += p.valor;
            lista.innerHTML += `
                <div class="cart-item">
                    <div><strong>${p.titulo}</strong></div>
                    <div>R$ ${p.valor.toFixed(2)} <span onclick="removeCart(${idx})" style="color:red;cursor:pointer;margin-left:10px;">X</span></div>
                </div>`;
        }
    });
    document.getElementById('cart-total').innerText = `R$ ${total.toFixed(2)}`;
}

function removeCart(idx) {
    let cart = JSON.parse(localStorage.getItem('ryzer_cart'));
    cart.splice(idx, 1);
    localStorage.setItem('ryzer_cart', JSON.stringify(cart));
    renderCarrinho(); updateCartBadge();
}

async function finalizarCompra() {
    const cart = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    if(cart.length === 0) return toast("Vazio", "error");
    if(!confirm("Confirmar compra?")) return;

    let codigos = [];
    for (let id of cart) {
        try {
            // Rota original do seu loja.js
            const res = await fetch(`${API_BASE}/projetos/${id}/pagar`, { method: 'POST' });
            if(res.ok) {
                const data = await res.json();
                codigos.push(data.codigo_verificacao);
            }
        } catch(e) { console.error(e); }
    }

    if(codigos.length > 0) {
        alert(`Sucesso! Seus códigos: \n${codigos.join('\n')}`);
        localStorage.setItem('ryzer_cart', JSON.stringify([]));
        updateCartBadge();
        router('meus-pedidos');
    }
}

// --- PEDIDOS (Rota original: /cliente/{id}/meus-cursos) ---
async function carregarMeusPedidos() {
    const uid = localStorage.getItem('usuario_id');
    const grid = document.getElementById('grid-meus-pedidos');
    
    try {
        const res = await fetch(`${API_BASE}/cliente/${uid}/meus-cursos`);
        const data = await res.json();
        grid.innerHTML = "";
        
        data.forEach(p => {
            // Campo 'conteudo_digital' igual ao seus_cursos.js
            grid.innerHTML += `
                <div class="product-card fade-in" style="border:2px solid green;">
                    <h4>${p.titulo}</h4>
                    <div style="background:#eee; padding:10px; margin:10px 0;">Conteúdo: ${p.conteudo_digital}</div>
                </div>`;
        });
    } catch(e) { console.error(e); }
}

// --- DASHBOARD (Rota original: /vendedor/{id}/total-vendas) ---
async function carregarDashboard() {
    const uid = localStorage.getItem('usuario_id');
    try {
        const resTotal = await fetch(`${API_BASE}/vendedor/${uid}/total-vendas`);
        const dataTotal = await resTotal.json();
        const total = dataTotal.total_vendas_concluidas || 0;
        document.getElementById('dash-total').innerText = `R$ ${total}`;

        // Carrega lista
        const resProjs = await fetch(`${API_BASE}/projetos/`);
        const projs = await resProjs.json();
        const meus = projs.filter(p => p.vendedor_id == uid || p.cliente_id == uid);
        
        const list = document.getElementById('lista-transacoes');
        list.innerHTML = "";
        meus.forEach(p => {
            let btn = "";
            if(p.status === 'pagamento_retido' && p.cliente_id == uid) {
                btn = `<button onclick="liberar(${p.id})" style="background:green; color:white;">Liberar</button>`;
            }
            list.innerHTML += `<div style="padding:10px; border-bottom:1px solid #ccc;">${p.titulo} - ${p.status} ${btn}</div>`;
        });
    } catch(e) { console.error(e); }
}

async function liberar(id) {
    const codigo = prompt("Código:");
    if(!codigo) return;
    const res = await fetch(`${API_BASE}/projetos/${id}/liberar`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({codigo})
    });
    if(res.ok) { toast("Liberado!"); carregarDashboard(); }
    else toast("Código inválido", "error");
}

// --- ANUNCIAR (Rota original: /projetos/) ---
async function publicarAnuncio() {
    const titulo = document.getElementById('anun-titulo').value;
    const valor = document.getElementById('anun-valor').value;
    const conteudo = document.getElementById('anun-conteudo').value; // CORREÇÃO: Usa conteudo_digital
    const uid = localStorage.getItem('usuario_id');

    if(!titulo || !valor || !conteudo) return toast("Preencha tudo", "error");

    try {
        const res = await fetch(`${API_BASE}/projetos/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                titulo, 
                valor: parseFloat(valor), 
                conteudo_digital: conteudo, // Campo ESSENCIAL para seu backend aceitar
                vendedor_id: parseInt(uid)
            })
        });
        if(res.ok) { toast("Anunciado!"); router('dashboard'); }
        else { 
            const err = await res.json();
            // Tratamento de erro do Pydantic (lista ou msg simples)
            const msg = err.detail && Array.isArray(err.detail) ? err.detail[0].msg : err.detail;
            toast("Erro: " + msg, "error"); 
        }
    } catch(e) { console.error(e); toast("Erro de conexão", "error"); }
}
