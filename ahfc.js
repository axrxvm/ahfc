#!/usr/bin/env node


const fs = require('fs');
const crypto = require('crypto');
const zlib = require('zlib');
const argon2 = require('argon2');
const chalk = require('chalk').default;
const cliProgress = require('cli-progress');
const readline = require('readline');

const VERSION = 'AHFCv1';
const BLOCK_SIZE = 1024 * 1024;

const modes = {
  lite:   { rounds: 10,  minLength: 4,   name: 'Lite' },
  normal: { rounds: 64,  minLength: 16,  name: 'Normal' },
  beast:  { rounds: 128, minLength: 24,  name: 'Beast' }
};

const ASCII_SIGNATURE = Buffer.from(`
  ===============================
  =      AHFC Encrypted File    =
  =          ${VERSION}           =
  ===============================\n`, 'utf-8');

  function printBanner() {
    console.log(chalk.cyan(`
  ╔════════════════════════════════════════════════════╗
  ║                 AHFC File Encryptor v1             ║
  ╚════════════════════════════════════════════════════╝
  `));
  }
  
// Custom password prompt with obscuring and backspace
function promptPassword(promptText) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    let password = '';

    stdout.write(chalk.green(promptText));
    stdin.resume();
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');

    stdin.on('data', (ch) => {
      if (ch === '\n' || ch === '\r' || ch === '\u0004') {
        stdin.setRawMode(false);
        stdout.write('\n');
        stdin.pause();
        resolve(password);
      } else if (ch === '\u0003') {
        process.exit();
      } else if (ch === '\u0008' || ch === '\u007F') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          stdout.write('\b \b');
        }
      } else {
        password += ch;
        stdout.write('*');
      }
    });
  });
}

function getModeFromArgs(args) {
  const modeArg = args.find(a => a.startsWith('--'));
  if (!modeArg) return 'normal';
  const key = modeArg.replace('--', '').toLowerCase();
  if (['l', 'lite'].includes(key)) return 'lite';
  if (['n', 'normal'].includes(key)) return 'normal';
  if (['b', 'beast'].includes(key)) return 'beast';
  return 'normal';
}

async function deriveKey(password, salt) {
  return await argon2.hash(password, { salt, type: argon2.argon2id, raw: true, hashLength: 32 });
}

function transformBlock(data, key, rounds) {
  let output = Buffer.from(data);
  for (let i = 0; i < rounds; i++) {
    for (let j = 0; j < output.length; j++) {
      output[j] ^= key[j % key.length] ^ (i & 0xff);
    }
  }
  return output;
}

