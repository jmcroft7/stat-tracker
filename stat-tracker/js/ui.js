import { MAX_LEVEL, SKILL_CLASSES, ACHIEVEMENTS } from './config.js';
import { elements } from './elements.js';
import { characterData } from './state.js';
import { createStatCard } from './components/StatCard.js';
import { createSkillEditBox } from './components/SkillEditBox.js';
import { createButton, createFilterButton } from './components/Button.js';

let skillChart = null;
let toastTimeout;

// --- Helper Functions ---

function getHoursForLevel(level, goal) {
    if (level <= 1) return 0;
    if (level > MAX_LEVEL) level = MAX_LEVEL;
    return goal * Math.pow(Math.log(level) / Math.log(MAX_LEVEL), 3);
}

export const hoursCache1k = Array.from({ length: MAX_LEVEL + 1 }, (_, i) => getHoursForLevel(i, 1000));
export const hoursCache10k = Array.from({ length: MAX_LEVEL + 1 }, (_, i) => getHoursForLevel(i, 10000));

export function getLevelFromHours(hours, goal) {
    const cache = goal === 1000 ? hoursCache1k : hoursCache10k;
    if (hours >= cache[MAX_LEVEL]) return MAX_LEVEL;
    for (let level = 1; level < MAX_LEVEL; level++) {
        if (hours >= cache[level] && hours < cache[level + 1]) return level;
    }
    return 1;
}

export function getRankFromHours(hours) {
    const goal = characterData.totalHoursGoal;
    const thresholds = { 'Master': goal * 0.75, 'Expert': goal * 0.25, 'Adept': goal * 0.05 };
    if (hours >= thresholds.Master) return 'Master';
    if (hours >= thresholds.Expert) return 'Expert';
    if (hours >= thresholds.Adept) return 'Adept';
    return 'Beginner';
}

// --- UI Building Functions ---

function hideToast() {
    elements.toastNotification.classList.remove('show');
}

export function showToast(message, type = 'success') {
    const { toastNotification, toastMessage, toastCloseBtn } = elements;

    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }

    toastMessage.textContent = message;
    toastNotification.className = 'show';
    if (type === 'danger') {
        toastNotification.classList.add('danger');
    }

    toastTimeout = setTimeout(hideToast, 4000);

    toastCloseBtn.onclick = () => {
        clearTimeout(toastTimeout);
        hideToast();
    };
}

export function applyTheme() {
    document.getElementById('theme-stylesheet').setAttribute('href', `css/themes/${characterData.theme}.css`);

    setTimeout(() => {
        if (skillChart) {
            buildChart();
        }
    }, 100);
}

function renderFilterButtons(container, filters, activeView) {
    container.innerHTML = '';
    filters.forEach(filter => {
        container.appendChild(createFilterButton({
            ...filter,
            isActive: filter.view === activeView
        }));
    });
}

function renderActionButtons() {
    const addHoursContainer = document.getElementById('add-hours-btn-container');
    if(addHoursContainer) {
        addHoursContainer.innerHTML = '';
        addHoursContainer.appendChild(createButton({ id: 'add-hours-btn', text: 'Add' }));
    }

    const editActionsContainer = document.getElementById('edit-page-actions-container');
    if(editActionsContainer) {
        editActionsContainer.innerHTML = '';
        editActionsContainer.appendChild(createButton({ id: 'add-skill-btn', text: 'Add New Skill' }));
        editActionsContainer.appendChild(createButton({ id: 'save-edits-btn', text: 'Save All Changes' }));
    }

    const fileControlsContainer = document.getElementById('file-controls-container');
    if(fileControlsContainer) {
        fileControlsContainer.innerHTML = '';
        fileControlsContainer.appendChild(createButton({ id: 'save-to-file-btn', text: 'Save to File' }));
        fileControlsContainer.appendChild(createButton({ id: 'load-from-file-btn', text: 'Load from File' }));
    }
}


