/* ================================================
   WiredTechniks — Main JavaScript
   ================================================ */

(function () {
  'use strict';

  /* ── 1. HEADER scroll class ── */
  const header = document.getElementById('site-header');
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 30);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── 2. USB-STYLE NODE CANVAS ── */
  const canvas = document.getElementById('node-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const RF = 'rgba(190,30,45,';
    let W, H;
    let mouse = { x: -9999, y: -9999 };

    function resize() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });

    function Node() { this.reset(); }
    Node.prototype.reset = function () {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.45;
      this.vy = (Math.random() - 0.5) * 0.45;
      this.r = Math.random() * 3 + 2;
      this.alpha = Math.random() * 0.5 + 0.2;
      this.pulse = Math.random() * Math.PI * 2;
      this.pulseSpeed = 0.02 + Math.random() * 0.02;
    };
    Node.prototype.update = function () {
      this.pulse += this.pulseSpeed;
      const dx = this.x - mouse.x, dy = this.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 120) {
        const force = ((120 - dist) / 120) * 0.6;
        this.vx += (dx / dist) * force;
        this.vy += (dy / dist) * force;
      }
      this.vx *= 0.97; this.vy *= 0.97;
      this.x += this.vx; this.y += this.vy;
      if (this.x < -20) this.x = W + 20;
      if (this.x > W + 20) this.x = -20;
      if (this.y < -20) this.y = H + 20;
      if (this.y > H + 20) this.y = -20;
    };
    Node.prototype.draw = function () {
      const pulse = Math.sin(this.pulse) * 0.5 + 0.5;
      const r = this.r + pulse * 1.5;
      ctx.beginPath(); ctx.arc(this.x, this.y, r + 4, 0, Math.PI * 2);
      ctx.fillStyle = RF + (this.alpha * 0.15) + ')'; ctx.fill();
      ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fillStyle = RF + this.alpha + ')'; ctx.fill();
    };

    let nodes = [];
    function initNodes() {
      const count = Math.max(24, Math.floor((W * H) / 18000));
      nodes = [];
      for (let i = 0; i < count; i++) nodes.push(new Node());
    }
    initNodes();
    window.addEventListener('resize', initNodes);

    const CONN = 160;
    function drawConnections() {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (d < CONN) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = RF + ((1 - d / CONN) * 0.18) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    /* USB hub structure */
    function drawHub() {
      const pts = [
        [0.5, 0.18], [0.5, 0.42], [0.32, 0.30], [0.68, 0.30], [0.5, 0.60]
      ].map(([rx, ry]) => ({ x: rx * W, y: ry * H }));
      const [stem, junc, left, right, plug] = pts;
      const a = 0.12;
      ctx.lineWidth = 1.5;
      [[stem, junc], [junc, left], [junc, right], [junc, plug]].forEach(([a_, b]) => {
        ctx.beginPath(); ctx.moveTo(a_.x, a_.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = RF + a + ')'; ctx.stroke();
      });
      const sz = [5, 4, 3.5, 3.5, 7];
      pts.forEach((p, i) => {
        ctx.beginPath(); ctx.arc(p.x, p.y, sz[i] + 5, 0, Math.PI * 2);
        ctx.fillStyle = RF + '0.07)'; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, sz[i], 0, Math.PI * 2);
        ctx.fillStyle = RF + '0.16)'; ctx.fill();
      });
      ctx.beginPath(); ctx.rect(left.x - 4, left.y - 9, 8, 8);
      ctx.fillStyle = RF + '0.12)'; ctx.fill();
      ctx.beginPath(); ctx.arc(right.x, right.y - 10, 4, 0, Math.PI * 2);
      ctx.fillStyle = RF + '0.12)'; ctx.fill();
    }

    /* Data-flow particles */
    const particles = [];
    function spawnParticle() {
      if (particles.length >= 18) return;
      const i = Math.floor(Math.random() * nodes.length);
      let closest = null, cD = Infinity;
      nodes.forEach((n, j) => {
        if (j === i) return;
        const d = Math.hypot(n.x - nodes[i].x, n.y - nodes[i].y);
        if (d < CONN && d < cD) { cD = d; closest = j; }
      });
      if (closest === null) return;
      particles.push({ from: i, to: closest, t: 0, speed: 0.008 + Math.random() * 0.012 });
    }
    function updateParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].t += particles[i].speed;
        if (particles[i].t >= 1) particles.splice(i, 1);
      }
      if (Math.random() < 0.06) spawnParticle();
    }
    function drawParticles() {
      particles.forEach(p => {
        const a = nodes[p.from], b = nodes[p.to];
        const px = a.x + (b.x - a.x) * p.t, py = a.y + (b.y - a.y) * p.t;
        const alpha = Math.sin(p.t * Math.PI);
        ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = RF + (alpha * 0.75) + ')'; ctx.fill();
      });
    }

    function animateCanvas() {
      ctx.clearRect(0, 0, W, H);
      drawHub(); drawConnections();
      nodes.forEach(n => { n.update(); n.draw(); });
      updateParticles(); drawParticles();
      requestAnimationFrame(animateCanvas);
    }
    animateCanvas();
  }

  /* ── 3. SCROLL REVEAL ── */
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger');
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting));
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => revealObs.observe(el));

  /* ── 4. STAT COUNTER ── */
  const statEls = document.querySelectorAll('.stat-number[data-target]');
  const statObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.target.dataset.animated) return;
      entry.target.dataset.animated = '1';
      const target = parseInt(entry.target.dataset.target, 10);
      const suffix = entry.target.dataset.suffix || '';
      let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 1400, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        entry.target.textContent = Math.floor(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  statEls.forEach(el => statObs.observe(el));

  /* ── 5. SMOOTH ANCHOR NAV ── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    });
  });

  /* ── 6. HERO PARALLAX ── */
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    document.addEventListener('mousemove', (e) => {
      const xR = (e.clientX / window.innerWidth - 0.5) * 2;
      const yR = (e.clientY / window.innerHeight - 0.5) * 2;
      heroContent.style.transform = `translate(${xR * 6}px,${yR * 4}px)`;
    });
  }

  /* ── 7. PRODUCT CAROUSEL — CSS animation, true infinite loop ──
     Same approach as the clients marquee:
       • Cards are cloned so the track is 2× wide
       • CSS @keyframes scroll-carousel animates translateX(0) → translateX(-50%)
         which is always exactly one original-set width — perfectly seamless
       • Duration is computed per carousel to keep scroll speed consistent
       • Hover pauses via class toggle (no reflow needed)
       • Arrow buttons seek to a new position by adjusting animation-delay
       • Drag also seeks on release
  ── */

  const CAROUSEL_SPEED_PX_S = 80; /* desired scroll speed in px/s */
  const JUMP_CARDS          = 2;  /* arrow jump = 2 card widths */
  const CARD_PX             = 260 + 20; /* card-w + gap */

  /* Reads the live translateX (px) produced by a running CSS animation */
  function getAnimatedX(el) {
    const t = getComputedStyle(el).transform;
    if (!t || t === 'none') return 0;
    return -new DOMMatrix(t).m41; /* m41 = translateX; we stored negative values */
  }

  /* Restart a carousel track at a given pixel offset within [0, halfW) */
  function seekTo(track, px, halfW, dur) {
    const normalised = ((px % halfW) + halfW) % halfW;
    const delay = -(normalised / halfW) * dur; /* negative = start mid-animation */
    track.style.animation = 'none';
    void track.offsetHeight;                   /* force reflow to reset */
    track.style.animation =
      `scroll-carousel ${dur}s ${delay}s linear infinite`;
  }

  document.querySelectorAll('.brand-section').forEach(brand => {
    const viewport = brand.querySelector('.carousel-viewport');
    const track    = brand.querySelector('.carousel-track');
    const btnL     = brand.querySelector('.carousel-btn-left');
    const btnR     = brand.querySelector('.carousel-btn-right');
    if (!viewport || !track) return;

    /* ── 1. Clone original cards for seamless loop ── */
    const originals = Array.from(track.children);
    originals.forEach(card => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    /* ── 2. Measure and set animation duration ── */
    let halfW = 0;
    let dur   = 35; /* fallback seconds */

    function initDuration() {
      /* After cloning, scrollWidth = 2 × original set width.
         translateX(-50%) moves exactly one set → seamless. */
      halfW = track.scrollWidth / 2;
      dur   = halfW / CAROUSEL_SPEED_PX_S;
      /* Apply initial duration (delay=0, start from beginning) */
      track.style.animation =
        `scroll-carousel ${dur}s 0s linear infinite`;
    }

    /* Wait two frames so the browser has laid out the cloned cards */
    requestAnimationFrame(() => requestAnimationFrame(initDuration));
    window.addEventListener('resize', () => {
      halfW = track.scrollWidth / 2;
      dur   = halfW / CAROUSEL_SPEED_PX_S;
    }, { passive: true });

    /* ── 3. Hover pause — must use inline style since animation is also inline ── */
    viewport.addEventListener('mouseenter', () => {
      track.style.animationPlayState = 'paused';
    });
    viewport.addEventListener('mouseleave', () => {
      if (!isDragging) track.style.animationPlayState = 'running';
    });

    /* ── 4. Arrow buttons — seek to a new position ── */
    const jumpPx = JUMP_CARDS * CARD_PX;

    if (btnL) {
      btnL.addEventListener('click', () => {
        const cur = getAnimatedX(track);
        seekTo(track, cur - jumpPx, halfW, dur);
      });
    }
    if (btnR) {
      btnR.addEventListener('click', () => {
        const cur = getAnimatedX(track);
        seekTo(track, cur + jumpPx, halfW, dur);
      });
    }

    /* ── 5. Drag to scroll ── */
    let isDragging   = false;
    let dragStartX   = 0;
    let dragStartPos = 0;

    function dragStart(clientX) {
      isDragging   = true;
      dragStartX   = clientX;
      dragStartPos = getAnimatedX(track);
      /* Freeze animation and take over position manually */
      track.style.animation = 'none';
      track.style.transform  = `translateX(-${dragStartPos}px)`;
    }

    function dragMove(clientX) {
      if (!isDragging) return;
      let p = dragStartPos + (dragStartX - clientX);
      p = ((p % halfW) + halfW) % halfW;
      track.style.transform = `translateX(-${p}px)`;
    }

    function dragEnd(clientX) {
      if (!isDragging) return;
      isDragging = false;
      let p = dragStartPos + (dragStartX - clientX);
      p = ((p % halfW) + halfW) % halfW;
      track.style.transform = '';
      seekTo(track, p, halfW, dur);
      /* Re-apply paused state if mouse is still over the viewport */
      track.style.animationPlayState =
        viewport.matches(':hover') ? 'paused' : 'running';
    }

    viewport.addEventListener('mousedown', (e) => dragStart(e.clientX));
    document.addEventListener('mousemove', (e) => { if (isDragging) dragMove(e.clientX); });
    document.addEventListener('mouseup',   (e) => dragEnd(e.clientX));

    viewport.addEventListener('touchstart', (e) => dragStart(e.touches[0].clientX), { passive: true });
    viewport.addEventListener('touchmove',  (e) => { if (isDragging) dragMove(e.touches[0].clientX); }, { passive: true });
    viewport.addEventListener('touchend',   (e) => dragEnd(e.changedTouches[0].clientX));
  });

  /* ── 8. PRODUCT MODAL ── */
  const modal = document.getElementById('product-modal');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalClose = document.getElementById('modal-close');
  const modalMediaWrap = document.getElementById('modal-media-wrap');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-description');

  const VIDEO_EXTS = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
  const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'];

  function getMediaType(src) {
    if (!src) return null;
    const ext = src.split('.').pop().split('?')[0].toLowerCase();
    if (VIDEO_EXTS.includes(ext)) return 'video';
    if (IMAGE_EXTS.includes(ext)) return 'image';
    return null;
  }

  function openModal(card) {
    const title = card.dataset.title || 'Product Details';
    const media = (card.dataset.media || '').trim();
    let desc = (card.dataset.description || '').trim();

    /* Strip HTML comments from description so only the text is shown */
    desc = desc.replace(/<!--[\s\S]*?-->/g, '').trim();
    if (!desc) {
      desc = '<em style="color:#aaa">No description provided.</em>';
    }

    modalTitle.textContent = title;
    modalDesc.innerHTML = desc;
    modalMediaWrap.innerHTML = '';

    const type = getMediaType(media);

    if (type === 'video') {
      const vid = document.createElement('video');
      vid.src = media;
      vid.autoplay = true;
      vid.controls = true;
      vid.loop = false;
      vid.muted = false;
      vid.playsInline = true;
      modalMediaWrap.appendChild(vid);
    } else if (type === 'image') {
      const img = document.createElement('img');
      img.src = media;
      img.alt = title;
      modalMediaWrap.appendChild(img);
    } else {
      /* No media provided — show placeholder */
      modalMediaWrap.innerHTML = `
        <div class="modal-media-placeholder">
          <span>🖼️</span>
          <p>No media attached yet.<br>
          Set <code>data-media="path/to/image.jpg"</code> or<br>
          <code>data-media="path/to/video.mp4"</code> on this product card.</p>
        </div>`;
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    /* Pause/unload any video */
    const vid = modalMediaWrap.querySelector('video');
    if (vid) { vid.pause(); vid.src = ''; }
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* Attach click listener to every product card */
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      /* Prevent firing when user is drag-scrolling */
      if (card.dataset.dragged === '1') return;
      openModal(card);
    });

    /* Mark drag so click doesn't fire accidentally */
    let downX = 0;
    card.addEventListener('mousedown', (e) => { downX = e.clientX; card.dataset.dragged = '0'; });
    card.addEventListener('mouseup', (e) => {
      if (Math.abs(e.clientX - downX) > 8) card.dataset.dragged = '1';
      else card.dataset.dragged = '0';
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeModal();
  });

  /* ── 9. FOOTER YEAR ── */
  const copy = document.querySelector('.footer-copy');
  if (copy) copy.textContent = `© ${new Date().getFullYear()} Wired Techniks — All rights reserved.`;

  /* ── 10. CARD TILT EFFECT ── */
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      if (e.buttons !== 0) return;
      const r = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * 8;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * -8;
      card.style.transform = `translateY(-4px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

})();
