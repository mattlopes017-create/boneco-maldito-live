"use strict";

/*
=========================================================
 BONECO DO ABISMO
 API DE EVENTOS
 /api/evento

 Função:
 Receber eventos externos e disponibilizá-los
 para a aplicação.

 IMPORTANTE:
 Este endpoint NÃO captura o TikTok sozinho.
 Ele é a porta de entrada para a futura ponte
 de eventos da Live.
=========================================================
*/


/* ========================================================
   CONFIGURAÇÕES
======================================================== */

const MAX_BODY_SIZE = 10 * 1024;

const ALLOWED_METHODS = [
    "GET",
    "POST",
    "OPTIONS"
];

const ALLOWED_EVENTS = [
    "FOLLOW",
    "FOLLOWER",
    "NEW_FOLLOWER",

    "LIKE",
    "LIKE_100",
    "LIKES_100",
    "100_LIKES",

    "LIKE_1000",
    "LIKES_1000",
    "1000_LIKES",
    "S1000",
    "S-1000",

    "ROSE",
    "ROSA",

    "GIFT",
    "PRESENT",
    "PRESENTE",

    "PRIORITY",
    "PRIORITARIO",
    "PRIORITÁRIOS",

    "COMMENT",
    "COMMENTS",

    "SHARE",
    "SHARES",

    "DAMAGE",
    "DANO",

    "HEAL",
    "CURA",

    "DANGER",
    "PERIGO",

    "VIEWER",
    "VIEWERS",
    "VIEW"
];


/* ========================================================
   RESPOSTA JSON
======================================================== */

function sendJson(res, status, data) {

    res.status(status);

    res.setHeader(
        "Content-Type",
        "application/json; charset=utf-8"
    );

    res.setHeader(
        "Cache-Control",
        "no-store"
    );

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-API-Key"
    );

    res.json(data);

}


/* ========================================================
   LIMPAR TEXTO
======================================================== */

function cleanText(value, maxLength = 120) {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value)
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .trim()
        .slice(0, maxLength);

}


/* ========================================================
   NÚMERO SEGURO
======================================================== */

function safeNumber(value, fallback = 1) {

    const number = Number(value);

    if (
        !Number.isFinite(number)
    ) {
        return fallback;
    }

    return number;

}


/* ========================================================
   NORMALIZAR TIPO
======================================================== */

function normalizeType(value) {

    return cleanText(
        value,
        40
    )
        .toUpperCase();

}


/* ========================================================
   NORMALIZAR EVENTO
======================================================== */

function normalizeEvent(body) {

    const type =
        normalizeType(
            body.type ||
            body.event ||
            body.action
        );


    const username =
        cleanText(
            body.username ||
            body.user ||
            body.nickname ||
            "Visitante",
            80
        );


    const giftName =
        cleanText(
            body.giftName ||
            body.gift ||
            body.gift_name ||
            "Presente",
            80
        );


    const message =
        cleanText(
            body.message ||
            body.comment ||
            "",
            300
        );


    const amount =
        safeNumber(
            body.amount ??
            body.value ??
            1,
            1
        );


    return {

        type,

        username,

        giftName,

        message,

        amount,

        timestamp: Date.now()

    };

}


/* ========================================================
   VALIDAR EVENTO
======================================================== */

function validateEvent(event) {

    if (
        !event.type
    ) {

        return {
            valid: false,
            error: "O campo 'type' é obrigatório."
        };

    }


    if (
        !ALLOWED_EVENTS.includes(
            event.type
        )
    ) {

        return {
            valid: false,
            error:
                `Evento não permitido: ${event.type}`
        };

    }


    if (
        !Number.isFinite(
            event.amount
        )
    ) {

        return {
            valid: false,
            error: "O campo 'amount' precisa ser numérico."
        };

    }


    /*
       Evita valores absurdos enviados
       acidentalmente pela ponte.
    */

    event.amount =
        Math.max(
            0,
            Math.min(
                1000000,
                event.amount
            )
        );


    return {
        valid: true
    };

}


/* ========================================================
   CONVERTER EVENTO
======================================================== */

