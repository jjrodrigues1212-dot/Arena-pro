const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());

let cacheDeJogos = null;

app.get('/api/analytics', (req, res) => {
    // Se não tivermos dados, criamos um jogo de teste
    if (!cacheDeJogos) {
        console.log("Criando jogo de teste para ver se funciona...");
        cacheDeJogos = [{
            nome: "TESTE DE FUNCIONAMENTO",
            jogos: [{ casa: "Time A", fora: "Time B", horario: "12:00" }]
        }];
    }
    res.json({ status: "Sucesso", ligas: cacheDeJogos });
});

app.listen(3000, () => console.log("Servidor rodando!"));
