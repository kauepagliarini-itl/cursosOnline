// footer.js — rodapé com os créditos, injetado no fim do <body> de toda
// página que carregar este script (login, cadastro e as telas internas).
(function renderFooter() {
  const ano = new Date().getFullYear();

  const footerHtml = `
    <footer class="site-footer">
      <div class="site-footer-inner">
        <span>&copy; ${ano} EduPlat. Todos os direitos reservados.</span>
        <span>Desenvolvido por <strong>Bruna Coelho</strong> e <strong>Kaue Pagliarini</strong>.</span>
      </div>
    </footer>
  `;

  document.body.insertAdjacentHTML('beforeend', footerHtml);
})();
