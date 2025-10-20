# 🔐 CipherNest - Secure Offline Password Manager

**CipherNest** is a modern, secure, and fully offline password manager built with HTML, CSS, and JavaScript. All your passwords are encrypted client-side and never leave your browser.

![CipherNest](https://img.shields.io/badge/Version-1.0.0-blue)
![Security](https://img.shields.io/badge/Security-AES--GCM--256-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🔒 Security First
- **Client-Side Encryption**: AES-GCM 256-bit encryption using Web Crypto API
- **Zero-Knowledge Architecture**: Only you know your master password
- **PBKDF2 Key Derivation**: 100,000 iterations for robust password hashing
- **Auto-Lock**: Session timeout after 5 minutes of inactivity
- **Auto-Clear Clipboard**: Passwords cleared from clipboard after 30 seconds
- **No External Dependencies**: Works completely offline

### 💾 Password Management
- **Add, Edit, Delete**: Full CRUD operations for password entries
- **Encrypted Storage**: All data encrypted before saving to localStorage
- **Search Functionality**: Real-time search across all password fields
- **Password Generator**: Generate secure random passwords with customizable options
- **Export/Import**: Backup and restore your encrypted vault

### 🎨 User Experience
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Mobile-Friendly**: Works seamlessly on all devices
- **Toast Notifications**: User-friendly feedback for all actions
- **Password Strength Indicator**: Visual feedback on password security
- **Date Formatting**: Human-readable timestamps

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server or installation required!

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/jatin-yadav05/CipherNest.git
cd CipherNest
```

2. **Open in browser**
```bash
# Simply open index.html in your browser
# Or use a local server:
python -m http.server 8000
# Then visit: http://localhost:8000
```

### First Time Setup

1. Open `index.html` in your browser
2. Click "Create New Vault"
3. Set a strong master password (minimum 8 characters)
4. Your vault is ready to use!

## 📖 Usage Guide

### Creating Your First Password

1. **Login** with your master password
2. Click **"+ Add Password"**
3. Fill in the details:
   - Website/Service Name (required)
   - Website URL (optional)
   - Username/Email (required)
   - Password (required)
   - Notes (optional)
4. Click **"Generate"** for a secure random password
5. Click **"Save Password"**

### Managing Passwords

- **Search**: Type in the search bar to filter passwords
- **Copy**: Click copy icons to copy username or password
- **Edit**: Click the edit icon on any password card
- **Delete**: Click delete button with confirmation

### Password Generator

1. Click **"Generate"** button in the add/edit form
2. Customize options:
   - Length (8-64 characters)
   - Include Uppercase Letters
   - Include Lowercase Letters
   - Include Numbers
   - Include Symbols
3. Click **"Generate Password"**
4. Click **"Copy"** to use the password

### Locking the Vault

- Click **"Lock Vault"** button to secure your passwords
- Vault auto-locks after 5 minutes of inactivity
- Re-enter master password to unlock

## 🏗️ Project Structure

```
CipherNest/
├── index.html          # Main HTML file with UI structure
├── app.js              # Core application logic
├── instructions.md     # Project specifications
└── README.md          # This file
```

## 🔧 Technical Details

### Encryption
- **Algorithm**: AES-GCM (Advanced Encryption Standard - Galois/Counter Mode)
- **Key Size**: 256 bits
- **Key Derivation**: PBKDF2 with SHA-256, 100,000 iterations
- **IV**: Random 12-byte initialization vector for each encryption

### Storage
- **Method**: Browser localStorage
- **Format**: JSON with encrypted data and IV
- **Capacity**: ~5-10MB depending on browser

### Security Features
1. **Master Password Hashing**: Never stored in plain text
2. **Session Management**: Secure token-based authentication
3. **Encryption Keys**: Derived from master password, never stored
4. **Auto-Lock**: Prevents unauthorized access
5. **Clipboard Auto-Clear**: Reduces exposure risk
6. **XSS Prevention**: HTML escaping for all user inputs

## 🎯 Browser Compatibility

| Browser | Supported | Version |
|---------|-----------|---------|
| Chrome  | ✅ | 60+ |
| Firefox | ✅ | 54+ |
| Safari  | ✅ | 11+ |
| Edge    | ✅ | 79+ |

## ⚠️ Important Notes

### Security Considerations
1. **Master Password**: Choose a strong, unique master password
2. **Browser Storage**: Data stored in localStorage can be accessed by browser extensions
3. **Device Security**: Ensure your device is secure and malware-free
4. **No Cloud Sync**: Passwords are not synced across devices
5. **Backup Regularly**: Export your vault periodically

### Limitations
- No cloud synchronization
- No mobile app (web-only)
- Limited to single browser profile
- No password sharing features
- No two-factor authentication

## 🛠️ Development

### Technologies Used
- **HTML5**: Structure and semantics
- **Tailwind CSS**: Styling and responsive design
- **Vanilla JavaScript**: Core functionality
- **Web Crypto API**: Encryption and security

### Key Components

1. **Master Password System** (`handleLogin`, `handleSetup`)
   - User authentication
   - Password validation
   - Vault initialization

2. **Encryption System** (`encryptVault`, `decryptVault`)
   - AES-GCM encryption
   - Key derivation
   - Data transformation

3. **Storage System** (`loadPasswords`, `savePasswords`)
   - CRUD operations
   - Search functionality
   - Import/export

4. **Password Generator** (`generateSecurePassword`)
   - Cryptographically secure random generation
   - Customizable character sets
   - Fisher-Yates shuffle

5. **UI Components** (`displayPasswords`, `createPasswordCard`)
   - Dynamic rendering
   - Modal management
   - User interactions

## 🔄 Backup & Restore

### Export Your Vault
```javascript
// Coming soon: Export functionality
// Data will be exported as JSON with encryption metadata
```

### Import Vault
```javascript
// Coming soon: Import functionality
// Import encrypted vault from JSON file
```

## 🐛 Known Issues

- None at the moment! Report issues on GitHub.

## 🗺️ Roadmap

- [ ] Password strength visualization
- [ ] Password history tracking
- [ ] Secure password sharing
- [ ] Browser extension
- [ ] Mobile responsive improvements
- [ ] Dark mode theme
- [ ] Multi-language support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👏 Acknowledgments

- Web Crypto API for robust encryption
- Tailwind CSS for beautiful styling
- Modern browser vendors for security features

## 📧 Contact

**Jatin Yadav** - [@jatin-yadav05](https://github.com/jatin-yadav05)

Project Link: [https://github.com/jatin-yadav05/CipherNest](https://github.com/jatin-yadav05/CipherNest)

---

**⚠️ Disclaimer**: CipherNest is provided as-is for educational and personal use. While it implements industry-standard encryption, always maintain multiple backups of important passwords and use at your own risk.

**🔐 Stay Secure!** Remember: Your master password is the key to your vault. Choose wisely, and never share it!
