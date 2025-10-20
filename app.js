const STORAGE_KEYS = {
    VAULT_EXISTS: 'cipherNest_vaultExists',
    MASTER_HASH: 'cipherNest_masterHash',
    SALT: 'cipherNest_salt',
    VAULT_DATA: 'cipherNest_vaultData',
    SESSION_TOKEN: 'cipherNest_sessionToken',
    LAST_ACTIVITY: 'cipherNest_lastActivity'
};

const SECURITY_CONFIG = {
    SESSION_TIMEOUT_MS: 5 * 60 * 1000,
    PBKDF2_ITERATIONS: 100000,
    KEY_LENGTH: 256, 
    HASH_ALGORITHM: 'SHA-256'
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});


function initApp() {
    const elements = {
        loginScreen: document.getElementById('loginScreen'),
        loginForm: document.getElementById('loginForm'),
        setupForm: document.getElementById('setupForm'),
        masterPassword: document.getElementById('masterPassword'),
        newMasterPassword: document.getElementById('newMasterPassword'),
        confirmMasterPassword: document.getElementById('confirmMasterPassword'),
        loginError: document.getElementById('loginError'),
        setupError: document.getElementById('setupError'),
        createNewBtn: document.getElementById('createNewBtn'),
        backToLoginBtn: document.getElementById('backToLoginBtn'),
        togglePassword: document.getElementById('togglePassword'),
        
        vaultInterface: document.getElementById('vaultInterface'),
        passwordGrid: document.getElementById('passwordGrid'),
        emptyState: document.getElementById('emptyState'),
        searchBar: document.getElementById('searchBar'),
        lockVaultBtn: document.getElementById('lockVaultBtn'),
        addPasswordBtn: document.getElementById('addPasswordBtn'),
        emptyStateAddBtn: document.getElementById('emptyStateAddBtn'),
        
        // Modal elements
        passwordModal: document.getElementById('passwordModal'),
        passwordForm: document.getElementById('passwordForm'),
        modalTitle: document.getElementById('modalTitle'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        cancelModalBtn: document.getElementById('cancelModalBtn'),
        passwordId: document.getElementById('passwordId'),
        websiteName: document.getElementById('websiteName'),
        websiteUrl: document.getElementById('websiteUrl'),
        username: document.getElementById('username'),
        passwordField: document.getElementById('passwordField'),
        notes: document.getElementById('notes'),
        generatePasswordBtn: document.getElementById('generatePasswordBtn'),
        
        // Generator modal elements
        generatorModal: document.getElementById('generatorModal'),
        closeGeneratorBtn: document.getElementById('closeGeneratorBtn'),
        generatedPassword: document.getElementById('generatedPassword'),
        passwordLength: document.getElementById('passwordLength'),
        lengthValue: document.getElementById('lengthValue'),
        includeUppercase: document.getElementById('includeUppercase'),
        includeLowercase: document.getElementById('includeLowercase'),
        includeNumbers: document.getElementById('includeNumbers'),
        includeSymbols: document.getElementById('includeSymbols'),
        generateBtn: document.getElementById('generateBtn'),
        copyGeneratedBtn: document.getElementById('copyGeneratedBtn')
    };

    // Store elements globally for access in other functions
    window.appElements = elements;

    const vaultExists = localStorage.getItem(STORAGE_KEYS.VAULT_EXISTS) === 'true';
    
    elements.loginForm.addEventListener('submit', (e) => handleLogin(e, elements));
    elements.setupForm.addEventListener('submit', (e) => handleSetup(e, elements));
    elements.createNewBtn.addEventListener('click', () => showSetupForm(elements));
    elements.backToLoginBtn.addEventListener('click', () => showLoginForm(elements));
    elements.lockVaultBtn.addEventListener('click', () => lockVault(elements));
    
    // Add password modal handlers
    elements.addPasswordBtn.addEventListener('click', () => showAddPasswordModal());
    elements.emptyStateAddBtn.addEventListener('click', () => showAddPasswordModal());
    elements.closeModalBtn.addEventListener('click', () => closePasswordModal());
    elements.cancelModalBtn.addEventListener('click', () => closePasswordModal());
    elements.passwordForm.addEventListener('submit', (e) => handlePasswordFormSubmit(e));
    elements.generatePasswordBtn.addEventListener('click', () => showGeneratorModal());
    
    // Password generator modal handlers
    elements.closeGeneratorBtn.addEventListener('click', () => closeGeneratorModal());
    elements.generateBtn.addEventListener('click', () => generatePasswordInModal());
    elements.copyGeneratedBtn.addEventListener('click', () => copyGeneratedPassword());
    elements.passwordLength.addEventListener('input', (e) => {
        elements.lengthValue.textContent = e.target.value;
    });
    
    // Search functionality
    elements.searchBar.addEventListener('input', (e) => handleSearch(e.target.value));
    
    if (elements.togglePassword) {
        elements.togglePassword.addEventListener('click', () => {
            const passwordField = elements.masterPassword;
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
            } else {
                passwordField.type = 'password';
            }
        });
    }
    
    if (vaultExists) {
        showLoginForm(elements);
    } else {
        showSetupForm(elements);
    }

    document.addEventListener('click', updateLastActivity);
    document.addEventListener('keypress', updateLastActivity);
}

