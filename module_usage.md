## Using AHFC as a Module (Programmatic API)

In addition to CLI usage, AHFC can be used as a module in Node.js projects for file encryption and decryption.

---

### 📦 Installation

If you haven't already installed AHFC, add it to your project:

```bash
npm install ahfc
```

---

### 🔥 Quick Start Example

You can import and use AHFC in your Node.js scripts:

```javascript
const { encryptFile, decryptFile } = require('ahfc');

(async () => {
  try {
    // Encrypt a file with "normal" mode
    await encryptFile('secret.txt', 'secret.enc', 'normal');
    console.log('✅ File encrypted successfully!');

    // Decrypt the encrypted file
    await decryptFile('secret.enc', 'decrypted.txt');
    console.log('✅ File decrypted successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
```

---

### 🛠 API Documentation

AHFC provides the following functions for encryption and decryption:

#### `encryptFile(inputPath, outputPath, mode)`
Encrypts a file and saves it to the specified output path.

##### **Parameters**
- **`inputPath`** *(string)* – Path to the file that needs to be encrypted.
- **`outputPath`** *(string)* – Path where the encrypted file will be saved.
- **`mode`** *(string)* – Encryption mode. Available options:
  - `"lite"` – Lightweight encryption (fastest, lowest security).
  - `"normal"` – Balanced encryption (default).
  - `"beast"` – AES-256-GCM with HMAC-SHA512 (highest security).

##### **Example**
```javascript
await encryptFile('data.txt', 'data.enc', 'beast');
```

---

#### `decryptFile(inputPath, outputPath)`
Decrypts a previously encrypted file.

##### **Parameters**
- **`inputPath`** *(string)* – Path to the encrypted file.
- **`outputPath`** *(string)* – Path where the decrypted file will be saved.

##### **Example**
```javascript
await decryptFile('data.enc', 'data.txt');
```

---

### 📌 Advanced Example: Encrypting & Decrypting Multiple Files

```javascript
const { encryptFile, decryptFile } = require('ahfc');

async function processFiles() {
  const files = ['file1.txt', 'file2.pdf', 'image.png'];

  for (const file of files) {
    const encryptedFile = file + '.enc';

    try {
      // Encrypt each file
      await encryptFile(file, encryptedFile, 'beast');
      console.log(`✅ Encrypted: ${file} → ${encryptedFile}`);
      
      // Decrypt each file
      const decryptedFile = 'decrypted_' + file;
      await decryptFile(encryptedFile, decryptedFile);
      console.log(`✅ Decrypted: ${encryptedFile} → ${decryptedFile}`);
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
}

processFiles();
```

---

### ⚡ Why Use AHFC as a Module?
- **Automate encryption & decryption** in Node.js applications.
- **Secure file storage & transfer** with built-in integrity verification.
- **Batch process** multiple files with ease.
- **Seamless integration** into existing projects.

Now you can integrate **AHFC** into your **Node.js** applications with ease! 🚀

