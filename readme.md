# tch-nedb-session

A session store for [express.js](https://expressjs.com/). Data is stored using [NeDB](https://www.npmjs.com/package/nedb) on file system.

## Installation

Add to your application via `npm`:
```
npm install tch-nedb-session --save
```
This will install `tch-nedb-session` and add it to your application's `package.json` file.

## Important Notes

The package was developed and tested using Express v4 and Node v8.

## How to Use

Use as Express middleware:
```js
const express = require ('express');
const session = require ('express-session');
const nedbStorage = require ('tch-nedb-session') (session);

let app = express ();

let expiration = 24 * 60 * 60 * 1000;
let sessionStore = new nedbStorage ({
	filename: path.join ((electron.app || electron.remote.app).getPath ('userData'), config.nedb.directory, 'sessions.db'),
	expiration: expiration,
	expirationType: 'interval',
	autoCompactInterval: 15 * 60 * 1000,
	expirationInterval: 24 * 60 * 60 * 1000
});

app.use (session ({
	secret: 'your_secret',
	cookie: {
		maxAge: expiration
	},
	resave: false,
	saveUninitialized: false,
	store: sessionStore
}));
```

### Options

List of default options:
```js
let defaults = {
	// NeDB collection file location
	filename: 'var/nedb/sessions.db',
	// How to expire expired session, ttl uses NeDB index, interval should be used if ttl does not work
	expirationType: 'ttl', // ttl | interval
	// How long should the session live, milliseconds
	expiration: 24 * 60 * 60 * 1000,
	// How often should NeDB compact the collection, milliseconds
	autoCompactInterval: 15 * 60 * 1000,
	// If expirationType is interval, the how often it should run, milliseconds
	expirationInterval: 24 * 60 * 60 * 1000,
	// Optional function to run on load succes of the collection
	onLoad: undefined
};
```
