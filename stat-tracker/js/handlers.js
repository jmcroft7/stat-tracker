import { elements } from './elements.js';
import * as state from './state.js';
import { EMOJI_ICONS } from './config.js';
import {
    navigateTo,
    applyTheme,
    buildRecentActivityPage,
    getLevelFromHours,
    hoursCache1k,
    hoursCache10k,
    buildChart,
    buildLogPage,
    updateSkillTotalHoursDisplay,
    showToast
} from './ui.js';
import { MAX_LEVEL } from './config.js';

let isSkillsPageDirty = false;

function setupButtonListeners() {
    document.getElementById('add-hours-btn').addEventListener('click', () => {
        const skillId = elements.skillSelect.value;
        const hoursToAdd = parseFloat(elements.hoursInput.value);
        if (skillId && !isNaN(hoursToAdd) && hoursToAdd > 0) {
            const skillName = state.characterData.skills[skillId].displayName;
            state.updateSkillHours(skillId, hoursToAdd);
            
            showToast(`${hoursToAdd} hours added to ${skillName}!`);
            
            elements.hoursInput.value = '';
            updateSkillTotalHoursDisplay(skillId);
        }
    });

    document.getElementById('add-skill-btn').addEventListener('click', () => {
        state.addSkill();
        showToast("New skill added!");
    });

    document.getElementById('save-edits-btn').addEventListener('click', () => {
        const edits = [];
        document.querySelectorAll('.skill-edit-box').forEach(box => {
            const skillId = box.dataset.skillId;
            edits.push({
                id: skillId,
                displayName: box.querySelector('.skill-edit-box__display-name').value,
                icon: box.querySelector('.searchable-dropdown__search').dataset.icon,
                skillClass: box.querySelector('.edit-class').value,
                notes: box.querySelector('.edit-notes').value
            });
        });
        state.saveAllSkillEdits(edits);
        isSkillsPageDirty = false;
        showToast("All changes saved!");
    });

    document.getElementById('save-to-file-btn').addEventListener('click', () => {
        const dataStr = JSON.stringify(state.characterData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.characterData.characterName.replace(/\s/g, '_')}_skills.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById('load-from-file-btn').addEventListener('click', () => elements.fileLoaderInput.click());
}

export function setupEventListeners() {
    // --- App-level listeners ---
    window.addEventListener('log-updated', buildLogPage);
    window.addEventListener('structure-updated', setupButtonListeners);

    // --- Navigation ---
    const navLinks = { ...elements.nav, settings: document.getElementById('nav-settings'), about: document.getElementById('nav-about') };

    Object.keys(navLinks).forEach(key => {
        const navElement = navLinks[key];
        if (navElement) {
            navElement.addEventListener('click', (e) => {
                e.preventDefault();

                const currentPageElement = document.querySelector('.page:not(.hidden)');
                const currentPageKey = currentPageElement ? Object.keys(elements.pages).find(k => elements.pages[k] === currentPageElement) : null;

                if (currentPageKey === 'skills' && isSkillsPageDirty) {
                    if (!confirm('You have unsaved changes. Are you sure you want to discard them?')) {
                        return;
                    }
                }
                isSkillsPageDirty = false;
                
                navigateTo(key);

                // Build page content after navigating
                if (key === 'logHours') buildLogPage();
                if (key === 'recent') buildRecentActivityPage();
                if (key === 'dashboard') buildChart();

                if (key === 'settings' || key === 'about') {
                    elements.moreDropdown.classList.add('hidden');
                }
            });
        }
    });
    
    elements.skillSelect.addEventListener('change', (e) => {
        updateSkillTotalHoursDisplay(e.target.value);
    });

    elements.moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.moreDropdown.classList.toggle('hidden');
    });

    window.addEventListener('click', (e) => {
        if (!elements.moreBtn.contains(e.target) && !elements.moreDropdown.contains(e.target)) {
            elements.moreDropdown.classList.add('hidden');
        }
        document.querySelectorAll('.searchable-dropdown.active').forEach(dropdown => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    });

    // --- Page-Specific Filters ---
    elements.logPageFilters.addEventListener('click', (e) => {
        const target = e.target.closest('.stat-filter-btn');
        if (target) {
            const view = target.dataset.view;
            state.setActiveLogView(view);
        }
    });

    elements.statsPageFilters.addEventListener('click', (e) => {
        const target = e.target.closest('.stat-filter-btn');
        if (target) {
            const view = target.dataset.view;
            state.setActiveStatView(view);
        }
    });

    elements.recentPageFilters.addEventListener('click', (e) => {
        const target = e.target.closest('.stat-filter-btn');
        if (target) {
            const view = target.dataset.view;
            state.setActiveRecentView(view);
        }
    });
    
    elements.recentViewToggle.addEventListener('change', (e) => {
        const newView = e.target.checked ? 'class' : 'skill';
        state.setActiveRecentSubView(newView);
    });

    elements.graphPageFilters.addEventListener('click', (e) => {
        const target = e.target.closest('.stat-filter-btn');
        if (target) {
            const view = target.dataset.view;
            state.setActiveGraphView(view);
        }
    });


    // --- State-Changing Actions ---
    setupButtonListeners();
    
    elements.detailedLogContainer.addEventListener('click', e => {
        const deleteButton = e.target.closest('.log-item__delete-btn');
        if (deleteButton) {
            const logIndex = parseInt(deleteButton.dataset.logIndex, 10);
            const log = state.characterData.hourLogs[logIndex];
            const skillName = state.characterData.skills[log.skillId]?.displayName || 'this entry';

            if (confirm(`Are you sure you want to delete the log of ${log.hours} hours for "${skillName}"?`)) {
                state.deleteHourLog(logIndex);
                showToast('Log entry deleted.', 'danger');
            }
        }
    });

    elements.charNameInput.addEventListener('blur', () => {
        const newName = elements.charNameInput.value.trim();
        if (newName && newName !== state.characterData.characterName) {
            state.updateCharacterName(newName);
        }
    });

    elements.editSkillsContainer.addEventListener('input', (e) => {
        if (!e.target.closest('.searchable-dropdown')) {
            isSkillsPageDirty = true;
        }
    });

    elements.editSkillsContainer.addEventListener('click', e => {
        const dropdownSearch = e.target.closest('.searchable-dropdown__search');
        if (dropdownSearch) {
            const parentDropdown = dropdownSearch.closest('.searchable-dropdown');
            parentDropdown.classList.add('active');
            dropdownSearch.select();
        }

        const dropdownItem = e.target.closest('.searchable-dropdown__list li');
        if (dropdownItem) {
            const parentDropdown = dropdownItem.closest('.searchable-dropdown');
            const searchInput = parentDropdown.querySelector('.searchable-dropdown__search');
            const iconPreview = parentDropdown.querySelector('.searchable-dropdown__icon-preview');
            const newIcon = dropdownItem.dataset.value;
            const newName = dropdownItem.dataset.name;
            
            searchInput.value = newName;
            searchInput.dataset.icon = newIcon;
            iconPreview.textContent = newIcon;
            isSkillsPageDirty = true;
            
            parentDropdown.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
            dropdownItem.classList.add('selected');
            
            parentDropdown.classList.remove('active');
            e.stopPropagation();
            return;
        }


        const button = e.target.closest('.skill-edit-box__control-btn');
        if (!button) return;
        isSkillsPageDirty = true;
        const box = button.closest('.skill-edit-box');
        if (!box) return;
        const skillId = box.dataset.skillId;

        if (button.classList.contains('skill-edit-box__control-btn--delete')) {
            const skillName = state.characterData.skills[skillId].displayName;
            if (confirm(`Are you sure you want to delete "${skillName}"?`)) {
                state.deleteSkill(skillId);
                showToast(`"${skillName}" has been deleted.`, 'danger');
            }
        } else if (button.classList.contains('skill-edit-box__control-btn--minimize')) {
            box.classList.toggle('skill-edit-box--collapsed');
            button.textContent = box.classList.contains('skill-edit-box--collapsed') ? '+' : '-';
        } else if (button.classList.contains('skill-edit-box__control-btn--reorder')) {
            const dir = button.dataset.dir;
            state.reorderSkill(skillId, dir);
        }
    });
    
    elements.editSkillsContainer.addEventListener('keyup', e => {
        const searchInput = e.target.closest('.searchable-dropdown__search');
        if (searchInput) {
            const filter = searchInput.value.toLowerCase();
            const list = searchInput.closest('.searchable-dropdown').querySelector('.searchable-dropdown__list');
            const items = list.getElementsByTagName('li');
            const iconPreview = searchInput.parentElement.querySelector('.searchable-dropdown__icon-preview');
            
            iconPreview.style.display = 'none';

            const fuse = new Fuse(EMOJI_ICONS, { keys: ['name', 'emoji'], threshold: 0.3 });
            const results = filter ? fuse.search(filter).map(result => result.item.emoji) : EMOJI_ICONS.map(i => i.emoji);
            
            for (let i = 0; i < items.length; i++) {
                if (results.includes(items[i].dataset.value)) {
                    items[i].style.display = "";
                } else {
                    items[i].style.display = "none";
                }
            }
        }
    });

    elements.editSkillsContainer.addEventListener('focusout', e => {
        const searchInput = e.target.closest('.searchable-dropdown__search');
        if(searchInput) {
            const iconPreview = searchInput.parentElement.querySelector('.searchable-dropdown__icon-preview');
            iconPreview.style.display = 'block';
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
            if (tooltipType === 'hours') {
                tooltipText = trigger.dataset.tooltipText;
            } else if (tooltipType === 'progress-overall') {
                tooltipText = trigger.dataset.tooltipText;
            }
        } else if (skillCard) {
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
    elements.fileLoaderInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                const data = JSON.parse(event.target.result);
                state.loadFromFile(data);
                applyTheme();
                showToast("Character data loaded successfully!");
            } catch (error) {
                showToast("Error parsing file.", 'danger');
            }
        };
        reader.readAsText(file);
        e.target.value = null;
    });

    // --- Toggles & Selects ---
    elements.hardModeToggle.addEventListener('change', (e) => {
        state.setHardMode(e.target.checked);
    });

    elements.themeSelect.addEventListener('change', (e) => {
        const newTheme = e.target.value;
        state.setTheme(newTheme);
        applyTheme();
    });
}