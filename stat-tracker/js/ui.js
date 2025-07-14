import { MAX_LEVEL } from './config.js';
import { elements } from './elements.js';
import { characterData } from './state.js';
import { createStatCard } from './components/StatCard.js';
import { createSkillEditBox } from './components/SkillEditBox.js';

let skillChart = null;

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

export function applyTheme() {
    document.body.classList.toggle('dark-mode', characterData.theme === 'dark');
    document.body.classList.toggle('light-mode', characterData.theme === 'light');
    if (skillChart) {
        buildChart();
    }
}

export function buildChart() {
    if (skillChart) {
        skillChart.destroy();
    }

    const ctx = elements.skillChartCanvas.getContext('2d');
    const isLightMode = characterData.theme === 'light';
    const gridColor = isLightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
    const labelColor = isLightMode ? '#333' : '#eee';

    const labels = characterData.skillOrder.map(id => characterData.skills[id].displayName);
    const data = characterData.skillOrder.map(id => getLevelFromHours(characterData.skills[id].hours, characterData.totalHoursGoal));

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
                backgroundColor: 'rgba(147, 112, 219, 0.4)',
                borderColor: 'rgba(147, 112, 219, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(147, 112, 219, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(147, 112, 219, 1)'
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

export function buildUI() {
    elements.statGrid.innerHTML = '';
    elements.skillSelect.innerHTML = '';
    elements.editSkillsContainer.innerHTML = '';
    elements.characterNameHeader.textContent = `${characterData.characterName}'s Stats`;
    elements.charNameInput.value = characterData.characterName;
    elements.hardModeToggle.checked = characterData.totalHoursGoal === 10000;
    elements.themeToggle.checked = characterData.theme === 'dark';

    // Update filter button active states
    document.querySelectorAll('#stats-page-filters .stat-filter-btn').forEach(btn => {
        btn.classList.toggle('stat-filter-btn--active', btn.dataset.view === characterData.activeStatView);
    });

    // Create the main card based on the active view
    const mainCardTitle = characterData.activeStatView === 'total' ? 'Total' : 'Overall';
    const mainCardSubText = characterData.activeStatView === 'total' ? 'Total Level' : 'Overall Level';
    const mainCardHTML = createStatCard({
        id: 'overall-card', // ID remains the same for simplicity
        isOverall: true,
        title: mainCardTitle,
        icon: 'https://img.icons8.com/ios-filled/50/ffffff/star.png',
        level: 0,
        subText: mainCardSubText
    });
    elements.statGrid.insertAdjacentHTML('beforeend', mainCardHTML);


    // Create Skill Cards and Edit Boxes
    characterData.skillOrder.forEach((skillId, index) => {
        const skill = characterData.skills[skillId];
        if (!skill) return;

        const statCardHTML = createStatCard({
            id: skillId,
            title: skill.displayName,
            icon: skill.icon,
            level: 0,
            rank: 'Beginner',
            class: skill.class
        });
        elements.statGrid.insertAdjacentHTML('beforeend', statCardHTML);


        elements.skillSelect.innerHTML += `<option value="${skillId}">${skill.displayName}</option>`;

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
        levelValueEl.dataset.tooltipText = `${Math.round(totalHours)} Total Hours`;

        if (currentView === 'total') {
            levelValueEl.textContent = Math.floor(totalLevelSum);
            mainCard.querySelector('.stat__progress').style.width = '100%';
            mainCard.querySelector('.stat__progress-bar').dataset.tooltipText = `${Math.round(totalHours)} Total Hours`;
            mainCard.querySelector('.stat__name').textContent = 'Total';
            mainCard.querySelector('.overall-label-badge').textContent = 'Total Level';

        } else { // 'overall' view
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
            mainCard.querySelector('.overall-label-badge').textContent = 'Overall Level';
        }
    }

    if (skillChart && elements.skillChartCanvas.offsetParent !== null) {
        buildChart();
    }
}

export function navigateTo(pageKey) {
    // Hide all pages
    Object.values(elements.pages).forEach(p => p.classList.add('hidden'));

    // Show the target page
    if (elements.pages[pageKey]) {
        elements.pages[pageKey].classList.remove('hidden');
    }

    // Update nav button active states
    document.querySelectorAll('.nav__button').forEach(b => b.classList.remove('nav__button--active'));

    const isDropdownItem = pageKey === 'about' || pageKey === 'settings';

    if (isDropdownItem) {
        elements.moreBtn.classList.add('nav__button--active');
    } else if (elements.nav[pageKey]) {
        elements.nav[pageKey].classList.add('nav__button--active');
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
    const summary = logs.reduce((acc, log) => {
        if (!acc[log.skillId]) { acc[log.skillId] = 0; }
        acc[log.skillId] += log.hours;
        return acc;
    }, {});
    const sortedSummary = Object.entries(summary).map(([skillId, hours]) => ({ skillId, hours })).sort((a, b) => b.hours - a.hours);
    const summaryList = document.createElement('div');
    summaryList.className = 'summary-list';
    sortedSummary.forEach(item => {
        const skill = characterData.skills[item.skillId];
        if (skill) {
            summaryList.innerHTML += `<div class="summary-item"><img src="${skill.icon}" alt="${skill.displayName} icon"><span class="summary-skill-name">${skill.displayName}</span><span class="summary-hours">${item.hours.toFixed(1)} hrs</span></div>`;
        }
    });
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

export function buildDailyLogView() {
    elements.recentActivityContainer.innerHTML = '';
    const now = new Date();
    const monthlyLogs = characterData.hourLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
    });
    if (monthlyLogs.length === 0) {
        elements.recentActivityContainer.innerHTML = '<p>No hours logged this month.</p>';
        return;
    }
    monthlyLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    const groupedLogs = monthlyLogs.reduce((acc, log) => {
        const dateStr = new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (!acc[dateStr]) { acc[dateStr] = []; }
        acc[dateStr].push(log);
        return acc;
    }, {});
    const activityList = document.createElement('div');
    activityList.className = 'recent-activity-list';
    for (const dateStr in groupedLogs) {
        const dayLogs = groupedLogs[dateStr];
        const dateHeader = document.createElement('h3');
        dateHeader.className = 'activity-date-header';
        dateHeader.textContent = dateStr;
        activityList.appendChild(dateHeader);
        const ul = document.createElement('ul');
        ul.className = 'activity-day-list';
        dayLogs.forEach(log => {
            const skillName = characterData.skills[log.skillId] ? characterData.skills[log.skillId].displayName : 'Unknown Skill';
            const li = document.createElement('li');
            li.innerHTML = `Logged <strong>${log.hours}</strong> hours for <strong>${skillName}</strong>.`;
            ul.appendChild(li);
        });
        activityList.appendChild(ul);
    }
    elements.recentActivityContainer.appendChild(activityList);
}

export function buildRecentActivityPage() {
    // Update button active states
    document.querySelectorAll('#recent-page-filters .stat-filter-btn').forEach(btn => {
        btn.classList.toggle('stat-filter-btn--active', btn.dataset.view === characterData.activeRecentView);
    });

    const selectedView = characterData.activeRecentView;
    if (selectedView === 'monthly') {
        buildMonthlySummaryView();
    } else if (selectedView === 'weekly') {
        buildWeeklySummaryView();
    } else {
        buildDailyLogView();
    }
}