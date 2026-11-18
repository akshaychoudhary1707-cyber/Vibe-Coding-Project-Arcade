class ParallaxBackground {
  constructor(canvas) {
    this.canvas = canvas;
    this.stageWidth = 2048;
    this.stageHeight = 720;
    this.groundY = 580;

    this.stageId = 'twilight_beach';
    this.stage = STAGE_CONFIGS.twilight_beach;

    this.cloudTimer = 0;
    this.waveTimer = 0;
    this.waveFrame = 0;
    this.waveFps = 3.5;

    this.beachTimer = 0;
    this.beachFrame = 0;
    this.beachFps = 3.5;
  }

  setStage(stageId) {
    this.stageId = stageId;
    this.stage = STAGE_CONFIGS[stageId] || STAGE_CONFIGS.twilight_beach;
  }

  update(dt) {
    this.cloudTimer += dt * 14;

    this.waveTimer += dt * this.waveFps;
    if (this.waveTimer >= 1) {
      this.waveFrame = (this.waveFrame + Math.floor(this.waveTimer)) % 4;
      this.waveTimer %= 1;
    }

    this.beachTimer += dt * this.beachFps;
    if (this.beachTimer >= 1) {
      this.beachFrame = (this.beachFrame + Math.floor(this.beachTimer)) % 4;
      this.beachTimer %= 1;
    }
  }

  draw(ctx, cameraX) {
    if (this.stage.type === 'forest') {
      this.drawForest(ctx, cameraX);
    } else {
      this.drawBeach(ctx, cameraX);
    }
  }

  drawBeach(ctx, cameraX) {
    const scale = 4;
    const tileW = 320 * scale;
    const tileH = 180 * scale;

    const layers = this.stage.layers;
    const skyImg = assets.getImage(layers.sky);
    const sunImg = assets.getImage(layers.sun);
    const cloudsImg = assets.getImage(layers.clouds);
    const seaSrc = layers.seas[this.waveFrame];
    const seaImg = assets.getImage(seaSrc);
    const beachSrc = layers.beaches[this.beachFrame];
    const beachImg = assets.getImage(beachSrc);

    const isSunset = this.stageId === 'sunset_cove';

    const skyPan = -(cameraX * 0.05);
    if (skyImg) {
      const startX = Math.floor(skyPan % tileW) - tileW;
      for (let x = startX; x < this.canvas.width + tileW; x += tileW) {
        ctx.drawImage(skyImg, x, 0, tileW, tileH);
      }
    }

    if (sunImg) {
      const sunPan = -(cameraX * 0.08);
      const sunX = Math.floor(sunPan % tileW);
      ctx.drawImage(sunImg, sunX, 0, tileW, tileH);
      if (sunX > 0) ctx.drawImage(sunImg, sunX - tileW, 0, tileW, tileH);
      if (sunX + tileW < this.canvas.width) ctx.drawImage(sunImg, sunX + tileW, 0, tileW, tileH);
    }

    if (cloudsImg) {
      const cloudPan = -((cameraX * 0.18 + this.cloudTimer) % tileW);
      const startX = Math.floor(cloudPan) - tileW;
      for (let x = startX; x < this.canvas.width + tileW; x += tileW) {
        ctx.drawImage(cloudsImg, x, 0, tileW, tileH);
      }
    }

    if (seaImg) {
      const seaPan = -(cameraX * 0.42);
      const startX = Math.floor(seaPan % tileW) - tileW;
      for (let x = startX; x < this.canvas.width + tileW; x += tileW) {
        ctx.drawImage(seaImg, x, 0, tileW, tileH);
      }
    }

    if (beachImg) {
      const beachPan = -(cameraX * 0.72);
      const startX = Math.floor(beachPan % tileW) - tileW;
      for (let x = startX; x < this.canvas.width + tileW; x += tileW) {
        ctx.drawImage(beachImg, x, 0, tileW, tileH);
      }
    }

    const sandTop = 576;
    const sandGrad = ctx.createLinearGradient(0, sandTop, 0, this.canvas.height);
    if (isSunset) {
      sandGrad.addColorStop(0, 'rgba(215, 120, 60, 0.45)');
      sandGrad.addColorStop(0.15, 'rgba(165, 75, 45, 0.9)');
      sandGrad.addColorStop(1, 'rgba(105, 40, 25, 1)');
    } else {
      sandGrad.addColorStop(0, 'rgba(182, 114, 76, 0.4)');
      sandGrad.addColorStop(0.15, 'rgba(146, 85, 59, 0.85)');
      sandGrad.addColorStop(1, 'rgba(96, 52, 38, 1)');
    }
    ctx.fillStyle = sandGrad;
    ctx.fillRect(0, sandTop, this.canvas.width, this.canvas.height - sandTop);

    if (isSunset) {
      ctx.fillStyle = 'rgba(255, 160, 80, 0.12)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  drawForest(ctx, cameraX) {
    const scale = this.canvas.height / 793;
    const tileW = Math.ceil(928 * scale);
    const tileH = this.canvas.height;

    const layers = this.stage.layers;
    layers.forEach(layer => {
      const img = assets.getImage(layer.path);
      if (!img) return;

      const pan = -(cameraX * layer.speed);
      const startX = Math.floor(pan % tileW) - tileW;
      for (let x = startX; x < this.canvas.width + tileW; x += tileW) {
        ctx.drawImage(img, x, 0, tileW, tileH);
      }
    });

    const floorTop = 576;
    const floorGrad = ctx.createLinearGradient(0, floorTop, 0, this.canvas.height);
    floorGrad.addColorStop(0, 'rgba(28, 48, 22, 0.35)');
    floorGrad.addColorStop(0.2, 'rgba(18, 32, 14, 0.9)');
    floorGrad.addColorStop(1, 'rgba(10, 18, 8, 1)');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorTop, this.canvas.width, this.canvas.height - floorTop);
  }
}
