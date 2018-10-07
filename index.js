const nedb = require ('nedb');
const extend = require ('extend');

module.exports = function (session) {
	let Store = session.Store;

	class NeDBStore extends Store {
		/**
		 * NeDBStore initialization.
		 */
		constructor (options) {
			if (typeof (options) === 'undefined') {
				options = {};
			}
	
			options = extend (true, {
				filename: 'var/nedb/sessions.db',
				expirationType: 'ttl', // ttl | interval
				expiration: 24 * 60 * 60 * 1000,
				autoCompactInterval: 15 * 60 * 1000,
				expirationInterval: 24 * 60 * 60 * 1000,
				onLoad: undefined
			}, options);

			if (options.autoCompactInterval < 5 * 1000) {
				options.autoCompactInterval = 5 * 1000;
			} else if (options.autoCompactInterval > 24 * 60 * 60 * 1000) {
				options.autoCompactInterval = 24 * 60 * 60 * 1000;
			}

			super (options);
			this.options = options;
	
			this.collection = new nedb ({
				filename: options.filename,
				autoload: true,
				onload: error => {
					if (!error) {
						if (this.options.expirationType === 'ttl') {
							this.collection.ensureIndex ({
								fieldName: 'expiresAt',
								expireAfterSeconds: 0
							});
						} else if (this.options.expirationType === 'interval') {
							if (typeof (this.expirationInterval) !== 'undefined') {
								clearInterval (this.expirationInterval);
							}

							this.expirationInterval = setInterval (this.clearExpired.bind (this), this.options.expirationInterval);
							this.clearExpired ();
						}
					}

					if (typeof (options.onLoad) === 'function') {
						options.onLoad (error);
					}
				}
			});

			this.collection.persistence.setAutocompactionInterval (options.autoCompactInterval);
		}

		/**
		 * Get session data from collection.
		 */
		get (sessionId, callback) {
			this.collection.findOne ({_id: sessionId}, (error, document) => {
				if (error) {
					callback (error, null);
				} else if (document) {
					let now = new Date ();
					if ((document.session && !document.expiresAt) || now < document.expiresAt) {
						callback (null, document.session);
					} else {
						this.destroy (sessionId, (destroyError) => {
							callback (destroyError, null);
						});
					}
				} else {
					callback (null, null);
				}
			});
		}

		/**
		 * Create or update session data inside collection.
		 */
		set (sessionId, session, callback) {
			let now = new Date ();

			let expiration;
			if (session && session.cookie && session.cookie.expires) {
				expiration = new Date (session.cookie.expires);
			} else {
				expiration = new Date (now.getTime () + this.options.expiration);
			}

			let sessionData = {};
			for (let key in session) {
				if (key === 'cookie') {
					sessionData [key] = session [key].toJSON ? session [key].toJSON () : session [key];
				} else {
					sessionData [key] = session [key];
				}
			}
			
			this.collection.update ({_id: sessionId}, {
				$set: { session: sessionData, expiresAt: expiration, createdAt: now }
			}, {multi: false, upsert: true}, (error, numAffected, newDocument) => {
				if (!error && numAffected === 0 && !newDocument) {
					error = new Error (`Failed to set session for ID ${JSON.stringify (sessionId)}`);
				}

				callback (error);
			});
		}

		/**
		 * Touch a session, update expiresAt.
		 */
		touch (sessionId, session, callback) {
			let now = new Date ();
			let update = {
				updatedAt: now
			};

			if (session && session.cookie && session.cookie.expires) {
				update.expiresAt = new Date (session.cookie.expires);
			} else {
				update.expiresAt = new Date (now.getTime () + this.options.expiration);
			}

			this.collection.update ({_id: sessionId}, {$set: update}, {multi: false, upsert: false}, (error, numAffected) => {
				if (!error && numAffected === 0) {
					error = new Error (`Failed to touch session for ID ${JSON.stringify (sessionId)}`);
				}

				callback (error);
			});
		}

		/**
		 * Remove session data from collection.
		 */
		destroy (sessionId, callback) {
			this.collection.remove ({_id: sessionId}, {multi: false}, (error, numRemoved) => {
				callback (error);
			});
		}

		/**
		 * Get all sessions data from collection, destroy expired.
		 */
		all (callback) {
			let self = this;

			this.collection.find ({}, (error, documents) => {
				if (error) {
					callback (error, null);
				} else {
					documents = (documents || []).filter ((document) => {
						let now = new Date ();
						if ((document.session && !document.expiresAt) || now < document.expiresAt) {
							return true;
						} else {
							self.destroy (document._id, (destroyError) => {
								if (destroyError) {
									self.emit ('error', destroyErr);
								}
							});

							return false;
						}
					}).map ((document) => {
						return document.session;
					});

					callback (null, documents);
				}
			});
		}

		/**
		 * Get number of sessions, destroy expired.
		 */
		length (callback) {
			this.all ((error, sessions) => {
				callback (error, (sessions || []).length);
			});
		}

		/**
		 * Remove all sessions data from collection.
		 */
		clear (callback) {
			this.collection.remove ({}, {multi: true}, (error) => {
				callback (error);
			});
		}

		/**
		 * Remove only expired sessions data from collection.
		 */
		clearExpired () {
			this.all ((error, sessions) => {
				//do nothing
			});
		}
	}

	return NeDBStore;
};
