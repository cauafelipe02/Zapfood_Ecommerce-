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
  password: 'Cau2202@', // <-- COLOQUE AQUI A SENHA DO SEU MYSQL WORKBENCH
  database: 'zapfood_db'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Erro ao conectar no MySQL:', err);
  } else {
    console.log('✅ Conectado ao MySQL Workbench com sucesso!');
      // Limpa sessões anônimas antigas ou órfãs ao iniciar o servidor
    db.query('DELETE FROM Usuario WHERE session_id IS NOT NULL AND logado = 0', (err) => {
      if (!err) console.log('🧹 Limpeza de sessões temporárias antigas realizada com sucesso!');
    });
  }
});

// =========================================================================
// ROTAS DE SESSÃO (Iniciar, Atualizar e Encerrar)
// =========================================================================

// 1. Iniciar sessão temporária (Quando o usuário entra no site)
app.post('/api/sessao/iniciar', (req, res) => {
  const { session_id } = req.body;

  const sql = 'INSERT INTO Usuario (session_id, logado) VALUES (?, FALSE)';
  db.query(sql, [session_id], (err, result) => {
    if (err) {
      console.error('Erro ao iniciar sessão:', err);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro ao iniciar sessão.' });
    }
    res.json({ sucesso: true, id_usuario: result.insertId });
  });
});

// 2. Atualizar para logado = TRUE (Quando o login der certo)
app.put('/api/sessao/logar', (req, res) => {
  const { id_usuario } = req.body;

  const sql = 'UPDATE Usuario SET logado = TRUE WHERE id_usuario = ?';
  db.query(sql, [id_usuario], (err) => {
    if (err) return res.status(500).json({ sucesso: false });
    res.json({ sucesso: true });
  });
});

// 3. Encerrar e deletar sessão (Quando o usuário sai/fecha a aba)
app.post('/api/sessao/encerrar', (req, res) => {
  const dados = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { id_usuario } = dados;

  if (!id_usuario) return res.status(400).end();

  const sql = 'DELETE FROM Usuario WHERE id_usuario = ?';
  db.query(sql, [id_usuario], (err) => {
    if (err) console.error('Erro ao deletar sessão:', err);
    res.status(200).end();
  });
});


// =========================================================================
// ROTAS DE CADASTRO E LOGIN
// =========================================================================

// 4. Cadastro de Cliente (Herança: Usuario -> Cliente)
app.post('/api/cadastro-cliente', (req, res) => {
  const { nome, email, senha, telefone, sexo, dataNascimento, estado, endereco, cpf } = req.body;

  db.query('INSERT INTO Usuario (logado) VALUES (FALSE)', (errUser, resultUser) => {
    if (errUser) {
      console.error('Erro ao criar usuário base:', errUser);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao gerar registro de usuário.' });
    }

    const idGerado = resultUser.insertId;

    const sqlCliente = `
      INSERT INTO Cliente (id_cliente, nome, email, senha, telefone, sexo, data_nascimento, endereco, cpf)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sqlCliente, [idGerado, nome, email, senha, telefone, sexo, dataNascimento, endereco, cpf], (err) => {
      if (err) {
        console.error('Erro ao cadastrar cliente:', err);
        return res.status(500).json({ sucesso: false, mensagem: 'Erro ao cadastrar cliente no banco.' });
      }
      res.json({ sucesso: true, mensagem: 'Cliente cadastrado com sucesso!' });
    });
  });
});

// 5. Cadastro de Restaurante (Herança: Usuario -> Restaurante)
app.post('/api/cadastro-restaurante', (req, res) => {
  const { nome, email, senha, cnpj, telefone, endereco } = req.body;

  db.query('INSERT INTO Usuario (logado) VALUES (FALSE)', (errUser, resultUser) => {
    if (errUser) {
      console.error('Erro ao criar usuário base do restaurante:', errUser);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao gerar registro de usuário.' });
    }

    const idGerado = resultUser.insertId;

    const sqlRestaurante = `
      INSERT INTO Restaurante (id_restaurante, nome, email, senha, cnpj, telefone, endereco)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sqlRestaurante, [idGerado, nome, email, senha, cnpj, telefone, endereco], (err) => {
      if (err) {
        console.error('Erro ao cadastrar restaurante:', err);
        return res.status(500).json({ sucesso: false, mensagem: 'Erro ao cadastrar restaurante no banco.' });
      }
      res.json({ sucesso: true, mensagem: 'Restaurante cadastrado com sucesso!' });
    });
  });
});

// 6. Login com Validação Cruzada de Perfil
app.post('/api/login', (req, res) => {
  const { email, senha, tipoSelecionado } = req.body;

  // Verifica primeiro na tabela Cliente
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

      return res.json({ sucesso: true, redirecionar: './tela-C.html', usuario: cliente });
    }

    // Se não está em Cliente, verifica na tabela Restaurante
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

        return res.json({ sucesso: true, redirecionar: './tela-R.html', usuario: restaurante });
      }

      return res.status(404).json({ sucesso: false, mensagem: 'E-mail não cadastrado no sistema!' });
    });
  });
});

app.listen(3000, () => {
  console.log('🚀 Servidor ZapFood rodando em http://localhost:3000');
});