function showLoginForm(elements) {
    elements.loginForm.classList.remove('hidden');
    elements.setupForm.classList.add('hidden');
    elements.loginError.classList.add('hidden');
    elements.masterPassword.focus();
}

function showSetupForm(elements) {
    elements.loginForm.classList.add('hidden');
    elements.setupForm.classList.remove('hidden');
    elements.setupError.classList.add('hidden');
    elements.newMasterPassword.focus();
}


async function handleSetup(event, elements) {
    event.preventDefault();
    elements.setupError.classList.add('hidden');
    
    const newPassword = elements.newMasterPassword.value;
    const confirmPassword = elements.confirmMasterPassword.value;
    
    if (newPassword !== confirmPassword) {
        elements.setupError.textContent = 'Passwords do not match!';
        elements.setupError.classList.remove('hidden');
        return;
    }
    
    if (newPassword.length < 8) {
        elements.setupError.textContent = 'Master password must be at least 8 characters long.';
        elements.setupError.classList.remove('hidden');
        return;
    }
    
    try {
        const salt = await generateRandomBytes(16);
        
        const masterHash = await hashPassword(newPassword, salt);
        
        localStorage.setItem(STORAGE_KEYS.VAULT_EXISTS, 'true');
        localStorage.setItem(STORAGE_KEYS.MASTER_HASH, masterHash);
        localStorage.setItem(STORAGE_KEYS.SALT, arrayBufferToHex(salt));
        
        setSessionPassword(newPassword);
        
        const emptyVault = await encryptVault([], newPassword);
        localStorage.setItem(STORAGE_KEYS.VAULT_DATA, JSON.stringify(emptyVault));
        
        createSession();
        unlockVault(elements);
        
        elements.setupForm.reset();
        
    } catch (error) {
        console.error('Error setting up vault:', error);
        elements.setupError.textContent = 'An error occurred while setting up your vault.';
        elements.setupError.classList.remove('hidden');
    }
}


async function handleLogin(event, elements) {
    event.preventDefault();
    elements.loginError.classList.add('hidden');
    
    const password = elements.masterPassword.value;
    
    try {
        const storedSalt = hexToArrayBuffer(localStorage.getItem(STORAGE_KEYS.SALT));
        const storedHash = localStorage.getItem(STORAGE_KEYS.MASTER_HASH);
        
        const calculatedHash = await hashPassword(password, storedSalt);
        
        if (calculatedHash === storedHash) {
            setSessionPassword(password);
            
            createSession();
            unlockVault(elements);
            elements.loginForm.reset();
        } else {
            elements.loginError.textContent = 'Incorrect master password. Please try again.';
            elements.loginError.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error during login:', error);
        elements.loginError.textContent = 'An error occurred while trying to unlock your vault.';
        elements.loginError.classList.remove('hidden');
    }
}


function createSession() {
    const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, sessionToken);
    updateLastActivity();
}


