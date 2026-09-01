// Main Application Logic with Job Listings and Pagination

import { loadJobs, displayJobs, setupFilters } from './services/jobService.js'
import { showNotification } from './services/notificationService.js'

// Pagination settings
const JOBS_PER_PAGE = 7
let currentPage = 1
let allJobs = []
let filteredJobs = []

// Initialize application
async function init() {
  try {
    showLoadingSpinner(true)
    
    // Load jobs from API
    allJobs = await loadJobs()
    filteredJobs = [...allJobs]
    
    if (allJobs.length === 0) {
      showNotification('Nie udało się załadować ofert pracy', 'warning')
    } else {
      showNotification(`Załadowano ${allJobs.length} ofert pracy!`, 'success')
    }
    
    // Update stats
    updateStats()
    
    // Render initial page
    renderCurrentPage()
    
    // Setup event listeners
    setupEventListeners()
    
  } catch (error) {
    console.error('Błąd podczas inicjalizacji:', error)
    showNotification('Błąd podczas ładowania aplikacji', 'error')
  } finally {
    showLoadingSpinner(false)
  }
}

// Setup event listeners
function setupEventListeners() {
  // Search functionality
  document.getElementById('searchBtn').addEventListener('click', performSearch)
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch()
  })
  
  // Filters
  document.getElementById('categoryFilter').addEventListener('change', applyFilters)
  document.getElementById('typeFilter').addEventListener('change', applyFilters)
  document.getElementById('locationFilter').addEventListener('change', applyFilters)
  document.getElementById('clearFilters').addEventListener('click', clearAllFilters)
  
  // Pagination
  document.getElementById('prevBtn').addEventListener('click', previousPage)
  document.getElementById('nextBtn').addEventListener('click', nextPage)
}

// Perform search
function performSearch() {
  const query = document.getElementById('searchInput').value.toLowerCase()
  currentPage = 1
  
  if (!query) {
    filteredJobs = [...allJobs]
  } else {
    filteredJobs = allJobs.filter(job => 
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query) ||
      (job.description && job.description.toLowerCase().includes(query))
    )
  }
  
  if (filteredJobs.length === 0) {
    showNotification('Nie znaleziono ofert spełniających kryteria', 'info')
  } else {
    showNotification(`Znaleziono ${filteredJobs.length} ofert`, 'success')
  }
  
  renderCurrentPage()
}

// Apply all filters
function applyFilters() {
  const category = document.getElementById('categoryFilter').value
  const type = document.getElementById('typeFilter').value
  const location = document.getElementById('locationFilter').value.toLowerCase()
  
  currentPage = 1
  filteredJobs = allJobs.filter(job => {
    const matchCategory = !category || (job.category && job.category.includes(category))
    const matchType = !type || job.type === type
    const matchLocation = !location || job.location.toLowerCase().includes(location)
    return matchCategory && matchType && matchLocation
  })
  
  renderCurrentPage()
}

// Clear all filters
function clearAllFilters() {
  document.getElementById('searchInput').value = ''
  document.getElementById('categoryFilter').value = ''
  document.getElementById('typeFilter').value = ''
  document.getElementById('locationFilter').value = ''
  currentPage = 1
  filteredJobs = [...allJobs]
  renderCurrentPage()
  showNotification('Filtry wyczyszczone', 'info')
}

// Render current page
function renderCurrentPage() {
  const startIdx = (currentPage - 1) * JOBS_PER_PAGE
  const endIdx = startIdx + JOBS_PER_PAGE
  const pageJobs = filteredJobs.slice(startIdx, endIdx)
  
  displayJobs(pageJobs, '#jobsList')
  updatePagination()
  updateJobsCount()
}

// Update pagination controls
function updatePagination() {
  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE)
  
  // Update page numbers display
  const pageNumbersDiv = document.getElementById('pageNumbers')
  pageNumbersDiv.innerHTML = ''
  
  const maxPagesToShow = 5
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)
  
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1)
  }
  
  // First page button
  if (startPage > 1) {
    pageNumbersDiv.appendChild(createPageButton(1, '1'))
    if (startPage > 2) {
      const dots = document.createElement('span')
      dots.className = 'page-dots'
      dots.textContent = '...'
      pageNumbersDiv.appendChild(dots)
    }
  }
  
  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    pageNumbersDiv.appendChild(createPageButton(i, i.toString()))
  }
  
  // Last page button
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement('span')
      dots.className = 'page-dots'
      dots.textContent = '...'
      pageNumbersDiv.appendChild(dots)
    }
    pageNumbersDiv.appendChild(createPageButton(totalPages, totalPages.toString()))
  }
  
  // Update buttons
  document.getElementById('prevBtn').disabled = currentPage === 1
  document.getElementById('nextBtn').disabled = currentPage === totalPages
  
  // Update page info
  document.getElementById('currentPage').textContent = currentPage
  document.getElementById('totalPages').textContent = totalPages
}

// Create page button
function createPageButton(pageNum, text) {
  const button = document.createElement('button')
  button.className = `page-number ${pageNum === currentPage ? 'active' : ''}`
  button.textContent = text
  button.addEventListener('click', () => goToPage(pageNum))
  return button
}

// Go to specific page
function goToPage(pageNum) {
  currentPage = pageNum
  renderCurrentPage()
  // Scroll to jobs section
  document.getElementById('jobs').scrollIntoView({ behavior: 'smooth' })
}

// Previous page
function previousPage() {
  if (currentPage > 1) {
    currentPage--
    renderCurrentPage()
    document.getElementById('jobs').scrollIntoView({ behavior: 'smooth' })
  }
}

// Next page
function nextPage() {
  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE)
  if (currentPage < totalPages) {
    currentPage++
    renderCurrentPage()
    document.getElementById('jobs').scrollIntoView({ behavior: 'smooth' })
  }
}

// Update jobs count display
function updateJobsCount() {
  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE)
  const startIdx = (currentPage - 1) * JOBS_PER_PAGE + 1
  const endIdx = Math.min(currentPage * JOBS_PER_PAGE, filteredJobs.length)
  
  document.getElementById('jobsCount').textContent = 
    `Wyświetlanie ${startIdx}-${endIdx} z ${filteredJobs.length} ofert`
}

// Update statistics
function updateStats() {
  const uniqueCompanies = new Set(allJobs.map(job => job.company)).size
  
  document.getElementById('totalJobsStat').textContent = allJobs.length
  document.getElementById('totalCompaniesStat').textContent = uniqueCompanies
}

// Show/hide loading spinner
function showLoadingSpinner(show) {
  document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none'
}

// Start the application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
