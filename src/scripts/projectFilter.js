// Project filtering, searching, sorting, and pagination

const PROJECTS_PER_PAGE = 5;
let currentPage = 1;
let filteredProjects = [];
let allProjects = [];

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initializeProjects();
  setupEventListeners();

  // Apply initial sort (newest first by default)
  const sortSelect = document.getElementById('sortProjects');
  if (sortSelect) {
    handleSort(sortSelect.value);
  } else {
    displayProjects();
  }
});

function initializeProjects() {
  const projectElements = document.querySelectorAll('.project-item');
  allProjects = Array.from(projectElements);
  filteredProjects = [...allProjects];
}

function setupEventListeners() {
  // Search
  const searchInput = document.getElementById('projectSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      handleSearch(e.target.value);
    });
  }

  // Sort
  const sortSelect = document.getElementById('sortProjects');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      handleSort(e.target.value);
    });
  }

  // Filter toggle
  const filterToggle = document.getElementById('filterToggle');
  const filterPanel = document.getElementById('techFilterPanel');
  if (filterToggle && filterPanel) {
    filterToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      filterPanel.classList.toggle('hidden');
    });

    // Close filter panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!filterPanel.classList.contains('hidden')) {
        const techFilter = document.querySelector('.tech-filter');
        if (techFilter && !techFilter.contains(e.target)) {
          filterPanel.classList.add('hidden');
        }
      }
    });

    // Prevent clicks inside the panel from closing it
    filterPanel.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Tech filter checkboxes
  const techCheckboxes = document.querySelectorAll('.tech-checkbox');
  techCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', handleFilter);
  });

  // Clear filters
  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      techCheckboxes.forEach(cb => cb.checked = false);
      handleFilter();
    });
  }
}

function handleSearch(query) {
  applyAllFilters();
}

function handleFilter() {
  applyAllFilters();
}

function applyAllFilters() {
  console.log('⚠️ applyAllFilters() called');
  const searchInput = document.getElementById('projectSearch');
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const activeFilters = getActiveFilters();

  // Start with all projects
  let results = [...allProjects];

  // Apply search filter
  if (searchTerm) {
    results = results.filter(project => {
      const title = project.querySelector('.project-wrapper__text-title')?.textContent.toLowerCase() || '';
      const description = project.querySelector('.mb-4')?.textContent.toLowerCase() || '';
      const tags = project.dataset.tags || '';

      return title.includes(searchTerm) ||
             description.includes(searchTerm) ||
             tags.includes(searchTerm);
    });
  }

  // Apply tech filters (AND logic - project must have ALL selected tags)
  if (activeFilters.length > 0) {
    results = results.filter(project => {
      const tags = project.dataset.tags?.split(',') || [];
      return activeFilters.every(filter => tags.includes(filter));
    });
  }

  filteredProjects = results;
  currentPage = 1;

  // Re-apply the current sort after filtering
  const sortSelect = document.getElementById('sortProjects');
  if (sortSelect && sortSelect.value) {
    console.log(`Re-applying sort: ${sortSelect.value}`);
    applySortOnly(sortSelect.value);
  }

  displayProjects();
}

