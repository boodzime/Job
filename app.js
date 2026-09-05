// Main Application Logic with Job Listings and Pagination

import { loadJobs, displayJobs } from './services/jobService.js'
import { loadServices, displayServices } from './services/servicesService.js'
import { showNotification } from './services/notificationService.js'

// Pagination settings
const JOBS_PER_PAGE = 7
const SERVICES_PER_PAGE = 10

let currentJobPage = 1
let currentServicePage = 1

let allJobs = []
let filteredJobs = []

let allServices = []
let filteredServices = []

// Initialize application
async function init() {
  try {
    showLoadingSpinner(true)
    
    // Load jobs
    allJobs = await loadJobs()
    filteredJobs = [...allJobs]
    
    if (allJobs.length === 0) {
      showNotification('Nie udało się załadować ofert pracy', 'warning')
    } else {
      showNotification(`Załadowano ${allJobs.length} ofert pracy!`, 'success')
    }
    
    // Load services
    allServices = await loadServices()
    filteredServices = [...allServices]
    showNotification(`Załadowano ${allServices.length} usług i zleceń!`, 'success')
    
    // Render initial pages
    renderJobsPage()
    renderServicesPage()
    
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
  // Search for jobs
  document.getElementById('searchBtn').addEventListener('click', performJobSearch)
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) performJobSearch()
  })
  
  // Job filters
  document.getElementById('categoryFilter').addEventListener('change', applyJobFilters)
  document.getElementById('typeFilter').addEventListener('change', applyJobFilters)
  document.getElementById('locationFilter').addEventListener('change', applyJobFilters)
  document.getElementById('clearFilters').addEventListener('click', clearAllJobFilters)
  
  // Jobs pagination
  document.getElementById('prevBtn').addEventListener('click', previousJobPage)
  document.getElementById('nextBtn').addEventListener('click', nextJobPage)
  
  // Services filters
  document.getElementById('serviceTypeFilter').addEventListener('change', applyServiceFilters)
  document.getElementById('serviceLocationFilter').addEventListener('change', applyServiceFilters)
  document.getElementById('priceSortFilter').addEventListener('change', applyServiceFilters)
  document.getElementById('clearServicesFilters').addEventListener('click', clearAllServiceFilters)
  
  // Services pagination
  document.getElementById('servicesPrevBtn').addEventListener('click', previousServicePage)
  document.getElementById('servicesNextBtn').addEventListener('click', nextServicePage)
}

// ============== JOBS LOGIC ==============

async function performJobSearch() {
  const query = document.getElementById('searchInput').value.trim()
  const location = document.getElementById('locationFilter').value.trim() || 'Polska'
  currentJobPage = 1
  showLoadingSpinner(true)

  try {
    allJobs = await loadJobs(query || 'praca', location)
    filteredJobs = allJobs.filter(job => {
      const normalizedQuery = query.toLowerCase()
      return !normalizedQuery ||
        job.title.toLowerCase().includes(normalizedQuery) ||
        job.company.toLowerCase().includes(normalizedQuery) ||
        job.location.toLowerCase().includes(normalizedQuery) ||
        (job.description && job.description.toLowerCase().includes(normalizedQuery))
    })
  renderJobsPage()

    showNotification(filteredJobs.length ? `Znaleziono ${filteredJobs.length} ofert` : 'Nie znaleziono ofert spełniających kryteria', filteredJobs.length ? 'success' : 'info')
  } finally {
    showLoadingSpinner(false)
  }
}

function applyJobFilters() {
  const category = document.getElementById('categoryFilter').value
  const type = document.getElementById('typeFilter').value
  const location = document.getElementById('locationFilter').value.toLowerCase()
  
  currentJobPage = 1
  filteredJobs = allJobs.filter(job => {
    const matchCategory = !category || (job.category && job.category.includes(category))
    const matchType = !type || job.type === type
    const matchLocation = !location || job.location.toLowerCase().includes(location)
    return matchCategory && matchType && matchLocation
  })
  
  renderJobsPage()
  updateStats()
}

function clearAllJobFilters() {
  document.getElementById('searchInput').value = ''
  document.getElementById('categoryFilter').value = ''
  document.getElementById('typeFilter').value = ''
  document.getElementById('locationFilter').value = ''
  currentJobPage = 1
  filteredJobs = [...allJobs]
  renderJobsPage()
  showNotification('Filtry wyczyszczone', 'info')
}

function renderJobsPage() {
  const startIdx = (currentJobPage - 1) * JOBS_PER_PAGE
  const endIdx = startIdx + JOBS_PER_PAGE
  const pageJobs = filteredJobs.slice(startIdx, endIdx)
  
  displayJobs(pageJobs, '#jobsList')
  updateJobPagination()
}

function updateJobPagination() {
  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE)
  
  const pageNumbersDiv = document.getElementById('pageNumbers')
  pageNumbersDiv.innerHTML = ''
  
  const maxPagesToShow = 5
  let startPage = Math.max(1, currentJobPage - Math.floor(maxPagesToShow / 2))
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)
  
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1)
  }
  
  if (startPage > 1) {
    pageNumbersDiv.appendChild(createPageButton(1, '1', 'job'))
    if (startPage > 2) {
      const dots = document.createElement('span')
      dots.className = 'page-dots'
      dots.textContent = '...'
      pageNumbersDiv.appendChild(dots)
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbersDiv.appendChild(createPageButton(i, i.toString(), 'job'))
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement('span')
      dots.className = 'page-dots'
      dots.textContent = '...'
      pageNumbersDiv.appendChild(dots)
    }
    pageNumbersDiv.appendChild(createPageButton(totalPages, totalPages.toString(), 'job'))
  }
  
  document.getElementById('prevBtn').disabled = currentJobPage === 1
  document.getElementById('nextBtn').disabled = currentJobPage === totalPages
  
  document.getElementById('currentPage').textContent = currentJobPage
  document.getElementById('totalPages').textContent = totalPages
}

