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
	
	// this.mainLabel = new OO.ui.LabelWidget({
	// 	label: "{{" + this.template.getTitle().getMainText() + "}}",
	// });

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
	this.bypassButton = new OO.ui.ButtonWidget( {
		icon: "articleRedirect",
		label: "Bypass redirect",
		title: "Bypass redirect",
		$element: $("<div style=\"width:100%\">")
	} );
	this.removeButton.$element.find("a").css("width","100%");
	this.clearButton.$element.find("a").css("width","100%");
	this.bypassButton.$element.find("a").css("width","100%");

	this.titleButtonsGroup = new OO.ui.ButtonGroupWidget( {
		items: template.redirectTarget
			? [ this.removeButton,
				this.clearButton,
				this.bypassButton ]
			: [ this.removeButton,
				this.clearButton ],
		$element: $("<span style='width:100%;'>"),
	} );

	this.mainLabelPopupButton = new OO.ui.PopupButtonWidget( {
		label: "{{" + this.template.getTitle().getMainText() + "}}",
		$element: $("<span style='display:inline-block;width:48%;margin-right:0;padding-right:8px'>"),
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
	this.titlelayout = new OO.ui.HorizontalLayout( {
		items: [
			this.mainLabelPopupButton,
			this.classDropdown,
			this.importanceDropdown,
		]
	} );

	var parameterWidgets = this.template.parameters
		.filter(param => param.name !== "class" && param.name !== "importance")
		.map(param => new ParameterWidget(param, this.template.paramData[param.name]));
	// Limit how many parameters will be displayed initially
	var initialParameterLimit = 5;
	// But only hide if there's more than one to hide (otherwise, it's not much of a space saving
	// and just annoying for users)
	var hideSomeParams = parameterWidgets.length > initialParameterLimit + 1;
	if (hideSomeParams) {
		parameterWidgets.forEach((parameterWidget, index) => {
			parameterWidget.toggle(index < initialParameterLimit);
		});
	}
	
	this.showMoreParametersButton = new OO.ui.ButtonWidget({
		label: "Show "+(parameterWidgets.length - initialParameterLimit)+" more paramters",
		framed: false,
		$element: $("<span style='margin-bottom:0'>")
	});

	this.showAddParameterInputsButton = new OO.ui.ButtonWidget({
		label: "Add paramter",
		icon: "add",
		framed: false,
		$element: $("<span style='margin-bottom:0'>")
	});

	this.parameterWidgetsLayout = new OO.ui.HorizontalLayout( {
		items: hideSomeParams
			? [ ...parameterWidgets,
				this.showMoreParametersButton,
				this.showAddParameterInputsButton ]
			: [...parameterWidgets, this.showAddParameterInputsButton ]
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
	}).toggle(false);
	// And another hack
	this.addParameterLayout.$element.find(".oo-ui-fieldLayout-messages").css({
		"clear": "both",
		"padding-top": 0
	});

	// Add everything to the layout
	this.layout.addItems([
		this.titlelayout,
		this.parameterWidgetsLayout,
		this.addParameterLayout
	]);
	
	this.$element.append(this.layout.$element, $("<hr>"));

	this.parameterWidgetsLayout.aggregate.call(this.parameterWidgetsLayout, {"delete": "parameterDelete"} );
	this.parameterWidgetsLayout.connect(this, {"parameterDelete": "onParameterDelete"} );
	this.showMoreParametersButton.connect( this, { "click": "showMoreParameters" } );
	this.showAddParameterInputsButton.connect( this, { "click": "showAddParameterInputs" } );
	this.addParameterButton.connect(this, { "click": "onParameterAdd" });
	this.addParameterNameInput.connect(this, { "change": "onAddParameterNameChange"});
	this.addParameterValueInput.connect(this, { "change": "onAddParameterValueChange"});
}
OO.inheritClass( BannerWidget, OO.ui.Widget );

BannerWidget.prototype.onParameterDelete = function ( itemWidget ) {
	this.parameterWidgetsLayout.removeItems( [ itemWidget ] );
};

BannerWidget.prototype.showMoreParameters = function() {
	this.parameterWidgetsLayout
		.removeItems([this.showMoreParametersButton]);
	this.parameterWidgetsLayout.forEach(parameterWidget => parameterWidget.toggle(true));
};

BannerWidget.prototype.showAddParameterInputs = function() {
	this.parameterWidgetsLayout.removeItems([this.showAddParameterInputsButton]);
	this.addParameterLayout.toggle(true);
};

BannerWidget.prototype.getAddParametersInfo = function(nameInputVal, valueInputVal) {
	var name = nameInputVal && nameInputVal.trim() || this.addParameterNameInput.getValue().trim();
	var paramAlreadyIncluded = name === "class" ||
		name === "importance" ||
		this.parameterWidgetsLayout.items.some(paramWidget => paramWidget.parameter && paramWidget.parameter.name === name);
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
	this.parameterWidgetsLayout.addItems([newParameter]);
	this.addParameterNameInput.setValue("");
	this.addParameterValueInput.setValue("");
	this.addParameterNameInput.focus();
};

export default BannerWidget;