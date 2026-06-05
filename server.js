const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());

const API_URL = "https://www.scorebat.com/video-api/v3/";

app.get('/api/analytics', async (req, res) => {
    try {
        const response = await axios.get(API_URL);
        const hoje = new Date().toISOString().split('T')[0]; // Data de hoje: 2026-06-05

        // Filtro: pegar apenas jogos cuja data corresponde a hoje
        const jogosDeHoje = response.data.response.filter(j => {
            return j.date.startsWith(hoje);
        });

        res.json({ 
            status: "Sucesso", 
            totalHoje: jogosDeHoje.length, 
            jogos: jogosDeHoje 
        });

    } catch (e) {
        res.status(500).json({ erro: "Erro ao filtrar", detalhe: e.message });
    }
});

app.listen(3000, () => console.log("Servidor filtrado ativo!"));
