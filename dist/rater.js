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

  this.parameterWidgets = template.parameters.filter(function (param) {
    return param.name !== "class" && param.name !== "importance";
  }).map(function (param) {
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
  this.parameter = parameter;
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
    value: this.parameter.value,
    // label: parameter.name + " =",
    // labelPosition: "before",
    options: this.allowedValues.map(function (val) {
      return {
        data: val,
        label: val
      };
    }),
    $element: $("<div style='width:calc(100% - 70px);margin-right:0;'>") // the 70px leaves room for buttons

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
  this.confirmButton = new OO.ui.ButtonWidget({
    icon: "check",
    framed: false,
    flags: "progressive",
    $element: $("<span style='margin-right:0'>")
  });
  this.confirmButton.$element.find("a span").first().css({
    "min-width": "unset",
    "width": "16px",
    "margin-right": 0
  });
  this.editLayoutControls = new OO.ui.HorizontalLayout({
    items: [this.input, this.confirmButton, this.deleteButton] //$element: $("<div style='width: 48%;margin:0;'>")

  }); // Hacks to make this HorizontalLayout go inside a FieldLayout

  this.editLayoutControls.getInputId = function () {
    return false;
  };

  this.editLayoutControls.isDisabled = function () {
    return false;
  };

  this.editLayoutControls.simulateLabelClick = function () {
    return true;
  };

  this.editLayout = new OO.ui.FieldLayout(this.editLayoutControls, {
    label: this.parameter.name + " =",
    align: "top",
    help: this.paramData.description && this.paramData.description.en || false,
    helpInline: true
  }).toggle();
  this.editLayout.$element.find("label.oo-ui-inline-help").css({
    "margin": "-10px 0 5px 10px"
  });
  this.fullLabel = new OO.ui.LabelWidget({
    label: this.parameter.name + " = " + this.parameter.value,
    $element: $("<label style='margin: 0;'>")
  });
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
    items: [this.fullLabel, this.editButton],
    $element: $("<span style='margin:0;width:unset;'>")
  });
  this.$element = $("<div>").css({
    "width": "unset",
    "display": "inline-block",
    "border": "1px solid #ddd",
    "border-radius": "10px",
    "padding-left": "10px",
    "margin": "0 8px 8px 0"
  }).append(this.readLayout.$element, this.editLayout.$element);
  this.editButton.connect(this, {
    "click": "onEditClick"
  });
  this.confirmButton.connect(this, {
    "click": "onConfirmClick"
  });
}

OO.inheritClass(ParameterWidget, OO.ui.Widget);

ParameterWidget.prototype.onEditClick = function () {
  this.readLayout.toggle(false);
  this.editLayout.toggle(true);
  this.input.focus();
};

