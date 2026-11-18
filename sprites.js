const CHAR_CONFIGS = {
  char1: {
    id: 'char1',
    name: 'Kensei',
    title: 'The Azure Blade',
    desc: 'Master of Iaido and flowing steel. Controls distance with precise edge slashes.',
    frameWidth: 200,
    frameHeight: 200,
    anchorX: 96,
    anchorY: 127,
    hurtWidth: 56,
    hurtHeight: 125,
    crouchHurtHeight: 82,
    scale: 2.6,
    speed: 7.2,
    jumpForce: -16.2,
    lightDamage: 10,
    heavyDamage: 22,
    ultimateDamage: 38,
    stats: {
      speed: 75,
      power: 85,
      defense: 80,
      range: 85
    },
    moves: [
      { name: 'Swift Slash', key: 'J', type: 'Light Poke' },
      { name: 'Azure Cleave', key: 'K', type: 'Heavy Strike' },
      { name: 'Blade Tempest', key: 'L', type: 'Ultimate' }
    ],
    animations: {
      idle: { path: 'character 1/Idle.png', frames: 4, speed: 7, loop: true },
      run: { path: 'character 1/Run.png', frames: 8, speed: 12, loop: true },
      jump: { path: 'character 1/Jump.png', frames: 2, speed: 6, loop: false },
      fall: { path: 'character 1/Fall.png', frames: 2, speed: 6, loop: false },
      attack1: { path: 'character 1/Attack1.png', frames: 4, speed: 10, loop: false, hitFrame: 1, range: 85 },
      attack2: { path: 'character 1/Attack2.png', frames: 4, speed: 9, loop: false, hitFrame: 2, range: 105 },
      takeHit: { path: 'character 1/Take hit.png', frames: 3, speed: 9, loop: false },
      death: { path: 'character 1/Death.png', frames: 7, speed: 7, loop: false, holdLast: true }
    }
  },
  char2: {
    id: 'char2',
    name: 'Shinobi',
    title: 'The Crimson Shadow',
    desc: 'Agile martial prodigy with high mobility. Overwhelms opponents with rapid dual flurries.',
    frameWidth: 200,
    frameHeight: 200,
    anchorX: 94,
    anchorY: 121,
    hurtWidth: 52,
    hurtHeight: 120,
    crouchHurtHeight: 78,
    scale: 2.6,
    speed: 8.4,
    jumpForce: -16.6,
    lightDamage: 8,
    heavyDamage: 20,
    ultimateDamage: 36,
    stats: {
      speed: 92,
      power: 76,
      defense: 74,
      range: 78
    },
    moves: [
      { name: 'Shadow Palm', key: 'J', type: 'Light Rush' },
      { name: 'Twin Fang', key: 'K', type: 'Heavy Strike' },
      { name: 'Crimson Eclipse', key: 'L', type: 'Ultimate' }
    ],
    animations: {
      idle: { path: 'character 2/Idle.png', frames: 8, speed: 10, loop: true },
      run: { path: 'character 2/Run.png', frames: 8, speed: 14, loop: true },
      jump: { path: 'character 2/Jump.png', frames: 2, speed: 6, loop: false },
      fall: { path: 'character 2/Fall.png', frames: 2, speed: 6, loop: false },
      attack1: { path: 'character 2/Attack1.png', frames: 6, speed: 13, loop: false, hitFrame: 2, range: 80 },
      attack2: { path: 'character 2/Attack2.png', frames: 6, speed: 11, loop: false, hitFrame: 3, range: 100 },
      takeHit: { path: 'character 2/Take Hit.png', frames: 4, speed: 10, loop: false },
      takeHitFlash: { path: 'character 2/Take Hit - white silhouette.png', frames: 4, speed: 10, loop: false },
      death: { path: 'character 2/Death.png', frames: 6, speed: 7, loop: false, holdLast: true }
    }
  }
};

