(function () {
  const paths = {
    'arrow-left': '<path d="M15 18l-6-6 6-6"/><path d="M9 12h12"/>',
    'arrow-right': '<path d="M9 6l6 6-6 6"/><path d="M3 12h12"/>',
    'chevron-right': '<path d="M9 18l6-6-6-6"/>',
    'chevron-down': '<path d="M6 9l6 6 6-6"/>',
    'shield': '<path d="M12 3l7 3v5.8c0 4.5-2.9 8.1-7 9.2-4.1-1.1-7-4.7-7-9.2V6l7-3z"/>',
    'shield-check': '<path d="M12 3l7 3v5.8c0 4.5-2.9 8.1-7 9.2-4.1-1.1-7-4.7-7-9.2V6l7-3z"/><path d="M9 12.2l2 2 4-4.4"/>',
    'shield-alert': '<path d="M12 3l7 3v5.8c0 4.5-2.9 8.1-7 9.2-4.1-1.1-7-4.7-7-9.2V6l7-3z"/><path d="M12 7.4v4.8"/><path d="M12 15.8h.01"/>',
    'lock': '<rect x="4.5" y="10" width="15" height="11" rx="3"/><path d="M8 10V7.5a4 4 0 018 0V10"/><path d="M12 14.5v2.5"/>',
    'alert-triangle': '<path d="M10.3 4.2L2.8 17.1A2 2 0 004.5 20h15a2 2 0 001.7-2.9L13.7 4.2a2 2 0 00-3.4 0z"/><path d="M12 9v4.5"/><path d="M12 17h.01"/>',
    'alert-circle': '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V13"/><path d="M12 16.5h.01"/>',
    'check': '<path d="M5 12.5l4.2 4.2L19 6.8"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="M8 12.4l2.6 2.6L16.5 9"/>',
    'x': '<path d="M6 6l12 12M18 6L6 18"/>',
    'x-circle': '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
    'camera': '<path d="M4 8.5h3l1.3-2h7.4l1.3 2h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1v-9a1 1 0 011-1z"/><circle cx="12" cy="14" r="3.5"/>',
    'image': '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9" r="1.5"/><path d="M4 17l4.8-4.8a1.5 1.5 0 012.1 0L17 18.2"/><path d="M14 15l2-2a1.5 1.5 0 012.1 0L21 16"/>',
    'upload': '<path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/>',
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    'refresh': '<path d="M20 11a8 8 0 10-2.3 5.7"/><path d="M20 5v6h-6"/>',
    'headset': '<path d="M4 14v-2a8 8 0 0116 0v2"/><path d="M4 14h2a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM20 14h-2a1 1 0 00-1 1v3a1 1 0 001 1h1a1 1 0 001-1v-4z"/><path d="M18 19.3c0 1.2-1.4 2.2-3.5 2.2"/>',
    'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.8h.01"/>',
    'search': '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
    'bell': '<path d="M18 8a6 6 0 00-12 0c0 7-2.5 7-2.5 8.5h17C20.5 15 18 15 18 8z"/><path d="M9.8 20a2.5 2.5 0 004.4 0"/>',
    'grid': '<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>',
    'inbox': '<path d="M4.5 5.5h15L21 13v5a1 1 0 01-1 1H4a1 1 0 01-1-1v-5l1.5-7.5z"/><path d="M3 13h5l1.5 2h5l1.5-2h5"/>',
    'history': '<path d="M4 6v5h5"/><path d="M5.4 10.2A8 8 0 1112 20a8 8 0 01-6.6-3.5"/><path d="M12 8v5l3 1.7"/>',
    'sliders': '<path d="M4 6h8M16 6h4M4 12h3M11 12h9M4 18h9M17 18h3"/><circle cx="14" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="18" r="2"/>',
    'users': '<path d="M16 20v-1.5a4.5 4.5 0 00-4.5-4.5h-3A4.5 4.5 0 004 18.5V20"/><circle cx="10.5" cy="7.5" r="3.5"/><path d="M16 4.2a3.5 3.5 0 010 6.6"/><path d="M18 14.2a4.5 4.5 0 013 4.2V20"/>',
    'more': '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    'download': '<path d="M12 4v12"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/>',
    'expand': '<path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/>',
    'file-text': '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 12h6M9 16h6"/>',
    'credit-card': '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18"/><path d="M7 15h4"/>',
    'smartphone': '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10 5h4"/><path d="M11 18.5h2"/>',
    'scan': '<path d="M4 9V5a1 1 0 011-1h4M15 4h4a1 1 0 011 1v4M20 15v4a1 1 0 01-1 1h-4M9 20H5a1 1 0 01-1-1v-4"/><path d="M8 12h8"/>',
    'eye': '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.7"/>',
    'external': '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 13v6a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h6"/>',
    'user': '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
    'phone': '<path d="M6.2 3h3l1.5 4-2 1.5a14 14 0 006.8 6.8l1.5-2 4 1.5v3a1.3 1.3 0 01-1.4 1.3A17.6 17.6 0 013.7 4.4A1.3 1.3 0 015 3h1.2z"/>',
    'calendar': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01"/>',
    'filter': '<path d="M4 6h16M7 12h10M10 18h4"/>',
    'arrow-up-right': '<path d="M7 17L17 7"/><path d="M8 7h9v9"/>',
    'activity': '<path d="M3 12h4l2.2-6 4.2 12 2.3-6H21"/>',
    'copy': '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
    'shield-lock': '<path d="M12 3l7 3v5.8c0 4.5-2.9 8.1-7 9.2-4.1-1.1-7-4.7-7-9.2V6l7-3z"/><rect x="9" y="10" width="6" height="5.5" rx="1.3"/><path d="M10.5 10V8.7a1.5 1.5 0 013 0V10"/>'
    ,'play': '<path d="M8 5.5v13l10-6.5L8 5.5z"/>'
  };

  const iconAliases = {
    'arrow': 'arrow-left',
    'security': 'shield-lock'
  };

  function get(name, className) {
    const key = iconAliases[name] || name;
    const content = paths[key];
    if (!content) return '';
    return `<svg class="icon ${className || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;
  }

  function render(root) {
    (root || document).querySelectorAll('[data-icon]').forEach((node) => {
      if (node.dataset.iconReady === 'true') return;
      const markup = get(node.dataset.icon, node.dataset.iconClass || '');
      if (!markup) return;
      node.innerHTML = markup;
      node.dataset.iconReady = 'true';
      node.classList.add('icon-slot');
    });
  }

  window.Icons = { get, render };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => render());
  } else {
    render();
  }
})();
