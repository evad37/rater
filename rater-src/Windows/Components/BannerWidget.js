import ParameterListWidget from "./ParameterListWidget";
import ParameterWidget from "./ParameterWidget";
import SuggestionLookupTextInputWidget from "./SuggestionLookupTextInputWidget";
import { filterAndMap, classMask, importanceMask } from "../../util";
import {Template, getWithRedirectTo} from "../../Template";

function BannerWidget( template, config ) {
	// Configuration initialization
	config = config || {};
	// Call parent constructor
	BannerWidget.super.call( this, config );
	this.$overlay = config.$overlay;

	/* --- PREFS --- */
	this.preferences = config.preferences;
	
	/* --- PROPS --- */
	this.paramData = template.paramData;
	this.paramAliases = template.paramAliases || {};
	this.name = template.name;
	this.wikitext = template.wikitext;
	this.pipeStyle = template.pipeStyle;
	this.equalsStyle = template.equalsStyle;
	this.endBracesStyle = template.endBracesStyle;
	this.mainText = template.getTitle().getMainText();
	this.redirectTargetMainText = template.redirectTarget && template.redirectTarget.getMainText();
	this.isShellTemplate = template.isShellTemplate();
	this.changed = template.parameters.some(parameter => parameter.autofilled); // initially false, unless some parameters were autofilled
	this.hasClassRatings = template.classes && template.classes.length;
	this.hasImportanceRatings = template.importances && template.importances.length;

	/* --- TITLE AND RATINGS --- */

	this.removeButton = new OO.ui.ButtonWidget( {
		icon: "trash",
		label: "Remove banner",
		title: "Remove banner",
		flags: "destructive",
		$element: $("<div style=\"width:100%\">")
	} );
	this.clearButton = new OO.ui.ButtonWidget( {
		icon: "cancel",
		label: "Clear parameters",
		title: "Clear parameters",
		flags: "destructive",
		$element: $("<div style=\"width:100%\">")
	} );
	this.removeButton.$element.find("a").css("width","100%");
	this.clearButton.$element.find("a").css("width","100%");

	this.titleButtonsGroup = new OO.ui.ButtonGroupWidget( {
		items: [ this.removeButton,	this.clearButton ],
		$element: $("<span style='width:100%;'>"),
	} );

	this.mainLabelPopupButton = new OO.ui.PopupButtonWidget( {
		label: "{{" + template.getTitle().getMainText() + "}}",
		$element: $("<span style='display:inline-block;width:48%;margin-right:0;padding-right:8px'>"),
		$overlay: this.$overlay,
		indicator:"down",
		framed:false,
		popup: {
			$content: this.titleButtonsGroup.$element,
			width: 200,
			padded: false,
			align: "force-right",
			anchor: false
		}
	} );
	this.mainLabelPopupButton.$element
		.children("a").first().css({"font-size":"110%"})
		.find("span.oo-ui-labelElement-label").css({"white-space":"normal"});

	// Rating dropdowns
	if (this.hasClassRatings) {
		this.classDropdown = new OO.ui.DropdownWidget( {
			label: new OO.ui.HtmlSnippet("<span style=\"color:#777\">Class</span>"),
			menu: {
				items: [
					new OO.ui.MenuOptionWidget( {
						data: null,
						label: new OO.ui.HtmlSnippet("<span style=\"color:#777\">(no class)</span>")
					} ),
					...template.classes.map( classname =>
						new OO.ui.MenuOptionWidget( {
							data: classname,
							label: classname
						} )
					)
				],
			},
			$element: $("<span style='display:inline-block;width:24%'>"),
			$overlay: this.$overlay,
		} );
		var classParam = template.parameters.find(parameter => parameter.name === "class");
		this.classDropdown.getMenu().selectItemByData( classParam && classMask(classParam.value) );
	}

	if (this.hasImportanceRatings) {
		this.importanceDropdown = new OO.ui.DropdownWidget( {
			label: new OO.ui.HtmlSnippet("<span style=\"color:#777\">Importance</span>"),
			menu: {
				items: [
					new OO.ui.MenuOptionWidget( {
						data: null, label: new OO.ui.HtmlSnippet("<span style=\"color:#777\">(no importance)</span>")
					} ),
					...template.importances.map(importance =>
						new OO.ui.MenuOptionWidget( {
							data: importance,
							label: importance
						} )
					)
				]
			},
			$element: $("<span style='display:inline-block;width:24%'>"),
			$overlay: this.$overlay,
		} );
		var importanceParam = template.parameters.find(parameter => parameter.name === "importance");
		this.importanceDropdown.getMenu().selectItemByData( importanceParam && importanceMask(importanceParam.value) );
	}

	this.titleLayout = new OO.ui.HorizontalLayout( {
		items: [ this.mainLabelPopupButton ]
	} );
	if (this.hasClassRatings) {
		this.titleLayout.addItems([ this.classDropdown ]);
	}
	if (this.hasImportanceRatings) {
		this.titleLayout.addItems([ this.importanceDropdown ]);
	}

	/* --- PARAMETERS LIST --- */

	var parameterWidgets = filterAndMap(
		template.parameters,
		param => {
			if ( this.isShellTemplate ) {
				return param.name != "1";
			}
			return param.name !== "class" && param.name !== "importance";
		},
		param => new ParameterWidget(param, template.paramData[param.name], {$overlay: this.$overlay})
	);

	this.parameterList = new ParameterListWidget( {
		items: parameterWidgets,
		preferences: this.preferences
	} );

	/* --- ADD PARAMETER SECTION --- */

	this.addParameterNameInput = new SuggestionLookupTextInputWidget({
		suggestions: template.parameterSuggestions,
		placeholder: "parameter name",
		$element: $("<div style='display:inline-block;width:40%'>"),
		validate: function(val) {
			let {validName, name, value} = this.getAddParametersInfo(val);
			return (!name && !value) ? true : validName;
		}.bind(this),
		allowSuggestionsWhenEmpty: true,
		$overlay: this.$overlay
	});
	this.addParameterValueInput = new SuggestionLookupTextInputWidget({
		placeholder: "parameter value",
		$element: $("<div style='display:inline-block;width:40%'>"),
		validate: function(val) {
			let {validValue, name, value} = this.getAddParametersInfo(null, val);
			return (!name && !value) ? true : validValue;
		}.bind(this),
		allowSuggestionsWhenEmpty: true,
		$overlay: this.$overlay
	});
	this.addParameterButton = new OO.ui.ButtonWidget({
		label: "Add",
		icon: "add",
		flags: "progressive"
	}).setDisabled(true);
	this.addParameterControls = new OO.ui.HorizontalLayout( {
		items: [
			this.addParameterNameInput,
			new OO.ui.LabelWidget({label:"="}),
			this.addParameterValueInput,
			this.addParameterButton
		]
	} );
	// Hacks to make this HorizontalLayout go inside a FieldLayout
	this.addParameterControls.getInputId = () => false;
	this.addParameterControls.isDisabled = () => false;
	this.addParameterControls.simulateLabelClick = () => true;

	this.addParameterLayout = new OO.ui.FieldLayout(this.addParameterControls, {
		label: "Add parameter:",
		align: "top"
	}).toggle(false);
	// And another hack
	this.addParameterLayout.$element.find(".oo-ui-fieldLayout-messages").css({
		"clear": "both",
		"padding-top": 0
	});

	/* --- OVERALL LAYOUT/DISPLAY --- */

	// Display the layout elements, and a rule
	this.$element.append(
		this.titleLayout.$element,
		this.parameterList.$element,
		this.addParameterLayout.$element
	);
	if (!this.isShellTemplate) {
		this.$element.append( $("<hr>") );
	}

	if (this.isShellTemplate) {
		this.$element.css({
			"background": "#eee",
			"border-radius": "10px",
			"padding": "0 10px 5px",
			"margin-bottom": "12px",
			"font-size": "92%"			
		});
	}

	/* --- EVENT HANDLING --- */

	if (this.hasClassRatings) {
		this.classDropdown.connect( this, {"labelChange": "onClassChange" } );
	}
	if (this.hasImportanceRatings) {
		this.importanceDropdown.connect( this, {"labelChange": "onImportanceChange" } );
	}
	this.parameterList.connect( this, {
		"change": "onParameterChange",
		"addParametersButtonClick": "showAddParameterInputs",
		"updatedSize": "onUpdatedSize"
	} );
	this.addParameterButton.connect(this, { "click": "onParameterAdd" });
	this.addParameterNameInput.connect(this, {
		"change": "onAddParameterNameChange",
		"enter": "onAddParameterNameEnter",
		"choose": "onAddParameterNameEnter"
	});
	this.addParameterValueInput.connect(this, {
		"change": "onAddParameterValueChange",
		"enter": "onAddParameterValueEnter",
		"choose": "onAddParameterValueEnter"
	});
	this.removeButton.connect(this, {"click": "onRemoveButtonClick"}, );
	this.clearButton.connect( this, {"click": "onClearButtonClick"} );

	/* --- APPLY PREF -- */
	if (this.preferences.bypassRedirects) {
		this.bypassRedirect();
	}

}
OO.inheritClass( BannerWidget, OO.ui.Widget );