ParameterWidget.prototype.onConfirmClick = function () {
  this.parameter.value = this.input.getValue();
  this.fullLabel.setLabel(this.parameter.name + " = " + this.parameter.value);
  this.readLayout.toggle(true);
  this.editLayout.toggle(false);
};

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
  }); // search box is where we really want focus to be
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJyYXRlci1zcmMvQXBwLmpzIiwicmF0ZXItc3JjL1RlbXBsYXRlLmpzIiwicmF0ZXItc3JjL1dpbmRvd3MvQ29tcG9uZW50cy9CYW5uZXJXaWRnZXQuanMiLCJyYXRlci1zcmMvV2luZG93cy9Db21wb25lbnRzL1BhcmFtZXRlcldpZGdldC5qcyIsInJhdGVyLXNyYy9XaW5kb3dzL0xvYWREaWFsb2cuanMiLCJyYXRlci1zcmMvV2luZG93cy9NYWluV2luZG93LmpzIiwicmF0ZXItc3JjL2F1dG9zdGFydC5qcyIsInJhdGVyLXNyYy9jYWNoZS5qcyIsInJhdGVyLXNyYy9jb25maWcuanMiLCJyYXRlci1zcmMvY3NzLmpzIiwicmF0ZXItc3JjL2dldEJhbm5lcnMuanMiLCJyYXRlci1zcmMvc2V0dXAuanMiLCJyYXRlci1zcmMvdXRpbC5qcyIsInJhdGVyLXNyYy93aW5kb3dNYW5hZ2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUVBLENBQUMsU0FBUyxHQUFULEdBQWU7QUFDZixFQUFBLE9BQU8sQ0FBQyxHQUFSLENBQVksOEJBQVo7QUFFQSxFQUFBLEVBQUUsQ0FBQyxJQUFILENBQVEsTUFBUixDQUFlLGVBQWY7O0FBRUEsTUFBTSxjQUFjLEdBQUcsU0FBakIsY0FBaUIsQ0FBQSxJQUFJLEVBQUk7QUFDOUIsUUFBSSxDQUFDLElBQUQsSUFBUyxDQUFDLElBQUksQ0FBQyxPQUFuQixFQUE0QjtBQUMzQjtBQUNBOztBQUVELDhCQUFjLFVBQWQsQ0FBeUIsTUFBekIsRUFBaUMsSUFBakM7QUFDQSxHQU5EOztBQVFBLE1BQU0sY0FBYyxHQUFHLFNBQWpCLGNBQWlCLENBQUMsSUFBRCxFQUFPLEtBQVA7QUFBQSxXQUFpQixFQUFFLENBQUMsRUFBSCxDQUFNLEtBQU4sQ0FDdkMsd0JBQWEsSUFBYixFQUFtQixL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QjtBQUNBLEdBTE0sTUFLQSxJQUFJLE9BQU8sS0FBUCxLQUFpQixRQUFqQixJQUE2QixLQUFLLEtBQUssT0FBM0MsRUFBb0Q7QUFDMUQsNEJBQWlCLEtBQWpCO0FBQ0EsR0FGTSxNQUVBO0FBQ04sV0FBTyxtQkFBUDtBQUNBO0FBQ0QsQ0EzQ0Q7Ozs7Ozs7Ozs7OztBQy9CQTs7QUFDQTs7OztBQUVBLElBQUksT0FBTyxHQUFHLElBQUksRUFBRSxDQUFDLE9BQVAsRUFBZCxDLENBRUE7O0FBQ0EsT0FBTyxDQUFDLFFBQVIsQ0FBaUIsc0JBQWpCO0FBQ0EsT0FBTyxDQUFDLFFBQVIsQ0FBaUIsc0JBQWpCO0FBRUEsSUFBSSxPQUFPLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLGFBQVYsQ0FBeUI7QUFDdEMsYUFBVztBQUQyQixDQUF6QixDQUFkO0FBR0EsQ0FBQyxDQUFFLFFBQVEsQ0FBQyxJQUFYLENBQUQsQ0FBbUIsTUFBbkIsQ0FBMkIsT0FBTyxDQUFDLFFBQW5DO2VBRWUsTyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImltcG9ydCBzZXR1cFJhdGVyIGZyb20gXCIuL3NldHVwXCI7XHJcbmltcG9ydCBhdXRvU3RhcnQgZnJvbSBcIi4vYXV0b3N0YXJ0XCI7XHJcbmltcG9ydCBkaWZmU3R5bGVzIGZyb20gXCIuL2Nzcy5qc1wiO1xyXG5pbXBvcnQgeyBtYWtlRXJyb3JNc2cgfSBmcm9tIFwiLi91dGlsXCI7XHJcbmltcG9ydCB3aW5kb3dNYW5hZ2VyIGZyb20gXCIuL3dpbmRvd01hbmFnZXJcIjtcclxuXHJcbihmdW5jdGlvbiBBcHAoKSB7XHJcblx0Y29uc29sZS5sb2coXCJSYXRlcidzIEFwcC5qcyBpcyBydW5uaW5nLi4uXCIpO1xyXG5cclxuXHRtdy51dGlsLmFkZENTUyhkaWZmU3R5bGVzKTtcclxuXHJcblx0Y29uc3Qgc2hvd01haW5XaW5kb3cgPSBkYXRhID0+IHtcclxuXHRcdGlmICghZGF0YSB8fCAhZGF0YS5zdWNjZXNzKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHR3aW5kb3dNYW5hZ2VyLm9wZW5XaW5kb3coXCJtYWluXCIsIGRhdGEpO1xyXG5cdH07XHJcblxyXG5cdGNvbnN0IHNob3dTZXR1cEVycm9yID0gKGNvZGUsIGpxeGhyKSA9PiBPTy51aS5hbGVydChcclxuXHRcdG1ha2VFcnJvck1zZyhjb2RlLCBqcXhociksXHR7XHJcblx0XHRcdHRpdGxlOiBcIlJhdGVyIGZhaWxlZCB0byBvcGVuXCJcclxuXHRcdH1cclxuXHQpO1xyXG5cclxuXHQvLyBJbnZvY2F0aW9uIGJ5IHBvcnRsZXQgbGluayBcclxuXHRtdy51dGlsLmFkZFBvcnRsZXRMaW5rKFxyXG5cdFx0XCJwLWNhY3Rpb25zXCIsXHJcblx0XHRcIiNcIixcclxuXHRcdFwiUmF0ZXJcIixcclxuXHRcdFwiY2EtcmF0ZXJcIixcclxuXHRcdFwiUmF0ZSBxdWFsaXR5IGFuZCBpbXBvcnRhbmNlXCIsXHJcblx0XHRcIjVcIlxyXG5cdCk7XHJcblx0JChcIiNjYS1yYXRlclwiKS5jbGljaygoKSA9PiBzZXR1cFJhdGVyKCkudGhlbihzaG93TWFpbldpbmRvdywgc2hvd1NldHVwRXJyb3IpICk7XHJcblxyXG5cdC8vIEludm9jYXRpb24gYnkgYXV0by1zdGFydCAoZG8gbm90IHNob3cgbWVzc2FnZSBvbiBlcnJvcilcclxuXHRhdXRvU3RhcnQoKS50aGVuKHNob3dNYWluV2luZG93KTtcclxufSkoKTsiLCJpbXBvcnQge0FQSSwgaXNBZnRlckRhdGV9IGZyb20gXCIuL3V0aWxcIjtcclxuaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuaW1wb3J0ICogYXMgY2FjaGUgZnJvbSBcIi4vY2FjaGVcIjtcclxuXHJcbi8qKiBUZW1wbGF0ZVxyXG4gKlxyXG4gKiBAY2xhc3NcclxuICogUmVwcmVzZW50cyB0aGUgd2lraXRleHQgb2YgdGVtcGxhdGUgdHJhbnNjbHVzaW9uLiBVc2VkIGJ5ICNwYXJzZVRlbXBsYXRlcy5cclxuICogQHByb3Age1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSB0ZW1wbGF0ZVxyXG4gKiBAcHJvcCB7U3RyaW5nfSB3aWtpdGV4dCBGdWxsIHdpa2l0ZXh0IG9mIHRoZSB0cmFuc2NsdXNpb25cclxuICogQHByb3Age09iamVjdFtdfSBwYXJhbWV0ZXJzIFBhcmFtZXRlcnMgdXNlZCBpbiB0aGUgdHJhbnNsY3VzaW9uLCBpbiBvcmRlciwgb2YgZm9ybTpcclxuXHR7XHJcblx0XHRuYW1lOiB7U3RyaW5nfE51bWJlcn0gcGFyYW1ldGVyIG5hbWUsIG9yIHBvc2l0aW9uIGZvciB1bm5hbWVkIHBhcmFtZXRlcnMsXHJcblx0XHR2YWx1ZToge1N0cmluZ30gV2lraXRleHQgcGFzc2VkIHRvIHRoZSBwYXJhbWV0ZXIgKHdoaXRlc3BhY2UgdHJpbW1lZCksXHJcblx0XHR3aWtpdGV4dDoge1N0cmluZ30gRnVsbCB3aWtpdGV4dCAoaW5jbHVkaW5nIGxlYWRpbmcgcGlwZSwgcGFyYW1ldGVyIG5hbWUvZXF1YWxzIHNpZ24gKGlmIGFwcGxpY2FibGUpLCB2YWx1ZSwgYW5kIGFueSB3aGl0ZXNwYWNlKVxyXG5cdH1cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB3aWtpdGV4dCBXaWtpdGV4dCBvZiBhIHRlbXBsYXRlIHRyYW5zY2x1c2lvbiwgc3RhcnRpbmcgd2l0aCAne3snIGFuZCBlbmRpbmcgd2l0aCAnfX0nLlxyXG4gKi9cclxudmFyIFRlbXBsYXRlID0gZnVuY3Rpb24od2lraXRleHQpIHtcclxuXHR0aGlzLndpa2l0ZXh0ID0gd2lraXRleHQ7XHJcblx0dGhpcy5wYXJhbWV0ZXJzID0gW107XHJcbn07XHJcblRlbXBsYXRlLnByb3RvdHlwZS5hZGRQYXJhbSA9IGZ1bmN0aW9uKG5hbWUsIHZhbCwgd2lraXRleHQpIHtcclxuXHR0aGlzLnBhcmFtZXRlcnMucHVzaCh7XHJcblx0XHRcIm5hbWVcIjogbmFtZSxcclxuXHRcdFwidmFsdWVcIjogdmFsLCBcclxuXHRcdFwid2lraXRleHRcIjogXCJ8XCIgKyB3aWtpdGV4dFxyXG5cdH0pO1xyXG59O1xyXG4vKipcclxuICogR2V0IGEgcGFyYW1ldGVyIGRhdGEgYnkgcGFyYW1ldGVyIG5hbWVcclxuICovIFxyXG5UZW1wbGF0ZS5wcm90b3R5cGUuZ2V0UGFyYW0gPSBmdW5jdGlvbihwYXJhbU5hbWUpIHtcclxuXHRyZXR1cm4gdGhpcy5wYXJhbWV0ZXJzLmZpbmQoZnVuY3Rpb24ocCkgeyByZXR1cm4gcC5uYW1lID09IHBhcmFtTmFtZTsgfSk7XHJcbn07XHJcblRlbXBsYXRlLnByb3RvdHlwZS5zZXROYW1lID0gZnVuY3Rpb24obmFtZSkge1xyXG5cdHRoaXMubmFtZSA9IG5hbWUudHJpbSgpO1xyXG59O1xyXG5UZW1wbGF0ZS5wcm90b3R5cGUuZ2V0VGl0bGUgPSBmdW5jdGlvbigpIHtcclxuXHRyZXR1cm4gbXcuVGl0bGUubmV3RnJvbVRleHQoXCJUZW1wbGF0ZTpcIiArIHRoaXMubmFtZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogcGFyc2VUZW1wbGF0ZXNcclxuICpcclxuICogUGFyc2VzIHRlbXBsYXRlcyBmcm9tIHdpa2l0ZXh0LlxyXG4gKiBCYXNlZCBvbiBTRDAwMDEncyB2ZXJzaW9uIGF0IDxodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Vc2VyOlNEMDAwMS9wYXJzZUFsbFRlbXBsYXRlcy5qcz4uXHJcbiAqIFJldHVybnMgYW4gYXJyYXkgY29udGFpbmluZyB0aGUgdGVtcGxhdGUgZGV0YWlsczpcclxuICogIHZhciB0ZW1wbGF0ZXMgPSBwYXJzZVRlbXBsYXRlcyhcIkhlbGxvIHt7Zm9vIHxCYXJ8YmF6PXF1eCB8Mj1sb3JlbWlwc3VtfDM9fX0gd29ybGRcIik7XHJcbiAqICBjb25zb2xlLmxvZyh0ZW1wbGF0ZXNbMF0pOyAvLyAtLT4gb2JqZWN0XHJcblx0e1xyXG5cdFx0bmFtZTogXCJmb29cIixcclxuXHRcdHdpa2l0ZXh0Olwie3tmb28gfEJhcnxiYXo9cXV4IHwgMiA9IGxvcmVtaXBzdW0gIHwzPX19XCIsXHJcblx0XHRwYXJhbWV0ZXJzOiBbXHJcblx0XHRcdHtcclxuXHRcdFx0XHRuYW1lOiAxLFxyXG5cdFx0XHRcdHZhbHVlOiAnQmFyJyxcclxuXHRcdFx0XHR3aWtpdGV4dDogJ3xCYXInXHJcblx0XHRcdH0sXHJcblx0XHRcdHtcclxuXHRcdFx0XHRuYW1lOiAnYmF6JyxcclxuXHRcdFx0XHR2YWx1ZTogJ3F1eCcsXHJcblx0XHRcdFx0d2lraXRleHQ6ICd8YmF6PXF1eCAnXHJcblx0XHRcdH0sXHJcblx0XHRcdHtcclxuXHRcdFx0XHRuYW1lOiAnMicsXHJcblx0XHRcdFx0dmFsdWU6ICdsb3JlbWlwc3VtJyxcclxuXHRcdFx0XHR3aWtpdGV4dDogJ3wgMiA9IGxvcmVtaXBzdW0gICdcclxuXHRcdFx0fSxcclxuXHRcdFx0e1xyXG5cdFx0XHRcdG5hbWU6ICczJyxcclxuXHRcdFx0XHR2YWx1ZTogJycsXHJcblx0XHRcdFx0d2lraXRleHQ6ICd8Mz0nXHJcblx0XHRcdH1cclxuXHRcdF0sXHJcblx0XHRnZXRQYXJhbTogZnVuY3Rpb24ocGFyYW1OYW1lKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnBhcmFtZXRlcnMuZmluZChmdW5jdGlvbihwKSB7IHJldHVybiBwLm5hbWUgPT0gcGFyYW1OYW1lOyB9KTtcclxuXHRcdH1cclxuXHR9XHJcbiAqICAgIFxyXG4gKiBcclxuICogQHBhcmFtIHtTdHJpbmd9IHdpa2l0ZXh0XHJcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gcmVjdXJzaXZlIFNldCB0byBgdHJ1ZWAgdG8gYWxzbyBwYXJzZSB0ZW1wbGF0ZXMgdGhhdCBvY2N1ciB3aXRoaW4gb3RoZXIgdGVtcGxhdGVzLFxyXG4gKiAgcmF0aGVyIHRoYW4ganVzdCB0b3AtbGV2ZWwgdGVtcGxhdGVzLiBcclxuICogQHJldHVybiB7VGVtcGxhdGVbXX0gdGVtcGxhdGVzXHJcbiovXHJcbnZhciBwYXJzZVRlbXBsYXRlcyA9IGZ1bmN0aW9uKHdpa2l0ZXh0LCByZWN1cnNpdmUpIHsgLyogZXNsaW50LWRpc2FibGUgbm8tY29udHJvbC1yZWdleCAqL1xyXG5cdGlmICghd2lraXRleHQpIHtcclxuXHRcdHJldHVybiBbXTtcclxuXHR9XHJcblx0dmFyIHN0clJlcGxhY2VBdCA9IGZ1bmN0aW9uKHN0cmluZywgaW5kZXgsIGNoYXIpIHtcclxuXHRcdHJldHVybiBzdHJpbmcuc2xpY2UoMCxpbmRleCkgKyBjaGFyICsgc3RyaW5nLnNsaWNlKGluZGV4ICsgMSk7XHJcblx0fTtcclxuXHJcblx0dmFyIHJlc3VsdCA9IFtdO1xyXG5cdFxyXG5cdHZhciBwcm9jZXNzVGVtcGxhdGVUZXh0ID0gZnVuY3Rpb24gKHN0YXJ0SWR4LCBlbmRJZHgpIHtcclxuXHRcdHZhciB0ZXh0ID0gd2lraXRleHQuc2xpY2Uoc3RhcnRJZHgsIGVuZElkeCk7XHJcblxyXG5cdFx0dmFyIHRlbXBsYXRlID0gbmV3IFRlbXBsYXRlKFwie3tcIiArIHRleHQucmVwbGFjZSgvXFx4MDEvZyxcInxcIikgKyBcIn19XCIpO1xyXG5cdFx0XHJcblx0XHQvLyBzd2FwIG91dCBwaXBlIGluIGxpbmtzIHdpdGggXFx4MDEgY29udHJvbCBjaGFyYWN0ZXJcclxuXHRcdC8vIFtbRmlsZTogXV0gY2FuIGhhdmUgbXVsdGlwbGUgcGlwZXMsIHNvIG1pZ2h0IG5lZWQgbXVsdGlwbGUgcGFzc2VzXHJcblx0XHR3aGlsZSAoIC8oXFxbXFxbW15cXF1dKj8pXFx8KC4qP1xcXVxcXSkvZy50ZXN0KHRleHQpICkge1xyXG5cdFx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFxbXFxbW15cXF1dKj8pXFx8KC4qP1xcXVxcXSkvZywgXCIkMVxceDAxJDJcIik7XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGNodW5rcyA9IHRleHQuc3BsaXQoXCJ8XCIpLm1hcChmdW5jdGlvbihjaHVuaykge1xyXG5cdFx0XHQvLyBjaGFuZ2UgJ1xceDAxJyBjb250cm9sIGNoYXJhY3RlcnMgYmFjayB0byBwaXBlc1xyXG5cdFx0XHRyZXR1cm4gY2h1bmsucmVwbGFjZSgvXFx4MDEvZyxcInxcIik7IFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGVtcGxhdGUuc2V0TmFtZShjaHVua3NbMF0pO1xyXG5cdFx0XHJcblx0XHR2YXIgcGFyYW1ldGVyQ2h1bmtzID0gY2h1bmtzLnNsaWNlKDEpO1xyXG5cclxuXHRcdHZhciB1bm5hbWVkSWR4ID0gMTtcclxuXHRcdHBhcmFtZXRlckNodW5rcy5mb3JFYWNoKGZ1bmN0aW9uKGNodW5rKSB7XHJcblx0XHRcdHZhciBpbmRleE9mRXF1YWxUbyA9IGNodW5rLmluZGV4T2YoXCI9XCIpO1xyXG5cdFx0XHR2YXIgaW5kZXhPZk9wZW5CcmFjZXMgPSBjaHVuay5pbmRleE9mKFwie3tcIik7XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgaXNXaXRob3V0RXF1YWxzID0gIWNodW5rLmluY2x1ZGVzKFwiPVwiKTtcclxuXHRcdFx0dmFyIGhhc0JyYWNlc0JlZm9yZUVxdWFscyA9IGNodW5rLmluY2x1ZGVzKFwie3tcIikgJiYgaW5kZXhPZk9wZW5CcmFjZXMgPCBpbmRleE9mRXF1YWxUbztcdFxyXG5cdFx0XHR2YXIgaXNVbm5hbWVkUGFyYW0gPSAoIGlzV2l0aG91dEVxdWFscyB8fCBoYXNCcmFjZXNCZWZvcmVFcXVhbHMgKTtcclxuXHRcdFx0XHJcblx0XHRcdHZhciBwTmFtZSwgcE51bSwgcFZhbDtcclxuXHRcdFx0aWYgKCBpc1VubmFtZWRQYXJhbSApIHtcclxuXHRcdFx0XHQvLyBHZXQgdGhlIG5leHQgbnVtYmVyIG5vdCBhbHJlYWR5IHVzZWQgYnkgZWl0aGVyIGFuIHVubmFtZWQgcGFyYW1ldGVyLCBvciBieSBhXHJcblx0XHRcdFx0Ly8gbmFtZWQgcGFyYW1ldGVyIGxpa2UgYHwxPXZhbGBcclxuXHRcdFx0XHR3aGlsZSAoIHRlbXBsYXRlLmdldFBhcmFtKHVubmFtZWRJZHgpICkge1xyXG5cdFx0XHRcdFx0dW5uYW1lZElkeCsrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRwTnVtID0gdW5uYW1lZElkeDtcclxuXHRcdFx0XHRwVmFsID0gY2h1bmsudHJpbSgpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHBOYW1lID0gY2h1bmsuc2xpY2UoMCwgaW5kZXhPZkVxdWFsVG8pLnRyaW0oKTtcclxuXHRcdFx0XHRwVmFsID0gY2h1bmsuc2xpY2UoaW5kZXhPZkVxdWFsVG8gKyAxKS50cmltKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0dGVtcGxhdGUuYWRkUGFyYW0ocE5hbWUgfHwgcE51bSwgcFZhbCwgY2h1bmspO1xyXG5cdFx0fSk7XHJcblx0XHRcclxuXHRcdHJlc3VsdC5wdXNoKHRlbXBsYXRlKTtcclxuXHR9O1xyXG5cclxuXHRcclxuXHR2YXIgbiA9IHdpa2l0ZXh0Lmxlbmd0aDtcclxuXHRcclxuXHQvLyBudW1iZXIgb2YgdW5jbG9zZWQgYnJhY2VzXHJcblx0dmFyIG51bVVuY2xvc2VkID0gMDtcclxuXHJcblx0Ly8gYXJlIHdlIGluc2lkZSBhIGNvbW1lbnQgb3IgYmV0d2VlbiBub3dpa2kgdGFncz9cclxuXHR2YXIgaW5Db21tZW50ID0gZmFsc2U7XHJcblx0dmFyIGluTm93aWtpID0gZmFsc2U7XHJcblxyXG5cdHZhciBzdGFydElkeCwgZW5kSWR4O1xyXG5cdFxyXG5cdGZvciAodmFyIGk9MDsgaTxuOyBpKyspIHtcclxuXHRcdFxyXG5cdFx0aWYgKCAhaW5Db21tZW50ICYmICFpbk5vd2lraSApIHtcclxuXHRcdFx0XHJcblx0XHRcdGlmICh3aWtpdGV4dFtpXSA9PT0gXCJ7XCIgJiYgd2lraXRleHRbaSsxXSA9PT0gXCJ7XCIpIHtcclxuXHRcdFx0XHRpZiAobnVtVW5jbG9zZWQgPT09IDApIHtcclxuXHRcdFx0XHRcdHN0YXJ0SWR4ID0gaSsyO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRudW1VbmNsb3NlZCArPSAyO1xyXG5cdFx0XHRcdGkrKztcclxuXHRcdFx0fSBlbHNlIGlmICh3aWtpdGV4dFtpXSA9PT0gXCJ9XCIgJiYgd2lraXRleHRbaSsxXSA9PT0gXCJ9XCIpIHtcclxuXHRcdFx0XHRpZiAobnVtVW5jbG9zZWQgPT09IDIpIHtcclxuXHRcdFx0XHRcdGVuZElkeCA9IGk7XHJcblx0XHRcdFx0XHRwcm9jZXNzVGVtcGxhdGVUZXh0KHN0YXJ0SWR4LCBlbmRJZHgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRudW1VbmNsb3NlZCAtPSAyO1xyXG5cdFx0XHRcdGkrKztcclxuXHRcdFx0fSBlbHNlIGlmICh3aWtpdGV4dFtpXSA9PT0gXCJ8XCIgJiYgbnVtVW5jbG9zZWQgPiAyKSB7XHJcblx0XHRcdFx0Ly8gc3dhcCBvdXQgcGlwZXMgaW4gbmVzdGVkIHRlbXBsYXRlcyB3aXRoIFxceDAxIGNoYXJhY3RlclxyXG5cdFx0XHRcdHdpa2l0ZXh0ID0gc3RyUmVwbGFjZUF0KHdpa2l0ZXh0LCBpLFwiXFx4MDFcIik7XHJcblx0XHRcdH0gZWxzZSBpZiAoIC9ePCEtLS8udGVzdCh3aWtpdGV4dC5zbGljZShpLCBpICsgNCkpICkge1xyXG5cdFx0XHRcdGluQ29tbWVudCA9IHRydWU7XHJcblx0XHRcdFx0aSArPSAzO1xyXG5cdFx0XHR9IGVsc2UgaWYgKCAvXjxub3dpa2kgPz4vLnRlc3Qod2lraXRleHQuc2xpY2UoaSwgaSArIDkpKSApIHtcclxuXHRcdFx0XHRpbk5vd2lraSA9IHRydWU7XHJcblx0XHRcdFx0aSArPSA3O1xyXG5cdFx0XHR9IFxyXG5cclxuXHRcdH0gZWxzZSB7IC8vIHdlIGFyZSBpbiBhIGNvbW1lbnQgb3Igbm93aWtpXHJcblx0XHRcdGlmICh3aWtpdGV4dFtpXSA9PT0gXCJ8XCIpIHtcclxuXHRcdFx0XHQvLyBzd2FwIG91dCBwaXBlcyB3aXRoIFxceDAxIGNoYXJhY3RlclxyXG5cdFx0XHRcdHdpa2l0ZXh0ID0gc3RyUmVwbGFjZUF0KHdpa2l0ZXh0LCBpLFwiXFx4MDFcIik7XHJcblx0XHRcdH0gZWxzZSBpZiAoL14tLT4vLnRlc3Qod2lraXRleHQuc2xpY2UoaSwgaSArIDMpKSkge1xyXG5cdFx0XHRcdGluQ29tbWVudCA9IGZhbHNlO1xyXG5cdFx0XHRcdGkgKz0gMjtcclxuXHRcdFx0fSBlbHNlIGlmICgvXjxcXC9ub3dpa2kgPz4vLnRlc3Qod2lraXRleHQuc2xpY2UoaSwgaSArIDEwKSkpIHtcclxuXHRcdFx0XHRpbk5vd2lraSA9IGZhbHNlO1xyXG5cdFx0XHRcdGkgKz0gODtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHR9XHJcblx0XHJcblx0aWYgKCByZWN1cnNpdmUgKSB7XHJcblx0XHR2YXIgc3VidGVtcGxhdGVzID0gcmVzdWx0Lm1hcChmdW5jdGlvbih0ZW1wbGF0ZSkge1xyXG5cdFx0XHRyZXR1cm4gdGVtcGxhdGUud2lraXRleHQuc2xpY2UoMiwtMik7XHJcblx0XHR9KVxyXG5cdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKHRlbXBsYXRlV2lraXRleHQpIHtcclxuXHRcdFx0XHRyZXR1cm4gL1xce1xcey4qXFx9XFx9Ly50ZXN0KHRlbXBsYXRlV2lraXRleHQpO1xyXG5cdFx0XHR9KVxyXG5cdFx0XHQubWFwKGZ1bmN0aW9uKHRlbXBsYXRlV2lraXRleHQpIHtcclxuXHRcdFx0XHRyZXR1cm4gcGFyc2VUZW1wbGF0ZXModGVtcGxhdGVXaWtpdGV4dCwgdHJ1ZSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHJcblx0XHRyZXR1cm4gcmVzdWx0LmNvbmNhdC5hcHBseShyZXN1bHQsIHN1YnRlbXBsYXRlcyk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gcmVzdWx0OyBcclxufTsgLyogZXNsaW50LWVuYWJsZSBuby1jb250cm9sLXJlZ2V4ICovXHJcblxyXG4vKipcclxuICogQHBhcmFtIHtUZW1wbGF0ZXxUZW1wbGF0ZVtdfSB0ZW1wbGF0ZXNcclxuICogQHJldHVybiB7UHJvbWlzZTxUZW1wbGF0ZVtdPn1cclxuICovXHJcbnZhciBnZXRXaXRoUmVkaXJlY3RUbyA9IGZ1bmN0aW9uKHRlbXBsYXRlcykge1xyXG5cdHZhciB0ZW1wbGF0ZXNBcnJheSA9IEFycmF5LmlzQXJyYXkodGVtcGxhdGVzKSA/IHRlbXBsYXRlcyA6IFt0ZW1wbGF0ZXNdO1xyXG5cdGlmICh0ZW1wbGF0ZXNBcnJheS5sZW5ndGggPT09IDApIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVzb2x2ZShbXSk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gQVBJLmdldCh7XHJcblx0XHRcImFjdGlvblwiOiBcInF1ZXJ5XCIsXHJcblx0XHRcImZvcm1hdFwiOiBcImpzb25cIixcclxuXHRcdFwidGl0bGVzXCI6IHRlbXBsYXRlc0FycmF5Lm1hcCh0ZW1wbGF0ZSA9PiB0ZW1wbGF0ZS5nZXRUaXRsZSgpLmdldFByZWZpeGVkVGV4dCgpKSxcclxuXHRcdFwicmVkaXJlY3RzXCI6IDFcclxuXHR9KS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0aWYgKCAhcmVzdWx0IHx8ICFyZXN1bHQucXVlcnkgKSB7XHJcblx0XHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KFwiRW1wdHkgcmVzcG9uc2VcIik7XHJcblx0XHR9XHJcblx0XHRpZiAoIHJlc3VsdC5xdWVyeS5yZWRpcmVjdHMgKSB7XHJcblx0XHRcdHJlc3VsdC5xdWVyeS5yZWRpcmVjdHMuZm9yRWFjaChmdW5jdGlvbihyZWRpcmVjdCkge1xyXG5cdFx0XHRcdHZhciBpID0gdGVtcGxhdGVzQXJyYXkuZmluZEluZGV4KHRlbXBsYXRlID0+IHRlbXBsYXRlLmdldFRpdGxlKCkuZ2V0UHJlZml4ZWRUZXh0KCkgPT09IHJlZGlyZWN0LmZyb20pO1xyXG5cdFx0XHRcdGlmIChpICE9PSAtMSkge1xyXG5cdFx0XHRcdFx0dGVtcGxhdGVzQXJyYXlbaV0ucmVkaXJlY3RzVG8gPSBtdy5UaXRsZS5uZXdGcm9tVGV4dChyZWRpcmVjdC50byk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0ZW1wbGF0ZXNBcnJheTtcclxuXHR9KTtcclxufTtcclxuXHJcblRlbXBsYXRlLnByb3RvdHlwZS5nZXREYXRhRm9yUGFyYW0gPSBmdW5jdGlvbihrZXksIHBhcmFOYW1lKSB7XHJcblx0aWYgKCAhdGhpcy5wYXJhbURhdGEgKSB7XHJcblx0XHRyZXR1cm4gbnVsbDtcclxuXHR9XHJcblx0Ly8gSWYgYWxpYXMsIHN3aXRjaCBmcm9tIGFsaWFzIHRvIHByZWZlcnJlZCBwYXJhbWV0ZXIgbmFtZVxyXG5cdHZhciBwYXJhID0gdGhpcy5wYXJhbUFsaWFzZXNbcGFyYU5hbWVdIHx8IHBhcmFOYW1lO1x0XHJcblx0aWYgKCAhdGhpcy5wYXJhbURhdGFbcGFyYV0gKSB7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdFxyXG5cdHZhciBkYXRhID0gdGhpcy5wYXJhbURhdGFbcGFyYV1ba2V5XTtcclxuXHQvLyBEYXRhIG1pZ2h0IGFjdHVhbGx5IGJlIGFuIG9iamVjdCB3aXRoIGtleSBcImVuXCJcclxuXHRpZiAoIGRhdGEgJiYgZGF0YS5lbiAmJiAhQXJyYXkuaXNBcnJheShkYXRhKSApIHtcclxuXHRcdHJldHVybiBkYXRhLmVuO1xyXG5cdH1cclxuXHRyZXR1cm4gZGF0YTtcclxufTtcclxuXHJcblRlbXBsYXRlLnByb3RvdHlwZS5zZXRQYXJhbURhdGFBbmRTdWdnZXN0aW9ucyA9IGZ1bmN0aW9uKCkge1xyXG5cdHZhciBzZWxmID0gdGhpcztcclxuXHR2YXIgcGFyYW1EYXRhU2V0ID0gJC5EZWZlcnJlZCgpO1xyXG5cdFxyXG5cdGlmICggc2VsZi5wYXJhbURhdGEgKSB7IHJldHVybiBwYXJhbURhdGFTZXQucmVzb2x2ZSgpOyB9XHJcbiAgICBcclxuXHR2YXIgcHJlZml4ZWRUZXh0ID0gc2VsZi5yZWRpcmVjdHNUb1xyXG5cdFx0PyBzZWxmLnJlZGlyZWN0c1RvLmdldFByZWZpeGVkVGV4dCgpXHJcblx0XHQ6IHNlbGYuZ2V0VGl0bGUoKS5nZXRQcmVmaXhlZFRleHQoKTtcclxuXHJcblx0dmFyIGNhY2hlZEluZm8gPSBjYWNoZS5yZWFkKHByZWZpeGVkVGV4dCArIFwiLXBhcmFtc1wiKTtcclxuXHRcclxuXHRpZiAoXHJcblx0XHRjYWNoZWRJbmZvICYmXHJcblx0XHRjYWNoZWRJbmZvLnZhbHVlICYmXHJcblx0XHRjYWNoZWRJbmZvLnN0YWxlRGF0ZSAmJlxyXG5cdFx0Y2FjaGVkSW5mby52YWx1ZS5wYXJhbURhdGEgIT0gbnVsbCAmJlxyXG5cdFx0Y2FjaGVkSW5mby52YWx1ZS5wYXJhbWV0ZXJTdWdnZXN0aW9ucyAhPSBudWxsICYmXHJcblx0XHRjYWNoZWRJbmZvLnZhbHVlLnBhcmFtQWxpYXNlcyAhPSBudWxsXHJcblx0KSB7XHJcblx0XHRzZWxmLm5vdGVtcGxhdGVkYXRhID0gY2FjaGVkSW5mby52YWx1ZS5ub3RlbXBsYXRlZGF0YTtcclxuXHRcdHNlbGYucGFyYW1EYXRhID0gY2FjaGVkSW5mby52YWx1ZS5wYXJhbURhdGE7XHJcblx0XHRzZWxmLnBhcmFtZXRlclN1Z2dlc3Rpb25zID0gY2FjaGVkSW5mby52YWx1ZS5wYXJhbWV0ZXJTdWdnZXN0aW9ucztcclxuXHRcdHNlbGYucGFyYW1BbGlhc2VzID0gY2FjaGVkSW5mby52YWx1ZS5wYXJhbUFsaWFzZXM7XHJcblx0XHRcclxuXHRcdHBhcmFtRGF0YVNldC5yZXNvbHZlKCk7XHJcblx0XHRpZiAoICFpc0FmdGVyRGF0ZShjYWNoZWRJbmZvLnN0YWxlRGF0ZSkgKSB7XHJcblx0XHRcdC8vIEp1c3QgdXNlIHRoZSBjYWNoZWQgZGF0YVxyXG5cdFx0XHRyZXR1cm4gcGFyYW1EYXRhU2V0O1xyXG5cdFx0fSAvLyBlbHNlOiBVc2UgdGhlIGNhY2hlIGRhdGEgZm9yIG5vdywgYnV0IGFsc28gZmV0Y2ggbmV3IGRhdGEgZnJvbSBBUElcclxuXHR9XHJcblx0XHJcblx0QVBJLmdldCh7XHJcblx0XHRhY3Rpb246IFwidGVtcGxhdGVkYXRhXCIsXHJcblx0XHR0aXRsZXM6IHByZWZpeGVkVGV4dCxcclxuXHRcdHJlZGlyZWN0czogMSxcclxuXHRcdGluY2x1ZGVNaXNzaW5nVGl0bGVzOiAxXHJcblx0fSlcclxuXHRcdC50aGVuKFxyXG5cdFx0XHRmdW5jdGlvbihyZXNwb25zZSkgeyByZXR1cm4gcmVzcG9uc2U7IH0sXHJcblx0XHRcdGZ1bmN0aW9uKC8qZXJyb3IqLykgeyByZXR1cm4gbnVsbDsgfSAvLyBJZ25vcmUgZXJyb3JzLCB3aWxsIHVzZSBkZWZhdWx0IGRhdGFcclxuXHRcdClcclxuXHRcdC50aGVuKCBmdW5jdGlvbihyZXN1bHQpIHtcclxuXHRcdC8vIEZpZ3VyZSBvdXQgcGFnZSBpZCAoYmVhY3VzZSBhY3Rpb249dGVtcGxhdGVkYXRhIGRvZXNuJ3QgaGF2ZSBhbiBpbmRleHBhZ2VpZHMgb3B0aW9uKVxyXG5cdFx0XHR2YXIgaWQgPSByZXN1bHQgJiYgJC5tYXAocmVzdWx0LnBhZ2VzLCBmdW5jdGlvbiggX3ZhbHVlLCBrZXkgKSB7IHJldHVybiBrZXk7IH0pO1xyXG5cdFx0XHJcblx0XHRcdGlmICggIXJlc3VsdCB8fCAhcmVzdWx0LnBhZ2VzW2lkXSB8fCByZXN1bHQucGFnZXNbaWRdLm5vdGVtcGxhdGVkYXRhIHx8ICFyZXN1bHQucGFnZXNbaWRdLnBhcmFtcyApIHtcclxuXHRcdFx0Ly8gTm8gVGVtcGxhdGVEYXRhLCBzbyB1c2UgZGVmYXVsdHMgKGd1ZXNzZXMpXHJcblx0XHRcdFx0c2VsZi5ub3RlbXBsYXRlZGF0YSA9IHRydWU7XHJcblx0XHRcdFx0c2VsZi50ZW1wbGF0ZWRhdGFBcGlFcnJvciA9ICFyZXN1bHQ7XHJcblx0XHRcdFx0c2VsZi5wYXJhbURhdGEgPSBjb25maWcuZGVmYXVsdFBhcmFtZXRlckRhdGE7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0c2VsZi5wYXJhbURhdGEgPSByZXN1bHQucGFnZXNbaWRdLnBhcmFtcztcclxuXHRcdFx0fVxyXG4gICAgICAgIFxyXG5cdFx0XHRzZWxmLnBhcmFtQWxpYXNlcyA9IHt9O1xyXG5cdFx0XHQkLmVhY2goc2VsZi5wYXJhbURhdGEsIGZ1bmN0aW9uKHBhcmFOYW1lLCBwYXJhRGF0YSkge1xyXG5cdFx0XHRcdC8vIEV4dHJhY3QgYWxpYXNlcyBmb3IgZWFzaWVyIHJlZmVyZW5jZSBsYXRlciBvblxyXG5cdFx0XHRcdGlmICggcGFyYURhdGEuYWxpYXNlcyAmJiBwYXJhRGF0YS5hbGlhc2VzLmxlbmd0aCApIHtcclxuXHRcdFx0XHRcdHBhcmFEYXRhLmFsaWFzZXMuZm9yRWFjaChmdW5jdGlvbihhbGlhcyl7XHJcblx0XHRcdFx0XHRcdHNlbGYucGFyYW1BbGlhc2VzW2FsaWFzXSA9IHBhcmFOYW1lO1xyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIEV4dHJhY3QgYWxsb3dlZCB2YWx1ZXMgYXJyYXkgZnJvbSBkZXNjcmlwdGlvblxyXG5cdFx0XHRcdGlmICggcGFyYURhdGEuZGVzY3JpcHRpb24gJiYgL1xcWy4qJy4rPycuKj9cXF0vLnRlc3QocGFyYURhdGEuZGVzY3JpcHRpb24uZW4pICkge1xyXG5cdFx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdFx0dmFyIGFsbG93ZWRWYWxzID0gSlNPTi5wYXJzZShcclxuXHRcdFx0XHRcdFx0XHRwYXJhRGF0YS5kZXNjcmlwdGlvbi5lblxyXG5cdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoL14uKlxcWy8sXCJbXCIpXHJcblx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvXCIvZywgXCJcXFxcXFxcIlwiKVxyXG5cdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoLycvZywgXCJcXFwiXCIpXHJcblx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvLFxccypdLywgXCJdXCIpXHJcblx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvXS4qJC8sIFwiXVwiKVxyXG5cdFx0XHRcdFx0XHQpO1xyXG5cdFx0XHRcdFx0XHRzZWxmLnBhcmFtRGF0YVtwYXJhTmFtZV0uYWxsb3dlZFZhbHVlcyA9IGFsbG93ZWRWYWxzO1xyXG5cdFx0XHRcdFx0fSBjYXRjaChlKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUud2FybihcIltSYXRlcl0gQ291bGQgbm90IHBhcnNlIGFsbG93ZWQgdmFsdWVzIGluIGRlc2NyaXB0aW9uOlxcbiAgXCIrXHJcblx0XHRcdFx0XHRwYXJhRGF0YS5kZXNjcmlwdGlvbi5lbiArIFwiXFxuIENoZWNrIFRlbXBsYXRlRGF0YSBmb3IgcGFyYW1ldGVyIHxcIiArIHBhcmFOYW1lICtcclxuXHRcdFx0XHRcdFwiPSBpbiBcIiArIHNlbGYuZ2V0VGl0bGUoKS5nZXRQcmVmaXhlZFRleHQoKSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIE1ha2Ugc3VyZSByZXF1aXJlZC9zdWdnZXN0ZWQgcGFyYW1ldGVycyBhcmUgcHJlc2VudFxyXG5cdFx0XHRcdGlmICggKHBhcmFEYXRhLnJlcXVpcmVkIHx8IHBhcmFEYXRhLnN1Z2dlc3RlZCkgJiYgIXNlbGYuZ2V0UGFyYW0ocGFyYU5hbWUpICkge1xyXG5cdFx0XHRcdC8vIENoZWNrIGlmIGFscmVhZHkgcHJlc2VudCBpbiBhbiBhbGlhcywgaWYgYW55XHJcblx0XHRcdFx0XHRpZiAoIHBhcmFEYXRhLmFsaWFzZXMubGVuZ3RoICkge1xyXG5cdFx0XHRcdFx0XHR2YXIgYWxpYXNlcyA9IHNlbGYucGFyYW1ldGVycy5maWx0ZXIocCA9PiB7XHJcblx0XHRcdFx0XHRcdFx0dmFyIGlzQWxpYXMgPSBwYXJhRGF0YS5hbGlhc2VzLmluY2x1ZGVzKHAubmFtZSk7XHJcblx0XHRcdFx0XHRcdFx0dmFyIGlzRW1wdHkgPSAhcC52YWw7XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGlzQWxpYXMgJiYgIWlzRW1wdHk7XHJcblx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0XHRpZiAoIGFsaWFzZXMubGVuZ3RoICkge1xyXG5cdFx0XHRcdFx0XHQvLyBBdCBsZWFzdCBvbmUgbm9uLWVtcHR5IGFsaWFzLCBzbyBkbyBub3RoaW5nXHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvLyBObyBub24tZW1wdHkgYWxpYXNlcywgc28gc2V0IHBhcmFtZXRlciB0byBlaXRoZXIgdGhlIGF1dG92YXVsZSwgb3JcclxuXHRcdFx0XHRcdC8vIGFuIGVtcHR5IHN0cmluZyAod2l0aG91dCB0b3VjaGluZywgdW5sZXNzIGl0IGlzIGEgcmVxdWlyZWQgcGFyYW1ldGVyKVxyXG5cdFx0XHRcdFx0c2VsZi5wYXJhbWV0ZXJzLnB1c2goe1xyXG5cdFx0XHRcdFx0XHRuYW1lOnBhcmFOYW1lLFxyXG5cdFx0XHRcdFx0XHR2YWx1ZTogcGFyYURhdGEuYXV0b3ZhbHVlIHx8IFwiXCIsXHJcblx0XHRcdFx0XHRcdGF1dG9maWxsZWQ6IHRydWVcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHRcclxuXHRcdFx0Ly8gTWFrZSBzdWdnZXN0aW9ucyBmb3IgY29tYm9ib3hcclxuXHRcdFx0dmFyIGFsbFBhcmFtc0FycmF5ID0gKCAhc2VsZi5ub3RlbXBsYXRlZGF0YSAmJiByZXN1bHQucGFnZXNbaWRdLnBhcmFtT3JkZXIgKSB8fFxyXG5cdFx0XHQkLm1hcChzZWxmLnBhcmFtRGF0YSwgZnVuY3Rpb24oX3ZhbCwga2V5KXtcclxuXHRcdFx0XHRyZXR1cm4ga2V5O1xyXG5cdFx0XHR9KTtcclxuXHRcdFx0c2VsZi5wYXJhbWV0ZXJTdWdnZXN0aW9ucyA9IGFsbFBhcmFtc0FycmF5LmZpbHRlcihmdW5jdGlvbihwYXJhbU5hbWUpIHtcclxuXHRcdFx0XHRyZXR1cm4gKCBwYXJhbU5hbWUgJiYgcGFyYW1OYW1lICE9PSBcImNsYXNzXCIgJiYgcGFyYW1OYW1lICE9PSBcImltcG9ydGFuY2VcIiApO1xyXG5cdFx0XHR9KVxyXG5cdFx0XHRcdC5tYXAoZnVuY3Rpb24ocGFyYW1OYW1lKSB7XHJcblx0XHRcdFx0XHR2YXIgb3B0aW9uT2JqZWN0ID0ge2RhdGE6IHBhcmFtTmFtZX07XHJcblx0XHRcdFx0XHR2YXIgbGFiZWwgPSBzZWxmLmdldERhdGFGb3JQYXJhbShsYWJlbCwgcGFyYW1OYW1lKTtcclxuXHRcdFx0XHRcdGlmICggbGFiZWwgKSB7XHJcblx0XHRcdFx0XHRcdG9wdGlvbk9iamVjdC5sYWJlbCA9IGxhYmVsICsgXCIgKHxcIiArIHBhcmFtTmFtZSArIFwiPSlcIjtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHJldHVybiBvcHRpb25PYmplY3Q7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcclxuXHRcdFx0aWYgKCBzZWxmLnRlbXBsYXRlZGF0YUFwaUVycm9yICkge1xyXG5cdFx0XHRcdC8vIERvbid0IHNhdmUgZGVmYXVsdHMvZ3Vlc3NlcyB0byBjYWNoZTtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHJcblx0XHRcdGNhY2hlLndyaXRlKHByZWZpeGVkVGV4dCArIFwiLXBhcmFtc1wiLCB7XHJcblx0XHRcdFx0bm90ZW1wbGF0ZWRhdGE6IHNlbGYubm90ZW1wbGF0ZWRhdGEsXHJcblx0XHRcdFx0cGFyYW1EYXRhOiBzZWxmLnBhcmFtRGF0YSxcclxuXHRcdFx0XHRwYXJhbWV0ZXJTdWdnZXN0aW9uczogc2VsZi5wYXJhbWV0ZXJTdWdnZXN0aW9ucyxcclxuXHRcdFx0XHRwYXJhbUFsaWFzZXM6IHNlbGYucGFyYW1BbGlhc2VzXHJcblx0XHRcdH0sXHQxXHJcblx0XHRcdCk7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fSlcclxuXHRcdC50aGVuKFxyXG5cdFx0XHRwYXJhbURhdGFTZXQucmVzb2x2ZSxcclxuXHRcdFx0cGFyYW1EYXRhU2V0LnJlamVjdFxyXG5cdFx0KTtcclxuXHRcclxuXHRyZXR1cm4gcGFyYW1EYXRhU2V0O1x0XHJcbn07XHJcblxyXG5leHBvcnQge1RlbXBsYXRlLCBwYXJzZVRlbXBsYXRlcywgZ2V0V2l0aFJlZGlyZWN0VG99OyIsImltcG9ydCBQYXJhbWV0ZXJXaWRnZXQgZnJvbSBcIi4vUGFyYW1ldGVyV2lkZ2V0XCI7XHJcblxyXG4vKiBUYXJnZXQgb3V0cHV0IChmcm9tIHJhdGVyIHYxKTpcclxuLy8gSFRNTFxyXG48c3BhbiBjbGFzcz1cInJhdGVyLWRpYWxvZy1wYXJhSW5wdXQgcmF0ZXItZGlhbG9nLXRleHRJbnB1dENvbnRhaW5lclwiPlxyXG5cdDxsYWJlbD48c3BhbiBjbGFzcz1cInJhdGVyLWRpYWxvZy1wYXJhLWNvZGVcIj5jYXRlZ29yeTwvc3Bhbj48L2xhYmVsPlxyXG5cdDxpbnB1dCB0eXBlPVwidGV4dFwiLz48YSB0aXRsZT1cInJlbW92ZVwiPng8L2E+PHdici8+XHJcbjwvc3Bhbj5cclxuLy8gQ1NTXHJcbi5yYXRlci1kaWFsb2ctcm93ID4gZGl2ID4gc3BhbiB7XHJcbiAgICBwYWRkaW5nLXJpZ2h0OiAwLjVlbTtcclxuICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XHJcbn1cclxuLnJhdGVyLWRpYWxvZy1hdXRvZmlsbCB7XHJcbiAgICBib3JkZXI6IDFweCBkYXNoZWQgI2NkMjBmZjtcclxuICAgIHBhZGRpbmc6IDAuMmVtO1xyXG4gICAgbWFyZ2luLXJpZ2h0OiAwLjJlbTtcclxufVxyXG5yYXRlci1kaWFsb2ctYXV0b2ZpbGw6OmFmdGVyIHtcclxuICAgIGNvbnRlbnQ6IFwiYXV0b2ZpbGxlZFwiO1xyXG4gICAgY29sb3I6ICNjZDIwZmY7XHJcbiAgICBmb250LXdlaWdodDogYm9sZDtcclxuICAgIGZvbnQtc2l6ZTogOTYlO1xyXG59XHJcbiovXHJcblxyXG5mdW5jdGlvbiBCYW5uZXJXaWRnZXQoIHRlbXBsYXRlLCBjb25maWcgKSB7XHJcblx0Ly8gQ29uZmlndXJhdGlvbiBpbml0aWFsaXphdGlvblxyXG5cdGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcclxuXHQvLyBDYWxsIHBhcmVudCBjb25zdHJ1Y3RvclxyXG5cdEJhbm5lcldpZGdldC5zdXBlci5jYWxsKCB0aGlzLCBjb25maWcgKTtcclxuXHQvLyBDcmVhdGUgYSBsYXlvdXRcclxuXHR0aGlzLmxheW91dCA9IG5ldyBPTy51aS5GaWVsZHNldExheW91dCgpO1xyXG5cdFxyXG5cdHRoaXMubWFpbkxhYmVsID0gbmV3IE9PLnVpLkxhYmVsV2lkZ2V0KHtcclxuXHRcdGxhYmVsOiBcInt7XCIgKyB0ZW1wbGF0ZS5nZXRUaXRsZSgpLmdldE1haW5UZXh0KCkgKyBcIn19XCIsXHJcblx0XHQkZWxlbWVudDogJChcIjxzdHJvbmcgc3R5bGU9J2Rpc3BsYXk6aW5saW5lLWJsb2NrO3dpZHRoOjQ4JTtmb250LXNpemU6IDExMCU7bWFyZ2luLXJpZ2h0OjA7cGFkZGluZy1yaWdodDo4cHgnPlwiKVxyXG5cdH0pO1xyXG5cdC8vIFJhdGluZyBkcm9wZG93bnNcclxuXHR0aGlzLmNsYXNzRHJvcGRvd24gPSBuZXcgT08udWkuRHJvcGRvd25XaWRnZXQoIHtcclxuXHRcdGxhYmVsOiBuZXcgT08udWkuSHRtbFNuaXBwZXQoXCI8c3BhbiBzdHlsZT1cXFwiY29sb3I6Izc3N1xcXCI+Q2xhc3M8L3NwYW4+XCIpLFxyXG5cdFx0bWVudTogeyAvLyBGSVhNRTogbmVlZHMgcmVhbCBkYXRhXHJcblx0XHRcdGl0ZW1zOiBbXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwiXCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCIgXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwiQlwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiQlwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcIkNcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIkNcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJzdGFydFwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiU3RhcnRcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XVxyXG5cdFx0fSxcclxuXHRcdCRlbGVtZW50OiAkKFwiPHNwYW4gc3R5bGU9J2Rpc3BsYXk6aW5saW5lLWJsb2NrO3dpZHRoOjI0JSc+XCIpLFxyXG5cdFx0JG92ZXJsYXk6IHRoaXMuJG92ZXJsYXksXHJcblx0fSApO1xyXG5cdHRoaXMuaW1wb3J0YW5jZURyb3Bkb3duID0gbmV3IE9PLnVpLkRyb3Bkb3duV2lkZ2V0KCB7XHJcblx0XHRsYWJlbDogbmV3IE9PLnVpLkh0bWxTbmlwcGV0KFwiPHNwYW4gc3R5bGU9XFxcImNvbG9yOiM3NzdcXFwiPkltcG9ydGFuY2U8L3NwYW4+XCIpLFxyXG5cdFx0bWVudTogeyAvLyBGSVhNRTogbmVlZHMgcmVhbCBkYXRhXHJcblx0XHRcdGl0ZW1zOiBbXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwiXCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCIgXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwidG9wXCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJUb3BcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJoaWdoXCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJIaWdoXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwibWlkXCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJNaWRcIlxyXG5cdFx0XHRcdH0gKVxyXG5cdFx0XHRdXHJcblx0XHR9LFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8c3BhbiBzdHlsZT0nZGlzcGxheTppbmxpbmUtYmxvY2s7d2lkdGg6MjQlJz5cIiksXHJcblx0XHQkb3ZlcmxheTogdGhpcy4kb3ZlcmxheSxcclxuXHR9ICk7XHJcblx0dGhpcy5yYXRpbmdzRHJvcGRvd25zID0gbmV3IE9PLnVpLkhvcml6b250YWxMYXlvdXQoIHtcclxuXHRcdGl0ZW1zOiBbXHJcblx0XHRcdHRoaXMubWFpbkxhYmVsLFxyXG5cdFx0XHR0aGlzLmNsYXNzRHJvcGRvd24sXHJcblx0XHRcdHRoaXMuaW1wb3J0YW5jZURyb3Bkb3duLFxyXG5cdFx0XVxyXG5cdH0gKTtcclxuXHQvL3RoaXMucGFyYW1ldGVyc1RvZ2dsZSA9IG5ldyBPTy51aS5Ub2dnbGVTd2l0Y2hXaWRnZXQoKTtcclxuXHQvLyBQYXJhbWV0ZXJzIGFzIHRleHQgKGNvbGxhcHNlZClcclxuXHQvLyB0aGlzLnBhcmFtZXRlcnNUZXh0ID0gbmV3IE9PLnVpLkxhYmVsV2lkZ2V0KHtcclxuXHQvLyBcdGxhYmVsOiB0ZW1wbGF0ZS5wYXJhbWV0ZXJzLm1hcChwYXJhbWV0ZXIgPT4gYHwke3BhcmFtZXRlci5uYW1lfT0ke3BhcmFtZXRlci52YWx1ZX1gKS5qb2luKFwiIFwiKVxyXG5cdC8vIH0pO1xyXG5cdC8vIHRoaXMucGFyYW1ldGVyc0ZpZWxkID0gIG5ldyBPTy51aS5GaWVsZExheW91dCggdGhpcy5wYXJhbWV0ZXJzVGV4dCwge1xyXG5cdC8vIFx0bGFiZWw6IFwiUGFyYW1ldGVyc1wiLCBcclxuXHQvLyBcdGFsaWduOiBcInRvcFwiIFxyXG5cdC8vIH0gKTtcclxuXHR0aGlzLnBhcmFtZXRlcldpZGdldHMgPSB0ZW1wbGF0ZS5wYXJhbWV0ZXJzXHJcblx0XHQuZmlsdGVyKHBhcmFtID0+IHBhcmFtLm5hbWUgIT09IFwiY2xhc3NcIiAmJiBwYXJhbS5uYW1lICE9PSBcImltcG9ydGFuY2VcIilcclxuXHRcdC5tYXAocGFyYW0gPT4gbmV3IFBhcmFtZXRlcldpZGdldChwYXJhbSwgdGVtcGxhdGUucGFyYW1EYXRhW3BhcmFtLm5hbWVdKSk7XHJcblx0Ly8gUGFyYW1ldGVycyBhcyBsYWJlbC9pbnB1dCBwYWlycyAoZXhwYW5kZWQpXHJcblx0Ly9UT0RPOiBOZXcgcGFyYW1ldGVyIGNvbWJvYm94XHJcblx0dGhpcy5wYXJhbWV0ZXJXaWRnZXRzTGF5b3V0ID0gbmV3IE9PLnVpLkhvcml6b250YWxMYXlvdXQoIHtcclxuXHRcdGl0ZW1zOiB0aGlzLnBhcmFtZXRlcldpZGdldHNcclxuXHR9ICk7XHJcblx0Ly8gQWRkIGV2ZXJ5dGhpbmcgdG8gdGhlIGxheW91dFxyXG5cdHRoaXMubGF5b3V0LmFkZEl0ZW1zKFtcclxuXHRcdHRoaXMucmF0aW5nc0Ryb3Bkb3ducyxcclxuXHRcdHRoaXMucGFyYW1ldGVyV2lkZ2V0c0xheW91dFxyXG5cdF0pO1xyXG5cdFxyXG5cdHRoaXMuJGVsZW1lbnQuYXBwZW5kKHRoaXMubGF5b3V0LiRlbGVtZW50LCAkKFwiPGhyPlwiKSk7XHJcbn1cclxuT08uaW5oZXJpdENsYXNzKCBCYW5uZXJXaWRnZXQsIE9PLnVpLldpZGdldCApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgQmFubmVyV2lkZ2V0OyIsImZ1bmN0aW9uIFBhcmFtZXRlcldpZGdldCggcGFyYW1ldGVyLCBwYXJhbURhdGEsIGNvbmZpZyApIHtcclxuXHQvLyBDb25maWd1cmF0aW9uIGluaXRpYWxpemF0aW9uXHJcblx0Y29uZmlnID0gY29uZmlnIHx8IHt9O1xyXG5cdC8vIENhbGwgcGFyZW50IGNvbnN0cnVjdG9yXHJcblx0UGFyYW1ldGVyV2lkZ2V0LnN1cGVyLmNhbGwoIHRoaXMsIGNvbmZpZyApO1xyXG4gICAgXHJcblx0dGhpcy5wYXJhbWV0ZXIgPSBwYXJhbWV0ZXI7XHJcblx0dGhpcy5wYXJhbURhdGEgPSBwYXJhbURhdGEgfHwge307XHJcblxyXG5cdC8vIE1ha2UgdGhlIGlucHV0LiBUeXBlIGNhbiBiZSBjaGVja2JveCwgb3IgZHJvcGRvd24sIG9yIHRleHQgaW5wdXQsXHJcblx0Ly8gZGVwZW5kaW5nIG9uIG51bWJlciBvZiBhbGxvd2VkIHZhbHVlcyBpbiBwYXJhbSBkYXRhLlxyXG5cdHRoaXMuYWxsb3dlZFZhbHVlcyA9IHBhcmFtRGF0YSAmJiBwYXJhbURhdGEuYWxsb3dlZFZhbHVlcyB8fCBbXTtcclxuXHQvLyBzd2l0Y2ggKHRydWUpIHtcclxuXHQvLyBjYXNlIHRoaXMuYWxsb3dlZFZhbHVlcy5sZW5ndGggPT09IDA6XHJcblx0Ly8gY2FzZSBwYXJhbWV0ZXIudmFsdWUgJiYgIXRoaXMuYWxsb3dlZFZhbHVlcy5pbmNsdWRlcyhwYXJhbWV0ZXIudmFsdWUpOlxyXG5cdC8vIFx0Ly8gVGV4dCBpbnB1dFxyXG5cdC8vIFx0YnJlYWs7XHJcblx0Ly8gY2FzZSAxOlxyXG5cdC8vIFx0Ly8gQ2hlY2tib3ggKGxhYmVsbGVkIG9ubHkgd2hlbiBib3RoIGNoZWNrZWQpXHJcblx0Ly8gXHR0aGlzLmFsbG93ZWRWYWx1ZXMgPSBbbnVsbCwgLi4udGhpcy5hbGxvd2VkVmFsdWVzXTtcclxuXHQvLyBcdC8qIC4uLmZhbGxzIHRocm91Z2guLi4gKi9cclxuXHQvLyBjYXNlIDI6XHJcblx0Ly8gXHQvLyBDaGVja2JveCAobGFiZWxsZWQgd2hlbiBib3RoIGNoZWNrZWQgYW5kIG5vdCBjaGVja2VkKVxyXG5cdC8vIFx0dGhpcy5pbnB1dCA9IG5ldyBPTy51aS5DaGVja2JveE11bHRpb3B0aW9uV2lkZ2V0KCB7XHJcblx0Ly8gXHRcdGRhdGE6IHBhcmFtZXRlci52YWx1ZSxcclxuXHQvLyBcdFx0c2VsZWN0ZWQ6IHRoaXMuYWxsb3dlZFZhbHVlcy5pbmRleE9mKHBhcmFtZXRlci52YWx1ZSkgPT09IDEsXHJcblx0Ly8gXHRcdGxhYmVsOiAkKFwiPGNvZGU+XCIpLnRleHQocGFyYW1ldGVyLnZhbHVlIHx8IFwiXCIpXHJcblx0Ly8gXHR9ICk7XHJcblx0Ly8gXHRicmVhaztcclxuXHQvLyBkZWZhdWx0OlxyXG5cdC8vIFx0Ly8gRHJvcGRvd25cclxuXHQvLyBcdHRoaXMuaW5wdXQgPSBuZXcgT08udWkuRHJvcGRvd25XaWRnZXQoIHtcclxuXHQvLyBcdFx0bWVudToge1xyXG5cdC8vIFx0XHRcdGl0ZW1zOiB0aGlzLmFsbG93ZWRWYWx1ZXMubWFwKGFsbG93ZWRWYWwgPT4gbmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoe1xyXG5cdC8vIFx0XHRcdFx0ZGF0YTogYWxsb3dlZFZhbCxcclxuXHQvLyBcdFx0XHRcdGxhYmVsOiBhbGxvd2VkVmFsXHJcblx0Ly8gXHRcdFx0fSkgKVxyXG5cdC8vIFx0XHR9XHJcblx0Ly8gXHR9ICk7XHJcblx0Ly8gXHR0aGlzLmlucHV0LmdldE1lbnUoKS5zZWxlY3RJdGVtQnlEYXRhKHBhcmFtZXRlci52YWx1ZSk7XHJcblx0Ly8gXHRicmVhaztcclxuXHQvLyB9XHJcblx0Ly8gVE9ETzogVXNlIGFib3ZlIGxvZ2ljLCBvciBzb21ldGhpbmcgc2ltaWxhci4gRm9yIG5vdywganVzdCBjcmVhdGUgYSBDb21ib0JveFxyXG5cdHRoaXMuaW5wdXQgPSBuZXcgT08udWkuQ29tYm9Cb3hJbnB1dFdpZGdldCgge1xyXG5cdFx0dmFsdWU6IHRoaXMucGFyYW1ldGVyLnZhbHVlLFxyXG5cdFx0Ly8gbGFiZWw6IHBhcmFtZXRlci5uYW1lICsgXCIgPVwiLFxyXG5cdFx0Ly8gbGFiZWxQb3NpdGlvbjogXCJiZWZvcmVcIixcclxuXHRcdG9wdGlvbnM6IHRoaXMuYWxsb3dlZFZhbHVlcy5tYXAodmFsID0+IHtyZXR1cm4ge2RhdGE6IHZhbCwgbGFiZWw6dmFsfTsgfSksXHJcblx0XHQkZWxlbWVudDogJChcIjxkaXYgc3R5bGU9J3dpZHRoOmNhbGMoMTAwJSAtIDcwcHgpO21hcmdpbi1yaWdodDowOyc+XCIpIC8vIHRoZSA3MHB4IGxlYXZlcyByb29tIGZvciBidXR0b25zXHJcblx0fSApO1xyXG5cdC8vIFJlZHVjZSB0aGUgZXhjZXNzaXZlIHdoaXRlc3BhY2UvaGVpZ2h0XHJcblx0dGhpcy5pbnB1dC4kZWxlbWVudC5maW5kKFwiaW5wdXRcIikuY3NzKHtcclxuXHRcdFwicGFkZGluZy10b3BcIjogMCxcclxuXHRcdFwicGFkZGluZy1ib3R0b21cIjogXCIycHhcIixcclxuXHRcdFwiaGVpZ2h0XCI6IFwiMjRweFwiXHJcblx0fSk7XHJcblx0Ly8gRml4IGxhYmVsIHBvc2l0aW9uaW5nIHdpdGhpbiB0aGUgcmVkdWNlZCBoZWlnaHRcclxuXHR0aGlzLmlucHV0LiRlbGVtZW50LmZpbmQoXCJzcGFuLm9vLXVpLWxhYmVsRWxlbWVudC1sYWJlbFwiKS5jc3Moe1wibGluZS1oZWlnaHRcIjogXCJub3JtYWxcIn0pO1xyXG5cdC8vIEFsc28gcmVkdWNlIGhlaWdodCBvZiBkcm9wZG93biBidXR0b24gKGlmIG9wdGlvbnMgYXJlIHByZXNlbnQpXHJcblx0dGhpcy5pbnB1dC4kZWxlbWVudC5maW5kKFwiYS5vby11aS1idXR0b25FbGVtZW50LWJ1dHRvblwiKS5jc3Moe1xyXG5cdFx0XCJwYWRkaW5nLXRvcFwiOiAwLFxyXG5cdFx0XCJoZWlnaHRcIjogXCIyNHB4XCIsXHJcblx0XHRcIm1pbi1oZWlnaHRcIjogXCIwXCJcclxuXHR9KTtcclxuXHJcblx0Ly92YXIgZGVzY3JpcHRpb24gPSB0aGlzLnBhcmFtRGF0YVtwYXJhbWV0ZXIubmFtZV0gJiYgdGhpcy5wYXJhbURhdGFbcGFyYW1ldGVyLm5hbWVdLmxhYmVsICYmIHRoaXMucGFyYW1EYXRhW3BhcmFtZXRlci5uYW1lXS5sYWJlbC5lbjtcclxuXHQvLyB2YXIgcGFyYW1OYW1lID0gbmV3IE9PLnVpLkxhYmVsV2lkZ2V0KHtcclxuXHQvLyBcdGxhYmVsOiBcInxcIiArIHBhcmFtZXRlci5uYW1lICsgXCI9XCIsXHJcblx0Ly8gXHQkZWxlbWVudDogJChcIjxjb2RlPlwiKVxyXG5cdC8vIH0pO1xyXG5cdHRoaXMuZGVsZXRlQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCh7XHJcblx0XHRpY29uOiBcImNsZWFyXCIsXHJcblx0XHRmcmFtZWQ6IGZhbHNlLFxyXG5cdFx0ZmxhZ3M6IFwiZGVzdHJ1Y3RpdmVcIlxyXG5cdH0pO1xyXG5cdHRoaXMuZGVsZXRlQnV0dG9uLiRlbGVtZW50LmZpbmQoXCJhIHNwYW5cIikuZmlyc3QoKS5jc3Moe1xyXG5cdFx0XCJtaW4td2lkdGhcIjogXCJ1bnNldFwiLFxyXG5cdFx0XCJ3aWR0aFwiOiBcIjE2cHhcIlxyXG5cdH0pO1xyXG4gICAgXHJcblx0dGhpcy5jb25maXJtQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCh7XHJcblx0XHRpY29uOiBcImNoZWNrXCIsXHJcblx0XHRmcmFtZWQ6IGZhbHNlLFxyXG5cdFx0ZmxhZ3M6IFwicHJvZ3Jlc3NpdmVcIixcclxuXHRcdCRlbGVtZW50OiAkKFwiPHNwYW4gc3R5bGU9J21hcmdpbi1yaWdodDowJz5cIilcclxuXHR9KTtcclxuXHR0aGlzLmNvbmZpcm1CdXR0b24uJGVsZW1lbnQuZmluZChcImEgc3BhblwiKS5maXJzdCgpLmNzcyh7XHJcblx0XHRcIm1pbi13aWR0aFwiOiBcInVuc2V0XCIsXHJcblx0XHRcIndpZHRoXCI6IFwiMTZweFwiLFxyXG5cdFx0XCJtYXJnaW4tcmlnaHRcIjogMFxyXG5cdH0pO1xyXG5cclxuXHR0aGlzLmVkaXRMYXlvdXRDb250cm9scyA9IG5ldyBPTy51aS5Ib3Jpem9udGFsTGF5b3V0KHtcclxuXHRcdGl0ZW1zOiBbXHJcblx0XHRcdHRoaXMuaW5wdXQsXHJcblx0XHRcdHRoaXMuY29uZmlybUJ1dHRvbixcclxuXHRcdFx0dGhpcy5kZWxldGVCdXR0b25cclxuXHRcdF0sXHJcblx0XHQvLyRlbGVtZW50OiAkKFwiPGRpdiBzdHlsZT0nd2lkdGg6IDQ4JTttYXJnaW46MDsnPlwiKVxyXG5cdH0pO1xyXG5cdC8vIEhhY2tzIHRvIG1ha2UgdGhpcyBIb3Jpem9udGFsTGF5b3V0IGdvIGluc2lkZSBhIEZpZWxkTGF5b3V0XHJcblx0dGhpcy5lZGl0TGF5b3V0Q29udHJvbHMuZ2V0SW5wdXRJZCA9ICgpID0+IGZhbHNlO1xyXG5cdHRoaXMuZWRpdExheW91dENvbnRyb2xzLmlzRGlzYWJsZWQgPSAoKSA9PiBmYWxzZTtcclxuXHR0aGlzLmVkaXRMYXlvdXRDb250cm9scy5zaW11bGF0ZUxhYmVsQ2xpY2sgPSAoKSA9PiB0cnVlO1xyXG5cclxuXHR0aGlzLmVkaXRMYXlvdXQgPSBuZXcgT08udWkuRmllbGRMYXlvdXQoIHRoaXMuZWRpdExheW91dENvbnRyb2xzLCB7XHJcblx0XHRsYWJlbDogdGhpcy5wYXJhbWV0ZXIubmFtZSArIFwiID1cIixcclxuXHRcdGFsaWduOiBcInRvcFwiLFxyXG5cdFx0aGVscDogdGhpcy5wYXJhbURhdGEuZGVzY3JpcHRpb24gJiYgdGhpcy5wYXJhbURhdGEuZGVzY3JpcHRpb24uZW4gfHwgZmFsc2UsXHJcblx0XHRoZWxwSW5saW5lOiB0cnVlXHJcblx0fSkudG9nZ2xlKCk7XHJcblx0dGhpcy5lZGl0TGF5b3V0LiRlbGVtZW50LmZpbmQoXCJsYWJlbC5vby11aS1pbmxpbmUtaGVscFwiKS5jc3Moe1wibWFyZ2luXCI6IFwiLTEwcHggMCA1cHggMTBweFwifSk7XHJcblxyXG5cdHRoaXMuZnVsbExhYmVsID0gbmV3IE9PLnVpLkxhYmVsV2lkZ2V0KHtcclxuXHRcdGxhYmVsOiB0aGlzLnBhcmFtZXRlci5uYW1lICsgXCIgPSBcIiArIHRoaXMucGFyYW1ldGVyLnZhbHVlLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8bGFiZWwgc3R5bGU9J21hcmdpbjogMDsnPlwiKVxyXG5cdH0pO1xyXG5cdHRoaXMuZWRpdEJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoe1xyXG5cdFx0aWNvbjogXCJlZGl0XCIsXHJcblx0XHRmcmFtZWQ6IGZhbHNlLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8c3BhbiBzdHlsZT0nbWFyZ2luLWJvdHRvbTogMDsnPlwiKVxyXG5cdH0pO1xyXG5cdHRoaXMuZWRpdEJ1dHRvbi4kZWxlbWVudC5maW5kKFwiYVwiKS5jc3Moe1xyXG5cdFx0XCJib3JkZXItcmFkaXVzXCI6IFwiMCAxMHB4IDEwcHggMFwiLFxyXG5cdFx0XCJtYXJnaW4tbGVmdFwiOiBcIjVweFwiXHJcblx0fSk7XHJcblx0dGhpcy5lZGl0QnV0dG9uLiRlbGVtZW50LmZpbmQoXCJhIHNwYW5cIikuZmlyc3QoKS5jc3Moe1xyXG5cdFx0XCJtaW4td2lkdGhcIjogXCJ1bnNldFwiLFxyXG5cdFx0XCJ3aWR0aFwiOiBcIjE2cHhcIlxyXG5cdH0pO1xyXG5cclxuXHR0aGlzLnJlYWRMYXlvdXQgPSBuZXcgT08udWkuSG9yaXpvbnRhbExheW91dCh7XHJcblx0XHRpdGVtczogW1xyXG5cdFx0XHR0aGlzLmZ1bGxMYWJlbCxcclxuXHRcdFx0dGhpcy5lZGl0QnV0dG9uXHJcblx0XHRdLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8c3BhbiBzdHlsZT0nbWFyZ2luOjA7d2lkdGg6dW5zZXQ7Jz5cIilcclxuXHR9KTtcclxuXHJcblx0dGhpcy4kZWxlbWVudCA9ICQoXCI8ZGl2PlwiKVxyXG5cdFx0LmNzcyh7XHJcblx0XHRcdFwid2lkdGhcIjogXCJ1bnNldFwiLFxyXG5cdFx0XHRcImRpc3BsYXlcIjogXCJpbmxpbmUtYmxvY2tcIixcclxuXHRcdFx0XCJib3JkZXJcIjogXCIxcHggc29saWQgI2RkZFwiLFxyXG5cdFx0XHRcImJvcmRlci1yYWRpdXNcIjogXCIxMHB4XCIsXHJcblx0XHRcdFwicGFkZGluZy1sZWZ0XCI6IFwiMTBweFwiLFxyXG5cdFx0XHRcIm1hcmdpblwiOiBcIjAgOHB4IDhweCAwXCJcclxuXHRcdH0pXHJcblx0XHQuYXBwZW5kKHRoaXMucmVhZExheW91dC4kZWxlbWVudCwgdGhpcy5lZGl0TGF5b3V0LiRlbGVtZW50KTtcclxuICAgIFxyXG5cdHRoaXMuZWRpdEJ1dHRvbi5jb25uZWN0KCB0aGlzLCB7IFwiY2xpY2tcIjogXCJvbkVkaXRDbGlja1wiIH0gKTtcclxuXHR0aGlzLmNvbmZpcm1CdXR0b24uY29ubmVjdCggdGhpcywgeyBcImNsaWNrXCI6IFwib25Db25maXJtQ2xpY2tcIiB9ICk7XHJcbn1cclxuT08uaW5oZXJpdENsYXNzKCBQYXJhbWV0ZXJXaWRnZXQsIE9PLnVpLldpZGdldCApO1xyXG5cclxuUGFyYW1ldGVyV2lkZ2V0LnByb3RvdHlwZS5vbkVkaXRDbGljayA9IGZ1bmN0aW9uKCkge1xyXG5cdHRoaXMucmVhZExheW91dC50b2dnbGUoZmFsc2UpO1xyXG5cdHRoaXMuZWRpdExheW91dC50b2dnbGUodHJ1ZSk7XHJcblx0dGhpcy5pbnB1dC5mb2N1cygpO1xyXG59O1xyXG5cclxuUGFyYW1ldGVyV2lkZ2V0LnByb3RvdHlwZS5vbkNvbmZpcm1DbGljayA9IGZ1bmN0aW9uKCkge1xyXG5cdHRoaXMucGFyYW1ldGVyLnZhbHVlID0gdGhpcy5pbnB1dC5nZXRWYWx1ZSgpO1xyXG5cdHRoaXMuZnVsbExhYmVsLnNldExhYmVsKHRoaXMucGFyYW1ldGVyLm5hbWUgKyBcIiA9IFwiICsgdGhpcy5wYXJhbWV0ZXIudmFsdWUpO1xyXG5cdHRoaXMucmVhZExheW91dC50b2dnbGUodHJ1ZSk7XHJcblx0dGhpcy5lZGl0TGF5b3V0LnRvZ2dsZShmYWxzZSk7XHJcbn07XHJcblxyXG5QYXJhbWV0ZXJXaWRnZXQucHJvdG90eXBlLmZvY3VzSW5wdXQgPSBmdW5jdGlvbigpIHtcclxuXHRyZXR1cm4gdGhpcy5pbnB1dC5mb2N1cygpO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgUGFyYW1ldGVyV2lkZ2V0OyIsImltcG9ydCB7bWFrZUVycm9yTXNnfSBmcm9tIFwiLi4vdXRpbFwiO1xyXG5cclxuLyogdmFyIGluY3JlbWVudFByb2dyZXNzQnlJbnRlcnZhbCA9IGZ1bmN0aW9uKCkge1xyXG5cdHZhciBpbmNyZW1lbnRJbnRlcnZhbERlbGF5ID0gMTAwO1xyXG5cdHZhciBpbmNyZW1lbnRJbnRlcnZhbEFtb3VudCA9IDAuMTtcclxuXHR2YXIgaW5jcmVtZW50SW50ZXJ2YWxNYXh2YWwgPSA5ODtcclxuXHRyZXR1cm4gd2luZG93LnNldEludGVydmFsKFxyXG5cdFx0aW5jcmVtZW50UHJvZ3Jlc3MsXHJcblx0XHRpbmNyZW1lbnRJbnRlcnZhbERlbGF5LFxyXG5cdFx0aW5jcmVtZW50SW50ZXJ2YWxBbW91bnQsXHJcblx0XHRpbmNyZW1lbnRJbnRlcnZhbE1heHZhbFxyXG5cdCk7XHJcbn07ICovXHJcblxyXG52YXIgTG9hZERpYWxvZyA9IGZ1bmN0aW9uIExvYWREaWFsb2coIGNvbmZpZyApIHtcclxuXHRMb2FkRGlhbG9nLnN1cGVyLmNhbGwoIHRoaXMsIGNvbmZpZyApO1xyXG59O1xyXG5PTy5pbmhlcml0Q2xhc3MoIExvYWREaWFsb2csIE9PLnVpLkRpYWxvZyApOyBcclxuXHJcbkxvYWREaWFsb2cuc3RhdGljLm5hbWUgPSBcImxvYWREaWFsb2dcIjtcclxuTG9hZERpYWxvZy5zdGF0aWMudGl0bGUgPSBcIkxvYWRpbmcgUmF0ZXIuLi5cIjtcclxuXHJcbi8vIEN1c3RvbWl6ZSB0aGUgaW5pdGlhbGl6ZSgpIGZ1bmN0aW9uOiBUaGlzIGlzIHdoZXJlIHRvIGFkZCBjb250ZW50IHRvIHRoZSBkaWFsb2cgYm9keSBhbmQgc2V0IHVwIGV2ZW50IGhhbmRsZXJzLlxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5pbml0aWFsaXplID0gZnVuY3Rpb24gKCkge1xyXG5cdC8vIENhbGwgdGhlIHBhcmVudCBtZXRob2QuXHJcblx0TG9hZERpYWxvZy5zdXBlci5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKCB0aGlzICk7XHJcblx0Ly8gQ3JlYXRlIGEgbGF5b3V0XHJcblx0dGhpcy5jb250ZW50ID0gbmV3IE9PLnVpLlBhbmVsTGF5b3V0KCB7IFxyXG5cdFx0cGFkZGVkOiB0cnVlLFxyXG5cdFx0ZXhwYW5kZWQ6IGZhbHNlIFxyXG5cdH0gKTtcclxuXHQvLyBDcmVhdGUgY29udGVudFxyXG5cdHRoaXMucHJvZ3Jlc3NCYXIgPSBuZXcgT08udWkuUHJvZ3Jlc3NCYXJXaWRnZXQoIHtcclxuXHRcdHByb2dyZXNzOiAxXHJcblx0fSApO1xyXG5cdHRoaXMuc2V0dXB0YXNrcyA9IFtcclxuXHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJMb2FkaW5nIGxpc3Qgb2YgcHJvamVjdCBiYW5uZXJzLi4uXCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHAgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSksXHJcblx0XHRuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiTG9hZGluZyB0YWxrcGFnZSB3aWtpdGV4dC4uLlwiLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxwIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrXFxcIj5cIilcclxuXHRcdH0pLFxyXG5cdFx0bmV3IE9PLnVpLkxhYmVsV2lkZ2V0KCB7XHJcblx0XHRcdGxhYmVsOiBcIlBhcnNpbmcgdGFsa3BhZ2UgdGVtcGxhdGVzLi4uXCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHAgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSksXHJcblx0XHRuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiR2V0dGluZyB0ZW1wbGF0ZXMnIHBhcmFtZXRlciBkYXRhLi4uXCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHAgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSksXHJcblx0XHRuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiQ2hlY2tpbmcgaWYgcGFnZSByZWRpcmVjdHMuLi5cIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8cCBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KSxcclxuXHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJSZXRyaWV2aW5nIHF1YWxpdHkgcHJlZGljdGlvbi4uLlwiLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxwIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrXFxcIj5cIilcclxuXHRcdH0pLnRvZ2dsZSgpLFxyXG5cdF07XHJcblx0dGhpcy5jbG9zZUJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoIHtcclxuXHRcdGxhYmVsOiBcIkNsb3NlXCJcclxuXHR9KS50b2dnbGUoKTtcclxuXHR0aGlzLnNldHVwUHJvbWlzZXMgPSBbXTtcclxuXHJcblx0Ly8gQXBwZW5kIGNvbnRlbnQgdG8gbGF5b3V0XHJcblx0dGhpcy5jb250ZW50LiRlbGVtZW50LmFwcGVuZChcclxuXHRcdHRoaXMucHJvZ3Jlc3NCYXIuJGVsZW1lbnQsXHJcblx0XHQobmV3IE9PLnVpLkxhYmVsV2lkZ2V0KCB7XHJcblx0XHRcdGxhYmVsOiBcIkluaXRpYWxpc2luZzpcIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8c3Ryb25nIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrXFxcIj5cIilcclxuXHRcdH0pKS4kZWxlbWVudCxcclxuXHRcdC4uLnRoaXMuc2V0dXB0YXNrcy5tYXAod2lkZ2V0ID0+IHdpZGdldC4kZWxlbWVudCksXHJcblx0XHR0aGlzLmNsb3NlQnV0dG9uLiRlbGVtZW50XHJcblx0KTtcclxuXHJcblx0Ly8gQXBwZW5kIGxheW91dCB0byBkaWFsb2dcclxuXHR0aGlzLiRib2R5LmFwcGVuZCggdGhpcy5jb250ZW50LiRlbGVtZW50ICk7XHJcblxyXG5cdC8vIENvbm5lY3QgZXZlbnRzIHRvIGhhbmRsZXJzXHJcblx0dGhpcy5jbG9zZUJ1dHRvbi5jb25uZWN0KCB0aGlzLCB7IFwiY2xpY2tcIjogXCJvbkNsb3NlQnV0dG9uQ2xpY2tcIiB9ICk7XHJcbn07XHJcblxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5vbkNsb3NlQnV0dG9uQ2xpY2sgPSBmdW5jdGlvbigpIHtcclxuXHQvLyBDbG9zZSB0aGlzIGRpYWxvZywgd2l0aG91dCBwYXNzaW5nIGFueSBkYXRhXHJcblx0dGhpcy5jbG9zZSgpO1xyXG59O1xyXG5cclxuLy8gT3ZlcnJpZGUgdGhlIGdldEJvZHlIZWlnaHQoKSBtZXRob2QgdG8gc3BlY2lmeSBhIGN1c3RvbSBoZWlnaHQgKG9yIGRvbid0IHRvIHVzZSB0aGUgYXV0b21hdGljYWxseSBnZW5lcmF0ZWQgaGVpZ2h0KS5cclxuTG9hZERpYWxvZy5wcm90b3R5cGUuZ2V0Qm9keUhlaWdodCA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gdGhpcy5jb250ZW50LiRlbGVtZW50Lm91dGVySGVpZ2h0KCB0cnVlICk7XHJcbn07XHJcblxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5pbmNyZW1lbnRQcm9ncmVzcyA9IGZ1bmN0aW9uKGFtb3VudCwgbWF4aW11bSkge1xyXG5cdHZhciBwcmlvclByb2dyZXNzID0gdGhpcy5wcm9ncmVzc0Jhci5nZXRQcm9ncmVzcygpO1xyXG5cdHZhciBpbmNyZW1lbnRlZFByb2dyZXNzID0gTWF0aC5taW4obWF4aW11bSB8fCAxMDAsIHByaW9yUHJvZ3Jlc3MgKyBhbW91bnQpO1xyXG5cdHRoaXMucHJvZ3Jlc3NCYXIuc2V0UHJvZ3Jlc3MoaW5jcmVtZW50ZWRQcm9ncmVzcyk7XHJcbn07XHJcblxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5hZGRUYXNrUHJvbWlzZUhhbmRsZXJzID0gZnVuY3Rpb24odGFza1Byb21pc2VzKSB7XHJcblx0dmFyIG9uVGFza0RvbmUgPSBpbmRleCA9PiB7XHJcblx0XHQvLyBBZGQgXCJEb25lIVwiIHRvIGxhYmVsXHJcblx0XHR2YXIgd2lkZ2V0ID0gdGhpcy5zZXR1cHRhc2tzW2luZGV4XTtcclxuXHRcdHdpZGdldC5zZXRMYWJlbCh3aWRnZXQuZ2V0TGFiZWwoKSArIFwiIERvbmUhXCIpO1xyXG5cdFx0Ly8gSW5jcmVtZW50IHN0YXR1cyBiYXIuIFNob3cgYSBzbW9vdGggdHJhbnNpdGlvbiBieVxyXG5cdFx0Ly8gdXNpbmcgc21hbGwgc3RlcHMgb3ZlciBhIHNob3J0IGR1cmF0aW9uLlxyXG5cdFx0dmFyIHRvdGFsSW5jcmVtZW50ID0gMjA7IC8vIHBlcmNlbnRcclxuXHRcdHZhciB0b3RhbFRpbWUgPSA0MDA7IC8vIG1pbGxpc2Vjb25kc1xyXG5cdFx0dmFyIHRvdGFsU3RlcHMgPSAxMDtcclxuXHRcdHZhciBpbmNyZW1lbnRQZXJTdGVwID0gdG90YWxJbmNyZW1lbnQgLyB0b3RhbFN0ZXBzO1xyXG5cclxuXHRcdGZvciAoIHZhciBzdGVwPTA7IHN0ZXAgPCB0b3RhbFN0ZXBzOyBzdGVwKyspIHtcclxuXHRcdFx0d2luZG93LnNldFRpbWVvdXQoXHJcblx0XHRcdFx0dGhpcy5pbmNyZW1lbnRQcm9ncmVzcy5iaW5kKHRoaXMpLFxyXG5cdFx0XHRcdHRvdGFsVGltZSAqIHN0ZXAgLyB0b3RhbFN0ZXBzLFxyXG5cdFx0XHRcdGluY3JlbWVudFBlclN0ZXBcclxuXHRcdFx0KTtcclxuXHRcdH1cclxuXHR9O1xyXG5cdHZhciBvblRhc2tFcnJvciA9IChpbmRleCwgY29kZSwgaW5mbykgPT4ge1xyXG5cdFx0dmFyIHdpZGdldCA9IHRoaXMuc2V0dXB0YXNrc1tpbmRleF07XHJcblx0XHR3aWRnZXQuc2V0TGFiZWwoXHJcblx0XHRcdHdpZGdldC5nZXRMYWJlbCgpICsgXCIgRmFpbGVkLiBcIiArIG1ha2VFcnJvck1zZyhjb2RlLCBpbmZvKVxyXG5cdFx0KTtcclxuXHRcdHRoaXMuY2xvc2VCdXR0b24udG9nZ2xlKHRydWUpO1xyXG5cdFx0dGhpcy51cGRhdGVTaXplKCk7XHJcblx0fTtcclxuXHR0YXNrUHJvbWlzZXMuZm9yRWFjaChmdW5jdGlvbihwcm9taXNlLCBpbmRleCkge1xyXG5cdFx0cHJvbWlzZS50aGVuKFxyXG5cdFx0XHQoKSA9PiBvblRhc2tEb25lKGluZGV4KSxcclxuXHRcdFx0KGNvZGUsIGluZm8pID0+IG9uVGFza0Vycm9yKGluZGV4LCBjb2RlLCBpbmZvKVxyXG5cdFx0KTtcclxuXHR9KTtcclxufTtcclxuXHJcbi8vIFVzZSBnZXRTZXR1cFByb2Nlc3MoKSB0byBzZXQgdXAgdGhlIHdpbmRvdyB3aXRoIGRhdGEgcGFzc2VkIHRvIGl0IGF0IHRoZSB0aW1lIFxyXG4vLyBvZiBvcGVuaW5nXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmdldFNldHVwUHJvY2VzcyA9IGZ1bmN0aW9uICggZGF0YSApIHtcclxuXHRkYXRhID0gZGF0YSB8fCB7fTtcclxuXHRyZXR1cm4gTG9hZERpYWxvZy5zdXBlci5wcm90b3R5cGUuZ2V0U2V0dXBQcm9jZXNzLmNhbGwoIHRoaXMsIGRhdGEgKVxyXG5cdFx0Lm5leHQoICgpID0+IHtcclxuXHRcdFx0dmFyIHNob3dPcmVzVGFzayA9ICEhZGF0YS5vcmVzO1xyXG5cdFx0XHR0aGlzLnNldHVwdGFza3NbNV0udG9nZ2xlKHNob3dPcmVzVGFzayk7XHJcblx0XHRcdHZhciB0YXNrUHJvbWlzZXMgPSBkYXRhLm9yZXMgPyBkYXRhLnByb21pc2VzIDogZGF0YS5wcm9taXNlcy5zbGljZSgwLCAtMSk7XHJcblx0XHRcdGRhdGEuaXNPcGVuZWQudGhlbigoKSA9PiB0aGlzLmFkZFRhc2tQcm9taXNlSGFuZGxlcnModGFza1Byb21pc2VzKSk7XHJcblx0XHR9LCB0aGlzICk7XHJcbn07XHJcblxyXG4vLyBQcmV2ZW50IHdpbmRvdyBmcm9tIGNsb3NpbmcgdG9vIHF1aWNrbHksIHVzaW5nIGdldEhvbGRQcm9jZXNzKClcclxuTG9hZERpYWxvZy5wcm90b3R5cGUuZ2V0SG9sZFByb2Nlc3MgPSBmdW5jdGlvbiAoIGRhdGEgKSB7XHJcblx0ZGF0YSA9IGRhdGEgfHwge307XHJcblx0aWYgKGRhdGEuc3VjY2Vzcykge1xyXG5cdFx0Ly8gV2FpdCBhIGJpdCBiZWZvcmUgcHJvY2Vzc2luZyB0aGUgY2xvc2UsIHdoaWNoIGhhcHBlbnMgYXV0b21hdGljYWxseVxyXG5cdFx0cmV0dXJuIExvYWREaWFsb2cuc3VwZXIucHJvdG90eXBlLmdldEhvbGRQcm9jZXNzLmNhbGwoIHRoaXMsIGRhdGEgKVxyXG5cdFx0XHQubmV4dCg4MDApO1xyXG5cdH1cclxuXHQvLyBObyBuZWVkIHRvIHdhaXQgaWYgY2xvc2VkIG1hbnVhbGx5XHJcblx0cmV0dXJuIExvYWREaWFsb2cuc3VwZXIucHJvdG90eXBlLmdldEhvbGRQcm9jZXNzLmNhbGwoIHRoaXMsIGRhdGEgKTtcclxufTtcclxuXHJcbi8vIFVzZSB0aGUgZ2V0VGVhcmRvd25Qcm9jZXNzKCkgbWV0aG9kIHRvIHBlcmZvcm0gYWN0aW9ucyB3aGVuZXZlciB0aGUgZGlhbG9nIGlzIGNsb3NlZC4gXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmdldFRlYXJkb3duUHJvY2VzcyA9IGZ1bmN0aW9uICggZGF0YSApIHtcclxuXHRyZXR1cm4gTG9hZERpYWxvZy5zdXBlci5wcm90b3R5cGUuZ2V0VGVhcmRvd25Qcm9jZXNzLmNhbGwoIHRoaXMsIGRhdGEgKVxyXG5cdFx0LmZpcnN0KCAoKSA9PiB7XHJcblx0XHQvLyBQZXJmb3JtIGNsZWFudXA6IHJlc2V0IGxhYmVsc1xyXG5cdFx0XHR0aGlzLnNldHVwdGFza3MuZm9yRWFjaCggc2V0dXB0YXNrID0+IHtcclxuXHRcdFx0XHR2YXIgY3VycmVudExhYmVsID0gc2V0dXB0YXNrLmdldExhYmVsKCk7XHJcblx0XHRcdFx0c2V0dXB0YXNrLnNldExhYmVsKFxyXG5cdFx0XHRcdFx0Y3VycmVudExhYmVsLnNsaWNlKDAsIGN1cnJlbnRMYWJlbC5pbmRleE9mKFwiLi4uXCIpKzMpXHJcblx0XHRcdFx0KTtcclxuXHRcdFx0fSApO1xyXG5cdFx0fSwgdGhpcyApO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgTG9hZERpYWxvZzsiLCJpbXBvcnQgQmFubmVyV2lkZ2V0IGZyb20gXCIuL0NvbXBvbmVudHMvQmFubmVyV2lkZ2V0XCI7XHJcblxyXG5mdW5jdGlvbiBNYWluV2luZG93KCBjb25maWcgKSB7XHJcblx0TWFpbldpbmRvdy5zdXBlci5jYWxsKCB0aGlzLCBjb25maWcgKTtcclxufVxyXG5PTy5pbmhlcml0Q2xhc3MoIE1haW5XaW5kb3csIE9PLnVpLlByb2Nlc3NEaWFsb2cgKTtcclxuXHJcbk1haW5XaW5kb3cuc3RhdGljLm5hbWUgPSBcIm1haW5cIjtcclxuTWFpbldpbmRvdy5zdGF0aWMudGl0bGUgPSBcIlJhdGVyXCI7XHJcbk1haW5XaW5kb3cuc3RhdGljLnNpemUgPSBcImxhcmdlXCI7XHJcbk1haW5XaW5kb3cuc3RhdGljLmFjdGlvbnMgPSBbXHJcblx0Ly8gUHJpbWFyeSAodG9wIHJpZ2h0KTpcclxuXHR7XHJcblx0XHRsYWJlbDogXCJYXCIsIC8vIG5vdCB1c2luZyBhbiBpY29uIHNpbmNlIGNvbG9yIGJlY29tZXMgaW52ZXJ0ZWQsIGkuZS4gd2hpdGUgb24gbGlnaHQtZ3JleVxyXG5cdFx0dGl0bGU6IFwiQ2xvc2UgKGFuZCBkaXNjYXJkIGFueSBjaGFuZ2VzKVwiLFxyXG5cdFx0ZmxhZ3M6IFwicHJpbWFyeVwiLFxyXG5cdH0sXHJcblx0Ly8gU2FmZSAodG9wIGxlZnQpXHJcblx0e1xyXG5cdFx0YWN0aW9uOiBcImhlbHBcIixcclxuXHRcdGZsYWdzOiBcInNhZmVcIixcclxuXHRcdGxhYmVsOiBcIj9cIiwgLy8gbm90IHVzaW5nIGljb24sIHRvIG1pcnJvciBDbG9zZSBhY3Rpb25cclxuXHRcdHRpdGxlOiBcImhlbHBcIlxyXG5cdH0sXHJcblx0Ly8gT3RoZXJzIChib3R0b20pXHJcblx0e1xyXG5cdFx0YWN0aW9uOiBcInNhdmVcIixcclxuXHRcdGxhYmVsOiBuZXcgT08udWkuSHRtbFNuaXBwZXQoXCI8c3BhbiBzdHlsZT0ncGFkZGluZzowIDFlbTsnPlNhdmU8L3NwYW4+XCIpLFxyXG5cdFx0ZmxhZ3M6IFtcInByaW1hcnlcIiwgXCJwcm9ncmVzc2l2ZVwiXVxyXG5cdH0sXHJcblx0e1xyXG5cdFx0YWN0aW9uOiBcInByZXZpZXdcIixcclxuXHRcdGxhYmVsOiBcIlNob3cgcHJldmlld1wiXHJcblx0fSxcclxuXHR7XHJcblx0XHRhY3Rpb246IFwiY2hhbmdlc1wiLFxyXG5cdFx0bGFiZWw6IFwiU2hvdyBjaGFuZ2VzXCJcclxuXHR9LFxyXG5cdHtcclxuXHRcdGFjdGlvbjogXCJjYW5jZWxcIixcclxuXHRcdGxhYmVsOiBcIkNhbmNlbFwiXHJcblx0fVxyXG5dO1xyXG5cclxuLy8gQ3VzdG9taXplIHRoZSBpbml0aWFsaXplKCkgZnVuY3Rpb246IFRoaXMgaXMgd2hlcmUgdG8gYWRkIGNvbnRlbnQgdG8gdGhlIGRpYWxvZyBib2R5IGFuZCBzZXQgdXAgZXZlbnQgaGFuZGxlcnMuXHJcbk1haW5XaW5kb3cucHJvdG90eXBlLmluaXRpYWxpemUgPSBmdW5jdGlvbiAoKSB7XHJcblx0Ly8gQ2FsbCB0aGUgcGFyZW50IG1ldGhvZC5cclxuXHRNYWluV2luZG93LnN1cGVyLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwoIHRoaXMgKTtcclxuXHQvLyBDcmVhdGUgbGF5b3V0c1xyXG5cdHRoaXMudG9wQmFyID0gbmV3IE9PLnVpLlBhbmVsTGF5b3V0KCB7XHJcblx0XHRleHBhbmRlZDogZmFsc2UsXHJcblx0XHRmcmFtZWQ6IGZhbHNlLFxyXG5cdFx0cGFkZGVkOiBmYWxzZVxyXG5cdH0gKTtcclxuXHR0aGlzLmNvbnRlbnQgPSBuZXcgT08udWkuUGFuZWxMYXlvdXQoIHtcclxuXHRcdGV4cGFuZGVkOiB0cnVlLFxyXG5cdFx0cGFkZGVkOiB0cnVlLFxyXG5cdFx0c2Nyb2xsYWJsZTogdHJ1ZVxyXG5cdH0gKTtcclxuXHR0aGlzLm91dGVyTGF5b3V0ID0gbmV3IE9PLnVpLlN0YWNrTGF5b3V0KCB7XHJcblx0XHRpdGVtczogW1xyXG5cdFx0XHR0aGlzLnRvcEJhcixcclxuXHRcdFx0dGhpcy5jb250ZW50XHJcblx0XHRdLFxyXG5cdFx0Y29udGludW91czogdHJ1ZSxcclxuXHRcdGV4cGFuZGVkOiB0cnVlXHJcblx0fSApO1xyXG5cdC8vIENyZWF0ZSB0b3BCYXIgY29udGVudFxyXG5cdHRoaXMuc2VhcmNoQm94ID0gbmV3IE9PLnVpLkNvbWJvQm94SW5wdXRXaWRnZXQoIHtcclxuXHRcdHBsYWNlaG9sZGVyOiBcIkFkZCBhIFdpa2lQcm9qZWN0Li4uXCIsXHJcblx0XHRvcHRpb25zOiBbXHJcblx0XHRcdHsgLy8gRklYTUU6IFRoZXNlIGFyZSBwbGFjZWhvbGRlcnMuXHJcblx0XHRcdFx0ZGF0YTogXCJPcHRpb24gMVwiLFxyXG5cdFx0XHRcdGxhYmVsOiBcIk9wdGlvbiBPbmVcIlxyXG5cdFx0XHR9LFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0ZGF0YTogXCJPcHRpb24gMlwiLFxyXG5cdFx0XHRcdGxhYmVsOiBcIk9wdGlvbiBUd29cIlxyXG5cdFx0XHR9LFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0ZGF0YTogXCJPcHRpb24gM1wiLFxyXG5cdFx0XHRcdGxhYmVsOiBcIk9wdGlvbiBUaHJlZVwiXHJcblx0XHRcdH1cclxuXHRcdF0sXHJcblx0XHQkZWxlbWVudDogJChcIjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lLWJsb2NrO3dpZHRoOjEwMCU7bWF4LXdpZHRoOjQyNXB4Oyc+XCIpLFxyXG5cdFx0JG92ZXJsYXk6IHRoaXMuJG92ZXJsYXksXHJcblx0fSApO1xyXG5cclxuXHR0aGlzLnNldEFsbERyb3BEb3duID0gbmV3IE9PLnVpLkRyb3Bkb3duV2lkZ2V0KCB7XHJcblx0XHRsYWJlbDogbmV3IE9PLnVpLkh0bWxTbmlwcGV0KFwiPHNwYW4gc3R5bGU9XFxcImNvbG9yOiM3NzdcXFwiPlNldCBhbGwuLi48L3NwYW4+XCIpLFxyXG5cdFx0bWVudTogeyAvLyBGSVhNRTogbmVlZHMgcmVhbCBkYXRhXHJcblx0XHRcdGl0ZW1zOiBbXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVTZWN0aW9uT3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRsYWJlbDogXCJDbGFzc2VzXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwiQlwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiQlwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcIkNcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIkNcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJzdGFydFwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiU3RhcnRcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudVNlY3Rpb25PcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGxhYmVsOiBcIkltcG9ydGFuY2VzXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwidG9wXCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJUb3BcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJoaWdoXCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJIaWdoXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwibWlkXCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJNaWRcIlxyXG5cdFx0XHRcdH0gKVxyXG5cdFx0XHRdXHJcblx0XHR9LFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8c3BhbiBzdHlsZT1cXFwiZGlzcGxheTppbmxpbmUtYmxvY2s7d2lkdGg6YXV0b1xcXCI+XCIpLFxyXG5cdFx0JG92ZXJsYXk6IHRoaXMuJG92ZXJsYXksXHJcblx0fSApO1xyXG5cclxuXHR0aGlzLnJlbW92ZUFsbEJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoIHtcclxuXHRcdGljb246IFwidHJhc2hcIixcclxuXHRcdHRpdGxlOiBcIlJlbW92ZSBhbGxcIixcclxuXHRcdGZsYWdzOiBcImRlc3RydWN0aXZlXCJcclxuXHR9ICk7XHJcblx0dGhpcy5jbGVhckFsbEJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoIHtcclxuXHRcdGljb246IFwiY2FuY2VsXCIsXHJcblx0XHR0aXRsZTogXCJDbGVhciBhbGxcIixcclxuXHRcdGZsYWdzOiBcImRlc3RydWN0aXZlXCJcclxuXHR9ICk7XHJcblx0dGhpcy5ieXBhc3NBbGxCdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KCB7XHJcblx0XHRpY29uOiBcImFydGljbGVSZWRpcmVjdFwiLFxyXG5cdFx0dGl0bGU6IFwiQnlwYXNzIGFsbCByZWRpcmVjdHNcIlxyXG5cdH0gKTtcclxuXHR0aGlzLmRvQWxsQnV0dG9ucyA9IG5ldyBPTy51aS5CdXR0b25Hcm91cFdpZGdldCgge1xyXG5cdFx0aXRlbXM6IFtcclxuXHRcdFx0dGhpcy5yZW1vdmVBbGxCdXR0b24sXHJcblx0XHRcdHRoaXMuY2xlYXJBbGxCdXR0b24sXHJcblx0XHRcdHRoaXMuYnlwYXNzQWxsQnV0dG9uXHJcblx0XHRdLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8c3BhbiBzdHlsZT0nZmxvYXQ6cmlnaHQ7Jz5cIiksXHJcblx0fSApO1xyXG5cclxuXHR0aGlzLnRvcEJhci4kZWxlbWVudC5hcHBlbmQoXHJcblx0XHR0aGlzLnNlYXJjaEJveC4kZWxlbWVudCxcclxuXHRcdHRoaXMuc2V0QWxsRHJvcERvd24uJGVsZW1lbnQsXHJcblx0XHR0aGlzLmRvQWxsQnV0dG9ucy4kZWxlbWVudFxyXG5cdCkuY3NzKFwiYmFja2dyb3VuZFwiLFwiI2NjY1wiKTtcclxuXHJcblx0Ly8gRklYTUU6IHRoaXMgaXMgcGxhY2Vob2xkZXIgY29udGVudFxyXG5cdC8vIHRoaXMuY29udGVudC4kZWxlbWVudC5hcHBlbmQoIFwiPHNwYW4+KE5vIHByb2plY3QgYmFubmVycyB5ZXQpPC9zcGFuPlwiICk7XHJcblxyXG5cdHRoaXMuJGJvZHkuYXBwZW5kKCB0aGlzLm91dGVyTGF5b3V0LiRlbGVtZW50ICk7XHJcbn07XHJcblxyXG4vLyBPdmVycmlkZSB0aGUgZ2V0Qm9keUhlaWdodCgpIG1ldGhvZCB0byBzcGVjaWZ5IGEgY3VzdG9tIGhlaWdodFxyXG5NYWluV2luZG93LnByb3RvdHlwZS5nZXRCb2R5SGVpZ2h0ID0gZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiB0aGlzLnRvcEJhci4kZWxlbWVudC5vdXRlckhlaWdodCggdHJ1ZSApICsgdGhpcy5jb250ZW50LiRlbGVtZW50Lm91dGVySGVpZ2h0KCB0cnVlICk7XHJcbn07XHJcblxyXG4vLyBVc2UgZ2V0U2V0dXBQcm9jZXNzKCkgdG8gc2V0IHVwIHRoZSB3aW5kb3cgd2l0aCBkYXRhIHBhc3NlZCB0byBpdCBhdCB0aGUgdGltZSBcclxuLy8gb2Ygb3BlbmluZ1xyXG5NYWluV2luZG93LnByb3RvdHlwZS5nZXRTZXR1cFByb2Nlc3MgPSBmdW5jdGlvbiAoIGRhdGEgKSB7XHJcblx0ZGF0YSA9IGRhdGEgfHwge307XHJcblx0cmV0dXJuIE1haW5XaW5kb3cuc3VwZXIucHJvdG90eXBlLmdldFNldHVwUHJvY2Vzcy5jYWxsKCB0aGlzLCBkYXRhIClcclxuXHRcdC5uZXh0KCAoKSA9PiB7XHJcblx0XHRcdC8vIFRPRE86IFNldCB1cCB3aW5kb3cgYmFzZWQgb24gZGF0YVxyXG5cdFx0XHR0aGlzLmJhbm5lcnMgPSBkYXRhLmJhbm5lcnMubWFwKGJhbm5lclRlbXBsYXRlID0+IG5ldyBCYW5uZXJXaWRnZXQoYmFubmVyVGVtcGxhdGUpKTtcclxuXHRcdFx0Zm9yIChjb25zdCBiYW5uZXIgb2YgdGhpcy5iYW5uZXJzKSB7XHJcblx0XHRcdFx0dGhpcy5jb250ZW50LiRlbGVtZW50LmFwcGVuZChiYW5uZXIuJGVsZW1lbnQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRoaXMudGFsa1dpa2l0ZXh0ID0gZGF0YS50YWxrV2lraXRleHQ7XHJcblx0XHRcdHRoaXMudGFsa3BhZ2UgPSBkYXRhLnRhbGtwYWdlO1xyXG5cdFx0XHR0aGlzLnVwZGF0ZVNpemUoKTtcclxuXHRcdH0sIHRoaXMgKTtcclxufTtcclxuXHJcbi8vIFNldCB1cCB0aGUgd2luZG93IGl0IGlzIHJlYWR5OiBhdHRhY2hlZCB0byB0aGUgRE9NLCBhbmQgb3BlbmluZyBhbmltYXRpb24gY29tcGxldGVkXHJcbk1haW5XaW5kb3cucHJvdG90eXBlLmdldFJlYWR5UHJvY2VzcyA9IGZ1bmN0aW9uICggZGF0YSApIHtcclxuXHRkYXRhID0gZGF0YSB8fCB7fTtcclxuXHRyZXR1cm4gTWFpbldpbmRvdy5zdXBlci5wcm90b3R5cGUuZ2V0UmVhZHlQcm9jZXNzLmNhbGwoIHRoaXMsIGRhdGEgKVxyXG5cdFx0Lm5leHQoICgpID0+IHsgLy8gZm9yY2UgbGFiZWxzIHRvIHNob3cgYnkgZGVmYXVsdFxyXG5cdFx0XHR0aGlzLmJhbm5lcnMuZm9yRWFjaChiYW5uZXIgPT4ge1xyXG5cdFx0XHRcdGJhbm5lci5wYXJhbWV0ZXJXaWRnZXRzLmZvckVhY2gocGFyYW0gPT4gcGFyYW0uZm9jdXNJbnB1dCgpKTsgXHJcblx0XHRcdH0pO1xyXG5cdFx0fSwgdGhpcylcclxuXHRcdC5uZXh0KCAoKSA9PiB0aGlzLnNlYXJjaEJveC5mb2N1cygpKTsgLy8gc2VhcmNoIGJveCBpcyB3aGVyZSB3ZSByZWFsbHkgd2FudCBmb2N1cyB0byBiZVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgTWFpbldpbmRvdzsiLCJpbXBvcnQgY29uZmlnIGZyb20gXCIuL2NvbmZpZ1wiO1xyXG5pbXBvcnQge0FQSSwgbWFrZUVycm9yTXNnfSBmcm9tIFwiLi91dGlsXCI7XHJcbmltcG9ydCBzZXR1cFJhdGVyIGZyb20gXCIuL3NldHVwXCI7XHJcblxyXG52YXIgYXV0b1N0YXJ0ID0gZnVuY3Rpb24gYXV0b1N0YXJ0KCkge1xyXG5cdGlmICggd2luZG93LnJhdGVyX2F1dG9zdGFydE5hbWVzcGFjZXMgPT0gbnVsbCB8fCBjb25maWcubXcud2dJc01haW5QYWdlICkge1xyXG5cdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHR9XHJcblx0XHJcblx0dmFyIGF1dG9zdGFydE5hbWVzcGFjZXMgPSAoICQuaXNBcnJheSh3aW5kb3cucmF0ZXJfYXV0b3N0YXJ0TmFtZXNwYWNlcykgKSA/IHdpbmRvdy5yYXRlcl9hdXRvc3RhcnROYW1lc3BhY2VzIDogW3dpbmRvdy5yYXRlcl9hdXRvc3RhcnROYW1lc3BhY2VzXTtcclxuXHRcclxuXHRpZiAoIC0xID09PSBhdXRvc3RhcnROYW1lc3BhY2VzLmluZGV4T2YoY29uZmlnLm13LndnTmFtZXNwYWNlTnVtYmVyKSApIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0fVxyXG5cdFxyXG5cdGlmICggLyg/OlxcP3wmKSg/OmFjdGlvbnxkaWZmfG9sZGlkKT0vLnRlc3Qod2luZG93LmxvY2F0aW9uLmhyZWYpICkge1xyXG5cdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHR9XHJcblx0XHJcblx0Ly8gQ2hlY2sgaWYgdGFsayBwYWdlIGV4aXN0c1xyXG5cdGlmICggJChcIiNjYS10YWxrLm5ld1wiKS5sZW5ndGggKSB7XHJcblx0XHRyZXR1cm4gc2V0dXBSYXRlcigpO1xyXG5cdH1cclxuXHRcclxuXHR2YXIgdGhpc1BhZ2UgPSBtdy5UaXRsZS5uZXdGcm9tVGV4dChjb25maWcubXcud2dQYWdlTmFtZSk7XHJcblx0dmFyIHRhbGtQYWdlID0gdGhpc1BhZ2UgJiYgdGhpc1BhZ2UuZ2V0VGFsa1BhZ2UoKTtcclxuXHRpZiAoIXRhbGtQYWdlKSB7XHJcblx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgpO1xyXG5cdH1cclxuXHJcblx0LyogQ2hlY2sgdGVtcGxhdGVzIHByZXNlbnQgb24gdGFsayBwYWdlLiBGZXRjaGVzIGluZGlyZWN0bHkgdHJhbnNjbHVkZWQgdGVtcGxhdGVzLCBzbyB3aWxsIGZpbmRcclxuXHRcdFRlbXBsYXRlOldQQmFubmVyTWV0YSAoYW5kIGl0cyBzdWJ0ZW1wbGF0ZXMpLiBCdXQgc29tZSBiYW5uZXJzIHN1Y2ggYXMgTUlMSElTVCBkb24ndCB1c2UgdGhhdFxyXG5cdFx0bWV0YSB0ZW1wbGF0ZSwgc28gd2UgYWxzbyBoYXZlIHRvIGNoZWNrIGZvciB0ZW1wbGF0ZSB0aXRsZXMgY29udGFpbmcgJ1dpa2lQcm9qZWN0J1xyXG5cdCovXHJcblx0cmV0dXJuIEFQSS5nZXQoe1xyXG5cdFx0YWN0aW9uOiBcInF1ZXJ5XCIsXHJcblx0XHRmb3JtYXQ6IFwianNvblwiLFxyXG5cdFx0cHJvcDogXCJ0ZW1wbGF0ZXNcIixcclxuXHRcdHRpdGxlczogdGFsa1BhZ2UuZ2V0UHJlZml4ZWRUZXh0KCksXHJcblx0XHR0bG5hbWVzcGFjZTogXCIxMFwiLFxyXG5cdFx0dGxsaW1pdDogXCI1MDBcIixcclxuXHRcdGluZGV4cGFnZWlkczogMVxyXG5cdH0pXHJcblx0XHQudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcclxuXHRcdFx0dmFyIGlkID0gcmVzdWx0LnF1ZXJ5LnBhZ2VpZHM7XHJcblx0XHRcdHZhciB0ZW1wbGF0ZXMgPSByZXN1bHQucXVlcnkucGFnZXNbaWRdLnRlbXBsYXRlcztcclxuXHRcdFxyXG5cdFx0XHRpZiAoICF0ZW1wbGF0ZXMgKSB7XHJcblx0XHRcdFx0cmV0dXJuIHNldHVwUmF0ZXIoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHJcblx0XHRcdHZhciBoYXNXaWtpcHJvamVjdCA9IHRlbXBsYXRlcy5zb21lKHRlbXBsYXRlID0+IC8oV2lraVByb2plY3R8V1BCYW5uZXIpLy50ZXN0KHRlbXBsYXRlLnRpdGxlKSk7XHJcblx0XHRcclxuXHRcdFx0aWYgKCAhaGFzV2lraXByb2plY3QgKSB7XHJcblx0XHRcdFx0cmV0dXJuIHNldHVwUmF0ZXIoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHJcblx0XHR9LFxyXG5cdFx0ZnVuY3Rpb24oY29kZSwganF4aHIpIHtcclxuXHRcdC8vIFNpbGVudGx5IGlnbm9yZSBmYWlsdXJlcyAoanVzdCBsb2cgdG8gY29uc29sZSlcclxuXHRcdFx0Y29uc29sZS53YXJuKFxyXG5cdFx0XHRcdFwiW1JhdGVyXSBFcnJvciB3aGlsZSBjaGVja2luZyB3aGV0aGVyIHRvIGF1dG9zdGFydC5cIiArXHJcblx0XHRcdCggY29kZSA9PSBudWxsICkgPyBcIlwiIDogXCIgXCIgKyBtYWtlRXJyb3JNc2coY29kZSwganF4aHIpXHJcblx0XHRcdCk7XHJcblx0XHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0XHR9KTtcclxuXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhdXRvU3RhcnQ7IiwiaW1wb3J0IHtpc0FmdGVyRGF0ZX0gZnJvbSBcIi4vdXRpbFwiO1xyXG5cclxuLyoqIHdyaXRlXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcclxuICogQHBhcmFtIHtBcnJheXxPYmplY3R9IHZhbFxyXG4gKiBAcGFyYW0ge051bWJlcn0gc3RhbGVEYXlzIE51bWJlciBvZiBkYXlzIGFmdGVyIHdoaWNoIHRoZSBkYXRhIGJlY29tZXMgc3RhbGUgKHVzYWJsZSwgYnV0IHNob3VsZFxyXG4gKiAgYmUgdXBkYXRlZCBmb3IgbmV4dCB0aW1lKS5cclxuICogQHBhcmFtIHtOdW1iZXJ9IGV4cGlyeURheXMgTnVtYmVyIG9mIGRheXMgYWZ0ZXIgd2hpY2ggdGhlIGNhY2hlZCBkYXRhIG1heSBiZSBkZWxldGVkLlxyXG4gKi9cclxudmFyIHdyaXRlID0gZnVuY3Rpb24oa2V5LCB2YWwsIHN0YWxlRGF5cywgZXhwaXJ5RGF5cykge1xyXG5cdHRyeSB7XHJcblx0XHR2YXIgZGVmYXVsdFN0YWxlRGF5cyA9IDE7XHJcblx0XHR2YXIgZGVmYXVsdEV4cGlyeURheXMgPSAzMDtcclxuXHRcdHZhciBtaWxsaXNlY29uZHNQZXJEYXkgPSAyNCo2MCo2MCoxMDAwO1xyXG5cclxuXHRcdHZhciBzdGFsZUR1cmF0aW9uID0gKHN0YWxlRGF5cyB8fCBkZWZhdWx0U3RhbGVEYXlzKSptaWxsaXNlY29uZHNQZXJEYXk7XHJcblx0XHR2YXIgZXhwaXJ5RHVyYXRpb24gPSAoZXhwaXJ5RGF5cyB8fCBkZWZhdWx0RXhwaXJ5RGF5cykqbWlsbGlzZWNvbmRzUGVyRGF5O1xyXG5cdFx0XHJcblx0XHR2YXIgc3RyaW5nVmFsID0gSlNPTi5zdHJpbmdpZnkoe1xyXG5cdFx0XHR2YWx1ZTogdmFsLFxyXG5cdFx0XHRzdGFsZURhdGU6IG5ldyBEYXRlKERhdGUubm93KCkgKyBzdGFsZUR1cmF0aW9uKS50b0lTT1N0cmluZygpLFxyXG5cdFx0XHRleHBpcnlEYXRlOiBuZXcgRGF0ZShEYXRlLm5vdygpICsgZXhwaXJ5RHVyYXRpb24pLnRvSVNPU3RyaW5nKClcclxuXHRcdH0pO1xyXG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJSYXRlci1cIitrZXksIHN0cmluZ1ZhbCk7XHJcblx0fSAgY2F0Y2goZSkge30gLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1lbXB0eVxyXG59O1xyXG4vKiogcmVhZFxyXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XHJcbiAqIEByZXR1cm5zIHtBcnJheXxPYmplY3R8U3RyaW5nfE51bGx9IENhY2hlZCBhcnJheSBvciBvYmplY3QsIG9yIGVtcHR5IHN0cmluZyBpZiBub3QgeWV0IGNhY2hlZCxcclxuICogICAgICAgICAgb3IgbnVsbCBpZiB0aGVyZSB3YXMgZXJyb3IuXHJcbiAqL1xyXG52YXIgcmVhZCA9IGZ1bmN0aW9uKGtleSkge1xyXG5cdHZhciB2YWw7XHJcblx0dHJ5IHtcclxuXHRcdHZhciBzdHJpbmdWYWwgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcIlJhdGVyLVwiK2tleSk7XHJcblx0XHRpZiAoIHN0cmluZ1ZhbCAhPT0gXCJcIiApIHtcclxuXHRcdFx0dmFsID0gSlNPTi5wYXJzZShzdHJpbmdWYWwpO1xyXG5cdFx0fVxyXG5cdH0gIGNhdGNoKGUpIHtcclxuXHRcdGNvbnNvbGUubG9nKFwiW1JhdGVyXSBlcnJvciByZWFkaW5nIFwiICsga2V5ICsgXCIgZnJvbSBsb2NhbFN0b3JhZ2UgY2FjaGU6XCIpO1xyXG5cdFx0Y29uc29sZS5sb2coXHJcblx0XHRcdFwiXFx0XCIgKyBlLm5hbWUgKyBcIiBtZXNzYWdlOiBcIiArIGUubWVzc2FnZSArXHJcblx0XHRcdCggZS5hdCA/IFwiIGF0OiBcIiArIGUuYXQgOiBcIlwiKSArXHJcblx0XHRcdCggZS50ZXh0ID8gXCIgdGV4dDogXCIgKyBlLnRleHQgOiBcIlwiKVxyXG5cdFx0KTtcclxuXHR9XHJcblx0cmV0dXJuIHZhbCB8fCBudWxsO1xyXG59O1xyXG52YXIgY2xlYXJJdGVtSWZJbnZhbGlkID0gZnVuY3Rpb24oa2V5KSB7XHJcblx0dmFyIGlzUmF0ZXJLZXkgPSBrZXkuaW5kZXhPZihcIlJhdGVyLVwiKSA9PT0gMDtcclxuXHRpZiAoICFpc1JhdGVyS2V5ICkge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHR2YXIgaXRlbSA9IHJlYWQoa2V5LnJlcGxhY2UoXCJSYXRlci1cIixcIlwiKSk7XHJcblx0dmFyIGlzSW52YWxpZCA9ICFpdGVtIHx8ICFpdGVtLmV4cGlyeURhdGUgfHwgaXNBZnRlckRhdGUoaXRlbS5leHBpcnlEYXRlKTtcclxuXHRpZiAoIGlzSW52YWxpZCApIHtcclxuXHRcdGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGtleSk7XHJcblx0fVxyXG59O1xyXG52YXIgY2xlYXJJbnZhbGlkSXRlbXMgPSBmdW5jdGlvbigpIHtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGxvY2FsU3RvcmFnZS5sZW5ndGg7IGkrKykge1xyXG5cdFx0c2V0VGltZW91dChjbGVhckl0ZW1JZkludmFsaWQsIDEwMCwgbG9jYWxTdG9yYWdlLmtleShpKSk7XHJcblx0fVxyXG59O1xyXG5cclxuZXhwb3J0IHsgd3JpdGUsIHJlYWQsIGNsZWFySXRlbUlmSW52YWxpZCwgY2xlYXJJbnZhbGlkSXRlbXMgfTsiLCIvLyBBIGdsb2JhbCBvYmplY3QgdGhhdCBzdG9yZXMgYWxsIHRoZSBwYWdlIGFuZCB1c2VyIGNvbmZpZ3VyYXRpb24gYW5kIHNldHRpbmdzXHJcbnZhciBjb25maWcgPSB7fTtcclxuLy8gU2NyaXB0IGluZm9cclxuY29uZmlnLnNjcmlwdCA9IHtcclxuXHQvLyBBZHZlcnQgdG8gYXBwZW5kIHRvIGVkaXQgc3VtbWFyaWVzXHJcblx0YWR2ZXJ0OiAgXCIgKFtbVXNlcjpFdmFkMzcvcmF0ZXIuanN8UmF0ZXJdXSlcIixcclxuXHR2ZXJzaW9uOiBcIjIuMC4wXCJcclxufTtcclxuLy8gUHJlZmVyZW5jZXM6IGdsb2JhbHMgdmFycyBhZGRlZCB0byB1c2VycycgY29tbW9uLmpzLCBvciBzZXQgdG8gZGVmYXVsdHMgaWYgdW5kZWZpbmVkXHJcbmNvbmZpZy5wcmVmcyA9IHtcclxuXHR3YXRjaGxpc3Q6IHdpbmRvdy5yYXRlcl93YXRjaGxpc3QgfHwgXCJwcmVmZXJlbmNlc1wiXHJcbn07XHJcbi8vIE1lZGlhV2lraSBjb25maWd1cmF0aW9uIHZhbHVlc1xyXG5jb25maWcubXcgPSBtdy5jb25maWcuZ2V0KCBbXHJcblx0XCJza2luXCIsXHJcblx0XCJ3Z1BhZ2VOYW1lXCIsXHJcblx0XCJ3Z05hbWVzcGFjZU51bWJlclwiLFxyXG5cdFwid2dVc2VyTmFtZVwiLFxyXG5cdFwid2dGb3JtYXR0ZWROYW1lc3BhY2VzXCIsXHJcblx0XCJ3Z01vbnRoTmFtZXNcIixcclxuXHRcIndnUmV2aXNpb25JZFwiLFxyXG5cdFwid2dTY3JpcHRQYXRoXCIsXHJcblx0XCJ3Z1NlcnZlclwiLFxyXG5cdFwid2dDYXRlZ29yaWVzXCIsXHJcblx0XCJ3Z0lzTWFpblBhZ2VcIlxyXG5dICk7XHJcblxyXG5jb25maWcucmVnZXggPSB7IC8qIGVzbGludC1kaXNhYmxlIG5vLXVzZWxlc3MtZXNjYXBlICovXHJcblx0Ly8gUGF0dGVybiB0byBmaW5kIHRlbXBsYXRlcywgd2hpY2ggbWF5IGNvbnRhaW4gb3RoZXIgdGVtcGxhdGVzXHJcblx0dGVtcGxhdGU6XHRcdC9cXHtcXHtcXHMqKFteI1xce1xcc10uKz8pXFxzKihcXHwoPzoufFxcbikqPyg/Oig/Olxce1xceyg/Oi58XFxuKSo/KD86KD86XFx7XFx7KD86LnxcXG4pKj9cXH1cXH0pKD86LnxcXG4pKj8pKj9cXH1cXH0pKD86LnxcXG4pKj8pKnwpXFx9XFx9XFxuPy9nLFxyXG5cdC8vIFBhdHRlcm4gdG8gZmluZCBgfHBhcmFtPXZhbHVlYCBvciBgfHZhbHVlYCwgd2hlcmUgYHZhbHVlYCBjYW4gb25seSBjb250YWluIGEgcGlwZVxyXG5cdC8vIGlmIHdpdGhpbiBzcXVhcmUgYnJhY2tldHMgKGkuZS4gd2lraWxpbmtzKSBvciBicmFjZXMgKGkuZS4gdGVtcGxhdGVzKVxyXG5cdHRlbXBsYXRlUGFyYW1zOlx0L1xcfCg/ISg/Oltee10rfXxbXlxcW10rXSkpKD86LnxcXHMpKj8oPz0oPzpcXHx8JCkoPyEoPzpbXntdK318W15cXFtdK10pKSkvZ1xyXG59OyAvKiBlc2xpbnQtZW5hYmxlIG5vLXVzZWxlc3MtZXNjYXBlICovXHJcbmNvbmZpZy5kZWZlcnJlZCA9IHt9O1xyXG5jb25maWcuYmFubmVyRGVmYXVsdHMgPSB7XHJcblx0Y2xhc3NlczogW1xyXG5cdFx0XCJGQVwiLFxyXG5cdFx0XCJGTFwiLFxyXG5cdFx0XCJBXCIsXHJcblx0XHRcIkdBXCIsXHJcblx0XHRcIkJcIixcclxuXHRcdFwiQ1wiLFxyXG5cdFx0XCJTdGFydFwiLFxyXG5cdFx0XCJTdHViXCIsXHJcblx0XHRcIkxpc3RcIlxyXG5cdF0sXHJcblx0aW1wb3J0YW5jZXM6IFtcclxuXHRcdFwiVG9wXCIsXHJcblx0XHRcIkhpZ2hcIixcclxuXHRcdFwiTWlkXCIsXHJcblx0XHRcIkxvd1wiXHJcblx0XSxcclxuXHRleHRlbmRlZENsYXNzZXM6IFtcclxuXHRcdFwiQ2F0ZWdvcnlcIixcclxuXHRcdFwiRHJhZnRcIixcclxuXHRcdFwiRmlsZVwiLFxyXG5cdFx0XCJQb3J0YWxcIixcclxuXHRcdFwiUHJvamVjdFwiLFxyXG5cdFx0XCJUZW1wbGF0ZVwiLFxyXG5cdFx0XCJCcGx1c1wiLFxyXG5cdFx0XCJGdXR1cmVcIixcclxuXHRcdFwiQ3VycmVudFwiLFxyXG5cdFx0XCJEaXNhbWJpZ1wiLFxyXG5cdFx0XCJOQVwiLFxyXG5cdFx0XCJSZWRpcmVjdFwiLFxyXG5cdFx0XCJCb29rXCJcclxuXHRdLFxyXG5cdGV4dGVuZGVkSW1wb3J0YW5jZXM6IFtcclxuXHRcdFwiVG9wXCIsXHJcblx0XHRcIkhpZ2hcIixcclxuXHRcdFwiTWlkXCIsXHJcblx0XHRcIkxvd1wiLFxyXG5cdFx0XCJCb3R0b21cIixcclxuXHRcdFwiTkFcIlxyXG5cdF1cclxufTtcclxuY29uZmlnLmN1c3RvbUNsYXNzZXMgPSB7XHJcblx0XCJXaWtpUHJvamVjdCBNaWxpdGFyeSBoaXN0b3J5XCI6IFtcclxuXHRcdFwiQUxcIixcclxuXHRcdFwiQkxcIixcclxuXHRcdFwiQ0xcIlxyXG5cdF0sXHJcblx0XCJXaWtpUHJvamVjdCBQb3J0YWxzXCI6IFtcclxuXHRcdFwiRlBvXCIsXHJcblx0XHRcIkNvbXBsZXRlXCIsXHJcblx0XHRcIlN1YnN0YW50aWFsXCIsXHJcblx0XHRcIkJhc2ljXCIsXHJcblx0XHRcIkluY29tcGxldGVcIixcclxuXHRcdFwiTWV0YVwiXHJcblx0XVxyXG59O1xyXG5jb25maWcuc2hlbGxUZW1wbGF0ZXMgPSBbXHJcblx0XCJXaWtpUHJvamVjdCBiYW5uZXIgc2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0QmFubmVyc1wiLFxyXG5cdFwiV2lraVByb2plY3QgQmFubmVyc1wiLFxyXG5cdFwiV1BCXCIsXHJcblx0XCJXUEJTXCIsXHJcblx0XCJXaWtpcHJvamVjdGJhbm5lcnNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdCBCYW5uZXIgU2hlbGxcIixcclxuXHRcIldwYlwiLFxyXG5cdFwiV1BCYW5uZXJTaGVsbFwiLFxyXG5cdFwiV3Bic1wiLFxyXG5cdFwiV2lraXByb2plY3RiYW5uZXJzXCIsXHJcblx0XCJXUCBCYW5uZXIgU2hlbGxcIixcclxuXHRcIldQIGJhbm5lciBzaGVsbFwiLFxyXG5cdFwiQmFubmVyc2hlbGxcIixcclxuXHRcIldpa2lwcm9qZWN0IGJhbm5lciBzaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3QgQmFubmVycyBTaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3RCYW5uZXIgU2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0QmFubmVyU2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0IEJhbm5lclNoZWxsXCIsXHJcblx0XCJXaWtpcHJvamVjdEJhbm5lclNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdCBiYW5uZXIgc2hlbGwvcmVkaXJlY3RcIixcclxuXHRcIldpa2lQcm9qZWN0IFNoZWxsXCIsXHJcblx0XCJCYW5uZXIgc2hlbGxcIixcclxuXHRcIlNjb3BlIHNoZWxsXCIsXHJcblx0XCJQcm9qZWN0IHNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdCBiYW5uZXJcIlxyXG5dO1xyXG5jb25maWcuZGVmYXVsdFBhcmFtZXRlckRhdGEgPSB7XHJcblx0XCJhdXRvXCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiQXV0by1yYXRlZFwiXHJcblx0XHR9LFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJBdXRvbWF0aWNhbGx5IHJhdGVkIGJ5IGEgYm90LiBBbGxvd2VkIHZhbHVlczogWyd5ZXMnXS5cIlxyXG5cdFx0fSxcclxuXHRcdFwiYXV0b3ZhbHVlXCI6IFwieWVzXCJcclxuXHR9LFxyXG5cdFwibGlzdGFzXCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiTGlzdCBhc1wiXHJcblx0XHR9LFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJTb3J0a2V5IGZvciB0YWxrIHBhZ2VcIlxyXG5cdFx0fVxyXG5cdH0sXHJcblx0XCJzbWFsbFwiOiB7XHJcblx0XHRcImxhYmVsXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIlNtYWxsP1wiLFxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiRGlzcGxheSBhIHNtYWxsIHZlcnNpb24uIEFsbG93ZWQgdmFsdWVzOiBbJ3llcyddLlwiXHJcblx0XHR9LFxyXG5cdFx0XCJhdXRvdmFsdWVcIjogXCJ5ZXNcIlxyXG5cdH0sXHJcblx0XCJhdHRlbnRpb25cIjoge1xyXG5cdFx0XCJsYWJlbFwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJBdHRlbnRpb24gcmVxdWlyZWQ/XCIsXHJcblx0XHR9LFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJJbW1lZGlhdGUgYXR0ZW50aW9uIHJlcXVpcmVkLiBBbGxvd2VkIHZhbHVlczogWyd5ZXMnXS5cIlxyXG5cdFx0fSxcclxuXHRcdFwiYXV0b3ZhbHVlXCI6IFwieWVzXCJcclxuXHR9LFxyXG5cdFwibmVlZHMtaW1hZ2VcIjoge1xyXG5cdFx0XCJsYWJlbFwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJOZWVkcyBpbWFnZT9cIixcclxuXHRcdH0sXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIlJlcXVlc3QgdGhhdCBhbiBpbWFnZSBvciBwaG90b2dyYXBoIG9mIHRoZSBzdWJqZWN0IGJlIGFkZGVkIHRvIHRoZSBhcnRpY2xlLiBBbGxvd2VkIHZhbHVlczogWyd5ZXMnXS5cIlxyXG5cdFx0fSxcclxuXHRcdFwiYWxpYXNlc1wiOiBbXHJcblx0XHRcdFwibmVlZHMtcGhvdG9cIlxyXG5cdFx0XSxcclxuXHRcdFwiYXV0b3ZhbHVlXCI6IFwieWVzXCIsXHJcblx0XHRcInN1Z2dlc3RlZFwiOiB0cnVlXHJcblx0fSxcclxuXHRcIm5lZWRzLWluZm9ib3hcIjoge1xyXG5cdFx0XCJsYWJlbFwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJOZWVkcyBpbmZvYm94P1wiLFxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiUmVxdWVzdCB0aGF0IGFuIGluZm9ib3ggYmUgYWRkZWQgdG8gdGhlIGFydGljbGUuIEFsbG93ZWQgdmFsdWVzOiBbJ3llcyddLlwiXHJcblx0XHR9LFxyXG5cdFx0XCJhbGlhc2VzXCI6IFtcclxuXHRcdFx0XCJuZWVkcy1waG90b1wiXHJcblx0XHRdLFxyXG5cdFx0XCJhdXRvdmFsdWVcIjogXCJ5ZXNcIixcclxuXHRcdFwic3VnZ2VzdGVkXCI6IHRydWVcclxuXHR9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjb25maWc7IiwiLy8gQXR0cmlidXRpb246IERpZmYgc3R5bGVzIGZyb20gPGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1dpa2lwZWRpYTpBdXRvV2lraUJyb3dzZXIvc3R5bGUuY3NzPlxyXG52YXIgZGlmZlN0eWxlcyA9IGB0YWJsZS5kaWZmLCB0ZC5kaWZmLW90aXRsZSwgdGQuZGlmZi1udGl0bGUgeyBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZTsgfVxyXG50ZC5kaWZmLW90aXRsZSwgdGQuZGlmZi1udGl0bGUgeyB0ZXh0LWFsaWduOiBjZW50ZXI7IH1cclxudGQuZGlmZi1tYXJrZXIgeyB0ZXh0LWFsaWduOiByaWdodDsgZm9udC13ZWlnaHQ6IGJvbGQ7IGZvbnQtc2l6ZTogMS4yNWVtOyB9XHJcbnRkLmRpZmYtbGluZW5vIHsgZm9udC13ZWlnaHQ6IGJvbGQ7IH1cclxudGQuZGlmZi1hZGRlZGxpbmUsIHRkLmRpZmYtZGVsZXRlZGxpbmUsIHRkLmRpZmYtY29udGV4dCB7IGZvbnQtc2l6ZTogODglOyB2ZXJ0aWNhbC1hbGlnbjogdG9wOyB3aGl0ZS1zcGFjZTogLW1vei1wcmUtd3JhcDsgd2hpdGUtc3BhY2U6IHByZS13cmFwOyB9XHJcbnRkLmRpZmYtYWRkZWRsaW5lLCB0ZC5kaWZmLWRlbGV0ZWRsaW5lIHsgYm9yZGVyLXN0eWxlOiBzb2xpZDsgYm9yZGVyLXdpZHRoOiAxcHggMXB4IDFweCA0cHg7IGJvcmRlci1yYWRpdXM6IDAuMzNlbTsgfVxyXG50ZC5kaWZmLWFkZGVkbGluZSB7IGJvcmRlci1jb2xvcjogI2EzZDNmZjsgfVxyXG50ZC5kaWZmLWRlbGV0ZWRsaW5lIHsgYm9yZGVyLWNvbG9yOiAjZmZlNDljOyB9XHJcbnRkLmRpZmYtY29udGV4dCB7IGJhY2tncm91bmQ6ICNmM2YzZjM7IGNvbG9yOiAjMzMzMzMzOyBib3JkZXItc3R5bGU6IHNvbGlkOyBib3JkZXItd2lkdGg6IDFweCAxcHggMXB4IDRweDsgYm9yZGVyLWNvbG9yOiAjZTZlNmU2OyBib3JkZXItcmFkaXVzOiAwLjMzZW07IH1cclxuLmRpZmZjaGFuZ2UgeyBmb250LXdlaWdodDogYm9sZDsgdGV4dC1kZWNvcmF0aW9uOiBub25lOyB9XHJcbnRhYmxlLmRpZmYge1xyXG4gICAgYm9yZGVyOiBub25lO1xyXG4gICAgd2lkdGg6IDk4JTsgYm9yZGVyLXNwYWNpbmc6IDRweDtcclxuICAgIHRhYmxlLWxheW91dDogZml4ZWQ7IC8qIEVuc3VyZXMgdGhhdCBjb2x1bXMgYXJlIG9mIGVxdWFsIHdpZHRoICovXHJcbn1cclxudGQuZGlmZi1hZGRlZGxpbmUgLmRpZmZjaGFuZ2UsIHRkLmRpZmYtZGVsZXRlZGxpbmUgLmRpZmZjaGFuZ2UgeyBib3JkZXItcmFkaXVzOiAwLjMzZW07IHBhZGRpbmc6IDAuMjVlbSAwOyB9XHJcbnRkLmRpZmYtYWRkZWRsaW5lIC5kaWZmY2hhbmdlIHtcdGJhY2tncm91bmQ6ICNkOGVjZmY7IH1cclxudGQuZGlmZi1kZWxldGVkbGluZSAuZGlmZmNoYW5nZSB7IGJhY2tncm91bmQ6ICNmZWVlYzg7IH1cclxudGFibGUuZGlmZiB0ZCB7XHRwYWRkaW5nOiAwLjMzZW0gMC42NmVtOyB9XHJcbnRhYmxlLmRpZmYgY29sLmRpZmYtbWFya2VyIHsgd2lkdGg6IDIlOyB9XHJcbnRhYmxlLmRpZmYgY29sLmRpZmYtY29udGVudCB7IHdpZHRoOiA0OCU7IH1cclxudGFibGUuZGlmZiB0ZCBkaXYge1xyXG4gICAgLyogRm9yY2Utd3JhcCB2ZXJ5IGxvbmcgbGluZXMgc3VjaCBhcyBVUkxzIG9yIHBhZ2Utd2lkZW5pbmcgY2hhciBzdHJpbmdzLiAqL1xyXG4gICAgd29yZC13cmFwOiBicmVhay13b3JkO1xyXG4gICAgLyogQXMgZmFsbGJhY2sgKEZGPDMuNSwgT3BlcmEgPDEwLjUpLCBzY3JvbGxiYXJzIHdpbGwgYmUgYWRkZWQgZm9yIHZlcnkgd2lkZSBjZWxsc1xyXG4gICAgICAgIGluc3RlYWQgb2YgdGV4dCBvdmVyZmxvd2luZyBvciB3aWRlbmluZyAqL1xyXG4gICAgb3ZlcmZsb3c6IGF1dG87XHJcbn1gO1xyXG5cclxuZXhwb3J0IHsgZGlmZlN0eWxlcyB9OyIsImltcG9ydCB7QVBJLCBpc0FmdGVyRGF0ZSwgbWFrZUVycm9yTXNnfSBmcm9tIFwiLi91dGlsXCI7XHJcbmltcG9ydCAqIGFzIGNhY2hlIGZyb20gXCIuL2NhY2hlXCI7XHJcblxyXG52YXIgY2FjaGVCYW5uZXJzID0gZnVuY3Rpb24oYmFubmVycywgYmFubmVyT3B0aW9ucykge1xyXG5cdGNhY2hlLndyaXRlKFwiYmFubmVyc1wiLCBiYW5uZXJzLCAyLCA2MCk7XHJcblx0Y2FjaGUud3JpdGUoXCJiYW5uZXJPcHRpb25zXCIsIGJhbm5lck9wdGlvbnMsIDIsIDYwKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGJhbm5lcnMvb3B0aW9ucyBmcm9tIHRoZSBBcGlcclxuICogXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlZCB3aXRoOiBiYW5uZXJzIG9iamVjdCwgYmFubmVyT3B0aW9ucyBhcnJheVxyXG4gKi9cclxudmFyIGdldExpc3RPZkJhbm5lcnNGcm9tQXBpID0gZnVuY3Rpb24oKSB7XHJcblxyXG5cdHZhciBmaW5pc2hlZFByb21pc2UgPSAkLkRlZmVycmVkKCk7XHJcblxyXG5cdHZhciBxdWVyeVNrZWxldG9uID0ge1xyXG5cdFx0YWN0aW9uOiBcInF1ZXJ5XCIsXHJcblx0XHRmb3JtYXQ6IFwianNvblwiLFxyXG5cdFx0bGlzdDogXCJjYXRlZ29yeW1lbWJlcnNcIixcclxuXHRcdGNtcHJvcDogXCJ0aXRsZVwiLFxyXG5cdFx0Y21uYW1lc3BhY2U6IFwiMTBcIixcclxuXHRcdGNtbGltaXQ6IFwiNTAwXCJcclxuXHR9O1xyXG5cclxuXHR2YXIgY2F0ZWdvcmllcyA9IFtcclxuXHRcdHtcclxuXHRcdFx0dGl0bGU6XCIgQ2F0ZWdvcnk6V2lraVByb2plY3QgYmFubmVycyB3aXRoIHF1YWxpdHkgYXNzZXNzbWVudFwiLFxyXG5cdFx0XHRhYmJyZXZpYXRpb246IFwid2l0aFJhdGluZ3NcIixcclxuXHRcdFx0YmFubmVyczogW10sXHJcblx0XHRcdHByb2Nlc3NlZDogJC5EZWZlcnJlZCgpXHJcblx0XHR9LFxyXG5cdFx0e1xyXG5cdFx0XHR0aXRsZTogXCJDYXRlZ29yeTpXaWtpUHJvamVjdCBiYW5uZXJzIHdpdGhvdXQgcXVhbGl0eSBhc3Nlc3NtZW50XCIsXHJcblx0XHRcdGFiYnJldmlhdGlvbjogXCJ3aXRob3V0UmF0aW5nc1wiLFxyXG5cdFx0XHRiYW5uZXJzOiBbXSxcclxuXHRcdFx0cHJvY2Vzc2VkOiAkLkRlZmVycmVkKClcclxuXHRcdH0sXHJcblx0XHR7XHJcblx0XHRcdHRpdGxlOiBcIkNhdGVnb3J5Oldpa2lQcm9qZWN0IGJhbm5lciB3cmFwcGVyIHRlbXBsYXRlc1wiLFxyXG5cdFx0XHRhYmJyZXZpYXRpb246IFwid3JhcHBlcnNcIixcclxuXHRcdFx0YmFubmVyczogW10sXHJcblx0XHRcdHByb2Nlc3NlZDogJC5EZWZlcnJlZCgpXHJcblx0XHR9XHJcblx0XTtcclxuXHJcblx0dmFyIHByb2Nlc3NRdWVyeSA9IGZ1bmN0aW9uKHJlc3VsdCwgY2F0SW5kZXgpIHtcclxuXHRcdGlmICggIXJlc3VsdC5xdWVyeSB8fCAhcmVzdWx0LnF1ZXJ5LmNhdGVnb3J5bWVtYmVycyApIHtcclxuXHRcdFx0Ly8gTm8gcmVzdWx0c1xyXG5cdFx0XHQvLyBUT0RPOiBlcnJvciBvciB3YXJuaW5nICoqKioqKioqXHJcblx0XHRcdGZpbmlzaGVkUHJvbWlzZS5yZWplY3QoKTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHQvLyBHYXRoZXIgdGl0bGVzIGludG8gYXJyYXkgLSBleGNsdWRpbmcgXCJUZW1wbGF0ZTpcIiBwcmVmaXhcclxuXHRcdHZhciByZXN1bHRUaXRsZXMgPSByZXN1bHQucXVlcnkuY2F0ZWdvcnltZW1iZXJzLm1hcChmdW5jdGlvbihpbmZvKSB7XHJcblx0XHRcdHJldHVybiBpbmZvLnRpdGxlLnNsaWNlKDkpO1xyXG5cdFx0fSk7XHJcblx0XHRBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShjYXRlZ29yaWVzW2NhdEluZGV4XS5iYW5uZXJzLCByZXN1bHRUaXRsZXMpO1xyXG5cdFx0XHJcblx0XHQvLyBDb250aW51ZSBxdWVyeSBpZiBuZWVkZWRcclxuXHRcdGlmICggcmVzdWx0LmNvbnRpbnVlICkge1xyXG5cdFx0XHRkb0FwaVF1ZXJ5KCQuZXh0ZW5kKGNhdGVnb3JpZXNbY2F0SW5kZXhdLnF1ZXJ5LCByZXN1bHQuY29udGludWUpLCBjYXRJbmRleCk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0Y2F0ZWdvcmllc1tjYXRJbmRleF0ucHJvY2Vzc2VkLnJlc29sdmUoKTtcclxuXHR9O1xyXG5cclxuXHR2YXIgZG9BcGlRdWVyeSA9IGZ1bmN0aW9uKHEsIGNhdEluZGV4KSB7XHJcblx0XHRBUEkuZ2V0KCBxIClcclxuXHRcdFx0LmRvbmUoIGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0XHRcdHByb2Nlc3NRdWVyeShyZXN1bHQsIGNhdEluZGV4KTtcclxuXHRcdFx0fSApXHJcblx0XHRcdC5mYWlsKCBmdW5jdGlvbihjb2RlLCBqcXhocikge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihcIltSYXRlcl0gXCIgKyBtYWtlRXJyb3JNc2coY29kZSwganF4aHIsIFwiQ291bGQgbm90IHJldHJpZXZlIHBhZ2VzIGZyb20gW1s6XCIgKyBxLmNtdGl0bGUgKyBcIl1dXCIpKTtcclxuXHRcdFx0XHRmaW5pc2hlZFByb21pc2UucmVqZWN0KCk7XHJcblx0XHRcdH0gKTtcclxuXHR9O1xyXG5cdFxyXG5cdGNhdGVnb3JpZXMuZm9yRWFjaChmdW5jdGlvbihjYXQsIGluZGV4LCBhcnIpIHtcclxuXHRcdGNhdC5xdWVyeSA9ICQuZXh0ZW5kKCB7IFwiY210aXRsZVwiOmNhdC50aXRsZSB9LCBxdWVyeVNrZWxldG9uICk7XHJcblx0XHQkLndoZW4oIGFycltpbmRleC0xXSAmJiBhcnJbaW5kZXgtMV0ucHJvY2Vzc2VkIHx8IHRydWUgKS50aGVuKGZ1bmN0aW9uKCl7XHJcblx0XHRcdGRvQXBpUXVlcnkoY2F0LnF1ZXJ5LCBpbmRleCk7XHJcblx0XHR9KTtcclxuXHR9KTtcclxuXHRcclxuXHRjYXRlZ29yaWVzW2NhdGVnb3JpZXMubGVuZ3RoLTFdLnByb2Nlc3NlZC50aGVuKGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgYmFubmVycyA9IHt9O1xyXG5cdFx0dmFyIHN0YXNoQmFubmVyID0gZnVuY3Rpb24oY2F0T2JqZWN0KSB7XHJcblx0XHRcdGJhbm5lcnNbY2F0T2JqZWN0LmFiYnJldmlhdGlvbl0gPSBjYXRPYmplY3QuYmFubmVycztcclxuXHRcdH07XHJcblx0XHR2YXIgbWVyZ2VCYW5uZXJzID0gZnVuY3Rpb24obWVyZ2VJbnRvVGhpc0FycmF5LCBjYXRPYmplY3QpIHtcclxuXHRcdFx0cmV0dXJuICQubWVyZ2UobWVyZ2VJbnRvVGhpc0FycmF5LCBjYXRPYmplY3QuYmFubmVycyk7XHJcblx0XHR9O1xyXG5cdFx0dmFyIG1ha2VPcHRpb24gPSBmdW5jdGlvbihiYW5uZXJOYW1lKSB7XHJcblx0XHRcdHZhciBpc1dyYXBwZXIgPSAoIC0xICE9PSAkLmluQXJyYXkoYmFubmVyTmFtZSwgY2F0ZWdvcmllc1syXS5iYW5uZXJzKSApO1xyXG5cdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdGRhdGE6ICAoIGlzV3JhcHBlciA/IFwic3Vic3Q6XCIgOiBcIlwiKSArIGJhbm5lck5hbWUsXHJcblx0XHRcdFx0bGFiZWw6IGJhbm5lck5hbWUucmVwbGFjZShcIldpa2lQcm9qZWN0IFwiLCBcIlwiKSArICggaXNXcmFwcGVyID8gXCIgW3RlbXBsYXRlIHdyYXBwZXJdXCIgOiBcIlwiKVxyXG5cdFx0XHR9O1xyXG5cdFx0fTtcclxuXHRcdGNhdGVnb3JpZXMuZm9yRWFjaChzdGFzaEJhbm5lcik7XHJcblx0XHRcclxuXHRcdHZhciBiYW5uZXJPcHRpb25zID0gY2F0ZWdvcmllcy5yZWR1Y2UobWVyZ2VCYW5uZXJzLCBbXSkubWFwKG1ha2VPcHRpb24pO1xyXG5cdFx0XHJcblx0XHRmaW5pc2hlZFByb21pc2UucmVzb2x2ZShiYW5uZXJzLCBiYW5uZXJPcHRpb25zKTtcclxuXHR9KTtcclxuXHRcclxuXHRyZXR1cm4gZmluaXNoZWRQcm9taXNlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYmFubmVycy9vcHRpb25zIGZyb20gY2FjaGUsIGlmIHRoZXJlIGFuZCBub3QgdG9vIG9sZFxyXG4gKiBcclxuICogQHJldHVybnMge1Byb21pc2V9IFJlc29sdmVkIHdpdGg6IGJhbm5lcnMgb2JqZWN0LCBiYW5uZXJPcHRpb25zIG9iamVjdFxyXG4gKi9cclxudmFyIGdldEJhbm5lcnNGcm9tQ2FjaGUgPSBmdW5jdGlvbigpIHtcclxuXHR2YXIgY2FjaGVkQmFubmVycyA9IGNhY2hlLnJlYWQoXCJiYW5uZXJzXCIpO1xyXG5cdHZhciBjYWNoZWRCYW5uZXJPcHRpb25zID0gY2FjaGUucmVhZChcImJhbm5lck9wdGlvbnNcIik7XHJcblx0aWYgKFxyXG5cdFx0IWNhY2hlZEJhbm5lcnMgfHxcclxuXHRcdCFjYWNoZWRCYW5uZXJzLnZhbHVlIHx8ICFjYWNoZWRCYW5uZXJzLnN0YWxlRGF0ZSB8fFxyXG5cdFx0IWNhY2hlZEJhbm5lck9wdGlvbnMgfHxcclxuXHRcdCFjYWNoZWRCYW5uZXJPcHRpb25zLnZhbHVlIHx8ICFjYWNoZWRCYW5uZXJPcHRpb25zLnN0YWxlRGF0ZVxyXG5cdCkge1xyXG5cdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHR9XHJcblx0aWYgKCBpc0FmdGVyRGF0ZShjYWNoZWRCYW5uZXJzLnN0YWxlRGF0ZSkgfHwgaXNBZnRlckRhdGUoY2FjaGVkQmFubmVyT3B0aW9ucy5zdGFsZURhdGUpICkge1xyXG5cdFx0Ly8gVXBkYXRlIGluIHRoZSBiYWNrZ3JvdW5kOyBzdGlsbCB1c2Ugb2xkIGxpc3QgdW50aWwgdGhlbiAgXHJcblx0XHRnZXRMaXN0T2ZCYW5uZXJzRnJvbUFwaSgpLnRoZW4oY2FjaGVCYW5uZXJzKTtcclxuXHR9XHJcblx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZXNvbHZlKGNhY2hlZEJhbm5lcnMudmFsdWUsIGNhY2hlZEJhbm5lck9wdGlvbnMudmFsdWUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYmFubmVycy9vcHRpb25zIGZyb20gY2FjaGUgb3IgQVBJLlxyXG4gKiBIYXMgc2lkZSBhZmZlY3Qgb2YgYWRkaW5nL3VwZGF0aW5nL2NsZWFyaW5nIGNhY2hlLlxyXG4gKiBcclxuICogQHJldHVybnMge1Byb21pc2U8T2JqZWN0LCBBcnJheT59IGJhbm5lcnMgb2JqZWN0LCBiYW5uZXJPcHRpb25zIG9iamVjdFxyXG4gKi9cclxudmFyIGdldEJhbm5lcnMgPSAoKSA9PiBnZXRCYW5uZXJzRnJvbUNhY2hlKCkudGhlbihcclxuXHQvLyBTdWNjZXNzOiBwYXNzIHRocm91Z2hcclxuXHQoYmFubmVycywgb3B0aW9ucykgPT4gJC5EZWZlcnJlZCgpLnJlc29sdmUoYmFubmVycywgb3B0aW9ucyksXHJcblx0Ly8gRmFpbHVyZTogZ2V0IGZyb20gQXBpLCB0aGVuIGNhY2hlIHRoZW1cclxuXHQoKSA9PiB7XHJcblx0XHR2YXIgYmFubmVyc1Byb21pc2UgPSBnZXRMaXN0T2ZCYW5uZXJzRnJvbUFwaSgpO1xyXG5cdFx0YmFubmVyc1Byb21pc2UudGhlbihjYWNoZUJhbm5lcnMpO1xyXG5cdFx0cmV0dXJuIGJhbm5lcnNQcm9taXNlO1xyXG5cdH1cclxuKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdldEJhbm5lcnM7IiwiaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuaW1wb3J0IHtBUEl9IGZyb20gXCIuL3V0aWxcIjtcclxuaW1wb3J0IHsgcGFyc2VUZW1wbGF0ZXMsIGdldFdpdGhSZWRpcmVjdFRvIH0gZnJvbSBcIi4vVGVtcGxhdGVcIjtcclxuaW1wb3J0IGdldEJhbm5lcnMgZnJvbSBcIi4vZ2V0QmFubmVyc1wiO1xyXG5pbXBvcnQgKiBhcyBjYWNoZSBmcm9tIFwiLi9jYWNoZVwiO1xyXG5pbXBvcnQgd2luZG93TWFuYWdlciBmcm9tIFwiLi93aW5kb3dNYW5hZ2VyXCI7XHJcblxyXG52YXIgc2V0dXBSYXRlciA9IGZ1bmN0aW9uKGNsaWNrRXZlbnQpIHtcclxuXHRpZiAoIGNsaWNrRXZlbnQgKSB7XHJcblx0XHRjbGlja0V2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0fVxyXG5cclxuXHR2YXIgc2V0dXBDb21wbGV0ZWRQcm9taXNlID0gJC5EZWZlcnJlZCgpO1xyXG4gICAgXHJcblx0dmFyIGN1cnJlbnRQYWdlID0gbXcuVGl0bGUubmV3RnJvbVRleHQoY29uZmlnLm13LndnUGFnZU5hbWUpO1xyXG5cdHZhciB0YWxrUGFnZSA9IGN1cnJlbnRQYWdlICYmIGN1cnJlbnRQYWdlLmdldFRhbGtQYWdlKCk7XHJcblx0dmFyIHN1YmplY3RQYWdlID0gY3VycmVudFBhZ2UgJiYgY3VycmVudFBhZ2UuZ2V0U3ViamVjdFBhZ2UoKTtcclxuIFxyXG5cdC8vIEdldCBsaXN0cyBvZiBhbGwgYmFubmVycyAodGFzayAxKVxyXG5cdHZhciBiYW5uZXJzUHJvbWlzZSA9IGdldEJhbm5lcnMoKTtcclxuXHJcblx0Ly8gTG9hZCB0YWxrIHBhZ2UgKHRhc2sgMilcclxuXHR2YXIgbG9hZFRhbGtQcm9taXNlID0gQVBJLmdldCgge1xyXG5cdFx0YWN0aW9uOiBcInF1ZXJ5XCIsXHJcblx0XHRwcm9wOiBcInJldmlzaW9uc1wiLFxyXG5cdFx0cnZwcm9wOiBcImNvbnRlbnRcIixcclxuXHRcdHJ2c2VjdGlvbjogXCIwXCIsXHJcblx0XHR0aXRsZXM6IHRhbGtQYWdlLmdldFByZWZpeGVkVGV4dCgpLFxyXG5cdFx0aW5kZXhwYWdlaWRzOiAxXHJcblx0fSApLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xyXG5cdFx0dmFyIGlkID0gcmVzdWx0LnF1ZXJ5LnBhZ2VpZHM7XHRcdFxyXG5cdFx0dmFyIHdpa2l0ZXh0ID0gKCBpZCA8IDAgKSA/IFwiXCIgOiByZXN1bHQucXVlcnkucGFnZXNbaWRdLnJldmlzaW9uc1swXVtcIipcIl07XHJcblx0XHRyZXR1cm4gd2lraXRleHQ7XHJcblx0fSk7XHJcblxyXG5cdC8vIFBhcnNlIHRhbGsgcGFnZSBmb3IgYmFubmVycyAodGFzayAzKVxyXG5cdHZhciBwYXJzZVRhbGtQcm9taXNlID0gbG9hZFRhbGtQcm9taXNlLnRoZW4od2lraXRleHQgPT4gcGFyc2VUZW1wbGF0ZXMod2lraXRleHQsIHRydWUpKSAvLyBHZXQgYWxsIHRlbXBsYXRlc1xyXG5cdFx0LnRoZW4odGVtcGxhdGVzID0+IGdldFdpdGhSZWRpcmVjdFRvKHRlbXBsYXRlcykpIC8vIENoZWNrIGZvciByZWRpcmVjdHNcclxuXHRcdC50aGVuKHRlbXBsYXRlcyA9PiB7XHJcblx0XHRcdHJldHVybiBiYW5uZXJzUHJvbWlzZS50aGVuKChhbGxCYW5uZXJzKSA9PiB7IC8vIEdldCBsaXN0IG9mIGFsbCBiYW5uZXIgdGVtcGxhdGVzXHJcblx0XHRcdFx0cmV0dXJuIHRlbXBsYXRlcy5maWx0ZXIodGVtcGxhdGUgPT4geyAvLyBGaWx0ZXIgb3V0IG5vbi1iYW5uZXJzXHJcblx0XHRcdFx0XHR2YXIgbWFpblRleHQgPSB0ZW1wbGF0ZS5yZWRpcmVjdFRvXHJcblx0XHRcdFx0XHRcdD8gdGVtcGxhdGUucmVkaXJlY3RUby5nZXRNYWluVGV4dCgpXHJcblx0XHRcdFx0XHRcdDogdGVtcGxhdGUuZ2V0VGl0bGUoKS5nZXRNYWluVGV4dCgpO1xyXG5cdFx0XHRcdFx0cmV0dXJuIGFsbEJhbm5lcnMud2l0aFJhdGluZ3MuaW5jbHVkZXMobWFpblRleHQpIHx8IFxyXG4gICAgICAgICAgICAgICAgICAgIGFsbEJhbm5lcnMud2l0aG91dFJhdGluZ3MuaW5jbHVkZXMobWFpblRleHQpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgYWxsQmFubmVycy53cmFwcGVycy5pbmNsdWRlcyhtYWluVGV4dCk7XHJcblx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdC5tYXAoZnVuY3Rpb24odGVtcGxhdGUpIHsgLy8gU2V0IHdyYXBwZXIgdGFyZ2V0IGlmIG5lZWRlZFxyXG5cdFx0XHRcdFx0XHR2YXIgbWFpblRleHQgPSB0ZW1wbGF0ZS5yZWRpcmVjdFRvXHJcblx0XHRcdFx0XHRcdFx0PyB0ZW1wbGF0ZS5yZWRpcmVjdFRvLmdldE1haW5UZXh0KClcclxuXHRcdFx0XHRcdFx0XHQ6IHRlbXBsYXRlLmdldFRpdGxlKCkuZ2V0TWFpblRleHQoKTtcclxuXHRcdFx0XHRcdFx0aWYgKGFsbEJhbm5lcnMud3JhcHBlcnMuaW5jbHVkZXMobWFpblRleHQpKSB7XHJcblx0XHRcdFx0XHRcdFx0dGVtcGxhdGUucmVkaXJlY3RzVG8gPSBtdy5UaXRsZS5uZXdGcm9tVGV4dChcIlRlbXBsYXRlOlN1YnN0OlwiICsgbWFpblRleHQpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdHJldHVybiB0ZW1wbGF0ZTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cclxuXHQvLyBSZXRyaWV2ZSBhbmQgc3RvcmUgVGVtcGxhdGVEYXRhICh0YXNrIDQpXHJcblx0dmFyIHRlbXBsYXRlRGF0YVByb21pc2UgPSBwYXJzZVRhbGtQcm9taXNlLnRoZW4odGVtcGxhdGVzID0+IHtcclxuXHRcdHRlbXBsYXRlcy5mb3JFYWNoKHRlbXBsYXRlID0+IHRlbXBsYXRlLnNldFBhcmFtRGF0YUFuZFN1Z2dlc3Rpb25zKCkpO1xyXG5cdFx0cmV0dXJuIHRlbXBsYXRlcztcclxuXHR9KTtcclxuXHJcblx0Ly8gQ2hlY2sgaWYgcGFnZSBpcyBhIHJlZGlyZWN0ICh0YXNrIDUpIC0gYnV0IGRvbid0IGVycm9yIG91dCBpZiByZXF1ZXN0IGZhaWxzXHJcblx0dmFyIHJlZGlyZWN0Q2hlY2tQcm9taXNlID0gQVBJLmdldFJhdyhzdWJqZWN0UGFnZS5nZXRQcmVmaXhlZFRleHQoKSlcclxuXHRcdC50aGVuKFxyXG5cdFx0XHQvLyBTdWNjZXNzXHJcblx0XHRcdGZ1bmN0aW9uKHJhd1BhZ2UpIHsgXHJcblx0XHRcdFx0aWYgKCAvXlxccyojUkVESVJFQ1QvaS50ZXN0KHJhd1BhZ2UpICkge1xyXG5cdFx0XHRcdFx0Ly8gZ2V0IHJlZGlyZWN0aW9uIHRhcmdldCwgb3IgYm9vbGVhbiB0cnVlXHJcblx0XHRcdFx0XHRyZXR1cm4gcmF3UGFnZS5zbGljZShyYXdQYWdlLmluZGV4T2YoXCJbW1wiKSsyLCByYXdQYWdlLmluZGV4T2YoXCJdXVwiKSkgfHwgdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHQvLyBGYWlsdXJlIChpZ25vcmVkKVxyXG5cdFx0XHRmdW5jdGlvbigpIHsgcmV0dXJuIG51bGw7IH1cclxuXHRcdCk7XHJcblxyXG5cdC8vIFJldHJpZXZlIHJhdGluZyBmcm9tIE9SRVMgKHRhc2sgNiwgb25seSBuZWVkZWQgZm9yIGFydGljbGVzKVxyXG5cdHZhciBzaG91bGRHZXRPcmVzID0gKCBjb25maWcubXcud2dOYW1lc3BhY2VOdW1iZXIgPD0gMSApO1xyXG5cdGlmICggc2hvdWxkR2V0T3JlcyApIHtcclxuXHRcdHZhciBsYXRlc3RSZXZJZFByb21pc2UgPSBjdXJyZW50UGFnZS5pc1RhbGtQYWdlKClcclxuXHRcdFx0PyAkLkRlZmVycmVkKCkucmVzb2x2ZShjb25maWcubXcud2dSZXZpc2lvbklkKVxyXG5cdFx0XHQ6IFx0QVBJLmdldCgge1xyXG5cdFx0XHRcdGFjdGlvbjogXCJxdWVyeVwiLFxyXG5cdFx0XHRcdGZvcm1hdDogXCJqc29uXCIsXHJcblx0XHRcdFx0cHJvcDogXCJyZXZpc2lvbnNcIixcclxuXHRcdFx0XHR0aXRsZXM6IHN1YmplY3RQYWdlLmdldFByZWZpeGVkVGV4dCgpLFxyXG5cdFx0XHRcdHJ2cHJvcDogXCJpZHNcIixcclxuXHRcdFx0XHRpbmRleHBhZ2VpZHM6IDFcclxuXHRcdFx0fSApLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XHJcblx0XHRcdFx0aWYgKHJlc3VsdC5xdWVyeS5yZWRpcmVjdHMpIHtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dmFyIGlkID0gcmVzdWx0LnF1ZXJ5LnBhZ2VpZHM7XHJcblx0XHRcdFx0dmFyIHBhZ2UgPSByZXN1bHQucXVlcnkucGFnZXNbaWRdO1xyXG5cdFx0XHRcdGlmIChwYWdlLm1pc3NpbmcgPT09IFwiXCIpIHtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKCBpZCA8IDAgKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gcGFnZS5yZXZpc2lvbnNbMF0ucmV2aWQ7XHJcblx0XHRcdH0pO1xyXG5cdFx0dmFyIG9yZXNQcm9taXNlID0gbGF0ZXN0UmV2SWRQcm9taXNlLnRoZW4oZnVuY3Rpb24obGF0ZXN0UmV2SWQpIHtcclxuXHRcdFx0aWYgKCFsYXRlc3RSZXZJZCkge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gQVBJLmdldE9SRVMobGF0ZXN0UmV2SWQpXHJcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XHJcblx0XHRcdFx0XHR2YXIgZGF0YSA9IHJlc3VsdC5lbndpa2kuc2NvcmVzW2xhdGVzdFJldklkXS53cDEwO1xyXG5cdFx0XHRcdFx0aWYgKCBkYXRhLmVycm9yICkge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdChkYXRhLmVycm9yLnR5cGUsIGRhdGEuZXJyb3IubWVzc2FnZSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRyZXR1cm4gZGF0YS5zY29yZS5wcmVkaWN0aW9uO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHQvLyBPcGVuIHRoZSBsb2FkIGRpYWxvZ1xyXG5cdHZhciBpc09wZW5lZFByb21pc2UgPSAkLkRlZmVycmVkKCk7XHJcblx0dmFyIGxvYWREaWFsb2dXaW4gPSB3aW5kb3dNYW5hZ2VyLm9wZW5XaW5kb3coXCJsb2FkRGlhbG9nXCIsIHtcclxuXHRcdHByb21pc2VzOiBbXHJcblx0XHRcdGJhbm5lcnNQcm9taXNlLFxyXG5cdFx0XHRsb2FkVGFsa1Byb21pc2UsXHJcblx0XHRcdHBhcnNlVGFsa1Byb21pc2UsXHJcblx0XHRcdHRlbXBsYXRlRGF0YVByb21pc2UsXHJcblx0XHRcdHJlZGlyZWN0Q2hlY2tQcm9taXNlLFxyXG5cdFx0XHRzaG91bGRHZXRPcmVzICYmIG9yZXNQcm9taXNlXHJcblx0XHRdLFxyXG5cdFx0b3Jlczogc2hvdWxkR2V0T3JlcyxcclxuXHRcdGlzT3BlbmVkOiBpc09wZW5lZFByb21pc2VcclxuXHR9KTtcclxuXHJcblx0bG9hZERpYWxvZ1dpbi5vcGVuZWQudGhlbihpc09wZW5lZFByb21pc2UucmVzb2x2ZSk7XHJcblxyXG5cclxuXHQkLndoZW4oXHJcblx0XHRsb2FkVGFsa1Byb21pc2UsXHJcblx0XHR0ZW1wbGF0ZURhdGFQcm9taXNlLFxyXG5cdFx0cmVkaXJlY3RDaGVja1Byb21pc2UsXHJcblx0XHRzaG91bGRHZXRPcmVzICYmIG9yZXNQcm9taXNlXHJcblx0KS50aGVuKFxyXG5cdFx0Ly8gQWxsIHN1Y2NlZGVkXHJcblx0XHRmdW5jdGlvbih0YWxrV2lraXRleHQsIGJhbm5lcnMsIHJlZGlyZWN0VGFyZ2V0LCBvcmVzUHJlZGljaXRpb24gKSB7XHJcblx0XHRcdHZhciByZXN1bHQgPSB7XHJcblx0XHRcdFx0c3VjY2VzczogdHJ1ZSxcclxuXHRcdFx0XHR0YWxrcGFnZTogdGFsa1BhZ2UsXHJcblx0XHRcdFx0dGFsa1dpa2l0ZXh0OiB0YWxrV2lraXRleHQsXHJcblx0XHRcdFx0YmFubmVyczogYmFubmVyc1xyXG5cdFx0XHR9O1xyXG5cdFx0XHRpZiAocmVkaXJlY3RUYXJnZXQpIHtcclxuXHRcdFx0XHRyZXN1bHQucmVkaXJlY3RUYXJnZXQgPSByZWRpcmVjdFRhcmdldDtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAob3Jlc1ByZWRpY2l0aW9uKSB7XHJcblx0XHRcdFx0cmVzdWx0Lm9yZXNQcmVkaWNpdGlvbiA9IG9yZXNQcmVkaWNpdGlvbjtcclxuXHRcdFx0fVxyXG5cdFx0XHR3aW5kb3dNYW5hZ2VyLmNsb3NlV2luZG93KFwibG9hZERpYWxvZ1wiLCByZXN1bHQpO1xyXG5cdFx0XHRcclxuXHRcdH1cclxuXHQpOyAvLyBBbnkgZmFpbHVyZXMgYXJlIGhhbmRsZWQgYnkgdGhlIGxvYWREaWFsb2cgd2luZG93IGl0c2VsZlxyXG5cclxuXHQvLyBPbiB3aW5kb3cgY2xvc2VkLCBjaGVjayBkYXRhLCBhbmQgcmVzb2x2ZS9yZWplY3Qgc2V0dXBDb21wbGV0ZWRQcm9taXNlXHJcblx0bG9hZERpYWxvZ1dpbi5jbG9zZWQudGhlbihmdW5jdGlvbihkYXRhKSB7XHJcblx0XHRpZiAoZGF0YSAmJiBkYXRhLnN1Y2Nlc3MpIHtcclxuXHRcdFx0Ly8gR290IGV2ZXJ5dGhpbmcgbmVlZGVkOiBSZXNvbHZlIHByb21pc2Ugd2l0aCB0aGlzIGRhdGFcclxuXHRcdFx0c2V0dXBDb21wbGV0ZWRQcm9taXNlLnJlc29sdmUoZGF0YSk7XHJcblx0XHR9IGVsc2UgaWYgKGRhdGEgJiYgZGF0YS5lcnJvcikge1xyXG5cdFx0XHQvLyBUaGVyZSB3YXMgYW4gZXJyb3I6IFJlamVjdCBwcm9taXNlIHdpdGggZXJyb3IgY29kZS9pbmZvXHJcblx0XHRcdHNldHVwQ29tcGxldGVkUHJvbWlzZS5yZWplY3QoZGF0YS5lcnJvci5jb2RlLCBkYXRhLmVycm9yLmluZm8pO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Ly8gV2luZG93IGNsb3NlZCBiZWZvcmUgY29tcGxldGlvbjogcmVzb2x2ZSBwcm9taXNlIHdpdGhvdXQgYW55IGRhdGFcclxuXHRcdFx0c2V0dXBDb21wbGV0ZWRQcm9taXNlLnJlc29sdmUobnVsbCk7XHJcblx0XHR9XHJcblx0XHRjYWNoZS5jbGVhckludmFsaWRJdGVtcygpO1xyXG5cdH0pO1xyXG5cclxuXHQvLyBURVNUSU5HIHB1cnBvc2VzIG9ubHk6IGxvZyBwYXNzZWQgZGF0YSB0byBjb25zb2xlXHJcblx0c2V0dXBDb21wbGV0ZWRQcm9taXNlLnRoZW4oXHJcblx0XHRkYXRhID0+IGNvbnNvbGUubG9nKFwic2V0dXAgd2luZG93IGNsb3NlZFwiLCBkYXRhKSxcclxuXHRcdChjb2RlLCBpbmZvKSA9PiBjb25zb2xlLmxvZyhcInNldHVwIHdpbmRvdyBjbG9zZWQgd2l0aCBlcnJvclwiLCB7Y29kZSwgaW5mb30pXHJcblx0KTtcclxuXHJcblx0cmV0dXJuIHNldHVwQ29tcGxldGVkUHJvbWlzZTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHNldHVwUmF0ZXI7IiwiLy8gVmFyaW91cyB1dGlsaXR5IGZ1bmN0aW9ucyBhbmQgb2JqZWN0cyB0aGF0IG1pZ2h0IGJlIHVzZWQgaW4gbXVsdGlwbGUgcGxhY2VzXHJcblxyXG5pbXBvcnQgY29uZmlnIGZyb20gXCIuL2NvbmZpZ1wiO1xyXG5cclxudmFyIGlzQWZ0ZXJEYXRlID0gZnVuY3Rpb24oZGF0ZVN0cmluZykge1xyXG5cdHJldHVybiBuZXcgRGF0ZShkYXRlU3RyaW5nKSA8IG5ldyBEYXRlKCk7XHJcbn07XHJcblxyXG52YXIgQVBJID0gbmV3IG13LkFwaSgge1xyXG5cdGFqYXg6IHtcclxuXHRcdGhlYWRlcnM6IHsgXHJcblx0XHRcdFwiQXBpLVVzZXItQWdlbnRcIjogXCJSYXRlci9cIiArIGNvbmZpZy5zY3JpcHQudmVyc2lvbiArIFxyXG5cdFx0XHRcdFwiICggaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvVXNlcjpFdmFkMzcvUmF0ZXIgKVwiXHJcblx0XHR9XHJcblx0fVxyXG59ICk7XHJcbi8qIC0tLS0tLS0tLS0gQVBJIGZvciBPUkVTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cclxuQVBJLmdldE9SRVMgPSBmdW5jdGlvbihyZXZpc2lvbklEKSB7XHJcblx0cmV0dXJuICQuZ2V0KFwiaHR0cHM6Ly9vcmVzLndpa2ltZWRpYS5vcmcvdjMvc2NvcmVzL2Vud2lraT9tb2RlbHM9d3AxMCZyZXZpZHM9XCIrcmV2aXNpb25JRCk7XHJcbn07XHJcbi8qIC0tLS0tLS0tLS0gUmF3IHdpa2l0ZXh0IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cclxuQVBJLmdldFJhdyA9IGZ1bmN0aW9uKHBhZ2UpIHtcclxuXHRyZXR1cm4gJC5nZXQoXCJodHRwczpcIiArIGNvbmZpZy5tdy53Z1NlcnZlciArIG13LnV0aWwuZ2V0VXJsKHBhZ2UsIHthY3Rpb246XCJyYXdcIn0pKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0XHRpZiAoICFkYXRhICkge1xyXG5cdFx0XHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KFwib2stYnV0LWVtcHR5XCIpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBkYXRhO1xyXG5cdFx0fSk7XHJcbn07XHJcblxyXG52YXIgbWFrZUVycm9yTXNnID0gZnVuY3Rpb24oZmlyc3QsIHNlY29uZCkge1xyXG5cdHZhciBjb2RlLCB4aHIsIG1lc3NhZ2U7XHJcblx0aWYgKCB0eXBlb2YgZmlyc3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHNlY29uZCA9PT0gXCJzdHJpbmdcIiApIHtcclxuXHRcdC8vIEVycm9ycyBmcm9tICQuZ2V0IGJlaW5nIHJlamVjdGVkIChPUkVTICYgUmF3IHdpa2l0ZXh0KVxyXG5cdFx0dmFyIGVycm9yT2JqID0gZmlyc3QucmVzcG9uc2VKU09OICYmIGZpcnN0LnJlc3BvbnNlSlNPTi5lcnJvcjtcclxuXHRcdGlmICggZXJyb3JPYmogKSB7XHJcblx0XHRcdC8vIEdvdCBhbiBhcGktc3BlY2lmaWMgZXJyb3IgY29kZS9tZXNzYWdlXHJcblx0XHRcdGNvZGUgPSBlcnJvck9iai5jb2RlO1xyXG5cdFx0XHRtZXNzYWdlID0gZXJyb3JPYmoubWVzc2FnZTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHhociA9IGZpcnN0O1xyXG5cdFx0fVxyXG5cdH0gZWxzZSBpZiAoIHR5cGVvZiBmaXJzdCA9PT0gXCJzdHJpbmdcIiAmJiB0eXBlb2Ygc2Vjb25kID09PSBcIm9iamVjdFwiICkge1xyXG5cdFx0Ly8gRXJyb3JzIGZyb20gbXcuQXBpIG9iamVjdFxyXG5cdFx0dmFyIG13RXJyb3JPYmogPSBzZWNvbmQuZXJyb3I7XHJcblx0XHRpZiAobXdFcnJvck9iaikge1xyXG5cdFx0XHQvLyBHb3QgYW4gYXBpLXNwZWNpZmljIGVycm9yIGNvZGUvbWVzc2FnZVxyXG5cdFx0XHRjb2RlID0gZXJyb3JPYmouY29kZTtcclxuXHRcdFx0bWVzc2FnZSA9IGVycm9yT2JqLmluZm87XHJcblx0XHR9IGVsc2UgaWYgKGZpcnN0ID09PSBcIm9rLWJ1dC1lbXB0eVwiKSB7XHJcblx0XHRcdGNvZGUgPSBudWxsO1xyXG5cdFx0XHRtZXNzYWdlID0gXCJHb3QgYW4gZW1wdHkgcmVzcG9uc2UgZnJvbSB0aGUgc2VydmVyXCI7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR4aHIgPSBzZWNvbmQgJiYgc2Vjb25kLnhocjtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGlmIChjb2RlICYmIG1lc3NhZ2UpIHtcclxuXHRcdHJldHVybiBgQVBJIGVycm9yICR7Y29kZX06ICR7bWVzc2FnZX1gO1xyXG5cdH0gZWxzZSBpZiAobWVzc2FnZSkge1xyXG5cdFx0cmV0dXJuIGBBUEkgZXJyb3I6ICR7bWVzc2FnZX1gO1xyXG5cdH0gZWxzZSBpZiAoeGhyKSB7XHJcblx0XHRyZXR1cm4gYEhUVFAgZXJyb3IgJHt4aHIuc3RhdHVzfWA7XHJcblx0fSBlbHNlIGlmIChcclxuXHRcdHR5cGVvZiBmaXJzdCA9PT0gXCJzdHJpbmdcIiAmJiBmaXJzdCAhPT0gXCJlcnJvclwiICYmXHJcblx0XHR0eXBlb2Ygc2Vjb25kID09PSBcInN0cmluZ1wiICYmIHNlY29uZCAhPT0gXCJlcnJvclwiXHJcblx0KSB7XHJcblx0XHRyZXR1cm4gYEVycm9yICR7Zmlyc3R9OiAke3NlY29uZH1gO1xyXG5cdH0gZWxzZSBpZiAodHlwZW9mIGZpcnN0ID09PSBcInN0cmluZ1wiICYmIGZpcnN0ICE9PSBcImVycm9yXCIpIHtcclxuXHRcdHJldHVybiBgRXJyb3I6ICR7Zmlyc3R9YDtcclxuXHR9IGVsc2Uge1xyXG5cdFx0cmV0dXJuIFwiVW5rbm93biBBUEkgZXJyb3JcIjtcclxuXHR9XHJcbn07XHJcblxyXG5leHBvcnQge2lzQWZ0ZXJEYXRlLCBBUEksIG1ha2VFcnJvck1zZ307IiwiaW1wb3J0IExvYWREaWFsb2cgZnJvbSBcIi4vV2luZG93cy9Mb2FkRGlhbG9nXCI7XHJcbmltcG9ydCBNYWluV2luZG93IGZyb20gXCIuL1dpbmRvd3MvTWFpbldpbmRvd1wiO1xyXG5cclxudmFyIGZhY3RvcnkgPSBuZXcgT08uRmFjdG9yeSgpO1xyXG5cclxuLy8gUmVnaXN0ZXIgd2luZG93IGNvbnN0cnVjdG9ycyB3aXRoIHRoZSBmYWN0b3J5LlxyXG5mYWN0b3J5LnJlZ2lzdGVyKExvYWREaWFsb2cpO1xyXG5mYWN0b3J5LnJlZ2lzdGVyKE1haW5XaW5kb3cpO1xyXG5cclxudmFyIG1hbmFnZXIgPSBuZXcgT08udWkuV2luZG93TWFuYWdlcigge1xyXG5cdFwiZmFjdG9yeVwiOiBmYWN0b3J5XHJcbn0gKTtcclxuJCggZG9jdW1lbnQuYm9keSApLmFwcGVuZCggbWFuYWdlci4kZWxlbWVudCApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgbWFuYWdlcjsiXX0=
