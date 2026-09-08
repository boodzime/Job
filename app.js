// Main Application Logic with Job Listings and Pagination

import { loadJobs, displayJobs, getLastJobsTotal } from './services/jobService.js'
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
    }
    
    // Load services
    allServices = await loadServices()
    filteredServices = [...allServices]
    
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
  setupAuthPanel()

  // CV analysis and personalized Jooble search
  document.getElementById('cvForm').addEventListener('submit', analyzeCv)

  // Search for jobs
  document.getElementById('searchBtn').addEventListener('click', performJobSearch)
  document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) performJobSearch()
  })

  document.getElementById('advancedSearchToggle').addEventListener('click', () => {
    const toggle = document.getElementById('advancedSearchToggle')
    const panel = document.getElementById('advancedSearchPanel')
    const isOpen = toggle.getAttribute('aria-expanded') === 'true'
    toggle.setAttribute('aria-expanded', String(!isOpen))
    panel.hidden = isOpen
  })

  document.querySelectorAll('[data-auth]').forEach((button) => {
    button.addEventListener('click', () => openAuthPanel(button.dataset.auth))
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

// ============== CV MATCHING ==============

async function analyzeCv(event) {
  event.preventDefault()
  const url = document.getElementById('cvUrl').value.trim()
  const status = document.getElementById('cvStatus')
  const profileCard = document.getElementById('cvProfile')
  status.textContent = 'Analizuję CV i szukam dopasowanych ofert...'
  status.className = 'cv-status is-loading'
  try {
    const response = await fetch('/api/analyze-cv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Nie udało się przeanalizować CV')
    const profile = data.profile
    profileCard.hidden = false
    profileCard.innerHTML = `<strong>Profil dopasowania</strong><p>${profile.summary}</p><div class="cv-tags">${profile.skills.map(skill => `<span>${skill}</span>`).join('')}</div><small>Role: ${profile.targetRoles.join(', ')} · Lokalizacja: ${profile.location}</small>`
    const query = profile.targetRoles.slice(0, 3).join(' ')
    document.getElementById('searchInput').value = query
    document.getElementById('locationFilter').value = profile.location
    currentJobPage = 1
    allJobs = await loadJobs(query, profile.location, 1)
    filteredJobs = [...allJobs]
    renderJobsPage()
    status.textContent = `Gotowe. Wyświetlam oferty dla: ${query}.`
    status.className = 'cv-status is-success'
  } catch (error) {
    status.textContent = error.message
    status.className = 'cv-status is-error'
  }
}

// ============== JOBS LOGIC ==============

async function performJobSearch() {
  const query = document.getElementById('searchInput').value.trim()
  const location = document.getElementById('locationFilter').value.trim() || 'Polska'
  currentJobPage = 1
  showLoadingSpinner(true)

  try {
    allJobs = await loadJobs(query || 'praca', location)
    const normalizedQuery = query.toLocaleLowerCase('pl-PL')
    const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean)
    filteredJobs = allJobs.filter(job => {
      const searchableText = [job.title, job.company, job.location, job.description, job.category]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pl-PL')
      return queryTerms.every(term => searchableText.includes(term))
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
  const pageJobs = getLastJobsTotal() > filteredJobs.length ? filteredJobs : filteredJobs.slice(startIdx, endIdx)
  
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

// ============== AUTH PANEL ==============

let authMode = 'login'

function openAuthPanel(mode = 'login') {
  authMode = mode
  const panel = document.getElementById('authPanel')
  const title = document.getElementById('authTitle')
  const description = document.getElementById('authDescription')
  const password = document.getElementById('authPassword')
  const toggle = document.getElementById('authModeToggle')
  panel.hidden = false
  title.textContent = mode === 'register' ? 'Załóż konto w JobNexus' : 'Zaloguj się do JobNexus'
  description.textContent = mode === 'register' ? 'Utwórz konto jako użytkownik lub rekruter.' : 'Zarządzaj zapisanymi ofertami i swoim profilem.'
  password.autocomplete = mode === 'register' ? 'new-password' : 'current-password'
  toggle.textContent = mode === 'register' ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Załóż konto'
  document.getElementById('authStatus').textContent = ''
  document.getElementById('authEmail').focus()
}

function setupAuthPanel() {
  document.getElementById('authClose').addEventListener('click', () => {
    document.getElementById('authPanel').hidden = true
  })
  document.getElementById('authModeToggle').addEventListener('click', () => {
    openAuthPanel(authMode === 'login' ? 'register' : 'login')
  })
  document.getElementById('authForm').addEventListener('submit', (event) => {
    event.preventDefault()
    const email = document.getElementById('authEmail').value.trim()
    const role = document.getElementById('authRole').value
    const isRecruiter = role === 'recruiter'
    document.getElementById('authPanel').hidden = true
    document.getElementById('accountTitle').textContent = isRecruiter ? 'Panel rekrutera' : 'Panel użytkownika'
    document.getElementById('accountDescription').textContent = isRecruiter ? `Witaj, ${email}. Zarządzaj bazą CV, ofertami i procesem rekrutacji.` : `Witaj, ${email}. Zbuduj profesjonalne CV i znajdź lepszą pracę.`
    document.getElementById('accountDashboard').hidden = false
    renderDashboard(isRecruiter ? 'recruiter' : 'candidate', 'overview')
    document.getElementById('accountDashboard').scrollIntoView({ behavior: 'smooth', block: 'start' })
    history.replaceState(null, '', `#${isRecruiter ? 'recruiter-panel' : 'user-panel'}`)
  })
  document.querySelectorAll('[data-dashboard-tab]').forEach((tab) => tab.addEventListener('click', () => {
    const role = document.getElementById('accountTitle').textContent.includes('rekrutera') ? 'recruiter' : 'candidate'
    renderDashboard(role, tab.dataset.dashboardTab)
  }))
  document.getElementById('accountLogout').addEventListener('click', () => {
    document.getElementById('accountDashboard').hidden = true
    history.replaceState(null, '', window.location.pathname)
  })
}

// ============== ACCOUNT DASHBOARDS ==============

const cvDraft = JSON.parse(localStorage.getItem('jobnexus-cv') || '{}')
const candidateSkills = ['Komunikacja', 'Organizacja pracy', 'Excel', 'JavaScript', 'Sprzedaż', 'Język angielski']
const candidateProfiles = [
  { name: 'Anna Kowalska', role: 'Frontend Developer', location: 'Warszawa', score: 5, skills: 'JavaScript, React, TypeScript' },
  { name: 'Michał Nowak', role: 'Spawacz TIG/MIG', location: 'Wrocław', score: 4, skills: 'TIG, MIG, rysunek techniczny' },
  { name: 'Karolina Wiśniewska', role: 'Specjalistka ds. sprzedaży', location: 'Kraków', score: 5, skills: 'CRM, negocjacje, angielski' }
]

function renderDashboard(role, tab = 'overview') {
  document.querySelectorAll('[data-dashboard-tab]').forEach((button) => button.classList.toggle('is-active', button.dataset.dashboardTab === tab))
  const cards = document.getElementById('accountCards')
  cards.className = `account-cards ${role === 'recruiter' ? 'is-recruiter' : 'is-candidate'}`
  if (role === 'recruiter') renderRecruiterDashboard(cards, tab)
  else renderCandidateDashboard(cards, tab)
}

function renderCandidateDashboard(container, tab) {
  if (tab === 'cv') {
    container.innerHTML = `<article class="dashboard-card dashboard-card-wide"><div class="card-heading"><div><span class="eyebrow">Kreator CV</span><h3>Stwórz CV, które pracuje za Ciebie</h3></div><span class="cv-completion">${cvDraft.name ? '40% gotowe' : '0% gotowe'}</span></div><form id="cvBuilderForm" class="cv-builder-form"><div class="form-grid"><label>Imię i nazwisko<input name="name" required value="${cvDraft.name || ''}" placeholder="Jan Kowalski"></label><label>Stanowisko docelowe<input name="headline" value="${cvDraft.headline || ''}" placeholder="Np. Spawacz TIG / Frontend Developer"></label><label>E-mail<input type="email" name="email" value="${cvDraft.email || ''}" placeholder="jan@email.pl"></label><label>Lokalizacja<input name="location" value="${cvDraft.location || ''}" placeholder="Miasto lub praca zdalna"></label></div><label>Podsumowanie zawodowe<textarea name="summary" rows="4" placeholder="Napisz krótko o swoim doświadczeniu, mocnych stronach i celu zawodowym...">${cvDraft.summary || ''}</textarea></label><div class="cv-builder-section"><div class="card-heading"><h4>Umiejętności i poziom</h4><span class="helper-text">Oceń każdą umiejętność od 1 do 5</span></div><div class="skills-rating-list">${candidateSkills.map((skill, index) => `<div class="skill-rating"><span>${skill}</span><div class="rating-stars" role="radiogroup" aria-label="Poziom ${skill}">${[1,2,3,4,5].map((rating) => `<button type="button" class="skill-star ${(cvDraft.ratings?.[index] || 0) >= rating ? 'is-selected' : ''}" data-skill="${index}" data-rating="${rating}" aria-label="${rating} gwiazdek">★</button>`).join('')}</div></div>`).join('')}</div></div><div class="form-grid"><label>Doświadczenie zawodowe<textarea name="experience" rows="4" placeholder="Firma, stanowisko, zakres obowiązków, daty...">${cvDraft.experience || ''}</textarea></label><label>Wykształcenie i certyfikaty<textarea name="education" rows="4" placeholder="Szkoła, kierunek, certyfikaty, uprawnienia...">${cvDraft.education || ''}</textarea></label><label>Języki<textarea name="languages" rows="3" placeholder="Np. angielski B2, niemiecki A2">${cvDraft.languages || ''}</textarea></label><label>Linki do portfolio / LinkedIn<textarea name="links" rows="3" placeholder="https://linkedin.com/in/...">${cvDraft.links || ''}</textarea></label></div><div class="form-actions"><button class="search-btn" type="submit">Zapisz moje CV</button><button class="btn-secondary" type="button" data-cv-preview>Podgląd CV</button></div><p id="cvBuilderStatus" class="form-status" role="status"></p></form></article>`
    setupCvBuilder()
    return
  }
  if (tab === 'saved') {
    container.innerHTML = '<article class="dashboard-card dashboard-card-wide"><div class="card-heading"><div><span class="eyebrow">Twoje szanse</span><h3>Zapisane oferty pracy</h3></div><button class="btn-secondary" type="button" data-back-search>Przeglądaj oferty</button></div><div class="empty-state"><strong>Nie masz jeszcze zapisanych ofert</strong><p>Kliknij ikonę serca przy interesującej ofercie, aby wrócić do niej później.</p></div></article>'
    return
  }
  if (tab === 'settings') {
    container.innerHTML = '<article class="dashboard-card"><span class="eyebrow">Profil</span><h3>Widoczność CV</h3><p>Włącz widoczność, aby rekruterzy mogli znaleźć Twój profil.</p><label class="switch-row"><input type="checkbox" checked><span>CV dostępne w bazie rekrutera</span></label></article><article class="dashboard-card"><span class="eyebrow">Preferencje</span><h3>Alerty ofert</h3><p>Otrzymuj powiadomienia o nowych ofertach dopasowanych do Twoich umiejętności.</p><label class="switch-row"><input type="checkbox" checked><span>Włącz alerty e-mail</span></label></article>'
    return
  }
  container.innerHTML = '<article class="dashboard-card dashboard-highlight"><span class="eyebrow">Twój profil</span><h3>CV i dopasowanie ofert</h3><p>Uzupełnij kreator CV, oceń umiejętności i zwiększ widoczność dla rekruterów.</p><button class="search-btn" type="button" data-dashboard-tab="cv">Otwórz kreator CV</button></article><article class="dashboard-card"><span class="eyebrow">Aktywność</span><h3>Twoje zapisane oferty</h3><p>Oferty, które zapiszesz, będą dostępne w jednym miejscu.</p><button class="btn-secondary" type="button" data-dashboard-tab="saved">Zobacz zapisane</button></article><article class="dashboard-card"><span class="eyebrow">Wskazówka</span><h3>Uzupełnij profil w 5 minut</h3><ul class="dashboard-list"><li>Dodaj doświadczenie i certyfikaty</li><li>Oceń kluczowe umiejętności</li><li>Ustaw preferowaną lokalizację</li></ul></article>'
  container.querySelectorAll('[data-dashboard-tab]').forEach((button) => button.addEventListener('click', () => renderDashboard('candidate', button.dataset.dashboardTab)))
}

function renderRecruiterDashboard(container, tab) {
  if (tab === 'cv') {
    container.innerHTML = `<article class="dashboard-card dashboard-card-wide"><div class="card-heading"><div><span class="eyebrow">Baza CV</span><h3>Znajdź najlepszego kandydata</h3></div><span class="result-count">${candidateProfiles.length} profile</span></div><div class="candidate-search"><input id="candidateSearch" type="search" placeholder="Stanowisko, umiejętność, miasto..."><select id="candidateRating"><option value="0">Każda ocena</option><option value="5">5 gwiazdek</option><option value="4">4+ gwiazdki</option></select></div><div id="candidateList" class="candidate-list">${candidateProfiles.map(candidateCard).join('')}</div></article>`
    setupCandidateSearch()
    return
  }
  if (tab === 'settings') {
    container.innerHTML = '<article class="dashboard-card"><span class="eyebrow">Firma</span><h3>Profil pracodawcy</h3><label>Nazwa firmy<input placeholder="Nazwa Twojej firmy"></label><label>Branża<select><option>Technologie</option><option>Produkcja</option><option>Usługi</option><option>Handel</option></select></label><button class="search-btn" type="button">Zapisz profil firmy</button></article><article class="dashboard-card"><span class="eyebrow">Dostęp</span><h3>Uprawnienia zespołu</h3><p>Zarządzaj tym, kto może przeglądać bazę CV w Twojej organizacji.</p></article>'
    return
  }
  container.innerHTML = '<article class="dashboard-card dashboard-highlight"><span class="eyebrow">Baza CV</span><h3>Rekrutuj szybciej</h3><p>Przeszukuj profile kandydatów po stanowisku, lokalizacji, umiejętnościach i ocenie.</p><button class="search-btn" type="button" data-dashboard-tab="cv">Otwórz bazę CV</button></article><article class="dashboard-card"><span class="eyebrow">Oferty pracy</span><h3>Twoje ogłoszenia</h3><p>Dodaj ofertę, zarządzaj aktywnymi rekrutacjami i sprawdzaj zainteresowanie.</p><button class="btn-secondary" type="button">Dodaj ofertę</button></article><article class="dashboard-card"><span class="eyebrow">Statystyki</span><div class="metric-row"><strong>24</strong><span>wyświetlenia profilu firmy</span></div><div class="metric-row"><strong>8</strong><span>kandydatów dopasowanych</span></div></article>'
  container.querySelectorAll('[data-dashboard-tab]').forEach((button) => button.addEventListener('click', () => renderDashboard('recruiter', button.dataset.dashboardTab)))
}

function candidateCard(candidate) { return `<article class="candidate-card"><div><h4>${candidate.name}</h4><p>${candidate.role} · ${candidate.location}</p><span class="candidate-skills">${candidate.skills}</span></div><div class="candidate-actions"><span class="gold-rating">${'★'.repeat(candidate.score)}${'☆'.repeat(5 - candidate.score)}</span><button class="btn-secondary" type="button">Podgląd CV</button></div></article>` }
function setupCandidateSearch() { const update = () => { const query = document.getElementById('candidateSearch').value.toLowerCase(); const rating = Number(document.getElementById('candidateRating').value); document.getElementById('candidateList').innerHTML = candidateProfiles.filter((candidate) => `${candidate.name} ${candidate.role} ${candidate.location} ${candidate.skills}`.toLowerCase().includes(query) && candidate.score >= rating).map(candidateCard).join('') }; document.getElementById('candidateSearch').addEventListener('input', update); document.getElementById('candidateRating').addEventListener('change', update) }
function setupCvBuilder() { document.querySelectorAll('.skill-star').forEach((button) => button.addEventListener('click', () => { cvDraft.ratings = cvDraft.ratings || {}; cvDraft.ratings[button.dataset.skill] = Number(button.dataset.rating); document.querySelectorAll(`[data-skill="${button.dataset.skill}"]`).forEach((star) => star.classList.toggle('is-selected', Number(star.dataset.rating) <= Number(button.dataset.rating))) })); document.getElementById('cvBuilderForm').addEventListener('submit', (event) => { event.preventDefault(); Object.assign(cvDraft, Object.fromEntries(new FormData(event.currentTarget).entries())); localStorage.setItem('jobnexus-cv', JSON.stringify(cvDraft)); document.getElementById('cvBuilderStatus').textContent = 'CV zapisane. Twój profil jest gotowy do dopasowania ofert.'; }); document.querySelector('[data-cv-preview]').addEventListener('click', () => { document.getElementById('cvBuilderStatus').textContent = 'Podgląd CV będzie dostępny po zapisaniu formularza.' }) }

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
