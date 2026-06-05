const express = require('express');
const axios = require('axios');
const app = express();

const API_URL = "https://api.football-data.org/v4";
const API_KEY = "f7c9e0d1645e4e79b8a87679323f46f4"; 

app.get('/api/test', async (req, res) => {
    try {
        // Esta rota lista as ligas disponíveis e ativas
        const response = await axios.get(`${API_URL}/competitions`, {
            headers: { 'X-Auth-Token': API_KEY }
        });
        res.json({ status: "Sucesso", totalLigas: response.data.competitions.length });
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
});

app.listen(3000, () => console.log("Servidor ativo!"));
