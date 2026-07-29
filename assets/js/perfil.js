initVantaBackground('.admin-bg');

const usuarioLogado = exigirRole(['aluno', 'editor', 'admin']);

// Avatar ainda não salvo (refletido no preview enquanto a pessoa escolhe).
let avatarPendente = { tipo: null, valor: null };

const nomeInput = document.getElementById('perfil-nome');
const emailInput = document.getElementById('perfil-email');
const roleBadge = document.getElementById('perfil-role-badge');
const avatarPreview = document.getElementById('avatar-preview');
const galeria = document.getElementById('avatar-galeria');
const uploadInput = document.getElementById('avatar-upload-input');
const form = document.getElementById('perfil-form');
const submitBtn = document.getElementById('perfil-submit-btn');
const submitBtnText = document.getElementById('perfil-submit-btn-text');
const spinner = submitBtn.querySelector('.spinner');

if (usuarioLogado) {
  renderAppShell('perfil');
  inicializarFormulario();
}

function inicializarFormulario() {
  nomeInput.value = usuarioLogado.nome;
  emailInput.value = usuarioLogado.email;
  roleBadge.textContent = ROLE_LABELS[usuarioLogado.role] || usuarioLogado.role;

  avatarPendente = {
    tipo: usuarioLogado.avatarTipo || null,
    valor: usuarioLogado.avatarValor || null,
  };

  montarGaleria();
  atualizarPreview();
}

function montarGaleria() {
  galeria.innerHTML = AVATAR_PRESETS.map(
    (preset) => `
      <button
        type="button"
        class="avatar-preset-btn"
        data-preset="${preset.id}"
        title="${preset.label}"
        style="background:${preset.bg};color:${preset.fg}"
      >
        <i class="fa-solid ${preset.icon}"></i>
      </button>
    `
  ).join('');

  galeria.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      avatarPendente = { tipo: 'preset', valor: btn.dataset.preset };
      atualizarPreview();
    });
  });
}

function atualizarPreview() {
  avatarPreview.innerHTML = avatarInnerHtml({
    nome: usuarioLogado.nome,
    avatarTipo: avatarPendente.tipo,
    avatarValor: avatarPendente.valor,
  });

  galeria.querySelectorAll('[data-preset]').forEach((btn) => {
    const selecionado = avatarPendente.tipo === 'preset' && avatarPendente.valor === btn.dataset.preset;
    btn.classList.toggle('avatar-preset-btn-selected', selecionado);
  });
}

// Lê o arquivo, recorta em quadrado e reduz para uma miniatura leve
// (evita inflar o db.json com imagens grandes em base64).
function redimensionarImagem(file, tamanho = 200) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = tamanho;
        canvas.height = tamanho;
        const ctx = canvas.getContext('2d');

        const lado = Math.min(img.width, img.height);
        const sx = (img.width - lado) / 2;
        const sy = (img.height - lado) / 2;
        ctx.drawImage(img, sx, sy, lado, lado, 0, 0, tamanho, tamanho);

        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(file);
  });
}

uploadInput.addEventListener('change', async () => {
  const file = uploadInput.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    Swal.fire('Arquivo inválido', 'Selecione um arquivo de imagem.', 'error');
    uploadInput.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    Swal.fire('Arquivo muito grande', 'Escolha uma imagem de até 5MB.', 'error');
    uploadInput.value = '';
    return;
  }

  try {
    const dataUrl = await redimensionarImagem(file);
    avatarPendente = { tipo: 'upload', valor: dataUrl };
    atualizarPreview();
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível processar essa imagem.', 'error');
  } finally {
    uploadInput.value = '';
  }
});

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle('opacity-70', isLoading);
  submitBtnText.textContent = isLoading ? 'Salvando...' : 'Salvar alterações';
  spinner.classList.toggle('hidden', !isLoading);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const nome = nomeInput.value.trim();
  const errorEl = document.querySelector('[data-error-for="perfil-nome"]');
  errorEl.textContent = '';
  nomeInput.classList.remove('invalid');

  if (nome.length < 3) {
    errorEl.textContent = 'O nome deve ter no mínimo 3 caracteres.';
    nomeInput.classList.add('invalid');
    return;
  }

  setLoading(true);
  try {
    const dados = {
      nome,
      avatarTipo: avatarPendente.tipo,
      avatarValor: avatarPendente.valor,
    };

    await apiPatch(`/usuarios/${usuarioLogado.id}`, dados);
    atualizarUsuarioLogado(dados);

    await Swal.fire('Sucesso!', 'Suas informações foram atualizadas.', 'success');
    window.location.reload();
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível salvar. Verifique se o json-server está em execução.', 'error');
  } finally {
    setLoading(false);
  }
});
