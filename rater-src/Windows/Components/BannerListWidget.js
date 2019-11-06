import config from "../../config";
import BannerWidget from "./BannerWidget";
import { normaliseYesNo, filterAndMap } from "../../util";
import ParameterWidget from "./ParameterWidget";

var BannerListWidget = function BannerListWidget( config ) {
	config = config || {};

	// Call parent constructor
	BannerListWidget.parent.call( this, config );
	OO.ui.mixin.GroupElement.call( this, {
		$group: this.$element
	} );
	this.$element.css({"padding":"20px 10px 16px 10px"});

	// Prefs
	this.preferences = config.preferences;

	// Events
	this.aggregate( {"remove": "bannerRemove"} );
	this.connect( this, {"bannerRemove": "onBannerRemove"} );

	this.aggregate( {"biographyBannerChange": "biographyBannerChanged"} );
	this.connect( this, {"biographyBannerChanged": "syncShellTemplateWithBiographyBanner"} );
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

BannerListWidget.prototype.onBannerRemove = function ( banner ) {
	this.removeItems([banner]);
};

BannerListWidget.prototype.syncShellTemplateWithBiographyBanner = function( biographyBanner ) {
	var bannerShellTemplate = this.items.find(
		banner => banner.mainText === config.shellTemplates[0] || banner.redirectTargetMainText === config.shellTemplates[0]
	);
	if (!bannerShellTemplate) {
		return;
	}

	const paramsToSync = ["living", "blpo", "activepol"];
	paramsToSync.forEach(paramToSync => {
		let [biographyParam, shellParam] = [biographyBanner, bannerShellTemplate].map(banner =>
			banner.parameterList.getParameterItems()
				.find(parameter =>
					parameter.name === paramToSync ||
					banner.paramAliases[parameter.name] === paramToSync
				)
		);
		if (biographyParam && !shellParam) {
			let index = bannerShellTemplate.addParameterLayout.isVisible()
				? -1 // Insert at the very end
				: bannerShellTemplate.parameterList.items.length-1; // Insert prior to the "add parameter" button
			bannerShellTemplate.parameterList.addItems([
				new ParameterWidget( {
					"name": paramToSync,
					"value": normaliseYesNo(biographyParam.value),
					"autofilled": true
				},
				bannerShellTemplate.paramData && bannerShellTemplate.paramData[paramToSync]
				)
			], index);
		} else if (biographyParam && shellParam && normaliseYesNo(shellParam.value) !== normaliseYesNo(biographyParam.value)) {
			shellParam.setValue( normaliseYesNo(biographyParam.value) );
			shellParam.setAutofilled();
		}
	});
};

BannerListWidget.prototype.addItems = function ( items, index ) {

	if ( items.length === 0 ) {
		return this;
	}

	// Call mixin method to do the adding
	OO.ui.mixin.GroupElement.prototype.addItems.call( this, items, index );

	// Add a bannershell template, but only if more than two banners and there isn't already one 
	if (
		this.items.length >= this.preferences.minForShell &&
		!this.items.some(banner => banner.isShellTemplate)
	) {
		BannerWidget.newFromTemplateName(config.shellTemplates[0], {preferences: this.preferences})
			.then(shellBannerWidget => {
				OO.ui.mixin.GroupElement.prototype.addItems.call( this, [shellBannerWidget], 0 );
				var biographyBanner =  this.items.find(
					banner => banner.mainText === "WikiProject Biography" || banner.redirectTargetMainText === "WikiProject Biography"
				);
				if (biographyBanner) {
					this.syncShellTemplateWithBiographyBanner(biographyBanner);
				}
			});
	}
	return this;
};

BannerListWidget.prototype.setPreferences = function(prefs) {
	this.preferences = prefs;
	this.items.forEach(banner => banner.setPreferences(prefs));
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
	var shellParam1 = new ParameterWidget({name:"1", value:"\n"+bannersWikitext+"\n"});
	shellTemplate.parameterList.addItems([ shellParam1 ]);
	var shellWikitext = shellTemplate.makeWikitext();
	shellTemplate.parameterList.removeItems([ shellParam1 ]);
	return shellWikitext;
};

export default BannerListWidget;