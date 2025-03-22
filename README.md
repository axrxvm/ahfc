# AHFC - Aarav HyperFortress Cipher 🔐

![npm](https://img.shields.io/npm/v/ahfc)
![license](https://img.shields.io/npm/l/ahfc)
![node](https://img.shields.io/node/v/ahfc)

**AHFC (Aarav HyperFortress Cipher)** is a high-performance, multi-mode file encryption tool written in Node.js. Designed with security, flexibility, and user experience in mind, AHFC supports password-based encryption using Argon2, zlib compression, HMAC verification, and AES-GCM encryption (Beast mode). Perfect for CLI users who demand speed and strength.

---

## Features

- 🔐 Multiple encryption modes: `Lite`, `Normal`, `Beast`
- 💥 AES-256-GCM in Beast mode with HMAC-SHA512
- 🧂 Argon2id key derivation with unique per-file salt
- 📦 zlib compression before encryption
- 📊 Live progress bar for large file operations
- 🧠 Secure password input with character masking
- 🧪 HMAC integrity check to detect tampering
- 🖥️ Beautiful, intuitive CLI interface
- ✅ Cross-platform (Windows, Linux, macOS)

---

## Installation

```bash
npm install -g ahfc
```

---

## Usage

### Encrypt a File

```bash
ahfc encrypt <input-file> <output-file> [--lite|--normal|--beast]
```

**Examples:**

```bash
ahfc encrypt secret.txt secret.enc --normal
ahfc encrypt bigfile.zip archive.aes --beast
```

If no mode is specified, it defaults to `--normal`.

### Decrypt a File

```bash
ahfc decrypt <input-file> <output-file>
```

**Example:**

```bash
ahfc decrypt secret.enc secret.txt
```

---

## Modes Explained

| Mode   | Rounds | Min Password Length | Description                  |
|--------|--------|---------------------|------------------------------|
| Lite   | 10     | 4                   | Fast, lightweight encryption |
| Normal | 64     | 16                  | Balanced security & speed    |
| Beast  | 128    | 24                  | AES-GCM, HMAC-SHA512, secure |

---

## Security Notes

- Always use strong, unique passwords, especially for **Normal** and **Beast** modes.
- Files are encrypted with a new salt and IV each time for maximum randomness.
- HMAC is used to prevent tampering and verify password correctness.

---

## License

MIT © Aarav Mehta - axrxvm@proton.me 

---

## Contribute

Feel free to open issues or PRs. Suggestions and improvements are welcome!

```
