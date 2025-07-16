import { EMOJI_ICONS, SKILL_CLASSES } from './config.js';

export let characterData = {};

function dispatchHoursUpdate() {
    window.dispatchEvent(new CustomEvent('hours-updated'));
}

function dispatchStructureUpdate() {
    window.dispatchEvent(new CustomEvent('structure-updated'));
}

function dispatchViewChange() {
    window.dispatchEvent(new CustomEvent('view-changed'));
}

function dispatchRecentViewChange() {
    window.dispatchEvent(new CustomEvent('recent-view-changed'));
}

function dispatchLogUpdate() {
    window.dispatchEvent(new CustomEvent('log-updated'));
}

function dispatchGraphViewChange() {
    window.dispatchEvent(new CustomEvent('graph-view-changed'));
}

export function getDefaultData() {
    const defaultSkills = {
        'skill1': { displayName: 'Project', icon: EMOJI_ICONS[0].emoji, hours: 0, notes: '', class: '💼 Work' },
        'skill2': { displayName: 'Learning', icon: EMOJI_ICONS[14].emoji, hours: 0, notes: '', class: '🎓 Education' },
        'skill3': { displayName: 'Exercise', icon: EMOJI_ICONS[17].emoji, hours: 0, notes: '', class: '❤️ Health' },
    };
    return {
        characterName: 'Adventurer',
        totalHoursGoal: 1000,
        theme: 'light',
        activeStatView: 'overall',
        activeRecentView: 'weekly',
        activeRecentSubView: 'skill',
        activeGraphView: 'skill',
        activeLogView: 'add', // 'add' or 'view'
        skillOrder: ['skill1', 'skill2', 'skill3'],
        skills: defaultSkills,
        hourLogs: []
    };
}

export function saveData() {
    localStorage.setItem('rpgSkillTracker_final_v5', JSON.stringify(characterData));
}

export function loadData() {
    const savedData = localStorage.getItem('rpgSkillTracker_final_v5');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.skills) {
            for (const skillId in parsedData.skills) {
                if (parsedData.skills[skillId].icon && parsedData.skills[skillId].icon.includes('https://')) {
                    parsedData.skills[skillId].icon = '💻';
                }
            }
        }
        
        if (!parsedData.skillOrder) parsedData.skillOrder = Object.keys(parsedData.skills);
        if (!parsedData.totalHoursGoal) parsedData.totalHoursGoal = 1000;
        if (!parsedData.theme) parsedData.theme = 'light';
        if (!parsedData.activeStatView) parsedData.activeStatView = 'overall';
        if (!parsedData.activeRecentView) parsedData.activeRecentView = 'weekly';
        if (!parsedData.activeRecentSubView) parsedData.activeRecentSubView = 'skill';
        if (!parsedData.activeGraphView) parsedData.activeGraphView = 'skill';
        if (!parsedData.activeLogView) parsedData.activeLogView = 'add';
        if (!parsedData.hourLogs) parsedData.hourLogs = [];
        for (const skillId in parsedData.skills) {
            if (parsedData.skills[skillId].notes === undefined) {
                parsedData.skills[skillId].notes = '';
            }
            if (parsedData.skills[skillId].class === undefined || !SKILL_CLASSES.includes(parsedData.skills[skillId].class)) {
                parsedData.skills[skillId].class = SKILL_CLASSES[0];
            }
        }
        characterData = parsedData;
    } else {
        characterData = getDefaultData();
    }
}

// --- State Modification Functions ---

export function setActiveStatView(view) {
    if (['overall', 'total', 'recent'].includes(view)) {
        characterData.activeStatView = view;
        saveData();
        dispatchViewChange();
    }
}

export function setActiveRecentView(view) {
    if (['weekly', 'monthly'].includes(view)) {
        characterData.activeRecentView = view;
        saveData();
        dispatchRecentViewChange();
    }
}

export function setActiveLogView(view) {
    if (['add', 'view'].includes(view)) {
        characterData.activeLogView = view;
        saveData();
        dispatchLogUpdate();
    }
}

export function setActiveRecentSubView(view) {
    if (['skill', 'class'].includes(view)) {
        characterData.activeRecentSubView = view;
        saveData();
        dispatchRecentViewChange();
    }
}

export function setActiveGraphView(view) {
    if (['skill', 'class', 'recent'].includes(view)) {
        characterData.activeGraphView = view;
        saveData();
        dispatchGraphViewChange();
    }
}

export function updateCharacterName(newName) {
    characterData.characterName = newName || 'Adventurer';
    saveData();
    dispatchStructureUpdate();
}

export function updateSkillHours(skillId, hoursToAdd) {
    if (characterData.skills[skillId] && hoursToAdd > 0) {
        characterData.skills[skillId].hours += hoursToAdd;
        characterData.hourLogs.push({ date: new Date().toISOString(), skillId: skillId, hours: hoursToAdd });
        saveData();
        dispatchHoursUpdate();
    }
}

export function addSkill() {
    const newId = `skill${Date.now()}`;
    characterData.skills[newId] = { displayName: 'New Skill', icon: EMOJI_ICONS[0].emoji, hours: 0, notes: '', class: SKILL_CLASSES[0] };
    characterData.skillOrder.push(newId);
    saveData();
    dispatchStructureUpdate();
}

export function deleteSkill(skillId) {
    if (characterData.skills[skillId]) {
        delete characterData.skills[skillId];
        characterData.skillOrder = characterData.skillOrder.filter(id => id !== skillId);
        saveData();
        dispatchStructureUpdate();
    }
}

export function deleteHourLog(logIndex) {
    if (logIndex >= 0 && logIndex < characterData.hourLogs.length) {
        const logToDelete = characterData.hourLogs[logIndex];
        const skillId = logToDelete.skillId;
        const hoursToDelete = logToDelete.hours;

        if (characterData.skills[skillId]) {
            characterData.skills[skillId].hours -= hoursToDelete;
        }

        characterData.hourLogs.splice(logIndex, 1);
        saveData();
        dispatchHoursUpdate();
        dispatchLogUpdate(); // Rebuild the log page
    }
}

export function reorderSkill(skillId, direction) {
    const index = characterData.skillOrder.indexOf(skillId);
    if (direction === 'up' && index > 0) {
        [characterData.skillOrder[index], characterData.skillOrder[index - 1]] = [characterData.skillOrder[index - 1], characterData.skillOrder[index]];
    } else if (direction === 'down' && index < characterData.skillOrder.length - 1) {
        [characterData.skillOrder[index], characterData.skillOrder[index + 1]] = [characterData.skillOrder[index + 1], characterData.skillOrder[index]];
    }
    saveData();
    dispatchStructureUpdate();
}

export function saveAllSkillEdits(edits) {
    edits.forEach(skillEdit => {
        const { id, displayName, icon, skillClass, notes } = skillEdit;
        if (characterData.skills[id]) {
            characterData.skills[id].displayName = displayName;
            characterData.skills[id].icon = icon;
            characterData.skills[id].class = skillClass;
            characterData.skills[id].notes = notes;
        }
    });
    saveData();
    dispatchStructureUpdate();
}

export function setHardMode(isHardMode) {
    characterData.totalHoursGoal = isHardMode ? 10000 : 1000;
    saveData();
    dispatchStructureUpdate();
}

export function setTheme(theme) {
    characterData.theme = theme;
    saveData();
}

export function loadFromFile(data) {
    Object.assign(characterData, data);
    saveData();
    dispatchStructureUpdate();
}