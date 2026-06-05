const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());

// Fonte: API gratuita (sem necessidade de chave)
const API_URL = "https://worldcupjson.net/matches/today";

app.get('/api/analytics', async (req, res) => {
    try {
        console.log("Buscando dados na fonte aberta...");
        const response = await axios.get(API_URL);
        
        // Estrutura que você gosta: Poisson e Probabilidades
        const jogos = response.data.map(j => ({
            casa: j.home_team.name,
            fora: j.away_team.name,
            probVitoria: "55%", // Exemplo
            status: j.status
        }));

        res.json({ status: "Sucesso", ligas: [{ nome: "MUNDIAL", jogos: jogos }] });

    } catch (e) {
        res.status(500).json({ erro: "Erro ao buscar dados", detalhe: e.message });
    }
});

app.listen(3000, () => console.log("Servidor ativo!"));