function getActiveFilters() {
  const checkboxes = document.querySelectorAll('.tech-checkbox:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}


function applySortOnly(sortType) {
  filteredProjects.sort((a, b) => {
    if (sortType === 'newest' || sortType === 'oldest') {
      const dateA = new Date(a.dataset.timestamp);
      const dateB = new Date(b.dataset.timestamp);
      return sortType === 'newest' ? dateB - dateA : dateA - dateB;
    } else if (sortType === 'scale-desc' || sortType === 'scale-asc') {
      // Use hours for precise scale sorting
      const hoursA = parseInt(a.dataset.hours) || 0;
      const hoursB = parseInt(b.dataset.hours) || 0;

      return sortType === 'scale-desc' ? hoursB - hoursA : hoursA - hoursB;
    }
    return 0;
  });
}

function handleSort(sortType) {
  console.log(`🔄 handleSort(${sortType}) called`);

  applySortOnly(sortType);

  // Always go back to page 1 when sorting changes
  currentPage = 1;

  // Debug: Log final sorted order
  if (sortType === 'scale-desc') {
    console.log('\n=== FINAL SORTED ORDER ===');
    filteredProjects.forEach((project, index) => {
      const title = project.querySelector('.project-wrapper__text-title')?.textContent.trim().substring(0, 40);
      const hours = project.dataset.hours;
      console.log(`${index + 1}. ${title} - ${hours}h`);
    });
    console.log('========================\n');
  }

  displayProjects();
}

function displayProjects() {
  const container = document.getElementById('projectsContainer');
  if (!container) return;

  // Hide all projects first
  allProjects.forEach(project => {
    project.style.display = 'none';
  });

  // Calculate pagination
  const startIndex = (currentPage - 1) * PROJECTS_PER_PAGE;
  const endIndex = startIndex + PROJECTS_PER_PAGE;
  const projectsToShow = filteredProjects.slice(startIndex, endIndex);

  // Debug: Log what we're displaying
  console.log(`\n=== DISPLAYING PAGE ${currentPage} ===`);
  console.log(`Showing projects ${startIndex} to ${endIndex - 1}`);
  projectsToShow.forEach((project, index) => {
    const title = project.querySelector('.project-wrapper__text-title')?.textContent.trim().substring(0, 40);
    console.log(`  ${startIndex + index + 1}. ${title}`);
  });
  console.log('========================\n');

  // REORDER DOM: Append projects to container in the correct order
  projectsToShow.forEach(project => {
    container.appendChild(project);
    project.style.display = 'flex';

    // Remove load-hidden class to prevent animation delays
    const hiddenElements = project.querySelectorAll('.load-hidden');
    hiddenElements.forEach(el => {
      el.classList.remove('load-hidden');
      el.style.visibility = 'visible';
      el.style.opacity = '1';
    });
  });

  // Update pagination
  updatePagination();
}

function updatePagination() {
  const totalPages = Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE);
  const paginationContainer = document.getElementById('pagination');
  const pageInfo = document.getElementById('pageInfo');

  if (!paginationContainer) return;

  // Update page info
  if (pageInfo) {
    const startItem = (currentPage - 1) * PROJECTS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * PROJECTS_PER_PAGE, filteredProjects.length);
    pageInfo.textContent = `Showing ${startItem}-${endItem} of ${filteredProjects.length} projects`;
  }

  // Clear pagination
  paginationContainer.innerHTML = '';

  if (totalPages <= 1) return;

  // Previous button
  const prevBtn = createPageButton('‹', currentPage > 1, () => {
    if (currentPage > 1) {
      currentPage--;
      displayProjects();
      scrollToProjects();
    }
  });
  paginationContainer.appendChild(prevBtn);

  // Page numbers
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  // First page
  if (startPage > 1) {
    paginationContainer.appendChild(createPageButton('1', true, () => goToPage(1)));
    if (startPage > 2) {
      const dots = document.createElement('span');
      dots.className = 'pagination-dots';
      dots.textContent = '...';
      paginationContainer.appendChild(dots);
    }
  }

  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    const btn = createPageButton(i.toString(), true, () => goToPage(i));
    if (i === currentPage) {
      btn.classList.add('active');
    }
    paginationContainer.appendChild(btn);
  }

  // Last page
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement('span');
      dots.className = 'pagination-dots';
      dots.textContent = '...';
      paginationContainer.appendChild(dots);
    }
    paginationContainer.appendChild(createPageButton(totalPages.toString(), true, () => goToPage(totalPages)));
  }

  // Next button
  const nextBtn = createPageButton('›', currentPage < totalPages, () => {
    if (currentPage < totalPages) {
      currentPage++;
      displayProjects();
      scrollToProjects();
    }
  });
  paginationContainer.appendChild(nextBtn);
}

function createPageButton(text, enabled, onClick) {
  const button = document.createElement('button');
  button.className = 'page-btn';
  button.textContent = text;
  button.disabled = !enabled;

  if (enabled) {
    button.addEventListener('click', onClick);
  }

  return button;
}

function goToPage(page) {
  currentPage = page;
  displayProjects();
  scrollToProjects();
}

function scrollToProjects() {
  const projectsSection = document.getElementById('projects');
  if (projectsSection) {
    projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export { initializeProjects, displayProjects };
