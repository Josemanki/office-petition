const express = require('express');
const bodyParser = require('body-parser');
const { engine } = require('express-handlebars');
const cookieSession = require('cookie-session');
const { SESSION_SECRET } = require('./secrets.json');
const {
  getSignatures,
  editProfile,
  deleteSignature,
  editUser,
  createSignature,
  getUserSignature,
  getUserDataById,
  createUser,
  login,
  createUserProfile,
  getSignaturesByCity,
} = require('./db');

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
    secret: SESSION_SECRET,
    maxAge: 1000 * 60 * 60 * 24 * 14,
  })
);

app.use((req, res, next) => {
  if (req.session.signed && req.url === '/') {
    res.redirect('/thank-you');
  }
  next();
});

app.listen(process.env.PORT || PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

const requireLogin = (req, res, next) => {
  if (!req.session.user_id) {
    res.redirect('/login');
  } else {
    next();
  }
};

const requireLoggedOut = (req, res, next) => {
  if (req.session.user_id) {
    res.redirect('/');
  } else {
    next();
  }
};

app.get('/', (req, res) => {
  if (req.session.user_id) {
    getUserSignature(req.session.user_id).then((signature) => {
      if (signature) {
        res.redirect('thank-you');
      } else {
        res.render('homepage', {
          loggedOut: false,
        });
      }
    });
  } else {
    res.render('homepage', {
      loggedOut: true,
    });
  }
});

app.get('/thank-you', requireLogin, (req, res) => {
  getUserSignature(req.session.user_id)
    .then((data) => {
      if (data) {
        res.render('thank-you', {
          signature: data.signature,
        });
      } else {
        res.redirect('/');
      }
    })
    .catch((error) => {
      console.log(error);
      res.redirect('/');
    });
});

app.get('/signatures', (req, res) => {
  getSignatures().then((signatures) => {
    res.render('signatures', {
      signatures,
    });
  });
});

app.post('/signatures', (req, res) => {
  createSignature({ user_id: req.session.user_id, ...req.body }).then(() => {
    res.redirect('/thank-you');
  });
});

app.get('/signatures/:city', (req, res) => {
  getSignaturesByCity(req.params.city).then((signatures) => {
    res.render('signatures', {
      signatures,
    });
  });
});

app.post('/signatures/delete', (req, res) => {
  deleteSignature(req.session.user_id).then(() => {
    res.redirect('/');
  });
});

app.get('/register', requireLoggedOut, (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  const { first_name, last_name, email_address, password } = req.body;
  if (!first_name || !last_name || !email_address || !password) {
    res.render('register', {
      error: 'You must fill out every field!',
    });
    return;
  }

  // TODO - MAKE EMAIL TAKEN

  createUser(req.body)
    .then((data) => {
      req.session.user_id = data.id;
      res.redirect('/profile');
    })
    .catch((error) => {
      if (error.constraint === 'users_email_key') {
        res.render('register', {
          error: "This email already exists in our database, we'll need a new one!",
        });
        return;
      }
      res.render('register', {
        error: 'Oops! Something went wrong while signing up',
      });
    });
});

app.get('/login', requireLoggedOut, (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { email_address, password } = req.body;
  if (!email_address || !password) {
    res.render('register', {
      error: 'You must fill out every field!',
    });
    return;
  }

  login(req.body).then((foundUser) => {
    if (!foundUser) {
      res.render('login', {
        error: 'Some data doesnt seem alright, please check it out!',
      });
    } else {
      req.session.user_id = foundUser.id;
      res.redirect('/');
    }
  });
});

app.get('/profile', requireLogin, (req, res) => {
  res.render('profile');
});

app.post('/profile', (req, res) => {
  const { age, city, homepage } = req.body;
  if (!age && !city && !homepage) {
    res.redirect('/');
    return;
  }
  createUserProfile({ user_id: req.session.user_id, ...req.body })
    .then(() => {
      res.redirect('/');
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get('/profile/edit', requireLogin, (req, res) => {
  getUserDataById(req.session.user_id).then((foundUser) => {
    res.render('edit-profile', {
      foundUser,
    });
  });
});

app.post('/profile/edit', (req, res) => {
  Promise.all([editProfile({ ...req.session, ...req.body }), editUser({ ...req.session, ...req.body })])
    .then((data) => {
      res.render('edit-profile', {
        message: 'Successfully updated your profile!',
        foundUser: { ...data[0], ...data[1] },
      });
    })
    .catch((error) => {
      res.render('edit-profile', {
        message: 'Something went wrong while updating your profile',
        foundUser: { ...data[0], ...data[1] },
      });
    });
});
