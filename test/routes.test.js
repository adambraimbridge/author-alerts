'use strict';

const request = require('supertest');
const expect = require('expect');
const env = require('../env');
const app = require('../web');

const sessionService = require('../services/session');

describe('api routes', () => {
	describe('/follow', () => {
		let sessionServiceSpy = null;
		before(() => {
			sessionServiceSpy = expect.spyOn(sessionService, 'getUserData')
				.andReturn(Promise.resolve({uuid: 'test-user-id'}));
		});
		it('should require a session id', (done) => {
			request(app)
				.get('/follow')
				.expect(200)
				.expect(env.errors.sessionIdRequired, done);
		});
		it('should require parameters', (done) => {
			request(app)
				.get('/follow')
				.set('Cookie', ['FTSession=test-session'])
				.expect(200)
				.expect(env.errors.noParameters, done);
		});
		it('should handle author subscriptions', (done) => {
			request(app)
				.get('/follow')
				.query({
					follow: [
						'daily,Author Name 1,author-id-1',
						'immediate,Author Name 2,author-id-2',
						'daily,Author Name 3,author-id-3'
					]
				})
				.set('Cookie', ['FTSession=test-session'])
				.expect(200)
				.end((err, res) => {
					if(err) {
						return done(err);
					}
					expect(res.text).toEqual('done');
					return done();
				});
		});
		after(() => {
			sessionServiceSpy.restore();
		});

	});

	describe('/users', () => {
		it('should require an id parameter', (done) => {
			request(app)
				.get('/users')
				.expect(200)
				.expect(env.errors.idParameterRequired, done);
		});
		it('should find the users subscribed to first author', (done) => {
			request(app)
				.get('/users')
				.query({id: 'author-id-1'})
				.expect(200)
				.end((err, res) => {
					if (err) {
						return done(err);
					}
					expect(res.body).toExist().toBeAn(Array);
					expect(res.body.length).toEqual(1);
					expect(res.body[0].userId).toEqual('test-user-id');
					return done();
				});
		});
		it('should find the users subscribed to second author', (done) => {
			request(app)
				.get('/users')
				.query({id: 'author-id-2'})
				.expect(200)
				.end((err, res) => {
					if (err) {
						return done(err);
					}
					expect(res.body).toExist().toBeAn(Array);
					expect(res.body.length).toEqual(1);
					expect(res.body[0].userId).toEqual('test-user-id');
					return done();
				});
		});
		it('should find the users subscribed to 3rd author', (done) => {
			request(app)
				.get('/users')
				.query({id: 'author-id-2'})
				.expect(200)
				.end((err, res) => {
					if (err) {
						return done(err);
					}
					expect(res.body).toExist().toBeAn(Array);
					expect(res.body.length).toEqual(1);
					expect(res.body[0].userId).toEqual('test-user-id');
					return done();
				});
		});
	});

	describe('/unfollow', () => {
		let sessionServiceSpy = null;
		before(() => {
			sessionServiceSpy = expect.spyOn(sessionService, 'getUserData')
				.andReturn(Promise.resolve({uuid: 'test-user-id'}));
		});
		it('should require a session id', (done) => {
			request(app)
				.get('/unfollow')
				.expect(200)
				.expect(env.errors.sessionIdRequired, done);
		});
		it('should require parameters', (done) => {
			request(app)
				.get('/unfollow')
				.set('Cookie', ['FTSession=test-session'])
				.expect(200)
				.expect(env.errors.noParameters, done);
		});
		it('should handle author subscriptions', (done) => {
			request(app)
				.get('/unfollow')
				.query({
					unfollow: [
						'daily,Author Name 1,author-id-1',
						'immediate,Author Name 2,author-id-2',
						'daily,Author Name 3,author-id-3'
					]
				})
				.set('Cookie', ['FTSession=test-session'])
				.expect(200)
				.end((err, res) => {
					if (err) {
						return done(err);
					}
					expect(res.text).toEqual('done');
					return done();
				});
		});
		after(() => {
			sessionServiceSpy.restore();
		});
	});

});