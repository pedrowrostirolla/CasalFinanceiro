{\rtf1\ansi\ansicpg1252\cocoartf2513
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;\f1\fnil\fcharset0 AppleColorEmoji;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww10800\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // --- CONFIGURA\'c7\'c3O DO BANCO DE DADOS (Dexie.js) ---\
const db = new Dexie("CasalFinanceiroDB");\
db.version(1).stores(\{\
    usuarios: '++id, user, pass',\
    movimentacoes: '++id, desc, valor, tipo, fonte, data',\
    arrecadacao: '++id, nome, valor'\
\});\
\
let myChart = null;\
let isLoginMode = true;\
\
// --- INICIALIZA\'c7\'c3O E AUTENTICA\'c7\'c3O ---\
async function init() \{\
    const admin = await db.usuarios.where("user").equals("admin").first();\
    if (!admin) \{\
        await db.usuarios.add(\{ user: "admin", pass: "Vdabrasil@1234" \});\
    \}\
\}\
init();\
\
async function handleAuth() \{\
    const user = document.getElementById('login-user').value;\
    const pass = document.getElementById('login-pass').value;\
\
    if (!user || !pass) return alert("Preencha todos os campos.");\
\
    if (isLoginMode) \{\
        const found = await db.usuarios.where(\{ user, pass \}).first();\
        if (found) \{\
            document.getElementById('auth-container').style.display = 'none';\
            document.getElementById('main-system').style.display = 'block';\
            loadAppData();\
        \} else \{\
            alert("Acesso negado: Usu\'e1rio ou senha incorretos.");\
        \}\
    \} else \{\
        await db.usuarios.add(\{ user, pass \});\
        alert("Usu\'e1rio cadastrado! Agora fa\'e7a o login.");\
        toggleAuth();\
    \}\
\}\
\
function toggleAuth() \{\
    isLoginMode = !isLoginMode;\
    document.getElementById('auth-title').innerText = isLoginMode ? "Login - Pedro & Duda" : "Cadastro - Pedro & Duda";\
    document.getElementById('auth-toggle').innerText = isLoginMode ? "Primeiro acesso? Cadastre-se" : "J\'e1 tem conta? Entrar";\
\}\
\
document.getElementById('auth-toggle').addEventListener('click', toggleAuth);\
\
function logout() \{ location.reload(); \}\
\
// --- NAVEGA\'c7\'c3O ---\
function showPage(pageId) \{\
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));\
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));\
    \
    document.getElementById(pageId).classList.add('active');\
    event.currentTarget.classList.add('active');\
    \
    if (pageId === 'dashboard') updateDashboard();\
