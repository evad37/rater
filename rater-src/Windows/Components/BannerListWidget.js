import config from "../../config";
import BannerWidget from "./BannerWidget";
import { normaliseYesNo, filterAndMap, uniqueArray } from "../../util";
import ParameterWidget from "./ParameterWidget";
// <nowiki>

var BannerListWidget = function BannerListWidget( config ) {
	config = config || {};

	// Call parent constructor
	BannerListWidget.parent.call( this, config );
	OO.ui.mixin.GroupElement.call( this, {
		$group: this.$element
	} );
	this.$element.addClass("rater-bannerListWidget").css({"padding":"20px 10px 16px 10px"});

	// Prefs
	this.preferences = config.preferences;
	
	this.oresClass = config.oresClass;
	
	this.changed = false;

	// Events
	this.aggregate( {"remove": "bannerRemove"} );
	this.connect( this, {"bannerRemove": "onBannerRemove"} );

	this.aggregate( {"changed": "bannerChanged"} );
	this.connect( this, {"bannerChanged": "setChanged"} );

	this.aggregate( {"biographyBannerChange": "biographyBannerChanged"} );
	this.connect( this, {"biographyBannerChanged": "syncShellTemplateWithBiographyBanner"} );

	this.aggregate( {"updatedSize": "bannerUpdatedSize"} );
	this.connect( this, {"bannerUpdatedSize": "onUpdatedSize"} );
};

OO.inheritClass( BannerListWidget, OO.ui.Widget );
OO.mixinClass( BannerListWidget, OO.ui.mixin.GroupElement );
/*
methods from mixin:
 - addItems( items, [index] ) : OO.ui.Element  (CHAINABLE)
 - clearItems( ) : OO.ui.Element  (CHAINABLE)
 - findItemFromData( data ) : OO.ui.Element|null
 - findItemsFromData( data ) : OO.ui.Element[]
 - removeItems( items ) : OO.ui.Element  (CHAINABLE)
*/

BannerListWidget.prototype.onUpdatedSize = function() {
	// Emit an "updatedSize" event so the parent window can update size, if needed
	this.emit("updatedSize");
};

BannerListWidget.prototype.setChanged = function() {
	this.changed = true;
};

BannerListWidget.prototype.onBannerRemove = function ( banner ) {
	this.removeItems([banner]);
	this.setChanged();
};

BannerListWidget.prototype.syncShellTemplateWithBiographyBanner = function( biographyBanner ) {
	biographyBanner = biographyBanner || this.items.find(
		banner => banner.mainText === "WikiProject Biography" || banner.redirectTargetMainText === "WikiProject Biography"
	);
	if (!biographyBanner) return;

	const bannerShellTemplate = this.items.find(
		banner => banner.mainText === config.shellTemplates[0] || banner.redirectTargetMainText === config.shellTemplates[0]
	);
	if (!bannerShellTemplate) {
		return;
	}

	const paramsToSync = [
		{ name: "living", normalise: true },
		{ name: "blpo", normalise: true },
		{ name: "activepol", normalise: true },
		{ name: "listas", normalise: false },
	];
	paramsToSync.forEach(paramToSync => {
		const [biographyParam, shellParam] = [biographyBanner, bannerShellTemplate].map(banner =>
			banner.parameterList.getParameterItems()
				.find(parameter =>
					parameter.name === paramToSync.name ||
					banner.paramAliases[parameter.name] === paramToSync.name
				)
		);
		if (!biographyParam) return;

		const paramSyncValue = paramToSync.normalise ? normaliseYesNo(biographyParam.value) : biographyParam.value;
		biographyParam.delete();

		if (!shellParam && paramSyncValue) {
			const index = bannerShellTemplate.addParameterLayout.isVisible()
				? -1 // Insert at the very end
				: bannerShellTemplate.parameterList.items.length-1; // Insert prior to the "add parameter" button
			bannerShellTemplate.parameterList.addItems([
				new ParameterWidget( {
					"name": paramToSync.name,
					"value": paramSyncValue,
					"autofilled": true
				},
				bannerShellTemplate.paramData && bannerShellTemplate.paramData[paramToSync.name]
				)
			], index);
		} else if (!biographyParam.autofilled && paramSyncValue) {
			shellParam.setValue( paramSyncValue );
			shellParam.setAutofilled();
		}
	});
};

BannerListWidget.prototype.addShellTemplateIfNeeeded = function () {
	if (
		!this.items.some(banner => banner.isShellTemplate)
	) {
		BannerWidget.newFromTemplateName(
			config.shellTemplates[0],
			{withoutRatings: true},
			{preferences: this.preferences, isArticle: this.pageInfo.isArticle}
		).then(shellBannerWidget => {
			OO.ui.mixin.GroupElement.prototype.addItems.call( this, [shellBannerWidget], 0 );
			// Autofill ratings (if able to)
			this.autofillClassRatings({forBannerShell: true});
			// emit updatedSize event 
			this.onUpdatedSize();
		});
	}

	return this;
};


