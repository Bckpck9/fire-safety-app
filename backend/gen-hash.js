const bcrypt = require('bcryptjs');
const password = process.argv[2];

if (!password) {
  console.log('Использование: node gen-hash.js ПАРОЛЬ');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('\nВаш хэш для базы данных:');
console.log(hash, '\n');