/**
 * @param {String} templateName
 * @returns {Promise<BannerWidget>}
 */
BannerWidget.newFromTemplateName = function(templateName, config) {
	var template = new Template();
	template.name = templateName;
	return getWithRedirectTo(template)
		.then(function(template) {
			return $.when(
				template.setClassesAndImportances(),
				template.setParamDataAndSuggestions()
			).then(() => {
				// Add missing required/suggested values
				template.addMissingParams();
				// Return the now-modified template
				return template;
			});
		})
		.then(template => new BannerWidget(template, config));
};

BannerWidget.prototype.onUpdatedSize = function() {
	// Emit an "updatedSize" event so the parent window can update size, if needed
	this.emit("updatedSize");
};

BannerWidget.prototype.onParameterChange = function() {
	this.changed = true;
	if (this.mainText === "WikiProject Biography" || this.redirectTargetMainText === "WikiProject Biography") {
		// Emit event so BannerListWidget can update the banner shell template (if present)
		this.emit("biographyBannerChange");		
	}
};

BannerWidget.prototype.onClassChange = function() {
	this.changed = true;
	var classItem = this.classDropdown.getMenu().findSelectedItem();
	if (classItem && classItem.getData() == null ) {
		// clear selection
		this.classDropdown.getMenu().selectItem();
	}
};

