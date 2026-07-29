// Inicializa a animação de fundo (Vanta.NET) no elemento indicado.
// Se as libs não carregarem (ex: sem internet), a página continua
// funcional com a cor de fundo pastel definida em style.css.
function initVantaBackground(selector) {
  if (typeof VANTA === 'undefined') return null;

  try {
    return VANTA.NET({
      el: selector,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,
      color: 0x8da0e0,
      backgroundColor: 0xeef1fc,
      points: 9.0,
      maxDistance: 20.0,
      spacing: 17.0,
    });
  } catch (err) {
    return null;
  }
}
