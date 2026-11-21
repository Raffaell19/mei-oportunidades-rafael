// ============================================================================
// MOTOR AO VIVO PNCP (CLIENT-SIDE) - ATUALIZA OPORTUNIDADES AUTOMATICAMENTE
// Busca Dispensas (8) e Pregões (6) em aberto no RS direto da API do PNCP
// e mescla em tempo real com window.RADAR_PNCP_DATA.
// ============================================================================

const LIVE_VALE_PARANHANA_SINOS = [
  'nova hartz', 'sapiranga', 'araricá', 'ararica', 'parobé', 'parobe',
  'taquara', 'igrejinha', 'três coroas', 'tres coroas', 'rolante', 'riozinho',
  'campo bom', 'novo hamburgo', 'são leopoldo', 'sao leopoldo',
  'estância velha', 'estancia velha', 'dois irmãos', 'dois irmaos',
  'ivoti', 'portão', 'portao', 'sapucaia do sul', 'esteio'
];

const LIVE_RM_POA = [
  ...LIVE_VALE_PARANHANA_SINOS,
  'porto alegre', 'canoas', 'gravataí', 'gravatai', 'cachoeirinha',
  'alvorada', 'viamão', 'viamao', 'guaíba', 'guaiba', 'eldorado do sul',
  'montenegro', 'triunfo', 'charqueadas', 'nova santa rita', 'glorinha',
  'santo antônio da patrulha', 'santo antonio da patrulha'
];

const LIVE_BLOQUEIO_MEI = [
  'vigilancia', 'vigilância', 'seguranca armada', 'segurança armada',
  'dedicação exclusiva', 'dedicacao exclusiva', 'posto de trabalho',
  'pavimentação asfáltica', 'dap rural', 'caf rural', 'pronaf'
];

