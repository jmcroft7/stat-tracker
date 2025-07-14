import { loadData } from './state.js';
import { applyTheme, buildUI } from './ui.js';
import { setupEventListeners } from './handlers.js';

function initializeApp() {
    loadData();
    applyTheme();
    buildUI();
    setupEventListeners();
}

window.addEventListener('load', initializeApp);