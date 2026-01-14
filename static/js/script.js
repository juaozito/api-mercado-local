/**
 * RYZER ULTIMATE - SCRIPT DE INTEGRAÇÃO
 * Conecta o visual novo ao Backend Python existente.
 */

// Se o backend estiver rodando em outra porta, mude aqui. 
// Se estiver usando o live server do VSCode junto com o Python, geralmente é a URL completa.
// Deixei vazio '' para assumir a mesma origem ou use 'http://127.0.0.1:8000' se der erro de CORS/Conexão.
const API_BASE = 'http://127.0.0.1:8000'; 

// --- 1. ROTEADOR (NAVEGAÇÃO) ---
function router(tela) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    
    const sec = document.getElementById(`sec-${tela}`);
    if(sec) sec.classList.remove('hidden');

    // Fecha menu mobile
    const menu = document.getElementById('menu-itens');
    if(menu) menu.classList.remove('active');

    const userId = localStorage.getItem('usuario_id');
    const navbar = document.getElementById('navbar');

    if (userId) {
        navbar.classList.remove('hidden');
        updateCartBadge();
        
        // Carrega dados dinâmicos do Python dependendo da tela
        if (tela === 'loja') carregarLoja();
        if (tela === 'carrinho') renderCarrinho();
        if (tela === 'meus-pedidos') carregarMeusPedidos();
        if (tela === 'dashboard') carregarDashboard();

        // Se tentar ir pra login logado, joga pra loja
        if (tela === 'login' || tela === 'cadastro') router('loja');
    } else {
        navbar.classList.add('hidden');
        if (tela !== 'login' && tela !== 'cadastro') router('login');
    }
}

function toggleMenu() {
    document.getElementById('menu-itens').classList.toggle('active');
}

window.onload = () => localStorage.getItem('usuario_id') ? router('loja') : router('login');

// --- 2. SISTEMA DE TOAST (NOTIFICAÇÕES VISUAIS) ---
function toast(msg, tipo='success') {
    const box = document.getElementById('toast-box');
    const div = document.createElement('div');
    div.className = `toast ${tipo}`;
    div.innerHTML = tipo === 'success' 
        ? `<i class="fas fa-check-circle" style="color:var(--ryzer-green)"></i> ${msg}` 
        : `<i class="fas fa-times-circle" style="color:#ff3b30"></i> ${msg}`;
    box.appendChild(div);
    setTimeout(() => div.remove(), 3500);
}

// --- 3. AUTENTICAÇÃO (CONECTADO AO PYTHON) ---
async function fazerLogin() {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    const msg = document.getElementById('msg-login');
    
    msg.innerText = "Conectando ao servidor..."; 

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
            toast(`Bem-vindo, ${data.nome}!`);
            router('loja');
        } else {
            msg.innerText = "❌ " + (data.detail || "Login falhou.");
        }
    } catch (error) {
        console.error(error);
        msg.innerText = "❌ Erro de conexão com o Python.";
    }
}

