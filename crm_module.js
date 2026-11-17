// ============================================================================
// MÓDULO CRM & FORNECEDORES - CENTRAL DE DECISÃO MEI (RAFAEL PLÁCIDO)
// Persistência em localStorage + Backup Export/Import JSON
// ============================================================================

const CRM_STORAGE_KEY = 'rp_crm_oportunidades_v1';
const CRM_FORNECEDORES_KEY = 'rp_crm_fornecedores_v1';

const CRM_ETAPAS = [
  { id: 'analisando', nome: 'Analisando', icon: '🔍', cor: 'slate', badge: 'bg-slate-200 text-slate-800', border: 'border-slate-300' },
  { id: 'cotando', nome: 'Cotando Fornecedor', icon: '🏭', cor: 'sky', badge: 'bg-sky-100 text-sky-900', border: 'border-sky-300' },
  { id: 'proposta', nome: 'Proposta Enviada', icon: '📝', cor: 'amber', badge: 'bg-amber-100 text-amber-900', border: 'border-amber-300' },
  { id: 'disputa', nome: 'Em Disputa / Amostra', icon: '⚡', cor: 'cyan', badge: 'bg-cyan-100 text-cyan-900', border: 'border-cyan-300' },
  { id: 'ganho', nome: 'Ganho / Empenhado', icon: '🏆', cor: 'emerald', badge: 'bg-emerald-100 text-emerald-900', border: 'border-emerald-400' },
  { id: 'entregue', nome: 'Entregue / Pago', icon: '✅', cor: 'teal', badge: 'bg-teal-100 text-teal-900', border: 'border-teal-400' },
  { id: 'perdida', nome: 'Perdida / Descartada', icon: '❌', cor: 'rose', badge: 'bg-rose-100 text-rose-900', border: 'border-rose-300' }
];

const CATEGORIAS_FORNECEDORES = [
  'Troféus / CNC / Acrílico',
  'Esportivo / Redes / Serralheria',
  'Alimentos / Eventos',
  'Limpeza / Descartáveis',
  'Informática / TI',
  'Serviços / Obra',
  'Outros'
];

const FORNECEDORES_INICIAIS = [
  {
    id: 'forn_sm_trofeus',
    nome: 'SM Troféus e Medalhas',
    categoria: 'Troféus / CNC / Acrílico',
    cidade: 'São Marcos / RS',
    contato: 'Comercial Atacado',
    whatsapp: '',
    site: 'https://smtrofeus.com.br',
    prazo: 'Sob consulta (Serra Gaúcha)',
    pagamento: 'PIX / Boleto CNPJ',
    obs: 'Indústria de troféus em MDF, madeira, metal e Zamac. Ótimo para Taquara PE 193/2026.'
  },
  {
    id: 'forn_cooper_acrilicos',
    nome: 'Cooper Acrílicos',
    categoria: 'Troféus / CNC / Acrílico',
    cidade: 'Esteio / RS',
    contato: 'Orçamentos',
    whatsapp: '',
    site: 'https://cooperacrilicos.com',
    prazo: '2 a 5 dias úteis (~35 km)',
    pagamento: 'À combinar',
    obs: 'Fabricação própria de troféus, corte a laser e impressão UV/DTF.'
  },
  {
    id: 'forn_acril_rs',
    nome: 'Acril RS',
    categoria: 'Troféus / CNC / Acrílico',
    cidade: 'Novo Hamburgo / RS',
    contato: 'Atendimento',
    whatsapp: '',
    site: 'https://acrilrs.com.br',
    prazo: 'Entrega rápida (Vale do Sinos)',
    pagamento: 'À combinar',
    obs: 'Peças em acrílico/cristal e corte personalizado próximo a Nova Hartz.'
  },
  {
    id: 'forn_zanoello',
    nome: 'Zanoello Troféus e Medalhas',
    categoria: 'Troféus / CNC / Acrílico',
    cidade: 'Santa Catarina (Atende RS)',
    contato: 'Vendas B2B',
    whatsapp: '',
    site: 'https://zanoello.com.br',
    prazo: 'Envio diário p/ RS',
    pagamento: 'CNPJ / Boleto / PIX',
    obs: 'Catálogo pronto de chuteira 3D, luva de goleiro 3D, taças grandes e medalhas Zamac.'
  },
  {
    id: 'forn_becker_esportes',
    nome: 'Becker Esportes',
    categoria: 'Esportivo / Redes / Serralheria',
    cidade: 'Novo Hamburgo / RS',
    contato: 'Atacado CNPJ',
    whatsapp: '',
    site: 'https://beckeresportes.com.br',
    prazo: 'Pronta entrega (~20 km)',
    pagamento: 'CNPJ Atacado',
    obs: 'Distribuidora local de cones, tatames EVA, bambolês, colchonetes, bolas e redes (Sapiranga PE 090/2026).'
  },
  {
    id: 'forn_bolas_nedel',
    nome: 'Bolas Nedel',
    categoria: 'Esportivo / Redes / Serralheria',
    cidade: 'Nova Petrópolis / RS',
    contato: 'Comercial Fábrica',
    whatsapp: '',
    site: 'https://bolasnedel.com.br',
    prazo: 'Fábrica na Serra Gaúcha',
    pagamento: 'CNPJ / Boleto',
    obs: 'Fabricante gaúcha de bolas oficiais e redes esportivas com certificado anti-UV.'
  },
  {
    id: 'forn_penalty_pj',
    nome: 'Penalty PJ / Cambuci S/A',
    categoria: 'Esportivo / Redes / Serralheria',
    cidade: 'Nacional (B2B)',
    contato: 'corporativo@cambuci.com.br | 0800 747 3000',
    whatsapp: '',
    site: 'https://penaltypj.com.br',
    prazo: 'Transportadora',
    pagamento: 'Faturamento PJ',
    obs: 'Venda direta para CNPJ com laudos oficiais de federações para bolas de futsal/campo/vôlei.'
  },
  {
    id: 'forn_salete_salgados',
    nome: 'Salete Salgados',
    categoria: 'Alimentos / Eventos',
    cidade: 'Região / Vale do Paranhana',
    contato: 'Catálogo Local',
    whatsapp: '',
    site: '',
    prazo: 'Sob encomenda',
    pagamento: 'À combinar',
    obs: 'Cardápio salvo no projeto (cardapio-atual-sallete salgados.pdf) para coquetéis e coffee breaks.'
  }
];

