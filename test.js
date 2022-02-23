const bcrypt = require('bcrypt');
const spicedPg = require('spiced-pg');

const db = spicedPg('postgres:postgres:postgres@localhost:5432/petition');

const getHash = (password) => {
  return bcrypt.genSalt().then((salt) => {
    return bcrypt.hash(password, salt);
  });
};

const createUser = ({ first_name, last_name, email, password }) => {
  return getHash(password).then((password_hash) => {
    return db.query('INSERT INTO users (first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING *', [first_name, last_name, email, password_hash]).then(({ rows }) => rows[0]);
  });
};

const registrationInfo = {
  first_name: 'yo',
  last_name: 'yo',
  email: 'yo@yo.com', // use an already taken email!
  password: 'yoyo123',
};

// createUser(registrationInfo)
//   .then((registeredUser) => {
//     // here you should NOT see yoyo123 anywhere!
//     console.log('registeredUser', registeredUser);
//   })
//   .catch((error) => {
//     console.log('error registering', error);
//   });

const getUserByEmail = (email) => {
  return db.query('SELECT * FROM users WHERE email = $1', [email]).then(({ rows }) => {
    return rows[0];
  });
};

const login = ({ email, password }) => {
  return getUserByEmail(email).then((foundUser) => {
    if (!foundUser) {
      return null;
    }
    return bcrypt.compare(password, foundUser.password_hash).then((match) => {
      if (match) {
        return foundUser;
      }
      return null;
    });
  });
};

const credentials = {
  email: 'yo@yo.com',
  password: 'yoyo123',
};

login(credentials).then((foundUser) => {
  if (!foundUser) {
    console.log('Credentials are wrong!');
  } else {
    console.log(`Welcome back ${foundUser.first_name}!`);
  }
});