async function cadastrar() {
    const nome = document.getElementById('cad-nome').value;
    const email = document.getElementById('cad-email').value;
    const senha = document.getElementById('cad-senha').value;
    
    if(!nome || !email || !senha) return toast("Preencha tudo", "error");

    try {
        const response = await fetch(`${API_BASE}/usuarios/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        if (response.ok) {
            toast("Conta criada! Faça login.");
            router('login');
        } else {
            const erro = await response.json();
            toast("Erro: " + (erro.detail || "Falha no cadastro"), "error");
        }
    } catch (error) {
        toast("Erro ao conectar ao servidor", "error");
    }
}

function logout() {
    localStorage.clear();
    router('login');
}

// --- 4. LOJA (BUSCA DO PYTHON) ---
let catAtual = 'todos';
let produtosCache = []; // Guarda os produtos para filtrar sem chamar a API toda hora

function filtrar(cat) {
    catAtual = cat;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderizarGrid(produtosCache); // Filtra o cache local
}

async function carregarLoja() {
    const grid = document.getElementById('grid-produtos');
    grid.innerHTML = "<p style='padding:20px'>Carregando vitrine...</p>";

    try {
        const response = await fetch(`${API_BASE}/projetos/`);
        const data = await response.json();
        
        // Filtra apenas status 'aberto' e guarda em cache
        produtosCache = data.filter(p => p.status === 'aberto');
        renderizarGrid(produtosCache);

    } catch (error) {
        grid.innerHTML = "<p style='padding:20px; color:red'>Erro ao carregar produtos. O Backend está rodando?</p>";
        console.error(error);
    }
}

function renderizarGrid(listaProdutos) {
    const grid = document.getElementById('grid-produtos');
    const termo = document.getElementById('campo-busca').value.toLowerCase();
    grid.innerHTML = "";

    // Como o backend original não tem campo "categoria", vamos simular ou mostrar tudo
    // Se você adicionou categoria no backend, ajuste aqui (ex: p.categoria)
    const filtrados = listaProdutos.filter(p => {
        // Filtro de texto básico
        return p.titulo.toLowerCase().includes(termo);
    });

    if(filtrados.length === 0) {
        grid.innerHTML = "<p style='padding:20px'>Nenhum produto encontrado.</p>";
        return;
    }

    filtrados.forEach(p => {
        // Usa imagem placeholder se não tiver imagem real
        // O backend antigo não tinha campo imagem, então usamos um padrão bonito
        const imgUrl = "https://placehold.co/400x400/181818/00bf63?text=Ryzer+Product"; 

        grid.innerHTML += `
            <div class="product-card fade-in">
                <div onclick="verDetalhes(${p.id})" style="cursor:pointer">
                    <div class="prod-img-container"><img src="${imgUrl}" class="prod-img"></div>
                    <div class="prod-title">${p.titulo}</div>
                    <div class="prod-price">R$ ${p.valor.toFixed(2)}</div>
                </div>
                <button onclick="addCart(${p.id})" class="btn-buy">
                    <i class="fas fa-cart-plus"></i> Comprar
                </button>
            </div>`;
    });
}

function buscarProduto() {
    renderizarGrid(produtosCache);
}

function verDetalhes(id) {
    const p = produtosCache.find(i => i.id === id);
    if(!p) return;

    document.getElementById('det-img-container').innerHTML = `<img src="https://placehold.co/600x400/181818/00bf63?text=${encodeURIComponent(p.titulo)}" style="max-width:100%; border-radius:10px;">`;
    document.getElementById('det-titulo').innerText = p.titulo;
    document.getElementById('det-valor').innerText = `R$ ${p.valor.toFixed(2)}`;
    // O backend chama de 'conteudo_digital', mas só mostramos isso após a compra? 
    // Na vitrine, geralmente mostramos descrição. Como não tem, usamos um texto padrão.
    document.getElementById('det-desc').innerText = `Produto digital/físico verificado pela Ryzer. \nVendedor ID: ${p.vendedor_id}`;
    
    const btn = document.getElementById('btn-add-cart-detail');
    btn.onclick = () => { addCart(p.id); };
    
    router('detalhes');
}

// --- 5. CARRINHO (LocalStorage -> Python Batch) ---
function addCart(id) {
    let cart = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    
    // Evita duplicados se o backend não suportar
    if(cart.includes(id)) return toast("Este item já está no carrinho.", "error");

    cart.push(id);
    localStorage.setItem('ryzer_cart', JSON.stringify(cart));
    updateCartBadge();
    toast("Adicionado ao carrinho!");
}

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    const badge = document.getElementById('cart-badge');
    if(badge) badge.innerText = cart.length;
}

function renderCarrinho() {
    const lista = document.getElementById('lista-carrinho');
    const cartIds = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    lista.innerHTML = "";
    
    if(cartIds.length === 0) {
        lista.innerHTML = "<p style='text-align:center; padding:30px; color:#888'>Seu carrinho está vazio.</p>";
        document.getElementById('cart-subtotal').innerText = "R$ 0,00";
        document.getElementById('cart-total').innerText = "R$ 0,00";
        return;
    }

    let total = 0;
    
    // Precisamos achar os detalhes dos produtos que estão no carrinho (usando o cache da loja)
    // Se o cache estiver vazio (deu F5 na página do carrinho), buscamos de novo
    if(produtosCache.length === 0) {
        fetch(`${API_BASE}/projetos/`).then(r => r.json()).then(data => {
            produtosCache = data;
            renderCarrinho(); // Chama recursivo agora com dados
        });
        return;
    }

    cartIds.forEach((id, idx) => {
        const p = produtosCache.find(i => i.id === id); // Busca no cache global ou nos 'abertos'
        // Nota: se o produto foi vendido para outro enquanto estava no carrinho, ele pode não aparecer aqui
        // O ideal seria um endpoint /projetos/{id}, mas usaremos o cache por enquanto.
        
        if(p) {
            total += p.valor;
            lista.innerHTML += `
                <div class="cart-item fade-in">
                    <div style="display:flex; align-items:center; gap:15px">
                        <div style="font-weight:bold; font-size:18px;">${idx + 1}.</div>
                        <div><strong>${p.titulo}</strong><br><small>Vendedor #${p.vendedor_id}</small></div>
                    </div>
                    <div style="text-align:right">
                        <div style="font-weight:bold; color:var(--ryzer-green)">R$ ${p.valor.toFixed(2)}</div>
                        <small onclick="removeCart(${idx})" style="color:red; cursor:pointer; text-decoration:underline;">Remover</small>
                    </div>
                </div>`;
        }
    });
    
    document.getElementById('cart-subtotal').innerText = `R$ ${total.toFixed(2)}`;
    document.getElementById('cart-total').innerText = `R$ ${total.toFixed(2)}`;
}

function removeCart(idx) {
    let cart = JSON.parse(localStorage.getItem('ryzer_cart'));
    cart.splice(idx, 1);
    localStorage.setItem('ryzer_cart', JSON.stringify(cart));
    renderCarrinho();
    updateCartBadge();
}

/**
 * FINALIZAR COMPRA
 * Loopa pelos itens do carrinho e chama a API para cada um.
 */
async function finalizarCompra() {
    const cartIds = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    if(cartIds.length === 0) return toast("Carrinho vazio!", "error");
    
    const btn = document.querySelector('#sec-carrinho .btn-buy');
    btn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Processando...";
    btn.disabled = true;

    // Array para guardar os códigos de liberação
    let codigos = [];
    let erros = 0;

    for (let id of cartIds) {
        try {
            const response = await fetch(`${API_BASE}/projetos/${id}/pagar`, { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                codigos.push(`Item #${id}: ${data.codigo_verificacao}`);
            } else {
                erros++;
            }
        } catch (e) {
            erros++;
            console.error(e);
        }
    }

    if (codigos.length > 0) {
        alert(`✅ Compra Realizada!\n\nGuarde seus códigos de liberação:\n\n${codigos.join('\n')}\n\nVocê precisará deles para liberar o pagamento.`);
        localStorage.setItem('ryzer_cart', JSON.stringify([])); // Limpa carrinho
        updateCartBadge();
        router('meus-pedidos');
    } else {
        toast("Erro ao processar compras. Tente novamente.", "error");
    }

    btn.innerText = "Finalizar Pedido";
    btn.disabled = false;
}

