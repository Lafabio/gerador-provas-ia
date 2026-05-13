// Estado global
let questoes = [];
let professores = [];
let disciplinas = [];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  carregarDadosSalvos();
  atualizarSoma();
  
  // Fechar modais ao clicar fora
  window.onclick = (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  };
});

// ===== GERENCIAMENTO DE QUESTÕES =====

function addQuestaoManual() {
  const enunciado = prompt('Digite o enunciado da questão:');
  if (!enunciado) return;
  
  const tipo = document.getElementById('tipoProva').value;
  const numAlt = tipo === 'fundamental' ? 4 : 5;
  const alternativas = [];
  
  for (let i = 0; i < numAlt; i++) {
    const letra = String.fromCharCode(65 + i); // A, B, C...
    const texto = prompt(`Alternativa ${letra}:`);
    if (texto) alternativas.push({ letra, texto });
  }
  
  const gabarito = prompt(`Gabarito (A-${String.fromCharCode(64 + numAlt)}):`).toUpperCase();
  const pontuacao = parseFloat(prompt('Pontuação:', '1.0')) || 1.0;
  
  adicionarQuestaoLista({
    enunciado,
    alternativas,
    gabarito,
    pontuacao,
    nivel: 'medio',
    bncc: { codigo: 'Manual', descricao_resumida: 'Questão manual' }
  });
}

function adicionarQuestaoLista(questao) {
  const lista = document.getElementById('listaQuestoes');
  const item = criarItemQuestao(questao, questoes.length);
  lista.appendChild(item);
  questoes.push(questao);
  atualizarSoma();
  salvarLocalmente();
}

function criarItemQuestao(q, index) {
  const div = document.createElement('div');
  div.className = 'questao-item';
  div.dataset.pontuacao = q.pontuacao;
  div.dataset.index = index;
  
  div.innerHTML = `
    <div class="actions">
      <button onclick="editarQuestaoIndex(${index})">✏️</button>
      <button onclick="removerQuestao(${index})">🗑️</button>
      <button onclick="subirQuestao(${index})">⬆️</button>
      <button onclick="descerQuestao(${index})">⬇️</button>
    </div>
    <p><strong>${q.enunciado.substring(0, 100)}${q.enunciado.length > 100 ? '...' : ''}</strong></p>
    <small>⭐ ${q.pontuacao} pts | 🎯 ${q.bncc?.codigo || 'N/A'}</small>
  `;
  
  return div;
}

function removerQuestao(index) {
  if (confirm('Remover esta questão?')) {
    questoes.splice(index, 1);
    document.getElementById('listaQuestoes').children[index]?.remove();
    // Re-renderizar para corrigir índices
    renderizarListaQuestoes();
    atualizarSoma();
    salvarLocalmente();
  }
}

function renderizarListaQuestoes() {
  const lista = document.getElementById('listaQuestoes');
  lista.innerHTML = '';
  questoes.forEach((q, i) => {
    lista.appendChild(criarItemQuestao(q, i));
  });
}

function atualizarSoma() {
  const total = questoes.reduce((sum, q) => sum + (q.pontuacao || 0), 0);
  document.getElementById('totalPontos').textContent = total.toFixed(1);
  
  const alerta = document.getElementById('alertaSoma');
  alerta.style.display = Math.abs(total - 10.0) > 0.01 ? 'block' : 'none';
}

function limparQuestoes() {
  if (confirm('Limpar TODAS as questões?')) {
    questoes = [];
    document.getElementById('listaQuestoes').innerHTML = '';
    atualizarSoma();
    salvarLocalmente();
  }
}

// ===== PROFESSORES E DISCIPLINAS =====

function addProfessor() {
  const nome = prompt('Nome do professor:');
  if (nome && !professores.includes(nome)) {
    professores.push(nome);
    atualizarSelect('professor', professores);
    salvarLocalmente();
  }
}

function addDisciplina() {
  const nome = prompt('Nome da disciplina:');
  if (nome && !disciplinas.includes(nome)) {
    disciplinas.push(nome);
    atualizarSelect('disciplina', disciplinas);
    salvarLocalmente();
  }
}

function atualizarSelect(id, itens) {
  const select = document.getElementById(id);
  const atual = select.value;
  select.innerHTML = '<option>— Selecione —</option>';
  itens.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    select.appendChild(opt);
  });
  if (itens.includes(atual)) select.value = atual;
}

// ===== EXPORTAÇÃO E SALVAMENTO =====

function previewProva() {
  const area = document.getElementById('areaPreview');
  const dados = coletarDadosProva();
  
  area.innerHTML = gerarHTMLProva(dados);
  document.getElementById('modalPreview').style.display = 'flex';
}

function coletarDadosProva() {
  return {
    escola: document.getElementById('escola').value,
    cidade: document.getElementById('cidade').value,
    professor: document.getElementById('professor').value,
    disciplina: document.getElementById('disciplina').value,
    serie: document.getElementById('serie').value,
    turma: document.getElementById('turma').value,
    trimestre: document.getElementById('trimestre').value,
    data: document.getElementById('dataProva').value,
    tipo: document.getElementById('tipoProva').value,
    instrucoes: document.getElementById('instrucoes').value,
    questoes: questoes
  };
}

