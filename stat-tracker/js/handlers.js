import { elements } from './elements.js';
import { characterData, saveData } from './state.js';
import {
    navigateTo, buildUI, updateAllStatsDisplay,
    applyTheme, buildRecentActivityPage, getLevelFromHours,
    hoursCache1k, hoursCache10k, buildChart
} from './ui.js';
import { ICON_LIBRARY, MAX_LEVEL, SKILL_CLASSES } from './config.js';

export function setupEventListeners() {
    Object.keys(elements.nav).forEach(key => {
        elements.nav[key].addEventListener('click', () => {
            if (key === 'recent') {
                buildRecentActivityPage();
            }
            if (key === 'dashboard') {
                buildChart();
            }
            navigateTo(key);
        });
    });

    elements.moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.moreDropdown.classList.toggle('hidden');
    });

    window.addEventListener('click', (e) => {
        if (!elements.moreBtn.contains(e.target)) {
            elements.moreDropdown.classList.add('hidden');
        }
    });

    elements.addHoursBtn.addEventListener('click', () => {
        const skillId = elements.skillSelect.value;
        const hoursToAdd = parseFloat(elements.hoursInput.value);
        if (skillId && !isNaN(hoursToAdd) && hoursToAdd > 0) {
            characterData.skills[skillId].hours += hoursToAdd;
            characterData.hourLogs.push({ date: new Date().toISOString(), skillId: skillId, hours: hoursToAdd });
            elements.hoursInput.value = '';
            saveData();
            updateAllStatsDisplay();
            navigateTo('stats');
        }
    });

    elements.saveEditsBtn.addEventListener('click', () => {
        characterData.characterName = elements.charNameInput.value.trim() || 'Adventurer';
        document.querySelectorAll('.skill-edit-box').forEach(box => {
            const skillId = box.dataset.skillId;
            characterData.skills[skillId].displayName = box.querySelector('.edit-display-name').value;
            characterData.skills[skillId].icon = box.querySelector('.edit-icon-select').value;
            characterData.skills[skillId].class = box.querySelector('.edit-class').value;
            characterData.skills[skillId].notes = box.querySelector('.edit-notes').value;
        });
        saveData();
        buildUI();
        alert("Changes saved!");
    });

    elements.addSkillBtn.addEventListener('click', () => {
        const newId = `skill${Date.now()}`;
        characterData.skills[newId] = { displayName: 'New Skill', icon: ICON_LIBRARY.find(i => i.name === 'Plus').url, hours: 0, notes: '', class: SKILL_CLASSES[0] };
        characterData.skillOrder.push(newId);
        saveData();
        buildUI();
    });

    elements.editSkillsContainer.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (!button) return;
        const box = button.closest('.skill-edit-box');
        const skillId = box.dataset.skillId;
        if (button.classList.contains('delete-skill-btn')) {
            const skillName = characterData.skills[skillId].displayName;
            if (confirm(`Are you sure you want to delete "${skillName}"?`)) {
                delete characterData.skills[skillId];
                characterData.skillOrder = characterData.skillOrder.filter(id => id !== skillId);
                saveData();
                buildUI();
            }
        } else if (button.classList.contains('toggle-minimize-btn')) {
            box.classList.toggle('collapsed');
            button.textContent = box.classList.contains('collapsed') ? '+' : '-';
        } else if (button.classList.contains('reorder-btn')) {
            const dir = button.dataset.dir;
            const index = characterData.skillOrder.indexOf(skillId);
            if (dir === 'up' && index > 0) {
                [characterData.skillOrder[index], characterData.skillOrder[index - 1]] = [characterData.skillOrder[index - 1], characterData.skillOrder[index]];
            } else if (dir === 'down' && index < characterData.skillOrder.length - 1) {
                [characterData.skillOrder[index], characterData.skillOrder[index + 1]] = [characterData.skillOrder[index + 1], characterData.skillOrder[index]];
            }
            saveData();
            buildUI();
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
        if (trigger) {
            let tooltipText = '';
            const card = trigger.closest('.stat, .total-level-card');
            const skillId = card?.dataset.skillId;

            if (trigger.id === 'total-level-value') {
                tooltipText = trigger.dataset.tooltipText;
            } else {
                const tooltipType = trigger.dataset.tooltipType;
                const skill = characterData.skills[skillId];

                switch (tooltipType) {
                    case 'notes':
                        tooltipText = skill.notes || 'No notes for this skill.';
                        break;
                    case 'hours':
                        tooltipText = `${Math.round(skill.hours)} hours`;
                        break;
                    case 'progress':
                        const level = getLevelFromHours(skill.hours, characterData.totalHoursGoal);
                        const cache = characterData.totalHoursGoal === 1000 ? hoursCache1k : hoursCache10k;
                        tooltipText = level >= MAX_LEVEL ? "Max Level!" : `${(cache[level + 1] - skill.hours).toFixed(2)} hours to Lvl ${level + 1}`;
                        break;
                }
            }

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
        const dataStr = JSON.stringify(characterData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${characterData.characterName.replace(/\s/g, '_')}_skills.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    elements.loadFromFileBtn.addEventListener('click', () => { elements.fileLoaderInput.click(); });
    elements.fileLoaderInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                Object.assign(characterData, JSON.parse(event.target.result));
                saveData();
                applyTheme();
                buildUI();
                alert("Character data loaded successfully!");
            } catch (error) {
                alert("Error parsing file.");
            }
        };
        reader.readAsText(file);
        e.target.value = null;
    });

    elements.hardModeToggle.addEventListener('change', (e) => {
        characterData.totalHoursGoal = e.target.checked ? 10000 : 1000;
        saveData();
        updateAllStatsDisplay();
    });

    elements.themeToggle.addEventListener('change', (e) => {
        characterData.theme = e.target.checked ? 'dark' : 'light';
        saveData();
        applyTheme();
    });

    elements.recentViewSelect.addEventListener('change', () => {
        buildRecentActivityPage();
    });
}