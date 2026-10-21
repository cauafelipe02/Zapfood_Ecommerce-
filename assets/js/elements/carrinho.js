// 1. Estado inicial do carrinho (preparado para espelhar as tabelas do BD)
let carrinho = JSON.parse(localStorage.getItem('zapfood_carrinho')) || {
    id_cliente: 1,      // ID estático temporário (futuramente virá do login)
    id_restaurante: 1,  // ID do restaurante atual
    itens: []           // Mapeia os registros da tabela Pedido_item
};

// 2. Função principal exposta para ser chamada no index.js
export function inicializarCarrinho() {
    escutarBotoesAdicionar();
    renderizarBarraCarrinho(); // Renderiza caso já existam itens salvos
}

// 3. Captura dos cliques nos botões de adicionar
function escutarBotoesAdicionar() {
    const botoes = document.querySelectorAll('.btn-adicionar');

    botoes.forEach(botao => {
        botao.addEventListener('click', (event) => {
            event.preventDefault();

            // Resgata os dados dos atributos data-* do HTML
            const id = botao.getAttribute('data-id');
            const nome = botao.getAttribute('data-nome');
            const preco = parseFloat(botao.getAttribute('data-preco'));
            const idRestaurante = botao.getAttribute('data-restaurante');

            adicionarItem(id, nome, preco, idRestaurante);
        });
    });
}

// 4. Lógica de manipulação do array e persistência
function adicionarItem(id, nome, preco, idRestaurante) {
    carrinho.id_restaurante = idRestaurante;

    const itemExistente = carrinho.itens.find(item => item.id_item === id);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.itens.push({
            id_item: id,
            nome: nome,
            preco_unitario: preco,
            quantidade: 1
        });
    }

    // Salva no localStorage e atualiza a interface na tela
    localStorage.setItem('zapfood_carrinho', JSON.stringify(carrinho));
    renderizarBarraCarrinho();
}

// 5. Injeta e atualiza a barra flutuante / painel expandido no HTML
function renderizarBarraCarrinho() {
    let container = document.getElementById('container-carrinho-flutuante');

    // Verifica se o painel de detalhes já existia e se estava aberto/visível
    const painelAnterior = document.getElementById('carrinho-detalhes');
    const estavaAberto = painelAnterior ? !painelAnterior.classList.contains('esconde') : false;

    // Se o container ainda não existir no DOM, cria ele dinamicamente no body
    if (!container) {
        container = document.createElement('div');
        container.id = 'container-carrinho-flutuante';
        document.body.appendChild(container);
    }

    // Se o carrinho estiver vazio, limpa o container
    if (carrinho.itens.length === 0) {
        container.innerHTML = '';
        return;
    }

    // Cálculos de totais
    const totalItens = carrinho.itens.reduce((acc, item) => acc + item.quantidade, 0);
    const valorTotal = carrinho.itens.reduce((acc, item) => acc + (item.quantidade * item.preco_unitario), 0);

    // Mantém a classe 'esconde' apenas se NÃO estava aberto anteriormente
    const classeEsconde = estavaAberto ? '' : 'esconde';
    const textoBotao = estavaAberto ? 'Ocultar' : 'Ver mais';

    // Injeção do HTML via innerHTML
    container.innerHTML = `
        <div class="carrinho-bar">
            <div class="carrinho-info">
                <span class="carrinho-icone">🛍️</span>
                <span><strong>${totalItens}</strong> ${totalItens === 1 ? 'item' : 'itens'}</span>
                <span class="carrinho-total">Total: R$ ${valorTotal.toFixed(2).replace('.', ',')}</span>
            </div>
            <button id="btn-toggle-detalhes" class="btn-carrinho-acao">${textoBotao}</button>
        </div>

        <div id="carrinho-detalhes" class="carrinho-detalhes ${classeEsconde}">
            <h3>Detalhes do Pedido</h3>
            <p><small>Cliente ID: ${carrinho.id_cliente} | Restaurante ID: ${carrinho.id_restaurante}</small></p>
            <hr>
            <ul class="lista-itens-carrinho">
                ${carrinho.itens.map(item => `
                    <li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span>${item.nome}</span>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <button class="btn-qtd btn-remover-item" data-id="${item.id_item}">-</button>
                            <span><strong>${item.quantidade}</strong></span>
                            <button class="btn-qtd btn-adicionar-item" data-id="${item.id_item}">+</button>
                            <span>R$ ${(item.quantidade * item.preco_unitario).toFixed(2).replace('.', ',')}</span>
                        </div>
                    </li>
                `).join('')}
            </ul>
            <div class="carrinho-rodape">
                <strong>Total do Pedido: R$ ${valorTotal.toFixed(2).replace('.', ',')}</strong>
                <button id="btn-finalizar-pedido" class="btn-finalizar">Finalizar Compra</button>
            </div>
        </div>
    `;

    // Evento do botão "Ver mais" / "Ocultar"
    document.getElementById('btn-toggle-detalhes').addEventListener('click', () => {
        const painel = document.getElementById('carrinho-detalhes');
        painel.classList.toggle('esconde');
        
        const btnText = document.getElementById('btn-toggle-detalhes');
        btnText.innerText = painel.classList.contains('esconde') ? 'Ver mais' : 'Ocultar';
    });

    // Ouvintes para os botões "+" de dentro do carrinho
    document.querySelectorAll('.btn-adicionar-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const item = carrinho.itens.find(i => i.id_item === id);
            if (item) adicionarItem(item.id_item, item.nome, item.preco_unitario, carrinho.id_restaurante);
        });
    });

    // Ouvintes para os botões "-" de dentro do carrinho
    document.querySelectorAll('.btn-remover-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            removerItem(id);
        });
    });
}

// 6: Função para decrementar ou remover o item do carrinho
function removerItem(id) {
    const itemExistente = carrinho.itens.find(item => item.id_item === id);

    if (itemExistente) {
        if (itemExistente.quantidade > 1) {
            itemExistente.quantidade -= 1;
        } else {
            // Se a quantidade for 1 e clicar em "-", remove o item do array
            carrinho.itens = carrinho.itens.filter(item => item.id_item !== id);
        }
    }

    // Atualiza o localStorage (se o array esvaziar, limpa a chave)
    if (carrinho.itens.length === 0) {
        localStorage.removeItem('zapfood_carrinho');
    } else {
        localStorage.setItem('zapfood_carrinho', JSON.stringify(carrinho));
    }

    renderizarBarraCarrinho();
}