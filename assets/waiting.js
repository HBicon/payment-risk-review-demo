(function () {
  const params = new URLSearchParams(window.location.search);
  let currentCase = params.get('case') ? RiskStore.get(params.get('case')) : null;
  let elapsedTimer = null;
  let pollTimer = null;
  let lastStatus = '';

  const latestForOrder = RiskStore.latestForOrder(RiskStore.PAYMENT_ORDER.orderNo);
  if (!params.get('case') && latestForOrder) {
    currentCase = latestForOrder;
    window.history.replaceState(null, '', `waiting.html?case=${encodeURIComponent(currentCase.id)}`);
  }

  if (!currentCase) {
    currentCase = RiskStore.latestForOrder(RiskStore.PAYMENT_ORDER.orderNo);
  }

  if (!currentCase) {
    currentCase = RiskStore.createFromUpload({
      deviceImage: 'assets/device-evidence.svg',
      imeiImage: 'assets/imei-evidence.svg',
      deviceFileName: '本机图片示例.jpg',
      imeiFileName: 'IMEI 图片示例.jpg'
    });
    window.history.replaceState(null, '', `waiting.html?case=${encodeURIComponent(currentCase.id)}`);
  }

  const views = {
    pending: document.getElementById('pendingView'),
    approved: document.getElementById('approvedView'),
    rejected: document.getElementById('rejectedView')
  };
  const toast = document.getElementById('toast');
  let toastTimer = null;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function money(amount) {
    return RiskStore.formatMoney(amount);
  }

  function updateCaseFromStore() {
    const latest = RiskStore.get(currentCase.id);
    if (!latest) return false;
    if (latest.status !== currentCase.status || latest.reviewedAt !== currentCase.reviewedAt) {
      currentCase = latest;
      render(true);
    } else {
      currentCase = latest;
    }
    return true;
  }

  function render(notify) {
    const status = ['approved', 'rejected'].includes(currentCase.status) ? currentCase.status : 'pending';
    Object.entries(views).forEach(([key, view]) => {
      view.classList.toggle('is-hidden', key !== status);
    });

    document.title = status === 'pending'
      ? '人工审核中 · 收款风控'
      : status === 'approved'
        ? '审核通过，支付完成 · 收款风控'
        : '审核未通过 · 收款风控';

    if (status === 'pending') {
      setText('orderNumber', currentCase.orderNo);
      setText('orderAmount', money(currentCase.amount));
      setText('submittedAt', RiskStore.formatDate(currentCase.submittedAt));
      setText('caseId', currentCase.id);
      updateElapsed();
      if (!elapsedTimer) elapsedTimer = window.setInterval(updateElapsed, 1000);
    } else {
      if (elapsedTimer) {
        window.clearInterval(elapsedTimer);
        elapsedTimer = null;
      }
    }

    if (status === 'approved') {
      setText('approvedAmount', money(currentCase.amount));
      setText('approvedOrder', `订单 ${currentCase.orderNo}`);
      setText('approvedTime', RiskStore.formatDate(currentCase.reviewedAt));
      setText('approvedReason', currentCase.decisionReason || '资料一致，审核通过');
      setText('approvedReviewer', `${currentCase.reviewer || '林清'} · 风控组`);
      setText('receiptOrderNo', currentCase.orderNo);
      setText('receiptAmount', money(currentCase.amount));
      setText('receiptPaidAt', RiskStore.formatDate(currentCase.paidAt || currentCase.reviewedAt));
      setText('receiptCaseId', currentCase.id);
    }

    if (status === 'rejected') {
      setText('rejectedReason', currentCase.decisionReason || '资料无法通过核验');
      setText('rejectedNote', currentCase.decisionNote || '请确认照片完整、清晰后重新提交。');
      setText('rejectedOrder', currentCase.orderNo);
      setText('rejectedAmount', money(currentCase.amount));
      setText('rejectedTime', RiskStore.formatDate(currentCase.reviewedAt));
      setText('rejectedReviewer', `${currentCase.reviewer || '林清'} · 风控组`);
      setText('rejectedCaseId', currentCase.id);
    }

    if (notify && lastStatus && lastStatus !== status) {
      if (status === 'approved') showToast('人工审核已通过，付款已完成');
      if (status === 'rejected') showToast('审核未通过，本次支付流程已终止');
    }
    lastStatus = status;
  }

  function updateElapsed() {
    const node = document.getElementById('elapsedTime');
    if (node) node.textContent = RiskStore.elapsed(currentCase.submittedAt);
  }

  function startPolling() {
    if (pollTimer) window.clearInterval(pollTimer);
    pollTimer = window.setInterval(() => {
      updateCaseFromStore();
    }, 1800);
  }

  const refreshButton = document.getElementById('refreshStatus');
  refreshButton.addEventListener('click', () => {
    refreshButton.disabled = true;
    const original = refreshButton.innerHTML;
    refreshButton.innerHTML = '<span class="spinner"></span> 正在同步';
    window.setTimeout(() => {
      const changed = updateCaseFromStore();
      render(false);
      refreshButton.disabled = false;
      refreshButton.innerHTML = original;
      Icons.render(refreshButton);
      if (changed && currentCase.status === 'pending') showToast('审核仍在进行，请稍候');
    }, 650);
  });

  document.getElementById('returnOrder').addEventListener('click', () => {
    window.location.href = 'payment.html';
  });

  document.getElementById('helpSupport').addEventListener('click', () => {
    showToast('在线客服已接入，请稍候');
  });

  const receiptDialog = document.getElementById('receiptDialog');
  document.getElementById('approvedReceipt').addEventListener('click', () => receiptDialog.showModal());
  ['closeReceiptDialog', 'closeReceiptButton'].forEach((id) => {
    document.getElementById(id).addEventListener('click', () => receiptDialog.close());
  });
  receiptDialog.addEventListener('click', (event) => {
    if (event.target === receiptDialog) receiptDialog.close();
  });

  document.getElementById('reuploadButton').addEventListener('click', () => {
    // A new upload submission creates a new case; the rejected case remains closed.
    document.body.dataset.restart = 'true';
  });

  window.addEventListener('storage', (event) => {
    if (event.key === RiskStore.STORAGE_KEY) updateCaseFromStore();
  });

  render(false);
  startPolling();
})();