const STAGE_CONFIGS = {
  twilight_beach: {
    id: 'twilight_beach',
    name: 'Twilight Beach',
    location: 'Pacific Shoreline',
    desc: 'Golden horizon with rolling ocean waves and a setting twilight sun.',
    preview: 'background twilight beach/cover1.png',
    type: 'beach',
    layers: {
      sky: 'background twilight beach/sky7.png',
      sun: 'background twilight beach/sun.png',
      clouds: 'background twilight beach/clouds.png',
      seas: [
        'background twilight beach/sea1.png',
        'background twilight beach/sea2.png',
        'background twilight beach/sea3.png',
        'background twilight beach/sea4.png'
      ],
      beaches: [
        'background twilight beach/beach1.png',
        'background twilight beach/beach2.png',
        'background twilight beach/beach3.png',
        'background twilight beach/beach4.png'
      ]
    }
  },
  mystic_forest: {
    id: 'mystic_forest',
    name: 'Mystic Forest',
    location: 'Ancient Grove',
    desc: 'Deep multi-layered woodland canopy filled with ancient light rays and dense foliage.',
    preview: 'background forest/forest_preview.png',
    type: 'forest',
    layers: [
      { path: 'background forest/Layer_0011_0.png', speed: 0.04 },
      { path: 'background forest/Layer_0010_1.png', speed: 0.08 },
      { path: 'background forest/Layer_0009_2.png', speed: 0.14 },
      { path: 'background forest/Layer_0008_3.png', speed: 0.20 },
      { path: 'background forest/Layer_0007_Lights.png', speed: 0.26 },
      { path: 'background forest/Layer_0006_4.png', speed: 0.34 },
      { path: 'background forest/Layer_0005_5.png', speed: 0.44 },
      { path: 'background forest/Layer_0004_Lights.png', speed: 0.52 },
      { path: 'background forest/Layer_0003_6.png', speed: 0.60 },
      { path: 'background forest/Layer_0002_7.png', speed: 0.68 },
      { path: 'background forest/Layer_0001_8.png', speed: 0.76 },
      { path: 'background forest/Layer_0000_9.png', speed: 0.84 }
    ]
  },
  sunset_cove: {
    id: 'sunset_cove',
    name: 'Sunset Cove',
    location: 'Rocky Inlet',
    desc: 'Low golden sun flare over foaming high-tide ocean waters and reflective shore sands.',
    preview: 'background twilight beach/cover3.png',
    type: 'beach',
    altPalette: true,
    layers: {
      sky: 'background twilight beach/sky7.png',
      sun: 'background twilight beach/sun.png',
      clouds: 'background twilight beach/clouds.png',
      seas: [
        'background twilight beach/sea1.png',
        'background twilight beach/sea2.png',
        'background twilight beach/sea3.png',
        'background twilight beach/sea4.png'
      ],
      beaches: [
        'background twilight beach/beach1.png',
        'background twilight beach/beach2.png',
        'background twilight beach/beach3.png',
        'background twilight beach/beach4.png'
      ]
    }
  }
};

class AssetManager {
  constructor() {
    this.images = new Map();
    this.total = 0;
    this.loaded = 0;
  }

  load(src) {
    if (this.images.has(src)) {
      return Promise.resolve(this.images.get(src));
    }
    this.total++;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.loaded++;
        this.images.set(src, img);
        resolve(img);
      };
      img.onerror = () => {
        this.loaded++;
        resolve(img);
      };
      img.src = src;
    });
  }

  getImage(src) {
    return this.images.get(src) || null;
  }

  preloadAll(onProgress) {
    const list = [];

    Object.values(CHAR_CONFIGS).forEach(cfg => {
      Object.values(cfg.animations).forEach(anim => {
        list.push(anim.path);
      });
    });

    const b = STAGE_CONFIGS.twilight_beach.layers;
    list.push(b.sky);
    list.push(b.sun);
    list.push(b.clouds);
    b.seas.forEach(s => list.push(s));
    b.beaches.forEach(p => list.push(p));
    list.push(STAGE_CONFIGS.twilight_beach.preview);
    list.push(STAGE_CONFIGS.sunset_cove.preview);

    STAGE_CONFIGS.mystic_forest.layers.forEach(l => {
      list.push(l.path);
    });
    list.push(STAGE_CONFIGS.mystic_forest.preview);

    const uniqueList = [...new Set(list)];
    let count = 0;
    const promises = uniqueList.map(src => {
      return this.load(src).then(img => {
        count++;
        if (onProgress) {
          onProgress(count / uniqueList.length);
        }
        return img;
      });
    });

    return Promise.all(promises);
  }
}

const assets = new AssetManager();
