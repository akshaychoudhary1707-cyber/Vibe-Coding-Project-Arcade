class AppController {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.engine = new BattleEngine(this.canvas);

    this.screens = {
      loading: document.getElementById('screen-loading'),
      menu: document.getElementById('screen-menu'),
      mode: document.getElementById('screen-mode'),
      fighter: document.getElementById('screen-fighter'),
      stage: document.getElementById('screen-stage'),
      controls: document.getElementById('screen-controls'),
      standby: document.getElementById('screen-standby'),
      battle: document.getElementById('screen-battle'),
      pause: document.getElementById('screen-pause'),
      matchOver: document.getElementById('screen-match-over')
    };

    this.selectedMode = 'pvb';
    this.selectedDifficulty = 'normal';

    this.fighterList = ['char1', 'char2'];
    this.selectedFighterIndex = 0;
    this.p1Choice = 'char1';
    this.p2Choice = 'char2';

    this.stageList = ['twilight_beach', 'mystic_forest', 'sunset_cove'];
    this.selectedStageIndex = 0;
    this.selectedStage = 'twilight_beach';

    this.activeScreen = 'loading';
    this.lastTime = performance.now();

    this.stagePreviewFrame = 0;
    this.stagePreviewTimer = 0;

    this.initEventListeners();
    this.initKeyListeners();
    this.startAssetLoading();
  }

  showScreen(name) {
    Object.keys(this.screens).forEach(key => {
      const el = this.screens[key];
      if (el) {
        if (key === name) {
          el.classList.remove('hidden');
        } else if (key !== 'battle' || (name !== 'pause' && name !== 'matchOver')) {
          el.classList.add('hidden');
        }
      }
    });

    if (name === 'battle') {
      this.screens.battle.classList.remove('hidden');
      this.screens.pause.classList.add('hidden');
      this.screens.matchOver.classList.add('hidden');
    }

    this.activeScreen = name;
    sounds.playMenuMove();
  }

  initEventListeners() {
    const btnStart = document.getElementById('btn-menu-start');
    const btnControls = document.getElementById('btn-menu-controls');
    const btnExit = document.getElementById('btn-menu-exit');

    if (btnStart) btnStart.addEventListener('click', () => this.showScreen('mode'));
    if (btnControls) btnControls.addEventListener('click', () => this.showScreen('controls'));
    if (btnExit) btnExit.addEventListener('click', () => this.showScreen('standby'));

    document.querySelectorAll('.btn-back-menu').forEach(btn => {
      btn.addEventListener('click', () => this.showScreen('menu'));
    });

    const standbyEl = document.getElementById('screen-standby');
    if (standbyEl) {
      standbyEl.addEventListener('click', () => this.showScreen('menu'));
    }

    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedDifficulty = btn.getAttribute('data-diff');
        sounds.playMenuSelect();
      });
    });

    const btnModeConfirm = document.getElementById('btn-mode-confirm');
    if (btnModeConfirm) {
      btnModeConfirm.addEventListener('click', () => {
        this.updateFighterSelectUI();
        this.showScreen('fighter');
      });
    }

    document.querySelectorAll('.roster-tile').forEach((tile, index) => {
      tile.addEventListener('click', () => {
        this.selectFighterByIndex(index);
      });
    });

    const btnFighterConfirm = document.getElementById('btn-fighter-confirm');
    if (btnFighterConfirm) {
      btnFighterConfirm.addEventListener('click', () => {
        this.updateStageCarouselUI();
        this.showScreen('stage');
      });
    }

    const btnStagePrev = document.getElementById('btn-stage-prev');
    const btnStageNext = document.getElementById('btn-stage-next');

    if (btnStagePrev) {
      btnStagePrev.addEventListener('click', () => {
        this.shiftStageCarousel(-1);
      });
    }

    if (btnStageNext) {
      btnStageNext.addEventListener('click', () => {
        this.shiftStageCarousel(1);
      });
    }

    document.querySelectorAll('.carousel-card').forEach((card, index) => {
      card.addEventListener('click', () => {
        this.setStageByIndex(index);
      });
    });

    const btnStageConfirm = document.getElementById('btn-stage-confirm');
    if (btnStageConfirm) {
      btnStageConfirm.addEventListener('click', () => {
        this.launchBattle();
      });
    }

    const btnResume = document.getElementById('btn-pause-resume');
    const btnRestart = document.getElementById('btn-pause-restart');
    const btnQuit = document.getElementById('btn-pause-quit');

    if (btnResume) {
      btnResume.addEventListener('click', () => {
        this.screens.pause.classList.add('hidden');
        this.engine.isPaused = false;
        sounds.playMenuSelect();
      });
    }

    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        this.screens.pause.classList.add('hidden');
        this.engine.isPaused = false;
        this.launchBattle();
      });
    }

    if (btnQuit) {
      btnQuit.addEventListener('click', () => {
        this.screens.pause.classList.add('hidden');
        this.engine.isPaused = false;
        this.showScreen('menu');
      });
    }

    const btnRematch = document.getElementById('btn-rematch');
    const btnOverMenu = document.getElementById('btn-match-over-menu');

    if (btnRematch) {
      btnRematch.addEventListener('click', () => {
        this.screens.matchOver.classList.add('hidden');
        this.launchBattle();
      });
    }

    if (btnOverMenu) {
      btnOverMenu.addEventListener('click', () => {
        this.screens.matchOver.classList.add('hidden');
        this.showScreen('menu');
      });
    }

    const btnAudioToggle = document.getElementById('btn-toggle-audio');
    if (btnAudioToggle) {
      btnAudioToggle.addEventListener('click', () => {
        const isMuted = sounds.toggleMute();
        btnAudioToggle.textContent = isMuted ? 'UNMUTE SOUND' : 'MUTE SOUND';
        btnAudioToggle.classList.toggle('muted', isMuted);
      });
    }

    this.engine.onMatchEnd = (data) => {
      this.handleMatchComplete(data);
    };
  }

  selectFighterByIndex(index) {
    const tiles = document.querySelectorAll('.roster-tile');
    if (index < 0) index = tiles.length - 1;
    if (index >= tiles.length) index = 0;

    this.selectedFighterIndex = index;

    tiles.forEach((t, i) => {
      t.classList.toggle('active', i === index);
    });

    if (index === 2) {
      this.p1Choice = Math.random() < 0.5 ? 'char1' : 'char2';
      this.p2Choice = this.p1Choice === 'char1' ? 'char2' : 'char1';
    } else {
      this.p1Choice = this.fighterList[index];
      this.p2Choice = this.p1Choice === 'char1' ? 'char2' : 'char1';
    }

    this.updateFighterStageDisplay();
    sounds.playMenuMove();
  }

  updateFighterSelectUI() {
    this.selectFighterByIndex(this.selectedFighterIndex);
  }

  updateFighterStageDisplay() {
    const cfg1 = CHAR_CONFIGS[this.p1Choice];
    const cfg2 = CHAR_CONFIGS[this.p2Choice];

    const nameEl = document.getElementById('injustice-char-name');
    const titleEl = document.getElementById('injustice-char-title');
    const descEl = document.getElementById('injustice-char-desc');

    const statSpd = document.getElementById('injustice-stat-speed');
    const statPow = document.getElementById('injustice-stat-power');
    const statDef = document.getElementById('injustice-stat-defense');
    const statRng = document.getElementById('injustice-stat-range');

    const numSpd = document.getElementById('injustice-val-speed');
    const numPow = document.getElementById('injustice-val-power');
    const numDef = document.getElementById('injustice-val-defense');
    const numRng = document.getElementById('injustice-val-range');

    if (nameEl) nameEl.textContent = cfg1.name.toUpperCase();
    if (titleEl) titleEl.textContent = cfg1.title.toUpperCase();
    if (descEl) descEl.textContent = cfg1.desc;

    if (statSpd) statSpd.style.width = `${cfg1.stats.speed}%`;
    if (statPow) statPow.style.width = `${cfg1.stats.power}%`;
    if (statDef) statDef.style.width = `${cfg1.stats.defense}%`;
    if (statRng) statRng.style.width = `${cfg1.stats.range}%`;

    if (numSpd) numSpd.textContent = cfg1.stats.speed;
    if (numPow) numPow.textContent = cfg1.stats.power;
    if (numDef) numDef.textContent = cfg1.stats.defense;
    if (numRng) numRng.textContent = cfg1.stats.range;

    const movesList = document.getElementById('injustice-movelist');
    if (movesList && cfg1.moves) {
      movesList.innerHTML = '';
      cfg1.moves.forEach(m => {
        const item = document.createElement('div');
        item.className = 'move-chip';
        item.innerHTML = `<span class="chip-key">[${m.key}]</span> <span class="chip-name">${m.name}</span> <span class="chip-type">${m.type}</span>`;
        movesList.appendChild(item);
      });
    }

    const cpuName = document.getElementById('injustice-cpu-name');
    const cpuTitle = document.getElementById('injustice-cpu-title');
    if (cpuName) cpuName.textContent = cfg2.name.toUpperCase();
    if (cpuTitle) cpuTitle.textContent = cfg2.title.toUpperCase();
  }

  shiftStageCarousel(dir) {
    let nextIdx = this.selectedStageIndex + dir;
    if (nextIdx < 0) nextIdx = this.stageList.length - 1;
    if (nextIdx >= this.stageList.length) nextIdx = 0;
    this.setStageByIndex(nextIdx);
  }

  setStageByIndex(index) {
    this.selectedStageIndex = index;
    this.selectedStage = this.stageList[index];
    this.updateStageCarouselUI();
    sounds.playMenuMove();
  }

  updateStageCarouselUI() {
    const track = document.getElementById('carousel-track');
    const cards = document.querySelectorAll('.carousel-card');
    const dots = document.querySelectorAll('.carousel-dot');

    if (track) {
      const offset = this.selectedStageIndex * 380;
      track.style.transform = `translateX(-${offset}px)`;
    }

    cards.forEach((c, i) => {
      c.classList.toggle('active', i === this.selectedStageIndex);
    });

    dots.forEach((d, i) => {
      d.classList.toggle('active', i === this.selectedStageIndex);
    });

    const activeStage = STAGE_CONFIGS[this.selectedStage];
    const headerTitle = document.getElementById('stage-selected-title');
    const headerLoc = document.getElementById('stage-selected-location');
    const headerDesc = document.getElementById('stage-selected-desc');

    if (headerTitle && activeStage) headerTitle.textContent = activeStage.name.toUpperCase();
    if (headerLoc && activeStage) headerLoc.textContent = activeStage.location.toUpperCase();
    if (headerDesc && activeStage) headerDesc.textContent = activeStage.desc;
  }

  launchBattle() {
    const cfg1 = CHAR_CONFIGS[this.p1Choice];
    const cfg2 = CHAR_CONFIGS[this.p2Choice];

    this.engine.setupMatch(cfg1, cfg2, this.selectedStage, 'pvb', this.selectedDifficulty);
    this.showScreen('battle');
  }

  handleMatchComplete(data) {
    const titleEl = document.getElementById('match-over-winner');
    const p1ScoreEl = document.getElementById('match-over-p1-score');
    const p2ScoreEl = document.getElementById('match-over-p2-score');

    if (titleEl) {
      if (data.winner === 'DRAW') {
        titleEl.textContent = 'DRAW MATCH';
      } else {
        titleEl.textContent = `${data.winner} VICTORIOUS!`;
      }
    }

    if (p1ScoreEl) p1ScoreEl.textContent = `${data.p1Config.name}: ${data.p1RoundsWon} Rounds`;
    if (p2ScoreEl) p2ScoreEl.textContent = `${data.p2Config.name}: ${data.p2RoundsWon} Rounds`;

    this.screens.matchOver.classList.remove('hidden');
    sounds.playRoundBell();
  }

  initKeyListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.activeScreen === 'battle') {
          this.engine.isPaused = !this.engine.isPaused;
          this.screens.pause.classList.toggle('hidden', !this.engine.isPaused);
          sounds.playMenuMove();
        }
        return;
      }

      if (this.activeScreen === 'standby') {
        this.showScreen('menu');
        return;
      }

      if (this.activeScreen === 'fighter') {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          this.selectFighterByIndex(this.selectedFighterIndex - 1);
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          this.selectFighterByIndex(this.selectedFighterIndex + 1);
        } else if (e.code === 'Enter' || e.code === 'Space') {
          this.updateStageCarouselUI();
          this.showScreen('stage');
        }
        return;
      }

      if (this.activeScreen === 'stage') {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          this.shiftStageCarousel(-1);
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          this.shiftStageCarousel(1);
        } else if (e.code === 'Enter' || e.code === 'Space') {
          this.launchBattle();
        }
        return;
      }

      if (this.activeScreen !== 'battle' || this.engine.isPaused) return;

      const p1 = this.engine.player1;

      if (p1 && !p1.isBot) {
        if (e.code === 'KeyW') p1.keys.up = true;
        if (e.code === 'KeyS') p1.keys.down = true;
        if (e.code === 'KeyA') p1.keys.left = true;
        if (e.code === 'KeyD') p1.keys.right = true;
        if (e.code === 'KeyJ') p1.keys.attack1 = true;
        if (e.code === 'KeyK') p1.keys.attack2 = true;
        if (e.code === 'KeyL') p1.keys.ultimate = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.activeScreen !== 'battle') return;

      const p1 = this.engine.player1;

      if (p1 && !p1.isBot) {
        if (e.code === 'KeyW') p1.keys.up = false;
        if (e.code === 'KeyS') p1.keys.down = false;
        if (e.code === 'KeyA') p1.keys.left = false;
        if (e.code === 'KeyD') p1.keys.right = false;
        if (e.code === 'KeyJ') p1.keys.attack1 = false;
        if (e.code === 'KeyK') p1.keys.attack2 = false;
        if (e.code === 'KeyL') p1.keys.ultimate = false;
      }
    });
  }

  startAssetLoading() {
    const bar = document.getElementById('loading-bar-fill');
    const text = document.getElementById('loading-status-text');

    assets.preloadAll((pct) => {
      const percentage = Math.round(pct * 100);
      if (bar) bar.style.width = `${percentage}%`;
      if (text) text.textContent = `LOADING ASSETS... ${percentage}%`;
    }).then(() => {
      if (text) text.textContent = 'SYSTEM READY';
      setTimeout(() => {
        this.renderAllRosterTileIcons();
        this.renderAllStagePreviews();
        this.showScreen('menu');
        this.startLoop();
      }, 350);
    });
  }

  renderAllRosterTileIcons() {
    const rosterCanvases = [
      { id: 'tile-canvas-0', config: CHAR_CONFIGS.char1 },
      { id: 'tile-canvas-1', config: CHAR_CONFIGS.char2 }
    ];

    rosterCanvases.forEach(item => {
      const c = document.getElementById(item.id);
      if (!c) return;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const img = assets.getImage(item.config.animations.idle.path);
      if (!img) return;

      const scale = 1.35;
      const frameW = item.config.frameWidth;
      const frameH = item.config.frameHeight;

      ctx.save();
      ctx.translate(c.width / 2, c.height - 4);

      ctx.drawImage(
        img,
        0,
        0,
        frameW,
        frameH,
        -item.config.anchorX * scale,
        -item.config.anchorY * scale,
        frameW * scale,
        frameH * scale
      );
      ctx.restore();
    });
  }

  renderAllStagePreviews() {
    const stageItems = [
      { id: 'stage-canvas-0', path: STAGE_CONFIGS.twilight_beach.preview },
      { id: 'stage-canvas-1', path: STAGE_CONFIGS.mystic_forest.preview },
      { id: 'stage-canvas-2', path: STAGE_CONFIGS.sunset_cove.preview }
    ];

    stageItems.forEach(item => {
      const c = document.getElementById(item.id);
      if (!c) return;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const img = assets.getImage(item.path);
      if (img && img.width > 0) {
        ctx.drawImage(img, 0, 0, c.width, c.height);
      }
    });
  }

  startLoop() {
    const loop = (timestamp) => {
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
      this.lastTime = timestamp;

      this.update(dt);
      this.render();

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update(dt) {
    if (this.activeScreen === 'battle') {
      this.engine.update(dt);
    } else if (this.activeScreen === 'fighter') {
      this.updateFighterSelectStage(dt);
    }
  }

  updateFighterSelectStage(dt) {
    const cfg1 = CHAR_CONFIGS[this.p1Choice];
    const cfg2 = CHAR_CONFIGS[this.p2Choice];

    this.stagePreviewTimer += dt * cfg1.animations.idle.speed;
    if (this.stagePreviewTimer >= 1) {
      this.stagePreviewFrame = (this.stagePreviewFrame + 1) % cfg1.animations.idle.frames;
      this.stagePreviewTimer %= 1;
    }

    this.drawInjusticeStagePreview('injustice-stage-canvas', cfg1, this.stagePreviewFrame);
    this.drawInjusticeCpuPreview('injustice-cpu-canvas', cfg2);
  }

  drawInjusticeStagePreview(canvasId, config, frameIdx) {
    const c = document.getElementById(canvasId);
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);

    const grad = ctx.createRadialGradient(c.width / 2, c.height - 30, 10, c.width / 2, c.height - 30, 140);
    grad.addColorStop(0, 'rgba(28, 181, 224, 0.4)');
    grad.addColorStop(0.5, 'rgba(212, 175, 55, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(c.width / 2, c.height - 25, 120, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    const img = assets.getImage(config.animations.idle.path);
    if (!img) return;

    const scale = 2.8;
    const frameW = config.frameWidth;
    const frameH = config.frameHeight;

    ctx.save();
    ctx.translate(c.width / 2, c.height - 25);

    ctx.drawImage(
      img,
      frameIdx * frameW,
      0,
      frameW,
      frameH,
      -config.anchorX * scale,
      -config.anchorY * scale,
      frameW * scale,
      frameH * scale
    );

    ctx.restore();
  }

  drawInjusticeCpuPreview(canvasId, config) {
    const c = document.getElementById(canvasId);
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);

    const img = assets.getImage(config.animations.idle.path);
    if (!img) return;

    const scale = 1.6;
    const frameW = config.frameWidth;
    const frameH = config.frameHeight;

    ctx.save();
    ctx.translate(c.width / 2, c.height - 10);
    ctx.scale(-1, 1);

    ctx.drawImage(
      img,
      0,
      0,
      frameW,
      frameH,
      -config.anchorX * scale,
      -config.anchorY * scale,
      frameW * scale,
      frameH * scale
    );

    ctx.restore();
  }

  render() {
    if (this.activeScreen === 'battle') {
      this.engine.render();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
