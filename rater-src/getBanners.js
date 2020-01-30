import API, { makeErrorMsg } from "./api";
import { isAfterDate } from "./util";
import * as cache from "./cache";

var cacheBanners = function(banners, bannerOptions) {
	cache.write("banners", banners, 2, 60);
	cache.write("bannerOptions", bannerOptions, 2, 60);
};

/**
 * Gets banners/options from the Api
 * 
 * @returns {Promise} Resolved with: banners object, bannerOptions array
 */
var getListOfBannersFromApi = function() {

	var finishedPromise = $.Deferred();

	var querySkeleton = {
		action: "query",
		format: "json",
		list: "categorymembers",
		cmprop: "title",
		cmnamespace: "10",
		cmlimit: "500"
	};

	var categories = [
		{
			title:" Category:WikiProject banners with quality assessment",
			abbreviation: "withRatings",
			banners: [],
			processed: $.Deferred()
		},
		{
			title: "Category:WikiProject banners without quality assessment",
			abbreviation: "withoutRatings",
			banners: [],
			processed: $.Deferred()
		},
		{
			title: "Category:WikiProject banner wrapper templates",
			abbreviation: "wrappers",
			banners: [],
			processed: $.Deferred()
		}
	];

	var processQuery = function(result, catIndex) {
		if ( !result.query || !result.query.categorymembers ) {
			// No results
			// TODO: error or warning ********
			finishedPromise.reject();
			return;
		}
		
		// Gather titles into array - excluding "Template:" prefix
		var resultTitles = result.query.categorymembers.map(function(info) {
			return info.title.slice(9);
		});
		Array.prototype.push.apply(categories[catIndex].banners, resultTitles);
		
		// Continue query if needed
		if ( result.continue ) {
			doApiQuery($.extend(categories[catIndex].query, result.continue), catIndex);
			return;
		}
		
		categories[catIndex].processed.resolve();
	};

	var doApiQuery = function(q, catIndex) {
		API.get( q )
			.done( function(result) {
				processQuery(result, catIndex);
			} )
			.fail( function(code, jqxhr) {
				console.warn("[Rater] " + makeErrorMsg(code, jqxhr, "Could not retrieve pages from [[:" + q.cmtitle + "]]"));
				finishedPromise.reject();
			} );
	};
	
	categories.forEach(function(cat, index, arr) {
		cat.query = $.extend( { "cmtitle":cat.title }, querySkeleton );
		$.when( arr[index-1] && arr[index-1].processed || true ).then(function(){
			doApiQuery(cat.query, index);
		});
	});
	
	categories[categories.length-1].processed.then(function(){
		var banners = {};
		var stashBanner = function(catObject) {
			banners[catObject.abbreviation] = catObject.banners;
		};
		var mergeBanners = function(mergeIntoThisArray, catObject) {
			return $.merge(mergeIntoThisArray, catObject.banners);
		};
		var makeOption = function(bannerName) {
			var isWrapper = ( -1 !== $.inArray(bannerName, categories[2].banners) );
			return {
				data:  ( isWrapper ? "subst:" : "") + bannerName,
				label: bannerName.replace("WikiProject ", "") + ( isWrapper ? " [template wrapper]" : "")
			};
		};
		categories.forEach(stashBanner);
		
		var bannerOptions = categories.reduce(mergeBanners, []).map(makeOption);
		
		finishedPromise.resolve(banners, bannerOptions);
	});
	
	return finishedPromise;
};

/**
 * Gets banners/options from cache, if there and not too old
 * 
 * @returns {Promise} Resolved with: banners object, bannerOptions object
 */
var getBannersFromCache = function() {
	var cachedBanners = cache.read("banners");
	var cachedBannerOptions = cache.read("bannerOptions");
	if (
		!cachedBanners ||
		!cachedBanners.value || !cachedBanners.staleDate ||
		!cachedBannerOptions ||
		!cachedBannerOptions.value || !cachedBannerOptions.staleDate
	) {
		return $.Deferred().reject();
	}
	if ( isAfterDate(cachedBanners.staleDate) || isAfterDate(cachedBannerOptions.staleDate) ) {
		// Update in the background; still use old list until then  
		getListOfBannersFromApi().then(cacheBanners);
	}
	return $.Deferred().resolve(cachedBanners.value, cachedBannerOptions.value);
};

/**
 * Gets banners/options from cache or API.
 * Has side affect of adding/updating/clearing cache.
 * 
 * @returns {Promise<Object, Array>} banners object, bannerOptions object
 *
var getBanners = () => getBannersFromCache().then(
	// Success: pass through
	(banners, options) => $.Deferred().resolve(banners, options),
	// Failure: get from Api, then cache them
	() => {
		var bannersPromise = getListOfBannersFromApi();
		bannersPromise.then(cacheBanners);
		return bannersPromise;
	}
);
 */

/**
 * Gets banner names, grouped by type (withRatings, withoutRatings, wrappers)
 * @returns {Promise<Object>} {withRatings:string[], withoutRatings:string[], wrappers:string[]>}
 */
var getBannerNames = () => getBannersFromCache().then(
	// Success: pass through (first param only)
	banners => banners,
	// Failure: get from Api, then cache them
	() => {
		var bannersPromise = getListOfBannersFromApi();
		bannersPromise.then(cacheBanners);
		return bannersPromise;
	}
);

/**
 * Gets banners as {data, label} objects, for use in our SuggestionLookupTextInputWidget
 * component (or other OOUI widgets like OO.ui.ComboBoxInputWidget)
 * @returns {Promise<Object[]>} Ratings as {data:string, label:string} objects
 */
var getBannerOptions = () => getBannersFromCache().then(
	// Success: pass through (second param only)
	(_banners, options) => options,
	// Failure: get from Api, then cache them
	() => {
		var bannersPromise = getListOfBannersFromApi();
		bannersPromise.then(cacheBanners);
		return bannersPromise.then((_banners, options) => options);
	}
);

export {getBannerNames, getBannerOptions};