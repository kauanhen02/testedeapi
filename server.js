const express = require("express");
const axios = require("axios");
const mysql = require("mysql2/promise"); // Usaremos mysql2/promise para operações assíncronas

const app = express();
const PORT = process.env.PORT || 3077;
const url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados?formato=json";

// Configuração do MySQL
const connection = mysql.createPool({
  host: "seu_host",
  user: "seu_usuario",
  password: "sua_senha",
  database: "seu_banco_de_dados"
});

async function obterCotacaoDolarPTAXVenda() {
  try {
    const response = await axios.get(url);
    const dados = response.data;
    const dataAtual = new Date().toLocaleDateString();

    let valorEncontrado = null;

    for (let i = 0; i < dados.length; i++) {
      if (dataAtual === dados[i].data) {
        valorEncontrado = dados[i].valor;
        break;
      } 
    }

    for (let o = dados.length - 1; o >= 0; o--) {
      if (dataAtual !== dados[o].data) {
        valorEncontrado = dados[o].valor;
        break;
      } 
    }
    
    if (valorEncontrado !== null) {
      // Insere os dados no MySQL
      await connection.query("INSERT INTO cotacao_dolar (data, valor) VALUES (?, ?)", [dataAtual, valorEncontrado]);
      console.log("Dados inseridos com sucesso no MySQL.");
    } else {
      console.log(JSON.stringify({ error: "Cotação não encontrada para a data atual." }));
    }
  } catch (error) {
    console.error("Erro ao obter a cotação:", error);
  }
}

// Definir o intervalo para obter e inserir dados periodicamente
setInterval(obterCotacaoDolarPTAXVenda, 5000);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
