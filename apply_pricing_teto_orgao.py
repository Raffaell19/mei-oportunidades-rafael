# -*- coding: utf-8 -*-
import re

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        c = f.read()

    # 1. Definir a função auxiliar gerarBlocoPrecificacaoCard logo antes de formatBRL
    fn_bloco = """    // ==============================================================
    // BLOCO INTELIGENTE: TETO MÁXIMO DO ÓRGÃO vs CUSTO vs LUCRO
    // ==============================================================
    function gerarBlocoPrecificacaoCard(tetoOrgao, custoEstimado, propostaSugerida, lucroLiquido) {
      return `
        <div class="mt-3 p-3 rounded-2xl bg-slate-50 border-2 border-slate-200/90 text-xs space-y-2">
          <!-- Teto Máximo que o Órgão Paga -->
          <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <div class="flex items-center gap-1.5">
              <span class="text-base">🏛️</span>
              <div>
                <span class="text-[10px] font-black uppercase text-slate-700 block leading-tight">Valor Disposto a Pagar (Órgão)</span>
                <span class="text-[9px] text-slate-500 font-bold block leading-none">Teto Máximo Admitido no Edital</span>
              </div>
            </div>
            <div class="text-right">
              <strong class="text-sm sm:text-base font-black text-slate-900 block leading-tight">${formatBRL(tetoOrgao)}</strong>
              <span class="text-[9px] font-black text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded border border-sky-300 uppercase">Teto Máximo</span>
            </div>
          </div>

          <!-- Comparativo em 3 Colunas: Custo de Fornecimento vs Proposta vs Lucro -->
          <div class="grid grid-cols-3 gap-1.5 text-center">
            <div class="p-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span class="text-[9px] font-bold text-slate-500 block uppercase leading-tight">Custo Estimado</span>
              <strong class="text-xs font-black text-rose-700 block leading-tight mt-0.5">${formatBRL(custoEstimado)}</strong>
            </div>
            <div class="p-1.5 rounded-xl bg-sky-50 border border-sky-200 shadow-xs">
              <span class="text-[9px] font-bold text-sky-800 block uppercase leading-tight">Sua Proposta</span>
              <strong class="text-xs font-black text-sky-950 block leading-tight mt-0.5">${formatBRL(propostaSugerida)}</strong>
            </div>
            <div class="p-1.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-xs">
              <span class="text-[9px] font-bold text-emerald-800 block uppercase leading-tight">Lucro Líquido</span>
              <strong class="text-xs font-black text-emerald-700 block leading-tight mt-0.5">+ ${formatBRL(lucroLiquido)}</strong>
            </div>
          </div>
        </div>
      `;
    }
"""

    if "function gerarBlocoPrecificacaoCard" not in c:
        c = c.replace("function formatBRL(valor) {", fn_bloco + "\n    function formatBRL(valor) {")
        print(f"[{filepath}] gerarBlocoPrecificacaoCard injected")

    # Atualizar formatBRL para ser à prova de falhas com qualquer tipo de entrada
    old_fmt_brl = """    function formatBRL(valor) {
      return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }"""
    new_fmt_brl = """    function formatBRL(valor) {
      const num = typeof valor === 'number' ? valor : (Number(valor) || 0);
      return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }"""
    if old_fmt_brl in c:
        c = c.replace(old_fmt_brl, new_fmt_brl)
        print(f"[{filepath}] formatBRL updated")

    # 2. Atualizar em renderizarOceanoAzul
    # Card interno
    old_oceano_interno_price = """              <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span class="text-[10px] font-bold text-slate-400 uppercase block">Proposta Sugerida</span>
                  <span class="text-sm font-black text-slate-900">${formatBRL(item.propostaSugerida)}</span>
                </div>
                <div class="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <span class="text-[10px] font-bold text-emerald-800 uppercase block">Lucro Líquido</span>
                  <span class="text-sm font-black text-emerald-700">+ ${formatBRL(lucro)}</span>
                </div>
              </div>"""
    new_oceano_interno_price = """              ${gerarBlocoPrecificacaoCard(item.valorReferencia, custoTotal, item.propostaSugerida, lucro)}"""

    if old_oceano_interno_price in c:
        c = c.replace(old_oceano_interno_price, new_oceano_interno_price)
        print(f"[{filepath}] Oceano Azul (interno) price block updated")
    else:
        print(f"[{filepath}] WARNING: old_oceano_interno_price not found")

    # Card radar
    old_oceano_radar_price = """              <div class="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div class="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Valor Estimado Órgão:</span>
                  <strong class="text-slate-900 font-black">${item.valorFormatado}</strong>
                </div>
                <div class="flex items-center justify-between text-emerald-700 font-bold text-xs pt-1 border-t border-slate-200">
                  <span>Lucro Projetado MEI:</span>
                  <span>+ ${formatBRL(balanco.lucroLiquido)}</span>
                </div>
              </div>"""
    new_oceano_radar_price = """              ${gerarBlocoPrecificacaoCard(balanco.valorReferencia, balanco.custoTotalEstimado, balanco.propostaRecomendada, balanco.lucroLiquido)}"""

    if old_oceano_radar_price in c:
        c = c.replace(old_oceano_radar_price, new_oceano_radar_price)
        print(f"[{filepath}] Oceano Azul (radar) price block updated")
    else:
        print(f"[{filepath}] WARNING: old_oceano_radar_price not found")

    # 3. Atualizar em renderizarPainelCompraFornecedor
    # Card interno (compra fornecedor)
    old_compra_interno_price = """              <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span class="text-[10px] font-bold text-slate-400 uppercase block">Proposta Sugerida</span>
                  <span class="text-sm font-black text-slate-900">${formatBRL(item.propostaSugerida)}</span>
                </div>
                <div class="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <span class="text-[10px] font-bold text-emerald-800 uppercase block">Lucro Líquido</span>
                  <span class="text-sm font-black text-emerald-700">+ ${formatBRL(lucro)}</span>
                </div>
              </div>"""

    # Note: old_compra_interno_price might be already replaced if identical string was used multiple times, let's check
    if old_compra_interno_price in c:
        c = c.replace(old_compra_interno_price, new_oceano_interno_price)
        print(f"[{filepath}] Compra Fornecedor (interno) price block updated")

    # Card radar (compra fornecedor)
    if old_oceano_radar_price in c:
        c = c.replace(old_oceano_radar_price, new_oceano_radar_price)
        print(f"[{filepath}] Compra Fornecedor (radar) price block updated")

    # 4. Atualizar em renderizarPainelContrataMais
    old_contrata_price = """            <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span class="text-[10px] font-bold text-slate-400 uppercase block">Proposta Sugerida</span>
                <span class="text-sm font-black text-slate-900">${formatBRL(s.propostaSugerida)}</span>
              </div>
              <div class="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span class="text-[10px] font-bold text-emerald-800 uppercase block">Lucro Líquido</span>
                <span class="text-sm font-black text-emerald-700">+ ${formatBRL(lucro)}</span>
              </div>
            </div>"""
    new_contrata_price = """            ${gerarBlocoPrecificacaoCard(s.valorReferencia, custoTotal, s.propostaSugerida, lucro)}"""

    if old_contrata_price in c:
        c = c.replace(old_contrata_price, new_contrata_price)
        print(f"[{filepath}] Painel Contrata+ Brasil price block updated")

    # 5. Atualizar em renderizarPainelComprasGovRs
    old_compras_gov_rs_price = """            <div class="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div class="flex items-center justify-between text-slate-500 text-[11px]">
                <span>Valor Estimado Órgão:</span>
                <strong class="text-slate-900 font-black">${r.valorFormatado}</strong>
              </div>
              <div class="flex items-center justify-between text-emerald-700 font-bold text-xs pt-1 border-t border-slate-200">
                <span>Lucro Projetado MEI:</span>
                <span>+ ${formatBRL(balanco.lucroLiquido)}</span>
              </div>
            </div>"""
    new_compras_gov_rs_price = """            ${gerarBlocoPrecificacaoCard(balanco.valorReferencia, balanco.custoTotalEstimado, balanco.propostaRecomendada, balanco.lucroLiquido)}"""

    if old_compras_gov_rs_price in c:
        c = c.replace(old_compras_gov_rs_price, new_compras_gov_rs_price)
        print(f"[{filepath}] Painel Compras Gov & RS price block updated")

    # 6. Atualizar em atualizarInterface (loop padrão de serviços)
    old_default_price = """            <div class="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div class="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                <span class="text-[10px] font-bold text-slate-400 uppercase block">Proposta Sugerida</span>
                <span class="text-sm font-black text-slate-900 block">${formatBRL(s.propostaSugerida)}</span>
              </div>
              <div class="bg-emerald-50/60 p-2 rounded-lg border border-emerald-200/60">
                <span class="text-[10px] font-bold text-emerald-800 uppercase block">Lucro Líquido</span>
                <span class="text-sm font-black text-emerald-700 block">+ ${formatBRL(lucro)}</span>
              </div>
            </div>"""
    new_default_price = """            ${gerarBlocoPrecificacaoCard(s.valorReferencia, custo, s.propostaSugerida, lucro)}"""

    if old_default_price in c:
        c = c.replace(old_default_price, new_default_price)
        print(f"[{filepath}] Loop padrão de serviços (atualizarInterface) price block updated")

    # 7. Atualizar nas Favoritas
    # Card interno em renderizarFavoritas
    old_fav_interno_price = """              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="p-2 rounded-lg bg-sky-50 border border-sky-100">
                  <span class="text-[10px] text-sky-800 font-bold block uppercase">Proposta</span>
                  <span class="text-sm font-black text-sky-900">${formatBRL(item.propostaSugerida)}</span>
                </div>
                <div class="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  <span class="text-[10px] text-emerald-800 font-bold block uppercase">Lucro Líquido</span>
                  <span class="text-sm font-black text-emerald-700">+ ${formatBRL(lucro)} <span class="text-[10px] font-normal">(${margem}%)</span></span>
                </div>
              </div>"""
    new_fav_interno_price = """              ${gerarBlocoPrecificacaoCard(item.valorReferencia, custo, item.propostaSugerida, lucro)}"""

    if old_fav_interno_price in c:
        c = c.replace(old_fav_interno_price, new_fav_interno_price)
        print(f"[{filepath}] Favoritas (interno) price block updated")

    # Card radar em renderizarFavoritas
    old_fav_radar_price = """              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span class="text-[10px] text-slate-500 font-bold block uppercase">Valor Estimado Máx</span>
                  <span class="text-sm font-black text-slate-900">${formatBRL(balanco.valorReferencia)}</span>
                </div>
                <div class="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  <span class="text-[10px] text-emerald-800 font-bold block uppercase">Lucro Líquido</span>
                  <span class="text-sm font-black text-emerald-700">+ ${formatBRL(balanco.lucroLiquido)} <span class="text-[10px] font-normal">(${balanco.margemPercentual}%)</span></span>
                </div>
              </div>"""
    new_fav_radar_price = """              ${gerarBlocoPrecificacaoCard(balanco.valorReferencia, balanco.custoTotalEstimado, balanco.propostaRecomendada, balanco.lucroLiquido)}"""

    if old_fav_radar_price in c:
        c = c.replace(old_fav_radar_price, new_fav_radar_price)
        print(f"[{filepath}] Favoritas (radar) price block updated")

    # 8. Atualizar em renderizarRadarPNCP
    old_radar_price = """              <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span class="text-[10px] text-slate-500 font-bold uppercase block">Valor Estimado Máx:</span>
                  <strong class="text-slate-900 font-extrabold text-sm">${item.valorFormatado}</strong>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-emerald-700 font-bold uppercase block">Lucro Projetado MEI:</span>
                  <strong class="text-emerald-700 font-extrabold text-sm">+ ${formatBRL(balanco.lucroLiquido)}</strong>
                </div>
              </div>"""
    new_radar_price = """              ${gerarBlocoPrecificacaoCard(balanco.valorReferencia, balanco.custoTotalEstimado, balanco.propostaRecomendada, balanco.lucroLiquido)}"""

    if old_radar_price in c:
        c = c.replace(old_radar_price, new_radar_price)
        print(f"[{filepath}] Radar PNCP price block updated")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(c)

patch_file('index.html')
patch_file('dashboard_oportunidades.html')
