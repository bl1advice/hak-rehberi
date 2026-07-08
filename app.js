document.addEventListener('DOMContentLoaded', () => {
  const currentPage = document.body.dataset.page || window.location.pathname.split('/').pop();

  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePassword.innerHTML = `<span class="material-symbols-outlined">${isPassword ? 'visibility_off' : 'visibility'}</span>`;
    });
  }

  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get('registered') === '1') {
    alert('Hesabınız başarıyla oluşturuldu. Lütfen giriş yapın.');
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async event => {
      event.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();
      if (!email || !password) {
        alert('Lütfen e-posta ve şifrenizi giriniz.');
        return;
      }

      const submitButton = loginForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Giriş yapılıyor...';

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        const result = await response.json();
        if (response.ok && result.success) {
          window.location.href = result.redirectUrl || 'assistant.html';
          return;
        }

        alert(result.message || 'Giriş yapılırken bir hata oluştu.');
      } catch (error) {
        console.error('Login error:', error);
        alert('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<span>Giriş Yap</span><span class="material-symbols-outlined text-[20px]">login</span>';
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async event => {
      event.preventDefault();
      const fullName = document.getElementById('full_name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('password_confirm').value;
      const terms = document.getElementById('terms').checked;

      if (!fullName || !email || !password || !confirmPassword) {
        alert('Lütfen tüm alanları doldurun.');
        return;
      }
      if (password !== confirmPassword) {
        alert('Şifreler eşleşmiyor.');
        return;
      }
      if (password.length < 8) {
        alert('Şifre en az 8 karakter olmalıdır.');
        return;
      }
      if (!terms) {
        alert('Kullanım koşullarını kabul etmelisiniz.');
        return;
      }

      const submitButton = document.getElementById('registerButton');
      submitButton.disabled = true;
      submitButton.textContent = 'Kaydediliyor...';

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: fullName,
            email,
            password,
            confirmPassword,
            terms
          })
        });
        const result = await response.json();
        if (response.ok && result.success) {
          window.location.href = result.redirectUrl || 'index.html?registered=1';
          return;
        }

        alert(result.message || 'Kayıt sırasında bir hata oluştu.');
      } catch (error) {
        console.error('Register error:', error);
        alert('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<span>Hesap Oluştur</span><span class="material-symbols-outlined">arrow_forward</span>';
      }
    });
  }

  const chatForm = document.getElementById('chatForm');
  if (chatForm) {
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');

    const addMessage = (text, role) => {
      const wrapper = document.createElement('div');
      wrapper.className = `rounded-3xl p-4 ${role === 'user' ? 'bg-[#0f172a] text-on-surface' : 'bg-[#131b2e] text-on-surface-variant'} border ${role === 'user' ? 'border-[#1e2d4b]' : 'border-[#334155]'}`;
      wrapper.innerHTML = `<p class="text-sm font-semibold mb-2">${role === 'user' ? 'Siz' : 'Hak Rehberi'}</p><p class="text-sm leading-7">${text}</p>`;
      chatMessages.appendChild(wrapper);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const getMockAnswer = question => {
      const normalized = question.toLowerCase();
      if (normalized.includes('kira') || normalized.includes('tahliye')) {
        return 'Kira sözleşmelerinde tahliye süreci, sözleşmede belirtilen fesih şartlarına ve Kira Kanunu’na göre belirlenir. Geçerli fesih bildirim süresi, sözleşmenin türüne göre değişebilir. Kesin sonuç için sözleşmenizi bir uzmanla inceleyin.';
      }
      if (normalized.includes('boşanma') || normalized.includes('velayet') || normalized.includes('nafaka')) {
        return 'Boşanma ve velayet meselelerinde mahkeme, aile birliğinin korunması, çocuğun üstün yararı ve tarafların mali durumu gibi kriterleri dikkate alır. Nafaka miktarı somut olgulara göre belirlenir. Detaylı durum için bir aile hukuku avukatına danışınız.';
      }
      if (normalized.includes('tazminat') || normalized.includes('iş')) {
        return 'İş hukuku tazminatlarında kıdem, ihbar süresi, haksız fesih ve iş sözleşmesinin sona erme koşulları önemlidir. Çalışan hakları geniş kapsamlıdır; bu alandaki hukuki ihtilaflarda avukat desteği almanız önemlidir.';
      }
      if (normalized.includes('miras') || normalized.includes('vasiyet')) {
        return 'Miras paylaşımı ve vasiyetname düzenlemelerinde yasal mirasçı hakları ve atanmış mirasçıların payları belirleyicidir. Miras sözleşmeleri ile vasiyetname içeriklerine dikkat edin ve resmi süreçleri takip edin.';
      }
      return 'Bu konuda genel bir rehberlik sağlayabilirim. Lütfen sorununuzu daha ayrıntılı şekilde açıklayın veya spesifik bir hukuki alan belirtin.';
    };

    chatForm.addEventListener('submit', async event => {
      event.preventDefault();
      const question = chatInput.value.trim();
      if (!question) return;
      addMessage(question, 'user');
      chatInput.value = '';
      const loader = document.createElement('div');
      loader.className = 'rounded-3xl border border-[#334155] bg-[#131b2e] p-4 text-sm text-on-surface-variant';
      loader.innerHTML = '<p class="font-semibold mb-2">Hak Rehberi</p><p class="animate-pulse">Yanıt hazırlanıyor...</p>';
      chatMessages.appendChild(loader);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ question })
        });
        const result = await response.json();
        loader.remove();
        if (response.ok && result.success) {
          addMessage(result.answer, 'assistant');
        } else {
          addMessage('Sorunuz işlenirken bir hata oluştu. Lütfen tekrar deneyin.', 'assistant');
          console.error('Chat hata:', result);
        }
      } catch (error) {
        loader.remove();
        addMessage('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.', 'assistant');
        console.error('Chat request failed:', error);
      }
    });

    document.querySelectorAll('[data-topic]').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        const topic = button.getAttribute('data-topic');
        chatInput.value = `${topic} hakkında bilgi alabilir miyim?`;
        chatInput.focus();
      });
    });
  }

  const analyzeButton = document.getElementById('analyzeButton');
  const analysisInput = document.getElementById('analysisInput');
  const analysisResult = document.getElementById('analysisResult');
  const quickAnalysisButton = document.getElementById('quickAnalysisButton');
  const urgentHelpButton = document.getElementById('urgentHelpButton');

  if (quickAnalysisButton && analysisInput) {
    quickAnalysisButton.addEventListener('click', () => {
      analysisInput.focus();
    });
  }

  if (urgentHelpButton) {
    urgentHelpButton.addEventListener('click', () => {
      window.location.href = 'assistant.html';
    });
  }

  if (analyzeButton && analysisInput && analysisResult) {
    analyzeButton.addEventListener('click', async () => {
      const issue = analysisInput.value.trim();
      if (!issue) {
        alert('Lütfen analiz için hukuki konuyu girin.');
        return;
      }

      analyzeButton.disabled = true;
      analyzeButton.innerHTML = 'Analiz ediliyor...';
      analysisResult.classList.remove('hidden');
      analysisResult.textContent = 'Analiz hazırlanıyor...';

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ issue })
        });
        const result = await response.json();
        if (response.ok && result.success) {
          analysisResult.textContent = result.analysis;
        } else {
          analysisResult.textContent = result.message || 'Analiz sırasında bir hata oluştu.';
          console.error('Analyze hata:', result);
        }
      } catch (error) {
        analysisResult.textContent = 'Sunucuya bağlanılamadı. Lütfen tekrar deneyin.';
        console.error('Analyze request failed:', error);
      } finally {
        analyzeButton.disabled = false;
        analyzeButton.innerHTML = 'Analiz Et';
      }
    });
  }

  const roadmapSend = document.getElementById('roadmapSend');
  const roadmapInput = document.getElementById('roadmapInput');
  const roadmapResult = document.getElementById('roadmapResult');
  const roadmapOverlay = document.getElementById('roadmapOverlay');
  const roadmapPlaceholder = document.getElementById('roadmapPlaceholder');
  const roadmapTrust = document.getElementById('roadmapTrust');
  const roadmapDuration = document.getElementById('roadmapDuration');
  const roadmapLaw = document.getElementById('roadmapLaw');

  if (roadmapSend && roadmapInput && roadmapResult && roadmapOverlay && roadmapPlaceholder) {
    roadmapSend.addEventListener('click', async () => {
      const issue = roadmapInput.value.trim();
      if (!issue || issue.length < 20) {
        alert('Lütfen en az 20 karakterlik hukuki durum bilgisi girin.');
        roadmapInput.focus();
        return;
      }

      roadmapSend.disabled = true;
      roadmapSend.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span>';
      roadmapResult.classList.remove('hidden');
      roadmapPlaceholder.classList.add('hidden');
      roadmapOverlay.classList.add('hidden');
      roadmapResult.textContent = 'Yol haritası hazırlanıyor...';

      try {
        const response = await fetch('/api/roadmap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ issue })
        });
        const result = await response.json();

        if (response.ok && result.success) {
          const parts = result.roadmap.split('\n').filter(Boolean);
          roadmapResult.innerHTML = parts.map(line => `<p class="text-body-md leading-7">${line}</p>`).join('');
          if (roadmapTrust) roadmapTrust.textContent = '85%';
          if (roadmapDuration) roadmapDuration.textContent = '14 Gün';
          if (roadmapLaw) roadmapLaw.textContent = 'İlgili Mevzuat';
        } else {
          roadmapResult.textContent = result.message || 'Yol haritası oluşturulurken bir hata oluştu.';
          console.error('Roadmap hata:', result);
        }
      } catch (error) {
        roadmapResult.textContent = 'Sunucuya bağlanılamadı. Lütfen tekrar deneyin.';
        console.error('Roadmap request failed:', error);
      } finally {
        roadmapSend.disabled = false;
        roadmapSend.innerHTML = '<span class="material-symbols-outlined">send</span>';
      }
    });
  }

  const docTypeButtons = document.querySelectorAll('[data-doc-type]');
  const documentName = document.getElementById('documentName');
  const documentTc = document.getElementById('documentTc');
  const documentMuhatap = document.getElementById('documentMuhatap');
  const documentSubject = document.getElementById('documentSubject');
  const fillAiButton = document.getElementById('fillAiButton');
  const copyDocButton = document.getElementById('copyDocButton');
  const saveDocButton = document.getElementById('saveDocButton');
  const documentPreviewText = document.getElementById('documentPreviewText');

  let selectedDocType = 'İhtarname';

  docTypeButtons.forEach(button => {
    button.addEventListener('click', () => {
      selectedDocType = button.getAttribute('data-doc-type');
      docTypeButtons.forEach(btn => btn.classList.remove('border-primary', 'bg-background'));
      button.classList.add('border-primary', 'bg-background');
    });
  });

  const buildDocumentPayload = () => ({
    type: selectedDocType,
    name: documentName?.value.trim(),
    tc: documentTc?.value.trim(),
    muhatap: documentMuhatap?.value.trim(),
    subject: documentSubject?.value.trim()
  });

  const updateDocumentPreview = (text) => {
    if (documentPreviewText) {
      documentPreviewText.textContent = text;
    }
  };

  if (fillAiButton) {
    fillAiButton.addEventListener('click', async () => {
      const payload = buildDocumentPayload();
      if (!payload.name || !payload.muhatap || !payload.subject) {
        alert('Lütfen ad, muhatap ve konu özeti alanlarını doldurun.');
        return;
      }

      fillAiButton.disabled = true;
      fillAiButton.textContent = 'Oluşturuluyor...';

      try {
        const response = await fetch('/api/document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (response.ok && result.success) {
          updateDocumentPreview(result.document);
        } else {
          updateDocumentPreview(result.message || 'Belge oluşturulurken bir hata oluştu.');
          console.error('Document hata:', result);
        }
      } catch (error) {
        updateDocumentPreview('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
        console.error('Document request failed:', error);
      } finally {
        fillAiButton.disabled = false;
        fillAiButton.innerHTML = '<span class="material-symbols-outlined text-[16px]">magic_button</span> AI İle Doldur';
      }
    });
  }

  if (copyDocButton) {
    copyDocButton.addEventListener('click', async () => {
      if (!documentPreviewText) return;
      try {
        await navigator.clipboard.writeText(documentPreviewText.textContent || '');
        alert('Belge metni panoya kopyalandı.');
      } catch (error) {
        alert('Panoya kopyalanamadı. Lütfen tarayıcı izinlerinizi kontrol edin.');
      }
    });
  }

  if (saveDocButton) {
    saveDocButton.addEventListener('click', async () => {
      if (!documentPreviewText) return;
      saveDocButton.disabled = true;
      saveDocButton.textContent = 'Kaydediliyor...';
      try {
        const response = await fetch('/api/document/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: selectedDocType, document: documentPreviewText.textContent || '' })
        });
        const result = await response.json();
        if (response.ok && result.success) {
          alert('Belge başarıyla kaydedildi.');
        } else {
          alert(result.message || 'Belge kaydedilemedi.');
        }
      } catch (error) {
        alert('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
        console.error('Save document request failed:', error);
      } finally {
        saveDocButton.disabled = false;
        saveDocButton.innerHTML = '<span class="material-symbols-outlined text-[18px]">save</span> Belgelerime Kaydet';
      }
    });
  }

  const translateButton = document.getElementById('translateButton');
  const translateInput = document.getElementById('translateInput');
  const translationPlaceholder = document.getElementById('translationPlaceholder');
  const translationResult = document.getElementById('translationResult');

  if (translateButton && translateInput && translationResult && translationPlaceholder) {
    translateButton.addEventListener('click', async () => {
      const text = translateInput.value.trim();
      if (!text) {
        alert('Lütfen çevirmek istediğiniz hukuki metni girin.');
        translateInput.focus();
        return;
      }

      translateButton.disabled = true;
      translateButton.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span> Çeviriliyor...';
      translationPlaceholder.textContent = 'Metin sadeleştiriliyor...';
      translationResult.classList.add('hidden');
      translationPlaceholder.classList.remove('hidden');

      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        const result = await response.json();
        if (response.ok && result.success) {
          translationResult.innerHTML = `<p class="font-body-md text-body-md text-on-surface leading-7 whitespace-pre-wrap">${result.translation}</p>`;
          translationResult.classList.remove('hidden');
          translationPlaceholder.classList.add('hidden');
        } else {
          translationPlaceholder.textContent = result.message || 'Çeviri sırasında bir hata oluştu.';
          translationResult.classList.add('hidden');
          console.error('Translate hata:', result);
        }
      } catch (error) {
        translationPlaceholder.textContent = 'Sunucuya bağlanılamadı. Lütfen tekrar deneyin.';
        translationResult.classList.add('hidden');
        console.error('Translate request failed:', error);
      } finally {
        translateButton.disabled = false;
        translateButton.innerHTML = '<span class="material-symbols-outlined">auto_awesome</span> Sade Türkçeye Çevir';
      }
    });
  }

  // Süre Takibi - reminders frontend
  const reminderForm = document.getElementById('reminderForm');
  const reminderTitle = document.getElementById('reminderTitle');
  const reminderDate = document.getElementById('reminderDate');
  const reminderPriority = document.getElementById('reminderPriority');
  const reminderNotes = document.getElementById('reminderNotes');
  const addReminderBtn = document.getElementById('addReminderBtn');
  const reminderList = document.getElementById('reminderList');

  const renderReminders = (items) => {
    if (!reminderList) return;
    reminderList.innerHTML = '';
    if (!items || items.length === 0) {
      reminderList.innerHTML = '<p class="text-on-surface-variant">Kayıtlı süre yok.</p>';
      return;
    }
    items.forEach(it => {
      const el = document.createElement('div');
      el.className = 'bg-surface-container border border-outline-variant/50 rounded-lg p-4 relative group hover:bg-surface-container-high transition-colors';
      el.innerHTML = `<h4 class="font-headline-md text-body-md font-semibold text-on-surface mb-1">${it.title} — ${it.date}</h4><p class="font-body-sm text-sm text-on-surface-variant">${it.notes || ''}</p><button data-id="${it.id}" class="deleteReminder absolute top-4 right-4 bg-surface-container-highest hover:bg-outline-variant text-on-surface text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Sil</button>`;
      reminderList.appendChild(el);
    });
    document.querySelectorAll('.deleteReminder').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.getAttribute('data-id');
        try {
          const response = await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
          const result = await response.json();
          if (response.ok && result.success) {
            loadReminders();
          } else {
            alert(result.message || 'Silme işleminde hata.');
          }
        } catch (err) {
          // fallback to localStorage
          const local = JSON.parse(localStorage.getItem('reminders') || '[]').filter(r => r.id !== id);
          localStorage.setItem('reminders', JSON.stringify(local));
          renderReminders(local);
        }
      });
    });
  };

  const loadReminders = async () => {
    if (!reminderList) return;
    try {
      const response = await fetch('/api/reminders');
      const result = await response.json();
      if (response.ok && result.success) {
        renderReminders(result.reminders);
        localStorage.setItem('reminders', JSON.stringify(result.reminders));
        return;
      }
    } catch (err) {
      // ignore, fallback to localStorage
    }
    const local = JSON.parse(localStorage.getItem('reminders') || '[]');
    renderReminders(local);
  };

  if (addReminderBtn) {
    addReminderBtn.addEventListener('click', async () => {
      const title = reminderTitle.value.trim();
      const date = reminderDate.value.trim();
      const priority = reminderPriority.value;
      const notes = reminderNotes.value.trim();
      if (!title || !date) {
        alert('Lütfen başlık ve tarih girin.');
        return;
      }
      addReminderBtn.disabled = true;
      addReminderBtn.textContent = 'Ekleniyor...';
      try {
        const response = await fetch('/api/reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, date, priority, notes })
        });
        const result = await response.json();
        if (response.ok && result.success) {
          reminderTitle.value = '';
          reminderDate.value = '';
          reminderNotes.value = '';
          await loadReminders();
        } else {
          alert(result.message || 'Eklerken hata oluştu.');
        }
      } catch (err) {
        // fallback to localStorage
        const local = JSON.parse(localStorage.getItem('reminders') || '[]');
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const item = { id, title, date, priority, notes, createdAt: Date.now() };
        local.push(item);
        localStorage.setItem('reminders', JSON.stringify(local));
        renderReminders(local);
      } finally {
        addReminderBtn.disabled = false;
        addReminderBtn.innerHTML = 'Süreyi Takvime Ekle';
      }
    });
  }

  // initialize
  loadReminders();

  // Başvuru Rehberi - search, filters, details
  const searchInput = document.getElementById('searchInput');
  const filterBar = document.getElementById('filterBar');
  const filterButtons = document.querySelectorAll('.filterBtn');
  const detailsModal = document.createElement('div');
  detailsModal.id = 'detailsModal';
  detailsModal.className = 'fixed inset-0 bg-black/50 hidden items-center justify-center z-50';
  detailsModal.innerHTML = `<div class="bg-surface-container p-6 rounded-lg max-w-2xl w-full mx-4 relative"><button id="closeDetails" class="absolute top-3 right-3 text-on-surface-variant">Kapat</button><h3 id="detailsTitle" class="font-headline-md text-headline-md mb-3"></h3><div id="detailsBody" class="text-body-md text-on-surface-variant mb-4"></div><div class="flex gap-2"><button id="addReminderFromDetails" class="bg-primary-container text-on-primary-container px-4 py-2 rounded">Hatırlatma Ekle</button><a id="openInCalendar" class="ml-auto text-primary underline" href="#">Takvime Git</a></div></div>`;
  document.body.appendChild(detailsModal);
  const addReminderFromDetails = document.getElementById('addReminderFromDetails');

  const openModal = (title, body) => {
    document.getElementById('detailsTitle').textContent = title;
    document.getElementById('detailsBody').innerHTML = body;
    detailsModal.classList.remove('hidden');
    detailsModal.classList.add('flex');
  };
  const closeModal = () => {
    detailsModal.classList.remove('flex');
    detailsModal.classList.add('hidden');
  };
  document.getElementById('closeDetails').addEventListener('click', closeModal);

  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('.detailsBtn');
    if (btn) {
      const article = btn.closest('article');
      const title = article ? (article.querySelector('h3') ? article.querySelector('h3').textContent : '') : '';
      const paras = article ? Array.from(article.querySelectorAll('p')).map(p => `<p>${p.innerHTML}</p>`).join('') : '';
      openModal(title, paras);
    }
  });

  if (addReminderFromDetails) {
    addReminderFromDetails.addEventListener('click', async () => {
      const title = document.getElementById('detailsTitle').textContent || 'Başvuru Hatırlatması';
      const date = prompt('Hatırlatma tarihi girin (gg.aa.yyyy):');
      if (!date) return alert('Tarih gerekli.');
      try {
        const res = await fetch('/api/reminders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, date, priority: 'high' }) });
        const data = await res.json();
        if (res.ok && data.success) {
          alert('Hatırlatma eklendi.');
          closeModal();
          loadReminders();
        } else {
          alert(data.message || 'Hatırlatma eklenemedi.');
        }
      } catch (err) {
        alert('Sunucuya bağlanılamadı.');
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      document.querySelectorAll('article').forEach(article => {
        const text = (article.textContent || '').toLowerCase();
        article.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('bg-primary-container', 'text-white'));
      btn.classList.add('bg-primary-container', 'text-white');
      const f = btn.getAttribute('data-filter');
      if (f === 'all') {
        document.querySelectorAll('article').forEach(a => a.style.display = '');
        return;
      }
      document.querySelectorAll('article').forEach(a => {
        const title = a.querySelector('h3') ? a.querySelector('h3').textContent.toLowerCase() : '';
        a.style.display = title.includes(f) ? '' : 'none';
      });
    });
  });

  // Library page handlers (search, accordion, category filter)
  const librarySearch = document.getElementById('librarySearch');
  const libraryList = document.getElementById('libraryList');
  const accordionBtns = document.querySelectorAll('.accordionBtn');
  const categoryButtons = document.querySelectorAll('[data-category]');

  if (librarySearch && libraryList) {
    librarySearch.addEventListener('input', () => {
      const q = librarySearch.value.trim().toLowerCase();
      Array.from(libraryList.querySelectorAll('.accordionBtn')).forEach(btn => {
        const text = (btn.textContent || '').toLowerCase();
        const wrapper = btn.closest('div');
        if (text.includes(q)) wrapper.style.display = '';
        else wrapper.style.display = 'none';
      });
    });
  }

  accordionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('div');
      const content = parent.querySelector('.accordionContent');
      if (!content) return;
      const icon = btn.querySelector('.material-symbols-outlined');
      const hidden = content.classList.toggle('hidden');
      if (icon) icon.style.transform = hidden ? '' : 'rotate(180deg)';
    });
  });

  categoryButtons.forEach(catBtn => {
    catBtn.addEventListener('click', () => {
      const cat = catBtn.getAttribute('data-category');
      // simple filter: show all (no tag metadata on items), placeholder behavior
      alert(`Kategori filtreleme: ${cat} (örnek davranış)`);
    });
  });

  // Risk Analizi - client-side rule-based risk scoring
  const riskForm = document.getElementById('riskForm');
  const riskTopic = document.getElementById('riskTopic');
  const runRiskBtn = document.getElementById('runRisk');
  const riskResult = document.getElementById('riskResult');
  const riskProgress = document.getElementById('riskProgress');
  const riskDetails = document.getElementById('riskDetails');
  const riskLevelBadge = document.getElementById('riskLevelBadge');
  const varSozlesme = document.getElementById('varSozlesme');
  const gonderildiIhtar = document.getElementById('gonderildiIhtar');
  const depozitoBank = document.getElementById('depozitoBank');

  if (riskForm && runRiskBtn && riskResult && riskProgress && riskDetails) {
    const topicLabels = {
      kira: 'Kira Tahliye Talebi ve Depozito Uyuşmazlığı',
      isci: 'İşçi Alacakları ve İşe İade',
      tuketici: 'Tüketici Hakem Heyeti Başvurusu'
    };

    runRiskBtn.addEventListener('click', () => {
      const topic = riskTopic ? riskTopic.value : 'kira';
      const hasContract = !!(varSozlesme && varSozlesme.checked);
      const hasNoticeSent = !!(gonderildiIhtar && gonderildiIhtar.checked);
      const depositViaBank = !!(depozitoBank && depozitoBank.checked);

      // Start from a baseline risk score and reduce it as protective factors are confirmed.
      let score = 85;
      const missing = [];
      const strengths = [];

      if (hasContract) {
        score -= 20;
        strengths.push('Yazılı kira sözleşmesi mevcut.');
      } else {
        missing.push('Yazılı bir kira sözleşmesi bulunmuyor; sözlü anlaşmalar ispat açısından zayıftır.');
      }

      if (hasNoticeSent) {
        score -= 15;
        strengths.push('Ev sahibi tarafından noter ihtarnamesi gönderilmiş.');
      } else {
        missing.push('Noterden gönderilmiş bir ihtarname bulunmuyor; süreç henüz resmiyet kazanmamış olabilir.');
      }

      if (depositViaBank) {
        score -= 20;
        strengths.push('Depozito banka açıklamasıyla gönderilmiş, bu güçlü bir delildir.');
      } else {
        missing.push('Depozitonun banka açıklamasıyla gönderildiğine dair bir kayıt yok; bu durum ispatı zorlaştırabilir.');
      }

      score = Math.max(5, Math.min(95, score));

      let levelLabel = 'KRİTİK RİSK SEVİYESİ';
      let levelClasses = 'bg-error-container/20 text-error border border-error/30 px-3 py-1 rounded font-label-md';
      let barColor = '#f87171';
      if (score <= 35) {
        levelLabel = 'DÜŞÜK RİSK SEVİYESİ';
        barColor = '#4ade80';
        levelClasses = 'bg-secondary-container/20 text-secondary border border-secondary/30 px-3 py-1 rounded font-label-md';
      } else if (score <= 60) {
        levelLabel = 'ORTA RİSK SEVİYESİ';
        barColor = '#facc15';
        levelClasses = 'bg-tertiary-container/20 text-tertiary border border-tertiary/30 px-3 py-1 rounded font-label-md';
      }

      if (riskLevelBadge) {
        riskLevelBadge.textContent = levelLabel;
        riskLevelBadge.className = levelClasses;
      }

      riskProgress.style.width = `${score}%`;
      riskProgress.style.backgroundColor = barColor;

      riskResult.innerHTML = `<p class="font-body-md text-body-md text-on-surface">
        <strong>${topicLabels[topic] || 'Seçili Konu'}</strong> için hesaplanan risk puanı: <strong>${score}/100</strong>.
      </p>`;

      const detailBlocks = [];
      if (strengths.length) {
        detailBlocks.push(
          `<div class="mb-4"><h4 class="font-headline-md text-headline-md text-on-surface mb-2">Güçlü Yönler</h4><ul class="list-disc list-inside space-y-1 text-on-surface-variant">${strengths
            .map(s => `<li>${s}</li>`)
            .join('')}</ul></div>`
        );
      }
      if (missing.length) {
        detailBlocks.push(
          `<div><h4 class="font-headline-md text-headline-md text-on-surface mb-2">Eksiklikler ve Öneriler</h4><ul class="list-disc list-inside space-y-1 text-on-surface-variant">${missing
            .map(m => `<li>${m}</li>`)
            .join('')}</ul></div>`
        );
      }
      riskDetails.innerHTML = detailBlocks.join('');
    });
  }

  // Delil Yönetimi (Evidence management) - localStorage based CRUD
  const evidenceTitle = document.getElementById('evidenceTitle');
  const evidenceCategory = document.getElementById('evidenceCategory');
  const evidenceDate = document.getElementById('evidenceDate');
  const evidenceFile = document.getElementById('evidenceFile');
  const evidenceNotes = document.getElementById('evidenceNotes');
  const addEvidenceBtn = document.getElementById('addEvidenceBtn');
  const evidenceList = document.getElementById('evidenceList');
  const evidenceSearch = document.getElementById('evidenceSearch');
  const evidenceFilterButtons = document.querySelectorAll('.evidenceFilterBtn');
  const evidenceDetailModal = document.getElementById('evidenceDetailModal');

  if (evidenceList) {
    const EVIDENCE_KEY = 'evidenceItems';
    const categoryLabels = {
      belge: 'Yazılı Belge',
      fotograf: 'Fotoğraf',
      kayit: 'Ses/Görüntü Kaydı',
      tanik: 'Tanık Beyanı',
      diger: 'Diğer'
    };
    let activeFilter = 'all';

    const getEvidenceItems = () => JSON.parse(localStorage.getItem(EVIDENCE_KEY) || '[]');
    const saveEvidenceItems = items => localStorage.setItem(EVIDENCE_KEY, JSON.stringify(items));

    const renderEvidenceList = () => {
      const items = getEvidenceItems();
      const query = (evidenceSearch && evidenceSearch.value || '').trim().toLowerCase();
      const filtered = items.filter(item => {
        const matchesFilter = activeFilter === 'all' || item.category === activeFilter;
        const matchesQuery = !query || (item.title + ' ' + (item.notes || '')).toLowerCase().includes(query);
        return matchesFilter && matchesQuery;
      });

      if (filtered.length === 0) {
        evidenceList.innerHTML = '<div class="col-span-2 bg-surface-container rounded-xl border border-outline-variant p-8 text-center text-on-surface-variant">Henüz delil eklenmedi. Soldaki formu kullanarak ilk delilinizi ekleyin.</div>';
        return;
      }

      evidenceList.innerHTML = filtered
        .slice()
        .reverse()
        .map(item => {
          const label = categoryLabels[item.category] || 'Diğer';
          const fileIcon = item.fileName ? '<span class="material-symbols-outlined text-on-surface-variant text-lg" title="' + item.fileName + '">attach_file</span>' : '';
          return '<div class="evidenceCard bg-surface-container rounded-xl border border-outline-variant p-5 hover:border-primary/50 transition-colors cursor-pointer" data-id="' + item.id + '">' +
            '<div class="flex items-center justify-between mb-2"><span class="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">' + label + '</span>' + fileIcon + '</div>' +
            '<h4 class="font-headline-md font-semibold text-on-surface">' + item.title + '</h4>' +
            '<p class="text-body-sm text-on-surface-variant mt-1">' + (item.date || 'Tarih belirtilmedi') + '</p>' +
            '</div>';
        })
        .join('');

      document.querySelectorAll('.evidenceCard').forEach(card => {
        card.addEventListener('click', () => openEvidenceDetail(card.getAttribute('data-id')));
      });
    };

    const closeEvidenceDetail = () => {
      if (!evidenceDetailModal) return;
      evidenceDetailModal.classList.remove('flex');
      evidenceDetailModal.classList.add('hidden');
    };

    const openEvidenceDetail = id => {
      const items = getEvidenceItems();
      const item = items.find(it => it.id === id);
      if (!item || !evidenceDetailModal) return;
      document.getElementById('evidenceDetailTitle').textContent = item.title;
      document.getElementById('evidenceDetailMeta').textContent = (categoryLabels[item.category] || 'Diğer') + ' • ' + (item.date || 'Tarih belirtilmedi');
      document.getElementById('evidenceDetailNotes').textContent = item.notes || 'Not eklenmedi.';
      const fileContainer = document.getElementById('evidenceDetailFile');
      if (item.fileDataUrl && item.fileType && item.fileType.indexOf('image/') === 0) {
        fileContainer.innerHTML = '<img src="' + item.fileDataUrl + '" class="max-h-64 rounded-lg border border-outline-variant" alt="' + (item.fileName || '') + '">';
      } else if (item.fileName) {
        fileContainer.innerHTML = '<div class="flex items-center gap-2 text-on-surface-variant bg-surface-container-low rounded-lg p-3"><span class="material-symbols-outlined">description</span>' + item.fileName + '</div>';
      } else {
        fileContainer.innerHTML = '';
      }
      const deleteBtn = document.getElementById('deleteEvidenceBtn');
      deleteBtn.onclick = () => {
        if (!confirm('Bu delili silmek istediğinize emin misiniz?')) return;
        const remaining = getEvidenceItems().filter(it => it.id !== id);
        saveEvidenceItems(remaining);
        closeEvidenceDetail();
        renderEvidenceList();
      };
      evidenceDetailModal.classList.remove('hidden');
      evidenceDetailModal.classList.add('flex');
    };

    const closeBtn = document.getElementById('closeEvidenceDetail');
    if (closeBtn) closeBtn.addEventListener('click', closeEvidenceDetail);
    if (evidenceDetailModal) {
      evidenceDetailModal.addEventListener('click', event => {
        if (event.target === evidenceDetailModal) closeEvidenceDetail();
      });
    }

    const readFileAsDataUrl = file =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    if (addEvidenceBtn) {
      addEvidenceBtn.addEventListener('click', async () => {
        const title = evidenceTitle.value.trim();
        if (!title) {
          alert('Lütfen delil için bir başlık girin.');
          evidenceTitle.focus();
          return;
        }
        const item = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
          title,
          category: evidenceCategory.value,
          date: evidenceDate.value.trim(),
          notes: evidenceNotes.value.trim(),
          createdAt: Date.now()
        };

        const file = evidenceFile.files && evidenceFile.files[0];
        if (file) {
          item.fileName = file.name;
          item.fileType = file.type;
          // Only inline small files (< 2MB) as data URLs to keep localStorage usable
          if (file.size < 2 * 1024 * 1024) {
            try {
              item.fileDataUrl = await readFileAsDataUrl(file);
            } catch (err) {
              console.error('Dosya okunamadı:', err);
            }
          }
        }

        const items = getEvidenceItems();
        items.push(item);
        saveEvidenceItems(items);

        evidenceTitle.value = '';
        evidenceDate.value = '';
        evidenceNotes.value = '';
        evidenceFile.value = '';
        renderEvidenceList();
      });
    }

    if (evidenceSearch) {
      evidenceSearch.addEventListener('input', renderEvidenceList);
    }

    evidenceFilterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        activeFilter = btn.getAttribute('data-filter');
        evidenceFilterButtons.forEach(b => {
          b.classList.remove('bg-primary-container', 'text-white');
          b.classList.add('bg-surface-container', 'text-on-surface-variant');
        });
        btn.classList.remove('bg-surface-container', 'text-on-surface-variant');
        btn.classList.add('bg-primary-container', 'text-white');
        renderEvidenceList();
      });
    });

    renderEvidenceList();
  }
});
