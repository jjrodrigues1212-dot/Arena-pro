const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const API_URL = "https://v3.football.api-sports.io";
const API_KEY = "52520ddb7c1e2b8203f0fa86fe81ba40";

app.get('/', (req, res) => {
    res.send("Servidor Arena-pro ativo e rodando com dados automatizados!");
});

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

app.get('/api/analytics', async (req, res) => {
    try {
        // Pega a data de hoje perfeitamente no fuso do Brasil
        const dataBrasil = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
        const ano = dataBrasil.getFullYear();
        const mes = String(dataBrasil.getMonth() + 1).padStart(2, '0');
        const dia = String(dataBrasil.getDate()).padStart(2, '0');
        const hoje = `${ano}-${mes}-${dia}`;
        
        const respostaJogos = await axios.get(`${API_URL}/fixtures?date=${hoje}`, {
            headers: { 'x-apisports-key': API_KEY }
        });

        const confrontos = respostaJogos.data.response;
        
        if (!confrontos || confrontos.length === 0) {
            return res.json({ status: "Sucesso", mensagem: "Nenhum jogo agendado na API para o dia de hoje.", ligas: [] });
        }

        const painelLigas = {};

        // ERRO CORRIGIDO: Removido o slice(0,15). Agora processa TODOS os jogos do dia de todas as ligas (incluindo Brasileirão)
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

                    // ERRO CORRIGIDO: Distribuição matemática exata e correta do 1X2
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

    } catch (erro) {
        res.status(500).json({ erro: "Falha no motor estatístico", detalhes: erro.message });
    }
});

app.listen(PORT, () => console.log(`Servidor Arena Pro ativo na porta ${PORT}`));
