import BannerWidget from "./Components/BannerWidget";
import BannerListWidget from "./Components/BannerListWidget";
import appConfig from "../config";
import API, { makeErrorMsg } from "../api";
import PrefsFormWidget from "./Components/PrefsFormWidget";
import { setPrefs as ApiSetPrefs } from "../prefs";
import { parseTemplates } from "../Template";
import TopBarWidget from "./Components/TopBarWidget";

function MainWindow( config ) {
	MainWindow.super.call( this, config );
}
OO.inheritClass( MainWindow, OO.ui.ProcessDialog );

MainWindow.static.name = "main";
MainWindow.static.title = $("<span>").css({"font-weight":"normal"}).append(
	$("<a>").css({"font-weight": "bold"}).attr({"href": mw.util.getUrl("WP:RATER"), "target": "_blank"}).text("Rater"),
	" (",
	$("<a>").attr({"href": mw.util.getUrl("WT:RATER"), "target": "_blank"}).text("talk"),
	") ",
	$("<span>").css({"font-size":"90%"}).text("v"+appConfig.script.version)
);
MainWindow.static.size = "large";
MainWindow.static.actions = [
	// Primary (top right):
	{
		label: "X", // not using an icon since color becomes inverted, i.e. white on light-grey
		title: "Close (and discard any changes)",
		flags: "primary",
		modes: ["edit", "diff", "preview"] // available when current mode isn't "prefs"
	},
	// Safe (top left)
	{
		action: "showPrefs",
		flags: "safe",
		icon: "settings",
		title: "help",
		modes: ["edit", "diff", "preview"] // available when current mode isn't "prefs"
	},
	// Others (bottom)
	{
		action: "save",
		accessKey: "s",
		label: new OO.ui.HtmlSnippet("<span style='padding:0 1em;'>Save</span>"),
		flags: ["primary", "progressive"],
		modes: ["edit", "diff", "preview"] // available when current mode isn't "prefs"
	},
	{
		action: "preview",
		accessKey: "p",
		label: "Show preview",
		modes: ["edit", "diff"] // available when current mode isn't "preview" or "prefs"
	},
	{
		action: "changes",
		accessKey: "v",
		label: "Show changes",
		modes: ["edit", "preview"] // available when current mode isn't "diff" or "prefs"
	},
	{
		action: "back",
		label: "Back",
		modes: ["diff", "preview"] // available when current mode is "diff" or "prefs"
	},
	
	// "prefs" mode only
	{
		action: "savePrefs",
		label: "Update",
		flags: ["primary", "progressive"],
		modes: "prefs" 
	},
	{
		action: "closePrefs",
		label: "Cancel",
		flags: "safe",
		modes: "prefs"
	}
];

