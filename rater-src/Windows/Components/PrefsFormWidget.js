import config from "../../config";

function PrefsFormWidget( config ) {
	// Configuration initialization
	config = config || {};
	// Call parent constructor
	PrefsFormWidget.super.call( this, config );

	this.$element.addClass("rater-prefsFormWidget");

	this.layout =  new OO.ui.FieldsetLayout( {
		label: "Preferences",
		$element: this.$element
	} );

	this.preferences = {
		"autostart": {
			input: new OO.ui.ToggleSwitchWidget(),
			label: "Autostart Rater"
		},
		"autostartRedirects": {
			input: new OO.ui.ToggleSwitchWidget(),
			label: "Autostart on redirects"
		},
		"autostartNamespaces": {
			input: new mw.widgets.NamespacesMultiselectWidget(),
			label: "Autostart in these namespaces"
		},
		"minForShell": {
			input: new OO.ui.NumberInputWidget( { "min": 2 } ),
			label: "Minimun number of banners for WikiProject banner shell"
		},
		"bypassRedirects": {
			input: new OO.ui.ToggleSwitchWidget(),
			label: "Bypass redirects to banners"
		},
		"autofillClassFromOthers":  {
			input: new OO.ui.ToggleSwitchWidget(),
			label: "Autofill class from other banners"
		},
		"autofillClassFromOres": {
			input: new OO.ui.ToggleSwitchWidget(),
			label: "Autofill class based on ORES prediction"
		},
		"autofillImportance": {
			input: new OO.ui.ToggleSwitchWidget(),
			label: "Autofill low importance"
		},
		"collapseParamsLowerLimit": {
			input: new OO.ui.NumberInputWidget( { "min": 1 } ),
			label: "Minimum number of parameters to show uncollapsed"
		},
		"watchlist": {
			input: new OO.ui.ButtonSelectWidget( {
				items: [
					new OO.ui.ButtonOptionWidget( {
						data: "preferences",
						label: "Default",
						title: "Uses the same setting as if you manually edited the page, as per Special:Preferences"
					} ),
					new OO.ui.ButtonOptionWidget( {
						data: "watch",
						label: "Always",
						title: "Always add pages Rater edits to your watchlist"
					} ),
					new OO.ui.ButtonOptionWidget( {
						data: "nochange",
						label: "Never",
						title: "Never add pages Rater edit to your watchlist"
					} ),
				]
			}).selectItemByData("preferences"),
			label: "Add edited pages to watchlist"
		}
	};

	for (let prefName in this.preferences ) {
		this.layout.addItems([
			new OO.ui.FieldLayout( this.preferences[prefName].input, {
				label: this.preferences[prefName].label,
				align: "right"
			} )
		]);
	}
}
OO.inheritClass( PrefsFormWidget, OO.ui.Widget );

PrefsFormWidget.prototype.setPrefValues = function(prefs) {
	for (let prefName in prefs ) {
		let value = prefs[prefName];
		let input = this.preferences[prefName] && this.preferences[prefName].input;
		switch (input && input.constructor.name) {
		case "OoUiButtonSelectWidget":
			input.selectItemByData(value);
			break;
		case "OoUiNumberInputWidget":
		case "OoUiToggleSwitchWidget":
			input.setValue(value);
			break;
		case "MwWidgetsNamespacesMultiselectWidget":
			input.clearItems();
			value.forEach(ns =>
				input.addTag(
					ns.toString(),
					ns === 0
						? "(Main)"
						: config.mw.wgFormattedNamespaces[ns]
				)
			);
			break;
		}
	}
};

PrefsFormWidget.prototype.getPrefs = function() {
	var prefs = {};
	for (let prefName in this.preferences ) {
		let input = this.preferences[prefName].input;
		let value;
		switch (input.constructor.name) {
		case "OoUiButtonSelectWidget":
			value = input.findSelectedItem().getData();
			break;
		case "OoUiToggleSwitchWidget":
			value = input.getValue();
			break;
		case "OoUiNumberInputWidget":
			value = Number(input.getValue()); // widget uses strings, not numbers!
			break;
		case "MwWidgetsNamespacesMultiselectWidget":
			value = input.getValue().map(Number); // widget uses strings, not numbers!
			break;
		}
		prefs[prefName] = value;
	}
	return prefs;
};

export default PrefsFormWidget;