(function () {
  const esc = RiskStore.escapeHTML;
  let records = [];
  let filter = 'all';
  let query = '';
  let toastTimer = null;

  const body = document.getElementById('recordsBody');
  const search = document.getElementById('recordSearch');
  const globalSearch = document.getElementById('globalSearch');
  const dialog = document.getElementById('recordDialog');
  const dialogBody = document.getElementById('recordDialogBody');
  const toast = document.getElementById('recordsToast');

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
  }

  function allCases() {
    return RiskStore.list().filter((item) => item.status !== 'pending');
  }

  function counts() {
    const all = allCases();
    return {
      all: all.length,
      approved: all.filter((item) => item.status === 'approved').length,
      rejected: all.filter((item) => item.status === 'rejected').length,
      pending: RiskStore.list().filter((item) => item.status === 'pending').length
    };
  }

  function visibleRecords() {
    const needle = query.trim().toLowerCase();
    return allCases()
      .filter((item) => filter === 'all' || item.status === filter)
      .filter((item) => {
        if (!needle) return true;
        return [item.orderNo, item.id, item.reviewer, item.decisionReason, item.decisionNote, item.buyer]
          .join(' ')
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => new Date(b.reviewedAt || b.submittedAt) - new Date(a.reviewedAt || a.submittedAt));
  }

  function updateMetrics() {
    const c = counts();
    const completed = c.approved + c.rejected;
    const rate = completed ? Math.round((c.approved / completed) * 1000) / 10 : 0;
    document.getElementById('metricAll').innerHTML = `${c.all}<small>条</small>`;
    document.getElementById('metricApproved').innerHTML = `${c.approved}<small>条</small>`;
    document.getElementById('metricRejected').innerHTML = `${c.rejected}<small>条</small>`;
    document.getElementById('metricRate').innerHTML = `${rate}<small>%</small>`;
    document.getElementById('allTabCount').textContent = c.all;
    document.getElementById('approvedTabCount').textContent = c.approved;
    document.getElementById('rejectedTabCount').textContent = c.rejected;
    document.getElementById('sidePendingCount').textContent = c.pending;
    document.getElementById('recordTotalFoot').textContent = c.all;
  }

  function statusInfo(status) {
    return status === 'approved'
      ? { label: '已通过', className: 'is-approved', icon: 'check' }
      : { label: '已驳回', className: 'is-rejected', icon: 'x' };
  }

  function recordRow(item) {
    const status = statusInfo(item.status);
    const reason = item.decisionReason || (item.status === 'approved' ? '资料一致，审核通过' : '资料无法通过核验');
    return `
      <tr data-record-id="${esc(item.id)}" tabindex="0" aria-label="查看审核记录 ${esc(item.id)}">
        <td class="record-main-cell">
          <div class="record-case-line"><span class="record-status-dot ${status.className}"></span><strong>${esc(item.id)}</strong></div>
          <span class="record-order">${esc(item.orderNo)} · ${esc(item.buyer)}</span>
        </td>
        <td class="record-verdict-cell">
          <span class="record-result-badge ${status.className}"><span data-icon="${status.icon}"></span>${status.label}</span>
          <span class="record-reason">${esc(reason)}</span>
        </td>
        <td class="record-amount-cell"><strong>¥${RiskStore.formatMoney(item.amount)}</strong><span>${esc(item.method)}</span></td>
        <td class="record-reviewer-cell"><span class="record-reviewer-avatar">${esc((item.reviewer || '林清').slice(0, 1))}</span><span>${esc(item.reviewer || '林清')}</span></td>
        <td class="record-time-cell"><strong>${esc(RiskStore.formatDate(item.reviewedAt))}</strong><span>${item.status === 'approved' ? '付款已执行' : '支付已终止'}</span></td>
        <td class="record-action-cell"><span data-icon="chevron-right"></span></td>
      </tr>`;
  }

  function render() {
    updateMetrics();
    const rows = visibleRecords();
    if (!rows.length) {
      body.innerHTML = `
        <tr class="records-empty-row"><td colspan="6">
          <div class="records-empty"><span data-icon="history"></span><strong>没有匹配的审核记录</strong><p>尝试切换审核结果或修改搜索关键词。</p></div>
        </td></tr>`;
    } else {
      body.innerHTML = rows.map(recordRow).join('');
    }
    Icons.render(body);
  }

  function openRecord(id) {
    const item = RiskStore.get(id);
    if (!item) return;
    const approved = item.status === 'approved';
    const status = statusInfo(item.status);
    dialogBody.innerHTML = `
      <section class="record-detail-banner ${status.className}">
        <span class="record-detail-icon" data-icon="${approved ? 'check' : 'x'}"></span>
        <div>
          <p>${esc(item.id)}</p>
          <h3>${approved ? '审核通过，付款已执行' : '审核驳回，支付流程已终止'}</h3>
          <span>${esc(RiskStore.formatDate(item.reviewedAt))} · ${esc(item.reviewer || '林清')} 审核</span>
        </div>
        <strong><small>¥</small>${RiskStore.formatMoney(item.amount)}</strong>
      </section>
      <div class="record-detail-grid">
        <section class="record-detail-card">
          <header><span data-icon="file-text"></span><h4>订单与审核信息</h4></header>
          <dl class="record-detail-list">
            <div><dt>订单号</dt><dd class="mono">${esc(item.orderNo)}</dd></div>
            <div><dt>收款方</dt><dd>${esc(item.merchant)}</dd></div>
            <div><dt>买家</dt><dd>${esc(item.buyer)} · ${esc(item.buyerAccount)}</dd></div>
            <div><dt>订单设备</dt><dd>${esc(item.deviceModel)}</dd></div>
            <div><dt>支付方式</dt><dd>${esc(item.method)}</dd></div>
            <div><dt>提交时间</dt><dd>${esc(RiskStore.formatDate(item.submittedAt))}</dd></div>
          </dl>
        </section>
        <section class="record-detail-card record-decision-card">
          <header><span data-icon="shield-check"></span><h4>审核结论</h4><em class="${status.className}">${status.label}</em></header>
          <div class="record-decision-reason"><span>结论</span><strong>${esc(item.decisionReason || (approved ? '资料一致，审核通过' : '资料无法通过核验'))}</strong></div>
          <div class="record-decision-note"><span>审核备注</span><p>${esc(item.decisionNote || '审核员未填写补充备注。')}</p></div>
          <div class="record-payment-result"><span>${approved ? '付款结果' : '支付结果'}</span><strong>${approved ? '支付成功 · 已回写订单' : '支付已拦截 · 本次流程终止'}</strong></div>
        </section>
      </div>
      <section class="record-detail-card record-evidence-card">
        <header><span data-icon="image"></span><h4>核验资料</h4><span>只读原图</span></header>
        <div class="record-evidence-grid">
          <figure><img src="${esc(item.deviceImage)}" alt="本机图片"><figcaption><span>本机图片</span><small>${esc(item.deviceFileName)}</small></figcaption></figure>
          <figure><img src="${esc(item.imeiImage)}" alt="IMEI 图片"><figcaption><span>IMEI 图片</span><small>${esc(item.imeiFileName)}</small></figcaption></figure>
        </div>
      </section>
      <section class="record-audit-line">
        <div><span class="audit-line-dot"></span><div><strong>用户提交核验资料</strong><p>${esc(RiskStore.formatDate(item.submittedAt))}</p></div></div>
        <span></span>
        <div><span class="audit-line-dot is-done"></span><div><strong>${esc(item.reviewer || '林清')} 完成审核</strong><p>${esc(RiskStore.formatDate(item.reviewedAt))}</p></div></div>
        <span></span>
        <div><span class="audit-line-dot ${approved ? 'is-done' : 'is-terminated'}"></span><div><strong>${approved ? '付款执行完成' : '支付流程终止'}</strong><p>结论已写入审计记录</p></div></div>
      </section>`;
    Icons.render(dialogBody);
    dialog.showModal();
  }

  function setFilter(next) {
    filter = next;
    document.querySelectorAll('.records-tab').forEach((tab) => {
      const active = tab.dataset.filter === next;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    render();
  }

  document.querySelectorAll('.records-tab').forEach((tab) => {
    tab.addEventListener('click', () => setFilter(tab.dataset.filter));
  });

  body.addEventListener('click', (event) => {
    const row = event.target.closest('[data-record-id]');
    if (row) openRecord(row.dataset.recordId);
  });

  body.addEventListener('keydown', (event) => {
    const row = event.target.closest('[data-record-id]');
    if (row && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openRecord(row.dataset.recordId);
    }
  });

  search.addEventListener('input', () => {
    query = search.value;
    if (globalSearch.value !== query) globalSearch.value = query;
    render();
  });

  globalSearch.addEventListener('input', () => {
    query = globalSearch.value;
    if (search.value !== query) search.value = query;
    render();
  });

  document.getElementById('refreshRecords').addEventListener('click', (event) => {
    const button = event.currentTarget;
    button.classList.add('is-spinning');
    window.setTimeout(() => {
      records = allCases();
      render();
      button.classList.remove('is-spinning');
      showToast(`审核记录已刷新 · ${records.length} 条`);
    }, 500);
  });

  document.getElementById('exportRecords').addEventListener('click', () => {
    const rows = visibleRecords();
    if (!rows.length) {
      showToast('当前没有可导出的审核记录');
      return;
    }
    const content = [
      ['审核单号', '订单号', '订单金额', '审核结论', '审核员', '审核时间', '驳回原因', '审核备注'],
      ...rows.map((item) => [
        item.id,
        item.orderNo,
        item.amount,
        item.status === 'approved' ? '已通过' : '已驳回',
        item.reviewer || '林清',
        RiskStore.formatDate(item.reviewedAt),
        item.decisionReason || '',
        item.decisionNote || ''
      ])
    ].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `审核记录_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    showToast(`已导出 ${rows.length} 条审核记录`);
  });

  ['closeRecordDialog', 'closeRecordButton'].forEach((id) => {
    document.getElementById(id).addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  document.querySelectorAll('[data-nav]').forEach((button) => {
    button.addEventListener('click', () => showToast('当前原型聚焦审核工作台与审核记录两条路径'));
  });
  document.querySelector('.side-more').addEventListener('click', () => showToast('账户菜单未在原型中开放'));

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      globalSearch.focus();
      globalSearch.select();
    }
  });

  window.addEventListener('storage', (event) => {
    if (event.key === RiskStore.STORAGE_KEY) render();
  });

  window.setInterval(() => {
    if (!dialog.open) render();
  }, 2200);

  records = allCases();
  render();
})();
