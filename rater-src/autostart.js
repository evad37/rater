import config from "./config";
import {API, makeErrorMsg} from "./util";
import setupRater from "./setup";

var autoStart = function autoStart() {
	if ( window.rater_autostartNamespaces == null || config.mw.wgIsMainPage ) {
		return;
	}
	
	var autostartNamespaces = ( $.isArray(window.rater_autostartNamespaces) ) ? window.rater_autostartNamespaces : [window.rater_autostartNamespaces];
	
	if ( -1 === autostartNamespaces.indexOf(config.mw.wgNamespaceNumber) ) {
		return;
	}
	
	if ( /(?:\?|&)(?:action|diff|oldid)=/.test(window.location.href) ) {
		return;
	}
	
	// Check if talk page exists
	if ( $("#ca-talk.new").length ) {
		setupRater();
		return;
	}
	
	var thisPage = mw.Title.newFromText(config.mw.wgPageName);
	var talkPage = thisPage && thisPage.getTalkPage();
	if (!talkPage) {
		return;
	}

	/* Check templates present on talk page. Fetches indirectly transcluded templates, so will find
		Template:WPBannerMeta (and its subtemplates). But some banners such as MILHIST don't use that
		meta template, so we also have to check for template titles containg 'WikiProject'
	*/
	API.get({
		action: "query",
		format: "json",
		prop: "templates",
		titles: talkPage.getPrefixedText(),
		tlnamespace: "10",
		tllimit: "500",
		indexpageids: 1
	})
		.done(function(result) {
			var id = result.query.pageids;
			var templates = result.query.pages[id].templates;
		
			if ( !templates ) {
				setupRater();
				return;
			}
		
			var hasWikiproject = templates.some(template => /(WikiProject|WPBanner)/.test(template.title));
		
			if ( !hasWikiproject ) {
				setupRater();
				return;
			}
		
		})
		.fail(function(code, jqxhr) {
		// Silently ignore failures (just log to console)
			console.warn(
				"[Rater] Error while checking whether to autostart." +
			( code == null ) ? "" : " " + makeErrorMsg(code, jqxhr)
			);
		});

};

export default autoStart;