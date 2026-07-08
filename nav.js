const siteNavigation = () => {
  // If a page already defines its own <nav> (e.g. a dashboard sidebar),
  // avoid injecting a duplicate navigation to prevent layout conflicts.
  if (document.body.querySelector('nav')) return;
  const links = [
    { href: 'index.html', label: 'Giriş' },
    { href: 'signup.html', label: 'Kayıt' },
    { href: 'assistant.html', label: 'AI Asistan' },
    { href: 'dashboard.html', label: 'Belgeler' },
    { href: 'basvuru.html', label: 'Başvuru' },
    { href: 'roadmap.html', label: 'Yol Haritası' },
    { href: 'translate.html', label: 'Çeviri' },
    { href: 'suretakibi.html', label: 'Süre Takibi' },
    { href: 'kutuphane.html', label: 'Kütüphane' },
    { href: 'risk.html', label: 'Risk' },
    { href: 'profile.html', label: 'Profil' },
    { href: 'acil.html', label: 'Acil' }
  ];

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Site navigation');
  nav.className = 'w-full bg-[#0b1326]/95 backdrop-blur-xl border-b border-[#334155] sticky top-0 z-50';
  nav.innerHTML = `
    <div class="mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 max-w-[1300px]">
      <a href="index.html" class="inline-flex items-center gap-3 text-on-surface font-semibold text-sm sm:text-base">
        <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">gavel</span>
        <span>Hak Rehberi</span>
      </a>
      <div class="flex flex-wrap gap-2 text-xs sm:text-sm">
        ${links.map(link => {
          const isActive = link.href === currentPage;
          return `<a href="${link.href}" class="inline-flex items-center rounded-full border px-3 py-2 transition ${isActive ? 'border-primary bg-primary/15 text-primary' : 'border-transparent text-on-surface-variant hover:border-[#4f76a2] hover:text-on-surface'}">${link.label}</a>`;
        }).join('')}
      </div>
    </div>
  `;

  document.body.insertAdjacentElement('afterbegin', nav);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', siteNavigation);
} else {
  siteNavigation();
}
