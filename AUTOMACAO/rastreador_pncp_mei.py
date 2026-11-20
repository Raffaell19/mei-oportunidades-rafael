# -*- coding: utf-8 -*-
"""
Robô Rastreador de Oportunidades Públicas para MEI (PNCP, Contrata+ Brasil & Compras RS)
Foco: Vale do Paranhana, Vale dos Sinos, Porto Alegre e Região Metropolitana (RS).
Atualiza diretamente radar_pncp_mei.json e radar_pncp_data.js na raiz do projeto.
"""

import os
import re
import json
import datetime
import urllib.request
import urllib.parse
import time

TERMOS_BLOQUEIO_SUBCONTRATACAO_MEI = [
    "vigilancia", "vigilância", "seguranca armada", "segurança armada", "vigilante",
    "dedicação exclusiva de mão de obra", "dedicacao exclusiva", "posto de trabalho",
    "copeiragem", "copeira", "recepcionista presencial", "recepcao fixa",
    "pavimentação asfáltica", "terraplanagem pesada", "dap rural", "caf rural", "pronaf",
    "controle integrado de pragas", "desinsetização e desratização"
]

VALE_PARANHANA_SINOS = [
    "nova hartz", "sapiranga", "araricá", "ararica", "parobé", "parobe",
    "taquara", "igrejinha", "três coroas", "tres coroas", "rolante", "riozinho",
    "campo bom", "novo hamburgo", "são leopoldo", "sao leopoldo",
    "estância velha", "estancia velha", "dois irmãos", "dois irmaos",
    "ivoti", "portão", "portao", "sapucaia do sul", "esteio"
]

REGIAO_METROPOLITANA_POA = VALE_PARANHANA_SINOS + [
    "porto alegre", "canoas", "gravataí", "gravatai", "cachoeirinha",
    "alvorada", "viamão", "viamao", "guaíba", "guaiba", "eldorado do sul",
    "montenegro", "triunfo", "charqueadas", "nova santa rita", "glorinha",
    "santo antônio da patrulha", "santo antonio da patrulha"
]


def buscar_pncp_modalidade(codigo_modalidade, dias_frente=30, max_paginas=15):
    hoje = datetime.date.today()
    data_inicial_str = hoje.strftime("%Y%m%d")
    data_final_str = (hoje + datetime.timedelta(days=dias_frente)).strftime("%Y%m%d")

    todos_itens = []
    pagina = 1

    while pagina <= max_paginas:
        url = (
            f"https://pncp.gov.br/api/consulta/v1/contratacoes/proposta"
            f"?dataInicial={data_inicial_str}&dataFinal={data_final_str}"
            f"&codigoModalidadeContratacao={codigo_modalidade}&uf=RS&pagina={pagina}&tamanhoPagina=50"
        )
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "application/json"
            }
        )
        sucesso = False
        for tentativa in range(3):
            try:
                with urllib.request.urlopen(req, timeout=25) as res:
                    data = json.loads(res.read().decode("utf-8"))
                    itens = data.get("data", [])
                    if not itens:
                        return todos_itens
                    todos_itens.extend(itens)
                    total_registros = data.get("totalRegistros", 0)
                    if len(todos_itens) >= total_registros:
                        return todos_itens
                    pagina += 1
                    sucesso = True
                    time.sleep(0.35)
                    break
            except Exception as e:
                print(f"[!] Mod {codigo_modalidade} pag {pagina} tentativa {tentativa+1} erro: {e}")
                time.sleep(1.5)
        if not sucesso:
            break

    return todos_itens


def resolver_link_dispensa(item):
    link_origem = item.get("linkSistemaOrigem")
    link_processo = item.get("linkProcessoEletronico")
    objeto = item.get("objetoCompra") or ""
    num_controle = item.get("numeroControlePNCP") or ""
    cnpj = item.get("orgaoEntidade", {}).get("cnpj") or ""
    ano = item.get("anoCompra") or ""
    seq = item.get("sequencialCompra") or ""

    if link_origem and link_origem.startswith("http"):
        return link_origem, "Link Direto Oficial"
    if link_processo and link_processo.startswith("http"):
        return link_processo, "Processo Eletrônico"
    if "PORTAL DE COMPRAS PÚBLICAS" in objeto.upper():
        return "https://www.portaldecompraspublicas.com.br/processos", "Portal de Compras Públicas"
    if cnpj and ano and seq:
        return f"https://pncp.gov.br/app/editais?q={urllib.parse.quote(num_controle)}", "Edital no PNCP"
    if num_controle:
        return f"https://pncp.gov.br/app/editais?q={urllib.parse.quote(num_controle)}", "Edital Oficial no PNCP"
    return "https://pncp.gov.br/app/editais", "Portal PNCP"


