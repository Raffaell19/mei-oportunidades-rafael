# -*- coding: utf-8 -*-
"""
Robô Rastreador de Oportunidades Públicas para MEI (PNCP & Compras.gov.br)
Foco: Vale do Sinos, Grande Porto Alegre, Serra Gaúcha e Litoral Norte - RS.
"""

import os
import json
import datetime
import urllib.request
import urllib.parse
import urllib.error

# Cidades prioritárias no entorno de Nova Hartz / RS
CIDADES_PRIORITARIAS = [
    "Nova Hartz", "Sapiranga", "Araricá", "Parobé", "Taquara",
    "Campo Bom", "Novo Hamburgo", "São Leopoldo", "Estância Velha",
    "Dois Irmãos", "Ivoti", "Porto Alegre", "Canoas", "Esteio",
    "Sapucaia do Sul", "Gravataí", "Cachoeirinha", "Alvorada",
    "Viamão", "Guaíba", "Caxias do Sul", "Bento Gonçalves",
    "Farroupilha", "Gramado", "Canela", "Igrejinha", "Três Coroas",
    "Rolante", "Osório", "Tramandaí", "Capão da Canoa", "Montenegro",
    "Triunfo", "Charqueadas", "Eldorado do Sul"
]

# Palavras-chave com alta aderência para MEI (serviços manuais e fornecimentos pontuais)
PALAVRAS_CHAVE_MEI = [
    "serviço", "manutenção", "reparo", "instalação", "elétrica", "eletrico",
    "chaveiro", "tranca", "fechadura", "porta", "janela", "grade",
    "pintura", "drywall", "gesso", "marcenaria", "serralheria", "solda",
    "coffee", "lanche", "alimentação", "salgado", "doce", "panificação",
    "material", "suporte", "quadro", "placa", "comunicação visual",
    "toldo", "cobertura", "calha", "vidro", "limpeza", "higienização",
    "madeira", "marcenaria", "persiana", "cortina", "divisoria"
]

def buscar_todas_dispensas_rs(dias_frente=7):
    hoje = datetime.date.today()
    data_final = hoje + datetime.timedelta(days=dias_frente)
    data_final_str = data_final.strftime("%Y%m%d")

    todos_itens = []
    pagina = 1

    while True:
        url = (
            f"https://pncp.gov.br/api/consulta/v1/contratacoes/proposta"
            f"?dataFinal={data_final_str}&codigoModalidadeContratacao=8&uf=RS&pagina={pagina}&tamanhoPagina=50"
        )
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json"
            }
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as res:
                data = json.loads(res.read().decode("utf-8"))
                itens = data.get("data", [])
                if not itens:
                    break
                todos_itens.extend(itens)
                total_registros = data.get("totalRegistros", 0)
                if len(todos_itens) >= total_registros:
                    break
                pagina += 1
        except Exception as e:
            print(f"[!] Erro ao buscar página {pagina}: {e}")
            break

    return todos_itens

def resolver_link_dispensa(item):
    """
    Determina o melhor link funcional para o usuário acessar a dispensa e enviar proposta:
    1. Se o órgão informou o link do sistema de origem (Compras.gov.br, Compras RS, etc.), usa-o diretamente.
    2. Se for detectado Portal de Compras Públicas no texto do objeto, direciona para o portal.
    3. Se não houver link direto, gera link de busca exata no PNCP por termo + link de busca oficial no Google.
    """
    link_origem = item.get("linkSistemaOrigem")
    link_processo = item.get("linkProcessoEletronico")
    usuario_origem = item.get("usuarioNome") or ""
    objeto = item.get("objetoCompra") or ""
    num_controle = item.get("numeroControlePNCP") or ""
    cidade = item.get("unidadeOrgao", {}).get("municipioNome") or ""
    orgao = item.get("orgaoEntidade", {}).get("razaoSocial") or ""

    if link_origem and link_origem.startswith("http"):
        return link_origem, "Link Direto Oficial"

    if link_processo and link_processo.startswith("http"):
        return link_processo, "Processo Eletrônico"

    if "PORTAL DE COMPRAS PÚBLICAS" in objeto.upper():
        return "https://www.portaldecompraspublicas.com.br/processos", "Portal de Compras Públicas"

    if "IPM Sistemas" in usuario_origem:
        # Ex: Novo Hamburgo / Farroupilha IPM
        q = urllib.parse.quote(f"IPM compras {cidade} dispensa")
        return f"https://www.google.com/search?q={q}", "Portal IPM Atende.net"

    # Fallback seguro: Busca direta pelo número de controle no PNCP
    if num_controle:
        q_pncp = urllib.parse.quote(num_controle)
        return f"https://pncp.gov.br/app/editais?q={q_pncp}", "Buscar Edital no PNCP"

    q_geral = urllib.parse.quote(f"{orgao} dispensa {cidade}")
    return f"https://www.google.com/search?q={q_geral}", "Portal de Compras do Município"

