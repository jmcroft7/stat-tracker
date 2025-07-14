import { elements } from './elements.js';
import * as state from './state.js';
import {
    navigateTo,
    applyTheme, buildRecentActivityPage, getLevelFromHours,
    hoursCache1k, hoursCache10k, buildChart
} from './ui.js';
import { MAX_LEVEL } from './config.js';

export function setupEventListeners() {
    Object.keys(elements.nav).forEach(key => {
        const navElement = elements.nav[key];
        if (navElement) {
            navElement.addEventListener('click', (e) => {
                if (navElement.id !== 'nav-more') {
                    e.preventDefault();
                    if (key === 'recent') buildRecentActivityPage();
                    if (key === 'dashboard') buildChart();
                    navigateTo(key);
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

    elements.addHoursBtn.addEventListener('click', () => {
        const skillId = elements.skillSelect.value;
        const hoursToAdd = parseFloat(elements.hoursInput.value);
        if (skillId && !isNaN(hoursToAdd) && hoursToAdd > 0) {
            state.updateSkillHours(skillId, hoursToAdd);
            elements.hoursInput.value = '';
            navigateTo('stats');
        }
    });

    elements.saveEditsBtn.addEventListener('click', () => {
        const edits = {
            characterName: elements.charNameInput.value.trim() || 'Adventurer',
            skills: []
        };
        document.querySelectorAll('.skill-edit-box').forEach(box => {
            const skillId = box.dataset.skillId;
            edits.skills.push({
                id: skillId,
                displayName: box.querySelector('.skill-edit-box__display-name').value,
                icon: box.querySelector('.edit-icon-select').value,
                skillClass: box.querySelector('.edit-class').value,
                notes: box.querySelector('.edit-notes').value
            });
        });
        state.saveAllSkillEdits(edits);
        alert("Changes saved!");
    });

    elements.addSkillBtn.addEventListener('click', () => {
        state.addSkill();
    });

    elements.editSkillsContainer.addEventListener('click', e => {
        const button = e.target.closest('.skill-edit-box__control-btn');
        if (!button) return;
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
        }
    });
    
    document.body.addEventListener('mouseover', e => {
        const trigger = e.target.closest('[data-tooltip-type], #total-level-value');
        if (!trigger) return;

        let tooltipText = '';

        if (trigger.id === 'total-level-value') {
            tooltipText = trigger.dataset.tooltipText;
        } else {
            const tooltipType = trigger.dataset.tooltipType;
            if (tooltipType === 'progress-overall') {
                tooltipText = trigger.dataset.tooltipText;
            } else {
                const card = trigger.closest('.stat');
                if (card) {
                    const skillId = card.dataset.skillId;
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
        if (e.target.closest('[data-tooltip-type], #total-level-value')) {
            elements.tooltip.classList.add('hidden');
        }
    });

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
        reader.onload = function(event) {
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

    elements.hardModeToggle.addEventListener('change', (e) => {
        state.setHardMode(e.target.checked);
    });

    elements.themeToggle.addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'dark' : 'light';
        state.setTheme(newTheme);
        applyTheme();
    });

    elements.recentViewSelect.addEventListener('change', () => {
        buildRecentActivityPage();
    });
}