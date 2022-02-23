const spicedPg = require('spiced-pg');
const bcrypt = require('bcrypt');

const db = spicedPg('postgres:postgres:postgres@localhost:5432/petition');

const getSignatures = () => {
  return db
    .query(
      `
  SELECT users.first_name, users.last_name, user_profiles.*
  FROM users
  FULL JOIN user_profiles ON user_profiles.user_id = users.id
  JOIN signatures ON signatures.user_id = users.id
  WHERE signatures.signature IS NOT NULL
  `
    )
    .then(({ rows }) => {
      return rows;
    });
};

const getSignaturesByCity = (city) => {
  return db
    .query(
      `
  SELECT users.first_name, users.last_name, user_profiles.*
  FROM users
  FULL JOIN user_profiles ON user_profiles.user_id = users.id
  JOIN signatures ON signatures.user_id = users.id
  WHERE signatures.signature IS NOT NULL AND city = $1
  `,
      [city]
    )
    .then(({ rows }) => {
      return rows;
    });
};

const getHash = (password) => {
  return bcrypt.genSalt().then((salt) => {
    return bcrypt.hash(password, salt);
  });
};

const createSignature = ({ user_id, signature }) => {
  return db.query(`INSERT INTO signatures (user_id, signature) VALUES($1, $2) RETURNING *`, [user_id, signature]).then(({ rows }) => rows[0]);
};

const getUserSignature = (id) => {
  return db.query(`SELECT * FROM signatures where id = $1`, [id]).then(({ rows }) => rows[0].signature);
};

const createUser = ({ first_name, last_name, email_address, password }) => {
  return getHash(password).then((password_hash) => {
    return db.query('INSERT INTO users (first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING *', [first_name, last_name, email_address, password_hash]).then(({ rows }) => rows[0]);
  });
};

const createUserProfile = ({ user_id, age, city, homepage }) => {
  return db.query('INSERT INTO user_profiles (user_id, age, city, url) VALUES ($1, $2, $3, $4) RETURNING *', [user_id, age, city, homepage]).then(({ rows }) => {
    return rows[0];
  });
};

// [user_id, age, city, homepage]
// 'INSERT INTO user_profiles (user_id, age, city, url) VALUES ($1, $2, $3, $4)'

const getUserByEmail = (email) => {
  return db.query('SELECT * FROM users WHERE email = $1', [email]).then(({ rows }) => rows[0]);
};

const getUserDataById = (id) => {
  return db
    .query(
      `SELECT users.*, user_profiles.*
  FROM users
  FULL JOIN user_profiles
  ON users.id = user_profiles.user_id
  WHERE users.id = $1`,
      [id]
    )
    .then(({ rows }) => rows[0]);
};

const editProfile = ({}) => {};

const login = ({ email_address, password }) => {
  return getUserByEmail(email_address).then((foundUser) => {
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

module.exports = {
  getSignatures,
  createSignature,
  getUserSignature,
  createUser,
  login,
  createUserProfile,
  getSignaturesByCity,
  getUserDataById,
};
