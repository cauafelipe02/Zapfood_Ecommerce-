const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Configuração de conexão com o MySQL Workbench (Ajustar senha e nome do banco se necessário)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // <-- COLOQUE AQUI A SENHA DO SEU MYSQL WORKBENCH
  database: 'zapfood'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Erro ao conectar no MySQL:', err);
  } else {
    console.log('✅ Conectado ao MySQL Workbench com sucesso!');
  }
});

// =========================================================================
// ROTA 1: CADASTRO DE CLIENTE (cadastro-C.html)
// =========================================================================
app.post('/api/cadastro-cliente', (req, res) => {
  const { nome, email, senha, telefone, genero, dataNascimento, estado, endereco } = req.body;

  const sql = `
    INSERT INTO Cliente (nome, email, senha, telefone, genero, data_nascimento, estado, endereco)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [nome, email, senha, telefone, genero, dataNascimento, estado, endereco], (err) => {
    if (err) {
      console.error('Erro ao cadastrar cliente:', err);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro ao cadastrar cliente no banco.' });
    }
    res.json({ sucesso: true, mensagem: 'Cliente cadastrado com sucesso!' });
  });
});

// =========================================================================
// ROTA 2: CADASTRO DE RESTAURANTE (cadastro-R.html)
// =========================================================================
app.post('/api/cadastro-restaurante', (req, res) => {
  const { nome, email, senha, telefone, estado, cnpj } = req.body;

  const sql = `
    INSERT INTO Restaurante (nome, email, senha, telefone, estado, cnpj)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [nome, email, senha, telefone, estado, cnpj], (err) => {
    if (err) {
      console.error('Erro ao cadastrar restaurante:', err);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro ao cadastrar restaurante no banco.' });
    }
    res.json({ sucesso: true, mensagem: 'Restaurante cadastrado com sucesso!' });
  });
});

// =========================================================================
// ROTA 3: LOGIN COM VALIDAÇÃO CRUZADA DE PERFIL (login.html)
// =========================================================================
app.post('/api/login', (req, res) => {
  const { email, senha, tipoSelecionado } = req.body; // 'cliente' ou 'restaurante'

  // 1. Verifica primeiro na tabela Cliente
  db.query('SELECT * FROM Cliente WHERE email = ?', [email], (err, resultsCliente) => {
    if (err) return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });

    if (resultsCliente.length > 0) {
      const cliente = resultsCliente[0];

      if (cliente.senha !== senha) {
        return res.status(401).json({ sucesso: false, mensagem: 'Senha incorreta!' });
      }

      if (tipoSelecionado !== 'cliente') {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Atenção: Esta conta pertence a um Cliente, mas você selecionou Restaurante!'
        });
      }

      return res.json({ sucesso: true, redirecionar: './index.html', usuario: cliente });
    }

    // 2. Se não está em Cliente, verifica na tabela Restaurante
    db.query('SELECT * FROM Restaurante WHERE email = ?', [email], (err, resultsRestaurante) => {
      if (err) return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });

      if (resultsRestaurante.length > 0) {
        const restaurante = resultsRestaurante[0];

        if (restaurante.senha !== senha) {
          return res.status(401).json({ sucesso: false, mensagem: 'Senha incorreta!' });
        }

        if (tipoSelecionado !== 'restaurante') {
          return res.status(400).json({
            sucesso: false,
            mensagem: 'Atenção: Esta conta pertence a um Restaurante, mas você selecionou Cliente!'
          });
        }

        return res.json({ sucesso: true, redirecionar: './index.html', usuario: restaurante });
      }

      // 3. Não encontrado em nenhuma tabela
      return res.status(404).json({ sucesso: false, mensagem: 'E-mail não cadastrado no sistema!' });
    });
  });
});

app.listen(3000, () => {
  console.log('🚀 Servidor ZapFood rodando em http://localhost:3000');
});
