/**
 * Hilal & Sinan - Özel Aşk Portalı & iOS Kilit Ekranı
 * Akıllı Etkileşimler, iOS Kilit Açma, Web Audio API ve Canlı Sayaç
 */

document.addEventListener("DOMContentLoaded", () => {
  // ===================================================
  // 1. TEMEL DEĞİŞKENLER & HEDEF ŞİFRE
  // ===================================================
  const TARGET_PASSCODE = "31052026"; // 31 Mayıs 2026
  let enteredPasscode = "";
  const PASSCODE_LENGTH = 8;
  const TARGET_DATE = new Date("2026-05-31T00:00:00");

  // DOM Elemanları
  const lockscreenOverlay = document.getElementById("lockscreenOverlay");
  const mainContent = document.getElementById("mainContent");
  const passcodeDots = document.querySelectorAll(".passcode-dot");
  const lockIcon = document.getElementById("lockIcon");
  const lockIconWrap = document.getElementById("lockIconWrap");
  const dotsContainer = document.getElementById("passcodeDotsContainer");
  const liveClockEl = document.getElementById("liveClock");
  const keypadButtons = document.querySelectorAll(".key-btn");
  const relockBtn = document.getElementById("relockBtn");
  const musicToggleBtn = document.getElementById("musicToggleBtn");
  const musicIcon = document.getElementById("musicIcon");

  // Sayaç Elemanları
  const timerDays = document.getElementById("timerDays");
  const timerHours = document.getElementById("timerHours");
  const timerMinutes = document.getElementById("timerMinutes");
  const timerSeconds = document.getElementById("timerSeconds");
  const timerTitle = document.getElementById("timerTitle");
  const timerTag = document.getElementById("timerTag");
  const timerFooterNote = document.getElementById("timerFooterNote");

  // Mektup & Zarf Elemanları
  const loveEnvelope = document.getElementById("loveEnvelope");
  const letterModal = document.getElementById("letterModal");
  const closeLetterBtn = document.getElementById("closeLetterBtn");

  // Neden Hilal?
  const randomReasonText = document.getElementById("randomReasonText");
  const newReasonBtn = document.getElementById("newReasonBtn");

  // ===================================================
  // 2. WEB AUDIO API - IPHONE SESLERİ & SENTEZÖR
  // ===================================================
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // iPhone Tuş Tıklama Sesi (Kısa mekanik click)
  function playKeyClickSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      console.warn("Audio context click error:", e);
    }
  }

  // Kilit Açılma Melodisi (Hafif lüks chime)
  function playUnlockSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const chords = [523.25, 659.25, 783.99, 1046.50]; // C5 - E5 - G5 - C6
      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.5);
      });
    } catch (e) {
      console.warn("Audio context unlock error:", e);
    }
  }

  // Hata Sesi (Yanlış şifre titremesi)
  function playErrorSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [220, 196].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.12, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.18);
      });
    } catch (e) {
      console.warn("Audio context error tone:", e);
    }
  }

  // ===================================================
  // 3. IPHONE SAATİ GÜNCELLEME
  // ===================================================
  function updateLiveClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    if (liveClockEl) {
      liveClockEl.textContent = `${hours}:${minutes}`;
    }
  }
  updateLiveClock();
  setInterval(updateLiveClock, 1000);

  // ===================================================
  // 4. ŞİFRE GİRME & TUŞ TAKIMI MEKANİZMASI
  // ===================================================
  function updateDots() {
    passcodeDots.forEach((dot, index) => {
      if (index < enteredPasscode.length) {
        dot.classList.add("filled");
      } else {
        dot.classList.remove("filled");
      }
      dot.classList.remove("wrong");
    });
  }

  function handleKeyInput(char) {
    if (enteredPasscode.length >= PASSCODE_LENGTH) return;
    
    enteredPasscode += char;
    playKeyClickSound();
    updateDots();

    if (enteredPasscode.length === PASSCODE_LENGTH) {
      // 8 karakter tamamlandı - Kontrol Et
      setTimeout(verifyPasscode, 150);
    }
  }

  function handleDelete() {
    if (enteredPasscode.length > 0) {
      enteredPasscode = enteredPasscode.slice(0, -1);
      playKeyClickSound();
      updateDots();
    }
  }

  function verifyPasscode() {
    if (enteredPasscode === TARGET_PASSCODE) {
      // DOĞRU ŞİFRE!
      unlockPortal();
    } else {
      // YANLIŞ ŞİFRE!
      playErrorSound();
      dotsContainer.classList.add("shake");
      passcodeDots.forEach(dot => dot.classList.add("wrong"));

      if (navigator.vibrate) {
        navigator.vibrate([80, 40, 80]);
      }

      setTimeout(() => {
        dotsContainer.classList.remove("shake");
        enteredPasscode = "";
        updateDots();
      }, 600);
    }
  }

  function unlockPortal() {
    playUnlockSound();
    
    // Asma kilit açılma animasyonu
    if (lockIcon) {
      lockIcon.innerHTML = `
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v1"></path>
      `;
    }
    if (lockIconWrap) {
      lockIconWrap.style.borderColor = "#34c759";
      lockIconWrap.style.background = "rgba(52, 199, 89, 0.2)";
    }

    // Konfeti & Kalp Patlaması
    triggerHeartExplosion(window.innerWidth / 2, window.innerHeight / 2);

    setTimeout(() => {
      lockscreenOverlay.classList.add("unlocked");
      mainContent.classList.add("visible");
      sessionStorage.setItem("hilal_sinan_unlocked", "true");
      
      // Otomatik romantik arka plan melodisini hazırla
      initBackgroundMusic();
    }, 450);
  }

  function lockPortal() {
    enteredPasscode = "";
    updateDots();
    sessionStorage.removeItem("hilal_sinan_unlocked");
    
    if (lockIcon) {
      lockIcon.innerHTML = `
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      `;
    }
    if (lockIconWrap) {
      lockIconWrap.style.borderColor = "rgba(255, 255, 255, 0.15)";
      lockIconWrap.style.background = "rgba(255, 255, 255, 0.08)";
    }

    mainContent.classList.remove("visible");
    lockscreenOverlay.classList.remove("unlocked");
    stopBackgroundMusic();
  }

  // Keypad buton tıklamaları
  keypadButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const val = btn.getAttribute("data-key");
      if (val === "delete") {
        handleDelete();
      } else if (val !== null) {
        handleKeyInput(val);
      }
    });
  });

  // Fiziksel klavye desteği
  document.addEventListener("keydown", (e) => {
    if (lockscreenOverlay.classList.contains("unlocked")) return;
    if (e.key >= "0" && e.key <= "9") {
      handleKeyInput(e.key);
    } else if (e.key === "Backspace") {
      handleDelete();
    }
  });

  if (relockBtn) {
    relockBtn.addEventListener("click", lockPortal);
  }

  // Daha önceden açılmışsa otomatik açma kontrolü (Kullanıcı yenilediğinde kolaylık)
  if (sessionStorage.getItem("hilal_sinan_unlocked") === "true") {
    lockscreenOverlay.classList.add("unlocked");
    mainContent.classList.add("visible");
  }

  // ===================================================
  // 5. 31.05.2026 CANLI ZAMAN SAYACI (İLERİ/GERİ DİNAMİK)
  // ===================================================
  function updateCountdown() {
    const now = new Date();
    const diff = TARGET_DATE - now;

    if (diff > 0) {
      // Hedef henüz gelmedi: Geri Sayım
      if (timerTag) timerTag.textContent = "İLK MESAJ & TANIŞMA GÜNÜMÜZE KALAN";
      if (timerTitle) timerTitle.textContent = "31 Mayıs 2026";
      if (timerFooterNote) timerFooterNote.textContent = "✨ Sana ilk mesajı attığım o mucizevi an...";

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      timerDays.textContent = String(days);
      timerHours.textContent = String(hours).padStart(2, "0");
      timerMinutes.textContent = String(minutes).padStart(2, "0");
      timerSeconds.textContent = String(seconds).padStart(2, "0");
    } else {
      // Hedef tarih geldi veya geçti: İleri Sayım (İlk mesajdan beri geçen zaman)
      if (timerTag) timerTag.textContent = "İLK MESAJ VE TANIŞMAMIZDAN BERİ GEÇEN ZAMAN";
      if (timerTitle) timerTitle.textContent = "31 Mayıs 2026'dan Beri";
      if (timerFooterNote) timerFooterNote.textContent = "❤️ Sana ilk mesajı attığım andan beri geçen her saniye daha çok seviyorum...";

      const elapsed = Math.abs(diff);
      const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
      const hours = Math.floor((elapsed / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((elapsed / 1000 / 60) % 60);
      const seconds = Math.floor((elapsed / 1000) % 60);

      timerDays.textContent = String(days);
      timerHours.textContent = String(hours).padStart(2, "0");
      timerMinutes.textContent = String(minutes).padStart(2, "0");
      timerSeconds.textContent = String(seconds).padStart(2, "0");
    }
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ===================================================
  // 6. ARKA PLAN MÜZİĞİ (6. SANİYEDEN 2:40'A KADAR DÖNGÜ)
  // ===================================================
  const bgAudio = document.getElementById("bgMusic");
  const MUSIC_START_TIME = 6;    // 6. saniye
  const MUSIC_END_TIME = 160;    // 2:40 (160. saniye)
  let isPlayingMusic = false;

  if (bgAudio) {
    bgAudio.volume = 0.75;

    // 2:40 (160. saniye) olduğunda başa (6. saniyeye) sar
    bgAudio.addEventListener("timeupdate", () => {
      if (bgAudio.currentTime >= MUSIC_END_TIME) {
        bgAudio.currentTime = MUSIC_START_TIME;
      }
    });

    bgAudio.addEventListener("ended", () => {
      bgAudio.currentTime = MUSIC_START_TIME;
      bgAudio.play().catch(e => console.warn(e));
    });
  }

  function initBackgroundMusic() {
    if (!bgAudio) return;
    if (bgAudio.currentTime < MUSIC_START_TIME || bgAudio.currentTime >= MUSIC_END_TIME) {
      bgAudio.currentTime = MUSIC_START_TIME;
    }
    bgAudio.play().then(() => {
      isPlayingMusic = true;
      if (musicToggleBtn) {
        musicToggleBtn.classList.add("playing");
        musicToggleBtn.innerHTML = `<span>🎵</span> Müzik Açık`;
      }
    }).catch(err => {
      console.warn("Müzik otomatik başlatılamadı (kullanıcı dokunuşu bekleniyor):", err);
    });
  }

  function stopBackgroundMusic() {
    if (!bgAudio) return;
    bgAudio.pause();
    isPlayingMusic = false;
    if (musicToggleBtn) {
      musicToggleBtn.classList.remove("playing");
      musicToggleBtn.innerHTML = `<span>🔈</span> Müziği Başlat`;
    }
  }

  if (musicToggleBtn) {
    musicToggleBtn.addEventListener("click", () => {
      if (isPlayingMusic) {
        stopBackgroundMusic();
      } else {
        initBackgroundMusic();
      }
    });
  }

  // ===================================================
  // 7. İNTERAKTİF AŞK MEKTUBU & ZARF
  // ===================================================
  if (loveEnvelope) {
    loveEnvelope.addEventListener("click", () => {
      loveEnvelope.classList.add("open");
      playUnlockSound();
      setTimeout(() => {
        if (letterModal) letterModal.classList.add("active");
        letterModal.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    });
  }

  if (closeLetterBtn) {
    closeLetterBtn.addEventListener("click", () => {
      if (letterModal) letterModal.classList.remove("active");
      if (loveEnvelope) loveEnvelope.classList.remove("open");
    });
  }

  // ===================================================
  // 8. "NEDEN HİLAL?" (RASTGELE AŞK NEDENLERİ)
  // ===================================================
  const loveReasons = [
    "Gülüşünle dünyadaki tüm kederleri unutturduğun için.",
    "Bana aşkın ne kadar saf ve güzel bir duygu olduğunu öğrettiğin için.",
    "Gözlerindeki ışıkla yolumu aydınlattığın için.",
    "Sadece sesini duyduğumda bile içimde kelebekler uçurduğun için.",
    "Kalbinin pamuk kadar yumuşak ve şefkat dolu olması yüzünden.",
    "Benim en güzel şansım, en kıymetli hazinem olduğun için.",
    "Seninleyken zamanın durmasını isteyecek kadar mutlu hissettiğim için.",
    "Bir bakışınla bana kendimi dünyanın en özel insanı hissettirdiğin için.",
    "Hayatımın en güzel anlarını hep seninle paylaştığım için.",
    "Geleceğe baktığımda yalnızca senin gözlerini görmek istediğim için.",
    "31.05.2026 ve sonsuza dek kalbimin tek sahibi olduğun için.",
    "Ellerini tuttuğumda hissettiğim o tarifsiz huzur için.",
    "Benim en yakın arkadaşım, sevgilim ve sonsuz aşkım olduğun için.",
    "Her yeni güne senin varlığına şükrederek başladığım için."
  ];

  let currentReasonIdx = 0;
  if (newReasonBtn && randomReasonText) {
    newReasonBtn.addEventListener("click", () => {
      triggerHeartExplosion(window.innerWidth / 2, window.innerHeight * 0.7);
      randomReasonText.style.opacity = "0";
      setTimeout(() => {
        currentReasonIdx = (currentReasonIdx + 1) % loveReasons.length;
        randomReasonText.textContent = `"${loveReasons[currentReasonIdx]}"`;
        randomReasonText.style.opacity = "1";
      }, 250);
    });
  }

  // ===================================================
  // 9. CANVAS PARTİKÜL EFEKTLERİ (YILDIZLAR & KALPLER)
  // ===================================================
  const canvas = document.getElementById("ambient-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const PARTICLE_COUNT = 35;

    class FloatingHeart {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * width;
        this.y = height + Math.random() * 50;
        this.size = Math.random() * 12 + 6;
        this.speedY = Math.random() * 0.7 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.color = Math.random() > 0.4 ? "rgba(244, 166, 184," : "rgba(255, 77, 121,";
      }
      update() {
        this.y -= this.speedY;
        this.x += this.speedX;
        if (this.y < -30) {
          this.reset();
        }
      }
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = `${this.color} ${this.opacity})`;
        ctx.beginPath();
        const topCurveHeight = this.size * 0.3;
        ctx.moveTo(0, topCurveHeight);
        ctx.bezierCurveTo(0, 0, -this.size / 2, 0, -this.size / 2, topCurveHeight);
        ctx.bezierCurveTo(-this.size / 2, (this.size + topCurveHeight) / 2, 0, this.size, 0, this.size * 1.3);
        ctx.bezierCurveTo(0, this.size, this.size / 2, (this.size + topCurveHeight) / 2, this.size / 2, topCurveHeight);
        ctx.bezierCurveTo(this.size / 2, 0, 0, 0, 0, topCurveHeight);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = new FloatingHeart();
      p.y = Math.random() * height;
      particles.push(p);
    }

    // Patlama kalpleri dizisi
    const burstParticles = [];

    class BurstParticle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.size = Math.random() * 14 + 8;
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.015;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // yerçekimi
        this.alpha -= this.decay;
      }
      draw() {
        if (this.alpha <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = `rgba(255, 77, 121, ${this.alpha})`;
        ctx.beginPath();
        const topCurveHeight = this.size * 0.3;
        ctx.moveTo(0, topCurveHeight);
        ctx.bezierCurveTo(0, 0, -this.size / 2, 0, -this.size / 2, topCurveHeight);
        ctx.bezierCurveTo(-this.size / 2, (this.size + topCurveHeight) / 2, 0, this.size, 0, this.size * 1.3);
        ctx.bezierCurveTo(0, this.size, this.size / 2, (this.size + topCurveHeight) / 2, this.size / 2, topCurveHeight);
        ctx.bezierCurveTo(this.size / 2, 0, 0, 0, 0, topCurveHeight);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    window.triggerHeartExplosion = function (x, y) {
      for (let i = 0; i < 30; i++) {
        burstParticles.push(new BurstParticle(x, y));
      }
    };

    function renderCanvas() {
      ctx.clearRect(0, 0, width, height);

      // Yavaş uçuşan kalpler
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      // Tıklama patlamaları
      for (let i = burstParticles.length - 1; i >= 0; i--) {
        const bp = burstParticles[i];
        bp.update();
        bp.draw();
        if (bp.alpha <= 0) {
          burstParticles.splice(i, 1);
        }
      }

      requestAnimationFrame(renderCanvas);
    }
    renderCanvas();

    // Ekrana tıklama / dokunmada kalp fışkırtma
    window.addEventListener("pointerdown", (e) => {
      if (Math.random() > 0.3) {
        for (let i = 0; i < 5; i++) {
          burstParticles.push(new BurstParticle(e.clientX, e.clientY));
        }
      }
    });
  }

  // ===================================================
  // 10. DİNAMİK YANIP SÖNEN KIRMIZI KALP FAVICON
  // ===================================================
  function initPulsingHeartFavicon() {
    const favicon = document.getElementById("dynamicFavicon") || document.querySelector("link[rel*='icon']");
    if (!favicon) return;

    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");

    let isHeartOn = true;

    function drawHeart(scale, alpha) {
      ctx.clearRect(0, 0, 32, 32);
      ctx.save();
      ctx.translate(16, 16);
      ctx.scale(scale, scale);
      ctx.translate(-16, -16);

      // Kırmızı kalp çizimi
      ctx.fillStyle = `rgba(255, 23, 68, ${alpha})`;
      ctx.shadowColor = `rgba(255, 45, 85, ${alpha * 0.8})`;
      ctx.shadowBlur = alpha > 0.5 ? 6 : 0;

      ctx.beginPath();
      // Kalp bezier eğrileri (32x32 içine sığacak oranlar)
      ctx.moveTo(16, 27);
      ctx.bezierCurveTo(6, 18, 2, 13, 2, 8);
      ctx.bezierCurveTo(2, 3.5, 5.5, 1, 10, 1);
      ctx.bezierCurveTo(13, 1, 15, 2.5, 16, 4.5);
      ctx.bezierCurveTo(17, 2.5, 19, 1, 22, 1);
      ctx.bezierCurveTo(26.5, 1, 30, 3.5, 30, 8);
      ctx.bezierCurveTo(30, 13, 26, 18, 16, 27);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      favicon.href = canvas.toDataURL("image/png");
    }

    // İlk çizim
    drawHeart(1.0, 1.0);

    // Yanıp sönme döngüsü (600ms aralıkla açık/kapalı)
    setInterval(() => {
      isHeartOn = !isHeartOn;
      if (isHeartOn) {
        drawHeart(1.0, 1.0); // Parlak açık kırmızı kalp
      } else {
        drawHeart(0.7, 0.2); // Sönük / transparan kalp
      }
    }, 600);
  }

  initPulsingHeartFavicon();
});
