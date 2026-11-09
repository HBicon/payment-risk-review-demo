(function () {
  const state = {
    device: { file: null, dataUrl: null, fileName: '' },
    imei: { file: null, dataUrl: null, fileName: '' }
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const form = document.getElementById('evidenceForm');
  const submitButton = document.getElementById('submitButton');
  const submitLabel = document.getElementById('submitLabel');
  const consent = document.getElementById('consentCheckbox');
  const exampleDialog = document.getElementById('exampleDialog');

  const exampleContent = {
    device: {
      title: '本机图片示例',
      caption: '手机正面完整入镜，屏幕点亮',
      image: 'assets/device-evidence.svg',
      tips: [
        '画面中露出完整机身边框，不要只拍屏幕。',
        '屏幕保持点亮，设备正面朝上。',
        '避免强烈反光、手指遮挡和过度裁切。'
      ]
    },
    imei: {
      title: 'IMEI 图片示例',
      caption: 'IMEI 号段完整、清晰、无遮挡',
      image: 'assets/imei-evidence.svg',
      tips: [
        '在拨号界面输入 *#06#，或打开设置中的“关于手机”。',
        '将 IMEI 1 或 IMEI 2 完整拍入画面。',
        '审核员需要辨认全部数字，请不要打码或涂抹。'
      ]
    }
  };

  function showError(kind, message) {
    const zone = document.getElementById(`${kind}Zone`);
    const errorNode = document.getElementById(`${kind}Error`);
    if (!zone || !errorNode) return;
    zone.classList.add('has-error');
    errorNode.textContent = message;
    errorNode.hidden = false;
  }

  function clearError(kind) {
    const zone = document.getElementById(`${kind}Zone`);
    const errorNode = document.getElementById(`${kind}Error`);
    if (!zone || !errorNode) return;
    zone.classList.remove('has-error');
    errorNode.hidden = true;
    errorNode.textContent = '';
  }

  function refreshSubmitState() {
    const ready = Boolean(state.device.dataUrl && state.imei.dataUrl && consent.checked);
    submitButton.disabled = !ready;
    const note = document.querySelector('.dock-note strong');
    if (note) {
      note.textContent = ready ? '资料已就绪，可提交审核' : '请上传两张照片并确认授权';
    }
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('请选择 JPG、PNG 或 WebP 图片。'));
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        reject(new Error('图片超过 10MB，请压缩后重新上传。'));
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        const maxEdge = 1600;
        const ratio = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * ratio));
        const height = Math.max(1, Math.round(image.naturalHeight * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('图片读取失败，请换一张图片重试。'));
      };
      image.src = objectUrl;
    });
  }

  function renderFile(kind, file, dataUrl) {
    const zone = document.getElementById(`${kind}Zone`);
    const preview = document.getElementById(`${kind}Preview`);
    const previewImage = document.getElementById(`${kind}PreviewImage`);
    const fileName = document.getElementById(`${kind}FileName`);
    const removeButton = document.getElementById(`${kind}Remove`);
    if (!zone || !preview || !previewImage) return;

    state[kind].dataUrl = dataUrl;
    state[kind].file = file;
    state[kind].fileName = file.name;
    previewImage.src = dataUrl;
    fileName.textContent = file.name;
    preview.hidden = false;
    zone.classList.add('has-image');
    zone.querySelector('.drop-empty').hidden = true;
    removeButton.hidden = false;
    clearError(kind);
    refreshSubmitState();
  }

  async function handleFile(kind, file) {
    if (!file) return;
    clearError(kind);
    const zone = document.getElementById(`${kind}Zone`);
    zone.classList.add('is-loading');
    try {
      const dataUrl = await compressImage(file);
      renderFile(kind, file, dataUrl);
    } catch (error) {
      showError(kind, error.message || '图片处理失败，请重试。');
    } finally {
      zone.classList.remove('is-loading');
      const input = document.getElementById(`${kind}Input`);
      if (input) input.value = '';
    }
  }

  function resetUpload(kind) {
    state[kind] = { file: null, dataUrl: null, fileName: '' };
    const zone = document.getElementById(`${kind}Zone`);
    const preview = document.getElementById(`${kind}Preview`);
    const removeButton = document.getElementById(`${kind}Remove`);
    const input = document.getElementById(`${kind}Input`);
    preview.hidden = true;
    zone.classList.remove('has-image');
    zone.querySelector('.drop-empty').hidden = false;
    removeButton.hidden = true;
    if (input) input.value = '';
    clearError(kind);
    refreshSubmitState();
  }

  ['device', 'imei'].forEach((kind) => {
    const zone = document.getElementById(`${kind}Zone`);
    const input = document.getElementById(`${kind}Input`);
    const removeButton = document.getElementById(`${kind}Remove`);

    zone.addEventListener('click', (event) => {
      if (event.target.closest('.remove-image')) return;
      input.click();
    });

    zone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        input.click();
      }
    });

    input.addEventListener('change', () => {
      if (input.files && input.files[0]) handleFile(kind, input.files[0]);
    });

    removeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      resetUpload(kind);
    });

    ['dragenter', 'dragover'].forEach((name) => {
      zone.addEventListener(name, (event) => {
        event.preventDefault();
        zone.classList.add('is-dragging');
      });
    });

    ['dragleave', 'drop'].forEach((name) => {
      zone.addEventListener(name, (event) => {
        event.preventDefault();
        zone.classList.remove('is-dragging');
      });
    });

    zone.addEventListener('drop', (event) => {
      if (event.dataTransfer.files && event.dataTransfer.files[0]) {
        handleFile(kind, event.dataTransfer.files[0]);
      }
    });
  });

  consent.addEventListener('change', refreshSubmitState);

  document.querySelectorAll('[data-example]').forEach((button) => {
    button.addEventListener('click', () => {
      const content = exampleContent[button.dataset.example];
      if (!content) return;
      document.getElementById('exampleDialogTitle').textContent = content.title;
      document.getElementById('exampleDialogCaption').textContent = content.caption;
      document.getElementById('exampleDialogImage').src = content.image;
      document.getElementById('exampleDialogImage').alt = `${content.title}：${content.caption}`;
      document.getElementById('exampleDialogTips').innerHTML = content.tips
        .map((tip) => `<li>${RiskStore.escapeHTML(tip)}</li>`)
        .join('');
      exampleDialog.showModal();
    });
  });

  ['closeExampleDialog', 'closeExampleButton'].forEach((id) => {
    document.getElementById(id).addEventListener('click', () => exampleDialog.close());
  });
  exampleDialog.addEventListener('click', (event) => {
    if (event.target === exampleDialog) exampleDialog.close();
  });

  document.getElementById('privacyLink').addEventListener('click', (event) => {
    event.preventDefault();
  });

  submitButton.addEventListener('click', async () => {
    if (!state.device.dataUrl) {
      showError('device', '请先上传本机图片。');
      document.getElementById('deviceZone').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!state.imei.dataUrl) {
      showError('imei', '请先上传 IMEI 图片。');
      document.getElementById('imeiZone').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!consent.checked) {
      consent.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.classList.add('is-loading');
    submitButton.innerHTML = '<span class="spinner"></span><span id="submitLabel">提交中…</span>';
    form.style.pointerEvents = 'none';
    form.style.opacity = '0.84';

    try {
      const created = RiskStore.createFromUpload({
        deviceImage: state.device.dataUrl,
        imeiImage: state.imei.dataUrl,
        deviceFileName: state.device.fileName,
        imeiFileName: state.imei.fileName
      });
      window.setTimeout(() => {
        window.location.href = `waiting.html?case=${encodeURIComponent(created.id)}`;
      }, 520);
    } catch (error) {
      console.error(error);
      submitButton.disabled = false;
      submitButton.classList.remove('is-loading');
      submitButton.innerHTML = `<span data-icon="shield-check"></span><span id="submitLabel">提交人工审核</span>`;
      Icons.render(submitButton);
      form.style.pointerEvents = '';
      form.style.opacity = '';
      window.alert('资料提交失败，可能是浏览器存储空间不足。请压缩图片后重试。');
    }
  });

  const latest = RiskStore.latestForOrder(RiskStore.PAYMENT_ORDER.orderNo);
  if (latest) {
    document.getElementById('caseNumber').textContent = `SECURE CASE · ${latest.id.slice(-4)}`;
  }

  refreshSubmitState();
})();