async function encryptFile(inputPath, outputPath, mode) {
  const modeInfo = modes[mode];
  console.log(chalk.magentaBright(`✨ Mode selected: ${chalk.bold(modeInfo.name)} (${modeInfo.rounds} rounds)`));
  console.log(chalk.gray(`🔑 Password must be at least ${modeInfo.minLength} characters.`));
  const password = await promptPassword('Enter password: ');
  if (password.length < modeInfo.minLength) return console.error(chalk.red(`Password must be at least ${modeInfo.minLength} characters.`));

  const salt = crypto.randomBytes(16);
  const key = await deriveKey(password, salt);
  const input = fs.readFileSync(inputPath);
  // enhanced beast
  if (mode === 'beast') {
    const compressed = zlib.deflateSync(input);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const totalSize = compressed.length;
  const chunkSize = BLOCK_SIZE;
  const bar = new cliProgress.SingleBar({
    format: `${chalk.blue('Encrypting')} |{bar}| {percentage}% | ETA: {eta}s | ${modeInfo.name}`,
  }, cliProgress.Presets.shades_classic);
  bar.start(Math.ceil(totalSize / chunkSize), 0);

    let encryptedChunks = [];
    for (let i = 0; i < totalSize; i += chunkSize) {
      const chunk = compressed.slice(i, i + chunkSize);
      encryptedChunks.push(cipher.update(chunk));
      bar.increment();
    }

    encryptedChunks.push(cipher.final());
    bar.stop();

    const encrypted = Buffer.concat(encryptedChunks);
    const authTag = cipher.getAuthTag();

    const metadata = Buffer.from(JSON.stringify({ version: VERSION, mode }));
    const metaLen = Buffer.alloc(4);
    metaLen.writeUInt32BE(metadata.length);
  
    const data = Buffer.concat([
      ASCII_SIGNATURE,
      metaLen,
      metadata,
      salt,
      iv,
      authTag,
      encrypted
    ]);
  
    const hmac = crypto.createHmac(mode === 'beast' ? 'sha512' : 'sha256', key).update(data).digest();
    fs.writeFileSync(outputPath, Buffer.concat([data, hmac]));
    console.log(chalk.greenBright('✅ File encrypted successfully!'));
    console.log(chalk.green(`🎉 Output written to: ${chalk.underline(outputPath)}`));

    return;
  }
  
  const compressed = zlib.deflateSync(input);

  const blocks = [];
  const bar = new cliProgress.SingleBar({ format: `${chalk.blue('Encrypting')} |{bar}| {percentage}% | ETA: {eta}s | ${modeInfo.name}` }, cliProgress.Presets.shades_classic);
  bar.start(Math.ceil(compressed.length / BLOCK_SIZE), 0);

  for (let i = 0; i < compressed.length; i += BLOCK_SIZE) {
    const block = compressed.slice(i, i + BLOCK_SIZE);
    const encrypted = transformBlock(block, key, modeInfo.rounds);
    blocks.push(encrypted);
    bar.update(blocks.length);
  }
  bar.stop();

  const metadata = Buffer.from(JSON.stringify({ version: VERSION, mode }));
  const metaLen = Buffer.alloc(4);
  metaLen.writeUInt32BE(metadata.length);

  const data = Buffer.concat([ASCII_SIGNATURE, metaLen, metadata, salt, ...blocks]);
  const hmac = crypto.createHmac('sha256', key).update(data).digest();

  fs.writeFileSync(outputPath, Buffer.concat([data, hmac]));
  console.log(chalk.greenBright('✅ File encrypted successfully!'));
  console.log(chalk.green(`🎉 Output written to: ${chalk.underline(outputPath)}`));

}

