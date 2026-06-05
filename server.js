const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());

const API_KEY = "52520ddb7c1e2b8203f0fa86fe81ba40";
const API_URL = "https://v3.football.api-sports.io";

// Variáveis de Congelamento
let dadosCongelados = null;
let dataDoCongelamento = null;

// Funções Matemáticas
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

    // 1. Tenta entregar o que está congelado (Eficiência)
    if (dadosCongelados && dataDoCongelamento === hoje) {
        console.log("Entregando dados da memória (Congelados)");
        return res.json({ status: "Sucesso (Cache)", liga: "Brasileirão Série B", jogos: dadosCongelados });
    }

    // 2. Se não tem ou mudou o dia, busca na API
    try {
        console.log("Buscando Série B na API...");
        const url = `${API_URL}/fixtures?league=71&season=2026&date=${hoje}`;
        const response = await axios.get(url, { headers: { 'x-apisports-key': API_KEY } });
        
        const confrontos = response.data.response;
        if (!confrontos || confrontos.length === 0) {
            return res.json({ status: "Sucesso", mensagem: "Nenhum jogo da Série B hoje.", ligas: [] });
        }

        // 3. Aplica a Matemática de Poisson
        const jogosProcessados = confrontos.map(jogo => {
            const mCasa = 1.6; // Média estimada
            const mFora = 1.1;
            let probV = 0;
            for(let i=1; i<=3; i++) probV += calcularPoisson(mCasa, i);

            return {
                casa: jogo.teams.home.name,
                fora: jogo.teams.away.name,
                probVitoria: (probV * 100).toFixed(0) + "%"
            };
        });

        // 4. Congela o resultado para o resto do dia
        dadosCongelados = jogosProcessados;
        dataDoCongelamento = hoje;

        res.json({ status: "Sucesso (Nova Consulta)", liga: "Brasileirão Série B", jogos: jogosProcessados });

    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
});

app.listen(3000, () => console.log("Servidor Série B Congelado ativo!"));
