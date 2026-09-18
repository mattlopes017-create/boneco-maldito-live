/* =========================================================
   BONECO DO ABISMO
   EVENTOS.JS
   Motor central de eventos
========================================================= */

"use strict";


/* =========================================================
   CONFIGURAÇÃO DOS EVENTOS
========================================================= */

const EVENT_CONFIG = {

    FOLLOW: {
        name: "NOVO SEGUIDOR",
        icon: "➕",
        danger: 5,
        message: "👁️ Um novo seguidor entrou no Abismo..."
    },

    LIKE_100: {
        name: "100 CURTIDAS",
        icon: "❤️",
        danger: 3,
        message: "❤️ O Abismo sentiu 100 curtidas!"
    },

    LIKE_1000: {
        name: "1000 CURTIDAS",
        icon: "🔥",
        danger: 20,
        damage: 100,
        message: "🔥 MIL CURTIDAS! O ABISMO DESPERTOU!"
    },

    ROSE: {
        name: "ROSA",
        icon: "🌹",
        danger: 8,
        damage: 25,
        message: "🌹 Uma rosa foi lançada ao Abismo..."
    },

    GIFT: {
        name: "PRESENTE",
        icon: "🎁",
        danger: 12,
        damage: 50,
        message: "🎁 O Abismo recebeu um presente!"
    },

    PRIORITY: {
        name: "EVENTO PRIORITÁRIO",
        icon: "⚡",
        danger: 25,
        damage: 150,
        message: "⚡ EVENTO PRIORITÁRIO! O BONECO REAGIU!"
    },

    DAMAGE: {
        name: "DANO",
        icon: "💥",
        message: "💥 O Boneco sofreu dano!"
    },

    HEAL: {
        name: "CURA",
        icon: "💚",
        message: "💚 O Boneco recuperou vida!"
    },

    DANGER: {
        name: "PERIGO",
        icon: "☠️",
        message: "☠️ O nível de perigo aumentou!"
    },

    VIEWER: {
        name: "VISUALIZADOR",
        icon: "👤",
        message: "👤 Novo espectador detectado!"
    }

};


/* =========================================================
   ESTADO PADRÃO
========================================================= */

const DEFAULT_GAME_STATE = {

    health: 1000,

    maxHealth: 1000,

    danger: 0,

    viewers: 0,

    likes: 0,

    gifts: 0,

    followers: 0,

    lastGift: "",

    lastEvent: "",

    eventCount: 0,

    connected: false

};


/* =========================================================
   CLONAR ESTADO
========================================================= */

function createGameState() {

    return {
        ...DEFAULT_GAME_STATE
    };

}


/* =========================================================
   LIMITADORES
========================================================= */

function clamp(value, min, max) {

    return Math.min(
        Math.max(value, min),
        max
    );

}


/* =========================================================
   NORMALIZAR VALOR
========================================================= */

function normalizeNumber(value, fallback = 1) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return fallback;
    }

    return number;

}


/* =========================================================
   NORMALIZAR EVENTO
========================================================= */

function normalizeEvent(event) {

    if (!event || typeof event !== "object") {

        return {
            type: "UNKNOWN",
            value: 0
        };

    }


    let type =
        event.type ||
        event.event ||
        event.action ||
        "UNKNOWN";


    type = String(type)
        .trim()
        .toUpperCase();


    return {

        type,

        value:
            normalizeNumber(
                event.value,
                1
            ),

        amount:
            normalizeNumber(
                event.amount,
                event.value || 1
            ),

        username:
            event.username ||
            event.user ||
            event.nickname ||
            "Alguém",

        giftName:
            event.giftName ||
            event.gift ||
            "Presente",

        message:
            event.message ||
            "",

        timestamp:
            event.timestamp ||
            Date.now(),

        raw:
            event

    };

}


/* =========================================================
   CRIAR RESULTADO PADRÃO
========================================================= */

