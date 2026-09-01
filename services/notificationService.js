// Notification Service

export function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div')
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${getNotificationIcon(type)}</span>
      <span class="notification-text">${message}</span>
    </div>
  `
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${getNotificationBg(type)};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    animation: slideInRight 0.4s ease-out;
    max-width: 400px;
    display: flex;
    align-items: center;
    gap: 10px;
  `
  
  document.body.appendChild(notification)
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.4s ease-out'
    setTimeout(() => notification.remove(), 400)
  }, duration)
}

function getNotificationIcon(type) {
  const icons = {
    'success': '✓',
    'error': '✕',
    'warning': '⚠',
    'info': 'ℹ'
  }
  return icons[type] || '•'
}

function getNotificationBg(type) {
  const backgrounds = {
    'success': '#10b981',
    'error': '#ef4444',
    'warning': '#f59e0b',
    'info': '#3b82f6'
  }
  return backgrounds[type] || '#6366f1'
}

export function showSuccess(message) {
  showNotification(message, 'success')
}

export function showError(message) {
  showNotification(message, 'error')
}

export function showWarning(message) {
  showNotification(message, 'warning')
}

export function showInfo(message) {
  showNotification(message, 'info')
}