export function buildChart() {
    if (skillChart) {
        skillChart.destroy();
    }

    renderFilterButtons(elements.graphPageFilters, [
        { text: 'Skill', view: 'skill' },
        { text: 'Class', view: 'class' },
    ], characterData.activeGraphView);


    const style = getComputedStyle(document.body);
    const gridColor = style.getPropertyValue('--border-color');
    const labelColor = style.getPropertyValue('--text-primary');
    const accentColor = style.getPropertyValue('--accent-color');


    const ctx = elements.skillChartCanvas.getContext('2d');

    let labels = [];
    let data = [];
    const goal = characterData.totalHoursGoal;

    if (characterData.activeGraphView === 'class') {
        const classHours = {};
        SKILL_CLASSES.forEach(c => classHours[c] = 0);

        for (const skillId in characterData.skills) {
            const skill = characterData.skills[skillId];
            if (skill.class && classHours.hasOwnProperty(skill.class)) {
                classHours[skill.class] += skill.hours;
            }
        }

        labels = Object.keys(classHours);
        data = Object.values(classHours).map(hours => getLevelFromHours(hours, goal));

    } else {
        labels = characterData.skillOrder.map(id => characterData.skills[id].displayName);
        data = characterData.skillOrder.map(id => getLevelFromHours(characterData.skills[id].hours, goal));
    }


    let maxLevel = Math.max(...data);
    if (maxLevel <= 1) {
        maxLevel = 10;
    }

    skillChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Skill Levels',
                data: data,
                backgroundColor: `${accentColor}66`,
                borderColor: accentColor,
                borderWidth: 2,
                pointBackgroundColor: accentColor,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: accentColor
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    angleLines: { color: gridColor },
                    grid: { color: gridColor },
                    pointLabels: { color: labelColor, font: { size: 14 } },
                    ticks: { color: labelColor, backdropColor: 'transparent', stepSize: Math.ceil(maxLevel / 5) },
                    suggestedMin: 0,
                    suggestedMax: maxLevel
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function buildTitleDropdown() {
    const select = elements.titleSelect;
    select.innerHTML = '<option value="none">None</option>';
    
    characterData.unlockedAchievements.forEach(id => {
        const achievement = ACHIEVEMENTS[id];
        if (achievement) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `${achievement.icon} ${achievement.name}`;
            select.appendChild(option);
        }
    });

    select.value = characterData.equippedTitle || 'none';
}

export function buildUI() {
    elements.statGrid.innerHTML = '';
    elements.skillSelect.innerHTML = '';
    elements.editSkillsContainer.innerHTML = '';
    elements.characterNameHeader.textContent = `${characterData.characterName}'s Stats`;
    elements.charNameInput.value = characterData.characterName;
    elements.hardModeToggle.checked = characterData.totalHoursGoal === 10000;
    elements.themeSelect.value = characterData.theme;

    renderFilterButtons(elements.statsPageFilters, [
        { text: 'Overall', view: 'overall' },
        { text: 'Total', view: 'total' },
    ], characterData.activeStatView);

    renderActionButtons();
    buildTitleDropdown();

    const mainCardTitle = characterData.activeStatView === 'total' ? 'Total' : 'Overall';
    const mainCardSubText = characterData.activeStatView === 'total' ? 'Total Level' : 'Overall Level';
    const mainCardHTML = createStatCard({
        id: 'overall-card',
        isOverall: true,
        title: mainCardTitle,
        icon: 'https://img.icons8.com/ios-filled/50/ffffff/star.png',
        level: 0,
        subText: mainCardSubText
    });
    elements.statGrid.insertAdjacentHTML('beforeend', mainCardHTML);

    const skillsWithLevels = characterData.skillOrder.map(skillId => {
        const skill = characterData.skills[skillId];
        return {
            id: skillId,
            level: getLevelFromHours(skill.hours, characterData.totalHoursGoal),
            ...skill
        };
    });

    skillsWithLevels.sort((a, b) => b.level - a.level);

    skillsWithLevels.forEach(skill => {
        const statCardHTML = createStatCard({
            id: skill.id,
            title: skill.displayName,
            icon: skill.icon,
            level: 0,
            rank: 'Beginner',
            class: skill.class
        });
        elements.statGrid.insertAdjacentHTML('beforeend', statCardHTML);
    });


    characterData.skillOrder.forEach((skillId, index) => {
        const skill = characterData.skills[skillId];
        if (!skill) return;

        elements.skillSelect.innerHTML += `<option value="${skillId}">${skill.displayName} ${skill.icon}</option>`;

        const skillEditBox = createSkillEditBox(skill, skillId, index, characterData.skillOrder.length);
        elements.editSkillsContainer.appendChild(skillEditBox);
    });

    updateAllStatsDisplay();
}