function createPageButton(pageNum, text, type = 'job') {
  const button = document.createElement('button')
  button.className = `page-number ${pageNum === (type === 'job' ? currentJobPage : currentServicePage) ? 'active' : ''}`
  button.textContent = text
  button.addEventListener('click', () => type === 'job' ? goToJobPage(pageNum) : goToServicePage(pageNum))
  return button
}

function goToJobPage(pageNum) {
  currentJobPage = pageNum
  renderJobsPage()
  document.getElementById('jobs').scrollIntoView({ behavior: 'smooth' })
}

function previousJobPage() {
  if (currentJobPage > 1) {
    currentJobPage--
    renderJobsPage()
    document.getElementById('jobs').scrollIntoView({ behavior: 'smooth' })
  }
}

function nextJobPage() {
  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE)
  if (currentJobPage < totalPages) {
    currentJobPage++
    renderJobsPage()
    document.getElementById('jobs').scrollIntoView({ behavior: 'smooth' })
  }
}

// ============== SERVICES LOGIC ==============

function applyServiceFilters() {
  const type = document.getElementById('serviceTypeFilter').value
  const location = document.getElementById('serviceLocationFilter').value.toLowerCase()
  const sort = document.getElementById('priceSortFilter').value
  
  currentServicePage = 1
  filteredServices = allServices.filter(service => {
    const matchType = !type || service.type === type
    const matchLocation = !location || service.location.toLowerCase().includes(location)
    return matchType && matchLocation
  })
  
  // Apply sorting
  if (sort === 'price-asc') {
    filteredServices.sort((a, b) => {
      const priceA = parseInt(a.price) || 0
      const priceB = parseInt(b.price) || 0
      return priceA - priceB
    })
  } else if (sort === 'price-desc') {
    filteredServices.sort((a, b) => {
      const priceA = parseInt(a.price) || 0
      const priceB = parseInt(b.price) || 0
      return priceB - priceA
    })
  } else if (sort === 'rating') {
    filteredServices.sort((a, b) => b.rating - a.rating)
  }
  
  renderServicesPage()
}

function clearAllServiceFilters() {
  document.getElementById('serviceTypeFilter').value = ''
  document.getElementById('serviceLocationFilter').value = ''
  document.getElementById('priceSortFilter').value = 'latest'
  currentServicePage = 1
  filteredServices = [...allServices]
  renderServicesPage()
  showNotification('Filtry usług wyczyszczone', 'info')
}

function renderServicesPage() {
  const startIdx = (currentServicePage - 1) * SERVICES_PER_PAGE
  const endIdx = startIdx + SERVICES_PER_PAGE
  const pageServices = filteredServices.slice(startIdx, endIdx)
  
  displayServices(pageServices, '#servicesList')
  updateServicePagination()
}

function updateServicePagination() {
  const totalPages = Math.ceil(filteredServices.length / SERVICES_PER_PAGE)
  
  const pageNumbersDiv = document.getElementById('servicesPageNumbers')
  pageNumbersDiv.innerHTML = ''
  
  const maxPagesToShow = 5
  let startPage = Math.max(1, currentServicePage - Math.floor(maxPagesToShow / 2))
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)
  
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1)
  }
  
  if (startPage > 1) {
    pageNumbersDiv.appendChild(createPageButton(1, '1', 'service'))
    if (startPage > 2) {
      const dots = document.createElement('span')
      dots.className = 'page-dots'
      dots.textContent = '...'
      pageNumbersDiv.appendChild(dots)
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbersDiv.appendChild(createPageButton(i, i.toString(), 'service'))
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement('span')
      dots.className = 'page-dots'
      dots.textContent = '...'
      pageNumbersDiv.appendChild(dots)
    }
    pageNumbersDiv.appendChild(createPageButton(totalPages, totalPages.toString(), 'service'))
  }
  
  document.getElementById('servicesPrevBtn').disabled = currentServicePage === 1
  document.getElementById('servicesNextBtn').disabled = currentServicePage === totalPages
  
  document.getElementById('servicesCurrentPage').textContent = currentServicePage
  document.getElementById('servicesTotal').textContent = totalPages
}

function goToServicePage(pageNum) {
  currentServicePage = pageNum
  renderServicesPage()
  document.getElementById('services').scrollIntoView({ behavior: 'smooth' })
}

function previousServicePage() {
  if (currentServicePage > 1) {
    currentServicePage--
    renderServicesPage()
    document.getElementById('services').scrollIntoView({ behavior: 'smooth' })
  }
}

function nextServicePage() {
  const totalPages = Math.ceil(filteredServices.length / SERVICES_PER_PAGE)
  if (currentServicePage < totalPages) {
    currentServicePage++
    renderServicesPage()
    document.getElementById('services').scrollIntoView({ behavior: 'smooth' })
  }
}

// ============== COMMON ==============

function showLoadingSpinner(show) {
  document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none'
  document.getElementById('loadingServicesSpinner').style.display = show ? 'flex' : 'none'
}

// Start the application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
