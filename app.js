/* =========================================================
   BONECO DO ABISMO
   APP.JS
   Controle da interface + execução dos eventos
========================================================= */

"use strict";


/* =========================================================
   ESTADO PRINCIPAL
========================================================= */

let gameState =
    window.BONECO_STATE ||
    window.BonecoEvents.createGameState();


window.BONECO_STATE = gameState;


/* =========================================================
   ELEMENTOS DA INTERFACE
========================================================= */

const elements = {

    healthFill:
        document.getElementById("healthFill"),

    healthText:
        document.getElementById("healthText"),

    dangerFill:
        document.getElementById("dangerFill"),

    dangerText:
        document.getElementById("dangerText"),

    viewerCount:
        document.getElementById("viewerCount"),

    likeCount:
        document.getElementById("likeCount"),

    giftCount:
        document.getElementById("giftCount"),

    eventMessage:
        document.getElementById("eventMessage"),

    lastGift:
        document.getElementById("lastGift"),

    character:
        document.getElementById("character"),

    particles:
        document.getElementById("particles"),

    controlPanel:
        document.getElementById("controlPanel"),

    openControl:
        document.getElementById("openControl"),

    closeControl:
        document.getElementById("closeControl"),

    connectionStatus:
        document.getElementById("connectionStatus")

};


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);


function initializeApp() {

    setupControlPanel();

    setupControlButtons();

    setupExternalEvents();

    render();

    showEventMessage(
        "👁️ O Abismo está observando..."
    );

}


/* =========================================================
   PAINEL DE CONTROLE
========================================================= */

function setupControlPanel() {

    if (
        elements.openControl
    ) {

        elements.openControl.addEventListener(
            "click",
            openControlPanel
        );

    }


    if (
        elements.closeControl
    ) {

        elements.closeControl.addEventListener(
            "click",
            closeControlPanel
        );

    }

}


/* =========================================================
   ABRIR CONTROLE
========================================================= */

function openControlPanel() {

    if (
        !elements.controlPanel
    ) {

        return;

    }


    elements.controlPanel.classList.remove(
        "hidden"
    );

}


/* =========================================================
   FECHAR CONTROLE
========================================================= */

function closeControlPanel() {

    if (
        !elements.controlPanel
    ) {

        return;

    }


    elements.controlPanel.classList.add(
        "hidden"
    );

}


/* =========================================================
   BOTÕES DE CONTROLE
========================================================= */

function setupControlButtons() {

    const buttons =
        document.querySelectorAll(
            "[data-action]"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    executeControlAction(
                        button
                    );

                }
            );

        }
    );

}


/* =========================================================
   EXECUTAR AÇÃO DO BOTÃO
========================================================= */

function executeControlAction(button) {

    const action =
        button.dataset.action;


    const value =
        Number(
            button.dataset.value || 1
        );


    switch (action) {

        case "damage":

            triggerEvent({

                type: "DAMAGE",

                amount: value,

                username: "Controle"

            });

            break;


        case "heal":

            triggerEvent({

                type: "HEAL",

                amount: value,

                username: "Controle"

            });

            break;


        case "follow":

            triggerEvent({

                type: "FOLLOW",

                username: "Novo Seguidor"

            });

            break;


        case "likes":

            if (
                value >= 1000
            ) {

                triggerEvent({

                    type: "LIKE_1000",

                    amount: 1000,

                    username: "Curtidas"

                });

            } else {

                triggerEvent({

                    type: "LIKE_100",

                    amount: 100,

                    username: "Curtidas"

                });

            }

            break;


        case "rose":

            triggerEvent({

                type: "ROSE",

                username: "Visitante",

                giftName: "Rosa"

            });

            break;


        case "gift":

            triggerEvent({

                type: "GIFT",

                username: "Visitante",

                giftName: "Presente"

            });

            break;


        case "priority":

            triggerEvent({

                type: "PRIORITY",

                username: "Evento"

            });

            break;


        case "danger":

            triggerEvent({

                type: "DANGER",

                amount: value,

                username: "Controle"

            });

            break;


        case "viewer":

            triggerEvent({

                type: "VIEWER",

                amount: value,

                username: "Visitantes"

            });

            break;


        case "reset":

            resetGame();

            break;


        default:

            console.warn(
                "Ação desconhecida:",
                action
            );

    }

}


/* =========================================================
   DISPARAR EVENTO
========================================================= */

function triggerEvent(event) {

    const processed =
        window.BonecoEvents.processEvent(
            event,
            gameState
        );


    gameState =
        processed.state;


    window.BONECO_STATE =
        gameState;


    applyEventResult(
        processed
    );


    render();


    return processed;

}


/* =========================================================
   RECEBER EVENTOS EXTERNOS
========================================================= */

function setupExternalEvents() {

    window.addEventListener(
        "boneco:event",
        event => {

            if (
                !event.detail
            ) {

                return;

            }


            gameState =
                event.detail.state;


            window.BONECO_STATE =
                gameState;


            applyEventResult(
                event.detail
            );


            render();

        }
    );

}


