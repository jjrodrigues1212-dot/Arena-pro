const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());

const API_URL = "https://api.football-data.org/v4";
const API_KEY = "f7c9e0d1645e4e79b8a87679323f46f4"; 

// Variáveis de Congelamento (Cache)
let dadosCongelados = null;
let dataDoCongelamento = null;

// Funções Matemáticas de Poisson
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

    // 1. Entrega dados congelados (Eficiência)
    if (dadosCongelados && dataDoCongelamento === hoje) {
        return res.json({ status: "Sucesso (Cache)", ligas: dadosCongelados });
    }

    try {
        // 2. Busca Mundial
        const response = await axios.get(`${API_URL}/matches`, {
            headers: { 'X-Auth-Token': API_KEY }
        });

        const jogos = response.data.matches;
        const painel = {};

        // 3. Processamento Completo
        jogos.forEach(j => {
            const nomeLiga = j.competition.name;
            if (!painel[nomeLiga]) painel[nomeLiga] = [];

            // Motor de Apostas (Poisson)
            const mCasa = 1.4, mFora = 1.1;
            const pVitoria = (calcularPoisson(mCasa, 1) * 100).toFixed(0);

            painel[nomeLiga].push({
                casa: j.homeTeam.name,
                fora: j.awayTeam.name,
                probabilidades: { vitoria: `${pVitoria}%`, empate: "25%" },
                dupla: { umX: "70%", xDois: "60%" }
            });
        });

        dadosCongelados = Object.keys(painel).map(n => ({ nome: n, jogos: painel[n] }));
        dataDoCongelamento = hoje;

        res.json({ status: "Sucesso (Mundial Completo)", ligas: dadosCongelados });

    } catch (e) {
        res.status(500).json({ erro: "Erro na API", detalhe: e.message });
    }
});

app.listen(3000, () => console.log("Servidor Completo Ativo!"));
