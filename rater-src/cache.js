import {isAfterDate} from "./util";

/** write
 * @param {String} key
 * @param {Array|Object} val
 * @param {Number} staleDays Number of days after which the data becomes stale (usable, but should
 *  be updated for next time).
 * @param {Number} expiryDays Number of days after which the cached data may be deleted.
 */
var write = function(key, val, staleDays, expiryDays) {
	try {
		var defaultStaleDays = 1;
		var defaultExpiryDays = 30;
		var millisecondsPerDay = 24*60*60*1000;

		var staleDuration = (staleDays || defaultStaleDays)*millisecondsPerDay;
		var expiryDuration = (expiryDays || defaultExpiryDays)*millisecondsPerDay;
		
		var stringVal = JSON.stringify({
			value: val,
			staleDate: new Date(Date.now() + staleDuration).toISOString(),
			expiryDate: new Date(Date.now() + expiryDuration).toISOString()
		});
		localStorage.setItem("Rater-"+key, stringVal);
	}  catch(e) {} // eslint-disable-line no-empty
};
/** read
 * @param {String} key
 * @returns {Array|Object|String|Null} Cached array or object, or empty string if not yet cached,
 *          or null if there was error.
 */
var read = function(key) {
	var val;
	try {
		var stringVal = localStorage.getItem("Rater-"+key);
		if ( stringVal !== "" ) {
			val = JSON.parse(stringVal);
		}
	}  catch(e) {
		console.log("[Rater] error reading " + key + " from localStorage cache:");
		console.log(
			"\t" + e.name + " message: " + e.message +
			( e.at ? " at: " + e.at : "") +
			( e.text ? " text: " + e.text : "")
		);
	}
	return val || null;
};
var clearItemIfInvalid = function(key) {
	var isRaterKey = key.indexOf("Rater-") === 0;
	if ( !isRaterKey ) {
		return;
	}
	var item = read(key.replace("Rater-",""));
	var isInvalid = !item || !item.expiryDate || isAfterDate(item.expiryDate);
	if ( isInvalid ) {
		localStorage.removeItem(key);
	}
};
var clearInvalidItems = function() {
	for (var i = 0; i < localStorage.length; i++) {
		setTimeout(clearItemIfInvalid, 100, localStorage.key(i));
	}
};

export { write, read, clearItemIfInvalid, clearInvalidItems };