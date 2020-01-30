import {isAfterDate} from "./util";

/** write
 * @param {String} key
 * @param {Array|Object} val
 * @param {Number} staleDays Number of days after which the data becomes stale (usable, but should
 *  be updated for next time).
 * @param {Number} expiryDays Number of days after which the cached data may be deleted.
 */
const write = function(key, val, staleDays, expiryDays) {
	try {
		const defaultStaleDays = 1;
		const defaultExpiryDays = 30;
		const millisecondsPerDay = 24*60*60*1000;

		const staleDuration = (staleDays || defaultStaleDays)*millisecondsPerDay;
		const expiryDuration = (expiryDays || defaultExpiryDays)*millisecondsPerDay;

		const stringVal = JSON.stringify({
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
const read = function(key) {
	let val;
	try {
		const stringVal = localStorage.getItem("Rater-"+key);
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

const isRaterKey = key => key && key.indexOf("Rater-") === 0;

const clearItemIfInvalid = function(key) {
	if ( !isRaterKey(key) ) {
		return;
	}
	const item = read(key.replace("Rater-",""));
	const isInvalid = !item || !item.expiryDate || isAfterDate(item.expiryDate);
	if ( isInvalid ) {
		localStorage.removeItem(key);
	}
};

const clearInvalidItems = function() {
	// Loop backwards as localStorage length will decrease as items are removed
	for (let i = localStorage.length; i >= 0; i--) {
		setTimeout(clearItemIfInvalid, 100, localStorage.key(i));
	}
};

const clearAllItems = function() {
	// Loop backwards as localStorage length will decrease as items are removed
	for (let i = localStorage.length; i >= 0; i--) {
		let key = localStorage.key(i);
		if (isRaterKey(key)) {
			localStorage.removeItem(key);
		}
	}
};

export { write, read, clearItemIfInvalid, clearInvalidItems, clearAllItems };