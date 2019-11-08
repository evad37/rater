import { normaliseYesNo, filterAndMap } from "../../util";

function ParameterWidget( parameter, paramData, config ) {
	// Configuration initialization
	config = config || {};
	// Call parent constructor
	ParameterWidget.super.call( this, config );
	this.$overlay = config.$overlay;
    
	this.name = parameter.name;
	this.value = parameter.value;
	this.autofilled = parameter.autofilled;
	this.isInvalid = parameter.value == null;
	this.paramData = paramData || {};
	this.allowedValues = this.paramData.allowedValues || [];
	this.isRequired = this.paramData.required;
	this.isSuggested = this.paramData.suggested;

	// Make a checkbox if only 1 or 2 allowed values
	switch(this.allowedValues.length) {	/* eslint-disable no-fallthrough */
	case 1:
		this.allowedValues[1] = null;
		/* fall-through */
	case 2:
		var isFirstAllowedVal = (
			this.allowedValues.indexOf( parameter.value ) === 0 ||
				this.allowedValues.map(normaliseYesNo).indexOf( normaliseYesNo(parameter.value) ) === 0
		);
		var isSecondAllowedVal = (
			this.allowedValues.indexOf( parameter.value || null ) === 1 ||
				this.allowedValues.map(normaliseYesNo).indexOf( parameter.value ? normaliseYesNo(parameter.value) : null) === 1
		);
		var isIndeterminate = !isFirstAllowedVal && !isSecondAllowedVal;
		this.checkbox = new OO.ui.CheckboxInputWidget( {
			selected: isIndeterminate ? undefined : isFirstAllowedVal,
			indeterminate: isIndeterminate ? true : undefined,
			$element: $("<label style='margin:0 0 0 5px'>")
		} );
		break;
	default:
			// No checkbox
	} /* eslint-enable no-fallthrough */

	/* --- EDIT PARAMETER LAYOUT --- */

	this.input = new OO.ui.ComboBoxInputWidget( {
		value: this.value,
		// label: parameter.name + " =",
		// labelPosition: "before",
		options: filterAndMap(
			this.allowedValues,
			val => val!==null,
			val => ({data: val, label:val})
		),
		$element: $("<div style='margin-bottom:0;'>"),
		$overlay: this.$overlay
	} );
	// Reduce the excessive whitespace/height
	this.input.$element.find("input").css({
		"padding-top": 0,
		"padding-bottom": "2px",
		"height": "24px"
	});
	// Fix label positioning within the reduced height
	this.input.$element.find("span.oo-ui-labelElement-label").css({"line-height": "normal"});
	// Also reduce height of dropdown button (if options are present)
	this.input.$element.find("a.oo-ui-buttonElement-button").css({
		"padding-top": 0,
		"height": "24px",
		"min-height": "0"
	});

	this.confirmButton = new OO.ui.ButtonWidget({
		icon: "check",
		label: "Done",
		framed: false,
		flags: "progressive",
		$element: $("<span style='margin-right:0'>")
	});

	this.cancelButton = new OO.ui.ButtonWidget({
		icon: "undo",
		label: "Cancel",
		framed: false,
	});

	this.deleteButton = new OO.ui.ButtonWidget({
		icon: this.isRequired ? "restore" : "trash",
		label: this.isRequired ? "Required parameter" : "Delete",
		framed: false,
		flags: "destructive",
		disabled: this.isRequired
	});

	this.editButtonControls = new OO.ui.ButtonGroupWidget({
		items: [
			this.confirmButton,
			this.cancelButton,
			this.deleteButton
		],
		$element: $("<span style='font-size:92%'>")
	});
	this.editButtonControls.$element.find("a span:first-child").css({
		"min-width": "unset",
		"width": "16px",
		"margin-right": 0
	});

	this.editLayoutControls = new OO.ui.HorizontalLayout({
		items: [
			this.input,
			this.editButtonControls
		],
		//$element: $("<div style='width: 48%;margin:0;'>")
	});
	// Hacks to make this HorizontalLayout go inside a FieldLayout
	this.editLayoutControls.getInputId = () => false;
	this.editLayoutControls.isDisabled = () => false;
	this.editLayoutControls.simulateLabelClick = () => true;

	this.editLayout = new OO.ui.FieldLayout( this.editLayoutControls, {
		label: this.name + " =",
		align: "top",
		help: this.paramData.description && this.paramData.description.en || false,
		helpInline: true
	}).toggle();
	this.editLayout.$element.find("label.oo-ui-inline-help").css({"margin": "-10px 0 5px 10px"});

	/* --- READ (COLLAPSED) DISPLAY OF PARAMETER --- */

	this.invalidIcon = new OO.ui.IconWidget( {
		icon: "block",
		title: "Invalid parameter: no value specified!",
		flags: "destructive",
		$element: $("<span style='margin: 0 5px 0 -5px; min-width: 16px; width: 16px;'>")
	} ).toggle(this.isInvalid);
	this.fullLabel = new OO.ui.LabelWidget({
		label:this.name +
			(this.value
				? " = " + this.value
				: " "
			),	
		$element: $("<label style='margin: 0;'>")
	});
	this.autofilledIcon = new OO.ui.IconWidget( {
		icon: "robot",
		title: "Autofilled by Rater",
		flags: "progressive",
		$element: $("<span style='margin: 0 -5px 0 5px;min-width: 16px;width: 16px;'>")
	} ).toggle(this.autofilled);
	this.editButton = new OO.ui.ButtonWidget({
		icon: "edit",
		framed: false,
		$element: $("<span style='margin-bottom: 0;'>")
	});
	this.editButton.$element.find("a").css({
		"border-radius": "0 10px 10px 0",
		"margin-left": "5px"
	});
	this.editButton.$element.find("a span").first().css({
		"min-width": "unset",
		"width": "16px"
	});

	this.readLayout = new OO.ui.HorizontalLayout({
		items: [
			this.invalidIcon,
			this.fullLabel,
			this.autofilledIcon,
			this.editButton
		],
		$element: $("<span style='margin:0;width:unset;'>")
	});
	if (this.checkbox) {
		this.readLayout.addItems([this.checkbox], 2);
	}

	/* --- CONTAINER FOR BOTH LAYOUTS --- */
	this.$element = $("<div>")
		.css({
			"width": "unset",
			"display": "inline-block",
			"border": this.autofilled ? "1px dashed #36c" : "1px solid #ddd",
			"border-radius": "10px",
			"padding-left": "10px",
			"margin": "0 8px 8px 0",
			"background": this.isInvalid ? "#fddd" : "#fffe"
		})
		.append(this.readLayout.$element, this.editLayout.$element);
    
	this.editButton.connect( this, { "click": "onEditClick" } );
	this.confirmButton.connect( this, { "click": "onConfirmClick" } );
	this.cancelButton.connect( this, { "click": "onCancelClick" } );
	this.deleteButton.connect( this, { "click": "onDeleteClick" } );
	if (this.checkbox) {
		this.checkbox.connect(this, {"change": "onCheckboxChange"} );
	}
}
OO.inheritClass( ParameterWidget, OO.ui.Widget );

