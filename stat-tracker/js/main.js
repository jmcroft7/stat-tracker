import { loadData } from './state.js';
import { applyTheme, buildUI } from './ui.js';
import { setupEventListeners } from './handlers.js';

function initializeApp() {
    loadData();
    applyTheme();
    buildUI();
    setupEventListeners();

    // Listen for state changes and update the UI accordingly
    window.addEventListener('state-updated', () => {
        console.log('State updated, rebuilding UI...');
        buildUI();
    });
}

window.addEventListener('load', initializeApp);