function gerarHTMLProva(dados) {
  const numAlt = dados.tipo === 'fundamental' ? 4 : 5;
  const letras = Array.from({length: numAlt}, (_, i) => String.fromCharCode(65 + i));
  
  return `
    <div class="cabecalho">
      <h2>${dados.escola || 'Escola'}</h2>
      <p>${dados.cidade || ''} | ${dados.disciplina || 'Disciplina'} | ${dados.serie || ''} ${dados.turma || ''}</p>
      <p>Prof(a): ${dados.professor || '—'} | ${dados.trimestre ? dados.trimestre + 'º Trimestre' : ''}</p>
      <p>Data: ${formatarData(dados.data)}</p>
      <hr>
      <p><em>${dados.instrucoes}</em></p>
    </div>
    
    ${dados.questoes.map((q, i) => `
      <div class="questao">
        <p><strong>${i + 1}.</strong> ${q.enunciado}</p>
        ${q.texto_base ? `<blockquote>${q.texto_base}</blockquote>` : ''}
        <ul>
          ${q.alternativas.map(a => `<li>${a.letra}) ${a.texto}</li>`).join('')}
        </ul>
      </div>
    `).join('')}
    
    <div style="margin-top: 2rem; page-break-before: always;">
      <h3>GABARITO</h3>
      <ol>
        ${dados.questoes.map((q, i) => `<li>${i + 1}. ${q.gabarito}</li>`).join('')}
      </ol>
    </div>
  `;
}

function formatarData(data) {
  if (!data) return '___/___/____';
  const [y, m, d] = data.split('-');
  return `${d}/${m}/${y}`;
}

function exportarPDF() {
  // Implementação simplificada - use jsPDF + html2canvas para produção
  previewProva();
  setTimeout(() => {
    alert('📄 Para exportar PDF completo, instale:\n- jsPDF\n- html2canvas\n\nOu use a impressão do navegador: Ctrl+P → Salvar como PDF');
    window.print();
  }, 500);
}

function exportarDOCX() {
  alert('📝 Para exportar DOCX, use:\n- biblioteca docx.js\n- ou exporte HTML e abra no Word');
}

function salvarProva() {
  const dados = coletarDadosProva();
  localStorage.setItem('prova_atual', JSON.stringify(dados));
  alert('✅ Prova salva localmente!');
}

function carregarProva() {
  const dados = localStorage.getItem('prova_atual');
  if (dados) {
    const prova = JSON.parse(dados);
    preencherFormulario(prova);
    questoes = prova.questoes || [];
    renderizarListaQuestoes();
    atualizarSoma();
    alert('✅ Prova carregada!');
  } else {
    alert('⚠️ Nenhuma prova salva encontrada.');
  }
}

function preencherFormulario(dados) {
  Object.keys(dados).forEach(key => {
    const el = document.getElementById(key);
    if (el && dados[key]) el.value = dados[key];
  });
}

function salvarLocalmente() {
  // Salva apenas questões e configurações básicas
  const estado = { questoes, professores, disciplinas };
  localStorage.setItem('gerador_estado', JSON.stringify(estado));
}

function carregarDadosSalvos() {
  const estado = localStorage.getItem('gerador_estado');
  if (estado) {
    const { questoes: qs, professores: profs, disciplinas: discs } = JSON.parse(estado);
    if (qs) { questoes = qs; renderizarListaQuestoes(); }
    if (profs) { professores = profs; atualizarSelect('professor', professores); }
    if (discs) { disciplinas = discs; atualizarSelect('disciplina', disciplinas); }
  }
}

// ===== EMBARALHAR =====

function embaralharProva() {
  document.getElementById('modalEmbaralhar').style.display = 'flex';
}

function fecharModal(id) {
  document.getElementById(id).style.display = 'none';
}

async function gerarVersoes(formato) {
  const embaralharQ = document.getElementById('embaralharQuestoes').checked;
  const embaralharA = document.getElementById('embaralharAlternativas').checked;
  const numVersoes = parseInt(document.querySelector('input[name="versoes"]:checked').value);
  
  fecharModal('modalEmbaralhar');
  
  const dadosBase = coletarDadosProva();
  
  for (let v = 1; v <= numVersoes; v++) {
    let versao = structuredClone(dadosBase);
    
    if (embaralharQ) {
      versao.questoes = shuffleArray(versao.questoes);
    }
    if (embaralharA) {
      versao.questoes = versao.questoes.map(q => ({
        ...q,
        alternativas: shuffleArray(q.alternativas)
      }));
    }
    
    if (formato === 'html') {
      const html = gerarHTMLProva(versao);
      const win = window.open('', '_blank');
      win.document.write(`
        <!DOCTYPE html>
        <html><head><title>Versão ${v}</title>
        <style>body{font-family:Arial,sans-serif;padding:2rem;}</style>
        </head><body>${html}</body></html>
      `);
      win.document.close();
      win.print();
    } else {
      // DOCX: implementar com biblioteca docx.js
      alert(`📝 Versão ${v} pronta para DOCX (implementação pendente)`);
    }
  }
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ===== UTILITÁRIOS =====

function atualizarAlternativas() {
  // Atualiza número de alternativas conforme tipo de prova
  // Pode ser usado ao adicionar questões manualmente
}

function editarQuestaoIndex(index) {
  const q = questoes[index];
  const novoEnunciado = prompt('Editar enunciado:', q.enunciado);
  if (novoEnunciado !== null) {
    q.enunciado = novoEnunciado;
    renderizarListaQuestoes();
    salvarLocalmente();
  }
}

function subirQuestao(index) {
  if (index > 0) {
    [questoes[index-1], questoes[index]] = [questoes[index], questoes[index-1]];
    renderizarListaQuestoes();
    salvarLocalmente();
  }
}

function descerQuestao(index) {
  if (index < questoes.length - 1) {
    [questoes[index], questoes[index+1]] = [questoes[index+1], questoes[index]];
    renderizarListaQuestoes();
    salvarLocalmente();
  }
}

function previewLogo(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('logoPreview').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}
