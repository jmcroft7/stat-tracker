export const MAX_LEVEL = 99;

export const SKILL_CLASSES = [
    '💼 Work',
    '🏡 Home life',
    '💰 Finance',
    '❤️ Health',
    '🎨 Hobbies',
    '🤝 Relationships',
    '🌱 Personal Growth',
    '🎓 Education',
];

export const EMOJI_ICONS = [
    { emoji: '💻', name: 'Laptop' },
    { emoji: '📈', name: 'Chart Increasing' },
    { emoji: '🛠️', name: 'Hammer and Wrench' },
    { emoji: '⚖️', name: 'Scales' },
    { emoji: '💡', name: 'Light Bulb' },
    { emoji: '🧪', name: 'Test Tube' },
    { emoji: '🎨', name: 'Artist Palette' },
    { emoji: '🎵', name: 'Musical Note' },
    { emoji: '✍️', name: 'Writing Hand' },
    { emoji: '🏃‍♂️', name: 'Man Running' },
    { emoji: '🧘', name: 'Yoga' },
    { emoji: '❤️', name: 'Heart' },
    { emoji: '🧠', name: 'Brain' },
    { emoji: '🗣️', name: 'Speaking Head' },
    { emoji: '📖', name: 'Open Book' },
    { emoji: '🎥', name: 'Movie Camera' },
    { emoji: '🎮', name: 'Video Game' },
    { emoji: '🏆', name: 'Trophy' },
    { emoji: '🥇', name: 'First Place Medal' },
    { emoji: '💪', name: 'Flexed Biceps' },
    { emoji: '🤝', name: 'Handshake' },
    { emoji: '💬', name: 'Speech Balloon' },
    { emoji: '🎉', name: 'Party Popper' },
    { emoji: '🌟', name: 'Glowing Star' },
    { emoji: '🔥', name: 'Fire' },
    { emoji: '🚀', name: 'Rocket' },
    { emoji: '🎯', name: 'Target' },
    { emoji: '💰', name: 'Money Bag' },
    { emoji: '🏠', name: 'House' }
].sort((a, b) => a.name.localeCompare(b.name));

// Helper function to calculate level from hours, needed for achievement conditions
function getLevelFromHours(hours, goal) {
    if (hours <= 0) return 1;
    if (hours >= goal) return MAX_LEVEL;
    const level = Math.floor(MAX_LEVEL * Math.pow(hours / goal, 1/3)) + 1;
    return Math.min(level > MAX_LEVEL ? MAX_LEVEL : level, MAX_LEVEL);
}

export const ACHIEVEMENTS = {
    'novice': {
        name: 'Novice Adventurer',
        description: 'Log your first 10 hours.',
        icon: '🌱',
        condition: (data) => data.totalHours >= 10
    },
    'apprentice': {
        name: 'Apprentice',
        description: 'Reach a total of 100 hours.',
        icon: '🛠️',
        condition: (data) => data.totalHours >= 100
    },
    'journeyman': {
        name: 'Journeyman',
        description: 'Reach a total of 500 hours.',
        icon: '⭐',
        condition: (data) => data.totalHours >= 500
    },
    'expert': {
        name: 'Expert',
        description: 'Reach a total of 1000 hours.',
        icon: '🌟',
        condition: (data) => data.totalHours >= 1000
    },
    'legend': {
        name: 'Legend',
        description: 'Reach a total of 10,000 hours.',
        icon: '👑',
        condition: (data) => data.totalHours >= 10000
    },
    'focused': {
        name: 'Focused',
        description: 'Reach Level 25 in any skill.',
        icon: '🎯',
        condition: (data) => Object.values(data.skills).some(skill => getLevelFromHours(skill.hours, data.totalHoursGoal) >= 25)
    },
    'specialist': {
        name: 'Specialist',
        description: 'Reach Level 50 in any skill.',
        icon: '🏆',
        condition: (data) => Object.values(data.skills).some(skill => getLevelFromHours(skill.hours, data.totalHoursGoal) >= 50)
    },
    'master': {
        name: 'Master of a Craft',
        description: 'Reach Level 99 in any skill.',
        icon: '🥇',
        condition: (data) => Object.values(data.skills).some(skill => getLevelFromHours(skill.hours, data.totalHoursGoal) >= 99)
    },
    'polymath': {
        name: 'Polymath',
        description: 'Have at least 5 skills.',
        icon: '🧠',
        condition: (data) => data.skillOrder.length >= 5
    }
};