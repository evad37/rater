import ParameterWidget from "./ParameterWidget";
import SuggestionLookupTextInputWidget from "./SuggestionLookupTextInputWidget";

/* Target output (from rater v1):
// HTML
<span class="rater-dialog-paraInput rater-dialog-textInputContainer">
	<label><span class="rater-dialog-para-code">category</span></label>
	<input type="text"/><a title="remove">x</a><wbr/>
</span>
// CSS
.rater-dialog-row > div > span {
    padding-right: 0.5em;
    white-space: nowrap;
}
.rater-dialog-autofill {
    border: 1px dashed #cd20ff;
    padding: 0.2em;
    margin-right: 0.2em;
}
rater-dialog-autofill::after {
    content: "autofilled";
    color: #cd20ff;
    font-weight: bold;
    font-size: 96%;
}
*/

function BannerWidget( template, config ) {
	// Configuration initialization
	config = config || {};
	// Call parent constructor
	BannerWidget.super.call( this, config );

	this.template = template;

	// Create a layout
	this.layout = new OO.ui.FieldsetLayout();
	
	this.mainLabel = new OO.ui.LabelWidget({
		label: "{{" + this.template.getTitle().getMainText() + "}}",
		$element: $("<strong style='display:inline-block;width:48%;font-size: 110%;margin-right:0;padding-right:8px'>")
	});
	// Rating dropdowns
	this.classDropdown = new OO.ui.DropdownWidget( {
		label: new OO.ui.HtmlSnippet("<span style=\"color:#777\">Class</span>"),
		menu: { // FIXME: needs real data
			items: [
				new OO.ui.MenuOptionWidget( {
					data: "",
					label: " "
				} ),
				new OO.ui.MenuOptionWidget( {
					data: "B",
					label: "B"
				} ),
				new OO.ui.MenuOptionWidget( {
					data: "C",
					label: "C"
				} ),
				new OO.ui.MenuOptionWidget( {
					data: "start",
					label: "Start"
				} ),
			]
		},
		$element: $("<span style='display:inline-block;width:24%'>"),
		$overlay: this.$overlay,
	} );
	this.importanceDropdown = new OO.ui.DropdownWidget( {
		label: new OO.ui.HtmlSnippet("<span style=\"color:#777\">Importance</span>"),
		menu: { // FIXME: needs real data
			items: [
				new OO.ui.MenuOptionWidget( {
					data: "",
					label: " "
				} ),
				new OO.ui.MenuOptionWidget( {
					data: "top",
					label: "Top"
				} ),
				new OO.ui.MenuOptionWidget( {
					data: "high",
					label: "High"
				} ),
				new OO.ui.MenuOptionWidget( {
					data: "mid",
					label: "Mid"
				} )
			]
		},
		$element: $("<span style='display:inline-block;width:24%'>"),
		$overlay: this.$overlay,
	} );
	this.ratingsDropdowns = new OO.ui.HorizontalLayout( {
		items: [
			this.mainLabel,
			this.classDropdown,
			this.importanceDropdown,
		]
	} );

	this.parameterWidgets = this.template.parameters
		.filter(param => param.name !== "class" && param.name !== "importance")
		.map(param => new ParameterWidget(param, this.template.paramData[param.name]));
	// Limit how many parameters will be displayed initially
	this.initialParameterLimit = 5;
	// But only hide if there's more than one to hide (otherwise, it's not much of a space saving
	// and just annoying for users)
	var hideSomeParams = this.parameterWidgets.length > this.initialParameterLimit + 1;
	this.showMoreParametersButton = new OO.ui.ButtonWidget({
		label: "Show "+(this.parameterWidgets.length - this.initialParameterLimit)+" more paramters",
		framed: false,
	});
	this.parameterWidgetsLayout = new OO.ui.HorizontalLayout( {
		items: hideSomeParams
			? [...this.parameterWidgets.slice(0,this.initialParameterLimit), this.showMoreParametersButton]
			: this.parameterWidgets
	} );

	this.addParameterNameInput = new SuggestionLookupTextInputWidget({
		suggestions: this.template.parameterSuggestions,
		placeholder: "parameter name",
		$element: $("<div style='display:inline-block;width:40%'>"),
		validate: function(val) {
			let {validName, name, value} = this.getAddParametersInfo(val);
			return (!name && !value) ? true : validName;
		}.bind(this)
	});
	this.addParameterValueInput = new SuggestionLookupTextInputWidget({
		placeholder: "parameter value",
		$element: $("<div style='display:inline-block;width:40%'>"),
		validate: function(val) {
			let {validValue, name, value} = this.getAddParametersInfo(null, val);
			return (!name && !value) ? true : validValue;
		}.bind(this)
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
	});
	// And another hack
	this.addParameterLayout.$element.find(".oo-ui-fieldLayout-messages").css({
		"clear": "both",
		"padding-top": 0
	});

	// Add everything to the layout
	this.layout.addItems([
		this.ratingsDropdowns,
		this.parameterWidgetsLayout,
		this.addParameterLayout
	]);
	
	this.$element.append(this.layout.$element, $("<hr>"));

	this.showMoreParametersButton.connect( this, { "click": "showMoreParameters" } );
	this.addParameterButton.connect(this, { "click": "onParameterAdd" });
	this.addParameterNameInput.connect(this, { "change": "onAddParameterNameChange"});
	this.addParameterValueInput.connect(this, { "change": "onAddParameterValueChange"});
}
OO.inheritClass( BannerWidget, OO.ui.Widget );

BannerWidget.prototype.showMoreParameters = function() {
	this.parameterWidgetsLayout
		.removeItems([this.showMoreParametersButton])
		.addItems(
			this.parameterWidgets.slice(this.initialParameterLimit),
			this.initialParameterLimit
		);
};

BannerWidget.prototype.getAddParametersInfo = function(nameInputVal, valueInputVal) {
	var name = nameInputVal && nameInputVal.trim() || this.addParameterNameInput.getValue().trim();
	var paramAlreadyIncluded = name === "class" ||
		name === "importance" ||
		this.parameterWidgets.some(paramWidget => paramWidget.parameter.name === name);
	var value = valueInputVal && valueInputVal.trim() || this.addParameterValueInput.getValue().trim();
	var autovalue = name && this.template.paramData[name] && this.template.paramData[name].autovalue || null;
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
	var allowedValues = this.template.paramData[name] &&
		this.template.paramData[name].allowedValues && 
		this.template.paramData[name].allowedValues.map(val => {return {data: val, label:val}; });
	this.addParameterValueInput.setSuggestions(allowedValues || []);
	// Set button disabled state based on validity
	this.addParameterButton.setDisabled(!validName || !validValue);
	// Show notice if autovalue will be used
	this.addParameterLayout.setNotices( validName && isAutovalue ? ["Parameter value will be autofilled"] : [] );
	// Show error is the banner already has the parameter set
	this.addParameterLayout.setErrors( isAlreadyIncluded ? ["Parameter is already present"] : [] );
};

BannerWidget.prototype.onAddParameterValueChange = function() {
	let { validName, validValue, isAutovalue } = this.getAddParametersInfo();
	this.addParameterButton.setDisabled(!validName || !validValue);
	this.addParameterLayout.setNotices( validName && isAutovalue ? ["Parameter value will be autofilled"] : [] ); 
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
		this.template.paramData[name]
	);
	this.parameterWidgets.push(newParameter);
	this.parameterWidgetsLayout.addItems([newParameter]);
	this.addParameterNameInput.setValue("");
	this.addParameterValueInput.setValue("");
	this.addParameterNameInput.focus();
};

export default BannerWidget;