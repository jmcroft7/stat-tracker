import { ICON_LIBRARY } from './config.js';

export let characterData = {};

export function getDefaultData() {
    const defaultSkills = {
        'skill1': { displayName: 'Project', icon: ICON_LIBRARY.find(i => i.name === 'Checklist').url, hours: 0, notes: '' },
        'skill2': { displayName: 'Learning', icon: ICON_LIBRARY.find(i => i.name === 'Book').url, hours: 0, notes: '' },
        'skill3': { displayName: 'Exercise', icon: ICON_LIBRARY.find(i => i.name === 'Running').url, hours: 0, notes: '' },
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
        }
        characterData = parsedData;
    } else {
        characterData = getDefaultData();
    }
}