// SuperCursor | content.js
// This script creates and manages all 10 custom cursor effects.

let mouseX = 0, mouseY = 0;
let currentStyle = 'aura';
let animationFrameId;
const effectElements = {};

// --- Effect Implementations ---

const effects = {
  setup: () => {
    // Shared container for direct-follow effects
    effectElements.container = document.createElement('div');
    effectElements.container.className = 'super-cursor-container';
    document.body.appendChild(effectElements.container);

    // Spotlight effect
    effectElements.spotlight = document.createElement('div');
    effectElements.spotlight.className = 'spotlight-overlay';
    document.body.appendChild(effectElements.spotlight);
  },
  
  aura: {
    create: () => {
      const aura = document.createElement('div');
      aura.className = 'super-cursor-aura';
      effectElements.container.appendChild(aura);
    }
  },

  electricOrb: {
    create: () => {
      const orb = document.createElement('div');
      orb.className = 'electric-orb';
      effectElements.container.appendChild(orb);
    }
  },

  laserDot: {
    create: () => {
      const dot = document.createElement('div');
      dot.className = 'laser-dot';
      effectElements.container.appendChild(dot);
    }
  },

  ghostTrail: {
    trailDots: [],
    create: () => {
      for (let i = 0; i < 5; i++) {
        const dot = document.createElement('div');
        dot.className = 'ghost-trail-dot';
        document.body.appendChild(dot);
        effects.ghostTrail.trailDots.push({ el: dot, x: 0, y: 0 });
      }
    },
    update: () => {
      let leaderX = mouseX;
      let leaderY = mouseY;
      effects.ghostTrail.trailDots.forEach(dot => {
        const dX = leaderX - dot.x;
        const dY = leaderY - dot.y;
        dot.x += dX * 0.4;
        dot.y += dY * 0.4;
        dot.el.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0)`;
        dot.el.style.opacity = (1 - Math.min(Math.abs(dX), Math.abs(dY)) / 50);
        leaderX = dot.x;
        leaderY = dot.y;
      });
    },
    cleanup: () => {
      effects.ghostTrail.trailDots.forEach(dot => dot.el.remove());
      effects.ghostTrail.trailDots = [];
    }
  },

  throttledEffect: (fn, delay) => {
    let canRun = true;
    return (e) => {
      if (!canRun) return;
      fn(e);
      canRun = false;
      setTimeout(() => { canRun = true; }, delay);
    };
  }
};

effects.starfall = effects.throttledEffect((e) => {
  const star = document.createElement('div');
  star.className = 'super-cursor-star';
  star.style.left = `${e.clientX + (Math.random() - 0.5) * 20}px`;
  star.style.top = `${e.clientY + (Math.random() - 0.5) * 20}px`;
  document.body.appendChild(star);
  star.addEventListener('animationend', () => star.remove());
}, 50);

effects.ripples = effects.throttledEffect((e) => {
  const ripple = document.createElement('div');
  ripple.className = 'ripple';
  ripple.style.left = `${e.clientX}px`;
  ripple.style.top = `${e.clientY}px`;
  document.body.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}, 100);

effects.bubbles = effects.throttledEffect((e) => {
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.style.left = `${e.clientX + (Math.random() - 0.5) * 30}px`;
  bubble.style.top = `${e.clientY}px`;
  document.body.appendChild(bubble);
  bubble.addEventListener('animationend', () => bubble.remove());
}, 80);

effects.particleExplosion = (e) => {
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 80;
    const color = ['#bb86fc', '#03dac6', '#ffffff'][Math.floor(Math.random() * 3)];
    particle.style.background = color;
    particle.style.left = `${e.clientX}px`;
    particle.style.top = `${e.clientY}px`;
    document.body.appendChild(particle);

    particle.animate([
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance}px)) scale(0)`, opacity: 0 }
    ], {
      duration: 800 + Math.random() * 400,
      easing: 'cubic-bezier(0.1, 1, 0.1, 1)'
    }).onfinish = () => particle.remove();
  }
};

// --- Core Logic ---

function animate() {
  effectElements.container.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
  if (currentStyle.includes('ghost-trail')) effects.ghostTrail.update();
  if (currentStyle.includes('spotlight')) {
      effectElements.spotlight.style.backgroundPosition = `${mouseX}px ${mouseY}px`;
  }
  animationFrameId = requestAnimationFrame(animate);
}

function setCursorStyle(style) {
  // Cleanup previous style
  effectElements.container.innerHTML = '';
  if (typeof effects[currentStyle]?.cleanup === 'function') {
    effects[currentStyle].cleanup();
  }
  
  currentStyle = style;
  const styles = style.split('-').filter(s => s !== 'starfall');

  styles.forEach(s => {
    if (typeof effects[s]?.create === 'function') {
      effects[s].create();
    }
  });

  // Handle combined styles specifically
  if(style === 'aura-starfall') effects.aura.create();
  
  effectElements.spotlight.style.display = style.includes('spotlight') ? 'block' : 'none';
}

function handleMouseMove(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
  const styleActions = {
    'starfall': effects.starfall,
    'aura-starfall': effects.starfall,
    'ripples': effects.ripples,
    'bubbles': effects.bubbles
  };
  if (styleActions[currentStyle]) styleActions[currentStyle](e);
}

function handleMouseDown(e) {
  if (currentStyle === 'particle-explosion') {
    effects.particleExplosion(e);
  }
}

// --- Listeners and Initialization ---

window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('mousedown', handleMouseDown);
effects.setup();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setCursor') {
    setCursorStyle(request.cursor);
    sendResponse({ status: 'Cursor style updated' });
  }
  return true;
});

function applySavedCursor() {
  chrome.storage.sync.get('selectedCursor', (data) => {
    setCursorStyle(data.selectedCursor || 'aura');
  });
}

applySavedCursor();
animate();

console.log('SuperCursor interactive effects engine initialized.'); 