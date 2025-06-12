let dadosTabela = [];
let tabela;

async function carregarExcel() {
  const response = await fetch('Inventário de bancos de dados_V4.xlsx');
  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const primeiraAba = workbook.SheetNames[0];
  const dados = XLSX.utils.sheet_to_json(workbook.Sheets[primeiraAba]);

  dadosTabela = dados;
  popularOrgao(dados);
  iniciarTabela(dados);
}

function popularOrgao(dados) {
  const orgaos = [...new Set(dados.map(d => d['Órgão']))];
  const select = document.getElementById('orgaoSelect');

  orgaos.forEach(orgao => {
    const opt = document.createElement('option');
    opt.value = orgao;
    opt.textContent = orgao;
    select.appendChild(opt);
  });
}

function iniciarTabela(dados) {
  const colunas = Object.keys(dados[0]).map(chave => ({ title: chave, data: chave }));


  const dadosNormalizados = dados.map(row => {
    const novo = {};
    colunas.forEach(col => {
      novo[col.data] = row[col.data] || '';
    });
    return novo;
  });

  tabela = $('#tabelaDados').DataTable({
    data: dadosNormalizados,
    columns: colunas
  });

  document.getElementById('orgaoSelect').addEventListener('change', filtrar);
  document.getElementById('bancoInput').addEventListener('input', filtrar);
  document.getElementById('ipInput').addEventListener('input', filtrar);
}


function filtrar() {
  const orgao = document.getElementById('orgaoSelect').value.toLowerCase();
  const banco = document.getElementById('bancoInput').value.toLowerCase();
  const ip = document.getElementById('ipInput').value.toLowerCase();

  const colunas = tabela.settings().init().columns.map(c => c.data);

  const filtrado = dadosTabela
    .filter(item =>
      (orgao === '' || (item['Órgão'] || '').toLowerCase().includes(orgao)) &&
      (banco === '' || (item['Banco'] || '').toLowerCase().includes(banco)) &&
      (ip === '' || (item['IP'] || '').toLowerCase().includes(ip))
    )
    .map(row => {
      const novo = {};
      colunas.forEach(c => {
        novo[c] = row[c] || '';
      });
      return novo;
    });

  tabela.clear().rows.add(filtrado).draw();
}

document.getElementById('uploadBtn').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const primeiraAba = workbook.SheetNames[0];
    const dados = XLSX.utils.sheet_to_json(workbook.Sheets[primeiraAba]);

    dadosTabela = dados;
    limparTabela(); // limpa a tabela anterior
    popularOrgao(dados);
    iniciarTabela(dados);
  };
  reader.readAsArrayBuffer(file);
});

document.getElementById('clearFilters').addEventListener('click', () => {
  document.getElementById('orgaoSelect').value = '';
  document.getElementById('bancoInput').value = '';
  document.getElementById('ipInput').value = '';
  filtrar();
});

document.getElementById('exportBtn').addEventListener('click', () => {
  const dadosFiltrados = tabela.rows({ search: 'applied' }).data().toArray();

  if (dadosFiltrados.length === 0) {
    alert("Nenhum dado para exportar.");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(dadosFiltrados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dados Filtrados');

  XLSX.writeFile(wb, 'dados_filtrados.xlsx');
});

function limparTabela() {
  if (tabela) {
    tabela.clear().destroy();
    document.querySelector('#tabelaDados thead').innerHTML = '';
    document.querySelector('#tabelaDados tbody').innerHTML = '';
    document.getElementById('orgaoSelect').innerHTML = '<option value="">Todos os órgãos</option>';
  }
}



carregarExcel();
