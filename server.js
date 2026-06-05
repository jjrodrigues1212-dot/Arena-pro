const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const API_URL = "https://v3.football.api-sports.io";
const API_KEY = "52520ddb7c1e2b8203f0fa86fe81ba40";

app.get('/api/analytics', async (req, res) => {
    try {
        const dataHoje = new Date();
        const hoje = dataHoje.toLocaleDateString("pt-BR", {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).split('/').reverse().join('-');

        // Busca global sem filtrar por país ou liga específica
        const resposta = await axios.get(`${API_URL}/fixtures?date=${hoje}&timezone=America/Sao_Paulo`, {
            headers: { 'x-apisports-key': API_KEY }
        });

        const confrontos = resposta.data.response;
        
        if (!confrontos || confrontos.length === 0) {
            return res.json({ status: "Sucesso", mensagem: `Nenhum jogo encontrado na API para a data: ${hoje}`, ligas: [] });
        }

        const painelLigas = {};
        
        // Processa os 20 primeiros jogos disponíveis na grade global do dia
        const listaProcessada = confrontos.slice(0, 20);

        for (const jogo of listaProcessada) {
            const nomeLiga = jogo.league.name.toUpperCase();
            const timeCasa = jogo.teams.home.name;
            const timeFora = jogo.teams.away.name;
            const horario = jogo.fixture.date.split('T')[1].substring(0, 5);

            const jogoFormatado = {
                casa: timeCasa,
                fora: timeFora,
                horario: horario,
                probs: { casa: 33, empate: 33, fora: 34 },
                dupla: { umX: 66, xDois: 66, umDois: 90 },
                gols: { mais25: 50 },
                btts: 50,
                escanteios: "10.5",
                chutesTotais: 20
            };

            if (!painelLigas[nomeLiga]) painelLigas[nomeLiga] = [];
            painelLigas[nomeLiga].push(jogoFormatado);
        }

        res.json({ status: "Sucesso", ligas: Object.keys(painelLigas).map(nome => ({ nome, jogos: painelLigas[nome] })) });

    } catch (erro) {
        res.status(500).json({ erro: "Falha na conexão com a API", detalhes: erro.message });
    }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
