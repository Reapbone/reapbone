/* REAPBONE — local-first interactive portfolio. Vanilla JS; no trackers, no deps. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const USER = $('meta[name="github-user"]')?.content.trim() || 'Reapbone';
  const PROFILE_URL = `https://github.com/${encodeURIComponent(USER)}`;
  const REPOS_URL = `${PROFILE_URL}?tab=repositories`;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let repos = [];
  let selectedFilter = 'all';
  let lang = 'en';
  let toastTimeout;

  const dictionary = {
    en: {
      navAbout:'01 / ABOUT',navWork:'02 / WORK',navTerminal:'03 / TERMINAL',
      heroStatus:'SYSTEM ONLINE / OPEN TO COMMISSIONS',heroBefore:'TURNING',heroLine:'CURIOSITY',heroAfter:'INTO CODE.',
      heroDescription:"I'm Reapbone. I love building things with AI — turning unusual ideas into real, working experiences.",
      viewWork:'EXPLORE MY WORK',runTerminal:'RUN TERMINAL',heroNote:'NOT JUST PROMPTS. PROJECTS, EXPERIMENTS & CODE.',
      sectionAboutTiny:'A BIT ABOUT ME',aboutHeadline:'THE BEST IDEAS<br />START WITH <em>"WHAT IF?"</em>',
      aboutOne:'I build useful tools with AI and welcome paid freelance requests for bots, automation and AI-assisted development.',
      aboutTwo:'For me, building is the fun part. I experiment, break things, learn something new, and make the next version better.',
      exploreGithub:'EXPLORE REPOSITORIES',c1title:'AI EXPLORATION',c1body:'Experimenting with models, prompts and smarter workflows.',
      c2title:'CREATIVE BUILDING',c2body:'Turning a blank screen into something interactive and useful.',
      c3title:'NEVER STOP LEARNING',c3body:'Prototyping, testing and improving one iteration at a time.',
      c4title:'NEXT EXPERIMENT',c4body:'The most interesting project might be the next one.',
      repoCount:'PUBLIC REPOSITORIES',starCount:'EARNED STARS',followerCount:'FOLLOWERS',statLast:'ALWAYS<br />BUILDING',
      workTiny:'LIVE FROM GITHUB',workEyebrow:'REAL REPOSITORIES. NO DEMO DATA.',workTitle:'THINGS I\'VE BUILT<span class="green-dot">.</span>',
      all:'ALL',tools:'TOOLS & BOTS',other:'OTHER',searchLabel:'Search repositories',search:'SEARCH PROJECTS...',
      loading:'PULLING LIVE GITHUB DATA...',allGithub:'VIEW ALL ON GITHUB',liveNote:'LIVE DATA · PUBLIC REPOSITORIES ONLY',
      terminalTiny:'GO AHEAD, TYPE SOMETHING',terminalTitle:'A LITTLE<br /><em>TERMINAL MAGIC.</em>',
      terminalDesc:'This one actually responds. Try a command and see where it takes you.',
      termGreeting:'interactive environment',termPrompt:"Enter 'help' for available commands.",termPlaceholder:'type a command...',
      endTitle:'GOT AN IDEA?<br /><em>LET\'S MAKE IT REAL.</em>',findGithub:'FIND ME ON GITHUB',copyLink:'COPY PROFILE LINK',
      footer:'BUILT WITH CURIOSITY. POWERED BY EXPERIMENTS.',backTop:'BACK TO TOP',
      apiOnline:'LIVE DATA CONNECTED',apiOffline:'PUBLIC API UNAVAILABLE',count:'PROJECTS',
      noResults:'NO PROJECTS MATCH YOUR FILTERS',noResultsText:'Try another search or category.',
      noPublic:'NO PUBLIC PROJECTS TO DISPLAY YET',noPublicText:'When repositories become public, they will appear here automatically.',
      apiError:'GITHUB DATA TEMPORARILY UNAVAILABLE',apiErrorText:'The public API may be rate-limited or the username may need updating.',
      repoLink:'OPEN REPOSITORY',copySuccess:'Profile link copied.',copyFailed:'Copy unavailable. Use the GitHub button instead.',
      paletteSearch:'Jump to a section or run an action...',
    },
    tr: {
      navAbout:'01 / HAKKIMDA',navWork:'02 / PROJELER',navTerminal:'03 / TERMİNAL',
      heroStatus:'SİSTEM AKTİF / YENİ FİKİRLERE AÇIK',heroBefore:'MERAKI',heroLine:'KODA',heroAfter:'DÖNÜŞTÜR.',
      heroDescription:'Ben Reapbone. Yapay zekâyla bir şeyler üretmeye, sıra dışı fikirleri çalışan projelere dönüştürmeye bayılıyorum.',
      viewWork:'PROJELERİ KEŞFET',runTerminal:'TERMİNALİ AÇ',heroNote:'SADECE PROMPT DEĞİL. PROJELER, DENEYLER VE KOD.',
      sectionAboutTiny:'BENİ BİRAZ TANI',aboutHeadline:'EN İYİ FİKİRLER<br /><em>"YA OLSAYDI?"</em> İLE BAŞLAR.',
      aboutOne:'Yapay zekânın üretme şeklimizi nasıl değiştirdiğini keşfetmeyi seviyorum — küçük deneylerden işe yarayan araçlara kadar.',
      aboutTwo:'Benim için eğlenceli olan üretme süreci. Denerim, hata yaparım, yeni bir şey öğrenirim ve sonraki sürümü daha iyi yaparım.',
      exploreGithub:'REPOLARI KEŞFET',c1title:'YAPAY ZEKÂ KEŞFİ',c1body:'Modeller, promptlar ve daha akıllı iş akışları üzerinde denemeler.',
      c2title:'YARATICI GELİŞTİRME',c2body:'Boş bir ekranı etkileşimli ve faydalı bir şeye dönüştürmek.',
      c3title:'SÜREKLİ ÖĞREN',c3body:'Her seferinde biraz daha iyiye giden prototipler ve testler.',
      c4title:'SONRAKİ DENEY',c4body:'Belki de en ilginç proje henüz başlamadı.',
      repoCount:'HERKESE AÇIK REPO',starCount:'KAZANILAN YILDIZ',followerCount:'TAKİPÇİ',statLast:'HEP<br />ÜRETİYORUM',
      workTiny:'DOĞRUDAN GITHUB\'DAN',workEyebrow:'GERÇEK REPOLAR. ÖRNEK VERİ YOK.',workTitle:'GELİŞTİRDİKLERİM<span class="green-dot">.</span>',
      all:'TÜMÜ',tools:'ARAÇLAR & BOTLAR',other:'DİĞER',searchLabel:'Depolarda ara',search:'PROJE ARA...',
      loading:'GITHUB VERİLERİ YÜKLENİYOR...',allGithub:'TÜMÜNÜ GITHUB\'DA GÖR',liveNote:'CANLI VERİ · SADECE HERKESE AÇIK REPOLAR',
      terminalTiny:'BİR KOMUT YAZMAYI DENE',terminalTitle:'BİRAZ<br /><em>TERMİNAL SİHRİ.</em>',
      terminalDesc:'Evet, bu terminal gerçekten cevap veriyor. Bir komut yazarak dene.',
      termGreeting:'etkileşimli ortam',termPrompt:"Komutları görmek için 'help' yaz.",termPlaceholder:'bir komut yaz...',
      endTitle:'BİR FİKRİN Mİ VAR?<br /><em>GERÇEĞE DÖNÜŞTÜRELİM.</em>',findGithub:'GITHUB PROFİLİM',copyLink:'PROFİL LİNKİNİ KOPYALA',
      footer:'MERAKLA GELİŞTİRİLDİ. DENEYLERLE GÜÇLENDİ.',backTop:'YUKARI DÖN',
      apiOnline:'CANLI VERİ BAĞLANDI',apiOffline:'GITHUB API ERİŞİLEMİYOR',count:'PROJE',
      noResults:'FİLTREYE UYGUN PROJE YOK',noResultsText:'Başka bir arama veya kategori dene.',
      noPublic:'HENÜZ GÖSTERİLECEK AÇIK REPO YOK',noPublicText:'Repo herkese açıldığında otomatik olarak burada görünecek.',
      apiError:'GITHUB VERİLERİNE ŞU AN ERİŞİLEMİYOR',apiErrorText:'API sınırı dolmuş olabilir veya GitHub kullanıcı adı güncellenmelidir.',
      repoLink:'REPOYU AÇ',copySuccess:'Profil bağlantısı kopyalandı.',copyFailed:'Kopyalanamadı. GitHub butonunu kullanabilirsin.',
      paletteSearch:'Bölüm seç veya bir işlem çalıştır...',
    }
  };
  const t = key => dictionary[lang][key] || dictionary.en[key] || key;
  const safeGet = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
  const safeSet = (key, value) => { try { localStorage.setItem(key, value); } catch {} };

  function applyLanguage(next) {
    lang = next === 'tr' ? 'tr' : 'en';
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(node => node.textContent = t(node.dataset.i18n));
    $$('[data-i18n-html]').forEach(node => node.innerHTML = t(node.dataset.i18nHtml)); // trusted constant translations only
    $$('[data-i18n-placeholder]').forEach(node => node.placeholder = t(node.dataset.i18nPlaceholder));
    $('#language').textContent = lang === 'en' ? 'TR' : 'EN';
    $('#language').setAttribute('aria-label', lang === 'en' ? 'Türkçe diline geç' : 'Switch to English');
    $('#paletteInput').placeholder = t('paletteSearch');
    if ($('#apiStatus').dataset.connected === 'true') $('#apiStatus').textContent = t('apiOnline');
    if ($('#apiStatus').dataset.connected === 'false') $('#apiStatus').textContent = t('apiOffline');
    if ($('#projectTotal').dataset.count !== undefined) $('#projectTotal').textContent = `[ ${$('#projectTotal').dataset.count} ${t('count')} ]`;
    if ($('#projectsGrid').dataset.mode === 'loaded') renderRepositories();
    if ($('#projectsGrid').dataset.mode === 'error') showState(t('apiError'), t('apiErrorText'), true);
    if ($('#projectsGrid').dataset.mode === 'empty') showState(t('noPublic'), t('noPublicText'));
    if (paletteOpen()) renderPalette();
    safeSet('rb_language', lang);
  }
  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    safeSet('rb_theme', next);
  }
  for (const a of $$('[data-github-url]')) a.href = PROFILE_URL;
  for (const a of $$('[data-github-repos]')) a.href = REPOS_URL;
  if (safeGet('rb_theme') === 'light') document.documentElement.dataset.theme = 'light';
  applyLanguage(safeGet('rb_language') || (navigator.language.toLowerCase().startsWith('tr') ? 'tr' : 'en'));
  $('#language').addEventListener('click', () => applyLanguage(lang === 'tr' ? 'en' : 'tr'));
  $('#theme').addEventListener('click', toggleTheme);
  $('#copyLink').addEventListener('click', async () => {
    try { if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText(PROFILE_URL); notify(t('copySuccess')); }
    catch { notify(t('copyFailed')); }
  });
  function notify(message) {
    const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
    clearTimeout(toastTimeout); toastTimeout = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  // The portfolio always displays REAL public repositories, never fabricated examples.
  const categoryOf = repo => {
    const topics = (repo.topics || []).join(' ').toLowerCase();
    const str = `${repo.name} ${repo.description || ''} ${topics}`.toLowerCase();
    if (/\b(ai|llm|gpt|ollama|openai|artificial.intelligence|machine.learning|deep.learning|neural|transformer|chatbot|rag)\b/.test(str)) return 'ai';
    if (/\b(bot|discord|automation|cli|tool|script|utility|api|dashboard|workflow|devtool)\b/.test(str)) return 'tools';
    return 'other';
  };
  const compact = count => Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-US', { notation:'compact', maximumFractionDigits:1 }).format(count);
  function showState(heading, info, withLink = false) {
    const grid = $('#projectsGrid'); grid.replaceChildren();
    const div = document.createElement('div'); div.className = 'empty-state';
    const strong = document.createElement('strong'); strong.textContent = heading;
    const p = document.createElement('p'); p.textContent = info; p.style.marginBottom = '0';
    div.append(strong, p);
    if (withLink) {
      const a = document.createElement('a'); a.href = REPOS_URL; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'GITHUB ↗'; div.append(a);
    }
    grid.append(div);
  }
  function setCount(number) {
    $('#projectTotal').dataset.count = String(number);
    $('#projectTotal').textContent = `[ ${number} ${t('count')} ]`;
  }
  function renderRepositories() {
    const q = $('#repoSearch').value.trim().toLocaleLowerCase();
    const filtered = repos.filter(repo => (selectedFilter === 'all' || categoryOf(repo) === selectedFilter)
      && `${repo.name} ${repo.description || ''} ${(repo.topics || []).join(' ')} ${repo.language || ''}`.toLocaleLowerCase().includes(q));
    const grid = $('#projectsGrid'); grid.replaceChildren(); setCount(filtered.length);
    if (repos.length === 0) { $('#projectsGrid').dataset.mode = 'empty'; showState(t('noPublic'), t('noPublicText')); return; }
    if (filtered.length === 0) { showState(t('noResults'), t('noResultsText')); return; }
    filtered.slice(0, 12).forEach((repo, index) => {
      const card = document.createElement('a'); card.className = 'repo-card';
      // Public GitHub API controls URLs; restrict to GitHub HTTPS for safety.
      card.href = typeof repo.html_url === 'string' && /^https:\/\/github\.com\//i.test(repo.html_url) ? repo.html_url : REPOS_URL;
      card.target = '_blank'; card.rel = 'noopener noreferrer';
      const top = document.createElement('div'); top.className = 'repo-card-top';
      const id = document.createElement('span'); id.textContent = `PROJECT_${String(index + 1).padStart(2,'0')}`;
      const type = document.createElement('span'); type.className = 'repo-kind'; type.textContent = `● ${categoryOf(repo).toUpperCase()}`; top.append(id,type);
      const heading = document.createElement('h3'); heading.textContent = repo.name;
      const description = document.createElement('p'); description.textContent = repo.description || (lang === 'tr' ? 'Herkese açık GitHub projesi.' : 'Public GitHub repository.');
      const bottom = document.createElement('div'); bottom.className = 'repo-bottom';
      const meta = document.createElement('span'); meta.className = 'repo-meta';
      const language = document.createElement('span');
      const dot = document.createElement('span'); dot.className = 'repo-lang-dot'; language.append(dot, document.createTextNode(repo.language || 'CODE'));
      const stars = document.createElement('span'); stars.textContent = `★ ${repo.stargazers_count || 0}`;
      meta.append(language,stars); const arrow = document.createElement('span'); arrow.textContent = '↗';
      bottom.append(meta,arrow); card.append(top,heading,description,bottom); grid.append(card);
    });
  }
  async function requestJson(path) {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined
    });
    if (!response.ok) throw new Error(`GitHub API ${response.status}`);
    return response.json();
  }
  async function loadGithub() {
    try {
      const name = encodeURIComponent(USER);
      const [profile, firstPage] = await Promise.all([
        requestJson(`/users/${name}`),
        requestJson(`/users/${name}/repos?per_page=100&page=1&type=owner&sort=updated`)
      ]);
      repos = Array.isArray(firstPage) ? firstPage : [];
      // A bounded number of pages avoids unnecessary API requests and unauthenticated rate limits.
      let page = 2;
      while (repos.length > 0 && repos.length % 100 === 0 && page <= 5) {
        const next = await requestJson(`/users/${name}/repos?per_page=100&page=${page}&type=owner&sort=updated`);
        if (!Array.isArray(next) || !next.length) break;
        repos.push(...next); if (next.length < 100) break; page += 1;
      }
      repos = repos.filter(r => !r.fork && !r.private).sort((a,b) => new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at));
      $('#statRepos').textContent = compact(profile.public_repos ?? repos.length);
      $('#statStars').textContent = compact(repos.reduce((sum,r) => sum + Number(r.stargazers_count || 0), 0));
      $('#statFollowers').textContent = compact(profile.followers ?? 0);
      $('#apiStatus').dataset.connected = 'true'; $('#apiStatus').textContent = t('apiOnline');
      $('#projectsGrid').dataset.mode = 'loaded'; renderRepositories();
    } catch (error) {
      console.warn('Reapbone public GitHub data fetch failed:', error.message);
      $('#apiStatus').dataset.connected = 'false'; $('#apiStatus').textContent = t('apiOffline');
      $('#projectsGrid').dataset.mode = 'error'; showState(t('apiError'), t('apiErrorText'), true);
    }
  }
  $('#repoSearch').addEventListener('input', () => { if ($('#projectsGrid').dataset.mode === 'loaded') renderRepositories(); });
  $$('.filter').forEach(button => button.addEventListener('click', () => {
    selectedFilter = button.dataset.filter;
    $$('.filter').forEach(btn => { btn.classList.toggle('active',btn===button);btn.setAttribute('aria-pressed',String(btn===button)); });
    if ($('#projectsGrid').dataset.mode === 'loaded') renderRepositories();
  }));
  loadGithub();

  // Terminal supports a fixed allowlist; never evaluates the visitor's input.
  const terminal = $('#terminalOutput');
  function terminalLine(str, cls = '') {
    const p = document.createElement('p'); p.textContent = str; if (cls) p.className = cls;
    terminal.append(p); terminal.scrollTop = terminal.scrollHeight;
  }
  function runCommand(raw) {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    terminalLine(`❯ ${raw.trim()}`, 'prompt-prefix');
    const tr = lang === 'tr';
    const responses = {
      help: tr ? 'KOMUTLAR: help, about, ai, projects, github, theme, language, clear, whoami, date' : 'COMMANDS: help, about, ai, projects, github, theme, language, clear, whoami, date',
      about: tr ? 'Reapbone: AI ile fikirleri çalışan sistemlere dönüştürmeyi seven geliştirici.' : 'Reapbone: developer who loves turning AI-powered ideas into working systems.',
      whoami: 'reapbone@creative-lab // ai explorer // always building',
      ai: tr ? 'ODAK: AI destekli geliştirme, yeni fikirler, otomasyon ve deneyler.' : 'FOCUS: AI-assisted development, new ideas, automation and experiments.',
      date: new Date().toLocaleString(tr ? 'tr-TR' : 'en-US'),
    };
    if (cmd === 'clear') { terminal.replaceChildren(); return; }
    if (cmd === 'theme') { toggleTheme(); terminalLine(tr ? '✓ Tema değiştirildi.' : '✓ Theme switched.', 'success'); return; }
    if (cmd === 'language' || cmd === 'lang') { applyLanguage(lang === 'tr' ? 'en' : 'tr'); terminalLine(lang === 'tr' ? '✓ Türkçe aktif.' : '✓ English enabled.', 'success'); return; }
    if (cmd === 'projects' || cmd === 'work') { $('#work').scrollIntoView({behavior: prefersReducedMotion.matches ? 'auto' : 'smooth'});terminalLine(tr ? '✓ Projelere yönlendiriliyor...' : '✓ Jumping to projects...', 'success');return; }
    if (cmd === 'github') { window.open(PROFILE_URL,'_blank','noopener,noreferrer');terminalLine(tr ? '✓ GitHub açılıyor...' : '✓ Opening GitHub...', 'success');return; }
    terminalLine(responses[cmd] || (tr ? `Komut bulunamadı: ${cmd} — 'help' yaz.` : `Command not found: ${cmd} — try 'help'.`), responses[cmd] ? 'success' : 'error');
  }
  $('#terminalForm').addEventListener('submit',event => {
    event.preventDefault(); const input = $('#terminalInput'); runCommand(input.value); input.value = ''; input.focus();
  });
  $$('[data-command]').forEach(button=>button.addEventListener('click',()=>{ runCommand(button.dataset.command);$('#terminalInput').focus(); }));

  // Accessible, keyboard-driven command palette.
  const paletteData = [
    { label:'⌁  ABOUT / HAKKIMDA', type:'about',action:()=>$('#about').scrollIntoView() },
    { label:'◈  PROJECTS / PROJELER', type:'work',action:()=>$('#work').scrollIntoView() },
    { label:'⌘  TERMINAL / TERMİNAL', type:'terminal',action:()=>{ $('#terminal').scrollIntoView();$('#terminalInput').focus({preventScroll:true}); } },
    { label:'☾  TOGGLE THEME / TEMA', type:'theme',action:toggleTheme },
    { label:'⇄  LANGUAGE / DİL', type:'language',action:()=>applyLanguage(lang==='tr'?'en':'tr') },
    { label:'↗  GITHUB PROFILE', type:'github',action:()=>window.open(PROFILE_URL,'_blank','noopener,noreferrer') },
  ];
  let paletteIndex = 0; let currentPalette = [];
  function paletteOpen() { return !$('#paletteOverlay').hidden; }
  function renderPalette() {
    const q = $('#paletteInput').value.toLowerCase().trim();
    currentPalette = paletteData.filter(item=>`${item.label} ${item.type}`.toLowerCase().includes(q));
    paletteIndex = Math.min(paletteIndex,Math.max(0,currentPalette.length-1));
    $('#paletteItems').replaceChildren();
    currentPalette.forEach((item,index)=>{
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'palette-option'; if(index === paletteIndex) btn.classList.add('selected');
      btn.textContent = item.label; btn.addEventListener('click',()=>{closePalette(); item.action();});$('#paletteItems').append(btn);
    });
  }
  function openPalette(){ $('#paletteOverlay').hidden = false; $('#paletteInput').value = '';paletteIndex=0;renderPalette();$('#paletteInput').focus(); }
  function closePalette(){ $('#paletteOverlay').hidden = true;$('#openPalette').focus(); }
  $('#openPalette').addEventListener('click',openPalette);
  $('#closePalette').addEventListener('click',closePalette);
  $('#paletteOverlay').addEventListener('mousedown',event=>{if(event.target === $('#paletteOverlay'))closePalette();});
  $('#paletteInput').addEventListener('input',()=>{paletteIndex=0;renderPalette();});
  $('#paletteInput').addEventListener('keydown',event=>{
    if(event.key==='ArrowDown' || event.key==='ArrowUp'){
      event.preventDefault(); if(!currentPalette.length)return;
      paletteIndex=(paletteIndex+(event.key==='ArrowDown'?1:-1)+currentPalette.length)%currentPalette.length;
      $$('.palette-option').forEach((node,index)=>node.classList.toggle('selected',index===paletteIndex));
    }
    if(event.key==='Enter' && currentPalette[paletteIndex]){event.preventDefault();const action=currentPalette[paletteIndex].action;closePalette();action();}
  });
  document.addEventListener('keydown',event=>{
    if((event.metaKey || event.ctrlKey) && event.key.toLowerCase()==='k'){event.preventDefault();paletteOpen()?closePalette():openPalette();}
    if(event.key==='Escape' && paletteOpen()){event.preventDefault();closePalette();}
    if(event.key==='Tab' && paletteOpen()) { const focusable = [$('#paletteInput'), ...$$('.palette-option'),$('#closePalette')]; const index=focusable.indexOf(document.activeElement);
      if(event.shiftKey && index===0){event.preventDefault();focusable[focusable.length-1].focus();}
      else if(!event.shiftKey && index===focusable.length-1){event.preventDefault();focusable[0].focus();}
    }
  });
  if (!/Mac/i.test(navigator.platform)) $('#openPalette').textContent = 'CTRL K';
  document.addEventListener('pointermove', event=>{
    if(prefersReducedMotion.matches)return;
    document.documentElement.style.setProperty('--mouse-x',`${event.clientX}px`);
    document.documentElement.style.setProperty('--mouse-y',`${event.clientY}px`);
  },{passive:true});
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries, observer)=>{
      entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target);}});
    },{threshold:.12});$$('.reveal').forEach(el=>io.observe(el));
  } else {$$('.reveal').forEach(el=>el.classList.add('in-view'));}

  // Interactive canvas graph. Drag nodes; select them to inspect the idea → ship loop.
  const canvas = $('#network'); const ctx = canvas.getContext('2d');
  if (ctx) {
    const nodes = [
      {name:'IDEA',nx:.23,ny:.25,color:'#a0a0a0'},
      {name:'MODEL',nx:.75,ny:.22,color:'#cfcfcf'},
      {name:'BUILD',nx:.84,ny:.68,color:'#a0a0a0'},
      {name:'TEST',nx:.48,ny:.82,color:'#cfcfcf'},
      {name:'SHIP',nx:.18,ny:.66,color:'#a0a0a0'},
    ];
    const stars = Array.from({length:52},(_,i)=>({x:(((i*101+37)%307)/307),y:(((i*79+23)%277)/277),r:(i%3===0?1.2:.7)}));
    let width=400,height=400,drag=-1,hover=-1,chosen=-1,clock=0,animFrame;
    function resize(){
      const rect=canvas.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);
      const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.floor(width*dpr);canvas.height=Math.floor(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    if('ResizeObserver' in window)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
    resize();
    function coord(node,index){const wobble=prefersReducedMotion.matches||drag===index?0:Math.sin(clock*.0004+index*1.6)*4;return{x:node.nx*width,y:node.ny*height+wobble};}
    function draw(){
      ctx.clearRect(0,0,width,height);const cx=width*.5,cy=height*.5,rad=Math.min(width,height)*.23;
      stars.forEach(s=>{ctx.fillStyle='rgba(184,184,184,.3)';ctx.beginPath();ctx.arc(s.x*width,s.y*height,s.r,0,Math.PI*2);ctx.fill();});
      for(let i=0;i<4;i++){ctx.beginPath();ctx.strokeStyle=i===2?'rgba(208,208,208,.16)':'rgba(140,140,140,.13)';ctx.lineWidth=1;ctx.arc(cx,cy,rad*(.7+i*.43),0,Math.PI*2);ctx.stroke();}
      ctx.save();ctx.translate(cx,cy);if(!prefersReducedMotion.matches)ctx.rotate(clock*.00006);
      ctx.setLineDash([3,12]);ctx.strokeStyle='rgba(149,149,149,.6)';ctx.beginPath();ctx.arc(0,0,rad*1.35,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();
      ctx.strokeStyle='rgba(126,126,126,.3)';ctx.lineWidth=1;
      nodes.forEach((n,i)=>{
        const p=coord(n,i),next=coord(nodes[(i+1)%nodes.length],(i+1)%nodes.length);
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(next.x,next.y);ctx.stroke();
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(cx,cy);ctx.stroke();
      });
      const aura=ctx.createRadialGradient(cx,cy,3,cx,cy,rad);
      aura.addColorStop(0,'rgba(150,150,150,.31)');aura.addColorStop(1,'rgba(150,150,150,0)');ctx.fillStyle=aura;ctx.beginPath();ctx.arc(cx,cy,rad,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#141414';ctx.beginPath();ctx.arc(cx,cy,rad*.61,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(162,162,162,.85)';ctx.lineWidth=1.5;ctx.stroke();
      ctx.font=`900 ${Math.max(25,Math.round(rad*.56))}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle='#f9f9f9';ctx.fillText('R',cx-rad*.13,cy);ctx.fillStyle='#cfcfcf';ctx.fillText('B',cx+rad*.19,cy);
      nodes.forEach((n,i)=>{
        const p=coord(n,i);const active=hover===i||chosen===i;
        ctx.beginPath();ctx.fillStyle=active?'rgba(147,147,147,.24)':'rgba(147,147,147,.1)';ctx.arc(p.x,p.y,active?30:25,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#141414';ctx.strokeStyle=n.color;ctx.lineWidth=active?2.3:1.1;ctx.beginPath();ctx.arc(p.x,p.y,16,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.fillStyle=n.color;ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill();
        ctx.font='10px Consolas,monospace';ctx.textAlign='center';ctx.fillStyle='#b1b1b1';ctx.fillText(n.name,p.x,p.y+38);
      });
      if(!prefersReducedMotion.matches){clock+=16;animFrame=requestAnimationFrame(draw);}
    }
    draw();
    const pointerAt=event=>{const rect=canvas.getBoundingClientRect();return{x:event.clientX-rect.left,y:event.clientY-rect.top};};
    const findNode=event=>{const p=pointerAt(event);let match=-1,distance=30;nodes.forEach((node,i)=>{const q=coord(node,i);const d=Math.hypot(p.x-q.x,p.y-q.y);if(d<distance){distance=d;match=i;}});return match;};
    canvas.addEventListener('pointermove',event=>{
      if(drag!==-1){const p=pointerAt(event);nodes[drag].nx=Math.max(.08,Math.min(.92,p.x/width));nodes[drag].ny=Math.max(.13,Math.min(.87,p.y/height));if(prefersReducedMotion.matches)draw();return;}
      hover=findNode(event);canvas.style.cursor=hover===-1?'crosshair':'grab';if(prefersReducedMotion.matches)draw();
    });
    canvas.addEventListener('pointerdown',event=>{
      const index=findNode(event);
      if(index!==-1){drag=index;chosen=index;canvas.setPointerCapture(event.pointerId);$('#graphLabel').textContent=`NODE ${String(index+1).padStart(2,'0')} // ${nodes[index].name}`;canvas.style.cursor='grabbing';if(prefersReducedMotion.matches)draw();}
    });
    canvas.addEventListener('pointerup',()=>{drag=-1;canvas.style.cursor='crosshair';});
    canvas.addEventListener('pointercancel',()=>{drag=-1;});
    canvas.addEventListener('pointerleave',()=>{hover=-1;if(prefersReducedMotion.matches)draw();});
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){cancelAnimationFrame(animFrame);}else if(!prefersReducedMotion.matches){cancelAnimationFrame(animFrame);animFrame=requestAnimationFrame(draw);}
    });
    prefersReducedMotion.addEventListener?.('change',()=>{cancelAnimationFrame(animFrame);draw();});
  }
})();
