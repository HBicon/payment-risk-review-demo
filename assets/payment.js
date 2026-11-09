(function () {
  const qr = document.getElementById('paymentQr');
  const dialog = document.getElementById('riskDialog');

  function seededRandom(seed) {
    let value = seed % 2147483647;
    if (value <= 0) value += 2147483646;
    return function () {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  }

  function buildQrPlaceholder() {
    if (!qr) return;
    const size = 37;
    const modules = document.createElement('div');
    modules.className = 'qr-grid';
    modules.setAttribute('aria-hidden', 'true');
    const random = seededRandom(9852);

    function isFinder(row, col) {
      const inSquare = (startRow, startCol) => {
        if (row < startRow || row > startRow + 6 || col < startCol || col > startCol + 6) return false;
        const localRow = row - startRow;
        const localCol = col - startCol;
        const border = localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6;
        const center = localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4;
        return border || center;
      };
      return inSquare(1, 1) || inSquare(1, size - 8) || inSquare(size - 8, 1);
    }

    function isReserved(row, col) {
      const nearFinder = (startRow, startCol) =>
        row >= startRow - 1 && row <= startRow + 7 && col >= startCol - 1 && col <= startCol + 7;
      const timing = (row === 7 && col >= 8 && col <= size - 9) || (col === 7 && row >= 8 && row <= size - 9);
      const centerLogo = row >= 15 && row <= 21 && col >= 15 && col <= 21;
      return nearFinder(1, 1) || nearFinder(1, size - 8) || nearFinder(size - 8, 1) || timing || centerLogo;
    }

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const cell = document.createElement('span');
        cell.className = 'qr-module';
        if (isFinder(row, col) || (!isReserved(row, col) && random() > 0.53)) {
          cell.classList.add('is-dark');
        }
        modules.appendChild(cell);
      }
    }
    qr.replaceWith(modules);
  }

  function openRiskDialog() {
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = 'hidden';
  }

  function closeRiskDialog() {
    if (!dialog || !dialog.open) return;
    dialog.close();
  }

  buildQrPlaceholder();
  document.querySelectorAll('[data-open-risk]').forEach((button) => {
    button.addEventListener('click', openRiskDialog);
  });

  document.querySelectorAll('[data-close-risk]').forEach((button) => {
    button.addEventListener('click', closeRiskDialog);
  });

  if (dialog) {
    dialog.addEventListener('close', () => {
      document.body.style.overflow = '';
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeRiskDialog();
    });
    window.setTimeout(openRiskDialog, 420);
  }

  const helpButton = document.getElementById('helpButton');
  if (helpButton) {
    helpButton.addEventListener('click', () => {
      const support = document.querySelector('.support-pill');
      if (support) support.focus();
    });
  }
})();