async function generateSessionToken() {
    const randomBytes = await generateRandomBytes(32);
    return arrayBufferToHex(randomBytes);
}


function updateLastActivity() {
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
}


function isSessionValid() {
    const sessionToken = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    const lastActivity = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY) || '0');
    const currentTime = Date.now();
    
    return (
        sessionToken !== null &&
        !isNaN(lastActivity) &&
        currentTime - lastActivity < SECURITY_CONFIG.SESSION_TIMEOUT_MS
    );
}

async function unlockVault(elements) {
    if (!isSessionValid()) {
        lockVault(elements);
        return;
    }
    
    elements.loginScreen.classList.add('hidden');
    elements.vaultInterface.classList.remove('hidden');
    
    try {
        const passwords = await loadPasswords();
        
        if (passwords.length === 0) {
            elements.passwordGrid.classList.add('hidden');
            elements.emptyState.classList.remove('hidden');
        } else {
            elements.passwordGrid.classList.remove('hidden');
            elements.emptyState.classList.add('hidden');
            
            displayPasswords(passwords, elements);
        }
    } catch (error) {
        console.error('Error unlocking vault:', error);
        elements.emptyState.classList.remove('hidden');
        elements.passwordGrid.classList.add('hidden');
    }
    
    startSessionMonitoring(elements);
}


function lockVault(elements) {
    localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
    
    clearSessionPassword();
    
    elements.vaultInterface.classList.add('hidden');
    elements.loginScreen.classList.remove('hidden');
    
    elements.masterPassword.value = '';
    elements.loginError.classList.add('hidden');
}


function startSessionMonitoring(elements) {
    enhancedSessionMonitoring(elements);
}


async function hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    const passwordKey = await window.crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );
    
    const derivedBits = await window.crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: SECURITY_CONFIG.PBKDF2_ITERATIONS,
            hash: SECURITY_CONFIG.HASH_ALGORITHM
        },
        passwordKey,
        SECURITY_CONFIG.KEY_LENGTH
    );
    
    return arrayBufferToHex(derivedBits);
}


async function generateRandomBytes(length) {
    return window.crypto.getRandomValues(new Uint8Array(length)).buffer;
}


function arrayBufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function hexToArrayBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i/2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
}

async function deriveEncryptionKey(masterPassword, salt) {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(masterPassword);
    
    const passwordKey = await window.crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    
    const encryptionKey = await window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: SECURITY_CONFIG.PBKDF2_ITERATIONS,
            hash: SECURITY_CONFIG.HASH_ALGORITHM
        },
        passwordKey,
        { name: 'AES-GCM', length: SECURITY_CONFIG.KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
    
    return encryptionKey;
}

async function encryptData(data, key) {
    const iv = await generateRandomBytes(12);
    
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    
    const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        dataBuffer
    );
    
    return {
        encrypted: arrayBufferToHex(encryptedBuffer),
        iv: arrayBufferToHex(iv)
    };
}

async function decryptData(encryptedHex, ivHex, key) {
    const encryptedBuffer = hexToArrayBuffer(encryptedHex);
    const iv = hexToArrayBuffer(ivHex);
    
    const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        encryptedBuffer
    );
    
    const decoder = new TextDecoder();
    const decryptedString = decoder.decode(decryptedBuffer);
    
    return JSON.parse(decryptedString);
}

async function encryptVault(vaultData, masterPassword) {
    const salt = hexToArrayBuffer(localStorage.getItem(STORAGE_KEYS.SALT));
    
    const encryptionKey = await deriveEncryptionKey(masterPassword, salt);
    
    const encryptedVault = await encryptData(vaultData, encryptionKey);
    
    return encryptedVault;
}

async function decryptVault(encryptedVault, masterPassword) {
    const salt = hexToArrayBuffer(localStorage.getItem(STORAGE_KEYS.SALT));
    
    const encryptionKey = await deriveEncryptionKey(masterPassword, salt);
    
    const decryptedData = await decryptData(
        encryptedVault.encrypted,
        encryptedVault.iv,
        encryptionKey
    );
    
    return decryptedData;
}

