import { loadData } from './state.js';
import { applyTheme, buildUI, updateAllStatsDisplay, buildRecentActivityPage } from './ui.js';
import { setupEventListeners } from './handlers.js';

function initializeApp() {
    loadData();
    applyTheme();
    buildUI();
    setupEventListeners();

    // Listen for lightweight hour/level updates
    window.addEventListener('hours-updated', () => {
        console.log('Hours updated, refreshing stats...');
        updateAllStatsDisplay();
    });

    // Listen for major structural changes that require a full rebuild
    window.addEventListener('structure-updated', () => {
        console.log('Structure updated, rebuilding UI...');
        buildUI();
    });
    
    // Listen for view changes on the stats page
    window.addEventListener('view-changed', () => {
        console.log('View changed, rebuilding UI...');
        buildUI();
    });
    
    // Listen for view changes on the recent page
    window.addEventListener('recent-view-changed', () => {
        console.log('Recent view changed, rebuilding recent page...');
        buildRecentActivityPage();
    });
}

window.addEventListener('load', initializeApp);