// --- 6. MEUS PEDIDOS (CLIENTE) ---
async function carregarMeusPedidos() {
    const uid = localStorage.getItem('usuario_id');
    const grid = document.getElementById('grid-meus-pedidos');
    grid.innerHTML = "Carregando...";

    try {
        // A rota que você enviou: /cliente/{id}/meus-cursos
        const response = await fetch(`${API_BASE}/cliente/${uid}/meus-cursos`);
        const meusProjetos = await response.json();

        grid.innerHTML = "";
        if(meusProjetos.length === 0) {
            grid.innerHTML = "<p>Você ainda não comprou nada.</p>";
            return;
        }

        meusProjetos.forEach(p => {
            grid.innerHTML += `
                <div class="product-card fade-in" style="border-top:4px solid var(--ryzer-green)">
                    <h4>${p.titulo}</h4>
                    <div style="background:#f0f2f5; padding:10px; border-radius:6px; margin:10px 0; font-size:13px; font-family:monospace; word-break:break-all;">
                        <strong>Conteúdo:</strong><br>${p.conteudo_digital}
                    </div>
                    <div style="color:var(--ryzer-green); font-weight:bold; font-size:14px;">✅ Acesso Liberado</div>
                </div>`;
        });

    } catch (e) {
        console.error(e);
        grid.innerHTML = "Erro ao carregar pedidos.";
    }
}

