// Various utility functions and objects that might be used in multiple places

import config from "./config";

var isAfterDate = function(dateString) {
	return new Date(dateString) < new Date();
};

var API = new mw.Api( {
	ajax: {
		headers: { 
			"Api-User-Agent": "Rater/" + config.script.version + 
				" ( https://en.wikipedia.org/wiki/User:Evad37/Rater )"
		}
	}
} );
/* ---------- API for ORES ---------------------------------------------------------------------- */
API.getORES = function(revisionID) {
	return $.get("https://ores.wikimedia.org/v3/scores/enwiki?models=wp10&revids="+revisionID);
};
/* ---------- Raw wikitext ---------------------------------------------------------------------- */
API.getRaw = function(page) {
	return $.get("https:" + config.mw.wgServer + mw.util.getUrl(page, {action:"raw"}))
		.then(function(data) {
			if ( !data ) {
				return $.Deferred().reject("ok-but-empty");
			}
			return data;
		});
};

var makeErrorMsg = function(first, second) {
	var code, xhr, message;
	if ( typeof first === "object" && typeof second === "string" ) {
		// Errors from $.get being rejected (ORES & Raw wikitext)
		var errorObj = first.responseJSON && first.responseJSON.error;
		if ( errorObj ) {
			// Got an api-specific error code/message
			code = errorObj.code;
			message = errorObj.message;
		} else {
			xhr = first;
		}
	} else if ( typeof first === "string" && typeof second === "object" ) {
		// Errors from mw.Api object
		var mwErrorObj = second.error;
		if (mwErrorObj) {
			// Got an api-specific error code/message
			code = errorObj.code;
			message = errorObj.info;
		} else if (first === "ok-but-empty") {
			code = null;
			message = "Got an empty response from the server";
		} else {
			xhr = second && second.xhr;
		}
	}

	if (code && message) {
		return `API error ${code}: ${message}`;
	} else if (message) {
		return `API error: ${message}`;
	} else if (xhr) {
		return `HTTP error ${xhr.status}`;
	} else if (
		typeof first === "string" && first !== "error" &&
		typeof second === "string" && second !== "error"
	) {
		return `Error ${first}: ${second}`;
	} else if (typeof first === "string" && first !== "error") {
		return `Error: ${first}`;
	} else {
		return "Unknown API error";
	}
};

var yesWords = [
	"add",
	"added",
	"affirm",
	"affirmed",
	"include",
	"included",
	"on",
	"true",
	"yes",
	"y",
	"1"
];
var noWords = [
	"decline",
	"declined",
	"exclude",
	"excluded",
	"false",
	"none",
	"not",
	"no",
	"n",
	"off",
	"omit",
	"omitted",
	"remove",
	"removed",
	"0"
];
var normaliseYesNo = function(val) {
	if (val == null) {
		return val;
	}
	var trimmedLcVal = val.trim().toLowerCase();
	if (yesWords.includes(trimmedLcVal)) {
		return "yes";
	} else if (noWords.includes(trimmedLcVal)) {
		return "no";
	} else {
		return trimmedLcVal;
	}
};

/**
 * 
 * @param {Array} array 
 * @param {Function} filterPredicate (currentVal, currentIndex, array) => {boolean}
 * @param {Function} mapTransform (currentVal, currentIndex, array) => {any}
 * @returns {Array}
 */
var filterAndMap = function(array, filterPredicate, mapTransform) {
	return array.reduce(
		(accumulated, currentVal, currentIndex) => {
			if (filterPredicate(currentVal, currentIndex, array)) {
				return [...accumulated, mapTransform(currentVal, currentIndex, array)];
			}
			return accumulated;
		},
		[]
	);
};

/**
 * 
 * @param {string[]|number[]} array 
 * @returns {string} item with the highest frequency
 * e.g. `mostFrequent(["apple", "apple", "orange"])` returns `"apple"`
 */
function mostFrequent(array) {
	if (!array || !Array.isArray(array) || array.length === 0)
		return null;
	var map = {};
	var mostFreq = null;
	array.forEach((item) => {
		map[item] = (map[item] || 0) + 1;
		if (mostFreq === null || map[item] > map[mostFreq]) {
			mostFreq = item;
		}
	});
	return mostFreq;
}

export {isAfterDate, API, makeErrorMsg, filterAndMap, normaliseYesNo, mostFrequent};