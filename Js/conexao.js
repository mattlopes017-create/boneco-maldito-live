/* =========================================================
   BONECO DO ABISMO
   CONEXÃO JAVASCRIPT COM A API
   Arquivo: js/conexao.js
   ========================================================= */

(function () {
    "use strict";

    // =====================================================
    // CONFIGURAÇÃO
    // =====================================================

    const CONFIG = {
        // A API será chamada no mesmo domínio do Vercel.
        API_URL: "/api/evento",

        // Intervalo entre consultas quando estiver usando
        // o modo POLLING.
        POLLING_INTERVAL: 1500,

        // Quantas vezes tentar reconectar em caso de erro.
        MAX_RECONNECT_ATTEMPTS: 10,

        // Ativa mensagens de depuração no console.
        DEBUG: true
    };

    // =====================================================
    // ESTADO DA CONEXÃO
    // =====================================================

    let conectado = false;
    let pollingAtivo = false;
    let pollingTimer = null;
    let reconnectAttempts = 0;

    // Guarda o último ID recebido para evitar duplicação.
    let ultimoEventoId = null;

    // =====================================================
    // LOG
    // =====================================================

    function log(...args) {
        if (CONFIG.DEBUG) {
            console.log("[BonecoLive]", ...args);
        }
    }

    // =====================================================
    // ALTERA STATUS VISUAL
    // =====================================================

    function atualizarStatus(status, texto) {

        const elemento =
            document.getElementById("connectionStatus");

        if (!elemento) {
            return;
        }

        elemento.textContent = texto;

        elemento.classList.remove(
            "online",
            "offline",
            "connecting"
        );

        elemento.classList.add(status);
    }

    // =====================================================
    // CONECTAR
    // =====================================================

    async function conectar() {

        if (conectado) {
            log("Já conectado.");
            return;
        }

        atualizarStatus(
            "connecting",
            "🟡 CONECTANDO..."
        );

        log("Tentando conectar à API...");

        try {

            const resposta = await fetch(
                CONFIG.API_URL,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );

            if (!resposta.ok) {
                throw new Error(
                    "API respondeu HTTP " + resposta.status
                );
            }

            const dados = await resposta.json();

            log("Resposta da API:", dados);

            conectado = true;
            reconnectAttempts = 0;

            atualizarStatus(
                "online",
                "🟢 CONECTADO"
            );

            iniciarPolling();

        } catch (erro) {

            console.error(
                "[BonecoLive] Erro ao conectar:",
                erro
            );

            conectado = false;

            atualizarStatus(
                "offline",
                "🔴 DESCONECTADO"
            );

            tentarReconectar();
        }
    }

    // =====================================================
    // DESCONECTAR
    // =====================================================

    function desconectar() {

        conectado = false;

        pararPolling();

        atualizarStatus(
            "offline",
            "🔴 DESCONECTADO"
        );

        log("Conexão encerrada.");
    }

    // =====================================================
    // POLLING
    // =====================================================

    function iniciarPolling() {

        if (pollingAtivo) {
            return;
        }

        pollingAtivo = true;

        log("Polling iniciado.");

        consultarEventos();
    }

    function pararPolling() {

        pollingAtivo = false;

        if (pollingTimer) {
            clearTimeout(pollingTimer);
            pollingTimer = null;
        }

        log("Polling parado.");
    }

    // =====================================================
    // CONSULTAR EVENTOS
    // =====================================================

    async function consultarEventos() {

        if (!pollingAtivo || !conectado) {
            return;
        }

        try {

            /*
             * A API poderá retornar um evento pendente.
             *
             * O parâmetro timestamp ajuda a evitar
             * problemas de cache.
             */

            const url =
                CONFIG.API_URL +
                "?action=events&t=" +
                Date.now();

            const resposta = await fetch(
                url,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );

            if (!resposta.ok) {
                throw new Error(
                    "HTTP " + resposta.status
                );
            }

            const dados = await resposta.json();

            processarResposta(dados);

        } catch (erro) {

            console.error(
                "[BonecoLive] Erro ao consultar eventos:",
                erro
            );

            conectado = false;

            atualizarStatus(
                "offline",
                "🔴 CONEXÃO PERDIDA"
            );

            tentarReconectar();

            return;
        }

        // Agenda próxima consulta.
        pollingTimer = setTimeout(
            consultarEventos,
            CONFIG.POLLING_INTERVAL
        );
    }

    // =====================================================
    // PROCESSAR RESPOSTA
    // =====================================================

    function processarResposta(dados) {

        if (!dados) {
            return;
        }

        // Nenhum evento novo.
        if (!dados.event) {
            return;
        }

        const evento = dados.event;

        // Evita processar o mesmo evento duas vezes.
        if (
            evento.eventId &&
            evento.eventId === ultimoEventoId
        ) {
            return;
        }

        if (evento.eventId) {
            ultimoEventoId = evento.eventId;
        }

        log("Novo evento recebido:", evento);

        enviarParaJogo(evento);
    }

    // =====================================================
    // ENVIAR EVENTO PARA O JOGO
    // =====================================================

    function enviarParaJogo(evento) {

        /*
         * O eventos.js já possui o sistema
         * BonecoEvents.receiveExternalEvent().
         */

        if (
            window.BonecoEvents &&
            typeof window.BonecoEvents.receiveExternalEvent ===
            "function"
        ) {

            window.BonecoEvents.receiveExternalEvent(
                evento
            );

            log(
                "Evento enviado para BonecoEvents:",
                evento
            );

            return;
        }

        /*
         * Fallback:
         * envia um evento DOM caso eventos.js ainda
         * não esteja carregado.
         */

        window.dispatchEvent(
            new CustomEvent(
                "boneco:external-event",
                {
                    detail: evento
                }
            )
        );

        log(
            "Evento enviado via CustomEvent:",
            evento
        );
    }

    // =====================================================
    // ENVIAR EVENTO MANUALMENTE
    // =====================================================

    async function enviarEvento(evento) {

        if (!evento || !evento.type) {

            console.error(
                "[BonecoLive] Evento inválido."
            );

            return false;
        }

        try {

            const resposta = await fetch(
                CONFIG.API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify(evento)
                }
            );

            const dados =
                await resposta.json();

            log(
                "Evento enviado para API:",
                dados
            );

            return resposta.ok;

        } catch (erro) {

            console.error(
                "[BonecoLive] Falha ao enviar evento:",
                erro
            );

            return false;
        }
    }

    // =====================================================
    // RECONEXÃO AUTOMÁTICA
    // =====================================================

    function tentarReconectar() {

        if (
            reconnectAttempts >=
            CONFIG.MAX_RECONNECT_ATTEMPTS
        ) {

            log(
                "Número máximo de tentativas atingido."
            );

            return;
        }

        reconnectAttempts++;

        const espera =
            Math.min(
                1000 * reconnectAttempts,
                10000
            );

        log(
            "Tentando reconectar em",
            espera,
            "ms..."
        );

        setTimeout(
            conectar,
            espera
        );
    }

    // =====================================================
    // TESTES
    // =====================================================

    function testarS1000() {

        const evento = {

            type: "LIKE_1000",

            username: "TesteS1000",

            amount: 1000,

            timestamp:
                Date.now(),

            eventId:
                "teste-" +
                Date.now()
        };

        log(
            "Executando teste S-1000:",
            evento
        );

        enviarParaJogo(evento);
    }

    function testarRose() {

        const evento = {

            type: "ROSE",

            username: "TesteRose",

            giftName: "Rose",

            amount: 1,

            timestamp:
                Date.now(),

            eventId:
                "rose-" +
                Date.now()
        };

        enviarParaJogo(evento);
    }

    function testarFollow() {

        const evento = {

            type: "FOLLOW",

            username: "NovoSeguidor",

            timestamp:
                Date.now(),

            eventId:
                "follow-" +
                Date.now()
        };

        enviarParaJogo(evento);
    }

    // =====================================================
    // API PÚBLICA
    // =====================================================

    window.BonecoConnection = {

        conectar,
        desconectar,

        enviarEvento,

        testarS1000,
        testarRose,
        testarFollow,

        get conectado() {
            return conectado;
        }

    };

    // =====================================================
    // INICIALIZAÇÃO
    // =====================================================

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            log(
                "Sistema de conexão carregado."
            );

            atualizarStatus(
                "offline",
                "⚪ MODO TESTE"
            );

        }
    );

})();