// --- 7. DASHBOARD (VENDEDOR) ---
async function carregarDashboard() {
    const uid = localStorage.getItem('usuario_id');
    const list = document.getElementById('lista-transacoes');
    
    try {
        // 1. Pega total de vendas
        const resTotal = await fetch(`${API_BASE}/vendedor/${uid}/total-vendas`);
        const dataTotal = await resTotal.json();
        document.getElementById('dash-total').innerText = `R$ ${(dataTotal.total_vendas_concluidas || 0).toFixed(2)}`;

        // 2. Lista projetos para ver status (quem comprou de mim ou o que eu comprei pendente)
        // Como não tem endpoint específico de "meus anuncios", vamos filtrar do /projetos/
        const resProjs = await fetch(`${API_BASE}/projetos/`);
        const todosProjetos = await resProjs.json();

        list.innerHTML = "";
        
        // Filtra onde sou vendedor ou cliente
        const meusEnvolvimentos = todosProjetos.filter(p => p.vendedor_id == uid || p.cliente_id == uid);

        if(meusEnvolvimentos.length === 0) list.innerHTML = "<p>Sem histórico.</p>";

        meusEnvolvimentos.forEach(p => {
            let statusHtml = "";
            let acaoHtml = "";

            if (p.status === 'pagamento_retido') {
                statusHtml = "<span style='color:orange'>Aguardando Liberação</span>";
                // Se eu sou o cliente, posso liberar
                if (p.cliente_id == uid) {
                    acaoHtml = `<button onclick="liberarPagamento(${p.id})" style="padding:5px 10px; background:var(--ryzer-green); color:white; border:none; border-radius:4px; cursor:pointer;">Liberar $$</button>`;
                }
            } else if (p.status === 'finalizado') {
                statusHtml = "<span style='color:green'>Concluído</span>";
            } else {
                statusHtml = "<span>À Venda</span>";
            }

            list.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid #eee;">
                    <div>
                        <strong>${p.titulo}</strong><br>
                        <small>${p.vendedor_id == uid ? 'Minha Venda' : 'Minha Compra'}</small>
                    </div>
                    <div style="text-align:right;">
                        <div>R$ ${p.valor.toFixed(2)}</div>
                        <div style="font-size:12px; margin-top:5px;">${statusHtml} ${acaoHtml}</div>
                    </div>
                </div>`;
        });

    } catch (e) {
        console.error(e);
    }
}

async function liberarPagamento(id) {
    const codigo = prompt("Digite o código de liberação recebido na compra:");
    if(!codigo) return;

    try {
        const response = await fetch(`${API_BASE}/projetos/${id}/liberar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo: codigo })
        });

        if(response.ok) {
            toast("Pagamento liberado ao vendedor!");
            carregarDashboard();
        } else {
            toast("Código inválido", "error");
        }
    } catch(e) {
        toast("Erro de conexão", "error");
    }
}

// --- 8. ANUNCIAR (ENVIAR PRO PYTHON) ---
async function publicarAnuncio() {
    const titulo = document.getElementById('anun-titulo').value;
    const valor = document.getElementById('anun-valor').value;
    // O backend original não pede imagem nem categoria no schema Pydantic, 
    // mas pede conteudo_digital. Vamos focar no que é obrigatório.
    const conteudo = document.getElementById('anun-conteudo').value;
    const uid = localStorage.getItem('usuario_id');

    if(!titulo || !valor || !conteudo) return toast("Preencha titulo, valor e conteúdo", "error");

    const payload = {
        titulo: titulo,
        valor: parseFloat(valor),
        conteudo_digital: conteudo, // Campo importante do seu backend
        vendedor_id: parseInt(uid)
    };

    try {
        const response = await fetch(`${API_BASE}/projetos/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if(response.ok) {
            toast("Projeto publicado!");
            router('dashboard'); // Vai para o painel ver o anuncio
        } else {
            const erro = await response.json();
            toast("Erro: " + (erro.detail || "Dados inválidos"), "error");
        }
    } catch (e) {
        console.error(e);
        toast("Erro ao conectar", "error");
    }
}