function createEventResult(type) {

    const config =
        EVENT_CONFIG[type] ||
        {};

    return {

        type,

        name:
            config.name ||
            type,

        icon:
            config.icon ||
            "❔",

        message:
            config.message ||
            "Evento recebido.",

        danger:
            config.danger ||
            0,

        damage:
            config.damage ||
            0,

        heal:
            0,

        particles:
            false,

        shake:
            false,

        superEvent:
            false,

        priority:
            false

    };

}


/* =========================================================
   PROCESSAR FOLLOW
========================================================= */

function processFollow(event, state) {

    const result =
        createEventResult("FOLLOW");


    state.followers += 1;

    state.danger =
        clamp(
            state.danger + result.danger,
            0,
            100
        );


    result.particles = true;


    return result;

}


/* =========================================================
   PROCESSAR 100 CURTIDAS
========================================================= */

function processLike100(event, state) {

    const result =
        createEventResult("LIKE_100");


    const amount =
        Math.max(
            100,
            event.amount
        );


    state.likes += amount;


    state.danger =
        clamp(
            state.danger + result.danger,
            0,
            100
        );


    result.particles = true;


    return result;

}


/* =========================================================
   PROCESSAR 1000 CURTIDAS
========================================================= */

function processLike1000(event, state) {

    const result =
        createEventResult("LIKE_1000");


    const amount =
        Math.max(
            1000,
            event.amount
        );


    state.likes += amount;


    state.danger =
        clamp(
            state.danger + result.danger,
            0,
            100
        );


    state.health =
        clamp(
            state.health - result.damage,
            0,
            state.maxHealth
        );


    result.particles = true;

    result.shake = true;

    result.superEvent = true;

    result.priority = true;


    return result;

}


/* =========================================================
   PROCESSAR ROSA
========================================================= */

function processRose(event, state) {

    const result =
        createEventResult("ROSE");


    state.gifts += 1;


    state.danger =
        clamp(
            state.danger + result.danger,
            0,
            100
        );


    state.health =
        clamp(
            state.health - result.damage,
            0,
            state.maxHealth
        );


    state.lastGift =
        `${event.username} enviou 🌹 Rosa`;


    result.particles = true;

    result.shake = true;


    return result;

}


/* =========================================================
   PROCESSAR PRESENTE
========================================================= */

function processGift(event, state) {

    const result =
        createEventResult("GIFT");


    state.gifts += 1;


    state.danger =
        clamp(
            state.danger + result.danger,
            0,
            100
        );


    state.health =
        clamp(
            state.health - result.damage,
            0,
            state.maxHealth
        );


    state.lastGift =
        `${event.username} enviou 🎁 ${event.giftName}`;


    result.particles = true;

    result.shake = true;


    return result;

}


/* =========================================================
   PROCESSAR PRIORITÁRIO
========================================================= */

function processPriority(event, state) {

    const result =
        createEventResult("PRIORITY");


    state.danger =
        clamp(
            state.danger + result.danger,
            0,
            100
        );


    state.health =
        clamp(
            state.health - result.damage,
            0,
            state.maxHealth
        );


    result.particles = true;

    result.shake = true;

    result.priority = true;


    return result;

}


/* =========================================================
   PROCESSAR DANO
========================================================= */

function processDamage(event, state) {

    const result =
        createEventResult("DAMAGE");


    const damage =
        Math.max(
            0,
            event.amount
        );


    state.health =
        clamp(
            state.health - damage,
            0,
            state.maxHealth
        );


    result.damage =
        damage;


    result.message =
        `💥 O Boneco sofreu ${damage} de dano!`;


    result.particles = true;

    result.shake = true;


    return result;

}


/* =========================================================
   PROCESSAR CURA
========================================================= */

function processHeal(event, state) {

    const result =
        createEventResult("HEAL");


    const heal =
        Math.max(
            0,
            event.amount
        );


    state.health =
        clamp(
            state.health + heal,
            0,
            state.maxHealth
        );


    result.heal =
        heal;


    result.message =
        `💚 O Boneco recuperou ${heal} de vida!`;


    return result;

}


/* =========================================================
   PROCESSAR PERIGO
========================================================= */

