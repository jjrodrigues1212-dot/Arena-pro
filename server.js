const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());

const API_KEY = "52520ddb7c1e2b8203f0fa86fe81ba40";
const API_URL = "https://v3.football.api-sports.io";

let cacheGlobal = null;
let dataDoCache = null;

app.get('/api/analytics', async (req, res) => {
    const hoje = new Date().toISOString().split('T')[0];

    // Se já temos o "mundo" na memória, entrega rápido
    if (cacheGlobal && dataDoCache === hoje) {
        return res.json({ status: "Sucesso (Cache Global)", data: cacheGlobal });
    }

    try {
        console.log("Varrendo todos os jogos do mundo...");
        // A chave aqui é remover qualquer filtro de país ou liga
        const response = await axios.get(`${API_URL}/fixtures?date=${hoje}`, {
            headers: { 'x-apisports-key': API_KEY }
        });

        const jogos = response.data.response;

        if (!jogos || jogos.length === 0) {
            return res.json({ status: "Sucesso", mensagem: "Nenhum jogo encontrado na grade mundial.", ligas: [] });
        }

        // Organiza por Liga (exibe o mundo todo)
        const painelMundial = {};
        jogos.forEach(j => {
            const nomeLiga = j.league.name;
            if (!painelMundial[nomeLiga]) painelMundial[nomeLiga] = [];
            painelMundial[nomeLiga].push({
                timeCasa: j.teams.home.name,
                timeFora: j.teams.away.name,
                horario: j.fixture.date.split('T')[1].substring(0, 5)
            });
        });

        cacheGlobal = painelMundial;
        dataDoCache = hoje;

        res.json({ status: "Sucesso (Varredura Completa)", data: cacheGlobal });

    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
});

app.listen(3000, () => console.log("Servidor Mundial ativo!"));
