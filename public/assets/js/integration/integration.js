const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // 0. CONTROLE DE SESSÃO TEMPORÁRIA (Tabela Usuario)
  // =========================================================================
  let idUsuarioSessao = sessionStorage.getItem('zapfood_id_usuario');

  // Se ainda não tem sessão ativa nesta aba, cria uma no MySQL
  if (!idUsuarioSessao) {
    const novoSessionId = 'sessao_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

    fetch(`${API_URL}/sessao/iniciar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: novoSessionId })
    })
      .then(res => res.json())
      .then(dados => {
        if (dados.sucesso) {
          sessionStorage.setItem('zapfood_id_usuario', dados.id_usuario);
          sessionStorage.setItem('zapfood_session_id', novoSessionId);
        }
      })
      .catch(err => console.error('Erro ao registrar sessão:', err));
  }

  // Quando o usuário fechar a aba ou sair do site, deleta o registro no banco
  window.addEventListener('beforeunload', () => {
    const idParaDeletar = sessionStorage.getItem('zapfood_id_usuario');
    if (idParaDeletar) {
      // sendBeacon garante que a requisição chegue ao Node mesmo com a aba fechando
      navigator.sendBeacon(
        `${API_URL}/sessao/encerrar`,
        JSON.stringify({ id_usuario: idParaDeletar })
      );
    }
  });

  // =========================================================================
  // 1. INTEGRAÇÃO: CADASTRO DE CLIENTE (cadastro-C.html)
  // =========================================================================
  const btnEnviarCliente = document.getElementById('btn-enviar-cliente');
  if (btnEnviarCliente) {
    btnEnviarCliente.addEventListener('click', async (e) => {
      e.preventDefault();

      let genero = 'Outro';
      if (document.getElementById('masculino-cliente')?.checked) genero = 'Masculino';
      if (document.getElementById('feminino-cliente')?.checked) genero = 'Feminino';

      const dadosCliente = {
        nome: document.getElementById('nome-cliente').value,
        email: document.getElementById('email-cliente').value,
        senha: document.getElementById('senha-cliente').value,
        telefone: document.getElementById('telefone-cliente').value,
        sexo: sexo,
        dataNascimento: document.getElementById('dataN-cliente').value,
        estado: document.getElementById('estado-cliente').value,
        endereco: document.getElementById('endereco-cliente').value
      };

      if (!dadosCliente.nome || !dadosCliente.email || !dadosCliente.senha) {
        alert('Preencha Nome, E-mail e Senha!');
        return;
      }

      try {
        const resposta = await fetch(`${API_URL}/cadastro-cliente`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dadosCliente)
        });
        const resultado = await resposta.json();
        alert(resultado.mensagem);
        if (resposta.ok && resultado.sucesso) window.location.href = './login.html';
      } catch (erro) {
        console.error(erro);
        alert('Erro ao conectar com o servidor Node.js (porta 3000).');
      }
    });
  }

  // =========================================================================
  // 2. INTEGRAÇÃO: CADASTRO DE RESTAURANTE (cadastro-R.html)
  // =========================================================================
  const btnEnviarRestaurante = document.getElementById('btn-enviar-R');
  if (btnEnviarRestaurante) {
    btnEnviarRestaurante.addEventListener('click', async (e) => {
      e.preventDefault();

      const dadosRestaurante = {
        nome: document.getElementById('nome-R').value,
        email: document.getElementById('email-R').value,
        senha: document.getElementById('senha-R').value,
        telefone: document.getElementById('telefone-R').value,
        endereco: document.getElementById('endereco-R').value,
        cnpj: document.getElementById('cnpj-R').value
      };

      if (!dadosRestaurante.nome || !dadosRestaurante.email || !dadosRestaurante.senha || !dadosRestaurante.cnpj) {
        alert('Preencha Nome, E-mail, Senha e CNPJ!');
        return;
      }

      try {
        const resposta = await fetch(`${API_URL}/cadastro-restaurante`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dadosRestaurante)
        });
        const resultado = await resposta.json();
        alert(resultado.mensagem);
        if (resposta.ok && resultado.sucesso) window.location.href = './login.html';
      } catch (erro) {
        console.error(erro);
        alert('Erro ao conectar com o servidor Node.js (porta 3000).');
      }
    });
  }

  // =========================================================================
  // 3. INTEGRAÇÃO: LOGIN COM VALIDAÇÃO DE PERFIL (login.html)
  // =========================================================================
  const btnEntrar = document.getElementById('btn-entrar');
  if (btnEntrar) {
    btnEntrar.addEventListener('click', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email-login').value;
      const senha = document.getElementById('senha-login').value;
      const radioCliente = document.getElementById('entrar-cliente');
      const radioRestaurante = document.getElementById('entrar-restaurante');

      if (!radioCliente?.checked && !radioRestaurante?.checked) {
        alert('Selecione se deseja entrar como Cliente ou Restaurante.');
        return;
      }

      const tipoSelecionado = radioCliente.checked ? 'cliente' : 'restaurante';

      try {
        const resposta = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha, tipoSelecionado })
        });
        const resultado = await resposta.json();

        if (resposta.ok && resultado.sucesso) {
          localStorage.setItem('usuario_logado', JSON.stringify(resultado.usuario));
          window.location.href = resultado.redirecionar;
        } else {
          alert(resultado.mensagem); // Mostra o aviso exato caso o perfil esteja trocado
        }
      } catch (erro) {
        console.error(erro);
        alert('Erro ao conectar com o servidor Node.js (porta 3000).');
      }
    });
  }
});