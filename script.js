// --- BANCO DE DADOS LOCAL ---
const DB = {
    get: (key) => JSON.parse(localStorage.getItem(`duogestao_${key}`)) || [],
    set: (key, val) => localStorage.setItem(`duogestao_${key}`, JSON.stringify(val)),
    session: (val) => val !== undefined ? localStorage.setItem('duo_session', JSON.stringify(val)) : JSON.parse(localStorage.getItem('duo_session'))
};

// Inicializar Administrador
if (DB.get('users').length === 0) {
    DB.set('users', [{ nome: 'Administrador', user: 'administrador', pass: 'Vdabrasil@1234', type: 'Administrador' }]);
}

// --- UTILITÁRIOS ---
function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function navigate(view) {
    currentView = view;
    render();
}

// --- TELAS (Templates) ---
let currentView = 'tlLogin';

function render() {
    const app = document.getElementById('app');
    const user = DB.session();

    if (!user && !['tlLogin', 'tlPrimeiroAcesso', 'tlEsqueciMinhaSenha'].includes(currentView)) {
        currentView = 'tlLogin';
    }

    let html = '';

    // Header (Aparece se logado)
    if (user) {
        html += `
        <header class="header">
            <div class="logo">DuoGestão</div>
            <nav class="nav-menu">
                <button onclick="navigate('tlDashboard')">Dashboard</button>
                <button onclick="navigate('tlMovimentacoes')">Movimentações</button>
                <button onclick="navigate('tlPlanejamento')">Planejamentos</button>
                <button onclick="navigate('tlInvestimentos')">Investimentos</button>
                <button onclick="navigate('tlConfiguracoes')">Configurações</button>
            </nav>
            <div>
                <span>Olá, ${user.nome}</span> | 
                <button onclick="logout()" style="background:none; border:none; color:white; cursor:pointer">Sair</button>
            </div>
        </header>`;
    }

    html += `<div class="container">`;

    switch (currentView) {
        case 'tlLogin':
            html += `
            <div class="auth-card">
                <h2>Login</h2>
                <div class="form-group"><label>Usuário (username)</label><input type="text" id="loginUser"></div>
                <div class="form-group"><label>Senha</label><input type="password" id="loginPass"></div>
                <button class="btn btn-save" style="width:100%" onclick="handleLogin()">Entrar</button>
                <p style="margin-top:10px; text-align:center">
                    <a href="#" onclick="navigate('tlEsqueciMinhaSenha')">Esqueci minha senha</a><br>
                    <a href="#" onclick="navigate('tlPrimeiroAcesso')">Primeiro acesso</a>
                </p>
            </div>`;
            break;

        case 'tlPrimeiroAcesso':
            html += `
            <div class="auth-card">
                <h2>Primeiro Acesso</h2>
                <div class="form-group"><label>Nome completo</label><input type="text" id="regNome"></div>
                <div class="form-group"><label>Usuário (username)</label><input type="text" id="regUser"></div>
                <div class="form-group"><label>Senha</label><input type="password" id="regPass"></div>
                <div class="form-group"><label>Confirmar senha</label><input type="password" id="regPass2"></div>
                <div class="btn-group">
                    <button class="btn btn-save" onclick="handleRegister()">Salvar</button>
                    <button class="btn btn-cancel" onclick="navigate('tlLogin')">Cancelar</button>
                </div>
            </div>`;
            break;

        case 'tlConfiguracoes':
            html += `
            <h2>Configurações</h2>
            <div class="nav-menu" style="margin: 20px 0; background: #ddd; padding: 10px; border-radius: 8px;">
                <button onclick="navigate('tlCentroCustos')" style="color:black">Centro de custos</button>
                <button onclick="navigate('tlPlanoContas')" style="color:black">Plano de contas</button>
                <button onclick="navigate('tlUsuarios')" style="color:black">Usuários</button>
                <button onclick="navigate('tlBackup')" style="color:black">Backup</button>
            </div>`;
            break;

        case 'tlCentroCustos':
            html += `
            <h2>Centro de Custos</h2>
            <div class="form-group"><label>Descrição</label><input type="text" id="ccDesc"></div>
            <div class="form-group"><label>Sigla</label><input type="text" id="ccSigla"></div>
            <div class="form-group"><label><input type="checkbox" id="ccAtivo" checked> Ativo</label></div>
            <div class="btn-group">
                <button class="btn btn-save" onclick="saveCC()">Salvar</button>
                <button class="btn btn-cancel" onclick="navigate('tlConfiguracoes')">Cancelar</button>
            </div>`;
            break;
            
        case 'tlDashboard':
            html += `<h2>Dashboard</h2><p>Filtros e Gráficos em desenvolvimento...</p>`;
            break;

        // Outras telas seguem a mesma lógica de injeção...
        default:
            html += `<h2>Em construção</h2><button class="btn btn-cancel" onclick="navigate('tlDashboard')">Voltar</button>`;
    }

    html += `</div>`;
    app.innerHTML = html;
}

// --- LOGICA DE NEGOCIO ---
function handleLogin() {
    const u = document.getElementById('loginUser').value;
    const p = document.getElementById('loginPass').value;
    const users = DB.get('users');
    const found = users.find(x => x.user === u && x.pass === p);
    
    if (found) {
        DB.session(found);
        showToast("Bem-vindo ao DuoGestão!");
        navigate('tlDashboard');
    } else {
        showToast("Usuário ou senha inválidos.");
    }
}

function logout() {
    localStorage.removeItem('duo_session');
    navigate('tlLogin');
}

function saveCC() {
    const cc = { 
        desc: document.getElementById('ccDesc').value, 
        sigla: document.getElementById('ccSigla').value, 
        ativo: document.getElementById('ccAtivo').checked 
    };
    const lista = DB.get('centro_custos');
    lista.push(cc);
    DB.set('centro_custos', lista);
    showToast("Centro de custo salvo com sucesso!");
    navigate('tlConfiguracoes');
}

// Inicialização
render();