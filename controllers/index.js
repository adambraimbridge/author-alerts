'use strict';

const sessionApi = require('../services/session');
const mongoose = require('mongoose');
const _ = require('lodash');

const UserSubscription = mongoose.model('UserSubscription');

/** extract to helper **/
const createSubscriptionItem = (parts) => {
	return parts.split(',').reduce((item, value, index, values) => {
		item['_id'] = values[2];
		item['taxonomyName'] = values[1];
		item['immediate'] = (values[0] === 'immediate');
		return item;
	}, {});
};
const extractSubscriptionItems = (paramsList) => {
	return paramsList.map(createSubscriptionItem);
};

const handleError = (error, res) => {
	console.log(error);
	res.end('Error');
};

exports.validate = (req, res, next) => {
	let sessionId = req.cookies['FTSession'];
	let params = req.query;
	let subscriptions = null;
	let subscriptionParam = params.follow || params.unfollow;

	if (!sessionId) {
		return res.end('No session id found.');
	}

	if (subscriptionParam) {
		subscriptions = extractSubscriptionItems([].concat(subscriptionParam));
	}

	if (_.isEmpty(subscriptions)) {
		return res.end('No parameters found.');
	}

	req.subscriptions = subscriptions;
	req.sessionId = sessionId;
	next();
};

exports.follow = (req, res) => {
	sessionApi.getUserData(req.sessionId)
		.then((userData) => {
			return UserSubscription.findByIdOrInsert(userData.uuid);
		}).then((user) => {
			return user.setSubscriptions(req.subscriptions);
		}).then(() => {
			res.end('done');
		}).catch((error) => {
			handleError(error, res);
		});
};

exports.unfollow = (req, res) => {
	sessionApi.getUserData(req.sessionId)
		.then((userData) => {
			return UserSubscription.findById(userData.uuid).exec();
		}).then((user) => {
			return user.removeSubscriptions(req.subscriptions);
		}).then(() => {
			res.end('done');
		}).catch((error) => {
			handleError(error, res);
		});
};