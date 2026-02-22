const db = new Dexie("FinanceiroCasalV2");
db.version(1).stores({
    usuarios: '++id, user, pass, type',
    movimentacoes: '++id, desc, valor, tipo, fonte, data',
    arrecadacao: '++id, nome, valor',
    investimentos: '++id, nome, valor, data'
});

let currentUser = null;
let myChart = null;

// --- SISTEMA DE NOTIFICAÇÃO (TOAST) ---
function notify(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast`;
    toast.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- AUTENTICAÇÃO ---
async function init() {
    const admin = await db.usuarios.where("user").equals("admin").first();
    if (!admin) {
        await db.usuarios.add({ user: "admin", pass: "Vdabrasil@1234", type: "admin" });
    }
}
init();

async function handleAuth() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    const found = await db.usuarios.where({ user, pass }).first();

    if (found) {
        currentUser = found;
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('main-system').style.display = 'block';
        document.getElementById('user-display').innerText = `👤 ${found.user} (${found.type})`;
        
        if(found.type === 'admin') document.getElementById('admin-user-controls').style.display = 'block';
        
        loadAppData();
        notify(`Bem-vindo, ${found.user}!`);
    } else {
        notify("Usuário ou senha inválidos", "error");
    }
}

function logout() { location.reload(); }

// --- NAVEGAÇÃO E ABAS ---
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    event.target.classList.add('active');
    if(id === 'dashboard') updateDashboard();
    if(id === 'configuracao') loadUsers();
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

// --- GESTÃO DE USUÁRIOS (ADMIN) ---
async function createUser() {
    if(currentUser.type !== 'admin') return notify("Acesso negado", "error");
    const user = document.getElementById('new-user-name').value;
    const pass = document.getElementById('new-user-pass').value;
    const type = document.getElementById('new-user-type').value;

    if(user && pass) {
        await db.usuarios.add({ user, pass, type });
        notify("Usuário criado!");
        loadUsers();
    }
}

async function loadUsers() {
    const users = await db.usuarios.toArray();
    const tbody = document.querySelector('#table-users tbody');
    tbody.innerHTML = '';
    users.forEach(u => {
        tbody.innerHTML += `<tr>
            <td>${u.user}</td>
            <td>${u.type}</td>
            <td>${u.user !== 'admin' ? `<button onclick="deleteUser(${u.id})">🗑️</button>` : '-'}</td>
        </tr>`;
    });
}

async function deleteUser(id) {
    if(confirm("Excluir usuário?")) {
        await db.usuarios.delete(id);
        loadUsers();
        notify("Usuário removido");
    }
}

// --- ARRECADAÇÃO ---
async function addArrecadacao() {
    const nome = document.getElementById('arr-nome').value;
    const valor = parseFloat(document.getElementById('arr-valor').value);
    if(nome && valor) {
        await db.arrecadacao.add({ nome, valor });
        loadAppData();
        notify("Fonte adicionada");
    }
}

// --- INVESTIMENTOS ---
async function addInvestimento() {
    const nome = document.getElementById('inv-nome').value;
    const valor = parseFloat(document.getElementById('inv-valor').value);
    const data = document.getElementById('inv-data').value;
    if(nome && valor && data) {
        await db.investimentos.add({ nome, valor, data });
        loadAppData();
        notify("Investimento registrado");
    }
}

// --- MOVIMENTAÇÕES ---
async function addMovimentacao() {
    const desc = document.getElementById('mov-desc').value;
    const valor = parseFloat(document.getElementById('mov-valor').value);
    const tipo = document.getElementById('mov-tipo').value;
    const fonte = document.getElementById('mov-arrecadador').value;
    const data = document.getElementById('mov-data').value;

    if(desc && valor && data) {
        await db.movimentacoes.add({ desc, valor, tipo, fonte, data });
        loadAppData();
        notify("Lançamento efetuado");
    }
}

// --- CARREGAMENTO E DASHBOARD ---
async function loadAppData() {
    const fontes = await db.arrecadacao.toArray();
    const selects = document.querySelectorAll('.fonte-select');
    const filterFonte = document.getElementById('filter-fonte');
    
    let options = '<option value="Geral">Geral (Todos)</option>';
    fontes.forEach(f => options += `<option value="${f.nome}">${f.nome}</option>`);
    
    selects.forEach(s => s.innerHTML = options);
    filterFonte.innerHTML = options;

    // Tabela Arrecadação
    const tbodyArr = document.querySelector('#table-arr tbody');
    tbodyArr.innerHTML = '';
    fontes.forEach(f => {
        tbodyArr.innerHTML += `<tr><td>${f.nome}</td><td>R$ ${f.valor}</td><td><button onclick="deleteData('arrecadacao', ${f.id})">🗑️</button></td></tr>`;
    });

    updateDashboard();
}

async function updateDashboard() {
    let movs = await db.movimentacoes.toArray();
    let invs = await db.investimentos.toArray();
    
    const start = document.getElementById('filter-start').value;
    const end = document.getElementById('filter-end').value;
    const fonteF = document.getElementById('filter-fonte').value;
    const descF = document.getElementById('filter-desc').value.toLowerCase();

    // Filtros de Movimentações
    if(start) movs = movs.filter(m => m.data >= start);
    if(end) movs = movs.filter(m => m.data <= end);
    if(fonteF !== 'Geral') movs = movs.filter(m => m.fonte === fonteF);
    if(descF) movs = movs.filter(m => m.desc.toLowerCase().includes(descF));

    let tIn = 0, tOut = 0, tInv = 0;

    const tbodyMov = document.querySelector('#table-movs tbody');
    tbodyMov.innerHTML = '';
    movs.forEach(m => {
        m.tipo === 'entrada' ? tIn += m.valor : tOut += m.valor;
        tbodyMov.innerHTML += `<tr><td>${m.data}</td><td>${m.desc}</td><td>${m.fonte}</td><td class="${m.tipo==='entrada'?'txt-success':'txt-danger'}">R$ ${m.valor}</td><td><button onclick="deleteData('movimentacoes', ${m.id})">🗑️</button></td></tr>`;
    });

    // Filtros de Investimentos
    if(start) invs = invs.filter(i => i.data >= start);
    if(end) invs = invs.filter(i => i.data <= end);
    
    const tbodyInv = document.querySelector('#table-inv tbody');
    tbodyInv.innerHTML = '';
    invs.forEach(i => {
        tInv += i.valor;
        tbodyInv.innerHTML += `<tr><td>${i.data}</td><td>${i.nome}</td><td>R$ ${i.valor}</td><td><button onclick="deleteData('investimentos', ${i.id})">🗑️</button></td></tr>`;
    });

    document.getElementById('total-in').innerText = `R$ ${tIn.toFixed(2)}`;
    document.getElementById('total-out').innerText = `R$ ${tOut.toFixed(2)}`;
    document.getElementById('total-inv').innerText = `R$ ${tInv.toFixed(2)}`;
    
    const net = tIn - tOut - tInv;
    const netEl = document.getElementById('total-net');
    netEl.innerText = `R$ ${net.toFixed(2)}`;
    netEl.className = net >= 0 ? 'txt-success' : 'txt-danger';

    renderChart(tIn, tOut, tInv);
}

function renderChart(tIn, tOut, tInv) {
    const ctx = document.getElementById('balanceChart').getContext('2d');
    if(myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Entradas', 'Saídas', 'Investido'],
            datasets: [{
                data: [tIn, tOut, tInv],
                backgroundColor: ['#10b981', '#ef4444', '#6366f1']
            }]
        }
    });
}

async function deleteData(table, id) {
    if(confirm("Excluir registro?")) {
        await db[table].delete(id);
        loadAppData();
        notify("Excluído com sucesso");
    }
}

async function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Relatório Financeiro Pedro & Duda", 10, 10);
    const movs = await db.movimentacoes.toArray();
    const rows = movs.map(m => [m.data, m.desc, m.fonte, m.tipo, m.valor]);
    doc.autoTable({ head: [['Data', 'Desc', 'Fonte', 'Tipo', 'Valor']], body: rows, startY: 20 });
    doc.save("financeiro.pdf");
}