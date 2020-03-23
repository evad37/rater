import API, { makeErrorMsg } from "./api";
import { isAfterDate } from "./util";
import * as cache from "./cache";

var cacheBanners = function(banners) {
	cache.write("banners", banners, 2, 60);
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
		},
		{
			title: "Category:WikiProject banner templates not based on WPBannerMeta",
			abbreviation: "notWPBM",
			banners: [],
			processed: $.Deferred()
		},

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
		let banners = {};
		categories.forEach(catObject => {
			banners[catObject.abbreviation] = catObject.banners;
		});
		
		finishedPromise.resolve(banners);
	});
	
	return finishedPromise;
};

/**
 * Gets banners from cache, if there and not too old
 * 
 * @returns {Promise} Resolved with banners object
 */
var getBannersFromCache = function() {
	var cachedBanners = cache.read("banners");
	if (
		!cachedBanners ||
		!cachedBanners.value ||
		!cachedBanners.staleDate
	) {
		return $.Deferred().reject();
	}
	if ( isAfterDate(cachedBanners.staleDate) ) {
		// Update in the background; still use old list until then  
		getListOfBannersFromApi().then(cacheBanners);
	}
	return $.Deferred().resolve(cachedBanners.value);
};

/**
 * Gets banner names, grouped by type (withRatings, withoutRatings, wrappers, notWPBM)
 * @returns {Promise<Object>} Object of string arrays keyed by type (withRatings, withoutRatings, wrappers, notWPBM)
 */
var getBannerNames = () => getBannersFromCache()
	.then( banners => {
		// Ensure all keys exist
		if (!banners.withRatings || !banners.withoutRatings || !banners.wrappers || !banners.notWPBM) {
			getListOfBannersFromApi().then(cacheBanners);
			return $.extend(
				{ withRatings: [], withoutRatings: [], wrappers: [], notWPBM: [] },
				banners
			);
		}
		// Success: pass through
		return banners;
	} )
	.catch( () => {
		// Failure: get from Api, then cache them
		let bannersPromise = getListOfBannersFromApi();
		bannersPromise.then(cacheBanners);
		return bannersPromise;
	} );

export {getBannerNames};