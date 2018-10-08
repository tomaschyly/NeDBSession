# tch-nedb-session

A session store for [express.js](https://expressjs.com/). Data is stored using [NeDB](https://www.npmjs.com/package/nedb) on file system.

## Installation

Add to your application via `npm`:
```
npm install tch-nedb-session --save
```
This will install `tch-nedb-session` and add it to your application's `package.json` file.

## Important Notes

The package was developed and tested using `Express v4` and `Node v8`.

While using `NeDB` I found out that in my apps TTL index on collections does not work. Therefore I decided to develop this session store and implement option to use interval instead.
`If you have issue with TTL index on sessions not working for you too, then use interval expirationType.`
If TTL index works in your app, you can still use it with this session store too, it is set as default.

## How to Use

Use as Express middleware:
```js
const express = require ('express');
const session = require ('express-session');
const nedbStorage = require ('tch-nedb-session') (session);

let app = express ();

let expiration = 24 * 60 * 60 * 1000;
let sessionStore = new nedbStorage ({
	filename: 'path_to_sessions.db',
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
	// Optional function to run on load success of the collection
	onLoad: undefined
};
```
