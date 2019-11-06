import BannerWidget from "./Components/BannerWidget";
import BannerListWidget from "./Components/BannerListWidget";
import SuggestionLookupTextInputWidget from "./Components/SuggestionLookupTextInputWidget";
import * as cache from "../cache";
import {getBannerOptions} from "../getBanners";
import appConfig from "../config";
import { filterAndMap, makeErrorMsg } from "../util";
import ParameterWidget from "./Components/ParameterWidget";
import PrefsFormWidget from "./Components/PrefsFormWidget";
import { setPrefs as ApiSetPrefs } from "../prefs";

function MainWindow( config ) {
	MainWindow.super.call( this, config );
}
OO.inheritClass( MainWindow, OO.ui.ProcessDialog );

MainWindow.static.name = "main";
MainWindow.static.title = "Rater";
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
		label: new OO.ui.HtmlSnippet("<span style='padding:0 1em;'>Save</span>"),
		flags: ["primary", "progressive"],
		modes: ["edit", "diff", "preview"] // available when current mode isn't "prefs"
	},
	{
		action: "preview",
		label: "Show preview",
		modes: ["edit", "diff"] // available when current mode isn't "preview" or "prefs"
	},
	{
		action: "changes",
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
	
	/* --- TOP BAR --- */
	
	// Search box
	this.searchBox = new SuggestionLookupTextInputWidget( {
		placeholder: "Add a WikiProject...",
		suggestions: cache.read("bannerOptions"),
		$element: $("<div style='display:inline-block;margin-right:-1px;width:calc(100% - 45px);'>"),
		$overlay: this.$overlay,
	} );
	getBannerOptions().then(bannerOptions => this.searchBox.setSuggestions(bannerOptions));
	this.addBannerButton = new OO.ui.ButtonWidget( {
		icon: "add",
		title: "Add",
		flags: "progressive",
		$element: $("<span style='float:right;margin:0'>"),
	} );
	var $searchContainer = $("<div style='display:inline-block;width: calc(100% - 220px);min-width: 220px;float:left'>")
		.append(this.searchBox.$element, this.addBannerButton.$element);

	// Set all classes/importances, in the style of a popup button with a menu.
	// (Is actually a dropdown with a hidden label, because that makes the coding easier.)
	this.setAllDropDown = new OO.ui.DropdownWidget( {
		icon: "tag",
		label: "Set all...",
		invisibleLabel: true,
		menu: {
			items: [
				new OO.ui.MenuSectionOptionWidget( {
					label: "Classes"
				} ),
				...appConfig.bannerDefaults.classes.map(classname => new OO.ui.MenuOptionWidget( {
					data: {class: classname.toLowerCase()},
					label: classname
				} )
				),
				new OO.ui.MenuSectionOptionWidget( {
					label: "Importances"
				} ),
				...appConfig.bannerDefaults.importances.map(importance => new OO.ui.MenuOptionWidget( {
					data: {importance: importance.toLowerCase()},
					label: importance
				} )
				)
			]
		},
		$element: $("<span style=\"width:auto;display:inline-block;float:left;margin:0\" title='Set all...'>"),
		$overlay: this.$overlay,
	} );

	// Remove all banners button
	this.removeAllButton = new OO.ui.ButtonWidget( {
		icon: "trash",
		title: "Remove all",
		flags: "destructive"
	} );

	// Clear all parameters button
	this.clearAllButton = new OO.ui.ButtonWidget( {
		icon: "cancel",
		title: "Clear all",
		flags: "destructive"
	} );

	// Group the buttons together
	this.menuButtons = new OO.ui.ButtonGroupWidget( {
		items: [
			this.removeAllButton,
			this.clearAllButton
		],
		$element: $("<span style='float:left;'>"),
	} );
	this.menuButtons.$element.prepend(this.setAllDropDown.$element);

	// Put everything into a layout
	this.topBar = new OO.ui.PanelLayout( {
		expanded: false,
		framed: false,
		padded: false,
		$element: $("<div style='position:fixed;width:100%;background:#ccc'>")
	} );
	this.topBar.$element.append(
		$searchContainer,
		//this.setAllDropDown.$element,
		this.menuButtons.$element
	);
	this.topBar.setDisabled = (disable => [
		this.searchBox,
		this.addBannerButton,
		this.setAllDropDown,
		this.menuButtons
	].forEach(widget => widget.setDisabled(disable))
	);

	// Append to the default dialog header
	this.$head.css({"height":"73px"}).append(this.topBar.$element);

	/* --- CONTENT AREA --- */

	// Banners added dynamically upon opening, so just need a layout with an empty list
	this.bannerList = new BannerListWidget();
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

	this.searchBox.connect(this, {"enter": "onSearchSelect" });
	this.addBannerButton.connect(this, {"click": "onSearchSelect"});
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
			this.preferences = data.preferences;
			this.prefsForm.setPrefValues(data.preferences);
			// Set up window based on data
			this.bannerList.addItems(
				data.banners.map(bannerTemplate => new BannerWidget(bannerTemplate))
			);
			this.talkWikitext = data.talkWikitext;
			this.talkpage = data.talkpage;
			this.updateSize();
		}, this );
};

