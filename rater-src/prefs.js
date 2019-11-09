import API from "./api";
import { isAfterDate } from "./util";
import config from "./config";
import * as cache from "./cache";

const prefsPage = `User:${mw.config.get("wgUserName")}/raterPrefs.json`;

const writePrefsToCache = prefs => cache.write(
	"prefs",
	prefs,
	(1/24/60)*1, // 1 min
	(1/24/60)*1  // 1 min
);

const getPrefsFromApi = function() {
	return API.get({
		"action": "query",
		"format": "json",
		"prop": "revisions",
		"titles": prefsPage,
		"rvprop": "content",
		"rvslots": "main"
	}).then(response => {
		const page = response.query.pages[Object.keys(response.query.pages)[0]];
		if (!page.pageid || page.missing==="") {
			return config.defaultPrefs;
		}
		let prefs;
		try {
			prefs = JSON.parse( page.revisions[0].slots.main["*"] );
		} catch(e) {
			return $.Deferred().reject("JSON-parsing-error", e);
		}
		writePrefsToCache(prefs);
		return prefs;
	});
};

const getPrefsFromCache = function() {
	var cachedPrefs = cache.read("prefs");
	if (
		!cachedPrefs ||
		!cachedPrefs.value ||
		!cachedPrefs.staleDate ||
		isAfterDate(cachedPrefs.staleDate)
	) {
		// No cached value, or is too old
		return $.Deferred().reject();
	}
	return $.Deferred().resolve(cachedPrefs.value);
};

const getPrefs = () => getPrefsFromCache().then(
	// Success: pass through (first param only)
	prefs => $.Deferred().resolve(prefs),
	// Failure: get from Api
	() => getPrefsFromApi()
);

/**
 * 
 * @param {Object} updatedPrefs object with key:value pairs for preferences json.
 */
const setPrefs = function(updatedPrefs) {
	return API.editWithRetry(prefsPage,	null,
		() => ({
			"text": JSON.stringify(updatedPrefs),
			"summary": "Saving Rater preferences " + config.script.advert
		})
	)
		.then( () => writePrefsToCache(updatedPrefs) );
};

export default ({get: getPrefs, set: setPrefs});
export { getPrefs, setPrefs };