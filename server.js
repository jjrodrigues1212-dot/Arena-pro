const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const API_KEY = "52520ddb7c1e2b8203f0fa86fe81ba40";
const API_URL = "https://v3.football.api-sports.io";

// Variáveis de Estado para congelar os dados
let dadosCongelados = null;
let dataDoCongelamento = null;

// Motor Matemático de Poisson
function calcularFatorial(n) {
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
}

function calcularPoisson(media, k) {
    return (Math.pow(media, k) * Math.pow(Math.E, -media)) / calcularFatorial(k);
}

app.get('/api/analytics', async (req, res) => {
    const hoje = new Date().toISOString().split('T')[0];

    // Entrega dados congelados se existirem
    if (dadosCongelados && dataDoCongelamento === hoje) {
        return res.json({ status: "Sucesso (Cache)", ligas: dadosCongelados });
    }

    try {
        // Busca geral para o Brasil
        const url = `${API_URL}/fixtures?country=Brazil&date=${hoje}`;
        const response = await axios.get(url, { headers: { 'x-apisports-key': API_KEY } });
        
        const confrontos = response.data.response;

        if (!confrontos || confrontos.length === 0) {
            return res.json({ status: "Sucesso", mensagem: "Nenhum jogo encontrado na grade brasileira hoje.", ligas: [] });
        }

        // Processamento com Poisson
        const painelLigas = {};
        confrontos.forEach(jogo => {
            const nomeLiga = jogo.league.name.toUpperCase();
            if (!painelLigas[nomeLiga]) painelLigas[nomeLiga] = [];
            
            // Calculando probabilidades simples para o painel
            const mediaCasa = 1.4;
            const mediaFora = 1.1;
            const probVitoria = (calcularPoisson(mediaCasa, 1) * 100).toFixed(0);

            painelLigas[nomeLiga].push({
                casa: jogo.teams.home.name,
                fora: jogo.teams.away.name,
                horario: jogo.fixture.date.split('T')[1].substring(0, 5),
                prob: `${probVitoria}%`
            });
        });

        // Congela os dados processados
        dadosCongelados = Object.keys(painelLigas).map(nome => ({ nome, jogos: painelLigas[nome] }));
        dataDoCongelamento = hoje;

        res.json({ status: "Sucesso (Nova Consulta)", ligas: dadosCongelados });

    } catch (e) {
        res.status(500).json({ erro: "Falha ao buscar dados", detalhe: e.message });
    }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