// Set up the window it is ready: attached to the DOM, and opening animation completed
MainWindow.prototype.getReadyProcess = function ( data ) {
	data = data || {};
	return MainWindow.super.prototype.getReadyProcess.call( this, data )
		.next( () => this.searchBox.focus() );
};

// Use the getActionProcess() method to do things when actions are clicked
MainWindow.prototype.getActionProcess = function ( action ) {
	// FIXME: Make these actually do the things.
	if ( action === "showPrefs" ) {
		//console.log("[Rater] Prefs clicked!");
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
					this.preferenecs = updatedPrefs;
					// TODO: Actually apply the updated preferences
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
							$("<span style='color:#777>").text( makeErrorMsg(code, err) )
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
		var bannersWikitext = filterAndMap(
			this.bannerList.items,
			banner => !banner.isShellTemplate,
			banner => banner.makeWikitext()
		).join("\n");
		console.log("Banners", bannersWikitext);
		var shellTemplate = this.bannerList.items.find(banner => banner.isShellTemplate);
		if (shellTemplate) {
			shellTemplate.parameterList.addItems([ new ParameterWidget({name:"1", value:"\n"+bannersWikitext+"\n"}) ]);
			console.log("Shell+Banners", shellTemplate.makeWikitext());
		}
		var dialog = this;   
		return new OO.ui.Process( function () {
			// Do something about the edit.
			dialog.close();
		} );
	} else if ( action === "preview" ) {
		console.log("[Rater] Preview clicked!");
		let placeholderHtml = "<div class=\"mw-parser-output\"><table class=\"plainlinks tmbox tmbox-notice\" role=\"presentation\" style=\"background:#FFF;\"><tbody><tr><td class=\"mbox-image\"><a href=\"/wiki/Wikipedia:WikiProject_X\" title=\"Wikipedia:WikiProject X\"><img alt=\"WikiProject X icon.svg\" src=\"//upload.wikimedia.org/wikipedia/commons/thumb/c/c1/WikiProject_X_icon.svg/20px-WikiProject_X_icon.svg.png\" decoding=\"async\" width=\"20\" height=\"20\" srcset=\"//upload.wikimedia.org/wikipedia/commons/thumb/c/c1/WikiProject_X_icon.svg/30px-WikiProject_X_icon.svg.png 1.5x, //upload.wikimedia.org/wikipedia/commons/thumb/c/c1/WikiProject_X_icon.svg/40px-WikiProject_X_icon.svg.png 2x\" data-file-width=\"224\" data-file-height=\"224\" /></a></td><td class=\"mbox-text\">This page is a component of <a href=\"/wiki/Wikipedia:WikiProject_X\" title=\"Wikipedia:WikiProject X\">WikiProject X</a>, a project to enhance the WikiProject experience.</td></tr></tbody></table></div>";

		this.parsedContentWidget.setLabel(new OO.ui.HtmlSnippet(placeholderHtml));
		this.parsedContentContainer.setLabel("Preview:");
		this.actions.setMode("preview");
		this.contentArea.setItem( this.parsedContentLayout );
		this.topBar.setDisabled(true);
		this.updateSize();		
	} else if ( action === "changes" ) {
		console.log("[Rater] Changes clicked!");
		let placeholderHtml = `<table class="diff diff-contentalign-left" data-mw="interface">
<colgroup><col class="diff-marker">
<col class="diff-content">
<col class="diff-marker">
<col class="diff-content">
</colgroup><tbody><tr>
<td colspan="2" class="diff-lineno">Line 59:</td>
<td colspan="2" class="diff-lineno">Line 59:</td>
</tr>
<tr>
<td class="diff-marker">&nbsp;</td>
<td class="diff-context"><div><a href="//en.wikipedia.org/wiki/Category:FK_LAFC_Lu%C4%8Denec_players" style="text-decoration: none; color: inherit; color: expression(parentElement.currentStyle.color)" title="Category:FK LAFC Lučenec players">[[:Category:FK LAFC Lučenec players]]</a></div></td>
<td class="diff-marker">&nbsp;</td>
<td class="diff-context"><div><a href="//en.wikipedia.org/wiki/Category:FK_LAFC_Lu%C4%8Denec_players" style="text-decoration: none; color: inherit; color: expression(parentElement.currentStyle.color)" title="Category:FK LAFC Lučenec players">[[:Category:FK LAFC Lučenec players]]</a></div></td>
</tr>
<tr>
<td class="diff-marker">−</td>
<td class="diff-deletedline"><div>[[:Category:<del class="diffchange diffchange-inline">FK</del> <del class="diffchange diffchange-inline">Železiarne</del> Podbrezová managers]]</div></td>
<td class="diff-marker">+</td>
<td class="diff-addedline"><div>[[:Category:<ins class="diffchange diffchange-inline">ŽP</ins> <ins class="diffchange diffchange-inline">Šport</ins> Podbrezová managers]]</div></td>
</tr>
<tr>
<td class="diff-marker">&nbsp;</td>
<td class="diff-context"><div><a href="//en.wikipedia.org/wiki/Category:FC_Nitra_managers" style="text-decoration: none; color: inherit; color: expression(parentElement.currentStyle.color)" title="Category:FC Nitra managers">[[:Category:FC Nitra managers]]</a></div></td>
<td class="diff-marker">&nbsp;</td>
<td class="diff-context"><div><a href="//en.wikipedia.org/wiki/Category:FC_Nitra_managers" style="text-decoration: none; color: inherit; color: expression(parentElement.currentStyle.color)" title="Category:FC Nitra managers">[[:Category:FC Nitra managers]]</a></div></td>
</tr>
</tbody></table>`;

		this.parsedContentWidget.setLabel(new OO.ui.HtmlSnippet(placeholderHtml));
		this.parsedContentContainer.setLabel("Changes:");
		this.actions.setMode("diff");
		this.contentArea.setItem( this.parsedContentLayout );
		this.topBar.setDisabled(true);
		this.updateSize();	
	} else if ( action === "back" ) {
		this.actions.setMode("edit");
		this.contentArea.setItem( this.editLayout );
		this.topBar.setDisabled(false);
		this.updateSize();
	}
	return MainWindow.super.prototype.getActionProcess.call( this, action );
};


MainWindow.prototype.onSearchSelect = function() {
	var name = this.searchBox.getValue().trim();
	if (!name) {
		return;
	}
	var existingBanner = this.bannerList.items.find(banner => {
		return banner.mainText === name ||	banner.redirectTargetMainText === name;
	});
	if (existingBanner) {
		// TODO: show error message
		console.log("There is already a {{" + name + "}} banner");
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
	BannerWidget.newFromTemplateName(name)
		.then(banner => {
			this.bannerList.addItems( [banner] );
			this.updateSize();
		});
};

export default MainWindow;