ParameterWidget.prototype.onUpdatedSize = function() {
	// Emit an "updatedSize" event so the parent window can update size, if needed
	this.emit("updatedSize");
};

ParameterWidget.prototype.onEditClick = function() {
	this.readLayout.toggle(false);
	this.editLayout.toggle(true);
	this.$element.css({"background": "#fffe"});
	this.input.focus();
	this.onUpdatedSize();
};

ParameterWidget.prototype.onConfirmClick = function() {
	this.setValue(
		this.input.getValue()
	);
	this.readLayout.toggle(true);
	this.editLayout.toggle(false);
	this.onUpdatedSize();
};

ParameterWidget.prototype.onCancelClick = function() {
	this.input.setValue(this.value);
	this.readLayout.toggle(true);
	this.editLayout.toggle(false);
	this.onUpdatedSize();
};

ParameterWidget.prototype.onDeleteClick = function() {
	this.emit("delete");
};

ParameterWidget.prototype.onCheckboxChange = function(isSelected, isIndeterminate) {
	if (isIndeterminate) {
		return;
	}
	if (isSelected) {
		this.setValue(this.allowedValues[0]);
	} else {
		this.setValue(this.allowedValues[1]);
	}
};

ParameterWidget.prototype.setValue = function(val) {
	// Turn off autofill stylings/icon
	this.autofilled = false;
	this.autofilledIcon.toggle(false);
	this.$element.css({"border": "1px solid #ddd"});

	// Update the stored value
	this.value = val;

	// Update the input value for edit mode
	this.input.setValue(this.value);

	// Update validity
	this.isInvalid = this.value == null;
	this.invalidIcon.toggle(this.isInvalid);
	this.$element.css({"background": this.isInvalid ? "#fddd" : "#fffe"});

	// Updated the label for read mode
	this.fullLabel.setLabel(
		this.name +
		(this.value
			? " = " + this.value
			: ""
		)
	);

	// Update the checkbox (if there is one)
	if (this.checkbox) {
		var isFirstAllowedVal = (
			this.allowedValues.indexOf( val ) === 0 ||
			this.allowedValues.map(normaliseYesNo).indexOf( normaliseYesNo(val) ) === 0
		);
		var isSecondAllowedVal = (
			this.allowedValues.indexOf( val || null ) === 1 ||
			this.allowedValues.map(normaliseYesNo).indexOf( val ? normaliseYesNo(val) : null) === 1
		);
		var isIndeterminate = !isFirstAllowedVal && !isSecondAllowedVal;
		this.checkbox.setIndeterminate(isIndeterminate, true);
		if (!isIndeterminate) {
			var isSelected = isFirstAllowedVal;
			this.checkbox.setSelected(isSelected, true);
		}
	}

	// Emit a change event
	this.emit("change");
};

ParameterWidget.prototype.setAutofilled = function() {
	this.autofilled = true;
	this.autofilledIcon.toggle(true);
	this.$element.css({"border": "1px dashed #36c"});
};

ParameterWidget.prototype.makeWikitext = function(pipeStyle, equalsStyle) {
	if (this.isInvalid) {
		return "";
	}
	return pipeStyle + this.name + equalsStyle + (this.value||"");
};

ParameterWidget.prototype.focusInput = function() {
	return this.input.focus();
};

export default ParameterWidget;