const STORAGE_KEYS = {
    VAULT_EXISTS: 'cipherNest_vaultExists',
    MASTER_HASH: 'cipherNest_masterHash',
    SALT: 'cipherNest_salt',
    VAULT_DATA: 'cipherNest_vaultData',
    SESSION_TOKEN: 'cipherNest_sessionToken',
    LAST_ACTIVITY: 'cipherNest_lastActivity'
};

const SECURITY_CONFIG = {
    SESSION_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes of inactivity before auto-lock
    PBKDF2_ITERATIONS: 100000,
    KEY_LENGTH: 256, 
    HASH_ALGORITHM: 'SHA-256'
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});


function initApp() {
    const elements = {
        // Login and Setup elements
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
        
        // Vault interface elements
        vaultInterface: document.getElementById('vaultInterface'),
        passwordGrid: document.getElementById('passwordGrid'),
        emptyState: document.getElementById('emptyState'),
        searchBar: document.getElementById('searchBar'),
        lockVaultBtn: document.getElementById('lockVaultBtn'),
        addPasswordBtn: document.getElementById('addPasswordBtn'),
        emptyStateAddBtn: document.getElementById('emptyStateAddBtn')
    };

    const vaultExists = localStorage.getItem(STORAGE_KEYS.VAULT_EXISTS) === 'true';
    
    elements.loginForm.addEventListener('submit', (e) => handleLogin(e, elements));
    elements.setupForm.addEventListener('submit', (e) => handleSetup(e, elements));
    elements.createNewBtn.addEventListener('click', () => showSetupForm(elements));
    elements.backToLoginBtn.addEventListener('click', () => showLoginForm(elements));
    elements.lockVaultBtn.addEventListener('click', () => lockVault(elements));
    
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
        
        const emptyVault = JSON.stringify([]);
        
        localStorage.setItem(STORAGE_KEYS.VAULT_EXISTS, 'true');
        localStorage.setItem(STORAGE_KEYS.MASTER_HASH, masterHash);
        localStorage.setItem(STORAGE_KEYS.SALT, arrayBufferToHex(salt));
        localStorage.setItem(STORAGE_KEYS.VAULT_DATA, emptyVault);
        
        // Store password in session for encryption/decryption
        setSessionPassword(newPassword);
        
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
            // Store password in session for encryption/decryption
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

function unlockVault(elements) {
    if (!isSessionValid()) {
        lockVault(elements);
        return;
    }
    
    elements.loginScreen.classList.add('hidden');
    elements.vaultInterface.classList.remove('hidden');
    
    const vaultData = localStorage.getItem(STORAGE_KEYS.VAULT_DATA);
    const passwords = vaultData ? JSON.parse(vaultData) : [];
    
    if (passwords.length === 0) {
        elements.passwordGrid.classList.add('hidden');
        elements.emptyState.classList.remove('hidden');
    } else {
        elements.passwordGrid.classList.remove('hidden');
        elements.emptyState.classList.add('hidden');
        
    }
    
    startSessionMonitoring(elements);
}


function lockVault(elements) {
    localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
    
    // Clear the session password from memory
    clearSessionPassword();
    
    elements.vaultInterface.classList.add('hidden');
    elements.loginScreen.classList.remove('hidden');
    
    elements.masterPassword.value = '';
    elements.loginError.classList.add('hidden');
}


function startSessionMonitoring(elements) {
    const sessionCheckInterval = setInterval(() => {
        if (!isSessionValid()) {
            clearInterval(sessionCheckInterval);
            lockVault(elements);
        }
    }, 30000);
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

/**
 * ======================================================================
 * ENCRYPTION/DECRYPTION SYSTEM
 * Using AES-GCM for secure encryption of password vault data
 * ======================================================================
 */

/**
 * Derive an encryption key from the master password
 * @param {string} masterPassword - The master password
 * @param {ArrayBuffer} salt - Salt for key derivation
 * @returns {Promise<CryptoKey>} - Derived encryption key
 */
async function deriveEncryptionKey(masterPassword, salt) {
    // Convert password to buffer
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(masterPassword);
    
    // Import password as a key material
    const passwordKey = await window.crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    
    // Derive an AES-GCM key from the password
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

/**
 * Encrypt data using AES-GCM
 * @param {string} data - The data to encrypt (will be JSON stringified)
 * @param {CryptoKey} key - The encryption key
 * @returns {Promise<Object>} - Object containing encrypted data and IV
 */
async function encryptData(data, key) {
    // Generate a random initialization vector (IV)
    const iv = await generateRandomBytes(12); // 12 bytes for GCM
    
    // Convert data to buffer
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    
    // Encrypt the data
    const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        dataBuffer
    );
    
    // Return encrypted data and IV as hex strings
    return {
        encrypted: arrayBufferToHex(encryptedBuffer),
        iv: arrayBufferToHex(iv)
    };
}

/**
 * Decrypt data using AES-GCM
 * @param {string} encryptedHex - The encrypted data as hex string
 * @param {string} ivHex - The initialization vector as hex string
 * @param {CryptoKey} key - The decryption key
 * @returns {Promise<any>} - The decrypted data (parsed from JSON)
 */
async function decryptData(encryptedHex, ivHex, key) {
    // Convert hex strings back to ArrayBuffers
    const encryptedBuffer = hexToArrayBuffer(encryptedHex);
    const iv = hexToArrayBuffer(ivHex);
    
    // Decrypt the data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        encryptedBuffer
    );
    
    // Convert buffer back to string and parse JSON
    const decoder = new TextDecoder();
    const decryptedString = decoder.decode(decryptedBuffer);
    
    return JSON.parse(decryptedString);
}

/**
 * Encrypt the entire vault data
 * @param {Array} vaultData - Array of password entries
 * @param {string} masterPassword - The master password
 * @returns {Promise<Object>} - Encrypted vault object
 */
async function encryptVault(vaultData, masterPassword) {
    // Get the salt from localStorage
    const salt = hexToArrayBuffer(localStorage.getItem(STORAGE_KEYS.SALT));
    
    // Derive encryption key from master password
    const encryptionKey = await deriveEncryptionKey(masterPassword, salt);
    
    // Encrypt the vault data
    const encryptedVault = await encryptData(vaultData, encryptionKey);
    
    return encryptedVault;
}

/**
 * Decrypt the entire vault data
 * @param {Object} encryptedVault - Encrypted vault object with encrypted and iv properties
 * @param {string} masterPassword - The master password
 * @returns {Promise<Array>} - Decrypted array of password entries
 */
async function decryptVault(encryptedVault, masterPassword) {
    // Get the salt from localStorage
    const salt = hexToArrayBuffer(localStorage.getItem(STORAGE_KEYS.SALT));
    
    // Derive encryption key from master password
    const encryptionKey = await deriveEncryptionKey(masterPassword, salt);
    
    // Decrypt the vault data
    const decryptedData = await decryptData(
        encryptedVault.encrypted,
        encryptedVault.iv,
        encryptionKey
    );
    
    return decryptedData;
}

/**
 * Store current master password in memory for the session (for encryption/decryption)
 * WARNING: This is kept in memory only during active session and cleared on lock
 */
let sessionMasterPassword = null;

/**
 * Set the session master password (called after successful login/setup)
 * @param {string} password - The master password
 */
function setSessionPassword(password) {
    sessionMasterPassword = password;
}

/**
 * Get the session master password
 * @returns {string|null} - The master password or null if not set
 */
function getSessionPassword() {
    return sessionMasterPassword;
}

/**
 * Clear the session master password from memory
 */
function clearSessionPassword() {
    sessionMasterPassword = null;
}