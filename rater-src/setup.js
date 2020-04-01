import config from "./config";
import API from "./api";
import { parseTemplates, getWithRedirectTo } from "./Template";
import {getBannerNames} from "./getBanners";
import * as cache from "./cache";
import windowManager from "./windowManager";
import { getPrefs } from "./prefs";
import { filterAndMap } from "./util";
// <nowiki>

var setupRater = function(clickEvent) {
	if ( clickEvent ) {
		clickEvent.preventDefault();
	}

	var setupCompletedPromise = $.Deferred();
    
	var currentPage = mw.Title.newFromText(config.mw.wgPageName);
	var talkPage = currentPage && currentPage.getTalkPage();
	var subjectPage = currentPage && currentPage.getSubjectPage();
	var subjectIsArticle = config.mw.wgNamespaceNumber <= 1;
 
	// Get preferences (task 0)
	var prefsPromise = getPrefs();

	// Get lists of all banners (task 1)
	var bannersPromise = getBannerNames();

	// Load talk page (task 2)
	var loadTalkPromise = API.get( {
		action: "query",
		prop: "revisions",
		rvprop: "content",
		rvsection: "0",
		titles: talkPage.getPrefixedText(),
		indexpageids: 1
	} ).then(function (result) {
		var id = result.query.pageids;		
		var wikitext = ( id < 0 ) ? "" : result.query.pages[id].revisions[0]["*"];
		return wikitext;
	});

	// Parse talk page for banners (task 3)
	var parseTalkPromise = loadTalkPromise.then(wikitext => parseTemplates(wikitext, true)) // Get all templates
		.then(templates => templates.filter(template => template.getTitle() !== null)) // Filter out invalid templates (e.g. parser functions)
		.then(templates => getWithRedirectTo(templates)) // Check for redirects
		.then(templates => {
			return bannersPromise.then((allBanners) => { // Get list of all banner templates
				return filterAndMap(
					templates, 			
					// Filter out non-banners
					template => { 
						if (template.isShellTemplate()) { return true; }
						var mainText = template.redirectTarget
							? template.redirectTarget.getMainText()
							: template.getTitle().getMainText();
						return allBanners.withRatings.includes(mainText) || 
						allBanners.withoutRatings.includes(mainText) ||
						allBanners.wrappers.includes(mainText);
					},
					// Set additional properties if needed
					template => {
						var mainText = template.redirectTarget
							? template.redirectTarget.getMainText()
							: template.getTitle().getMainText();
						if (allBanners.wrappers.includes(mainText)) {
							template.redirectTarget = mw.Title.newFromText("Template:Subst:" + mainText);
						}
						if (
							allBanners.withoutRatings.includes(mainText) ||
							allBanners.notWPBM.includes(mainText)
						) {
							template.withoutRatings = true;
						}
						return template;
					}
				);
			});
		});
	
	// Retrieve and store classes, importances, and TemplateData (task 4)
	var templateDetailsPromise = parseTalkPromise.then(function(templates) {
		// Wait for all promises to resolve
		return $.when.apply(null, [
			...templates.map(template => template.isShellTemplate() ? null : template.setClassesAndImportances()),
			...templates.map(template => template.setParamDataAndSuggestions())
		]).then(() => {
			// Add missing required/suggested values
			templates.forEach(template => template.addMissingParams());
			// Return the now-modified templates
			return templates;
		});
	});

	// Check subject page features (task 5) - but don't error out if request fails
	var subjectPageCheckPromise = API.getRaw(subjectPage.getPrefixedText())
		.then(
			// Success
			function(rawPage) {
				var result = {};
				// Check if page is a redirect (if so, get redirection target or boolean true)
				result.redirectTarget = /^\s*#REDIRECT/i.test(rawPage)
					? rawPage.slice(rawPage.indexOf("[[")+2, rawPage.indexOf("]]")) || true 
					: false;
				// Check if article is a disambiguation page
				result.disambig = subjectIsArticle
					? /{{[^|:}]*(?:disambiguation|disambig|dab|Mil-unit-dis|Numberdis|hndis|geodis)[^{]*}}/i.test(rawPage)
					: null;
				// Check if article is tagged as a stub
				result.stubtag = subjectIsArticle
					? /(?:\{\{\s*|-| |\w)stub[^{]*}}/i.test(rawPage)
					: null;
				// Check for GA, FA, FL status
				result.isGA = /{{\s*([Gg]ood[ _][Aa]rticle|[Gg]A[ _](?:article|icon))\s*(?:}}|\|)/.test(rawPage);
				result.isFA = !result.isGA && /{{\s*[Ff]eatured(?:[ _]?article|small)?(?:}}|\|)/.test(rawPage);
				result.isFL = !result.isFA && /{{\s*[Ff]eatured[ _]list(?:}}|\|)/.test(rawPage);
				return result;
			},
			// Failure (ignored)
			function() { return null; }
		);

	// Retrieve rating from ORES (task 6, only needed for articles)
	var shouldGetOres = ( subjectIsArticle ); // TODO: Don't need to get ORES for redirects or disambigs
	if ( shouldGetOres ) {
		var latestRevIdPromise = !currentPage.isTalkPage()
			? $.Deferred().resolve(config.mw.wgRevisionId)
			: API.get( {
				action: "query",
				format: "json",
				prop: "revisions",
				titles: subjectPage.getPrefixedText(),
				rvprop: "ids",
				indexpageids: 1
			} ).then(function(result) {
				if (result.query.redirects) {
					return false;
				}
				var id = result.query.pageids;
				var page = result.query.pages[id];
				if (page.missing === "") {
					return false;
				}
				if ( id < 0 ) {
					return $.Deferred().reject();
				}
				return page.revisions[0].revid;
			});
		var oresPromise = latestRevIdPromise.then(function(latestRevId) {
			if (!latestRevId) {
				return false;
			}
			return API.getORES(latestRevId)
				.then(function(result) {
					var data = result.enwiki.scores[latestRevId].articlequality;
					if ( data.error ) {
						return $.Deferred().reject(data.error.type, data.error.message);
					}
					const prediction = data.score.prediction;
					const probabilities = data.score.probability;
					if (prediction === "FA" || prediction === "GA") {
						return {
							prediction: "B or higher",
							probability: ((probabilities.FA + probabilities.GA + probabilities.B)*100).toFixed(1)+"%"
						};
					}
					return {
						prediction,
						probability: (probabilities[ prediction ]*100).toFixed(1)+"%"
					};
				});
		});
	}

	// Open the load dialog
	var isOpenedPromise = $.Deferred();
	var loadDialogWin = windowManager.openWindow("loadDialog", {
		promises: [
			bannersPromise,
			loadTalkPromise,
			parseTalkPromise,
			templateDetailsPromise,
			subjectPageCheckPromise,
			shouldGetOres && oresPromise
		],
		ores: shouldGetOres,
		isOpened: isOpenedPromise
	});

	loadDialogWin.opened.then(isOpenedPromise.resolve);


	$.when(
		prefsPromise,
		loadTalkPromise,
		templateDetailsPromise,
		subjectPageCheckPromise,
		shouldGetOres && oresPromise
	).then(
		// All succeded
		function(preferences, talkWikitext, banners, subjectPageCheck, oresPredicition ) {
			var result = {
				success: true,
				talkpage: talkPage,
				subjectPage: subjectPage,
				talkWikitext: talkWikitext,
				banners: banners,
				preferences: preferences,
				isArticle: subjectIsArticle
			};
			if (subjectPageCheck) {
				result = { ...result, ...subjectPageCheck };
			}
			if (oresPredicition && !subjectPageCheck.isGA && !subjectPageCheck.isFA && !subjectPageCheck.isFL) {
				result.ores = oresPredicition;
			}
			windowManager.closeWindow("loadDialog", result);
			
		}
	); // Any failures are handled by the loadDialog window itself

	// On window closed, check data, and resolve/reject setupCompletedPromise
	loadDialogWin.closed.then(function(data) {
		if (data && data.success) {
			// Got everything needed: Resolve promise with this data
			setupCompletedPromise.resolve(data);
		} else if (data && data.error) {
			// There was an error: Reject promise with error code/info
			setupCompletedPromise.reject(data.error.code, data.error.info);
		} else {
			// Window closed before completion: resolve promise without any data
			setupCompletedPromise.resolve(null);
		}
		cache.clearInvalidItems();
	});
	return setupCompletedPromise;
};

export default setupRater;
// </nowiki>