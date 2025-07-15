import { EMOJI_ICONS, SKILL_CLASSES } from '../config.js';

export function createSkillEditBox(skill, skillId, index, totalSkills) {
    const box = document.createElement('div');
    box.className = 'skill-edit-box skill-edit-box--collapsed';
    box.dataset.skillId = skillId;

    const classOptions = SKILL_CLASSES.map(c => `<option value="${c}" ${skill.class === c ? 'selected' : ''}>${c}</option>`).join('');
    const selectedIcon = EMOJI_ICONS.find(icon => icon.emoji === skill.icon);

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
            <div class="form-group">
                <label>Icon:</label>
                <div class="searchable-dropdown" data-skill-id="${skillId}">
                    <div class="searchable-dropdown__search-container">
                        <input type="text" class="searchable-dropdown__search" placeholder="Search icons..." data-icon="${skill.icon}" value="${selectedIcon ? selectedIcon.name : ''}">
                        <span class="searchable-dropdown__icon-preview">${skill.icon}</span>
                    </div>
                    <div class="searchable-dropdown__list-container">
                        <ul class="searchable-dropdown__list">
                           ${EMOJI_ICONS.map(icon => `
                                <li data-value="${icon.emoji}" data-name="${icon.name}" class="${skill.icon === icon.emoji ? 'selected' : ''}">
                                    <span class="searchable-dropdown__name">${icon.name}</span>
                                    <span class="searchable-dropdown__emoji">${icon.emoji}</span>
                                </li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
            <div class="form-group"><label>Class:</label><select class="edit-class">${classOptions}</select></div>
            <div class="form-group"><label>Notes:</label><textarea class="edit-notes">${skill.notes || ''}</textarea></div>
        </div>
    `;
    return box;
}