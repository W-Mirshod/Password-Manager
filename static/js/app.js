// State management
let passwords = [];
let editingId = null;
let passwordVisible = {};
let theme = 'auto';

// DOM elements
const passwordList = document.getElementById('passwordList');
const searchInput = document.getElementById('searchInput');
const addBtn = document.getElementById('addBtn');
const passwordModal = document.getElementById('passwordModal');
const generatorModal = document.getElementById('generatorModal');
const passwordForm = document.getElementById('passwordForm');
const closeModal = document.getElementById('closeModal');
const closeGeneratorModal = document.getElementById('closeGeneratorModal');
const cancelBtn = document.getElementById('cancelBtn');
const togglePassword = document.getElementById('togglePassword');
const generatePasswordBtn = document.getElementById('generatePassword');
const useGeneratedBtn = document.getElementById('useGeneratedBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const copyGeneratedBtn = document.getElementById('copyGenerated');
const genLength = document.getElementById('genLength');
const lengthValue = document.getElementById('lengthValue');
const generatedPassword = document.getElementById('generatedPassword');

// API functions
async function fetchPasswords(search = '') {
    try {
        const url = search 
            ? `/api/passwords?search=${encodeURIComponent(search)}`
            : '/api/passwords';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch passwords');
        return await response.json();
    } catch (error) {
        console.error('Error fetching passwords:', error);
        showError('Failed to load passwords');
        return [];
    }
}

async function createPassword(data) {
    try {
        const response = await fetch('/api/passwords', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create password');
        return await response.json();
    } catch (error) {
        console.error('Error creating password:', error);
        showError('Failed to create password');
        throw error;
    }
}

async function updatePassword(id, data) {
    try {
        const response = await fetch(`/api/passwords/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update password');
        return await response.json();
    } catch (error) {
        console.error('Error updating password:', error);
        showError('Failed to update password');
        throw error;
    }
}

async function deletePassword(id) {
    try {
        const response = await fetch(`/api/passwords/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete password');
        return await response.json();
    } catch (error) {
        console.error('Error deleting password:', error);
        showError('Failed to delete password');
        throw error;
    }
}

async function generatePasswordAPI(options) {
    try {
        const response = await fetch('/api/passwords/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options)
        });
        if (!response.ok) throw new Error('Failed to generate password');
        const data = await response.json();
        return data.password;
    } catch (error) {
        console.error('Error generating password:', error);
        showError('Failed to generate password');
        throw error;
    }
}

// UI functions
function renderPasswords() {
    if (passwords.length === 0) {
        passwordList.innerHTML = `
            <div class="empty-state">
                <h3>No passwords yet</h3>
                <p>Click "Add Password" to get started</p>
            </div>
        `;
        return;
    }

    passwordList.innerHTML = passwords.map(password => `
        <div class="password-card">
            <div class="password-card-header">
                <div>
                    <div class="password-card-title">${escapeHtml(password.title)}</div>
                </div>
                <div class="password-card-actions">
                    <button class="btn-icon" onclick="editPassword('${password.id}')" title="Edit">✏️</button>
                    <button class="btn-icon" onclick="confirmDelete('${password.id}')" title="Delete">🗑️</button>
                </div>
            </div>
            ${password.username ? `
                <div class="password-card-field">
                    <label>Username</label>
                    <div class="value">${escapeHtml(password.username)}</div>
                </div>
            ` : ''}
            <div class="password-card-field">
                <label>Password</label>
                <div class="password-value ${passwordVisible[password.id] ? '' : 'hidden'}" id="pwd-${password.id}">
                    ${escapeHtml(password.password)}
                </div>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                    <button class="btn btn-secondary" style="font-size: 0.85rem; padding: 0.5rem 1rem;" onclick="togglePasswordVisibility('${password.id}')">
                        ${passwordVisible[password.id] ? '👁️ Hide' : '👁️ Show'}
                    </button>
                    <button class="btn btn-secondary" style="font-size: 0.85rem; padding: 0.5rem 1rem;" onclick="copyPassword('${password.id}')">
                        📋 Copy
                    </button>
                </div>
            </div>
            ${password.url ? `
                <div class="password-card-field">
                    <label>URL</label>
                    <div class="value">
                        <a href="${escapeHtml(password.url)}" target="_blank" rel="noopener noreferrer">
                            ${escapeHtml(password.url)}
                        </a>
                    </div>
                </div>
            ` : ''}
            ${password.notes ? `
                <div class="password-card-field">
                    <label>Notes</label>
                    <div class="value">${escapeHtml(password.notes)}</div>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


function showModal(modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}


function openGeneratorModal() {
    showModal(generatorModal);
    generateNewPassword();
}

async function generateNewPassword() {
    const length = parseInt(genLength.value);
    const options = {
        length: length,
        include_uppercase: document.getElementById('genUppercase').checked,
        include_lowercase: document.getElementById('genLowercase').checked,
        include_numbers: document.getElementById('genNumbers').checked,
        include_symbols: document.getElementById('genSymbols').checked
    };
    
    try {
        const password = await generatePasswordAPI(options);
        generatedPassword.value = password;
    } catch (error) {
        console.error('Error generating password:', error);
    }
}

function useGeneratedPassword() {
    const password = generatedPassword.value;
    if (password) {
        document.getElementById('password').value = password;
        hideModal(generatorModal);
    }
}


function togglePasswordVisibility(id) {
    passwordVisible[id] = !passwordVisible[id];
    const element = document.getElementById(`pwd-${id}`);
    if (element) {
        element.classList.toggle('hidden');
    }
    renderPasswords();
}

function togglePasswordField() {
    const passwordInput = document.getElementById('password');
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
}


async function editPassword(id) {
    const password = passwords.find(p => p.id === id);
    if (password) {
        openPasswordModal(password);
        smoothScrollTo(passwordModal);
    }
}

async function confirmDelete(id) {
    if (confirm('Are you sure you want to delete this password?')) {
        try {
            await deletePassword(id);
            await loadPasswords();
        } catch (error) {
            console.error('Error deleting password:', error);
        }
    }
}

async function loadPasswords() {
    passwordList.innerHTML = '<div class="loading">Loading passwords...</div>';
    const search = searchInput.value.trim();
    passwords = await fetchPasswords(search);
    renderPasswords();
}

// Event listeners
addBtn.addEventListener('click', () => openPasswordModal());

closeModal.addEventListener('click', () => hideModal(passwordModal));
closeGeneratorModal.addEventListener('click', () => hideModal(generatorModal));
cancelBtn.addEventListener('click', () => hideModal(passwordModal));

passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        title: document.getElementById('title').value.trim(),
        username: document.getElementById('username').value.trim() || null,
        password: document.getElementById('password').value,
        url: document.getElementById('url').value.trim() || null,
        notes: document.getElementById('notes').value.trim() || null
    };
    
    try {
        if (editingId) {
            await updatePassword(editingId, data);
        } else {
            await createPassword(data);
        }
        hideModal(passwordModal);
        await loadPasswords();
    } catch (error) {
        console.error('Error saving password:', error);
    }
});

searchInput.addEventListener('input', debounce(() => {
    loadPasswords();
}, 300));

togglePassword.addEventListener('click', togglePasswordField);
generatePasswordBtn.addEventListener('click', openGeneratorModal);
useGeneratedBtn.addEventListener('click', useGeneratedPassword);
regenerateBtn.addEventListener('click', generateNewPassword);
copyGeneratedBtn.addEventListener('click', copyGeneratedPassword);

genLength.addEventListener('input', (e) => {
    lengthValue.textContent = e.target.value;
});

// Close modals when clicking outside
passwordModal.addEventListener('click', (e) => {
    if (e.target === passwordModal) {
        hideModal(passwordModal);
    }
});

generatorModal.addEventListener('click', (e) => {
    if (e.target === generatorModal) {
        hideModal(generatorModal);
    }
});

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Theme management
function detectTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
}

