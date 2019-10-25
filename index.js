/***************************************************************************************************
 Rater --- by Evad37
 > Helps assess WikiProject banners.

 This script is a loader that will load the actual script from User:Evad37/rater/sandbox/app.js 
 once Resource loader modules are loaded and the page DOM is ready

 THIS IS A PRE-APLHA SANDBOX VERSION, NOT INTENDED TO BE FULLY (OR AT ALL) FUNCTIONAL
***************************************************************************************************/
// <nowiki>
$.when(
	// Resource loader modules
	mw.loader.using([
		"mediawiki.util", "mediawiki.api", "mediawiki.Title",
		"oojs-ui-core", "oojs-ui-widgets", "oojs-ui-windows"
	]),
	// Page ready
	$.ready
).then(function() {
	var conf = mw.config.get(["wgNamespaceNumber", "wgPageName"]);
	// Do not operate on Special: pages, nor on non-existent pages or their talk pages
	if ( conf.wgNamespaceNumber < 0 || $("li.new[id|=ca-nstab]").length ) {
		return;
	}
	// Do not operate on top-level User and User_talk pages (only on subpages)
	if (
		conf.wgNamespaceNumber >= 2 &&
		conf.wgNamespaceNumber <= 3 &&
		conf.wgPageName.indexOf("/") === -1
	) {
		return;
	}
	// Otherwise, load the rest of the script
	mw.loader.load( "https://www.mediawiki.org/w/index.php?title=User:Evad37/rater/app.js&action=raw&ctype=text/javascript" );
});
// </nowiki>