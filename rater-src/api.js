import config from "./config";

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
	return $.get("https://ores.wikimedia.org/v3/scores/enwiki?models=articlequality&revids="+revisionID);
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

/* ---------- Edit with retry ------------------------------------------------------------------- */
/**
 * @param {String} title
 * @param {Object?} params additional params for the get request
 * @returns {Promise<Object, string>} page, starttime timestamp
 */
var getPage = function(title, params) {
	return API.get(
		$.extend(
			{
				"action": "query",
				"format": "json",
				"curtimestamp": 1,
				"titles": title,
				"prop": "revisions|info",
				"rvprop": "content|timestamp",
				"rvslots": "main"					
			},
			params
		)
	).then(response => {
		var page = Object.values(response.query.pages)[0];
		var starttime = response.curtimestamp;
		return $.Deferred().resolve(page, starttime);
	});
};

/**
 * @param {Object} page details object from API
 * @param {string} starttime timestamp
 * @param {Function} transform callback that prepares the edit:
 *  {Object} simplifiedPage => {Object|Promise<Object>} edit params
 * @returns {Promise<Object>} params for edit query
 */
var processPage = function(page, starttime, transform) {
	var basetimestamp = page.revisions && page.revisions[0].timestamp;
	var simplifiedPage = {
		pageid: page.pageid,
		missing: page.missing === "",
		redirect: page.redirect === "",
		categories: page.categories,
		ns: page.ns,
		title: page.title,
		content: page.revisions && page.revisions[0].slots.main["*"]
	};
	return $.when( transform(simplifiedPage) )
		.then( editParams =>
			$.extend( {
				action: "edit",
				title: page.title,
				// Protect against errors and conflicts
				assert: "user",
				basetimestamp: basetimestamp,
				starttimestamp: starttime
			}, editParams )
		);
};

/** editWithRetry
 * 
 * Edits a page, resolving edit conflicts, and retrying edits that fail. The
 * tranform function may return a rejected promise if the page should not be
 * edited; the @returns {Promise} will will be rejected with the same rejection
 * values.
 * 
 * Note: Unlike [mw.Api#Edit], a missing page will be created, unless the
 * transform callback includes the "nocreate" param.
 * 
 * [mw.Api#Edit]: <https://doc.wikimedia.org/mediawiki-core/master/js/#!/api/mw.Api.plugin.edit>
 * 
 * @param {String} title page to be edited
 * @param {Object|null} getParams additional params for the get request
 * @param {Function} transform callback that prepares the edit:
 *  {Object} simplifiedPage => {Object|Promise<Object>} params for API editing
 * @returns {Promise<object>} promise, resolved on success, rejected if
 *  page was not edited
 */
API.editWithRetry = function(title, getParams, transform) {
	return getPage(title, getParams)
		.then(
		// Succes: process the page
			(page, starttime) => processPage(page, starttime, transform),
			// Failure: try again
			() => getPage(title, getParams).then(processPage, transform)
		)
		.then(editParams =>
			API.postWithToken("csrf", editParams)
				.catch( errorCode => {
					if ( errorCode === "editconflict" ) {
						// Try again, starting over
						return API.editWithRetry(title, getParams, transform);
					}
					// Try again
					return API.postWithToken("csrf", editParams);
				})
		);
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

export default API;
export { makeErrorMsg };