function applyTheme() {
    const root = document.documentElement;
    if (theme === 'auto') {
        const detectedTheme = detectTheme();
        root.setAttribute('data-theme', detectedTheme);
    } else {
        root.setAttribute('data-theme', theme);
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'auto';
    theme = savedTheme;
    applyTheme();
    
    // Listen for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (theme === 'auto') {
            applyTheme();
        }
    });
}

// Smooth scroll behavior
function smoothScrollTo(element) {
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Enhanced showError with better UX
function showError(message) {
    // Create a toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: var(--card-bg);
        color: var(--text-primary);
        padding: 1rem 1.5rem;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        border: 1px solid var(--border-color);
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
        font-weight: 500;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Add CSS animations for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Enhanced copy feedback
function copyPassword(id) {
    const password = passwords.find(p => p.id === id);
    if (password) {
        navigator.clipboard.writeText(password.password).then(() => {
            showError('✓ Password copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
            showError('Failed to copy password');
        });
    }
}

function copyGeneratedPassword() {
    generatedPassword.select();
    navigator.clipboard.writeText(generatedPassword.value).then(() => {
        showError('✓ Password copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showError('Failed to copy password');
    });
}

// Enhanced modal animations
function openPasswordModal(entry = null) {
    editingId = entry ? entry.id : null;
    document.getElementById('modalTitle').textContent = entry ? 'Edit Password' : 'Add Password';
    
    if (entry) {
        document.getElementById('entryId').value = entry.id;
        document.getElementById('title').value = entry.title || '';
        document.getElementById('username').value = entry.username || '';
        document.getElementById('password').value = entry.password || '';
        document.getElementById('url').value = entry.url || '';
        document.getElementById('notes').value = entry.notes || '';
    } else {
        passwordForm.reset();
        document.getElementById('entryId').value = '';
    }
    
    showModal(passwordModal);
    // Focus first input for better UX
    setTimeout(() => {
        document.getElementById('title').focus();
    }, 100);
}

// Make functions available globally for inline onclick handlers
window.togglePasswordVisibility = togglePasswordVisibility;
window.copyPassword = copyPassword;
window.editPassword = editPassword;
window.confirmDelete = confirmDelete;

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape to close modals
    if (e.key === 'Escape') {
        if (passwordModal.classList.contains('active')) {
            hideModal(passwordModal);
        }
        if (generatorModal.classList.contains('active')) {
            hideModal(generatorModal);
        }
    }
    
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Ctrl/Cmd + N to add new password
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (!passwordModal.classList.contains('active')) {
            openPasswordModal();
        }
    }
});

// Initialize
initTheme();
loadPasswords();

// Smooth scroll on page load if needed
window.addEventListener('load', () => {
    if (window.location.hash) {
        const element = document.querySelector(window.location.hash);
        if (element) {
            setTimeout(() => smoothScrollTo(element), 100);
        }
    }
});
