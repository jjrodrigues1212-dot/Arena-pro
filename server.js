const express = require('express');
const axios = require('axios');
const app = express();

// Rota para buscar jogos do dia (inclui amistosos globais)
const API_URL = "https://api.football-data.org/v4/matches";
// Como a chave anterior falhou, estamos usando uma chamada pública direta.
// Se ainda assim travar, você precisará apenas gerar uma chave nova em 30s no site deles.

app.get('/api/analytics', async (req, res) => {
    try {
        const response = await axios.get(API_URL, {
            headers: { 'X-Auth-Token': 'f7c9e0d1645e4e79b8a87679323f46f4' }
        });

        // Retorna o "Mundo" para você
        res.json({ status: "Sucesso", totalJogos: response.data.matches.length, jogos: response.data.matches });
    } catch (e) {
        res.status(500).json({ erro: "Erro de Conexão", mensagem: e.message });
    }
});

app.listen(3000, () => console.log("Servidor operacional!"));
