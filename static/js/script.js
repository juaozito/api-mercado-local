/** RYZER SCRIPT v3 - PRO DESIGN **/
const API_BASE = '';

// --- ROTAS ---
function router(tela) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`sec-${tela}`).classList.remove('hidden');
    
    const uid = localStorage.getItem('usuario_id');
    const nav = document.getElementById('navbar');
    
    if (uid) {
        nav.classList.remove('hidden');
        updateBadge();
        if(tela === 'loja') carregarLoja();
        if(tela === 'dashboard') carregarDashboard();
        if(tela === 'carrinho') renderCarrinho();
        if(tela === 'meus-pedidos') carregarPedidos();
    } else {
        nav.classList.add('hidden');
        if(tela !== 'login' && tela !== 'cadastro') router('login');
    }
}
window.onload = () => localStorage.getItem('usuario_id') ? router('loja') : router('login');

// --- UX ---
function toast(msg, type='success') {
    const box = document.getElementById('toast-box');
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.innerHTML = type === 'success' ? `✅ ${msg}` : `⚠️ ${msg}`;
    box.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

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
            toast("Bem-vindo de volta!");
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
        else toast("Erro ao cadastrar", "error");
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
    
    filtrados.forEach(p => {
        // Imagem placeholder bonita com o nome do produto
        const img = `https://placehold.co/400x300/121212/00bf63?text=${encodeURIComponent(p.titulo)}`;
        
        grid.innerHTML += `
            <div class="product-card">
                <img src="${img}" class="prod-img">
                <div class="prod-info">
                    <h3>${p.titulo}</h3>
                    <div class="prod-price">R$ ${p.valor.toFixed(2)}</div>
                </div>
                <button onclick="addCart(${p.id})" class="btn-primary" style="height:40px; margin-top:10px;">Comprar</button>
            </div>`;
    });
}
function buscarProduto() { renderGrid(cacheProds); }

// --- CARRINHO ---
function addCart(id) {
    let cart = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    if(!cart.includes(id)) {
        cart.push(id);
        localStorage.setItem('ryzer_cart', JSON.stringify(cart));
        toast("Adicionado ao carrinho");
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
    
    if(cacheProds.length === 0) { carregarLoja().then(renderCarrinho); return; }

    cart.forEach((id, idx) => {
        const p = cacheProds.find(i => i.id === id);
        if(p) {
            total += p.valor;
            lista.innerHTML += `
                <div class="stat-card" style="flex-direction:row; justify-content:space-between; align-items:center; margin-bottom:15px; padding:15px;">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <img src="https://placehold.co/50x50/111/00bf63" style="border-radius:6px;">
                        <div><strong>${p.titulo}</strong><br><small>R$ ${p.valor.toFixed(2)}</small></div>
                    </div>
                    <button onclick="remCart(${idx})" style="color:red; border:none; background:none;">Remover</button>
                </div>`;
        }
    });
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
        alert(`Sucesso! Códigos: \n${codes.join('\n')}`);
        localStorage.setItem('ryzer_cart', JSON.stringify([]));
        updateBadge();
        router('meus-pedidos');
    }
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
            let statusBadge = `<span class="badge pending">${p.status}</span>`;
            if(p.status === 'finalizado') statusBadge = `<span class="badge paid">Pago</span>`;
            if(p.status === 'pagamento_retido' && p.cliente_id == uid) {
                acao = `<button onclick="liberar(${p.id})" style="padding:5px 10px; border:1px solid var(--primary); border-radius:4px; background:white; color:var(--primary);">Liberar</button>`;
            }
            
            tbody.innerHTML += `
                <tr>
                    <td><strong>${p.titulo}</strong></td>
                    <td>${p.vendedor_id == uid ? 'Venda' : 'Compra'}</td>
                    <td>R$ ${p.valor.toFixed(2)}</td>
                    <td>${statusBadge}</td>
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
    else toast("Código errado", "error");
}

async function carregarPedidos() {
    const uid = localStorage.getItem('usuario_id');
    const grid = document.getElementById('grid-meus-pedidos');
    try {
        const res = await fetch(`${API_BASE}/cliente/${uid}/meus-cursos`);
        const data = await res.json();
        grid.innerHTML = "";
        data.forEach(p => {
            grid.innerHTML += `
                <div class="product-card" style="border-top: 4px solid var(--primary);">
                    <div class="prod-info">
                        <h3>${p.titulo}</h3>
                        <p style="font-size:13px; color:#555; background:#f4f4f4; padding:10px; margin-top:10px; border-radius:6px;">
                            <strong>Entregue:</strong><br>${p.conteudo_digital}
                        </p>
                    </div>
                </div>`;
        });
    } catch(e) {}
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
