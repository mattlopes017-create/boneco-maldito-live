// ============================================================
// BONECO DO ABISMO
// API DE EVENTOS
// Arquivo: api/evento.js
// ============================================================

let eventos = [];

const MAX_EVENTOS = 50;
const MAX_BODY_SIZE = 10000;

// ------------------------------------------------------------
// CABEÇALHOS
// ------------------------------------------------------------

function headers() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "no-store, no-cache, must-revalidate"
    };
}

// ------------------------------------------------------------
// GERAR ID
// ------------------------------------------------------------

function gerarId() {
    return (
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).substring(2, 8)
    );
}

// ------------------------------------------------------------
// NORMALIZAR EVENTO
// ------------------------------------------------------------

function normalizarEvento(body) {

    let tipo = String(
        body.type ||
        body.event ||
        ""
    ).toUpperCase();

    // Compatibilidade com nomes antigos
    if (tipo === "LIKE") {
        const quantidade = Number(body.amount || body.count || 1);

        if (quantidade >= 1000) {
            tipo = "LIKE_1000";
        } else {
            tipo = "LIKE_100";
        }
    }

    if (tipo === "S1000" || tipo === "S-1000") {
        tipo = "LIKE_1000";
    }

    return {
        eventId: gerarId(),

        type: tipo,

        username: String(
            body.username ||
            body.uniqueId ||
            body.user ||
            "Anônimo"
        ).substring(0, 100),

        giftName: String(
            body.giftName ||
            body.gift ||
            ""
        ).substring(0, 100),

        message: String(
            body.message ||
            ""
        ).substring(0, 500),

        amount: Number(
            body.amount ||
            body.count ||
            1
        ),

        timestamp: Date.now()
    };
}

// ------------------------------------------------------------
// TIPOS PERMITIDOS
// ------------------------------------------------------------

const EVENTOS_PERMITIDOS = [
    "FOLLOW",
    "LIKE_100",
    "LIKE_1000",
    "ROSE",
    "GIFT",
    "PRIORITY",
    "DAMAGE",
    "HEAL",
    "DANGER",
    "VIEWER"
];

// ------------------------------------------------------------
// HANDLER
// ------------------------------------------------------------

export default async function handler(req, res) {

    // Cabeçalhos
    const h = headers();

    Object.keys(h).forEach((key) => {
        res.setHeader(key, h[key]);
    });

    // --------------------------------------------------------
    // OPTIONS
    // --------------------------------------------------------

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // --------------------------------------------------------
    // GET
    // --------------------------------------------------------

    if (req.method === "GET") {

        // Pega o ID do último evento que o cliente recebeu
        const since = req.query?.since || "";

        let novosEventos = eventos;

        if (since) {

            const indice = eventos.findIndex(
                evento => evento.eventId === since
            );

            if (indice >= 0) {
                novosEventos = eventos.slice(indice + 1);
            }
        }

        return res.status(200).json({

            ok: true,

            online: true,

            count: novosEventos.length,

            events: novosEventos,

            acceptedEvents: EVENTOS_PERMITIDOS

        });
    }

    // --------------------------------------------------------
    // POST
    // --------------------------------------------------------

    if (req.method === "POST") {

        try {

            let body = req.body;

            // Caso Vercel entregue body como string
            if (typeof body === "string") {

                if (body.length > MAX_BODY_SIZE) {
                    return res.status(413).json({
                        ok: false,
                        error: "Payload muito grande."
                    });
                }

                body = JSON.parse(body);
            }

            if (!body || typeof body !== "object") {

                return res.status(400).json({
                    ok: false,
                    error: "JSON inválido."
                });
            }

            const evento =
                normalizarEvento(body);

            // ------------------------------------------------
            // VALIDAR EVENTO
            // ------------------------------------------------

            if (
                !EVENTOS_PERMITIDOS.includes(
                    evento.type
                )
            ) {

                return res.status(400).json({

                    ok: false,

                    error:
                        "Tipo de evento não permitido.",

                    received:
                        evento.type,

                    acceptedEvents:
                        EVENTOS_PERMITIDOS
                });
            }

            // ------------------------------------------------
            // ADICIONAR À FILA
            // ------------------------------------------------

            eventos.push(evento);

            // Limita tamanho da fila
            if (eventos.length > MAX_EVENTOS) {
                eventos =
                    eventos.slice(-MAX_EVENTOS);
            }

            console.log(
                "[Boneco API] Novo evento:",
                evento
            );

            // ------------------------------------------------
            // RESPOSTA
            // ------------------------------------------------

            return res.status(200).json({

                ok: true,

                accepted: true,

                eventId:
                    evento.eventId,

                event:
                    evento,

                queueSize:
                    eventos.length

            });

        } catch (erro) {

            console.error(
                "[Boneco API] Erro:",
                erro
            );

            return res.status(400).json({

                ok: false,

                error:
                    "Não foi possível processar o evento."

            });
        }
    }

    // --------------------------------------------------------
    // MÉTODO NÃO PERMITIDO
    // --------------------------------------------------------

    res.setHeader(
        "Allow",
        "GET, POST, OPTIONS"
    );

    return res.status(405).json({

        ok: false,

        error:
            "Método não permitido."

    });
}