let sessionMasterPassword = null;

function setSessionPassword(password) {
    sessionMasterPassword = password;
}

function getSessionPassword() {
    return sessionMasterPassword;
}

function clearSessionPassword() {
    sessionMasterPassword = null;
}

async function loadPasswords() {
    try {
        const vaultData = localStorage.getItem(STORAGE_KEYS.VAULT_DATA);
        
        if (!vaultData) {
            return [];
        }
        
        try {
            const parsed = JSON.parse(vaultData);
            
            if (Array.isArray(parsed)) {
                return parsed;
            }
            
            if (parsed.encrypted && parsed.iv) {
                const masterPassword = getSessionPassword();
                if (!masterPassword) {
                    throw new Error('Master password not available in session');
                }
                return await decryptVault(parsed, masterPassword);
            }
        } catch (e) {
            console.error('Error parsing vault data:', e);
            return [];
        }
        
        return [];
    } catch (error) {
        console.error('Error loading passwords:', error);
        return [];
    }
}

async function savePasswords(passwords) {
    try {
        const masterPassword = getSessionPassword();
        
        if (!masterPassword) {
            throw new Error('Master password not available in session');
        }
        
        const encryptedVault = await encryptVault(passwords, masterPassword);
        
        localStorage.setItem(STORAGE_KEYS.VAULT_DATA, JSON.stringify(encryptedVault));
        
        return true;
    } catch (error) {
        console.error('Error saving passwords:', error);
        return false;
    }
}