export function updateAllStatsDisplay() {
    let totalLevelSum = 0;
    let totalHours = 0;
    const goal = characterData.totalHoursGoal;
    const numberOfSkills = characterData.skillOrder.length;
    const currentView = characterData.activeStatView;

    characterData.skillOrder.forEach(skillId => {
        const skill = characterData.skills[skillId];
        if (!skill) return;
        const level = getLevelFromHours(skill.hours, goal);
        totalLevelSum += level;
        totalHours += skill.hours;

        const statElement = document.getElementById(skillId);
        if (statElement) {
            statElement.querySelector('.stat__level-value').textContent = level;

            const rankElement = statElement.querySelector('.stat__rank');
            if (currentView === 'total') {
                rankElement.textContent = `(+${Math.round(skill.hours)})`;
            } else {
                rankElement.textContent = `(${getRankFromHours(skill.hours)})`;
            }

            const classBadge = statElement.querySelector('.skill-class-badge');
            classBadge.textContent = skill.class;
            classBadge.className = `skill-class-badge ${skill.class?.toLowerCase()}`;
            const progress = (level / MAX_LEVEL) * 100;
            statElement.querySelector('.stat__progress').style.width = `${progress}%`;
        }
    });

    const mainCard = document.getElementById('overall-card');
    if (mainCard) {
        const levelValueEl = mainCard.querySelector('.stat__level-value');
        const subValueEl = mainCard.querySelector('.overall-label-badge');

        levelValueEl.dataset.tooltipText = `${Math.round(totalHours)} Total Hours`;

        if (characterData.equippedTitle && ACHIEVEMENTS[characterData.equippedTitle]) {
            subValueEl.textContent = `${ACHIEVEMENTS[characterData.equippedTitle].icon} ${ACHIEVEMENTS[characterData.equippedTitle].name}`;
        } else {
            subValueEl.textContent = currentView === 'total' ? 'Total Level' : 'Overall Level';
        }


        if (currentView === 'total') {
            levelValueEl.textContent = Math.floor(totalLevelSum);
            mainCard.querySelector('.stat__progress').style.width = '100%';
            mainCard.querySelector('.stat__progress-bar').dataset.tooltipText = `${Math.round(totalHours)} Total Hours`;
            mainCard.querySelector('.stat__name').textContent = 'Total';

        } else {
            const averageLevel = numberOfSkills > 0 ? totalLevelSum / numberOfSkills : 0;
            const overallLevel = Math.floor(averageLevel);
            const nextOverallLevel = overallLevel + 1;
            const requiredForNext = nextOverallLevel * numberOfSkills;
            const levelsNeeded = requiredForNext - totalLevelSum;
            const progressPercentage = ((averageLevel - overallLevel) * 100);

            levelValueEl.textContent = overallLevel;
            mainCard.querySelector('.stat__progress').style.width = `${progressPercentage}%`;
            mainCard.querySelector('.stat__progress-bar').dataset.tooltipText = `${levelsNeeded.toFixed(0)} more total levels for Lvl ${nextOverallLevel}`;
            mainCard.querySelector('.stat__name').textContent = 'Overall';
        }
    }

    if (skillChart && elements.skillChartCanvas.offsetParent !== null) {
        buildChart();
    }
}

export function navigateTo(pageKey) {
    Object.values(elements.pages).forEach(p => p.classList.add('hidden'));

    if (elements.pages[pageKey]) {
        elements.pages[pageKey].classList.remove('hidden');
    }

    document.querySelectorAll('.nav__button').forEach(b => b.classList.remove('nav__button--active'));

    const isDropdownItem = ['about', 'settings', 'achievements'].includes(pageKey);

    if (isDropdownItem) {
        elements.moreBtn.classList.add('nav__button--active');
    } else if (elements.nav[pageKey]) {
        elements.nav[pageKey].classList.add('nav__button--active');
    }
}

function buildDetailedLogView() {
    elements.detailedLogContainer.innerHTML = '';

    const logs = characterData.hourLogs;

    if (logs.length === 0) {
        elements.detailedLogContainer.innerHTML += `<p>No hours have been logged yet.</p>`;
        return;
    }

    const logList = document.createElement('div');
    logList.className = 'detailed-log-list';

    for (let i = logs.length - 1; i >= 0; i--) {
        const log = logs[i];
        const skill = characterData.skills[log.skillId];
        const skillName = skill ? skill.displayName : 'Deleted Skill';
        const skillIcon = skill ? skill.icon : '❓';
        const logDate = new Date(log.date);
        const dateString = logDate.toLocaleDateString();
        const timeString = logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const logItemHTML = `
            <div class="detailed-log-item">
                <div class="log-item__info">
                    <span class="log-item__icon">${skillIcon}</span>
                    <div class="log-item__details">
                        <span class="log-item__skill-name">${skillName}</span>
                        <span class="log-item__date">${dateString} at ${timeString}</span>
                    </div>
                </div>
                <div class="log-item__actions">
                    <span class="log-item__hours">${log.hours.toFixed(1)} hrs</span>
                    <button class="log-item__delete-btn" data-log-index="${i}" title="Delete Entry">&times;</button>
                </div>
            </div>
        `;
        logList.innerHTML += logItemHTML;
    }

    elements.detailedLogContainer.appendChild(logList);
}

