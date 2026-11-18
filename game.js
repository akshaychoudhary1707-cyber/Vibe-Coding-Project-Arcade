class BattleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.background = new ParallaxBackground(canvas);
    this.stageWidth = 2048;
    this.groundY = 580;

    this.player1 = null;
    this.player2 = null;
    this.bot1 = null;
    this.bot2 = null;
    this.mode = 'pvb';
    this.botDifficulty = 'normal';

    this.cameraX = 0;
    this.cameraTargetX = 0;

    this.roundTime = 120;
    this.currentRound = 1;
    this.maxRounds = 3;
    this.p1RoundsWon = 0;
    this.p2RoundsWon = 0;

    this.matchState = 'loading';
    this.announcement = '';
    this.announcementTimer = 0;
    this.roundEndTimer = 0;
    this.shakeTimer = 0;
    this.shakeIntensity = 0;

    this.particles = [];
    this.floatingTexts = [];

    this.isPaused = false;
    this.onMatchEnd = null;
  }

  setupMatch(p1Config, p2Config, stageId = 'twilight_beach', mode = 'pvb', botDifficulty = 'normal') {
    this.mode = mode;
    this.botDifficulty = botDifficulty;
    this.background.setStage(stageId);

    const startP1X = 750;
    const startP2X = 1290;

    this.player1 = new Fighter(p1Config, startP1X, this.groundY, 1, mode === 'bvb');
    this.player2 = new Fighter(p2Config, startP2X, this.groundY, -1, mode === 'pvb' || mode === 'bvb');

    this.p1RoundsWon = 0;
    this.p2RoundsWon = 0;
    this.currentRound = 1;

    if (mode === 'bvb') {
      this.bot1 = new BotController(this.player1, this.player2, botDifficulty);
    } else {
      this.bot1 = null;
    }

    if (mode === 'pvb' || mode === 'bvb') {
      this.bot2 = new BotController(this.player2, this.player1, botDifficulty);
    } else {
      this.bot2 = null;
    }

    this.startRound(1);
  }

  startRound(roundNumber) {
    this.currentRound = roundNumber;
    this.roundTime = 120;
    this.roundEndTimer = 0;

    const startP1X = 750;
    const startP2X = 1290;
    this.player1.reset(startP1X, this.groundY, 1);
    this.player2.reset(startP2X, this.groundY, -1);

    this.particles = [];
    this.floatingTexts = [];

    this.cameraTargetX = (startP1X + startP2X) / 2 - this.canvas.width / 2;
    this.cameraX = this.cameraTargetX;

    this.matchState = 'intro';
    const label = roundNumber === 3 ? 'FINAL ROUND' : `ROUND ${roundNumber}`;
    this.setAnnouncement(label, 1.4, () => {
      this.setAnnouncement('FIGHT!', 0.9, () => {
        this.matchState = 'fighting';
        sounds.playRoundBell();
      });
    });
  }

  setAnnouncement(text, duration, onComplete = null) {
    this.announcement = text;
    this.announcementTimer = duration;
    this.announcementCallback = onComplete;
  }

  triggerScreenShake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeTimer = duration;
  }

  spawnHitSparks(x, y, color = '#ffdf6d', count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.25 + Math.random() * 0.25,
        maxLife: 0.5,
        color: color,
        size: 3 + Math.random() * 3
      });
    }
  }

  spawnFloatingText(text, x, y, color = '#ffffff', size = 20) {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -2,
      life: 0.75,
      maxLife: 0.75,
      color: color,
      size: size
    });
  }

  update(dt) {
    if (this.isPaused) return;

    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
    }

    if (this.announcementTimer > 0) {
      this.announcementTimer -= dt;
      if (this.announcementTimer <= 0) {
        this.announcement = '';
        if (this.announcementCallback) {
          const cb = this.announcementCallback;
          this.announcementCallback = null;
          cb();
        }
      }
    }

    this.background.update(dt);

    if (this.matchState === 'fighting') {
      this.roundTime = Math.max(0, this.roundTime - dt);
      if (this.roundTime <= 0) {
        this.handleTimeOut();
      }
    }

    if (this.bot1) this.bot1.update(dt);
    if (this.bot2) this.bot2.update(dt);

    this.player1.update(dt, this.player2, this.stageWidth, this.groundY);
    this.player2.update(dt, this.player1, this.stageWidth, this.groundY);

    this.resolvePushCollisions();

    if (this.matchState === 'fighting') {
      this.checkCombatHits();
      this.checkRoundDecisions();
    } else if (this.matchState === 'round_over') {
      this.roundEndTimer += dt;
      if (this.roundEndTimer >= 2.6) {
        this.advanceRoundOrEnd();
      }
    }

    this.updateCamera();
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
  }

  resolvePushCollisions() {
    const minDistance = 46;
    const dx = this.player2.x - this.player1.x;
    const dist = Math.abs(dx);

    if (dist < minDistance && this.player1.isGrounded && this.player2.isGrounded) {
      const overlap = (minDistance - dist) / 2;
      if (dx > 0) {
        this.player1.x -= overlap;
        this.player2.x += overlap;
      } else {
        this.player1.x += overlap;
        this.player2.x -= overlap;
      }
      this.player1.clampStage(this.stageWidth);
      this.player2.clampStage(this.stageWidth);
    }
  }

  checkCombatHits() {
    this.checkSingleHit(this.player1, this.player2);
    this.checkSingleHit(this.player2, this.player1);
  }

  checkSingleHit(attacker, defender) {
    if (!attacker.attackHitbox || attacker.hasHitOpponent) return;

    const boxA = attacker.attackHitbox;
    const boxB = defender.hurtbox;

    const intersects = (
      boxA.x < boxB.x + boxB.width &&
      boxA.x + boxA.width > boxB.x &&
      boxA.y < boxB.y + boxB.height &&
      boxA.y + boxA.height > boxB.y
    );

    if (intersects) {
      attacker.hasHitOpponent = true;
      const result = defender.takeDamage(boxA.damage, boxA.isHeavy, boxA.isUltimate, attacker);
      const impactX = (boxA.x + boxB.x + boxB.width / 2) / 2;
      const impactY = boxB.y + boxB.height * 0.45;

      if (result.blocked) {
        this.spawnHitSparks(impactX, impactY, '#60caff', 16);
        this.spawnFloatingText('GUARD!', impactX, impactY - 15, '#60caff', 20);
      } else {
        attacker.comboCount = (attacker.comboCount || 0) + 1;
        attacker.comboTimer = 1.6;

        if (boxA.isUltimate) {
          attacker.addMeter(0);
          this.triggerScreenShake(14, 0.4);
          this.spawnHitSparks(impactX, impactY, '#ffef5e', 36);
          this.spawnFloatingText('ULTIMATE!', impactX, impactY - 30, '#ffea00', 28);
        } else {
          attacker.addMeter(boxA.isHeavy ? 25 : 15);
          this.triggerScreenShake(boxA.isHeavy ? 7 : 3, 0.18);
          this.spawnHitSparks(impactX, impactY, boxA.isHeavy ? '#ff6633' : '#ffea5e', boxA.isHeavy ? 20 : 12);
          this.spawnFloatingText(`-${result.damage}`, impactX, impactY - 20, '#ff3b30', 22);
        }

        if (attacker.comboCount > 1) {
          this.spawnFloatingText(`${attacker.comboCount} HITS!`, attacker.x, attacker.y - 140, '#ffb800', 24);
        }
      }
    }
  }

  checkRoundDecisions() {
    if (this.player1.health <= 0 || this.player2.health <= 0) {
      this.matchState = 'round_over';
      this.roundEndTimer = 0;

      let winnerText = '';
      if (this.player1.health <= 0 && this.player2.health <= 0) {
        winnerText = 'DOUBLE K.O. - DRAW!';
      } else if (this.player1.health <= 0) {
        this.p2RoundsWon++;
        this.player2.roundsWon = this.p2RoundsWon;
        winnerText = this.mode === 'pvb' ? 'CPU WINS ROUND!' : `${this.player2.config.name} WINS!`;
      } else {
        this.p1RoundsWon++;
        this.player1.roundsWon = this.p1RoundsWon;
        winnerText = `${this.player1.config.name} WINS ROUND!`;
      }

      this.setAnnouncement('K.O.!', 1.2, () => {
        this.setAnnouncement(winnerText, 1.4);
      });
    }
  }

  handleTimeOut() {
    this.matchState = 'round_over';
    this.roundEndTimer = 0;

    let winnerText = '';
    if (this.player1.health > this.player2.health) {
      this.p1RoundsWon++;
      this.player1.roundsWon = this.p1RoundsWon;
      winnerText = `${this.player1.config.name} WINS ON TIME!`;
    } else if (this.player2.health > this.player1.health) {
      this.p2RoundsWon++;
      this.player2.roundsWon = this.p2RoundsWon;
      winnerText = this.mode === 'pvb' ? 'CPU WINS ON TIME!' : `${this.player2.config.name} WINS ON TIME!`;
    } else {
      winnerText = 'TIME OUT - DRAW!';
    }

    this.setAnnouncement('TIME UP!', 1.2, () => {
      this.setAnnouncement(winnerText, 1.4);
    });
  }

  advanceRoundOrEnd() {
    if (this.p1RoundsWon >= 2 || this.p2RoundsWon >= 2 || this.currentRound >= this.maxRounds) {
      this.matchState = 'match_over';
      let overallWinner = 'DRAW';
      if (this.p1RoundsWon > this.p2RoundsWon) {
        overallWinner = 'PLAYER 1';
      } else if (this.p2RoundsWon > this.p1RoundsWon) {
        overallWinner = this.mode === 'pvb' ? 'CPU' : 'PLAYER 2';
      }

      if (this.onMatchEnd) {
        this.onMatchEnd({
          winner: overallWinner,
          p1RoundsWon: this.p1RoundsWon,
          p2RoundsWon: this.p2RoundsWon,
          p1Config: this.player1.config,
          p2Config: this.player2.config,
          mode: this.mode
        });
      }
    } else {
      this.startRound(this.currentRound + 1);
    }
  }

  updateCamera() {
    const midX = (this.player1.x + this.player2.x) / 2;
    this.cameraTargetX = midX - this.canvas.width / 2;
    this.cameraTargetX = Math.max(0, Math.min(this.cameraTargetX, this.stageWidth - this.canvas.width));
    this.cameraX += (this.cameraTargetX - this.cameraX) * 0.12;
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  updateFloatingTexts(dt) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render() {
    this.ctx.save();

    if (this.shakeTimer > 0) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity;
      const sy = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(sx, sy);
    }

    this.background.draw(this.ctx, this.cameraX);

    if (this.player1.superFreeze > 0 || this.player2.superFreeze > 0) {
      this.ctx.fillStyle = 'rgba(10, 5, 20, 0.45)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    this.player1.draw(this.ctx, this.cameraX);
    this.player2.draw(this.ctx, this.cameraX);

    this.renderParticles();
    this.renderFloatingTexts();

    this.ctx.restore();

    this.renderHUD();

    if (this.announcement) {
      this.renderAnnouncement();
    }
  }

  renderParticles() {
    this.particles.forEach(p => {
      const alpha = Math.max(0, p.life / p.maxLife);
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x - this.cameraX, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  renderFloatingTexts() {
    this.floatingTexts.forEach(ft => {
      const alpha = Math.max(0, ft.life / ft.maxLife);
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.font = `900 ${ft.size}px 'Courier New', monospace`;
      this.ctx.fillStyle = ft.color;
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = '#000000';
      this.ctx.shadowBlur = 6;
      this.ctx.fillText(ft.text, ft.x - this.cameraX, ft.y);
      this.ctx.restore();
    });
  }

  renderHUD() {
    const pad = 36;
    const barW = 420;
    const barH = 24;
    const topY = 32;

    this.ctx.save();

    this.renderHealthBar(pad, topY, barW, barH, this.player1, false);

    const rightX = this.canvas.width - pad - barW;
    this.renderHealthBar(rightX, topY, barW, barH, this.player2, true);

    this.renderTimer();
    this.renderRoundIcons();

    this.renderUltimateGauge(pad, topY + barH + 10, barW, 14, this.player1, false);
    this.renderUltimateGauge(rightX, topY + barH + 10, barW, 14, this.player2, true);

    this.ctx.restore();
  }

  renderHealthBar(x, y, w, h, fighter, alignRight) {
    this.ctx.save();

    this.ctx.fillStyle = '#111116';
    this.ctx.strokeStyle = '#d4af37';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.rect(x - 2, y - 2, w + 4, h + 4);
    this.ctx.stroke();
    this.ctx.fill();

    const redWidth = (Math.max(0, fighter.displayHealth) / fighter.maxHealth) * w;
    const hpWidth = (Math.max(0, fighter.health) / fighter.maxHealth) * w;

    if (alignRight) {
      this.ctx.fillStyle = '#e89923';
      this.ctx.fillRect(x + w - redWidth, y, redWidth, h);

      const grad = this.ctx.createLinearGradient(x + w - hpWidth, y, x + w, y);
      grad.addColorStop(0, '#e52d27');
      grad.addColorStop(1, '#ff6b35');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(x + w - hpWidth, y, hpWidth, h);
    } else {
      this.ctx.fillStyle = '#e89923';
      this.ctx.fillRect(x, y, redWidth, h);

      const grad = this.ctx.createLinearGradient(x, y, x + hpWidth, y);
      grad.addColorStop(0, '#ff6b35');
      grad.addColorStop(1, '#e52d27');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(x, y, hpWidth, h);
    }

    this.ctx.font = 'bold 15px "Courier New", monospace';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = '#000000';
    this.ctx.shadowBlur = 4;
    this.ctx.textAlign = alignRight ? 'right' : 'left';
    const tag = fighter.isBot ? `${fighter.config.name} (CPU)` : fighter.config.name;
    this.ctx.fillText(tag.toUpperCase(), alignRight ? x + w - 4 : x + 4, y - 8);

    this.ctx.restore();
  }

  renderUltimateGauge(x, y, w, h, fighter, alignRight) {
    this.ctx.save();

    this.ctx.fillStyle = '#111420';
    this.ctx.strokeStyle = fighter.ultimateMeter >= 100 ? '#ffd700' : '#3d4b68';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
    this.ctx.fillRect(x, y, w, h);

    const meterPct = Math.min(1, fighter.ultimateMeter / fighter.maxUltimate);
    const fillW = meterPct * w;

    if (fillW > 0) {
      const grad = this.ctx.createLinearGradient(x, y, x + w, y);
      if (fighter.ultimateMeter >= 100) {
        grad.addColorStop(0, '#ffcc00');
        grad.addColorStop(0.5, '#fff494');
        grad.addColorStop(1, '#ff9900');
      } else {
        grad.addColorStop(0, '#1cb5e0');
        grad.addColorStop(1, '#000046');
      }
      this.ctx.fillStyle = grad;
      if (alignRight) {
        this.ctx.fillRect(x + w - fillW, y, fillW, h);
      } else {
        this.ctx.fillRect(x, y, fillW, h);
      }
    }

    this.ctx.font = 'bold 10px "Courier New", monospace';
    this.ctx.fillStyle = fighter.ultimateMeter >= 100 ? '#ffe600' : '#9bb5ff';
    this.ctx.textAlign = alignRight ? 'left' : 'right';
    const label = fighter.ultimateMeter >= 100 ? 'SUPER READY! [ULT]' : `METER ${Math.round(fighter.ultimateMeter)}%`;
    this.ctx.fillText(label, alignRight ? x : x + w, y + h + 13);

    this.ctx.restore();
  }

  renderTimer() {
    this.ctx.save();
    const cx = this.canvas.width / 2;
    const cy = 44;

    this.ctx.fillStyle = '#111116';
    this.ctx.strokeStyle = '#d4af37';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.font = '900 28px "Courier New", monospace';
    this.ctx.fillStyle = this.roundTime <= 15 ? '#ff3b30' : '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowColor = '#000000';
    this.ctx.shadowBlur = 4;
    this.ctx.fillText(Math.ceil(this.roundTime).toString(), cx, cy);

    this.ctx.restore();
  }

  renderRoundIcons() {
    this.ctx.save();
    const cx = this.canvas.width / 2;
    const topY = 90;

    for (let i = 0; i < 2; i++) {
      const x = cx - 44 - i * 18;
      this.ctx.fillStyle = i < this.p1RoundsWon ? '#ffd700' : '#222228';
      this.ctx.strokeStyle = '#ffd700';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.arc(x, topY, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    }

    for (let i = 0; i < 2; i++) {
      const x = cx + 44 + i * 18;
      this.ctx.fillStyle = i < this.p2RoundsWon ? '#ffd700' : '#222228';
      this.ctx.strokeStyle = '#ffd700';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.arc(x, topY, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    }

    this.ctx.font = 'bold 12px "Courier New", monospace';
    this.ctx.fillStyle = '#e8d898';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`ROUND ${this.currentRound}`, cx, topY + 4);

    this.ctx.restore();
  }

  renderAnnouncement() {
    this.ctx.save();
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2 - 20;

    this.ctx.font = '900 64px "Courier New", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 10;
    this.ctx.strokeText(this.announcement, cx, cy);

    const grad = this.ctx.createLinearGradient(cx - 200, cy, cx + 200, cy);
    grad.addColorStop(0, '#ffe57f');
    grad.addColorStop(0.5, '#ffffff');
    grad.addColorStop(1, '#ff9100');
    this.ctx.fillStyle = grad;
    this.ctx.shadowColor = '#ff6b00';
    this.ctx.shadowBlur = 18;
    this.ctx.fillText(this.announcement, cx, cy);

    this.ctx.restore();
  }
}
