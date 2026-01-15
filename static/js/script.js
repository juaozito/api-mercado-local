/**
 * RYZER SYSTEM V7 - SCRIPT DE CORREÇÃO (LOGIN/CADASTRO/LOJA)
 */

// CONFIGURAÇÃO CENTRAL DA API (Aponta sempre para o Python rodando)
const API_BASE = 'http://127.0.0.1:8000'; 

// --- 1. SISTEMA DE ROTAS (Navegação sem recarregar) ---
function router(tela) {
    // Esconde todas as seções
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    
    // Mostra a seção desejada
    const target = document.getElementById(`sec-${tela}`);
    if (target) {
        target.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        console.error(`Tela não encontrada: sec-${tela}`);
    }

    const userId = localStorage.getItem('usuario_id');
    const nav = document.getElementById('navbar');
    const footer = document.getElementById('footer');

    // Se estiver logado, mostra o menu e carrega dados
    if (userId) {
        if(nav) nav.classList.remove('hidden');
        if(footer) footer.classList.remove('hidden');
        
        updateCartBadge();
        
        // Nome no topo
        const nameDisplay = document.getElementById('user-name-display');
        if(nameDisplay) nameDisplay.innerText = localStorage.getItem('usuario_nome') || 'Cliente';

        // Carrega dados da tela específica
        if (tela === 'loja') carregarLoja();
        if (tela === 'carrinho') renderCarrinho();
        if (tela === 'dashboard') carregarDashboard();
        if (tela === 'meus-pedidos') carregarPedidos();
        
        // Se tentar ir pro login estando logado, joga pra loja
        if (tela === 'login' || tela === 'cadastro') router('loja');

    } else {
        // Se NÃO estiver logado, esconde menu e força login
        if(nav) nav.classList.add('hidden');
        if(footer) footer.classList.add('hidden');
        
        if (tela !== 'login' && tela !== 'cadastro') router('login');
    }
}

// Inicializa o site verificando se tem usuário salvo
window.onload = () => {
    const uid = localStorage.getItem('usuario_id');
    if (uid) router('loja');
    else router('login');
};

