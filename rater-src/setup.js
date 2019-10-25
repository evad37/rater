import config from "./config";
import LoadDialog from "./LoadDialog";
import {API} from "./util";
import { parseTemplates, getWithRedirectTo } from "./Template";
import getBanners from "./getBanners";
import * as cache from "./cache";

var setupRater = function(clickEvent) {
	if ( clickEvent ) {
		clickEvent.preventDefault();
	}

	var setupCompletedPromise = $.Deferred();
    
	var currentPage = mw.Title.newFromText(config.mw.wgPageName);
	var talkPage = currentPage && currentPage.getTalkPage();
	var subjectPage = currentPage && currentPage.getSubjectPage();
    
	var loadDialog = new LoadDialog({
		size: "medium"
	});

	// Create and append a window manager, which will open and close the window.
	var windowManager = new OO.ui.WindowManager();
	$( document.body ).append( windowManager.$element );

	// Add the window to the window manager using the addWindows() method.
	windowManager.addWindows( [ loadDialog ] );

	// Open the window!
	var loadDialogWin = windowManager.openWindow( loadDialog );
    
	// Get lists of all banners (task 0)
	var bannersPromise = getBanners();

	// Load talk page (task 1) 
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
	loadTalkPromise.then(
		function() { loadDialog.showTaskDone(1); },
		function(code, jqxhr) { loadDialog.showTaskFailed(1, code, jqxhr); }
	);

	// Parse talk page for banners (task 2)
	var parseTalkPromise = loadTalkPromise.then(wikitext => parseTemplates(wikitext, true)) // Get all templates
		.then(templates => getWithRedirectTo(templates)) // Check for redirects
		.then(templates => {
			return bannersPromise.then((allBanners) => { // Get list of all banner templates
				return templates.filter(template => { // Filter out non-banners
					var mainText = template.redirectTo
						? template.redirectTo.getMainText()
						: template.getTitle().getMainText();
					return allBanners.withRatings.includes(mainText) || 
                    allBanners.withoutRatings.includes(mainText) ||
                    allBanners.wrappers.includes(mainText);
				})
					.map(function(template) { // Set wrapper target if needed
						var mainText = template.redirectTo
							? template.redirectTo.getMainText()
							: template.getTitle().getMainText();
						if (allBanners.wrappers.includes(mainText)) {
							template.redirectsTo = mw.Title.newFromText("Template:Subst:" + mainText);
						}
						return template;
					});
			});
		});
	parseTalkPromise.then(
		function() { loadDialog.showTaskDone(2); },
		function(code, jqxhr) { loadDialog.showTaskFailed(2, code, jqxhr); }
	);

	// Retrieve and store TemplateData (task 3)
	var templateDataPromise = parseTalkPromise.then(templates => {
		templates.forEach(template => template.setParamDataAndSuggestions());
		return templates;
	});
	templateDataPromise.then(function(){
		loadDialog.showTaskDone(3);
	});

	// Check if page is a redirect (task 4) - but don't error out if request fails
	var redirectCheckPromise = API.getRaw(subjectPage.getPrefixedText())
		.then(
			// Success
			function(rawPage) { 
				if ( /^\s*#REDIRECT/i.test(rawPage) ) {
					// get redirection target, or boolean true
					return rawPage.slice(rawPage.indexOf("[[")+2, rawPage.indexOf("]]")) || true;
				}
				return false;
			},
			// Failure (ignored)
			function() { return null; }
		);
	redirectCheckPromise
		.then(function(){
			loadDialog.showTaskDone(4);
		});

	// Retrieve rating from ORES (task 5, only needed for articles)
	var shouldGetOres = ( config.mw.wgNamespaceNumber <= 1 );
	if ( shouldGetOres ) {
		$("#dialog-loading-5").show();
		var latestRevIdPromise = currentPage.isTalkPage()
			? $.Deferred().resolve(config.mw.wgRevisionId)
			: 	API.get( {
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
					var data = result.enwiki.scores[latestRevId].wp10;
					if ( data.error ) {
						return $.Deferred().reject(data.error.type, data.error.message);
					}
					return data.score.prediction;
				});
		});
		oresPromise.then(
			// Success: show success
			function() {
				loadDialog.showTaskDone(4);
			},
			// Failure: show failure, but still resolve promise (after 2 seconds)
			function(code, jqxhr) {
				loadDialog.showTaskFailed(4, code, jqxhr);
				var waitPromise = $.Deferred();
				setTimeout(waitPromise.resolve, 2000);
				return waitPromise;
			}
		);
	} else {
		// // Set hidden task as done so progress bar can complete?
		// loadDialog.showTaskDone(5);
	}

	$.when(
		loadTalkPromise,
		templateDataPromise,
		redirectCheckPromise,
		shouldGetOres && oresPromise
	)
		.then(
			// All succeded
			function(talkWikitext, banners, redirectTarget, oresPredicition ) {
				var result = {
					success: true,
					talkpage: talkPage,
					talkWikitext: talkWikitext,
					banners: banners
				};
				if (redirectTarget) {
					result.redirectTarget = redirectTarget;
				}
				if (oresPredicition) {
					result.oresPredicition = oresPredicition;
				}
				windowManager.closeWindow(loadDialog, result);
				cache.clearInvalidItems();
			},
			// There was a failure. Wait a few seconds, then close the dialog
			() => setTimeout(()=>windowManager.closeWindow(loadDialog), 3000)
		);

	loadDialogWin.closed.then(function(data) {
		if (data && data.success) {
			setupCompletedPromise.resolve(data);
		} else {
			setupCompletedPromise.reject();
		}
	});

	setupCompletedPromise.then(data=>console.log("setup window closed", data));

	return setupCompletedPromise;
};

export default setupRater;