// Application State
const state = {
  notes: [],
  filteredNotes: [],
  selectedNote: null,
  selectedPreset: 'brief', // 'brief' | 'news' | 'detailed'
  searchQuery: '',
  currentCategory: 'all',
  isDarkTheme: true
};

// DOM Elements
const elements = {
  themeToggle: document.getElementById('theme-toggle'),
  themeIcon: document.getElementById('theme-icon'),
  refreshButton: document.getElementById('refresh-button'),
  refreshSpinner: document.getElementById('refresh-spinner'),
  refreshIcon: document.getElementById('refresh-icon'),
  lastUpdatedTime: document.getElementById('last-updated-time'),
  
  // Stats
  valTotal: document.getElementById('val-total'),
  valFeatures: document.getElementById('val-features'),
  valIssues: document.getElementById('val-issues'),
  valOthers: document.getElementById('val-others'),
  
  // Search & Filter
  searchInput: document.getElementById('search-input'),
  categoryTabs: document.getElementById('category-tabs'),
  notesList: document.getElementById('notes-list'),
  
  // Counts on Tabs
  countAll: document.getElementById('badge-count-all'),
  countFeature: document.getElementById('badge-count-feature'),
  countAnnouncement: document.getElementById('badge-count-announcement'),
  countChange: document.getElementById('badge-count-change'),
  countIssue: document.getElementById('badge-count-issue'),
  countDeprecated: document.getElementById('badge-count-deprecated'),
  
  // Composer
  composerEmptyState: document.getElementById('composer-empty-state'),
  composerActiveContent: document.getElementById('composer-active-content'),
  composerDate: document.getElementById('composer-selected-date'),
  composerBadge: document.getElementById('composer-selected-badge'),
  composerTitle: document.getElementById('composer-selected-title'),
  presetBrief: document.getElementById('preset-brief'),
  presetNews: document.getElementById('preset-news'),
  presetDetailed: document.getElementById('preset-detailed'),
  tweetTextarea: document.getElementById('tweet-textarea'),
  tweetCharCount: document.getElementById('tweet-char-count'),
  btnCopyTweet: document.getElementById('btn-copy-tweet'),
  btnShareTweet: document.getElementById('btn-share-tweet'),
  toastContainer: document.getElementById('toast-container'),
  xPreviewText: document.getElementById('x-preview-text'),
  xPreviewLinkTitle: document.getElementById('x-preview-link-title'),
  xPreviewLinkDesc: document.getElementById('x-preview-link-desc'),
  exportCsvButton: document.getElementById('export-csv-button')
};

// SVGs for dynamic icons
const icons = {
  sun: `<path d="M12 18c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm0-10c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zM11 1h2v3h-2zm0 19h2v3h-2zM3.5 3.5l2.1 2.1-1.4 1.4L2.1 4.9zm16.3 16.3l-2.1-2.1 1.4-1.4 2.1 2.1zM1 11h3v2H1zm19 0h3v2h-3zM4.9 19.1l2.1-2.1 1.4 1.4-2.1 2.1zm14.2-14.2l-2.1 2.1-1.4-1.4 2.1-2.1z"/>`,
  moon: `<path d="M12.3 22h-.1c-5.5 0-10-4.5-10-10 0-4.8 3.5-8.9 8.2-9.7.5-.1 1 .2 1.2.6.2.5 0 1-.4 1.3-1.9 1.4-3 3.6-3 6.1 0 4.1 3.4 7.5 7.5 7.5 2.5 0 4.7-1.1 6.1-3 .3-.4.9-.5 1.3-.4.5.2.7.7.6 1.2-.9 4.8-5 8.3-9.8 8.4h-.4zm-2.8-17c-2.9.9-4.9 3.6-4.9 6.8 0 3.9 3.1 7 7 7 3.2 0 5.9-2 6.8-4.9-1.2.5-2.5.7-3.9.7-4.7 0-8.5-3.8-8.5-8.5 0-1.4.2-2.7.7-3.9z"/>`
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  setupEventListeners();
  loadNotes();
});

// Theme setup and handling
function setupTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    state.isDarkTheme = false;
    document.body.classList.add('light-theme');
    elements.themeIcon.innerHTML = icons.moon;
  } else {
    state.isDarkTheme = true;
    document.body.classList.remove('light-theme');
    elements.themeIcon.innerHTML = icons.sun;
  }
}

