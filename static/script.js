/* =====================================================
   NAVEGAÇÃO ENTRE ABAS
====================================================== */
function switchTab(step) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('d-none'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-content-${step}`).classList.remove('d-none');
    document.getElementById(`tab-btn-${step}`).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* =====================================================
   CÁLCULOS FINANCEIROS
====================================================== */
function calcularTotalDespesas() {
    let total = 0;
    document.querySelectorAll('.despesa-input').forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    document.getElementById('lblTotalDespesas').innerText = total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    calcularComprometimento();
    return total;
}

function calcularTotalDividas() {
    let total = 0;
    document.querySelectorAll('.input-valor-divida').forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    document.getElementById('lblTotalDividas').innerText = total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return total;
}

function calcularComprometimento() {
    const renda = parseFloat(document.getElementById('renda_individual').value) || 0;
    const despesas = parseFloat(document.getElementById('lblTotalDespesas').innerText.replace(/\./g, '').replace(',', '.')) || 0;
    
    const card = document.getElementById('comprometimentoCard');
    const label = document.getElementById('comprometimentoLabel');
    const valueEl = document.getElementById('comprometimentoValue');

    if (!card || !label || !valueEl) return; // Garante que não quebre se os elementos não existirem

    if (renda <= 0) {
        label.innerText = 'Renda não informada';
        valueEl.innerText = '-%';
        return;
    }

    const percentual = (despesas / renda) * 100;
    label.innerText = `Comprometimento com Despesas`;
    valueEl.innerText = `${percentual.toFixed(1)}%`;

    card.classList.remove('card-financeiro-income', 'card-financeiro-deduction');
    valueEl.classList.remove('income-value', 'deduction-value');
    
    if (percentual >= 50) {
        card.classList.add('card-financeiro-deduction');
        valueEl.classList.add('deduction-value');
    } else {
        card.classList.add('card-financeiro-income');
        valueEl.classList.add('income-value');
    }
}


/* =====================================================
   GESTÃO DE CREDORES (DINÂMICO)
====================================================== */
function adicionarCredor() {
    const container = document.getElementById('containerCredores');
    const count = container.querySelectorAll('.credor-card').length + 1;
    const card = document.createElement('div');
    card.className = 'credor-card';
    card.innerHTML = `
        <div class="credor-header">
            <span class="credor-title"><i class="fa-solid fa-building-columns"></i> Credor #${count}</span>
            <button type="button" onclick="this.closest('.credor-card').remove(); atualizarNumeracaoCredores(); calcularTotalDividas();" class="btn-link-danger"><i class="fa-solid fa-trash"></i> Remover</button>
        </div>
        <div class="row g-2">
            <div class="col-md-6"><label class="form-label">Nome do Credor *</label><input type="text" class="credor-nome form-control"></div>
            <div class="col-md-6"><label class="form-label">Valor da Dívida (R$) *</label><input type="number" value="0" class="input-valor-divida form-control" oninput="calcularTotalDividas()"></div>
        </div>`;
    container.appendChild(card);
    atualizarNumeracaoCredores();
    calcularTotalDividas();
}

function atualizarNumeracaoCredores() {
    document.querySelectorAll('.credor-card').forEach((card, index) => {
        const titulo = card.querySelector('.credor-title');
        if (titulo) {
            titulo.innerHTML = `<i class="fa-solid fa-building-columns"></i> Credor #${index + 1}`;
        }
    });
}

function coletarCredores() {
    return Array.from(document.querySelectorAll('.credor-card')).map(card => ({
        nome: card.querySelector('.credor-nome')?.value || '',
        valor: parseFloat(card.querySelector('.input-valor-divida')?.value) || 0
    }));
}

/* =====================================================
   REVISÃO E SUBMISSÃO
====================================================== */
function prepararRevisao() {
    const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const renda = parseFloat(document.getElementById('renda_individual').value) || 0;
    const despesas = calcularTotalDespesas();
    const dividas = calcularTotalDividas();

    document.getElementById('reviewRenda').innerHTML = `<i class="fa-solid fa-arrow-up"></i> ${formatCurrency(renda)}`;
    document.getElementById('reviewDespesas').innerHTML = `<i class="fa-solid fa-arrow-down"></i> ${formatCurrency(despesas)}`;
    document.getElementById('reviewDividas').innerHTML = `<i class="fa-solid fa-file-invoice-dollar"></i> ${formatCurrency(dividas)}`;

    const reviewCredores = document.getElementById('reviewCredores');
    reviewCredores.innerHTML = '';
    const credores = coletarCredores();
    if (credores.length === 0) {
        reviewCredores.innerHTML = `<div class="text-center text-muted p-3">Nenhum credor informado.</div>`;
        return;
    }

    const lista = document.createElement('ul');
    lista.className = 'list-group';
    credores.forEach(credor => {
        const item = document.createElement('li');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';
        item.innerHTML = `<span>${escapeHtml(credor.nome)}</span> <span class="badge bg-danger rounded-pill">${formatCurrency(credor.valor)}</span>`;
        lista.appendChild(item);
    });
    reviewCredores.appendChild(lista);
}

