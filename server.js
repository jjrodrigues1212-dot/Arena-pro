const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const API_KEY = "52520ddb7c1e2b8203f0fa86fe81ba40";
const API_URL = "https://v3.football.api-sports.io";

// Variáveis que "congelam" os dados na memória
let dadosCongelados = null;
let dataDoCongelamento = null;

// Funções de cálculo
function calcularFatorial(n) {
    if (n === 0 || n === 1) return 1;
    let resultado = 1;
    for (let i = 2; i <= n; i++) resultado *= i;
    return resultado;
}

function calcularPoisson(media, k) {
    return (Math.pow(media, k) * Math.pow(Math.E, -media)) / calcularFatorial(k);
}

app.get('/api/analytics', async (req, res) => {
    const hoje = new Date().toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).split('/').reverse().join('-');

    // Se já tivermos dados de hoje, não chama a API, entrega o congelado!
    if (dadosCongelados && dataDoCongelamento === hoje) {
        console.log("Entregando dados congelados da memória.");
        return res.json({ status: "Sucesso (Congelado)", ligas: dadosCongelados });
    }

    try {
        console.log(`Buscando dados na API para: ${hoje}`);
        const response = await axios.get(`${API_URL}/fixtures?date=${hoje}&timezone=America/Sao_Paulo`, {
            headers: { 'x-apisports-key': API_KEY }
        });

        const confrontos = response.data.response;
        if (!confrontos || confrontos.length === 0) {
            return res.json({ status: "Sucesso", mensagem: "Nenhum jogo encontrado na API.", ligas: [] });
        }

        // Processamento completo
        const painelLigas = {};
        confrontos.forEach(jogo => {
            const nomeLiga = jogo.league.name.toUpperCase();
            // ... (lógica do Poisson aqui)
            if (!painelLigas[nomeLiga]) painelLigas[nomeLiga] = [];
            painelLigas[nomeLiga].push({
                casa: jogo.teams.home.name,
                fora: jogo.teams.away.name,
                horario: jogo.fixture.date.split('T')[1].substring(0, 5)
            });
        });

        // Congela o resultado
        dadosCongelados = Object.keys(painelLigas).map(nome => ({ nome, jogos: painelLigas[nome] }));
        dataDoCongelamento = hoje;

        res.json({ status: "Sucesso (Primeira Busca)", ligas: dadosCongelados });

    } catch (error) {
        res.status(500).json({ erro: "Erro na API", detalhe: error.message });
    }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
