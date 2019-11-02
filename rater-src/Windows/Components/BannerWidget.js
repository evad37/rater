import ParameterListWidget from "./ParameterListWidget";
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
	this.isShellTemplate = template.isShellTemplate();

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
	this.titleLayout = new OO.ui.HorizontalLayout( {
		items: this.isShellTemplate
			? [ this.mainLabelPopupButton ]
			: [
				this.mainLabelPopupButton,
				this.classDropdown,
				this.importanceDropdown,
			]
	} );

	/* --- PARAMETERS LIST --- */

	var parameterWidgets = this.template.parameters
		.filter(param => {
			if ( this.isShellTemplate ) {
				return param.name != "1";
			}
			return param.name !== "class" && param.name !== "importance";
		})
		.map(param => new ParameterWidget(param, this.template.paramData[param.name]));

	this.parameterList = new ParameterListWidget( {
		items: parameterWidgets,
		displayLimit: 6
	} );

	/* --- ADD PARAMETER SECTION --- */

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

	this.parameterList.connect( this, { "addParametersButtonClick": "showAddParameterInputs" } );
	this.addParameterButton.connect(this, { "click": "onParameterAdd" });
	this.addParameterNameInput.connect(this, { "change": "onAddParameterNameChange"});
	this.addParameterValueInput.connect(this, { "change": "onAddParameterValueChange"});
	this.removeButton.connect(this, {"click": "onRemoveButtonClick"}, );
}
OO.inheritClass( BannerWidget, OO.ui.Widget );

BannerWidget.prototype.showAddParameterInputs = function() {
	this.addParameterLayout.toggle(true);
};

BannerWidget.prototype.getAddParametersInfo = function(nameInputVal, valueInputVal) {
	var name = nameInputVal && nameInputVal.trim() || this.addParameterNameInput.getValue().trim();
	var paramAlreadyIncluded = name === "class" ||
		name === "importance" ||
		(name === "1" && this.isShellTemplate) ||
		this.parameterList.items.some(paramWidget => paramWidget.parameter && paramWidget.parameter.name === name);
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
	this.parameterList.addItems([newParameter]);
	this.addParameterNameInput.setValue("");
	this.addParameterValueInput.setValue("");
	this.addParameterNameInput.focus();
};

BannerWidget.prototype.onRemoveButtonClick = function() {
	this.emit("remove");
};

export default BannerWidget;