\}\
\
// --- GEST\'c3O DE ARRECADA\'c7\'c3O ---\
async function addArrecadacao() \{\
    const nome = document.getElementById('arr-nome').value;\
    const valor = parseFloat(document.getElementById('arr-valor').value);\
\
    if (nome && valor) \{\
        await db.arrecadacao.add(\{ nome, valor \});\
        document.getElementById('arr-nome').value = '';\
        document.getElementById('arr-valor').value = '';\
        loadAppData();\
    \}\
\}\
\
async function deleteArr(id) \{\
    if(confirm("Excluir esta fonte de arrecada\'e7\'e3o?")) \{\
        await db.arrecadacao.delete(id);\
        loadAppData();\
    \}\
\}\
\
// --- GEST\'c3O DE MOVIMENTA\'c7\'d5ES ---\
async function addMovimentacao() \{\
    const desc = document.getElementById('mov-desc').value;\
    const valor = parseFloat(document.getElementById('mov-valor').value);\
    const tipo = document.getElementById('mov-tipo').value;\
    const fonte = document.getElementById('mov-arrecadador').value;\
    const data = document.getElementById('mov-data').value;\
\
    if (desc && valor && data) \{\
        await db.movimentacoes.add(\{ desc, valor, tipo, fonte, data \});\
        alert("Lan\'e7amento realizado!");\
        loadAppData();\
    \} else \{\
        alert("Por favor, preencha todos os campos.");\
    \}\
\}\
\
async function deleteMov(id) \{\
    await db.movimentacoes.delete(id);\
    loadAppData();\
\}\
\
// --- ATUALIZA\'c7\'c3O DE DADOS E DASHBOARD ---\
async function loadAppData() \{\
    const arrs = await db.arrecadacao.toArray();\
    \
    // Atualiza Select de Fontes\
    const select = document.getElementById('mov-arrecadador');\
    select.innerHTML = '<option value="Geral">Centro de Custo (Geral)</option>';\
    \
    // Atualiza Tabela de Arrecada\'e7\'e3o\
    const tableArr = document.querySelector('#table-arr tbody');\
    tableArr.innerHTML = '';\
    \
    arrs.forEach(a => \{\
        select.innerHTML += `<option value="$\{a.nome\}">$\{a.nome\}</option>`;\
        tableArr.innerHTML += `<tr><td>$\{a.nome\}</td><td>R$ $\{a.valor.toFixed(2)\}</td><td><button onclick="deleteArr($\{a.id\})">
\f1 \uc0\u10060 
\f0 </button></td></tr>`;\
    \});\
\
    updateDashboard();\
\}\
\
async function updateDashboard() \{\
    let movs = await db.movimentacoes.toArray();\
    \
    // Filtros\
    const start = document.getElementById('filter-start').value;\
    const end = document.getElementById('filter-end').value;\
    const descF = document.getElementById('filter-desc').value.toLowerCase();\
\
    if(start) movs = movs.filter(m => m.data >= start);\
    if(end) movs = movs.filter(m => m.data <= end);\
    if(descF) movs = movs.filter(m => m.desc.toLowerCase().includes(descF));\
\
    let totalIn = 0;\
    let totalOut = 0;\
    const tableBody = document.querySelector('#table-movs tbody');\
    tableBody.innerHTML = '';\
\
    movs.sort((a,b) => new Date(b.data) - new Date(a.data)).forEach(m => \{\
        if(m.tipo === 'entrada') totalIn += m.valor;\
        else totalOut += m.valor;\
\
        tableBody.innerHTML += `<tr>\
            <td>$\{m.data.split('-').reverse().join('/')\}</td>\
            <td>$\{m.desc\}</td>\
            <td>$\{m.fonte\}</td>\
            <td class="$\{m.tipo === 'entrada' ? 'txt-success' : 'txt-danger'\}">R$ $\{m.valor.toFixed(2)\}</td>\
            <td><button onclick="deleteMov($\{m.id\})">
\f1 \uc0\u10060 
\f0 </button></td>\
        </tr>`;\
    \});\
\
    document.getElementById('total-in').innerText = `R$ $\{totalIn.toFixed(2)\}`;\
    document.getElementById('total-out').innerText = `R$ $\{totalOut.toFixed(2)\}`;\
    \
    const net = totalIn - totalOut;\
    const netEl = document.getElementById('total-net');\
    netEl.innerText = `R$ $\{net.toFixed(2)\}`;\
    netEl.className = net >= 0 ? 'txt-success' : 'txt-danger';\
\
    renderChart(totalIn, totalOut);\
\}\
\
function renderChart(inVal, outVal) \{\
    const ctx = document.getElementById('balanceChart').getContext('2d');\
    if (myChart) myChart.destroy();\
    \
    if (inVal === 0 && outVal === 0) return;\
\
    myChart = new Chart(ctx, \{\
        type: 'doughnut',\
        data: \{\
            labels: ['Entradas', 'Sa\'eddas'],\
            datasets: [\{\
                data: [inVal, outVal],\
                backgroundColor: ['#10b981', '#ef4444'],\
                borderWidth: 0\
            \}]\
        \},\
        options: \{ plugins: \{ legend: \{ position: 'bottom' \} \} \}\
    \});\
\}\
\
// --- EXPORTA\'c7\'c3O PDF ---\
async function exportPDF() \{\
    const \{ jsPDF \} = window.jspdf;\
    const doc = new jsPDF();\
    \
    doc.setFontSize(18);\
    doc.text("Relat\'f3rio Financeiro - Pedro & Duda", 14, 20);\
    \
    const movs = await db.movimentacoes.toArray();\
    const rows = movs.map(m => [m.data, m.desc, m.fonte, m.tipo, `R$ $\{m.valor.toFixed(2)\}`]);\
    \
    doc.autoTable(\{\
        head: [['Data', 'Descri\'e7\'e3o', 'Fonte', 'Tipo', 'Valor']],\
        body: rows,\
        startY: 30,\
        theme: 'grid'\
    \});\
    \
    doc.save("financeiro_casal.pdf");\
\}}