/* ============================================================
   MOSSY GARDEN — app.js
   State Management, Plant Logic, UI Rendering & Care History
   ============================================================ */

(function () {
  'use strict';

  // ─── Constants ──────────────────────────────────────────────
  const STORAGE_KEY = 'mossy_garden_plants';
  const THEME_KEY = 'mossy_garden_theme';
  const MS_PER_DAY = 86400000;

  const SUN_LABELS = {
    low: '🌑 Baixa',
    medium: '⛅ Média',
    bright: '🌤️ Indireta',
    direct: '☀️ Direta'
  };

  const EMOJI_NAMES = {
    '🪴': 'Vaso de Planta',
    '🌱': 'Broto Verde',
    '🌿': 'Folhagem / Erva',
    '🌵': 'Cacto',
    '🌴': 'Palmeira',
    '🌲': 'Pinheiro',
    '🌳': 'Árvore Decídua',
    '🎋': 'Bambu',
    '🎍': 'Decoração de Bambu',
    '🌾': 'Gramínea / Trigo',
    '🍀': 'Trevo de Quatro Folhas',
    '☘️': 'Trevo Comum',
    '🍃': 'Folha ao Vento',
    '🍁': 'Folha de Outono',
    '🍂': 'Folhas Secas',
    '🪾': 'Ramo Seco',
    '🌸': 'Flor Geral',
    '🌻': 'Girassol',
    '🌹': 'Rosa / Florífera',
    '🌼': 'Margarida',
    '🌷': 'Tulipa',
    '🪻': 'Jacinto',
    '🪷': 'Flor de Lótus',
    '💐': 'Buquê de Flores',
    '🍋': 'Frutífera Citrina',
    '🍓': 'Morangueiro / Frutífera',
    '🥬': 'Hortaliça / Folha Verde',
    '🥦': 'Hortaliça / Brócolis'
  };

  const MONTHS_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // ─── Seed Data ──────────────────────────────────────────────
  const SEED_PLANTS = [
    {
      id: generateId(),
      name: 'Jade',
      species: 'Crassula ovata',
      room: 'Sala',
      frequency: 10,
      lastWatered: Date.now() - 3 * MS_PER_DAY,
      sunlight: 'bright',
      petToxic: false,
      notes: 'Gosta de sol indireto e regas espaçadas. Evitar excesso de água.',
      avatar: '🪴',
      diary: [
        { date: Date.now() - 7 * MS_PER_DAY, text: 'Primeira muda transplantada para o vaso de cerâmica!', type: 'note' },
        { date: Date.now() - 3 * MS_PER_DAY, text: 'Rega realizada', type: 'watering' }
      ]
    },
    {
      id: generateId(),
      name: 'Costela-de-Adão',
      species: 'Monstera deliciosa',
      room: 'Quarto',
      frequency: 5,
      lastWatered: Date.now() - 4 * MS_PER_DAY,
      sunlight: 'medium',
      petToxic: true,
      notes: 'Está crescendo rápido! Precisa de suporte em breve.',
      avatar: '🌿',
      diary: [
        { date: Date.now() - 10 * MS_PER_DAY, text: 'Nova folha se abrindo — fenestrada! 🎉', type: 'note' },
        { date: Date.now() - 4 * MS_PER_DAY, text: 'Rega realizada', type: 'watering' }
      ]
    },
    {
      id: generateId(),
      name: 'Espada-de-São-Jorge',
      species: 'Dracaena trifasciata',
      room: 'Varanda',
      frequency: 14,
      lastWatered: Date.now() - 2 * MS_PER_DAY,
      sunlight: 'low',
      petToxic: true,
      notes: 'Muito resistente. Quase não precisa de cuidados.',
      avatar: '🌵',
      diary: [
        { date: Date.now() - 2 * MS_PER_DAY, text: 'Rega realizada', type: 'watering' }
      ]
    }
  ];

  // ─── State ──────────────────────────────────────────────────
  // State
  let plants = [];
  let currentFilter = 'all';
  let currentSearch = '';
  let currentSort = 'thirst';
  let selectedRoomModal = 'Sala';
  let editingPlantId = null;
  let viewingPlantId = null;
  let lastWaterState = null; // QoL: Tracks last watered state for Undo action

  // View States
  let currentView = 'estufa'; // 'estufa' | 'calendario'
  let calendarDate = new Date(); // Date tracking for calendar

  // ─── DOM Elements ───────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const estufaView = $('#estufaView');
  const plantsGrid = $('#plantsGrid');
  const emptyState = $('#emptyState');
  const roomFiltersContainer = $('#roomFilters');
  const searchInput = $('#searchInput');

  // Stats & Widgets
  const thrivingCircle = $('#thrivingCircle');
  const thrivingLabel = $('#thrivingLabel');
  const sortDropdown = $('#sortDropdown');
  const newRoomWrapper = $('#newRoomWrapper');
  const newRoomInput = $('#newRoomInput');
  const diaryTemplates = $('#diaryTemplates');

  // Modal Plant
  const plantModal = $('#plantModal');
  const modalTitle = $('#modalTitle');
  const plantForm = $('#plantForm');
  const deleteSection = $('#deleteSection');

  // Form fields
  const plantName = $('#plantName');
  const plantSpecies = $('#plantSpecies');
  const roomDropdown = $('#roomDropdown');
  const roomDropdownMenu = $('#roomDropdownMenu');
  const plantFrequency = $('#plantFrequency');
  const freqValue = $('#freqValue');
  const plantPetSafe = $('#plantPetSafe'); // Reused for 'Tóxica para pets?'
  const plantNotes = $('#plantNotes');
  const avatarPicker = $('#avatarPicker');
  const sunOptions = $('#sunOptions');

  // Calendar View
  const calendarView = $('#calendarView');
  const calendarMonthYear = $('#calendarMonthYear');
  const calendarGrid = $('#calendarGrid');

  // Drawer
  const detailDrawer = $('#detailDrawer');
  const drawerTitle = $('#drawerTitle');
  const drawerAvatar = $('#drawerAvatar');
  const drawerSpecies = $('#drawerSpecies');
  const drawerRoom = $('#drawerRoom');
  const drawerFreq = $('#drawerFreq');
  const drawerSun = $('#drawerSun');
  const drawerPet = $('#drawerPet');
  const drawerLastWater = $('#drawerLastWater');
  const drawerNextWater = $('#drawerNextWater');
  const drawerNotes = $('#drawerNotes');
  const drawerNotesSection = $('#drawerNotesSection');
  const diaryTimeline = $('#diaryTimeline');
  const diaryEmpty = $('#diaryEmpty');
  const diaryInput = $('#diaryInput');

  // Theme action in header
  const btnThemeToggle = $('#btnThemeToggle');

  // Toast
  const toastContainer = $('#toastContainer');

  // ─── Helpers ────────────────────────────────────────────────
  function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function daysAgo(ts) {
    const diff = Date.now() - ts;
    const days = Math.floor(diff / MS_PER_DAY);
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    return `${days} dias atrás`;
  }

  function daysUntil(ts) {
    const diff = ts - Date.now();
    const days = Math.ceil(diff / MS_PER_DAY);
    if (days <= 0) return 'Agora!';
    if (days === 1) return 'Amanhã';
    return `Em ${days} dias`;
  }

  function getHydration(plant) {
    const elapsed = Date.now() - plant.lastWatered;
    const cycle = plant.frequency * MS_PER_DAY;
    const pct = Math.max(0, Math.min(100, 100 - (elapsed / cycle) * 100));
    return Math.round(pct);
  }

  function isOverdue(plant) {
    return getHydration(plant) <= 0;
  }

  function getNextWaterDate(plant) {
    return plant.lastWatered + plant.frequency * MS_PER_DAY;
  }

  function getThirstColor(hydration) {
    if (hydration >= 60) {
      const t = (hydration - 60) / 40;
      const r = Math.round(120 + (78 - 120) * t);
      const g = Math.round(160 + (170 - 160) * t);
      const b = Math.round(60 + (80 - 60) * t);
      return `rgb(${r}, ${g}, ${b})`;
    } else if (hydration >= 25) {
      const t = (hydration - 25) / 35;
      const r = Math.round(210 + (120 - 210) * t);
      const g = Math.round(140 + (160 - 140) * t);
      const b = Math.round(60);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const t = hydration / 25;
      const r = Math.round(200 + (210 - 200) * t);
      const g = Math.round(70 + (140 - 70) * t);
      const b = Math.round(50 + (60 - 50) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }

  function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  function updateAppBadge() {
    if ('setAppBadge' in navigator) {
      const count = plants.filter(p => getHydration(p) <= 20).length;
      if (count > 0) {
        navigator.setAppBadge(count).catch(err => console.warn('Error setting app badge:', err));
      } else {
        navigator.clearAppBadge().catch(err => console.warn('Error clearing app badge:', err));
      }
    }
  }

  // ─── Persistence ───────────────────────────────────────────
  function savePlants() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
      updateAppBadge();
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  function loadPlants() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        plants = JSON.parse(data);
        return true;
      }
    } catch (e) {
      console.warn('Could not load from localStorage', e);
    }
    return false;
  }

  // ─── Theme Management ──────────────────────────────────────
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'light';
    setTheme(saved);
  }

  function setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      theme = 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    btnThemeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }

  // ─── Toast ──────────────────────────────────────────────────
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : 'ℹ️'}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function showToastWithUndo(message, plantId) {
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.innerHTML = `
      <span>✅</span>
      <span>${message}</span>
      <button class="toast-undo-btn" id="btnUndoWater">Desfazer</button>
    `;
    toastContainer.appendChild(toast);

    toast.querySelector('#btnUndoWater').addEventListener('click', () => {
      undoWatering();
      toast.remove();
    });

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(30px)';
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000); // 5 seconds display for QoL undo window
  }

  function undoWatering() {
    if (!lastWaterState) return;
    const plant = plants.find(p => p.id === lastWaterState.plantId);
    if (!plant) return;

    // Restore date
    plant.lastWatered = lastWaterState.lastWatered;

    // Remove the last watering entry from diary (first one in unshift)
    if (plant.diary && plant.diary.length > 0 && plant.diary[0].type === 'watering') {
      plant.diary.shift();
    }

    lastWaterState = null;
    savePlants();
    renderAll();
    showToast('Rega desfeita! 🌸', 'info');

    if (viewingPlantId === plant.id) {
      openDrawer(plant.id);
    }
  }

  // ─── Leaf Confetti Generator ────────────────────────────────
  function triggerConfetti(x, y) {
    const particles = ['🍃', '🍂', '🍁', '☘️', '🍀', '🌱', '🌿', '🟢', '❇️'];
    const count = 25;
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = `${x}px`;
    container.style.top = `${y}px`;
    container.style.zIndex = '10000';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);

    for (let i = 0; i < count; i++) {
      const leaf = document.createElement('div');
      leaf.className = 'leaf-particle';
      leaf.textContent = particles[Math.floor(Math.random() * particles.length)];
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 60 + Math.random() * 160;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 100;
      const scale = 0.5 + Math.random() * 0.8;
      const rotation = Math.random() * 360 + (Math.random() > 0.5 ? 360 : -360);

      leaf.style.setProperty('--dx', `${dx}px`);
      leaf.style.setProperty('--dy', `${dy}px`);
      leaf.style.setProperty('--scale', scale);
      leaf.style.setProperty('--rot', `${rotation}deg`);
      leaf.style.animationDelay = `${Math.random() * 0.1}s`;

      container.appendChild(leaf);
    }

    setTimeout(() => container.remove(), 2000);
  }

  // ─── Backup & Restore ───────────────────────────────────────
  function exportBackup() {
    try {
      const dataStr = JSON.stringify(plants, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mossy-garden-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      showToast('Backup exportado com sucesso! 📤');
    } catch (e) {
      showToast('Erro ao exportar dados.', 'info');
    }
  }

  function importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      try {
        const imported = JSON.parse(evt.target.result);
        if (!Array.isArray(imported)) {
          throw new Error('O backup precisa conter uma lista de plantas.');
        }

        if (imported.length > 0) {
          const sample = imported[0];
          if (!sample.id || !sample.name || !sample.lastWatered || !sample.frequency) {
            throw new Error('Formato do arquivo de plantas inválido.');
          }
        }

        if (confirm(`Atenção: Isso substituirá suas ${plants.length} plantas pelas ${imported.length} plantas do backup. Continuar?`)) {
          plants = imported;
          savePlants();
          renderAll();
          showToast('Backup importado com sucesso! 📥');
        }
      } catch (err) {
        alert(`Erro de importação: ${err.message}`);
        showToast('Falha ao restaurar dados.', 'info');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  }

  // ─── Render Stats ──────────────────────────────────────────
  function renderStats() {
    const total = plants.length;
    const avgHydration = total > 0 
      ? Math.round(plants.reduce((sum, p) => sum + getHydration(p), 0) / total)
      : 0;

    if (thrivingLabel) {
      thrivingLabel.textContent = `${avgHydration}%`;
    }

    if (thrivingCircle) {
      const offset = 100 - avgHydration;
      thrivingCircle.style.strokeDashoffset = offset;
      thrivingCircle.style.stroke = getThirstColor(avgHydration);
    }
  }

  // ─── Render Filters ────────────────────────────────────────
  function renderFilters() {
    const thirstyCount = plants.filter(p => getHydration(p) <= 20).length;
    if (currentFilter === 'thirsty' && thirstyCount === 0) {
      currentFilter = 'all';
    }

    const roomsList = [...new Set(plants.map(p => p.room))].sort();
    const existingBtns = roomFiltersContainer.querySelectorAll('.filter-btn:not([data-room="all"])');
    existingBtns.forEach(b => b.remove());

    const roomCounts = {};
    plants.forEach(p => {
      roomCounts[p.room] = (roomCounts[p.room] || 0) + 1;
    });

    const allBtn = roomFiltersContainer.querySelector('[data-room="all"]');
    if (allBtn) {
      allBtn.className = `filter-btn${currentFilter === 'all' ? ' active' : ''}`;
      allBtn.textContent = `Todas (${plants.length})`;
    }

    if (thirstyCount > 0) {
      const thirstyBtn = document.createElement('button');
      thirstyBtn.className = `filter-btn btn-thirsty${currentFilter === 'thirsty' ? ' active' : ''}`;
      thirstyBtn.dataset.room = 'thirsty';
      thirstyBtn.textContent = `💧 Sedentas (${thirstyCount})`;
      if (allBtn) {
        allBtn.after(thirstyBtn);
      } else {
        roomFiltersContainer.appendChild(thirstyBtn);
      }
    }

    roomsList.forEach(room => {
      const btn = document.createElement('button');
      btn.className = `filter-btn${currentFilter === room ? ' active' : ''}`;
      btn.dataset.room = room;
      btn.textContent = `${room} (${roomCounts[room] || 0})`;
      roomFiltersContainer.appendChild(btn);
    });
  }

  // ─── Render Cards Grid ─────────────────────────────────────
  function renderPlants() {
    let filtered = plants;

    if (currentFilter === 'thirsty') {
      filtered = filtered.filter(p => getHydration(p) <= 20);
    } else if (currentFilter !== 'all') {
      filtered = filtered.filter(p => p.room === currentFilter);
    }

    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.species && p.species.toLowerCase().includes(q)) ||
        p.room.toLowerCase().includes(q)
      );
    }

    const sortVal = currentSort;
    if (sortVal === 'thirst') {
      filtered.sort((a, b) => getHydration(a) - getHydration(b));
    } else if (sortVal === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    } else if (sortVal === 'recent') {
      filtered.sort((a, b) => plants.indexOf(b) - plants.indexOf(a));
    } else if (sortVal === 'freq') {
      filtered.sort((a, b) => a.frequency - b.frequency);
    }

    plantsGrid.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.classList.remove('hidden');
      if (plants.length === 0) {
        emptyState.querySelector('h3').textContent = 'Seu jardim ainda está vazio';
        emptyState.querySelector('p').textContent = 'Adicione sua primeira planta e comece a cuidar do seu garden!';
      } else {
        emptyState.querySelector('h3').textContent = 'Nenhuma planta encontrada';
        emptyState.querySelector('p').textContent = 'Tente outro filtro ou termo de busca.';
      }
    } else {
      emptyState.classList.add('hidden');
    }

    filtered.forEach((plant, index) => {
      const hydration = getHydration(plant);
      const overdue = hydration <= 0;
      const color = getThirstColor(hydration);
      const nextWater = getNextWaterDate(plant);

      const card = document.createElement('div');
      card.className = `plant-card${overdue ? ' overdue' : ''}`;
      card.style.animationDelay = `${index * 0.05}s`;
      card.dataset.id = plant.id;

      let imageHTML = `<button type="button" class="card-avatar-placeholder" data-action="edit" data-id="${plant.id}" title="Editar ${escapeHTML(plant.name)}">${plant.avatar}</button>`;

      const thirstText = hydration >= 80 ? 'Hidratada' :
                          hydration >= 50 ? 'Confortável' :
                          hydration >= 20 ? 'Secando...' :
                          hydration > 0  ? 'Com sede!' : 'Precisa de água!';

      card.innerHTML = `
        <div class="card-image">
          ${imageHTML}
          <span class="card-badge card-badge-room">${plant.room}</span>
          <span class="card-badge-overdue">⚠ Atrasada</span>
          ${plant.petToxic ? `
            <span class="card-pet-icon toxic" title="Tóxica para pets! ⚠️">⚠️</span>
          ` : `
            <span class="card-pet-icon safe" title="Segura para pets 🐾">🐾</span>
          `}
        </div>
        <div class="card-body">
          <div class="card-name">${escapeHTML(plant.name)}</div>
          <div class="card-species">${plant.species ? escapeHTML(plant.species) : 'Espécie não informada'}</div>

          <div class="thirst-bar-wrapper">
            <div class="thirst-bar-header">
              <span class="thirst-label">${thirstText}</span>
              <span class="thirst-value" style="color:${color}">${hydration}%</span>
            </div>
            <div class="thirst-bar-track">
              <div class="thirst-bar-fill" style="width:${hydration}%;background:${color};"></div>
            </div>
          </div>

          <div class="card-water-info">
            <span>💧 ${daysAgo(plant.lastWatered)}</span>
            <span>📅 ${overdue ? 'Atrasada!' : daysUntil(nextWater)}</span>
          </div>

          <div class="card-actions">
            <button class="btn-water" data-action="water" data-id="${plant.id}">
              💧 Reguei!
            </button>
            <button class="btn-card-detail" data-action="detail" data-id="${plant.id}" title="Detalhes">
              📖
            </button>
          </div>
        </div>
      `;

      plantsGrid.appendChild(card);
    });
  }

  // ─── Water Action ──────────────────────────────────────────
  function waterPlant(id, event = null) {
    const plant = plants.find(p => p.id === id);
    if (!plant) return;

    // Save previous state for undoing
    lastWaterState = {
      plantId: plant.id,
      lastWatered: plant.lastWatered
    };

    plant.lastWatered = Date.now();
    plant.diary.unshift({
      date: Date.now(),
      text: 'Rega realizada',
      type: 'watering'
    });

    savePlants();

    const card = plantsGrid.querySelector(`[data-id="${id}"]`);
    if (card) {
      card.classList.remove('overdue');
      card.classList.add('just-watered');
      createWaterSplash(card);
      setTimeout(() => card.classList.remove('just-watered'), 700);
    }

    // Default Confetti explosion
    let clickX = window.innerWidth / 2;
    let clickY = window.innerHeight / 2;
    if (event && event.clientX) {
      clickX = event.clientX;
      clickY = event.clientY;
    } else if (card) {
      const rect = card.getBoundingClientRect();
      clickX = rect.left + rect.width / 2;
      clickY = rect.top + rect.height / 2;
    }
    triggerConfetti(clickX, clickY);

    renderAll();
    showToastWithUndo(`${plant.name} foi regada! 💧🌿`, plant.id);

    if (viewingPlantId === id) {
      openDrawer(id);
    }
  }

  function createWaterSplash(card) {
    const rect = card.getBoundingClientRect();
    const container = document.createElement('div');
    container.className = 'water-splash';
    container.style.position = 'fixed';
    container.style.left = `${rect.left + rect.width / 2}px`;
    container.style.top = `${rect.top + rect.height * 0.3}px`;
    container.style.zIndex = '9999';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);

    for (let i = 0; i < 10; i++) {
      const drop = document.createElement('div');
      drop.className = 'water-drop';
      const angle = (Math.PI * 2 * i) / 10;
      const dist = 30 + Math.random() * 40;
      drop.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      drop.style.setProperty('--dy', `${Math.sin(angle) * dist - 20}px`);
      drop.style.animationDelay = `${Math.random() * 0.15}s`;
      container.appendChild(drop);
    }

    setTimeout(() => container.remove(), 800);
  }

  // ─── Monthly Calendar Renderer ─────────────────────────────
  function getWateringStatusForDate(plant, dateObj) {
    const targetYear = dateObj.getFullYear();
    const targetMonth = dateObj.getMonth();
    const targetDate = dateObj.getDate();

    // Check next watering dates
    const nextWater = getNextWaterDate(plant);
    const nextWaterDate = new Date(nextWater);

    // If target day is same day as last watered, it is 'watered'
    if (isSameDay(dateObj, new Date(plant.lastWatered))) {
      return { type: 'watered', label: `${plant.avatar} ${plant.name}` };
    }

    // If target day is same day as next scheduled water
    if (isSameDay(dateObj, nextWaterDate)) {
      const isToday = isSameDay(dateObj, new Date());
      const isPast = nextWater < Date.now() && !isToday;
      if (isToday) {
        return { type: isOverdue(plant) ? 'due' : 'watered', label: `${plant.avatar} ${plant.name}` };
      }
      return { type: isPast ? 'due' : 'upcoming', label: `${plant.avatar} ${plant.name}` };
    }

    // Check future occurrences (n > 1)
    if (dateObj.getTime() > nextWater) {
      // Calculate how many days after nextWater target is
      const diffMs = dateObj.getTime() - nextWater;
      const diffDays = Math.round(diffMs / MS_PER_DAY);
      if (diffDays > 0 && diffDays % plant.frequency === 0) {
        return { type: 'upcoming', label: `${plant.avatar} ${plant.name}` };
      }
    }

    // Check past logs in diary
    if (plant.diary) {
      const hasWateringEntry = plant.diary.some(entry => {
        if (entry.type !== 'watering') return false;
        return isSameDay(dateObj, new Date(entry.date));
      });
      if (hasWateringEntry) {
        return { type: 'watered', label: `${plant.avatar} ${plant.name}` };
      }
    }

    return null;
  }

  function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    calendarMonthYear.textContent = `${MONTHS_PT[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    calendarGrid.innerHTML = '';

    for (let i = 0; i < firstDayIndex; i++) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'calendar-day empty';
      calendarGrid.appendChild(emptyDiv);
    }

    const today = new Date();

    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(year, month, day);
      const isToday = today.getFullYear() === year &&
                      today.getMonth() === month &&
                      today.getDate() === day;

      const dayCell = document.createElement('div');
      dayCell.className = `calendar-day${isToday ? ' today' : ''}`;
      
      const numSpan = document.createElement('span');
      numSpan.className = 'calendar-day-num';
      numSpan.textContent = day;
      dayCell.appendChild(numSpan);

      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'calendar-plant-items';

      plants.forEach(plant => {
        const schedule = getWateringStatusForDate(plant, cellDate);
        if (schedule) {
          const badge = document.createElement('div');
          badge.className = `calendar-plant-badge ${schedule.type}`;
          badge.textContent = schedule.label;
          
          badge.addEventListener('click', (e) => {
            e.stopPropagation();
            openDrawer(plant.id);
          });
          itemsContainer.appendChild(badge);
        }
      });

      dayCell.appendChild(itemsContainer);
      calendarGrid.appendChild(dayCell);
    }
  }

  function navigateMonth(direction) {
    calendarDate.setMonth(calendarDate.getMonth() + direction);
    renderCalendar();
  }

  // ─── Modal Plant Add/Edit ───────────────────────────────────
  function renderAvatarPicker() {
    avatarPicker.innerHTML = '';
    Object.entries(EMOJI_NAMES).forEach(([emoji, name]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'avatar-option';
      btn.dataset.avatar = emoji;
      btn.title = name; // Tooltip name on hover
      btn.textContent = emoji;
      avatarPicker.appendChild(btn);
    });
  }

  function populateRoomDropdown() {
    const defaultRooms = ['Sala', 'Quarto', 'Cozinha', 'Varanda', 'Banheiro', 'Jardim'];
    const customRooms = plants.map(p => p.room).filter(r => !defaultRooms.includes(r));
    const allRooms = [...defaultRooms, ...new Set(customRooms)];
    
    if (!roomDropdownMenu) return;
    roomDropdownMenu.innerHTML = '';
    
    const icons = {
      'Sala': '🛋️',
      'Quarto': '🛏️',
      'Cozinha': '🍳',
      'Varanda': '🌅',
      'Banheiro': '🚿',
      'Jardim': '🌳'
    };
    
    allRooms.forEach(room => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.dataset.value = room;
      const icon = icons[room] || '🏠';
      item.textContent = `${icon} ${room}`;
      roomDropdownMenu.appendChild(item);
    });
    
    const itemNew = document.createElement('div');
    itemNew.className = 'dropdown-item btn-add-custom-room';
    itemNew.dataset.value = 'new-room';
    itemNew.textContent = '＋ Adicionar Cômodo...';
    roomDropdownMenu.appendChild(itemNew);
  }

  function setModalSelectedRoom(roomName) {
    selectedRoomModal = roomName;
    if (!roomDropdown) return;
    
    const trigger = roomDropdown.querySelector('.dropdown-trigger');
    const label = trigger.querySelector('.selected-value');
    
    const icons = {
      'Sala': '🛋️',
      'Quarto': '🛏️',
      'Cozinha': '🍳',
      'Varanda': '🌅',
      'Banheiro': '🚿',
      'Jardim': '🌳'
    };
    const icon = icons[roomName] || '🏠';
    
    label.textContent = roomName === 'new-room' ? '＋ Adicionar Cômodo...' : `${icon} ${roomName}`;
    
    if (roomDropdownMenu) {
      roomDropdownMenu.querySelectorAll('.dropdown-item').forEach(el => {
        el.classList.toggle('active', el.dataset.value === roomName);
      });
    }
  }

  function openModal(plantId = null) {
    editingPlantId = plantId;
    populateRoomDropdown();
    if (newRoomWrapper) newRoomWrapper.classList.add('hidden');
    resetForm();

    if (plantId) {
      const plant = plants.find(p => p.id === plantId);
      if (!plant) return;

      modalTitle.textContent = 'Editar Planta';
      $('#btnSaveModal').textContent = '💾 Salvar Alterações';
      deleteSection.classList.remove('hidden');

      plantName.value = plant.name;
      plantSpecies.value = plant.species || '';
      setModalSelectedRoom(plant.room);
      plantFrequency.value = plant.frequency;
      freqValue.textContent = `${plant.frequency} dias`;
      plantPetSafe.checked = plant.petToxic || false;
      plantNotes.value = plant.notes || '';

      setActiveAvatar(plant.avatar);
      setActiveSun(plant.sunlight);
    } else {
      modalTitle.textContent = 'Nova Planta';
      $('#btnSaveModal').textContent = '🌱 Salvar Planta';
      deleteSection.classList.add('hidden');
      setModalSelectedRoom('Sala');
    }

    plantModal.classList.add('active');
    setTimeout(() => plantName.focus(), 300);
  }

  function closeModal() {
    plantModal.classList.remove('active');
    editingPlantId = null;
    resetForm();
  }

  function resetForm() {
    plantForm.reset();
    freqValue.textContent = '7 dias';
    setActiveAvatar('🪴');
    setActiveSun('medium');
  }

  function setActiveAvatar(emoji) {
    $$('.avatar-option').forEach(o => {
      o.classList.toggle('active', o.dataset.avatar === emoji);
    });
  }

  function getSelectedAvatar() {
    const active = avatarPicker.querySelector('.avatar-option.active');
    return active ? active.dataset.avatar : '🪴';
  }

  function setActiveSun(value) {
    $$('.sun-option').forEach(o => {
      o.classList.toggle('active', o.dataset.sun === value);
    });
  }

  function getSelectedSun() {
    const active = sunOptions.querySelector('.sun-option.active');
    return active ? active.dataset.sun : 'medium';
  }

  function savePlant(e) {
    e.preventDefault();

    const name = plantName.value.trim();
    if (!name) {
      plantName.focus();
      showToast('Dê um nome à sua planta! 🌸', 'info');
      return;
    }

    let room = selectedRoomModal;
    if (room === 'new-room') {
      const customRoomName = newRoomInput.value.trim();
      if (!customRoomName) {
        newRoomInput.focus();
        showToast('Digite o nome do novo ambiente! 🏠', 'info');
        return;
      }
      room = customRoomName;
    }

    if (editingPlantId) {
      const plant = plants.find(p => p.id === editingPlantId);
      if (!plant) return;

      plant.name = name;
      plant.species = plantSpecies.value.trim();
      plant.room = room;
      plant.frequency = parseInt(plantFrequency.value);
      plant.sunlight = getSelectedSun();
      plant.petToxic = plantPetSafe.checked;
      plant.notes = plantNotes.value.trim();
      plant.avatar = getSelectedAvatar();

      showToast(`${name} foi atualizada! ✨`);
    } else {
      const newPlant = {
        id: generateId(),
        name: name,
        species: plantSpecies.value.trim(),
        room: room,
        frequency: parseInt(plantFrequency.value),
        lastWatered: Date.now(),
        sunlight: getSelectedSun(),
        petToxic: plantPetSafe.checked,
        notes: plantNotes.value.trim(),
        avatar: getSelectedAvatar(),
        diary: [
          { date: Date.now(), text: 'Planta adicionada ao jardim! 🌱', type: 'note' }
        ]
      };
      plants.push(newPlant);
      showToast(`${name} foi adicionada ao jardim! 🌱`);
    }

    savePlants();
    closeModal();
    renderAll();
  }

  function deletePlant() {
    if (!editingPlantId) return;
    const plant = plants.find(p => p.id === editingPlantId);
    if (!plant) return;

    if (!confirm(`Tem certeza que deseja remover "${plant.name}" do seu jardim?`)) return;

    plants = plants.filter(p => p.id !== editingPlantId);
    savePlants();
    closeModal();
    closeDrawer();
    renderAll();
    showToast(`${plant.name} foi removida do jardim.`, 'info');
  }

  // ─── Detail Drawer ────────────────────────────────────────
  function openDrawer(id) {
    const plant = plants.find(p => p.id === id);
    if (!plant) return;

    viewingPlantId = id;
    drawerTitle.textContent = plant.name;
    drawerAvatar.textContent = plant.avatar;

    drawerSpecies.textContent = plant.species || '—';
    drawerRoom.textContent = plant.room;
    drawerFreq.textContent = `${plant.frequency} dias`;
    drawerSun.textContent = SUN_LABELS[plant.sunlight] || '—';
    drawerPet.textContent = plant.petToxic ? '⚠️ Sim (Tóxica)' : '✅ Não (Segura)';
    drawerPet.style.color = plant.petToxic ? 'var(--accent-terracotta)' : '';
    drawerLastWater.innerHTML = `${formatDate(plant.lastWatered)} (${daysAgo(plant.lastWatered)})`;

    const nextWater = getNextWaterDate(plant);
    const overdue = isOverdue(plant);
    drawerNextWater.textContent = overdue 
      ? `⚠️ Atrasada! (era ${formatDate(nextWater)})` 
      : `${formatDate(nextWater)} (${daysUntil(nextWater)})`;
    drawerNextWater.style.color = overdue ? 'var(--accent-terracotta)' : '';

    if (plant.notes) {
      drawerNotes.textContent = plant.notes;
      drawerNotesSection.classList.remove('hidden');
    } else {
      drawerNotesSection.classList.add('hidden');
    }

    renderDiary(plant);
    detailDrawer.classList.add('active');
  }

  function closeDrawer() {
    detailDrawer.classList.remove('active');
    viewingPlantId = null;
  }

  function renderDiary(plant) {
    const items = diaryTimeline.querySelectorAll('.diary-item');
    items.forEach(i => i.remove());

    if (!plant.diary || plant.diary.length === 0) {
      diaryEmpty.classList.remove('hidden');
      return;
    }

    diaryEmpty.classList.add('hidden');
    const sorted = [...plant.diary].sort((a, b) => b.date - a.date);

    sorted.forEach(entry => {
      const item = document.createElement('div');
      item.className = `diary-item${entry.type === 'watering' ? ' watering-log' : ''}`;

      const tagClass = entry.type === 'watering' ? 'watering' : 'note';
      const tagIcon = entry.type === 'watering' ? '💧' : '📝';
      const tagText = entry.type === 'watering' ? 'Rega' : 'Nota';

      item.innerHTML = `
        <div class="diary-item-content">
          <div class="diary-item-date">${formatDate(entry.date)}</div>
          <div class="diary-item-text">${escapeHTML(entry.text)}</div>
          <span class="diary-item-tag ${tagClass}">${tagIcon} ${tagText}</span>
        </div>
        <button class="btn-delete-diary" data-date="${entry.date}" title="Excluir anotação">🗑️</button>
      `;

      diaryTimeline.appendChild(item);
    });
  }

  function deleteDiaryEntry(date) {
    if (!viewingPlantId) return;
    const plant = plants.find(p => p.id === viewingPlantId);
    if (!plant) return;

    if (!confirm('Deseja realmente excluir esta anotação do diário?')) return;

    plant.diary = plant.diary.filter(entry => entry.date !== date);
    savePlants();
    renderDiary(plant);
    showToast('Anotação excluída! 🗑️', 'info');
    renderAll();
  }

  function addDiaryEntry() {
    if (!viewingPlantId) return;
    const text = diaryInput.value.trim();
    if (!text) {
      diaryInput.focus();
      return;
    }

    const plant = plants.find(p => p.id === viewingPlantId);
    if (!plant) return;

    plant.diary.unshift({
      date: Date.now(),
      text: text,
      type: 'note'
    });

    diaryInput.value = '';
    savePlants();
    renderDiary(plant);
    showToast('Anotação adicionada ao diário! 📝');
  }

  // ─── Render All ────────────────────────────────────────────
  function renderAll() {
    renderStats();
    renderFilters();
    if (currentView === 'estufa') {
      renderPlants();
    } else {
      renderCalendar();
    }
  }

  function switchView(view) {
    currentView = view;
    $$('.view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    if (view === 'estufa') {
      estufaView.classList.remove('hidden');
      calendarView.classList.add('hidden');
      renderPlants();
    } else {
      estufaView.classList.add('hidden');
      calendarView.classList.remove('hidden');
      renderCalendar();
    }
  }

  // ─── Event Listeners ──────────────────────────────────────
  function initEvents() {
    // Theme Header Action
    btnThemeToggle.addEventListener('click', toggleTheme);

    // Backup & Restore Footer Actions
    $('#btnExportBackup').addEventListener('click', exportBackup);
    importFileInput.addEventListener('change', importBackup);

    // View Switcher Buttons
    $('#viewSwitcher').addEventListener('click', (e) => {
      const btn = e.target.closest('.view-btn');
      if (!btn) return;
      switchView(btn.dataset.view);
    });

    // Calendar Navigation
    $('#btnPrevMonth').addEventListener('click', () => navigateMonth(-1));
    $('#btnNextMonth').addEventListener('click', () => navigateMonth(1));

    // Add Plant Buttons
    $('#btnAddPlant').addEventListener('click', () => openModal());
    $('#btnAddPlantEmpty').addEventListener('click', () => openModal());

    // Modal Add/Edit Close
    $('#modalClose').addEventListener('click', closeModal);
    $('#btnCancelModal').addEventListener('click', closeModal);
    plantModal.addEventListener('click', (e) => {
      if (e.target === plantModal) closeModal();
    });

    // Form Submits
    plantForm.addEventListener('submit', savePlant);
    $('#btnDeletePlant').addEventListener('click', deletePlant);

    // Frequency Slider dynamic display
    plantFrequency.addEventListener('input', () => {
      freqValue.textContent = `${plantFrequency.value} dias`;
    });

    // Custom Dropdown sorting
    if (sortDropdown) {
      const trigger = sortDropdown.querySelector('.dropdown-trigger');
      const label = trigger.querySelector('.selected-value');
      
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        sortDropdown.classList.toggle('open');
      });

      sortDropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.dropdown-item');
        if (!item) return;
        
        const val = item.dataset.value;
        currentSort = val;

        sortDropdown.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        label.textContent = item.textContent;
        sortDropdown.classList.remove('open');
        renderPlants();
      });

      document.addEventListener('click', () => {
        sortDropdown.classList.remove('open');
      });
    }

    // Custom Dropdown room selection
    if (roomDropdown) {
      const trigger = roomDropdown.querySelector('.dropdown-trigger');
      
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        roomDropdown.classList.toggle('open');
      });

      roomDropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.dropdown-item');
        if (!item) return;
        
        const val = item.dataset.value;
        if (val === 'new-room') {
          newRoomWrapper.classList.remove('hidden');
          newRoomInput.value = '';
          newRoomInput.focus();
          setModalSelectedRoom('new-room');
        } else {
          newRoomWrapper.classList.add('hidden');
          setModalSelectedRoom(val);
        }
        
        roomDropdown.classList.remove('open');
      });

      document.addEventListener('click', () => {
        roomDropdown.classList.remove('open');
      });
    }

    // Diary Templates click
    if (diaryTemplates) {
      diaryTemplates.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-template');
        if (!btn) return;
        diaryInput.value = btn.dataset.text;
        diaryInput.focus();
      });
    }

    // Light options
    sunOptions.addEventListener('click', (e) => {
      const btn = e.target.closest('.sun-option');
      if (!btn) return;
      $$('#sunOptions .sun-option').forEach(o => o.classList.remove('active'));
      btn.classList.add('active');
    });

    // Avatar Picker selection click
    avatarPicker.addEventListener('click', (e) => {
      const btn = e.target.closest('.avatar-option');
      if (!btn) return;
      $$('#avatarPicker .avatar-option').forEach(o => o.classList.remove('active'));
      btn.classList.add('active');
    });

    // Filters & Search
    roomFiltersContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      currentFilter = btn.dataset.room;
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPlants();
    });

    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.trim();
      renderPlants();
    });

    // Watering, Details & Direct Edit delegated click on Grid Cards
    plantsGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === 'water') {
        waterPlant(id, e);
      } else if (action === 'detail') {
        openDrawer(id);
      } else if (action === 'edit') {
        openModal(id);
      }
    });

    // Drawer closing
    $('#drawerClose').addEventListener('click', closeDrawer);
    detailDrawer.addEventListener('click', (e) => {
      if (e.target === detailDrawer) closeDrawer();
    });

    // Drawer edit & water triggers
    $('#btnEditFromDrawer').addEventListener('click', () => {
      if (viewingPlantId) {
        const idToEdit = viewingPlantId;
        closeDrawer();
        setTimeout(() => openModal(idToEdit), 350);
      }
    });

    $('#btnWaterFromDrawer').addEventListener('click', (e) => {
      if (viewingPlantId) {
        waterPlant(viewingPlantId, e);
      }
    });

    $('#btnDeleteFromDrawer').addEventListener('click', () => {
      if (viewingPlantId) {
        editingPlantId = viewingPlantId;
        deletePlant();
      }
    });

    // Diary Form submissions
    $('#btnAddDiary').addEventListener('click', addDiaryEntry);
    diaryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addDiaryEntry();
      }
    });

    // Delete diary entries
    diaryTimeline.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-delete-diary');
      if (!btn) return;
      const date = parseInt(btn.dataset.date);
      deleteDiaryEntry(date);
    });

    // Keyboard ESC closes modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (plantModal.classList.contains('active')) closeModal();
        else if (detailDrawer.classList.contains('active')) closeDrawer();
      }
    });
  }

  // ─── Initialization ────────────────────────────────────────
  function init() {
    initTheme();

    const loaded = loadPlants();
    if (!loaded || plants.length === 0) {
      plants = SEED_PLANTS;
      savePlants();
    }

    renderAvatarPicker();
    initEvents();

    // Set default active avatar in picker
    setActiveAvatar('🪴');
    
    renderAll();

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('Service Worker registered:', reg.scope))
          .catch(err => console.warn('Service Worker registration failed:', err));
      });
    }

    // Set initial app badge
    updateAppBadge();

    // Handle PWA shortcuts or query parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'calendario') {
      switchView('calendario');
    } else if (urlParams.get('action') === 'add-plant') {
      setTimeout(() => openModal(), 100);
    }
  }

  // Boot app
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
