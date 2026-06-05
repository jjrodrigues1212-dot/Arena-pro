const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());

// Esta API pública lista jogos globais sem exigir chaves
const API_URL = "https://www.scorebat.com/video-api/v3/";

app.get('/api/analytics', async (req, res) => {
    try {
        console.log("Buscando jogos na ScoreBat...");
        const response = await axios.get(API_URL);
        
        // Estrutura de dados para o seu painel
        const jogos = response.data.response.map(j => ({
            timeCasa: j.title.split(' vs ')[0],
            timeFora: j.title.split(' vs ')[1],
            competicao: j.competition,
            data: j.date
        }));

        res.json({ status: "Sucesso", total: jogos.length, jogos: jogos });

    } catch (e) {
        res.status(500).json({ erro: "Erro ao buscar dados", detalhe: e.message });
    }
});

app.listen(3000, () => console.log("Servidor ativo!"));
