/**
 * RYZER ENTERPRISE - JAVASCRIPT CORE v7.0
 * Integração: Backend Render + SweetAlert2 (Visual Pro)
 */

// SEU BACKEND ONLINE
const API_BASE = 'https://api-mercado-local.onrender.com'; 

// --- CONFIGURAÇÃO VISUAL (SweetAlert) ---
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

// --- UTILS ---
function formatMoney(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function getImagemProduto(titulo) {
    if (!titulo) return 'https://placehold.co/600x600/eee/ccc?text=Ryzer';
    const t = titulo.toLowerCase();
    
    if(t.includes('rtx') || t.includes('gtx')) return 'https://m.media-amazon.com/images/I/71tDu30-mZL._AC_SL1500_.jpg';
    if(t.includes('ryzen') || t.includes('intel')) return 'https://m.media-amazon.com/images/I/51f2hkWjTlL._AC_SL1000_.jpg';
    if(t.includes('memória') || t.includes('ram')) return 'https://m.media-amazon.com/images/I/61p3lA4N3uL._AC_SL1134_.jpg';
    if(t.includes('ssd') || t.includes('nvme')) return 'https://m.media-amazon.com/images/I/71F9+Wc-kOL._AC_SL1500_.jpg';
    if(t.includes('mouse')) return 'https://resource.logitech.com/content/dam/gaming/en/products/g502-lightspeed-gaming-mouse/g502-lightspeed-gallery-1.png';
    if(t.includes('teclado')) return 'https://resource.logitechg.com/w_692,c_lpad,ar_4:3,q_auto:best,f_auto,b_rgb:000000/content/dam/gaming/en/products/pro-x-keyboard/pro-x-keyboard-gallery-1.png';
    if(t.includes('monitor')) return 'https://www.lg.com/br/images/monitores/md06155636/gallery/medium01.jpg';
    if(t.includes('headset')) return 'https://m.media-amazon.com/images/I/61CGHv6kmWL._AC_SL1000_.jpg';
    if(t.includes('curso') || t.includes('python')) return 'https://placehold.co/600x600/00bf63/ffffff?text=Curso+Dev';
    
    return `https://placehold.co/600x600/f8f9fa/333333?text=${encodeURIComponent(titulo.substring(0,10))}`;
}

// --- ROTEADOR ---
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
        
        document.getElementById('user-name-display').innerText = localStorage.getItem('usuario_nome') || 'Cliente';

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

window.onload = () => localStorage.getItem('usuario_id') ? router('loja') : router('login');

function toggleMenu() {
    Swal.fire({
        icon: 'info',
        title: 'Versão Mobile',
        text: 'O menu responsivo está sendo otimizado para sua experiência.',
        confirmButtonColor: '#00bf63'
    });
}

// --- AUTH ---
async function fazerLogin() {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;

    if (!email || !senha) return Toast.fire({ icon: 'warning', title: 'Preencha todos os campos' });

    // Loading bonito
    Swal.fire({
        title: 'Conectando...',
        didOpen: () => { Swal.showLoading() }
    });

    try {
        const res = await fetch(`${API_BASE}/login/`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, senha})
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('usuario_id', data.usuario_id);
            localStorage.setItem('usuario_nome', data.nome);
            Swal.close(); // Fecha loading
            
            Toast.fire({ icon: 'success', title: `Bem-vindo, ${data.nome}!` });
            router('loja');
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Acesso Negado',
                text: data.detail || 'E-mail ou senha incorretos',
                confirmButtonColor: '#ff3b30'
            });
        }
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Erro de Conexão', text: 'O servidor parece estar offline.' });
    }
}

async function cadastrar() {
    const nome = document.getElementById('cad-nome').value;
    const email = document.getElementById('cad-email').value;
    const senha = document.getElementById('cad-senha').value;
    
    if (!nome || !email || !senha) return Toast.fire({ icon: 'warning', title: 'Preencha todos os campos' });

    Swal.showLoading();

    try {
        const res = await fetch(`${API_BASE}/usuarios/`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({nome, email, senha})
        });
        if (res.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Conta Criada!',
                text: 'Faça login para começar a comprar e vender.',
                confirmButtonColor: '#00bf63'
            }).then(() => router('login'));
        } else { 
            const err = await res.json();
            Swal.fire({ icon: 'error', title: 'Erro', text: err.detail });
        }
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Erro de Conexão', text: 'Tente novamente mais tarde.' });
    }
}

function logout() {
    Swal.fire({
        title: 'Sair da conta?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, sair'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.clear();
            location.reload();
        }
    });
}

// --- LOJA ---
let produtosCache = [];

