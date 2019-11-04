import BannerWidget from "./Components/BannerWidget";
import BannerListWidget from "./Components/BannerListWidget";
import SuggestionLookupTextInputWidget from "./Components/SuggestionLookupTextInputWidget";
import * as cache from "../cache";
import {getBannerOptions} from "../getBanners";
import appConfig from "../config";
import { filterAndMap } from "../util";
import ParameterWidget from "./Components/ParameterWidget";

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
	},
	// Safe (top left)
	{
		action: "help",
		flags: "safe",
		label: "?", // not using icon, to mirror Close action
		title: "help"
	},
	// Others (bottom)
	{
		action: "save",
		label: new OO.ui.HtmlSnippet("<span style='padding:0 1em;'>Save</span>"),
		flags: ["primary", "progressive"]
	},
	{
		action: "preview",
		label: "Show preview"
	},
	{
		action: "changes",
		label: "Show changes"
	},
	{
		label: "Cancel"
	}
];

// Customize the initialize() function: This is where to add content to the dialog body and set up event handlers.
MainWindow.prototype.initialize = function () {
	// Call the parent method.
	MainWindow.super.prototype.initialize.call( this );
	// this.outerLayout = new OO.ui.StackLayout( {
	// 	items: [
	// 		this.topBar,
	// 		this.contentLayout
	// 	],
	// 	continuous: true,
	// 	expanded: true
	// } );
	
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

	// Bypass all redirects button
	this.bypassAllButton = new OO.ui.ButtonWidget( {
		icon: "articleRedirect",
		title: "Bypass all redirects"
	} );

	// Group the buttons together
	this.menuButtons = new OO.ui.ButtonGroupWidget( {
		items: [
			this.removeAllButton,
			this.clearAllButton,
			this.bypassAllButton
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

	// Append to the default dialog header
	this.$head.css({"height":"73px"}).append(this.topBar.$element);

	/* --- CONTENT AREA --- */

	// Banners added dynamically upon opening, so just need a layout with an empty list
	this.bannerList = new BannerListWidget();

	this.$body.css({"top":"73px"}).append(this.bannerList.$element);

	/* --- EVENT HANDLING --- */

	this.searchBox.connect(this, {"enter": "onSearchSelect" });
	this.addBannerButton.connect(this, {"click": "onSearchSelect"});
};

// Override the getBodyHeight() method to specify a custom height
MainWindow.prototype.getBodyHeight = function () {
	return Math.max(200, this.bannerList.$element.outerHeight( true ));
};

// Use getSetupProcess() to set up the window with data passed to it at the time 
// of opening
MainWindow.prototype.getSetupProcess = function ( data ) {
	data = data || {};
	return MainWindow.super.prototype.getSetupProcess.call( this, data )
		.next( () => {
			// TODO: Set up window based on data
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
	if ( action === "help" ) {
		console.log("[Rater] Help clicked!");
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
	} else if ( action === "changes" ) {
		console.log("[Rater] Changes clicked!");
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