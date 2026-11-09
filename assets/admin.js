(function () {
  const REJECT_REASONS = [
    '图片信息无法辨认',
    '本机与订单设备不一致',
    'IMEI 信息不完整',
    '资料疑似伪造或重复使用',
    '其他风险原因'
  ];

  let cases = RiskStore.list();
  let activeFilter = 'pending';
  let selectedId = null;
  let searchQuery = '';
  let toastTimer = null;
  let pendingDecision = null;
  let activeImageCaseId = null;

  const queueList = document.getElementById('queueList');
  const casePanel = document.getElementById('casePanel');
  const queueSearch = document.getElementById('queueSearch');
  const globalSearch = document.getElementById('globalSearch');
  const toast = document.getElementById('adminToast');
  const decisionDialog = document.getElementById('decisionDialog');
  const imageDialog = document.getElementById('imageDialog');
  const reviewerNote = document.getElementById('reviewerNote');
  const confirmDecision = document.getElementById('confirmDecision');
  const decisionDialogIcon = document.getElementById('decisionDialogIcon');

  const esc = RiskStore.escapeHTML;

  function statusLabel(status) {
    return { pending: '待审核', approved: '已通过', rejected: '已驳回' }[status] || status;
  }

  function riskLabel(level) {
    return level === 'high' ? '高风险' : '中风险';
  }

  function riskClass(level) {
    return level === 'high' ? '' : 'risk-badge--medium';
  }

  function money(amount) {
    return RiskStore.formatMoney(amount);
  }

  function waitLong(value) {
    if (!value) return '—';
    const diff = Math.max(0, Date.now() - new Date(value).getTime());
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h ${minutes % 60}m`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function shortTime(value) {
    if (!value) return '—';
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(value));
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2500);
  }

  function activeCases() {
    const query = searchQuery.trim().toLowerCase();
    let list = cases.filter((item) => item.status === activeFilter);

    if (activeFilter === 'pending') {
      list.sort((a, b) => (b.riskScore - a.riskScore) || (new Date(a.submittedAt) - new Date(b.submittedAt)));
    } else {
      list.sort((a, b) => new Date(b.reviewedAt || b.submittedAt) - new Date(a.reviewedAt || a.submittedAt));
    }

    if (query) {
      list = list.filter((item) => {
        const haystack = [
          item.orderNo,
          item.id,
          item.buyer,
          item.merchant,
          item.summary,
          ...(item.tags || [])
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }
    return list;
  }

  function selectedCase() {
    return cases.find((item) => item.id === selectedId) || null;
  }

  function updateCounts() {
    const counts = cases.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, { pending: 0, approved: 0, rejected: 0 });

    document.getElementById('sidePendingCount').textContent = counts.pending;
    document.getElementById('metricPending').innerHTML = `${counts.pending}<small>笔</small>`;
    document.getElementById('pendingTabCount').textContent = counts.pending;
    document.getElementById('approvedTabCount').textContent = counts.approved;
    document.getElementById('rejectedTabCount').textContent = counts.rejected;
    updateQueueScrollHint();
  }

  function updateQueueScrollHint() {
    const footer = document.querySelector('.queue-footer > span');
    if (!footer) return;
    const hasOverflow = queueList.scrollHeight > queueList.clientHeight + 8;
    const nearBottom = queueList.scrollTop + queueList.clientHeight >= queueList.scrollHeight - 8;
    footer.innerHTML = hasOverflow && !nearBottom
      ? '<i></i>向下滚动查看更多待审订单'
      : '<i></i>队列状态已同步';
  }

  function queueItemMarkup(item) {
    const isPending = item.status === 'pending';
    const statusBadge = isPending
      ? `<span class="risk-badge ${riskClass(item.riskLevel)}">${riskLabel(item.riskLevel)}</span>`
      : `<span class="risk-badge ${item.status === 'approved' ? 'risk-badge--status-approved' : 'risk-badge--status-rejected'}">${statusLabel(item.status)}</span>`;
    const timeText = isPending ? RiskStore.relativeTime(item.submittedAt) : RiskStore.formatDate(item.reviewedAt);
    const tags = (item.tags || []).slice(0, 3).map((tag) => `<span>${esc(tag)}</span>`).join('');
    const footer = isPending
      ? `<span>${esc(item.buyer)} · ${esc(item.buyerAccount)}</span><span class="queue-wait" data-submitted-at="${esc(item.submittedAt)}"><span data-icon="clock"></span> ${waitLong(item.submittedAt)}</span>`
      : `<span>${esc(item.reviewer || '林清')} · 已处理</span><span>${esc(item.decisionReason || statusLabel(item.status))}</span>`;

    return `
      <button class="queue-item ${item.id === selectedId ? 'is-active' : ''}" type="button" data-case-id="${esc(item.id)}" role="listitem" aria-pressed="${item.id === selectedId}">
        <div class="queue-item-top">
          ${statusBadge}
          <span class="queue-item-time">${esc(timeText)}</span>
        </div>
        <div class="queue-order-row">
          <strong>${esc(item.orderNo)}</strong>
          <em>¥${money(item.amount)}</em>
        </div>
        <p class="queue-summary">${esc(item.summary)}</p>
        <div class="queue-tags">${tags}</div>
        <div class="queue-item-footer">${footer}</div>
      </button>`;
  }

  function renderQueue() {
    const items = activeCases();
    if (!items.length) {
      queueList.innerHTML = `
        <div class="queue-empty">
          <span class="empty-icon" data-icon="${activeFilter === 'pending' ? 'check-circle' : 'search'}"></span>
          <strong>${activeFilter === 'pending' ? '当前队列已清空' : '没有匹配的审核记录'}</strong>
          <p>${searchQuery ? '尝试更换搜索关键词' : activeFilter === 'pending' ? '新的高风险订单会自动进入队列' : '切换其他状态查看记录'}</p>
        </div>`;
    } else {
      queueList.innerHTML = items.map(queueItemMarkup).join('');
    }
    Icons.render(queueList);
  }

  function compareState(item) {
    const warning = /不一致|不完整|清晰度|遮挡|置信度|异常/.test(item.summary || '');
    return {
      warning,
      title: warning ? '自动比对发现异常，需人工确认' : 'IMEI 号段与订单机型匹配',
      detail: warning ? '请结合原图核验设备外观与号码信息' : '照片未发现重复使用，设备型号一致',
      result: warning ? '需复核' : '通过'
    };
  }

  function signalMarkup(signal) {
    return `
      <li class="signal-item">
        <span class="severity severity--${signal.level === 'high' ? 'high' : 'medium'}">${signal.level === 'high' ? '高' : '中'}</span>
        <div class="signal-copy">
          <strong>${esc(signal.title)}</strong>
          <p>${esc(signal.detail)}</p>
        </div>
      </li>`;
  }

  function timelineMarkup(item) {
    const steps = [
      {
        title: '资料重新提交',
        detail: '用户上传本机图片与 IMEI 图片',
        time: shortTime(item.submittedAt),
        state: 'done'
      },
      {
        title: '系统自动初审',
        detail: '设备型号、画面完整度与号段格式已识别',
        time: '自动',
        state: 'done'
      }
    ];

    if (item.status === 'pending') {
      steps.push({
        title: '等待人工审核',
        detail: '正在核对原图与设备信息',
        time: waitLong(item.submittedAt),
        state: 'current'
      });
    } else if (item.status === 'approved') {
      steps.push({
        title: '人工审核通过',
        detail: item.decisionReason || '资料一致，风险已排除',
        time: shortTime(item.reviewedAt),
        state: 'done'
      });
      steps.push({
        title: '付款已执行',
        detail: '订单已自动完成付款',
        time: shortTime(item.paidAt || item.reviewedAt),
        state: 'done'
      });
    } else {
      steps.push({
        title: '人工审核驳回',
        detail: item.decisionReason || '资料无法通过核验',
        time: shortTime(item.reviewedAt),
        state: 'done'
      });
      steps.push({
        title: '支付流程已终止',
        detail: '等待用户重新上传资料',
        time: shortTime(item.reviewedAt),
        state: 'current'
      });
    }

    return steps.map((step) => `
      <div class="audit-step is-${step.state}">
        <span class="audit-dot"></span>
        <div><strong>${esc(step.title)}</strong><p>${esc(step.detail)}</p></div>
        <time>${esc(step.time)}</time>
      </div>`).join('');
  }

  function decisionBarMarkup(item) {
    if (item.status !== 'pending') {
      const approved = item.status === 'approved';
      return `
        <footer class="decision-bar">
          <div class="resolved-bar">
            <div class="resolved-summary">
              <span class="resolved-mark ${approved ? '' : 'is-rejected'}" data-icon="${approved ? 'check' : 'x'}"></span>
              <div class="resolved-copy">
                <strong>${approved ? '审核已通过，付款已执行' : '审核已驳回，支付流程已终止'}</strong>
                <p>${esc(item.reviewer || '林清')} · ${esc(RiskStore.formatDate(item.reviewedAt))} · ${esc(item.decisionReason || '')}${item.decisionNote ? ` · ${esc(item.decisionNote)}` : ''}</p>
              </div>
            </div>
            <div class="resolved-actions">
              <button class="admin-btn admin-btn--secondary" type="button" data-action="view-record">查看记录</button>
              <button class="admin-btn admin-btn--approve" type="button" data-action="next-case">继续审核下一单</button>
            </div>
          </div>
        </footer>`;
    }

    return `
      <footer class="decision-bar">
        <div class="decision-hint">
          <span class="decision-hint-icon" data-icon="shield-check"></span>
          <div>
            <strong>请核对资料后作出审核结论</strong>
            <p>通过将立即执行付款 · 驳回将终止本次支付流程</p>
          </div>
        </div>
        <div class="decision-actions">
          <label class="reason-select">
            <span class="sr-only">选择驳回原因</span>
            <select id="rejectReason" aria-label="驳回原因">
              <option value="">驳回原因</option>
              ${REJECT_REASONS.map((reason) => `<option value="${esc(reason)}">${esc(reason)}</option>`).join('')}
            </select>
            <span class="select-chevron" data-icon="chevron-down"></span>
          </label>
          <button class="admin-btn admin-btn--reject" type="button" data-action="reject">驳回并终止</button>
          <button class="admin-btn admin-btn--approve" type="button" data-action="approve">
            <span data-icon="check"></span>
            通过并付款
          </button>
        </div>
      </footer>`;
  }

  function caseMarkup(item) {
    const compare = compareState(item);
    const isPending = item.status === 'pending';
    const statusClass = item.status === 'approved' ? 'is-approved' : item.status === 'rejected' ? 'is-rejected' : '';
    const deviceWarning = /不一致|机身|本机|设备/.test(item.summary || '');
    const imeiWarning = /IMEI|清晰度|遮挡|不完整|置信度/.test(item.summary || '');
    const waitBadge = isPending
      ? `<span class="sla-badge" data-submitted-at="${esc(item.submittedAt)}"><span data-icon="clock"></span> 等待 ${waitLong(item.submittedAt)}</span>`
      : `<span class="sla-badge is-resolved"><span data-icon="${item.status === 'approved' ? 'check' : 'x'}"></span> ${RiskStore.formatDate(item.reviewedAt)}</span>`;
    const signals = (item.signals && item.signals.length ? item.signals : [{
      level: 'high',
      title: '整体风控命中',
      detail: '请结合用户、设备与图片资料进行人工判断。'
    }]).map(signalMarkup).join('');

    return `
      <div class="case-scroll">
        <header class="case-header">
          <div class="case-header-main">
            <div class="case-title-line">
              <span class="risk-badge ${riskClass(item.riskLevel)}">${riskLabel(item.riskLevel)}</span>
              <span class="case-code">${esc(item.id)}</span>
              <span class="case-status-chip ${statusClass}">${statusLabel(item.status)}</span>
            </div>
            <div class="case-order-line">
              <h2>订单 <span>${esc(item.orderNo)}</span></h2>
              <button class="copy-order" type="button" data-action="copy-order" aria-label="复制订单号" title="复制订单号">
                <span data-icon="copy"></span>
              </button>
            </div>
            <div class="case-meta">
              <span><span data-icon="user"></span>${esc(item.buyer)} · ${esc(item.buyerAccount)}</span>
              <span><span data-icon="clock"></span>提交于 ${esc(RiskStore.formatDate(item.submittedAt))}</span>
              <span><span data-icon="credit-card"></span>${esc(item.method)}</span>
            </div>
          </div>
          <div class="case-amount">
            <span>${isPending ? '待付金额' : '订单金额'}</span>
            <strong><small>¥</small>${money(item.amount)}</strong>
            ${waitBadge}
          </div>
        </header>

        <div class="risk-summary">
          <span class="risk-summary-icon" data-icon="shield-alert"></span>
          <div class="risk-summary-copy">
            <div class="risk-summary-title">
              <strong>整体风控命中</strong>
              <span class="risk-score">风险分 ${item.riskScore}</span>
            </div>
            <p>设备环境与历史交易画像存在组合异常，需要人工核实本机与 IMEI 资料。</p>
          </div>
          <span class="risk-audit-label">${isPending ? '需人工复核' : item.status === 'approved' ? '风险已解除' : '支付已拦截'}</span>
        </div>

        <div class="case-content-grid">
          <div class="case-primary-column">
            <section class="review-panel">
              <header class="panel-heading">
                <div>
                  <h3>核验资料</h3>
                  <p>共 2 张 · 点击图片可查看原图</p>
                </div>
                <div class="panel-tools">
                  <span class="auto-check"><span data-icon="check-circle"></span> 自动初审完成</span>
                  <button class="panel-icon-btn" type="button" data-action="download-evidence" aria-label="下载审核资料" title="下载审核资料">
                    <span data-icon="download"></span>
                  </button>
                </div>
              </header>
              <div class="evidence-grid">
                <figure class="evidence-card">
                  <button class="evidence-media" type="button" data-action="view-image" data-kind="device" aria-label="查看本机图片原图">
                    <img src="${esc(item.deviceImage)}" alt="用户上传的本机图片">
                    <span class="zoom-hint"><span data-icon="expand"></span> 查看原图</span>
                  </button>
                  <figcaption class="evidence-caption">
                    <div class="evidence-title">
                      <span class="evidence-number">01</span>
                      <div><strong>本机图片</strong><span>${esc(item.deviceFileName)}</span></div>
                    </div>
                    <span class="evidence-quality">原图 · 已加密</span>
                  </figcaption>
                  <div class="evidence-status ${deviceWarning ? 'is-warning' : ''}">
                    <span data-icon="${deviceWarning ? 'alert-circle' : 'check'}"></span>
                    ${deviceWarning ? '设备外观需人工复核' : '设备正面完整，画面清晰'}
                  </div>
                </figure>
                <figure class="evidence-card">
                  <button class="evidence-media" type="button" data-action="view-image" data-kind="imei" aria-label="查看 IMEI 图片原图">
                    <img src="${esc(item.imeiImage)}" alt="用户上传的 IMEI 图片">
                    <span class="zoom-hint"><span data-icon="expand"></span> 查看原图</span>
                  </button>
                  <figcaption class="evidence-caption">
                    <div class="evidence-title">
                      <span class="evidence-number">02</span>
                      <div><strong>IMEI 图片</strong><span>${esc(item.imeiFileName)}</span></div>
                    </div>
                    <span class="evidence-quality">原图 · 已加密</span>
                  </figcaption>
                  <div class="evidence-status ${imeiWarning ? 'is-warning' : ''}">
                    <span data-icon="${imeiWarning ? 'alert-circle' : 'check'}"></span>
                    ${imeiWarning ? 'IMEI 号码需人工确认' : 'IMEI 号段完整可辨认'}
                  </div>
                </figure>
              </div>
              <div class="compare-bar ${compare.warning ? 'is-warning' : ''}">
                <span class="compare-icon" data-icon="scan"></span>
                <div class="compare-copy">
                  <strong>${esc(compare.title)}</strong>
                  <p>${esc(compare.detail)}</p>
                </div>
                <span class="compare-result">${esc(compare.result)}</span>
              </div>
            </section>

            <section class="review-panel">
              <header class="panel-heading">
                <div>
                  <h3>审核轨迹</h3>
                  <p>完整记录资料来源与处理节点</p>
                </div>
                <span class="auto-check"><span data-icon="lock"></span> 审计留痕</span>
              </header>
              <div class="audit-timeline">${timelineMarkup(item)}</div>
            </section>
          </div>

          <aside class="side-info-stack">
            <section class="detail-card">
              <header class="detail-card-head">
                <h3>订单与用户</h3>
                <button type="button" data-action="open-order">查看订单</button>
              </header>
              <dl class="detail-list">
                <div><dt>买家</dt><dd>${esc(item.buyer)}</dd></div>
                <div><dt>账号</dt><dd class="mono">${esc(item.buyerAccount)}</dd></div>
                <div><dt>收款方</dt><dd>${esc(item.merchant)}</dd></div>
                <div><dt>支付方式</dt><dd>${esc(item.method)}</dd></div>
                <div><dt>订单设备</dt><dd>${esc(item.deviceModel)}</dd></div>
                <div><dt>系统版本</dt><dd>${esc(item.deviceOs)}</dd></div>
              </dl>
            </section>

            <section class="detail-card">
              <header class="detail-card-head">
                <h3>命中规则 <span>${item.signals ? item.signals.length : 1}</span></h3>
                <button type="button" data-action="view-rules">规则详情</button>
              </header>
              <ul class="signal-list">${signals}</ul>
            </section>

            <div class="review-tip">
              <span data-icon="info"></span>
              <div>
                <strong>审核提示</strong>
                <p>请同时核对外观与 IMEI 信息。若任一资料无法辨认，建议驳回并终止本次支付；用户重新上传后会生成新的审核单。</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
      ${decisionBarMarkup(item)}`;
  }

  function renderCase() {
    const item = selectedCase();
    if (!item) {
      casePanel.innerHTML = `
        <div class="case-empty">
          <span class="empty-mark" data-icon="inbox"></span>
          <strong>选择一条待审核订单</strong>
          <p>从左侧队列选择订单后，这里会展示本机照片、IMEI 信息与审核操作。</p>
        </div>`;
      Icons.render(casePanel);
      return;
    }

    casePanel.innerHTML = caseMarkup(item);
    Icons.render(casePanel);
  }

  function renderAll() {
    updateCounts();
    renderQueue();
    renderCase();
  }

  function chooseFirstVisible() {
    const visible = activeCases();
    if (!visible.some((item) => item.id === selectedId)) {
      selectedId = visible[0] ? visible[0].id : null;
    }
  }

  function setFilter(filter) {
    activeFilter = filter;
    document.querySelectorAll('.queue-tab').forEach((tab) => {
      const active = tab.dataset.filter === filter;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    chooseFirstVisible();
    renderAll();
  }

  function updateSearch(value) {
    searchQuery = value;
    if (queueSearch.value !== value) queueSearch.value = value;
    if (globalSearch.value !== value) globalSearch.value = value;
    chooseFirstVisible();
    renderAll();
  }

  function openDecision(mode, reason) {
    const item = selectedCase();
    if (!item || item.status !== 'pending') return;
    pendingDecision = { mode, caseId: item.id, reason: reason || '' };
    const approving = mode === 'approve';

    decisionDialog.dataset.mode = mode;
    decisionDialogIcon.classList.toggle('is-reject', !approving);
    decisionDialogIcon.innerHTML = Icons.get(approving ? 'check' : 'x');
    document.getElementById('decisionDialogEyebrow').textContent = approving ? 'APPROVE & PAY' : 'REJECT & TERMINATE';
    document.getElementById('decisionDialogTitle').textContent = approving ? '确认审核通过并付款？' : '确认驳回并终止支付？';
    document.getElementById('decisionDialogLead').textContent = approving
      ? '通过后将立即执行付款，此操作无法撤销。请再次确认图片与本机信息一致。'
      : '本次支付流程将终止，用户需要重新上传资料并生成新的审核单。';
    document.getElementById('dialogOrderNo').textContent = item.orderNo;
    document.getElementById('dialogAmount').textContent = `¥${money(item.amount)}`;
    document.getElementById('dialogRejectReason').classList.toggle('is-hidden', approving);
    if (!approving) {
      document.getElementById('dialogRejectReason').querySelector('strong').textContent = reason;
    }
    reviewerNote.value = '';
    confirmDecision.textContent = approving ? '确认通过并付款' : '确认驳回并终止';
    confirmDecision.classList.toggle('is-danger', !approving);
    confirmDecision.disabled = false;
    decisionDialog.showModal();
    window.setTimeout(() => reviewerNote.focus(), 60);
  }

  function closeDecision() {
    if (decisionDialog.open) decisionDialog.close();
    pendingDecision = null;
  }

  function handleDecisionConfirm() {
    if (!pendingDecision) return;
    const note = reviewerNote.value.trim();
    const { mode, caseId, reason } = pendingDecision;
    confirmDecision.disabled = true;
    confirmDecision.textContent = '处理中…';

    window.setTimeout(() => {
      const result = mode === 'approve'
        ? RiskStore.approve(caseId, '林清', note)
        : RiskStore.reject(caseId, reason, note, '林清');
      cases = RiskStore.list();
      decisionDialog.close();
      pendingDecision = null;
      selectedId = caseId;
      renderAll();
      if (result) {
        showToast(mode === 'approve'
          ? `审核通过，已执行付款 ¥${money(result.amount)}`
          : '已驳回并终止本次支付流程');
      }
    }, 520);
  }

  function openImage(kind) {
    const item = selectedCase();
    if (!item) return;
    activeImageCaseId = item.id;
    const isDevice = kind === 'device';
    document.getElementById('imageDialogTitle').textContent = isDevice ? '本机图片 · 原图' : 'IMEI 图片 · 原图';
    document.getElementById('imageDialogImage').src = isDevice ? item.deviceImage : item.imeiImage;
    document.getElementById('imageDialogImage').alt = isDevice ? '本机图片原图' : 'IMEI 图片原图';
    document.getElementById('imageDimensions').textContent = `${isDevice ? item.deviceFileName : item.imeiFileName} · 原始画质`;
    document.getElementById('approveFromImage').classList.toggle('is-hidden', item.status !== 'pending');
    imageDialog.showModal();
  }

  function nextPendingCase() {
    const pending = cases
      .filter((item) => item.status === 'pending')
      .sort((a, b) => (b.riskScore - a.riskScore) || (new Date(a.submittedAt) - new Date(b.submittedAt)));
    if (!pending.length) {
      showToast('待审核队列已清空');
      return;
    }
    activeFilter = 'pending';
    document.querySelectorAll('.queue-tab').forEach((tab) => {
      const active = tab.dataset.filter === 'pending';
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    selectedId = pending[0].id;
    renderAll();
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast('订单号已复制')).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const input = document.createElement('textarea');
    input.value = text;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand('copy');
      showToast('订单号已复制');
    } catch (error) {
      showToast('复制失败，请手动选择订单号');
    }
    input.remove();
  }

  queueList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-case-id]');
    if (!button) return;
    selectedId = button.dataset.caseId;
    renderQueue();
    renderCase();
    const item = selectedCase();
    if (item && activeFilter === 'pending') {
      document.getElementById('casePanel').scrollTop = 0;
    }
  });

  queueList.addEventListener('scroll', () => {
    updateQueueScrollHint();
  });

  casePanel.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]');
    if (!action) return;
    const item = selectedCase();
    if (!item) return;
    const kind = action.dataset.action;

    if (kind === 'view-image') {
      openImage(action.dataset.kind);
    } else if (kind === 'copy-order') {
      copyText(item.orderNo);
    } else if (kind === 'approve') {
      openDecision('approve');
    } else if (kind === 'reject') {
      const select = document.getElementById('rejectReason');
      const reason = select ? select.value : '';
      if (!reason) {
        select.closest('.reason-select').classList.add('is-error');
        select.focus();
        showToast('请先选择驳回原因');
        return;
      }
      openDecision('reject', reason);
    } else if (kind === 'next-case') {
      nextPendingCase();
    } else if (kind === 'download-evidence') {
      showToast('核验资料已打包，准备下载');
    } else if (kind === 'view-rules') {
      showToast('规则命中详情已展开');
    } else if (kind === 'open-order') {
      showToast(`已定位订单 ${item.orderNo}`);
    } else if (kind === 'view-record') {
      showToast('审核记录已写入审计日志');
    }
  });

  casePanel.addEventListener('change', (event) => {
    if (event.target.id === 'rejectReason') {
      const wrapper = event.target.closest('.reason-select');
      wrapper.classList.toggle('is-error', !event.target.value);
    }
  });

  document.querySelectorAll('.queue-tab').forEach((tab) => {
    tab.addEventListener('click', () => setFilter(tab.dataset.filter));
  });

  queueSearch.addEventListener('input', (event) => updateSearch(event.target.value));
  globalSearch.addEventListener('input', (event) => updateSearch(event.target.value));

  document.getElementById('refreshQueue').addEventListener('click', (event) => {
    const button = event.currentTarget;
    button.classList.add('is-spinning');
    window.setTimeout(() => {
      cases = RiskStore.list();
      button.classList.remove('is-spinning');
      updateCounts();
      renderQueue();
      if (selectedCase()) renderCase();
      showToast(`队列已刷新 · ${cases.filter((item) => item.status === 'pending').length} 笔待审核`);
    }, 620);
  });

  document.getElementById('notificationButton').addEventListener('click', () => showToast('暂无新的审核通知'));
  document.getElementById('newSubmittedCase').addEventListener('click', () => {
    const latest = RiskStore.latestForOrder(RiskStore.PAYMENT_ORDER.orderNo);
    if (latest && latest.status === 'pending') {
      selectedId = latest.id;
      activeFilter = 'pending';
      document.querySelectorAll('.queue-tab').forEach((tab) => {
        const active = tab.dataset.filter === 'pending';
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
      });
      cases = RiskStore.list();
      renderAll();
      showToast('已载入用户最新提交的核验资料');
      return;
    }
    const created = RiskStore.createFromUpload({
      deviceImage: 'assets/device-evidence.svg',
      imeiImage: 'assets/imei-evidence.svg',
      deviceFileName: '本机图片示例.jpg',
      imeiFileName: 'IMEI 图片示例.jpg'
    });
    cases = RiskStore.list();
    selectedId = created.id;
    activeFilter = 'pending';
    document.querySelectorAll('.queue-tab').forEach((tab) => {
      const active = tab.dataset.filter === 'pending';
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    renderAll();
    showToast('已模拟用户提交一套新资料');
  });
  document.getElementById('queueHelp').addEventListener('click', () => showToast('快捷搜索 ⌘K · 点击订单查看详情'));
  document.querySelector('.side-more').addEventListener('click', () => showToast('账户菜单未在原型中开放'));

  document.querySelectorAll('[data-nav]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.nav === 'review') {
        setFilter('pending');
        return;
      }
      showToast('当前原型聚焦人工审核主流程');
    });
  });

  document.getElementById('cancelDecision').addEventListener('click', closeDecision);
  document.getElementById('confirmDecision').addEventListener('click', handleDecisionConfirm);
  decisionDialog.addEventListener('click', (event) => {
    if (event.target === decisionDialog) closeDecision();
  });
  decisionDialog.addEventListener('close', () => {
    pendingDecision = null;
  });

  document.getElementById('closeImageDialog').addEventListener('click', () => imageDialog.close());
  document.getElementById('approveFromImage').addEventListener('click', () => {
    imageDialog.close();
    window.setTimeout(() => openDecision('approve'), 120);
  });
  imageDialog.addEventListener('click', (event) => {
    if (event.target === imageDialog) imageDialog.close();
  });

  document.addEventListener('keydown', (event) => {
    const inField = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      globalSearch.focus();
      globalSearch.select();
    } else if (event.key === '?' && !inField) {
      showToast('快捷搜索 ⌘K · 点击订单查看详情');
    }
  });

  function updateWaitingLabels() {
    document.querySelectorAll('[data-submitted-at]').forEach((node) => {
      const next = waitLong(node.dataset.submittedAt);
      if (node.classList.contains('queue-wait')) {
        node.innerHTML = `<span data-icon="clock"></span> ${next}`;
        Icons.render(node);
      } else if (node.classList.contains('sla-badge')) {
        node.innerHTML = `<span data-icon="clock"></span> 等待 ${next}`;
        Icons.render(node);
      }
    });
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== RiskStore.STORAGE_KEY) return;
    cases = RiskStore.list();
    updateCounts();
    renderQueue();
    if (selectedCase()) renderCase();
  });

  window.setInterval(updateWaitingLabels, 1000);
  window.setInterval(() => {
    if (decisionDialog.open || imageDialog.open) return;
    const latest = RiskStore.list();
    const fingerprint = JSON.stringify(latest.map((item) => [item.id, item.status, item.reviewedAt, item.submittedAt]));
    const currentFingerprint = JSON.stringify(cases.map((item) => [item.id, item.status, item.reviewedAt, item.submittedAt]));
    if (fingerprint !== currentFingerprint) {
      cases = latest;
      if (selectedId !== null) chooseFirstVisible();
      if (activeFilter === 'pending' && latest.some((item) => item.status === 'pending')) {
        const current = selectedCase();
        if (!current || current.status !== 'pending') chooseFirstVisible();
      }
      updateCounts();
      renderQueue();
      if (selectedCase()) renderCase();
    }
  }, 1800);

  chooseFirstVisible();
  renderAll();
  updateQueueScrollHint();
  window.addEventListener('resize', updateQueueScrollHint);
})();
