const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());

// Nova Fonte: Football-Data.org
const API_URL = "https://api.football-data.org/v4";
const API_KEY = "f7c9e0d1645e4e79b8a87679323f46f4"; // Sua nova chave

let dadosCongelados = null;
let dataDoCongelamento = null;

// --- MOTOR MATEMÁTICO ---
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

    // Mantemos o Congelamento para economizar e garantir velocidade
    if (dadosCongelados && dataDoCongelamento === hoje) {
        return res.json({ status: "Sucesso (Cache)", ligas: dadosCongelados });
    }

    try {
        console.log("Buscando dados no servidor Mundial...");
        const response = await axios.get(`${API_URL}/matches`, {
            headers: { 'X-Auth-Token': API_KEY }
        });

        const jogos = response.data.matches;
        
        // --- PROCESSAMENTO E ESTATÍSTICAS ---
        const painel = {};
        
        jogos.forEach(j => {
            const nomeLiga = j.competition.name;
            if (!painel[nomeLiga]) painel[nomeLiga] = [];

            // Simulação de Poisson para o Painel
            const mCasa = 1.4, mFora = 1.1;
            const probVitoria = (calcularPoisson(mCasa, 1) * 100).toFixed(0);

            painel[nomeLiga].push({
                casa: j.homeTeam.name,
                fora: j.awayTeam.name,
                horario: j.utcDate.split('T')[1].substring(0, 5),
                probs: { vitoria: `${probVitoria}%`, empate: "25%", derrota: "15%" },
                dupla: { umX: "70%", xDois: "60%" }
            });
        });

        dadosCongelados = Object.keys(painel).map(n => ({ nome: n, jogos: painel[n] }));
        dataDoCongelamento = hoje;

        res.json({ status: "Sucesso (Mundial)", ligas: dadosCongelados });

    } catch (e) {
        res.status(500).json({ erro: "Erro na API Mundial", detalhe: e.message });
    }
});

app.listen(3000, () => console.log("Servidor Mundial POISSON ativo!"));