function toggleTheme() {
  state.isDarkTheme = !state.isDarkTheme;
  if (state.isDarkTheme) {
    document.body.classList.remove('light-theme');
    localStorage.setItem('theme', 'dark');
    elements.themeIcon.innerHTML = icons.sun;
    showToast('Switched to Dark Mode', 'info');
  } else {
    document.body.classList.add('light-theme');
    localStorage.setItem('theme', 'light');
    elements.themeIcon.innerHTML = icons.moon;
    showToast('Switched to Light Mode', 'info');
  }
}

// Event Listeners Setup
function setupEventListeners() {
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.refreshButton.addEventListener('click', refreshNotes);
  elements.exportCsvButton.addEventListener('click', exportToCSV);
  
  // Search with debounce/input listener
  elements.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase();
    renderNotes();
  });

  // Filter tabs listener
  elements.categoryTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.category-tab');
    if (!tab) return;
    
    // Set active tab styling
    document.querySelectorAll('.category-tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    
    // Filter
    state.currentCategory = tab.dataset.category;
    renderNotes();
  });

  // Tweet presets click handler
  const presets = [elements.presetBrief, elements.presetNews, elements.presetDetailed];
  presets.forEach(presetBtn => {
    presetBtn.addEventListener('click', (e) => {
      presets.forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      state.selectedPreset = e.target.dataset.preset;
      updateComposerText();
    });
  });

  // Live text area counter
  elements.tweetTextarea.addEventListener('input', () => {
    updateCharCounter();
  });

  // Copy to clipboard click
  elements.btnCopyTweet.addEventListener('click', copyTweetToClipboard);

  // Share tweet click
  elements.btnShareTweet.addEventListener('click', shareTweetOnTwitter);
}

// Fetch Notes from API (Loads cached on startup)
async function loadNotes() {
  try {
    const response = await fetch('/api/notes');
    if (!response.ok) throw new Error('Network response not ok');
    const data = await response.json();
    
    state.notes = data.notes;
    updateLastUpdatedTime(data.last_updated);
    renderStats();
    renderTabCounts();
    renderNotes();
  } catch (error) {
    console.error('Error loading notes:', error);
    showToast('Failed to load release notes.', 'error');
    elements.notesList.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
      <h3>Failed to load release notes</h3>
      <p>Please check your server connection and click Refresh to try again.</p>
    </div>`;
  }
}

// Refresh Notes API trigger
async function refreshNotes() {
  // UI Loading state
  elements.refreshButton.disabled = true;
  elements.refreshSpinner.classList.add('active');
  elements.refreshIcon.style.display = 'none';
  showToast('Refreshing BigQuery release notes...', 'info');
  
  try {
    const response = await fetch('/api/refresh', { method: 'POST' });
    const data = await response.json();
    
    if (data.status === 'success') {
      state.notes = data.notes;
      showToast('Release notes updated successfully!', 'success');
    } else {
      // Returned error but still loaded cache
      state.notes = data.notes;
      showToast(data.message || 'Error updating feed.', 'error');
    }
    
    updateLastUpdatedTime(data.last_updated);
    renderStats();
    renderTabCounts();
    renderNotes();
  } catch (error) {
    console.error('Error refreshing notes:', error);
    showToast('Failed to connect to backend feed parser.', 'error');
  } finally {
    // Reset buttons
    elements.refreshButton.disabled = false;
    elements.refreshSpinner.classList.remove('active');
    elements.refreshIcon.style.display = 'inline-block';
  }
}

// Update Last Synced Text
function updateLastUpdatedTime(isoString) {
  if (!isoString) {
    elements.lastUpdatedTime.textContent = 'Never synced';
    return;
  }
  
  const date = new Date(isoString);
  const formatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  elements.lastUpdatedTime.textContent = `Last synced: ${formatted}`;
}

// Render Header Stats
function renderStats() {
  const total = state.notes.length;
  const features = state.notes.filter(n => n.category.toLowerCase() === 'feature').length;
  const issues = state.notes.filter(n => ['issue', 'fixed', 'bug'].includes(n.category.toLowerCase())).length;
  const others = total - features - issues;
  
  elements.valTotal.textContent = total;
  elements.valFeatures.textContent = features;
  elements.valIssues.textContent = issues;
  elements.valOthers.textContent = others;
}

// Calculate individual counts on tabs dynamically
function renderTabCounts() {
  const getCount = (cat) => {
    if (cat === 'all') return state.notes.length;
    return state.notes.filter(n => n.category.toLowerCase() === cat).length;
  };
  
  elements.countAll.textContent = getCount('all');
  elements.countFeature.textContent = getCount('feature');
  elements.countAnnouncement.textContent = getCount('announcement');
  elements.countChange.textContent = getCount('change');
  elements.countIssue.textContent = getCount('issue') + getCount('fixed'); // Map fixed under issues for counts
  elements.countDeprecated.textContent = getCount('deprecated');
}

// Filter and Render release note cards
function renderNotes() {
  // Filter state
  state.filteredNotes = state.notes.filter(note => {
    // Category match
    const categoryMatches = (state.currentCategory === 'all') || 
                            (note.category.toLowerCase() === state.currentCategory) ||
                            (state.currentCategory === 'issue' && note.category.toLowerCase() === 'fixed');
                            
    // Search text match
    const searchString = `${note.date} ${note.category} ${note.description_text}`.toLowerCase();
    const searchMatches = searchString.includes(state.searchQuery);
    
    return categoryMatches && searchMatches;
  });

  // Render cards
  if (state.filteredNotes.length === 0) {
    elements.notesList.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
      <h3>No matches found</h3>
      <p>Try clearing your search keyword or selecting a different category tab.</p>
    </div>`;
    return;
  }

  elements.notesList.innerHTML = '';
  state.filteredNotes.forEach(note => {
    const card = createCardDOM(note);
    elements.notesList.appendChild(card);
  });
}

