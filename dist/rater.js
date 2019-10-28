(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _setup = _interopRequireDefault(require("./setup"));

var _autostart = _interopRequireDefault(require("./autostart"));

var _css = _interopRequireDefault(require("./css.js"));

var _util = require("./util");

var _windowManager = _interopRequireDefault(require("./windowManager"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

(function App() {
  console.log("Rater's App.js is running...");
  mw.util.addCSS(_css["default"]);

  var showMainWindow = function showMainWindow(data) {
    if (!data || !data.success) {
      return;
    }

    _windowManager["default"].openWindow("main", data);
  };

  var showSetupError = function showSetupError(code, jqxhr) {
    return OO.ui.alert((0, _util.makeErrorMsg)(code, jqxhr), {
      title: "Rater failed to open"
    });
  }; // Invocation by portlet link 


  mw.util.addPortletLink("p-cactions", "#", "Rater", "ca-rater", "Rate quality and importance", "5");
  $("#ca-rater").click(function () {
    return (0, _setup["default"])().then(showMainWindow, showSetupError);
  }); // Invocation by auto-start (do not show message on error)

  (0, _autostart["default"])().then(showMainWindow);
})();

},{"./autostart":7,"./css.js":10,"./setup":12,"./util":13,"./windowManager":14}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getWithRedirectTo = exports.parseTemplates = exports.Template = void 0;

var _util = require("./util");

var _config = _interopRequireDefault(require("./config"));

var cache = _interopRequireWildcard(require("./cache"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/** Template
 *
 * @class
 * Represents the wikitext of template transclusion. Used by #parseTemplates.
 * @prop {String} name Name of the template
 * @prop {String} wikitext Full wikitext of the transclusion
 * @prop {Object[]} parameters Parameters used in the translcusion, in order, of form:
	{
		name: {String|Number} parameter name, or position for unnamed parameters,
		value: {String} Wikitext passed to the parameter (whitespace trimmed),
		wikitext: {String} Full wikitext (including leading pipe, parameter name/equals sign (if applicable), value, and any whitespace)
	}
 * @constructor
 * @param {String} wikitext Wikitext of a template transclusion, starting with '{{' and ending with '}}'.
 */
var Template = function Template(wikitext) {
  this.wikitext = wikitext;
  this.parameters = [];
};

exports.Template = Template;

Template.prototype.addParam = function (name, val, wikitext) {
  this.parameters.push({
    "name": name,
    "value": val,
    "wikitext": "|" + wikitext
  });
};
/**
 * Get a parameter data by parameter name
 */


Template.prototype.getParam = function (paramName) {
  return this.parameters.find(function (p) {
    return p.name == paramName;
  });
};

Template.prototype.setName = function (name) {
  this.name = name.trim();
};

Template.prototype.getTitle = function () {
  return mw.Title.newFromText("Template:" + this.name);
};
/**
 * parseTemplates
 *
 * Parses templates from wikitext.
 * Based on SD0001's version at <https://en.wikipedia.org/wiki/User:SD0001/parseAllTemplates.js>.
 * Returns an array containing the template details:
 *  var templates = parseTemplates("Hello {{foo |Bar|baz=qux |2=loremipsum|3=}} world");
 *  console.log(templates[0]); // --> object
	{
		name: "foo",
		wikitext:"{{foo |Bar|baz=qux | 2 = loremipsum  |3=}}",
		parameters: [
			{
				name: 1,
				value: 'Bar',
				wikitext: '|Bar'
			},
			{
				name: 'baz',
				value: 'qux',
				wikitext: '|baz=qux '
			},
			{
				name: '2',
				value: 'loremipsum',
				wikitext: '| 2 = loremipsum  '
			},
			{
				name: '3',
				value: '',
				wikitext: '|3='
			}
		],
		getParam: function(paramName) {
			return this.parameters.find(function(p) { return p.name == paramName; });
		}
	}
 *    
 * 
 * @param {String} wikitext
 * @param {Boolean} recursive Set to `true` to also parse templates that occur within other templates,
 *  rather than just top-level templates. 
 * @return {Template[]} templates
*/


var parseTemplates = function parseTemplates(wikitext, recursive) {
  /* eslint-disable no-control-regex */
  if (!wikitext) {
    return [];
  }

  var strReplaceAt = function strReplaceAt(string, index, _char) {
    return string.slice(0, index) + _char + string.slice(index + 1);
  };

  var result = [];

  var processTemplateText = function processTemplateText(startIdx, endIdx) {
    var text = wikitext.slice(startIdx, endIdx);
    var template = new Template("{{" + text.replace(/\x01/g, "|") + "}}"); // swap out pipe in links with \x01 control character
    // [[File: ]] can have multiple pipes, so might need multiple passes

    while (/(\[\[[^\]]*?)\|(.*?\]\])/g.test(text)) {
      text = text.replace(/(\[\[[^\]]*?)\|(.*?\]\])/g, "$1\x01$2");
    }

    var chunks = text.split("|").map(function (chunk) {
      // change '\x01' control characters back to pipes
      return chunk.replace(/\x01/g, "|");
    });
    template.setName(chunks[0]);
    var parameterChunks = chunks.slice(1);
    var unnamedIdx = 1;
    parameterChunks.forEach(function (chunk) {
      var indexOfEqualTo = chunk.indexOf("=");
      var indexOfOpenBraces = chunk.indexOf("{{");
      var isWithoutEquals = !chunk.includes("=");
      var hasBracesBeforeEquals = chunk.includes("{{") && indexOfOpenBraces < indexOfEqualTo;
      var isUnnamedParam = isWithoutEquals || hasBracesBeforeEquals;
      var pName, pNum, pVal;

      if (isUnnamedParam) {
        // Get the next number not already used by either an unnamed parameter, or by a
        // named parameter like `|1=val`
        while (template.getParam(unnamedIdx)) {
          unnamedIdx++;
        }

        pNum = unnamedIdx;
        pVal = chunk.trim();
      } else {
        pName = chunk.slice(0, indexOfEqualTo).trim();
        pVal = chunk.slice(indexOfEqualTo + 1).trim();
      }

      template.addParam(pName || pNum, pVal, chunk);
    });
    result.push(template);
  };

  var n = wikitext.length; // number of unclosed braces

  var numUnclosed = 0; // are we inside a comment or between nowiki tags?

  var inComment = false;
  var inNowiki = false;
  var startIdx, endIdx;

  for (var i = 0; i < n; i++) {
    if (!inComment && !inNowiki) {
      if (wikitext[i] === "{" && wikitext[i + 1] === "{") {
        if (numUnclosed === 0) {
          startIdx = i + 2;
        }

        numUnclosed += 2;
        i++;
      } else if (wikitext[i] === "}" && wikitext[i + 1] === "}") {
        if (numUnclosed === 2) {
          endIdx = i;
          processTemplateText(startIdx, endIdx);
        }

        numUnclosed -= 2;
        i++;
      } else if (wikitext[i] === "|" && numUnclosed > 2) {
        // swap out pipes in nested templates with \x01 character
        wikitext = strReplaceAt(wikitext, i, "\x01");
      } else if (/^<!--/.test(wikitext.slice(i, i + 4))) {
        inComment = true;
        i += 3;
      } else if (/^<nowiki ?>/.test(wikitext.slice(i, i + 9))) {
        inNowiki = true;
        i += 7;
      }
    } else {
      // we are in a comment or nowiki
      if (wikitext[i] === "|") {
        // swap out pipes with \x01 character
        wikitext = strReplaceAt(wikitext, i, "\x01");
      } else if (/^-->/.test(wikitext.slice(i, i + 3))) {
        inComment = false;
        i += 2;
      } else if (/^<\/nowiki ?>/.test(wikitext.slice(i, i + 10))) {
        inNowiki = false;
        i += 8;
      }
    }
  }

  if (recursive) {
    var subtemplates = result.map(function (template) {
      return template.wikitext.slice(2, -2);
    }).filter(function (templateWikitext) {
      return /\{\{.*\}\}/.test(templateWikitext);
    }).map(function (templateWikitext) {
      return parseTemplates(templateWikitext, true);
    });
    return result.concat.apply(result, subtemplates);
  }

  return result;
};
/* eslint-enable no-control-regex */

/**
 * @param {Template|Template[]} templates
 * @return {Promise<Template[]>}
 */


exports.parseTemplates = parseTemplates;

var getWithRedirectTo = function getWithRedirectTo(templates) {
  var templatesArray = Array.isArray(templates) ? templates : [templates];

  if (templatesArray.length === 0) {
    return $.Deferred().resolve([]);
  }

  return _util.API.get({
    "action": "query",
    "format": "json",
    "titles": templatesArray.map(function (template) {
      return template.getTitle().getPrefixedText();
    }),
    "redirects": 1
  }).then(function (result) {
    if (!result || !result.query) {
      return $.Deferred().reject("Empty response");
    }

    if (result.query.redirects) {
      result.query.redirects.forEach(function (redirect) {
        var i = templatesArray.findIndex(function (template) {
          return template.getTitle().getPrefixedText() === redirect.from;
        });

        if (i !== -1) {
          templatesArray[i].redirectsTo = mw.Title.newFromText(redirect.to);
        }
      });
    }

    return templatesArray;
  });
};

exports.getWithRedirectTo = getWithRedirectTo;

Template.prototype.getDataForParam = function (key, paraName) {
  if (!this.paramData) {
    return null;
  } // If alias, switch from alias to preferred parameter name


  var para = this.paramAliases[paraName] || paraName;

  if (!this.paramData[para]) {
    return;
  }

  var data = this.paramData[para][key]; // Data might actually be an object with key "en"

  if (data && data.en && !Array.isArray(data)) {
    return data.en;
  }

  return data;
};

Template.prototype.setParamDataAndSuggestions = function () {
  var self = this;
  var paramDataSet = $.Deferred();

  if (self.paramData) {
    return paramDataSet.resolve();
  }

  var prefixedText = self.redirectsTo ? self.redirectsTo.getPrefixedText() : self.getTitle().getPrefixedText();
  var cachedInfo = cache.read(prefixedText + "-params");

  if (cachedInfo && cachedInfo.value && cachedInfo.staleDate && cachedInfo.value.paramData != null && cachedInfo.value.parameterSuggestions != null && cachedInfo.value.paramAliases != null) {
    self.notemplatedata = cachedInfo.value.notemplatedata;
    self.paramData = cachedInfo.value.paramData;
    self.parameterSuggestions = cachedInfo.value.parameterSuggestions;
    self.paramAliases = cachedInfo.value.paramAliases;
    paramDataSet.resolve();

    if (!(0, _util.isAfterDate)(cachedInfo.staleDate)) {
      // Just use the cached data
      return paramDataSet;
    } // else: Use the cache data for now, but also fetch new data from API

  }

  _util.API.get({
    action: "templatedata",
    titles: prefixedText,
    redirects: 1,
    includeMissingTitles: 1
  }).then(function (response) {
    return response;
  }, function ()
  /*error*/
  {
    return null;
  } // Ignore errors, will use default data
  ).then(function (result) {
    // Figure out page id (beacuse action=templatedata doesn't have an indexpageids option)
    var id = result && $.map(result.pages, function (_value, key) {
      return key;
    });

    if (!result || !result.pages[id] || result.pages[id].notemplatedata || !result.pages[id].params) {
      // No TemplateData, so use defaults (guesses)
      self.notemplatedata = true;
      self.templatedataApiError = !result;
      self.paramData = _config["default"].defaultParameterData;
    } else {
      self.paramData = result.pages[id].params;
    }

    self.paramAliases = {};
    $.each(self.paramData, function (paraName, paraData) {
      // Extract aliases for easier reference later on
      if (paraData.aliases && paraData.aliases.length) {
        paraData.aliases.forEach(function (alias) {
          self.paramAliases[alias] = paraName;
        });
      } // Extract allowed values array from description


      if (paraData.description && /\[.*'.+?'.*?\]/.test(paraData.description.en)) {
        try {
          var allowedVals = JSON.parse(paraData.description.en.replace(/^.*\[/, "[").replace(/"/g, "\\\"").replace(/'/g, "\"").replace(/,\s*]/, "]").replace(/].*$/, "]"));
          self.paramData[paraName].allowedValues = allowedVals;
        } catch (e) {
          console.warn("[Rater] Could not parse allowed values in description:\n  " + paraData.description.en + "\n Check TemplateData for parameter |" + paraName + "= in " + self.getTitle().getPrefixedText());
        }
      } // Make sure required/suggested parameters are present


      if ((paraData.required || paraData.suggested) && !self.getParam(paraName)) {
        // Check if already present in an alias, if any
        if (paraData.aliases.length) {
          var aliases = self.parameters.filter(function (p) {
            var isAlias = paraData.aliases.includes(p.name);
            var isEmpty = !p.val;
            return isAlias && !isEmpty;
          });

          if (aliases.length) {
            // At least one non-empty alias, so do nothing
            return;
          }
        } // No non-empty aliases, so set parameter to either the autovaule, or
        // an empty string (without touching, unless it is a required parameter)


        self.parameters.push({
          name: paraName,
          value: paraData.autovalue || "",
          autofilled: true
        });
      }
    }); // Make suggestions for combobox

    var allParamsArray = !self.notemplatedata && result.pages[id].paramOrder || $.map(self.paramData, function (_val, key) {
      return key;
    });
    self.parameterSuggestions = allParamsArray.filter(function (paramName) {
      return paramName && paramName !== "class" && paramName !== "importance";
    }).map(function (paramName) {
      var optionObject = {
        data: paramName
      };
      var label = self.getDataForParam(label, paramName);

      if (label) {
        optionObject.label = label + " (|" + paramName + "=)";
      }

      return optionObject;
    });

    if (self.templatedataApiError) {
      // Don't save defaults/guesses to cache;
      return true;
    }

    cache.write(prefixedText + "-params", {
      notemplatedata: self.notemplatedata,
      paramData: self.paramData,
      parameterSuggestions: self.parameterSuggestions,
      paramAliases: self.paramAliases
    }, 1);
    return true;
  }).then(paramDataSet.resolve, paramDataSet.reject);

  return paramDataSet;
};

},{"./cache":8,"./config":9,"./util":13}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ParameterWidget = _interopRequireDefault(require("./ParameterWidget"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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
function BannerWidget(template, config) {
  // Configuration initialization
  config = config || {}; // Call parent constructor

  BannerWidget["super"].call(this, config); // Create a layout

  this.layout = new OO.ui.FieldsetLayout();
  this.mainLabel = new OO.ui.LabelWidget({
    label: "{{" + template.getTitle().getMainText() + "}}",
    $element: $("<strong style='display:inline-block;width:48%;font-size: 110%;margin-right:0;padding-right:8px'>")
  }); // Rating dropdowns

  this.classDropdown = new OO.ui.DropdownWidget({
    label: new OO.ui.HtmlSnippet("<span style=\"color:#777\">Class</span>"),
    menu: {
      // FIXME: needs real data
      items: [new OO.ui.MenuOptionWidget({
        data: "",
        label: " "
      }), new OO.ui.MenuOptionWidget({
        data: "B",
        label: "B"
      }), new OO.ui.MenuOptionWidget({
        data: "C",
        label: "C"
      }), new OO.ui.MenuOptionWidget({
        data: "start",
        label: "Start"
      })]
    },
    $element: $("<span style='display:inline-block;width:24%'>"),
    $overlay: this.$overlay
  });
  this.importanceDropdown = new OO.ui.DropdownWidget({
    label: new OO.ui.HtmlSnippet("<span style=\"color:#777\">Importance</span>"),
    menu: {
      // FIXME: needs real data
      items: [new OO.ui.MenuOptionWidget({
        data: "",
        label: " "
      }), new OO.ui.MenuOptionWidget({
        data: "top",
        label: "Top"
      }), new OO.ui.MenuOptionWidget({
        data: "high",
        label: "High"
      }), new OO.ui.MenuOptionWidget({
        data: "mid",
        label: "Mid"
      })]
    },
    $element: $("<span style='display:inline-block;width:24%'>"),
    $overlay: this.$overlay
  });
  this.ratingsDropdowns = new OO.ui.HorizontalLayout({
    items: [this.mainLabel, this.classDropdown, this.importanceDropdown]
  }); //this.parametersToggle = new OO.ui.ToggleSwitchWidget();
  // Parameters as text (collapsed)
  // this.parametersText = new OO.ui.LabelWidget({
  // 	label: template.parameters.map(parameter => `|${parameter.name}=${parameter.value}`).join(" ")
  // });
  // this.parametersField =  new OO.ui.FieldLayout( this.parametersText, {
  // 	label: "Parameters", 
  // 	align: "top" 
  // } );

  this.parameterWidgets = template.parameters.map(function (param) {
    return new _ParameterWidget["default"](param, template.paramData[param.name]);
  }); // Parameters as label/input pairs (expanded)
  //TODO: New parameter combobox

  this.parameterWidgetsLayout = new OO.ui.HorizontalLayout({
    items: this.parameterWidgets
  }); // Add everything to the layout

  this.layout.addItems([this.ratingsDropdowns, this.parameterWidgetsLayout]);
  this.$element.append(this.layout.$element, $("<hr>"));
}

OO.inheritClass(BannerWidget, OO.ui.Widget);
var _default = BannerWidget;
exports["default"] = _default;

},{"./ParameterWidget":4}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function ParameterWidget(parameter, paramData, config) {
  // Configuration initialization
  config = config || {}; // Call parent constructor

  ParameterWidget["super"].call(this, config);
  this.paramData = paramData || {}; // Make the input. Type can be checkbox, or dropdown, or text input,
  // depending on number of allowed values in param data.

  this.allowedValues = paramData && paramData.allowedValues || []; // switch (true) {
  // case this.allowedValues.length === 0:
  // case parameter.value && !this.allowedValues.includes(parameter.value):
  // 	// Text input
  // 	break;
  // case 1:
  // 	// Checkbox (labelled only when both checked)
  // 	this.allowedValues = [null, ...this.allowedValues];
  // 	/* ...falls through... */
  // case 2:
  // 	// Checkbox (labelled when both checked and not checked)
  // 	this.input = new OO.ui.CheckboxMultioptionWidget( {
  // 		data: parameter.value,
  // 		selected: this.allowedValues.indexOf(parameter.value) === 1,
  // 		label: $("<code>").text(parameter.value || "")
  // 	} );
  // 	break;
  // default:
  // 	// Dropdown
  // 	this.input = new OO.ui.DropdownWidget( {
  // 		menu: {
  // 			items: this.allowedValues.map(allowedVal => new OO.ui.MenuOptionWidget({
  // 				data: allowedVal,
  // 				label: allowedVal
  // 			}) )
  // 		}
  // 	} );
  // 	this.input.getMenu().selectItemByData(parameter.value);
  // 	break;
  // }
  // TODO: Use above logic, or something similar. For now, just create a ComboBox

  this.input = new OO.ui.ComboBoxInputWidget({
    value: parameter.value,
    label: parameter.name + " =",
    labelPosition: "before",
    options: this.allowedValues.map(function (val) {
      return {
        data: val,
        label: val
      };
    }),
    $element: $("<div style='width:calc(100% - 45px);margin-right:0;'>") // the 45px leaves room for the delete button

  }); // Reduce the excessive whitespace/height

  this.input.$element.find("input").css({
    "padding-top": 0,
    "padding-bottom": "2px",
    "height": "24px"
  }); // Fix label positioning within the reduced height

  this.input.$element.find("span.oo-ui-labelElement-label").css({
    "line-height": "normal"
  }); // Also reduce height of dropdown button (if options are present)

  this.input.$element.find("a.oo-ui-buttonElement-button").css({
    "padding-top": 0,
    "height": "24px",
    "min-height": "0"
  }); //var description = this.paramData[parameter.name] && this.paramData[parameter.name].label && this.paramData[parameter.name].label.en;
  // var paramName = new OO.ui.LabelWidget({
  // 	label: "|" + parameter.name + "=",
  // 	$element: $("<code>")
  // });

  this.deleteButton = new OO.ui.ButtonWidget({
    icon: "clear",
    framed: false,
    flags: "destructive"
  });
  this.deleteButton.$element.find("a span").first().css({
    "min-width": "unset",
    "width": "16px"
  });
  this.layout = new OO.ui.HorizontalLayout({
    items: [this.input, this.deleteButton],
    $element: $("<div style='width: 33%;margin:0;'>")
  });
  this.$element = this.layout.$element;
  this.input.setInvisibleLabel(false);
}

OO.inheritClass(ParameterWidget, OO.ui.Widget);

ParameterWidget.prototype.focusInput = function () {
  return this.input.focus();
};

var _default = ParameterWidget;
exports["default"] = _default;

},{}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _util = require("../util");

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

/* var incrementProgressByInterval = function() {
	var incrementIntervalDelay = 100;
	var incrementIntervalAmount = 0.1;
	var incrementIntervalMaxval = 98;
	return window.setInterval(
		incrementProgress,
		incrementIntervalDelay,
		incrementIntervalAmount,
		incrementIntervalMaxval
	);
}; */
var LoadDialog = function LoadDialog(config) {
  LoadDialog["super"].call(this, config);
};

OO.inheritClass(LoadDialog, OO.ui.Dialog);
LoadDialog["static"].name = "loadDialog";
LoadDialog["static"].title = "Loading Rater..."; // Customize the initialize() function: This is where to add content to the dialog body and set up event handlers.

LoadDialog.prototype.initialize = function () {
  var _this$content$$elemen;

  // Call the parent method.
  LoadDialog["super"].prototype.initialize.call(this); // Create a layout

  this.content = new OO.ui.PanelLayout({
    padded: true,
    expanded: false
  }); // Create content

  this.progressBar = new OO.ui.ProgressBarWidget({
    progress: 1
  });
  this.setuptasks = [new OO.ui.LabelWidget({
    label: "Loading list of project banners...",
    $element: $("<p style=\"display:block\">")
  }), new OO.ui.LabelWidget({
    label: "Loading talkpage wikitext...",
    $element: $("<p style=\"display:block\">")
  }), new OO.ui.LabelWidget({
    label: "Parsing talkpage templates...",
    $element: $("<p style=\"display:block\">")
  }), new OO.ui.LabelWidget({
    label: "Getting templates' parameter data...",
    $element: $("<p style=\"display:block\">")
  }), new OO.ui.LabelWidget({
    label: "Checking if page redirects...",
    $element: $("<p style=\"display:block\">")
  }), new OO.ui.LabelWidget({
    label: "Retrieving quality prediction...",
    $element: $("<p style=\"display:block\">")
  }).toggle()];
  this.closeButton = new OO.ui.ButtonWidget({
    label: "Close"
  }).toggle();
  this.setupPromises = []; // Append content to layout

  (_this$content$$elemen = this.content.$element).append.apply(_this$content$$elemen, [this.progressBar.$element, new OO.ui.LabelWidget({
    label: "Initialising:",
    $element: $("<strong style=\"display:block\">")
  }).$element].concat(_toConsumableArray(this.setuptasks.map(function (widget) {
    return widget.$element;
  })), [this.closeButton.$element])); // Append layout to dialog


  this.$body.append(this.content.$element); // Connect events to handlers

  this.closeButton.connect(this, {
    "click": "onCloseButtonClick"
  });
};

LoadDialog.prototype.onCloseButtonClick = function () {
  // Close this dialog, without passing any data
  this.close();
}; // Override the getBodyHeight() method to specify a custom height (or don't to use the automatically generated height).


LoadDialog.prototype.getBodyHeight = function () {
  return this.content.$element.outerHeight(true);
};

LoadDialog.prototype.incrementProgress = function (amount, maximum) {
  var priorProgress = this.progressBar.getProgress();
  var incrementedProgress = Math.min(maximum || 100, priorProgress + amount);
  this.progressBar.setProgress(incrementedProgress);
};

LoadDialog.prototype.addTaskPromiseHandlers = function (taskPromises) {
  var _this = this;

  var onTaskDone = function onTaskDone(index) {
    // Add "Done!" to label
    var widget = _this.setuptasks[index];
    widget.setLabel(widget.getLabel() + " Done!"); // Increment status bar. Show a smooth transition by
    // using small steps over a short duration.

    var totalIncrement = 20; // percent

    var totalTime = 400; // milliseconds

    var totalSteps = 10;
    var incrementPerStep = totalIncrement / totalSteps;

    for (var step = 0; step < totalSteps; step++) {
      window.setTimeout(_this.incrementProgress.bind(_this), totalTime * step / totalSteps, incrementPerStep);
    }
  };

  var onTaskError = function onTaskError(index, code, info) {
    var widget = _this.setuptasks[index];
    widget.setLabel(widget.getLabel() + " Failed. " + (0, _util.makeErrorMsg)(code, info));

    _this.closeButton.toggle(true);

    _this.updateSize();
  };

  taskPromises.forEach(function (promise, index) {
    promise.then(function () {
      return onTaskDone(index);
    }, function (code, info) {
      return onTaskError(index, code, info);
    });
  });
}; // Use getSetupProcess() to set up the window with data passed to it at the time 
// of opening


LoadDialog.prototype.getSetupProcess = function (data) {
  var _this2 = this;

  data = data || {};
  return LoadDialog["super"].prototype.getSetupProcess.call(this, data).next(function () {
    var showOresTask = !!data.ores;

    _this2.setuptasks[5].toggle(showOresTask);

    var taskPromises = data.ores ? data.promises : data.promises.slice(0, -1);
    data.isOpened.then(function () {
      return _this2.addTaskPromiseHandlers(taskPromises);
    });
  }, this);
}; // Prevent window from closing too quickly, using getHoldProcess()


LoadDialog.prototype.getHoldProcess = function (data) {
  data = data || {};

  if (data.success) {
    // Wait a bit before processing the close, which happens automatically
    return LoadDialog["super"].prototype.getHoldProcess.call(this, data).next(800);
  } // No need to wait if closed manually


  return LoadDialog["super"].prototype.getHoldProcess.call(this, data);
}; // Use the getTeardownProcess() method to perform actions whenever the dialog is closed. 


LoadDialog.prototype.getTeardownProcess = function (data) {
  var _this3 = this;

  return LoadDialog["super"].prototype.getTeardownProcess.call(this, data).first(function () {
    // Perform cleanup: reset labels
    _this3.setuptasks.forEach(function (setuptask) {
      var currentLabel = setuptask.getLabel();
      setuptask.setLabel(currentLabel.slice(0, currentLabel.indexOf("...") + 3));
    });
  }, this);
};

var _default = LoadDialog;
exports["default"] = _default;

},{"../util":13}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _BannerWidget = _interopRequireDefault(require("./Components/BannerWidget"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function MainWindow(config) {
  MainWindow["super"].call(this, config);
}

OO.inheritClass(MainWindow, OO.ui.ProcessDialog);
MainWindow["static"].name = "main";
MainWindow["static"].title = "Rater";
MainWindow["static"].size = "large";
MainWindow["static"].actions = [// Primary (top right):
{
  label: "X",
  // not using an icon since color becomes inverted, i.e. white on light-grey
  title: "Close (and discard any changes)",
  flags: "primary"
}, // Safe (top left)
{
  action: "help",
  flags: "safe",
  label: "?",
  // not using icon, to mirror Close action
  title: "help"
}, // Others (bottom)
{
  action: "save",
  label: new OO.ui.HtmlSnippet("<span style='padding:0 1em;'>Save</span>"),
  flags: ["primary", "progressive"]
}, {
  action: "preview",
  label: "Show preview"
}, {
  action: "changes",
  label: "Show changes"
}, {
  action: "cancel",
  label: "Cancel"
}]; // Customize the initialize() function: This is where to add content to the dialog body and set up event handlers.

MainWindow.prototype.initialize = function () {
  // Call the parent method.
  MainWindow["super"].prototype.initialize.call(this); // Create layouts

  this.topBar = new OO.ui.PanelLayout({
    expanded: false,
    framed: false,
    padded: false
  });
  this.content = new OO.ui.PanelLayout({
    expanded: true,
    padded: true,
    scrollable: true
  });
  this.outerLayout = new OO.ui.StackLayout({
    items: [this.topBar, this.content],
    continuous: true,
    expanded: true
  }); // Create topBar content

  this.searchBox = new OO.ui.ComboBoxInputWidget({
    placeholder: "Add a WikiProject...",
    options: [{
      // FIXME: These are placeholders.
      data: "Option 1",
      label: "Option One"
    }, {
      data: "Option 2",
      label: "Option Two"
    }, {
      data: "Option 3",
      label: "Option Three"
    }],
    $element: $("<div style='display:inline-block;width:100%;max-width:425px;'>"),
    $overlay: this.$overlay
  });
  this.setAllDropDown = new OO.ui.DropdownWidget({
    label: new OO.ui.HtmlSnippet("<span style=\"color:#777\">Set all...</span>"),
    menu: {
      // FIXME: needs real data
      items: [new OO.ui.MenuSectionOptionWidget({
        label: "Classes"
      }), new OO.ui.MenuOptionWidget({
        data: "B",
        label: "B"
      }), new OO.ui.MenuOptionWidget({
        data: "C",
        label: "C"
      }), new OO.ui.MenuOptionWidget({
        data: "start",
        label: "Start"
      }), new OO.ui.MenuSectionOptionWidget({
        label: "Importances"
      }), new OO.ui.MenuOptionWidget({
        data: "top",
        label: "Top"
      }), new OO.ui.MenuOptionWidget({
        data: "high",
        label: "High"
      }), new OO.ui.MenuOptionWidget({
        data: "mid",
        label: "Mid"
      })]
    },
    $element: $("<span style=\"display:inline-block;width:auto\">"),
    $overlay: this.$overlay
  });
  this.removeAllButton = new OO.ui.ButtonWidget({
    icon: "trash",
    title: "Remove all",
    flags: "destructive"
  });
  this.clearAllButton = new OO.ui.ButtonWidget({
    icon: "cancel",
    title: "Clear all",
    flags: "destructive"
  });
  this.bypassAllButton = new OO.ui.ButtonWidget({
    icon: "articleRedirect",
    title: "Bypass all redirects"
  });
  this.doAllButtons = new OO.ui.ButtonGroupWidget({
    items: [this.removeAllButton, this.clearAllButton, this.bypassAllButton],
    $element: $("<span style='float:right;'>")
  });
  this.topBar.$element.append(this.searchBox.$element, this.setAllDropDown.$element, this.doAllButtons.$element).css("background", "#ccc"); // FIXME: this is placeholder content
  // this.content.$element.append( "<span>(No project banners yet)</span>" );

  this.$body.append(this.outerLayout.$element);
}; // Override the getBodyHeight() method to specify a custom height


MainWindow.prototype.getBodyHeight = function () {
  return this.topBar.$element.outerHeight(true) + this.content.$element.outerHeight(true);
}; // Use getSetupProcess() to set up the window with data passed to it at the time 
// of opening


MainWindow.prototype.getSetupProcess = function (data) {
  var _this = this;

  data = data || {};
  return MainWindow["super"].prototype.getSetupProcess.call(this, data).next(function () {
    // TODO: Set up window based on data
    _this.banners = data.banners.map(function (bannerTemplate) {
      return new _BannerWidget["default"](bannerTemplate);
    });
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = _this.banners[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var banner = _step.value;

        _this.content.$element.append(banner.$element);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    _this.talkWikitext = data.talkWikitext;
    _this.talkpage = data.talkpage;

    _this.updateSize();
  }, this);
}; // Set up the window it is ready: attached to the DOM, and opening animation completed


MainWindow.prototype.getReadyProcess = function (data) {
  var _this2 = this;

  data = data || {};
  return MainWindow["super"].prototype.getReadyProcess.call(this, data).next(function () {
    // force labels to show by default
    _this2.banners.forEach(function (banner) {
      banner.parameterWidgets.forEach(function (param) {
        return param.focusInput();
      });
    });
  }, this).next(function () {
    return _this2.searchBox.focus();
  }); // search box is where we really ant focus to be
};

var _default = MainWindow;
exports["default"] = _default;

},{"./Components/BannerWidget":3}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _config = _interopRequireDefault(require("./config"));

var _util = require("./util");

var _setup = _interopRequireDefault(require("./setup"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var autoStart = function autoStart() {
  if (window.rater_autostartNamespaces == null || _config["default"].mw.wgIsMainPage) {
    return $.Deferred().reject();
  }

  var autostartNamespaces = $.isArray(window.rater_autostartNamespaces) ? window.rater_autostartNamespaces : [window.rater_autostartNamespaces];

  if (-1 === autostartNamespaces.indexOf(_config["default"].mw.wgNamespaceNumber)) {
    return $.Deferred().reject();
  }

  if (/(?:\?|&)(?:action|diff|oldid)=/.test(window.location.href)) {
    return $.Deferred().reject();
  } // Check if talk page exists


  if ($("#ca-talk.new").length) {
    return (0, _setup["default"])();
  }

  var thisPage = mw.Title.newFromText(_config["default"].mw.wgPageName);
  var talkPage = thisPage && thisPage.getTalkPage();

  if (!talkPage) {
    return $.Deferred().reject();
  }
  /* Check templates present on talk page. Fetches indirectly transcluded templates, so will find
  	Template:WPBannerMeta (and its subtemplates). But some banners such as MILHIST don't use that
  	meta template, so we also have to check for template titles containg 'WikiProject'
  */


  return _util.API.get({
    action: "query",
    format: "json",
    prop: "templates",
    titles: talkPage.getPrefixedText(),
    tlnamespace: "10",
    tllimit: "500",
    indexpageids: 1
  }).then(function (result) {
    var id = result.query.pageids;
    var templates = result.query.pages[id].templates;

    if (!templates) {
      return (0, _setup["default"])();
    }

    var hasWikiproject = templates.some(function (template) {
      return /(WikiProject|WPBanner)/.test(template.title);
    });

    if (!hasWikiproject) {
      return (0, _setup["default"])();
    }
  }, function (code, jqxhr) {
    // Silently ignore failures (just log to console)
    console.warn("[Rater] Error while checking whether to autostart." + (code == null) ? "" : " " + (0, _util.makeErrorMsg)(code, jqxhr));
    return $.Deferred().reject();
  });
};

var _default = autoStart;
exports["default"] = _default;

},{"./config":9,"./setup":12,"./util":13}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clearInvalidItems = exports.clearItemIfInvalid = exports.read = exports.write = void 0;

var _util = require("./util");

/** write
 * @param {String} key
 * @param {Array|Object} val
 * @param {Number} staleDays Number of days after which the data becomes stale (usable, but should
 *  be updated for next time).
 * @param {Number} expiryDays Number of days after which the cached data may be deleted.
 */
var write = function write(key, val, staleDays, expiryDays) {
  try {
    var defaultStaleDays = 1;
    var defaultExpiryDays = 30;
    var millisecondsPerDay = 24 * 60 * 60 * 1000;
    var staleDuration = (staleDays || defaultStaleDays) * millisecondsPerDay;
    var expiryDuration = (expiryDays || defaultExpiryDays) * millisecondsPerDay;
    var stringVal = JSON.stringify({
      value: val,
      staleDate: new Date(Date.now() + staleDuration).toISOString(),
      expiryDate: new Date(Date.now() + expiryDuration).toISOString()
    });
    localStorage.setItem("Rater-" + key, stringVal);
  } catch (e) {} // eslint-disable-line no-empty

};
/** read
 * @param {String} key
 * @returns {Array|Object|String|Null} Cached array or object, or empty string if not yet cached,
 *          or null if there was error.
 */


exports.write = write;

var read = function read(key) {
  var val;

  try {
    var stringVal = localStorage.getItem("Rater-" + key);

    if (stringVal !== "") {
      val = JSON.parse(stringVal);
    }
  } catch (e) {
    console.log("[Rater] error reading " + key + " from localStorage cache:");
    console.log("\t" + e.name + " message: " + e.message + (e.at ? " at: " + e.at : "") + (e.text ? " text: " + e.text : ""));
  }

  return val || null;
};

exports.read = read;

var clearItemIfInvalid = function clearItemIfInvalid(key) {
  var isRaterKey = key.indexOf("Rater-") === 0;

  if (!isRaterKey) {
    return;
  }

  var item = read(key.replace("Rater-", ""));
  var isInvalid = !item || !item.expiryDate || (0, _util.isAfterDate)(item.expiryDate);

  if (isInvalid) {
    localStorage.removeItem(key);
  }
};

exports.clearItemIfInvalid = clearItemIfInvalid;

var clearInvalidItems = function clearInvalidItems() {
  for (var i = 0; i < localStorage.length; i++) {
    setTimeout(clearItemIfInvalid, 100, localStorage.key(i));
  }
};

exports.clearInvalidItems = clearInvalidItems;

},{"./util":13}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
// A global object that stores all the page and user configuration and settings
var config = {}; // Script info

config.script = {
  // Advert to append to edit summaries
  advert: " ([[User:Evad37/rater.js|Rater]])",
  version: "2.0.0"
}; // Preferences: globals vars added to users' common.js, or set to defaults if undefined

config.prefs = {
  watchlist: window.rater_watchlist || "preferences"
}; // MediaWiki configuration values

config.mw = mw.config.get(["skin", "wgPageName", "wgNamespaceNumber", "wgUserName", "wgFormattedNamespaces", "wgMonthNames", "wgRevisionId", "wgScriptPath", "wgServer", "wgCategories", "wgIsMainPage"]);
config.regex = {
  /* eslint-disable no-useless-escape */
  // Pattern to find templates, which may contain other templates
  template: /\{\{\s*([^#\{\s].+?)\s*(\|(?:.|\n)*?(?:(?:\{\{(?:.|\n)*?(?:(?:\{\{(?:.|\n)*?\}\})(?:.|\n)*?)*?\}\})(?:.|\n)*?)*|)\}\}\n?/g,
  // Pattern to find `|param=value` or `|value`, where `value` can only contain a pipe
  // if within square brackets (i.e. wikilinks) or braces (i.e. templates)
  templateParams: /\|(?!(?:[^{]+}|[^\[]+]))(?:.|\s)*?(?=(?:\||$)(?!(?:[^{]+}|[^\[]+])))/g
};
/* eslint-enable no-useless-escape */

config.deferred = {};
config.bannerDefaults = {
  classes: ["FA", "FL", "A", "GA", "B", "C", "Start", "Stub", "List"],
  importances: ["Top", "High", "Mid", "Low"],
  extendedClasses: ["Category", "Draft", "File", "Portal", "Project", "Template", "Bplus", "Future", "Current", "Disambig", "NA", "Redirect", "Book"],
  extendedImportances: ["Top", "High", "Mid", "Low", "Bottom", "NA"]
};
config.customClasses = {
  "WikiProject Military history": ["AL", "BL", "CL"],
  "WikiProject Portals": ["FPo", "Complete", "Substantial", "Basic", "Incomplete", "Meta"]
};
config.shellTemplates = ["WikiProject banner shell", "WikiProjectBanners", "WikiProject Banners", "WPB", "WPBS", "Wikiprojectbannershell", "WikiProject Banner Shell", "Wpb", "WPBannerShell", "Wpbs", "Wikiprojectbanners", "WP Banner Shell", "WP banner shell", "Bannershell", "Wikiproject banner shell", "WikiProject Banners Shell", "WikiProjectBanner Shell", "WikiProjectBannerShell", "WikiProject BannerShell", "WikiprojectBannerShell", "WikiProject banner shell/redirect", "WikiProject Shell", "Banner shell", "Scope shell", "Project shell", "WikiProject banner"];
config.defaultParameterData = {
  "auto": {
    "label": {
      "en": "Auto-rated"
    },
    "description": {
      "en": "Automatically rated by a bot. Allowed values: ['yes']."
    },
    "autovalue": "yes"
  },
  "listas": {
    "label": {
      "en": "List as"
    },
    "description": {
      "en": "Sortkey for talk page"
    }
  },
  "small": {
    "label": {
      "en": "Small?"
    },
    "description": {
      "en": "Display a small version. Allowed values: ['yes']."
    },
    "autovalue": "yes"
  },
  "attention": {
    "label": {
      "en": "Attention required?"
    },
    "description": {
      "en": "Immediate attention required. Allowed values: ['yes']."
    },
    "autovalue": "yes"
  },
  "needs-image": {
    "label": {
      "en": "Needs image?"
    },
    "description": {
      "en": "Request that an image or photograph of the subject be added to the article. Allowed values: ['yes']."
    },
    "aliases": ["needs-photo"],
    "autovalue": "yes",
    "suggested": true
  },
  "needs-infobox": {
    "label": {
      "en": "Needs infobox?"
    },
    "description": {
      "en": "Request that an infobox be added to the article. Allowed values: ['yes']."
    },
    "aliases": ["needs-photo"],
    "autovalue": "yes",
    "suggested": true
  }
};
var _default = config;
exports["default"] = _default;

},{}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.diffStyles = void 0;
// Attribution: Diff styles from <https://en.wikipedia.org/wiki/Wikipedia:AutoWikiBrowser/style.css>
var diffStyles = "table.diff, td.diff-otitle, td.diff-ntitle { background-color: white; }\ntd.diff-otitle, td.diff-ntitle { text-align: center; }\ntd.diff-marker { text-align: right; font-weight: bold; font-size: 1.25em; }\ntd.diff-lineno { font-weight: bold; }\ntd.diff-addedline, td.diff-deletedline, td.diff-context { font-size: 88%; vertical-align: top; white-space: -moz-pre-wrap; white-space: pre-wrap; }\ntd.diff-addedline, td.diff-deletedline { border-style: solid; border-width: 1px 1px 1px 4px; border-radius: 0.33em; }\ntd.diff-addedline { border-color: #a3d3ff; }\ntd.diff-deletedline { border-color: #ffe49c; }\ntd.diff-context { background: #f3f3f3; color: #333333; border-style: solid; border-width: 1px 1px 1px 4px; border-color: #e6e6e6; border-radius: 0.33em; }\n.diffchange { font-weight: bold; text-decoration: none; }\ntable.diff {\n    border: none;\n    width: 98%; border-spacing: 4px;\n    table-layout: fixed; /* Ensures that colums are of equal width */\n}\ntd.diff-addedline .diffchange, td.diff-deletedline .diffchange { border-radius: 0.33em; padding: 0.25em 0; }\ntd.diff-addedline .diffchange {\tbackground: #d8ecff; }\ntd.diff-deletedline .diffchange { background: #feeec8; }\ntable.diff td {\tpadding: 0.33em 0.66em; }\ntable.diff col.diff-marker { width: 2%; }\ntable.diff col.diff-content { width: 48%; }\ntable.diff td div {\n    /* Force-wrap very long lines such as URLs or page-widening char strings. */\n    word-wrap: break-word;\n    /* As fallback (FF<3.5, Opera <10.5), scrollbars will be added for very wide cells\n        instead of text overflowing or widening */\n    overflow: auto;\n}";
exports.diffStyles = diffStyles;

},{}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _util = require("./util");

var cache = _interopRequireWildcard(require("./cache"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var cacheBanners = function cacheBanners(banners, bannerOptions) {
  cache.write("banners", banners, 2, 60);
  cache.write("bannerOptions", bannerOptions, 2, 60);
};
/**
 * Gets banners/options from the Api
 * 
 * @returns {Promise} Resolved with: banners object, bannerOptions array
 */


var getListOfBannersFromApi = function getListOfBannersFromApi() {
  var finishedPromise = $.Deferred();
  var querySkeleton = {
    action: "query",
    format: "json",
    list: "categorymembers",
    cmprop: "title",
    cmnamespace: "10",
    cmlimit: "500"
  };
  var categories = [{
    title: " Category:WikiProject banners with quality assessment",
    abbreviation: "withRatings",
    banners: [],
    processed: $.Deferred()
  }, {
    title: "Category:WikiProject banners without quality assessment",
    abbreviation: "withoutRatings",
    banners: [],
    processed: $.Deferred()
  }, {
    title: "Category:WikiProject banner wrapper templates",
    abbreviation: "wrappers",
    banners: [],
    processed: $.Deferred()
  }];

  var processQuery = function processQuery(result, catIndex) {
    if (!result.query || !result.query.categorymembers) {
      // No results
      // TODO: error or warning ********
      finishedPromise.reject();
      return;
    } // Gather titles into array - excluding "Template:" prefix


    var resultTitles = result.query.categorymembers.map(function (info) {
      return info.title.slice(9);
    });
    Array.prototype.push.apply(categories[catIndex].banners, resultTitles); // Continue query if needed

    if (result["continue"]) {
      doApiQuery($.extend(categories[catIndex].query, result["continue"]), catIndex);
      return;
    }

    categories[catIndex].processed.resolve();
  };

  var doApiQuery = function doApiQuery(q, catIndex) {
    _util.API.get(q).done(function (result) {
      processQuery(result, catIndex);
    }).fail(function (code, jqxhr) {
      console.warn("[Rater] " + (0, _util.makeErrorMsg)(code, jqxhr, "Could not retrieve pages from [[:" + q.cmtitle + "]]"));
      finishedPromise.reject();
    });
  };

  categories.forEach(function (cat, index, arr) {
    cat.query = $.extend({
      "cmtitle": cat.title
    }, querySkeleton);
    $.when(arr[index - 1] && arr[index - 1].processed || true).then(function () {
      doApiQuery(cat.query, index);
    });
  });
  categories[categories.length - 1].processed.then(function () {
    var banners = {};

    var stashBanner = function stashBanner(catObject) {
      banners[catObject.abbreviation] = catObject.banners;
    };

    var mergeBanners = function mergeBanners(mergeIntoThisArray, catObject) {
      return $.merge(mergeIntoThisArray, catObject.banners);
    };

    var makeOption = function makeOption(bannerName) {
      var isWrapper = -1 !== $.inArray(bannerName, categories[2].banners);
      return {
        data: (isWrapper ? "subst:" : "") + bannerName,
        label: bannerName.replace("WikiProject ", "") + (isWrapper ? " [template wrapper]" : "")
      };
    };

    categories.forEach(stashBanner);
    var bannerOptions = categories.reduce(mergeBanners, []).map(makeOption);
    finishedPromise.resolve(banners, bannerOptions);
  });
  return finishedPromise;
};
/**
 * Gets banners/options from cache, if there and not too old
 * 
 * @returns {Promise} Resolved with: banners object, bannerOptions object
 */


var getBannersFromCache = function getBannersFromCache() {
  var cachedBanners = cache.read("banners");
  var cachedBannerOptions = cache.read("bannerOptions");

  if (!cachedBanners || !cachedBanners.value || !cachedBanners.staleDate || !cachedBannerOptions || !cachedBannerOptions.value || !cachedBannerOptions.staleDate) {
    return $.Deferred().reject();
  }

  if ((0, _util.isAfterDate)(cachedBanners.staleDate) || (0, _util.isAfterDate)(cachedBannerOptions.staleDate)) {
    // Update in the background; still use old list until then  
    getListOfBannersFromApi().then(cacheBanners);
  }

  return $.Deferred().resolve(cachedBanners.value, cachedBannerOptions.value);
};
/**
 * Gets banners/options from cache or API.
 * Has side affect of adding/updating/clearing cache.
 * 
 * @returns {Promise<Object, Array>} banners object, bannerOptions object
 */


var getBanners = function getBanners() {
  return getBannersFromCache().then( // Success: pass through
  function (banners, options) {
    return $.Deferred().resolve(banners, options);
  }, // Failure: get from Api, then cache them
  function () {
    var bannersPromise = getListOfBannersFromApi();
    bannersPromise.then(cacheBanners);
    return bannersPromise;
  });
};

var _default = getBanners;
exports["default"] = _default;

},{"./cache":8,"./util":13}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _config = _interopRequireDefault(require("./config"));

var _util = require("./util");

var _Template = require("./Template");

var _getBanners = _interopRequireDefault(require("./getBanners"));

var cache = _interopRequireWildcard(require("./cache"));

var _windowManager = _interopRequireDefault(require("./windowManager"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var setupRater = function setupRater(clickEvent) {
  if (clickEvent) {
    clickEvent.preventDefault();
  }

  var setupCompletedPromise = $.Deferred();
  var currentPage = mw.Title.newFromText(_config["default"].mw.wgPageName);
  var talkPage = currentPage && currentPage.getTalkPage();
  var subjectPage = currentPage && currentPage.getSubjectPage(); // Get lists of all banners (task 1)

  var bannersPromise = (0, _getBanners["default"])(); // Load talk page (task 2)

  var loadTalkPromise = _util.API.get({
    action: "query",
    prop: "revisions",
    rvprop: "content",
    rvsection: "0",
    titles: talkPage.getPrefixedText(),
    indexpageids: 1
  }).then(function (result) {
    var id = result.query.pageids;
    var wikitext = id < 0 ? "" : result.query.pages[id].revisions[0]["*"];
    return wikitext;
  }); // Parse talk page for banners (task 3)


  var parseTalkPromise = loadTalkPromise.then(function (wikitext) {
    return (0, _Template.parseTemplates)(wikitext, true);
  }) // Get all templates
  .then(function (templates) {
    return (0, _Template.getWithRedirectTo)(templates);
  }) // Check for redirects
  .then(function (templates) {
    return bannersPromise.then(function (allBanners) {
      // Get list of all banner templates
      return templates.filter(function (template) {
        // Filter out non-banners
        var mainText = template.redirectTo ? template.redirectTo.getMainText() : template.getTitle().getMainText();
        return allBanners.withRatings.includes(mainText) || allBanners.withoutRatings.includes(mainText) || allBanners.wrappers.includes(mainText);
      }).map(function (template) {
        // Set wrapper target if needed
        var mainText = template.redirectTo ? template.redirectTo.getMainText() : template.getTitle().getMainText();

        if (allBanners.wrappers.includes(mainText)) {
          template.redirectsTo = mw.Title.newFromText("Template:Subst:" + mainText);
        }

        return template;
      });
    });
  }); // Retrieve and store TemplateData (task 4)

  var templateDataPromise = parseTalkPromise.then(function (templates) {
    templates.forEach(function (template) {
      return template.setParamDataAndSuggestions();
    });
    return templates;
  }); // Check if page is a redirect (task 5) - but don't error out if request fails

  var redirectCheckPromise = _util.API.getRaw(subjectPage.getPrefixedText()).then( // Success
  function (rawPage) {
    if (/^\s*#REDIRECT/i.test(rawPage)) {
      // get redirection target, or boolean true
      return rawPage.slice(rawPage.indexOf("[[") + 2, rawPage.indexOf("]]")) || true;
    }

    return false;
  }, // Failure (ignored)
  function () {
    return null;
  }); // Retrieve rating from ORES (task 6, only needed for articles)


  var shouldGetOres = _config["default"].mw.wgNamespaceNumber <= 1;

  if (shouldGetOres) {
    var latestRevIdPromise = currentPage.isTalkPage() ? $.Deferred().resolve(_config["default"].mw.wgRevisionId) : _util.API.get({
      action: "query",
      format: "json",
      prop: "revisions",
      titles: subjectPage.getPrefixedText(),
      rvprop: "ids",
      indexpageids: 1
    }).then(function (result) {
      if (result.query.redirects) {
        return false;
      }

      var id = result.query.pageids;
      var page = result.query.pages[id];

      if (page.missing === "") {
        return false;
      }

      if (id < 0) {
        return $.Deferred().reject();
      }

      return page.revisions[0].revid;
    });
    var oresPromise = latestRevIdPromise.then(function (latestRevId) {
      if (!latestRevId) {
        return false;
      }

      return _util.API.getORES(latestRevId).then(function (result) {
        var data = result.enwiki.scores[latestRevId].wp10;

        if (data.error) {
          return $.Deferred().reject(data.error.type, data.error.message);
        }

        return data.score.prediction;
      });
    });
  } // Open the load dialog


  var isOpenedPromise = $.Deferred();

  var loadDialogWin = _windowManager["default"].openWindow("loadDialog", {
    promises: [bannersPromise, loadTalkPromise, parseTalkPromise, templateDataPromise, redirectCheckPromise, shouldGetOres && oresPromise],
    ores: shouldGetOres,
    isOpened: isOpenedPromise
  });

  loadDialogWin.opened.then(isOpenedPromise.resolve);
  $.when(loadTalkPromise, templateDataPromise, redirectCheckPromise, shouldGetOres && oresPromise).then( // All succeded
  function (talkWikitext, banners, redirectTarget, oresPredicition) {
    var result = {
      success: true,
      talkpage: talkPage,
      talkWikitext: talkWikitext,
      banners: banners
    };

    if (redirectTarget) {
      result.redirectTarget = redirectTarget;
    }

    if (oresPredicition) {
      result.oresPredicition = oresPredicition;
    }

    _windowManager["default"].closeWindow("loadDialog", result);
  }); // Any failures are handled by the loadDialog window itself
  // On window closed, check data, and resolve/reject setupCompletedPromise

  loadDialogWin.closed.then(function (data) {
    if (data && data.success) {
      // Got everything needed: Resolve promise with this data
      setupCompletedPromise.resolve(data);
    } else if (data && data.error) {
      // There was an error: Reject promise with error code/info
      setupCompletedPromise.reject(data.error.code, data.error.info);
    } else {
      // Window closed before completion: resolve promise without any data
      setupCompletedPromise.resolve(null);
    }

    cache.clearInvalidItems();
  }); // TESTING purposes only: log passed data to console

  setupCompletedPromise.then(function (data) {
    return console.log("setup window closed", data);
  }, function (code, info) {
    return console.log("setup window closed with error", {
      code: code,
      info: info
    });
  });
  return setupCompletedPromise;
};

var _default = setupRater;
exports["default"] = _default;

},{"./Template":2,"./cache":8,"./config":9,"./getBanners":11,"./util":13,"./windowManager":14}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeErrorMsg = exports.API = exports.isAfterDate = void 0;

var _config = _interopRequireDefault(require("./config"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var isAfterDate = function isAfterDate(dateString) {
  return new Date(dateString) < new Date();
};

exports.isAfterDate = isAfterDate;
var API = new mw.Api({
  ajax: {
    headers: {
      "Api-User-Agent": "Rater/" + _config["default"].script.version + " ( https://en.wikipedia.org/wiki/User:Evad37/Rater )"
    }
  }
});
/* ---------- API for ORES ---------------------------------------------------------------------- */

exports.API = API;

API.getORES = function (revisionID) {
  return $.get("https://ores.wikimedia.org/v3/scores/enwiki?models=wp10&revids=" + revisionID);
};
/* ---------- Raw wikitext ---------------------------------------------------------------------- */


API.getRaw = function (page) {
  return $.get("https:" + _config["default"].mw.wgServer + mw.util.getUrl(page, {
    action: "raw"
  })).then(function (data) {
    if (!data) {
      return $.Deferred().reject("ok-but-empty");
    }

    return data;
  });
};

var makeErrorMsg = function makeErrorMsg(first, second) {
  var code, xhr, message;

  if (_typeof(first) === "object" && typeof second === "string") {
    // Errors from $.get being rejected (ORES & Raw wikitext)
    var errorObj = first.responseJSON && first.responseJSON.error;

    if (errorObj) {
      // Got an api-specific error code/message
      code = errorObj.code;
      message = errorObj.message;
    } else {
      xhr = first;
    }
  } else if (typeof first === "string" && _typeof(second) === "object") {
    // Errors from mw.Api object
    var mwErrorObj = second.error;

    if (mwErrorObj) {
      // Got an api-specific error code/message
      code = errorObj.code;
      message = errorObj.info;
    } else if (first === "ok-but-empty") {
      code = null;
      message = "Got an empty response from the server";
    } else {
      xhr = second && second.xhr;
    }
  }

  if (code && message) {
    return "API error ".concat(code, ": ").concat(message);
  } else if (message) {
    return "API error: ".concat(message);
  } else if (xhr) {
    return "HTTP error ".concat(xhr.status);
  } else if (typeof first === "string" && first !== "error" && typeof second === "string" && second !== "error") {
    return "Error ".concat(first, ": ").concat(second);
  } else if (typeof first === "string" && first !== "error") {
    return "Error: ".concat(first);
  } else {
    return "Unknown API error";
  }
};

exports.makeErrorMsg = makeErrorMsg;

},{"./config":9}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _LoadDialog = _interopRequireDefault(require("./Windows/LoadDialog"));

var _MainWindow = _interopRequireDefault(require("./Windows/MainWindow"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var factory = new OO.Factory(); // Register window constructors with the factory.

factory.register(_LoadDialog["default"]);
factory.register(_MainWindow["default"]);
var manager = new OO.ui.WindowManager({
  "factory": factory
});
$(document.body).append(manager.$element);
var _default = manager;
exports["default"] = _default;

},{"./Windows/LoadDialog":5,"./Windows/MainWindow":6}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJyYXRlci1zcmMvQXBwLmpzIiwicmF0ZXItc3JjL1RlbXBsYXRlLmpzIiwicmF0ZXItc3JjL1dpbmRvd3MvQ29tcG9uZW50cy9CYW5uZXJXaWRnZXQuanMiLCJyYXRlci1zcmMvV2luZG93cy9Db21wb25lbnRzL1BhcmFtZXRlcldpZGdldC5qcyIsInJhdGVyLXNyYy9XaW5kb3dzL0xvYWREaWFsb2cuanMiLCJyYXRlci1zcmMvV2luZG93cy9NYWluV2luZG93LmpzIiwicmF0ZXItc3JjL2F1dG9zdGFydC5qcyIsInJhdGVyLXNyYy9jYWNoZS5qcyIsInJhdGVyLXNyYy9jb25maWcuanMiLCJyYXRlci1zcmMvY3NzLmpzIiwicmF0ZXItc3JjL2dldEJhbm5lcnMuanMiLCJyYXRlci1zcmMvc2V0dXAuanMiLCJyYXRlci1zcmMvdXRpbC5qcyIsInJhdGVyLXNyYy93aW5kb3dNYW5hZ2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUVBLENBQUMsU0FBUyxHQUFULEdBQWU7QUFDZixFQUFBLE9BQU8sQ0FBQyxHQUFSLENBQVksOEJBQVo7QUFFQSxFQUFBLEVBQUUsQ0FBQyxJQUFILENBQVEsTUFBUixDQUFlLGVBQWY7O0FBRUEsTUFBTSxjQUFjLEdBQUcsU0FBakIsY0FBaUIsQ0FBQSxJQUFJLEVBQUk7QUFDOUIsUUFBSSxDQUFDLElBQUQsSUFBUyxDQUFDLElBQUksQ0FBQyxPQUFuQixFQUE0QjtBQUMzQjtBQUNBOztBQUVELDhCQUFjLFVBQWQsQ0FBeUIsTUFBekIsRUFBaUMsSUFBakM7QUFDQSxHQU5EOztBQVFBLE1BQU0sY0FBYyxHQUFHLFNBQWpCLGNBQWlCLENBQUMsSUFBRCxFQUFPLEtBQVA7QUFBQSxXQUFpQixFQUFFLENBQUMsRUFBSCxDQUFNLEtBQU4sQ0FDdkMsd0JBQWEsSUFBYixFQUFtQixL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RCxNQUVPLElBQUksT0FBSixFQUFhO0FBQ25CLGdDQUFxQixPQUFyQjtBQUNBLEdBRk0sTUFFQSxJQUFJLEdBQUosRUFBUztBQUNmLGdDQUFxQixHQUFHLENBQUMsTUFBekI7QUFDQSxHQUZNLE1BRUEsSUFDTixPQUFPLEtBQVAsS0FBaUIsUUFBakIsSUFBNkIsS0FBSyxLQUFLLE9BQXZDLElBQ0EsT0FBTyxNQUFQLEtBQWtCLFFBRGxCLElBQzhCLE1BQU0sS0FBSyxPQUZuQyxFQUdMO0FBQ0QsMkJBQWdCLEtBQWhCLGVBQTBCLE1BQTFCO0FBQ0EsR0FMTSxNQUtBLElBQUksT0FBTyxLQUFQLEtBQWlCLFFBQWpCLElBQTZCLEtBQUssS0FBSyxPQUEzQyxFQUFvRDtBQUMxRCw0QkFBaUIsS0FBakI7QUFDQSxHQUZNLE1BRUE7QUFDTixXQUFPLG1CQUFQO0FBQ0E7QUFDRCxDQTNDRDs7Ozs7Ozs7Ozs7O0FDL0JBOztBQUNBOzs7O0FBRUEsSUFBSSxPQUFPLEdBQUcsSUFBSSxFQUFFLENBQUMsT0FBUCxFQUFkLEMsQ0FFQTs7QUFDQSxPQUFPLENBQUMsUUFBUixDQUFpQixzQkFBakI7QUFDQSxPQUFPLENBQUMsUUFBUixDQUFpQixzQkFBakI7QUFFQSxJQUFJLE9BQU8sR0FBRyxJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sYUFBVixDQUF5QjtBQUN0QyxhQUFXO0FBRDJCLENBQXpCLENBQWQ7QUFHQSxDQUFDLENBQUUsUUFBUSxDQUFDLElBQVgsQ0FBRCxDQUFtQixNQUFuQixDQUEyQixPQUFPLENBQUMsUUFBbkM7ZUFFZSxPIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IHNldHVwUmF0ZXIgZnJvbSBcIi4vc2V0dXBcIjtcclxuaW1wb3J0IGF1dG9TdGFydCBmcm9tIFwiLi9hdXRvc3RhcnRcIjtcclxuaW1wb3J0IGRpZmZTdHlsZXMgZnJvbSBcIi4vY3NzLmpzXCI7XHJcbmltcG9ydCB7IG1ha2VFcnJvck1zZyB9IGZyb20gXCIuL3V0aWxcIjtcclxuaW1wb3J0IHdpbmRvd01hbmFnZXIgZnJvbSBcIi4vd2luZG93TWFuYWdlclwiO1xyXG5cclxuKGZ1bmN0aW9uIEFwcCgpIHtcclxuXHRjb25zb2xlLmxvZyhcIlJhdGVyJ3MgQXBwLmpzIGlzIHJ1bm5pbmcuLi5cIik7XHJcblxyXG5cdG13LnV0aWwuYWRkQ1NTKGRpZmZTdHlsZXMpO1xyXG5cclxuXHRjb25zdCBzaG93TWFpbldpbmRvdyA9IGRhdGEgPT4ge1xyXG5cdFx0aWYgKCFkYXRhIHx8ICFkYXRhLnN1Y2Nlc3MpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdHdpbmRvd01hbmFnZXIub3BlbldpbmRvdyhcIm1haW5cIiwgZGF0YSk7XHJcblx0fTtcclxuXHJcblx0Y29uc3Qgc2hvd1NldHVwRXJyb3IgPSAoY29kZSwganF4aHIpID0+IE9PLnVpLmFsZXJ0KFxyXG5cdFx0bWFrZUVycm9yTXNnKGNvZGUsIGpxeGhyKSxcdHtcclxuXHRcdFx0dGl0bGU6IFwiUmF0ZXIgZmFpbGVkIHRvIG9wZW5cIlxyXG5cdFx0fVxyXG5cdCk7XHJcblxyXG5cdC8vIEludm9jYXRpb24gYnkgcG9ydGxldCBsaW5rIFxyXG5cdG13LnV0aWwuYWRkUG9ydGxldExpbmsoXHJcblx0XHRcInAtY2FjdGlvbnNcIixcclxuXHRcdFwiI1wiLFxyXG5cdFx0XCJSYXRlclwiLFxyXG5cdFx0XCJjYS1yYXRlclwiLFxyXG5cdFx0XCJSYXRlIHF1YWxpdHkgYW5kIGltcG9ydGFuY2VcIixcclxuXHRcdFwiNVwiXHJcblx0KTtcclxuXHQkKFwiI2NhLXJhdGVyXCIpLmNsaWNrKCgpID0+IHNldHVwUmF0ZXIoKS50aGVuKHNob3dNYWluV2luZG93LCBzaG93U2V0dXBFcnJvcikgKTtcclxuXHJcblx0Ly8gSW52b2NhdGlvbiBieSBhdXRvLXN0YXJ0IChkbyBub3Qgc2hvdyBtZXNzYWdlIG9uIGVycm9yKVxyXG5cdGF1dG9TdGFydCgpLnRoZW4oc2hvd01haW5XaW5kb3cpO1xyXG59KSgpOyIsImltcG9ydCB7QVBJLCBpc0FmdGVyRGF0ZX0gZnJvbSBcIi4vdXRpbFwiO1xyXG5pbXBvcnQgY29uZmlnIGZyb20gXCIuL2NvbmZpZ1wiO1xyXG5pbXBvcnQgKiBhcyBjYWNoZSBmcm9tIFwiLi9jYWNoZVwiO1xyXG5cclxuLyoqIFRlbXBsYXRlXHJcbiAqXHJcbiAqIEBjbGFzc1xyXG4gKiBSZXByZXNlbnRzIHRoZSB3aWtpdGV4dCBvZiB0ZW1wbGF0ZSB0cmFuc2NsdXNpb24uIFVzZWQgYnkgI3BhcnNlVGVtcGxhdGVzLlxyXG4gKiBAcHJvcCB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIHRlbXBsYXRlXHJcbiAqIEBwcm9wIHtTdHJpbmd9IHdpa2l0ZXh0IEZ1bGwgd2lraXRleHQgb2YgdGhlIHRyYW5zY2x1c2lvblxyXG4gKiBAcHJvcCB7T2JqZWN0W119IHBhcmFtZXRlcnMgUGFyYW1ldGVycyB1c2VkIGluIHRoZSB0cmFuc2xjdXNpb24sIGluIG9yZGVyLCBvZiBmb3JtOlxyXG5cdHtcclxuXHRcdG5hbWU6IHtTdHJpbmd8TnVtYmVyfSBwYXJhbWV0ZXIgbmFtZSwgb3IgcG9zaXRpb24gZm9yIHVubmFtZWQgcGFyYW1ldGVycyxcclxuXHRcdHZhbHVlOiB7U3RyaW5nfSBXaWtpdGV4dCBwYXNzZWQgdG8gdGhlIHBhcmFtZXRlciAod2hpdGVzcGFjZSB0cmltbWVkKSxcclxuXHRcdHdpa2l0ZXh0OiB7U3RyaW5nfSBGdWxsIHdpa2l0ZXh0IChpbmNsdWRpbmcgbGVhZGluZyBwaXBlLCBwYXJhbWV0ZXIgbmFtZS9lcXVhbHMgc2lnbiAoaWYgYXBwbGljYWJsZSksIHZhbHVlLCBhbmQgYW55IHdoaXRlc3BhY2UpXHJcblx0fVxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtTdHJpbmd9IHdpa2l0ZXh0IFdpa2l0ZXh0IG9mIGEgdGVtcGxhdGUgdHJhbnNjbHVzaW9uLCBzdGFydGluZyB3aXRoICd7eycgYW5kIGVuZGluZyB3aXRoICd9fScuXHJcbiAqL1xyXG52YXIgVGVtcGxhdGUgPSBmdW5jdGlvbih3aWtpdGV4dCkge1xyXG5cdHRoaXMud2lraXRleHQgPSB3aWtpdGV4dDtcclxuXHR0aGlzLnBhcmFtZXRlcnMgPSBbXTtcclxufTtcclxuVGVtcGxhdGUucHJvdG90eXBlLmFkZFBhcmFtID0gZnVuY3Rpb24obmFtZSwgdmFsLCB3aWtpdGV4dCkge1xyXG5cdHRoaXMucGFyYW1ldGVycy5wdXNoKHtcclxuXHRcdFwibmFtZVwiOiBuYW1lLFxyXG5cdFx0XCJ2YWx1ZVwiOiB2YWwsIFxyXG5cdFx0XCJ3aWtpdGV4dFwiOiBcInxcIiArIHdpa2l0ZXh0XHJcblx0fSk7XHJcbn07XHJcbi8qKlxyXG4gKiBHZXQgYSBwYXJhbWV0ZXIgZGF0YSBieSBwYXJhbWV0ZXIgbmFtZVxyXG4gKi8gXHJcblRlbXBsYXRlLnByb3RvdHlwZS5nZXRQYXJhbSA9IGZ1bmN0aW9uKHBhcmFtTmFtZSkge1xyXG5cdHJldHVybiB0aGlzLnBhcmFtZXRlcnMuZmluZChmdW5jdGlvbihwKSB7IHJldHVybiBwLm5hbWUgPT0gcGFyYW1OYW1lOyB9KTtcclxufTtcclxuVGVtcGxhdGUucHJvdG90eXBlLnNldE5hbWUgPSBmdW5jdGlvbihuYW1lKSB7XHJcblx0dGhpcy5uYW1lID0gbmFtZS50cmltKCk7XHJcbn07XHJcblRlbXBsYXRlLnByb3RvdHlwZS5nZXRUaXRsZSA9IGZ1bmN0aW9uKCkge1xyXG5cdHJldHVybiBtdy5UaXRsZS5uZXdGcm9tVGV4dChcIlRlbXBsYXRlOlwiICsgdGhpcy5uYW1lKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBwYXJzZVRlbXBsYXRlc1xyXG4gKlxyXG4gKiBQYXJzZXMgdGVtcGxhdGVzIGZyb20gd2lraXRleHQuXHJcbiAqIEJhc2VkIG9uIFNEMDAwMSdzIHZlcnNpb24gYXQgPGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1VzZXI6U0QwMDAxL3BhcnNlQWxsVGVtcGxhdGVzLmpzPi5cclxuICogUmV0dXJucyBhbiBhcnJheSBjb250YWluaW5nIHRoZSB0ZW1wbGF0ZSBkZXRhaWxzOlxyXG4gKiAgdmFyIHRlbXBsYXRlcyA9IHBhcnNlVGVtcGxhdGVzKFwiSGVsbG8ge3tmb28gfEJhcnxiYXo9cXV4IHwyPWxvcmVtaXBzdW18Mz19fSB3b3JsZFwiKTtcclxuICogIGNvbnNvbGUubG9nKHRlbXBsYXRlc1swXSk7IC8vIC0tPiBvYmplY3RcclxuXHR7XHJcblx0XHRuYW1lOiBcImZvb1wiLFxyXG5cdFx0d2lraXRleHQ6XCJ7e2ZvbyB8QmFyfGJhej1xdXggfCAyID0gbG9yZW1pcHN1bSAgfDM9fX1cIixcclxuXHRcdHBhcmFtZXRlcnM6IFtcclxuXHRcdFx0e1xyXG5cdFx0XHRcdG5hbWU6IDEsXHJcblx0XHRcdFx0dmFsdWU6ICdCYXInLFxyXG5cdFx0XHRcdHdpa2l0ZXh0OiAnfEJhcidcclxuXHRcdFx0fSxcclxuXHRcdFx0e1xyXG5cdFx0XHRcdG5hbWU6ICdiYXonLFxyXG5cdFx0XHRcdHZhbHVlOiAncXV4JyxcclxuXHRcdFx0XHR3aWtpdGV4dDogJ3xiYXo9cXV4ICdcclxuXHRcdFx0fSxcclxuXHRcdFx0e1xyXG5cdFx0XHRcdG5hbWU6ICcyJyxcclxuXHRcdFx0XHR2YWx1ZTogJ2xvcmVtaXBzdW0nLFxyXG5cdFx0XHRcdHdpa2l0ZXh0OiAnfCAyID0gbG9yZW1pcHN1bSAgJ1xyXG5cdFx0XHR9LFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0bmFtZTogJzMnLFxyXG5cdFx0XHRcdHZhbHVlOiAnJyxcclxuXHRcdFx0XHR3aWtpdGV4dDogJ3wzPSdcclxuXHRcdFx0fVxyXG5cdFx0XSxcclxuXHRcdGdldFBhcmFtOiBmdW5jdGlvbihwYXJhbU5hbWUpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucGFyYW1ldGVycy5maW5kKGZ1bmN0aW9uKHApIHsgcmV0dXJuIHAubmFtZSA9PSBwYXJhbU5hbWU7IH0pO1xyXG5cdFx0fVxyXG5cdH1cclxuICogICAgXHJcbiAqIFxyXG4gKiBAcGFyYW0ge1N0cmluZ30gd2lraXRleHRcclxuICogQHBhcmFtIHtCb29sZWFufSByZWN1cnNpdmUgU2V0IHRvIGB0cnVlYCB0byBhbHNvIHBhcnNlIHRlbXBsYXRlcyB0aGF0IG9jY3VyIHdpdGhpbiBvdGhlciB0ZW1wbGF0ZXMsXHJcbiAqICByYXRoZXIgdGhhbiBqdXN0IHRvcC1sZXZlbCB0ZW1wbGF0ZXMuIFxyXG4gKiBAcmV0dXJuIHtUZW1wbGF0ZVtdfSB0ZW1wbGF0ZXNcclxuKi9cclxudmFyIHBhcnNlVGVtcGxhdGVzID0gZnVuY3Rpb24od2lraXRleHQsIHJlY3Vyc2l2ZSkgeyAvKiBlc2xpbnQtZGlzYWJsZSBuby1jb250cm9sLXJlZ2V4ICovXHJcblx0aWYgKCF3aWtpdGV4dCkge1xyXG5cdFx0cmV0dXJuIFtdO1xyXG5cdH1cclxuXHR2YXIgc3RyUmVwbGFjZUF0ID0gZnVuY3Rpb24oc3RyaW5nLCBpbmRleCwgY2hhcikge1xyXG5cdFx0cmV0dXJuIHN0cmluZy5zbGljZSgwLGluZGV4KSArIGNoYXIgKyBzdHJpbmcuc2xpY2UoaW5kZXggKyAxKTtcclxuXHR9O1xyXG5cclxuXHR2YXIgcmVzdWx0ID0gW107XHJcblx0XHJcblx0dmFyIHByb2Nlc3NUZW1wbGF0ZVRleHQgPSBmdW5jdGlvbiAoc3RhcnRJZHgsIGVuZElkeCkge1xyXG5cdFx0dmFyIHRleHQgPSB3aWtpdGV4dC5zbGljZShzdGFydElkeCwgZW5kSWR4KTtcclxuXHJcblx0XHR2YXIgdGVtcGxhdGUgPSBuZXcgVGVtcGxhdGUoXCJ7e1wiICsgdGV4dC5yZXBsYWNlKC9cXHgwMS9nLFwifFwiKSArIFwifX1cIik7XHJcblx0XHRcclxuXHRcdC8vIHN3YXAgb3V0IHBpcGUgaW4gbGlua3Mgd2l0aCBcXHgwMSBjb250cm9sIGNoYXJhY3RlclxyXG5cdFx0Ly8gW1tGaWxlOiBdXSBjYW4gaGF2ZSBtdWx0aXBsZSBwaXBlcywgc28gbWlnaHQgbmVlZCBtdWx0aXBsZSBwYXNzZXNcclxuXHRcdHdoaWxlICggLyhcXFtcXFtbXlxcXV0qPylcXHwoLio/XFxdXFxdKS9nLnRlc3QodGV4dCkgKSB7XHJcblx0XHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXFtcXFtbXlxcXV0qPylcXHwoLio/XFxdXFxdKS9nLCBcIiQxXFx4MDEkMlwiKTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgY2h1bmtzID0gdGV4dC5zcGxpdChcInxcIikubWFwKGZ1bmN0aW9uKGNodW5rKSB7XHJcblx0XHRcdC8vIGNoYW5nZSAnXFx4MDEnIGNvbnRyb2wgY2hhcmFjdGVycyBiYWNrIHRvIHBpcGVzXHJcblx0XHRcdHJldHVybiBjaHVuay5yZXBsYWNlKC9cXHgwMS9nLFwifFwiKTsgXHJcblx0XHR9KTtcclxuXHJcblx0XHR0ZW1wbGF0ZS5zZXROYW1lKGNodW5rc1swXSk7XHJcblx0XHRcclxuXHRcdHZhciBwYXJhbWV0ZXJDaHVua3MgPSBjaHVua3Muc2xpY2UoMSk7XHJcblxyXG5cdFx0dmFyIHVubmFtZWRJZHggPSAxO1xyXG5cdFx0cGFyYW1ldGVyQ2h1bmtzLmZvckVhY2goZnVuY3Rpb24oY2h1bmspIHtcclxuXHRcdFx0dmFyIGluZGV4T2ZFcXVhbFRvID0gY2h1bmsuaW5kZXhPZihcIj1cIik7XHJcblx0XHRcdHZhciBpbmRleE9mT3BlbkJyYWNlcyA9IGNodW5rLmluZGV4T2YoXCJ7e1wiKTtcclxuXHRcdFx0XHJcblx0XHRcdHZhciBpc1dpdGhvdXRFcXVhbHMgPSAhY2h1bmsuaW5jbHVkZXMoXCI9XCIpO1xyXG5cdFx0XHR2YXIgaGFzQnJhY2VzQmVmb3JlRXF1YWxzID0gY2h1bmsuaW5jbHVkZXMoXCJ7e1wiKSAmJiBpbmRleE9mT3BlbkJyYWNlcyA8IGluZGV4T2ZFcXVhbFRvO1x0XHJcblx0XHRcdHZhciBpc1VubmFtZWRQYXJhbSA9ICggaXNXaXRob3V0RXF1YWxzIHx8IGhhc0JyYWNlc0JlZm9yZUVxdWFscyApO1xyXG5cdFx0XHRcclxuXHRcdFx0dmFyIHBOYW1lLCBwTnVtLCBwVmFsO1xyXG5cdFx0XHRpZiAoIGlzVW5uYW1lZFBhcmFtICkge1xyXG5cdFx0XHRcdC8vIEdldCB0aGUgbmV4dCBudW1iZXIgbm90IGFscmVhZHkgdXNlZCBieSBlaXRoZXIgYW4gdW5uYW1lZCBwYXJhbWV0ZXIsIG9yIGJ5IGFcclxuXHRcdFx0XHQvLyBuYW1lZCBwYXJhbWV0ZXIgbGlrZSBgfDE9dmFsYFxyXG5cdFx0XHRcdHdoaWxlICggdGVtcGxhdGUuZ2V0UGFyYW0odW5uYW1lZElkeCkgKSB7XHJcblx0XHRcdFx0XHR1bm5hbWVkSWR4Kys7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHBOdW0gPSB1bm5hbWVkSWR4O1xyXG5cdFx0XHRcdHBWYWwgPSBjaHVuay50cmltKCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cE5hbWUgPSBjaHVuay5zbGljZSgwLCBpbmRleE9mRXF1YWxUbykudHJpbSgpO1xyXG5cdFx0XHRcdHBWYWwgPSBjaHVuay5zbGljZShpbmRleE9mRXF1YWxUbyArIDEpLnRyaW0oKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0ZW1wbGF0ZS5hZGRQYXJhbShwTmFtZSB8fCBwTnVtLCBwVmFsLCBjaHVuayk7XHJcblx0XHR9KTtcclxuXHRcdFxyXG5cdFx0cmVzdWx0LnB1c2godGVtcGxhdGUpO1xyXG5cdH07XHJcblxyXG5cdFxyXG5cdHZhciBuID0gd2lraXRleHQubGVuZ3RoO1xyXG5cdFxyXG5cdC8vIG51bWJlciBvZiB1bmNsb3NlZCBicmFjZXNcclxuXHR2YXIgbnVtVW5jbG9zZWQgPSAwO1xyXG5cclxuXHQvLyBhcmUgd2UgaW5zaWRlIGEgY29tbWVudCBvciBiZXR3ZWVuIG5vd2lraSB0YWdzP1xyXG5cdHZhciBpbkNvbW1lbnQgPSBmYWxzZTtcclxuXHR2YXIgaW5Ob3dpa2kgPSBmYWxzZTtcclxuXHJcblx0dmFyIHN0YXJ0SWR4LCBlbmRJZHg7XHJcblx0XHJcblx0Zm9yICh2YXIgaT0wOyBpPG47IGkrKykge1xyXG5cdFx0XHJcblx0XHRpZiAoICFpbkNvbW1lbnQgJiYgIWluTm93aWtpICkge1xyXG5cdFx0XHRcclxuXHRcdFx0aWYgKHdpa2l0ZXh0W2ldID09PSBcIntcIiAmJiB3aWtpdGV4dFtpKzFdID09PSBcIntcIikge1xyXG5cdFx0XHRcdGlmIChudW1VbmNsb3NlZCA9PT0gMCkge1xyXG5cdFx0XHRcdFx0c3RhcnRJZHggPSBpKzI7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdG51bVVuY2xvc2VkICs9IDI7XHJcblx0XHRcdFx0aSsrO1xyXG5cdFx0XHR9IGVsc2UgaWYgKHdpa2l0ZXh0W2ldID09PSBcIn1cIiAmJiB3aWtpdGV4dFtpKzFdID09PSBcIn1cIikge1xyXG5cdFx0XHRcdGlmIChudW1VbmNsb3NlZCA9PT0gMikge1xyXG5cdFx0XHRcdFx0ZW5kSWR4ID0gaTtcclxuXHRcdFx0XHRcdHByb2Nlc3NUZW1wbGF0ZVRleHQoc3RhcnRJZHgsIGVuZElkeCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdG51bVVuY2xvc2VkIC09IDI7XHJcblx0XHRcdFx0aSsrO1xyXG5cdFx0XHR9IGVsc2UgaWYgKHdpa2l0ZXh0W2ldID09PSBcInxcIiAmJiBudW1VbmNsb3NlZCA+IDIpIHtcclxuXHRcdFx0XHQvLyBzd2FwIG91dCBwaXBlcyBpbiBuZXN0ZWQgdGVtcGxhdGVzIHdpdGggXFx4MDEgY2hhcmFjdGVyXHJcblx0XHRcdFx0d2lraXRleHQgPSBzdHJSZXBsYWNlQXQod2lraXRleHQsIGksXCJcXHgwMVwiKTtcclxuXHRcdFx0fSBlbHNlIGlmICggL148IS0tLy50ZXN0KHdpa2l0ZXh0LnNsaWNlKGksIGkgKyA0KSkgKSB7XHJcblx0XHRcdFx0aW5Db21tZW50ID0gdHJ1ZTtcclxuXHRcdFx0XHRpICs9IDM7XHJcblx0XHRcdH0gZWxzZSBpZiAoIC9ePG5vd2lraSA/Pi8udGVzdCh3aWtpdGV4dC5zbGljZShpLCBpICsgOSkpICkge1xyXG5cdFx0XHRcdGluTm93aWtpID0gdHJ1ZTtcclxuXHRcdFx0XHRpICs9IDc7XHJcblx0XHRcdH0gXHJcblxyXG5cdFx0fSBlbHNlIHsgLy8gd2UgYXJlIGluIGEgY29tbWVudCBvciBub3dpa2lcclxuXHRcdFx0aWYgKHdpa2l0ZXh0W2ldID09PSBcInxcIikge1xyXG5cdFx0XHRcdC8vIHN3YXAgb3V0IHBpcGVzIHdpdGggXFx4MDEgY2hhcmFjdGVyXHJcblx0XHRcdFx0d2lraXRleHQgPSBzdHJSZXBsYWNlQXQod2lraXRleHQsIGksXCJcXHgwMVwiKTtcclxuXHRcdFx0fSBlbHNlIGlmICgvXi0tPi8udGVzdCh3aWtpdGV4dC5zbGljZShpLCBpICsgMykpKSB7XHJcblx0XHRcdFx0aW5Db21tZW50ID0gZmFsc2U7XHJcblx0XHRcdFx0aSArPSAyO1xyXG5cdFx0XHR9IGVsc2UgaWYgKC9ePFxcL25vd2lraSA/Pi8udGVzdCh3aWtpdGV4dC5zbGljZShpLCBpICsgMTApKSkge1xyXG5cdFx0XHRcdGluTm93aWtpID0gZmFsc2U7XHJcblx0XHRcdFx0aSArPSA4O1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHRcclxuXHRpZiAoIHJlY3Vyc2l2ZSApIHtcclxuXHRcdHZhciBzdWJ0ZW1wbGF0ZXMgPSByZXN1bHQubWFwKGZ1bmN0aW9uKHRlbXBsYXRlKSB7XHJcblx0XHRcdHJldHVybiB0ZW1wbGF0ZS53aWtpdGV4dC5zbGljZSgyLC0yKTtcclxuXHRcdH0pXHJcblx0XHRcdC5maWx0ZXIoZnVuY3Rpb24odGVtcGxhdGVXaWtpdGV4dCkge1xyXG5cdFx0XHRcdHJldHVybiAvXFx7XFx7LipcXH1cXH0vLnRlc3QodGVtcGxhdGVXaWtpdGV4dCk7XHJcblx0XHRcdH0pXHJcblx0XHRcdC5tYXAoZnVuY3Rpb24odGVtcGxhdGVXaWtpdGV4dCkge1xyXG5cdFx0XHRcdHJldHVybiBwYXJzZVRlbXBsYXRlcyh0ZW1wbGF0ZVdpa2l0ZXh0LCB0cnVlKTtcclxuXHRcdFx0fSk7XHJcblx0XHRcclxuXHRcdHJldHVybiByZXN1bHQuY29uY2F0LmFwcGx5KHJlc3VsdCwgc3VidGVtcGxhdGVzKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiByZXN1bHQ7IFxyXG59OyAvKiBlc2xpbnQtZW5hYmxlIG5vLWNvbnRyb2wtcmVnZXggKi9cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge1RlbXBsYXRlfFRlbXBsYXRlW119IHRlbXBsYXRlc1xyXG4gKiBAcmV0dXJuIHtQcm9taXNlPFRlbXBsYXRlW10+fVxyXG4gKi9cclxudmFyIGdldFdpdGhSZWRpcmVjdFRvID0gZnVuY3Rpb24odGVtcGxhdGVzKSB7XHJcblx0dmFyIHRlbXBsYXRlc0FycmF5ID0gQXJyYXkuaXNBcnJheSh0ZW1wbGF0ZXMpID8gdGVtcGxhdGVzIDogW3RlbXBsYXRlc107XHJcblx0aWYgKHRlbXBsYXRlc0FycmF5Lmxlbmd0aCA9PT0gMCkge1xyXG5cdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZXNvbHZlKFtdKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiBBUEkuZ2V0KHtcclxuXHRcdFwiYWN0aW9uXCI6IFwicXVlcnlcIixcclxuXHRcdFwiZm9ybWF0XCI6IFwianNvblwiLFxyXG5cdFx0XCJ0aXRsZXNcIjogdGVtcGxhdGVzQXJyYXkubWFwKHRlbXBsYXRlID0+IHRlbXBsYXRlLmdldFRpdGxlKCkuZ2V0UHJlZml4ZWRUZXh0KCkpLFxyXG5cdFx0XCJyZWRpcmVjdHNcIjogMVxyXG5cdH0pLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XHJcblx0XHRpZiAoICFyZXN1bHQgfHwgIXJlc3VsdC5xdWVyeSApIHtcclxuXHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoXCJFbXB0eSByZXNwb25zZVwiKTtcclxuXHRcdH1cclxuXHRcdGlmICggcmVzdWx0LnF1ZXJ5LnJlZGlyZWN0cyApIHtcclxuXHRcdFx0cmVzdWx0LnF1ZXJ5LnJlZGlyZWN0cy5mb3JFYWNoKGZ1bmN0aW9uKHJlZGlyZWN0KSB7XHJcblx0XHRcdFx0dmFyIGkgPSB0ZW1wbGF0ZXNBcnJheS5maW5kSW5kZXgodGVtcGxhdGUgPT4gdGVtcGxhdGUuZ2V0VGl0bGUoKS5nZXRQcmVmaXhlZFRleHQoKSA9PT0gcmVkaXJlY3QuZnJvbSk7XHJcblx0XHRcdFx0aWYgKGkgIT09IC0xKSB7XHJcblx0XHRcdFx0XHR0ZW1wbGF0ZXNBcnJheVtpXS5yZWRpcmVjdHNUbyA9IG13LlRpdGxlLm5ld0Zyb21UZXh0KHJlZGlyZWN0LnRvKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRlbXBsYXRlc0FycmF5O1xyXG5cdH0pO1xyXG59O1xyXG5cclxuVGVtcGxhdGUucHJvdG90eXBlLmdldERhdGFGb3JQYXJhbSA9IGZ1bmN0aW9uKGtleSwgcGFyYU5hbWUpIHtcclxuXHRpZiAoICF0aGlzLnBhcmFtRGF0YSApIHtcclxuXHRcdHJldHVybiBudWxsO1xyXG5cdH1cclxuXHQvLyBJZiBhbGlhcywgc3dpdGNoIGZyb20gYWxpYXMgdG8gcHJlZmVycmVkIHBhcmFtZXRlciBuYW1lXHJcblx0dmFyIHBhcmEgPSB0aGlzLnBhcmFtQWxpYXNlc1twYXJhTmFtZV0gfHwgcGFyYU5hbWU7XHRcclxuXHRpZiAoICF0aGlzLnBhcmFtRGF0YVtwYXJhXSApIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0XHJcblx0dmFyIGRhdGEgPSB0aGlzLnBhcmFtRGF0YVtwYXJhXVtrZXldO1xyXG5cdC8vIERhdGEgbWlnaHQgYWN0dWFsbHkgYmUgYW4gb2JqZWN0IHdpdGgga2V5IFwiZW5cIlxyXG5cdGlmICggZGF0YSAmJiBkYXRhLmVuICYmICFBcnJheS5pc0FycmF5KGRhdGEpICkge1xyXG5cdFx0cmV0dXJuIGRhdGEuZW47XHJcblx0fVxyXG5cdHJldHVybiBkYXRhO1xyXG59O1xyXG5cclxuVGVtcGxhdGUucHJvdG90eXBlLnNldFBhcmFtRGF0YUFuZFN1Z2dlc3Rpb25zID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cdHZhciBwYXJhbURhdGFTZXQgPSAkLkRlZmVycmVkKCk7XHJcblx0XHJcblx0aWYgKCBzZWxmLnBhcmFtRGF0YSApIHsgcmV0dXJuIHBhcmFtRGF0YVNldC5yZXNvbHZlKCk7IH1cclxuICAgIFxyXG5cdHZhciBwcmVmaXhlZFRleHQgPSBzZWxmLnJlZGlyZWN0c1RvXHJcblx0XHQ/IHNlbGYucmVkaXJlY3RzVG8uZ2V0UHJlZml4ZWRUZXh0KClcclxuXHRcdDogc2VsZi5nZXRUaXRsZSgpLmdldFByZWZpeGVkVGV4dCgpO1xyXG5cclxuXHR2YXIgY2FjaGVkSW5mbyA9IGNhY2hlLnJlYWQocHJlZml4ZWRUZXh0ICsgXCItcGFyYW1zXCIpO1xyXG5cdFxyXG5cdGlmIChcclxuXHRcdGNhY2hlZEluZm8gJiZcclxuXHRcdGNhY2hlZEluZm8udmFsdWUgJiZcclxuXHRcdGNhY2hlZEluZm8uc3RhbGVEYXRlICYmXHJcblx0XHRjYWNoZWRJbmZvLnZhbHVlLnBhcmFtRGF0YSAhPSBudWxsICYmXHJcblx0XHRjYWNoZWRJbmZvLnZhbHVlLnBhcmFtZXRlclN1Z2dlc3Rpb25zICE9IG51bGwgJiZcclxuXHRcdGNhY2hlZEluZm8udmFsdWUucGFyYW1BbGlhc2VzICE9IG51bGxcclxuXHQpIHtcclxuXHRcdHNlbGYubm90ZW1wbGF0ZWRhdGEgPSBjYWNoZWRJbmZvLnZhbHVlLm5vdGVtcGxhdGVkYXRhO1xyXG5cdFx0c2VsZi5wYXJhbURhdGEgPSBjYWNoZWRJbmZvLnZhbHVlLnBhcmFtRGF0YTtcclxuXHRcdHNlbGYucGFyYW1ldGVyU3VnZ2VzdGlvbnMgPSBjYWNoZWRJbmZvLnZhbHVlLnBhcmFtZXRlclN1Z2dlc3Rpb25zO1xyXG5cdFx0c2VsZi5wYXJhbUFsaWFzZXMgPSBjYWNoZWRJbmZvLnZhbHVlLnBhcmFtQWxpYXNlcztcclxuXHRcdFxyXG5cdFx0cGFyYW1EYXRhU2V0LnJlc29sdmUoKTtcclxuXHRcdGlmICggIWlzQWZ0ZXJEYXRlKGNhY2hlZEluZm8uc3RhbGVEYXRlKSApIHtcclxuXHRcdFx0Ly8gSnVzdCB1c2UgdGhlIGNhY2hlZCBkYXRhXHJcblx0XHRcdHJldHVybiBwYXJhbURhdGFTZXQ7XHJcblx0XHR9IC8vIGVsc2U6IFVzZSB0aGUgY2FjaGUgZGF0YSBmb3Igbm93LCBidXQgYWxzbyBmZXRjaCBuZXcgZGF0YSBmcm9tIEFQSVxyXG5cdH1cclxuXHRcclxuXHRBUEkuZ2V0KHtcclxuXHRcdGFjdGlvbjogXCJ0ZW1wbGF0ZWRhdGFcIixcclxuXHRcdHRpdGxlczogcHJlZml4ZWRUZXh0LFxyXG5cdFx0cmVkaXJlY3RzOiAxLFxyXG5cdFx0aW5jbHVkZU1pc3NpbmdUaXRsZXM6IDFcclxuXHR9KVxyXG5cdFx0LnRoZW4oXHJcblx0XHRcdGZ1bmN0aW9uKHJlc3BvbnNlKSB7IHJldHVybiByZXNwb25zZTsgfSxcclxuXHRcdFx0ZnVuY3Rpb24oLyplcnJvciovKSB7IHJldHVybiBudWxsOyB9IC8vIElnbm9yZSBlcnJvcnMsIHdpbGwgdXNlIGRlZmF1bHQgZGF0YVxyXG5cdFx0KVxyXG5cdFx0LnRoZW4oIGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0Ly8gRmlndXJlIG91dCBwYWdlIGlkIChiZWFjdXNlIGFjdGlvbj10ZW1wbGF0ZWRhdGEgZG9lc24ndCBoYXZlIGFuIGluZGV4cGFnZWlkcyBvcHRpb24pXHJcblx0XHRcdHZhciBpZCA9IHJlc3VsdCAmJiAkLm1hcChyZXN1bHQucGFnZXMsIGZ1bmN0aW9uKCBfdmFsdWUsIGtleSApIHsgcmV0dXJuIGtleTsgfSk7XHJcblx0XHRcclxuXHRcdFx0aWYgKCAhcmVzdWx0IHx8ICFyZXN1bHQucGFnZXNbaWRdIHx8IHJlc3VsdC5wYWdlc1tpZF0ubm90ZW1wbGF0ZWRhdGEgfHwgIXJlc3VsdC5wYWdlc1tpZF0ucGFyYW1zICkge1xyXG5cdFx0XHQvLyBObyBUZW1wbGF0ZURhdGEsIHNvIHVzZSBkZWZhdWx0cyAoZ3Vlc3NlcylcclxuXHRcdFx0XHRzZWxmLm5vdGVtcGxhdGVkYXRhID0gdHJ1ZTtcclxuXHRcdFx0XHRzZWxmLnRlbXBsYXRlZGF0YUFwaUVycm9yID0gIXJlc3VsdDtcclxuXHRcdFx0XHRzZWxmLnBhcmFtRGF0YSA9IGNvbmZpZy5kZWZhdWx0UGFyYW1ldGVyRGF0YTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRzZWxmLnBhcmFtRGF0YSA9IHJlc3VsdC5wYWdlc1tpZF0ucGFyYW1zO1xyXG5cdFx0XHR9XHJcbiAgICAgICAgXHJcblx0XHRcdHNlbGYucGFyYW1BbGlhc2VzID0ge307XHJcblx0XHRcdCQuZWFjaChzZWxmLnBhcmFtRGF0YSwgZnVuY3Rpb24ocGFyYU5hbWUsIHBhcmFEYXRhKSB7XHJcblx0XHRcdFx0Ly8gRXh0cmFjdCBhbGlhc2VzIGZvciBlYXNpZXIgcmVmZXJlbmNlIGxhdGVyIG9uXHJcblx0XHRcdFx0aWYgKCBwYXJhRGF0YS5hbGlhc2VzICYmIHBhcmFEYXRhLmFsaWFzZXMubGVuZ3RoICkge1xyXG5cdFx0XHRcdFx0cGFyYURhdGEuYWxpYXNlcy5mb3JFYWNoKGZ1bmN0aW9uKGFsaWFzKXtcclxuXHRcdFx0XHRcdFx0c2VsZi5wYXJhbUFsaWFzZXNbYWxpYXNdID0gcGFyYU5hbWU7XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Ly8gRXh0cmFjdCBhbGxvd2VkIHZhbHVlcyBhcnJheSBmcm9tIGRlc2NyaXB0aW9uXHJcblx0XHRcdFx0aWYgKCBwYXJhRGF0YS5kZXNjcmlwdGlvbiAmJiAvXFxbLionLis/Jy4qP1xcXS8udGVzdChwYXJhRGF0YS5kZXNjcmlwdGlvbi5lbikgKSB7XHJcblx0XHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0XHR2YXIgYWxsb3dlZFZhbHMgPSBKU09OLnBhcnNlKFxyXG5cdFx0XHRcdFx0XHRcdHBhcmFEYXRhLmRlc2NyaXB0aW9uLmVuXHJcblx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvXi4qXFxbLyxcIltcIilcclxuXHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC9cIi9nLCBcIlxcXFxcXFwiXCIpXHJcblx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvJy9nLCBcIlxcXCJcIilcclxuXHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC8sXFxzKl0vLCBcIl1cIilcclxuXHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC9dLiokLywgXCJdXCIpXHJcblx0XHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0XHRcdHNlbGYucGFyYW1EYXRhW3BhcmFOYW1lXS5hbGxvd2VkVmFsdWVzID0gYWxsb3dlZFZhbHM7XHJcblx0XHRcdFx0XHR9IGNhdGNoKGUpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKFwiW1JhdGVyXSBDb3VsZCBub3QgcGFyc2UgYWxsb3dlZCB2YWx1ZXMgaW4gZGVzY3JpcHRpb246XFxuICBcIitcclxuXHRcdFx0XHRcdHBhcmFEYXRhLmRlc2NyaXB0aW9uLmVuICsgXCJcXG4gQ2hlY2sgVGVtcGxhdGVEYXRhIGZvciBwYXJhbWV0ZXIgfFwiICsgcGFyYU5hbWUgK1xyXG5cdFx0XHRcdFx0XCI9IGluIFwiICsgc2VsZi5nZXRUaXRsZSgpLmdldFByZWZpeGVkVGV4dCgpKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Ly8gTWFrZSBzdXJlIHJlcXVpcmVkL3N1Z2dlc3RlZCBwYXJhbWV0ZXJzIGFyZSBwcmVzZW50XHJcblx0XHRcdFx0aWYgKCAocGFyYURhdGEucmVxdWlyZWQgfHwgcGFyYURhdGEuc3VnZ2VzdGVkKSAmJiAhc2VsZi5nZXRQYXJhbShwYXJhTmFtZSkgKSB7XHJcblx0XHRcdFx0Ly8gQ2hlY2sgaWYgYWxyZWFkeSBwcmVzZW50IGluIGFuIGFsaWFzLCBpZiBhbnlcclxuXHRcdFx0XHRcdGlmICggcGFyYURhdGEuYWxpYXNlcy5sZW5ndGggKSB7XHJcblx0XHRcdFx0XHRcdHZhciBhbGlhc2VzID0gc2VsZi5wYXJhbWV0ZXJzLmZpbHRlcihwID0+IHtcclxuXHRcdFx0XHRcdFx0XHR2YXIgaXNBbGlhcyA9IHBhcmFEYXRhLmFsaWFzZXMuaW5jbHVkZXMocC5uYW1lKTtcclxuXHRcdFx0XHRcdFx0XHR2YXIgaXNFbXB0eSA9ICFwLnZhbDtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gaXNBbGlhcyAmJiAhaXNFbXB0eTtcclxuXHRcdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHRcdGlmICggYWxpYXNlcy5sZW5ndGggKSB7XHJcblx0XHRcdFx0XHRcdC8vIEF0IGxlYXN0IG9uZSBub24tZW1wdHkgYWxpYXMsIHNvIGRvIG5vdGhpbmdcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vIE5vIG5vbi1lbXB0eSBhbGlhc2VzLCBzbyBzZXQgcGFyYW1ldGVyIHRvIGVpdGhlciB0aGUgYXV0b3ZhdWxlLCBvclxyXG5cdFx0XHRcdFx0Ly8gYW4gZW1wdHkgc3RyaW5nICh3aXRob3V0IHRvdWNoaW5nLCB1bmxlc3MgaXQgaXMgYSByZXF1aXJlZCBwYXJhbWV0ZXIpXHJcblx0XHRcdFx0XHRzZWxmLnBhcmFtZXRlcnMucHVzaCh7XHJcblx0XHRcdFx0XHRcdG5hbWU6cGFyYU5hbWUsXHJcblx0XHRcdFx0XHRcdHZhbHVlOiBwYXJhRGF0YS5hdXRvdmFsdWUgfHwgXCJcIixcclxuXHRcdFx0XHRcdFx0YXV0b2ZpbGxlZDogdHJ1ZVxyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdFxyXG5cdFx0XHQvLyBNYWtlIHN1Z2dlc3Rpb25zIGZvciBjb21ib2JveFxyXG5cdFx0XHR2YXIgYWxsUGFyYW1zQXJyYXkgPSAoICFzZWxmLm5vdGVtcGxhdGVkYXRhICYmIHJlc3VsdC5wYWdlc1tpZF0ucGFyYW1PcmRlciApIHx8XHJcblx0XHRcdCQubWFwKHNlbGYucGFyYW1EYXRhLCBmdW5jdGlvbihfdmFsLCBrZXkpe1xyXG5cdFx0XHRcdHJldHVybiBrZXk7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRzZWxmLnBhcmFtZXRlclN1Z2dlc3Rpb25zID0gYWxsUGFyYW1zQXJyYXkuZmlsdGVyKGZ1bmN0aW9uKHBhcmFtTmFtZSkge1xyXG5cdFx0XHRcdHJldHVybiAoIHBhcmFtTmFtZSAmJiBwYXJhbU5hbWUgIT09IFwiY2xhc3NcIiAmJiBwYXJhbU5hbWUgIT09IFwiaW1wb3J0YW5jZVwiICk7XHJcblx0XHRcdH0pXHJcblx0XHRcdFx0Lm1hcChmdW5jdGlvbihwYXJhbU5hbWUpIHtcclxuXHRcdFx0XHRcdHZhciBvcHRpb25PYmplY3QgPSB7ZGF0YTogcGFyYW1OYW1lfTtcclxuXHRcdFx0XHRcdHZhciBsYWJlbCA9IHNlbGYuZ2V0RGF0YUZvclBhcmFtKGxhYmVsLCBwYXJhbU5hbWUpO1xyXG5cdFx0XHRcdFx0aWYgKCBsYWJlbCApIHtcclxuXHRcdFx0XHRcdFx0b3B0aW9uT2JqZWN0LmxhYmVsID0gbGFiZWwgKyBcIiAofFwiICsgcGFyYW1OYW1lICsgXCI9KVwiO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cmV0dXJuIG9wdGlvbk9iamVjdDtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFxyXG5cdFx0XHRpZiAoIHNlbGYudGVtcGxhdGVkYXRhQXBpRXJyb3IgKSB7XHJcblx0XHRcdFx0Ly8gRG9uJ3Qgc2F2ZSBkZWZhdWx0cy9ndWVzc2VzIHRvIGNhY2hlO1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHRcclxuXHRcdFx0Y2FjaGUud3JpdGUocHJlZml4ZWRUZXh0ICsgXCItcGFyYW1zXCIsIHtcclxuXHRcdFx0XHRub3RlbXBsYXRlZGF0YTogc2VsZi5ub3RlbXBsYXRlZGF0YSxcclxuXHRcdFx0XHRwYXJhbURhdGE6IHNlbGYucGFyYW1EYXRhLFxyXG5cdFx0XHRcdHBhcmFtZXRlclN1Z2dlc3Rpb25zOiBzZWxmLnBhcmFtZXRlclN1Z2dlc3Rpb25zLFxyXG5cdFx0XHRcdHBhcmFtQWxpYXNlczogc2VsZi5wYXJhbUFsaWFzZXNcclxuXHRcdFx0fSxcdDFcclxuXHRcdFx0KTtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9KVxyXG5cdFx0LnRoZW4oXHJcblx0XHRcdHBhcmFtRGF0YVNldC5yZXNvbHZlLFxyXG5cdFx0XHRwYXJhbURhdGFTZXQucmVqZWN0XHJcblx0XHQpO1xyXG5cdFxyXG5cdHJldHVybiBwYXJhbURhdGFTZXQ7XHRcclxufTtcclxuXHJcbmV4cG9ydCB7VGVtcGxhdGUsIHBhcnNlVGVtcGxhdGVzLCBnZXRXaXRoUmVkaXJlY3RUb307IiwiaW1wb3J0IFBhcmFtZXRlcldpZGdldCBmcm9tIFwiLi9QYXJhbWV0ZXJXaWRnZXRcIjtcclxuXHJcbi8qIFRhcmdldCBvdXRwdXQgKGZyb20gcmF0ZXIgdjEpOlxyXG4vLyBIVE1MXHJcbjxzcGFuIGNsYXNzPVwicmF0ZXItZGlhbG9nLXBhcmFJbnB1dCByYXRlci1kaWFsb2ctdGV4dElucHV0Q29udGFpbmVyXCI+XHJcblx0PGxhYmVsPjxzcGFuIGNsYXNzPVwicmF0ZXItZGlhbG9nLXBhcmEtY29kZVwiPmNhdGVnb3J5PC9zcGFuPjwvbGFiZWw+XHJcblx0PGlucHV0IHR5cGU9XCJ0ZXh0XCIvPjxhIHRpdGxlPVwicmVtb3ZlXCI+eDwvYT48d2JyLz5cclxuPC9zcGFuPlxyXG4vLyBDU1NcclxuLnJhdGVyLWRpYWxvZy1yb3cgPiBkaXYgPiBzcGFuIHtcclxuICAgIHBhZGRpbmctcmlnaHQ6IDAuNWVtO1xyXG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcclxufVxyXG4ucmF0ZXItZGlhbG9nLWF1dG9maWxsIHtcclxuICAgIGJvcmRlcjogMXB4IGRhc2hlZCAjY2QyMGZmO1xyXG4gICAgcGFkZGluZzogMC4yZW07XHJcbiAgICBtYXJnaW4tcmlnaHQ6IDAuMmVtO1xyXG59XHJcbnJhdGVyLWRpYWxvZy1hdXRvZmlsbDo6YWZ0ZXIge1xyXG4gICAgY29udGVudDogXCJhdXRvZmlsbGVkXCI7XHJcbiAgICBjb2xvcjogI2NkMjBmZjtcclxuICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xyXG4gICAgZm9udC1zaXplOiA5NiU7XHJcbn1cclxuKi9cclxuXHJcbmZ1bmN0aW9uIEJhbm5lcldpZGdldCggdGVtcGxhdGUsIGNvbmZpZyApIHtcclxuXHQvLyBDb25maWd1cmF0aW9uIGluaXRpYWxpemF0aW9uXHJcblx0Y29uZmlnID0gY29uZmlnIHx8IHt9O1xyXG5cdC8vIENhbGwgcGFyZW50IGNvbnN0cnVjdG9yXHJcblx0QmFubmVyV2lkZ2V0LnN1cGVyLmNhbGwoIHRoaXMsIGNvbmZpZyApO1xyXG5cdC8vIENyZWF0ZSBhIGxheW91dFxyXG5cdHRoaXMubGF5b3V0ID0gbmV3IE9PLnVpLkZpZWxkc2V0TGF5b3V0KCk7XHJcblx0XHJcblx0dGhpcy5tYWluTGFiZWwgPSBuZXcgT08udWkuTGFiZWxXaWRnZXQoe1xyXG5cdFx0bGFiZWw6IFwie3tcIiArIHRlbXBsYXRlLmdldFRpdGxlKCkuZ2V0TWFpblRleHQoKSArIFwifX1cIixcclxuXHRcdCRlbGVtZW50OiAkKFwiPHN0cm9uZyBzdHlsZT0nZGlzcGxheTppbmxpbmUtYmxvY2s7d2lkdGg6NDglO2ZvbnQtc2l6ZTogMTEwJTttYXJnaW4tcmlnaHQ6MDtwYWRkaW5nLXJpZ2h0OjhweCc+XCIpXHJcblx0fSk7XHJcblx0Ly8gUmF0aW5nIGRyb3Bkb3duc1xyXG5cdHRoaXMuY2xhc3NEcm9wZG93biA9IG5ldyBPTy51aS5Ecm9wZG93bldpZGdldCgge1xyXG5cdFx0bGFiZWw6IG5ldyBPTy51aS5IdG1sU25pcHBldChcIjxzcGFuIHN0eWxlPVxcXCJjb2xvcjojNzc3XFxcIj5DbGFzczwvc3Bhbj5cIiksXHJcblx0XHRtZW51OiB7IC8vIEZJWE1FOiBuZWVkcyByZWFsIGRhdGFcclxuXHRcdFx0aXRlbXM6IFtcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIiBcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJCXCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJCXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwiQ1wiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiQ1wiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcInN0YXJ0XCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJTdGFydFwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRdXHJcblx0XHR9LFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8c3BhbiBzdHlsZT0nZGlzcGxheTppbmxpbmUtYmxvY2s7d2lkdGg6MjQlJz5cIiksXHJcblx0XHQkb3ZlcmxheTogdGhpcy4kb3ZlcmxheSxcclxuXHR9ICk7XHJcblx0dGhpcy5pbXBvcnRhbmNlRHJvcGRvd24gPSBuZXcgT08udWkuRHJvcGRvd25XaWRnZXQoIHtcclxuXHRcdGxhYmVsOiBuZXcgT08udWkuSHRtbFNuaXBwZXQoXCI8c3BhbiBzdHlsZT1cXFwiY29sb3I6Izc3N1xcXCI+SW1wb3J0YW5jZTwvc3Bhbj5cIiksXHJcblx0XHRtZW51OiB7IC8vIEZJWE1FOiBuZWVkcyByZWFsIGRhdGFcclxuXHRcdFx0aXRlbXM6IFtcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIiBcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJ0b3BcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIlRvcFwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcImhpZ2hcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIkhpZ2hcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJtaWRcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIk1pZFwiXHJcblx0XHRcdFx0fSApXHJcblx0XHRcdF1cclxuXHRcdH0sXHJcblx0XHQkZWxlbWVudDogJChcIjxzcGFuIHN0eWxlPSdkaXNwbGF5OmlubGluZS1ibG9jazt3aWR0aDoyNCUnPlwiKSxcclxuXHRcdCRvdmVybGF5OiB0aGlzLiRvdmVybGF5LFxyXG5cdH0gKTtcclxuXHR0aGlzLnJhdGluZ3NEcm9wZG93bnMgPSBuZXcgT08udWkuSG9yaXpvbnRhbExheW91dCgge1xyXG5cdFx0aXRlbXM6IFtcclxuXHRcdFx0dGhpcy5tYWluTGFiZWwsXHJcblx0XHRcdHRoaXMuY2xhc3NEcm9wZG93bixcclxuXHRcdFx0dGhpcy5pbXBvcnRhbmNlRHJvcGRvd24sXHJcblx0XHRdXHJcblx0fSApO1xyXG5cdC8vdGhpcy5wYXJhbWV0ZXJzVG9nZ2xlID0gbmV3IE9PLnVpLlRvZ2dsZVN3aXRjaFdpZGdldCgpO1xyXG5cdC8vIFBhcmFtZXRlcnMgYXMgdGV4dCAoY29sbGFwc2VkKVxyXG5cdC8vIHRoaXMucGFyYW1ldGVyc1RleHQgPSBuZXcgT08udWkuTGFiZWxXaWRnZXQoe1xyXG5cdC8vIFx0bGFiZWw6IHRlbXBsYXRlLnBhcmFtZXRlcnMubWFwKHBhcmFtZXRlciA9PiBgfCR7cGFyYW1ldGVyLm5hbWV9PSR7cGFyYW1ldGVyLnZhbHVlfWApLmpvaW4oXCIgXCIpXHJcblx0Ly8gfSk7XHJcblx0Ly8gdGhpcy5wYXJhbWV0ZXJzRmllbGQgPSAgbmV3IE9PLnVpLkZpZWxkTGF5b3V0KCB0aGlzLnBhcmFtZXRlcnNUZXh0LCB7XHJcblx0Ly8gXHRsYWJlbDogXCJQYXJhbWV0ZXJzXCIsIFxyXG5cdC8vIFx0YWxpZ246IFwidG9wXCIgXHJcblx0Ly8gfSApO1xyXG5cdHRoaXMucGFyYW1ldGVyV2lkZ2V0cyA9IHRlbXBsYXRlLnBhcmFtZXRlcnMubWFwKHBhcmFtID0+IG5ldyBQYXJhbWV0ZXJXaWRnZXQocGFyYW0sIHRlbXBsYXRlLnBhcmFtRGF0YVtwYXJhbS5uYW1lXSkpO1xyXG5cdC8vIFBhcmFtZXRlcnMgYXMgbGFiZWwvaW5wdXQgcGFpcnMgKGV4cGFuZGVkKVxyXG5cdC8vVE9ETzogTmV3IHBhcmFtZXRlciBjb21ib2JveFxyXG5cdHRoaXMucGFyYW1ldGVyV2lkZ2V0c0xheW91dCA9IG5ldyBPTy51aS5Ib3Jpem9udGFsTGF5b3V0KCB7XHJcblx0XHRpdGVtczogdGhpcy5wYXJhbWV0ZXJXaWRnZXRzXHJcblx0fSApO1xyXG5cdC8vIEFkZCBldmVyeXRoaW5nIHRvIHRoZSBsYXlvdXRcclxuXHR0aGlzLmxheW91dC5hZGRJdGVtcyhbXHJcblx0XHR0aGlzLnJhdGluZ3NEcm9wZG93bnMsXHJcblx0XHR0aGlzLnBhcmFtZXRlcldpZGdldHNMYXlvdXRcclxuXHRdKTtcclxuXHRcclxuXHR0aGlzLiRlbGVtZW50LmFwcGVuZCh0aGlzLmxheW91dC4kZWxlbWVudCwgJChcIjxocj5cIikpO1xyXG59XHJcbk9PLmluaGVyaXRDbGFzcyggQmFubmVyV2lkZ2V0LCBPTy51aS5XaWRnZXQgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IEJhbm5lcldpZGdldDsiLCJmdW5jdGlvbiBQYXJhbWV0ZXJXaWRnZXQoIHBhcmFtZXRlciwgcGFyYW1EYXRhLCBjb25maWcgKSB7XHJcblx0Ly8gQ29uZmlndXJhdGlvbiBpbml0aWFsaXphdGlvblxyXG5cdGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcclxuXHQvLyBDYWxsIHBhcmVudCBjb25zdHJ1Y3RvclxyXG5cdFBhcmFtZXRlcldpZGdldC5zdXBlci5jYWxsKCB0aGlzLCBjb25maWcgKTtcclxuXHJcblx0dGhpcy5wYXJhbURhdGEgPSBwYXJhbURhdGEgfHwge307XHJcblxyXG5cdC8vIE1ha2UgdGhlIGlucHV0LiBUeXBlIGNhbiBiZSBjaGVja2JveCwgb3IgZHJvcGRvd24sIG9yIHRleHQgaW5wdXQsXHJcblx0Ly8gZGVwZW5kaW5nIG9uIG51bWJlciBvZiBhbGxvd2VkIHZhbHVlcyBpbiBwYXJhbSBkYXRhLlxyXG5cdHRoaXMuYWxsb3dlZFZhbHVlcyA9IHBhcmFtRGF0YSAmJiBwYXJhbURhdGEuYWxsb3dlZFZhbHVlcyB8fCBbXTtcclxuXHQvLyBzd2l0Y2ggKHRydWUpIHtcclxuXHQvLyBjYXNlIHRoaXMuYWxsb3dlZFZhbHVlcy5sZW5ndGggPT09IDA6XHJcblx0Ly8gY2FzZSBwYXJhbWV0ZXIudmFsdWUgJiYgIXRoaXMuYWxsb3dlZFZhbHVlcy5pbmNsdWRlcyhwYXJhbWV0ZXIudmFsdWUpOlxyXG5cdC8vIFx0Ly8gVGV4dCBpbnB1dFxyXG5cdC8vIFx0YnJlYWs7XHJcblx0Ly8gY2FzZSAxOlxyXG5cdC8vIFx0Ly8gQ2hlY2tib3ggKGxhYmVsbGVkIG9ubHkgd2hlbiBib3RoIGNoZWNrZWQpXHJcblx0Ly8gXHR0aGlzLmFsbG93ZWRWYWx1ZXMgPSBbbnVsbCwgLi4udGhpcy5hbGxvd2VkVmFsdWVzXTtcclxuXHQvLyBcdC8qIC4uLmZhbGxzIHRocm91Z2guLi4gKi9cclxuXHQvLyBjYXNlIDI6XHJcblx0Ly8gXHQvLyBDaGVja2JveCAobGFiZWxsZWQgd2hlbiBib3RoIGNoZWNrZWQgYW5kIG5vdCBjaGVja2VkKVxyXG5cdC8vIFx0dGhpcy5pbnB1dCA9IG5ldyBPTy51aS5DaGVja2JveE11bHRpb3B0aW9uV2lkZ2V0KCB7XHJcblx0Ly8gXHRcdGRhdGE6IHBhcmFtZXRlci52YWx1ZSxcclxuXHQvLyBcdFx0c2VsZWN0ZWQ6IHRoaXMuYWxsb3dlZFZhbHVlcy5pbmRleE9mKHBhcmFtZXRlci52YWx1ZSkgPT09IDEsXHJcblx0Ly8gXHRcdGxhYmVsOiAkKFwiPGNvZGU+XCIpLnRleHQocGFyYW1ldGVyLnZhbHVlIHx8IFwiXCIpXHJcblx0Ly8gXHR9ICk7XHJcblx0Ly8gXHRicmVhaztcclxuXHQvLyBkZWZhdWx0OlxyXG5cdC8vIFx0Ly8gRHJvcGRvd25cclxuXHQvLyBcdHRoaXMuaW5wdXQgPSBuZXcgT08udWkuRHJvcGRvd25XaWRnZXQoIHtcclxuXHQvLyBcdFx0bWVudToge1xyXG5cdC8vIFx0XHRcdGl0ZW1zOiB0aGlzLmFsbG93ZWRWYWx1ZXMubWFwKGFsbG93ZWRWYWwgPT4gbmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoe1xyXG5cdC8vIFx0XHRcdFx0ZGF0YTogYWxsb3dlZFZhbCxcclxuXHQvLyBcdFx0XHRcdGxhYmVsOiBhbGxvd2VkVmFsXHJcblx0Ly8gXHRcdFx0fSkgKVxyXG5cdC8vIFx0XHR9XHJcblx0Ly8gXHR9ICk7XHJcblx0Ly8gXHR0aGlzLmlucHV0LmdldE1lbnUoKS5zZWxlY3RJdGVtQnlEYXRhKHBhcmFtZXRlci52YWx1ZSk7XHJcblx0Ly8gXHRicmVhaztcclxuXHQvLyB9XHJcblx0Ly8gVE9ETzogVXNlIGFib3ZlIGxvZ2ljLCBvciBzb21ldGhpbmcgc2ltaWxhci4gRm9yIG5vdywganVzdCBjcmVhdGUgYSBDb21ib0JveFxyXG5cdHRoaXMuaW5wdXQgPSBuZXcgT08udWkuQ29tYm9Cb3hJbnB1dFdpZGdldCgge1xyXG5cdFx0dmFsdWU6IHBhcmFtZXRlci52YWx1ZSxcclxuXHRcdGxhYmVsOiBwYXJhbWV0ZXIubmFtZSArIFwiID1cIixcclxuXHRcdGxhYmVsUG9zaXRpb246IFwiYmVmb3JlXCIsXHJcblx0XHRvcHRpb25zOiB0aGlzLmFsbG93ZWRWYWx1ZXMubWFwKHZhbCA9PiB7cmV0dXJuIHtkYXRhOiB2YWwsIGxhYmVsOnZhbH07IH0pLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8ZGl2IHN0eWxlPSd3aWR0aDpjYWxjKDEwMCUgLSA0NXB4KTttYXJnaW4tcmlnaHQ6MDsnPlwiKSAvLyB0aGUgNDVweCBsZWF2ZXMgcm9vbSBmb3IgdGhlIGRlbGV0ZSBidXR0b25cclxuXHR9ICk7XHJcblx0Ly8gUmVkdWNlIHRoZSBleGNlc3NpdmUgd2hpdGVzcGFjZS9oZWlnaHRcclxuXHR0aGlzLmlucHV0LiRlbGVtZW50LmZpbmQoXCJpbnB1dFwiKS5jc3Moe1xyXG5cdFx0XCJwYWRkaW5nLXRvcFwiOiAwLFxyXG5cdFx0XCJwYWRkaW5nLWJvdHRvbVwiOiBcIjJweFwiLFxyXG5cdFx0XCJoZWlnaHRcIjogXCIyNHB4XCJcclxuXHR9KTtcclxuXHQvLyBGaXggbGFiZWwgcG9zaXRpb25pbmcgd2l0aGluIHRoZSByZWR1Y2VkIGhlaWdodFxyXG5cdHRoaXMuaW5wdXQuJGVsZW1lbnQuZmluZChcInNwYW4ub28tdWktbGFiZWxFbGVtZW50LWxhYmVsXCIpLmNzcyh7XCJsaW5lLWhlaWdodFwiOiBcIm5vcm1hbFwifSk7XHJcblx0Ly8gQWxzbyByZWR1Y2UgaGVpZ2h0IG9mIGRyb3Bkb3duIGJ1dHRvbiAoaWYgb3B0aW9ucyBhcmUgcHJlc2VudClcclxuXHR0aGlzLmlucHV0LiRlbGVtZW50LmZpbmQoXCJhLm9vLXVpLWJ1dHRvbkVsZW1lbnQtYnV0dG9uXCIpLmNzcyh7XHJcblx0XHRcInBhZGRpbmctdG9wXCI6IDAsXHJcblx0XHRcImhlaWdodFwiOiBcIjI0cHhcIixcclxuXHRcdFwibWluLWhlaWdodFwiOiBcIjBcIlxyXG5cdH0pO1xyXG5cclxuXHQvL3ZhciBkZXNjcmlwdGlvbiA9IHRoaXMucGFyYW1EYXRhW3BhcmFtZXRlci5uYW1lXSAmJiB0aGlzLnBhcmFtRGF0YVtwYXJhbWV0ZXIubmFtZV0ubGFiZWwgJiYgdGhpcy5wYXJhbURhdGFbcGFyYW1ldGVyLm5hbWVdLmxhYmVsLmVuO1xyXG5cdC8vIHZhciBwYXJhbU5hbWUgPSBuZXcgT08udWkuTGFiZWxXaWRnZXQoe1xyXG5cdC8vIFx0bGFiZWw6IFwifFwiICsgcGFyYW1ldGVyLm5hbWUgKyBcIj1cIixcclxuXHQvLyBcdCRlbGVtZW50OiAkKFwiPGNvZGU+XCIpXHJcblx0Ly8gfSk7XHJcblx0dGhpcy5kZWxldGVCdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KHtcclxuXHRcdGljb246IFwiY2xlYXJcIixcclxuXHRcdGZyYW1lZDogZmFsc2UsXHJcblx0XHRmbGFnczogXCJkZXN0cnVjdGl2ZVwiXHJcblx0fSk7XHJcblx0dGhpcy5kZWxldGVCdXR0b24uJGVsZW1lbnQuZmluZChcImEgc3BhblwiKS5maXJzdCgpLmNzcyh7XHJcblx0XHRcIm1pbi13aWR0aFwiOiBcInVuc2V0XCIsXHJcblx0XHRcIndpZHRoXCI6IFwiMTZweFwiXHJcblx0fSk7XHJcblx0dGhpcy5sYXlvdXQgPSBuZXcgT08udWkuSG9yaXpvbnRhbExheW91dCh7XHJcblx0XHRpdGVtczogW1xyXG5cdFx0XHR0aGlzLmlucHV0LFxyXG5cdFx0XHR0aGlzLmRlbGV0ZUJ1dHRvblxyXG5cdFx0XSxcclxuXHRcdCRlbGVtZW50OiAkKFwiPGRpdiBzdHlsZT0nd2lkdGg6IDMzJTttYXJnaW46MDsnPlwiKVxyXG5cdH0pO1xyXG5cdHRoaXMuJGVsZW1lbnQgPSB0aGlzLmxheW91dC4kZWxlbWVudDtcclxuXHR0aGlzLmlucHV0LnNldEludmlzaWJsZUxhYmVsKGZhbHNlKTtcclxufVxyXG5PTy5pbmhlcml0Q2xhc3MoIFBhcmFtZXRlcldpZGdldCwgT08udWkuV2lkZ2V0ICk7XHJcblBhcmFtZXRlcldpZGdldC5wcm90b3R5cGUuZm9jdXNJbnB1dCA9IGZ1bmN0aW9uKCkge1xyXG5cdHJldHVybiB0aGlzLmlucHV0LmZvY3VzKCk7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBQYXJhbWV0ZXJXaWRnZXQ7IiwiaW1wb3J0IHttYWtlRXJyb3JNc2d9IGZyb20gXCIuLi91dGlsXCI7XHJcblxyXG4vKiB2YXIgaW5jcmVtZW50UHJvZ3Jlc3NCeUludGVydmFsID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIGluY3JlbWVudEludGVydmFsRGVsYXkgPSAxMDA7XHJcblx0dmFyIGluY3JlbWVudEludGVydmFsQW1vdW50ID0gMC4xO1xyXG5cdHZhciBpbmNyZW1lbnRJbnRlcnZhbE1heHZhbCA9IDk4O1xyXG5cdHJldHVybiB3aW5kb3cuc2V0SW50ZXJ2YWwoXHJcblx0XHRpbmNyZW1lbnRQcm9ncmVzcyxcclxuXHRcdGluY3JlbWVudEludGVydmFsRGVsYXksXHJcblx0XHRpbmNyZW1lbnRJbnRlcnZhbEFtb3VudCxcclxuXHRcdGluY3JlbWVudEludGVydmFsTWF4dmFsXHJcblx0KTtcclxufTsgKi9cclxuXHJcbnZhciBMb2FkRGlhbG9nID0gZnVuY3Rpb24gTG9hZERpYWxvZyggY29uZmlnICkge1xyXG5cdExvYWREaWFsb2cuc3VwZXIuY2FsbCggdGhpcywgY29uZmlnICk7XHJcbn07XHJcbk9PLmluaGVyaXRDbGFzcyggTG9hZERpYWxvZywgT08udWkuRGlhbG9nICk7IFxyXG5cclxuTG9hZERpYWxvZy5zdGF0aWMubmFtZSA9IFwibG9hZERpYWxvZ1wiO1xyXG5Mb2FkRGlhbG9nLnN0YXRpYy50aXRsZSA9IFwiTG9hZGluZyBSYXRlci4uLlwiO1xyXG5cclxuLy8gQ3VzdG9taXplIHRoZSBpbml0aWFsaXplKCkgZnVuY3Rpb246IFRoaXMgaXMgd2hlcmUgdG8gYWRkIGNvbnRlbnQgdG8gdGhlIGRpYWxvZyBib2R5IGFuZCBzZXQgdXAgZXZlbnQgaGFuZGxlcnMuXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmluaXRpYWxpemUgPSBmdW5jdGlvbiAoKSB7XHJcblx0Ly8gQ2FsbCB0aGUgcGFyZW50IG1ldGhvZC5cclxuXHRMb2FkRGlhbG9nLnN1cGVyLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwoIHRoaXMgKTtcclxuXHQvLyBDcmVhdGUgYSBsYXlvdXRcclxuXHR0aGlzLmNvbnRlbnQgPSBuZXcgT08udWkuUGFuZWxMYXlvdXQoIHsgXHJcblx0XHRwYWRkZWQ6IHRydWUsXHJcblx0XHRleHBhbmRlZDogZmFsc2UgXHJcblx0fSApO1xyXG5cdC8vIENyZWF0ZSBjb250ZW50XHJcblx0dGhpcy5wcm9ncmVzc0JhciA9IG5ldyBPTy51aS5Qcm9ncmVzc0JhcldpZGdldCgge1xyXG5cdFx0cHJvZ3Jlc3M6IDFcclxuXHR9ICk7XHJcblx0dGhpcy5zZXR1cHRhc2tzID0gW1xyXG5cdFx0bmV3IE9PLnVpLkxhYmVsV2lkZ2V0KCB7XHJcblx0XHRcdGxhYmVsOiBcIkxvYWRpbmcgbGlzdCBvZiBwcm9qZWN0IGJhbm5lcnMuLi5cIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8cCBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KSxcclxuXHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJMb2FkaW5nIHRhbGtwYWdlIHdpa2l0ZXh0Li4uXCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHAgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSksXHJcblx0XHRuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiUGFyc2luZyB0YWxrcGFnZSB0ZW1wbGF0ZXMuLi5cIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8cCBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KSxcclxuXHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJHZXR0aW5nIHRlbXBsYXRlcycgcGFyYW1ldGVyIGRhdGEuLi5cIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8cCBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KSxcclxuXHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJDaGVja2luZyBpZiBwYWdlIHJlZGlyZWN0cy4uLlwiLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxwIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrXFxcIj5cIilcclxuXHRcdH0pLFxyXG5cdFx0bmV3IE9PLnVpLkxhYmVsV2lkZ2V0KCB7XHJcblx0XHRcdGxhYmVsOiBcIlJldHJpZXZpbmcgcXVhbGl0eSBwcmVkaWN0aW9uLi4uXCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHAgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSkudG9nZ2xlKCksXHJcblx0XTtcclxuXHR0aGlzLmNsb3NlQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCgge1xyXG5cdFx0bGFiZWw6IFwiQ2xvc2VcIlxyXG5cdH0pLnRvZ2dsZSgpO1xyXG5cdHRoaXMuc2V0dXBQcm9taXNlcyA9IFtdO1xyXG5cclxuXHQvLyBBcHBlbmQgY29udGVudCB0byBsYXlvdXRcclxuXHR0aGlzLmNvbnRlbnQuJGVsZW1lbnQuYXBwZW5kKFxyXG5cdFx0dGhpcy5wcm9ncmVzc0Jhci4kZWxlbWVudCxcclxuXHRcdChuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiSW5pdGlhbGlzaW5nOlwiLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxzdHJvbmcgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSkpLiRlbGVtZW50LFxyXG5cdFx0Li4udGhpcy5zZXR1cHRhc2tzLm1hcCh3aWRnZXQgPT4gd2lkZ2V0LiRlbGVtZW50KSxcclxuXHRcdHRoaXMuY2xvc2VCdXR0b24uJGVsZW1lbnRcclxuXHQpO1xyXG5cclxuXHQvLyBBcHBlbmQgbGF5b3V0IHRvIGRpYWxvZ1xyXG5cdHRoaXMuJGJvZHkuYXBwZW5kKCB0aGlzLmNvbnRlbnQuJGVsZW1lbnQgKTtcclxuXHJcblx0Ly8gQ29ubmVjdCBldmVudHMgdG8gaGFuZGxlcnNcclxuXHR0aGlzLmNsb3NlQnV0dG9uLmNvbm5lY3QoIHRoaXMsIHsgXCJjbGlja1wiOiBcIm9uQ2xvc2VCdXR0b25DbGlja1wiIH0gKTtcclxufTtcclxuXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLm9uQ2xvc2VCdXR0b25DbGljayA9IGZ1bmN0aW9uKCkge1xyXG5cdC8vIENsb3NlIHRoaXMgZGlhbG9nLCB3aXRob3V0IHBhc3NpbmcgYW55IGRhdGFcclxuXHR0aGlzLmNsb3NlKCk7XHJcbn07XHJcblxyXG4vLyBPdmVycmlkZSB0aGUgZ2V0Qm9keUhlaWdodCgpIG1ldGhvZCB0byBzcGVjaWZ5IGEgY3VzdG9tIGhlaWdodCAob3IgZG9uJ3QgdG8gdXNlIHRoZSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRlZCBoZWlnaHQpLlxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5nZXRCb2R5SGVpZ2h0ID0gZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiB0aGlzLmNvbnRlbnQuJGVsZW1lbnQub3V0ZXJIZWlnaHQoIHRydWUgKTtcclxufTtcclxuXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmluY3JlbWVudFByb2dyZXNzID0gZnVuY3Rpb24oYW1vdW50LCBtYXhpbXVtKSB7XHJcblx0dmFyIHByaW9yUHJvZ3Jlc3MgPSB0aGlzLnByb2dyZXNzQmFyLmdldFByb2dyZXNzKCk7XHJcblx0dmFyIGluY3JlbWVudGVkUHJvZ3Jlc3MgPSBNYXRoLm1pbihtYXhpbXVtIHx8IDEwMCwgcHJpb3JQcm9ncmVzcyArIGFtb3VudCk7XHJcblx0dGhpcy5wcm9ncmVzc0Jhci5zZXRQcm9ncmVzcyhpbmNyZW1lbnRlZFByb2dyZXNzKTtcclxufTtcclxuXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmFkZFRhc2tQcm9taXNlSGFuZGxlcnMgPSBmdW5jdGlvbih0YXNrUHJvbWlzZXMpIHtcclxuXHR2YXIgb25UYXNrRG9uZSA9IGluZGV4ID0+IHtcclxuXHRcdC8vIEFkZCBcIkRvbmUhXCIgdG8gbGFiZWxcclxuXHRcdHZhciB3aWRnZXQgPSB0aGlzLnNldHVwdGFza3NbaW5kZXhdO1xyXG5cdFx0d2lkZ2V0LnNldExhYmVsKHdpZGdldC5nZXRMYWJlbCgpICsgXCIgRG9uZSFcIik7XHJcblx0XHQvLyBJbmNyZW1lbnQgc3RhdHVzIGJhci4gU2hvdyBhIHNtb290aCB0cmFuc2l0aW9uIGJ5XHJcblx0XHQvLyB1c2luZyBzbWFsbCBzdGVwcyBvdmVyIGEgc2hvcnQgZHVyYXRpb24uXHJcblx0XHR2YXIgdG90YWxJbmNyZW1lbnQgPSAyMDsgLy8gcGVyY2VudFxyXG5cdFx0dmFyIHRvdGFsVGltZSA9IDQwMDsgLy8gbWlsbGlzZWNvbmRzXHJcblx0XHR2YXIgdG90YWxTdGVwcyA9IDEwO1xyXG5cdFx0dmFyIGluY3JlbWVudFBlclN0ZXAgPSB0b3RhbEluY3JlbWVudCAvIHRvdGFsU3RlcHM7XHJcblxyXG5cdFx0Zm9yICggdmFyIHN0ZXA9MDsgc3RlcCA8IHRvdGFsU3RlcHM7IHN0ZXArKykge1xyXG5cdFx0XHR3aW5kb3cuc2V0VGltZW91dChcclxuXHRcdFx0XHR0aGlzLmluY3JlbWVudFByb2dyZXNzLmJpbmQodGhpcyksXHJcblx0XHRcdFx0dG90YWxUaW1lICogc3RlcCAvIHRvdGFsU3RlcHMsXHJcblx0XHRcdFx0aW5jcmVtZW50UGVyU3RlcFxyXG5cdFx0XHQpO1xyXG5cdFx0fVxyXG5cdH07XHJcblx0dmFyIG9uVGFza0Vycm9yID0gKGluZGV4LCBjb2RlLCBpbmZvKSA9PiB7XHJcblx0XHR2YXIgd2lkZ2V0ID0gdGhpcy5zZXR1cHRhc2tzW2luZGV4XTtcclxuXHRcdHdpZGdldC5zZXRMYWJlbChcclxuXHRcdFx0d2lkZ2V0LmdldExhYmVsKCkgKyBcIiBGYWlsZWQuIFwiICsgbWFrZUVycm9yTXNnKGNvZGUsIGluZm8pXHJcblx0XHQpO1xyXG5cdFx0dGhpcy5jbG9zZUJ1dHRvbi50b2dnbGUodHJ1ZSk7XHJcblx0XHR0aGlzLnVwZGF0ZVNpemUoKTtcclxuXHR9O1xyXG5cdHRhc2tQcm9taXNlcy5mb3JFYWNoKGZ1bmN0aW9uKHByb21pc2UsIGluZGV4KSB7XHJcblx0XHRwcm9taXNlLnRoZW4oXHJcblx0XHRcdCgpID0+IG9uVGFza0RvbmUoaW5kZXgpLFxyXG5cdFx0XHQoY29kZSwgaW5mbykgPT4gb25UYXNrRXJyb3IoaW5kZXgsIGNvZGUsIGluZm8pXHJcblx0XHQpO1xyXG5cdH0pO1xyXG59O1xyXG5cclxuLy8gVXNlIGdldFNldHVwUHJvY2VzcygpIHRvIHNldCB1cCB0aGUgd2luZG93IHdpdGggZGF0YSBwYXNzZWQgdG8gaXQgYXQgdGhlIHRpbWUgXHJcbi8vIG9mIG9wZW5pbmdcclxuTG9hZERpYWxvZy5wcm90b3R5cGUuZ2V0U2V0dXBQcm9jZXNzID0gZnVuY3Rpb24gKCBkYXRhICkge1xyXG5cdGRhdGEgPSBkYXRhIHx8IHt9O1xyXG5cdHJldHVybiBMb2FkRGlhbG9nLnN1cGVyLnByb3RvdHlwZS5nZXRTZXR1cFByb2Nlc3MuY2FsbCggdGhpcywgZGF0YSApXHJcblx0XHQubmV4dCggKCkgPT4ge1xyXG5cdFx0XHR2YXIgc2hvd09yZXNUYXNrID0gISFkYXRhLm9yZXM7XHJcblx0XHRcdHRoaXMuc2V0dXB0YXNrc1s1XS50b2dnbGUoc2hvd09yZXNUYXNrKTtcclxuXHRcdFx0dmFyIHRhc2tQcm9taXNlcyA9IGRhdGEub3JlcyA/IGRhdGEucHJvbWlzZXMgOiBkYXRhLnByb21pc2VzLnNsaWNlKDAsIC0xKTtcclxuXHRcdFx0ZGF0YS5pc09wZW5lZC50aGVuKCgpID0+IHRoaXMuYWRkVGFza1Byb21pc2VIYW5kbGVycyh0YXNrUHJvbWlzZXMpKTtcclxuXHRcdH0sIHRoaXMgKTtcclxufTtcclxuXHJcbi8vIFByZXZlbnQgd2luZG93IGZyb20gY2xvc2luZyB0b28gcXVpY2tseSwgdXNpbmcgZ2V0SG9sZFByb2Nlc3MoKVxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5nZXRIb2xkUHJvY2VzcyA9IGZ1bmN0aW9uICggZGF0YSApIHtcclxuXHRkYXRhID0gZGF0YSB8fCB7fTtcclxuXHRpZiAoZGF0YS5zdWNjZXNzKSB7XHJcblx0XHQvLyBXYWl0IGEgYml0IGJlZm9yZSBwcm9jZXNzaW5nIHRoZSBjbG9zZSwgd2hpY2ggaGFwcGVucyBhdXRvbWF0aWNhbGx5XHJcblx0XHRyZXR1cm4gTG9hZERpYWxvZy5zdXBlci5wcm90b3R5cGUuZ2V0SG9sZFByb2Nlc3MuY2FsbCggdGhpcywgZGF0YSApXHJcblx0XHRcdC5uZXh0KDgwMCk7XHJcblx0fVxyXG5cdC8vIE5vIG5lZWQgdG8gd2FpdCBpZiBjbG9zZWQgbWFudWFsbHlcclxuXHRyZXR1cm4gTG9hZERpYWxvZy5zdXBlci5wcm90b3R5cGUuZ2V0SG9sZFByb2Nlc3MuY2FsbCggdGhpcywgZGF0YSApO1xyXG59O1xyXG5cclxuLy8gVXNlIHRoZSBnZXRUZWFyZG93blByb2Nlc3MoKSBtZXRob2QgdG8gcGVyZm9ybSBhY3Rpb25zIHdoZW5ldmVyIHRoZSBkaWFsb2cgaXMgY2xvc2VkLiBcclxuTG9hZERpYWxvZy5wcm90b3R5cGUuZ2V0VGVhcmRvd25Qcm9jZXNzID0gZnVuY3Rpb24gKCBkYXRhICkge1xyXG5cdHJldHVybiBMb2FkRGlhbG9nLnN1cGVyLnByb3RvdHlwZS5nZXRUZWFyZG93blByb2Nlc3MuY2FsbCggdGhpcywgZGF0YSApXHJcblx0XHQuZmlyc3QoICgpID0+IHtcclxuXHRcdC8vIFBlcmZvcm0gY2xlYW51cDogcmVzZXQgbGFiZWxzXHJcblx0XHRcdHRoaXMuc2V0dXB0YXNrcy5mb3JFYWNoKCBzZXR1cHRhc2sgPT4ge1xyXG5cdFx0XHRcdHZhciBjdXJyZW50TGFiZWwgPSBzZXR1cHRhc2suZ2V0TGFiZWwoKTtcclxuXHRcdFx0XHRzZXR1cHRhc2suc2V0TGFiZWwoXHJcblx0XHRcdFx0XHRjdXJyZW50TGFiZWwuc2xpY2UoMCwgY3VycmVudExhYmVsLmluZGV4T2YoXCIuLi5cIikrMylcclxuXHRcdFx0XHQpO1xyXG5cdFx0XHR9ICk7XHJcblx0XHR9LCB0aGlzICk7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBMb2FkRGlhbG9nOyIsImltcG9ydCBCYW5uZXJXaWRnZXQgZnJvbSBcIi4vQ29tcG9uZW50cy9CYW5uZXJXaWRnZXRcIjtcclxuXHJcbmZ1bmN0aW9uIE1haW5XaW5kb3coIGNvbmZpZyApIHtcclxuXHRNYWluV2luZG93LnN1cGVyLmNhbGwoIHRoaXMsIGNvbmZpZyApO1xyXG59XHJcbk9PLmluaGVyaXRDbGFzcyggTWFpbldpbmRvdywgT08udWkuUHJvY2Vzc0RpYWxvZyApO1xyXG5cclxuTWFpbldpbmRvdy5zdGF0aWMubmFtZSA9IFwibWFpblwiO1xyXG5NYWluV2luZG93LnN0YXRpYy50aXRsZSA9IFwiUmF0ZXJcIjtcclxuTWFpbldpbmRvdy5zdGF0aWMuc2l6ZSA9IFwibGFyZ2VcIjtcclxuTWFpbldpbmRvdy5zdGF0aWMuYWN0aW9ucyA9IFtcclxuXHQvLyBQcmltYXJ5ICh0b3AgcmlnaHQpOlxyXG5cdHtcclxuXHRcdGxhYmVsOiBcIlhcIiwgLy8gbm90IHVzaW5nIGFuIGljb24gc2luY2UgY29sb3IgYmVjb21lcyBpbnZlcnRlZCwgaS5lLiB3aGl0ZSBvbiBsaWdodC1ncmV5XHJcblx0XHR0aXRsZTogXCJDbG9zZSAoYW5kIGRpc2NhcmQgYW55IGNoYW5nZXMpXCIsXHJcblx0XHRmbGFnczogXCJwcmltYXJ5XCIsXHJcblx0fSxcclxuXHQvLyBTYWZlICh0b3AgbGVmdClcclxuXHR7XHJcblx0XHRhY3Rpb246IFwiaGVscFwiLFxyXG5cdFx0ZmxhZ3M6IFwic2FmZVwiLFxyXG5cdFx0bGFiZWw6IFwiP1wiLCAvLyBub3QgdXNpbmcgaWNvbiwgdG8gbWlycm9yIENsb3NlIGFjdGlvblxyXG5cdFx0dGl0bGU6IFwiaGVscFwiXHJcblx0fSxcclxuXHQvLyBPdGhlcnMgKGJvdHRvbSlcclxuXHR7XHJcblx0XHRhY3Rpb246IFwic2F2ZVwiLFxyXG5cdFx0bGFiZWw6IG5ldyBPTy51aS5IdG1sU25pcHBldChcIjxzcGFuIHN0eWxlPSdwYWRkaW5nOjAgMWVtOyc+U2F2ZTwvc3Bhbj5cIiksXHJcblx0XHRmbGFnczogW1wicHJpbWFyeVwiLCBcInByb2dyZXNzaXZlXCJdXHJcblx0fSxcclxuXHR7XHJcblx0XHRhY3Rpb246IFwicHJldmlld1wiLFxyXG5cdFx0bGFiZWw6IFwiU2hvdyBwcmV2aWV3XCJcclxuXHR9LFxyXG5cdHtcclxuXHRcdGFjdGlvbjogXCJjaGFuZ2VzXCIsXHJcblx0XHRsYWJlbDogXCJTaG93IGNoYW5nZXNcIlxyXG5cdH0sXHJcblx0e1xyXG5cdFx0YWN0aW9uOiBcImNhbmNlbFwiLFxyXG5cdFx0bGFiZWw6IFwiQ2FuY2VsXCJcclxuXHR9XHJcbl07XHJcblxyXG4vLyBDdXN0b21pemUgdGhlIGluaXRpYWxpemUoKSBmdW5jdGlvbjogVGhpcyBpcyB3aGVyZSB0byBhZGQgY29udGVudCB0byB0aGUgZGlhbG9nIGJvZHkgYW5kIHNldCB1cCBldmVudCBoYW5kbGVycy5cclxuTWFpbldpbmRvdy5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uICgpIHtcclxuXHQvLyBDYWxsIHRoZSBwYXJlbnQgbWV0aG9kLlxyXG5cdE1haW5XaW5kb3cuc3VwZXIucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCggdGhpcyApO1xyXG5cdC8vIENyZWF0ZSBsYXlvdXRzXHJcblx0dGhpcy50b3BCYXIgPSBuZXcgT08udWkuUGFuZWxMYXlvdXQoIHtcclxuXHRcdGV4cGFuZGVkOiBmYWxzZSxcclxuXHRcdGZyYW1lZDogZmFsc2UsXHJcblx0XHRwYWRkZWQ6IGZhbHNlXHJcblx0fSApO1xyXG5cdHRoaXMuY29udGVudCA9IG5ldyBPTy51aS5QYW5lbExheW91dCgge1xyXG5cdFx0ZXhwYW5kZWQ6IHRydWUsXHJcblx0XHRwYWRkZWQ6IHRydWUsXHJcblx0XHRzY3JvbGxhYmxlOiB0cnVlXHJcblx0fSApO1xyXG5cdHRoaXMub3V0ZXJMYXlvdXQgPSBuZXcgT08udWkuU3RhY2tMYXlvdXQoIHtcclxuXHRcdGl0ZW1zOiBbXHJcblx0XHRcdHRoaXMudG9wQmFyLFxyXG5cdFx0XHR0aGlzLmNvbnRlbnRcclxuXHRcdF0sXHJcblx0XHRjb250aW51b3VzOiB0cnVlLFxyXG5cdFx0ZXhwYW5kZWQ6IHRydWVcclxuXHR9ICk7XHJcblx0Ly8gQ3JlYXRlIHRvcEJhciBjb250ZW50XHJcblx0dGhpcy5zZWFyY2hCb3ggPSBuZXcgT08udWkuQ29tYm9Cb3hJbnB1dFdpZGdldCgge1xyXG5cdFx0cGxhY2Vob2xkZXI6IFwiQWRkIGEgV2lraVByb2plY3QuLi5cIixcclxuXHRcdG9wdGlvbnM6IFtcclxuXHRcdFx0eyAvLyBGSVhNRTogVGhlc2UgYXJlIHBsYWNlaG9sZGVycy5cclxuXHRcdFx0XHRkYXRhOiBcIk9wdGlvbiAxXCIsXHJcblx0XHRcdFx0bGFiZWw6IFwiT3B0aW9uIE9uZVwiXHJcblx0XHRcdH0sXHJcblx0XHRcdHtcclxuXHRcdFx0XHRkYXRhOiBcIk9wdGlvbiAyXCIsXHJcblx0XHRcdFx0bGFiZWw6IFwiT3B0aW9uIFR3b1wiXHJcblx0XHRcdH0sXHJcblx0XHRcdHtcclxuXHRcdFx0XHRkYXRhOiBcIk9wdGlvbiAzXCIsXHJcblx0XHRcdFx0bGFiZWw6IFwiT3B0aW9uIFRocmVlXCJcclxuXHRcdFx0fVxyXG5cdFx0XSxcclxuXHRcdCRlbGVtZW50OiAkKFwiPGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmUtYmxvY2s7d2lkdGg6MTAwJTttYXgtd2lkdGg6NDI1cHg7Jz5cIiksXHJcblx0XHQkb3ZlcmxheTogdGhpcy4kb3ZlcmxheSxcclxuXHR9ICk7XHJcblxyXG5cdHRoaXMuc2V0QWxsRHJvcERvd24gPSBuZXcgT08udWkuRHJvcGRvd25XaWRnZXQoIHtcclxuXHRcdGxhYmVsOiBuZXcgT08udWkuSHRtbFNuaXBwZXQoXCI8c3BhbiBzdHlsZT1cXFwiY29sb3I6Izc3N1xcXCI+U2V0IGFsbC4uLjwvc3Bhbj5cIiksXHJcblx0XHRtZW51OiB7IC8vIEZJWE1FOiBuZWVkcyByZWFsIGRhdGFcclxuXHRcdFx0aXRlbXM6IFtcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudVNlY3Rpb25PcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGxhYmVsOiBcIkNsYXNzZXNcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJCXCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJCXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwiQ1wiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiQ1wiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcInN0YXJ0XCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJTdGFydFwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51U2VjdGlvbk9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0bGFiZWw6IFwiSW1wb3J0YW5jZXNcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJ0b3BcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIlRvcFwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcImhpZ2hcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIkhpZ2hcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJtaWRcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIk1pZFwiXHJcblx0XHRcdFx0fSApXHJcblx0XHRcdF1cclxuXHRcdH0sXHJcblx0XHQkZWxlbWVudDogJChcIjxzcGFuIHN0eWxlPVxcXCJkaXNwbGF5OmlubGluZS1ibG9jazt3aWR0aDphdXRvXFxcIj5cIiksXHJcblx0XHQkb3ZlcmxheTogdGhpcy4kb3ZlcmxheSxcclxuXHR9ICk7XHJcblxyXG5cdHRoaXMucmVtb3ZlQWxsQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCgge1xyXG5cdFx0aWNvbjogXCJ0cmFzaFwiLFxyXG5cdFx0dGl0bGU6IFwiUmVtb3ZlIGFsbFwiLFxyXG5cdFx0ZmxhZ3M6IFwiZGVzdHJ1Y3RpdmVcIlxyXG5cdH0gKTtcclxuXHR0aGlzLmNsZWFyQWxsQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCgge1xyXG5cdFx0aWNvbjogXCJjYW5jZWxcIixcclxuXHRcdHRpdGxlOiBcIkNsZWFyIGFsbFwiLFxyXG5cdFx0ZmxhZ3M6IFwiZGVzdHJ1Y3RpdmVcIlxyXG5cdH0gKTtcclxuXHR0aGlzLmJ5cGFzc0FsbEJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoIHtcclxuXHRcdGljb246IFwiYXJ0aWNsZVJlZGlyZWN0XCIsXHJcblx0XHR0aXRsZTogXCJCeXBhc3MgYWxsIHJlZGlyZWN0c1wiXHJcblx0fSApO1xyXG5cdHRoaXMuZG9BbGxCdXR0b25zID0gbmV3IE9PLnVpLkJ1dHRvbkdyb3VwV2lkZ2V0KCB7XHJcblx0XHRpdGVtczogW1xyXG5cdFx0XHR0aGlzLnJlbW92ZUFsbEJ1dHRvbixcclxuXHRcdFx0dGhpcy5jbGVhckFsbEJ1dHRvbixcclxuXHRcdFx0dGhpcy5ieXBhc3NBbGxCdXR0b25cclxuXHRcdF0sXHJcblx0XHQkZWxlbWVudDogJChcIjxzcGFuIHN0eWxlPSdmbG9hdDpyaWdodDsnPlwiKSxcclxuXHR9ICk7XHJcblxyXG5cdHRoaXMudG9wQmFyLiRlbGVtZW50LmFwcGVuZChcclxuXHRcdHRoaXMuc2VhcmNoQm94LiRlbGVtZW50LFxyXG5cdFx0dGhpcy5zZXRBbGxEcm9wRG93bi4kZWxlbWVudCxcclxuXHRcdHRoaXMuZG9BbGxCdXR0b25zLiRlbGVtZW50XHJcblx0KS5jc3MoXCJiYWNrZ3JvdW5kXCIsXCIjY2NjXCIpO1xyXG5cclxuXHQvLyBGSVhNRTogdGhpcyBpcyBwbGFjZWhvbGRlciBjb250ZW50XHJcblx0Ly8gdGhpcy5jb250ZW50LiRlbGVtZW50LmFwcGVuZCggXCI8c3Bhbj4oTm8gcHJvamVjdCBiYW5uZXJzIHlldCk8L3NwYW4+XCIgKTtcclxuXHJcblx0dGhpcy4kYm9keS5hcHBlbmQoIHRoaXMub3V0ZXJMYXlvdXQuJGVsZW1lbnQgKTtcclxufTtcclxuXHJcbi8vIE92ZXJyaWRlIHRoZSBnZXRCb2R5SGVpZ2h0KCkgbWV0aG9kIHRvIHNwZWNpZnkgYSBjdXN0b20gaGVpZ2h0XHJcbk1haW5XaW5kb3cucHJvdG90eXBlLmdldEJvZHlIZWlnaHQgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHRoaXMudG9wQmFyLiRlbGVtZW50Lm91dGVySGVpZ2h0KCB0cnVlICkgKyB0aGlzLmNvbnRlbnQuJGVsZW1lbnQub3V0ZXJIZWlnaHQoIHRydWUgKTtcclxufTtcclxuXHJcbi8vIFVzZSBnZXRTZXR1cFByb2Nlc3MoKSB0byBzZXQgdXAgdGhlIHdpbmRvdyB3aXRoIGRhdGEgcGFzc2VkIHRvIGl0IGF0IHRoZSB0aW1lIFxyXG4vLyBvZiBvcGVuaW5nXHJcbk1haW5XaW5kb3cucHJvdG90eXBlLmdldFNldHVwUHJvY2VzcyA9IGZ1bmN0aW9uICggZGF0YSApIHtcclxuXHRkYXRhID0gZGF0YSB8fCB7fTtcclxuXHRyZXR1cm4gTWFpbldpbmRvdy5zdXBlci5wcm90b3R5cGUuZ2V0U2V0dXBQcm9jZXNzLmNhbGwoIHRoaXMsIGRhdGEgKVxyXG5cdFx0Lm5leHQoICgpID0+IHtcclxuXHRcdFx0Ly8gVE9ETzogU2V0IHVwIHdpbmRvdyBiYXNlZCBvbiBkYXRhXHJcblx0XHRcdHRoaXMuYmFubmVycyA9IGRhdGEuYmFubmVycy5tYXAoYmFubmVyVGVtcGxhdGUgPT4gbmV3IEJhbm5lcldpZGdldChiYW5uZXJUZW1wbGF0ZSkpO1xyXG5cdFx0XHRmb3IgKGNvbnN0IGJhbm5lciBvZiB0aGlzLmJhbm5lcnMpIHtcclxuXHRcdFx0XHR0aGlzLmNvbnRlbnQuJGVsZW1lbnQuYXBwZW5kKGJhbm5lci4kZWxlbWVudCk7XHJcblx0XHRcdH1cclxuXHRcdFx0dGhpcy50YWxrV2lraXRleHQgPSBkYXRhLnRhbGtXaWtpdGV4dDtcclxuXHRcdFx0dGhpcy50YWxrcGFnZSA9IGRhdGEudGFsa3BhZ2U7XHJcblx0XHRcdHRoaXMudXBkYXRlU2l6ZSgpO1xyXG5cdFx0fSwgdGhpcyApO1xyXG59O1xyXG5cclxuLy8gU2V0IHVwIHRoZSB3aW5kb3cgaXQgaXMgcmVhZHk6IGF0dGFjaGVkIHRvIHRoZSBET00sIGFuZCBvcGVuaW5nIGFuaW1hdGlvbiBjb21wbGV0ZWRcclxuTWFpbldpbmRvdy5wcm90b3R5cGUuZ2V0UmVhZHlQcm9jZXNzID0gZnVuY3Rpb24gKCBkYXRhICkge1xyXG5cdGRhdGEgPSBkYXRhIHx8IHt9O1xyXG5cdHJldHVybiBNYWluV2luZG93LnN1cGVyLnByb3RvdHlwZS5nZXRSZWFkeVByb2Nlc3MuY2FsbCggdGhpcywgZGF0YSApXHJcblx0XHQubmV4dCggKCkgPT4geyAvLyBmb3JjZSBsYWJlbHMgdG8gc2hvdyBieSBkZWZhdWx0XHJcblx0XHRcdHRoaXMuYmFubmVycy5mb3JFYWNoKGJhbm5lciA9PiB7XHJcblx0XHRcdFx0YmFubmVyLnBhcmFtZXRlcldpZGdldHMuZm9yRWFjaChwYXJhbSA9PiBwYXJhbS5mb2N1c0lucHV0KCkpOyBcclxuXHRcdFx0fSk7XHJcblx0XHR9LCB0aGlzKVxyXG5cdFx0Lm5leHQoICgpID0+IHRoaXMuc2VhcmNoQm94LmZvY3VzKCkpOyAvLyBzZWFyY2ggYm94IGlzIHdoZXJlIHdlIHJlYWxseSBhbnQgZm9jdXMgdG8gYmVcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IE1haW5XaW5kb3c7IiwiaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuaW1wb3J0IHtBUEksIG1ha2VFcnJvck1zZ30gZnJvbSBcIi4vdXRpbFwiO1xyXG5pbXBvcnQgc2V0dXBSYXRlciBmcm9tIFwiLi9zZXR1cFwiO1xyXG5cclxudmFyIGF1dG9TdGFydCA9IGZ1bmN0aW9uIGF1dG9TdGFydCgpIHtcclxuXHRpZiAoIHdpbmRvdy5yYXRlcl9hdXRvc3RhcnROYW1lc3BhY2VzID09IG51bGwgfHwgY29uZmlnLm13LndnSXNNYWluUGFnZSApIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0fVxyXG5cdFxyXG5cdHZhciBhdXRvc3RhcnROYW1lc3BhY2VzID0gKCAkLmlzQXJyYXkod2luZG93LnJhdGVyX2F1dG9zdGFydE5hbWVzcGFjZXMpICkgPyB3aW5kb3cucmF0ZXJfYXV0b3N0YXJ0TmFtZXNwYWNlcyA6IFt3aW5kb3cucmF0ZXJfYXV0b3N0YXJ0TmFtZXNwYWNlc107XHJcblx0XHJcblx0aWYgKCAtMSA9PT0gYXV0b3N0YXJ0TmFtZXNwYWNlcy5pbmRleE9mKGNvbmZpZy5tdy53Z05hbWVzcGFjZU51bWJlcikgKSB7XHJcblx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgpO1xyXG5cdH1cclxuXHRcclxuXHRpZiAoIC8oPzpcXD98JikoPzphY3Rpb258ZGlmZnxvbGRpZCk9Ly50ZXN0KHdpbmRvdy5sb2NhdGlvbi5ocmVmKSApIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0fVxyXG5cdFxyXG5cdC8vIENoZWNrIGlmIHRhbGsgcGFnZSBleGlzdHNcclxuXHRpZiAoICQoXCIjY2EtdGFsay5uZXdcIikubGVuZ3RoICkge1xyXG5cdFx0cmV0dXJuIHNldHVwUmF0ZXIoKTtcclxuXHR9XHJcblx0XHJcblx0dmFyIHRoaXNQYWdlID0gbXcuVGl0bGUubmV3RnJvbVRleHQoY29uZmlnLm13LndnUGFnZU5hbWUpO1xyXG5cdHZhciB0YWxrUGFnZSA9IHRoaXNQYWdlICYmIHRoaXNQYWdlLmdldFRhbGtQYWdlKCk7XHJcblx0aWYgKCF0YWxrUGFnZSkge1xyXG5cdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHR9XHJcblxyXG5cdC8qIENoZWNrIHRlbXBsYXRlcyBwcmVzZW50IG9uIHRhbGsgcGFnZS4gRmV0Y2hlcyBpbmRpcmVjdGx5IHRyYW5zY2x1ZGVkIHRlbXBsYXRlcywgc28gd2lsbCBmaW5kXHJcblx0XHRUZW1wbGF0ZTpXUEJhbm5lck1ldGEgKGFuZCBpdHMgc3VidGVtcGxhdGVzKS4gQnV0IHNvbWUgYmFubmVycyBzdWNoIGFzIE1JTEhJU1QgZG9uJ3QgdXNlIHRoYXRcclxuXHRcdG1ldGEgdGVtcGxhdGUsIHNvIHdlIGFsc28gaGF2ZSB0byBjaGVjayBmb3IgdGVtcGxhdGUgdGl0bGVzIGNvbnRhaW5nICdXaWtpUHJvamVjdCdcclxuXHQqL1xyXG5cdHJldHVybiBBUEkuZ2V0KHtcclxuXHRcdGFjdGlvbjogXCJxdWVyeVwiLFxyXG5cdFx0Zm9ybWF0OiBcImpzb25cIixcclxuXHRcdHByb3A6IFwidGVtcGxhdGVzXCIsXHJcblx0XHR0aXRsZXM6IHRhbGtQYWdlLmdldFByZWZpeGVkVGV4dCgpLFxyXG5cdFx0dGxuYW1lc3BhY2U6IFwiMTBcIixcclxuXHRcdHRsbGltaXQ6IFwiNTAwXCIsXHJcblx0XHRpbmRleHBhZ2VpZHM6IDFcclxuXHR9KVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XHJcblx0XHRcdHZhciBpZCA9IHJlc3VsdC5xdWVyeS5wYWdlaWRzO1xyXG5cdFx0XHR2YXIgdGVtcGxhdGVzID0gcmVzdWx0LnF1ZXJ5LnBhZ2VzW2lkXS50ZW1wbGF0ZXM7XHJcblx0XHRcclxuXHRcdFx0aWYgKCAhdGVtcGxhdGVzICkge1xyXG5cdFx0XHRcdHJldHVybiBzZXR1cFJhdGVyKCk7XHJcblx0XHRcdH1cclxuXHRcdFxyXG5cdFx0XHR2YXIgaGFzV2lraXByb2plY3QgPSB0ZW1wbGF0ZXMuc29tZSh0ZW1wbGF0ZSA9PiAvKFdpa2lQcm9qZWN0fFdQQmFubmVyKS8udGVzdCh0ZW1wbGF0ZS50aXRsZSkpO1xyXG5cdFx0XHJcblx0XHRcdGlmICggIWhhc1dpa2lwcm9qZWN0ICkge1xyXG5cdFx0XHRcdHJldHVybiBzZXR1cFJhdGVyKCk7XHJcblx0XHRcdH1cclxuXHRcdFxyXG5cdFx0fSxcclxuXHRcdGZ1bmN0aW9uKGNvZGUsIGpxeGhyKSB7XHJcblx0XHQvLyBTaWxlbnRseSBpZ25vcmUgZmFpbHVyZXMgKGp1c3QgbG9nIHRvIGNvbnNvbGUpXHJcblx0XHRcdGNvbnNvbGUud2FybihcclxuXHRcdFx0XHRcIltSYXRlcl0gRXJyb3Igd2hpbGUgY2hlY2tpbmcgd2hldGhlciB0byBhdXRvc3RhcnQuXCIgK1xyXG5cdFx0XHQoIGNvZGUgPT0gbnVsbCApID8gXCJcIiA6IFwiIFwiICsgbWFrZUVycm9yTXNnKGNvZGUsIGpxeGhyKVxyXG5cdFx0XHQpO1xyXG5cdFx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgpO1xyXG5cdFx0fSk7XHJcblxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXV0b1N0YXJ0OyIsImltcG9ydCB7aXNBZnRlckRhdGV9IGZyb20gXCIuL3V0aWxcIjtcclxuXHJcbi8qKiB3cml0ZVxyXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XHJcbiAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fSB2YWxcclxuICogQHBhcmFtIHtOdW1iZXJ9IHN0YWxlRGF5cyBOdW1iZXIgb2YgZGF5cyBhZnRlciB3aGljaCB0aGUgZGF0YSBiZWNvbWVzIHN0YWxlICh1c2FibGUsIGJ1dCBzaG91bGRcclxuICogIGJlIHVwZGF0ZWQgZm9yIG5leHQgdGltZSkuXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBleHBpcnlEYXlzIE51bWJlciBvZiBkYXlzIGFmdGVyIHdoaWNoIHRoZSBjYWNoZWQgZGF0YSBtYXkgYmUgZGVsZXRlZC5cclxuICovXHJcbnZhciB3cml0ZSA9IGZ1bmN0aW9uKGtleSwgdmFsLCBzdGFsZURheXMsIGV4cGlyeURheXMpIHtcclxuXHR0cnkge1xyXG5cdFx0dmFyIGRlZmF1bHRTdGFsZURheXMgPSAxO1xyXG5cdFx0dmFyIGRlZmF1bHRFeHBpcnlEYXlzID0gMzA7XHJcblx0XHR2YXIgbWlsbGlzZWNvbmRzUGVyRGF5ID0gMjQqNjAqNjAqMTAwMDtcclxuXHJcblx0XHR2YXIgc3RhbGVEdXJhdGlvbiA9IChzdGFsZURheXMgfHwgZGVmYXVsdFN0YWxlRGF5cykqbWlsbGlzZWNvbmRzUGVyRGF5O1xyXG5cdFx0dmFyIGV4cGlyeUR1cmF0aW9uID0gKGV4cGlyeURheXMgfHwgZGVmYXVsdEV4cGlyeURheXMpKm1pbGxpc2Vjb25kc1BlckRheTtcclxuXHRcdFxyXG5cdFx0dmFyIHN0cmluZ1ZhbCA9IEpTT04uc3RyaW5naWZ5KHtcclxuXHRcdFx0dmFsdWU6IHZhbCxcclxuXHRcdFx0c3RhbGVEYXRlOiBuZXcgRGF0ZShEYXRlLm5vdygpICsgc3RhbGVEdXJhdGlvbikudG9JU09TdHJpbmcoKSxcclxuXHRcdFx0ZXhwaXJ5RGF0ZTogbmV3IERhdGUoRGF0ZS5ub3coKSArIGV4cGlyeUR1cmF0aW9uKS50b0lTT1N0cmluZygpXHJcblx0XHR9KTtcclxuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiUmF0ZXItXCIra2V5LCBzdHJpbmdWYWwpO1xyXG5cdH0gIGNhdGNoKGUpIHt9IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZW1wdHlcclxufTtcclxuLyoqIHJlYWRcclxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxyXG4gKiBAcmV0dXJucyB7QXJyYXl8T2JqZWN0fFN0cmluZ3xOdWxsfSBDYWNoZWQgYXJyYXkgb3Igb2JqZWN0LCBvciBlbXB0eSBzdHJpbmcgaWYgbm90IHlldCBjYWNoZWQsXHJcbiAqICAgICAgICAgIG9yIG51bGwgaWYgdGhlcmUgd2FzIGVycm9yLlxyXG4gKi9cclxudmFyIHJlYWQgPSBmdW5jdGlvbihrZXkpIHtcclxuXHR2YXIgdmFsO1xyXG5cdHRyeSB7XHJcblx0XHR2YXIgc3RyaW5nVmFsID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJSYXRlci1cIitrZXkpO1xyXG5cdFx0aWYgKCBzdHJpbmdWYWwgIT09IFwiXCIgKSB7XHJcblx0XHRcdHZhbCA9IEpTT04ucGFyc2Uoc3RyaW5nVmFsKTtcclxuXHRcdH1cclxuXHR9ICBjYXRjaChlKSB7XHJcblx0XHRjb25zb2xlLmxvZyhcIltSYXRlcl0gZXJyb3IgcmVhZGluZyBcIiArIGtleSArIFwiIGZyb20gbG9jYWxTdG9yYWdlIGNhY2hlOlwiKTtcclxuXHRcdGNvbnNvbGUubG9nKFxyXG5cdFx0XHRcIlxcdFwiICsgZS5uYW1lICsgXCIgbWVzc2FnZTogXCIgKyBlLm1lc3NhZ2UgK1xyXG5cdFx0XHQoIGUuYXQgPyBcIiBhdDogXCIgKyBlLmF0IDogXCJcIikgK1xyXG5cdFx0XHQoIGUudGV4dCA/IFwiIHRleHQ6IFwiICsgZS50ZXh0IDogXCJcIilcclxuXHRcdCk7XHJcblx0fVxyXG5cdHJldHVybiB2YWwgfHwgbnVsbDtcclxufTtcclxudmFyIGNsZWFySXRlbUlmSW52YWxpZCA9IGZ1bmN0aW9uKGtleSkge1xyXG5cdHZhciBpc1JhdGVyS2V5ID0ga2V5LmluZGV4T2YoXCJSYXRlci1cIikgPT09IDA7XHJcblx0aWYgKCAhaXNSYXRlcktleSApIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0dmFyIGl0ZW0gPSByZWFkKGtleS5yZXBsYWNlKFwiUmF0ZXItXCIsXCJcIikpO1xyXG5cdHZhciBpc0ludmFsaWQgPSAhaXRlbSB8fCAhaXRlbS5leHBpcnlEYXRlIHx8IGlzQWZ0ZXJEYXRlKGl0ZW0uZXhwaXJ5RGF0ZSk7XHJcblx0aWYgKCBpc0ludmFsaWQgKSB7XHJcblx0XHRsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xyXG5cdH1cclxufTtcclxudmFyIGNsZWFySW52YWxpZEl0ZW1zID0gZnVuY3Rpb24oKSB7XHJcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsb2NhbFN0b3JhZ2UubGVuZ3RoOyBpKyspIHtcclxuXHRcdHNldFRpbWVvdXQoY2xlYXJJdGVtSWZJbnZhbGlkLCAxMDAsIGxvY2FsU3RvcmFnZS5rZXkoaSkpO1xyXG5cdH1cclxufTtcclxuXHJcbmV4cG9ydCB7IHdyaXRlLCByZWFkLCBjbGVhckl0ZW1JZkludmFsaWQsIGNsZWFySW52YWxpZEl0ZW1zIH07IiwiLy8gQSBnbG9iYWwgb2JqZWN0IHRoYXQgc3RvcmVzIGFsbCB0aGUgcGFnZSBhbmQgdXNlciBjb25maWd1cmF0aW9uIGFuZCBzZXR0aW5nc1xyXG52YXIgY29uZmlnID0ge307XHJcbi8vIFNjcmlwdCBpbmZvXHJcbmNvbmZpZy5zY3JpcHQgPSB7XHJcblx0Ly8gQWR2ZXJ0IHRvIGFwcGVuZCB0byBlZGl0IHN1bW1hcmllc1xyXG5cdGFkdmVydDogIFwiIChbW1VzZXI6RXZhZDM3L3JhdGVyLmpzfFJhdGVyXV0pXCIsXHJcblx0dmVyc2lvbjogXCIyLjAuMFwiXHJcbn07XHJcbi8vIFByZWZlcmVuY2VzOiBnbG9iYWxzIHZhcnMgYWRkZWQgdG8gdXNlcnMnIGNvbW1vbi5qcywgb3Igc2V0IHRvIGRlZmF1bHRzIGlmIHVuZGVmaW5lZFxyXG5jb25maWcucHJlZnMgPSB7XHJcblx0d2F0Y2hsaXN0OiB3aW5kb3cucmF0ZXJfd2F0Y2hsaXN0IHx8IFwicHJlZmVyZW5jZXNcIlxyXG59O1xyXG4vLyBNZWRpYVdpa2kgY29uZmlndXJhdGlvbiB2YWx1ZXNcclxuY29uZmlnLm13ID0gbXcuY29uZmlnLmdldCggW1xyXG5cdFwic2tpblwiLFxyXG5cdFwid2dQYWdlTmFtZVwiLFxyXG5cdFwid2dOYW1lc3BhY2VOdW1iZXJcIixcclxuXHRcIndnVXNlck5hbWVcIixcclxuXHRcIndnRm9ybWF0dGVkTmFtZXNwYWNlc1wiLFxyXG5cdFwid2dNb250aE5hbWVzXCIsXHJcblx0XCJ3Z1JldmlzaW9uSWRcIixcclxuXHRcIndnU2NyaXB0UGF0aFwiLFxyXG5cdFwid2dTZXJ2ZXJcIixcclxuXHRcIndnQ2F0ZWdvcmllc1wiLFxyXG5cdFwid2dJc01haW5QYWdlXCJcclxuXSApO1xyXG5cclxuY29uZmlnLnJlZ2V4ID0geyAvKiBlc2xpbnQtZGlzYWJsZSBuby11c2VsZXNzLWVzY2FwZSAqL1xyXG5cdC8vIFBhdHRlcm4gdG8gZmluZCB0ZW1wbGF0ZXMsIHdoaWNoIG1heSBjb250YWluIG90aGVyIHRlbXBsYXRlc1xyXG5cdHRlbXBsYXRlOlx0XHQvXFx7XFx7XFxzKihbXiNcXHtcXHNdLis/KVxccyooXFx8KD86LnxcXG4pKj8oPzooPzpcXHtcXHsoPzoufFxcbikqPyg/Oig/Olxce1xceyg/Oi58XFxuKSo/XFx9XFx9KSg/Oi58XFxuKSo/KSo/XFx9XFx9KSg/Oi58XFxuKSo/KSp8KVxcfVxcfVxcbj8vZyxcclxuXHQvLyBQYXR0ZXJuIHRvIGZpbmQgYHxwYXJhbT12YWx1ZWAgb3IgYHx2YWx1ZWAsIHdoZXJlIGB2YWx1ZWAgY2FuIG9ubHkgY29udGFpbiBhIHBpcGVcclxuXHQvLyBpZiB3aXRoaW4gc3F1YXJlIGJyYWNrZXRzIChpLmUuIHdpa2lsaW5rcykgb3IgYnJhY2VzIChpLmUuIHRlbXBsYXRlcylcclxuXHR0ZW1wbGF0ZVBhcmFtczpcdC9cXHwoPyEoPzpbXntdK318W15cXFtdK10pKSg/Oi58XFxzKSo/KD89KD86XFx8fCQpKD8hKD86W157XSt9fFteXFxbXStdKSkpL2dcclxufTsgLyogZXNsaW50LWVuYWJsZSBuby11c2VsZXNzLWVzY2FwZSAqL1xyXG5jb25maWcuZGVmZXJyZWQgPSB7fTtcclxuY29uZmlnLmJhbm5lckRlZmF1bHRzID0ge1xyXG5cdGNsYXNzZXM6IFtcclxuXHRcdFwiRkFcIixcclxuXHRcdFwiRkxcIixcclxuXHRcdFwiQVwiLFxyXG5cdFx0XCJHQVwiLFxyXG5cdFx0XCJCXCIsXHJcblx0XHRcIkNcIixcclxuXHRcdFwiU3RhcnRcIixcclxuXHRcdFwiU3R1YlwiLFxyXG5cdFx0XCJMaXN0XCJcclxuXHRdLFxyXG5cdGltcG9ydGFuY2VzOiBbXHJcblx0XHRcIlRvcFwiLFxyXG5cdFx0XCJIaWdoXCIsXHJcblx0XHRcIk1pZFwiLFxyXG5cdFx0XCJMb3dcIlxyXG5cdF0sXHJcblx0ZXh0ZW5kZWRDbGFzc2VzOiBbXHJcblx0XHRcIkNhdGVnb3J5XCIsXHJcblx0XHRcIkRyYWZ0XCIsXHJcblx0XHRcIkZpbGVcIixcclxuXHRcdFwiUG9ydGFsXCIsXHJcblx0XHRcIlByb2plY3RcIixcclxuXHRcdFwiVGVtcGxhdGVcIixcclxuXHRcdFwiQnBsdXNcIixcclxuXHRcdFwiRnV0dXJlXCIsXHJcblx0XHRcIkN1cnJlbnRcIixcclxuXHRcdFwiRGlzYW1iaWdcIixcclxuXHRcdFwiTkFcIixcclxuXHRcdFwiUmVkaXJlY3RcIixcclxuXHRcdFwiQm9va1wiXHJcblx0XSxcclxuXHRleHRlbmRlZEltcG9ydGFuY2VzOiBbXHJcblx0XHRcIlRvcFwiLFxyXG5cdFx0XCJIaWdoXCIsXHJcblx0XHRcIk1pZFwiLFxyXG5cdFx0XCJMb3dcIixcclxuXHRcdFwiQm90dG9tXCIsXHJcblx0XHRcIk5BXCJcclxuXHRdXHJcbn07XHJcbmNvbmZpZy5jdXN0b21DbGFzc2VzID0ge1xyXG5cdFwiV2lraVByb2plY3QgTWlsaXRhcnkgaGlzdG9yeVwiOiBbXHJcblx0XHRcIkFMXCIsXHJcblx0XHRcIkJMXCIsXHJcblx0XHRcIkNMXCJcclxuXHRdLFxyXG5cdFwiV2lraVByb2plY3QgUG9ydGFsc1wiOiBbXHJcblx0XHRcIkZQb1wiLFxyXG5cdFx0XCJDb21wbGV0ZVwiLFxyXG5cdFx0XCJTdWJzdGFudGlhbFwiLFxyXG5cdFx0XCJCYXNpY1wiLFxyXG5cdFx0XCJJbmNvbXBsZXRlXCIsXHJcblx0XHRcIk1ldGFcIlxyXG5cdF1cclxufTtcclxuY29uZmlnLnNoZWxsVGVtcGxhdGVzID0gW1xyXG5cdFwiV2lraVByb2plY3QgYmFubmVyIHNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdEJhbm5lcnNcIixcclxuXHRcIldpa2lQcm9qZWN0IEJhbm5lcnNcIixcclxuXHRcIldQQlwiLFxyXG5cdFwiV1BCU1wiLFxyXG5cdFwiV2lraXByb2plY3RiYW5uZXJzaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3QgQmFubmVyIFNoZWxsXCIsXHJcblx0XCJXcGJcIixcclxuXHRcIldQQmFubmVyU2hlbGxcIixcclxuXHRcIldwYnNcIixcclxuXHRcIldpa2lwcm9qZWN0YmFubmVyc1wiLFxyXG5cdFwiV1AgQmFubmVyIFNoZWxsXCIsXHJcblx0XCJXUCBiYW5uZXIgc2hlbGxcIixcclxuXHRcIkJhbm5lcnNoZWxsXCIsXHJcblx0XCJXaWtpcHJvamVjdCBiYW5uZXIgc2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0IEJhbm5lcnMgU2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0QmFubmVyIFNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdEJhbm5lclNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdCBCYW5uZXJTaGVsbFwiLFxyXG5cdFwiV2lraXByb2plY3RCYW5uZXJTaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3QgYmFubmVyIHNoZWxsL3JlZGlyZWN0XCIsXHJcblx0XCJXaWtpUHJvamVjdCBTaGVsbFwiLFxyXG5cdFwiQmFubmVyIHNoZWxsXCIsXHJcblx0XCJTY29wZSBzaGVsbFwiLFxyXG5cdFwiUHJvamVjdCBzaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3QgYmFubmVyXCJcclxuXTtcclxuY29uZmlnLmRlZmF1bHRQYXJhbWV0ZXJEYXRhID0ge1xyXG5cdFwiYXV0b1wiOiB7XHJcblx0XHRcImxhYmVsXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIkF1dG8tcmF0ZWRcIlxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiQXV0b21hdGljYWxseSByYXRlZCBieSBhIGJvdC4gQWxsb3dlZCB2YWx1ZXM6IFsneWVzJ10uXCJcclxuXHRcdH0sXHJcblx0XHRcImF1dG92YWx1ZVwiOiBcInllc1wiXHJcblx0fSxcclxuXHRcImxpc3Rhc1wiOiB7XHJcblx0XHRcImxhYmVsXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIkxpc3QgYXNcIlxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiU29ydGtleSBmb3IgdGFsayBwYWdlXCJcclxuXHRcdH1cclxuXHR9LFxyXG5cdFwic21hbGxcIjoge1xyXG5cdFx0XCJsYWJlbFwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJTbWFsbD9cIixcclxuXHRcdH0sXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIkRpc3BsYXkgYSBzbWFsbCB2ZXJzaW9uLiBBbGxvd2VkIHZhbHVlczogWyd5ZXMnXS5cIlxyXG5cdFx0fSxcclxuXHRcdFwiYXV0b3ZhbHVlXCI6IFwieWVzXCJcclxuXHR9LFxyXG5cdFwiYXR0ZW50aW9uXCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiQXR0ZW50aW9uIHJlcXVpcmVkP1wiLFxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiSW1tZWRpYXRlIGF0dGVudGlvbiByZXF1aXJlZC4gQWxsb3dlZCB2YWx1ZXM6IFsneWVzJ10uXCJcclxuXHRcdH0sXHJcblx0XHRcImF1dG92YWx1ZVwiOiBcInllc1wiXHJcblx0fSxcclxuXHRcIm5lZWRzLWltYWdlXCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiTmVlZHMgaW1hZ2U/XCIsXHJcblx0XHR9LFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJSZXF1ZXN0IHRoYXQgYW4gaW1hZ2Ugb3IgcGhvdG9ncmFwaCBvZiB0aGUgc3ViamVjdCBiZSBhZGRlZCB0byB0aGUgYXJ0aWNsZS4gQWxsb3dlZCB2YWx1ZXM6IFsneWVzJ10uXCJcclxuXHRcdH0sXHJcblx0XHRcImFsaWFzZXNcIjogW1xyXG5cdFx0XHRcIm5lZWRzLXBob3RvXCJcclxuXHRcdF0sXHJcblx0XHRcImF1dG92YWx1ZVwiOiBcInllc1wiLFxyXG5cdFx0XCJzdWdnZXN0ZWRcIjogdHJ1ZVxyXG5cdH0sXHJcblx0XCJuZWVkcy1pbmZvYm94XCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiTmVlZHMgaW5mb2JveD9cIixcclxuXHRcdH0sXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIlJlcXVlc3QgdGhhdCBhbiBpbmZvYm94IGJlIGFkZGVkIHRvIHRoZSBhcnRpY2xlLiBBbGxvd2VkIHZhbHVlczogWyd5ZXMnXS5cIlxyXG5cdFx0fSxcclxuXHRcdFwiYWxpYXNlc1wiOiBbXHJcblx0XHRcdFwibmVlZHMtcGhvdG9cIlxyXG5cdFx0XSxcclxuXHRcdFwiYXV0b3ZhbHVlXCI6IFwieWVzXCIsXHJcblx0XHRcInN1Z2dlc3RlZFwiOiB0cnVlXHJcblx0fVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY29uZmlnOyIsIi8vIEF0dHJpYnV0aW9uOiBEaWZmIHN0eWxlcyBmcm9tIDxodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9XaWtpcGVkaWE6QXV0b1dpa2lCcm93c2VyL3N0eWxlLmNzcz5cclxudmFyIGRpZmZTdHlsZXMgPSBgdGFibGUuZGlmZiwgdGQuZGlmZi1vdGl0bGUsIHRkLmRpZmYtbnRpdGxlIHsgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7IH1cclxudGQuZGlmZi1vdGl0bGUsIHRkLmRpZmYtbnRpdGxlIHsgdGV4dC1hbGlnbjogY2VudGVyOyB9XHJcbnRkLmRpZmYtbWFya2VyIHsgdGV4dC1hbGlnbjogcmlnaHQ7IGZvbnQtd2VpZ2h0OiBib2xkOyBmb250LXNpemU6IDEuMjVlbTsgfVxyXG50ZC5kaWZmLWxpbmVubyB7IGZvbnQtd2VpZ2h0OiBib2xkOyB9XHJcbnRkLmRpZmYtYWRkZWRsaW5lLCB0ZC5kaWZmLWRlbGV0ZWRsaW5lLCB0ZC5kaWZmLWNvbnRleHQgeyBmb250LXNpemU6IDg4JTsgdmVydGljYWwtYWxpZ246IHRvcDsgd2hpdGUtc3BhY2U6IC1tb3otcHJlLXdyYXA7IHdoaXRlLXNwYWNlOiBwcmUtd3JhcDsgfVxyXG50ZC5kaWZmLWFkZGVkbGluZSwgdGQuZGlmZi1kZWxldGVkbGluZSB7IGJvcmRlci1zdHlsZTogc29saWQ7IGJvcmRlci13aWR0aDogMXB4IDFweCAxcHggNHB4OyBib3JkZXItcmFkaXVzOiAwLjMzZW07IH1cclxudGQuZGlmZi1hZGRlZGxpbmUgeyBib3JkZXItY29sb3I6ICNhM2QzZmY7IH1cclxudGQuZGlmZi1kZWxldGVkbGluZSB7IGJvcmRlci1jb2xvcjogI2ZmZTQ5YzsgfVxyXG50ZC5kaWZmLWNvbnRleHQgeyBiYWNrZ3JvdW5kOiAjZjNmM2YzOyBjb2xvcjogIzMzMzMzMzsgYm9yZGVyLXN0eWxlOiBzb2xpZDsgYm9yZGVyLXdpZHRoOiAxcHggMXB4IDFweCA0cHg7IGJvcmRlci1jb2xvcjogI2U2ZTZlNjsgYm9yZGVyLXJhZGl1czogMC4zM2VtOyB9XHJcbi5kaWZmY2hhbmdlIHsgZm9udC13ZWlnaHQ6IGJvbGQ7IHRleHQtZGVjb3JhdGlvbjogbm9uZTsgfVxyXG50YWJsZS5kaWZmIHtcclxuICAgIGJvcmRlcjogbm9uZTtcclxuICAgIHdpZHRoOiA5OCU7IGJvcmRlci1zcGFjaW5nOiA0cHg7XHJcbiAgICB0YWJsZS1sYXlvdXQ6IGZpeGVkOyAvKiBFbnN1cmVzIHRoYXQgY29sdW1zIGFyZSBvZiBlcXVhbCB3aWR0aCAqL1xyXG59XHJcbnRkLmRpZmYtYWRkZWRsaW5lIC5kaWZmY2hhbmdlLCB0ZC5kaWZmLWRlbGV0ZWRsaW5lIC5kaWZmY2hhbmdlIHsgYm9yZGVyLXJhZGl1czogMC4zM2VtOyBwYWRkaW5nOiAwLjI1ZW0gMDsgfVxyXG50ZC5kaWZmLWFkZGVkbGluZSAuZGlmZmNoYW5nZSB7XHRiYWNrZ3JvdW5kOiAjZDhlY2ZmOyB9XHJcbnRkLmRpZmYtZGVsZXRlZGxpbmUgLmRpZmZjaGFuZ2UgeyBiYWNrZ3JvdW5kOiAjZmVlZWM4OyB9XHJcbnRhYmxlLmRpZmYgdGQge1x0cGFkZGluZzogMC4zM2VtIDAuNjZlbTsgfVxyXG50YWJsZS5kaWZmIGNvbC5kaWZmLW1hcmtlciB7IHdpZHRoOiAyJTsgfVxyXG50YWJsZS5kaWZmIGNvbC5kaWZmLWNvbnRlbnQgeyB3aWR0aDogNDglOyB9XHJcbnRhYmxlLmRpZmYgdGQgZGl2IHtcclxuICAgIC8qIEZvcmNlLXdyYXAgdmVyeSBsb25nIGxpbmVzIHN1Y2ggYXMgVVJMcyBvciBwYWdlLXdpZGVuaW5nIGNoYXIgc3RyaW5ncy4gKi9cclxuICAgIHdvcmQtd3JhcDogYnJlYWstd29yZDtcclxuICAgIC8qIEFzIGZhbGxiYWNrIChGRjwzLjUsIE9wZXJhIDwxMC41KSwgc2Nyb2xsYmFycyB3aWxsIGJlIGFkZGVkIGZvciB2ZXJ5IHdpZGUgY2VsbHNcclxuICAgICAgICBpbnN0ZWFkIG9mIHRleHQgb3ZlcmZsb3dpbmcgb3Igd2lkZW5pbmcgKi9cclxuICAgIG92ZXJmbG93OiBhdXRvO1xyXG59YDtcclxuXHJcbmV4cG9ydCB7IGRpZmZTdHlsZXMgfTsiLCJpbXBvcnQge0FQSSwgaXNBZnRlckRhdGUsIG1ha2VFcnJvck1zZ30gZnJvbSBcIi4vdXRpbFwiO1xyXG5pbXBvcnQgKiBhcyBjYWNoZSBmcm9tIFwiLi9jYWNoZVwiO1xyXG5cclxudmFyIGNhY2hlQmFubmVycyA9IGZ1bmN0aW9uKGJhbm5lcnMsIGJhbm5lck9wdGlvbnMpIHtcclxuXHRjYWNoZS53cml0ZShcImJhbm5lcnNcIiwgYmFubmVycywgMiwgNjApO1xyXG5cdGNhY2hlLndyaXRlKFwiYmFubmVyT3B0aW9uc1wiLCBiYW5uZXJPcHRpb25zLCAyLCA2MCk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyBiYW5uZXJzL29wdGlvbnMgZnJvbSB0aGUgQXBpXHJcbiAqIFxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gUmVzb2x2ZWQgd2l0aDogYmFubmVycyBvYmplY3QsIGJhbm5lck9wdGlvbnMgYXJyYXlcclxuICovXHJcbnZhciBnZXRMaXN0T2ZCYW5uZXJzRnJvbUFwaSA9IGZ1bmN0aW9uKCkge1xyXG5cclxuXHR2YXIgZmluaXNoZWRQcm9taXNlID0gJC5EZWZlcnJlZCgpO1xyXG5cclxuXHR2YXIgcXVlcnlTa2VsZXRvbiA9IHtcclxuXHRcdGFjdGlvbjogXCJxdWVyeVwiLFxyXG5cdFx0Zm9ybWF0OiBcImpzb25cIixcclxuXHRcdGxpc3Q6IFwiY2F0ZWdvcnltZW1iZXJzXCIsXHJcblx0XHRjbXByb3A6IFwidGl0bGVcIixcclxuXHRcdGNtbmFtZXNwYWNlOiBcIjEwXCIsXHJcblx0XHRjbWxpbWl0OiBcIjUwMFwiXHJcblx0fTtcclxuXHJcblx0dmFyIGNhdGVnb3JpZXMgPSBbXHJcblx0XHR7XHJcblx0XHRcdHRpdGxlOlwiIENhdGVnb3J5Oldpa2lQcm9qZWN0IGJhbm5lcnMgd2l0aCBxdWFsaXR5IGFzc2Vzc21lbnRcIixcclxuXHRcdFx0YWJicmV2aWF0aW9uOiBcIndpdGhSYXRpbmdzXCIsXHJcblx0XHRcdGJhbm5lcnM6IFtdLFxyXG5cdFx0XHRwcm9jZXNzZWQ6ICQuRGVmZXJyZWQoKVxyXG5cdFx0fSxcclxuXHRcdHtcclxuXHRcdFx0dGl0bGU6IFwiQ2F0ZWdvcnk6V2lraVByb2plY3QgYmFubmVycyB3aXRob3V0IHF1YWxpdHkgYXNzZXNzbWVudFwiLFxyXG5cdFx0XHRhYmJyZXZpYXRpb246IFwid2l0aG91dFJhdGluZ3NcIixcclxuXHRcdFx0YmFubmVyczogW10sXHJcblx0XHRcdHByb2Nlc3NlZDogJC5EZWZlcnJlZCgpXHJcblx0XHR9LFxyXG5cdFx0e1xyXG5cdFx0XHR0aXRsZTogXCJDYXRlZ29yeTpXaWtpUHJvamVjdCBiYW5uZXIgd3JhcHBlciB0ZW1wbGF0ZXNcIixcclxuXHRcdFx0YWJicmV2aWF0aW9uOiBcIndyYXBwZXJzXCIsXHJcblx0XHRcdGJhbm5lcnM6IFtdLFxyXG5cdFx0XHRwcm9jZXNzZWQ6ICQuRGVmZXJyZWQoKVxyXG5cdFx0fVxyXG5cdF07XHJcblxyXG5cdHZhciBwcm9jZXNzUXVlcnkgPSBmdW5jdGlvbihyZXN1bHQsIGNhdEluZGV4KSB7XHJcblx0XHRpZiAoICFyZXN1bHQucXVlcnkgfHwgIXJlc3VsdC5xdWVyeS5jYXRlZ29yeW1lbWJlcnMgKSB7XHJcblx0XHRcdC8vIE5vIHJlc3VsdHNcclxuXHRcdFx0Ly8gVE9ETzogZXJyb3Igb3Igd2FybmluZyAqKioqKioqKlxyXG5cdFx0XHRmaW5pc2hlZFByb21pc2UucmVqZWN0KCk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0Ly8gR2F0aGVyIHRpdGxlcyBpbnRvIGFycmF5IC0gZXhjbHVkaW5nIFwiVGVtcGxhdGU6XCIgcHJlZml4XHJcblx0XHR2YXIgcmVzdWx0VGl0bGVzID0gcmVzdWx0LnF1ZXJ5LmNhdGVnb3J5bWVtYmVycy5tYXAoZnVuY3Rpb24oaW5mbykge1xyXG5cdFx0XHRyZXR1cm4gaW5mby50aXRsZS5zbGljZSg5KTtcclxuXHRcdH0pO1xyXG5cdFx0QXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoY2F0ZWdvcmllc1tjYXRJbmRleF0uYmFubmVycywgcmVzdWx0VGl0bGVzKTtcclxuXHRcdFxyXG5cdFx0Ly8gQ29udGludWUgcXVlcnkgaWYgbmVlZGVkXHJcblx0XHRpZiAoIHJlc3VsdC5jb250aW51ZSApIHtcclxuXHRcdFx0ZG9BcGlRdWVyeSgkLmV4dGVuZChjYXRlZ29yaWVzW2NhdEluZGV4XS5xdWVyeSwgcmVzdWx0LmNvbnRpbnVlKSwgY2F0SW5kZXgpO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdGNhdGVnb3JpZXNbY2F0SW5kZXhdLnByb2Nlc3NlZC5yZXNvbHZlKCk7XHJcblx0fTtcclxuXHJcblx0dmFyIGRvQXBpUXVlcnkgPSBmdW5jdGlvbihxLCBjYXRJbmRleCkge1xyXG5cdFx0QVBJLmdldCggcSApXHJcblx0XHRcdC5kb25lKCBmdW5jdGlvbihyZXN1bHQpIHtcclxuXHRcdFx0XHRwcm9jZXNzUXVlcnkocmVzdWx0LCBjYXRJbmRleCk7XHJcblx0XHRcdH0gKVxyXG5cdFx0XHQuZmFpbCggZnVuY3Rpb24oY29kZSwganF4aHIpIHtcclxuXHRcdFx0XHRjb25zb2xlLndhcm4oXCJbUmF0ZXJdIFwiICsgbWFrZUVycm9yTXNnKGNvZGUsIGpxeGhyLCBcIkNvdWxkIG5vdCByZXRyaWV2ZSBwYWdlcyBmcm9tIFtbOlwiICsgcS5jbXRpdGxlICsgXCJdXVwiKSk7XHJcblx0XHRcdFx0ZmluaXNoZWRQcm9taXNlLnJlamVjdCgpO1xyXG5cdFx0XHR9ICk7XHJcblx0fTtcclxuXHRcclxuXHRjYXRlZ29yaWVzLmZvckVhY2goZnVuY3Rpb24oY2F0LCBpbmRleCwgYXJyKSB7XHJcblx0XHRjYXQucXVlcnkgPSAkLmV4dGVuZCggeyBcImNtdGl0bGVcIjpjYXQudGl0bGUgfSwgcXVlcnlTa2VsZXRvbiApO1xyXG5cdFx0JC53aGVuKCBhcnJbaW5kZXgtMV0gJiYgYXJyW2luZGV4LTFdLnByb2Nlc3NlZCB8fCB0cnVlICkudGhlbihmdW5jdGlvbigpe1xyXG5cdFx0XHRkb0FwaVF1ZXJ5KGNhdC5xdWVyeSwgaW5kZXgpO1xyXG5cdFx0fSk7XHJcblx0fSk7XHJcblx0XHJcblx0Y2F0ZWdvcmllc1tjYXRlZ29yaWVzLmxlbmd0aC0xXS5wcm9jZXNzZWQudGhlbihmdW5jdGlvbigpe1xyXG5cdFx0dmFyIGJhbm5lcnMgPSB7fTtcclxuXHRcdHZhciBzdGFzaEJhbm5lciA9IGZ1bmN0aW9uKGNhdE9iamVjdCkge1xyXG5cdFx0XHRiYW5uZXJzW2NhdE9iamVjdC5hYmJyZXZpYXRpb25dID0gY2F0T2JqZWN0LmJhbm5lcnM7XHJcblx0XHR9O1xyXG5cdFx0dmFyIG1lcmdlQmFubmVycyA9IGZ1bmN0aW9uKG1lcmdlSW50b1RoaXNBcnJheSwgY2F0T2JqZWN0KSB7XHJcblx0XHRcdHJldHVybiAkLm1lcmdlKG1lcmdlSW50b1RoaXNBcnJheSwgY2F0T2JqZWN0LmJhbm5lcnMpO1xyXG5cdFx0fTtcclxuXHRcdHZhciBtYWtlT3B0aW9uID0gZnVuY3Rpb24oYmFubmVyTmFtZSkge1xyXG5cdFx0XHR2YXIgaXNXcmFwcGVyID0gKCAtMSAhPT0gJC5pbkFycmF5KGJhbm5lck5hbWUsIGNhdGVnb3JpZXNbMl0uYmFubmVycykgKTtcclxuXHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRkYXRhOiAgKCBpc1dyYXBwZXIgPyBcInN1YnN0OlwiIDogXCJcIikgKyBiYW5uZXJOYW1lLFxyXG5cdFx0XHRcdGxhYmVsOiBiYW5uZXJOYW1lLnJlcGxhY2UoXCJXaWtpUHJvamVjdCBcIiwgXCJcIikgKyAoIGlzV3JhcHBlciA/IFwiIFt0ZW1wbGF0ZSB3cmFwcGVyXVwiIDogXCJcIilcclxuXHRcdFx0fTtcclxuXHRcdH07XHJcblx0XHRjYXRlZ29yaWVzLmZvckVhY2goc3Rhc2hCYW5uZXIpO1xyXG5cdFx0XHJcblx0XHR2YXIgYmFubmVyT3B0aW9ucyA9IGNhdGVnb3JpZXMucmVkdWNlKG1lcmdlQmFubmVycywgW10pLm1hcChtYWtlT3B0aW9uKTtcclxuXHRcdFxyXG5cdFx0ZmluaXNoZWRQcm9taXNlLnJlc29sdmUoYmFubmVycywgYmFubmVyT3B0aW9ucyk7XHJcblx0fSk7XHJcblx0XHJcblx0cmV0dXJuIGZpbmlzaGVkUHJvbWlzZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGJhbm5lcnMvb3B0aW9ucyBmcm9tIGNhY2hlLCBpZiB0aGVyZSBhbmQgbm90IHRvbyBvbGRcclxuICogXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlZCB3aXRoOiBiYW5uZXJzIG9iamVjdCwgYmFubmVyT3B0aW9ucyBvYmplY3RcclxuICovXHJcbnZhciBnZXRCYW5uZXJzRnJvbUNhY2hlID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIGNhY2hlZEJhbm5lcnMgPSBjYWNoZS5yZWFkKFwiYmFubmVyc1wiKTtcclxuXHR2YXIgY2FjaGVkQmFubmVyT3B0aW9ucyA9IGNhY2hlLnJlYWQoXCJiYW5uZXJPcHRpb25zXCIpO1xyXG5cdGlmIChcclxuXHRcdCFjYWNoZWRCYW5uZXJzIHx8XHJcblx0XHQhY2FjaGVkQmFubmVycy52YWx1ZSB8fCAhY2FjaGVkQmFubmVycy5zdGFsZURhdGUgfHxcclxuXHRcdCFjYWNoZWRCYW5uZXJPcHRpb25zIHx8XHJcblx0XHQhY2FjaGVkQmFubmVyT3B0aW9ucy52YWx1ZSB8fCAhY2FjaGVkQmFubmVyT3B0aW9ucy5zdGFsZURhdGVcclxuXHQpIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0fVxyXG5cdGlmICggaXNBZnRlckRhdGUoY2FjaGVkQmFubmVycy5zdGFsZURhdGUpIHx8IGlzQWZ0ZXJEYXRlKGNhY2hlZEJhbm5lck9wdGlvbnMuc3RhbGVEYXRlKSApIHtcclxuXHRcdC8vIFVwZGF0ZSBpbiB0aGUgYmFja2dyb3VuZDsgc3RpbGwgdXNlIG9sZCBsaXN0IHVudGlsIHRoZW4gIFxyXG5cdFx0Z2V0TGlzdE9mQmFubmVyc0Zyb21BcGkoKS50aGVuKGNhY2hlQmFubmVycyk7XHJcblx0fVxyXG5cdHJldHVybiAkLkRlZmVycmVkKCkucmVzb2x2ZShjYWNoZWRCYW5uZXJzLnZhbHVlLCBjYWNoZWRCYW5uZXJPcHRpb25zLnZhbHVlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGJhbm5lcnMvb3B0aW9ucyBmcm9tIGNhY2hlIG9yIEFQSS5cclxuICogSGFzIHNpZGUgYWZmZWN0IG9mIGFkZGluZy91cGRhdGluZy9jbGVhcmluZyBjYWNoZS5cclxuICogXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPE9iamVjdCwgQXJyYXk+fSBiYW5uZXJzIG9iamVjdCwgYmFubmVyT3B0aW9ucyBvYmplY3RcclxuICovXHJcbnZhciBnZXRCYW5uZXJzID0gKCkgPT4gZ2V0QmFubmVyc0Zyb21DYWNoZSgpLnRoZW4oXHJcblx0Ly8gU3VjY2VzczogcGFzcyB0aHJvdWdoXHJcblx0KGJhbm5lcnMsIG9wdGlvbnMpID0+ICQuRGVmZXJyZWQoKS5yZXNvbHZlKGJhbm5lcnMsIG9wdGlvbnMpLFxyXG5cdC8vIEZhaWx1cmU6IGdldCBmcm9tIEFwaSwgdGhlbiBjYWNoZSB0aGVtXHJcblx0KCkgPT4ge1xyXG5cdFx0dmFyIGJhbm5lcnNQcm9taXNlID0gZ2V0TGlzdE9mQmFubmVyc0Zyb21BcGkoKTtcclxuXHRcdGJhbm5lcnNQcm9taXNlLnRoZW4oY2FjaGVCYW5uZXJzKTtcclxuXHRcdHJldHVybiBiYW5uZXJzUHJvbWlzZTtcclxuXHR9XHJcbik7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnZXRCYW5uZXJzOyIsImltcG9ydCBjb25maWcgZnJvbSBcIi4vY29uZmlnXCI7XHJcbmltcG9ydCB7QVBJfSBmcm9tIFwiLi91dGlsXCI7XHJcbmltcG9ydCB7IHBhcnNlVGVtcGxhdGVzLCBnZXRXaXRoUmVkaXJlY3RUbyB9IGZyb20gXCIuL1RlbXBsYXRlXCI7XHJcbmltcG9ydCBnZXRCYW5uZXJzIGZyb20gXCIuL2dldEJhbm5lcnNcIjtcclxuaW1wb3J0ICogYXMgY2FjaGUgZnJvbSBcIi4vY2FjaGVcIjtcclxuaW1wb3J0IHdpbmRvd01hbmFnZXIgZnJvbSBcIi4vd2luZG93TWFuYWdlclwiO1xyXG5cclxudmFyIHNldHVwUmF0ZXIgPSBmdW5jdGlvbihjbGlja0V2ZW50KSB7XHJcblx0aWYgKCBjbGlja0V2ZW50ICkge1xyXG5cdFx0Y2xpY2tFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdH1cclxuXHJcblx0dmFyIHNldHVwQ29tcGxldGVkUHJvbWlzZSA9ICQuRGVmZXJyZWQoKTtcclxuICAgIFxyXG5cdHZhciBjdXJyZW50UGFnZSA9IG13LlRpdGxlLm5ld0Zyb21UZXh0KGNvbmZpZy5tdy53Z1BhZ2VOYW1lKTtcclxuXHR2YXIgdGFsa1BhZ2UgPSBjdXJyZW50UGFnZSAmJiBjdXJyZW50UGFnZS5nZXRUYWxrUGFnZSgpO1xyXG5cdHZhciBzdWJqZWN0UGFnZSA9IGN1cnJlbnRQYWdlICYmIGN1cnJlbnRQYWdlLmdldFN1YmplY3RQYWdlKCk7XHJcbiBcclxuXHQvLyBHZXQgbGlzdHMgb2YgYWxsIGJhbm5lcnMgKHRhc2sgMSlcclxuXHR2YXIgYmFubmVyc1Byb21pc2UgPSBnZXRCYW5uZXJzKCk7XHJcblxyXG5cdC8vIExvYWQgdGFsayBwYWdlICh0YXNrIDIpXHJcblx0dmFyIGxvYWRUYWxrUHJvbWlzZSA9IEFQSS5nZXQoIHtcclxuXHRcdGFjdGlvbjogXCJxdWVyeVwiLFxyXG5cdFx0cHJvcDogXCJyZXZpc2lvbnNcIixcclxuXHRcdHJ2cHJvcDogXCJjb250ZW50XCIsXHJcblx0XHRydnNlY3Rpb246IFwiMFwiLFxyXG5cdFx0dGl0bGVzOiB0YWxrUGFnZS5nZXRQcmVmaXhlZFRleHQoKSxcclxuXHRcdGluZGV4cGFnZWlkczogMVxyXG5cdH0gKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcclxuXHRcdHZhciBpZCA9IHJlc3VsdC5xdWVyeS5wYWdlaWRzO1x0XHRcclxuXHRcdHZhciB3aWtpdGV4dCA9ICggaWQgPCAwICkgPyBcIlwiIDogcmVzdWx0LnF1ZXJ5LnBhZ2VzW2lkXS5yZXZpc2lvbnNbMF1bXCIqXCJdO1xyXG5cdFx0cmV0dXJuIHdpa2l0ZXh0O1xyXG5cdH0pO1xyXG5cclxuXHQvLyBQYXJzZSB0YWxrIHBhZ2UgZm9yIGJhbm5lcnMgKHRhc2sgMylcclxuXHR2YXIgcGFyc2VUYWxrUHJvbWlzZSA9IGxvYWRUYWxrUHJvbWlzZS50aGVuKHdpa2l0ZXh0ID0+IHBhcnNlVGVtcGxhdGVzKHdpa2l0ZXh0LCB0cnVlKSkgLy8gR2V0IGFsbCB0ZW1wbGF0ZXNcclxuXHRcdC50aGVuKHRlbXBsYXRlcyA9PiBnZXRXaXRoUmVkaXJlY3RUbyh0ZW1wbGF0ZXMpKSAvLyBDaGVjayBmb3IgcmVkaXJlY3RzXHJcblx0XHQudGhlbih0ZW1wbGF0ZXMgPT4ge1xyXG5cdFx0XHRyZXR1cm4gYmFubmVyc1Byb21pc2UudGhlbigoYWxsQmFubmVycykgPT4geyAvLyBHZXQgbGlzdCBvZiBhbGwgYmFubmVyIHRlbXBsYXRlc1xyXG5cdFx0XHRcdHJldHVybiB0ZW1wbGF0ZXMuZmlsdGVyKHRlbXBsYXRlID0+IHsgLy8gRmlsdGVyIG91dCBub24tYmFubmVyc1xyXG5cdFx0XHRcdFx0dmFyIG1haW5UZXh0ID0gdGVtcGxhdGUucmVkaXJlY3RUb1xyXG5cdFx0XHRcdFx0XHQ/IHRlbXBsYXRlLnJlZGlyZWN0VG8uZ2V0TWFpblRleHQoKVxyXG5cdFx0XHRcdFx0XHQ6IHRlbXBsYXRlLmdldFRpdGxlKCkuZ2V0TWFpblRleHQoKTtcclxuXHRcdFx0XHRcdHJldHVybiBhbGxCYW5uZXJzLndpdGhSYXRpbmdzLmluY2x1ZGVzKG1haW5UZXh0KSB8fCBcclxuICAgICAgICAgICAgICAgICAgICBhbGxCYW5uZXJzLndpdGhvdXRSYXRpbmdzLmluY2x1ZGVzKG1haW5UZXh0KSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIGFsbEJhbm5lcnMud3JhcHBlcnMuaW5jbHVkZXMobWFpblRleHQpO1xyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFx0XHQubWFwKGZ1bmN0aW9uKHRlbXBsYXRlKSB7IC8vIFNldCB3cmFwcGVyIHRhcmdldCBpZiBuZWVkZWRcclxuXHRcdFx0XHRcdFx0dmFyIG1haW5UZXh0ID0gdGVtcGxhdGUucmVkaXJlY3RUb1xyXG5cdFx0XHRcdFx0XHRcdD8gdGVtcGxhdGUucmVkaXJlY3RUby5nZXRNYWluVGV4dCgpXHJcblx0XHRcdFx0XHRcdFx0OiB0ZW1wbGF0ZS5nZXRUaXRsZSgpLmdldE1haW5UZXh0KCk7XHJcblx0XHRcdFx0XHRcdGlmIChhbGxCYW5uZXJzLndyYXBwZXJzLmluY2x1ZGVzKG1haW5UZXh0KSkge1xyXG5cdFx0XHRcdFx0XHRcdHRlbXBsYXRlLnJlZGlyZWN0c1RvID0gbXcuVGl0bGUubmV3RnJvbVRleHQoXCJUZW1wbGF0ZTpTdWJzdDpcIiArIG1haW5UZXh0KTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gdGVtcGxhdGU7XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHJcblx0Ly8gUmV0cmlldmUgYW5kIHN0b3JlIFRlbXBsYXRlRGF0YSAodGFzayA0KVxyXG5cdHZhciB0ZW1wbGF0ZURhdGFQcm9taXNlID0gcGFyc2VUYWxrUHJvbWlzZS50aGVuKHRlbXBsYXRlcyA9PiB7XHJcblx0XHR0ZW1wbGF0ZXMuZm9yRWFjaCh0ZW1wbGF0ZSA9PiB0ZW1wbGF0ZS5zZXRQYXJhbURhdGFBbmRTdWdnZXN0aW9ucygpKTtcclxuXHRcdHJldHVybiB0ZW1wbGF0ZXM7XHJcblx0fSk7XHJcblxyXG5cdC8vIENoZWNrIGlmIHBhZ2UgaXMgYSByZWRpcmVjdCAodGFzayA1KSAtIGJ1dCBkb24ndCBlcnJvciBvdXQgaWYgcmVxdWVzdCBmYWlsc1xyXG5cdHZhciByZWRpcmVjdENoZWNrUHJvbWlzZSA9IEFQSS5nZXRSYXcoc3ViamVjdFBhZ2UuZ2V0UHJlZml4ZWRUZXh0KCkpXHJcblx0XHQudGhlbihcclxuXHRcdFx0Ly8gU3VjY2Vzc1xyXG5cdFx0XHRmdW5jdGlvbihyYXdQYWdlKSB7IFxyXG5cdFx0XHRcdGlmICggL15cXHMqI1JFRElSRUNUL2kudGVzdChyYXdQYWdlKSApIHtcclxuXHRcdFx0XHRcdC8vIGdldCByZWRpcmVjdGlvbiB0YXJnZXQsIG9yIGJvb2xlYW4gdHJ1ZVxyXG5cdFx0XHRcdFx0cmV0dXJuIHJhd1BhZ2Uuc2xpY2UocmF3UGFnZS5pbmRleE9mKFwiW1tcIikrMiwgcmF3UGFnZS5pbmRleE9mKFwiXV1cIikpIHx8IHRydWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fSxcclxuXHRcdFx0Ly8gRmFpbHVyZSAoaWdub3JlZClcclxuXHRcdFx0ZnVuY3Rpb24oKSB7IHJldHVybiBudWxsOyB9XHJcblx0XHQpO1xyXG5cclxuXHQvLyBSZXRyaWV2ZSByYXRpbmcgZnJvbSBPUkVTICh0YXNrIDYsIG9ubHkgbmVlZGVkIGZvciBhcnRpY2xlcylcclxuXHR2YXIgc2hvdWxkR2V0T3JlcyA9ICggY29uZmlnLm13LndnTmFtZXNwYWNlTnVtYmVyIDw9IDEgKTtcclxuXHRpZiAoIHNob3VsZEdldE9yZXMgKSB7XHJcblx0XHR2YXIgbGF0ZXN0UmV2SWRQcm9taXNlID0gY3VycmVudFBhZ2UuaXNUYWxrUGFnZSgpXHJcblx0XHRcdD8gJC5EZWZlcnJlZCgpLnJlc29sdmUoY29uZmlnLm13LndnUmV2aXNpb25JZClcclxuXHRcdFx0OiBcdEFQSS5nZXQoIHtcclxuXHRcdFx0XHRhY3Rpb246IFwicXVlcnlcIixcclxuXHRcdFx0XHRmb3JtYXQ6IFwianNvblwiLFxyXG5cdFx0XHRcdHByb3A6IFwicmV2aXNpb25zXCIsXHJcblx0XHRcdFx0dGl0bGVzOiBzdWJqZWN0UGFnZS5nZXRQcmVmaXhlZFRleHQoKSxcclxuXHRcdFx0XHRydnByb3A6IFwiaWRzXCIsXHJcblx0XHRcdFx0aW5kZXhwYWdlaWRzOiAxXHJcblx0XHRcdH0gKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0XHRcdGlmIChyZXN1bHQucXVlcnkucmVkaXJlY3RzKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHZhciBpZCA9IHJlc3VsdC5xdWVyeS5wYWdlaWRzO1xyXG5cdFx0XHRcdHZhciBwYWdlID0gcmVzdWx0LnF1ZXJ5LnBhZ2VzW2lkXTtcclxuXHRcdFx0XHRpZiAocGFnZS5taXNzaW5nID09PSBcIlwiKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICggaWQgPCAwICkge1xyXG5cdFx0XHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHBhZ2UucmV2aXNpb25zWzBdLnJldmlkO1xyXG5cdFx0XHR9KTtcclxuXHRcdHZhciBvcmVzUHJvbWlzZSA9IGxhdGVzdFJldklkUHJvbWlzZS50aGVuKGZ1bmN0aW9uKGxhdGVzdFJldklkKSB7XHJcblx0XHRcdGlmICghbGF0ZXN0UmV2SWQpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIEFQSS5nZXRPUkVTKGxhdGVzdFJldklkKVxyXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0XHRcdFx0dmFyIGRhdGEgPSByZXN1bHQuZW53aWtpLnNjb3Jlc1tsYXRlc3RSZXZJZF0ud3AxMDtcclxuXHRcdFx0XHRcdGlmICggZGF0YS5lcnJvciApIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoZGF0YS5lcnJvci50eXBlLCBkYXRhLmVycm9yLm1lc3NhZ2UpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cmV0dXJuIGRhdGEuc2NvcmUucHJlZGljdGlvbjtcclxuXHRcdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0Ly8gT3BlbiB0aGUgbG9hZCBkaWFsb2dcclxuXHR2YXIgaXNPcGVuZWRQcm9taXNlID0gJC5EZWZlcnJlZCgpO1xyXG5cdHZhciBsb2FkRGlhbG9nV2luID0gd2luZG93TWFuYWdlci5vcGVuV2luZG93KFwibG9hZERpYWxvZ1wiLCB7XHJcblx0XHRwcm9taXNlczogW1xyXG5cdFx0XHRiYW5uZXJzUHJvbWlzZSxcclxuXHRcdFx0bG9hZFRhbGtQcm9taXNlLFxyXG5cdFx0XHRwYXJzZVRhbGtQcm9taXNlLFxyXG5cdFx0XHR0ZW1wbGF0ZURhdGFQcm9taXNlLFxyXG5cdFx0XHRyZWRpcmVjdENoZWNrUHJvbWlzZSxcclxuXHRcdFx0c2hvdWxkR2V0T3JlcyAmJiBvcmVzUHJvbWlzZVxyXG5cdFx0XSxcclxuXHRcdG9yZXM6IHNob3VsZEdldE9yZXMsXHJcblx0XHRpc09wZW5lZDogaXNPcGVuZWRQcm9taXNlXHJcblx0fSk7XHJcblxyXG5cdGxvYWREaWFsb2dXaW4ub3BlbmVkLnRoZW4oaXNPcGVuZWRQcm9taXNlLnJlc29sdmUpO1xyXG5cclxuXHJcblx0JC53aGVuKFxyXG5cdFx0bG9hZFRhbGtQcm9taXNlLFxyXG5cdFx0dGVtcGxhdGVEYXRhUHJvbWlzZSxcclxuXHRcdHJlZGlyZWN0Q2hlY2tQcm9taXNlLFxyXG5cdFx0c2hvdWxkR2V0T3JlcyAmJiBvcmVzUHJvbWlzZVxyXG5cdCkudGhlbihcclxuXHRcdC8vIEFsbCBzdWNjZWRlZFxyXG5cdFx0ZnVuY3Rpb24odGFsa1dpa2l0ZXh0LCBiYW5uZXJzLCByZWRpcmVjdFRhcmdldCwgb3Jlc1ByZWRpY2l0aW9uICkge1xyXG5cdFx0XHR2YXIgcmVzdWx0ID0ge1xyXG5cdFx0XHRcdHN1Y2Nlc3M6IHRydWUsXHJcblx0XHRcdFx0dGFsa3BhZ2U6IHRhbGtQYWdlLFxyXG5cdFx0XHRcdHRhbGtXaWtpdGV4dDogdGFsa1dpa2l0ZXh0LFxyXG5cdFx0XHRcdGJhbm5lcnM6IGJhbm5lcnNcclxuXHRcdFx0fTtcclxuXHRcdFx0aWYgKHJlZGlyZWN0VGFyZ2V0KSB7XHJcblx0XHRcdFx0cmVzdWx0LnJlZGlyZWN0VGFyZ2V0ID0gcmVkaXJlY3RUYXJnZXQ7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKG9yZXNQcmVkaWNpdGlvbikge1xyXG5cdFx0XHRcdHJlc3VsdC5vcmVzUHJlZGljaXRpb24gPSBvcmVzUHJlZGljaXRpb247XHJcblx0XHRcdH1cclxuXHRcdFx0d2luZG93TWFuYWdlci5jbG9zZVdpbmRvdyhcImxvYWREaWFsb2dcIiwgcmVzdWx0KTtcclxuXHRcdFx0XHJcblx0XHR9XHJcblx0KTsgLy8gQW55IGZhaWx1cmVzIGFyZSBoYW5kbGVkIGJ5IHRoZSBsb2FkRGlhbG9nIHdpbmRvdyBpdHNlbGZcclxuXHJcblx0Ly8gT24gd2luZG93IGNsb3NlZCwgY2hlY2sgZGF0YSwgYW5kIHJlc29sdmUvcmVqZWN0IHNldHVwQ29tcGxldGVkUHJvbWlzZVxyXG5cdGxvYWREaWFsb2dXaW4uY2xvc2VkLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0aWYgKGRhdGEgJiYgZGF0YS5zdWNjZXNzKSB7XHJcblx0XHRcdC8vIEdvdCBldmVyeXRoaW5nIG5lZWRlZDogUmVzb2x2ZSBwcm9taXNlIHdpdGggdGhpcyBkYXRhXHJcblx0XHRcdHNldHVwQ29tcGxldGVkUHJvbWlzZS5yZXNvbHZlKGRhdGEpO1xyXG5cdFx0fSBlbHNlIGlmIChkYXRhICYmIGRhdGEuZXJyb3IpIHtcclxuXHRcdFx0Ly8gVGhlcmUgd2FzIGFuIGVycm9yOiBSZWplY3QgcHJvbWlzZSB3aXRoIGVycm9yIGNvZGUvaW5mb1xyXG5cdFx0XHRzZXR1cENvbXBsZXRlZFByb21pc2UucmVqZWN0KGRhdGEuZXJyb3IuY29kZSwgZGF0YS5lcnJvci5pbmZvKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdC8vIFdpbmRvdyBjbG9zZWQgYmVmb3JlIGNvbXBsZXRpb246IHJlc29sdmUgcHJvbWlzZSB3aXRob3V0IGFueSBkYXRhXHJcblx0XHRcdHNldHVwQ29tcGxldGVkUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xyXG5cdFx0fVxyXG5cdFx0Y2FjaGUuY2xlYXJJbnZhbGlkSXRlbXMoKTtcclxuXHR9KTtcclxuXHJcblx0Ly8gVEVTVElORyBwdXJwb3NlcyBvbmx5OiBsb2cgcGFzc2VkIGRhdGEgdG8gY29uc29sZVxyXG5cdHNldHVwQ29tcGxldGVkUHJvbWlzZS50aGVuKFxyXG5cdFx0ZGF0YSA9PiBjb25zb2xlLmxvZyhcInNldHVwIHdpbmRvdyBjbG9zZWRcIiwgZGF0YSksXHJcblx0XHQoY29kZSwgaW5mbykgPT4gY29uc29sZS5sb2coXCJzZXR1cCB3aW5kb3cgY2xvc2VkIHdpdGggZXJyb3JcIiwge2NvZGUsIGluZm99KVxyXG5cdCk7XHJcblxyXG5cdHJldHVybiBzZXR1cENvbXBsZXRlZFByb21pc2U7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzZXR1cFJhdGVyOyIsIi8vIFZhcmlvdXMgdXRpbGl0eSBmdW5jdGlvbnMgYW5kIG9iamVjdHMgdGhhdCBtaWdodCBiZSB1c2VkIGluIG11bHRpcGxlIHBsYWNlc1xyXG5cclxuaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuXHJcbnZhciBpc0FmdGVyRGF0ZSA9IGZ1bmN0aW9uKGRhdGVTdHJpbmcpIHtcclxuXHRyZXR1cm4gbmV3IERhdGUoZGF0ZVN0cmluZykgPCBuZXcgRGF0ZSgpO1xyXG59O1xyXG5cclxudmFyIEFQSSA9IG5ldyBtdy5BcGkoIHtcclxuXHRhamF4OiB7XHJcblx0XHRoZWFkZXJzOiB7IFxyXG5cdFx0XHRcIkFwaS1Vc2VyLUFnZW50XCI6IFwiUmF0ZXIvXCIgKyBjb25maWcuc2NyaXB0LnZlcnNpb24gKyBcclxuXHRcdFx0XHRcIiAoIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1VzZXI6RXZhZDM3L1JhdGVyIClcIlxyXG5cdFx0fVxyXG5cdH1cclxufSApO1xyXG4vKiAtLS0tLS0tLS0tIEFQSSBmb3IgT1JFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXHJcbkFQSS5nZXRPUkVTID0gZnVuY3Rpb24ocmV2aXNpb25JRCkge1xyXG5cdHJldHVybiAkLmdldChcImh0dHBzOi8vb3Jlcy53aWtpbWVkaWEub3JnL3YzL3Njb3Jlcy9lbndpa2k/bW9kZWxzPXdwMTAmcmV2aWRzPVwiK3JldmlzaW9uSUQpO1xyXG59O1xyXG4vKiAtLS0tLS0tLS0tIFJhdyB3aWtpdGV4dCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXHJcbkFQSS5nZXRSYXcgPSBmdW5jdGlvbihwYWdlKSB7XHJcblx0cmV0dXJuICQuZ2V0KFwiaHR0cHM6XCIgKyBjb25maWcubXcud2dTZXJ2ZXIgKyBtdy51dGlsLmdldFVybChwYWdlLCB7YWN0aW9uOlwicmF3XCJ9KSlcclxuXHRcdC50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdFx0aWYgKCAhZGF0YSApIHtcclxuXHRcdFx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdChcIm9rLWJ1dC1lbXB0eVwiKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gZGF0YTtcclxuXHRcdH0pO1xyXG59O1xyXG5cclxudmFyIG1ha2VFcnJvck1zZyA9IGZ1bmN0aW9uKGZpcnN0LCBzZWNvbmQpIHtcclxuXHR2YXIgY29kZSwgeGhyLCBtZXNzYWdlO1xyXG5cdGlmICggdHlwZW9mIGZpcnN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBzZWNvbmQgPT09IFwic3RyaW5nXCIgKSB7XHJcblx0XHQvLyBFcnJvcnMgZnJvbSAkLmdldCBiZWluZyByZWplY3RlZCAoT1JFUyAmIFJhdyB3aWtpdGV4dClcclxuXHRcdHZhciBlcnJvck9iaiA9IGZpcnN0LnJlc3BvbnNlSlNPTiAmJiBmaXJzdC5yZXNwb25zZUpTT04uZXJyb3I7XHJcblx0XHRpZiAoIGVycm9yT2JqICkge1xyXG5cdFx0XHQvLyBHb3QgYW4gYXBpLXNwZWNpZmljIGVycm9yIGNvZGUvbWVzc2FnZVxyXG5cdFx0XHRjb2RlID0gZXJyb3JPYmouY29kZTtcclxuXHRcdFx0bWVzc2FnZSA9IGVycm9yT2JqLm1lc3NhZ2U7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR4aHIgPSBmaXJzdDtcclxuXHRcdH1cclxuXHR9IGVsc2UgaWYgKCB0eXBlb2YgZmlyc3QgPT09IFwic3RyaW5nXCIgJiYgdHlwZW9mIHNlY29uZCA9PT0gXCJvYmplY3RcIiApIHtcclxuXHRcdC8vIEVycm9ycyBmcm9tIG13LkFwaSBvYmplY3RcclxuXHRcdHZhciBtd0Vycm9yT2JqID0gc2Vjb25kLmVycm9yO1xyXG5cdFx0aWYgKG13RXJyb3JPYmopIHtcclxuXHRcdFx0Ly8gR290IGFuIGFwaS1zcGVjaWZpYyBlcnJvciBjb2RlL21lc3NhZ2VcclxuXHRcdFx0Y29kZSA9IGVycm9yT2JqLmNvZGU7XHJcblx0XHRcdG1lc3NhZ2UgPSBlcnJvck9iai5pbmZvO1xyXG5cdFx0fSBlbHNlIGlmIChmaXJzdCA9PT0gXCJvay1idXQtZW1wdHlcIikge1xyXG5cdFx0XHRjb2RlID0gbnVsbDtcclxuXHRcdFx0bWVzc2FnZSA9IFwiR290IGFuIGVtcHR5IHJlc3BvbnNlIGZyb20gdGhlIHNlcnZlclwiO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0eGhyID0gc2Vjb25kICYmIHNlY29uZC54aHI7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRpZiAoY29kZSAmJiBtZXNzYWdlKSB7XHJcblx0XHRyZXR1cm4gYEFQSSBlcnJvciAke2NvZGV9OiAke21lc3NhZ2V9YDtcclxuXHR9IGVsc2UgaWYgKG1lc3NhZ2UpIHtcclxuXHRcdHJldHVybiBgQVBJIGVycm9yOiAke21lc3NhZ2V9YDtcclxuXHR9IGVsc2UgaWYgKHhocikge1xyXG5cdFx0cmV0dXJuIGBIVFRQIGVycm9yICR7eGhyLnN0YXR1c31gO1xyXG5cdH0gZWxzZSBpZiAoXHJcblx0XHR0eXBlb2YgZmlyc3QgPT09IFwic3RyaW5nXCIgJiYgZmlyc3QgIT09IFwiZXJyb3JcIiAmJlxyXG5cdFx0dHlwZW9mIHNlY29uZCA9PT0gXCJzdHJpbmdcIiAmJiBzZWNvbmQgIT09IFwiZXJyb3JcIlxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIGBFcnJvciAke2ZpcnN0fTogJHtzZWNvbmR9YDtcclxuXHR9IGVsc2UgaWYgKHR5cGVvZiBmaXJzdCA9PT0gXCJzdHJpbmdcIiAmJiBmaXJzdCAhPT0gXCJlcnJvclwiKSB7XHJcblx0XHRyZXR1cm4gYEVycm9yOiAke2ZpcnN0fWA7XHJcblx0fSBlbHNlIHtcclxuXHRcdHJldHVybiBcIlVua25vd24gQVBJIGVycm9yXCI7XHJcblx0fVxyXG59O1xyXG5cclxuZXhwb3J0IHtpc0FmdGVyRGF0ZSwgQVBJLCBtYWtlRXJyb3JNc2d9OyIsImltcG9ydCBMb2FkRGlhbG9nIGZyb20gXCIuL1dpbmRvd3MvTG9hZERpYWxvZ1wiO1xyXG5pbXBvcnQgTWFpbldpbmRvdyBmcm9tIFwiLi9XaW5kb3dzL01haW5XaW5kb3dcIjtcclxuXHJcbnZhciBmYWN0b3J5ID0gbmV3IE9PLkZhY3RvcnkoKTtcclxuXHJcbi8vIFJlZ2lzdGVyIHdpbmRvdyBjb25zdHJ1Y3RvcnMgd2l0aCB0aGUgZmFjdG9yeS5cclxuZmFjdG9yeS5yZWdpc3RlcihMb2FkRGlhbG9nKTtcclxuZmFjdG9yeS5yZWdpc3RlcihNYWluV2luZG93KTtcclxuXHJcbnZhciBtYW5hZ2VyID0gbmV3IE9PLnVpLldpbmRvd01hbmFnZXIoIHtcclxuXHRcImZhY3RvcnlcIjogZmFjdG9yeVxyXG59ICk7XHJcbiQoIGRvY3VtZW50LmJvZHkgKS5hcHBlbmQoIG1hbmFnZXIuJGVsZW1lbnQgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IG1hbmFnZXI7Il19