export function buildLogPage() {
    renderFilterButtons(elements.logPageFilters, [
        { text: 'Add Hours', view: 'add' },
        { text: 'View Log', view: 'view' },
    ], characterData.activeLogView);

    const view = characterData.activeLogView;
    if (view === 'view') {
        elements.addHoursContainer.classList.add('hidden');
        elements.detailedLogContainer.classList.remove('hidden');
        buildDetailedLogView();
    } else {
        elements.addHoursContainer.classList.remove('hidden');
        elements.detailedLogContainer.classList.add('hidden');
        updateSkillTotalHoursDisplay(elements.skillSelect.value);
    }
}

function renderSummary(logs, headerText, timePeriod) {
    elements.recentActivityContainer.innerHTML = '';

    const header = document.createElement('h3');
    header.className = 'activity-date-header';
    header.textContent = headerText;
    elements.recentActivityContainer.appendChild(header);

    if (logs.length === 0) {
        elements.recentActivityContainer.innerHTML += `<p>No hours logged this ${timePeriod}.</p>`;
        return;
    }

    const viewType = characterData.activeRecentSubView;
    const summaryList = document.createElement('div');
    summaryList.className = 'summary-list';

    if (viewType === 'class') {
        const summary = logs.reduce((acc, log) => {
            const skill = characterData.skills[log.skillId];
            if (skill && skill.class) {
                if (!acc[skill.class]) { acc[skill.class] = 0; }
                acc[skill.class] += log.hours;
            }
            return acc;
        }, {});
        const sortedSummary = Object.entries(summary).sort((a, b) => b[1] - a[1]);
        sortedSummary.forEach(([className, hours]) => {
            summaryList.innerHTML += `<div class="summary-item"><span class="summary-skill-name">${className}</span><span class="summary-hours">${hours.toFixed(1)} hrs</span></div>`;
        });

    } else {
        const summary = logs.reduce((acc, log) => {
            if (!acc[log.skillId]) { acc[log.skillId] = 0; }
            acc[log.skillId] += log.hours;
            return acc;
        }, {});
        const sortedSummary = Object.entries(summary).map(([skillId, hours]) => ({ skillId, hours })).sort((a, b) => b.hours - a.hours);
        sortedSummary.forEach(item => {
            const skill = characterData.skills[item.skillId];
            if (skill) {
                summaryList.innerHTML += `<div class="summary-item"><span class="summary-icon">${skill.icon}</span><span class="summary-skill-name">${skill.displayName}</span><span class="summary-hours">${item.hours.toFixed(1)} hrs</span></div>`;
            }
        });
    }
    elements.recentActivityContainer.appendChild(summaryList);
}

export function buildWeeklySummaryView() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - dayOfWeek);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const weeklyLogs = characterData.hourLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= startDate && logDate <= endDate;
    });

    const header = `Week of ${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    renderSummary(weeklyLogs, header, 'week');
}

export function buildMonthlySummaryView() {
    const now = new Date();
    const monthlyLogs = characterData.hourLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
    });
    const header = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    renderSummary(monthlyLogs, header, 'month');
}

export function buildRecentActivityPage() {
    renderFilterButtons(elements.recentPageFilters, [
        { text: 'Weekly', view: 'weekly' },
        { text: 'Monthly', view: 'monthly' },
    ], characterData.activeRecentView);


    elements.recentViewToggle.checked = characterData.activeRecentSubView === 'class';

    const selectedView = characterData.activeRecentView;
    if (selectedView === 'monthly') {
        buildMonthlySummaryView();
    } else {
        buildWeeklySummaryView();
    }
}

export function buildAchievementsPage() {
    const container = elements.achievementsContainer;
    container.innerHTML = '';
    const achievementList = document.createElement('div');
    achievementList.className = 'achievements-list';

    for (const id in ACHIEVEMENTS) {
        const achievement = ACHIEVEMENTS[id];
        const isUnlocked = characterData.unlockedAchievements.includes(id);

        const item = document.createElement('div');
        item.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
        
        item.innerHTML = `
            <div class="achievement-status-icon">${isUnlocked ? '✓' : '?'}</div>
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-details">
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
            </div>
        `;
        achievementList.appendChild(item);
    }
    container.appendChild(achievementList);
}

export function updateSkillTotalHoursDisplay(skillId) {
    if (skillId && characterData.skills[skillId]) {
        const hours = characterData.skills[skillId].hours.toFixed(1);
        elements.skillTotalHours.textContent = `Current: ${hours} hours`;
    } else {
        elements.skillTotalHours.textContent = '';
    }
}