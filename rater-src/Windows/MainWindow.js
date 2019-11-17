import BannerWidget from "./Components/BannerWidget";
import BannerListWidget from "./Components/BannerListWidget";
import appConfig from "../config";
import API, { makeErrorMsg } from "../api";
import PrefsFormWidget from "./Components/PrefsFormWidget";
import { setPrefs as ApiSetPrefs } from "../prefs";
import { parseTemplates } from "../Template";
import TopBarWidget from "./Components/TopBarWidget";
import { filterAndMap, uniqueArray } from "../util";

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
		title: "Preferences",
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

	this.topBar.connect(this, {
		"searchSelect": "onSearchSelect",
		"setClasses": "onSetClasses",
		"setImportances": "onSetImportances",
		"removeAll": "onRemoveAll",
		"clearAll": "onClearAll"
	});
	this.bannerList.connect(this, {"updatedSize": "updateSize"});
};

MainWindow.prototype.makeDraggable = function() {
	let $frameEl = this.$element.find(".oo-ui-window-frame");
	let $handleEl = this.$element.find(".oo-ui-processDialog-location").css({"cursor":"move"});
	// Position for css translate transformations, relative to initial position
	// (which is centered on viewport when scrolled to top)
	let position = { x: 0, y: 0 };
	const constrain = function(val, minVal, maxVal) {
		if (val < minVal) return minVal;
		if (val > maxVal) return maxVal;
		return val;
	};
	const constrainX = (val) => {
		// Don't too far horizontally (leave at least 100px visible)
		let limit = window.innerWidth/2 + $frameEl.outerWidth()/2 - 100;
		return constrain(val, -1*limit, limit);
	};
	const constrainY = (val) => {
		// Can't take title bar off the viewport, since it's the drag handle
		let minLimit = -1*(window.innerHeight - $frameEl.outerHeight())/2;
		// Don't go too far down the page: (whole page height) - (initial position)
		let maxLimit = (document.documentElement||document).scrollHeight - window.innerHeight/2;
		return constrain(val, minLimit, maxLimit);
	};

	let pointerdown = false;
	let dragFrom = {};

	let onDragStart = event => {
		pointerdown = true;
		dragFrom.x = event.clientX;
		dragFrom.y = event.clientY;
	};
	let onDragMove = event => {
		if (!pointerdown || dragFrom.x == null || dragFrom.y === null) {
			return;
		}
		const dx = event.clientX - dragFrom.x;
		const dy = event.clientY - dragFrom.y;
		dragFrom.x = event.clientX;
		dragFrom.y = event.clientY;
		position.x = constrainX(position.x + dx);
		position.y = constrainY(position.y + dy);
		$frameEl.css("transform", `translate(${position.x}px, ${position.y}px)`);
	};
	let onDragEnd = () => {
		pointerdown = false;
		delete dragFrom.x;
		delete dragFrom.y;
		// Make sure final positions are whole numbers
		position.x = Math.round(position.x);
		position.y = Math.round(position.y);
		$frameEl.css("transform", `translate(${position.x}px, ${position.y}px)`);
	};

	// Use pointer events if available; otherwise use mouse events
	const pointer = ("PointerEvent" in window) ? "pointer" : "mouse";
	$handleEl.on(pointer+"enter.raterMainWin", () => $frameEl.css("will-change", "transform") ); // Tell browser to optimise transform
	$handleEl.on(pointer+"leave.raterMainWin", () => { if (!pointerdown) $frameEl.css("will-change", ""); } ); // Remove optimisation if not dragging
	$handleEl.on(pointer+"down.raterMainWin", onDragStart);
	$("body").on(pointer+"move.raterMainWin", onDragMove);
	$("body").on(pointer+"up.raterMainWin", onDragEnd);
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
			this.makeDraggable();
			// Set up preferences
			this.setPreferences(data.preferences);
			this.prefsForm.setPrefValues(data.preferences);
			// Set up edit mode banners
			this.actions.setMode("edit");
			this.bannerList.oresClass = data.ores && data.ores.prediction;
			this.bannerList.addItems(
				data.banners.map( bannerTemplate => new BannerWidget(
					bannerTemplate,
					{ preferences: this.preferences,
						$overlay: this.$overlay }
				) )
			);
			// Show ORES prediction, if available
			if (data.ores) {
				this.oresClass = data.ores.prediction;
				this.oresLabel.toggle(true).$element.find(".oresPrediction").append(
					$("<strong>").text(data.ores.prediction),
					"&nbsp;(" + data.ores.probability + ")"
				);
			}
			// Set props for use in making wikitext and edit summaries
			this.talkWikitext = data.talkWikitext;
			this.existingBannerNames = data.banners.map( bannerTemplate => bannerTemplate.name );
			this.talkpage = data.talkpage;
			// Force a size update to ensure eveything fits okay
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
		return new OO.ui.Process().next(
			API.editWithRetry(
				this.talkpage.getPrefixedText(),
				{rvsection: 0},
				revision => ({
					section: 0,
					text: this.transformTalkWikitext(revision.content),
					summary: this.makeEditSummary(),
					watchlist: this.preferences.watchlist
				})
			).catch((code, err) => $.Deferred().reject(
				new OO.ui.Error(
					$("<div>").append(
						$("<strong style='display:block;'>").text("Could not save your changes."),
						$("<span style='color:#777'>").text( makeErrorMsg(code, err) )
					)
				)
			) )
		).next( () => this.close() );

	} else if ( action === "preview" ) {
		return new OO.ui.Process().next(
			API.post({
				action: "parse",
				contentmodel: "wikitext",
				text: this.transformTalkWikitext(this.talkWikitext) + "\n<hr>\n" + "'''Edit summary:''' " + this.makeEditSummary(),
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
						result.compare["*"],
						$("<tfoot>").append(
							$("<tr>").append(
								$("<td colspan='4'>").append(
									$("<strong>").text("Edit summary: "),
									this.makeEditSummary()
								)
							)
						)
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

			this.$element.find(".oo-ui-window-frame").css("transform","");
			this.$element.find(".oo-ui-processDialog-location").off(".raterMainWin");
			$("body").off(".raterMainWin");
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
		this.topBar.searchBox.popPending().focus();
		return;
	}
	var existingBanner = this.bannerList.items.find(banner => {
		return banner.mainText === name ||	banner.redirectTargetMainText === name;
	});

	// Abort and show alert if banner already exists
	if (existingBanner) {
		this.topBar.searchBox.popPending();
		return OO.ui.alert("There is already a {{" + name + "}} banner").then(this.searchBox.focus());
	}

	// Confirmation required for banners missing WikiProject from name, and for uncreated disambiguation talk pages
	var confirmText;
	if (!/^[Ww](?:P|iki[Pp]roject)/.test(name)) {
		confirmText = new OO.ui.HtmlSnippet(
			"{{" + name + "}} is not a recognised WikiProject banner.<br/>Do you want to continue?"
		);
	} else if (name === "WikiProject Disambiguation" && $("#ca-talk.new").length !== 0 && this.bannerList.items.length === 0) {
		// eslint-disable-next-line no-useless-escape
		confirmText = "New talk pages shouldn't be created if they will only contain the \{\{WikiProject Disambiguation\}\} banner. Continue?";
		// TODO: ask for confirmation
	}
	$.when( confirmText ? OO.ui.confirm(confirmText) : true)
		.then( confirmed => {
			if (!confirmed) return;
			// Create Template object
			return BannerWidget.newFromTemplateName(name, {preferences: this.preferences, $overlay: this.$overlay})
				.then(banner => {
					this.bannerList.addItems( [banner] );
					this.updateSize();
				});
		})
		.then( () => this.topBar.searchBox.setValue("").focus().popPending() );
};

MainWindow.prototype.onSetClasses = function(classVal) {
	this.bannerList.items.forEach(banner => {
		if (banner.hasClassRatings) {
			banner.classDropdown.getMenu().selectItemByData(classVal);
			banner.classDropdown.setAutofilled(false);
		}
	});
};

MainWindow.prototype.onSetImportances = function(importanceVal) {
	this.bannerList.items.forEach(banner => {
		if (banner.hasImportanceRatings) {
			banner.importanceDropdown.getMenu().selectItemByData(importanceVal);
			banner.importanceDropdown.setAutofilled(false);
		}
	});
};

MainWindow.prototype.onRemoveAll = function() {
	this.bannerList.clearItems();
};

MainWindow.prototype.onClearAll = function() {
	this.bannerList.items.forEach( banner => banner.onClearButtonClick() );
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

MainWindow.prototype.makeEditSummary = function() {
	const removedBanners = [];
	const editedBanners = [];
	const newBanners = [];
	const shortName = name => name.replace("WikiProject ","").replace("Subst:","");

	// Overall class/importance, if all the same
	const allClasses = uniqueArray(
		filterAndMap(this.bannerList.items,
			banner => banner.hasClassRatings,
			banner => banner.classDropdown.getValue()
		)
	);
	let overallClass = allClasses.length === 1 && allClasses[0];
	const allImportances = uniqueArray(
		filterAndMap(this.bannerList.items,
			banner => banner.hasImportanceRatings,
			banner => banner.importanceDropdown.getValue()
		)
	);
	let overallImportance = allImportances.length === 1 && allImportances[0];
	// Don't use them unless some have changed
	let someClassesChanged = false;
	let someImportancesChanged = false;

	// removed banners:
	this.existingBannerNames.forEach(name => {
		const banner = this.bannerList.items.find( banner => banner.name === name || banner.bypassedName === name );
		if (!banner) {
			removedBanners.push("−" + shortName(name));
		}
	});
	// edited & new banners
	this.bannerList.items.forEach( banner => {
		const isNew = !banner.wikitext; // not added from wikitext on page
		if (!isNew && !banner.changed) {
			// Not changed
			return;
		}
		let newClass = banner.hasClassRatings &&  (isNew || banner.classChanged) && banner.classDropdown.getValue();
		if (newClass) { someClassesChanged = true; }
		if (overallClass) { newClass = null; }

		let newImportance = banner.hasImportanceRatings && (isNew || banner.importanceChanged) && banner.importanceDropdown.getValue();
		if (newImportance) { someImportancesChanged = true; }
		if (overallImportance) { newImportance = null; }

		let rating = (newClass && newImportance)
			? newClass + "/" + newImportance
			: newClass || newImportance || "";
		if (rating) { rating = " (" + rating + ")"; }
		
		if (isNew) {
			newBanners.push("+" + shortName(banner.name) + rating);
		} else {
			editedBanners.push(shortName(banner.name) + rating);
		}
	});
	// overall rating
	let overallRating = (someClassesChanged && overallClass && someImportancesChanged && overallImportance)
		? overallClass + "/" + overallImportance
		: (someClassesChanged && overallClass) || (someImportancesChanged && overallImportance) || "";
	if (overallRating) { overallRating = " (" + overallRating + ")"; }

	return `Assessment${overallRating}: ${[...editedBanners, ...newBanners, ...removedBanners].join(", ")}${appConfig.script.advert}`;
};

export default MainWindow;