def gerar_titulo_fiel(objeto):
    txt = re.sub(r"\s+", " ", objeto or "").strip()
    if not txt:
        return "Oportunidade Pública MEI"
    # Remove prefixos burocráticos comuns para deixar o título direto ao ponto
    prefixos = [
        r"^(?:a presente licita[çc][ãa]o tem por finalidade o )?(?:registro de pre[çc]os? para )?(?:futura e eventual )?",
        r"^(?:contrata[çc][ãa]o de empresa especializada (?:para|na) )?",
        r"^(?:aquisi[çc][ãa]o|fornecimento|presta[çc][ãa]o de servi[çc]os) (?:de |para )?"
    ]
    limpo = txt
    for p in prefixos:
        limpo = re.sub(p, "", limpo, flags=re.I).strip()
    if len(limpo) < 12:
        limpo = txt
    if len(limpo) > 85:
        limpo = limpo[:82].rsplit(" ", 1)[0] + "..."
    return limpo[0].upper() + limpo[1:]


def classificar_oportunidade(item, modalidade):
    objeto = (item.get("objetoCompra") or "").strip()
    valor_estimado = float(item.get("valorTotalEstimado") or 0.0)
    cidade = (item.get("unidadeOrgao") or {}).get("municipioNome") or "RS"
    orgao = (item.get("orgaoEntidade") or {}).get("razaoSocial") or ""
    unidade = (item.get("unidadeOrgao") or {}).get("nomeUnidade") or orgao
    usuario_origem = item.get("usuarioNome") or ""
    encerramento = item.get("dataEncerramentoProposta") or ""
    num_controle = item.get("numeroControlePNCP") or ""
    modalidade_nome = item.get("modalidadeNome") or ("Dispensa" if modalidade == 8 else "Pregão Eletrônico")

    cidade_low = cidade.lower()
    eh_vale_paranhana_sinos = any(c in cidade_low for c in VALE_PARANHANA_SINOS)
    eh_rm_poa = any(c in cidade_low for c in REGIAO_METROPOLITANA_POA)

    # Verifica prazo em aberto
    esta_aberta = True
    data_limite_fmt = encerramento
    if encerramento:
        try:
            dt_enc = datetime.datetime.fromisoformat(encerramento.replace("Z", ""))
            if dt_enc <= datetime.datetime.now():
                esta_aberta = False
            data_limite_fmt = dt_enc.strftime("%d/%m/%Y às %H:%M")
        except Exception:
            pass

    if not esta_aberta:
        return None

    link_final, tipo_link = resolver_link_dispensa(item)
    texto_all = f"{objeto} {unidade} {usuario_origem} {link_final}".lower()

    eh_comprasgov = (
        "compras.gov.br" in usuario_origem.lower()
        or "cnetmobile" in link_final.lower()
        or "contrata+" in texto_all
        or "contratamais" in texto_all
    )
    eh_compras_rs = "compras.rs.gov.br" in link_final.lower() or "procergs" in usuario_origem.lower()

    if eh_comprasgov:
        plataforma = "Contrata+ Brasil / Compras.gov.br"
    elif eh_compras_rs:
        plataforma = "Compras RS (Governo Estadual)"
    elif "portaldecompraspublicas" in link_final.lower() or "PORTAL DE COMPRAS PÚBLICAS" in objeto.upper():
        plataforma = "Portal de Compras Públicas"
    elif "ipm" in usuario_origem.lower():
        plataforma = "Portal IPM (Prefeitura/Autarquia)"
    else:
        plataforma = usuario_origem or "Portal Governamental"

    # Regras de entrada no painel:
    # 1) Contrata+ Brasil / Compras.gov.br em POA + RM (inclui Vale dos Sinos e Paranhana)
    # 2) Todas as oportunidades abertas do Vale do Paranhana e Vale dos Sinos
    # 3) Dispensas em POA + RM com valor até R$ 100 mil (ou oculto)
    if modalidade == 6 and not eh_vale_paranhana_sinos:
        # Pregões distantes fora do Vale do Paranhana/Sinos não poluem o painel
        return None

    if not eh_rm_poa and not eh_vale_paranhana_sinos:
        return None

    if modalidade == 8 and not eh_vale_paranhana_sinos and valor_estimado > 100000:
        return None

    eh_bloqueado = any(t in (objeto + " " + orgao).lower() for t in TERMOS_BLOQUEIO_SUBCONTRATACAO_MEI)
    if eh_bloqueado:
        return None

    score_oceano = 60
    motivos_oceano = []
    if eh_vale_paranhana_sinos:
        score_oceano += 20
        motivos_oceano.append(f"Demanda Regional Vale Paranhana/Sinos ({cidade})")
    elif eh_rm_poa:
        score_oceano += 10
        motivos_oceano.append(f"Região Metropolitana / POA ({cidade})")

    if eh_compras_rs:
        score_oceano += 15
        motivos_oceano.append("Portal RS Exclusivo: Exige CFE Estadual")
    if 0 < valor_estimado <= 60000:
        score_oceano += 10
        motivos_oceano.append("Valor Compatível MEI")

    score_oceano = min(score_oceano, 98)
    nivel_concorrencia = "Baixíssima" if score_oceano >= 80 else "Baixa"

    titulo_fiel = gerar_titulo_fiel(objeto)
    tags = [cidade, modalidade_nome]
    if eh_vale_paranhana_sinos:
        tags.insert(0, "Vale Paranhana & Sinos")
    if eh_comprasgov:
        tags.append("Contrata+ Brasil")

    num_edital = str(item.get("numeroCompra") or "")
    orgao_exib = f"{unidade} ({modalidade_nome} nº {num_edital})" if num_edital else unidade

    return {
        "id": num_controle.replace("/", "_").replace("-", "_"),
        "numeroControle": num_controle,
        "orgao": orgao_exib,
        "cidade": cidade,
        "objeto": objeto,
        "valorEstimado": valor_estimado,
        "valorFormatado": f"R$ {valor_estimado:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") if valor_estimado > 0 else "Valor Oculto / Sob Cotação",
        "dataEncerramento": data_limite_fmt,
        "dataEncerramentoIso": encerramento,
        "link": f"https://pncp.gov.br/app/editais?q={urllib.parse.quote(num_controle)}" if num_controle else link_final,
        "linkPncp": f"https://pncp.gov.br/app/editais?q={urllib.parse.quote(num_controle)}" if num_controle else link_final,
        "linkDireto": link_final,
        "linkSistemaOficial": link_final,
        "tipoLink": tipo_link,
        "plataforma": plataforma,
        "ehComprasGov": eh_comprasgov,
        "ehContrataMais": eh_comprasgov,
        "compativelMEI": True,
        "permiteCompraFornecedor": True,
        "seloMEI": "⭐ VALE PARANHANA & SINOS • Prioridade Regional" if eh_vale_paranhana_sinos else "✓ Compra de Fornecedor / Revenda 100% Permitida",
        "ehRegiaoProxima": eh_rm_poa,
        "ehValeParanhana": eh_vale_paranhana_sinos,
        "tags": tags,
        "scoreOceanoAzul": score_oceano,
        "nivelConcorrencia": nivel_concorrencia,
        "motivosConcorrencia": motivos_oceano,
        "ehDesertaOuProrrogada": False,
        "titulo": titulo_fiel,
        "tituloResumo": titulo_fiel,
        "tituloCurto": titulo_fiel,
        "numeroEdital": num_edital,
        "processo": str(item.get("processo") or "")
    }