function liveSmartTitleCase(texto) {
  const siglas = new Set(['LED', 'USB', '8TB', '15KV', 'ETP', 'TR', 'RS', 'POA', 'CMS', 'PRF', 'TI', 'CFTV', 'HDMI', 'PVC', 'ACM', 'MDF', 'EPI', 'CONAB', 'SME', 'PNCP', 'MEI', 'UPS']);
  const minusculas = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'com', 'sem', 'por', 'a', 'o', 'as', 'os', 'no', 'na', 'nos', 'nas', 'ao', 'à']);
  return texto.split(/\s+/).map((w, i) => {
    const cw = w.replace(/[^\wÀ-ÿ]/g, '').toUpperCase();
    if (siglas.has(cw) || /^\d+[A-Z]+$/.test(cw)) return w.toUpperCase();
    if (i > 0 && minusculas.has(w.toLowerCase())) return w.toLowerCase();
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');
}

function liveEscolherEmoji(txtLow) {
  const regras = [
    ['🚗', ['veicular', 'seguro veicular', 'viatura', 'elevador automotivo', 'pedágio', 'pedagio', 'pneu', 'automotivo']],
    ['🩺', ['diagnóstica', 'diagnostica', 'medicinal', 'ar comprimido medicinal', 'hospitalar', 'saúde', 'saude', 'odonto', 'médico', 'medico']],
    ['💻', ['informatica', 'informática', 'computador', 'notebook', 'nobreak', 'hd ', 'ssd', 'monitor', 'impressora', 'outsourcing', 'licença', 'licenca', 'creative cloud', 'fibra', 'transceptor', 'switch', 'mesa de som']],
    ['⚡', ['elétrica', 'eletrica', 'elétrico', 'eletrico', 'lâmpada', 'lampada', 'disjuntor', 'fusivel', 'fusível', 'aterramento', 'cabo cobre', 'plugue', 'alicate', 'iluminação', 'iluminacao']],
    ['❄️', ['ar-condicionado', 'ar condicionado', 'climatização', 'climatizacao', 'refrigeração', 'refrigeracao']],
    ['🪑', ['móveis', 'moveis', 'mesa', 'cadeira', 'armário', 'armario', 'estofado', 'persiana', 'cortina', 'mobiliário', 'mobiliario', 'mudança', 'mudanca']],
    ['🛠️', ['pintura', 'pedreiro', 'alvenaria', 'drywall', 'gesso', 'forro', 'porcelanato', 'piso', 'telhado', 'portão', 'portao', 'grade', 'serralheria', 'hidrojateamento', 'caixas pluviais', 'vidro', 'esquadria']],
    ['🔩', ['ferragem', 'ferragens', 'abrasivo', 'construção', 'construcao', 'ferramenta', 'parafuso']],
    ['🧹', ['limpeza', 'higiene', 'papel toalha', 'sabão', 'detergente', 'descartável', 'descartavel']],
    ['🖨️', ['gráfico', 'grafico', 'gráficos', 'graficos', 'adesivo', 'placa', 'bandeira', 'carimbo', 'impressão', 'impressao', 'informativo']],
    ['👕', ['vestuário', 'vestuario', 'uniforme', 'camiseta', 'boné', 'bone']],
    ['⚽', ['esportivo', 'esportivos', 'troféu', 'trofeu', 'medalha', 'futebol']],
    ['🍽️', ['alimento', 'alimentação', 'alimentacao', 'coffee', 'feijão', 'feijao', 'lanche', 'refeição', 'refeicao', 'aquecedor de xícaras']],
    ['📣', ['marketing', 'redes sociais', 'social media', 'vídeo', 'video', 'audiovisual', 'design']]
  ];
  for (const [emoji, kws] of regras) {
    if (kws.some(k => txtLow.includes(k))) return emoji;
  }
  return '📦';
}

function liveGerarTituloFiel(objeto, orgao = '') {
  const txt = String(objeto || '').replace(/\s+/g, ' ').trim();
  if (!txt) return '📦 Oportunidade Pública MEI';
  let limpo = txt;
  const mFam = txt.match(/BENS DA\(S\) FAM[ÍI]LIA\(S\):\s*\d+\s*[-–]\s*(.+)/i);
  if (mFam) {
    const fam = mFam[1].replace(/;\s*\d+\s*[-–]\s*/g, ' e ').replace(/\bP\/\s*/gi, 'para ').replace(/\//g, ' / ').replace(/^[;\s.,-]+|[;\s.,-]+$/g, '');
    limpo = liveSmartTitleCase(fam);
  } else {
    const prefixos = [
      /^\[[^\]]+\]\s*[-–—:]?\s*/i,
      /^(?:a presente licita[çc][ãa]o tem por finalidade (?:o|a) )?/i,
      /^(?:abertura de licita[çc][ãa]o para (?:o |a )?)?(?:registro de pre[çc]os? para )?(?:futura e eventual )?/i,
      /^(?:bens comuns,?\s*por itens,?\s*atrav[ée]s de\s*)?dispensa (?:de licita[çc][ãa]o )?(?:eletr[ôo]nica )?(?:para (?:a |o )?)?/i,
      /^(?:contrata[çc][ãa]o de (?:empresa(?: especializada)? )?(?:para|na|no|em|de) (?:a |o |os |as )?)/i,
      /^(?:aquisi[çc][ãa]o|compra|fornecimento|presta[çc][ãa]o de servi[çc]os?|execu[çc][ãa]o de servi[çc]os?) (?:cont[íi]nuos? )?(?:de |para |e )?/i,
      /^(?:o |a |e )(?=[a-zà-ÿ]+ )/i
    ];
    for (let r = 0; r < 2; r++) {
      for (const p of prefixos) limpo = limpo.replace(p, '').trim();
    }
    limpo = limpo.replace(/,?\s*(?:conforme condi[çc][õo]es|nos termos|de acordo com|para atender [àa]s necessidades|em favor do).*$/i, '').replace(/[\s,.;-]+$/g, '');
    if (limpo.length < 8) limpo = txt;
    limpo = limpo === limpo.toUpperCase() ? liveSmartTitleCase(limpo) : limpo.charAt(0).toUpperCase() + limpo.slice(1);
  }
  if (/^conforme\s+etp\s+e\s+tr\.?$/i.test(limpo)) {
    const orgCurto = String(orgao || '').replace(/\s*\(.*?\)/g, '').trim().slice(0, 38);
    limpo = orgCurto ? `Demanda Conforme ETP/TR (${orgCurto})` : 'Demanda Conforme ETP/TR (Abrir Edital)';
  }
  if (limpo.length > 74) limpo = limpo.slice(0, 71).replace(/\s+\S*$/, '').replace(/[,.;-]+$/, '') + '...';
  const emoji = liveEscolherEmoji(`${limpo} ${txt}`.toLowerCase());
  return `${emoji} ${limpo}`;
}

function liveNormalizarItemPNCP(item, mod) {
  const objeto = (item.objetoCompra || '').trim();
  const valorEst = Number(item.valorTotalEstimado || 0);
  const cidade = (item.unidadeOrgao && item.unidadeOrgao.municipioNome) || 'RS';
  const orgao = (item.orgaoEntidade && item.orgaoEntidade.razaoSocial) || '';
  const unidade = (item.unidadeOrgao && item.unidadeOrgao.nomeUnidade) || orgao;
  const usuario = item.usuarioNome || '';
  const enc = item.dataEncerramentoProposta || '';
  const numCtrl = item.numeroControlePNCP || '';
  if (!numCtrl || !enc) return null;

  const dtEnc = new Date(enc.replace('Z', ''));
  if (isNaN(dtEnc.getTime()) || dtEnc <= new Date()) return null;

  const cidLow = cidade.toLowerCase();
  const ehVale = LIVE_VALE_PARANHANA_SINOS.some(c => cidLow.includes(c));
  const ehRM = LIVE_RM_POA.some(c => cidLow.includes(c));
  if (!ehRM && !ehVale) return null;
  if (mod === 6 && !ehVale) return null;
  if (mod === 8 && !ehVale && valorEst > 100000) return null;

  const txtLow = `${objeto} ${orgao}`.toLowerCase();
  if (LIVE_BLOQUEIO_MEI.some(b => txtLow.includes(b))) return null;

  const linkOrigem = item.linkSistemaOrigem || item.linkProcessoEletronico || '';
  const linkPncp = `https://pncp.gov.br/app/editais?q=${encodeURIComponent(numCtrl)}`;
  const linkFinal = linkOrigem.startsWith('http') ? linkOrigem : linkPncp;
  const ehComprasGov = usuario.toLowerCase().includes('compras.gov') || linkFinal.toLowerCase().includes('cnetmobile') || txtLow.includes('contrata+');
  const ehComprasRS = linkFinal.toLowerCase().includes('compras.rs.gov.br') || usuario.toLowerCase().includes('procergs');

  const pad = n => String(n).padStart(2, '0');
  const dataFmt = `${pad(dtEnc.getDate())}/${pad(dtEnc.getMonth() + 1)}/${dtEnc.getFullYear()} às ${pad(dtEnc.getHours())}:${pad(dtEnc.getMinutes())}`;
  const modNome = item.modalidadeNome || (mod === 8 ? 'Dispensa' : 'Pregão Eletrônico');
  const numEd = item.numeroCompra ? ` (${modNome} nº ${item.numeroCompra})` : '';
  const tit = liveGerarTituloFiel(objeto, unidade);

  return {
    id: numCtrl.replace(/[\/-]/g, '_'),
    numeroControle: numCtrl,
    orgao: `${unidade}${numEd}`,
    cidade,
    objeto,
    valorEstimado: valorEst,
    valorFormatado: valorEst > 0 ? valorEst.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Valor Oculto / Sob Cotação',
    dataEncerramento: dataFmt,
    dataEncerramentoIso: enc,
    link: linkPncp,
    linkPncp,
    linkDireto: linkFinal,
    linkSistemaOficial: linkFinal,
    tipoLink: linkOrigem.startsWith('http') ? 'Link Direto Oficial' : 'Edital no PNCP',
    plataforma: ehComprasGov ? 'Contrata+ Brasil / Compras.gov.br' : (ehComprasRS ? 'Compras RS (Governo Estadual)' : (usuario || 'Portal Governamental')),
    ehComprasGov,
    ehContrataMais: ehComprasGov,
    compativelMEI: true,
    permiteCompraFornecedor: true,
    ehRegiaoProxima: ehRM,
    ehValeParanhana: ehVale,
    tags: [ehVale ? 'Vale Paranhana & Sinos' : 'POA & Região Metropolitana', cidade, modNome],
    scoreOceanoAzul: ehVale ? 92 : 76,
    nivelConcorrencia: ehVale ? 'Baixíssima' : 'Baixa',
    motivosConcorrencia: [ehVale ? `Demanda Regional (${cidade})` : `Região Metropolitana (${cidade})`],
    titulo: tit,
    tituloResumo: tit,
    tituloCurto: tit,
    numeroEdital: String(item.numeroCompra || ''),
    processo: String(item.processo || '')
  };
}

async function buscarPaginaPNCP(mod, dataIni, dataFim, pag) {
  const url = `https://pncp.gov.br/api/consulta/v1/contratacoes/proposta?dataInicial=${dataIni}&dataFinal=${dataFim}&codigoModalidadeContratacao=${mod}&uf=RS&pagina=${pag}&tamanhoPagina=50`;
  const resp = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!resp.ok) return { data: [], totalRegistros: 0 };
  return resp.json();
}