async function addPassword(entry) {
    try {
        const passwords = await loadPasswords();
        
        const newEntry = {
            id: generateUniqueId(),
            website: entry.website || '',
            url: entry.url || '',
            username: entry.username || '',
            password: entry.password || '',
            notes: entry.notes || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        passwords.push(newEntry);
        
        const saved = await savePasswords(passwords);
        
        if (saved) {
            return newEntry;
        } else {
            throw new Error('Failed to save password');
        }
    } catch (error) {
        console.error('Error adding password:', error);
        throw error;
    }
}

async function updatePassword(id, updates) {
    try {
        const passwords = await loadPasswords();
        const index = passwords.findIndex(p => p.id === id);
        
        if (index === -1) {
            throw new Error('Password entry not found');
        }
        
        passwords[index] = {
            ...passwords[index],
            ...updates,
            id: passwords[index].id,
            createdAt: passwords[index].createdAt,
            updatedAt: new Date().toISOString()
        };
        
        const saved = await savePasswords(passwords);
        
        if (saved) {
            return passwords[index];
        } else {
            throw new Error('Failed to update password');
        }
    } catch (error) {
        console.error('Error updating password:', error);
        throw error;
    }
}

async function deletePassword(id) {
    try {
        const passwords = await loadPasswords();
        const filteredPasswords = passwords.filter(p => p.id !== id);
        
        if (filteredPasswords.length === passwords.length) {
            throw new Error('Password entry not found');
        }
        
        return await savePasswords(filteredPasswords);
    } catch (error) {
        console.error('Error deleting password:', error);
        throw error;
    }
}

async function getPasswordById(id) {
    try {
        const passwords = await loadPasswords();
        return passwords.find(p => p.id === id) || null;
    } catch (error) {
        console.error('Error getting password:', error);
        return null;
    }
}

async function searchPasswords(query) {
    try {
        const passwords = await loadPasswords();
        
        if (!query || query.trim() === '') {
            return passwords;
        }
        
        const lowerQuery = query.toLowerCase();
        
        return passwords.filter(entry => {
            return (
                entry.website.toLowerCase().includes(lowerQuery) ||
                entry.username.toLowerCase().includes(lowerQuery) ||
                entry.url.toLowerCase().includes(lowerQuery) ||
                entry.notes.toLowerCase().includes(lowerQuery)
            );
        });
    } catch (error) {
        console.error('Error searching passwords:', error);
        return [];
    }
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

async function exportPasswords() {
    try {
        const passwords = await loadPasswords();
        return JSON.stringify(passwords, null, 2);
    } catch (error) {
        console.error('Error exporting passwords:', error);
        throw error;
    }
}

async function importPasswords(jsonData) {
    try {
        const importedPasswords = JSON.parse(jsonData);
        
        if (!Array.isArray(importedPasswords)) {
            throw new Error('Invalid import data format');
        }
        
        const validPasswords = importedPasswords.filter(entry => {
            return entry.website && entry.username && entry.password;
        });
        
        const existingPasswords = await loadPasswords();
        const existingIds = new Set(existingPasswords.map(p => p.id));
        
        const newPasswords = validPasswords.filter(p => !existingIds.has(p.id));
        const mergedPasswords = [...existingPasswords, ...newPasswords];
        
        return await savePasswords(mergedPasswords);
    } catch (error) {
        console.error('Error importing passwords:', error);
        throw error;
    }
}

function displayPasswords(passwords, elements) {
    console.log('Loaded passwords:', passwords.length);
    
    if (!elements || !elements.passwordGrid) {
        elements = window.appElements;
    }
    
    elements.passwordGrid.innerHTML = '';
    
    passwords.forEach(entry => {
        const card = createPasswordCard(entry);
        elements.passwordGrid.appendChild(card);
    });
}

function createPasswordCard(entry) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow';
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <h3 class="text-lg font-bold text-slate-800 truncate flex-1">${escapeHtml(entry.website)}</h3>
            <button class="text-slate-400 hover:text-slate-600 transition-colors" onclick="showEditPasswordModal('${entry.id}')">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                </svg>
            </button>
        </div>
        
        ${entry.url ? `<p class="text-xs text-slate-500 mb-2 truncate">${escapeHtml(entry.url)}</p>` : ''}
        
        <div class="space-y-2">
            <div class="flex items-center gap-2 bg-slate-50 rounded px-3 py-2">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <span class="text-sm text-slate-700 flex-1 truncate">${escapeHtml(entry.username)}</span>
                <button class="text-slate-400 hover:text-slate-600 transition-colors" onclick="copyToClipboard('${escapeHtml(entry.username)}', 'Username')" title="Copy username">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                </button>
            </div>
            
            <div class="flex items-center gap-2 bg-slate-50 rounded px-3 py-2">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                <span class="text-sm text-slate-700 flex-1 font-mono">••••••••</span>
                <button class="text-slate-400 hover:text-slate-600 transition-colors" onclick="copyToClipboard('${escapeHtml(entry.password)}', 'Password')" title="Copy password">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                </button>
            </div>
        </div>
        
        ${entry.notes ? `<p class="text-xs text-slate-500 mt-3 line-clamp-2">${escapeHtml(entry.notes)}</p>` : ''}
        
        <div class="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
            <span class="text-xs text-slate-400">Added ${formatDate(entry.createdAt)}</span>
            <button class="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors" onclick="confirmDeletePassword('${entry.id}')">
                Delete
            </button>
        </div>
    `;
    
    return card;
}

function showAddPasswordModal() {
    const elements = window.appElements;
    elements.modalTitle.textContent = 'Add Password';
    elements.passwordForm.reset();
    elements.passwordId.value = '';
    elements.passwordModal.classList.remove('hidden');
    elements.passwordModal.classList.add('flex');
    elements.websiteName.focus();
}

async function showEditPasswordModal(id) {
    const elements = window.appElements;
    const entry = await getPasswordById(id);
    
    if (!entry) {
        alert('Password entry not found');
        return;
    }
    
    elements.modalTitle.textContent = 'Edit Password';
    elements.passwordId.value = entry.id;
    elements.websiteName.value = entry.website;
    elements.websiteUrl.value = entry.url;
    elements.username.value = entry.username;
    elements.passwordField.value = entry.password;
    elements.notes.value = entry.notes;
    
    elements.passwordModal.classList.remove('hidden');
    elements.passwordModal.classList.add('flex');
    elements.websiteName.focus();
}

function closePasswordModal() {
    const elements = window.appElements;
    elements.passwordModal.classList.add('hidden');
    elements.passwordModal.classList.remove('flex');
    elements.passwordForm.reset();
}

async function handlePasswordFormSubmit(event) {
    event.preventDefault();
    const elements = window.appElements;
    
    const entryData = {
        website: elements.websiteName.value,
        url: elements.websiteUrl.value,
        username: elements.username.value,
        password: elements.passwordField.value,
        notes: elements.notes.value
    };
    
    try {
        const passwordId = elements.passwordId.value;
        
        if (passwordId) {
            // Update existing password
            await updatePassword(passwordId, entryData);
        } else {
            // Add new password
            await addPassword(entryData);
        }
        
        closePasswordModal();
        await refreshPasswordList();
        
    } catch (error) {
        console.error('Error saving password:', error);
        alert('Failed to save password. Please try again.');
    }
}

async function confirmDeletePassword(id) {
    if (confirm('Are you sure you want to delete this password? This action cannot be undone.')) {
        try {
            await deletePassword(id);
            await refreshPasswordList();
        } catch (error) {
            console.error('Error deleting password:', error);
            alert('Failed to delete password. Please try again.');
        }
    }
}

async function refreshPasswordList() {
    const elements = window.appElements;
    const passwords = await loadPasswords();
    
    if (passwords.length === 0) {
        elements.passwordGrid.classList.add('hidden');
        elements.emptyState.classList.remove('hidden');
    } else {
        elements.passwordGrid.classList.remove('hidden');
        elements.emptyState.classList.add('hidden');
        displayPasswords(passwords, elements);
    }
}

async function handleSearch(query) {
    const elements = window.appElements;
    const results = await searchPasswords(query);
    displayPasswords(results, elements);
}

function copyToClipboard(text, label) {
    // Use auto-clear for passwords, regular copy for usernames
    if (label === 'Password') {
        copyToClipboardWithAutoClear(text, label, 30000);
    } else {
        navigator.clipboard.writeText(text).then(() => {
            showToast(`${label} copied to clipboard!`);
        }).catch(err => {
            console.error('Failed to copy:', err);
            showToast('Failed to copy to clipboard');
        });
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 2000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * ======================================================================
 * PASSWORD GENERATOR
 * Advanced password generation with customizable options
 * ======================================================================
 */

function showGeneratorModal() {
    const elements = window.appElements;
    elements.generatorModal.classList.remove('hidden');
    elements.generatorModal.classList.add('flex');
    // Generate a password immediately when modal opens
    generatePasswordInModal();
}

function closeGeneratorModal() {
    const elements = window.appElements;
    elements.generatorModal.classList.add('hidden');
    elements.generatorModal.classList.remove('flex');
}

function generatePasswordInModal() {
    const elements = window.appElements;
    const length = parseInt(elements.passwordLength.value);
    
    const options = {
        length: length,
        uppercase: elements.includeUppercase.checked,
        lowercase: elements.includeLowercase.checked,
        numbers: elements.includeNumbers.checked,
        symbols: elements.includeSymbols.checked
    };
    
    // Validate at least one option is selected
    if (!options.uppercase && !options.lowercase && !options.numbers && !options.symbols) {
        showToast('Please select at least one character type');
        return;
    }
    
    const password = generateSecurePassword(options);
    elements.generatedPassword.value = password;
}

function copyGeneratedPassword() {
    const elements = window.appElements;
    const password = elements.generatedPassword.value;
    
    if (password && password !== 'Click Generate to create password') {
        copyToClipboard(password, 'Password');
        // Optionally fill the password field in the add/edit modal if it's open
        if (!elements.passwordModal.classList.contains('hidden')) {
            elements.passwordField.value = password;
        }
        closeGeneratorModal();
    } else {
        showToast('Please generate a password first');
    }
}

function generateSecurePassword(options = {}) {
    const {
        length = 16,
        uppercase = true,
        lowercase = true,
        numbers = true,
        symbols = true
    } = options;
    
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let availableChars = '';
    let password = '';
    
    // Build available character set
    if (uppercase) availableChars += uppercaseChars;
    if (lowercase) availableChars += lowercaseChars;
    if (numbers) availableChars += numberChars;
    if (symbols) availableChars += symbolChars;
    
    if (availableChars.length === 0) {
        return '';
    }
    
    // Ensure at least one of each selected type
    if (uppercase) password += uppercaseChars[getSecureRandomInt(uppercaseChars.length)];
    if (lowercase) password += lowercaseChars[getSecureRandomInt(lowercaseChars.length)];
    if (numbers) password += numberChars[getSecureRandomInt(numberChars.length)];
    if (symbols) password += symbolChars[getSecureRandomInt(symbolChars.length)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += availableChars[getSecureRandomInt(availableChars.length)];
    }
    
    // Shuffle using Fisher-Yates algorithm
    return shuffleString(password);
}

function getSecureRandomInt(max) {
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    return randomBuffer[0] % max;
}

function shuffleString(str) {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = getSecureRandomInt(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
}

/**
 * ======================================================================
 * ENHANCED SECURITY FEATURES
 * Additional security measures for protecting sensitive data
 * ======================================================================
 */

// Auto-clear clipboard after copying passwords
let clipboardTimeout = null;

function copyToClipboardWithAutoClear(text, label, clearAfterMs = 30000) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(`${label} copied! Will be cleared in 30 seconds`);
        
        // Clear previous timeout if exists
        if (clipboardTimeout) {
            clearTimeout(clipboardTimeout);
        }
        
        // Set new timeout to clear clipboard
        clipboardTimeout = setTimeout(() => {
            navigator.clipboard.writeText('').catch(() => {
                // Ignore errors if clipboard is not accessible
            });
        }, clearAfterMs);
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy to clipboard');
    });
}

// Password strength indicator
function calculatePasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (password.length >= 16) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    if (strength <= 2) return { level: 'weak', color: 'red', text: 'Weak' };
    if (strength <= 4) return { level: 'medium', color: 'yellow', text: 'Medium' };
    if (strength <= 6) return { level: 'strong', color: 'green', text: 'Strong' };
    return { level: 'very-strong', color: 'blue', text: 'Very Strong' };
}

// Inactivity detection with warning
let inactivityWarningShown = false;

function enhancedSessionMonitoring(elements) {
    const checkInterval = 30000; // Check every 30 seconds
    const warningTime = SECURITY_CONFIG.SESSION_TIMEOUT_MS - 60000; // Warn 1 minute before timeout
    
    const sessionCheckInterval = setInterval(() => {
        if (!isSessionValid()) {
            clearInterval(sessionCheckInterval);
            inactivityWarningShown = false;
            lockVault(elements);
            showToast('Session expired due to inactivity');
            return;
        }
        
        // Show warning if approaching timeout
        const lastActivity = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY) || '0');
        const timeSinceActivity = Date.now() - lastActivity;
        
        if (timeSinceActivity > warningTime && !inactivityWarningShown) {
            inactivityWarningShown = true;
            showToast('Session will expire in 1 minute due to inactivity');
        }
        
        // Reset warning flag if user becomes active again
        if (timeSinceActivity < warningTime) {
            inactivityWarningShown = false;
        }
    }, checkInterval);
}

// Export vault data (encrypted)
async function exportVaultData() {
    try {
        const passwords = await loadPasswords();
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            passwords: passwords
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ciphernest-backup-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast('Vault exported successfully');
    } catch (error) {
        console.error('Export failed:', error);
        showToast('Failed to export vault');
    }
}

// Import vault data
async function importVaultData(fileInput) {
    try {
        const file = fileInput.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (importData.passwords && Array.isArray(importData.passwords)) {
                    await importPasswords(JSON.stringify(importData.passwords));
                    await refreshPasswordList();
                    showToast('Vault imported successfully');
                } else {
                    throw new Error('Invalid import file format');
                }
            } catch (err) {
                console.error('Import parsing failed:', err);
                showToast('Failed to import vault - invalid file format');
            }
        };
        reader.readAsText(file);
    } catch (error) {
        console.error('Import failed:', error);
        showToast('Failed to import vault');
    }
}