const CRM_OPORTUNIDADES_INICIAIS = [
  {
    id: 'crm_taquara_193_2026',
    origemId: '97761407000173_1_000445_2026',
    titulo: 'Troféus e Medalhas (PE 193/2026) — Itens 4, 5, 6, 7 e 8',
    orgao: 'Prefeitura Municipal de Taquara/RS',
    cidade: 'Taquara/RS (~20 km)',
    edital: 'PE 193/2026 • Proc. 2026/8634',
    portalUrl: 'https://www.portaldecompraspublicas.com.br',
    dataDisputa: '2026-11-30T10:30',
    etapa: 'cotando',
    valorTeto: 95000,
    custoEstimado: 45000,
    valorProposta: 78000,
    fornecedoresIds: ['forn_sm_trofeus', 'forn_acril_rs', 'forn_zanoello'],
    notas: 'Item 4 (160x madeira 30cm) na Router CNC! Itens 5-6 (vidro cristal 8mm) em vidraçaria + DTF UV. Itens 7-8 prontos. LEMBRETE: Incluir CNAE 4789-0/99 no CCMEI + Atestado Técnico (Item 5.5a). Amostra física em 5 dias úteis.',
    criadoEm: new Date().toISOString()
  },
  {
    id: 'crm_sapiranga_090_2026',
    origemId: 'sapiranga_pe_090_2026',
    titulo: 'Materiais Esportivos (PE 090/2026) — Lotes CNC, Serralheria e Atacado',
    orgao: 'Prefeitura Municipal de Sapiranga/RS',
    cidade: 'Sapiranga/RS (~15 km)',
    edital: 'PE 090/2026 • Proc. 463/2026',
    portalUrl: 'https://www.compras.rs.gov.br',
    dataDisputa: '2026-12-03T09:00',
    etapa: 'analisando',
    valorTeto: 32500,
    custoEstimado: 16500,
    valorProposta: 26800,
    fornecedoresIds: ['forn_becker_esportes', 'forn_bolas_nedel'],
    notas: 'NÃO exige atestado técnico! Focar no Lote 4 (5x Caixa Pliométrica madeira naval 15mm na CNC), Lotes 76/77/78 (Traves e Cadeira Árbitro serralheria), Lote 49 (Tatame EVA), Lotes 24/25 (Cones). Cadastrar no Pregão Banrisul + incluir CNAE 4763-6/02.',
    criadoEm: new Date().toISOString()
  }
];

let crmVisualizacaoModo = 'kanban'; // 'kanban' | 'lista'
let crmAbaAtual = 'radar'; // 'radar' | 'crm' | 'fornecedores'

