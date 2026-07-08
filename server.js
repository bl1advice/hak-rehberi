require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const users = [];
const reminders = [];
const savedDocuments = [];

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => ({
  salt,
  hash: crypto.scryptSync(password, salt, 64).toString('hex')
});

const verifyPassword = (password, user) =>
  crypto.scryptSync(password, user.salt, 64).toString('hex') === user.hash;

// Seed demo user for quick testing (after hashPassword is defined)
(() => {
  try {
    const demoEmail = 'demo@demo.local';
    const demoPassword = 'demodemo123';
    const { salt, hash } = hashPassword(demoPassword);
    users.push({ name: 'Demo Kullanıcı', email: demoEmail, salt, hash, createdAt: Date.now(), demo: true });
    // Seed demo reminders and documents
    reminders.push({ id: 'r1', title: 'Dava dilekçesi hazırlanması', date: '2026-08-01', priority: 'high', notes: 'Deliller toplanacak', createdAt: Date.now() });
    reminders.push({ id: 'r2', title: 'Kira sözleşmesi incelemesi', date: '2026-07-20', priority: 'medium', notes: 'Sözleşme eki kontrol edilecek', createdAt: Date.now() });
    savedDocuments.push({ id: 'd1', name: 'İhtarname Örneği', type: 'ihtarname', generatedAt: Date.now(), owner: demoEmail });
    savedDocuments.push({ id: 'd2', name: 'Boşanma Bilgi Notu', type: 'bilgi', generatedAt: Date.now(), owner: demoEmail });
    console.log('Demo user seeded:', demoEmail);
  } catch (e) {
    console.error('Demo seed failed', e);
  }
})();

const getMockAnswer = question => {
  const normalized = question.toLowerCase();
  if (normalized.includes('kira') || normalized.includes('tahliye')) {
    return 'Kira sözleşmelerinde tahliye süreci, sözleşmede belirtilen fesih şartlarına ve Kira Kanunu\'na göre belirlenir. Geçerli fesih bildirim süresi, sözleşmenin türüne göre değişebilir. Kesin sonuç için sözleşmenizi bir uzmanla inceleyin.';
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

const getMockRoadmap = issue => {
  return `1. Durumu netleştirin: ${issue.slice(0, 120)}...\n2. İlgili tarafları belirleyin: Olayla doğrudan ilgisi olan kişileri, belgeleri ve tarihleri listeleyin.\n3. Kanuni dayanak oluşturun: Olayınızın hangi kanun maddeleri, sözleşme şartları veya mevzuat hükümleriyle ilişkili olabileceğini düşünün.\n4. Belge ve kanıt toplayın: Yazılı deliller, anlaşmalar, mesajlaşmalar veya tanık beyanları gibi önemli kanıtları kaydedin.\n5. Uzman desteği alın: Hukuki sürecin doğru yürütülmesi için ilgili alanda deneyimli bir avukattan destek alın.`;
};

const getMockDocument = ({ type, name, tc, muhatap, subject }) => {
  return `İHTARNAME\n\nİHTAR EDEN: ${name}${tc ? ` (${tc})` : ''}\nMUHATAP: ${muhatap}\n\nKONU: ${subject}\n\nSayın ${muhatap},\n\nAramızdaki hukuki ilişki gereği... Bu ihtarname, ${type} kapsamında hazırlanmıştır. Lütfen belirtilen hususları en kısa sürede yerine getiriniz.\n\nSaygılarımla,\n${name}`;
};

const getMockTranslation = text => {
  const snippet = text.trim().slice(0, 250).replace(/\s+/g, ' ');
  return `Girdiğiniz metin, aşağıdaki şekilde sadeleştirilmiştir:\n\n${snippet}\n\nBu metin, ağır hukuki ifadeleri daha kolay anlaşılır hale getirmek amacıyla sadeleştirilmiştir. Önemli noktalara dikkat edin ve gerekirse bir hukuk uzmanına danışın.`;
};

const sendJSON = (res, status, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  });
  res.end(body);
};