BannerWidget.prototype.onImportanceChange = function() {
	this.changed = true;
	var importanceItem = this.importanceDropdown.getMenu().findSelectedItem();
	if (importanceItem && importanceItem.getData() == null ) {
		// clear selection
		this.classDropdown.getMenu().selectItem();
	}
};

BannerWidget.prototype.showAddParameterInputs = function() {
	this.addParameterLayout.toggle(true);
	this.onUpdatedSize();
};

BannerWidget.prototype.getAddParametersInfo = function(nameInputVal, valueInputVal) {
	var name = nameInputVal && nameInputVal.trim() || this.addParameterNameInput.getValue().trim();
	var paramAlreadyIncluded = name === "class" ||
		name === "importance" ||
		(name === "1" && this.isShellTemplate) ||
		this.parameterList.getParameterItems().some(paramWidget => paramWidget.name === name);
	var value = valueInputVal && valueInputVal.trim() || this.addParameterValueInput.getValue().trim();
	var autovalue = name && this.paramData[name] && this.paramData[name].autovalue || null;
	return {
		validName: !!(name && !paramAlreadyIncluded),
		validValue: !!(value || autovalue),
		isAutovalue: !!(!value && autovalue),
		isAlreadyIncluded: !!(name && paramAlreadyIncluded),
		name,
		value,
		autovalue
	};
};