/* =========================================================
   FUNÇÃO PÚBLICA PARA EVENTOS REAIS
========================================================= */

/*
   Futuramente uma ponte externa poderá chamar:

   window.BonecoLive.receive({
       type: "LIKE_1000",
       username: "Jogador",
       amount: 1000
   });
*/

window.BonecoLive = {

    receive(event) {

        return triggerEvent(
            event
        );

    },

    getState() {

        return {
            ...gameState
        };

    },

    reset() {

        resetGame();

    }

};


/* =========================================================
   APLICAR RESULTADO DO EVENTO
========================================================= */

function applyEventResult(processed) {

    if (
        !processed ||
        !processed.result
    ) {

        return;

    }


    const result =
        processed.result;


    const event =
        processed.event;


    let message =
        result.message;


    /*
       Se houver usuário,
       acrescentamos o nome.
    */

    if (
        event.username &&
        event.username !== "Controle"
    ) {

        message =
            `${event.username}: ${message}`;

    }


    showEventMessage(
        `${result.icon} ${message}`
    );


    /*
       Presente
    */

    if (
        gameState.lastGift
    ) {

        elements.lastGift.textContent =
            gameState.lastGift;

    }


    /*
       Dano
    */

    if (
        result.shake
    ) {

        animateHit();

    }


    /*
       Evento especial
    */

    if (
        result.superEvent
    ) {

        animateSuperEvent();

    }


    /*
       Partículas
    */

    if (
        result.particles
    ) {

        createParticles(
            result.superEvent
                ? 30
                : 12
        );

    }


    /*
       Perigo elevado
    */

    if (
        gameState.danger >= 75
    ) {

        animateDanger();

    }


    /*
       Vida zerada
    */

    if (
        gameState.health <= 0
    ) {

        handleDeath();

    }

}


/* =========================================================
   RENDERIZAR ESTADO
========================================================= */

function render() {

    renderHealth();

    renderDanger();

    renderCounters();

}


/* =========================================================
   VIDA
========================================================= */

function renderHealth() {

    const health =
        Math.round(
            gameState.health
        );


    const maxHealth =
        Math.max(
            1,
            gameState.maxHealth
        );


    const percentage =
        (
            health /
            maxHealth
        ) * 100;


    const safePercentage =
        Math.max(
            0,
            Math.min(
                100,
                percentage
            )
        );


    if (
        elements.healthFill
    ) {

        elements.healthFill.style.width =
            `${safePercentage}%`;

    }


    if (
        elements.healthText
    ) {

        elements.healthText.textContent =
            `${health} / ${maxHealth}`;

    }

}


/* =========================================================
   PERIGO
========================================================= */

function renderDanger() {

    const danger =
        Math.round(
            gameState.danger
        );


    const safeDanger =
        Math.max(
            0,
            Math.min(
                100,
                danger
            )
        );


    if (
        elements.dangerFill
    ) {

        elements.dangerFill.style.width =
            `${safeDanger}%`;

    }


    if (
        elements.dangerText
    ) {

        elements.dangerText.textContent =
            `${safeDanger}%`;

    }

}


/* =========================================================
   CONTADORES
========================================================= */

function renderCounters() {

    if (
        elements.viewerCount
    ) {

        elements.viewerCount.textContent =
            formatNumber(
                gameState.viewers
            );

    }


    if (
        elements.likeCount
    ) {

        elements.likeCount.textContent =
            formatNumber(
                gameState.likes
            );

    }


    if (
        elements.giftCount
    ) {

        elements.giftCount.textContent =
            formatNumber(
                gameState.gifts
            );

    }

}


/* =========================================================
   FORMATAR NÚMEROS
========================================================= */

function formatNumber(number) {

    const value =
        Number(number);


    if (
        !Number.isFinite(value)
    ) {

        return "0";

    }


    return value.toLocaleString(
        "pt-BR"
    );

}


/* =========================================================
   MENSAGEM DO EVENTO
========================================================= */

let messageTimer = null;


function showEventMessage(message) {

    if (
        !elements.eventMessage
    ) {

        return;

    }


    elements.eventMessage.textContent =
        message;


    elements.eventMessage.style.opacity =
        "1";


    elements.eventMessage.style.transform =
        "scale(1.04)";


    clearTimeout(
        messageTimer
    );


    setTimeout(
        () => {

            if (
                elements.eventMessage
            ) {

                elements.eventMessage.style.transform =
                    "scale(1)";

            }

        },
        120
    );


    messageTimer =
        setTimeout(
            () => {

                if (
                    elements.eventMessage
                ) {

                    elements.eventMessage.style.opacity =
                        "0.72";

                }

            },
            4500
        );

}


/* =========================================================
   ANIMAÇÃO DE DANO
========================================================= */

function animateHit() {

    if (
        !elements.character
    ) {

        return;

    }


    elements.character.classList.remove(
        "hit"
    );


    void elements.character.offsetWidth;


    elements.character.classList.add(
        "hit"
    );


    setTimeout(
        () => {

            elements.character.classList.remove(
                "hit"
            );

        },
        400
    );

}


/* =========================================================
   ANIMAÇÃO DE CURA
========================================================= */

