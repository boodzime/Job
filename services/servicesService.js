// Services & Gigs Service - Handle service data loading and display

export async function loadServices() {
  return getDemoServices()
}

// Display services on page
export function displayServices(services, containerId = '#servicesList') {
  const container = document.querySelector(containerId)
  if (!container) return
  
  if (services.length === 0) {
    container.innerHTML = `
      <div class="no-results" style="grid-column: 1 / -1;">
        <p>🔍 Nie znaleziono usług</p>
        <p style="font-size: 0.9rem; color: #64748b; margin-top: 0.5rem;">Spróbuj zmienić filtry lub wyszukiwanie</p>
      </div>
    `
    return
  }
  
  container.innerHTML = services.map((service, index) => createServiceCard(service, index)).join('')
  
  // Add event listeners
  container.querySelectorAll('.btn-service-favorite').forEach(btn => {
    btn.addEventListener('click', toggleServiceFavorite)
  })
  
  container.querySelectorAll('.btn-service-contact').forEach(btn => {
    btn.addEventListener('click', handleServiceContact)
  })
}

// Create individual service card HTML
function createServiceCard(service, index) {
  const animationDelay = index * 0.08
  const ratingStars = createRatingStars(service.rating)
  
  return `
    <div class="service-card" style="animation-delay: ${animationDelay}s;">
      <div class="service-header">
        <div class="service-avatar">${service.avatar}</div>
        <div class="service-info-header">
          <h3 class="service-title">${escapeHtml(service.title)}</h3>
          <p class="service-provider">${escapeHtml(service.provider)}</p>
          <div class="service-rating">
            <span class="rating-stars">${ratingStars}</span>
            <span class="rating-count">(${service.reviews} opinii)</span>
          </div>
        </div>
        <button class="btn-service-favorite" data-service-id="${service.id}" title="Dodaj do ulubionych">
          <span class="heart-icon">♡</span>
        </button>
      </div>
      
      <p class="service-description">${truncateText(escapeHtml(service.description), 120)}</p>
      
      <div class="service-meta">
        <span class="service-type">${escapeHtml(service.type)}</span>
        <span class="service-location">📍 ${escapeHtml(service.location)}</span>
      </div>
      
      <div class="service-footer">
        <div class="service-price">${service.price} zł / ${service.unit}</div>
        <button class="btn-service-contact" data-service-id="${service.id}" data-service-title="${escapeHtml(service.title)}">
          💬 Skontaktuj się
        </button>
      </div>
    </div>
  `
}

// Create rating stars
function createRatingStars(rating) {
  let stars = ''
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0
  
  for (let i = 0; i < fullStars; i++) {
    stars += '★'
  }
  if (hasHalfStar) {
    stars += '⯨'
  }
  for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
    stars += '☆'
  }
  return stars
}

// Toggle service favorite
function toggleServiceFavorite(e) {
  e.preventDefault()
  const button = e.currentTarget
  const serviceId = button.dataset.serviceId
  
  button.classList.toggle('favorited')
  const icon = button.querySelector('.heart-icon')
  icon.textContent = button.classList.contains('favorited') ? '❤️' : '♡'
  
  // Save to localStorage
  const favorites = JSON.parse(localStorage.getItem('serviceFavorites') || '[]')
  if (button.classList.contains('favorited')) {
    if (!favorites.includes(serviceId)) {
      favorites.push(serviceId)
    }
  } else {
    const index = favorites.indexOf(serviceId)
    if (index > -1) {
      favorites.splice(index, 1)
    }
  }
  localStorage.setItem('serviceFavorites', JSON.stringify(favorites))
}

// Handle service contact
function handleServiceContact(e) {
  e.preventDefault()
  const serviceTitle = e.currentTarget.dataset.serviceTitle
  alert(`Dziękujemy! Wysłaliśmy zapytanie dotyczące usługi "${serviceTitle}". Pracodawca skontaktuje się z Tobą wkrótce.`)
}

