# Aarav HyperFortress Cipher (AHFC)

**Version: AHFCv1**  
Aarav HyperFortress Cipher (AHFC) is a robust and secure file encryption tool designed for local file protection with multiple security tiers. It uses modern cryptographic primitives (Argon2, AES-GCM, HMAC) and compression to provide integrity, confidentiality, and performance.

[![NPM Version](https://img.shields.io/npm/v/ahfc.svg)](https://www.npmjs.com/package/ahfc)  
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🔒 Key Features

- 🔐 **Multiple Security Modes** (`Lite`, `Normal`, `Beast`)
- 🧂 **Password-based encryption** using Argon2id
- 📦 **zlib compression** before encryption
- 🧠 **AES-256-GCM** mode with HMAC-SHA512 for advanced security (`Beast` mode)
- 🧪 **HMAC Integrity Verification** to detect tampering
- ✨ **Progress bars**, **ASCII signature**, and **obscured password input**
- ⚡ **CLI-first**, lightweight, cross-platform
- 💚 Built with Node.js

---

## 📦 Installation

Install globally via NPM:

```bash
npm install -g ahfc
```

Or as a project dependency:

```bash
npm install ahfc
```

---

## 🚀 Usage

### Encrypt a File

```bash
ahfc encrypt <input-file> <output-file> [--lite | --normal | --beast]
```

**Examples:**

```bash
ahfc encrypt secrets.txt secrets.enc --beast
```

- `--lite` → Fastest, lower security (10 rounds, 4+ char password)
- `--normal` → Balanced (64 rounds, 16+ char password)
- `--beast` → Maximum security (AES-GCM, 128 rounds, 24+ char password)

### Decrypt a File

```bash
ahfc decrypt <input-file> <output-file>
```

Example:

```bash
ahfc decrypt secrets.enc secrets.txt
```

---

## 🔧 Technical Overview

### Modes

| Mode   | Rounds | Password Length | Algorithm                   | HMAC     |
|--------|--------|------------------|------------------------------|----------|
| Lite   | 10     | 4+ characters    | XOR-based transformation     | SHA-256  |
| Normal | 64     | 16+ characters   | XOR-based transformation     | SHA-256  |
| Beast  | 128    | 24+ characters   | AES-256-GCM + Compression    | SHA-512  |

### Format Structure

Every encrypted file contains:

- ASCII Signature Header
- JSON Metadata (`version`, `mode`)
- Salt (16 bytes)
- (Beast mode only): IV, Auth Tag
- Encrypted Data Blocks
- HMAC Signature

### Password Derivation

- Uses **argon2id** with salt to derive 256-bit key.
- Salt is randomly generated and prepended to encrypted file.

---

## 🔐 Security Considerations

- HMAC validation ensures **tamper detection**.
- Timing-safe comparison used for HMAC verification.
- Obscured password entry to protect input visibility.
- `Beast` mode uses authenticated encryption (**AES-GCM**) for robust confidentiality and integrity.

---

## 📊 UI & CLI Features

- 📍 Interactive password prompt (hidden input + backspace)
- 🧮 CLI progress bars for encryption/decryption status
- 🎨 Terminal colors (via `chalk`)
- 🧾 Friendly error and status messages

---

## 📁 Example

```bash
# Encrypt a file in Beast mode
ahfc encrypt notes.txt secure.enc --beast

# Decrypt it
ahfc decrypt secure.enc notes.txt
```

---

## 🛠️ Developer Notes

### Build Locally

```bash
git clone https://github.com/axrxvm/ahfc.git
cd ahfc
npm install
node ahfc.js encrypt input.txt output.enc --normal
```

### Test Encryption Modes

To test encryption with each mode, run:

```bash
node ahfc.js encrypt sample.txt sample.enc --lite
node ahfc.js encrypt sample.txt sample.enc --normal
node ahfc.js encrypt sample.txt sample.enc --beast
```

---

## 🤝 Contributing

Pull requests and suggestions are welcome!  
Feel free to fork, enhance, and open issues for bugs or features.

---

## 🧾 License

This project is licensed under the [MIT License](LICENSE).

---

## 🌐 Links

- 📦 [NPM Package](https://www.npmjs.com/package/ahfc)
- 🛠️ [GitHub Repository](https://github.com/axrxvm/ahfc)
