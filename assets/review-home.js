(function () {
  const cases = RiskStore.list();
  const counts = cases.reduce((result, item) => {
    result[item.status] = (result[item.status] || 0) + 1;
    return result;
  }, { pending: 0, approved: 0, rejected: 0 });

  document.querySelectorAll('[data-count]').forEach((node) => {
    node.textContent = counts[node.dataset.count] || 0;
  });

  document.querySelectorAll('[data-record-total]').forEach((node) => {
    node.textContent = counts.approved + counts.rejected;
  });
})();