// Customize the initialize() function: This is where to add content to the dialog body and set up event handlers.
MainWindow.prototype.initialize = function () {
	// Call the parent method.
	MainWindow.super.prototype.initialize.call( this );

	/* --- PREFS --- */
	this.preferences = appConfig.defaultPrefs;
	
	/* --- TOP BAR --- */
	this.topBar = new TopBarWidget({
		$overlay: this.$overlay
	} );
	this.$head.css({"height":"73px"}).append(this.topBar.$element);

	/* --- FOOTER --- */
	this.oresLabel = new OO.ui.LabelWidget({
		$element: $("<span style='float:right; padding: 10px; max-width: 33.33%; text-align: center;'>"),
		label: $("<span>").append(
			$("<a>")
				.attr({"href":mw.util.getUrl("mw:ORES"), "target":"_blank"})
				.append(
					$("<img>")
						.css({"vertical-align": "text-bottom;"})
						.attr({
							"src": "//upload.wikimedia.org/wikipedia/commons/thumb/5/51/Objective_Revision_Evaluation_Service_logo.svg/40px-Objective_Revision_Evaluation_Service_logo.svg.png",
							"title": "Machine predicted quality from ORES",
							"alt": "ORES logo",
							"width": "20px",
							"height": "20px"
						})
				),
			" ",
			$("<span class='oresPrediction'>")
		)
	}).toggle(false);
	this.$foot.prepend(this.oresLabel.$element);

	/* --- CONTENT AREA --- */

	// Banners added dynamically upon opening, so just need a layout with an empty list
	this.bannerList = new BannerListWidget({
		preferences: this.preferences
	});
	this.editLayout = new OO.ui.PanelLayout( {
		padded: false,
		expanded: false,
		$content: this.bannerList.$element
	} );

	// Preferences, filled in with current prefs upon loading.
	// TODO: Make this into a component, add fields and inputs
	this.prefsForm = new PrefsFormWidget();
	this.prefsLayout = new OO.ui.PanelLayout( {
		padded: true,
		expanded: false,
		$content: this.prefsForm.$element
	} );

	// Preview, Show changes
	this.parsedContentContainer = new OO.ui.FieldsetLayout( {
		label: "Preview"
	} );
	this.parsedContentWidget = new OO.ui.LabelWidget( {label: "",	$element:$("<div>")	});
	this.parsedContentContainer.addItems([
		new OO.ui.FieldLayout(
			this.parsedContentWidget,			
			{ align: "top" }
		)
	]);
	this.parsedContentLayout = new OO.ui.PanelLayout( {
		padded: true,
		expanded: false,
		$content: this.parsedContentContainer.$element
	} );

	this.contentArea = new OO.ui.StackLayout( {
		items: [
			this.editLayout,
			this.prefsLayout,
			this.parsedContentLayout
		],
		padded: false,
		expanded: false
	} );

	this.$body.css({"top":"73px"}).append(this.contentArea.$element);

	/* --- EVENT HANDLING --- */

	this.topBar.connect(this, {"searchSelect": "onSearchSelect"});
	this.bannerList.connect(this, {"updatedSize": "updateSize"});
};

// Override the getBodyHeight() method to specify a custom height
MainWindow.prototype.getBodyHeight = function () {
	var currentlayout = this.contentArea.getCurrentItem();
	var layoutHeight = currentlayout && currentlayout.$element.outerHeight(true);
	var contentHeight = currentlayout && currentlayout.$element.children(":first-child").outerHeight(true);
	return Math.max(200, layoutHeight, contentHeight);
};

// Use getSetupProcess() to set up the window with data passed to it at the time 
// of opening
MainWindow.prototype.getSetupProcess = function ( data ) {
	data = data || {};
	return MainWindow.super.prototype.getSetupProcess.call( this, data )
		.next( () => {
			this.actions.setMode("edit");
			this.setPreferences(data.preferences);
			this.prefsForm.setPrefValues(data.preferences);
			this.bannerList.oresClass = data.ores && data.ores.prediction;
			// Set up window based on data
			this.bannerList.addItems(
				data.banners.map( bannerTemplate => new BannerWidget(
					bannerTemplate,
					{ preferences: this.preferences,
						$overlay: this.$overlay }
				) )
			);
			if (data.ores) {
				this.oresClass = data.ores.prediction;
				this.oresLabel.toggle(true).$element.find(".oresPrediction").append(
					$("<strong>").text(data.ores.prediction),
					"&nbsp;(" + data.ores.probability + ")"
				);
			}

			this.talkWikitext = data.talkWikitext;
			this.existingBannerNames = data.banners.map( bannerTemplate => bannerTemplate.name );
			this.talkpage = data.talkpage;
			this.updateSize();
		}, this );
};

// Set up the window it is ready: attached to the DOM, and opening animation completed
MainWindow.prototype.getReadyProcess = function ( data ) {
	data = data || {};
	return MainWindow.super.prototype.getReadyProcess.call( this, data )
		.next( () => this.topBar.searchBox.focus() );
};

