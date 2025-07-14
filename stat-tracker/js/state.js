import { ICON_LIBRARY, SKILL_CLASSES } from './config.js';

export let characterData = {};

export function getDefaultData() {
    const defaultSkills = {
        'skill1': { displayName: 'Project', icon: ICON_LIBRARY.find(i => i.name === 'Checklist').url, hours: 0, notes: '', class: 'Work' },
        'skill2': { displayName: 'Learning', icon: ICON_LIBRARY.find(i => i.name === 'Book').url, hours: 0, notes: '', class: 'Education' },
        'skill3': { displayName: 'Exercise', icon: ICON_LIBRARY.find(i => i.name === 'Running').url, hours: 0, notes: '', class: 'Health' },
    };
    return {
        characterName: 'Adventurer',
        totalHoursGoal: 1000,
        theme: 'light',
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
        if (!parsedData.skillOrder) parsedData.skillOrder = Object.keys(parsedData.skills);
        if (!parsedData.totalHoursGoal) parsedData.totalHoursGoal = 1000;
        if (!parsedData.theme) parsedData.theme = 'light';
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

export function updateSkillHours(skillId, hoursToAdd) {
    if (characterData.skills[skillId] && hoursToAdd > 0) {
        characterData.skills[skillId].hours += hoursToAdd;
        characterData.hourLogs.push({ date: new Date().toISOString(), skillId: skillId, hours: hoursToAdd });
        saveData();
    }
}

export function addSkill() {
    const newId = `skill${Date.now()}`;
    characterData.skills[newId] = { displayName: 'New Skill', icon: ICON_LIBRARY.find(i => i.name === 'Plus').url, hours: 0, notes: '', class: SKILL_CLASSES[0] };
    characterData.skillOrder.push(newId);
    saveData();
}

export function deleteSkill(skillId) {
    if (characterData.skills[skillId]) {
        delete characterData.skills[skillId];
        characterData.skillOrder = characterData.skillOrder.filter(id => id !== skillId);
        saveData();
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
}

export function saveAllSkillEdits(edits) {
    characterData.characterName = edits.characterName;
    edits.skills.forEach(skillEdit => {
        const { id, displayName, icon, skillClass, notes } = skillEdit;
        if (characterData.skills[id]) {
            characterData.skills[id].displayName = displayName;
            characterData.skills[id].icon = icon;
            characterData.skills[id].class = skillClass;
            characterData.skills[id].notes = notes;
        }
    });
    saveData();
}

export function setHardMode(isHardMode) {
    characterData.totalHoursGoal = isHardMode ? 10000 : 1000;
    saveData();
}

export function setTheme(theme) {
    characterData.theme = theme;
    saveData();
}

export function loadFromFile(data) {
    Object.assign(characterData, data);
    saveData();
}