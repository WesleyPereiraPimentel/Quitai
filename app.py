import os
import math
import time
import random
import uuid
from datetime import datetime
from flask import Flask, render_template, jsonify, request, url_for

app = Flask(__name__)

# ==============================================================================
# BANCO DE DADOS SIMULADO E DADOS MOCKADOS
# ==============================================================================
MOCK_DATABASE = {}

MOCK_BASE_PERFIS = [
    {"categoria": "Classe C2 - Vulnerável / Superendividado Crítico", "renda_max": 2500, "score_vulnerabilidade": 0.92},
    {"categoria": "Classe C1 - Renda Média Baixa em Risco", "renda_max": 4800, "score_vulnerabilidade": 0.70},
    {"categoria": "Classe B2 - Renda Média Conservadora", "renda_max": 9000, "score_vulnerabilidade": 0.40},
    {"categoria": "Classe A/B1 - Alta Capacidade Financeira", "renda_max": 999999, "score_vulnerabilidade": 0.15}
]

MOCK_PROCESSOS_CODEX = [
    {"numero_processo": "0012345-89.2024.8.08.0024", "tribunal": "TJES - 2ª Vara Cível de Vitória", "objeto_contrato": "Empréstimo Consignado Bancário", "credor": "Banco Alfa S.A.", "cnpj_credor": "60.746.948/0001-12", "valor_causa": 18450.00},
    {"numero_processo": "0098765-12.2023.8.08.0024", "tribunal": "TJES - 5ª Vara Cível de Vitória", "objeto_contrato": "Cartão de Crédito Consignado", "credor": "Banco Alfa S.A.", "cnpj_credor": "60.746.948/0001-12", "valor_causa": 7200.50},
    {"numero_processo": "0045123-33.2024.8.08.0011", "tribunal": "TJES - 1ª Vara Cível de Cariacica", "objeto_contrato": "Financiamento de Veículo", "credor": "Financeira Beta S.A.", "cnpj_credor": "01.234.567/0001-89", "valor_causa": 34100.00}
]

MOCK_PRECEDENTES_ACORDOS = [
    {"credor": "Banco Alfa S.A.", "cnpj_credor": "60.746.948/0001-12", "objeto": "Empréstimo Consignado Bancário", "desconto_medio": "48%", "parcelamento_max": "48x sem juros", "processos_referencia": ["0032145-12.2023.8.08.0024 (TJES)", "0011223-45.2023.8.08.0011 (TJES)"]},
    {"credor": "Banco Alfa S.A.", "cnpj_credor": "60.746.948/0001-12", "objeto": "Cartão de Crédito Consignado", "desconto_medio": "55%", "parcelamento_max": "60x com juros reduzidos", "processos_referencia": ["0088997-22.2023.8.08.0024 (TJES)"]},
    {"credor": "Financeira Beta S.A.", "cnpj_credor": "01.234.567/0001-89", "objeto": "Financiamento de Veículo", "desconto_medio": "35%", "parcelamento_max": "36x fixas", "processos_referencia": ["0044556-99.2024.8.08.0011 (TJES)", "0077665-11.2023.8.08.0035 (TJES)"]}
]

MOCK_CONCILIADORES = [
    {"id": "conciliador1", "nome": "Conciliador(a) 1 - Ana Silva"},
    {"id": "conciliador2", "nome": "Conciliador(a) 2 - Marcos Paulo"}
]

MOCK_AUDIENCIAS = [
    {"id": "aud_1", "conciliador_id": "conciliador1", "data": "20/10/2026 às 14:00", "sala": "CEJUSC Vitória - Sala Virtual 1", "devedor": "João de Souza", "credor": "Banco Alfa S.A.", "status": "Agendada"},
    {"id": "aud_2", "conciliador_id": "conciliador1", "data": "21/10/2026 às 10:30", "sala": "CEJUSC Vila Velha - Sala 3", "devedor": "Maria da Penha", "credor": "Financeira Beta S.A.", "status": "Agendada"},
    {"id": "aud_3", "conciliador_id": "conciliador2", "data": "22/10/2026 às 15:00", "sala": "CEJUSC Cariacica - Sala 2", "devedor": "José Silva", "credor": "Banco Alfa S.A.", "status": "Agendada"}
]

# ==============================================================================
# SIMULAÇÃO DOS AGENTES DE IA (LÓGICA PRESERVADA)
# ==============================================================================
def executar_agente_1_vetorizacao(dados_form):
    renda_ind = float(dados_form.get('renda_individual') or 0)
    renda_fam = float(dados_form.get('renda_familiar') or 0)
    dependentes = int(dados_form.get('dependentes') or 0)
    despesas_totais = float(dados_form.get('total_despesas') or 0)
    total_dividas = float(dados_form.get('total_dividas') or 0)
    renda_per_capita = renda_fam / max(1, dependentes + 1)
    comprometimento_percentual = round((despesas_totais / max(1, renda_ind)) * 100, 1) if renda_ind > 0 else 0
    perfil_classificado = next((p for p in MOCK_BASE_PERFIS if renda_ind <= p['renda_max']), MOCK_BASE_PERFIS[-1])
    return {
        "etapa": "Agente 1 - Perfil & Embedding", "status": "sucesso",
        "dados": {
            "perfil_categoria": perfil_classificado['categoria'],
            "renda_per_capita": f"R$ {renda_per_capita:,.2f}",
            "comprometimento_renda": f"{comprometimento_percentual}%",
            "total_despesas_mensais": f"R$ {despesas_totais:,.2f}",
            "montante_dividas": f"R$ {total_dividas:,.2f}",
            "score_vulnerabilidade": perfil_classificado['score_vulnerabilidade']
        }
    }

