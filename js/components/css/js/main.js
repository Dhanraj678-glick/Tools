// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const loadComponent = async (componentPath, targetElementId, retries = 3) => {
        try {
            const response = await fetch(componentPath);
            if (!response.ok) {
                throw new Error(`Error loading ${componentPath}: ${response.status} ${response.statusText}`);
            }
            const html = await response.text();
            const targetElement = document.getElementById(targetElementId);
            if (targetElement) {
                targetElement.innerHTML = html;
                // Special handling after header load for dynamic categories if on index page
                if (targetElementId === 'header-placeholder' && typeof tools !== 'undefined' && document.getElementById('tools-grid-container')) {
                    populateCategoriesDropdown();
                }
            } else {
                console.warn(`Target element #${targetElementId} not found for ${componentPath}.`);
            }
        } catch (error) {
            console.error(error);
            if (retries > 0) {
                console.log(`Retrying ${componentPath}, ${retries -1} attempts left.`);
                setTimeout(() => loadComponent(componentPath, targetElementId, retries - 1), 1000);
            } else {
                const targetElement = document.getElementById(targetElementId);
                if (targetElement) targetElement.innerHTML = `<p class="text-danger">Failed to load ${componentPath.split('/').pop()}. Please try refreshing.</p>`;
            }
        }
    };

    // Load header and footer
    // Adjust paths if your main.js is in a different location relative to components/
    // Assuming main.js is in js/ and components/ is at the root
    const basePath = (location.pathname.includes('/tools/')) ? '../../' : '';

    if (document.getElementById('header-placeholder')) {
        loadComponent(`${basePath}components/header.html`, 'header-placeholder');
    }
    if (document.getElementById('footer-placeholder')) {
        loadComponent(`${basePath}components/footer.html`, 'footer-placeholder');
    }

    // --- Logic specific to index.html ---
    const toolsGridContainer = document.getElementById('tools-grid-container');
    const searchBar = document.getElementById('search-bar'); // Search bar in index.html

    if (toolsGridContainer && typeof tools !== 'undefined') { // Check if 'tools' is defined
        displayTools(tools); // Display all tools initially
        if (searchBar) {
            initializeSearch();
        }
    } else if (toolsGridContainer && typeof tools === 'undefined') {
        console.error("tools-data.js might not be loaded or 'tools' array is not defined.");
        toolsGridContainer.innerHTML = "<p class='text-danger'>Error: Tool data not found. Please check console.</p>";
    }
});

function populateCategoriesDropdown() {
    const categoriesDropdown = document.getElementById('dynamic-categories-dropdown');
    if (!categoriesDropdown || typeof tools === 'undefined') return;

    const categoryNames = [...new Set(tools.map(tool => tool.category))];
    categoriesDropdown.innerHTML = ''; // Clear existing (if any hardcoded)

    categoryNames.forEach(categoryName => {
        // Create an anchor ID friendly version of category name
        const categoryAnchorId = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and') + '-anchor';
        const listItem = document.createElement('li');
        listItem.innerHTML = `<a class="dropdown-item" href="#${categoryAnchorId}">${categoryName}</a>`;
        categoriesDropdown.appendChild(listItem);
    });
     // Add standard links back if needed
    categoriesDropdown.innerHTML += `<li><hr class="dropdown-divider"></li>`;
    categoriesDropdown.innerHTML += `<li><a class="dropdown-item" href="#all-tools-anchor">All Tools</a></li>`;
}


function displayTools(toolArray) {
    const toolsGridContainer = document.getElementById('tools-grid-container');
    if (!toolsGridContainer) return;

    toolsGridContainer.innerHTML = ''; // Clear existing tools

    const categories = {};
    toolArray.forEach(tool => {
        if (!categories[tool.category]) {
            categories[tool.category] = [];
        }
        categories[tool.category].push(tool);
    });

    let toolCount = 0;
    for (const categoryName in categories) {
        const categoryAnchorId = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and') + '-anchor';
        const categorySection = document.createElement('section');
        categorySection.className = 'mb-5 category-section';
        categorySection.id = categoryAnchorId; // Add ID for direct linking from nav
        categorySection.innerHTML = `<h2 class="mt-4">${categoryName}</h2>`;

        const row = document.createElement('div');
        row.className = 'row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4'; // Bootstrap grid, added xl

        categories[categoryName].forEach(tool => {
            const col = document.createElement('div');
            col.className = 'col';
            const toolCard = `
                <div class="card h-100">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${tool.name}</h5>
                        <p class="card-text small flex-grow-1">${tool.description}</p>
                        <a href="${(location.pathname.includes('/tools/')) ? '../../' : ''}${tool.path}" class="btn btn-sm btn-primary mt-auto">Go to Tool</a>
                    </div>
                    <!-- <div class="card-footer text-muted small">
                        Keywords: ${tool.keywords.join(', ')}
                    </div> -->
                </div>
            `;
            col.innerHTML = toolCard;
            row.appendChild(col);
            toolCount++;

            // Example: Insert an ad card every N tools within a category
            if (toolCount % 6 === 0) { // Insert ad every 6 tools
                const adCol = document.createElement('div');
                adCol.className = 'col';
                adCol.innerHTML = `
                    <div class="card h-100 ad-placeholder-index-grid">
                        <div class="card-body align-items-center d-flex justify-content-center">
                            Grid Ad Space
                        </div>
                    </div>
                `;
                row.appendChild(adCol);
            }
        });
        categorySection.appendChild(row);
        toolsGridContainer.appendChild(categorySection);
    }
    if (toolCount === 0 && toolsGridContainer.innerHTML === ''){
        toolsGridContainer.innerHTML = '<p class="mt-3">No tools found matching your criteria.</p>';
    }
    // Add an "All Tools" anchor for the dropdown link
    if (!document.getElementById('all-tools-anchor')) {
        const allToolsAnchor = document.createElement('div');
        allToolsAnchor.id = 'all-tools-anchor';
        toolsGridContainer.prepend(allToolsAnchor); // Add at the beginning of the grid
    }
}

function initializeSearch() {
    const searchBar = document.getElementById('search-bar');
    if (!searchBar || typeof tools === 'undefined') {
        console.warn("Search bar or tools data not found for search initialization.");
        return;
    }

    searchBar.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        if (searchTerm.length === 0) {
            displayTools(tools); // Show all tools if search is empty
            return;
        }
        if (searchTerm.length < 2 && searchTerm.length > 0) return; // Optional: min search term length

        const filteredTools = tools.filter(tool =>
            tool.name.toLowerCase().includes(searchTerm) ||
            tool.description.toLowerCase().includes(searchTerm) ||
            (tool.keywords && tool.keywords.some(kw => kw.toLowerCase().includes(searchTerm)))
        );
        displayTools(filteredTools);
    });
}