async function submeterFormulario(event) {
    event.preventDefault();
    const btn = document.getElementById('btnSubmit');
    if (!document.getElementById('consentimento').checked) {
        alert('É necessário confirmar a declaração de veracidade das informações.');
        return;
    }
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submetendo...`;

    const payload = {
        cejusc: document.getElementById('cejusc').value,
        tipo_atendimento: document.getElementById('tipo_atendimento').value,
        assunto: document.getElementById('assunto').value,
        nome: document.getElementById('nome').value,
        cpf: document.getElementById('cpf').value,
        telefone: document.getElementById('telefone').value,
        email: document.getElementById('email').value,
        endereco: document.getElementById('endereco').value,
        renda_individual: parseFloat(document.getElementById('renda_individual').value) || 0,
        renda_familiar: parseFloat(document.getElementById('renda_familiar').value) || 0,
        dependentes: parseInt(document.getElementById('dependentes').value) || 0,
        total_despesas: calcularTotalDespesas(),
        total_dividas: calcularTotalDividas(),
        credores: coletarCredores(),
        consentimento: true
    };

    try {
        const response = await fetch('/api/submeter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
        const result = await response.json();
        if (result.status === 'sucesso') {
            document.getElementById('methisForm').classList.add('d-none');
            document.getElementById('tabsHeader').parentElement.classList.add('d-none');
            document.getElementById('protocolo-gerado').innerText = result.protocolo || 'N/A';
            document.getElementById('success-message').classList.remove('d-none');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            throw new Error(result.message || 'Erro na submissão.');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Ocorreu um erro: ' + error.message);
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submeter Análise`;
    }
}