function processDanger(event, state) {

    const result =
        createEventResult("DANGER");


    const amount =
        Math.max(
            0,
            event.amount
        );


    state.danger =
        clamp(
            state.danger + amount,
            0,
            100
        );


    result.danger =
        amount;


    result.message =
        `☠️ Perigo aumentou ${amount}%!`;


    result.particles = true;


    return result;

}


/* =========================================================
   PROCESSAR VIEWER
========================================================= */

function processViewer(event, state) {

    const result =
        createEventResult("VIEWER");


    const amount =
        Math.max(
            1,
            event.amount
        );


    state.viewers += amount;


    result.message =
        `👤 ${amount} espectador(es) detectado(s)!`;


    return result;

}


/* =========================================================
   PROCESSAR EVENTO
========================================================= */

function processEvent(inputEvent, currentState) {

    const event =
        normalizeEvent(inputEvent);


    const state =
        currentState ||
        createGameState();


    let result;


    switch (event.type) {

        case "FOLLOW":

        case "FOLLOWER":

        case "NEW_FOLLOWER":

            result =
                processFollow(
                    event,
                    state
                );

            break;


        case "LIKE_100":

        case "LIKES_100":

        case "100_LIKES":

            result =
                processLike100(
                    event,
                    state
                );

            break;


        case "LIKE_1000":

        case "LIKES_1000":

        case "1000_LIKES":

        case "S1000":

        case "S-1000":

            result =
                processLike1000(
                    event,
                    state
                );

            break;


        case "ROSE":

        case "ROSA":

            result =
                processRose(
                    event,
                    state
                );

            break;


        case "GIFT":

        case "PRESENT":

        case "PRESENTE":

            result =
                processGift(
                    event,
                    state
                );

            break;


        case "PRIORITY":

        case "PRIORITARIO":

        case "PRIORITÁRIOS":

            result =
                processPriority(
                    event,
                    state
                );

            break;


        case "DAMAGE":

        case "DANO":

            result =
                processDamage(
                    event,
                    state
                );

            break;


        case "HEAL":

        case "CURA":

            result =
                processHeal(
                    event,
                    state
                );

            break;


        case "DANGER":

        case "PERIGO":

            result =
                processDanger(
                    event,
                    state
                );

            break;


        case "VIEWER":

        case "VIEWERS":

        case "VIEW":

            result =
                processViewer(
                    event,
                    state
                );

            break;


        default:

            result = {

                type: "UNKNOWN",

                name: "EVENTO DESCONHECIDO",

                icon: "❔",

                message:
                    `❔ Evento desconhecido: ${event.type}`,

                danger: 0,

                damage: 0,

                heal: 0,

                particles: false,

                shake: false,

                superEvent: false,

                priority: false

            };

            break;

    }


    state.lastEvent =
        event.type;


    state.eventCount += 1;


    return {

        event,

        result,

        state

    };

}


/* =========================================================
   EVENTOS EXTERNOS
========================================================= */

/*
   Esta função será utilizada futuramente
   pela ponte com eventos reais da Live.

   Exemplo:

   receiveExternalEvent({
       type: "LIKE_1000",
       username: "Joao",
       amount: 1000
   });

*/

function receiveExternalEvent(event) {

    if (
        typeof window === "undefined"
    ) {

        return null;

    }


    const currentState =
        window.BONECO_STATE ||
        createGameState();


    const processed =
        processEvent(
            event,
            currentState
        );


    window.BONECO_STATE =
        processed.state;


    window.dispatchEvent(

        new CustomEvent(
            "boneco:event",
            {
                detail: processed
            }
        )

    );


    return processed;

}


/* =========================================================
   API GLOBAL
========================================================= */

window.BonecoEvents = {

    EVENT_CONFIG,

    DEFAULT_GAME_STATE,

    createGameState,

    normalizeEvent,

    processEvent,

    receiveExternalEvent

};


/* =========================================================
   ESTADO INICIAL GLOBAL
========================================================= */

if (
    typeof window !== "undefined"
) {

    if (
        !window.BONECO_STATE
    ) {

        window.BONECO_STATE =
            createGameState();

    }

}