// Use the getActionProcess() method to do things when actions are clicked
MainWindow.prototype.getActionProcess = function ( action ) {
	// FIXME: Make these actually do the things.
	if ( action === "showPrefs" ) {
		this.actions.setMode("prefs");
		this.contentArea.setItem( this.prefsLayout );
		this.topBar.setDisabled(true);
		this.updateSize();

	} else if ( action === "savePrefs" ) {
		var updatedPrefs = this.prefsForm.getPrefs();
		return new OO.ui.Process().next(
			ApiSetPrefs(updatedPrefs).then(
				// Success
				() => {
					this.setPreferences(updatedPrefs);
					this.actions.setMode("edit");
					this.contentArea.setItem( this.editLayout );
					this.topBar.setDisabled(false);
					this.updateSize();
				},
				// Failure
				(code, err) => $.Deferred().reject(
					new OO.ui.Error(
						$("<div>").append(
							$("<strong style='display:block;'>").text("Could not save preferences."),
							$("<span style='color:#777'>").text( makeErrorMsg(code, err) )
						)
					)
				)
			)
		);

	} else if ( action === "closePrefs" ) {
		console.log("[Rater] Close prefs clicked!");
		this.actions.setMode("edit");
		this.contentArea.setItem( this.editLayout );
		this.topBar.setDisabled(false);
		this.prefsForm.setPrefValues(this.preferences);
		this.updateSize();

	} else if ( action === "save" ) {
		var bannersWikitext = this.bannerList.makeWikitext();
		
		console.log("[Rater] Save clicked!");
		console.log(bannersWikitext);

		var dialog = this;   
		return new OO.ui.Process( function () {
			// Do something about the edit.
			dialog.close();
		} );

	} else if ( action === "preview" ) {
		return new OO.ui.Process().next(
			API.post({
				action: "parse",
				contentmodel: "wikitext",
				text: this.transformTalkWikitext(this.talkWikitext),
				title: this.talkpage.getPrefixedText(),
				pst: 1
			}).then( result => {
				if ( !result || !result.parse || !result.parse.text || !result.parse.text["*"] ) {
					return $.Deferred().reject("Empty result");
				}
				var previewHtmlSnippet = new OO.ui.HtmlSnippet(result.parse.text["*"]);

				this.parsedContentWidget.setLabel(previewHtmlSnippet);
				this.parsedContentContainer.setLabel("Preview:");
				this.actions.setMode("preview");
				this.contentArea.setItem( this.parsedContentLayout );
				this.topBar.setDisabled(true);
				this.updateSize();
			})
				.catch( (code, err) => $.Deferred().reject(
					new OO.ui.Error(
						$("<div>").append(
							$("<strong style='display:block;'>").text("Could not show changes."),
							$("<span style='color:#777'>").text( makeErrorMsg(code, err) )
						)
					)
				) )
		);

	} else if ( action === "changes" ) {
		return new OO.ui.Process().next(
			API.post({
				action: "compare",
				format: "json",
				fromtext: this.talkWikitext,
				fromcontentmodel: "wikitext",
				totext: this.transformTalkWikitext(this.talkWikitext),
				tocontentmodel: "wikitext",
				prop: "diff"
			})
				.then( result => {
					if ( !result || !result.compare || !result.compare["*"] ) {
						return $.Deferred().reject("Empty result");
					}
					var $diff = $("<table>").css("width", "100%").append(
						$("<tr>").append(
							$("<th>").attr({"colspan":"2", "scope":"col"}).css("width", "50%").text("Latest revision"),
							$("<th>").attr({"colspan":"2", "scope":"col"}).css("width", "50%").text("New text")
						),
						result.compare["*"]
					);

					this.parsedContentWidget.setLabel($diff);
					this.parsedContentContainer.setLabel("Changes:");
					this.actions.setMode("diff");
					this.contentArea.setItem( this.parsedContentLayout );
					this.topBar.setDisabled(true);
					this.updateSize();
				} )
				.catch( (code, err) => $.Deferred().reject(
					new OO.ui.Error(
						$("<div>").append(
							$("<strong style='display:block;'>").text("Could not show changes."),
							$("<span style='color:#777'>").text( makeErrorMsg(code, err) )
						)
					)
				) )
		);

	} else if ( action === "back" ) {
		this.actions.setMode("edit");
		this.contentArea.setItem( this.editLayout );
		this.topBar.setDisabled(false);
		this.updateSize();
	}

	return MainWindow.super.prototype.getActionProcess.call( this, action );
};