/* =====================================================
   MODAL DE ANÁLISE - DASHBOARD
====================================================== */
function abrirModalAnalise(protocolo) {
    const solicitacao = MOCK_DATABASE[protocolo];
    if (!solicitacao) {
        alert("Erro: Solicitação não encontrada.");
        return;
    }

    const { analise_ia } = solicitacao;
    
    // Header
    document.getElementById('modalProtocolo').innerText = `Protocolo: ${protocolo}`;

    // Estrato Cidadão
    let docsHtml = '';
    if (solicitacao.documentos_enviados) {
        solicitacao.documentos_enviados.forEach(doc => {
            docsHtml += `<li>
                <span>${doc.tipo} <br><small class="text-muted">${doc.data}</small></span>
                <span class="badge ${doc.status === 'Validado' ? 'bg-success' : 'bg-warning'}">${doc.status}</span>
            </li>`;
        });
    }

    const estratoHtml = `
        <div class="estrato-section">
            <h4><i class="fa-solid fa-address-card"></i> Dados do Solicitante</h4>
            <div class="data-grid mb-3">
                <div class="data-item"><span>Nome</span><strong>${solicitacao.dados_cidadao.nome}</strong></div>
                <div class="data-item"><span>CPF</span><strong>${solicitacao.dados_cidadao.cpf}</strong></div>
                <div class="data-item"><span>Telefone</span><strong>${solicitacao.dados_cidadao.telefone}</strong></div>
                <div class="data-item"><span>E-mail</span><strong>${solicitacao.dados_cidadao.email}</strong></div>
                <div class="data-item"><span>Endereço</span><strong>${solicitacao.dados_cidadao.endereco}</strong></div>
            </div>
            <h4><i class="fa-solid fa-file-lines"></i> Documentos Submetidos</h4>
            <ul class="estrato-docs-list">
                ${docsHtml}
            </ul>
        </div>
    `;

    // Agente 1
    const a1 = analise_ia.agente_1.dados;
    document.getElementById('agente1-content').innerHTML = estratoHtml + `
        <h4 class="mt-3"><i class="fa-solid fa-chart-pie"></i> Análise Socioeconômica</h4>
        <div class="data-grid">
            <div class="data-item"><span>Perfil</span><strong>${a1.perfil_categoria}</strong></div>
            <div class="data-item"><span>Comp. Renda</span><strong class="value-deduction">${a1.comprometimento_renda}</strong></div>
            <div class="data-item"><span>Renda p/ Capita</span><strong>${a1.renda_per_capita}</strong></div>
            <div class="data-item"><span>Score Risco</span><strong>${a1.score_vulnerabilidade}</strong></div>
        </div>`;

    // Agente 5
    const a5 = analise_ia.agente_5.dados;
    document.getElementById('agente5-content').innerHTML = `
         <div class="data-grid">
            <div class="data-item"><span>Ratio Score</span><strong class="value-income">${a5.ratio_score}</strong></div>
            <div class="data-item"><span>Confiança</span><strong class="value-income">${a5.probabilidade_confianca}</strong></div>
            <div class="data-item" colspan="2"><span>Status</span><strong>${a5.aprovado_motor ? 'Aprovado pelo Motor' : 'Requer Revisão'}</strong></div>
        </div>`;

    // Agente 2 e 3
    const a2 = analise_ia.agente_2.dados;
    let processosHtml = `<p><strong>${a2.processos_encontrados_qtd} processos</strong> encontrados no CODEX para o CPF: ${a2.cpf_consultado}</p>
                         <table class="table mt-2"><thead><tr><th>Processo</th><th>Credor</th><th>Objeto</th><th>Valor</th></tr></thead><tbody>`;
    a2.processos.forEach(p => {
        processosHtml += `<tr><td>${p.numero_processo}</td><td>${p.credor}</td><td>${p.objeto_contrato}</td><td class="value-deduction">R$ ${p.valor_causa.toFixed(2)}</td></tr>`;
    });
    processosHtml += `</tbody></table>`;
    document.getElementById('agente2-content').innerHTML = processosHtml;

    // Agente 4
    const a4 = analise_ia.agente_4.dados;
    let precedentesHtml = `<table class="table"><thead><tr><th>Credor</th><th>Objeto</th><th>Desconto Médio</th><th>Parcelamento</th></tr></thead><tbody>`;
    a4.precedentes_mapeados.forEach(p => {
        precedentesHtml += `<tr><td>${p.credor}</td><td>${p.objeto}</td><td>${p.desconto_medio}</td><td>${p.parcelamento_max}</td></tr>`;
    });
    precedentesHtml += `</tbody></table>`;
    document.getElementById('agente4-content').innerHTML = precedentesHtml;
    
    // Agente 6
    const a6 = analise_ia.agente_6.dados;
    document.getElementById('agente6-content').innerHTML = `
        <p class="font-bold text-lg">${a6.recomendacao_acao}</p>
        <p class="mt-2">${a6.resumo_minuta}</p>`;

    // Botões de Ação
    const footer = document.querySelector('#modalAnalise .modal-footer');
    footer.innerHTML = `
        <button onclick="fecharModalAnalise()" class="btn btn-light">Fechar</button>
        <button onclick="reprovarCidadao('${protocolo}')" class="btn btn-danger"><i class="fa-solid fa-xmark"></i> Reprovar Perfil</button>
        <button onclick="convocarCidadao('${protocolo}')" class="btn btn-success"><i class="fa-solid fa-calendar-check"></i> Convocar p/ Audiência</button>
    `;

    // Exibir modal
    document.getElementById('modalAnalise').classList.remove('d-none');
}

function fecharModalAnalise() {
    document.getElementById('modalAnalise').classList.add('d-none');
}


/* =====================================================
   AÇÕES DO CONCILIADOR E CONSULTA
====================================================== */
async function reprovarCidadao(protocolo) {
    if (!confirm('Deseja realmente reprovar esta solicitação?')) return;
    
    try {
        const res = await fetch('/api/atualizar_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                protocolo: protocolo,
                status: 'Análise Reprovada',
                detalhes: { motivo: 'Perfil não contemplado.' }
            })
        });
        if (res.ok) {
            alert('Cidadão reprovado com sucesso!');
            location.reload();
        }
    } catch (e) {
        console.error(e);
        alert('Erro ao reprovar.');
    }
}

async function convocarCidadao(protocolo) {
    if (!confirm('Deseja convocar o cidadão para uma audiência no CEJUSC?')) return;
    
    // Simula uma data
    const dataAudiencia = "15/10/2026 às 14:00";
    
    try {
        const res = await fetch('/api/atualizar_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                protocolo: protocolo,
                status: 'Cidadão Convocado',
                detalhes: { data: dataAudiencia, local: 'CEJUSC Vitória - Sala Virtual 3' }
            })
        });
        if (res.ok) {
            alert('Cidadão convocado e notificado com sucesso!');
            location.reload();
        }
    } catch (e) {
        console.error(e);
        alert('Erro ao convocar.');
    }
}

