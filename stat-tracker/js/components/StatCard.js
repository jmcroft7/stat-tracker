export function createStatCard(cardData) {
    const { id, isOverall = false, title, icon, level, rank, class: skillClass, subText } = cardData;

    const cardTypeClass = isOverall ? 'total-level-card' : 'stat';
    const subValueContent = isOverall
        ? `<span class="overall-label-badge">${subText}</span>`
        : `<div class="skill-class-badge">${skillClass}</div>`;
    const rankText = isOverall ? '' : `<div class="stat__rank">${rank}</div>`;
    const tooltipType = isOverall ? 'progress-overall' : 'progress';

    // For the main card, the level value tooltip should show total hours.
    const levelTooltipType = isOverall ? 'hours' : 'hours';
    const iconContent = isOverall ? `<img src="${icon}" class="stat__icon-img" alt="Star Icon">` : `<span class="stat__icon">${icon}</span>`;

    // The '?' span has been removed, and the tooltip trigger is now on the stat__name
    return `
        <div id="${id}" class="${cardTypeClass}" data-skill-id="${id}">
            <div class="stat__header">
                ${iconContent}
                <span class="stat__name" ${!isOverall ? `data-tooltip-type="notes"` : ''}>${title}</span>
            </div>
            <div class="stat__level-container">
                <div class="stat__level-value" data-tooltip-type="${levelTooltipType}">${level}</div>
                ${rankText}
            </div>
            <div class="stat__sub-value">${subValueContent}</div>
            <div class="stat__progress-bar" data-tooltip-type="${tooltipType}">
                <div class="stat__progress"></div>
            </div>
        </div>
    `;
}