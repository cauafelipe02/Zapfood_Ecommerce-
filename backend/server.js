const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.text());
app.use(cors());

// Entrega os arquivos HTML e a pasta assets que estão na raiz (um nível acima de /backend)
app.use(express.static(path.join(__dirname, '..')));

// Configuração de conexão com o MySQL Workbench
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
  const { nome, email, senha, telefone, sexo, dataNascimento, estado, endereco } = req.body;

  const sql = `
    INSERT INTO Cliente (nome, email, senha, telefone, sexo, data_nascimento, estado, endereco)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [nome, email, senha, telefone, sexo, dataNascimento, estado, endereco], (err) => {
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
  const { nome, email, senha, cnpj, telefone, endereco } = req.body;
  const dataIngresso = new Date().toISOString().split('T')[0]; // Gera YYYY-MM-DD automaticamente

  const sql = `
    INSERT INTO Restaurante (nome, data_ingresso, email, senha, cnpj, telefone, endereco, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
  `;

  db.query(sql, [nome, dataIngresso, email, senha, cnpj, telefone, endereco], (err) => {
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

// =========================================================================
// ROTA 4: INICIAR SESSÃO TEMPORÁRIA (Quando o usuário entra no site)
// =========================================================================
app.post('/api/sessao/iniciar', (req, res) => {
  const { session_id } = req.body;

  const sql = 'INSERT INTO Usuario (session_id, logado) VALUES (?, FALSE)';
  db.query(sql, [session_id], (err, result) => {
    if (err) {
      console.error('Erro ao iniciar sessão:', err);
      return res.status(500).json({ sucesso: false });
    }
    res.json({ sucesso: true, id_usuario: result.insertId });
  });
});

// =========================================================================
// ROTA 5: ATUALIZAR PARA LOGADO = TRUE (Quando o login der certo)
// =========================================================================
app.put('/api/sessao/logar', (req, res) => {
  const { id_usuario } = req.body;

  const sql = 'UPDATE Usuario SET logado = TRUE WHERE id_usuario = ?';
  db.query(sql, [id_usuario], (err) => {
    if (err) return res.status(500).json({ sucesso: false });
    res.json({ sucesso: true });
  });
});

// =========================================================================
// ROTA 6: ENCERRAR E DELETAR SESSÃO (Quando o usuário sai/fecha a aba)
// =========================================================================
app.post('/api/sessao/encerrar', (req, res) => {
  // O sendBeacon envia os dados como texto puro ou JSON; garantimos a leitura aqui
  const dados = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { id_usuario } = dados;

  if (!id_usuario) return res.status(400).end();

  const sql = 'DELETE FROM Usuario WHERE id_usuario = ?';
  db.query(sql, [id_usuario], (err) => {
    if (err) console.error('Erro ao deletar sessão:', err);
    res.status(200).end();
  });
});

app.listen(3000, () => {
  console.log('🚀 Servidor ZapFood rodando em http://localhost:3000');
});