async function consultarProtocolo() {
    const input = document.getElementById('inputProtocolo').value.trim();
    if (!input) {
        alert('Por favor, informe um protocolo.');
        return;
    }
    const btn = document.getElementById('btnConsultar');
    const container = document.getElementById('resultadoConsulta');
    
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Consultando...`;
    
    try {
        const response = await fetch(`/api/consulta/${input}`);
        if (!response.ok) {
            container.innerHTML = `
                <div class="consulta-status-card consulta-status-reprovado">
                    <div class="consulta-status-icon"><i class="fa-solid fa-circle-exclamation"></i></div>
                    <div class="consulta-status-title">Protocolo não encontrado</div>
                    <p>Verifique o número digitado e tente novamente.</p>
                </div>
            `;
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-search"></i> Consultar`;
            return;
        }
        
        const res = await response.json();
        const dados = res.dados;
        
        let cardClass = 'consulta-status-aguardando';
        let iconHtml = '<i class="fa-solid fa-hourglass-half"></i>';
        let detailsHtml = '';
        
        if (dados.status_geral === 'Análise Reprovada') {
            cardClass = 'consulta-status-reprovado';
            iconHtml = '<i class="fa-solid fa-circle-xmark"></i>';
            detailsHtml = `
                <div class="consulta-detalhe">
                    <strong>Motivo da Reprovação:</strong>
                    <p class="text-danger mb-0">${dados.detalhes_status?.motivo || 'Motivo não especificado.'}</p>
                </div>
            `;
        } else if (dados.status_geral === 'Cidadão Convocado') {
            cardClass = 'consulta-status-convocado';
            iconHtml = '<i class="fa-solid fa-calendar-check"></i>';
            detailsHtml = `
                <div class="consulta-detalhe">
                    <p><strong><i class="fa-solid fa-calendar-days"></i> Data da Audiência:</strong> ${dados.detalhes_status?.data}</p>
                    <p class="mb-0"><strong><i class="fa-solid fa-location-dot"></i> Local:</strong> ${dados.detalhes_status?.local}</p>
                </div>
            `;
        }
        
        container.innerHTML = `
            <div class="consulta-status-card ${cardClass}">
                <div class="consulta-status-icon">${iconHtml}</div>
                <div class="consulta-status-title">${dados.status_geral}</div>
                <p class="text-muted">Protocolo: <strong>${dados.protocolo}</strong> | Solicitado em: ${dados.data_solicitacao}</p>
                ${detailsHtml}
            </div>
        `;
        
    } catch (e) {
        console.error(e);
        alert('Erro ao realizar a consulta.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-search"></i> Consultar`;
    }
}

/* =====================================================
   UTILITÁRIOS E INICIALIZAÇÃO
====================================================== */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function buscarCEP(cep) {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();
        if (!data.erro) {
            document.getElementById('logradouro').value = data.logradouro || '';
            document.getElementById('bairro').value = data.bairro || '';
            document.getElementById('cidade_uf').value = (data.localidade && data.uf) ? `${data.localidade} / ${data.uf}` : '';
            
            const consolidarEndereco = () => {
                const logr = document.getElementById('logradouro').value;
                const num = document.getElementById('numero').value || 'S/N';
                const comp = document.getElementById('complemento').value;
                const bairro = document.getElementById('bairro').value;
                const cid = document.getElementById('cidade_uf').value;
                
                let endCompleto = `${logr}, nº ${num}`;
                if (comp) endCompleto += `, ${comp}`;
                if (bairro) endCompleto += `, Bairro ${bairro}`;
                if (cid) endCompleto += `, ${cid}`;
                
                document.getElementById('endereco').value = endCompleto;
            };
            
            document.getElementById('numero').addEventListener('input', consolidarEndereco);
            document.getElementById('complemento').addEventListener('input', consolidarEndereco);
            
            consolidarEndereco();
            document.getElementById('numero').focus();
        } else {
            alert('CEP não encontrado.');
        }
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
    }
}

// Inicializa os cálculos apenas na página do cidadão
if (document.getElementById('methisForm')) {
    document.addEventListener('DOMContentLoaded', () => {
        // Adiciona a classe 'despesa-input' a todos os campos de despesa para garantir que o cálculo funcione
        const despesaIds = ['desp_luz', 'desp_agua', 'desp_aluguel', 'desp_telefone', 'desp_alimentacao', 'desp_pensao', 'desp_educacao', 'desp_saude', 'desp_medicamentos', 'desp_outras'];
        despesaIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('despesa-input');
        });
        
        calcularTotalDespesas();
        calcularTotalDividas();
    });
}
