const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const API_URL = "https://v3.football.api-sports.io";
const API_KEY = "52520ddb7c1e2b8203f0fa86fbf8f065";

// Rota inicial para testar se o servidor está abrindo
app.get('/', (req, res) => {
    res.send("Servidor Arena-pro ativo e rodando!");
});

// Rota principal do motor estatístico
app.get('/api/analytics', async (req, res) => {
    try {
        // Pega a data atual no fuso do Brasil
        const dataBrasil = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
        const ano = dataBrasil.getFullYear();
        const mes = String(dataBrasil.getMonth() + 1).padStart(2, '0');
        const dia = String(dataBrasil.getDate()).padStart(2, '0');
        const hoje = `${ano}-${mes}-${dia}`;
        
        const respostaJogos = await axios.get(`${API_URL}/fixtures?date=${hoje}`, {
            headers: { 'x-apisports-key': API_KEY }
        });

        const confrontos = respostaJogos.data.response;
        if (!confrontos || confrontos.length === 0) {
            return res.json({ status: "Sucesso", mensagem: "Nenhum jogo encontrado para hoje.", ligas: [] });
        }

        const painelLigas = {};
        // Processa as primeiras 15 partidas para testar
        const jogosParaProcessar = confrontos.slice(0, 15);

        for (const jogo of jogosParaProcessar) {
            const nomeLiga = jogo.league.name.toUpperCase();
            const timeCasa = jogo.teams.home.name;
            const timeFora = jogo.teams.away.name;
            const horario = jogo.fixture.date.split('T')[1].substring(0, 5);

            // Simulação simples de Poisson para o teste inicial
            const jogoFormatado = {
                casa: timeCasa,
                fora: timeFora,
                horario: horario,
                probs: { casa: 45, empate: 30, fora: 25 },
                gols: { mais05: 90, mais15: 75, mais25: 50, mais35: 28 },
                btts: 52
            };

            if (!painelLigas[nomeLiga]) painelLigas[nomeLiga] = [];
            painelLigas[nomeLiga].push(jogoFormatado);
        }

        const listaLigas = Object.keys(painelLigas).map(nome => ({
            nome: nome,
            jogos: painelLigas[nome]
        }));

        res.json({ status: "Sucesso", ligas: listaLigas });

    } catch (erro) {
        res.status(500).json({ erro: "Falha no motor estatístico", detalhes: erro.message });
    }
});

app.listen(PORT, () => console.log(`Servidor ativo na porta ${PORT}`));