// Escape HTML
function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Truncate text
function truncateText(text, maxLength) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Demo services data
function getDemoServices() {
  return [
    { id: 1, title: 'Korepetycje z matematyki', provider: 'Anna Kowalska', type: 'Korepetycje', description: 'Doświadczona nauczycielka matematyki oferuje korepetycje dla uczniów klas 4-8. Przygotowanie do egzaminów, wyrównywanie zaległości, rozwijanie zainteresowań.', price: '50', unit: 'godzina', location: 'Online', avatar: '👩‍🏫', rating: 4.8, reviews: 47 },
    { id: 2, title: 'Konsultacje biznesowe', provider: 'Marek Nowak', type: 'Konsultacje', description: 'Specjalista ds. rozwoju biznesu pomogę w strategii, marketingu i ekspansji firmy. 15 lat doświadczenia w branży technologicznej.', price: '150', unit: 'godzina', location: 'Online/Warszawa', avatar: '👨‍💼', rating: 4.9, reviews: 63 },
    { id: 3, title: 'Tłumaczenia angielski-polski', provider: 'Julia Lewandowska', type: 'Tłumaczenia', description: 'Natywna anglistka z Polski. Tłumaczę dokumenty, artykuły, strony internetowe. Specjalizacja: tekst techniczny i medyczny.', price: '70', unit: 'strona', location: 'Online', avatar: '🌍', rating: 4.7, reviews: 52 },
    { id: 4, title: 'Grafika i projektowanie logo', provider: 'Krzysztof Szpakowski', type: 'Grafika i Design', description: 'Tworzę profesjonalne logotypy, projektowanie graficzne i branding. Portfolio dostępne na stronie. Szybkie wykonanie, rewizje bezpłatnie.', price: '200-500', unit: 'projekt', location: 'Online', avatar: '🎨', rating: 4.9, reviews: 89 },
    { id: 5, title: 'Pisanie artykułów i content marketing', provider: 'Marta Zielińska', type: 'Pisanie i Content', description: 'Piszę artykuły SEO, posty na media społecznościowe, teksty reklamowe. Specjalizacja: zdrowie, wellness, lifestyle.', price: '60', unit: 'artykuł', location: 'Online', avatar: '✍️', rating: 4.6, reviews: 38 },
    { id: 6, title: 'Lekcje gitary dla początkujących', provider: 'Tomasz Jankowski', type: 'Muzyka i Lekcje', description: 'Nauczę Cię grać na gitarze od podstaw. Metoda nauki dostosowana do poziomu i zainteresowań ucznia. Nagrywanie własnych piosenek.', price: '80', unit: 'lekcja', location: 'Wrocław/Online', avatar: '🎸', rating: 4.8, reviews: 44 },
    { id: 7, title: 'Programowanie w Pythonie', provider: 'Adrian Kowalczyk', type: 'Programowanie', description: 'Kursy i zajęcia z Python dla początkujących i zaawansowanych. Data science, web development, automatyzacja. Certyfikat po ukończeniu.', price: '100', unit: 'godzina', location: 'Online', avatar: '💻', rating: 4.9, reviews: 127 },
    { id: 8, title: 'Porady biznesowe - startup', provider: 'Magdalena Rudy', type: 'Porady Biznesowe', description: 'Pomogę w założeniu i rozwijaniu startupa. Biznesplan, pitch deck, pozyskiwanie inwestycji. Doświadczenie z 5+ startupami.', price: '120', unit: 'sesja', location: 'Kraków/Online', avatar: '📈', rating: 4.7, reviews: 31 },
    { id: 9, title: 'Korepetycje z angielskiego', provider: 'David Smith', type: 'Korepetycje', description: 'Natywny angielski dla dorośli i dzieci. Konwersacje, gramatyka, przygotowanie do egzaminów (IELTS, TOEFL, FCE). Elastyczne godziny lekcji.', price: '60', unit: 'godzina', location: 'Online', avatar: '🇬🇧', rating: 4.8, reviews: 71 },
    { id: 10, title: 'Coaching osobisty - fitness', provider: 'Piotr Nowicki', type: 'Konsultacje', description: 'Indywidualnie dopasowany program treningowy i dieta. Motywacja i wsparcie na każdym etapie transformacji. Pierwsze konsultacje gratis.', price: '90', unit: 'sesja', location: 'Gdańsk/Online', avatar: '💪', rating: 4.9, reviews: 85 },
    { id: 11, title: 'Webdesign - strony internetowe', provider: 'Agnieszka Lewandowska', type: 'Grafika i Design', description: 'Projektuję responsywne strony internetowe. Wordpress, custom development, SEO optimization. Portfolio na behance.com/agnieszkaweb', price: '1500-3000', unit: 'strona', location: 'Online', avatar: '🖥️', rating: 4.8, reviews: 64 },
    { id: 12, title: 'Konsultacje prawne online', provider: 'Piotr Dąbrowski', type: 'Konsultacje', description: 'Adwokat specjalizujący się w prawie pracy i umowach. Bezpłatna konsultacja dla nowych klientów. Szybka odpowiedź, poufność gwarantowana.', price: '200', unit: 'godzina', location: 'Online', avatar: '⚖️', rating: 4.9, reviews: 98 },
    { id: 13, title: 'Coaching rozwojowy dla menedżerów', provider: 'Ewa Romańska', type: 'Porady Biznesowe', description: 'Coaching dla liderów i menedżerów. Rozwijanie kompetencji, budowanie zespołu, komunikacja. Programy indywidualne i grupowe dostępne.', price: '130', unit: 'sesja', location: 'Warszawa/Online', avatar: '👑', rating: 4.8, reviews: 52 },
    { id: 14, title: 'Redagowanie i korekta tekstów', provider: 'Beata Urbańska', type: 'Pisanie i Content', description: 'Profesjonalna korekta, redakcja i adaptacja tekstów. Specjalizacja: akademickie, biznesowe, creative writing. Szybkie terminy wykonania.', price: '45', unit: 'strona', location: 'Online', avatar: '📝', rating: 4.7, reviews: 41 },
    { id: 15, title: 'Fotografia eventów i portretów', provider: 'Łukasz Stefański', type: 'Grafika i Design', description: 'Profesjonalna fotografia wesel, komunii, imprez firmowych. Edycja zdjęć w najwyższej jakości. Album fizyczny w prezencie do pakietu premium.', price: '800-1500', unit: 'event', location: 'Poznań/okolice', avatar: '📷', rating: 4.9, reviews: 76 },
    { id: 16, title: 'Korepetycje z fizyki', provider: 'Jakub Kaminski', type: 'Korepetycje', description: 'Fizyka w zrozumiały i ciekawy sposób. Przygotowanie do matury, olimpiad i egzaminów. Doświadczenie jako nauczyciel w liceum.', price: '55', unit: 'godzina', location: 'Online/Lublin', avatar: '⚛️', rating: 4.8, reviews: 39 },
    { id: 17, title: 'Social media management', provider: 'Katarzyna Wójcik', type: 'Porady Biznesowe', description: 'Zarządzanie profilami na Instagram, Facebook, LinkedIn. Content calendar, grafiki, kopie promujące sprzedaż. Raportowanie wyników.', price: '1200-2000', unit: 'miesiąc', location: 'Online', avatar: '📱', rating: 4.7, reviews: 58 },
    { id: 18, title: 'Prawo jazdy - nauka jazdy online', provider: 'Kamil Krawczyk', type: 'Konsultacje', description: 'Kursy teoretyczne do egzaminu prawa jazdy. Wszystkie kategorie: A, B, C. Nauka interaktywna, testy przygotowujące do egzaminu.', price: '150', unit: 'kurs', location: 'Online', avatar: '🚗', rating: 4.6, reviews: 102 },
    { id: 19, title: 'Montaż wideo i edycja filmów', provider: 'Szymon Borkowski', type: 'Grafika i Design', description: 'Profesjonalny montaż filmów, edycja materiałów, efekty specjalne. YouTube, media społecznościowe, klipy promocyjne. Szybkie wykonanie.', price: '300-800', unit: 'projekt', location: 'Online', avatar: '🎬', rating: 4.8, reviews: 67 },
    { id: 20, title: 'Lekcje pianina dla dzieci i dorosłych', provider: 'Zofia Michalska', type: 'Muzyka i Lekcje', description: 'Nauczę Cię grać na pianinie od podstaw. Metoda Suzukiego, klasyczne podejście, nowoczesna muzyka. Przygotowanie do egzaminów szkolnych.', price: '75', unit: 'lekcja', location: 'Warszawa/Online', avatar: '🎹', rating: 4.9, reviews: 54 },
    { id: 21, title: 'Konsultacje dietetyczne online', provider: 'Hanna Piotrowska', type: 'Konsultacje', description: 'Dietetyk kliniczny - indywidualne plany żywieniowe. Dieta zdrowotna, schudnięcie, sportem, choroby metaboliczne. Regularne konsultacje.', price: '100', unit: 'sesja', location: 'Online', avatar: '🥗', rating: 4.8, reviews: 73 },
    { id: 22, title: 'Szkolenia z Excel i BI', provider: 'Dominik Kosior', type: 'Programowanie', description: 'Zaawansowany Excel, Power Query, Power Pivot, Business Intelligence. Dla pracowników i przywódców zespołów. Kursy dostosowane do poziomu.', price: '110', unit: 'godzina', location: 'Online', avatar: '📊', rating: 4.7, reviews: 45 },
    { id: 23, title: 'Porady HR i rekrutacja', provider: 'Katarzyna Lewandowska', type: 'Porady Biznesowe', description: 'Specjalista HR pomogę w budowaniu zespołu, procesach rekrutacyjnych, ocenie pracowników. Piszę ogłoszenia, rozmowy, strategie zatrudnienia.', price: '140', unit: 'sesja', location: 'Online/Wrocław', avatar: '👥', rating: 4.8, reviews: 50 },
    { id: 24, title: 'Tłumaczenia niemiecki-polski', provider: 'Wolfgang Mueller', type: 'Tłumaczenia', description: 'Natywny Niemiec. Tłumaczę wszystkie rodzaje dokumentów, specjalizacja: technika, prawo, biznes. Szybkie i profesjonalne wykonanie.', price: '75', unit: 'strona', location: 'Online', avatar: '🇩🇪', rating: 4.9, reviews: 68 },
    { id: 25, title: 'Projektowanie UX/UI', provider: 'Magdalena Duda', type: 'Grafika i Design', description: 'Designerka UX/UI dla aplikacji i stron. Wireframy, prototypy, design system. Narzędzia: Figma, Adobe XD. Portfolio dostępne.', price: '180', unit: 'godzina', location: 'Online', avatar: '🎯', rating: 4.9, reviews: 61 },
    { id: 26, title: 'Lekcje tańca online', provider: 'Łucja Kostrzewa', type: 'Muzyka i Lekcje', description: 'Taniec nowoczesny, hip-hop, balet. Dla początkujących i zaawansowanych. Nagrania lekcji do powtórki, wsparcie motywacyjne.', price: '40', unit: 'lekcja', location: 'Online', avatar: '💃', rating: 4.7, reviews: 36 },
    { id: 27, title: 'Coaching kariery i job interview', provider: 'Artur Bąk', type: 'Porady Biznesowe', description: 'Przygotowanie do rozmowy kwalifikacyjnej, budowanie CV, strategie poszukiwania pracy. Zmiana kariery, negocjacje pensji. Sukces w 90% klientów.', price: '110', unit: 'sesja', location: 'Online', avatar: '🎓', rating: 4.9, reviews: 94 },
    { id: 28, title: 'JavaScript i React - szkolenia', provider: 'Dawid Nowacki', type: 'Programowanie', description: 'Nauka JavaScript, React, zaawansowany frontend. Dla holistów i profesjonalistów. Projekty praktyczne, portfolio do pracy.', price: '120', unit: 'godzina', location: 'Online', avatar: '⚡', rating: 4.8, reviews: 83 },
    { id: 29, title: 'Korekta pracy dyplomowej', provider: 'Dr Anna Nowak', type: 'Pisanie i Content', description: 'Korekta, redakcja i formatowanie prac dyplomowych. Magisterskie, doktorskie, artykuły naukowe. Doświadczenie 10+ lat w akademii.', price: '50', unit: 'strona', location: 'Online', avatar: '📚', rating: 4.8, reviews: 112 },
    { id: 30, title: 'Mindfulness i medytacja dla pracowników', provider: 'Monika Ściuba', type: 'Konsultacje', description: 'Warsztaty mindfulness dla firm. Redukcja stresu, produktywność, wellbeing zespołu. Programy indywidualne i grupowe. Certyfikowana instruktorka.', price: '600-1200', unit: 'warsztat', location: 'Online/Warszawa', avatar: '🧘', rating: 4.9, reviews: 71 }
  ]
}
