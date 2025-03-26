/* THIS EXAMPLE FILE EXPLAINS ON HOW TO USE AHFC AS A `require` MODULE */

const { encryptFile, decryptFile } = require('./ahfc');

(async () => {
  await encryptFile('input.txt', 'output.ahfc', 'lite');
  await decryptFile('output.ahfc', 'decrypted.txt');
})();