def executar_agente_2_busca_codex(cpf):
    time.sleep(0.1)
    return {
        "etapa": "Agente 2 - Busca CODEX", "status": "sucesso",
        "dados": {
            "cpf_consultado": cpf, "filtro_seguranca_status": "APROVADO",
            "processos_encontrados_qtd": len(MOCK_PROCESSOS_CODEX), "processos": MOCK_PROCESSOS_CODEX
        }
    }

def executar_agente_3_ner(processos):
    time.sleep(0.1)
    entidades = [{"processo": p['numero_processo'], "credor": p['credor'], "cnpj": p['cnpj_credor'], "objeto": p['objeto_contrato']} for p in processos]
    return { "etapa": "Agente 3 - Extração NER", "status": "sucesso", "dados": { "entidades_extraidas": entidades } }

def executar_agente_4_precedentes(processos):
    time.sleep(0.1)
    precedentes_encontrados = []
    credores_consultados = set(p['credor'] for p in processos)
    for credor in credores_consultados:
        precedentes_do_credor = [prec for prec in MOCK_PRECEDENTES_ACORDOS if prec['credor'] == credor]
        if precedentes_do_credor:
            precedentes_encontrados.extend(precedentes_do_credor)
    return { "etapa": "Agente 4 - Mapeamento de Precedentes", "status": "sucesso", "dados": { "precedentes_mapeados": precedentes_encontrados } }

def executar_agente_5_inferencia_ratio():
    time.sleep(0.1)
    logprob_a, logprob_b, logprob_c = random.uniform(1.8, 2.2), random.uniform(0.8, 0.95), random.uniform(0.8, 0.95)
    ratio_score = round(logprob_a / math.sqrt(logprob_b * logprob_c), 4)
    prob_confianca = round(random.uniform(92.0, 98.8), 2)
    return { "etapa": "Agente 5 - Inferência e Ratio", "status": "sucesso", "dados": { "ratio_score": ratio_score, "probabilidade_confianca": f"{prob_confianca}%", "aprovado_motor": (ratio_score > 1.5 and prob_confianca >= 90) } }

def executar_agente_6_juntada_e_revisao():
    time.sleep(0.1)
    return { "etapa": "Agente 6 - Minuta de Juntada", "status": "sucesso", "dados": { "recomendacao_acao": "Plano Global de Repactuação de Dívidas", "resumo_minuta": "Propõe-se a instauração do procedimento conciliatório global com carência de 180 dias, desconto médio de 45% nos encargos e repactuação do saldo remanescente em 48 parcelas mensais ajustadas à subsistência do cidadão.", "status_revisao": "Aguardando Validação" } }

# ==============================================================================
# ROTAS FLASK (COM ROTAS DE CONSULTA ADICIONADAS)
# ==============================================================================
@app.route('/')
def devedor_home():
    """ Rota principal para o formulário do cidadão. """
    # O Flask renderiza 'cidadao.html' a partir do diretório 'templates'
    return render_template('cidadao.html')

@app.route('/pagina_formulario')
def pagina_formulario():
    """ Rota que redireciona para a home (usada no link da página de consulta). """
    return devedor_home()

@app.route('/tjes/dashboard')
def tjes_dashboard():
    """ Rota para o painel do conciliador. """
    return render_template('conciliador.html', solicitacoes=MOCK_DATABASE, conciliadores=MOCK_CONCILIADORES, audiencias=MOCK_AUDIENCIAS)

@app.route('/consulta')
def consulta_protocolo():
    """ Rota para a página de consulta de protocolo. """
    # Passa um protocolo de exemplo para o template, se existir algum.
    exemplo_protocolo = next(iter(MOCK_DATABASE)) if MOCK_DATABASE else ""
    return render_template('consulta.html', exemplo_protocolo=exemplo_protocolo)