function convertEvent(event) {

    /*
       LIKE normal
       pode chegar da ponte como:

       {
           type: "LIKE",
           amount: 100
       }

       Aqui transformamos em LIKE_100
       ou LIKE_1000 quando aplicável.
    */

    if (
        event.type === "LIKE"
    ) {

        if (
            event.amount >= 1000
        ) {

            event.type =
                "LIKE_1000";

        } else if (
            event.amount >= 100
        ) {

            event.type =
                "LIKE_100";

        }

    }


    /*
       Comentários e compartilhamentos
       ficam disponíveis para a próxima
       etapa do motor do jogo.
    */

    if (
        event.type === "COMMENTS"
    ) {

        event.type =
            "COMMENT";

    }


    if (
        event.type === "SHARES"
    ) {

        event.type =
            "SHARE";

    }


    return event;

}


/* ========================================================
   GERAR ID DO EVENTO
======================================================== */

function generateEventId() {

    return (

        Date.now().toString(36) +

        "-" +

        Math.random()
            .toString(36)
            .slice(2, 10)

    );

}


/* ========================================================
   HANDLER PRINCIPAL
======================================================== */

export default function handler(req, res) {

    /*
       CORS
    */

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-API-Key"
    );


    /* ====================================================
       OPTIONS
    ==================================================== */

    if (
        req.method === "OPTIONS"
    ) {

        return sendJson(
            res,
            204,
            {}
        );

    }


    /* ====================================================
       MÉTODO
    ==================================================== */

    if (
        !ALLOWED_METHODS.includes(
            req.method
        )
    ) {

        return sendJson(
            res,
            405,
            {
                ok: false,

                error:
                    "Método HTTP não permitido."
            }
        );

    }


    /* ====================================================
       GET — TESTE DA API
    ==================================================== */

    if (
        req.method === "GET"
    ) {

        return sendJson(
            res,
            200,
            {

                ok: true,

                service:
                    "Boneco do Abismo",

                endpoint:
                    "/api/evento",

                status:
                    "online",

                accepts:
                    ALLOWED_EVENTS,

                usage: {

                    method:
                        "POST",

                    contentType:
                        "application/json",

                    example: {

                        type:
                            "LIKE_1000",

                        username:
                            "Teste",

                        amount:
                            1000

                    }

                },

                timestamp:
                    Date.now()

            }
        );

    }


    /* ====================================================
       POST
    ==================================================== */

    if (
        req.method === "POST"
    ) {

        try {

            /*
               Tamanho aproximado do body.
            */

            const rawBody =
                JSON.stringify(
                    req.body || {}
                );


            if (
                rawBody.length >
                MAX_BODY_SIZE
            ) {

                return sendJson(
                    res,
                    413,
                    {

                        ok: false,

                        error:
                            "Evento muito grande."

                    }
                );

            }


            /*
               Verifica se o body existe.
            */

            if (
                !req.body ||
                typeof req.body !== "object"
            ) {

                return sendJson(
                    res,
                    400,
                    {

                        ok: false,

                        error:
                            "O corpo da requisição precisa ser JSON."

                    }
                );

            }


            /*
               Normaliza.
            */

            let event =
                normalizeEvent(
                    req.body
                );


            /*
               Valida.
            */

            const validation =
                validateEvent(
                    event
                );


            if (
                !validation.valid
            ) {

                return sendJson(
                    res,
                    400,
                    {

                        ok: false,

                        error:
                            validation.error

                    }
                );

            }


            /*
               Converte aliases.
            */

            event =
                convertEvent(
                    event
                );


            /*
               ID único.
            */

            const eventId =
                generateEventId();


            /*
               Resultado.
            */

            return sendJson(
                res,
                200,
                {

                    ok: true,

                    accepted: true,

                    eventId,

                    event,

                    next:
                        "Evento aceito pela API.",

                    timestamp:
                        Date.now()

                }
            );

        } catch (error) {

            console.error(
                "Erro na API:",
                error
            );


            return sendJson(
                res,
                500,
                {

                    ok: false,

                    error:
                        "Erro interno ao processar o evento."

                }
            );

        }

    }


    /*
       Fallback.
    */

    return sendJson(
        res,
        400,
        {

            ok: false,

            error:
                "Requisição inválida."

        }
    );

}