function animateHeal() {

    if (
        !elements.character
    ) {

        return;

    }


    elements.character.classList.remove(
        "heal"
    );


    void elements.character.offsetWidth;


    elements.character.classList.add(
        "heal"
    );


    setTimeout(
        () => {

            elements.character.classList.remove(
                "heal"
            );

        },
        800
    );

}


/* =========================================================
   ANIMAÇÃO DE PERIGO
========================================================= */

function animateDanger() {

    if (
        !elements.character
    ) {

        return;

    }


    elements.character.classList.remove(
        "danger"
    );


    void elements.character.offsetWidth;


    elements.character.classList.add(
        "danger"
    );


    setTimeout(
        () => {

            elements.character.classList.remove(
                "danger"
            );

        },
        900
    );

}


/* =========================================================
   EVENTO SUPER
========================================================= */

function animateSuperEvent() {

    if (
        !elements.character
    ) {

        return;

    }


    elements.character.classList.remove(
        "super-event"
    );


    void elements.character.offsetWidth;


    elements.character.classList.add(
        "super-event"
    );


    setTimeout(
        () => {

            elements.character.classList.remove(
                "super-event"
            );

        },
        1100
    );

}


/* =========================================================
   PARTÍCULAS
========================================================= */

function createParticles(amount = 12) {

    if (
        !elements.particles
    ) {

        return;

    }


    const total =
        Math.max(
            1,
            Math.min(
                50,
                amount
            )
        );


    for (
        let i = 0;
        i < total;
        i++
    ) {

        const particle =
            document.createElement(
                "div"
            );


        particle.className =
            "particle";


        const x =
            (
                Math.random() * 220
            ) - 110;


        const y =
            (
                Math.random() * 260
            ) - 130;


        particle.style.setProperty(
            "--x",
            `${x}px`
        );


        particle.style.setProperty(
            "--y",
            `${y}px`
        );


        particle.style.left =
            "50%";


        particle.style.top =
            "50%";


        /*
           Pequena variação de tamanho.
        */

        const size =
            4 +
            Math.random() * 7;


        particle.style.width =
            `${size}px`;


        particle.style.height =
            `${size}px`;


        elements.particles.appendChild(
            particle
        );


        setTimeout(
            () => {

                particle.remove();

            },
            900
        );

    }

}


/* =========================================================
   MORTE DO BONECO
========================================================= */

function handleDeath() {

    showEventMessage(
        "💀 O BONECO FOI DERROTADO!"
    );


    if (
        elements.character
    ) {

        elements.character.style.opacity =
            "0.35";

        elements.character.style.transform =
            "rotate(8deg) translateY(10px)";

    }


    createParticles(
        40
    );

}


/* =========================================================
   RESET
========================================================= */

function resetGame() {

    gameState =
        window.BonecoEvents.createGameState();


    window.BONECO_STATE =
        gameState;


    if (
        elements.character
    ) {

        elements.character.style.opacity =
            "1";

        elements.character.style.transform =
            "";

    }


    if (
        elements.lastGift
    ) {

        elements.lastGift.textContent =
            "Nenhum presente recebido";

    }


    showEventMessage(
        "🔄 O Abismo foi reiniciado."
    );


    render();

}


/* =========================================================
   ATALHOS DE TESTE
========================================================= */

/*
   Estes atalhos são úteis enquanto
   estamos desenvolvendo pelo celular.

   F1 = 100 curtidas
   F2 = 1000 curtidas
   F3 = Rosa
   F4 = Presente
   F5 = Dano
   F6 = Cura
*/

document.addEventListener(
    "keydown",
    event => {

        switch (event.key) {

            case "F1":

                triggerEvent({
                    type: "LIKE_100",
                    amount: 100,
                    username: "Teste"
                });

                break;


            case "F2":

                triggerEvent({
                    type: "LIKE_1000",
                    amount: 1000,
                    username: "Teste"
                });

                break;


            case "F3":

                triggerEvent({
                    type: "ROSE",
                    username: "Teste",
                    giftName: "Rosa"
                });

                break;


            case "F4":

                triggerEvent({
                    type: "GIFT",
                    username: "Teste",
                    giftName: "Presente"
                });

                break;


            case "F5":

                triggerEvent({
                    type: "DAMAGE",
                    amount: 100,
                    username: "Teste"
                });

                break;


            case "F6":

                triggerEvent({
                    type: "HEAL",
                    amount: 100,
                    username: "Teste"
                });

                break;

        }

    }
);


/* =========================================================
   CORREÇÃO DA ANIMAÇÃO DE CURA
========================================================= */

window.addEventListener(
    "boneco:event",
    event => {

        if (
            event.detail &&
            event.detail.result &&
            event.detail.result.heal > 0
        ) {

            animateHeal();

        }

    }
);


/* =========================================================
   LOG DE DESENVOLVIMENTO
========================================================= */

console.log(
    "🕳️ Boneco do Abismo iniciado."
);


console.log(
    "🎛️ Controle integrado carregado."
);


console.log(
    "🔥 Evento S-1000 disponível."
);