@app.route('/api/submeter', methods=['POST'])
def submeter_formulario_api():
    """ API para receber os dados do formulário do cidadão. """
    dados_form = request.json or {}
    protocolo_id = f"QUITAI-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4().int)[:6]}"
    
    # Simula a execução da esteira de agentes de IA
    agente1_res = executar_agente_1_vetorizacao(dados_form)
    agente2_res = executar_agente_2_busca_codex(dados_form.get('cpf'))
    agente3_res = executar_agente_3_ner(agente2_res['dados']['processos'])
    agente4_res = executar_agente_4_precedentes(agente2_res['dados']['processos'])
    agente5_res = executar_agente_5_inferencia_ratio()
    agente6_res = executar_agente_6_juntada_e_revisao()

    # Armazena o resultado completo no banco de dados simulado
    MOCK_DATABASE[protocolo_id] = {
        "protocolo": protocolo_id,
        "data_solicitacao": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "dados_cidadao": dados_form,
        "status_geral": agente6_res['dados']['status_revisao'],
        "documentos_enviados": [
            {"tipo": "Documento de Identidade (RG/CNH)", "status": "Validado", "data": "Acesso via Gov.br"},
            {"tipo": "Comprovante de Residência", "status": "Validado", "data": "Fatura de Energia 08/2026"},
            {"tipo": "Comprovante de Renda (Contracheque/IR)", "status": "Em Análise", "data": "Upload Manual"}
        ],
        "analise_ia": {
            "agente_1": agente1_res, "agente_2": agente2_res, "agente_3": agente3_res,
            "agente_4": agente4_res, "agente_5": agente5_res, "agente_6": agente6_res
        },
        "detalhes_status": {}
    }
    
    return jsonify({"status": "sucesso", "protocolo": protocolo_id})

# Rota de API para a página de consulta
@app.route('/api/consulta/<protocolo_id>')
def api_consulta_protocolo(protocolo_id):
    """ API para a consulta de protocolo via frontend. """
    if protocolo_id in MOCK_DATABASE:
        solicitacao = MOCK_DATABASE[protocolo_id]
        # Retorna apenas os dados necessários para o frontend
        return jsonify({
            "status": "encontrado",
            "dados": {
                "protocolo": solicitacao.get("protocolo"),
                "data_solicitacao": solicitacao.get("data_solicitacao"),
                "status_geral": solicitacao.get("status_geral"),
                "detalhes_status": solicitacao.get("detalhes_status", {})
            }
        })
    else:
        return jsonify({
            "status": "nao_encontrado",
            "mensagem": "Protocolo não encontrado em nossa base de dados."
        }), 404

# Rota para o conciliador atualizar o status
@app.route('/api/atualizar_status', methods=['POST'])
def atualizar_status():
    dados = request.json or {}
    protocolo = dados.get('protocolo')
    novo_status = dados.get('status')
    detalhes = dados.get('detalhes', {})

    if protocolo in MOCK_DATABASE:
        MOCK_DATABASE[protocolo]['status_geral'] = novo_status
        MOCK_DATABASE[protocolo]['detalhes_status'] = detalhes
        
        # Se foi agendada uma audiência, insere no mock de audiências
        if novo_status == 'Cidadão Convocado' and 'data' in detalhes:
            cidadao_nome = MOCK_DATABASE[protocolo]['dados_cidadao'].get('nome', 'Não informado')
            credores = MOCK_DATABASE[protocolo]['dados_cidadao'].get('credores', [])
            credor_nome = credores[0]['nome'] if credores else "Vários Credores"
            
            # Pega o conciliador logado (via cookie/header/param ou padrao 1)
            # Como é mock, vamos atribuir ao conciliador1 por padrao ou ao enviado
            conciliador_id = dados.get('conciliador_id', 'conciliador1')
            
            nova_audiencia = {
                "id": f"aud_{len(MOCK_AUDIENCIAS)+1}_{protocolo}",
                "conciliador_id": conciliador_id,
                "data": detalhes['data'],
                "sala": detalhes.get('local', 'CEJUSC Vitória'),
                "devedor": cidadao_nome,
                "credor": credor_nome,
                "status": "Agendada"
            }
            MOCK_AUDIENCIAS.append(nova_audiencia)
            
        return jsonify({"status": "sucesso"})
    return jsonify({"status": "erro", "mensagem": "Protocolo não encontrado"}), 404


@app.route('/api/atualizar_audiencia', methods=['POST'])
def atualizar_audiencia():
    dados = request.json or {}
    audiencia_id = dados.get('id')
    novo_status = dados.get('status')
    
    for aud in MOCK_AUDIENCIAS:
        if aud['id'] == audiencia_id:
            aud['status'] = novo_status
            return jsonify({"status": "sucesso"})
            
    return jsonify({"status": "erro", "mensagem": "Audiência não encontrada"}), 404


if __name__ == '__main__':
    # Cria um diretório 'templates' se ele não existir, para o Flask encontrar os HTMLs.
    # if not os.path.exists('templates'):
    #     os.makedirs('templates')
    
    print("=" * 65)
    print(" Servidor Quitaí (Estrutura Organizada) Iniciado com Sucesso!")
    print(" -> Ambiente do Devedor: http://127.0.0.1:5000")
    print(" -> Dashboard do TJES:   http://127.0.0.1:5000/tjes/dashboard")
    print(" -> Consulta de Protocolo: http://127.0.0.1:5000/consulta")
    print("=" * 65)
    print("\nAVISO: Certifique-se de que os arquivos HTML (cidadao.html, ")
    print("conciliador.html, consulta.html) estão no diretório 'templates'.\n")
    
    # O modo debug permite que o servidor recarregue automaticamente após alterações.
    app.run(host='0.0.0.0', port=5000, debug=True)

