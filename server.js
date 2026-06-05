const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Garante que o CodePen consiga conversar direto com o seu Render
app.use(cors());

const API_URL = "https://v3.football.api-sports.io";
const API_KEY = "52520ddb7c1e2b8203f0fa86fe81ba40";

app.get('/', (req, res) => {
    res.send("Servidor Arena-pro ativo e rodando com dados automatizados!");
});

// Funções Matemáticas do Algoritmo
function calcularFatorial(n) {
    if (n === 0 || n === 1) return 1;
    let resultado = 1;
    for (let i = 2; i <= n; i++) resultado *= i;
    return resultado;
}

function calcularPoisson(media, k) {
    const e = Math.E;
    return (Math.pow(media, k) * Math.pow(e, -media)) / calcularFatorial(k);
}

// Rota que o seu CodePen consulta
app.get('/api/analytics', async (req, res) => {
    try {
        // 1. Descobre a data de hoje correta no fuso de Brasília (AAAA-MM-DD)
        const dataHoje = new Date();
        const hoje = dataHoje.toLocaleDateString("pt-BR", {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).split('/').reverse().join('-');

        // 2. Busca TODOS os jogos globais sincronizados com o horário de Brasília
        const respostaJogos = await axios.get(`${API_URL}/fixtures?date=${hoje}&timezone=America/Sao_Paulo`, {
            headers: { 'x-apisports-key': API_KEY }
        });

        const confrontos = respostaJogos.data.response;
        
        // Se a grade global falhar, ele faz uma segunda tentativa buscando focado no Brasil
        if (!confrontos || confrontos.length === 0) {
            const respostaBrasil = await axios.get(`${API_URL}/fixtures?date=${hoje}&country=Brazil&timezone=America/Sao_Paulo`, {
                headers: { 'x-apisports-key': API_KEY }
            });
            const confrontosBrasil = respostaBrasil.data.response;

            if (!confrontosBrasil || confrontosBrasil.length === 0) {
                return res.json({ status: "Sucesso", mensagem: `Nenhum jogo disponível na API para a data de hoje (${hoje}).`, ligas: [] });
            }
            return processarEstatisticas(confrontosBrasil, res);
        }

        // Se achou os jogos globais, processa normalmente
        return processarEstatisticas(confrontos, res);

    } catch (erro) {
        res.status(500).json({ erro: "Falha no motor estatístico", detalhes: erro.message });
    }
});

// Função que roda o algoritmo de Poisson em cada partida encontrada
function processarEstatisticas(confrontos, res) {
    const painelLigas = {};

    for (const jogo of confrontos) {
        const nomeLiga = jogo.league.name.toUpperCase();
        const timeCasa = jogo.teams.home.name;
        const timeFora = jogo.teams.away.name;
        const horario = jogo.fixture.date.split('T')[1].substring(0, 5);
        const ehNeutro = jogo.fixture.neutral; 

        let mediaGolsCasa = ehNeutro ? 1.4 : 1.6;
        let mediaGolsFora = ehNeutro ? 1.2 : 1.1;

        let probCasa = 0, probFora = 0, probEmpate = 0, probAmbasMarcam = 0;
        let probOver15 = 0, probOver25 = 0;

        for (let gCasa = 0; gCasa <= 4; gCasa++) {
            for (let gFora = 0; gFora <= 4; gFora++) {
                let pC = calcularPoisson(mediaGolsCasa, gCasa);
                let pF = calcularPoisson(mediaGolsFora, gFora);
                let pPlacar = pC * pF;

                if (gCasa > gFora) {
                    probCasa += pPlacar;
                } else if (gFora > gCasa) {
                    probFora += pPlacar; 
                } else {
                    probEmpate += pPlacar;
                }

                if (gCasa > 0 && gFora > 0) probAmbasMarcam += pPlacar;

                let totalGols = gCasa + gFora;
                if (totalGols > 1.5) probOver15 += pPlacar;
                if (totalGols > 2.5) probOver25 += pPlacar;
            }
        }

        const pCasa = Math.round(probCasa * 100);
        const pEmpate = Math.round(probEmpate * 100);
        const pFora = Math.round(probFora * 100);

        const jogoFormatado = {
            casa: timeCasa,
            fora: timeFora,
            horario: horario,
            probs: { casa: pCasa, empate: pEmpate, fora: pFora },
            dupla: {
                umX: Math.min(pCasa + pEmpate, 99),
                xDois: Math.min(pEmpate + pFora, 99),
                umDois: Math.min(pCasa + pFora, 99)
            },
            gols: {
                mais25: Math.round(probOver25 * 100)
            },
            btts: Math.round(probAmbasMarcam * 100),
            escanteios: (mediaGolsCasa * 3 + 5).toFixed(1),
            chutesTotais: Math.round(mediaGolsCasa * 7 + 10)
        };

        if (!painelLigas[nomeLiga]) painelLigas[nomeLiga] = [];
        painelLigas[nomeLiga].push(jogoFormatado);
    }

    const listaLigas = Object.keys(painelLigas).map(nome => ({
        nome: nome,
        jogos: painelLigas[nome]
    }));

    res.json({ status: "Sucesso", ligas: listaLigas });
}

app.listen(PORT, () => console.log(`Servidor Arena Pro ativo na porta ${PORT}`));
