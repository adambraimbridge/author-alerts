'use strict';

const sessionApi = require('../services/session');
const Promise = require('bluebird');
const moment = require('moment');
const env = require('../env');
const mongoose = Promise.promisifyAll(require('mongoose'));
const _ = require('lodash');

const UserSubscription = mongoose.model('UserSubscription');

/** extract to helper **/
const createSubscriptionItem = (parts) => {
	return parts.split(',').reduce((item, value, index, values) => {
		item['taxonomyId'] = values[2];
		item['taxonomyName'] = values[1];
		item['immediate'] = (values[0] === 'immediate');
		return item;
	}, {});
};

const extractSubscriptionItems = (paramsList) => {
	return paramsList.map(createSubscriptionItem);
};

const getTaxonomies = (list) => {
	if (list.length) {
		return list.map(item => {
			return {
				id: item.taxonomyId,
				name: item.taxonomyName,
				type: 'authors',
				frequency: item.immediate ? 'immediate' : 'daily'
			};
		});
	}
	return [];
};

const taxonomiesForUser = (userId) => {
	return UserSubscription.find({userId: userId}).execAsync()
		.then(subscriptions => {
			return {
				status: 'success',
				message: 'following list retrieved',
				taxonomies: getTaxonomies(subscriptions)
			};
		});
};

/*eslint-disable no-console */
const handleError = (error, res) => {
	console.log(error);
	res.statusCode(500).send('Error');
};
/*eslint-enable no-console */

exports.validateSession = (req, res, next) => {
	let sessionId = req.cookies['FTSession'];
	if (!sessionId) {
		return res.end(env.errors.sessionIdRequired);
	}
	req.sessionId = sessionId;
	next();
};

exports.validateParams = (req, res, next) => {
	let params = req.query;
	let subscriptions = null;
	let subscriptionParam = params.follow || params.unfollow;

	if (subscriptionParam) {
		subscriptions = extractSubscriptionItems([].concat(subscriptionParam));
	}
	if (_.isEmpty(subscriptions)) {
		return res.end(env.errors.noParameters);
	}

	req.subscriptions = subscriptions;
	next();
};

exports.follow = (req, res) => {
	let userId = null;
	sessionApi.getUserData(req.sessionId)
		.then((userData) => {
			userId = userData.uuid;
			return Promise.all(req.subscriptions.map(subscription => {
				let userSubscriptionItem = {
					userId: userData.uuid,
					taxonomyId: subscription.taxonomyId,
					taxonomyName: subscription.taxonomyName,
					addedAt: moment().format(env.dateFormat),
					immediate: subscription.immediate
				};
				return UserSubscription.update({
					userId: userData.uuid,
					taxonomyId: subscription.taxonomyId
				}, userSubscriptionItem, {upsert: true}).execAsync();
			}));
		}).then(() => {
			taxonomiesForUser(userId).then(data => res.jsonp(data));
		}).catch((error) => {
			handleError(error, res);
		});
};

exports.unfollowAll = (req, res) => {
	let userId = null;
	sessionApi.getUserData(req.sessionId)
		.then((userData) => {
			userId = userData.uuid;
			return UserSubscription.remove({
				userId: userId
			}).execAsync();
		}).then(() => {
			taxonomiesForUser(userId).then(data => res.jsonp(data));
		}).catch((error) => {
			handleError(error, res);
		});
};

exports.unfollow = (req, res) => {
	let userId = null;
	sessionApi.getUserData(req.sessionId)
		.then((userData) => {
			userId = userData.uuid;
			return Promise.all(req.subscriptions.map(subscription => {
				return UserSubscription.remove({
					userId: userData.uuid,
					taxonomyId: subscription.taxonomyId
				}).execAsync();
			}));
		}).then(() => {
			taxonomiesForUser(userId).then(data => res.jsonp(data));
		}).catch((error) => {
			handleError(error, res);
		});
};

exports.users = (req, res) => {
	let params = req.query;
	if ( !params.hasOwnProperty('id') ) {
		return res.end(env.errors.idParameterRequired);
	}
	UserSubscription.find({
		taxonomyId: params['id']
	}).select({userId: 1, _id: 0}).execAsync().then(users => {
		res.json(users);
	});
};