BannerWidget.prototype.onAddParameterNameChange = function() {
	let { validName, validValue, isAutovalue, isAlreadyIncluded, name, autovalue } = this.getAddParametersInfo();
	// Set value input placeholder as the autovalue
	this.addParameterValueInput.$input.attr( "placeholder",  autovalue || "" );
	// Set suggestions, if the parameter has a list of allowed values
	var allowedValues = this.paramData[name] &&
		this.paramData[name].allowedValues && 
		this.paramData[name].allowedValues.map(val => {return {data: val, label:val}; });
	this.addParameterValueInput.setSuggestions(allowedValues || []);
	// Set button disabled state based on validity
	this.addParameterButton.setDisabled(!validName || !validValue);
	// Show notice if autovalue will be used
	this.addParameterLayout.setNotices( validName && isAutovalue ? ["Parameter value will be autofilled"] : [] );
	// Show error is the banner already has the parameter set
	this.addParameterLayout.setErrors( isAlreadyIncluded ? ["Parameter is already present"] : [] );
};

BannerWidget.prototype.onAddParameterNameEnter = function() {
	this.addParameterValueInput.focus();
};

BannerWidget.prototype.onAddParameterValueChange = function() {
	let { validName, validValue, isAutovalue } = this.getAddParametersInfo();
	this.addParameterButton.setDisabled(!validName || !validValue);
	this.addParameterLayout.setNotices( validName && isAutovalue ? ["Parameter value will be autofilled"] : [] ); 
};

BannerWidget.prototype.onAddParameterValueEnter = function() {
	// Make sure button state has been updated
	this.onAddParameterValueChange();
	// Do nothing if button is disabled (i.e. name and/or value are invalid)
	if ( this.addParameterButton.isDisabled() ) {
		return;
	}
	// Add parameter
	this.onParameterAdd();
};

BannerWidget.prototype.onParameterAdd = function() {
	let { validName, validValue, name, value, autovalue }  = this.getAddParametersInfo();
	if (!validName || !validValue) {
		// Error should already be shown via onAddParameter...Change methods
		return;
	}
	var newParameter = new ParameterWidget(
		{
			"name": name,
			"value": value || autovalue
		},
		this.paramData[name],
		{$overlay: this.$overlay}
	);
	this.parameterList.addItems([newParameter]);
	this.addParameterNameInput.setValue("");
	this.addParameterValueInput.setValue("");
	this.addParameterNameInput.$input.focus();
};

BannerWidget.prototype.onRemoveButtonClick = function() {
	this.emit("remove");
};

BannerWidget.prototype.onClearButtonClick = function() {
	this.parameterList.clearItems(
		this.parameterList.getParameterItems()
	);
	if ( this.hasClassRatings ) {
		this.classDropdown.getMenu().selectItem();
	}
	if ( this.hasImportanceRatings ) {
		this.importanceDropdown.getMenu().selectItem();
	}
};

BannerWidget.prototype.bypassRedirect = function() {
	if (!this.redirectTargetMainText) {
		return;
	}
	// Update title label
	this.mainLabelPopupButton.setLabel("{{" + this.redirectTargetMainText + "}}");
	// Update properties
	this.name = this.redirectTargetMainText;
	this.mainText = this.redirectTargetMainText;
	this.redirectTargetMainText = null;
	this.changed = true;
};

BannerWidget.prototype.makeWikitext = function() {
	if (!this.changed && this.wikitext) {
		return this.wikitext;
	}
	var pipe = this.pipeStyle;
	var equals = this.equalsStyle;
	var classItem = this.hasClassRatings && this.classDropdown.getMenu().findSelectedItem();
	var classVal = classItem && classItem.getData();
	var importanceItem = this.hasImportanceRatings && this.importanceDropdown.getMenu().findSelectedItem();
	var importanceVal = importanceItem && importanceItem.getData();

	return "{{" +
		this.name +
		( this.hasClassRatings && classVal!=null ? `${pipe}class${equals}${classVal||""}` : "" ) +
		( this.hasImportanceRatings && importanceVal!=null ? `${pipe}importance${equals}${importanceVal||""}` : "" ) +
		this.parameterList.getParameterItems()
			.map(parameter => parameter.makeWikitext(pipe, equals))
			.join("") +
		this.endBracesStyle;
};

BannerWidget.prototype.setPreferences = function(prefs) {
	this.preferences = prefs;
	if (this.preferences.bypassRedirects) {
		this.bypassRedirect();
	}
	this.parameterList.setPreferences(prefs);
};

export default BannerWidget;