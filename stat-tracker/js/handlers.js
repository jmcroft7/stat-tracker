import { elements } from './elements.js';
import * as state from './state.js';
import {
    navigateTo,
    applyTheme, buildRecentActivityPage, getLevelFromHours,
    hoursCache1k, hoursCache10k, buildChart
} from './ui.js';
import { MAX_LEVEL } from './config.js';

let isSkillsPageDirty = false;

export function setupEventListeners() {
    // --- Navigation ---
    const navLinks = { ...elements.nav, settings: document.getElementById('nav-settings'), about: document.getElementById('nav-about') };

    Object.keys(navLinks).forEach(key => {
        const navElement = navLinks[key];
        if (navElement) {
            navElement.addEventListener('click', (e) => {
                e.preventDefault();

                const currentPageElement = document.querySelector('.page:not(.hidden)');
                const currentPageKey = currentPageElement ? Object.keys(elements.pages).find(k => elements.pages[k] === currentPageElement) : null;

                // Check for unsaved changes before navigating away from the skills page
                if (currentPageKey === 'skills' && isSkillsPageDirty) {
                    if (!confirm('You have unsaved changes. Are you sure you want to discard them?')) {
                        return; // Stop the navigation
                    }
                }
                // If we are leaving the page (by choice or after saving), reset the dirty flag
                isSkillsPageDirty = false;

                if (key === 'recent') buildRecentActivityPage();
                if (key === 'dashboard') buildChart();
                navigateTo(key);
                // Close dropdown if a dropdown link was clicked
                if (key === 'settings' || key === 'about') {
                    elements.moreDropdown.classList.add('hidden');
                }
            });
        }
    });

    elements.moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.moreDropdown.classList.toggle('hidden');
    });

    window.addEventListener('click', (e) => {
        if (!elements.moreBtn.contains(e.target) && !elements.moreDropdown.contains(e.target)) {
            elements.moreDropdown.classList.add('hidden');
        }
    });

    // --- Page-Specific Filters ---
    document.getElementById('stats-page-filters').addEventListener('click', (e) => {
        const target = e.target.closest('.stat-filter-btn');
        if (target) {
            const view = target.dataset.view;
            state.setActiveStatView(view);
        }
    });

    document.getElementById('recent-page-filters').addEventListener('click', (e) => {
        const target = e.target.closest('.stat-filter-btn');
        if (target) {
            const view = target.dataset.view;
            state.setActiveRecentView(view);
        }
    });

    document.getElementById('graph-page-filters').addEventListener('click', (e) => {
        const target = e.target.closest('.stat-filter-btn');
        if (target) {
            const view = target.dataset.view;
            state.setActiveGraphView(view);
        }
    });


    // --- State-Changing Actions ---
    elements.addHoursBtn.addEventListener('click', () => {
        const skillId = elements.skillSelect.value;
        const hoursToAdd = parseFloat(elements.hoursInput.value);
        if (skillId && !isNaN(hoursToAdd) && hoursToAdd > 0) {
            state.updateSkillHours(skillId, hoursToAdd);
            elements.hoursInput.value = '';
            navigateTo('stats');
        }
    });

    // Auto-save character name on input blur
    elements.charNameInput.addEventListener('blur', () => {
        const newName = elements.charNameInput.value.trim();
        if (newName && newName !== state.characterData.characterName) {
            state.updateCharacterName(newName);
        }
    });

    elements.saveEditsBtn.addEventListener('click', () => {
        const edits = [];
        document.querySelectorAll('.skill-edit-box').forEach(box => {
            const skillId = box.dataset.skillId;
            edits.push({
                id: skillId,
                displayName: box.querySelector('.skill-edit-box__display-name').value,
                icon: box.querySelector('.edit-icon-select').value,
                skillClass: box.querySelector('.edit-class').value,
                notes: box.querySelector('.edit-notes').value
            });
        });
        state.saveAllSkillEdits(edits);
        isSkillsPageDirty = false; // Reset the flag after saving
        alert("Changes saved!");
    });

    elements.addSkillBtn.addEventListener('click', () => {
        state.addSkill();
    });

    // Set dirty flag when any input on the skills page changes
    elements.editSkillsContainer.addEventListener('input', () => {
        isSkillsPageDirty = true;
    });

    elements.editSkillsContainer.addEventListener('click', e => {
        const button = e.target.closest('.skill-edit-box__control-btn');
        if (!button) return;
        isSkillsPageDirty = true; // Deleting or reordering also counts as a change
        const box = button.closest('.skill-edit-box');
        if (!box) return;
        const skillId = box.dataset.skillId;

        if (button.classList.contains('skill-edit-box__control-btn--delete')) {
            const skillName = state.characterData.skills[skillId].displayName;
            if (confirm(`Are you sure you want to delete "${skillName}"?`)) {
                state.deleteSkill(skillId);
            }
        } else if (button.classList.contains('skill-edit-box__control-btn--minimize')) {
            box.classList.toggle('skill-edit-box--collapsed');
            button.textContent = box.classList.contains('skill-edit-box--collapsed') ? '+' : '-';
        } else if (button.classList.contains('skill-edit-box__control-btn--reorder')) {
            const dir = button.dataset.dir;
            state.reorderSkill(skillId, dir);
        }
    });

    elements.editSkillsContainer.addEventListener('change', e => {
        if (e.target.classList.contains('edit-icon-select')) {
            const previewImg = e.target.closest('.icon-select-wrapper').querySelector('.icon-preview');
            previewImg.src = e.target.value;
            isSkillsPageDirty = true;
        }
    });

    // --- Tooltip Handling ---
    document.body.addEventListener('mouseover', e => {
        const trigger = e.target.closest('[data-tooltip-type]');
        if (!trigger) return;

        let tooltipText = '';
        const tooltipType = trigger.dataset.tooltipType;
        const mainCard = trigger.closest('.total-level-card');
        const skillCard = trigger.closest('.stat');

        if (mainCard) {
            // Hovering over elements in the main 'Overall' or 'Total' card
            if (tooltipType === 'hours') {
                tooltipText = trigger.dataset.tooltipText;
            } else if (tooltipType === 'progress-overall') {
                tooltipText = trigger.dataset.tooltipText;
            }
        } else if (skillCard) {
            // Hovering over elements in a normal skill card
            const skillId = skillCard.dataset.skillId;
            const skill = state.characterData.skills[skillId];
            if (skill) {
                switch (tooltipType) {
                    case 'notes':
                        tooltipText = skill.notes || 'No notes for this skill.';
                        break;
                    case 'hours':
                        tooltipText = `${Math.round(skill.hours)} hours`;
                        break;
                    case 'progress':
                        const level = getLevelFromHours(skill.hours, state.characterData.totalHoursGoal);
                        const cache = state.characterData.totalHoursGoal === 1000 ? hoursCache1k : hoursCache10k;
                        tooltipText = level >= MAX_LEVEL ? "Max Level!" : `${(cache[level + 1] - skill.hours).toFixed(1)} hours to Lvl ${level + 1}`;
                        break;
                }
            }
        }

        if (tooltipText) {
            elements.tooltip.textContent = tooltipText;
            elements.tooltip.classList.remove('hidden');
        }
    });

    document.body.addEventListener('mousemove', e => {
        if (elements.tooltip.classList.contains('hidden')) return;
        elements.tooltip.style.left = `${e.pageX + 15}px`;
        elements.tooltip.style.top = `${e.pageY + 15}px`;
    });

    document.body.addEventListener('mouseout', e => {
        if (e.target.closest('[data-tooltip-type]')) {
            elements.tooltip.classList.add('hidden');
        }
    });

    // --- File Operations ---
    elements.saveToFileBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(state.characterData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.characterData.characterName.replace(/\s/g, '_')}_skills.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    elements.loadFromFileBtn.addEventListener('click', () => elements.fileLoaderInput.click());
    elements.fileLoaderInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                const data = JSON.parse(event.target.result);
                state.loadFromFile(data);
                applyTheme();
                alert("Character data loaded successfully!");
            } catch (error) {
                alert("Error parsing file.");
            }
        };
        reader.readAsText(file);
        e.target.value = null;
    });

    // --- Toggles & Selects ---
    elements.hardModeToggle.addEventListener('change', (e) => {
        state.setHardMode(e.target.checked);
    });

    elements.themeToggle.addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'dark' : 'light';
        state.setTheme(newTheme);
        applyTheme();
    });
}