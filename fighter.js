class Fighter {
  constructor(config, x, y, facing = 1, isBot = false) {
    this.config = config;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.isBot = isBot;

    this.health = 100;
    this.maxHealth = 100;
    this.displayHealth = 100;
    this.ultimateMeter = 0;
    this.maxUltimate = 100;
    this.roundsWon = 0;

    this.state = 'idle';
    this.isGrounded = true;
    this.isGuarding = false;
    this.isCrouching = false;
    this.hasHitOpponent = false;
    this.hitStun = 0;
    this.blockStun = 0;
    this.flashTimer = 0;
    this.superFreeze = 0;
    this.dashTimer = 0;
    this.comboCount = 0;
    this.comboTimer = 0;

    this.frameIndex = 0;
    this.frameTimer = 0;

    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      attack1: false,
      attack2: false,
      ultimate: false
    };

    this.attackHitbox = null;
    this.hurtbox = { x: 0, y: 0, width: 0, height: 0 };
  }

  reset(x, y, facing) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.health = 100;
    this.displayHealth = 100;
    this.state = 'idle';
    this.isGrounded = true;
    this.isGuarding = false;
    this.isCrouching = false;
    this.hasHitOpponent = false;
    this.hitStun = 0;
    this.blockStun = 0;
    this.flashTimer = 0;
    this.superFreeze = 0;
    this.dashTimer = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.attackHitbox = null;
  }

  switchAnimation(animName) {
    if (this.state === animName && this.state !== 'takeHit') return;
    this.state = animName;
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.hasHitOpponent = false;
  }

  update(dt, opponent, stageWidth, groundY) {
    if (this.superFreeze > 0) {
      this.superFreeze -= dt;
      return;
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    if (this.displayHealth > this.health) {
      this.displayHealth -= dt * 35;
      if (this.displayHealth < this.health) this.displayHealth = this.health;
    }

    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
    }

    if (this.hitStun > 0) {
      this.hitStun -= dt;
      if (this.hitStun <= 0 && this.health > 0) {
        this.switchAnimation('idle');
      }
    }

    if (this.blockStun > 0) {
      this.blockStun -= dt;
    }

    if (this.health <= 0) {
      if (this.state !== 'death') {
        this.switchAnimation('death');
        sounds.playKo();
      }
      this.updateAnimation(dt);
      this.applyPhysics(dt, groundY);
      return;
    }

    if (this.hitStun <= 0 && this.state !== 'ultimate') {
      if (opponent && !this.isAttacking()) {
        if (this.x < opponent.x - 10) {
          this.facing = 1;
        } else if (this.x > opponent.x + 10) {
          this.facing = -1;
        }
      }
    }

    if (this.hitStun <= 0) {
      this.handleInput(dt);
    }

    this.applyPhysics(dt, groundY);
    this.clampStage(stageWidth);
    this.updateAnimation(dt);
    this.updateBoxes();
  }

  isAttacking() {
    return this.state === 'attack1' || this.state === 'attack2' || this.state === 'ultimate';
  }

  handleInput(dt) {
    if (this.isAttacking()) {
      if (this.state === 'ultimate') {
        this.handleUltimateAction(dt);
      }
      return;
    }

    if (this.keys.ultimate && this.ultimateMeter >= this.maxUltimate && this.isGrounded) {
      this.activateUltimate();
      return;
    }

    if (this.keys.attack1 && this.isGrounded) {
      this.switchAnimation('attack1');
      sounds.playSwing(false);
      return;
    }

    if (this.keys.attack2 && this.isGrounded) {
      this.switchAnimation('attack2');
      sounds.playSwing(true);
      return;
    }

    if (this.keys.down && this.isGrounded) {
      this.isCrouching = true;
      this.isGuarding = true;
      this.vx = 0;
      if (this.state !== 'idle') {
        this.switchAnimation('idle');
      }
      return;
    } else {
      this.isCrouching = false;
      this.isGuarding = false;
    }

    if (this.keys.up && this.isGrounded) {
      this.vy = this.config.jumpForce;
      this.isGrounded = false;
      this.switchAnimation('jump');
      sounds.playJump();
    }

    if (this.keys.left) {
      this.vx = -this.config.speed;
      if (this.isGrounded && this.state !== 'run') {
        this.switchAnimation('run');
      }
    } else if (this.keys.right) {
      this.vx = this.config.speed;
      if (this.isGrounded && this.state !== 'run') {
        this.switchAnimation('run');
      }
    } else {
      this.vx *= 0.6;
      if (Math.abs(this.vx) < 0.2) this.vx = 0;
      if (this.isGrounded && this.state === 'run') {
        this.switchAnimation('idle');
      }
    }
  }

  activateUltimate() {
    this.ultimateMeter = 0;
    this.superFreeze = 0.45;
    this.dashTimer = 0.55;
    this.switchAnimation('ultimate');
    sounds.playSuperFlash();
  }

  handleUltimateAction(dt) {
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.vx = this.facing * 18;
    } else {
      this.vx *= 0.7;
      if (Math.abs(this.vx) < 0.5) {
        this.vx = 0;
        this.switchAnimation('idle');
      }
    }
  }

  applyPhysics(dt, groundY) {
    const gravity = 48;
    if (!this.isGrounded) {
      this.vy += gravity * dt;
      if (this.vy > 0 && this.state === 'jump') {
        this.switchAnimation('fall');
      }
    }

    this.x += this.vx * (dt * 60);
    this.y += this.vy * (dt * 60);

    if (this.y >= groundY) {
      this.y = groundY;
      this.vy = 0;
      if (!this.isGrounded) {
        this.isGrounded = true;
        if (this.state === 'fall' || this.state === 'jump') {
          this.switchAnimation(Math.abs(this.vx) > 0.5 ? 'run' : 'idle');
        }
      }
    }
  }

  clampStage(stageWidth) {
    const minX = 70;
    const maxX = stageWidth - 70;
    if (this.x < minX) {
      this.x = minX;
      this.vx = 0;
    }
    if (this.x > maxX) {
      this.x = maxX;
      this.vx = 0;
    }
  }

  updateAnimation(dt) {
    const anim = this.config.animations[this.state] || this.config.animations.idle;
    const speed = anim.speed;
    this.frameTimer += dt * speed;

    if (this.frameTimer >= 1) {
      const step = Math.floor(this.frameTimer);
      this.frameIndex += step;
      this.frameTimer %= 1;

      if (this.frameIndex >= anim.frames) {
        if (anim.loop) {
          this.frameIndex = 0;
        } else if (anim.holdLast) {
          this.frameIndex = anim.frames - 1;
        } else {
          this.frameIndex = 0;
          this.switchAnimation('idle');
        }
      }
    }
  }

  updateBoxes() {
    const isCrouch = this.isCrouching && this.isGrounded;
    const hHeight = isCrouch ? this.config.crouchHurtHeight : this.config.hurtHeight;
    const hWidth = this.config.hurtWidth;

    this.hurtbox = {
      x: this.x - hWidth / 2,
      y: this.y - hHeight,
      width: hWidth,
      height: hHeight
    };

    this.attackHitbox = null;
    const anim = this.config.animations[this.state];
    if (this.isAttacking() && !this.hasHitOpponent && anim) {
      const isHitFrame = (this.state === 'ultimate') || (this.frameIndex === anim.hitFrame);
      if (isHitFrame) {
        const boxW = (this.state === 'ultimate') ? 130 : 75;
        const boxH = (this.state === 'ultimate') ? 95 : 65;
        const boxX = this.facing === 1 ? this.x + 10 : this.x - 10 - boxW;
        const boxY = this.y - 105;

        this.attackHitbox = {
          x: boxX,
          y: boxY,
          width: boxW,
          height: boxH,
          damage: (this.state === 'ultimate') ? this.config.ultimateDamage :
                  (this.state === 'attack2') ? this.config.heavyDamage : this.config.lightDamage,
          isHeavy: this.state === 'attack2' || this.state === 'ultimate',
          isUltimate: this.state === 'ultimate'
        };
      }
    }
  }

  takeDamage(amount, isHeavy, isUltimate, attacker) {
    if (this.health <= 0) return { blocked: false, damage: 0 };

    if (this.isGuarding && !isUltimate) {
      const chipDamage = Math.max(1, Math.round(amount * 0.15));
      this.health = Math.max(0, this.health - chipDamage);
      this.ultimateMeter = Math.min(this.maxUltimate, this.ultimateMeter + 12);
      this.blockStun = 0.22;
      this.vx = -this.facing * 5;
      this.flashTimer = 0.08;
      sounds.playBlock();
      return { blocked: true, damage: chipDamage };
    }

    const actualDamage = amount;
    this.health = Math.max(0, this.health - actualDamage);
    this.ultimateMeter = Math.min(this.maxUltimate, this.ultimateMeter + 10);
    this.hitStun = isHeavy ? 0.38 : 0.24;
    this.vx = -this.facing * (isHeavy ? 10 : 6);
    this.flashTimer = 0.15;

    if (this.health <= 0) {
      this.switchAnimation('death');
      sounds.playKo();
    } else {
      this.switchAnimation('takeHit');
      if (isUltimate) {
        sounds.playSuperImpact();
      } else {
        sounds.playHit(isHeavy);
      }
    }

    return { blocked: false, damage: actualDamage };
  }

  addMeter(amount) {
    this.ultimateMeter = Math.min(this.maxUltimate, this.ultimateMeter + amount);
  }

  draw(ctx, cameraX) {
    const drawX = Math.round(this.x - cameraX);
    const drawY = Math.round(this.y);

    ctx.save();
    ctx.fillStyle = 'rgba(20, 10, 10, 0.35)';
    ctx.beginPath();
    ctx.ellipse(drawX, drawY - 2, 36, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    let animKey = this.state;
    if (this.state === 'ultimate') animKey = 'attack2';
    if (this.state === 'crouch') animKey = 'idle';

    let anim = this.config.animations[animKey] || this.config.animations.idle;
    let img = assets.getImage(anim.path);

    if (this.flashTimer > 0 && this.config.animations.takeHitFlash) {
      const flashImg = assets.getImage(this.config.animations.takeHitFlash.path);
      if (flashImg) img = flashImg;
    }

    if (!img) return;

    const frameW = this.config.frameWidth;
    const frameH = this.config.frameHeight;
    const scale = this.config.scale;
    const frameIdx = Math.min(this.frameIndex, anim.frames - 1);

    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.scale(this.facing, 1);

    if (this.flashTimer > 0 && !this.config.animations.takeHitFlash) {
      ctx.filter = 'brightness(3) contrast(2)';
    }

    if (this.state === 'ultimate') {
      ctx.shadowColor = '#ffea60';
      ctx.shadowBlur = 24;
    } else if (this.isGuarding) {
      ctx.shadowColor = '#60caff';
      ctx.shadowBlur = 12;
    }

    const anchorX = this.config.anchorX;
    const anchorY = this.config.anchorY;

    ctx.drawImage(
      img,
      frameIdx * frameW,
      0,
      frameW,
      frameH,
      -anchorX * scale,
      -anchorY * scale,
      frameW * scale,
      frameH * scale
    );

    ctx.restore();
  }
}
