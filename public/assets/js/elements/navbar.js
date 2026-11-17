// =============================
//     Estilos da Navbar
// =============================

export function esconderHeader() {
    const header = document.querySelector(
        '.header-index, .header-tela-C'
    );

    if (!header) return;

    let scrollAnterior = window.scrollY;

    window.addEventListener('scroll', () => {
        const scrollAtual = window.scrollY;

        if (scrollAtual > scrollAnterior && scrollAtual > 50) {
            // Rolando para baixo
            header.style.transform = 'translateY(-100px)';
        } else {
            // Rolando para cima
            header.style.transform = 'translateY(0)';
        }

        scrollAnterior = scrollAtual;
    });
}

export function cadastroOpcoes() {
    const cadastrarBtn = document.getElementById('cadastrarBtn');
    const cadastroOpcoes = document.getElementById('cadastroOpcoes');
    let hideTimeout;

    if (!cadastrarBtn || !cadastroOpcoes) return;

    cadastrarBtn.addEventListener('click', function (event) {
        event.preventDefault();

        const isVisible = cadastroOpcoes.style.display === 'block';

        clearTimeout(hideTimeout);

        cadastroOpcoes.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            hideTimeout = setTimeout(() => {
                cadastroOpcoes.style.display = 'none';
            }, 5000);
        }
    });

    document.addEventListener('click', function (event) {
        const isClickInside =
            cadastrarBtn.contains(event.target) ||
            cadastroOpcoes.contains(event.target);

        if (!isClickInside) {
            cadastroOpcoes.style.display = 'none';
            clearTimeout(hideTimeout);
        }
    });

    window.addEventListener('scroll', function () {
        if (cadastroOpcoes.style.display === 'block') {
            cadastroOpcoes.style.display = 'none';
            clearTimeout(hideTimeout);
        }
    });
}