async function decryptFile(inputPath, outputPath) {
  const file = fs.readFileSync(inputPath);
  let offset = ASCII_SIGNATURE.length;
  const metaLen = file.readUInt32BE(offset);
  const metadata = JSON.parse(file.slice(offset + 4, offset + 4 + metaLen));
  
  const modeInfo = modes[metadata.mode];
  console.log(chalk.magentaBright(`✨ Mode selected: ${chalk.bold(modeInfo.name)} (${modeInfo.rounds} rounds)`));


  if (metadata.version !== VERSION) {
    return console.error(chalk.redBright(`❌ Version mismatch. Expected ${VERSION}, got ${metadata.version}`));
  }

  const salt = file.slice(offset + 4 + metaLen, offset + 20 + metaLen);

  if (metadata.mode === 'beast') {
    const ivStart = offset + 20 + metaLen;
    const authTagStart = ivStart + 12;
    const encryptedStart = authTagStart + 16;
    const hmacStart = file.length - 64;
  
    const iv = file.slice(ivStart, authTagStart);
    const authTag = file.slice(authTagStart, encryptedStart);
    const encrypted = file.slice(encryptedStart, hmacStart);
    const hmacStored = file.slice(hmacStart);
  
    console.log(chalk.gray(`🔑 Password must be at least ${modeInfo.minLength} characters.`));
    const password = await promptPassword('Enter password: ');

    if (password.length < modeInfo.minLength) {
      return console.error(chalk.red(`Password must be at least ${modeInfo.minLength} characters.`));
    }
  
    const key = await deriveKey(password, salt);
    const hmacActual = crypto.createHmac('sha512', key).update(file.slice(0, hmacStart)).digest();
  
    if (!crypto.timingSafeEqual(hmacStored, hmacActual)) {
      await new Promise(r => setTimeout(r, 1000)); // Anti-brute-force delay
      return console.error(chalk.redBright('❌ Signature verification failed: File tampered or incorrect password!'));
    }
  
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
 
      const totalSize = encrypted.length;
      const chunkSize = BLOCK_SIZE;
      const bar = new cliProgress.SingleBar({
        format: `${chalk.yellow('Decrypting')} |{bar}| {percentage}% | ETA: {eta}s | ${modeInfo.name}`,
      }, cliProgress.Presets.shades_classic);
      bar.start(Math.ceil(totalSize / chunkSize), 0);

    let decryptedChunks = [];
    for (let i = 0; i < totalSize; i += chunkSize) {
      const chunk = encrypted.slice(i, i + chunkSize);
      decryptedChunks.push(decipher.update(chunk));
      bar.increment();
    }
    decryptedChunks.push(decipher.final());
    bar.stop();

    const decrypted = Buffer.concat(decryptedChunks);
    const output = zlib.inflateSync(decrypted);

      fs.writeFileSync(outputPath, output);
      console.log(chalk.greenBright('✅ File decrypted successfully!'));
      console.log(chalk.green(`🎉 Output written to: ${chalk.underline(outputPath)}`));

    } catch (err) {
      return console.error(chalk.redBright('❌ Decryption failed: Incorrect password or corrupted file.'));
    }
  
    return;
  }
  

  const hmacStart = metadata.mode === 'beast' ? file.length - 64 : file.length - 32;
  const hmacStored = file.slice(hmacStart);
  const encrypted = file.slice(0, hmacStart);


  console.log(chalk.gray(`🔑 Password must be at least ${modeInfo.minLength} characters.`));
  const password = await promptPassword('Enter password: ');

  if (password.length < modeInfo.minLength) return console.error(chalk.red(`Password must be at least ${modeInfo.minLength} characters.`));

  const key = await deriveKey(password, salt);
  const hmacActual = crypto.createHmac('sha256', key).update(encrypted).digest();

  if (!crypto.timingSafeEqual(hmacStored, hmacActual)) {
    return console.error(chalk.redBright('❌ Signature verification failed: File tampered or incorrect password!'));
  }

  const bar = new cliProgress.SingleBar({ format: `${chalk.yellow('Decrypting')} |{bar}| {percentage}% | ETA: {eta}s | ${modeInfo.name}` }, cliProgress.Presets.shades_classic);
  const blocks = [];
  const start = offset + 20 + metaLen;
  const totalBlocks = Math.ceil((hmacStart - start) / BLOCK_SIZE);
  bar.start(totalBlocks, 0);

  for (let i = start; i < hmacStart; i += BLOCK_SIZE) {
    const block = file.slice(i, Math.min(i + BLOCK_SIZE, hmacStart));
    const decrypted = transformBlock(block, key, modeInfo.rounds);
    blocks.push(decrypted);
    bar.increment();
  }
  bar.stop();

  const compressed = Buffer.concat(blocks);
  const output = zlib.inflateSync(compressed);
  fs.writeFileSync(outputPath, output);
  console.log(chalk.greenBright('✅ File decrypted successfully!'));
  console.log(chalk.green(`🎉 Output written to: ${chalk.underline(outputPath)}`));

}

// Main entry point
(async () => {
  console.log('\n');
  printBanner();
  const args = process.argv.slice(2);
  const action = args[0];
  const input = args[1];
  const output = args[2];
  const mode = getModeFromArgs(args);

  if (action === 'encrypt') {
    if (args.length < 3) return console.log(chalk.yellow('Usage: node ahfc.js encrypt <input> <output> [--lite|--normal|--beast]'));
    await encryptFile(input, output, mode);
  } else if (action === 'decrypt') {
    if (args.length < 3) return console.log(chalk.yellow('Usage: node ahfc.js decrypt <input> <output>'));
    await decryptFile(input, output);
  } else {
    console.log(chalk.red('Invalid command. Use encrypt or decrypt.'));
  }
})();