def executar_rastreamento():
    print("[*] Conectando ao PNCP (RS - Dispensas e Pregões em aberto)...")
    dispensas = buscar_pncp_modalidade(8, dias_frente=30, max_paginas=10)
    pregoes = buscar_pncp_modalidade(6, dias_frente=30, max_paginas=35)
    print(f"[*] Brutos coletados: {len(dispensas)} dispensas | {len(pregoes)} pregões")

    vistos = set()
    oportunidades = []

    for mod, lista in [(8, dispensas), (6, pregoes)]:
        for item in lista:
            res = classificar_oportunidade(item, mod)
            if res and res["id"] not in vistos:
                vistos.add(res["id"])
                oportunidades.append(res)

    oportunidades.sort(key=lambda x: x.get("dataEncerramentoIso") or "9999-12-31")
    print(f"[✓] Oportunidades ativas filtradas (Vale Paranhana/Sinos + POA/RM): {len(oportunidades)}")

    raiz = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    output_json = os.path.join(raiz, "radar_pncp_mei.json")
    output_js = os.path.join(raiz, "radar_pncp_data.js")

    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(oportunidades, f, ensure_ascii=False, indent=2)

    with open(output_js, "w", encoding="utf-8") as f:
        f.write("window.RADAR_PNCP_DATA = " + json.dumps(oportunidades, ensure_ascii=False, indent=2) + ";\n")

    print(f"[✓] Atualizado na raiz:\n  - {output_json}\n  - {output_js}")
    return oportunidades


if __name__ == "__main__":
    executar_rastreamento()
