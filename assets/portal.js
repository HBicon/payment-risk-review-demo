(function () {
  function updateCounts() {
    const cases = RiskStore.list();
    const pending = cases.filter((item) => item.status === 'pending').length;
    document.querySelectorAll('[data-live-pending]').forEach((node) => {
      node.textContent = pending;
    });
  }

  const resetButton = document.getElementById('resetDemo');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      RiskStore.resetDemo();
      updateCounts();
      resetButton.textContent = '已重置';
      window.setTimeout(() => {
        resetButton.textContent = '重置演示数据';
      }, 1600);
    });
  }

  updateCounts();
})();
