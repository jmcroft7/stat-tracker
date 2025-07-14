import { ICON_LIBRARY, SKILL_CLASSES } from '../config.js';

export function createSkillEditBox(skill, skillId, index, totalSkills) {
    const box = document.createElement('div');
    box.className = 'skill-edit-box skill-edit-box--collapsed';
    box.dataset.skillId = skillId;

    const iconOptions = ICON_LIBRARY.map(icon => `<option value="${icon.url}" ${skill.icon === icon.url ? 'selected' : ''}>${icon.name}</option>`).join('');
    const classOptions = SKILL_CLASSES.map(c => `<option value="${c}" ${skill.class === c ? 'selected' : ''}>${c}</option>`).join('');

    box.innerHTML = `
        <div class="skill-edit-box__header">
            <input type="text" class="skill-edit-box__display-name" value="${skill.displayName}">
            <div class="skill-edit-box__controls">
                <button class="skill-edit-box__control-btn skill-edit-box__control-btn--reorder" data-dir="up" title="Move Up" ${index === 0 ? 'disabled' : ''}>&uarr;</button>
                <button class="skill-edit-box__control-btn skill-edit-box__control-btn--reorder" data-dir="down" title="Move Down" ${index === totalSkills - 1 ? 'disabled' : ''}>&darr;</button>
                <button class="skill-edit-box__control-btn skill-edit-box__control-btn--minimize" title="Minimize/Expand">+</button>
                <button class="skill-edit-box__control-btn skill-edit-box__control-btn--delete" title="Delete Skill">&times;</button>
            </div>
        </div>
        <div class="skill-edit-box__content">
            <div class="form-group"><label>Icon:</label><div class="icon-select-wrapper"><select class="edit-icon-select">${iconOptions}</select><img src="${skill.icon}" class="icon-preview" alt="Icon preview"></div></div>
            <div class="form-group"><label>Class:</label><select class="edit-class">${classOptions}</select></div>
            <div class="form-group"><label>Notes:</label><textarea class="edit-notes">${skill.notes || ''}</textarea></div>
        </div>
    `;
    return box;
}