// Job Service - Handle job data loading and display

export async function loadJobs() {
  try {
    // Try loading from local JSON file first
    const response = await fetch('./public/ogloszenia/jobs.json')
    if (response.ok) {
      const data = await response.json()
      return parseJobsData(data)
    }
  } catch (error) {
    console.log('Local file not found, trying alternative source')
  }
  
  // Fallback to demo data
  return getDemoJobs()
}

// Parse jobs data from API response
function parseJobsData(data) {
  if (Array.isArray(data)) {
    return data.map(job => ({
      id: job.id || Math.random(),
      title: job.title || job.name || 'Brak tytułu',
      company: job.company || job.employer || 'Brak firmy',
      location: job.location || job.city || 'Brak lokalizacji',
      description: job.description || job.job_description || '',
      salary: job.salary || job.salary_min || 'Do negocjacji',
      salaryMax: job.salary_max || null,
      type: job.type || job.job_type || 'full-time',
      category: job.category || job.job_category || 'Inne',
      posted: job.posted_date || job.created_at || new Date().toISOString(),
      url: job.url || '#'
    }))
  }
  return []
}

// Display jobs on page
export function displayJobs(jobs, containerId = '#jobsList') {
  const container = document.querySelector(containerId)
  if (!container) return
  
  if (jobs.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <p>😔 Nie znaleziono ofert pracy</p>
        <p style="font-size: 0.9rem; color: #64748b; margin-top: 0.5rem;">Spróbuj zmienić filtry lub wyszukiwanie</p>
      </div>
    `
    return
  }
  
  container.innerHTML = jobs.map((job, index) => createJobCard(job, index)).join('')
  
  // Add event listeners to favorite buttons
  container.querySelectorAll('.btn-favorite').forEach(btn => {
    btn.addEventListener('click', toggleFavorite)
  })
  
  // Add event listeners to apply buttons
  container.querySelectorAll('.btn-apply').forEach(btn => {
    btn.addEventListener('click', handleApply)
  })
}

// Create individual job card HTML
function createJobCard(job, index) {
  const animationDelay = index * 0.1
  const salary = formatSalary(job.salary, job.salaryMax)
  const daysSincePosted = getDaysSincePosted(job.posted)
  const type = formatJobType(job.type)
  
  return `
    <div class="job-card" style="animation-delay: ${animationDelay}s;">
      <div class="job-header">
        <div>
          <h3 class="job-title">${escapeHtml(job.title)}</h3>
          <p class="job-company">${escapeHtml(job.company)}</p>
        </div>
        <button class="btn-favorite" data-job-id="${job.id}" title="Dodaj do ulubionych">
          <span class="heart-icon">♡</span>
        </button>
      </div>
      
      <div class="job-meta">
        <span class="job-location">📍 ${escapeHtml(job.location)}</span>
        <span class="job-type badge badge-primary">${type}</span>
        <span class="job-posted">🕐 ${daysSincePosted}</span>
      </div>
      
      <p class="job-description">${truncateText(escapeHtml(job.description), 150)}</p>
      
      <div class="job-footer">
        <div class="job-salary">${salary}</div>
        <button class="btn-apply" data-job-id="${job.id}" data-job-title="${escapeHtml(job.title)}">
          ✉️ Aplikuj
        </button>
      </div>
    </div>
  `
}

// Format salary display
function formatSalary(min, max) {
  if (!min) return '💰 Do negocjacji'
  
  if (typeof min === 'string') {
    return `💰 ${min}`
  }
  
  if (max) {
    return `💰 ${min.toLocaleString('pl-PL')} - ${max.toLocaleString('pl-PL')} PLN`
  }
  
  return `💰 ${min.toLocaleString('pl-PL')} PLN`
}

// Format job type
function formatJobType(type) {
  const types = {
    'full-time': 'Pełny etat',
    'part-time': 'Część etatu',
    'contract': 'Kontrakt',
    'freelance': 'Freelance',
    'temporary': 'Tymczasowa'
  }
  return types[type] || type || 'Pełny etat'
}

// Calculate days since posted
function getDaysSincePosted(date) {
  try {
    const posted = new Date(date)
    const now = new Date()
    const diffTime = Math.abs(now - posted)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Dzisiaj'
    if (diffDays === 1) return 'Wczoraj'
    if (diffDays < 7) return `${diffDays} dni temu`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tygodni temu`
    return `${Math.floor(diffDays / 30)} miesięcy temu`
  } catch (error) {
    return 'Niedawno'
  }
}

// Truncate text
function truncateText(text, maxLength) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Toggle favorite
function toggleFavorite(e) {
  e.preventDefault()
  const button = e.currentTarget
  const jobId = button.dataset.jobId
  
  button.classList.toggle('favorited')
  const icon = button.querySelector('.heart-icon')
  icon.textContent = button.classList.contains('favorited') ? '❤️' : '♡'
  
  // Save to localStorage
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
  if (button.classList.contains('favorited')) {
    if (!favorites.includes(jobId)) {
      favorites.push(jobId)
    }
  } else {
    const index = favorites.indexOf(jobId)
    if (index > -1) {
      favorites.splice(index, 1)
    }
  }
  localStorage.setItem('favorites', JSON.stringify(favorites))
}