const serveStatic = (req, res, pathname) => {
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.join(__dirname, pathname);
  const rootPath = path.join(__dirname, path.sep);
  if (!filePath.startsWith(rootPath)) {
    res.writeHead(403).end('Erişim engellendi');
    return;
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404).end('Dosya bulunamadı');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentTypeMap = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.ico': 'image/x-icon'
  };
  const contentType = contentTypeMap[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*'
  });
  fs.createReadStream(filePath).pipe(res);
};

const parseJsonBody = req =>
  new Promise((resolve, reject) => {
    let buffer = '';
    req.on('data', chunk => {
      buffer += chunk.toString();
    });
    req.on('end', () => {
      if (!buffer) return resolve(null);
      try {
        resolve(JSON.parse(buffer));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });

const openAIQuery = async question => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return getMockAnswer(question);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Sen Türkçe hukuk rehberi için yardımcı bir asistan olarak davranacaksın. Cevapların net, kısa ve doğru bir şekilde düzenlenmiş olacak. Hukuki tavsiye yerine genel bilgi sunacaksın.'
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    });
    const data = await response.json();
    if (!response.ok || !data?.choices?.[0]?.message?.content) {
      console.error('OpenAI hata:', data);
      return getMockAnswer(question);
    }
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI isteği başarısız:', error);
    return getMockAnswer(question);
  }
};