def classificar_oportunidade(item):
    objeto = (item.get("objetoCompra") or "").strip()
    valor_estimado = item.get("valorTotalEstimado") or 0.0
    cidade = item.get("unidadeOrgao", {}).get("municipioNome") or "RS"
    orgao = item.get("orgaoEntidade", {}).get("razaoSocial") or ""
    unidade = item.get("unidadeOrgao", {}).get("nomeUnidade") or orgao
    usuario_origem = item.get("usuarioNome") or ""
    encerramento = item.get("dataEncerramentoProposta") or ""
    num_controle = item.get("numeroControlePNCP") or ""

    compativel_porte = (valor_estimado <= 65000.0) if valor_estimado > 0 else True
    eh_regiao_proxima = any(c.lower() in cidade.lower() for c in CIDADES_PRIORITARIAS)

    objeto_lower = objeto.lower()
    tags = []
    score = 0
    for kw in PALAVRAS_CHAVE_MEI:
        if kw in objeto_lower:
            score += 1
            if len(tags) < 3:
                tags.append(kw.capitalize())

    data_limite_fmt = encerramento
    if encerramento:
        try:
            dt = datetime.datetime.fromisoformat(encerramento.replace("Z", ""))
            data_limite_fmt = dt.strftime("%d/%m/%Y às %H:%M")
        except Exception:
            pass

    link_final, tipo_link = resolver_link_dispensa(item)

    # Identificar plataforma de disputa
    eh_comprasgov = "Compras.gov.br" in usuario_origem or "cnetmobile" in link_final
    if eh_comprasgov:
        plataforma = "Contrata+ Brasil / Compras.gov.br"
    elif "compras.rs.gov.br" in link_final or "PROCERGS" in usuario_origem:
        plataforma = "Compras RS (Governo Estadual)"
    elif "portaldecompraspublicas" in link_final or "PORTAL DE COMPRAS PÚBLICAS" in objeto.upper():
        plataforma = "Portal de Compras Públicas"
    elif "IPM" in usuario_origem:
        plataforma = "Portal IPM (Prefeitura/Autarquia)"
    else:
        plataforma = usuario_origem or "Portal Governamental"

    return {
        "id": num_controle.replace("/", "_").replace("-", "_"),
        "numeroControle": num_controle,
        "orgao": unidade,
        "cidade": cidade,
        "objeto": objeto,
        "valorEstimado": valor_estimado,
        "valorFormatado": f"R$ {valor_estimado:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") if valor_estimado > 0 else "Valor Oculto / Sob Cotação",
        "dataEncerramento": data_limite_fmt,
        "dataEncerramentoIso": encerramento,
        "link": link_final,
        "tipoLink": tipo_link,
        "plataforma": plataforma,
        "ehComprasGov": eh_comprasgov,
        "compativelMEI": compativel_porte and (score > 0 or eh_regiao_proxima),
        "ehRegiaoProxima": eh_regiao_proxima,
        "tags": tags or ["Oportunidade MEI"]
    }

def executar_rastreamento():
    print("[*] Conectando ao Portal Nacional de Contratações Públicas (PNCP)...")
    itens_brutos = buscar_todas_dispensas_rs(dias_frente=7)
    print(f"[*] Total de dispensas em aberto localizadas no RS: {len(itens_brutos)}")

    oportunidades_selecionadas = []
    for item in itens_brutos:
        res = classificar_oportunidade(item)
        if res["compativelMEI"] and res["ehRegiaoProxima"]:
            oportunidades_selecionadas.append(res)

    print(f"[✓] Oportunidades MEI filtradas na sua região: {len(oportunidades_selecionadas)}")

    output_path = os.path.join(os.path.dirname(__file__), "radar_pncp_mei.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(oportunidades_selecionadas, f, ensure_ascii=False, indent=2)

    output_js = os.path.join(os.path.dirname(__file__), "radar_pncp_data.js")
    with open(output_js, "w", encoding="utf-8") as f:
        f.write("window.RADAR_PNCP_DATA = " + json.dumps(oportunidades_selecionadas, ensure_ascii=False, indent=2) + ";\n")

    print(f"[✓] Arquivos gerados com sucesso:\n  - {output_path}\n  - {output_js}")
    return oportunidades_selecionadas

if __name__ == "__main__":
    executar_rastreamento()