// --- 2. AUTHENTICAÇÃO (LOGIN) - CORRIGIDO ---
async function fazerLogin() {
    console.log("Iniciando tentativa de login...");
    
    // Pega os elementos pelo ID novo do HTML Enterprise
    const emailInput = document.getElementById('login-email');
    const senhaInput = document.getElementById('login-senha');
    const msg = document.getElementById('msg-login');
    const btn = document.querySelector('#sec-login button'); // Botão de entrar

    if (!emailInput || !senhaInput) {
        console.error("Erro: Campos de login não encontrados no HTML.");
        return;
    }

    const email = emailInput.value;
    const senha = senhaInput.value;

    if (!email || !senha) {
        msg.innerText = "⚠️ Preencha e-mail e senha.";
        msg.style.color = "orange";
        return;
    }

    // Feedback visual
    msg.innerText = "⏳ Conectando ao servidor...";
    msg.style.color = "#333";
    btn.disabled = true;
    btn.innerText = "Carregando...";

    try {
        // Usa o fetch para o backend Python
        const response = await fetch(`${API_BASE}/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, senha: senha })
        });

        const data = await response.json();
        console.log("Resposta do servidor:", data);

        if (response.ok) {
            // Sucesso! Salva e redireciona
            localStorage.setItem('usuario_id', data.usuario_id);
            localStorage.setItem('usuario_nome', data.nome);
            
            msg.innerText = "✅ Sucesso! Redirecionando...";
            msg.style.color = "green";
            
            setTimeout(() => {
                router('loja');
                btn.disabled = false;
                btn.innerText = "ENTRAR";
            }, 1000);
        } else {
            // Erro de senha ou usuário
            msg.innerText = "❌ " + (data.detail || "Login incorreto.");
            msg.style.color = "red";
            btn.disabled = false;
            btn.innerText = "ENTRAR";
        }
    } catch (error) {
        console.error("Erro de rede:", error);
        msg.innerText = "❌ Erro ao conectar com o Python. Verifique se o servidor está rodando.";
        msg.style.color = "red";
        btn.disabled = false;
        btn.innerText = "ENTRAR";
    }
}

// --- 3. CADASTRO - CORRIGIDO ---
async function cadastrar() {
    const nome = document.getElementById('cad-nome').value;
    const email = document.getElementById('cad-email').value;
    const senha = document.getElementById('cad-senha').value;
    
    if(!nome || !email || !senha) return alert("Preencha todos os campos.");

    try {
        const response = await fetch(`${API_BASE}/usuarios/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        if (response.ok) {
            alert("Conta criada com sucesso! Faça login agora.");
            router('login');
        } else {
            const err = await response.json();
            alert("Erro: " + (err.detail || "Falha ao cadastrar"));
        }
    } catch (e) {
        console.error(e);
        alert("Erro de conexão com o servidor.");
    }
}

function logout() {
    localStorage.clear();
    location.reload(); // Recarrega para limpar memória
}

// --- 4. LOJA & PRODUTOS (Imagens Dinâmicas) ---
function getImagemProduto(titulo) {
    if(!titulo) return 'https://placehold.co/600x600/eee/ccc?text=Ryzer';
    const t = titulo.toLowerCase();
    
    // Lógica para simular imagens reais baseado no nome
    if(t.includes('rtx') || t.includes('gtx')) return 'https://m.media-amazon.com/images/I/71tDu30-mZL._AC_SL1500_.jpg';
    if(t.includes('ryzen') || t.includes('intel')) return 'https://m.media-amazon.com/images/I/51f2hkWjTlL._AC_SL1000_.jpg';
    if(t.includes('mouse')) return 'https://resource.logitech.com/content/dam/gaming/en/products/g502-lightspeed-gaming-mouse/g502-lightspeed-gallery-1.png';
    if(t.includes('teclado')) return 'https://resource.logitechg.com/w_692,c_lpad,ar_4:3,q_auto:best,f_auto,b_rgb:000000/content/dam/gaming/en/products/pro-x-keyboard/pro-x-keyboard-gallery-1.png';
    if(t.includes('monitor')) return 'https://www.lg.com/br/images/monitores/md06155636/gallery/medium01.jpg';
    if(t.includes('curso') || t.includes('python')) return 'https://placehold.co/600x400/00bf63/ffffff?text=Curso+Dev';
    
    return `https://placehold.co/600x400/f0f0f0/333?text=${encodeURIComponent(titulo.substring(0,10))}`;
}

function formatMoney(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

// Carregar Loja
async function carregarLoja() {
    const grid = document.getElementById('grid-produtos');
    grid.innerHTML = '<p style="text-align:center; grid-column:1/-1;">Carregando ofertas...</p>';

    try {
        const res = await fetch(`${API_BASE}/projetos/`);
        const data = await res.json();
        
        const abertos = data.filter(p => p.status === 'aberto');
        renderGrid(abertos);
    } catch (e) {
        grid.innerHTML = '<p style="text-align:center; color:red; grid-column:1/-1;">Erro ao carregar produtos do servidor.</p>';
    }
}

function renderGrid(lista) {
    const grid = document.getElementById('grid-produtos');
    grid.innerHTML = "";

    if (lista.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column:1/-1;">Nenhum produto disponível.</p>';
        return;
    }

    lista.forEach(p => {
        const img = getImagemProduto(p.titulo);
        grid.innerHTML += `
            <div class="product-card fade-in">
                <div class="prod-img-box" onclick="verDetalhes(${p.id})" style="cursor:pointer">
                    <img src="${img}" class="prod-img">
                </div>
                <div class="prod-info">
                    <h3>${p.titulo}</h3>
                    <div class="old-price">R$ ${(p.valor * 1.3).toFixed(2)}</div>
                    <span class="prod-price">${formatMoney(p.valor)}</span>
                    <span class="pix-label">à vista no PIX</span>
                </div>
                <button onclick="addCart(${p.id})" class="btn-cart">COMPRAR</button>
            </div>`;
    });
}

// --- 5. CARRINHO DE COMPRAS ---
function addCart(id) {
    let cart = JSON.parse(localStorage.getItem('ryzer_cart')) || [];
    if (!cart.includes(id)) {
        cart.push(id);
        localStorage.setItem('ryzer_cart', JSON.stringify(cart));
        alert("Produto adicionado ao carrinho!");
        updateCartBadge();
    } else {
        alert("Este item já está no seu carrinho.");
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
        container.innerHTML = "<p style='padding:20px; text-align:center'>Seu carrinho está vazio.</p>";
        document.getElementById('cart-total').innerText = "R$ 0,00";
        return;
    }

    // Busca detalhes dos produtos novamente (idealmente teria endpoint /projetos/{id})
    fetch(`${API_BASE}/projetos/`).then(r => r.json()).then(todos => {
        cartIds.forEach((id, idx) => {
            const p = todos.find(item => item.id === id);
            if (p) {
                total += p.valor;
                const img = getImagemProduto(p.titulo);
                container.innerHTML += `
                    <div class="cart-item">
                        <img src="${img}">
                        <div style="flex:1">
                            <strong>${p.titulo}</strong><br>
                            <small>Vendedor #${p.vendedor_id}</small>
                        </div>
                        <div style="text-align:right">
                            <div style="color:var(--primary); font-weight:bold;">${formatMoney(p.valor)}</div>
                            <button onclick="removeCart(${idx})" style="color:red; font-size:12px; margin-top:5px;">Remover</button>
                        </div>
                    </div>`;
            }
        });
        document.getElementById('cart-total').innerText = formatMoney(total);
        document.getElementById('cart-subtotal').innerText = formatMoney(total);
    });
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
    if(cart.length === 0) return alert("Carrinho vazio!");
    
    if(!confirm("Confirmar compra?")) return;

    let codigos = [];
    for(let id of cart) {
        try {
            const res = await fetch(`${API_BASE}/projetos/${id}/pagar`, { method: 'POST' });
            if(res.ok) {
                const data = await res.json();
                codigos.push(data.codigo_verificacao);
            }
        } catch(e) { console.error(e); }
    }

    if(codigos.length > 0) {
        alert(`✅ Compra realizada!\nGuarde seus códigos: \n${codigos.join('\n')}`);
        localStorage.setItem('ryzer_cart', JSON.stringify([]));
        updateCartBadge();
        router('meus-pedidos');
    } else {
        alert("Erro ao processar. Tente novamente.");
    }
}

// --- 6. ANUNCIAR ---
async function publicarAnuncio() {
    const titulo = document.getElementById('anun-titulo').value;
    const valor = document.getElementById('anun-valor').value;
    const conteudo = document.getElementById('anun-conteudo').value; // CORRIGIDO: nome ID certo
    const uid = localStorage.getItem('usuario_id');

    if(!titulo || !valor || !conteudo) return alert("Preencha todos os campos!");

    try {
        const res = await fetch(`${API_BASE}/projetos/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                titulo, 
                valor: parseFloat(valor),
                conteudo_digital: conteudo, // CAMPO IMPORTANTE
                vendedor_id: parseInt(uid)
            })
        });

        if(res.ok) {
            alert("Anúncio publicado!");
            router('dashboard');
        } else {
            const err = await res.json();
            alert("Erro: " + (err.detail || "Falha ao publicar"));
        }
    } catch(e) { alert("Erro de conexão."); }
}

// --- 7. DASHBOARD ---
async function carregarDashboard() {
    const uid = localStorage.getItem('usuario_id');
    try {
        const resTotal = await fetch(`${API_BASE}/vendedor/${uid}/total-vendas`);
        const dataTotal = await resTotal.json();
        const total = dataTotal.total_vendas_concluidas || 0; // Ajuste para garantir leitura
        document.getElementById('dash-total').innerText = formatMoney(total);

        // Carrega vendas e compras
        const resProjs = await fetch(`${API_BASE}/projetos/`);
        const todos = await resProjs.json();
        const meus = todos.filter(p => p.vendedor_id == uid || p.cliente_id == uid);
        
        const tbody = document.getElementById('lista-transacoes'); // ID na tabela do dashboard
        if(tbody) {
            tbody.innerHTML = "";
            meus.forEach(p => {
                let status = p.status;
                let acao = "-";
                
                if(p.status === 'pagamento_retido' && p.cliente_id == uid) {
                    acao = `<button onclick="liberarPagamento(${p.id})" style="color:blue; font-weight:bold;">Liberar $$</button>`;
                }

                tbody.innerHTML += `
                    <tr>
                        <td>${p.titulo}</td>
                        <td>${formatMoney(p.valor)}</td>
                        <td>${status}</td>
                        <td>${acao}</td>
                    </tr>`;
            });
        }
    } catch(e) { console.error(e); }
}

async function liberarPagamento(id) {
    const codigo = prompt("Digite o código de liberação:");
    if(!codigo) return;
    try {
        const res = await fetch(`${API_BASE}/projetos/${id}/liberar`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({codigo})
        });
        if(res.ok) { alert("Liberado!"); carregarDashboard(); }
        else alert("Código errado!");
    } catch(e) { alert("Erro conexão"); }
}

// --- 8. MEUS PEDIDOS ---
async function carregarPedidos() {
    const uid = localStorage.getItem('usuario_id');
    const grid = document.getElementById('grid-meus-pedidos');
    if(!grid) return;
    
    grid.innerHTML = "Carregando...";
    try {
        const res = await fetch(`${API_BASE}/cliente/${uid}/meus-cursos`);
        const data = await res.json();
        grid.innerHTML = "";
        
        if(data.length === 0) { grid.innerHTML = "<p>Sem compras.</p>"; return; }

        data.forEach(p => {
            const img = getImagemProduto(p.titulo);
            grid.innerHTML += `
                <div class="product-card">
                    <img src="${img}" class="prod-img" style="height:150px; width:100%; object-fit:contain;">
                    <div style="padding:15px;">
                        <h4>${p.titulo}</h4>
                        <div style="background:#e6ffef; padding:10px; margin-top:10px; border-radius:4px; color:green; font-size:12px;">
                            <strong>Entrega:</strong><br>${p.conteudo_digital}
                        </div>
                    </div>
                </div>`;
        });
    } catch(e) { console.error(e); }
}

// --- EXTRAS ---
function buscarProduto() { carregarLoja(); }
function toggleMenu() { alert("Versão Desktop"); }
function filtrarCategoria(c) { carregarLoja(); } // Simplificado