// Helper to create Note Card DOM
function createCardDOM(note) {
  const card = document.createElement('article');
  card.className = 'note-card';
  card.id = `card-${note.id}`;
  
  if (state.selectedNote && state.selectedNote.id === note.id) {
    card.classList.add('selected');
  }

  // Set card category theme border left color
  const cat = note.category.toLowerCase();
  let badgeClass = 'badge-default';
  let colorVar = 'var(--text-muted)';
  
  if (cat === 'feature') { badgeClass = 'badge-feature'; colorVar = 'var(--badge-feature-text)'; }
  else if (cat === 'announcement') { badgeClass = 'badge-announcement'; colorVar = 'var(--badge-announcement-text)'; }
  else if (cat === 'change') { badgeClass = 'badge-change'; colorVar = 'var(--badge-change-text)'; }
  else if (cat === 'issue' || cat === 'fixed') { badgeClass = 'badge-issue'; colorVar = 'var(--badge-issue-text)'; }
  else if (cat === 'deprecated') { badgeClass = 'badge-deprecated'; colorVar = 'var(--badge-deprecated-text)'; }
  
  card.style.setProperty('--badge-color', colorVar);

  card.innerHTML = `
    <div class="card-select-indicator">
      <svg viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
    </div>
    
    <div class="card-header">
      <div class="card-meta">
        <span class="card-date">${note.date}</span>
        <h3 class="card-title">${note.category} Update</h3>
      </div>
      <span class="badge ${badgeClass}">${note.category}</span>
    </div>
    
    <div class="card-body">
      ${note.description_html}
    </div>
    
    <div class="card-footer">
      <button class="btn-copy-card" title="Copy update text to clipboard">
        <svg viewBox="0 0 24 24" style="width: 13px; height: 13px; fill: currentColor;">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
        <span>Copy</span>
      </button>
      <a href="${note.link}" class="source-link" target="_blank" rel="noopener noreferrer">
        <span>View Release Log</span>
        <svg viewBox="0 0 24 24">
          <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
        </svg>
      </a>
    </div>
  `;

  // Copy Card Content Event
  const copyBtn = card.querySelector('.btn-copy-card');
  copyBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent card selection click event from firing
    
    const textToCopy = `Google Cloud BigQuery Update - ${note.date} [${note.category}]\n\n${note.description_text.replace(/\s+/g, ' ').trim()}\n\nSource: ${note.link}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      copyBtn.querySelector('span').textContent = 'Copied!';
      copyBtn.classList.add('copied');
      
      showToast(`Copied ${note.category} update to clipboard!`, 'success');
      
      setTimeout(() => {
        copyBtn.querySelector('span').textContent = 'Copy';
        copyBtn.classList.remove('copied');
      }, 2000);
    }).catch(err => {
      console.error('Could not copy card text: ', err);
      showToast('Failed to copy text.', 'error');
    });
  });

  // Select Card Event
  card.addEventListener('click', (e) => {
    // If user clicks a link or copy button, let it open normally
    if (e.target.tagName === 'A' || e.target.closest('a') || e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    
    selectNote(note);
  });

  return card;
}

// Select a Note card & Load Tweet Composer
function selectNote(note) {
  state.selectedNote = note;
  
  // Update Selection Classes on cards
  document.querySelectorAll('.note-card').forEach(card => {
    card.classList.remove('selected');
  });
  const selectedDOM = document.getElementById(`card-${note.id}`);
  if (selectedDOM) selectedDOM.classList.add('selected');
  
  // Show Composer panels
  elements.composerEmptyState.style.display = 'none';
  elements.composerActiveContent.style.display = 'flex';
  
  // Bind Composer Header Info
  elements.composerDate.textContent = note.date;
  elements.composerTitle.textContent = `${note.category} Update`;
  
  // Set badge style
  const cat = note.category.toLowerCase();
  elements.composerBadge.className = 'badge';
  if (cat === 'feature') elements.composerBadge.classList.add('badge-feature');
  else if (cat === 'announcement') elements.composerBadge.classList.add('badge-announcement');
  else if (cat === 'change') elements.composerBadge.classList.add('badge-change');
  else if (cat === 'issue' || cat === 'fixed') elements.composerBadge.classList.add('badge-issue');
  else if (cat === 'deprecated') elements.composerBadge.classList.add('badge-deprecated');
  else elements.composerBadge.classList.add('badge-default');
  elements.composerBadge.textContent = note.category;
  
  // Update X Link Preview details
  elements.xPreviewLinkTitle.textContent = `${note.category} Update | BigQuery Release Notes`;
  let previewDesc = note.description_text.replace(/\s+/g, ' ').trim();
  if (previewDesc.length > 115) {
    previewDesc = previewDesc.substring(0, 115) + '...';
  }
  elements.xPreviewLinkDesc.textContent = previewDesc;
  
  // Refresh Text Composition
  updateComposerText();
  
  // Scroll Composer into view if on mobile/small screen
  if (window.innerWidth <= 1024) {
    elements.composerCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Generate preset text contents
function updateComposerText() {
  if (!state.selectedNote) return;
  
  const note = state.selectedNote;
  let text = '';
  
  // Strip double spacing and clean description snippet
  let cleanDesc = note.description_text
    .replace(/\s+/g, ' ')
    .trim();
  
  const dateStr = note.date;
  const link = note.link;
  
  switch(state.selectedPreset) {
    case 'news':
      text = `📢 Google Cloud BigQuery - ${dateStr}\n\nCategory: ${note.category}\n\n${cleanDesc}`;
      break;
    case 'detailed':
      text = `🚀 BigQuery Update (${dateStr}): ${note.category}\n\n${cleanDesc}`;
      break;
    case 'brief':
    default:
      text = `BigQuery [${note.category}] (${dateStr}): ${cleanDesc}`;
      break;
  }
  
  // Smart Truncator to leave space for link (23 characters on Twitter/X, plus separator space and ellipses)
  // Max tweet is 280, URL is 23, space is 1, ellipses is 3 -> 253 characters remaining for description text.
  const maxTextLength = 250;
  if (text.length > maxTextLength) {
    text = text.substring(0, maxTextLength).trim() + '...';
  }
  
  // Append link
  text = `${text} ${link}`;
  
  elements.tweetTextarea.value = text;
  updateCharCounter();
}

// Format tweet text for authentic X/Twitter visual layout (hashtags, handles and URLs highlighted in blue)
function formatTweetPreviewText(text) {
  if (!text) return 'Drafting...';
  
  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  escaped = escaped.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

  const hashtagRegex = /(#[a-zA-Z0-9_]+)/g;
  escaped = escaped.replace(hashtagRegex, '<span style="color: #1d9bf0; font-weight: 500;">$1</span>');

  const handleRegex = /(@[a-zA-Z0-9_]+)/g;
  escaped = escaped.replace(handleRegex, '<span style="color: #1d9bf0; font-weight: 500;">$1</span>');

  return escaped.replace(/\n/g, '<br>');
}

// Update Character Counter & Button States
function updateCharCounter() {
  const currentText = elements.tweetTextarea.value;
  
  // Twitter counts any URL as 23 characters under t.co shortening.
  // We can calculate actual characters or "Twitter characters" to be super precise.
  // Let's do a Twitter-realistic char count.
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let twitterLength = currentText.length;
  
  const matches = currentText.match(urlRegex);
  if (matches) {
    matches.forEach(url => {
      // Subtract literal length and add 23
      twitterLength = twitterLength - url.length + 23;
    });
  }
  
  elements.tweetCharCount.textContent = `${twitterLength} / 280`;
  
  // Update colors of counter
  elements.tweetCharCount.className = 'char-counter';
  if (twitterLength > 280) {
    elements.tweetCharCount.classList.add('danger');
    elements.btnShareTweet.disabled = true;
  } else if (twitterLength > 260) {
    elements.tweetCharCount.classList.add('warning');
    elements.btnShareTweet.disabled = false;
  } else {
    elements.btnShareTweet.disabled = false;
  }
  
  if (currentText.trim() === '') {
    elements.btnShareTweet.disabled = true;
  }

  // Update Live X/Twitter Preview box text
  if (elements.xPreviewText) {
    elements.xPreviewText.innerHTML = formatTweetPreviewText(currentText);
  }
}

// Copy Tweet text to Clipboard
function copyTweetToClipboard() {
  const text = elements.tweetTextarea.value;
  if (!text) return;
  
  navigator.clipboard.writeText(text).then(() => {
    // Visual button feedback
    const originalText = elements.btnCopyTweet.querySelector('span').textContent;
    elements.btnCopyTweet.querySelector('span').textContent = 'Copied!';
    elements.btnCopyTweet.classList.add('btn-primary');
    elements.btnCopyTweet.classList.remove('btn-secondary');
    
    showToast('Tweet copied to clipboard!', 'success');
    
    setTimeout(() => {
      elements.btnCopyTweet.querySelector('span').textContent = originalText;
      elements.btnCopyTweet.classList.remove('btn-primary');
      elements.btnCopyTweet.classList.add('btn-secondary');
    }, 2000);
  }).catch(err => {
    console.error('Could not copy text: ', err);
    showToast('Failed to copy text.', 'error');
  });
}

// Dispatch X Web Intent
function shareTweetOnTwitter() {
  const text = elements.tweetTextarea.value;
  if (!text) return;
  
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  
  // Open X composer popup in standard size
  const width = 550;
  const height = 420;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;
  
  window.open(
    url, 
    'Share on X', 
    `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,directories=no,location=yes,scrollbars=yes,resizable=yes`
  );
  
  showToast('Dispatched composer window!', 'info');
}

// Export current filtered list of notes to CSV
function exportToCSV() {
  if (state.filteredNotes.length === 0) {
    showToast('No notes available to export.', 'error');
    return;
  }
  
  const headers = ['ID', 'Date', 'Category', 'Link', 'Description'];
  
  const escapeCSV = (text) => {
    if (text === null || text === undefined) return '';
    const stringified = String(text);
    const escaped = stringified.replace(/"/g, '""');
    if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') || escaped.includes('\r')) {
      return `"${escaped}"`;
    }
    return escaped;
  };
  
  const rows = state.filteredNotes.map(note => [
    note.id,
    note.date,
    note.category,
    note.link,
    note.description_text.replace(/\s+/g, ' ').trim()
  ]);
  
  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `bigquery_release_notes_${state.currentCategory}_${dateStr}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast(`Successfully exported ${state.filteredNotes.length} updates to CSV!`, 'success');
}

// Show custom toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = '';
  if (type === 'success') {
    icon = `<svg viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: var(--badge-feature-text);"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
  } else if (type === 'error') {
    icon = `<svg viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: var(--badge-issue-text);"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
  } else {
    // Info
    icon = `<svg viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: var(--primary-accent);"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`;
  }
  
  toast.innerHTML = `
    ${icon}
    <span>${message}</span>
    <button class="toast-close">&times;</button>
  `;
  
  // Close handler
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.animation = 'slideOut 0.2s forwards';
    setTimeout(() => toast.remove(), 200);
  });
  
  elements.toastContainer.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'slideOut 0.2s forwards';
      setTimeout(() => toast.remove(), 200);
    }
  }, 3500);
}

// Add CSS keyframe for toast slideOut dynamically
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(120%); opacity: 0; }
  }
`;
document.head.appendChild(styleSheet);
