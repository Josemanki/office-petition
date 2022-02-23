const express = require('express');
const bodyParser = require('body-parser');
const { engine } = require('express-handlebars');
const cookieSession = require('cookie-session');
const { getSignatures, createSignature, getUserSignature, getUserDataById, createUser, login, createUserProfile, getSignaturesByCity } = require('./db');

const PORT = 8080;
const app = express();

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');

app.use(express.static('public'));

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(
  cookieSession({
    secret: 'Crocowhale',
    maxAge: 1000 * 60 * 60 * 24 * 14,
  })
);

app.use((req, res, next) => {
  if (req.session.signed && req.url === '/') {
    res.redirect('/thank-you');
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.render('homepage');
});

app.get('/thank-you', (req, res) => {
  if (!req.session.signature_id) {
    res.redirect('/');
    return;
  }
  getUserSignature(req.session.signature_id).then((signature) => {
    res.render('thank-you', {
      signature: signature,
    });
  });
});

app.get('/signatures', (req, res) => {
  getSignatures().then((signatures) => {
    console.log(signatures);
    res.render('signatures', {
      signatures,
    });
  });
});

app.post('/signatures', (req, res) => {
  console.log('Posted to signatures');
  createSignature({ user_id: req.session.user_id, ...req.body }).then((data) => {
    req.session.signature_id = data.id;
    res.redirect('/thank-you');
  });
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  console.log('Posted to register');
  const { first_name, last_name, email_address, password } = req.body;
  if (!first_name || !last_name || !email_address || !password) {
    res.render('register', {
      error: 'You must fill out every field!',
    });
    return;
  }

  // TODO - MAKE EMAIL TAKEN

  createUser(req.body).then((data) => {
    req.session.user_id = data.id;
    res.redirect('/profile');
  });
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  console.log('Posted to login');
  const { email_address, password } = req.body;
  if (!email_address || !password) {
    res.render('register', {
      error: 'You must fill out every field!',
    });
    return;
  }

  login(req.body).then((foundUser) => {
    if (!foundUser) {
      console.log('Credentials are wrong!');
      res.render('login', {
        error: 'Some data doesnt seem alright, please check it out!',
      });
    } else {
      console.log(`Welcome back ${foundUser.first_name}!`);
      req.session.user_id = foundUser.id;
      res.redirect('/');
    }
  });
});

app.get('/profile', (req, res) => {
  res.render('profile');
});

app.post('/profile', (req, res) => {
  const { age, city, homepage } = req.body;
  if (!age && !city && !homepage) {
    res.redirect('/');
    return;
  }
  console.log('posted');
  createUserProfile({ user_id: req.session.user_id, ...req.body })
    .then(() => {
      res.redirect('/');
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get('/profile/edit', (req, res) => {
  getUserDataById(req.session.user_id).then((foundUser) => {
    res.render('edit-profile', {
      foundUser,
    });
    console.log(data);
  });
});

app.get('/signatures/:city', (req, res) => {
  getSignaturesByCity('Berlin').then((signatures) => {
    res.render('signatures', {
      signatures,
    });
  });
});
