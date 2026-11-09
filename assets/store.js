(function () {
  const STORAGE_KEY = 'tcb-risk-cases-v1';
  const PAYMENT_ORDER = Object.freeze({
    orderNo: 'TCB2026110949852',
    amount: 1683,
    merchant: '云帆数码旗舰店',
    buyer: '陈**',
    buyerAccount: 'wxid_****8k2m',
    method: '微信支付'
  });

  const now = Date.now();
  const minutesAgo = (mins) => new Date(now - mins * 60 * 1000).toISOString();

  function makeSignals(extra) {
    return [
      {
        level: 'high',
        title: '整体风控命中',
        detail: '设备环境、收货信息与历史交易画像存在组合异常，需人工复核。'
      },
      {
        level: 'medium',
        title: '设备资料需重传',
        detail: '本机照片或 IMEI 资料未通过系统自动识别，需重新上传清晰原图。'
      },
      ...extra
    ];
  }

  function seedCases() {
    return [
      {
        id: 'RC-20261109-0418',
        orderNo: 'TCB2026110949741',
        amount: 3299,
        merchant: '云帆数码旗舰店',
        buyer: '周**',
        buyerAccount: 'wxid_****82kq',
        method: '微信支付',
        status: 'pending',
        riskLevel: 'high',
        riskScore: 86,
        source: '整体风控',
        summary: '设备环境与历史交易不一致',
        tags: ['整体风控', '设备异常', '资料重传'],
        signals: makeSignals([
          {
            level: 'high',
            title: '同一设备短时多单',
            detail: '该设备指纹在 30 分钟内关联 3 笔不同账号的收款订单。'
          }
        ]),
        deviceModel: 'Onyx X1 Pro · 256GB',
        deviceOs: 'Android 15',
        submittedAt: minutesAgo(3.2),
        deviceImage: 'assets/device-evidence.svg',
        imeiImage: 'assets/imei-evidence.svg',
        deviceFileName: 'device_front.jpg',
        imeiFileName: 'imei_info.jpg',
        reviewer: null,
        reviewedAt: null,
        decisionReason: '',
        decisionNote: '',
        paymentStatus: 'blocked'
      },
      {
        id: 'RC-20261109-0417',
        orderNo: 'TCB2026110949688',
        amount: 8620,
        merchant: '云帆数码旗舰店',
        buyer: '徐**',
        buyerAccount: 'wxid_****1m0d',
        method: '微信支付',
        status: 'pending',
        riskLevel: 'high',
        riskScore: 91,
        source: '整体风控',
        summary: '图片信息与订单设备不一致',
        tags: ['整体风控', '设备不一致'],
        signals: makeSignals([
          {
            level: 'high',
            title: '订单设备不一致',
            detail: '订单机型为 Onyx X1 Pro，图片识别的机身特征存在明显差异。'
          }
        ]),
        deviceModel: 'Onyx X1 Pro · 512GB',
        deviceOs: 'Android 15',
        submittedAt: minutesAgo(8.4),
        deviceImage: 'assets/device-evidence.svg',
        imeiImage: 'assets/imei-evidence.svg',
        deviceFileName: 'IMG_20261109_2012.jpg',
        imeiFileName: 'Screenshot_20261109.png',
        reviewer: null,
        reviewedAt: null,
        decisionReason: '',
        decisionNote: '',
        paymentStatus: 'blocked'
      },
      {
        id: 'RC-20261109-0416',
        orderNo: 'TCB2026110949512',
        amount: 599,
        merchant: '云帆数码旗舰店',
        buyer: '赵**',
        buyerAccount: 'wxid_****7v4x',
        method: '微信支付',
        status: 'pending',
        riskLevel: 'medium',
        riskScore: 67,
        source: '整体风控',
        summary: 'IMEI 图片清晰度不足',
        tags: ['IMEI 待核'],
        signals: makeSignals([
          {
            level: 'medium',
            title: 'IMEI 识别置信度低',
            detail: '图片反光导致 IMEI 号段识别置信度仅 62%，需人工确认。'
          }
        ]),
        deviceModel: 'Onyx A2 · 128GB',
        deviceOs: 'Android 14',
        submittedAt: minutesAgo(12.9),
        deviceImage: 'assets/device-evidence.svg',
        imeiImage: 'assets/imei-evidence.svg',
        deviceFileName: 'phone_front.png',
        imeiFileName: 'imei_photo.jpg',
        reviewer: null,
        reviewedAt: null,
        decisionReason: '',
        decisionNote: '',
        paymentStatus: 'blocked'
      },
      {
        id: 'RC-20261109-0415',
        orderNo: 'TCB2026110949476',
        amount: 2180,
        merchant: '云帆数码旗舰店',
        buyer: '孙**',
        buyerAccount: 'wxid_****5x7c',
        method: '支付宝',
        status: 'pending',
        riskLevel: 'medium',
        riskScore: 64,
        source: '整体风控',
        summary: '本机图片缺少完整机身',
        tags: ['整体风控', '资料重传'],
        signals: makeSignals([
          {
            level: 'medium',
            title: '本机照片不完整',
            detail: '照片仅包含屏幕区域，无法核对完整机身边框。'
          }
        ]),
        deviceModel: 'Onyx X1 · 128GB',
        deviceOs: 'Android 14',
        submittedAt: minutesAgo(18.1),
        deviceImage: 'assets/device-evidence.svg',
        imeiImage: 'assets/imei-evidence.svg',
        deviceFileName: 'device_01.jpg',
        imeiFileName: 'imei_01.jpg',
        reviewer: null,
        reviewedAt: null,
        decisionReason: '',
        decisionNote: '',
        paymentStatus: 'blocked'
      },
      {
        id: 'RC-20261109-0409',
        orderNo: 'TCB2026110949011',
        amount: 1450,
        merchant: '云帆数码旗舰店',
        buyer: '林**',
        buyerAccount: 'wxid_****3n1p',
        method: '微信支付',
        status: 'approved',
        riskLevel: 'high',
        riskScore: 79,
        source: '整体风控',
        summary: '人工复核通过',
        tags: ['整体风控', '已通过'],
        signals: makeSignals([]),
        deviceModel: 'Onyx X1 Pro · 256GB',
        deviceOs: 'Android 15',
        submittedAt: minutesAgo(46),
        deviceImage: 'assets/device-evidence.svg',
        imeiImage: 'assets/imei-evidence.svg',
        deviceFileName: 'device_front.jpg',
        imeiFileName: 'imei_info.jpg',
        reviewer: '林清',
        reviewedAt: minutesAgo(40),
        paidAt: minutesAgo(39.8),
        decisionReason: '资料一致，风险已排除',
        decisionNote: '本机外观与 IMEI 信息一致，买家补充资料清晰。',
        paymentStatus: 'paid'
      },
      {
        id: 'RC-20261109-0403',
        orderNo: 'TCB2026110948809',
        amount: 668,
        merchant: '云帆数码旗舰店',
        buyer: '吴**',
        buyerAccount: 'wxid_****8q2v',
        method: '微信支付',
        status: 'rejected',
        riskLevel: 'medium',
        riskScore: 72,
        source: '整体风控',
        summary: 'IMEI 信息不完整',
        tags: ['整体风控', '已驳回'],
        signals: makeSignals([]),
        deviceModel: 'Onyx A2 · 128GB',
        deviceOs: 'Android 14',
        submittedAt: minutesAgo(73),
        deviceImage: 'assets/device-evidence.svg',
        imeiImage: 'assets/imei-evidence.svg',
        deviceFileName: 'device.jpg',
        imeiFileName: 'imei.jpg',
        reviewer: '林清',
        reviewedAt: minutesAgo(68),
        decisionReason: 'IMEI 信息不完整',
        decisionNote: '图片中的 IMEI 后半段被遮挡，无法完成信息比对。',
        paymentStatus: 'blocked'
      }
    ];
  }

  function read() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seeded = seedCases();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
      const cases = JSON.parse(raw);
      return Array.isArray(cases) ? cases : seedCases();
    } catch (error) {
      console.warn('读取审核数据失败，已使用示例数据。', error);
      return seedCases();
    }
  }

  function write(cases) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    window.dispatchEvent(new CustomEvent('riskstore:change', { detail: { cases } }));
    return cases;
  }

  function list() {
    return read().slice();
  }

  function get(id) {
    return read().find((item) => item.id === id) || null;
  }

  function latestForOrder(orderNo) {
    return read()
      .filter((item) => item.orderNo === orderNo)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0] || null;
  }

  function generatedId() {
    const date = new Date();
    const stamp = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('');
    const cases = read();
    const prefix = `RC-${stamp}-`;
    const maxUsed = cases
      .filter((item) => item.id.startsWith(prefix))
      .reduce((max, item) => Math.max(max, Number(item.id.slice(prefix.length)) || 0), 420);
    const next = maxUsed + 1;
    return `RC-${stamp}-${String(next).padStart(4, '0')}`;
  }

  function createFromUpload(payload) {
    const cases = read();
    const submittedAt = new Date().toISOString();
    const newCase = {
      id: generatedId(),
      orderNo: PAYMENT_ORDER.orderNo,
      amount: PAYMENT_ORDER.amount,
      merchant: PAYMENT_ORDER.merchant,
      buyer: PAYMENT_ORDER.buyer,
      buyerAccount: 'wxid_****8k2m',
      method: PAYMENT_ORDER.method,
      status: 'pending',
      riskLevel: 'high',
      riskScore: 82,
      source: '整体风控',
      summary: '用户已重新提交核验资料',
      tags: ['整体风控', '设备资料重传'],
      signals: makeSignals([]),
      deviceModel: 'Onyx X1 Pro · 256GB',
      deviceOs: 'Android 15',
      submittedAt,
      deviceImage: payload.deviceImage,
      imeiImage: payload.imeiImage,
      deviceFileName: payload.deviceFileName || '本机图片.jpg',
      imeiFileName: payload.imeiFileName || 'IMEI 图片.jpg',
      reviewer: null,
      reviewedAt: null,
      decisionReason: '',
      decisionNote: payload.note || '',
      paymentStatus: 'blocked'
    };

    const pendingIndex = cases.findIndex(
      (item) => item.orderNo === PAYMENT_ORDER.orderNo && item.status === 'pending'
    );

    if (pendingIndex >= 0) {
      newCase.id = cases[pendingIndex].id;
      cases[pendingIndex] = newCase;
    } else {
      cases.unshift(newCase);
    }

    write(cases);
    return newCase;
  }

  function approve(id, reviewer, note) {
    const cases = read();
    const index = cases.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const reviewedAt = new Date().toISOString();
    cases[index] = {
      ...cases[index],
      status: 'approved',
      reviewer: reviewer || '林清',
      reviewedAt,
      paidAt: reviewedAt,
      paymentStatus: 'paid',
      decisionReason: '资料一致，审核通过',
      decisionNote: note || '本机照片与 IMEI 信息核对一致。'
    };
    write(cases);
    return cases[index];
  }

  function reject(id, reason, note, reviewer) {
    const cases = read();
    const index = cases.findIndex((item) => item.id === id);
    if (index < 0) return null;
    cases[index] = {
      ...cases[index],
      status: 'rejected',
      reviewer: reviewer || '林清',
      reviewedAt: new Date().toISOString(),
      paymentStatus: 'blocked',
      decisionReason: reason,
      decisionNote: note || ''
    };
    write(cases);
    return cases[index];
  }

  function resetDemo() {
    const cases = seedCases();
    write(cases);
    return cases;
  }

  function formatMoney(amount) {
    return Number(amount).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatDate(value, withYear) {
    if (!value) return '—';
    const date = new Date(value);
    return new Intl.DateTimeFormat('zh-CN', {
      ...(withYear ? { year: 'numeric' } : {}),
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date).replace(/\//g, '-');
  }

  function relativeTime(value) {
    if (!value) return '—';
    const diff = Math.max(0, Date.now() - new Date(value).getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    return formatDate(value);
  }

  function elapsed(value) {
    if (!value) return '00:00';
    const diff = Math.max(0, Date.now() - new Date(value).getTime());
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.RiskStore = {
    STORAGE_KEY,
    PAYMENT_ORDER,
    list,
    get,
    latestForOrder,
    createFromUpload,
    approve,
    reject,
    resetDemo,
    formatMoney,
    formatDate,
    relativeTime,
    elapsed,
    escapeHTML
  };
})();