function lerCRMOportunidades() {
  try {
    const raw = localStorage.getItem(CRM_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(CRM_OPORTUNIDADES_INICIAIS));
      return JSON.parse(JSON.stringify(CRM_OPORTUNIDADES_INICIAIS));
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function salvarCRMOportunidades(lista) {
  localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(lista));
  atualizarBadgesNavegacao();
}

function lerCRMFornecedores() {
  try {
    const raw = localStorage.getItem(CRM_FORNECEDORES_KEY);
    if (!raw) {
      localStorage.setItem(CRM_FORNECEDORES_KEY, JSON.stringify(FORNECEDORES_INICIAIS));
      return JSON.parse(JSON.stringify(FORNECEDORES_INICIAIS));
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function salvarCRMFornecedores(lista) {
  localStorage.setItem(CRM_FORNECEDORES_KEY, JSON.stringify(lista));
  atualizarBadgesNavegacao();
}

function formatarMoedaCRM(valor) {
  const n = Number(valor) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function escCRM(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatarDataHoraBR(isoStr) {
  if (!isoStr) return 'Sem data';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ============================================================================
// TROCA DE ABAS PRINCIPAIS (RADAR | CRM | FORNECEDORES)
// ============================================================================
function alternarAbaPrincipal(aba) {
  crmAbaAtual = aba;
  const vRadar = document.getElementById('viewRadar');
  const vCRM = document.getElementById('viewCRM');
  const vForn = document.getElementById('viewFornecedores');

  if (vRadar) vRadar.classList.toggle('hidden', aba !== 'radar');
  if (vCRM) vCRM.classList.toggle('hidden', aba !== 'crm');
  if (vForn) vForn.classList.toggle('hidden', aba !== 'fornecedores');

  document.querySelectorAll('.nav-main-tab').forEach(btn => {
    const target = btn.getAttribute('data-tab');
    const ativo = target === aba;
    btn.className = ativo
      ? 'nav-main-tab px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500 text-slate-950 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer'
      : 'nav-main-tab px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer';
  });

  if (aba === 'crm') renderizarCRM();
  if (aba === 'fornecedores') renderizarFornecedoresView();
}

function atualizarBadgesNavegacao() {
  const ops = lerCRMOportunidades();
  const forns = lerCRMFornecedores();
  const ativas = ops.filter(o => o.etapa !== 'perdida' && o.etapa !== 'entregue').length;

  const bCRM = document.getElementById('navBadgeCRM');
  if (bCRM) bCRM.innerText = ativas;

  const bForn = document.getElementById('navBadgeForn');
  if (bForn) bForn.innerText = forns.length;
}

// ============================================================================
// INTEGRAÇÃO RADAR -> CRM
// ============================================================================
function buscarOportunidadeRadarPorId(id) {
  const sId = String(id);
  if (typeof obterTodasOportunidadesUnificadas === 'function') {
    const todas = obterTodasOportunidadesUnificadas();
    const found = todas.find(x => String(x.id) === sId);
    if (found) return found;
  }
  if (typeof servicosDB !== 'undefined') {
    const found = servicosDB.find(x => String(x.id) === sId);
    if (found) return found;
  }
  if (typeof window.radarPncpData !== 'undefined') {
    const found = window.radarPncpData.find(x => String(x.id) === sId);
    if (found) return found;
  }
  return null;
}

function obterStatusCRMDoRadar(origemId) {
  const ops = lerCRMOportunidades();
  return ops.find(o => String(o.origemId) === String(origemId));
}

function enviarParaCRM(origemId) {
  const existente = obterStatusCRMDoRadar(origemId);
  if (existente) {
    alternarAbaPrincipal('crm');
    abrirModalCRM(existente.id);
    return;
  }

  const item = buscarOportunidadeRadarPorId(origemId);
  const ops = lerCRMOportunidades();

  const valorTeto = item ? Number(item.valorEstimado || item.propostaMax || item.teto || 0) : 0;
  const custoEst = item ? Number(item.custoTotal || Math.round(valorTeto * 0.6)) : 0;
  const propSug = item ? Number(item.propostaSugerida || Math.round(valorTeto * 0.85)) : 0;

  let dataIso = '';
  if (item && item.dataEncerramentoIso) {
    dataIso = String(item.dataEncerramentoIso).slice(0, 16);
  }

  const nova = {
    id: 'crm_' + Date.now(),
    origemId: String(origemId),
    titulo: item ? (item.titulo || item.tituloResumo || item.objeto || 'Oportunidade Licitação') : 'Oportunidade',
    orgao: item ? (item.orgao || '') : '',
    cidade: item ? (item.cidade || item.local || '') : '',
    edital: item ? (item.numeroControle || item.processo || item.numeroEdital || '') : '',
    portalUrl: item ? (item.linkDireto || item.linkSistemaOficial || item.link || '') : '',
    dataDisputa: dataIso,
    etapa: 'analisando',
    valorTeto: valorTeto,
    custoEstimado: custoEst,
    valorProposta: propSug,
    fornecedoresIds: [],
    notas: item && item.objeto ? String(item.objeto).slice(0, 260) : '',
    criadoEm: new Date().toISOString()
  };

  ops.unshift(nova);
  salvarCRMOportunidades(ops);

  // Atualiza botão do card no radar sem precisar recarregar tudo
  const btn = document.getElementById('btn-crm-' + String(origemId));
  if (btn) {
    btn.className = 'w-full py-2 px-3 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 font-black text-xs text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer';
    btn.innerHTML = '<span>🎯</span><span>No CRM (Analisando) • Abrir</span>';
  }

  abrirModalCRM(nova.id);
}

// ============================================================================
// RENDERIZAÇÃO DO CRM (KPIs + KANBAN / LISTA)
// ============================================================================
function alternarModoCRM(modo) {
  crmVisualizacaoModo = modo;
  renderizarCRM();
}

function renderizarCRM() {
  const ops = lerCRMOportunidades();
  const forns = lerCRMFornecedores();
  const busca = (document.getElementById('crmFiltroBusca')?.value || '').toLowerCase().trim();

  const filtradas = ops.filter(o => {
    if (!busca) return true;
    return `${o.titulo} ${o.orgao} ${o.cidade} ${o.edital} ${o.notas}`.toLowerCase().includes(busca);
  });

  // KPIs
  const emAndamento = ops.filter(o => ['analisando', 'cotando', 'proposta', 'disputa'].includes(o.etapa));
  const ganhas = ops.filter(o => ['ganho', 'entregue'].includes(o.etapa));
  const totalPipeline = emAndamento.reduce((acc, o) => acc + (Number(o.valorProposta) || Number(o.valorTeto) || 0), 0);
  const totalGanho = ganhas.reduce((acc, o) => acc + (Number(o.valorProposta) || Number(o.valorTeto) || 0), 0);
  const lucroPrevisto = emAndamento.reduce((acc, o) => acc + Math.max(0, (Number(o.valorProposta) || 0) - (Number(o.custoEstimado) || 0)), 0);

  const kpiContainer = document.getElementById('crmKpis');
  if (kpiContainer) {
    const pctMei = Math.min(100, Math.round((totalGanho / 81000) * 100));
    kpiContainer.innerHTML = `
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <span class="text-[11px] font-bold uppercase text-slate-400 block">Em Negociação</span>
        <strong class="text-xl font-black text-slate-900">${emAndamento.length} editais</strong>
        <span class="text-xs text-sky-700 font-bold block mt-0.5">${formatarMoedaCRM(totalPipeline)} em propostas</span>
      </div>
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <span class="text-[11px] font-bold uppercase text-slate-400 block">Lucro Previsto (Ativos)</span>
        <strong class="text-xl font-black text-emerald-700">${formatarMoedaCRM(lucroPrevisto)}</strong>
        <span class="text-xs text-slate-500 block mt-0.5">Proposta − Custo Fornecedor/CNC</span>
      </div>
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <span class="text-[11px] font-bold uppercase text-slate-400 block">Ganhos / Empenhados</span>
        <strong class="text-xl font-black text-slate-900">${formatarMoedaCRM(totalGanho)}</strong>
        <span class="text-xs text-emerald-600 font-bold block mt-0.5">${ganhas.length} contrato(s) fechado(s)</span>
      </div>
      <div class="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-xs">
        <div class="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400">
          <span>Teto MEI 2026</span>
          <span class="text-emerald-400">${pctMei}%</span>
        </div>
        <strong class="text-lg font-black text-white block mt-0.5">${formatarMoedaCRM(totalGanho)} / R$ 81.000</strong>
        <div class="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
          <div class="bg-emerald-400 h-2 rounded-full transition-all" style="width: ${pctMei}%"></div>
        </div>
      </div>
    `;
  }

  // Botões Kanban vs Lista
  const btnK = document.getElementById('btnCrmKanban');
  const btnL = document.getElementById('btnCrmLista');
  if (btnK && btnL) {
    btnK.className = crmVisualizacaoModo === 'kanban'
      ? 'px-3 py-1.5 rounded-lg text-xs font-black bg-slate-900 text-white cursor-pointer'
      : 'px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-600 border border-slate-200 cursor-pointer';
    btnL.className = crmVisualizacaoModo === 'lista'
      ? 'px-3 py-1.5 rounded-lg text-xs font-black bg-slate-900 text-white cursor-pointer'
      : 'px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-600 border border-slate-200 cursor-pointer';
  }

  const board = document.getElementById('crmBoardContainer');
  if (!board) return;

  if (crmVisualizacaoModo === 'lista') {
    board.className = 'bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto';
    board.innerHTML = `
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black">
          <tr>
            <th class="p-3">Etapa</th>
            <th class="p-3">Oportunidade / Órgão</th>
            <th class="p-3">Sessão</th>
            <th class="p-3">Teto / Proposta</th>
            <th class="p-3">Lucro Est.</th>
            <th class="p-3">Fornecedores</th>
            <th class="p-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${filtradas.length === 0 ? '<tr><td colspan="7" class="p-8 text-center text-slate-400">Nenhuma oportunidade no CRM com esse filtro.</td></tr>' : filtradas.map(op => {
            const st = CRM_ETAPAS.find(e => e.id === op.etapa) || CRM_ETAPAS[0];
            const lucro = (Number(op.valorProposta) || 0) - (Number(op.custoEstimado) || 0);
            const linked = (op.fornecedoresIds || []).map(fid => forns.find(f => f.id === fid)).filter(Boolean);
            return `
              <tr class="hover:bg-slate-50">
                <td class="p-3 whitespace-nowrap"><span class="px-2 py-1 rounded-lg text-[11px] font-black ${st.badge}">${st.icon} ${st.nome}</span></td>
                <td class="p-3">
                  <strong class="text-slate-900 block">${escCRM(op.titulo)}</strong>
                  <span class="text-[11px] text-slate-500">${escCRM(op.orgao)} • ${escCRM(op.cidade)}</span>
                </td>
                <td class="p-3 whitespace-nowrap text-slate-700 font-semibold">${formatarDataHoraBR(op.dataDisputa)}</td>
                <td class="p-3 whitespace-nowrap">
                  <span class="text-slate-400 block text-[10px]">Teto: ${formatarMoedaCRM(op.valorTeto)}</span>
                  <strong class="text-slate-900">Prop: ${formatarMoedaCRM(op.valorProposta)}</strong>
                </td>
                <td class="p-3 whitespace-nowrap font-black ${lucro >= 0 ? 'text-emerald-700' : 'text-rose-600'}">${formatarMoedaCRM(lucro)}</td>
                <td class="p-3">
                  <div class="flex flex-wrap gap-1">
                    ${linked.length ? linked.map(f => `<span class="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700">${escCRM(f.nome)}</span>`).join('') : '<span class="text-slate-400 text-[10px]">Nenhum</span>'}
                  </div>
                </td>
                <td class="p-3 text-right whitespace-nowrap space-x-1">
                  <button onclick="moverEtapaCRM('${op.id}', 1)" class="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer" title="Avançar etapa">Avançar ▶</button>
                  <button onclick="abrirModalCRM('${op.id}')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] cursor-pointer">Editar</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    return;
  }

  // Modo Kanban Horizontal
  board.className = 'flex gap-4 overflow-x-auto pb-4 items-start';
  board.innerHTML = CRM_ETAPAS.map((etapa, idxEtapa) => {
    const cardsEtapa = filtradas.filter(o => o.etapa === etapa.id);
    const somaEtapa = cardsEtapa.reduce((acc, o) => acc + (Number(o.valorProposta) || Number(o.valorTeto) || 0), 0);

    return `
      <div class="min-w-[295px] w-[295px] flex-shrink-0 bg-slate-200/70 rounded-2xl p-3 border ${etapa.border} flex flex-col gap-2.5">
        <div class="flex items-center justify-between pb-1 border-b border-slate-300/70">
          <div class="flex items-center gap-1.5">
            <span class="text-sm">${etapa.icon}</span>
            <strong class="text-xs font-black text-slate-900">${etapa.nome}</strong>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[11px] font-black ${etapa.badge}">${cardsEtapa.length}</span>
        </div>
        <div class="text-[10px] font-bold text-slate-500 -mt-1">
          Total: <span class="text-slate-800">${formatarMoedaCRM(somaEtapa)}</span>
        </div>

        <div class="space-y-2.5">
          ${cardsEtapa.length === 0 ? `<div class="p-4 text-center text-[11px] text-slate-400 border border-dashed border-slate-300 rounded-xl bg-white/40">Sem itens nesta etapa</div>` : cardsEtapa.map(op => {
            const lucro = (Number(op.valorProposta) || 0) - (Number(op.custoEstimado) || 0);
            const linked = (op.fornecedoresIds || []).map(fid => forns.find(f => f.id === fid)).filter(Boolean);
            return `
              <div class="bg-white rounded-xl p-3 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <strong class="text-xs font-black text-slate-900 leading-snug cursor-pointer hover:text-sky-700" onclick="abrirModalCRM('${op.id}')">${escCRM(op.titulo)}</strong>
                </div>
                <div class="text-[11px] text-slate-500 leading-tight">
                  <div class="font-semibold text-slate-700 truncate">${escCRM(op.orgao)}</div>
                  <div>${escCRM(op.cidade)} ${op.edital ? '• ' + escCRM(op.edital) : ''}</div>
                </div>
                ${op.dataDisputa ? `<div class="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-block">⏰ ${formatarDataHoraBR(op.dataDisputa)}</div>` : ''}
                <div class="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10px]">
                  <div>
                    <span class="text-slate-400 block">Proposta</span>
                    <strong class="text-slate-900">${formatarMoedaCRM(op.valorProposta)}</strong>
                  </div>
                  <div>
                    <span class="text-slate-400 block">Lucro Est.</span>
                    <strong class="${lucro >= 0 ? 'text-emerald-700' : 'text-rose-600'}">${formatarMoedaCRM(lucro)}</strong>
                  </div>
                </div>
                ${linked.length ? `
                  <div class="flex flex-wrap gap-1">
                    ${linked.map(f => `<span class="px-1.5 py-0.5 rounded bg-sky-50 text-sky-900 border border-sky-200 text-[10px] font-bold">🏭 ${escCRM(f.nome)}</span>`).join('')}
                  </div>
                ` : ''}
                ${op.notas ? `<p class="text-[10px] text-slate-600 line-clamp-2 bg-slate-50/70 p-1.5 rounded border border-slate-100">${escCRM(op.notas)}</p>` : ''}
                <div class="flex items-center justify-between pt-1 border-t border-slate-100 gap-1">
                  <div class="flex items-center gap-1">
                    ${idxEtapa > 0 ? `<button onclick="moverEtapaCRM('${op.id}', -1)" class="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] cursor-pointer" title="Voltar etapa">◀</button>` : ''}
                    ${idxEtapa < CRM_ETAPAS.length - 1 ? `<button onclick="moverEtapaCRM('${op.id}', 1)" class="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer" title="Avançar etapa">Avançar ▶</button>` : ''}
                  </div>
                  <div class="flex items-center gap-1">
                    ${op.portalUrl ? `<a href="${escCRM(op.portalUrl)}" target="_blank" class="px-2 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-[10px]" title="Abrir Portal">↗</a>` : ''}
                    <button onclick="abrirModalCRM('${op.id}')" class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] cursor-pointer">Editar</button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function moverEtapaCRM(opId, direcao) {
  const ops = lerCRMOportunidades();
  const idx = ops.findIndex(o => o.id === opId);
  if (idx === -1) return;
  const etapaIdx = CRM_ETAPAS.findIndex(e => e.id === ops[idx].etapa);
  const novoIdx = Math.max(0, Math.min(CRM_ETAPAS.length - 1, etapaIdx + direcao));
  ops[idx].etapa = CRM_ETAPAS[novoIdx].id;
  salvarCRMOportunidades(ops);
  renderizarCRM();
}

// ============================================================================
// MODAL DE EDIÇÃO / CRIAÇÃO DE OPORTUNIDADE NO CRM
// ============================================================================
function abrirModalCRM(opId = null) {
  const modal = document.getElementById('modalCRM');
  if (!modal) return;
  const ops = lerCRMOportunidades();
  const op = opId ? ops.find(o => o.id === opId) : null;
  const forns = lerCRMFornecedores();

  document.getElementById('crmFormId').value = op ? op.id : '';
  document.getElementById('crmModalTituloHeader').innerText = op ? 'Editar Oportunidade no CRM' : 'Nova Oportunidade no CRM';
  document.getElementById('crmFormTitulo').value = op ? op.titulo : '';
  document.getElementById('crmFormOrgao').value = op ? op.orgao : '';
  document.getElementById('crmFormCidade').value = op ? op.cidade : '';
  document.getElementById('crmFormEdital').value = op ? op.edital : '';
  document.getElementById('crmFormPortalUrl').value = op ? op.portalUrl : '';
  document.getElementById('crmFormDataDisputa').value = op ? op.dataDisputa : '';
  document.getElementById('crmFormEtapa').value = op ? op.etapa : 'analisando';
  document.getElementById('crmFormTeto').value = op ? op.valorTeto : '';
  document.getElementById('crmFormCusto').value = op ? op.custoEstimado : '';
  document.getElementById('crmFormProposta').value = op ? op.valorProposta : '';
  document.getElementById('crmFormNotas').value = op ? op.notas : '';

  const btnExcluir = document.getElementById('btnExcluirCRMModal');
  if (btnExcluir) btnExcluir.classList.toggle('hidden', !op);

  // Checkboxes de fornecedores vinculados
  const boxForns = document.getElementById('crmFormFornecedoresLista');
  const selecionados = new Set(op ? (op.fornecedoresIds || []) : []);
  if (boxForns) {
    boxForns.innerHTML = forns.length === 0
      ? '<span class="text-xs text-slate-400">Nenhum fornecedor cadastrado ainda.</span>'
      : forns.map(f => `
          <label class="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
            <input type="checkbox" name="crmFornVinculo" value="${escCRM(f.id)}" ${selecionados.has(f.id) ? 'checked' : ''} class="rounded text-emerald-600">
            <span class="font-bold text-slate-800">${escCRM(f.nome)}</span>
            <span class="text-[10px] text-slate-400 ml-auto">${escCRM(f.cidade)}</span>
          </label>
        `).join('');
  }

  modal.classList.remove('hidden');
}

function fecharModalCRM() {
  const modal = document.getElementById('modalCRM');
  if (modal) modal.classList.add('hidden');
}

function salvarFormCRM(e) {
  e.preventDefault();
  const ops = lerCRMOportunidades();
  const id = document.getElementById('crmFormId').value;
  const checkedForns = Array.from(document.querySelectorAll('input[name="crmFornVinculo"]:checked')).map(el => el.value);

  const dados = {
    id: id || ('crm_' + Date.now()),
    origemId: id ? (ops.find(o => o.id === id)?.origemId || '') : '',
    titulo: document.getElementById('crmFormTitulo').value.trim(),
    orgao: document.getElementById('crmFormOrgao').value.trim(),
    cidade: document.getElementById('crmFormCidade').value.trim(),
    edital: document.getElementById('crmFormEdital').value.trim(),
    portalUrl: document.getElementById('crmFormPortalUrl').value.trim(),
    dataDisputa: document.getElementById('crmFormDataDisputa').value,
    etapa: document.getElementById('crmFormEtapa').value,
    valorTeto: Number(document.getElementById('crmFormTeto').value) || 0,
    custoEstimado: Number(document.getElementById('crmFormCusto').value) || 0,
    valorProposta: Number(document.getElementById('crmFormProposta').value) || 0,
    fornecedoresIds: checkedForns,
    notas: document.getElementById('crmFormNotas').value.trim(),
    criadoEm: id ? (ops.find(o => o.id === id)?.criadoEm || new Date().toISOString()) : new Date().toISOString()
  };

  if (id) {
    const idx = ops.findIndex(o => o.id === id);
    if (idx !== -1) ops[idx] = dados;
  } else {
    ops.unshift(dados);
  }

  salvarCRMOportunidades(ops);
  fecharModalCRM();
  if (crmAbaAtual === 'crm') renderizarCRM();
}

function excluirOportunidadeCRM() {
  const id = document.getElementById('crmFormId').value;
  if (!id) return;
  if (!confirm('Remover esta oportunidade do seu CRM?')) return;
  const ops = lerCRMOportunidades().filter(o => o.id !== id);
  salvarCRMOportunidades(ops);
  fecharModalCRM();
  renderizarCRM();
}

// ============================================================================
// VIEW DE FORNECEDORES
// ============================================================================
function renderizarFornecedoresView() {
  const forns = lerCRMFornecedores();
  const ops = lerCRMOportunidades();
  const busca = (document.getElementById('fornFiltroBusca')?.value || '').toLowerCase().trim();
  const cat = document.getElementById('fornFiltroCategoria')?.value || 'todos';

  const filtrados = forns.filter(f => {
    const matchCat = cat === 'todos' || f.categoria === cat;
    const matchTxt = !busca || `${f.nome} ${f.categoria} ${f.cidade} ${f.contato} ${f.obs}`.toLowerCase().includes(busca);
    return matchCat && matchTxt;
  });

  const grid = document.getElementById('fornecedoresGrid');
  if (!grid) return;

  if (filtrados.length === 0) {
    grid.innerHTML = `<div class="col-span-full p-10 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 text-sm">Nenhum fornecedor encontrado com esse filtro. Clique em "+ Cadastrar Fornecedor" para adicionar.</div>`;
    return;
  }

  grid.innerHTML = filtrados.map(f => {
    const vinculados = ops.filter(o => (o.fornecedoresIds || []).includes(f.id));
    const whatsLimpo = String(f.whatsapp || '').replace(/\D/g, '');
    const whatsLink = whatsLimpo ? `https://wa.me/${whatsLimpo.startsWith('55') ? whatsLimpo : '55' + whatsLimpo}` : '';
    const siteHref = f.site ? (f.site.startsWith('http') ? f.site : 'https://' + f.site) : '';

    return `
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between gap-3 hover:shadow-md transition-all">
        <div class="space-y-2">
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-100 text-sky-900">${escCRM(f.categoria)}</span>
              <h4 class="text-sm font-black text-slate-900 mt-1">${escCRM(f.nome)}</h4>
              <span class="text-xs text-slate-500 font-medium">📍 ${escCRM(f.cidade || 'Não informado')}</span>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 whitespace-nowrap">${vinculados.length} edital(is)</span>
          </div>

          <div class="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            ${f.contato ? `<div><strong>Contato:</strong> ${escCRM(f.contato)}</div>` : ''}
            ${f.prazo ? `<div><strong>Prazo:</strong> ${escCRM(f.prazo)}</div>` : ''}
            ${f.pagamento ? `<div><strong>Pagamento:</strong> ${escCRM(f.pagamento)}</div>` : ''}
            ${f.obs ? `<p class="text-[11px] text-slate-500 pt-1 border-t border-slate-200">${escCRM(f.obs)}</p>` : ''}
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-100">
          <div class="flex items-center gap-1.5">
            ${whatsLink ? `<a href="${whatsLink}" target="_blank" class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">💬 WhatsApp</a>` : ''}
            ${siteHref ? `<a href="${escCRM(siteHref)}" target="_blank" class="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs">🌐 Site ↗</a>` : ''}
          </div>
          <div class="flex items-center gap-1.5">
            <button onclick="abrirModalFornecedorCRM('${f.id}')" class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer">Editar</button>
            <button onclick="excluirFornecedorCRM('${f.id}')" class="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer" title="Excluir">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function abrirModalFornecedorCRM(fornId = null) {
  const modal = document.getElementById('modalFornecedorCRM');
  if (!modal) return;
  const forns = lerCRMFornecedores();
  const f = fornId ? forns.find(x => x.id === fornId) : null;

  document.getElementById('fornFormId').value = f ? f.id : '';
  document.getElementById('fornModalTituloHeader').innerText = f ? 'Editar Fornecedor' : 'Cadastrar Novo Fornecedor';
  document.getElementById('fornFormNome').value = f ? f.nome : '';
  document.getElementById('fornFormCategoria').value = f ? f.categoria : CATEGORIAS_FORNECEDORES[0];
  document.getElementById('fornFormCidade').value = f ? f.cidade : '';
  document.getElementById('fornFormContato').value = f ? f.contato : '';
  document.getElementById('fornFormWhatsapp').value = f ? f.whatsapp : '';
  document.getElementById('fornFormSite').value = f ? f.site : '';
  document.getElementById('fornFormPrazo').value = f ? f.prazo : '';
  document.getElementById('fornFormPagamento').value = f ? f.pagamento : '';
  document.getElementById('fornFormObs').value = f ? f.obs : '';

  modal.classList.remove('hidden');
}

function fecharModalFornecedorCRM() {
  const modal = document.getElementById('modalFornecedorCRM');
  if (modal) modal.classList.add('hidden');
}

function salvarFormFornecedorCRM(e) {
  e.preventDefault();
  const forns = lerCRMFornecedores();
  const id = document.getElementById('fornFormId').value;

  const dados = {
    id: id || ('forn_' + Date.now()),
    nome: document.getElementById('fornFormNome').value.trim(),
    categoria: document.getElementById('fornFormCategoria').value,
    cidade: document.getElementById('fornFormCidade').value.trim(),
    contato: document.getElementById('fornFormContato').value.trim(),
    whatsapp: document.getElementById('fornFormWhatsapp').value.trim(),
    site: document.getElementById('fornFormSite').value.trim(),
    prazo: document.getElementById('fornFormPrazo').value.trim(),
    pagamento: document.getElementById('fornFormPagamento').value.trim(),
    obs: document.getElementById('fornFormObs').value.trim()
  };

  if (id) {
    const idx = forns.findIndex(x => x.id === id);
    if (idx !== -1) forns[idx] = dados;
  } else {
    forns.unshift(dados);
  }

  salvarCRMFornecedores(forns);
  fecharModalFornecedorCRM();
  renderizarFornecedoresView();
}

function excluirFornecedorCRM(fornId) {
  if (!confirm('Excluir este fornecedor da sua base?')) return;
  const forns = lerCRMFornecedores().filter(f => f.id !== fornId);
  salvarCRMFornecedores(forns);
  renderizarFornecedoresView();
}

// ============================================================================
// BACKUP EXPORTAR / IMPORTAR (.JSON)
// ============================================================================
function exportarBackupCRM() {
  const payload = {
    versao: 1,
    exportadoEm: new Date().toISOString(),
    oportunidades: lerCRMOportunidades(),
    fornecedores: lerCRMFornecedores()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_crm_mei_rafael_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importarBackupCRM(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const data = JSON.parse(ev.target.result);
      if (Array.isArray(data.oportunidades)) salvarCRMOportunidades(data.oportunidades);
      if (Array.isArray(data.fornecedores)) salvarCRMFornecedores(data.fornecedores);
      alert('Backup restaurado com sucesso!');
      if (crmAbaAtual === 'crm') renderizarCRM();
      if (crmAbaAtual === 'fornecedores') renderizarFornecedoresView();
    } catch (err) {
      alert('Arquivo de backup inválido.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

window.addEventListener('DOMContentLoaded', () => {
  atualizarBadgesNavegacao();
});

