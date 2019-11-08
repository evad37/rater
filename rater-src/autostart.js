import config from "./config";
import { getPrefs } from "./prefs";
import API, { makeErrorMsg } from "./api";
import setupRater from "./setup";

var autoStart = function autoStart() {

	return getPrefs().then(prefs => {
		// Check if pref is turned off
		if (!prefs.autostart) {
			return;
		}
		// Check if pref is turned off for redirects, and current page is a redirect
		if (!prefs.autostartRedirects && window.location.search.includes("redirect=no")) {
			return;
		}
		// Check if viewing diff/history/old version
		if (/(action|diff|oldid)/.test(window.location.search)) {
			return;
		}
		const subjectTitle = mw.Title.newFromText(config.mw.wgPageName).getSubjectPage();
		// Check if subject page is the main page
		if (subjectTitle.getPrefixedText() === "Main Page") {
			return;
		}
		// Check subject page namespace
		if (
			prefs.autostartNamespaces &&
			prefs.autostartNamespaces.length &&
			!prefs.autostartNamespaces.includes(config.mw.wgNamespaceNumber)
		) {
			return;
		}
	
		// If talk page does not exist, can just autostart
		if ( $("#ca-talk.new").length ) {
			return setupRater();
		}	

		/* Check templates present on talk page. Fetches indirectly transcluded templates, so will find
			Template:WPBannerMeta (and its subtemplates). But some banners such as MILHIST don't use that
			meta template, so we also have to check for template titles containg 'WikiProject'
		*/
		const talkTitle = mw.Title.newFromText(config.mw.wgPageName).getTalkPage();
		return API.get({
			action: "query",
			format: "json",
			prop: "templates",
			titles: talkTitle.getPrefixedText(),
			tlnamespace: "10",
			tllimit: "500",
			indexpageids: 1
		})
			.then(function(result) {
				var id = result.query.pageids;
				var templates = result.query.pages[id].templates;
			
				if ( !templates ) {
					return setupRater();
				}
			
				var hasWikiproject = templates.some(template => /(WikiProject|WPBanner)/.test(template.title));
			
				if ( !hasWikiproject ) {
					return setupRater();
				}
			
			},
			function(code, jqxhr) {
			// Silently ignore failures (just log to console)
				console.warn(
					"[Rater] Error while checking whether to autostart." +
				( code == null ) ? "" : " " + makeErrorMsg(code, jqxhr)
				);
				return $.Deferred().reject();
			});
	});

};

export default autoStart;