BannerListWidget.prototype.addItems = function ( items, index ) {

	if ( items.length === 0 ) {
		return this;
	}

	// Call mixin method to do the adding
	OO.ui.mixin.GroupElement.prototype.addItems.call( this, items, index );

	// Autofill ratings (if able to, and if enabled in preferences)
	if (!this.items.some(banner => banner.isShellTemplate)) {
		this.autofillClassRatings();
	}
	this.autofillImportanceRatings();

	// emit updatedSize event 
	this.onUpdatedSize();

	return this;
};

BannerListWidget.prototype.autofillClassRatings = function(config) {
	config = config || {};
	// Only autofill if set in preferences
	if (!this.preferences.autofillClassFromOthers && !this.preferences.autofillClassFromOres && !config.forBannerShell) {
		return;
	}
	// Check what banners already have
	const uniqueClassRatings = uniqueArray( filterAndMap(
		this.items,
		banner => {
			if (banner.isShellTemplate || !banner.hasClassRatings) {
				return false;
			}
			const classItem = banner.classDropdown.getMenu().findSelectedItem();
			return classItem && classItem.getData();
		},
		banner => banner.classDropdown.getMenu().findSelectedItem().getData()
	));
	// Can't autofill if there isn't either a single value, or no value
	if (uniqueClassRatings.length > 1) {
		return;
	}
	// Determine what to autofill with
	let autoClass;
	if (uniqueClassRatings.length === 1 && (this.preferences.autofillClassFromOthers || config.forBannerShell)) {
		autoClass = uniqueClassRatings[0];
	} else if (uniqueClassRatings.length === 0 && this.preferences.autofillClassFromOres && this.oresClass) {
		// Don't autofill above C-class
		switch(this.oresClass) {
		case "Stub": case "Start": case "C": case "List":
			autoClass = this.oresClass;
		}
	} else {
		// nothing to do
		return;
	}
	// Do the autofilling
	this.items.forEach(banner => {
		if (!banner.hasClassRatings && !banner.isShellTemplate) {
			return;
		}
		const classItem = banner.classDropdown.getMenu().findSelectedItem();
		if (classItem && classItem.getData() && !config.forBannerShell) {
			return;
		}
		if (config.forBannerShell && !banner.isShellTemplate && classItem.getData() === autoClass) {
			banner.classDropdown.getMenu().selectItemByData(null);
			return;
		}
		banner.classDropdown.getMenu().selectItemByData(autoClass);
		banner.classDropdown.setAutofilled(true);
	});
};

BannerListWidget.prototype.autofillImportanceRatings = function() {
	if (!this.preferences.autofillImportance) {
		return;
	}
	const isRegularArticle = this.pageInfo && this.pageInfo.isArticle && !this.pageInfo.redirect && !this.pageInfo.isDisambig;
	if (!isRegularArticle) {
		return;
	}
	// TODO: Should try to find a smarter, banner-specific way of determining importance.
	// Maybe do something with  ORES's "drafttopic" model.
	const autoImportance = "Low";
	this.items.forEach(banner => {
		if (!banner.hasImportanceRatings) {
			return;
		}
		const importanceItem = banner.importanceDropdown.getMenu().findSelectedItem();
		if (importanceItem && importanceItem.getData()) {
			return;
		}
		banner.importanceDropdown.getMenu().selectItemByData(autoImportance);
		banner.importanceDropdown.setAutofilled(true);
	});
};

BannerListWidget.prototype.setPreferences = function(prefs) {
	this.preferences = prefs;
	this.items.forEach(banner => banner.setPreferences(prefs));
	this.autofillClassRatings();
	this.autofillImportanceRatings();
};

BannerListWidget.prototype.makeWikitext = function() {
	var bannersWikitext = filterAndMap(
		this.items,
		banner => !banner.isShellTemplate,
		banner => banner.makeWikitext()
	).join("\n");
	var shellTemplate = this.items.find(banner => banner.isShellTemplate);
	if (!shellTemplate) {
		return bannersWikitext;
	}
	var shellParam1 = new ParameterWidget({
		name:"1",
		value: "\n" + bannersWikitext + "\n" +
			(shellTemplate.nonStandardTemplates	? shellTemplate.nonStandardTemplates + "\n" : "")
	});
	shellTemplate.parameterList.addItems([ shellParam1 ]);
	var shellWikitext = shellTemplate.makeWikitext();
	shellTemplate.parameterList.removeItems([ shellParam1 ]);
	return shellWikitext;
};

export default BannerListWidget;
// </nowiki>