const handleRequest = async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname || '/';

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  if (pathname === '/api/auth/register' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { name, email, password, confirmPassword, terms } = body || {};
      if (!name || !email || !password || !confirmPassword) {
        return sendJSON(res, 400, { success: false, message: 'Tüm alanlar zorunludur.' });
      }
      if (password !== confirmPassword) {
        return sendJSON(res, 400, { success: false, message: 'Şifreler eşleşmiyor.' });
      }
      if (password.length < 8) {
        return sendJSON(res, 400, { success: false, message: 'Şifre en az 8 karakter olmalıdır.' });
      }
      if (!terms) {
        return sendJSON(res, 400, { success: false, message: 'Kullanım koşullarını kabul etmelisiniz.' });
      }
      const normalizedEmail = email.toLowerCase();
      if (users.some(user => user.email === normalizedEmail)) {
        return sendJSON(res, 409, { success: false, message: 'Bu e-posta zaten kayıtlı.' });
      }
      const { salt, hash } = hashPassword(password);
      users.push({ name, email: normalizedEmail, salt, hash, createdAt: Date.now() });
      return sendJSON(res, 201, { success: true, redirectUrl: '/index.html?registered=1' });
    } catch (error) {
      return sendJSON(res, 400, { success: false, message: 'Geçersiz JSON verisi.' });
    }
  }

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { email, password } = body || {};
      if (!email || !password) {
        return sendJSON(res, 400, { success: false, message: 'E-posta ve şifre gereklidir.' });
      }
      const normalizedEmail = email.toLowerCase();
      const user = users.find(userItem => userItem.email === normalizedEmail);
      if (!user || !verifyPassword(password, user)) {
        return sendJSON(res, 401, { success: false, message: 'E-posta veya şifre hatalı.' });
      }
      return sendJSON(res, 200, { success: true, redirectUrl: '/assistant.html' });
    } catch (error) {
      return sendJSON(res, 400, { success: false, message: 'Geçersiz JSON verisi.' });
    }
  }

  if (pathname === '/api/auth/demo' && req.method === 'POST') {
    // Return demo login success; frontend should redirect to assistant
    return sendJSON(res, 200, { success: true, redirectUrl: '/assistant.html', demoEmail: 'demo@demo.local', demoPassword: 'demodemo123' });
  }

  if (pathname === '/api/chat' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { question } = body || {};
      if (!question || typeof question !== 'string') {
        return sendJSON(res, 400, { success: false, message: 'Soru alanı geçerli olmalıdır.' });
      }
      const answer = await openAIQuery(question);
      return sendJSON(res, 200, { success: true, answer });
    } catch (error) {
      return sendJSON(res, 400, { success: false, message: 'Geçersiz JSON verisi.' });
    }
  }

  if (pathname === '/api/analyze' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { issue } = body || {};
      if (!issue || typeof issue !== 'string' || issue.trim().length === 0) {
        return sendJSON(res, 400, { success: false, message: 'Analiz için bir sorun metni gereklidir.' });
      }
      const prompt = `Hukuki bir durumun kısa analizini yap. Kullanıcı sorusunu net bir şekilde yanıtla ve gerekli adımları belirt. Soru: ${issue}`;
      const analysis = await openAIQuery(prompt);
      return sendJSON(res, 200, { success: true, analysis });
    } catch (error) {
      return sendJSON(res, 400, { success: false, message: 'Geçersiz JSON verisi.' });
    }
  }

  if (pathname === '/api/roadmap' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { issue } = body || {};
      if (!issue || typeof issue !== 'string' || issue.trim().length === 0) {
        return sendJSON(res, 400, { success: false, message: 'Yol haritası için bir sorun metni gereklidir.' });
      }
      const roadmap = getMockRoadmap(issue);
      return sendJSON(res, 200, { success: true, roadmap });
    } catch (error) {
      return sendJSON(res, 400, { success: false, message: 'Geçersiz JSON verisi.' });
    }
  }

  if (pathname === '/api/demo/data' && req.method === 'GET') {
    // Return demo-specific sample data
    const demoEmail = 'demo@demo.local';
    const profile = users.find(u => u.email === demoEmail) || null;
    const demoReminders = reminders.filter(r => !r.owner || r.owner === demoEmail);
    const demoDocs = savedDocuments.filter(d => !d.owner || d.owner === demoEmail);
    return sendJSON(res, 200, { success: true, profile, reminders: demoReminders, documents: demoDocs });
  }

  if (pathname === '/api/reminders' && req.method === 'GET') {
    return sendJSON(res, 200, { success: true, reminders });
  }

  if (pathname === '/api/reminders' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { title, date, priority, notes } = body || {};
      if (!title || !date) {
        return sendJSON(res, 400, { success: false, message: 'Başlık ve tarih gereklidir.' });
      }
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const item = { id, title, date, priority: priority || 'medium', notes: notes || '', createdAt: Date.now() };
      reminders.push(item);
      return sendJSON(res, 201, { success: true, reminder: item });
    } catch (error) {
      return sendJSON(res, 400, { success: false, message: 'Geçersiz JSON verisi.' });
    }
  }

  if (pathname.startsWith('/api/reminders/') && req.method === 'DELETE') {
    const id = pathname.split('/').pop();
    const idx = reminders.findIndex(r => r.id === id);
    if (idx === -1) return sendJSON(res, 404, { success: false, message: 'Bulunamadı.' });
    reminders.splice(idx, 1);
    return sendJSON(res, 200, { success: true });
  }

  if (pathname === '/api/document/save' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { type, document } = body || {};
      if (!document || typeof document !== 'string' || document.trim().length === 0) {
        return sendJSON(res, 400, { success: false, message: 'Kaydedilecek bir belge metni gereklidir.' });
      }
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const record = { id, name: type || 'Belge', type: type || 'diger', content: document, generatedAt: Date.now() };
      savedDocuments.push(record);
      return sendJSON(res, 201, { success: true, document: record });
    } catch (error) {
      return sendJSON(res, 400, { success: false, message: 'Geçersiz JSON verisi.' });
    }
  }

  if (pathname === '/api/document' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const doc = getMockDocument(body || {});
      savedDocuments.push({ ...body, generatedAt: Date.now() });
      return sendJSON(res, 200, { success: true, document: doc });
    } catch (error) {
      return sendJSON(res, 400, { success: false, message: 'Geçersiz JSON verisi.' });
    }
  }

  if (pathname === '/api/translate' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { text } = body || {};
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return sendJSON(res, 400, { success: false, message: 'Çeviri için bir metin gereklidir.' });
      }
      const translated = getMockTranslation(text);
      return sendJSON(res, 200, { success: true, translation: translated });
    } catch (error) {
      return sendJSON(res, 400, { success: false, message: 'Geçersiz JSON verisi.' });
    }
  }

  serveStatic(req, res, pathname);
};

const PORT = process.env.PORT || 3000;
const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
