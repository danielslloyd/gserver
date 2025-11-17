/**
 * Shared UI Utilities
 * Common UI functions used across all pages
 */

// Show/hide loading spinner
function showLoading(show = true) {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.toggle('hidden', !show);
  }
}

// Show notification toast
function showNotification(message, type = 'success', duration = 3000) {
  const notification = document.getElementById('notification');
  if (!notification) return;

  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.classList.remove('hidden');

  setTimeout(() => {
    notification.classList.add('hidden');
  }, duration);
}

// Update user info display in header
function updateUserDisplay(user) {
  const userInfo = document.getElementById('user-info');
  const userDisplayName = document.getElementById('user-display-name');

  if (user && userInfo && userDisplayName) {
    userInfo.classList.remove('hidden');
    userDisplayName.textContent = user.displayName || user.email;
  } else if (userInfo) {
    userInfo.classList.add('hidden');
  }
}

// Format timestamp to readable date
function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';

  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format time duration in seconds to readable format
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// Make functions globally available
window.showLoading = showLoading;
window.showNotification = showNotification;
window.updateUserDisplay = updateUserDisplay;
window.formatDate = formatDate;
window.formatDuration = formatDuration;