async function sincronizarPNCPAoVivo(manual = false) {
  const statusEl = document.getElementById('liveRadarStatusTxt');
  if (statusEl) statusEl.innerText = '🔄 Buscando novas no PNCP...';

  try {
    const hoje = new Date();
    const fim = new Date(hoje.getTime() + 30 * 86400000);
    const fmt = d => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const dIni = fmt(hoje);
    const dFim = fmt(fim);

    const coletados = [];
    // Busca sequencial leve com pequena pausa para evitar rate-limit (429) do PNCP
    for (const [mod, maxP] of [[8, 5], [6, 5]]) {
      for (let p = 1; p <= maxP; p++) {
        try {
          const r = await buscarPaginaPNCP(mod, dIni, dFim, p);
          if (!r || !Array.isArray(r.data) || r.data.length === 0) break;
          r.data.forEach(it => {
            const norm = liveNormalizarItemPNCP(it, mod);
            if (norm) coletados.push(norm);
          });
          if (r.totalRegistros && p * 50 >= r.totalRegistros) break;
          await new Promise(res => setTimeout(res, 250));
        } catch (e) {
          break;
        }
      }
    }

    if (!Array.isArray(window.RADAR_PNCP_DATA)) window.RADAR_PNCP_DATA = [];
    const existentes = new Set(window.RADAR_PNCP_DATA.map(x => String(x.id)));
    let novas = 0;

    coletados.forEach(item => {
      if (!existentes.has(String(item.id))) {
        existentes.add(String(item.id));
        window.RADAR_PNCP_DATA.unshift(item);
        novas++;
      }
    });

    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (statusEl) {
      statusEl.innerText = novas > 0
        ? `🟢 Ao vivo (${hora}) • +${novas} nova(s)`
        : `🟢 Ao vivo (${hora}) • Atualizado`;
    }

    if (typeof atualizarContadoresPastas === 'function') atualizarContadoresPastas();
    const abaAtiva = document.querySelector('.filter-btn.active')?.getAttribute('data-filter');
    if (abaAtiva && typeof filterCards === 'function' && (novas > 0 || manual)) {
      filterCards(abaAtiva);
    }
  } catch (err) {
    if (statusEl) statusEl.innerText = '⚠️ Offline / Usando cache';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => sincronizarPNCPAoVivo(false), 800);
  setInterval(() => sincronizarPNCPAoVivo(false), 5 * 60 * 1000);
});