// Handle apply
function handleApply(e) {
  e.preventDefault()
  const jobTitle = e.currentTarget.dataset.jobTitle
  alert(`Dziękujemy! Twoja aplikacja do stanowiska "${jobTitle}" została wysłana.`)
  // Here you would send the application to a server
}

// Demo jobs data
function getDemoJobs() {
  return [
    {
      id: 1,
      title: 'Senior JavaScript Developer',
      company: 'TechCorp Sp. z o.o.',
      location: 'Warszawa',
      description: 'Szukamy doświadczonego programisty JavaScript do pracy nad nowoczesnymi aplikacjami webowymi. Wymagana znajomość React, Node.js i baz danych SQL.',
      salary: 12000,
      salaryMax: 16000,
      type: 'full-time',
      category: 'IT',
      posted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      title: 'Product Manager',
      company: 'StartupHub',
      location: 'Kraków',
      description: 'Dołącz do naszego zespołu jako Product Manager. Będziesz odpowiedzialny za strategię produktu i współpracę z zespołem dev. Wymagane doświadczenie 3+ lat.',
      salary: 10000,
      salaryMax: 14000,
      type: 'full-time',
      category: 'Zarządzanie',
      posted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      title: 'UX/UI Designer',
      company: 'Creative Studio',
      location: 'Wrocław',
      description: 'Szukamy kreatywnego designera do projektowania interfejsów użytkownika dla aplikacji mobilnych. Portfolio wymagane.',
      salary: 7000,
      salaryMax: 10000,
      type: 'full-time',
      category: 'Design',
      posted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 4,
      title: 'Data Scientist',
      company: 'AI Solutions',
      location: 'Warszawa',
      description: 'Poszukujemy Data Scientist\'a do analizy dużych zbiorów danych. Wymagana znajomość Python, SQL i ML frameworks.',
      salary: 13000,
      salaryMax: 18000,
      type: 'full-time',
      category: 'IT',
      posted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 5,
      title: 'Marketing Specialist',
      company: 'Digital Agency Pro',
      location: 'Gdańsk',
      description: 'Szukamy specjalisty marketingu cyfrowego do pracy nad kampaniami dla naszych klientów. Doświadczenie z Google Ads i Facebook Ads wymagane.',
      salary: 6000,
      salaryMax: 9000,
      type: 'full-time',
      category: 'Marketing',
      posted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 6,
      title: 'DevOps Engineer',
      company: 'CloudTech',
      location: 'Poznań',
      description: 'Dołącz do naszego zespołu DevOps. Wymagana znajomość Docker, Kubernetes, AWS i CI/CD pipelines.',
      salary: 11000,
      salaryMax: 15000,
      type: 'full-time',
      category: 'IT',
      posted: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 7,
      title: 'HR Manager',
      company: 'HumanResources Co.',
      location: 'Warszawa',
      description: 'Szukamy HR Manager\'a do zarządzania procesami rekrutacji i onboardingu. Doświadczenie w HR min 2 lata.',
      salary: 7500,
      salaryMax: 10500,
      type: 'full-time',
      category: 'HR',
      posted: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 8,
      title: 'Python Developer',
      company: 'SoftwareLabs',
      location: 'Wrocław',
      description: 'Szukamy Python Developer\'a do pracy nad backendem. Wymagana znajomość Django/FastAPI i SQL.',
      salary: 10000,
      salaryMax: 13000,
      type: 'full-time',
      category: 'IT',
      posted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 9,
      title: 'Content Writer',
      company: 'Media Group',
      location: 'Kraków',
      description: 'Poszukujemy doświadczonego copywritera do tworzenia artykułów i materiałów marketingowych.',
      salary: 5000,
      salaryMax: 7500,
      type: 'full-time',
      category: 'Marketing',
      posted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 10,
      title: 'QA Tester',
      company: 'TestQuality',
      location: 'Gdańsk',
      description: 'Szukamy QA Engineer\'a do testowania aplikacji webowych i mobilnych. Doświadczenie z Selenium wymagane.',
      salary: 6500,
      salaryMax: 8500,
      type: 'full-time',
      category: 'IT',
      posted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 11,
      title: 'Business Analyst',
      company: 'Consulting Pro',
      location: 'Warszawa',
      description: 'Poszukujemy Business Analyst\'a do analizy wymagań i dokumentacji procesów biznesowych.',
      salary: 9000,
      salaryMax: 12000,
      type: 'full-time',
      category: 'Zarządzanie',
      posted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 12,
      title: 'Full Stack Developer',
      company: 'WebSolutions',
      location: 'Poznań',
      description: 'Szukamy Full Stack Developer\'a z doświadczeniem w React i Node.js. Atrakcyjna stawka i benefity.',
      salary: 11000,
      salaryMax: 14000,
      type: 'full-time',
      category: 'IT',
      posted: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 13,
      title: 'Sales Executive',
      company: 'SalesForce Inc.',
      location: 'Wrocław',
      description: 'Dołącz do naszego zespołu sprzedaży. Wymagane doświadczenie w B2B sales i znajomość CRM.',
      salary: 6000,
      salaryMax: 11000,
      type: 'full-time',
      category: 'Sales',
      posted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 14,
      title: 'Mobile App Developer',
      company: 'AppStudio',
      location: 'Gdańsk',
      description: 'Szukamy Mobile Developer\'a specjalizującego się w React Native i Flutter.',
      salary: 10000,
      salaryMax: 13000,
      type: 'full-time',
      category: 'IT',
      posted: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
}