async function carregarLoja() {
    const grid = document.getElementById('grid-produtos');
    grid.innerHTML = '<div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div>';

    try {
        const res = await fetch(`${API_BASE}/projetos/`);
        const data = await res.json();
        produtosCache = data.filter(p => p.status === 'aberto');
        renderGrid(produtosCache);
    } catch (e) {
        grid.innerHTML = '<p class="text-center">Erro ao carregar loja.</p>';
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
                    <div class="old-price">R$ ${(p.valor * 1.3).toFixed(2)}</div>
                    <span class="prod-price">${formatMoney(p.valor)}</span>
                    <span class="payment-info">à vista no PIX</span>
                </div>
                <button onclick="addCart(${p.id})" class="btn-cart">
                    <i class="fas fa-cart-plus"></i> COMPRAR
                </button>
            </div>`;
    });
}

function buscarProduto() { renderGrid(produtosCache); }
function filtrarCategoria(cat) { 
    Toast.fire({ icon: 'info', title: `Filtrando por: ${cat.toUpperCase()}` });
    renderGrid(produtosCache); 
}

// --- DETALHES ---
function verDetalhes(id) {
    const p = produtosCache.find(i => i.id === id);
    if (!p) return;

    document.getElementById('det-img-container').innerHTML = `<img src="${getImagemProduto(p.titulo)}" style="width: 100%; border-radius: 12px;">`;
    document.getElementById('det-titulo').innerText = p.titulo;
    document.getElementById('det-valor').innerText = formatMoney(p.valor);
    document.getElementById('det-desc').innerText = `Vendedor ID: #${p.vendedor_id}\n\nProduto verificado Ryzer.\nGarantia de entrega via sistema de Escrow (Pagamento seguro).`;
    
    const btn = document.getElementById('btn-add-cart-detail');
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.onclick = () => { addCart(p.id); };

    router('detalhes');
}

// --- CARRINHO ---
function addCart(id) {
    let cart = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    if (!cart.includes(id)) {
        cart.push(id);
        localStorage.setItem('ryzer_cart', JSON.stringify(cart));
        updateCartBadge();
        Toast.fire({ icon: 'success', title: 'Adicionado ao carrinho!' });
    } else {
        Toast.fire({ icon: 'warning', title: 'Item já está no carrinho' });
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
            const img = getImagemProduto(p.titulo);
            container.innerHTML += `
                <div class="cart-item fade-in">
                    <img src="${img}">
                    <div style="flex:1">
                        <strong>${p.titulo}</strong><br>
                        <small>Vendedor #${p.vendedor_id}</small>
                    </div>
                    <div class="text-right">
                        <div style="color:var(--primary); font-weight:bold;">${formatMoney(p.valor)}</div>
                        <button onclick="removeCart(${idx})" style="color:#ff3b30; font-size:12px; margin-top:5px; text-decoration:underline;">Remover</button>
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
}

async function finalizarCompra() {
    const cart = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    if (cart.length === 0) return Toast.fire({ icon: 'warning', title: 'Carrinho vazio' });
    
    // CONFIRMAÇÃO BONITA
    const result = await Swal.fire({
        title: 'Confirmar Compra?',
        text: `Você está comprando ${cart.length} itens.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#00bf63',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, comprar agora!'
    });

    if (!result.isConfirmed) return;

    Swal.fire({ title: 'Processando...', didOpen: () => Swal.showLoading() });

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
        localStorage.setItem('ryzer_cart', JSON.stringify([]));
        updateCartBadge();
        
        Swal.fire({
            icon: 'success',
            title: 'Compra Realizada!',
            html: `Seus códigos de acesso:<br><b>${codes.join('<br>')}</b><br><br>Eles foram salvos em "Meus Pedidos".`,
            confirmButtonColor: '#00bf63'
        }).then(() => router('meus-pedidos'));
    } else {
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível finalizar a compra.' });
    }
}

// --- DASHBOARD ---
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
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhuma transação.</td></tr>';
            return;
        }

        meus.forEach(p => {
            let acao = "-";
            let statusBadge = `<span class="status-badge status-info">${p.status}</span>`;

            if (p.status === 'pagamento_retido') {
                statusBadge = `<span class="status-badge status-pending">Pendente</span>`;
                if (p.cliente_id == uid) {
                    acao = `<button onclick="liberarPagamento(${p.id})" style="color:#007bff; font-weight:bold;">Liberar Pagamento</button>`;
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
    // INPUT BONITO PARA O CÓDIGO
    const { value: codigo } = await Swal.fire({
        title: 'Liberar Pagamento',
        input: 'text',
        inputLabel: 'Digite o código recebido do vendedor/sistema',
        inputPlaceholder: 'Código aqui...',
        showCancelButton: true,
        confirmButtonColor: '#00bf63'
    });

    if (!codigo) return;

    try {
        const res = await fetch(`${API_BASE}/projetos/${id}/liberar`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo: codigo })
        });
        if (res.ok) { 
            Swal.fire('Sucesso!', 'Pagamento liberado ao vendedor.', 'success'); 
            carregarDashboard(); 
        } else { 
            Swal.fire('Erro', 'Código inválido.', 'error'); 
        }
    } catch (e) { Swal.fire('Erro', 'Falha na conexão.', 'error'); }
}

async function publicarAnuncio() {
    const titulo = document.getElementById('anun-titulo').value;
    const valor = document.getElementById('anun-valor').value;
    const conteudo = document.getElementById('anun-conteudo').value;
    const uid = localStorage.getItem('usuario_id');

    if (!titulo || !valor || !conteudo) return Toast.fire({ icon: 'warning', title: 'Preencha tudo!' });

    Swal.showLoading();

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
            Swal.fire({
                icon: 'success',
                title: 'Anúncio Publicado!',
                confirmButtonColor: '#00bf63'
            }).then(() => router('dashboard'));
        } else { 
            const err = await res.json();
            Swal.fire('Erro', err.detail || 'Falha ao publicar', 'error'); 
        }
    } catch (e) { Swal.fire('Erro', 'Conexão falhou', 'error'); }
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
                            <strong style="display:block; margin-bottom:5px;">📦 ACESSO / CÓDIGO:</strong>
                            <span style="font-family:monospace; user-select:all;">${p.conteudo_digital}</span>
                        </div>
                    </div>
                </div>`;
        });
    } catch (e) { Toast.fire({ icon: 'error', title: 'Erro ao carregar pedidos' }); }
}
