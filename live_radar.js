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

function liveGerarTituloFiel(objeto) {
  let txt = String(objeto || '').replace(/\s+/g, ' ').trim();
  if (!txt) return 'Oportunidade Pública MEI';
  txt = txt
    .replace(/^(?:a presente licita[çc][ãa]o tem por finalidade o )?(?:registro de pre[çc]os? para )?(?:futura e eventual )?/i, '')
    .replace(/^(?:contrata[çc][ãa]o de empresa especializada (?:para|na) )?/i, '')
    .replace(/^(?:aquisi[çc][ãa]o|fornecimento|presta[çc][ãa]o de servi[çc]os) (?:de |para )?/i, '')
    .trim();
  if (txt.length < 12) txt = String(objeto || '').replace(/\s+/g, ' ').trim();
  if (txt.length > 85) txt = txt.slice(0, 82).replace(/\s+\S*$/, '') + '...';
  return txt.charAt(0).toUpperCase() + txt.slice(1);
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
  const tit = liveGerarTituloFiel(objeto);

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
