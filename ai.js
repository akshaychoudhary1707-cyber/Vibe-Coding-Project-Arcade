class BotController {
  constructor(fighter, opponent, difficulty = 'normal') {
    this.fighter = fighter;
    this.opponent = opponent;
    this.difficulty = difficulty;

    this.decisionTimer = 0;
    this.reactionTimer = 0;
    this.pendingReaction = null;

    this.attackCooldown = 0;
    this.footsieDirection = 1;
    this.footsieTimer = 0;
    this.guardTimer = 0;

    this.configureDifficulty(difficulty);
  }

  configureDifficulty(level) {
    this.difficulty = level;
    if (level === 'easy') {
      this.reactionDelay = 0.28;
      this.guardChance = 0.35;
      this.aggression = 0.45;
      this.decisionInterval = 0.16;
    } else if (level === 'hard') {
      this.reactionDelay = 0.08;
      this.guardChance = 0.88;
      this.aggression = 0.85;
      this.decisionInterval = 0.06;
    } else {
      this.reactionDelay = 0.14;
      this.guardChance = 0.65;
      this.aggression = 0.65;
      this.decisionInterval = 0.1;
    }
  }

  clearInputs() {
    this.fighter.keys.left = false;
    this.fighter.keys.right = false;
    this.fighter.keys.up = false;
    this.fighter.keys.down = false;
    this.fighter.keys.attack1 = false;
    this.fighter.keys.attack2 = false;
    this.fighter.keys.ultimate = false;
  }

  update(dt) {
    if (this.fighter.health <= 0 || this.opponent.health <= 0) {
      this.clearInputs();
      return;
    }

    if (this.fighter.superFreeze > 0) {
      this.clearInputs();
      return;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    if (this.guardTimer > 0) {
      this.guardTimer -= dt;
      if (this.guardTimer <= 0) {
        this.fighter.keys.down = false;
      }
    }

    if (this.footsieTimer > 0) {
      this.footsieTimer -= dt;
    }

    this.decisionTimer += dt;
    if (this.decisionTimer >= this.decisionInterval) {
      this.decisionTimer = 0;
      this.evaluateTactics();
    }

    if (this.pendingReaction) {
      this.reactionTimer -= dt;
      if (this.reactionTimer <= 0) {
        this.executeReaction(this.pendingReaction);
        this.pendingReaction = null;
      }
    }
  }

  evaluateTactics() {
    const dist = Math.abs(this.fighter.x - this.opponent.x);
    const inOpponentStrikeRange = dist < 125;
    const opponentAttacking = this.opponent.isAttacking();
    const canUseUltimate = this.fighter.ultimateMeter >= this.fighter.maxUltimate;

    if (opponentAttacking && inOpponentStrikeRange) {
      if (!this.pendingReaction && Math.random() < this.guardChance) {
        this.pendingReaction = 'DEFEND_GUARD';
        this.reactionTimer = this.reactionDelay;
      }
      return;
    }

    if (this.guardTimer > 0) {
      return;
    }

    if (canUseUltimate && dist < 170 && !this.opponent.isGuarding) {
      this.clearInputs();
      this.fighter.keys.ultimate = true;
      this.attackCooldown = 0.8;
      return;
    }

    if (this.opponent.state === 'takeHit' && dist < 100 && this.attackCooldown <= 0) {
      this.clearInputs();
      this.fighter.keys.attack2 = true;
      this.attackCooldown = 0.45;
      return;
    }

    if (dist < 95) {
      this.handleCloseCombat(dist);
    } else if (dist < 230) {
      this.handleMidRange(dist);
    } else {
      this.handleApproach();
    }
  }

  handleCloseCombat() {
    if (this.attackCooldown <= 0) {
      const roll = Math.random();
      if (roll < 0.55) {
        this.clearInputs();
        this.fighter.keys.attack1 = true;
        this.attackCooldown = 0.32;
      } else if (roll < 0.85) {
        this.clearInputs();
        this.fighter.keys.attack2 = true;
        this.attackCooldown = 0.5;
      } else {
        this.clearInputs();
        this.fighter.keys.down = true;
        this.guardTimer = 0.35;
      }
    } else {
      const moveAway = this.fighter.x < this.opponent.x ? -1 : 1;
      this.clearInputs();
      if (moveAway < 0) this.fighter.keys.left = true;
      else this.fighter.keys.right = true;
    }
  }

  handleMidRange(dist) {
    if (this.footsieTimer <= 0) {
      this.footsieTimer = 0.25 + Math.random() * 0.3;
      this.footsieDirection = Math.random() < 0.65 ? 1 : -1;
    }

    const towards = this.fighter.x < this.opponent.x ? 1 : -1;
    const dir = towards * this.footsieDirection;

    this.clearInputs();
    if (dir > 0) this.fighter.keys.right = true;
    else this.fighter.keys.left = true;

    if (Math.random() < 0.08 && this.fighter.isGrounded && dist < 160) {
      this.fighter.keys.up = true;
    }

    if (dist < 120 && this.attackCooldown <= 0 && Math.random() < this.aggression) {
      this.clearInputs();
      this.fighter.keys.attack1 = true;
      this.attackCooldown = 0.38;
    }
  }

  handleApproach() {
    const towards = this.fighter.x < this.opponent.x ? 1 : -1;
    this.clearInputs();
    if (towards > 0) this.fighter.keys.right = true;
    else this.fighter.keys.left = true;

    if (Math.random() < 0.04 && this.fighter.isGrounded) {
      this.fighter.keys.up = true;
    }
  }

  executeReaction(type) {
    if (type === 'DEFEND_GUARD') {
      this.clearInputs();
      this.fighter.keys.down = true;
      this.guardTimer = 0.32;
    }
  }
}
