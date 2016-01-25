'use strict';

const workerHealth = require('../helpers/workerHealth');

const type = 'daily';
const delta = 60 * 60 * 28;
let healthModel = {
	name: 'Daily alerts worker',
	ok: false,
	technicalSummary: 'Worker sends alerts daily, at specific date and time',
	severity: 2,
	businessImpact: 'No daily alerts will be sent',
	checkOutput: '',
	panicGuide: '',
	lastUpdated: null
};

module.exports = () => {
	return workerHealth(type, delta, healthModel);
};