// Use the getTeardownProcess() method to perform actions whenever the dialog is closed.
// `data` is the data passed into the window's .close() method.
MainWindow.prototype.getTeardownProcess = function ( data ) {
	return MainWindow.super.prototype.getTeardownProcess.call( this, data )
		.first( () => {
			this.bannerList.clearItems();
			this.topBar.searchBox.setValue("");
			this.contentArea.setItem( this.editLayout );
			this.topBar.setDisabled(false);
			this.oresLabel.toggle(false).$element.find(".oresPrediction").empty();
		} );
};

MainWindow.prototype.setPreferences = function(prefs) {
	this.preferences = $.extend({}, appConfig.defaultPrefs, prefs);
	// Applies preferences to existing items in the window:
	this.bannerList.setPreferences(this.preferences);
};

MainWindow.prototype.onSearchSelect = function() {
	this.topBar.searchBox.pushPending();
	var name = this.topBar.searchBox.getValue().trim();
	if (!name) {
		this.topBar.searchBox.popPending();
		return;
	}
	var existingBanner = this.bannerList.items.find(banner => {
		return banner.mainText === name ||	banner.redirectTargetMainText === name;
	});
	if (existingBanner) {
		// TODO: show error message
		console.log("There is already a {{" + name + "}} banner");
		this.topBar.searchBox.popPending();
		return;
	}
	if (!/^[Ww](?:P|iki[Pp]roject)/.test(name)) {
		var message = new OO.ui.HtmlSnippet(
			"<code>{{" + name + "}}</code> is not a recognised WikiProject banner.<br/>Do you want to continue?"
		);
		// TODO: ask for confirmation
		console.log(message);
	}
	if (name === "WikiProject Disambiguation" && $("#ca-talk.new").length !== 0 && this.bannerList.items.length === 0) {
		// eslint-disable-next-line no-useless-escape
		var noNewDabMessage = "New talk pages shouldn't be created if they will only contain the \{\{WikiProject Disambiguation\}\} banner. Continue?";
		// TODO: ask for confirmation
		console.log(noNewDabMessage);
	}
	// Create Template object
	BannerWidget.newFromTemplateName(name, {preferences: this.preferences, $overlay: this.$overlay})
		.then(banner => {
			this.bannerList.addItems( [banner] );
			this.updateSize();
			this.topBar.searchBox.setValue("");
			this.topBar.searchBox.popPending();
		});
};

MainWindow.prototype.transformTalkWikitext = function(talkWikitext) {
	var bannersWikitext = this.bannerList.makeWikitext();
	if (!talkWikitext) {
		return bannersWikitext.trim();
	}
	// Reparse templates, in case talkpage wikitext has changed
	var talkTemplates = parseTemplates(talkWikitext, true);
	// replace existing banners wikitext with a control character
	talkTemplates.forEach(template => {
		if (this.existingBannerNames.includes(template.name)) {
			talkWikitext = talkWikitext.replace(template.wikitext, "\x01");
		}
	});
	// replace insertion point (first control character) with a different control character
	talkWikitext = talkWikitext.replace("\x01", "\x02");
	// remove other control characters
	/* eslint-disable-next-line no-control-regex */
	talkWikitext = talkWikitext.replace(/(?:\s|\n)*\x01(?:\s|\n)*/g,"");
	// split into wikitext before/after the remaining control character (and trim each section)
	var talkWikitextSections = talkWikitext.split("\x02").map(t => t.trim());
	if (talkWikitextSections.length === 2) {
		// Found the insertion point for the banners
		return (talkWikitextSections[0] + "\n" + bannersWikitext.trim() + "\n" + talkWikitextSections[1]).trim();
	}
	// Check if there's anything beside templates
	var tempStr = talkWikitext;
	talkTemplates.forEach(template => {
		tempStr = tempStr.replace(template.wikitext, "");
	});
	if (tempStr.trim()) {
		// There is non-template content, so insert at the start
		return bannersWikitext.trim() + "\n" + talkWikitext.trim();
	} else {
		// Everything is a template, so insert at the end
		return talkWikitext.trim() + "\n" + bannersWikitext.trim();
	}
};

export default MainWindow;