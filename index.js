require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const { URL } = require('url');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

const urlDatabase = new Map();
let shortUrlCounter = 1;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Function to validate URL
function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Function to validate domain using DNS lookup
function validateDomain(hostname) {
  return new Promise((resolve) => {
    dns.lookup(hostname, (err) => {
      resolve(!err);
    });
  });
}

// POST endpoint to create short URL
app.post('/api/shorturl', async function(req, res) {
  const originalUrl = req.body.url;

  // Validate URL format
  if (!isValidUrl(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  try {
    // Extract hostname for DNS lookup
    const url = new URL(originalUrl);
    
    // Validate domain exists
    const isValidDomain = await validateDomain(url.hostname);
    if (!isValidDomain) {
      return res.json({ error: 'invalid url' });
    }

    // Check if URL already exists in database
    for (const [shortUrl, storedUrl] of urlDatabase.entries()) {
      if (storedUrl === originalUrl) {
        return res.json({
          original_url: originalUrl,
          short_url: shortUrl
        });
      }
    }

    // Store new URL
    urlDatabase.set(shortUrlCounter, originalUrl);
    
    res.json({
      original_url: originalUrl,
      short_url: shortUrlCounter
    });

    shortUrlCounter++;

  } catch {
    res.json({ error: 'invalid url' });
  }
});

// GET endpoint to redirect to original URL
app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = parseInt(req.params.short_url);
  const originalUrl = urlDatabase.get(shortUrl);

  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.json({ error: 'No short URL found' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
