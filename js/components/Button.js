export function createButton({ id, text, classes = [], dataAttributes = {} }) {
    const button = document.createElement('button');
    if (id) button.id = id;
    button.textContent = text;
    button.classList.add('nav-button', ...classes);

    for (const key in dataAttributes) {
        button.dataset[key] = dataAttributes[key];
    }

    return button;
}

export function createFilterButton({ text, view, isActive = false }) {
    const button = document.createElement('button');
    button.textContent = text;
    button.classList.add('stat-filter-btn');
    if (isActive) {
        button.classList.add('stat-filter-btn--active');
    }
    button.dataset.view = view;

    return button;
}