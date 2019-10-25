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
	var request = $.get("https:" + config.mw.wgServer + mw.util.getUrl(page, {action:"raw"}))
		.then(function(data) {
			if ( !data ) {
				return $.Deferred().reject("ok-but-empty");
			}
		}, function() {
			var status = request.getResponseHeader("status");
			return $.Deferred().reject("http", {textstatus: status || "unknown"});
		});
	return request;
};

var makeErrorMsg = function(code, jqxhr) {
	var details = "";
	if ( code === "http" && jqxhr.textStatus === "error" ) {
		details = "HTTP error " + jqxhr.xhr.status;
	} else if ( code === "http" ) {
		details = "HTTP error: " + jqxhr.textStatus;
	} else if ( code === "ok-but-empty" ) {
		details = "Error: Got an empty response from the server";
	} else {
		details = "API error: " + code;
	}
	return details;
};

export {isAfterDate, API, makeErrorMsg};