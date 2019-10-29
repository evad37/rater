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

},{"./autostart":8,"./css.js":11,"./setup":13,"./util":14,"./windowManager":15}],2:[function(require,module,exports){
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

},{"./cache":9,"./config":10,"./util":14}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ParameterWidget = _interopRequireDefault(require("./ParameterWidget"));

var _SuggestionLookupTextInputWidget = _interopRequireDefault(require("./SuggestionLookupTextInputWidget"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

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
  var _this = this;

  // Configuration initialization
  config = config || {}; // Call parent constructor

  BannerWidget["super"].call(this, config);
  this.template = template; // Create a layout

  this.layout = new OO.ui.FieldsetLayout();
  this.mainLabel = new OO.ui.LabelWidget({
    label: "{{" + this.template.getTitle().getMainText() + "}}",
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
  });
  this.parameterWidgets = this.template.parameters.filter(function (param) {
    return param.name !== "class" && param.name !== "importance";
  }).map(function (param) {
    return new _ParameterWidget["default"](param, _this.template.paramData[param.name]);
  }); // Limit how many parameters will be displayed initially

  this.initialParameterLimit = 5; // But only hide if there's more than one to hide (otherwise, it's not much of a space saving
  // and just annoying for users)

  var hideSomeParams = this.parameterWidgets.length > this.initialParameterLimit + 1;
  this.showMoreParametersButton = new OO.ui.ButtonWidget({
    label: "Show " + (this.parameterWidgets.length - this.initialParameterLimit) + " more paramters",
    framed: false
  });
  this.parameterWidgetsLayout = new OO.ui.HorizontalLayout({
    items: hideSomeParams ? [].concat(_toConsumableArray(this.parameterWidgets.slice(0, this.initialParameterLimit)), [this.showMoreParametersButton]) : this.parameterWidgets
  });
  this.addParameterNameInput = new _SuggestionLookupTextInputWidget["default"]({
    suggestions: this.template.parameterSuggestions,
    placeholder: "parameter name",
    $element: $("<div style='display:inline-block;width:40%'>"),
    validate: function (val) {
      var _this$getAddParameter = this.getAddParametersInfo(val),
          validName = _this$getAddParameter.validName,
          name = _this$getAddParameter.name,
          value = _this$getAddParameter.value;

      return !name && !value ? true : validName;
    }.bind(this)
  });
  this.addParameterValueInput = new _SuggestionLookupTextInputWidget["default"]({
    placeholder: "parameter value",
    $element: $("<div style='display:inline-block;width:40%'>"),
    validate: function (val) {
      var _this$getAddParameter2 = this.getAddParametersInfo(null, val),
          validValue = _this$getAddParameter2.validValue,
          name = _this$getAddParameter2.name,
          value = _this$getAddParameter2.value;

      return !name && !value ? true : validValue;
    }.bind(this)
  });
  this.addParameterButton = new OO.ui.ButtonWidget({
    label: "Add",
    icon: "add",
    flags: "progressive"
  }).setDisabled(true);
  this.addParameterControls = new OO.ui.HorizontalLayout({
    items: [this.addParameterNameInput, new OO.ui.LabelWidget({
      label: "="
    }), this.addParameterValueInput, this.addParameterButton]
  }); // Hacks to make this HorizontalLayout go inside a FieldLayout

  this.addParameterControls.getInputId = function () {
    return false;
  };

  this.addParameterControls.isDisabled = function () {
    return false;
  };

  this.addParameterControls.simulateLabelClick = function () {
    return true;
  };

  this.addParameterLayout = new OO.ui.FieldLayout(this.addParameterControls, {
    label: "Add parameter:",
    align: "top"
  }); // And another hack

  this.addParameterLayout.$element.find(".oo-ui-fieldLayout-messages").css({
    "clear": "both",
    "padding-top": 0
  }); // Add everything to the layout

  this.layout.addItems([this.ratingsDropdowns, this.parameterWidgetsLayout, this.addParameterLayout]);
  this.$element.append(this.layout.$element, $("<hr>"));
  this.showMoreParametersButton.connect(this, {
    "click": "showMoreParameters"
  });
  this.addParameterButton.connect(this, {
    "click": "onParameterAdd"
  });
  this.addParameterNameInput.connect(this, {
    "change": "onAddParameterNameChange"
  });
  this.addParameterValueInput.connect(this, {
    "change": "onAddParameterValueChange"
  });
}

OO.inheritClass(BannerWidget, OO.ui.Widget);

BannerWidget.prototype.showMoreParameters = function () {
  this.parameterWidgetsLayout.removeItems([this.showMoreParametersButton]).addItems(this.parameterWidgets.slice(this.initialParameterLimit), this.initialParameterLimit);
};

BannerWidget.prototype.getAddParametersInfo = function (nameInputVal, valueInputVal) {
  var name = nameInputVal && nameInputVal.trim() || this.addParameterNameInput.getValue().trim();
  var paramAlreadyIncluded = name === "class" || name === "importance" || this.parameterWidgets.some(function (paramWidget) {
    return paramWidget.parameter.name === name;
  });
  var value = valueInputVal && valueInputVal.trim() || this.addParameterValueInput.getValue().trim();
  var autovalue = name && this.template.paramData[name] && this.template.paramData[name].autovalue || null;
  return {
    validName: !!(name && !paramAlreadyIncluded),
    validValue: !!(value || autovalue),
    isAutovalue: !!(!value && autovalue),
    isAlreadyIncluded: !!(name && paramAlreadyIncluded),
    name: name,
    value: value,
    autovalue: autovalue
  };
};

BannerWidget.prototype.onAddParameterNameChange = function () {
  var _this$getAddParameter3 = this.getAddParametersInfo(),
      validName = _this$getAddParameter3.validName,
      validValue = _this$getAddParameter3.validValue,
      isAutovalue = _this$getAddParameter3.isAutovalue,
      isAlreadyIncluded = _this$getAddParameter3.isAlreadyIncluded,
      name = _this$getAddParameter3.name,
      autovalue = _this$getAddParameter3.autovalue; // Set value input placeholder as the autovalue


  this.addParameterValueInput.$input.attr("placeholder", autovalue || ""); // Set suggestions, if the parameter has a list of allowed values

  var allowedValues = this.template.paramData[name] && this.template.paramData[name].allowedValues && this.template.paramData[name].allowedValues.map(function (val) {
    return {
      data: val,
      label: val
    };
  });
  this.addParameterValueInput.setSuggestions(allowedValues || []); // Set button disabled state based on validity

  this.addParameterButton.setDisabled(!validName || !validValue); // Show notice if autovalue will be used

  this.addParameterLayout.setNotices(validName && isAutovalue ? ["Parameter value will be autofilled"] : []); // Show error is the banner already has the parameter set

  this.addParameterLayout.setErrors(isAlreadyIncluded ? ["Parameter is already present"] : []);
};

BannerWidget.prototype.onAddParameterValueChange = function () {
  var _this$getAddParameter4 = this.getAddParametersInfo(),
      validName = _this$getAddParameter4.validName,
      validValue = _this$getAddParameter4.validValue,
      isAutovalue = _this$getAddParameter4.isAutovalue;

  this.addParameterButton.setDisabled(!validName || !validValue);
  this.addParameterLayout.setNotices(validName && isAutovalue ? ["Parameter value will be autofilled"] : []);
};

BannerWidget.prototype.onParameterAdd = function () {
  var _this$getAddParameter5 = this.getAddParametersInfo(),
      validName = _this$getAddParameter5.validName,
      validValue = _this$getAddParameter5.validValue,
      name = _this$getAddParameter5.name,
      value = _this$getAddParameter5.value,
      autovalue = _this$getAddParameter5.autovalue;

  if (!validName || !validValue) {
    // Error should already be shown via onAddParameter...Change methods
    return;
  }

  var newParameter = new _ParameterWidget["default"]({
    "name": name,
    "value": value || autovalue
  }, this.template.paramData[name]);
  this.parameterWidgets.push(newParameter);
  this.parameterWidgetsLayout.addItems([newParameter]);
  this.addParameterNameInput.setValue("");
  this.addParameterValueInput.setValue("");
  this.addParameterNameInput.focus();
};

var _default = BannerWidget;
exports["default"] = _default;

},{"./ParameterWidget":4,"./SuggestionLookupTextInputWidget":5}],4:[function(require,module,exports){
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

var SuggestionLookupTextInputWidget = function SuggestionLookupTextInputWidget(config) {
  OO.ui.TextInputWidget.call(this, config);
  OO.ui.mixin.LookupElement.call(this, config);
  this.suggestions = config.suggestions || [];
};

OO.inheritClass(SuggestionLookupTextInputWidget, OO.ui.TextInputWidget);
OO.mixinClass(SuggestionLookupTextInputWidget, OO.ui.mixin.LookupElement); // Set suggestion. param: Object[] with objects of the form { data: ... , label: ... }

SuggestionLookupTextInputWidget.prototype.setSuggestions = function (suggestions) {
  this.suggestions = suggestions;
}; // Returns data, as a resolution to a promise, to be passed to #getLookupMenuOptionsFromData


SuggestionLookupTextInputWidget.prototype.getLookupRequest = function () {
  var deferred = $.Deferred().resolve(new RegExp("\\b" + mw.util.escapeRegExp(this.getValue()), "i"));
  return deferred.promise({
    abort: function abort() {}
  });
}; // ???


SuggestionLookupTextInputWidget.prototype.getLookupCacheDataFromResponse = function (response) {
  return response || [];
}; // Is passed data from #getLookupRequest, returns an array of menu item widgets 


SuggestionLookupTextInputWidget.prototype.getLookupMenuOptionsFromData = function (pattern) {
  var labelMatchesInputVal = function labelMatchesInputVal(suggestionItem) {
    return pattern.test(suggestionItem.label) || !suggestionItem.label && pattern.test(suggestionItem.data);
  };

  var makeMenuOptionWidget = function makeMenuOptionWidget(optionItem) {
    return new OO.ui.MenuOptionWidget({
      data: optionItem.data,
      label: optionItem.label || optionItem.data
    });
  };

  return this.suggestions.filter(labelMatchesInputVal).map(makeMenuOptionWidget);
};

var _default = SuggestionLookupTextInputWidget;
exports["default"] = _default;

},{}],6:[function(require,module,exports){
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

},{"../util":14}],7:[function(require,module,exports){
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

},{"./Components/BannerWidget":3}],8:[function(require,module,exports){
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

},{"./config":10,"./setup":13,"./util":14}],9:[function(require,module,exports){
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

},{"./util":14}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.diffStyles = void 0;
// Attribution: Diff styles from <https://en.wikipedia.org/wiki/Wikipedia:AutoWikiBrowser/style.css>
var diffStyles = "table.diff, td.diff-otitle, td.diff-ntitle { background-color: white; }\ntd.diff-otitle, td.diff-ntitle { text-align: center; }\ntd.diff-marker { text-align: right; font-weight: bold; font-size: 1.25em; }\ntd.diff-lineno { font-weight: bold; }\ntd.diff-addedline, td.diff-deletedline, td.diff-context { font-size: 88%; vertical-align: top; white-space: -moz-pre-wrap; white-space: pre-wrap; }\ntd.diff-addedline, td.diff-deletedline { border-style: solid; border-width: 1px 1px 1px 4px; border-radius: 0.33em; }\ntd.diff-addedline { border-color: #a3d3ff; }\ntd.diff-deletedline { border-color: #ffe49c; }\ntd.diff-context { background: #f3f3f3; color: #333333; border-style: solid; border-width: 1px 1px 1px 4px; border-color: #e6e6e6; border-radius: 0.33em; }\n.diffchange { font-weight: bold; text-decoration: none; }\ntable.diff {\n    border: none;\n    width: 98%; border-spacing: 4px;\n    table-layout: fixed; /* Ensures that colums are of equal width */\n}\ntd.diff-addedline .diffchange, td.diff-deletedline .diffchange { border-radius: 0.33em; padding: 0.25em 0; }\ntd.diff-addedline .diffchange {\tbackground: #d8ecff; }\ntd.diff-deletedline .diffchange { background: #feeec8; }\ntable.diff td {\tpadding: 0.33em 0.66em; }\ntable.diff col.diff-marker { width: 2%; }\ntable.diff col.diff-content { width: 48%; }\ntable.diff td div {\n    /* Force-wrap very long lines such as URLs or page-widening char strings. */\n    word-wrap: break-word;\n    /* As fallback (FF<3.5, Opera <10.5), scrollbars will be added for very wide cells\n        instead of text overflowing or widening */\n    overflow: auto;\n}";
exports.diffStyles = diffStyles;

},{}],12:[function(require,module,exports){
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

},{"./cache":9,"./util":14}],13:[function(require,module,exports){
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

},{"./Template":2,"./cache":9,"./config":10,"./getBanners":12,"./util":14,"./windowManager":15}],14:[function(require,module,exports){
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

},{"./config":10}],15:[function(require,module,exports){
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

},{"./Windows/LoadDialog":6,"./Windows/MainWindow":7}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJyYXRlci1zcmMvQXBwLmpzIiwicmF0ZXItc3JjL1RlbXBsYXRlLmpzIiwicmF0ZXItc3JjL1dpbmRvd3MvQ29tcG9uZW50cy9CYW5uZXJXaWRnZXQuanMiLCJyYXRlci1zcmMvV2luZG93cy9Db21wb25lbnRzL1BhcmFtZXRlcldpZGdldC5qcyIsInJhdGVyLXNyYy9XaW5kb3dzL0NvbXBvbmVudHMvU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldC5qcyIsInJhdGVyLXNyYy9XaW5kb3dzL0xvYWREaWFsb2cuanMiLCJyYXRlci1zcmMvV2luZG93cy9NYWluV2luZG93LmpzIiwicmF0ZXItc3JjL2F1dG9zdGFydC5qcyIsInJhdGVyLXNyYy9jYWNoZS5qcyIsInJhdGVyLXNyYy9jb25maWcuanMiLCJyYXRlci1zcmMvY3NzLmpzIiwicmF0ZXItc3JjL2dldEJhbm5lcnMuanMiLCJyYXRlci1zcmMvc2V0dXAuanMiLCJyYXRlci1zcmMvdXRpbC5qcyIsInJhdGVyLXNyYy93aW5kb3dNYW5hZ2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUVBLENBQUMsU0FBUyxHQUFULEdBQWU7QUFDZixFQUFBLE9BQU8sQ0FBQyxHQUFSLENBQVksOEJBQVo7QUFFQSxFQUFBLEVBQUUsQ0FBQyxJQUFILENBQVEsTUFBUixDQUFlLGVBQWY7O0FBRUEsTUFBTSxjQUFjLEdBQUcsU0FBakIsY0FBaUIsQ0FBQSxJQUFJLEVBQUk7QUFDOUIsUUFBSSxDQUFDLElBQUQsSUFBUyxDQUFDLElBQUksQ0FBQyxPQUFuQixFQUE0QjtBQUMzQjtBQUNBOztBQUVELDhCQUFjLFVBQWQsQ0FBeUIsTUFBekIsRUFBaUMsSUFBakM7QUFDQSxHQU5EOztBQVFBLE1BQU0sY0FBYyxHQUFHLFNBQWpCLGNBQWlCLENBQUMsSUFBRCxFQUFP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QyxDQUFFLFFBQVEsQ0FBQyxJQUFYLENBQUQsQ0FBbUIsTUFBbkIsQ0FBMkIsT0FBTyxDQUFDLFFBQW5DO2VBRWUsTyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImltcG9ydCBzZXR1cFJhdGVyIGZyb20gXCIuL3NldHVwXCI7XHJcbmltcG9ydCBhdXRvU3RhcnQgZnJvbSBcIi4vYXV0b3N0YXJ0XCI7XHJcbmltcG9ydCBkaWZmU3R5bGVzIGZyb20gXCIuL2Nzcy5qc1wiO1xyXG5pbXBvcnQgeyBtYWtlRXJyb3JNc2cgfSBmcm9tIFwiLi91dGlsXCI7XHJcbmltcG9ydCB3aW5kb3dNYW5hZ2VyIGZyb20gXCIuL3dpbmRvd01hbmFnZXJcIjtcclxuXHJcbihmdW5jdGlvbiBBcHAoKSB7XHJcblx0Y29uc29sZS5sb2coXCJSYXRlcidzIEFwcC5qcyBpcyBydW5uaW5nLi4uXCIpO1xyXG5cclxuXHRtdy51dGlsLmFkZENTUyhkaWZmU3R5bGVzKTtcclxuXHJcblx0Y29uc3Qgc2hvd01haW5XaW5kb3cgPSBkYXRhID0+IHtcclxuXHRcdGlmICghZGF0YSB8fCAhZGF0YS5zdWNjZXNzKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHR3aW5kb3dNYW5hZ2VyLm9wZW5XaW5kb3coXCJtYWluXCIsIGRhdGEpO1xyXG5cdH07XHJcblxyXG5cdGNvbnN0IHNob3dTZXR1cEVycm9yID0gKGNvZGUsIGpxeGhyKSA9PiBPTy51aS5hbGVydChcclxuXHRcdG1ha2VFcnJvck1zZyhjb2RlLCBqcXhociksXHR7XHJcblx0XHRcdHRpdGxlOiBcIlJhdGVyIGZhaWxlZCB0byBvcGVuXCJcclxuXHRcdH1cclxuXHQpO1xyXG5cclxuXHQvLyBJbnZvY2F0aW9uIGJ5IHBvcnRsZXQgbGluayBcclxuXHRtdy51dGlsLmFkZFBvcnRsZXRMaW5rKFxyXG5cdFx0XCJwLWNhY3Rpb25zXCIsXHJcblx0XHRcIiNcIixcclxuXHRcdFwiUmF0ZXJcIixcclxuXHRcdFwiY2EtcmF0ZXJcIixcclxuXHRcdFwiUmF0ZSBxdWFsaXR5IGFuZCBpbXBvcnRhbmNlXCIsXHJcblx0XHRcIjVcIlxyXG5cdCk7XHJcblx0JChcIiNjYS1yYXRlclwiKS5jbGljaygoKSA9PiBzZXR1cFJhdGVyKCkudGhlbihzaG93TWFpbldpbmRvdywgc2hvd1NldHVwRXJyb3IpICk7XHJcblxyXG5cdC8vIEludm9jYXRpb24gYnkgYXV0by1zdGFydCAoZG8gbm90IHNob3cgbWVzc2FnZSBvbiBlcnJvcilcclxuXHRhdXRvU3RhcnQoKS50aGVuKHNob3dNYWluV2luZG93KTtcclxufSkoKTsiLCJpbXBvcnQge0FQSSwgaXNBZnRlckRhdGV9IGZyb20gXCIuL3V0aWxcIjtcclxuaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuaW1wb3J0ICogYXMgY2FjaGUgZnJvbSBcIi4vY2FjaGVcIjtcclxuXHJcbi8qKiBUZW1wbGF0ZVxyXG4gKlxyXG4gKiBAY2xhc3NcclxuICogUmVwcmVzZW50cyB0aGUgd2lraXRleHQgb2YgdGVtcGxhdGUgdHJhbnNjbHVzaW9uLiBVc2VkIGJ5ICNwYXJzZVRlbXBsYXRlcy5cclxuICogQHByb3Age1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSB0ZW1wbGF0ZVxyXG4gKiBAcHJvcCB7U3RyaW5nfSB3aWtpdGV4dCBGdWxsIHdpa2l0ZXh0IG9mIHRoZSB0cmFuc2NsdXNpb25cclxuICogQHByb3Age09iamVjdFtdfSBwYXJhbWV0ZXJzIFBhcmFtZXRlcnMgdXNlZCBpbiB0aGUgdHJhbnNsY3VzaW9uLCBpbiBvcmRlciwgb2YgZm9ybTpcclxuXHR7XHJcblx0XHRuYW1lOiB7U3RyaW5nfE51bWJlcn0gcGFyYW1ldGVyIG5hbWUsIG9yIHBvc2l0aW9uIGZvciB1bm5hbWVkIHBhcmFtZXRlcnMsXHJcblx0XHR2YWx1ZToge1N0cmluZ30gV2lraXRleHQgcGFzc2VkIHRvIHRoZSBwYXJhbWV0ZXIgKHdoaXRlc3BhY2UgdHJpbW1lZCksXHJcblx0XHR3aWtpdGV4dDoge1N0cmluZ30gRnVsbCB3aWtpdGV4dCAoaW5jbHVkaW5nIGxlYWRpbmcgcGlwZSwgcGFyYW1ldGVyIG5hbWUvZXF1YWxzIHNpZ24gKGlmIGFwcGxpY2FibGUpLCB2YWx1ZSwgYW5kIGFueSB3aGl0ZXNwYWNlKVxyXG5cdH1cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB3aWtpdGV4dCBXaWtpdGV4dCBvZiBhIHRlbXBsYXRlIHRyYW5zY2x1c2lvbiwgc3RhcnRpbmcgd2l0aCAne3snIGFuZCBlbmRpbmcgd2l0aCAnfX0nLlxyXG4gKi9cclxudmFyIFRlbXBsYXRlID0gZnVuY3Rpb24od2lraXRleHQpIHtcclxuXHR0aGlzLndpa2l0ZXh0ID0gd2lraXRleHQ7XHJcblx0dGhpcy5wYXJhbWV0ZXJzID0gW107XHJcbn07XHJcblRlbXBsYXRlLnByb3RvdHlwZS5hZGRQYXJhbSA9IGZ1bmN0aW9uKG5hbWUsIHZhbCwgd2lraXRleHQpIHtcclxuXHR0aGlzLnBhcmFtZXRlcnMucHVzaCh7XHJcblx0XHRcIm5hbWVcIjogbmFtZSxcclxuXHRcdFwidmFsdWVcIjogdmFsLCBcclxuXHRcdFwid2lraXRleHRcIjogXCJ8XCIgKyB3aWtpdGV4dFxyXG5cdH0pO1xyXG59O1xyXG4vKipcclxuICogR2V0IGEgcGFyYW1ldGVyIGRhdGEgYnkgcGFyYW1ldGVyIG5hbWVcclxuICovIFxyXG5UZW1wbGF0ZS5wcm90b3R5cGUuZ2V0UGFyYW0gPSBmdW5jdGlvbihwYXJhbU5hbWUpIHtcclxuXHRyZXR1cm4gdGhpcy5wYXJhbWV0ZXJzLmZpbmQoZnVuY3Rpb24ocCkgeyByZXR1cm4gcC5uYW1lID09IHBhcmFtTmFtZTsgfSk7XHJcbn07XHJcblRlbXBsYXRlLnByb3RvdHlwZS5zZXROYW1lID0gZnVuY3Rpb24obmFtZSkge1xyXG5cdHRoaXMubmFtZSA9IG5hbWUudHJpbSgpO1xyXG59O1xyXG5UZW1wbGF0ZS5wcm90b3R5cGUuZ2V0VGl0bGUgPSBmdW5jdGlvbigpIHtcclxuXHRyZXR1cm4gbXcuVGl0bGUubmV3RnJvbVRleHQoXCJUZW1wbGF0ZTpcIiArIHRoaXMubmFtZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogcGFyc2VUZW1wbGF0ZXNcclxuICpcclxuICogUGFyc2VzIHRlbXBsYXRlcyBmcm9tIHdpa2l0ZXh0LlxyXG4gKiBCYXNlZCBvbiBTRDAwMDEncyB2ZXJzaW9uIGF0IDxodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Vc2VyOlNEMDAwMS9wYXJzZUFsbFRlbXBsYXRlcy5qcz4uXHJcbiAqIFJldHVybnMgYW4gYXJyYXkgY29udGFpbmluZyB0aGUgdGVtcGxhdGUgZGV0YWlsczpcclxuICogIHZhciB0ZW1wbGF0ZXMgPSBwYXJzZVRlbXBsYXRlcyhcIkhlbGxvIHt7Zm9vIHxCYXJ8YmF6PXF1eCB8Mj1sb3JlbWlwc3VtfDM9fX0gd29ybGRcIik7XHJcbiAqICBjb25zb2xlLmxvZyh0ZW1wbGF0ZXNbMF0pOyAvLyAtLT4gb2JqZWN0XHJcblx0e1xyXG5cdFx0bmFtZTogXCJmb29cIixcclxuXHRcdHdpa2l0ZXh0Olwie3tmb28gfEJhcnxiYXo9cXV4IHwgMiA9IGxvcmVtaXBzdW0gIHwzPX19XCIsXHJcblx0XHRwYXJhbWV0ZXJzOiBbXHJcblx0XHRcdHtcclxuXHRcdFx0XHRuYW1lOiAxLFxyXG5cdFx0XHRcdHZhbHVlOiAnQmFyJyxcclxuXHRcdFx0XHR3aWtpdGV4dDogJ3xCYXInXHJcblx0XHRcdH0sXHJcblx0XHRcdHtcclxuXHRcdFx0XHRuYW1lOiAnYmF6JyxcclxuXHRcdFx0XHR2YWx1ZTogJ3F1eCcsXHJcblx0XHRcdFx0d2lraXRleHQ6ICd8YmF6PXF1eCAnXHJcblx0XHRcdH0sXHJcblx0XHRcdHtcclxuXHRcdFx0XHRuYW1lOiAnMicsXHJcblx0XHRcdFx0dmFsdWU6ICdsb3JlbWlwc3VtJyxcclxuXHRcdFx0XHR3aWtpdGV4dDogJ3wgMiA9IGxvcmVtaXBzdW0gICdcclxuXHRcdFx0fSxcclxuXHRcdFx0e1xyXG5cdFx0XHRcdG5hbWU6ICczJyxcclxuXHRcdFx0XHR2YWx1ZTogJycsXHJcblx0XHRcdFx0d2lraXRleHQ6ICd8Mz0nXHJcblx0XHRcdH1cclxuXHRcdF0sXHJcblx0XHRnZXRQYXJhbTogZnVuY3Rpb24ocGFyYW1OYW1lKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnBhcmFtZXRlcnMuZmluZChmdW5jdGlvbihwKSB7IHJldHVybiBwLm5hbWUgPT0gcGFyYW1OYW1lOyB9KTtcclxuXHRcdH1cclxuXHR9XHJcbiAqICAgIFxyXG4gKiBcclxuICogQHBhcmFtIHtTdHJpbmd9IHdpa2l0ZXh0XHJcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gcmVjdXJzaXZlIFNldCB0byBgdHJ1ZWAgdG8gYWxzbyBwYXJzZSB0ZW1wbGF0ZXMgdGhhdCBvY2N1ciB3aXRoaW4gb3RoZXIgdGVtcGxhdGVzLFxyXG4gKiAgcmF0aGVyIHRoYW4ganVzdCB0b3AtbGV2ZWwgdGVtcGxhdGVzLiBcclxuICogQHJldHVybiB7VGVtcGxhdGVbXX0gdGVtcGxhdGVzXHJcbiovXHJcbnZhciBwYXJzZVRlbXBsYXRlcyA9IGZ1bmN0aW9uKHdpa2l0ZXh0LCByZWN1cnNpdmUpIHsgLyogZXNsaW50LWRpc2FibGUgbm8tY29udHJvbC1yZWdleCAqL1xyXG5cdGlmICghd2lraXRleHQpIHtcclxuXHRcdHJldHVybiBbXTtcclxuXHR9XHJcblx0dmFyIHN0clJlcGxhY2VBdCA9IGZ1bmN0aW9uKHN0cmluZywgaW5kZXgsIGNoYXIpIHtcclxuXHRcdHJldHVybiBzdHJpbmcuc2xpY2UoMCxpbmRleCkgKyBjaGFyICsgc3RyaW5nLnNsaWNlKGluZGV4ICsgMSk7XHJcblx0fTtcclxuXHJcblx0dmFyIHJlc3VsdCA9IFtdO1xyXG5cdFxyXG5cdHZhciBwcm9jZXNzVGVtcGxhdGVUZXh0ID0gZnVuY3Rpb24gKHN0YXJ0SWR4LCBlbmRJZHgpIHtcclxuXHRcdHZhciB0ZXh0ID0gd2lraXRleHQuc2xpY2Uoc3RhcnRJZHgsIGVuZElkeCk7XHJcblxyXG5cdFx0dmFyIHRlbXBsYXRlID0gbmV3IFRlbXBsYXRlKFwie3tcIiArIHRleHQucmVwbGFjZSgvXFx4MDEvZyxcInxcIikgKyBcIn19XCIpO1xyXG5cdFx0XHJcblx0XHQvLyBzd2FwIG91dCBwaXBlIGluIGxpbmtzIHdpdGggXFx4MDEgY29udHJvbCBjaGFyYWN0ZXJcclxuXHRcdC8vIFtbRmlsZTogXV0gY2FuIGhhdmUgbXVsdGlwbGUgcGlwZXMsIHNvIG1pZ2h0IG5lZWQgbXVsdGlwbGUgcGFzc2VzXHJcblx0XHR3aGlsZSAoIC8oXFxbXFxbW15cXF1dKj8pXFx8KC4qP1xcXVxcXSkvZy50ZXN0KHRleHQpICkge1xyXG5cdFx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFxbXFxbW15cXF1dKj8pXFx8KC4qP1xcXVxcXSkvZywgXCIkMVxceDAxJDJcIik7XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGNodW5rcyA9IHRleHQuc3BsaXQoXCJ8XCIpLm1hcChmdW5jdGlvbihjaHVuaykge1xyXG5cdFx0XHQvLyBjaGFuZ2UgJ1xceDAxJyBjb250cm9sIGNoYXJhY3RlcnMgYmFjayB0byBwaXBlc1xyXG5cdFx0XHRyZXR1cm4gY2h1bmsucmVwbGFjZSgvXFx4MDEvZyxcInxcIik7IFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGVtcGxhdGUuc2V0TmFtZShjaHVua3NbMF0pO1xyXG5cdFx0XHJcblx0XHR2YXIgcGFyYW1ldGVyQ2h1bmtzID0gY2h1bmtzLnNsaWNlKDEpO1xyXG5cclxuXHRcdHZhciB1bm5hbWVkSWR4ID0gMTtcclxuXHRcdHBhcmFtZXRlckNodW5rcy5mb3JFYWNoKGZ1bmN0aW9uKGNodW5rKSB7XHJcblx0XHRcdHZhciBpbmRleE9mRXF1YWxUbyA9IGNodW5rLmluZGV4T2YoXCI9XCIpO1xyXG5cdFx0XHR2YXIgaW5kZXhPZk9wZW5CcmFjZXMgPSBjaHVuay5pbmRleE9mKFwie3tcIik7XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgaXNXaXRob3V0RXF1YWxzID0gIWNodW5rLmluY2x1ZGVzKFwiPVwiKTtcclxuXHRcdFx0dmFyIGhhc0JyYWNlc0JlZm9yZUVxdWFscyA9IGNodW5rLmluY2x1ZGVzKFwie3tcIikgJiYgaW5kZXhPZk9wZW5CcmFjZXMgPCBpbmRleE9mRXF1YWxUbztcdFxyXG5cdFx0XHR2YXIgaXNVbm5hbWVkUGFyYW0gPSAoIGlzV2l0aG91dEVxdWFscyB8fCBoYXNCcmFjZXNCZWZvcmVFcXVhbHMgKTtcclxuXHRcdFx0XHJcblx0XHRcdHZhciBwTmFtZSwgcE51bSwgcFZhbDtcclxuXHRcdFx0aWYgKCBpc1VubmFtZWRQYXJhbSApIHtcclxuXHRcdFx0XHQvLyBHZXQgdGhlIG5leHQgbnVtYmVyIG5vdCBhbHJlYWR5IHVzZWQgYnkgZWl0aGVyIGFuIHVubmFtZWQgcGFyYW1ldGVyLCBvciBieSBhXHJcblx0XHRcdFx0Ly8gbmFtZWQgcGFyYW1ldGVyIGxpa2UgYHwxPXZhbGBcclxuXHRcdFx0XHR3aGlsZSAoIHRlbXBsYXRlLmdldFBhcmFtKHVubmFtZWRJZHgpICkge1xyXG5cdFx0XHRcdFx0dW5uYW1lZElkeCsrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRwTnVtID0gdW5uYW1lZElkeDtcclxuXHRcdFx0XHRwVmFsID0gY2h1bmsudHJpbSgpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHBOYW1lID0gY2h1bmsuc2xpY2UoMCwgaW5kZXhPZkVxdWFsVG8pLnRyaW0oKTtcclxuXHRcdFx0XHRwVmFsID0gY2h1bmsuc2xpY2UoaW5kZXhPZkVxdWFsVG8gKyAxKS50cmltKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0dGVtcGxhdGUuYWRkUGFyYW0ocE5hbWUgfHwgcE51bSwgcFZhbCwgY2h1bmspO1xyXG5cdFx0fSk7XHJcblx0XHRcclxuXHRcdHJlc3VsdC5wdXNoKHRlbXBsYXRlKTtcclxuXHR9O1xyXG5cclxuXHRcclxuXHR2YXIgbiA9IHdpa2l0ZXh0Lmxlbmd0aDtcclxuXHRcclxuXHQvLyBudW1iZXIgb2YgdW5jbG9zZWQgYnJhY2VzXHJcblx0dmFyIG51bVVuY2xvc2VkID0gMDtcclxuXHJcblx0Ly8gYXJlIHdlIGluc2lkZSBhIGNvbW1lbnQgb3IgYmV0d2VlbiBub3dpa2kgdGFncz9cclxuXHR2YXIgaW5Db21tZW50ID0gZmFsc2U7XHJcblx0dmFyIGluTm93aWtpID0gZmFsc2U7XHJcblxyXG5cdHZhciBzdGFydElkeCwgZW5kSWR4O1xyXG5cdFxyXG5cdGZvciAodmFyIGk9MDsgaTxuOyBpKyspIHtcclxuXHRcdFxyXG5cdFx0aWYgKCAhaW5Db21tZW50ICYmICFpbk5vd2lraSApIHtcclxuXHRcdFx0XHJcblx0XHRcdGlmICh3aWtpdGV4dFtpXSA9PT0gXCJ7XCIgJiYgd2lraXRleHRbaSsxXSA9PT0gXCJ7XCIpIHtcclxuXHRcdFx0XHRpZiAobnVtVW5jbG9zZWQgPT09IDApIHtcclxuXHRcdFx0XHRcdHN0YXJ0SWR4ID0gaSsyO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRudW1VbmNsb3NlZCArPSAyO1xyXG5cdFx0XHRcdGkrKztcclxuXHRcdFx0fSBlbHNlIGlmICh3aWtpdGV4dFtpXSA9PT0gXCJ9XCIgJiYgd2lraXRleHRbaSsxXSA9PT0gXCJ9XCIpIHtcclxuXHRcdFx0XHRpZiAobnVtVW5jbG9zZWQgPT09IDIpIHtcclxuXHRcdFx0XHRcdGVuZElkeCA9IGk7XHJcblx0XHRcdFx0XHRwcm9jZXNzVGVtcGxhdGVUZXh0KHN0YXJ0SWR4LCBlbmRJZHgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRudW1VbmNsb3NlZCAtPSAyO1xyXG5cdFx0XHRcdGkrKztcclxuXHRcdFx0fSBlbHNlIGlmICh3aWtpdGV4dFtpXSA9PT0gXCJ8XCIgJiYgbnVtVW5jbG9zZWQgPiAyKSB7XHJcblx0XHRcdFx0Ly8gc3dhcCBvdXQgcGlwZXMgaW4gbmVzdGVkIHRlbXBsYXRlcyB3aXRoIFxceDAxIGNoYXJhY3RlclxyXG5cdFx0XHRcdHdpa2l0ZXh0ID0gc3RyUmVwbGFjZUF0KHdpa2l0ZXh0LCBpLFwiXFx4MDFcIik7XHJcblx0XHRcdH0gZWxzZSBpZiAoIC9ePCEtLS8udGVzdCh3aWtpdGV4dC5zbGljZShpLCBpICsgNCkpICkge1xyXG5cdFx0XHRcdGluQ29tbWVudCA9IHRydWU7XHJcblx0XHRcdFx0aSArPSAzO1xyXG5cdFx0XHR9IGVsc2UgaWYgKCAvXjxub3dpa2kgPz4vLnRlc3Qod2lraXRleHQuc2xpY2UoaSwgaSArIDkpKSApIHtcclxuXHRcdFx0XHRpbk5vd2lraSA9IHRydWU7XHJcblx0XHRcdFx0aSArPSA3O1xyXG5cdFx0XHR9IFxyXG5cclxuXHRcdH0gZWxzZSB7IC8vIHdlIGFyZSBpbiBhIGNvbW1lbnQgb3Igbm93aWtpXHJcblx0XHRcdGlmICh3aWtpdGV4dFtpXSA9PT0gXCJ8XCIpIHtcclxuXHRcdFx0XHQvLyBzd2FwIG91dCBwaXBlcyB3aXRoIFxceDAxIGNoYXJhY3RlclxyXG5cdFx0XHRcdHdpa2l0ZXh0ID0gc3RyUmVwbGFjZUF0KHdpa2l0ZXh0LCBpLFwiXFx4MDFcIik7XHJcblx0XHRcdH0gZWxzZSBpZiAoL14tLT4vLnRlc3Qod2lraXRleHQuc2xpY2UoaSwgaSArIDMpKSkge1xyXG5cdFx0XHRcdGluQ29tbWVudCA9IGZhbHNlO1xyXG5cdFx0XHRcdGkgKz0gMjtcclxuXHRcdFx0fSBlbHNlIGlmICgvXjxcXC9ub3dpa2kgPz4vLnRlc3Qod2lraXRleHQuc2xpY2UoaSwgaSArIDEwKSkpIHtcclxuXHRcdFx0XHRpbk5vd2lraSA9IGZhbHNlO1xyXG5cdFx0XHRcdGkgKz0gODtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHR9XHJcblx0XHJcblx0aWYgKCByZWN1cnNpdmUgKSB7XHJcblx0XHR2YXIgc3VidGVtcGxhdGVzID0gcmVzdWx0Lm1hcChmdW5jdGlvbih0ZW1wbGF0ZSkge1xyXG5cdFx0XHRyZXR1cm4gdGVtcGxhdGUud2lraXRleHQuc2xpY2UoMiwtMik7XHJcblx0XHR9KVxyXG5cdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKHRlbXBsYXRlV2lraXRleHQpIHtcclxuXHRcdFx0XHRyZXR1cm4gL1xce1xcey4qXFx9XFx9Ly50ZXN0KHRlbXBsYXRlV2lraXRleHQpO1xyXG5cdFx0XHR9KVxyXG5cdFx0XHQubWFwKGZ1bmN0aW9uKHRlbXBsYXRlV2lraXRleHQpIHtcclxuXHRcdFx0XHRyZXR1cm4gcGFyc2VUZW1wbGF0ZXModGVtcGxhdGVXaWtpdGV4dCwgdHJ1ZSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHJcblx0XHRyZXR1cm4gcmVzdWx0LmNvbmNhdC5hcHBseShyZXN1bHQsIHN1YnRlbXBsYXRlcyk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gcmVzdWx0OyBcclxufTsgLyogZXNsaW50LWVuYWJsZSBuby1jb250cm9sLXJlZ2V4ICovXHJcblxyXG4vKipcclxuICogQHBhcmFtIHtUZW1wbGF0ZXxUZW1wbGF0ZVtdfSB0ZW1wbGF0ZXNcclxuICogQHJldHVybiB7UHJvbWlzZTxUZW1wbGF0ZVtdPn1cclxuICovXHJcbnZhciBnZXRXaXRoUmVkaXJlY3RUbyA9IGZ1bmN0aW9uKHRlbXBsYXRlcykge1xyXG5cdHZhciB0ZW1wbGF0ZXNBcnJheSA9IEFycmF5LmlzQXJyYXkodGVtcGxhdGVzKSA/IHRlbXBsYXRlcyA6IFt0ZW1wbGF0ZXNdO1xyXG5cdGlmICh0ZW1wbGF0ZXNBcnJheS5sZW5ndGggPT09IDApIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVzb2x2ZShbXSk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gQVBJLmdldCh7XHJcblx0XHRcImFjdGlvblwiOiBcInF1ZXJ5XCIsXHJcblx0XHRcImZvcm1hdFwiOiBcImpzb25cIixcclxuXHRcdFwidGl0bGVzXCI6IHRlbXBsYXRlc0FycmF5Lm1hcCh0ZW1wbGF0ZSA9PiB0ZW1wbGF0ZS5nZXRUaXRsZSgpLmdldFByZWZpeGVkVGV4dCgpKSxcclxuXHRcdFwicmVkaXJlY3RzXCI6IDFcclxuXHR9KS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0aWYgKCAhcmVzdWx0IHx8ICFyZXN1bHQucXVlcnkgKSB7XHJcblx0XHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KFwiRW1wdHkgcmVzcG9uc2VcIik7XHJcblx0XHR9XHJcblx0XHRpZiAoIHJlc3VsdC5xdWVyeS5yZWRpcmVjdHMgKSB7XHJcblx0XHRcdHJlc3VsdC5xdWVyeS5yZWRpcmVjdHMuZm9yRWFjaChmdW5jdGlvbihyZWRpcmVjdCkge1xyXG5cdFx0XHRcdHZhciBpID0gdGVtcGxhdGVzQXJyYXkuZmluZEluZGV4KHRlbXBsYXRlID0+IHRlbXBsYXRlLmdldFRpdGxlKCkuZ2V0UHJlZml4ZWRUZXh0KCkgPT09IHJlZGlyZWN0LmZyb20pO1xyXG5cdFx0XHRcdGlmIChpICE9PSAtMSkge1xyXG5cdFx0XHRcdFx0dGVtcGxhdGVzQXJyYXlbaV0ucmVkaXJlY3RzVG8gPSBtdy5UaXRsZS5uZXdGcm9tVGV4dChyZWRpcmVjdC50byk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0ZW1wbGF0ZXNBcnJheTtcclxuXHR9KTtcclxufTtcclxuXHJcblRlbXBsYXRlLnByb3RvdHlwZS5nZXREYXRhRm9yUGFyYW0gPSBmdW5jdGlvbihrZXksIHBhcmFOYW1lKSB7XHJcblx0aWYgKCAhdGhpcy5wYXJhbURhdGEgKSB7XHJcblx0XHRyZXR1cm4gbnVsbDtcclxuXHR9XHJcblx0Ly8gSWYgYWxpYXMsIHN3aXRjaCBmcm9tIGFsaWFzIHRvIHByZWZlcnJlZCBwYXJhbWV0ZXIgbmFtZVxyXG5cdHZhciBwYXJhID0gdGhpcy5wYXJhbUFsaWFzZXNbcGFyYU5hbWVdIHx8IHBhcmFOYW1lO1x0XHJcblx0aWYgKCAhdGhpcy5wYXJhbURhdGFbcGFyYV0gKSB7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdFxyXG5cdHZhciBkYXRhID0gdGhpcy5wYXJhbURhdGFbcGFyYV1ba2V5XTtcclxuXHQvLyBEYXRhIG1pZ2h0IGFjdHVhbGx5IGJlIGFuIG9iamVjdCB3aXRoIGtleSBcImVuXCJcclxuXHRpZiAoIGRhdGEgJiYgZGF0YS5lbiAmJiAhQXJyYXkuaXNBcnJheShkYXRhKSApIHtcclxuXHRcdHJldHVybiBkYXRhLmVuO1xyXG5cdH1cclxuXHRyZXR1cm4gZGF0YTtcclxufTtcclxuXHJcblRlbXBsYXRlLnByb3RvdHlwZS5zZXRQYXJhbURhdGFBbmRTdWdnZXN0aW9ucyA9IGZ1bmN0aW9uKCkge1xyXG5cdHZhciBzZWxmID0gdGhpcztcclxuXHR2YXIgcGFyYW1EYXRhU2V0ID0gJC5EZWZlcnJlZCgpO1xyXG5cdFxyXG5cdGlmICggc2VsZi5wYXJhbURhdGEgKSB7IHJldHVybiBwYXJhbURhdGFTZXQucmVzb2x2ZSgpOyB9XHJcbiAgICBcclxuXHR2YXIgcHJlZml4ZWRUZXh0ID0gc2VsZi5yZWRpcmVjdHNUb1xyXG5cdFx0PyBzZWxmLnJlZGlyZWN0c1RvLmdldFByZWZpeGVkVGV4dCgpXHJcblx0XHQ6IHNlbGYuZ2V0VGl0bGUoKS5nZXRQcmVmaXhlZFRleHQoKTtcclxuXHJcblx0dmFyIGNhY2hlZEluZm8gPSBjYWNoZS5yZWFkKHByZWZpeGVkVGV4dCArIFwiLXBhcmFtc1wiKTtcclxuXHRcclxuXHRpZiAoXHJcblx0XHRjYWNoZWRJbmZvICYmXHJcblx0XHRjYWNoZWRJbmZvLnZhbHVlICYmXHJcblx0XHRjYWNoZWRJbmZvLnN0YWxlRGF0ZSAmJlxyXG5cdFx0Y2FjaGVkSW5mby52YWx1ZS5wYXJhbURhdGEgIT0gbnVsbCAmJlxyXG5cdFx0Y2FjaGVkSW5mby52YWx1ZS5wYXJhbWV0ZXJTdWdnZXN0aW9ucyAhPSBudWxsICYmXHJcblx0XHRjYWNoZWRJbmZvLnZhbHVlLnBhcmFtQWxpYXNlcyAhPSBudWxsXHJcblx0KSB7XHJcblx0XHRzZWxmLm5vdGVtcGxhdGVkYXRhID0gY2FjaGVkSW5mby52YWx1ZS5ub3RlbXBsYXRlZGF0YTtcclxuXHRcdHNlbGYucGFyYW1EYXRhID0gY2FjaGVkSW5mby52YWx1ZS5wYXJhbURhdGE7XHJcblx0XHRzZWxmLnBhcmFtZXRlclN1Z2dlc3Rpb25zID0gY2FjaGVkSW5mby52YWx1ZS5wYXJhbWV0ZXJTdWdnZXN0aW9ucztcclxuXHRcdHNlbGYucGFyYW1BbGlhc2VzID0gY2FjaGVkSW5mby52YWx1ZS5wYXJhbUFsaWFzZXM7XHJcblx0XHRcclxuXHRcdHBhcmFtRGF0YVNldC5yZXNvbHZlKCk7XHJcblx0XHRpZiAoICFpc0FmdGVyRGF0ZShjYWNoZWRJbmZvLnN0YWxlRGF0ZSkgKSB7XHJcblx0XHRcdC8vIEp1c3QgdXNlIHRoZSBjYWNoZWQgZGF0YVxyXG5cdFx0XHRyZXR1cm4gcGFyYW1EYXRhU2V0O1xyXG5cdFx0fSAvLyBlbHNlOiBVc2UgdGhlIGNhY2hlIGRhdGEgZm9yIG5vdywgYnV0IGFsc28gZmV0Y2ggbmV3IGRhdGEgZnJvbSBBUElcclxuXHR9XHJcblx0XHJcblx0QVBJLmdldCh7XHJcblx0XHRhY3Rpb246IFwidGVtcGxhdGVkYXRhXCIsXHJcblx0XHR0aXRsZXM6IHByZWZpeGVkVGV4dCxcclxuXHRcdHJlZGlyZWN0czogMSxcclxuXHRcdGluY2x1ZGVNaXNzaW5nVGl0bGVzOiAxXHJcblx0fSlcclxuXHRcdC50aGVuKFxyXG5cdFx0XHRmdW5jdGlvbihyZXNwb25zZSkgeyByZXR1cm4gcmVzcG9uc2U7IH0sXHJcblx0XHRcdGZ1bmN0aW9uKC8qZXJyb3IqLykgeyByZXR1cm4gbnVsbDsgfSAvLyBJZ25vcmUgZXJyb3JzLCB3aWxsIHVzZSBkZWZhdWx0IGRhdGFcclxuXHRcdClcclxuXHRcdC50aGVuKCBmdW5jdGlvbihyZXN1bHQpIHtcclxuXHRcdC8vIEZpZ3VyZSBvdXQgcGFnZSBpZCAoYmVhY3VzZSBhY3Rpb249dGVtcGxhdGVkYXRhIGRvZXNuJ3QgaGF2ZSBhbiBpbmRleHBhZ2VpZHMgb3B0aW9uKVxyXG5cdFx0XHR2YXIgaWQgPSByZXN1bHQgJiYgJC5tYXAocmVzdWx0LnBhZ2VzLCBmdW5jdGlvbiggX3ZhbHVlLCBrZXkgKSB7IHJldHVybiBrZXk7IH0pO1xyXG5cdFx0XHJcblx0XHRcdGlmICggIXJlc3VsdCB8fCAhcmVzdWx0LnBhZ2VzW2lkXSB8fCByZXN1bHQucGFnZXNbaWRdLm5vdGVtcGxhdGVkYXRhIHx8ICFyZXN1bHQucGFnZXNbaWRdLnBhcmFtcyApIHtcclxuXHRcdFx0Ly8gTm8gVGVtcGxhdGVEYXRhLCBzbyB1c2UgZGVmYXVsdHMgKGd1ZXNzZXMpXHJcblx0XHRcdFx0c2VsZi5ub3RlbXBsYXRlZGF0YSA9IHRydWU7XHJcblx0XHRcdFx0c2VsZi50ZW1wbGF0ZWRhdGFBcGlFcnJvciA9ICFyZXN1bHQ7XHJcblx0XHRcdFx0c2VsZi5wYXJhbURhdGEgPSBjb25maWcuZGVmYXVsdFBhcmFtZXRlckRhdGE7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0c2VsZi5wYXJhbURhdGEgPSByZXN1bHQucGFnZXNbaWRdLnBhcmFtcztcclxuXHRcdFx0fVxyXG4gICAgICAgIFxyXG5cdFx0XHRzZWxmLnBhcmFtQWxpYXNlcyA9IHt9O1xyXG5cdFx0XHQkLmVhY2goc2VsZi5wYXJhbURhdGEsIGZ1bmN0aW9uKHBhcmFOYW1lLCBwYXJhRGF0YSkge1xyXG5cdFx0XHRcdC8vIEV4dHJhY3QgYWxpYXNlcyBmb3IgZWFzaWVyIHJlZmVyZW5jZSBsYXRlciBvblxyXG5cdFx0XHRcdGlmICggcGFyYURhdGEuYWxpYXNlcyAmJiBwYXJhRGF0YS5hbGlhc2VzLmxlbmd0aCApIHtcclxuXHRcdFx0XHRcdHBhcmFEYXRhLmFsaWFzZXMuZm9yRWFjaChmdW5jdGlvbihhbGlhcyl7XHJcblx0XHRcdFx0XHRcdHNlbGYucGFyYW1BbGlhc2VzW2FsaWFzXSA9IHBhcmFOYW1lO1xyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIEV4dHJhY3QgYWxsb3dlZCB2YWx1ZXMgYXJyYXkgZnJvbSBkZXNjcmlwdGlvblxyXG5cdFx0XHRcdGlmICggcGFyYURhdGEuZGVzY3JpcHRpb24gJiYgL1xcWy4qJy4rPycuKj9cXF0vLnRlc3QocGFyYURhdGEuZGVzY3JpcHRpb24uZW4pICkge1xyXG5cdFx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdFx0dmFyIGFsbG93ZWRWYWxzID0gSlNPTi5wYXJzZShcclxuXHRcdFx0XHRcdFx0XHRwYXJhRGF0YS5kZXNjcmlwdGlvbi5lblxyXG5cdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoL14uKlxcWy8sXCJbXCIpXHJcblx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvXCIvZywgXCJcXFxcXFxcIlwiKVxyXG5cdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoLycvZywgXCJcXFwiXCIpXHJcblx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvLFxccypdLywgXCJdXCIpXHJcblx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvXS4qJC8sIFwiXVwiKVxyXG5cdFx0XHRcdFx0XHQpO1xyXG5cdFx0XHRcdFx0XHRzZWxmLnBhcmFtRGF0YVtwYXJhTmFtZV0uYWxsb3dlZFZhbHVlcyA9IGFsbG93ZWRWYWxzO1xyXG5cdFx0XHRcdFx0fSBjYXRjaChlKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUud2FybihcIltSYXRlcl0gQ291bGQgbm90IHBhcnNlIGFsbG93ZWQgdmFsdWVzIGluIGRlc2NyaXB0aW9uOlxcbiAgXCIrXHJcblx0XHRcdFx0XHRwYXJhRGF0YS5kZXNjcmlwdGlvbi5lbiArIFwiXFxuIENoZWNrIFRlbXBsYXRlRGF0YSBmb3IgcGFyYW1ldGVyIHxcIiArIHBhcmFOYW1lICtcclxuXHRcdFx0XHRcdFwiPSBpbiBcIiArIHNlbGYuZ2V0VGl0bGUoKS5nZXRQcmVmaXhlZFRleHQoKSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIE1ha2Ugc3VyZSByZXF1aXJlZC9zdWdnZXN0ZWQgcGFyYW1ldGVycyBhcmUgcHJlc2VudFxyXG5cdFx0XHRcdGlmICggKHBhcmFEYXRhLnJlcXVpcmVkIHx8IHBhcmFEYXRhLnN1Z2dlc3RlZCkgJiYgIXNlbGYuZ2V0UGFyYW0ocGFyYU5hbWUpICkge1xyXG5cdFx0XHRcdC8vIENoZWNrIGlmIGFscmVhZHkgcHJlc2VudCBpbiBhbiBhbGlhcywgaWYgYW55XHJcblx0XHRcdFx0XHRpZiAoIHBhcmFEYXRhLmFsaWFzZXMubGVuZ3RoICkge1xyXG5cdFx0XHRcdFx0XHR2YXIgYWxpYXNlcyA9IHNlbGYucGFyYW1ldGVycy5maWx0ZXIocCA9PiB7XHJcblx0XHRcdFx0XHRcdFx0dmFyIGlzQWxpYXMgPSBwYXJhRGF0YS5hbGlhc2VzLmluY2x1ZGVzKHAubmFtZSk7XHJcblx0XHRcdFx0XHRcdFx0dmFyIGlzRW1wdHkgPSAhcC52YWw7XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGlzQWxpYXMgJiYgIWlzRW1wdHk7XHJcblx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0XHRpZiAoIGFsaWFzZXMubGVuZ3RoICkge1xyXG5cdFx0XHRcdFx0XHQvLyBBdCBsZWFzdCBvbmUgbm9uLWVtcHR5IGFsaWFzLCBzbyBkbyBub3RoaW5nXHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvLyBObyBub24tZW1wdHkgYWxpYXNlcywgc28gc2V0IHBhcmFtZXRlciB0byBlaXRoZXIgdGhlIGF1dG92YXVsZSwgb3JcclxuXHRcdFx0XHRcdC8vIGFuIGVtcHR5IHN0cmluZyAod2l0aG91dCB0b3VjaGluZywgdW5sZXNzIGl0IGlzIGEgcmVxdWlyZWQgcGFyYW1ldGVyKVxyXG5cdFx0XHRcdFx0c2VsZi5wYXJhbWV0ZXJzLnB1c2goe1xyXG5cdFx0XHRcdFx0XHRuYW1lOnBhcmFOYW1lLFxyXG5cdFx0XHRcdFx0XHR2YWx1ZTogcGFyYURhdGEuYXV0b3ZhbHVlIHx8IFwiXCIsXHJcblx0XHRcdFx0XHRcdGF1dG9maWxsZWQ6IHRydWVcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHRcclxuXHRcdFx0Ly8gTWFrZSBzdWdnZXN0aW9ucyBmb3IgY29tYm9ib3hcclxuXHRcdFx0dmFyIGFsbFBhcmFtc0FycmF5ID0gKCAhc2VsZi5ub3RlbXBsYXRlZGF0YSAmJiByZXN1bHQucGFnZXNbaWRdLnBhcmFtT3JkZXIgKSB8fFxyXG5cdFx0XHQkLm1hcChzZWxmLnBhcmFtRGF0YSwgZnVuY3Rpb24oX3ZhbCwga2V5KXtcclxuXHRcdFx0XHRyZXR1cm4ga2V5O1xyXG5cdFx0XHR9KTtcclxuXHRcdFx0c2VsZi5wYXJhbWV0ZXJTdWdnZXN0aW9ucyA9IGFsbFBhcmFtc0FycmF5LmZpbHRlcihmdW5jdGlvbihwYXJhbU5hbWUpIHtcclxuXHRcdFx0XHRyZXR1cm4gKCBwYXJhbU5hbWUgJiYgcGFyYW1OYW1lICE9PSBcImNsYXNzXCIgJiYgcGFyYW1OYW1lICE9PSBcImltcG9ydGFuY2VcIiApO1xyXG5cdFx0XHR9KVxyXG5cdFx0XHRcdC5tYXAoZnVuY3Rpb24ocGFyYW1OYW1lKSB7XHJcblx0XHRcdFx0XHR2YXIgb3B0aW9uT2JqZWN0ID0ge2RhdGE6IHBhcmFtTmFtZX07XHJcblx0XHRcdFx0XHR2YXIgbGFiZWwgPSBzZWxmLmdldERhdGFGb3JQYXJhbShsYWJlbCwgcGFyYW1OYW1lKTtcclxuXHRcdFx0XHRcdGlmICggbGFiZWwgKSB7XHJcblx0XHRcdFx0XHRcdG9wdGlvbk9iamVjdC5sYWJlbCA9IGxhYmVsICsgXCIgKHxcIiArIHBhcmFtTmFtZSArIFwiPSlcIjtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHJldHVybiBvcHRpb25PYmplY3Q7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcclxuXHRcdFx0aWYgKCBzZWxmLnRlbXBsYXRlZGF0YUFwaUVycm9yICkge1xyXG5cdFx0XHRcdC8vIERvbid0IHNhdmUgZGVmYXVsdHMvZ3Vlc3NlcyB0byBjYWNoZTtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHJcblx0XHRcdGNhY2hlLndyaXRlKHByZWZpeGVkVGV4dCArIFwiLXBhcmFtc1wiLCB7XHJcblx0XHRcdFx0bm90ZW1wbGF0ZWRhdGE6IHNlbGYubm90ZW1wbGF0ZWRhdGEsXHJcblx0XHRcdFx0cGFyYW1EYXRhOiBzZWxmLnBhcmFtRGF0YSxcclxuXHRcdFx0XHRwYXJhbWV0ZXJTdWdnZXN0aW9uczogc2VsZi5wYXJhbWV0ZXJTdWdnZXN0aW9ucyxcclxuXHRcdFx0XHRwYXJhbUFsaWFzZXM6IHNlbGYucGFyYW1BbGlhc2VzXHJcblx0XHRcdH0sXHQxXHJcblx0XHRcdCk7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fSlcclxuXHRcdC50aGVuKFxyXG5cdFx0XHRwYXJhbURhdGFTZXQucmVzb2x2ZSxcclxuXHRcdFx0cGFyYW1EYXRhU2V0LnJlamVjdFxyXG5cdFx0KTtcclxuXHRcclxuXHRyZXR1cm4gcGFyYW1EYXRhU2V0O1x0XHJcbn07XHJcblxyXG5leHBvcnQge1RlbXBsYXRlLCBwYXJzZVRlbXBsYXRlcywgZ2V0V2l0aFJlZGlyZWN0VG99OyIsImltcG9ydCBQYXJhbWV0ZXJXaWRnZXQgZnJvbSBcIi4vUGFyYW1ldGVyV2lkZ2V0XCI7XHJcbmltcG9ydCBTdWdnZXN0aW9uTG9va3VwVGV4dElucHV0V2lkZ2V0IGZyb20gXCIuL1N1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXRcIjtcclxuXHJcbi8qIFRhcmdldCBvdXRwdXQgKGZyb20gcmF0ZXIgdjEpOlxyXG4vLyBIVE1MXHJcbjxzcGFuIGNsYXNzPVwicmF0ZXItZGlhbG9nLXBhcmFJbnB1dCByYXRlci1kaWFsb2ctdGV4dElucHV0Q29udGFpbmVyXCI+XHJcblx0PGxhYmVsPjxzcGFuIGNsYXNzPVwicmF0ZXItZGlhbG9nLXBhcmEtY29kZVwiPmNhdGVnb3J5PC9zcGFuPjwvbGFiZWw+XHJcblx0PGlucHV0IHR5cGU9XCJ0ZXh0XCIvPjxhIHRpdGxlPVwicmVtb3ZlXCI+eDwvYT48d2JyLz5cclxuPC9zcGFuPlxyXG4vLyBDU1NcclxuLnJhdGVyLWRpYWxvZy1yb3cgPiBkaXYgPiBzcGFuIHtcclxuICAgIHBhZGRpbmctcmlnaHQ6IDAuNWVtO1xyXG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcclxufVxyXG4ucmF0ZXItZGlhbG9nLWF1dG9maWxsIHtcclxuICAgIGJvcmRlcjogMXB4IGRhc2hlZCAjY2QyMGZmO1xyXG4gICAgcGFkZGluZzogMC4yZW07XHJcbiAgICBtYXJnaW4tcmlnaHQ6IDAuMmVtO1xyXG59XHJcbnJhdGVyLWRpYWxvZy1hdXRvZmlsbDo6YWZ0ZXIge1xyXG4gICAgY29udGVudDogXCJhdXRvZmlsbGVkXCI7XHJcbiAgICBjb2xvcjogI2NkMjBmZjtcclxuICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xyXG4gICAgZm9udC1zaXplOiA5NiU7XHJcbn1cclxuKi9cclxuXHJcbmZ1bmN0aW9uIEJhbm5lcldpZGdldCggdGVtcGxhdGUsIGNvbmZpZyApIHtcclxuXHQvLyBDb25maWd1cmF0aW9uIGluaXRpYWxpemF0aW9uXHJcblx0Y29uZmlnID0gY29uZmlnIHx8IHt9O1xyXG5cdC8vIENhbGwgcGFyZW50IGNvbnN0cnVjdG9yXHJcblx0QmFubmVyV2lkZ2V0LnN1cGVyLmNhbGwoIHRoaXMsIGNvbmZpZyApO1xyXG5cclxuXHR0aGlzLnRlbXBsYXRlID0gdGVtcGxhdGU7XHJcblxyXG5cdC8vIENyZWF0ZSBhIGxheW91dFxyXG5cdHRoaXMubGF5b3V0ID0gbmV3IE9PLnVpLkZpZWxkc2V0TGF5b3V0KCk7XHJcblx0XHJcblx0dGhpcy5tYWluTGFiZWwgPSBuZXcgT08udWkuTGFiZWxXaWRnZXQoe1xyXG5cdFx0bGFiZWw6IFwie3tcIiArIHRoaXMudGVtcGxhdGUuZ2V0VGl0bGUoKS5nZXRNYWluVGV4dCgpICsgXCJ9fVwiLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8c3Ryb25nIHN0eWxlPSdkaXNwbGF5OmlubGluZS1ibG9jazt3aWR0aDo0OCU7Zm9udC1zaXplOiAxMTAlO21hcmdpbi1yaWdodDowO3BhZGRpbmctcmlnaHQ6OHB4Jz5cIilcclxuXHR9KTtcclxuXHQvLyBSYXRpbmcgZHJvcGRvd25zXHJcblx0dGhpcy5jbGFzc0Ryb3Bkb3duID0gbmV3IE9PLnVpLkRyb3Bkb3duV2lkZ2V0KCB7XHJcblx0XHRsYWJlbDogbmV3IE9PLnVpLkh0bWxTbmlwcGV0KFwiPHNwYW4gc3R5bGU9XFxcImNvbG9yOiM3NzdcXFwiPkNsYXNzPC9zcGFuPlwiKSxcclxuXHRcdG1lbnU6IHsgLy8gRklYTUU6IG5lZWRzIHJlYWwgZGF0YVxyXG5cdFx0XHRpdGVtczogW1xyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcIlwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiIFwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcIkJcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIkJcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJDXCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJDXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwic3RhcnRcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIlN0YXJ0XCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdF1cclxuXHRcdH0sXHJcblx0XHQkZWxlbWVudDogJChcIjxzcGFuIHN0eWxlPSdkaXNwbGF5OmlubGluZS1ibG9jazt3aWR0aDoyNCUnPlwiKSxcclxuXHRcdCRvdmVybGF5OiB0aGlzLiRvdmVybGF5LFxyXG5cdH0gKTtcclxuXHR0aGlzLmltcG9ydGFuY2VEcm9wZG93biA9IG5ldyBPTy51aS5Ecm9wZG93bldpZGdldCgge1xyXG5cdFx0bGFiZWw6IG5ldyBPTy51aS5IdG1sU25pcHBldChcIjxzcGFuIHN0eWxlPVxcXCJjb2xvcjojNzc3XFxcIj5JbXBvcnRhbmNlPC9zcGFuPlwiKSxcclxuXHRcdG1lbnU6IHsgLy8gRklYTUU6IG5lZWRzIHJlYWwgZGF0YVxyXG5cdFx0XHRpdGVtczogW1xyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcIlwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiIFwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcInRvcFwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiVG9wXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwiaGlnaFwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiSGlnaFwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcIm1pZFwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiTWlkXCJcclxuXHRcdFx0XHR9IClcclxuXHRcdFx0XVxyXG5cdFx0fSxcclxuXHRcdCRlbGVtZW50OiAkKFwiPHNwYW4gc3R5bGU9J2Rpc3BsYXk6aW5saW5lLWJsb2NrO3dpZHRoOjI0JSc+XCIpLFxyXG5cdFx0JG92ZXJsYXk6IHRoaXMuJG92ZXJsYXksXHJcblx0fSApO1xyXG5cdHRoaXMucmF0aW5nc0Ryb3Bkb3ducyA9IG5ldyBPTy51aS5Ib3Jpem9udGFsTGF5b3V0KCB7XHJcblx0XHRpdGVtczogW1xyXG5cdFx0XHR0aGlzLm1haW5MYWJlbCxcclxuXHRcdFx0dGhpcy5jbGFzc0Ryb3Bkb3duLFxyXG5cdFx0XHR0aGlzLmltcG9ydGFuY2VEcm9wZG93bixcclxuXHRcdF1cclxuXHR9ICk7XHJcblxyXG5cdHRoaXMucGFyYW1ldGVyV2lkZ2V0cyA9IHRoaXMudGVtcGxhdGUucGFyYW1ldGVyc1xyXG5cdFx0LmZpbHRlcihwYXJhbSA9PiBwYXJhbS5uYW1lICE9PSBcImNsYXNzXCIgJiYgcGFyYW0ubmFtZSAhPT0gXCJpbXBvcnRhbmNlXCIpXHJcblx0XHQubWFwKHBhcmFtID0+IG5ldyBQYXJhbWV0ZXJXaWRnZXQocGFyYW0sIHRoaXMudGVtcGxhdGUucGFyYW1EYXRhW3BhcmFtLm5hbWVdKSk7XHJcblx0Ly8gTGltaXQgaG93IG1hbnkgcGFyYW1ldGVycyB3aWxsIGJlIGRpc3BsYXllZCBpbml0aWFsbHlcclxuXHR0aGlzLmluaXRpYWxQYXJhbWV0ZXJMaW1pdCA9IDU7XHJcblx0Ly8gQnV0IG9ubHkgaGlkZSBpZiB0aGVyZSdzIG1vcmUgdGhhbiBvbmUgdG8gaGlkZSAob3RoZXJ3aXNlLCBpdCdzIG5vdCBtdWNoIG9mIGEgc3BhY2Ugc2F2aW5nXHJcblx0Ly8gYW5kIGp1c3QgYW5ub3lpbmcgZm9yIHVzZXJzKVxyXG5cdHZhciBoaWRlU29tZVBhcmFtcyA9IHRoaXMucGFyYW1ldGVyV2lkZ2V0cy5sZW5ndGggPiB0aGlzLmluaXRpYWxQYXJhbWV0ZXJMaW1pdCArIDE7XHJcblx0dGhpcy5zaG93TW9yZVBhcmFtZXRlcnNCdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KHtcclxuXHRcdGxhYmVsOiBcIlNob3cgXCIrKHRoaXMucGFyYW1ldGVyV2lkZ2V0cy5sZW5ndGggLSB0aGlzLmluaXRpYWxQYXJhbWV0ZXJMaW1pdCkrXCIgbW9yZSBwYXJhbXRlcnNcIixcclxuXHRcdGZyYW1lZDogZmFsc2UsXHJcblx0fSk7XHJcblx0dGhpcy5wYXJhbWV0ZXJXaWRnZXRzTGF5b3V0ID0gbmV3IE9PLnVpLkhvcml6b250YWxMYXlvdXQoIHtcclxuXHRcdGl0ZW1zOiBoaWRlU29tZVBhcmFtc1xyXG5cdFx0XHQ/IFsuLi50aGlzLnBhcmFtZXRlcldpZGdldHMuc2xpY2UoMCx0aGlzLmluaXRpYWxQYXJhbWV0ZXJMaW1pdCksIHRoaXMuc2hvd01vcmVQYXJhbWV0ZXJzQnV0dG9uXVxyXG5cdFx0XHQ6IHRoaXMucGFyYW1ldGVyV2lkZ2V0c1xyXG5cdH0gKTtcclxuXHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJOYW1lSW5wdXQgPSBuZXcgU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldCh7XHJcblx0XHRzdWdnZXN0aW9uczogdGhpcy50ZW1wbGF0ZS5wYXJhbWV0ZXJTdWdnZXN0aW9ucyxcclxuXHRcdHBsYWNlaG9sZGVyOiBcInBhcmFtZXRlciBuYW1lXCIsXHJcblx0XHQkZWxlbWVudDogJChcIjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lLWJsb2NrO3dpZHRoOjQwJSc+XCIpLFxyXG5cdFx0dmFsaWRhdGU6IGZ1bmN0aW9uKHZhbCkge1xyXG5cdFx0XHRsZXQge3ZhbGlkTmFtZSwgbmFtZSwgdmFsdWV9ID0gdGhpcy5nZXRBZGRQYXJhbWV0ZXJzSW5mbyh2YWwpO1xyXG5cdFx0XHRyZXR1cm4gKCFuYW1lICYmICF2YWx1ZSkgPyB0cnVlIDogdmFsaWROYW1lO1xyXG5cdFx0fS5iaW5kKHRoaXMpXHJcblx0fSk7XHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJWYWx1ZUlucHV0ID0gbmV3IFN1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXQoe1xyXG5cdFx0cGxhY2Vob2xkZXI6IFwicGFyYW1ldGVyIHZhbHVlXCIsXHJcblx0XHQkZWxlbWVudDogJChcIjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lLWJsb2NrO3dpZHRoOjQwJSc+XCIpLFxyXG5cdFx0dmFsaWRhdGU6IGZ1bmN0aW9uKHZhbCkge1xyXG5cdFx0XHRsZXQge3ZhbGlkVmFsdWUsIG5hbWUsIHZhbHVlfSA9IHRoaXMuZ2V0QWRkUGFyYW1ldGVyc0luZm8obnVsbCwgdmFsKTtcclxuXHRcdFx0cmV0dXJuICghbmFtZSAmJiAhdmFsdWUpID8gdHJ1ZSA6IHZhbGlkVmFsdWU7XHJcblx0XHR9LmJpbmQodGhpcylcclxuXHR9KTtcclxuXHR0aGlzLmFkZFBhcmFtZXRlckJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoe1xyXG5cdFx0bGFiZWw6IFwiQWRkXCIsXHJcblx0XHRpY29uOiBcImFkZFwiLFxyXG5cdFx0ZmxhZ3M6IFwicHJvZ3Jlc3NpdmVcIlxyXG5cdH0pLnNldERpc2FibGVkKHRydWUpO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyQ29udHJvbHMgPSBuZXcgT08udWkuSG9yaXpvbnRhbExheW91dCgge1xyXG5cdFx0aXRlbXM6IFtcclxuXHRcdFx0dGhpcy5hZGRQYXJhbWV0ZXJOYW1lSW5wdXQsXHJcblx0XHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCh7bGFiZWw6XCI9XCJ9KSxcclxuXHRcdFx0dGhpcy5hZGRQYXJhbWV0ZXJWYWx1ZUlucHV0LFxyXG5cdFx0XHR0aGlzLmFkZFBhcmFtZXRlckJ1dHRvblxyXG5cdFx0XVxyXG5cdH0gKTtcclxuXHQvLyBIYWNrcyB0byBtYWtlIHRoaXMgSG9yaXpvbnRhbExheW91dCBnbyBpbnNpZGUgYSBGaWVsZExheW91dFxyXG5cdHRoaXMuYWRkUGFyYW1ldGVyQ29udHJvbHMuZ2V0SW5wdXRJZCA9ICgpID0+IGZhbHNlO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyQ29udHJvbHMuaXNEaXNhYmxlZCA9ICgpID0+IGZhbHNlO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyQ29udHJvbHMuc2ltdWxhdGVMYWJlbENsaWNrID0gKCkgPT4gdHJ1ZTtcclxuXHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJMYXlvdXQgPSBuZXcgT08udWkuRmllbGRMYXlvdXQodGhpcy5hZGRQYXJhbWV0ZXJDb250cm9scywge1xyXG5cdFx0bGFiZWw6IFwiQWRkIHBhcmFtZXRlcjpcIixcclxuXHRcdGFsaWduOiBcInRvcFwiXHJcblx0fSk7XHJcblx0Ly8gQW5kIGFub3RoZXIgaGFja1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyTGF5b3V0LiRlbGVtZW50LmZpbmQoXCIub28tdWktZmllbGRMYXlvdXQtbWVzc2FnZXNcIikuY3NzKHtcclxuXHRcdFwiY2xlYXJcIjogXCJib3RoXCIsXHJcblx0XHRcInBhZGRpbmctdG9wXCI6IDBcclxuXHR9KTtcclxuXHJcblx0Ly8gQWRkIGV2ZXJ5dGhpbmcgdG8gdGhlIGxheW91dFxyXG5cdHRoaXMubGF5b3V0LmFkZEl0ZW1zKFtcclxuXHRcdHRoaXMucmF0aW5nc0Ryb3Bkb3ducyxcclxuXHRcdHRoaXMucGFyYW1ldGVyV2lkZ2V0c0xheW91dCxcclxuXHRcdHRoaXMuYWRkUGFyYW1ldGVyTGF5b3V0XHJcblx0XSk7XHJcblx0XHJcblx0dGhpcy4kZWxlbWVudC5hcHBlbmQodGhpcy5sYXlvdXQuJGVsZW1lbnQsICQoXCI8aHI+XCIpKTtcclxuXHJcblx0dGhpcy5zaG93TW9yZVBhcmFtZXRlcnNCdXR0b24uY29ubmVjdCggdGhpcywgeyBcImNsaWNrXCI6IFwic2hvd01vcmVQYXJhbWV0ZXJzXCIgfSApO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyQnV0dG9uLmNvbm5lY3QodGhpcywgeyBcImNsaWNrXCI6IFwib25QYXJhbWV0ZXJBZGRcIiB9KTtcclxuXHR0aGlzLmFkZFBhcmFtZXRlck5hbWVJbnB1dC5jb25uZWN0KHRoaXMsIHsgXCJjaGFuZ2VcIjogXCJvbkFkZFBhcmFtZXRlck5hbWVDaGFuZ2VcIn0pO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyVmFsdWVJbnB1dC5jb25uZWN0KHRoaXMsIHsgXCJjaGFuZ2VcIjogXCJvbkFkZFBhcmFtZXRlclZhbHVlQ2hhbmdlXCJ9KTtcclxufVxyXG5PTy5pbmhlcml0Q2xhc3MoIEJhbm5lcldpZGdldCwgT08udWkuV2lkZ2V0ICk7XHJcblxyXG5CYW5uZXJXaWRnZXQucHJvdG90eXBlLnNob3dNb3JlUGFyYW1ldGVycyA9IGZ1bmN0aW9uKCkge1xyXG5cdHRoaXMucGFyYW1ldGVyV2lkZ2V0c0xheW91dFxyXG5cdFx0LnJlbW92ZUl0ZW1zKFt0aGlzLnNob3dNb3JlUGFyYW1ldGVyc0J1dHRvbl0pXHJcblx0XHQuYWRkSXRlbXMoXHJcblx0XHRcdHRoaXMucGFyYW1ldGVyV2lkZ2V0cy5zbGljZSh0aGlzLmluaXRpYWxQYXJhbWV0ZXJMaW1pdCksXHJcblx0XHRcdHRoaXMuaW5pdGlhbFBhcmFtZXRlckxpbWl0XHJcblx0XHQpO1xyXG59O1xyXG5cclxuQmFubmVyV2lkZ2V0LnByb3RvdHlwZS5nZXRBZGRQYXJhbWV0ZXJzSW5mbyA9IGZ1bmN0aW9uKG5hbWVJbnB1dFZhbCwgdmFsdWVJbnB1dFZhbCkge1xyXG5cdHZhciBuYW1lID0gbmFtZUlucHV0VmFsICYmIG5hbWVJbnB1dFZhbC50cmltKCkgfHwgdGhpcy5hZGRQYXJhbWV0ZXJOYW1lSW5wdXQuZ2V0VmFsdWUoKS50cmltKCk7XHJcblx0dmFyIHBhcmFtQWxyZWFkeUluY2x1ZGVkID0gbmFtZSA9PT0gXCJjbGFzc1wiIHx8XHJcblx0XHRuYW1lID09PSBcImltcG9ydGFuY2VcIiB8fFxyXG5cdFx0dGhpcy5wYXJhbWV0ZXJXaWRnZXRzLnNvbWUocGFyYW1XaWRnZXQgPT4gcGFyYW1XaWRnZXQucGFyYW1ldGVyLm5hbWUgPT09IG5hbWUpO1xyXG5cdHZhciB2YWx1ZSA9IHZhbHVlSW5wdXRWYWwgJiYgdmFsdWVJbnB1dFZhbC50cmltKCkgfHwgdGhpcy5hZGRQYXJhbWV0ZXJWYWx1ZUlucHV0LmdldFZhbHVlKCkudHJpbSgpO1xyXG5cdHZhciBhdXRvdmFsdWUgPSBuYW1lICYmIHRoaXMudGVtcGxhdGUucGFyYW1EYXRhW25hbWVdICYmIHRoaXMudGVtcGxhdGUucGFyYW1EYXRhW25hbWVdLmF1dG92YWx1ZSB8fCBudWxsO1xyXG5cdHJldHVybiB7XHJcblx0XHR2YWxpZE5hbWU6ICEhKG5hbWUgJiYgIXBhcmFtQWxyZWFkeUluY2x1ZGVkKSxcclxuXHRcdHZhbGlkVmFsdWU6ICEhKHZhbHVlIHx8IGF1dG92YWx1ZSksXHJcblx0XHRpc0F1dG92YWx1ZTogISEoIXZhbHVlICYmIGF1dG92YWx1ZSksXHJcblx0XHRpc0FscmVhZHlJbmNsdWRlZDogISEobmFtZSAmJiBwYXJhbUFscmVhZHlJbmNsdWRlZCksXHJcblx0XHRuYW1lLFxyXG5cdFx0dmFsdWUsXHJcblx0XHRhdXRvdmFsdWVcclxuXHR9O1xyXG59O1xyXG5cclxuQmFubmVyV2lkZ2V0LnByb3RvdHlwZS5vbkFkZFBhcmFtZXRlck5hbWVDaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuXHRsZXQgeyB2YWxpZE5hbWUsIHZhbGlkVmFsdWUsIGlzQXV0b3ZhbHVlLCBpc0FscmVhZHlJbmNsdWRlZCwgbmFtZSwgYXV0b3ZhbHVlIH0gPSB0aGlzLmdldEFkZFBhcmFtZXRlcnNJbmZvKCk7XHJcblx0Ly8gU2V0IHZhbHVlIGlucHV0IHBsYWNlaG9sZGVyIGFzIHRoZSBhdXRvdmFsdWVcclxuXHR0aGlzLmFkZFBhcmFtZXRlclZhbHVlSW5wdXQuJGlucHV0LmF0dHIoIFwicGxhY2Vob2xkZXJcIiwgIGF1dG92YWx1ZSB8fCBcIlwiICk7XHJcblx0Ly8gU2V0IHN1Z2dlc3Rpb25zLCBpZiB0aGUgcGFyYW1ldGVyIGhhcyBhIGxpc3Qgb2YgYWxsb3dlZCB2YWx1ZXNcclxuXHR2YXIgYWxsb3dlZFZhbHVlcyA9IHRoaXMudGVtcGxhdGUucGFyYW1EYXRhW25hbWVdICYmXHJcblx0XHR0aGlzLnRlbXBsYXRlLnBhcmFtRGF0YVtuYW1lXS5hbGxvd2VkVmFsdWVzICYmIFxyXG5cdFx0dGhpcy50ZW1wbGF0ZS5wYXJhbURhdGFbbmFtZV0uYWxsb3dlZFZhbHVlcy5tYXAodmFsID0+IHtyZXR1cm4ge2RhdGE6IHZhbCwgbGFiZWw6dmFsfTsgfSk7XHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJWYWx1ZUlucHV0LnNldFN1Z2dlc3Rpb25zKGFsbG93ZWRWYWx1ZXMgfHwgW10pO1xyXG5cdC8vIFNldCBidXR0b24gZGlzYWJsZWQgc3RhdGUgYmFzZWQgb24gdmFsaWRpdHlcclxuXHR0aGlzLmFkZFBhcmFtZXRlckJ1dHRvbi5zZXREaXNhYmxlZCghdmFsaWROYW1lIHx8ICF2YWxpZFZhbHVlKTtcclxuXHQvLyBTaG93IG5vdGljZSBpZiBhdXRvdmFsdWUgd2lsbCBiZSB1c2VkXHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJMYXlvdXQuc2V0Tm90aWNlcyggdmFsaWROYW1lICYmIGlzQXV0b3ZhbHVlID8gW1wiUGFyYW1ldGVyIHZhbHVlIHdpbGwgYmUgYXV0b2ZpbGxlZFwiXSA6IFtdICk7XHJcblx0Ly8gU2hvdyBlcnJvciBpcyB0aGUgYmFubmVyIGFscmVhZHkgaGFzIHRoZSBwYXJhbWV0ZXIgc2V0XHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJMYXlvdXQuc2V0RXJyb3JzKCBpc0FscmVhZHlJbmNsdWRlZCA/IFtcIlBhcmFtZXRlciBpcyBhbHJlYWR5IHByZXNlbnRcIl0gOiBbXSApO1xyXG59O1xyXG5cclxuQmFubmVyV2lkZ2V0LnByb3RvdHlwZS5vbkFkZFBhcmFtZXRlclZhbHVlQ2hhbmdlID0gZnVuY3Rpb24oKSB7XHJcblx0bGV0IHsgdmFsaWROYW1lLCB2YWxpZFZhbHVlLCBpc0F1dG92YWx1ZSB9ID0gdGhpcy5nZXRBZGRQYXJhbWV0ZXJzSW5mbygpO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyQnV0dG9uLnNldERpc2FibGVkKCF2YWxpZE5hbWUgfHwgIXZhbGlkVmFsdWUpO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyTGF5b3V0LnNldE5vdGljZXMoIHZhbGlkTmFtZSAmJiBpc0F1dG92YWx1ZSA/IFtcIlBhcmFtZXRlciB2YWx1ZSB3aWxsIGJlIGF1dG9maWxsZWRcIl0gOiBbXSApOyBcclxufTtcclxuXHJcbkJhbm5lcldpZGdldC5wcm90b3R5cGUub25QYXJhbWV0ZXJBZGQgPSBmdW5jdGlvbigpIHtcclxuXHRsZXQgeyB2YWxpZE5hbWUsIHZhbGlkVmFsdWUsIG5hbWUsIHZhbHVlLCBhdXRvdmFsdWUgfSAgPSB0aGlzLmdldEFkZFBhcmFtZXRlcnNJbmZvKCk7XHJcblx0aWYgKCF2YWxpZE5hbWUgfHwgIXZhbGlkVmFsdWUpIHtcclxuXHRcdC8vIEVycm9yIHNob3VsZCBhbHJlYWR5IGJlIHNob3duIHZpYSBvbkFkZFBhcmFtZXRlci4uLkNoYW5nZSBtZXRob2RzXHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdHZhciBuZXdQYXJhbWV0ZXIgPSBuZXcgUGFyYW1ldGVyV2lkZ2V0KFxyXG5cdFx0e1xyXG5cdFx0XHRcIm5hbWVcIjogbmFtZSxcclxuXHRcdFx0XCJ2YWx1ZVwiOiB2YWx1ZSB8fCBhdXRvdmFsdWVcclxuXHRcdH0sXHJcblx0XHR0aGlzLnRlbXBsYXRlLnBhcmFtRGF0YVtuYW1lXVxyXG5cdCk7XHJcblx0dGhpcy5wYXJhbWV0ZXJXaWRnZXRzLnB1c2gobmV3UGFyYW1ldGVyKTtcclxuXHR0aGlzLnBhcmFtZXRlcldpZGdldHNMYXlvdXQuYWRkSXRlbXMoW25ld1BhcmFtZXRlcl0pO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyTmFtZUlucHV0LnNldFZhbHVlKFwiXCIpO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyVmFsdWVJbnB1dC5zZXRWYWx1ZShcIlwiKTtcclxuXHR0aGlzLmFkZFBhcmFtZXRlck5hbWVJbnB1dC5mb2N1cygpO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgQmFubmVyV2lkZ2V0OyIsImZ1bmN0aW9uIFBhcmFtZXRlcldpZGdldCggcGFyYW1ldGVyLCBwYXJhbURhdGEsIGNvbmZpZyApIHtcclxuXHQvLyBDb25maWd1cmF0aW9uIGluaXRpYWxpemF0aW9uXHJcblx0Y29uZmlnID0gY29uZmlnIHx8IHt9O1xyXG5cdC8vIENhbGwgcGFyZW50IGNvbnN0cnVjdG9yXHJcblx0UGFyYW1ldGVyV2lkZ2V0LnN1cGVyLmNhbGwoIHRoaXMsIGNvbmZpZyApO1xyXG4gICAgXHJcblx0dGhpcy5wYXJhbWV0ZXIgPSBwYXJhbWV0ZXI7XHJcblx0dGhpcy5wYXJhbURhdGEgPSBwYXJhbURhdGEgfHwge307XHJcblxyXG5cdC8vIE1ha2UgdGhlIGlucHV0LiBUeXBlIGNhbiBiZSBjaGVja2JveCwgb3IgZHJvcGRvd24sIG9yIHRleHQgaW5wdXQsXHJcblx0Ly8gZGVwZW5kaW5nIG9uIG51bWJlciBvZiBhbGxvd2VkIHZhbHVlcyBpbiBwYXJhbSBkYXRhLlxyXG5cdHRoaXMuYWxsb3dlZFZhbHVlcyA9IHBhcmFtRGF0YSAmJiBwYXJhbURhdGEuYWxsb3dlZFZhbHVlcyB8fCBbXTtcclxuXHQvLyBzd2l0Y2ggKHRydWUpIHtcclxuXHQvLyBjYXNlIHRoaXMuYWxsb3dlZFZhbHVlcy5sZW5ndGggPT09IDA6XHJcblx0Ly8gY2FzZSBwYXJhbWV0ZXIudmFsdWUgJiYgIXRoaXMuYWxsb3dlZFZhbHVlcy5pbmNsdWRlcyhwYXJhbWV0ZXIudmFsdWUpOlxyXG5cdC8vIFx0Ly8gVGV4dCBpbnB1dFxyXG5cdC8vIFx0YnJlYWs7XHJcblx0Ly8gY2FzZSAxOlxyXG5cdC8vIFx0Ly8gQ2hlY2tib3ggKGxhYmVsbGVkIG9ubHkgd2hlbiBib3RoIGNoZWNrZWQpXHJcblx0Ly8gXHR0aGlzLmFsbG93ZWRWYWx1ZXMgPSBbbnVsbCwgLi4udGhpcy5hbGxvd2VkVmFsdWVzXTtcclxuXHQvLyBcdC8qIC4uLmZhbGxzIHRocm91Z2guLi4gKi9cclxuXHQvLyBjYXNlIDI6XHJcblx0Ly8gXHQvLyBDaGVja2JveCAobGFiZWxsZWQgd2hlbiBib3RoIGNoZWNrZWQgYW5kIG5vdCBjaGVja2VkKVxyXG5cdC8vIFx0dGhpcy5pbnB1dCA9IG5ldyBPTy51aS5DaGVja2JveE11bHRpb3B0aW9uV2lkZ2V0KCB7XHJcblx0Ly8gXHRcdGRhdGE6IHBhcmFtZXRlci52YWx1ZSxcclxuXHQvLyBcdFx0c2VsZWN0ZWQ6IHRoaXMuYWxsb3dlZFZhbHVlcy5pbmRleE9mKHBhcmFtZXRlci52YWx1ZSkgPT09IDEsXHJcblx0Ly8gXHRcdGxhYmVsOiAkKFwiPGNvZGU+XCIpLnRleHQocGFyYW1ldGVyLnZhbHVlIHx8IFwiXCIpXHJcblx0Ly8gXHR9ICk7XHJcblx0Ly8gXHRicmVhaztcclxuXHQvLyBkZWZhdWx0OlxyXG5cdC8vIFx0Ly8gRHJvcGRvd25cclxuXHQvLyBcdHRoaXMuaW5wdXQgPSBuZXcgT08udWkuRHJvcGRvd25XaWRnZXQoIHtcclxuXHQvLyBcdFx0bWVudToge1xyXG5cdC8vIFx0XHRcdGl0ZW1zOiB0aGlzLmFsbG93ZWRWYWx1ZXMubWFwKGFsbG93ZWRWYWwgPT4gbmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoe1xyXG5cdC8vIFx0XHRcdFx0ZGF0YTogYWxsb3dlZFZhbCxcclxuXHQvLyBcdFx0XHRcdGxhYmVsOiBhbGxvd2VkVmFsXHJcblx0Ly8gXHRcdFx0fSkgKVxyXG5cdC8vIFx0XHR9XHJcblx0Ly8gXHR9ICk7XHJcblx0Ly8gXHR0aGlzLmlucHV0LmdldE1lbnUoKS5zZWxlY3RJdGVtQnlEYXRhKHBhcmFtZXRlci52YWx1ZSk7XHJcblx0Ly8gXHRicmVhaztcclxuXHQvLyB9XHJcblx0Ly8gVE9ETzogVXNlIGFib3ZlIGxvZ2ljLCBvciBzb21ldGhpbmcgc2ltaWxhci4gRm9yIG5vdywganVzdCBjcmVhdGUgYSBDb21ib0JveFxyXG5cdHRoaXMuaW5wdXQgPSBuZXcgT08udWkuQ29tYm9Cb3hJbnB1dFdpZGdldCgge1xyXG5cdFx0dmFsdWU6IHRoaXMucGFyYW1ldGVyLnZhbHVlLFxyXG5cdFx0Ly8gbGFiZWw6IHBhcmFtZXRlci5uYW1lICsgXCIgPVwiLFxyXG5cdFx0Ly8gbGFiZWxQb3NpdGlvbjogXCJiZWZvcmVcIixcclxuXHRcdG9wdGlvbnM6IHRoaXMuYWxsb3dlZFZhbHVlcy5tYXAodmFsID0+IHtyZXR1cm4ge2RhdGE6IHZhbCwgbGFiZWw6dmFsfTsgfSksXHJcblx0XHQkZWxlbWVudDogJChcIjxkaXYgc3R5bGU9J3dpZHRoOmNhbGMoMTAwJSAtIDcwcHgpO21hcmdpbi1yaWdodDowOyc+XCIpIC8vIHRoZSA3MHB4IGxlYXZlcyByb29tIGZvciBidXR0b25zXHJcblx0fSApO1xyXG5cdC8vIFJlZHVjZSB0aGUgZXhjZXNzaXZlIHdoaXRlc3BhY2UvaGVpZ2h0XHJcblx0dGhpcy5pbnB1dC4kZWxlbWVudC5maW5kKFwiaW5wdXRcIikuY3NzKHtcclxuXHRcdFwicGFkZGluZy10b3BcIjogMCxcclxuXHRcdFwicGFkZGluZy1ib3R0b21cIjogXCIycHhcIixcclxuXHRcdFwiaGVpZ2h0XCI6IFwiMjRweFwiXHJcblx0fSk7XHJcblx0Ly8gRml4IGxhYmVsIHBvc2l0aW9uaW5nIHdpdGhpbiB0aGUgcmVkdWNlZCBoZWlnaHRcclxuXHR0aGlzLmlucHV0LiRlbGVtZW50LmZpbmQoXCJzcGFuLm9vLXVpLWxhYmVsRWxlbWVudC1sYWJlbFwiKS5jc3Moe1wibGluZS1oZWlnaHRcIjogXCJub3JtYWxcIn0pO1xyXG5cdC8vIEFsc28gcmVkdWNlIGhlaWdodCBvZiBkcm9wZG93biBidXR0b24gKGlmIG9wdGlvbnMgYXJlIHByZXNlbnQpXHJcblx0dGhpcy5pbnB1dC4kZWxlbWVudC5maW5kKFwiYS5vby11aS1idXR0b25FbGVtZW50LWJ1dHRvblwiKS5jc3Moe1xyXG5cdFx0XCJwYWRkaW5nLXRvcFwiOiAwLFxyXG5cdFx0XCJoZWlnaHRcIjogXCIyNHB4XCIsXHJcblx0XHRcIm1pbi1oZWlnaHRcIjogXCIwXCJcclxuXHR9KTtcclxuXHJcblx0Ly92YXIgZGVzY3JpcHRpb24gPSB0aGlzLnBhcmFtRGF0YVtwYXJhbWV0ZXIubmFtZV0gJiYgdGhpcy5wYXJhbURhdGFbcGFyYW1ldGVyLm5hbWVdLmxhYmVsICYmIHRoaXMucGFyYW1EYXRhW3BhcmFtZXRlci5uYW1lXS5sYWJlbC5lbjtcclxuXHQvLyB2YXIgcGFyYW1OYW1lID0gbmV3IE9PLnVpLkxhYmVsV2lkZ2V0KHtcclxuXHQvLyBcdGxhYmVsOiBcInxcIiArIHBhcmFtZXRlci5uYW1lICsgXCI9XCIsXHJcblx0Ly8gXHQkZWxlbWVudDogJChcIjxjb2RlPlwiKVxyXG5cdC8vIH0pO1xyXG5cdHRoaXMuZGVsZXRlQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCh7XHJcblx0XHRpY29uOiBcImNsZWFyXCIsXHJcblx0XHRmcmFtZWQ6IGZhbHNlLFxyXG5cdFx0ZmxhZ3M6IFwiZGVzdHJ1Y3RpdmVcIlxyXG5cdH0pO1xyXG5cdHRoaXMuZGVsZXRlQnV0dG9uLiRlbGVtZW50LmZpbmQoXCJhIHNwYW5cIikuZmlyc3QoKS5jc3Moe1xyXG5cdFx0XCJtaW4td2lkdGhcIjogXCJ1bnNldFwiLFxyXG5cdFx0XCJ3aWR0aFwiOiBcIjE2cHhcIlxyXG5cdH0pO1xyXG4gICAgXHJcblx0dGhpcy5jb25maXJtQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCh7XHJcblx0XHRpY29uOiBcImNoZWNrXCIsXHJcblx0XHRmcmFtZWQ6IGZhbHNlLFxyXG5cdFx0ZmxhZ3M6IFwicHJvZ3Jlc3NpdmVcIixcclxuXHRcdCRlbGVtZW50OiAkKFwiPHNwYW4gc3R5bGU9J21hcmdpbi1yaWdodDowJz5cIilcclxuXHR9KTtcclxuXHR0aGlzLmNvbmZpcm1CdXR0b24uJGVsZW1lbnQuZmluZChcImEgc3BhblwiKS5maXJzdCgpLmNzcyh7XHJcblx0XHRcIm1pbi13aWR0aFwiOiBcInVuc2V0XCIsXHJcblx0XHRcIndpZHRoXCI6IFwiMTZweFwiLFxyXG5cdFx0XCJtYXJnaW4tcmlnaHRcIjogMFxyXG5cdH0pO1xyXG5cclxuXHR0aGlzLmVkaXRMYXlvdXRDb250cm9scyA9IG5ldyBPTy51aS5Ib3Jpem9udGFsTGF5b3V0KHtcclxuXHRcdGl0ZW1zOiBbXHJcblx0XHRcdHRoaXMuaW5wdXQsXHJcblx0XHRcdHRoaXMuY29uZmlybUJ1dHRvbixcclxuXHRcdFx0dGhpcy5kZWxldGVCdXR0b25cclxuXHRcdF0sXHJcblx0XHQvLyRlbGVtZW50OiAkKFwiPGRpdiBzdHlsZT0nd2lkdGg6IDQ4JTttYXJnaW46MDsnPlwiKVxyXG5cdH0pO1xyXG5cdC8vIEhhY2tzIHRvIG1ha2UgdGhpcyBIb3Jpem9udGFsTGF5b3V0IGdvIGluc2lkZSBhIEZpZWxkTGF5b3V0XHJcblx0dGhpcy5lZGl0TGF5b3V0Q29udHJvbHMuZ2V0SW5wdXRJZCA9ICgpID0+IGZhbHNlO1xyXG5cdHRoaXMuZWRpdExheW91dENvbnRyb2xzLmlzRGlzYWJsZWQgPSAoKSA9PiBmYWxzZTtcclxuXHR0aGlzLmVkaXRMYXlvdXRDb250cm9scy5zaW11bGF0ZUxhYmVsQ2xpY2sgPSAoKSA9PiB0cnVlO1xyXG5cclxuXHR0aGlzLmVkaXRMYXlvdXQgPSBuZXcgT08udWkuRmllbGRMYXlvdXQoIHRoaXMuZWRpdExheW91dENvbnRyb2xzLCB7XHJcblx0XHRsYWJlbDogdGhpcy5wYXJhbWV0ZXIubmFtZSArIFwiID1cIixcclxuXHRcdGFsaWduOiBcInRvcFwiLFxyXG5cdFx0aGVscDogdGhpcy5wYXJhbURhdGEuZGVzY3JpcHRpb24gJiYgdGhpcy5wYXJhbURhdGEuZGVzY3JpcHRpb24uZW4gfHwgZmFsc2UsXHJcblx0XHRoZWxwSW5saW5lOiB0cnVlXHJcblx0fSkudG9nZ2xlKCk7XHJcblx0dGhpcy5lZGl0TGF5b3V0LiRlbGVtZW50LmZpbmQoXCJsYWJlbC5vby11aS1pbmxpbmUtaGVscFwiKS5jc3Moe1wibWFyZ2luXCI6IFwiLTEwcHggMCA1cHggMTBweFwifSk7XHJcblxyXG5cdHRoaXMuZnVsbExhYmVsID0gbmV3IE9PLnVpLkxhYmVsV2lkZ2V0KHtcclxuXHRcdGxhYmVsOiB0aGlzLnBhcmFtZXRlci5uYW1lICsgXCIgPSBcIiArIHRoaXMucGFyYW1ldGVyLnZhbHVlLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8bGFiZWwgc3R5bGU9J21hcmdpbjogMDsnPlwiKVxyXG5cdH0pO1xyXG5cdHRoaXMuZWRpdEJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoe1xyXG5cdFx0aWNvbjogXCJlZGl0XCIsXHJcblx0XHRmcmFtZWQ6IGZhbHNlLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8c3BhbiBzdHlsZT0nbWFyZ2luLWJvdHRvbTogMDsnPlwiKVxyXG5cdH0pO1xyXG5cdHRoaXMuZWRpdEJ1dHRvbi4kZWxlbWVudC5maW5kKFwiYVwiKS5jc3Moe1xyXG5cdFx0XCJib3JkZXItcmFkaXVzXCI6IFwiMCAxMHB4IDEwcHggMFwiLFxyXG5cdFx0XCJtYXJnaW4tbGVmdFwiOiBcIjVweFwiXHJcblx0fSk7XHJcblx0dGhpcy5lZGl0QnV0dG9uLiRlbGVtZW50LmZpbmQoXCJhIHNwYW5cIikuZmlyc3QoKS5jc3Moe1xyXG5cdFx0XCJtaW4td2lkdGhcIjogXCJ1bnNldFwiLFxyXG5cdFx0XCJ3aWR0aFwiOiBcIjE2cHhcIlxyXG5cdH0pO1xyXG5cclxuXHR0aGlzLnJlYWRMYXlvdXQgPSBuZXcgT08udWkuSG9yaXpvbnRhbExheW91dCh7XHJcblx0XHRpdGVtczogW1xyXG5cdFx0XHR0aGlzLmZ1bGxMYWJlbCxcclxuXHRcdFx0dGhpcy5lZGl0QnV0dG9uXHJcblx0XHRdLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8c3BhbiBzdHlsZT0nbWFyZ2luOjA7d2lkdGg6dW5zZXQ7Jz5cIilcclxuXHR9KTtcclxuXHJcblx0dGhpcy4kZWxlbWVudCA9ICQoXCI8ZGl2PlwiKVxyXG5cdFx0LmNzcyh7XHJcblx0XHRcdFwid2lkdGhcIjogXCJ1bnNldFwiLFxyXG5cdFx0XHRcImRpc3BsYXlcIjogXCJpbmxpbmUtYmxvY2tcIixcclxuXHRcdFx0XCJib3JkZXJcIjogXCIxcHggc29saWQgI2RkZFwiLFxyXG5cdFx0XHRcImJvcmRlci1yYWRpdXNcIjogXCIxMHB4XCIsXHJcblx0XHRcdFwicGFkZGluZy1sZWZ0XCI6IFwiMTBweFwiLFxyXG5cdFx0XHRcIm1hcmdpblwiOiBcIjAgOHB4IDhweCAwXCJcclxuXHRcdH0pXHJcblx0XHQuYXBwZW5kKHRoaXMucmVhZExheW91dC4kZWxlbWVudCwgdGhpcy5lZGl0TGF5b3V0LiRlbGVtZW50KTtcclxuICAgIFxyXG5cdHRoaXMuZWRpdEJ1dHRvbi5jb25uZWN0KCB0aGlzLCB7IFwiY2xpY2tcIjogXCJvbkVkaXRDbGlja1wiIH0gKTtcclxuXHR0aGlzLmNvbmZpcm1CdXR0b24uY29ubmVjdCggdGhpcywgeyBcImNsaWNrXCI6IFwib25Db25maXJtQ2xpY2tcIiB9ICk7XHJcbn1cclxuT08uaW5oZXJpdENsYXNzKCBQYXJhbWV0ZXJXaWRnZXQsIE9PLnVpLldpZGdldCApO1xyXG5cclxuUGFyYW1ldGVyV2lkZ2V0LnByb3RvdHlwZS5vbkVkaXRDbGljayA9IGZ1bmN0aW9uKCkge1xyXG5cdHRoaXMucmVhZExheW91dC50b2dnbGUoZmFsc2UpO1xyXG5cdHRoaXMuZWRpdExheW91dC50b2dnbGUodHJ1ZSk7XHJcblx0dGhpcy5pbnB1dC5mb2N1cygpO1xyXG59O1xyXG5cclxuUGFyYW1ldGVyV2lkZ2V0LnByb3RvdHlwZS5vbkNvbmZpcm1DbGljayA9IGZ1bmN0aW9uKCkge1xyXG5cdHRoaXMucGFyYW1ldGVyLnZhbHVlID0gdGhpcy5pbnB1dC5nZXRWYWx1ZSgpO1xyXG5cdHRoaXMuZnVsbExhYmVsLnNldExhYmVsKHRoaXMucGFyYW1ldGVyLm5hbWUgKyBcIiA9IFwiICsgdGhpcy5wYXJhbWV0ZXIudmFsdWUpO1xyXG5cdHRoaXMucmVhZExheW91dC50b2dnbGUodHJ1ZSk7XHJcblx0dGhpcy5lZGl0TGF5b3V0LnRvZ2dsZShmYWxzZSk7XHJcbn07XHJcblxyXG5QYXJhbWV0ZXJXaWRnZXQucHJvdG90eXBlLmZvY3VzSW5wdXQgPSBmdW5jdGlvbigpIHtcclxuXHRyZXR1cm4gdGhpcy5pbnB1dC5mb2N1cygpO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgUGFyYW1ldGVyV2lkZ2V0OyIsInZhciBTdWdnZXN0aW9uTG9va3VwVGV4dElucHV0V2lkZ2V0ID0gZnVuY3Rpb24gU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldCggY29uZmlnICkge1xyXG5cdE9PLnVpLlRleHRJbnB1dFdpZGdldC5jYWxsKCB0aGlzLCBjb25maWcgKTtcclxuXHRPTy51aS5taXhpbi5Mb29rdXBFbGVtZW50LmNhbGwoIHRoaXMsIGNvbmZpZyApO1xyXG5cdHRoaXMuc3VnZ2VzdGlvbnMgPSBjb25maWcuc3VnZ2VzdGlvbnMgfHwgW107XHJcbn07XHJcbk9PLmluaGVyaXRDbGFzcyggU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldCwgT08udWkuVGV4dElucHV0V2lkZ2V0ICk7XHJcbk9PLm1peGluQ2xhc3MoIFN1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXQsIE9PLnVpLm1peGluLkxvb2t1cEVsZW1lbnQgKTtcclxuXHJcbi8vIFNldCBzdWdnZXN0aW9uLiBwYXJhbTogT2JqZWN0W10gd2l0aCBvYmplY3RzIG9mIHRoZSBmb3JtIHsgZGF0YTogLi4uICwgbGFiZWw6IC4uLiB9XHJcblN1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXQucHJvdG90eXBlLnNldFN1Z2dlc3Rpb25zID0gZnVuY3Rpb24oc3VnZ2VzdGlvbnMpIHtcclxuXHR0aGlzLnN1Z2dlc3Rpb25zID0gc3VnZ2VzdGlvbnM7XHJcbn07XHJcblxyXG4vLyBSZXR1cm5zIGRhdGEsIGFzIGEgcmVzb2x1dGlvbiB0byBhIHByb21pc2UsIHRvIGJlIHBhc3NlZCB0byAjZ2V0TG9va3VwTWVudU9wdGlvbnNGcm9tRGF0YVxyXG5TdWdnZXN0aW9uTG9va3VwVGV4dElucHV0V2lkZ2V0LnByb3RvdHlwZS5nZXRMb29rdXBSZXF1ZXN0ID0gZnVuY3Rpb24gKCkge1xyXG5cdHZhciBkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKS5yZXNvbHZlKG5ldyBSZWdFeHAoXCJcXFxcYlwiICsgbXcudXRpbC5lc2NhcGVSZWdFeHAodGhpcy5nZXRWYWx1ZSgpKSwgXCJpXCIpKTtcclxuXHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZSggeyBhYm9ydDogZnVuY3Rpb24gKCkge30gfSApO1xyXG59O1xyXG5cclxuLy8gPz8/XHJcblN1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXQucHJvdG90eXBlLmdldExvb2t1cENhY2hlRGF0YUZyb21SZXNwb25zZSA9IGZ1bmN0aW9uICggcmVzcG9uc2UgKSB7XHJcblx0cmV0dXJuIHJlc3BvbnNlIHx8IFtdO1xyXG59O1xyXG5cclxuLy8gSXMgcGFzc2VkIGRhdGEgZnJvbSAjZ2V0TG9va3VwUmVxdWVzdCwgcmV0dXJucyBhbiBhcnJheSBvZiBtZW51IGl0ZW0gd2lkZ2V0cyBcclxuU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldC5wcm90b3R5cGUuZ2V0TG9va3VwTWVudU9wdGlvbnNGcm9tRGF0YSA9IGZ1bmN0aW9uICggcGF0dGVybiApIHtcclxuXHR2YXIgbGFiZWxNYXRjaGVzSW5wdXRWYWwgPSBmdW5jdGlvbihzdWdnZXN0aW9uSXRlbSkge1xyXG5cdFx0cmV0dXJuIHBhdHRlcm4udGVzdChzdWdnZXN0aW9uSXRlbS5sYWJlbCkgfHwgKCAhc3VnZ2VzdGlvbkl0ZW0ubGFiZWwgJiYgcGF0dGVybi50ZXN0KHN1Z2dlc3Rpb25JdGVtLmRhdGEpICk7XHJcblx0fTtcclxuXHR2YXIgbWFrZU1lbnVPcHRpb25XaWRnZXQgPSBmdW5jdGlvbihvcHRpb25JdGVtKSB7XHJcblx0XHRyZXR1cm4gbmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0ZGF0YTogb3B0aW9uSXRlbS5kYXRhLFxyXG5cdFx0XHRsYWJlbDogb3B0aW9uSXRlbS5sYWJlbCB8fCBvcHRpb25JdGVtLmRhdGFcclxuXHRcdH0gKTtcclxuXHR9O1xyXG5cdHJldHVybiB0aGlzLnN1Z2dlc3Rpb25zLmZpbHRlcihsYWJlbE1hdGNoZXNJbnB1dFZhbCkubWFwKG1ha2VNZW51T3B0aW9uV2lkZ2V0KTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFN1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXQ7IiwiaW1wb3J0IHttYWtlRXJyb3JNc2d9IGZyb20gXCIuLi91dGlsXCI7XHJcblxyXG4vKiB2YXIgaW5jcmVtZW50UHJvZ3Jlc3NCeUludGVydmFsID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIGluY3JlbWVudEludGVydmFsRGVsYXkgPSAxMDA7XHJcblx0dmFyIGluY3JlbWVudEludGVydmFsQW1vdW50ID0gMC4xO1xyXG5cdHZhciBpbmNyZW1lbnRJbnRlcnZhbE1heHZhbCA9IDk4O1xyXG5cdHJldHVybiB3aW5kb3cuc2V0SW50ZXJ2YWwoXHJcblx0XHRpbmNyZW1lbnRQcm9ncmVzcyxcclxuXHRcdGluY3JlbWVudEludGVydmFsRGVsYXksXHJcblx0XHRpbmNyZW1lbnRJbnRlcnZhbEFtb3VudCxcclxuXHRcdGluY3JlbWVudEludGVydmFsTWF4dmFsXHJcblx0KTtcclxufTsgKi9cclxuXHJcbnZhciBMb2FkRGlhbG9nID0gZnVuY3Rpb24gTG9hZERpYWxvZyggY29uZmlnICkge1xyXG5cdExvYWREaWFsb2cuc3VwZXIuY2FsbCggdGhpcywgY29uZmlnICk7XHJcbn07XHJcbk9PLmluaGVyaXRDbGFzcyggTG9hZERpYWxvZywgT08udWkuRGlhbG9nICk7IFxyXG5cclxuTG9hZERpYWxvZy5zdGF0aWMubmFtZSA9IFwibG9hZERpYWxvZ1wiO1xyXG5Mb2FkRGlhbG9nLnN0YXRpYy50aXRsZSA9IFwiTG9hZGluZyBSYXRlci4uLlwiO1xyXG5cclxuLy8gQ3VzdG9taXplIHRoZSBpbml0aWFsaXplKCkgZnVuY3Rpb246IFRoaXMgaXMgd2hlcmUgdG8gYWRkIGNvbnRlbnQgdG8gdGhlIGRpYWxvZyBib2R5IGFuZCBzZXQgdXAgZXZlbnQgaGFuZGxlcnMuXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmluaXRpYWxpemUgPSBmdW5jdGlvbiAoKSB7XHJcblx0Ly8gQ2FsbCB0aGUgcGFyZW50IG1ldGhvZC5cclxuXHRMb2FkRGlhbG9nLnN1cGVyLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwoIHRoaXMgKTtcclxuXHQvLyBDcmVhdGUgYSBsYXlvdXRcclxuXHR0aGlzLmNvbnRlbnQgPSBuZXcgT08udWkuUGFuZWxMYXlvdXQoIHsgXHJcblx0XHRwYWRkZWQ6IHRydWUsXHJcblx0XHRleHBhbmRlZDogZmFsc2UgXHJcblx0fSApO1xyXG5cdC8vIENyZWF0ZSBjb250ZW50XHJcblx0dGhpcy5wcm9ncmVzc0JhciA9IG5ldyBPTy51aS5Qcm9ncmVzc0JhcldpZGdldCgge1xyXG5cdFx0cHJvZ3Jlc3M6IDFcclxuXHR9ICk7XHJcblx0dGhpcy5zZXR1cHRhc2tzID0gW1xyXG5cdFx0bmV3IE9PLnVpLkxhYmVsV2lkZ2V0KCB7XHJcblx0XHRcdGxhYmVsOiBcIkxvYWRpbmcgbGlzdCBvZiBwcm9qZWN0IGJhbm5lcnMuLi5cIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8cCBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KSxcclxuXHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJMb2FkaW5nIHRhbGtwYWdlIHdpa2l0ZXh0Li4uXCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHAgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSksXHJcblx0XHRuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiUGFyc2luZyB0YWxrcGFnZSB0ZW1wbGF0ZXMuLi5cIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8cCBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KSxcclxuXHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJHZXR0aW5nIHRlbXBsYXRlcycgcGFyYW1ldGVyIGRhdGEuLi5cIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8cCBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KSxcclxuXHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJDaGVja2luZyBpZiBwYWdlIHJlZGlyZWN0cy4uLlwiLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxwIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrXFxcIj5cIilcclxuXHRcdH0pLFxyXG5cdFx0bmV3IE9PLnVpLkxhYmVsV2lkZ2V0KCB7XHJcblx0XHRcdGxhYmVsOiBcIlJldHJpZXZpbmcgcXVhbGl0eSBwcmVkaWN0aW9uLi4uXCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHAgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSkudG9nZ2xlKCksXHJcblx0XTtcclxuXHR0aGlzLmNsb3NlQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCgge1xyXG5cdFx0bGFiZWw6IFwiQ2xvc2VcIlxyXG5cdH0pLnRvZ2dsZSgpO1xyXG5cdHRoaXMuc2V0dXBQcm9taXNlcyA9IFtdO1xyXG5cclxuXHQvLyBBcHBlbmQgY29udGVudCB0byBsYXlvdXRcclxuXHR0aGlzLmNvbnRlbnQuJGVsZW1lbnQuYXBwZW5kKFxyXG5cdFx0dGhpcy5wcm9ncmVzc0Jhci4kZWxlbWVudCxcclxuXHRcdChuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiSW5pdGlhbGlzaW5nOlwiLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxzdHJvbmcgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSkpLiRlbGVtZW50LFxyXG5cdFx0Li4udGhpcy5zZXR1cHRhc2tzLm1hcCh3aWRnZXQgPT4gd2lkZ2V0LiRlbGVtZW50KSxcclxuXHRcdHRoaXMuY2xvc2VCdXR0b24uJGVsZW1lbnRcclxuXHQpO1xyXG5cclxuXHQvLyBBcHBlbmQgbGF5b3V0IHRvIGRpYWxvZ1xyXG5cdHRoaXMuJGJvZHkuYXBwZW5kKCB0aGlzLmNvbnRlbnQuJGVsZW1lbnQgKTtcclxuXHJcblx0Ly8gQ29ubmVjdCBldmVudHMgdG8gaGFuZGxlcnNcclxuXHR0aGlzLmNsb3NlQnV0dG9uLmNvbm5lY3QoIHRoaXMsIHsgXCJjbGlja1wiOiBcIm9uQ2xvc2VCdXR0b25DbGlja1wiIH0gKTtcclxufTtcclxuXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLm9uQ2xvc2VCdXR0b25DbGljayA9IGZ1bmN0aW9uKCkge1xyXG5cdC8vIENsb3NlIHRoaXMgZGlhbG9nLCB3aXRob3V0IHBhc3NpbmcgYW55IGRhdGFcclxuXHR0aGlzLmNsb3NlKCk7XHJcbn07XHJcblxyXG4vLyBPdmVycmlkZSB0aGUgZ2V0Qm9keUhlaWdodCgpIG1ldGhvZCB0byBzcGVjaWZ5IGEgY3VzdG9tIGhlaWdodCAob3IgZG9uJ3QgdG8gdXNlIHRoZSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRlZCBoZWlnaHQpLlxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5nZXRCb2R5SGVpZ2h0ID0gZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiB0aGlzLmNvbnRlbnQuJGVsZW1lbnQub3V0ZXJIZWlnaHQoIHRydWUgKTtcclxufTtcclxuXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmluY3JlbWVudFByb2dyZXNzID0gZnVuY3Rpb24oYW1vdW50LCBtYXhpbXVtKSB7XHJcblx0dmFyIHByaW9yUHJvZ3Jlc3MgPSB0aGlzLnByb2dyZXNzQmFyLmdldFByb2dyZXNzKCk7XHJcblx0dmFyIGluY3JlbWVudGVkUHJvZ3Jlc3MgPSBNYXRoLm1pbihtYXhpbXVtIHx8IDEwMCwgcHJpb3JQcm9ncmVzcyArIGFtb3VudCk7XHJcblx0dGhpcy5wcm9ncmVzc0Jhci5zZXRQcm9ncmVzcyhpbmNyZW1lbnRlZFByb2dyZXNzKTtcclxufTtcclxuXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmFkZFRhc2tQcm9taXNlSGFuZGxlcnMgPSBmdW5jdGlvbih0YXNrUHJvbWlzZXMpIHtcclxuXHR2YXIgb25UYXNrRG9uZSA9IGluZGV4ID0+IHtcclxuXHRcdC8vIEFkZCBcIkRvbmUhXCIgdG8gbGFiZWxcclxuXHRcdHZhciB3aWRnZXQgPSB0aGlzLnNldHVwdGFza3NbaW5kZXhdO1xyXG5cdFx0d2lkZ2V0LnNldExhYmVsKHdpZGdldC5nZXRMYWJlbCgpICsgXCIgRG9uZSFcIik7XHJcblx0XHQvLyBJbmNyZW1lbnQgc3RhdHVzIGJhci4gU2hvdyBhIHNtb290aCB0cmFuc2l0aW9uIGJ5XHJcblx0XHQvLyB1c2luZyBzbWFsbCBzdGVwcyBvdmVyIGEgc2hvcnQgZHVyYXRpb24uXHJcblx0XHR2YXIgdG90YWxJbmNyZW1lbnQgPSAyMDsgLy8gcGVyY2VudFxyXG5cdFx0dmFyIHRvdGFsVGltZSA9IDQwMDsgLy8gbWlsbGlzZWNvbmRzXHJcblx0XHR2YXIgdG90YWxTdGVwcyA9IDEwO1xyXG5cdFx0dmFyIGluY3JlbWVudFBlclN0ZXAgPSB0b3RhbEluY3JlbWVudCAvIHRvdGFsU3RlcHM7XHJcblxyXG5cdFx0Zm9yICggdmFyIHN0ZXA9MDsgc3RlcCA8IHRvdGFsU3RlcHM7IHN0ZXArKykge1xyXG5cdFx0XHR3aW5kb3cuc2V0VGltZW91dChcclxuXHRcdFx0XHR0aGlzLmluY3JlbWVudFByb2dyZXNzLmJpbmQodGhpcyksXHJcblx0XHRcdFx0dG90YWxUaW1lICogc3RlcCAvIHRvdGFsU3RlcHMsXHJcblx0XHRcdFx0aW5jcmVtZW50UGVyU3RlcFxyXG5cdFx0XHQpO1xyXG5cdFx0fVxyXG5cdH07XHJcblx0dmFyIG9uVGFza0Vycm9yID0gKGluZGV4LCBjb2RlLCBpbmZvKSA9PiB7XHJcblx0XHR2YXIgd2lkZ2V0ID0gdGhpcy5zZXR1cHRhc2tzW2luZGV4XTtcclxuXHRcdHdpZGdldC5zZXRMYWJlbChcclxuXHRcdFx0d2lkZ2V0LmdldExhYmVsKCkgKyBcIiBGYWlsZWQuIFwiICsgbWFrZUVycm9yTXNnKGNvZGUsIGluZm8pXHJcblx0XHQpO1xyXG5cdFx0dGhpcy5jbG9zZUJ1dHRvbi50b2dnbGUodHJ1ZSk7XHJcblx0XHR0aGlzLnVwZGF0ZVNpemUoKTtcclxuXHR9O1xyXG5cdHRhc2tQcm9taXNlcy5mb3JFYWNoKGZ1bmN0aW9uKHByb21pc2UsIGluZGV4KSB7XHJcblx0XHRwcm9taXNlLnRoZW4oXHJcblx0XHRcdCgpID0+IG9uVGFza0RvbmUoaW5kZXgpLFxyXG5cdFx0XHQoY29kZSwgaW5mbykgPT4gb25UYXNrRXJyb3IoaW5kZXgsIGNvZGUsIGluZm8pXHJcblx0XHQpO1xyXG5cdH0pO1xyXG59O1xyXG5cclxuLy8gVXNlIGdldFNldHVwUHJvY2VzcygpIHRvIHNldCB1cCB0aGUgd2luZG93IHdpdGggZGF0YSBwYXNzZWQgdG8gaXQgYXQgdGhlIHRpbWUgXHJcbi8vIG9mIG9wZW5pbmdcclxuTG9hZERpYWxvZy5wcm90b3R5cGUuZ2V0U2V0dXBQcm9jZXNzID0gZnVuY3Rpb24gKCBkYXRhICkge1xyXG5cdGRhdGEgPSBkYXRhIHx8IHt9O1xyXG5cdHJldHVybiBMb2FkRGlhbG9nLnN1cGVyLnByb3RvdHlwZS5nZXRTZXR1cFByb2Nlc3MuY2FsbCggdGhpcywgZGF0YSApXHJcblx0XHQubmV4dCggKCkgPT4ge1xyXG5cdFx0XHR2YXIgc2hvd09yZXNUYXNrID0gISFkYXRhLm9yZXM7XHJcblx0XHRcdHRoaXMuc2V0dXB0YXNrc1s1XS50b2dnbGUoc2hvd09yZXNUYXNrKTtcclxuXHRcdFx0dmFyIHRhc2tQcm9taXNlcyA9IGRhdGEub3JlcyA/IGRhdGEucHJvbWlzZXMgOiBkYXRhLnByb21pc2VzLnNsaWNlKDAsIC0xKTtcclxuXHRcdFx0ZGF0YS5pc09wZW5lZC50aGVuKCgpID0+IHRoaXMuYWRkVGFza1Byb21pc2VIYW5kbGVycyh0YXNrUHJvbWlzZXMpKTtcclxuXHRcdH0sIHRoaXMgKTtcclxufTtcclxuXHJcbi8vIFByZXZlbnQgd2luZG93IGZyb20gY2xvc2luZyB0b28gcXVpY2tseSwgdXNpbmcgZ2V0SG9sZFByb2Nlc3MoKVxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5nZXRIb2xkUHJvY2VzcyA9IGZ1bmN0aW9uICggZGF0YSApIHtcclxuXHRkYXRhID0gZGF0YSB8fCB7fTtcclxuXHRpZiAoZGF0YS5zdWNjZXNzKSB7XHJcblx0XHQvLyBXYWl0IGEgYml0IGJlZm9yZSBwcm9jZXNzaW5nIHRoZSBjbG9zZSwgd2hpY2ggaGFwcGVucyBhdXRvbWF0aWNhbGx5XHJcblx0XHRyZXR1cm4gTG9hZERpYWxvZy5zdXBlci5wcm90b3R5cGUuZ2V0SG9sZFByb2Nlc3MuY2FsbCggdGhpcywgZGF0YSApXHJcblx0XHRcdC5uZXh0KDgwMCk7XHJcblx0fVxyXG5cdC8vIE5vIG5lZWQgdG8gd2FpdCBpZiBjbG9zZWQgbWFudWFsbHlcclxuXHRyZXR1cm4gTG9hZERpYWxvZy5zdXBlci5wcm90b3R5cGUuZ2V0SG9sZFByb2Nlc3MuY2FsbCggdGhpcywgZGF0YSApO1xyXG59O1xyXG5cclxuLy8gVXNlIHRoZSBnZXRUZWFyZG93blByb2Nlc3MoKSBtZXRob2QgdG8gcGVyZm9ybSBhY3Rpb25zIHdoZW5ldmVyIHRoZSBkaWFsb2cgaXMgY2xvc2VkLiBcclxuTG9hZERpYWxvZy5wcm90b3R5cGUuZ2V0VGVhcmRvd25Qcm9jZXNzID0gZnVuY3Rpb24gKCBkYXRhICkge1xyXG5cdHJldHVybiBMb2FkRGlhbG9nLnN1cGVyLnByb3RvdHlwZS5nZXRUZWFyZG93blByb2Nlc3MuY2FsbCggdGhpcywgZGF0YSApXHJcblx0XHQuZmlyc3QoICgpID0+IHtcclxuXHRcdC8vIFBlcmZvcm0gY2xlYW51cDogcmVzZXQgbGFiZWxzXHJcblx0XHRcdHRoaXMuc2V0dXB0YXNrcy5mb3JFYWNoKCBzZXR1cHRhc2sgPT4ge1xyXG5cdFx0XHRcdHZhciBjdXJyZW50TGFiZWwgPSBzZXR1cHRhc2suZ2V0TGFiZWwoKTtcclxuXHRcdFx0XHRzZXR1cHRhc2suc2V0TGFiZWwoXHJcblx0XHRcdFx0XHRjdXJyZW50TGFiZWwuc2xpY2UoMCwgY3VycmVudExhYmVsLmluZGV4T2YoXCIuLi5cIikrMylcclxuXHRcdFx0XHQpO1xyXG5cdFx0XHR9ICk7XHJcblx0XHR9LCB0aGlzICk7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBMb2FkRGlhbG9nOyIsImltcG9ydCBCYW5uZXJXaWRnZXQgZnJvbSBcIi4vQ29tcG9uZW50cy9CYW5uZXJXaWRnZXRcIjtcclxuXHJcbmZ1bmN0aW9uIE1haW5XaW5kb3coIGNvbmZpZyApIHtcclxuXHRNYWluV2luZG93LnN1cGVyLmNhbGwoIHRoaXMsIGNvbmZpZyApO1xyXG59XHJcbk9PLmluaGVyaXRDbGFzcyggTWFpbldpbmRvdywgT08udWkuUHJvY2Vzc0RpYWxvZyApO1xyXG5cclxuTWFpbldpbmRvdy5zdGF0aWMubmFtZSA9IFwibWFpblwiO1xyXG5NYWluV2luZG93LnN0YXRpYy50aXRsZSA9IFwiUmF0ZXJcIjtcclxuTWFpbldpbmRvdy5zdGF0aWMuc2l6ZSA9IFwibGFyZ2VcIjtcclxuTWFpbldpbmRvdy5zdGF0aWMuYWN0aW9ucyA9IFtcclxuXHQvLyBQcmltYXJ5ICh0b3AgcmlnaHQpOlxyXG5cdHtcclxuXHRcdGxhYmVsOiBcIlhcIiwgLy8gbm90IHVzaW5nIGFuIGljb24gc2luY2UgY29sb3IgYmVjb21lcyBpbnZlcnRlZCwgaS5lLiB3aGl0ZSBvbiBsaWdodC1ncmV5XHJcblx0XHR0aXRsZTogXCJDbG9zZSAoYW5kIGRpc2NhcmQgYW55IGNoYW5nZXMpXCIsXHJcblx0XHRmbGFnczogXCJwcmltYXJ5XCIsXHJcblx0fSxcclxuXHQvLyBTYWZlICh0b3AgbGVmdClcclxuXHR7XHJcblx0XHRhY3Rpb246IFwiaGVscFwiLFxyXG5cdFx0ZmxhZ3M6IFwic2FmZVwiLFxyXG5cdFx0bGFiZWw6IFwiP1wiLCAvLyBub3QgdXNpbmcgaWNvbiwgdG8gbWlycm9yIENsb3NlIGFjdGlvblxyXG5cdFx0dGl0bGU6IFwiaGVscFwiXHJcblx0fSxcclxuXHQvLyBPdGhlcnMgKGJvdHRvbSlcclxuXHR7XHJcblx0XHRhY3Rpb246IFwic2F2ZVwiLFxyXG5cdFx0bGFiZWw6IG5ldyBPTy51aS5IdG1sU25pcHBldChcIjxzcGFuIHN0eWxlPSdwYWRkaW5nOjAgMWVtOyc+U2F2ZTwvc3Bhbj5cIiksXHJcblx0XHRmbGFnczogW1wicHJpbWFyeVwiLCBcInByb2dyZXNzaXZlXCJdXHJcblx0fSxcclxuXHR7XHJcblx0XHRhY3Rpb246IFwicHJldmlld1wiLFxyXG5cdFx0bGFiZWw6IFwiU2hvdyBwcmV2aWV3XCJcclxuXHR9LFxyXG5cdHtcclxuXHRcdGFjdGlvbjogXCJjaGFuZ2VzXCIsXHJcblx0XHRsYWJlbDogXCJTaG93IGNoYW5nZXNcIlxyXG5cdH0sXHJcblx0e1xyXG5cdFx0YWN0aW9uOiBcImNhbmNlbFwiLFxyXG5cdFx0bGFiZWw6IFwiQ2FuY2VsXCJcclxuXHR9XHJcbl07XHJcblxyXG4vLyBDdXN0b21pemUgdGhlIGluaXRpYWxpemUoKSBmdW5jdGlvbjogVGhpcyBpcyB3aGVyZSB0byBhZGQgY29udGVudCB0byB0aGUgZGlhbG9nIGJvZHkgYW5kIHNldCB1cCBldmVudCBoYW5kbGVycy5cclxuTWFpbldpbmRvdy5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uICgpIHtcclxuXHQvLyBDYWxsIHRoZSBwYXJlbnQgbWV0aG9kLlxyXG5cdE1haW5XaW5kb3cuc3VwZXIucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCggdGhpcyApO1xyXG5cdC8vIENyZWF0ZSBsYXlvdXRzXHJcblx0dGhpcy50b3BCYXIgPSBuZXcgT08udWkuUGFuZWxMYXlvdXQoIHtcclxuXHRcdGV4cGFuZGVkOiBmYWxzZSxcclxuXHRcdGZyYW1lZDogZmFsc2UsXHJcblx0XHRwYWRkZWQ6IGZhbHNlXHJcblx0fSApO1xyXG5cdHRoaXMuY29udGVudCA9IG5ldyBPTy51aS5QYW5lbExheW91dCgge1xyXG5cdFx0ZXhwYW5kZWQ6IHRydWUsXHJcblx0XHRwYWRkZWQ6IHRydWUsXHJcblx0XHRzY3JvbGxhYmxlOiB0cnVlXHJcblx0fSApO1xyXG5cdHRoaXMub3V0ZXJMYXlvdXQgPSBuZXcgT08udWkuU3RhY2tMYXlvdXQoIHtcclxuXHRcdGl0ZW1zOiBbXHJcblx0XHRcdHRoaXMudG9wQmFyLFxyXG5cdFx0XHR0aGlzLmNvbnRlbnRcclxuXHRcdF0sXHJcblx0XHRjb250aW51b3VzOiB0cnVlLFxyXG5cdFx0ZXhwYW5kZWQ6IHRydWVcclxuXHR9ICk7XHJcblx0Ly8gQ3JlYXRlIHRvcEJhciBjb250ZW50XHJcblx0dGhpcy5zZWFyY2hCb3ggPSBuZXcgT08udWkuQ29tYm9Cb3hJbnB1dFdpZGdldCgge1xyXG5cdFx0cGxhY2Vob2xkZXI6IFwiQWRkIGEgV2lraVByb2plY3QuLi5cIixcclxuXHRcdG9wdGlvbnM6IFtcclxuXHRcdFx0eyAvLyBGSVhNRTogVGhlc2UgYXJlIHBsYWNlaG9sZGVycy5cclxuXHRcdFx0XHRkYXRhOiBcIk9wdGlvbiAxXCIsXHJcblx0XHRcdFx0bGFiZWw6IFwiT3B0aW9uIE9uZVwiXHJcblx0XHRcdH0sXHJcblx0XHRcdHtcclxuXHRcdFx0XHRkYXRhOiBcIk9wdGlvbiAyXCIsXHJcblx0XHRcdFx0bGFiZWw6IFwiT3B0aW9uIFR3b1wiXHJcblx0XHRcdH0sXHJcblx0XHRcdHtcclxuXHRcdFx0XHRkYXRhOiBcIk9wdGlvbiAzXCIsXHJcblx0XHRcdFx0bGFiZWw6IFwiT3B0aW9uIFRocmVlXCJcclxuXHRcdFx0fVxyXG5cdFx0XSxcclxuXHRcdCRlbGVtZW50OiAkKFwiPGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmUtYmxvY2s7d2lkdGg6MTAwJTttYXgtd2lkdGg6NDI1cHg7Jz5cIiksXHJcblx0XHQkb3ZlcmxheTogdGhpcy4kb3ZlcmxheSxcclxuXHR9ICk7XHJcblxyXG5cdHRoaXMuc2V0QWxsRHJvcERvd24gPSBuZXcgT08udWkuRHJvcGRvd25XaWRnZXQoIHtcclxuXHRcdGxhYmVsOiBuZXcgT08udWkuSHRtbFNuaXBwZXQoXCI8c3BhbiBzdHlsZT1cXFwiY29sb3I6Izc3N1xcXCI+U2V0IGFsbC4uLjwvc3Bhbj5cIiksXHJcblx0XHRtZW51OiB7IC8vIEZJWE1FOiBuZWVkcyByZWFsIGRhdGFcclxuXHRcdFx0aXRlbXM6IFtcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudVNlY3Rpb25PcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGxhYmVsOiBcIkNsYXNzZXNcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJCXCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJCXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwiQ1wiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiQ1wiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcInN0YXJ0XCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJTdGFydFwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51U2VjdGlvbk9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0bGFiZWw6IFwiSW1wb3J0YW5jZXNcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJ0b3BcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIlRvcFwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcImhpZ2hcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIkhpZ2hcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJtaWRcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIk1pZFwiXHJcblx0XHRcdFx0fSApXHJcblx0XHRcdF1cclxuXHRcdH0sXHJcblx0XHQkZWxlbWVudDogJChcIjxzcGFuIHN0eWxlPVxcXCJkaXNwbGF5OmlubGluZS1ibG9jazt3aWR0aDphdXRvXFxcIj5cIiksXHJcblx0XHQkb3ZlcmxheTogdGhpcy4kb3ZlcmxheSxcclxuXHR9ICk7XHJcblxyXG5cdHRoaXMucmVtb3ZlQWxsQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCgge1xyXG5cdFx0aWNvbjogXCJ0cmFzaFwiLFxyXG5cdFx0dGl0bGU6IFwiUmVtb3ZlIGFsbFwiLFxyXG5cdFx0ZmxhZ3M6IFwiZGVzdHJ1Y3RpdmVcIlxyXG5cdH0gKTtcclxuXHR0aGlzLmNsZWFyQWxsQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCgge1xyXG5cdFx0aWNvbjogXCJjYW5jZWxcIixcclxuXHRcdHRpdGxlOiBcIkNsZWFyIGFsbFwiLFxyXG5cdFx0ZmxhZ3M6IFwiZGVzdHJ1Y3RpdmVcIlxyXG5cdH0gKTtcclxuXHR0aGlzLmJ5cGFzc0FsbEJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoIHtcclxuXHRcdGljb246IFwiYXJ0aWNsZVJlZGlyZWN0XCIsXHJcblx0XHR0aXRsZTogXCJCeXBhc3MgYWxsIHJlZGlyZWN0c1wiXHJcblx0fSApO1xyXG5cdHRoaXMuZG9BbGxCdXR0b25zID0gbmV3IE9PLnVpLkJ1dHRvbkdyb3VwV2lkZ2V0KCB7XHJcblx0XHRpdGVtczogW1xyXG5cdFx0XHR0aGlzLnJlbW92ZUFsbEJ1dHRvbixcclxuXHRcdFx0dGhpcy5jbGVhckFsbEJ1dHRvbixcclxuXHRcdFx0dGhpcy5ieXBhc3NBbGxCdXR0b25cclxuXHRcdF0sXHJcblx0XHQkZWxlbWVudDogJChcIjxzcGFuIHN0eWxlPSdmbG9hdDpyaWdodDsnPlwiKSxcclxuXHR9ICk7XHJcblxyXG5cdHRoaXMudG9wQmFyLiRlbGVtZW50LmFwcGVuZChcclxuXHRcdHRoaXMuc2VhcmNoQm94LiRlbGVtZW50LFxyXG5cdFx0dGhpcy5zZXRBbGxEcm9wRG93bi4kZWxlbWVudCxcclxuXHRcdHRoaXMuZG9BbGxCdXR0b25zLiRlbGVtZW50XHJcblx0KS5jc3MoXCJiYWNrZ3JvdW5kXCIsXCIjY2NjXCIpO1xyXG5cclxuXHQvLyBGSVhNRTogdGhpcyBpcyBwbGFjZWhvbGRlciBjb250ZW50XHJcblx0Ly8gdGhpcy5jb250ZW50LiRlbGVtZW50LmFwcGVuZCggXCI8c3Bhbj4oTm8gcHJvamVjdCBiYW5uZXJzIHlldCk8L3NwYW4+XCIgKTtcclxuXHJcblx0dGhpcy4kYm9keS5hcHBlbmQoIHRoaXMub3V0ZXJMYXlvdXQuJGVsZW1lbnQgKTtcclxufTtcclxuXHJcbi8vIE92ZXJyaWRlIHRoZSBnZXRCb2R5SGVpZ2h0KCkgbWV0aG9kIHRvIHNwZWNpZnkgYSBjdXN0b20gaGVpZ2h0XHJcbk1haW5XaW5kb3cucHJvdG90eXBlLmdldEJvZHlIZWlnaHQgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHRoaXMudG9wQmFyLiRlbGVtZW50Lm91dGVySGVpZ2h0KCB0cnVlICkgKyB0aGlzLmNvbnRlbnQuJGVsZW1lbnQub3V0ZXJIZWlnaHQoIHRydWUgKTtcclxufTtcclxuXHJcbi8vIFVzZSBnZXRTZXR1cFByb2Nlc3MoKSB0byBzZXQgdXAgdGhlIHdpbmRvdyB3aXRoIGRhdGEgcGFzc2VkIHRvIGl0IGF0IHRoZSB0aW1lIFxyXG4vLyBvZiBvcGVuaW5nXHJcbk1haW5XaW5kb3cucHJvdG90eXBlLmdldFNldHVwUHJvY2VzcyA9IGZ1bmN0aW9uICggZGF0YSApIHtcclxuXHRkYXRhID0gZGF0YSB8fCB7fTtcclxuXHRyZXR1cm4gTWFpbldpbmRvdy5zdXBlci5wcm90b3R5cGUuZ2V0U2V0dXBQcm9jZXNzLmNhbGwoIHRoaXMsIGRhdGEgKVxyXG5cdFx0Lm5leHQoICgpID0+IHtcclxuXHRcdFx0Ly8gVE9ETzogU2V0IHVwIHdpbmRvdyBiYXNlZCBvbiBkYXRhXHJcblx0XHRcdHRoaXMuYmFubmVycyA9IGRhdGEuYmFubmVycy5tYXAoYmFubmVyVGVtcGxhdGUgPT4gbmV3IEJhbm5lcldpZGdldChiYW5uZXJUZW1wbGF0ZSkpO1xyXG5cdFx0XHRmb3IgKGNvbnN0IGJhbm5lciBvZiB0aGlzLmJhbm5lcnMpIHtcclxuXHRcdFx0XHR0aGlzLmNvbnRlbnQuJGVsZW1lbnQuYXBwZW5kKGJhbm5lci4kZWxlbWVudCk7XHJcblx0XHRcdH1cclxuXHRcdFx0dGhpcy50YWxrV2lraXRleHQgPSBkYXRhLnRhbGtXaWtpdGV4dDtcclxuXHRcdFx0dGhpcy50YWxrcGFnZSA9IGRhdGEudGFsa3BhZ2U7XHJcblx0XHRcdHRoaXMudXBkYXRlU2l6ZSgpO1xyXG5cdFx0fSwgdGhpcyApO1xyXG59O1xyXG5cclxuLy8gU2V0IHVwIHRoZSB3aW5kb3cgaXQgaXMgcmVhZHk6IGF0dGFjaGVkIHRvIHRoZSBET00sIGFuZCBvcGVuaW5nIGFuaW1hdGlvbiBjb21wbGV0ZWRcclxuTWFpbldpbmRvdy5wcm90b3R5cGUuZ2V0UmVhZHlQcm9jZXNzID0gZnVuY3Rpb24gKCBkYXRhICkge1xyXG5cdGRhdGEgPSBkYXRhIHx8IHt9O1xyXG5cdHJldHVybiBNYWluV2luZG93LnN1cGVyLnByb3RvdHlwZS5nZXRSZWFkeVByb2Nlc3MuY2FsbCggdGhpcywgZGF0YSApXHJcblx0XHQubmV4dCggKCkgPT4geyAvLyBmb3JjZSBsYWJlbHMgdG8gc2hvdyBieSBkZWZhdWx0XHJcblx0XHRcdHRoaXMuYmFubmVycy5mb3JFYWNoKGJhbm5lciA9PiB7XHJcblx0XHRcdFx0YmFubmVyLnBhcmFtZXRlcldpZGdldHMuZm9yRWFjaChwYXJhbSA9PiBwYXJhbS5mb2N1c0lucHV0KCkpOyBcclxuXHRcdFx0fSk7XHJcblx0XHR9LCB0aGlzKVxyXG5cdFx0Lm5leHQoICgpID0+IHRoaXMuc2VhcmNoQm94LmZvY3VzKCkpOyAvLyBzZWFyY2ggYm94IGlzIHdoZXJlIHdlIHJlYWxseSB3YW50IGZvY3VzIHRvIGJlXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBNYWluV2luZG93OyIsImltcG9ydCBjb25maWcgZnJvbSBcIi4vY29uZmlnXCI7XHJcbmltcG9ydCB7QVBJLCBtYWtlRXJyb3JNc2d9IGZyb20gXCIuL3V0aWxcIjtcclxuaW1wb3J0IHNldHVwUmF0ZXIgZnJvbSBcIi4vc2V0dXBcIjtcclxuXHJcbnZhciBhdXRvU3RhcnQgPSBmdW5jdGlvbiBhdXRvU3RhcnQoKSB7XHJcblx0aWYgKCB3aW5kb3cucmF0ZXJfYXV0b3N0YXJ0TmFtZXNwYWNlcyA9PSBudWxsIHx8IGNvbmZpZy5tdy53Z0lzTWFpblBhZ2UgKSB7XHJcblx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgpO1xyXG5cdH1cclxuXHRcclxuXHR2YXIgYXV0b3N0YXJ0TmFtZXNwYWNlcyA9ICggJC5pc0FycmF5KHdpbmRvdy5yYXRlcl9hdXRvc3RhcnROYW1lc3BhY2VzKSApID8gd2luZG93LnJhdGVyX2F1dG9zdGFydE5hbWVzcGFjZXMgOiBbd2luZG93LnJhdGVyX2F1dG9zdGFydE5hbWVzcGFjZXNdO1xyXG5cdFxyXG5cdGlmICggLTEgPT09IGF1dG9zdGFydE5hbWVzcGFjZXMuaW5kZXhPZihjb25maWcubXcud2dOYW1lc3BhY2VOdW1iZXIpICkge1xyXG5cdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHR9XHJcblx0XHJcblx0aWYgKCAvKD86XFw/fCYpKD86YWN0aW9ufGRpZmZ8b2xkaWQpPS8udGVzdCh3aW5kb3cubG9jYXRpb24uaHJlZikgKSB7XHJcblx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgpO1xyXG5cdH1cclxuXHRcclxuXHQvLyBDaGVjayBpZiB0YWxrIHBhZ2UgZXhpc3RzXHJcblx0aWYgKCAkKFwiI2NhLXRhbGsubmV3XCIpLmxlbmd0aCApIHtcclxuXHRcdHJldHVybiBzZXR1cFJhdGVyKCk7XHJcblx0fVxyXG5cdFxyXG5cdHZhciB0aGlzUGFnZSA9IG13LlRpdGxlLm5ld0Zyb21UZXh0KGNvbmZpZy5tdy53Z1BhZ2VOYW1lKTtcclxuXHR2YXIgdGFsa1BhZ2UgPSB0aGlzUGFnZSAmJiB0aGlzUGFnZS5nZXRUYWxrUGFnZSgpO1xyXG5cdGlmICghdGFsa1BhZ2UpIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0fVxyXG5cclxuXHQvKiBDaGVjayB0ZW1wbGF0ZXMgcHJlc2VudCBvbiB0YWxrIHBhZ2UuIEZldGNoZXMgaW5kaXJlY3RseSB0cmFuc2NsdWRlZCB0ZW1wbGF0ZXMsIHNvIHdpbGwgZmluZFxyXG5cdFx0VGVtcGxhdGU6V1BCYW5uZXJNZXRhIChhbmQgaXRzIHN1YnRlbXBsYXRlcykuIEJ1dCBzb21lIGJhbm5lcnMgc3VjaCBhcyBNSUxISVNUIGRvbid0IHVzZSB0aGF0XHJcblx0XHRtZXRhIHRlbXBsYXRlLCBzbyB3ZSBhbHNvIGhhdmUgdG8gY2hlY2sgZm9yIHRlbXBsYXRlIHRpdGxlcyBjb250YWluZyAnV2lraVByb2plY3QnXHJcblx0Ki9cclxuXHRyZXR1cm4gQVBJLmdldCh7XHJcblx0XHRhY3Rpb246IFwicXVlcnlcIixcclxuXHRcdGZvcm1hdDogXCJqc29uXCIsXHJcblx0XHRwcm9wOiBcInRlbXBsYXRlc1wiLFxyXG5cdFx0dGl0bGVzOiB0YWxrUGFnZS5nZXRQcmVmaXhlZFRleHQoKSxcclxuXHRcdHRsbmFtZXNwYWNlOiBcIjEwXCIsXHJcblx0XHR0bGxpbWl0OiBcIjUwMFwiLFxyXG5cdFx0aW5kZXhwYWdlaWRzOiAxXHJcblx0fSlcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0XHR2YXIgaWQgPSByZXN1bHQucXVlcnkucGFnZWlkcztcclxuXHRcdFx0dmFyIHRlbXBsYXRlcyA9IHJlc3VsdC5xdWVyeS5wYWdlc1tpZF0udGVtcGxhdGVzO1xyXG5cdFx0XHJcblx0XHRcdGlmICggIXRlbXBsYXRlcyApIHtcclxuXHRcdFx0XHRyZXR1cm4gc2V0dXBSYXRlcigpO1xyXG5cdFx0XHR9XHJcblx0XHRcclxuXHRcdFx0dmFyIGhhc1dpa2lwcm9qZWN0ID0gdGVtcGxhdGVzLnNvbWUodGVtcGxhdGUgPT4gLyhXaWtpUHJvamVjdHxXUEJhbm5lcikvLnRlc3QodGVtcGxhdGUudGl0bGUpKTtcclxuXHRcdFxyXG5cdFx0XHRpZiAoICFoYXNXaWtpcHJvamVjdCApIHtcclxuXHRcdFx0XHRyZXR1cm4gc2V0dXBSYXRlcigpO1xyXG5cdFx0XHR9XHJcblx0XHRcclxuXHRcdH0sXHJcblx0XHRmdW5jdGlvbihjb2RlLCBqcXhocikge1xyXG5cdFx0Ly8gU2lsZW50bHkgaWdub3JlIGZhaWx1cmVzIChqdXN0IGxvZyB0byBjb25zb2xlKVxyXG5cdFx0XHRjb25zb2xlLndhcm4oXHJcblx0XHRcdFx0XCJbUmF0ZXJdIEVycm9yIHdoaWxlIGNoZWNraW5nIHdoZXRoZXIgdG8gYXV0b3N0YXJ0LlwiICtcclxuXHRcdFx0KCBjb2RlID09IG51bGwgKSA/IFwiXCIgOiBcIiBcIiArIG1ha2VFcnJvck1zZyhjb2RlLCBqcXhocilcclxuXHRcdFx0KTtcclxuXHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHRcdH0pO1xyXG5cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGF1dG9TdGFydDsiLCJpbXBvcnQge2lzQWZ0ZXJEYXRlfSBmcm9tIFwiLi91dGlsXCI7XHJcblxyXG4vKiogd3JpdGVcclxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxyXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdH0gdmFsXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBzdGFsZURheXMgTnVtYmVyIG9mIGRheXMgYWZ0ZXIgd2hpY2ggdGhlIGRhdGEgYmVjb21lcyBzdGFsZSAodXNhYmxlLCBidXQgc2hvdWxkXHJcbiAqICBiZSB1cGRhdGVkIGZvciBuZXh0IHRpbWUpLlxyXG4gKiBAcGFyYW0ge051bWJlcn0gZXhwaXJ5RGF5cyBOdW1iZXIgb2YgZGF5cyBhZnRlciB3aGljaCB0aGUgY2FjaGVkIGRhdGEgbWF5IGJlIGRlbGV0ZWQuXHJcbiAqL1xyXG52YXIgd3JpdGUgPSBmdW5jdGlvbihrZXksIHZhbCwgc3RhbGVEYXlzLCBleHBpcnlEYXlzKSB7XHJcblx0dHJ5IHtcclxuXHRcdHZhciBkZWZhdWx0U3RhbGVEYXlzID0gMTtcclxuXHRcdHZhciBkZWZhdWx0RXhwaXJ5RGF5cyA9IDMwO1xyXG5cdFx0dmFyIG1pbGxpc2Vjb25kc1BlckRheSA9IDI0KjYwKjYwKjEwMDA7XHJcblxyXG5cdFx0dmFyIHN0YWxlRHVyYXRpb24gPSAoc3RhbGVEYXlzIHx8IGRlZmF1bHRTdGFsZURheXMpKm1pbGxpc2Vjb25kc1BlckRheTtcclxuXHRcdHZhciBleHBpcnlEdXJhdGlvbiA9IChleHBpcnlEYXlzIHx8IGRlZmF1bHRFeHBpcnlEYXlzKSptaWxsaXNlY29uZHNQZXJEYXk7XHJcblx0XHRcclxuXHRcdHZhciBzdHJpbmdWYWwgPSBKU09OLnN0cmluZ2lmeSh7XHJcblx0XHRcdHZhbHVlOiB2YWwsXHJcblx0XHRcdHN0YWxlRGF0ZTogbmV3IERhdGUoRGF0ZS5ub3coKSArIHN0YWxlRHVyYXRpb24pLnRvSVNPU3RyaW5nKCksXHJcblx0XHRcdGV4cGlyeURhdGU6IG5ldyBEYXRlKERhdGUubm93KCkgKyBleHBpcnlEdXJhdGlvbikudG9JU09TdHJpbmcoKVxyXG5cdFx0fSk7XHJcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcIlJhdGVyLVwiK2tleSwgc3RyaW5nVmFsKTtcclxuXHR9ICBjYXRjaChlKSB7fSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWVtcHR5XHJcbn07XHJcbi8qKiByZWFkXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcclxuICogQHJldHVybnMge0FycmF5fE9iamVjdHxTdHJpbmd8TnVsbH0gQ2FjaGVkIGFycmF5IG9yIG9iamVjdCwgb3IgZW1wdHkgc3RyaW5nIGlmIG5vdCB5ZXQgY2FjaGVkLFxyXG4gKiAgICAgICAgICBvciBudWxsIGlmIHRoZXJlIHdhcyBlcnJvci5cclxuICovXHJcbnZhciByZWFkID0gZnVuY3Rpb24oa2V5KSB7XHJcblx0dmFyIHZhbDtcclxuXHR0cnkge1xyXG5cdFx0dmFyIHN0cmluZ1ZhbCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiUmF0ZXItXCIra2V5KTtcclxuXHRcdGlmICggc3RyaW5nVmFsICE9PSBcIlwiICkge1xyXG5cdFx0XHR2YWwgPSBKU09OLnBhcnNlKHN0cmluZ1ZhbCk7XHJcblx0XHR9XHJcblx0fSAgY2F0Y2goZSkge1xyXG5cdFx0Y29uc29sZS5sb2coXCJbUmF0ZXJdIGVycm9yIHJlYWRpbmcgXCIgKyBrZXkgKyBcIiBmcm9tIGxvY2FsU3RvcmFnZSBjYWNoZTpcIik7XHJcblx0XHRjb25zb2xlLmxvZyhcclxuXHRcdFx0XCJcXHRcIiArIGUubmFtZSArIFwiIG1lc3NhZ2U6IFwiICsgZS5tZXNzYWdlICtcclxuXHRcdFx0KCBlLmF0ID8gXCIgYXQ6IFwiICsgZS5hdCA6IFwiXCIpICtcclxuXHRcdFx0KCBlLnRleHQgPyBcIiB0ZXh0OiBcIiArIGUudGV4dCA6IFwiXCIpXHJcblx0XHQpO1xyXG5cdH1cclxuXHRyZXR1cm4gdmFsIHx8IG51bGw7XHJcbn07XHJcbnZhciBjbGVhckl0ZW1JZkludmFsaWQgPSBmdW5jdGlvbihrZXkpIHtcclxuXHR2YXIgaXNSYXRlcktleSA9IGtleS5pbmRleE9mKFwiUmF0ZXItXCIpID09PSAwO1xyXG5cdGlmICggIWlzUmF0ZXJLZXkgKSB7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdHZhciBpdGVtID0gcmVhZChrZXkucmVwbGFjZShcIlJhdGVyLVwiLFwiXCIpKTtcclxuXHR2YXIgaXNJbnZhbGlkID0gIWl0ZW0gfHwgIWl0ZW0uZXhwaXJ5RGF0ZSB8fCBpc0FmdGVyRGF0ZShpdGVtLmV4cGlyeURhdGUpO1xyXG5cdGlmICggaXNJbnZhbGlkICkge1xyXG5cdFx0bG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KTtcclxuXHR9XHJcbn07XHJcbnZhciBjbGVhckludmFsaWRJdGVtcyA9IGZ1bmN0aW9uKCkge1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgbG9jYWxTdG9yYWdlLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRzZXRUaW1lb3V0KGNsZWFySXRlbUlmSW52YWxpZCwgMTAwLCBsb2NhbFN0b3JhZ2Uua2V5KGkpKTtcclxuXHR9XHJcbn07XHJcblxyXG5leHBvcnQgeyB3cml0ZSwgcmVhZCwgY2xlYXJJdGVtSWZJbnZhbGlkLCBjbGVhckludmFsaWRJdGVtcyB9OyIsIi8vIEEgZ2xvYmFsIG9iamVjdCB0aGF0IHN0b3JlcyBhbGwgdGhlIHBhZ2UgYW5kIHVzZXIgY29uZmlndXJhdGlvbiBhbmQgc2V0dGluZ3NcclxudmFyIGNvbmZpZyA9IHt9O1xyXG4vLyBTY3JpcHQgaW5mb1xyXG5jb25maWcuc2NyaXB0ID0ge1xyXG5cdC8vIEFkdmVydCB0byBhcHBlbmQgdG8gZWRpdCBzdW1tYXJpZXNcclxuXHRhZHZlcnQ6ICBcIiAoW1tVc2VyOkV2YWQzNy9yYXRlci5qc3xSYXRlcl1dKVwiLFxyXG5cdHZlcnNpb246IFwiMi4wLjBcIlxyXG59O1xyXG4vLyBQcmVmZXJlbmNlczogZ2xvYmFscyB2YXJzIGFkZGVkIHRvIHVzZXJzJyBjb21tb24uanMsIG9yIHNldCB0byBkZWZhdWx0cyBpZiB1bmRlZmluZWRcclxuY29uZmlnLnByZWZzID0ge1xyXG5cdHdhdGNobGlzdDogd2luZG93LnJhdGVyX3dhdGNobGlzdCB8fCBcInByZWZlcmVuY2VzXCJcclxufTtcclxuLy8gTWVkaWFXaWtpIGNvbmZpZ3VyYXRpb24gdmFsdWVzXHJcbmNvbmZpZy5tdyA9IG13LmNvbmZpZy5nZXQoIFtcclxuXHRcInNraW5cIixcclxuXHRcIndnUGFnZU5hbWVcIixcclxuXHRcIndnTmFtZXNwYWNlTnVtYmVyXCIsXHJcblx0XCJ3Z1VzZXJOYW1lXCIsXHJcblx0XCJ3Z0Zvcm1hdHRlZE5hbWVzcGFjZXNcIixcclxuXHRcIndnTW9udGhOYW1lc1wiLFxyXG5cdFwid2dSZXZpc2lvbklkXCIsXHJcblx0XCJ3Z1NjcmlwdFBhdGhcIixcclxuXHRcIndnU2VydmVyXCIsXHJcblx0XCJ3Z0NhdGVnb3JpZXNcIixcclxuXHRcIndnSXNNYWluUGFnZVwiXHJcbl0gKTtcclxuXHJcbmNvbmZpZy5yZWdleCA9IHsgLyogZXNsaW50LWRpc2FibGUgbm8tdXNlbGVzcy1lc2NhcGUgKi9cclxuXHQvLyBQYXR0ZXJuIHRvIGZpbmQgdGVtcGxhdGVzLCB3aGljaCBtYXkgY29udGFpbiBvdGhlciB0ZW1wbGF0ZXNcclxuXHR0ZW1wbGF0ZTpcdFx0L1xce1xce1xccyooW14jXFx7XFxzXS4rPylcXHMqKFxcfCg/Oi58XFxuKSo/KD86KD86XFx7XFx7KD86LnxcXG4pKj8oPzooPzpcXHtcXHsoPzoufFxcbikqP1xcfVxcfSkoPzoufFxcbikqPykqP1xcfVxcfSkoPzoufFxcbikqPykqfClcXH1cXH1cXG4/L2csXHJcblx0Ly8gUGF0dGVybiB0byBmaW5kIGB8cGFyYW09dmFsdWVgIG9yIGB8dmFsdWVgLCB3aGVyZSBgdmFsdWVgIGNhbiBvbmx5IGNvbnRhaW4gYSBwaXBlXHJcblx0Ly8gaWYgd2l0aGluIHNxdWFyZSBicmFja2V0cyAoaS5lLiB3aWtpbGlua3MpIG9yIGJyYWNlcyAoaS5lLiB0ZW1wbGF0ZXMpXHJcblx0dGVtcGxhdGVQYXJhbXM6XHQvXFx8KD8hKD86W157XSt9fFteXFxbXStdKSkoPzoufFxccykqPyg/PSg/OlxcfHwkKSg/ISg/Oltee10rfXxbXlxcW10rXSkpKS9nXHJcbn07IC8qIGVzbGludC1lbmFibGUgbm8tdXNlbGVzcy1lc2NhcGUgKi9cclxuY29uZmlnLmRlZmVycmVkID0ge307XHJcbmNvbmZpZy5iYW5uZXJEZWZhdWx0cyA9IHtcclxuXHRjbGFzc2VzOiBbXHJcblx0XHRcIkZBXCIsXHJcblx0XHRcIkZMXCIsXHJcblx0XHRcIkFcIixcclxuXHRcdFwiR0FcIixcclxuXHRcdFwiQlwiLFxyXG5cdFx0XCJDXCIsXHJcblx0XHRcIlN0YXJ0XCIsXHJcblx0XHRcIlN0dWJcIixcclxuXHRcdFwiTGlzdFwiXHJcblx0XSxcclxuXHRpbXBvcnRhbmNlczogW1xyXG5cdFx0XCJUb3BcIixcclxuXHRcdFwiSGlnaFwiLFxyXG5cdFx0XCJNaWRcIixcclxuXHRcdFwiTG93XCJcclxuXHRdLFxyXG5cdGV4dGVuZGVkQ2xhc3NlczogW1xyXG5cdFx0XCJDYXRlZ29yeVwiLFxyXG5cdFx0XCJEcmFmdFwiLFxyXG5cdFx0XCJGaWxlXCIsXHJcblx0XHRcIlBvcnRhbFwiLFxyXG5cdFx0XCJQcm9qZWN0XCIsXHJcblx0XHRcIlRlbXBsYXRlXCIsXHJcblx0XHRcIkJwbHVzXCIsXHJcblx0XHRcIkZ1dHVyZVwiLFxyXG5cdFx0XCJDdXJyZW50XCIsXHJcblx0XHRcIkRpc2FtYmlnXCIsXHJcblx0XHRcIk5BXCIsXHJcblx0XHRcIlJlZGlyZWN0XCIsXHJcblx0XHRcIkJvb2tcIlxyXG5cdF0sXHJcblx0ZXh0ZW5kZWRJbXBvcnRhbmNlczogW1xyXG5cdFx0XCJUb3BcIixcclxuXHRcdFwiSGlnaFwiLFxyXG5cdFx0XCJNaWRcIixcclxuXHRcdFwiTG93XCIsXHJcblx0XHRcIkJvdHRvbVwiLFxyXG5cdFx0XCJOQVwiXHJcblx0XVxyXG59O1xyXG5jb25maWcuY3VzdG9tQ2xhc3NlcyA9IHtcclxuXHRcIldpa2lQcm9qZWN0IE1pbGl0YXJ5IGhpc3RvcnlcIjogW1xyXG5cdFx0XCJBTFwiLFxyXG5cdFx0XCJCTFwiLFxyXG5cdFx0XCJDTFwiXHJcblx0XSxcclxuXHRcIldpa2lQcm9qZWN0IFBvcnRhbHNcIjogW1xyXG5cdFx0XCJGUG9cIixcclxuXHRcdFwiQ29tcGxldGVcIixcclxuXHRcdFwiU3Vic3RhbnRpYWxcIixcclxuXHRcdFwiQmFzaWNcIixcclxuXHRcdFwiSW5jb21wbGV0ZVwiLFxyXG5cdFx0XCJNZXRhXCJcclxuXHRdXHJcbn07XHJcbmNvbmZpZy5zaGVsbFRlbXBsYXRlcyA9IFtcclxuXHRcIldpa2lQcm9qZWN0IGJhbm5lciBzaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3RCYW5uZXJzXCIsXHJcblx0XCJXaWtpUHJvamVjdCBCYW5uZXJzXCIsXHJcblx0XCJXUEJcIixcclxuXHRcIldQQlNcIixcclxuXHRcIldpa2lwcm9qZWN0YmFubmVyc2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0IEJhbm5lciBTaGVsbFwiLFxyXG5cdFwiV3BiXCIsXHJcblx0XCJXUEJhbm5lclNoZWxsXCIsXHJcblx0XCJXcGJzXCIsXHJcblx0XCJXaWtpcHJvamVjdGJhbm5lcnNcIixcclxuXHRcIldQIEJhbm5lciBTaGVsbFwiLFxyXG5cdFwiV1AgYmFubmVyIHNoZWxsXCIsXHJcblx0XCJCYW5uZXJzaGVsbFwiLFxyXG5cdFwiV2lraXByb2plY3QgYmFubmVyIHNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdCBCYW5uZXJzIFNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdEJhbm5lciBTaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3RCYW5uZXJTaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3QgQmFubmVyU2hlbGxcIixcclxuXHRcIldpa2lwcm9qZWN0QmFubmVyU2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0IGJhbm5lciBzaGVsbC9yZWRpcmVjdFwiLFxyXG5cdFwiV2lraVByb2plY3QgU2hlbGxcIixcclxuXHRcIkJhbm5lciBzaGVsbFwiLFxyXG5cdFwiU2NvcGUgc2hlbGxcIixcclxuXHRcIlByb2plY3Qgc2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0IGJhbm5lclwiXHJcbl07XHJcbmNvbmZpZy5kZWZhdWx0UGFyYW1ldGVyRGF0YSA9IHtcclxuXHRcImF1dG9cIjoge1xyXG5cdFx0XCJsYWJlbFwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJBdXRvLXJhdGVkXCJcclxuXHRcdH0sXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIkF1dG9tYXRpY2FsbHkgcmF0ZWQgYnkgYSBib3QuIEFsbG93ZWQgdmFsdWVzOiBbJ3llcyddLlwiXHJcblx0XHR9LFxyXG5cdFx0XCJhdXRvdmFsdWVcIjogXCJ5ZXNcIlxyXG5cdH0sXHJcblx0XCJsaXN0YXNcIjoge1xyXG5cdFx0XCJsYWJlbFwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJMaXN0IGFzXCJcclxuXHRcdH0sXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIlNvcnRrZXkgZm9yIHRhbGsgcGFnZVwiXHJcblx0XHR9XHJcblx0fSxcclxuXHRcInNtYWxsXCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiU21hbGw/XCIsXHJcblx0XHR9LFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJEaXNwbGF5IGEgc21hbGwgdmVyc2lvbi4gQWxsb3dlZCB2YWx1ZXM6IFsneWVzJ10uXCJcclxuXHRcdH0sXHJcblx0XHRcImF1dG92YWx1ZVwiOiBcInllc1wiXHJcblx0fSxcclxuXHRcImF0dGVudGlvblwiOiB7XHJcblx0XHRcImxhYmVsXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIkF0dGVudGlvbiByZXF1aXJlZD9cIixcclxuXHRcdH0sXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIkltbWVkaWF0ZSBhdHRlbnRpb24gcmVxdWlyZWQuIEFsbG93ZWQgdmFsdWVzOiBbJ3llcyddLlwiXHJcblx0XHR9LFxyXG5cdFx0XCJhdXRvdmFsdWVcIjogXCJ5ZXNcIlxyXG5cdH0sXHJcblx0XCJuZWVkcy1pbWFnZVwiOiB7XHJcblx0XHRcImxhYmVsXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIk5lZWRzIGltYWdlP1wiLFxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiUmVxdWVzdCB0aGF0IGFuIGltYWdlIG9yIHBob3RvZ3JhcGggb2YgdGhlIHN1YmplY3QgYmUgYWRkZWQgdG8gdGhlIGFydGljbGUuIEFsbG93ZWQgdmFsdWVzOiBbJ3llcyddLlwiXHJcblx0XHR9LFxyXG5cdFx0XCJhbGlhc2VzXCI6IFtcclxuXHRcdFx0XCJuZWVkcy1waG90b1wiXHJcblx0XHRdLFxyXG5cdFx0XCJhdXRvdmFsdWVcIjogXCJ5ZXNcIixcclxuXHRcdFwic3VnZ2VzdGVkXCI6IHRydWVcclxuXHR9LFxyXG5cdFwibmVlZHMtaW5mb2JveFwiOiB7XHJcblx0XHRcImxhYmVsXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIk5lZWRzIGluZm9ib3g/XCIsXHJcblx0XHR9LFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJSZXF1ZXN0IHRoYXQgYW4gaW5mb2JveCBiZSBhZGRlZCB0byB0aGUgYXJ0aWNsZS4gQWxsb3dlZCB2YWx1ZXM6IFsneWVzJ10uXCJcclxuXHRcdH0sXHJcblx0XHRcImFsaWFzZXNcIjogW1xyXG5cdFx0XHRcIm5lZWRzLXBob3RvXCJcclxuXHRcdF0sXHJcblx0XHRcImF1dG92YWx1ZVwiOiBcInllc1wiLFxyXG5cdFx0XCJzdWdnZXN0ZWRcIjogdHJ1ZVxyXG5cdH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNvbmZpZzsiLCIvLyBBdHRyaWJ1dGlvbjogRGlmZiBzdHlsZXMgZnJvbSA8aHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvV2lraXBlZGlhOkF1dG9XaWtpQnJvd3Nlci9zdHlsZS5jc3M+XHJcbnZhciBkaWZmU3R5bGVzID0gYHRhYmxlLmRpZmYsIHRkLmRpZmYtb3RpdGxlLCB0ZC5kaWZmLW50aXRsZSB7IGJhY2tncm91bmQtY29sb3I6IHdoaXRlOyB9XHJcbnRkLmRpZmYtb3RpdGxlLCB0ZC5kaWZmLW50aXRsZSB7IHRleHQtYWxpZ246IGNlbnRlcjsgfVxyXG50ZC5kaWZmLW1hcmtlciB7IHRleHQtYWxpZ246IHJpZ2h0OyBmb250LXdlaWdodDogYm9sZDsgZm9udC1zaXplOiAxLjI1ZW07IH1cclxudGQuZGlmZi1saW5lbm8geyBmb250LXdlaWdodDogYm9sZDsgfVxyXG50ZC5kaWZmLWFkZGVkbGluZSwgdGQuZGlmZi1kZWxldGVkbGluZSwgdGQuZGlmZi1jb250ZXh0IHsgZm9udC1zaXplOiA4OCU7IHZlcnRpY2FsLWFsaWduOiB0b3A7IHdoaXRlLXNwYWNlOiAtbW96LXByZS13cmFwOyB3aGl0ZS1zcGFjZTogcHJlLXdyYXA7IH1cclxudGQuZGlmZi1hZGRlZGxpbmUsIHRkLmRpZmYtZGVsZXRlZGxpbmUgeyBib3JkZXItc3R5bGU6IHNvbGlkOyBib3JkZXItd2lkdGg6IDFweCAxcHggMXB4IDRweDsgYm9yZGVyLXJhZGl1czogMC4zM2VtOyB9XHJcbnRkLmRpZmYtYWRkZWRsaW5lIHsgYm9yZGVyLWNvbG9yOiAjYTNkM2ZmOyB9XHJcbnRkLmRpZmYtZGVsZXRlZGxpbmUgeyBib3JkZXItY29sb3I6ICNmZmU0OWM7IH1cclxudGQuZGlmZi1jb250ZXh0IHsgYmFja2dyb3VuZDogI2YzZjNmMzsgY29sb3I6ICMzMzMzMzM7IGJvcmRlci1zdHlsZTogc29saWQ7IGJvcmRlci13aWR0aDogMXB4IDFweCAxcHggNHB4OyBib3JkZXItY29sb3I6ICNlNmU2ZTY7IGJvcmRlci1yYWRpdXM6IDAuMzNlbTsgfVxyXG4uZGlmZmNoYW5nZSB7IGZvbnQtd2VpZ2h0OiBib2xkOyB0ZXh0LWRlY29yYXRpb246IG5vbmU7IH1cclxudGFibGUuZGlmZiB7XHJcbiAgICBib3JkZXI6IG5vbmU7XHJcbiAgICB3aWR0aDogOTglOyBib3JkZXItc3BhY2luZzogNHB4O1xyXG4gICAgdGFibGUtbGF5b3V0OiBmaXhlZDsgLyogRW5zdXJlcyB0aGF0IGNvbHVtcyBhcmUgb2YgZXF1YWwgd2lkdGggKi9cclxufVxyXG50ZC5kaWZmLWFkZGVkbGluZSAuZGlmZmNoYW5nZSwgdGQuZGlmZi1kZWxldGVkbGluZSAuZGlmZmNoYW5nZSB7IGJvcmRlci1yYWRpdXM6IDAuMzNlbTsgcGFkZGluZzogMC4yNWVtIDA7IH1cclxudGQuZGlmZi1hZGRlZGxpbmUgLmRpZmZjaGFuZ2Uge1x0YmFja2dyb3VuZDogI2Q4ZWNmZjsgfVxyXG50ZC5kaWZmLWRlbGV0ZWRsaW5lIC5kaWZmY2hhbmdlIHsgYmFja2dyb3VuZDogI2ZlZWVjODsgfVxyXG50YWJsZS5kaWZmIHRkIHtcdHBhZGRpbmc6IDAuMzNlbSAwLjY2ZW07IH1cclxudGFibGUuZGlmZiBjb2wuZGlmZi1tYXJrZXIgeyB3aWR0aDogMiU7IH1cclxudGFibGUuZGlmZiBjb2wuZGlmZi1jb250ZW50IHsgd2lkdGg6IDQ4JTsgfVxyXG50YWJsZS5kaWZmIHRkIGRpdiB7XHJcbiAgICAvKiBGb3JjZS13cmFwIHZlcnkgbG9uZyBsaW5lcyBzdWNoIGFzIFVSTHMgb3IgcGFnZS13aWRlbmluZyBjaGFyIHN0cmluZ3MuICovXHJcbiAgICB3b3JkLXdyYXA6IGJyZWFrLXdvcmQ7XHJcbiAgICAvKiBBcyBmYWxsYmFjayAoRkY8My41LCBPcGVyYSA8MTAuNSksIHNjcm9sbGJhcnMgd2lsbCBiZSBhZGRlZCBmb3IgdmVyeSB3aWRlIGNlbGxzXHJcbiAgICAgICAgaW5zdGVhZCBvZiB0ZXh0IG92ZXJmbG93aW5nIG9yIHdpZGVuaW5nICovXHJcbiAgICBvdmVyZmxvdzogYXV0bztcclxufWA7XHJcblxyXG5leHBvcnQgeyBkaWZmU3R5bGVzIH07IiwiaW1wb3J0IHtBUEksIGlzQWZ0ZXJEYXRlLCBtYWtlRXJyb3JNc2d9IGZyb20gXCIuL3V0aWxcIjtcclxuaW1wb3J0ICogYXMgY2FjaGUgZnJvbSBcIi4vY2FjaGVcIjtcclxuXHJcbnZhciBjYWNoZUJhbm5lcnMgPSBmdW5jdGlvbihiYW5uZXJzLCBiYW5uZXJPcHRpb25zKSB7XHJcblx0Y2FjaGUud3JpdGUoXCJiYW5uZXJzXCIsIGJhbm5lcnMsIDIsIDYwKTtcclxuXHRjYWNoZS53cml0ZShcImJhbm5lck9wdGlvbnNcIiwgYmFubmVyT3B0aW9ucywgMiwgNjApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYmFubmVycy9vcHRpb25zIGZyb20gdGhlIEFwaVxyXG4gKiBcclxuICogQHJldHVybnMge1Byb21pc2V9IFJlc29sdmVkIHdpdGg6IGJhbm5lcnMgb2JqZWN0LCBiYW5uZXJPcHRpb25zIGFycmF5XHJcbiAqL1xyXG52YXIgZ2V0TGlzdE9mQmFubmVyc0Zyb21BcGkgPSBmdW5jdGlvbigpIHtcclxuXHJcblx0dmFyIGZpbmlzaGVkUHJvbWlzZSA9ICQuRGVmZXJyZWQoKTtcclxuXHJcblx0dmFyIHF1ZXJ5U2tlbGV0b24gPSB7XHJcblx0XHRhY3Rpb246IFwicXVlcnlcIixcclxuXHRcdGZvcm1hdDogXCJqc29uXCIsXHJcblx0XHRsaXN0OiBcImNhdGVnb3J5bWVtYmVyc1wiLFxyXG5cdFx0Y21wcm9wOiBcInRpdGxlXCIsXHJcblx0XHRjbW5hbWVzcGFjZTogXCIxMFwiLFxyXG5cdFx0Y21saW1pdDogXCI1MDBcIlxyXG5cdH07XHJcblxyXG5cdHZhciBjYXRlZ29yaWVzID0gW1xyXG5cdFx0e1xyXG5cdFx0XHR0aXRsZTpcIiBDYXRlZ29yeTpXaWtpUHJvamVjdCBiYW5uZXJzIHdpdGggcXVhbGl0eSBhc3Nlc3NtZW50XCIsXHJcblx0XHRcdGFiYnJldmlhdGlvbjogXCJ3aXRoUmF0aW5nc1wiLFxyXG5cdFx0XHRiYW5uZXJzOiBbXSxcclxuXHRcdFx0cHJvY2Vzc2VkOiAkLkRlZmVycmVkKClcclxuXHRcdH0sXHJcblx0XHR7XHJcblx0XHRcdHRpdGxlOiBcIkNhdGVnb3J5Oldpa2lQcm9qZWN0IGJhbm5lcnMgd2l0aG91dCBxdWFsaXR5IGFzc2Vzc21lbnRcIixcclxuXHRcdFx0YWJicmV2aWF0aW9uOiBcIndpdGhvdXRSYXRpbmdzXCIsXHJcblx0XHRcdGJhbm5lcnM6IFtdLFxyXG5cdFx0XHRwcm9jZXNzZWQ6ICQuRGVmZXJyZWQoKVxyXG5cdFx0fSxcclxuXHRcdHtcclxuXHRcdFx0dGl0bGU6IFwiQ2F0ZWdvcnk6V2lraVByb2plY3QgYmFubmVyIHdyYXBwZXIgdGVtcGxhdGVzXCIsXHJcblx0XHRcdGFiYnJldmlhdGlvbjogXCJ3cmFwcGVyc1wiLFxyXG5cdFx0XHRiYW5uZXJzOiBbXSxcclxuXHRcdFx0cHJvY2Vzc2VkOiAkLkRlZmVycmVkKClcclxuXHRcdH1cclxuXHRdO1xyXG5cclxuXHR2YXIgcHJvY2Vzc1F1ZXJ5ID0gZnVuY3Rpb24ocmVzdWx0LCBjYXRJbmRleCkge1xyXG5cdFx0aWYgKCAhcmVzdWx0LnF1ZXJ5IHx8ICFyZXN1bHQucXVlcnkuY2F0ZWdvcnltZW1iZXJzICkge1xyXG5cdFx0XHQvLyBObyByZXN1bHRzXHJcblx0XHRcdC8vIFRPRE86IGVycm9yIG9yIHdhcm5pbmcgKioqKioqKipcclxuXHRcdFx0ZmluaXNoZWRQcm9taXNlLnJlamVjdCgpO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdC8vIEdhdGhlciB0aXRsZXMgaW50byBhcnJheSAtIGV4Y2x1ZGluZyBcIlRlbXBsYXRlOlwiIHByZWZpeFxyXG5cdFx0dmFyIHJlc3VsdFRpdGxlcyA9IHJlc3VsdC5xdWVyeS5jYXRlZ29yeW1lbWJlcnMubWFwKGZ1bmN0aW9uKGluZm8pIHtcclxuXHRcdFx0cmV0dXJuIGluZm8udGl0bGUuc2xpY2UoOSk7XHJcblx0XHR9KTtcclxuXHRcdEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGNhdGVnb3JpZXNbY2F0SW5kZXhdLmJhbm5lcnMsIHJlc3VsdFRpdGxlcyk7XHJcblx0XHRcclxuXHRcdC8vIENvbnRpbnVlIHF1ZXJ5IGlmIG5lZWRlZFxyXG5cdFx0aWYgKCByZXN1bHQuY29udGludWUgKSB7XHJcblx0XHRcdGRvQXBpUXVlcnkoJC5leHRlbmQoY2F0ZWdvcmllc1tjYXRJbmRleF0ucXVlcnksIHJlc3VsdC5jb250aW51ZSksIGNhdEluZGV4KTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRjYXRlZ29yaWVzW2NhdEluZGV4XS5wcm9jZXNzZWQucmVzb2x2ZSgpO1xyXG5cdH07XHJcblxyXG5cdHZhciBkb0FwaVF1ZXJ5ID0gZnVuY3Rpb24ocSwgY2F0SW5kZXgpIHtcclxuXHRcdEFQSS5nZXQoIHEgKVxyXG5cdFx0XHQuZG9uZSggZnVuY3Rpb24ocmVzdWx0KSB7XHJcblx0XHRcdFx0cHJvY2Vzc1F1ZXJ5KHJlc3VsdCwgY2F0SW5kZXgpO1xyXG5cdFx0XHR9IClcclxuXHRcdFx0LmZhaWwoIGZ1bmN0aW9uKGNvZGUsIGpxeGhyKSB7XHJcblx0XHRcdFx0Y29uc29sZS53YXJuKFwiW1JhdGVyXSBcIiArIG1ha2VFcnJvck1zZyhjb2RlLCBqcXhociwgXCJDb3VsZCBub3QgcmV0cmlldmUgcGFnZXMgZnJvbSBbWzpcIiArIHEuY210aXRsZSArIFwiXV1cIikpO1xyXG5cdFx0XHRcdGZpbmlzaGVkUHJvbWlzZS5yZWplY3QoKTtcclxuXHRcdFx0fSApO1xyXG5cdH07XHJcblx0XHJcblx0Y2F0ZWdvcmllcy5mb3JFYWNoKGZ1bmN0aW9uKGNhdCwgaW5kZXgsIGFycikge1xyXG5cdFx0Y2F0LnF1ZXJ5ID0gJC5leHRlbmQoIHsgXCJjbXRpdGxlXCI6Y2F0LnRpdGxlIH0sIHF1ZXJ5U2tlbGV0b24gKTtcclxuXHRcdCQud2hlbiggYXJyW2luZGV4LTFdICYmIGFycltpbmRleC0xXS5wcm9jZXNzZWQgfHwgdHJ1ZSApLnRoZW4oZnVuY3Rpb24oKXtcclxuXHRcdFx0ZG9BcGlRdWVyeShjYXQucXVlcnksIGluZGV4KTtcclxuXHRcdH0pO1xyXG5cdH0pO1xyXG5cdFxyXG5cdGNhdGVnb3JpZXNbY2F0ZWdvcmllcy5sZW5ndGgtMV0ucHJvY2Vzc2VkLnRoZW4oZnVuY3Rpb24oKXtcclxuXHRcdHZhciBiYW5uZXJzID0ge307XHJcblx0XHR2YXIgc3Rhc2hCYW5uZXIgPSBmdW5jdGlvbihjYXRPYmplY3QpIHtcclxuXHRcdFx0YmFubmVyc1tjYXRPYmplY3QuYWJicmV2aWF0aW9uXSA9IGNhdE9iamVjdC5iYW5uZXJzO1xyXG5cdFx0fTtcclxuXHRcdHZhciBtZXJnZUJhbm5lcnMgPSBmdW5jdGlvbihtZXJnZUludG9UaGlzQXJyYXksIGNhdE9iamVjdCkge1xyXG5cdFx0XHRyZXR1cm4gJC5tZXJnZShtZXJnZUludG9UaGlzQXJyYXksIGNhdE9iamVjdC5iYW5uZXJzKTtcclxuXHRcdH07XHJcblx0XHR2YXIgbWFrZU9wdGlvbiA9IGZ1bmN0aW9uKGJhbm5lck5hbWUpIHtcclxuXHRcdFx0dmFyIGlzV3JhcHBlciA9ICggLTEgIT09ICQuaW5BcnJheShiYW5uZXJOYW1lLCBjYXRlZ29yaWVzWzJdLmJhbm5lcnMpICk7XHJcblx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0ZGF0YTogICggaXNXcmFwcGVyID8gXCJzdWJzdDpcIiA6IFwiXCIpICsgYmFubmVyTmFtZSxcclxuXHRcdFx0XHRsYWJlbDogYmFubmVyTmFtZS5yZXBsYWNlKFwiV2lraVByb2plY3QgXCIsIFwiXCIpICsgKCBpc1dyYXBwZXIgPyBcIiBbdGVtcGxhdGUgd3JhcHBlcl1cIiA6IFwiXCIpXHJcblx0XHRcdH07XHJcblx0XHR9O1xyXG5cdFx0Y2F0ZWdvcmllcy5mb3JFYWNoKHN0YXNoQmFubmVyKTtcclxuXHRcdFxyXG5cdFx0dmFyIGJhbm5lck9wdGlvbnMgPSBjYXRlZ29yaWVzLnJlZHVjZShtZXJnZUJhbm5lcnMsIFtdKS5tYXAobWFrZU9wdGlvbik7XHJcblx0XHRcclxuXHRcdGZpbmlzaGVkUHJvbWlzZS5yZXNvbHZlKGJhbm5lcnMsIGJhbm5lck9wdGlvbnMpO1xyXG5cdH0pO1xyXG5cdFxyXG5cdHJldHVybiBmaW5pc2hlZFByb21pc2U7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyBiYW5uZXJzL29wdGlvbnMgZnJvbSBjYWNoZSwgaWYgdGhlcmUgYW5kIG5vdCB0b28gb2xkXHJcbiAqIFxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gUmVzb2x2ZWQgd2l0aDogYmFubmVycyBvYmplY3QsIGJhbm5lck9wdGlvbnMgb2JqZWN0XHJcbiAqL1xyXG52YXIgZ2V0QmFubmVyc0Zyb21DYWNoZSA9IGZ1bmN0aW9uKCkge1xyXG5cdHZhciBjYWNoZWRCYW5uZXJzID0gY2FjaGUucmVhZChcImJhbm5lcnNcIik7XHJcblx0dmFyIGNhY2hlZEJhbm5lck9wdGlvbnMgPSBjYWNoZS5yZWFkKFwiYmFubmVyT3B0aW9uc1wiKTtcclxuXHRpZiAoXHJcblx0XHQhY2FjaGVkQmFubmVycyB8fFxyXG5cdFx0IWNhY2hlZEJhbm5lcnMudmFsdWUgfHwgIWNhY2hlZEJhbm5lcnMuc3RhbGVEYXRlIHx8XHJcblx0XHQhY2FjaGVkQmFubmVyT3B0aW9ucyB8fFxyXG5cdFx0IWNhY2hlZEJhbm5lck9wdGlvbnMudmFsdWUgfHwgIWNhY2hlZEJhbm5lck9wdGlvbnMuc3RhbGVEYXRlXHJcblx0KSB7XHJcblx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgpO1xyXG5cdH1cclxuXHRpZiAoIGlzQWZ0ZXJEYXRlKGNhY2hlZEJhbm5lcnMuc3RhbGVEYXRlKSB8fCBpc0FmdGVyRGF0ZShjYWNoZWRCYW5uZXJPcHRpb25zLnN0YWxlRGF0ZSkgKSB7XHJcblx0XHQvLyBVcGRhdGUgaW4gdGhlIGJhY2tncm91bmQ7IHN0aWxsIHVzZSBvbGQgbGlzdCB1bnRpbCB0aGVuICBcclxuXHRcdGdldExpc3RPZkJhbm5lcnNGcm9tQXBpKCkudGhlbihjYWNoZUJhbm5lcnMpO1xyXG5cdH1cclxuXHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlc29sdmUoY2FjaGVkQmFubmVycy52YWx1ZSwgY2FjaGVkQmFubmVyT3B0aW9ucy52YWx1ZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyBiYW5uZXJzL29wdGlvbnMgZnJvbSBjYWNoZSBvciBBUEkuXHJcbiAqIEhhcyBzaWRlIGFmZmVjdCBvZiBhZGRpbmcvdXBkYXRpbmcvY2xlYXJpbmcgY2FjaGUuXHJcbiAqIFxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxPYmplY3QsIEFycmF5Pn0gYmFubmVycyBvYmplY3QsIGJhbm5lck9wdGlvbnMgb2JqZWN0XHJcbiAqL1xyXG52YXIgZ2V0QmFubmVycyA9ICgpID0+IGdldEJhbm5lcnNGcm9tQ2FjaGUoKS50aGVuKFxyXG5cdC8vIFN1Y2Nlc3M6IHBhc3MgdGhyb3VnaFxyXG5cdChiYW5uZXJzLCBvcHRpb25zKSA9PiAkLkRlZmVycmVkKCkucmVzb2x2ZShiYW5uZXJzLCBvcHRpb25zKSxcclxuXHQvLyBGYWlsdXJlOiBnZXQgZnJvbSBBcGksIHRoZW4gY2FjaGUgdGhlbVxyXG5cdCgpID0+IHtcclxuXHRcdHZhciBiYW5uZXJzUHJvbWlzZSA9IGdldExpc3RPZkJhbm5lcnNGcm9tQXBpKCk7XHJcblx0XHRiYW5uZXJzUHJvbWlzZS50aGVuKGNhY2hlQmFubmVycyk7XHJcblx0XHRyZXR1cm4gYmFubmVyc1Byb21pc2U7XHJcblx0fVxyXG4pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ2V0QmFubmVyczsiLCJpbXBvcnQgY29uZmlnIGZyb20gXCIuL2NvbmZpZ1wiO1xyXG5pbXBvcnQge0FQSX0gZnJvbSBcIi4vdXRpbFwiO1xyXG5pbXBvcnQgeyBwYXJzZVRlbXBsYXRlcywgZ2V0V2l0aFJlZGlyZWN0VG8gfSBmcm9tIFwiLi9UZW1wbGF0ZVwiO1xyXG5pbXBvcnQgZ2V0QmFubmVycyBmcm9tIFwiLi9nZXRCYW5uZXJzXCI7XHJcbmltcG9ydCAqIGFzIGNhY2hlIGZyb20gXCIuL2NhY2hlXCI7XHJcbmltcG9ydCB3aW5kb3dNYW5hZ2VyIGZyb20gXCIuL3dpbmRvd01hbmFnZXJcIjtcclxuXHJcbnZhciBzZXR1cFJhdGVyID0gZnVuY3Rpb24oY2xpY2tFdmVudCkge1xyXG5cdGlmICggY2xpY2tFdmVudCApIHtcclxuXHRcdGNsaWNrRXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHR9XHJcblxyXG5cdHZhciBzZXR1cENvbXBsZXRlZFByb21pc2UgPSAkLkRlZmVycmVkKCk7XHJcbiAgICBcclxuXHR2YXIgY3VycmVudFBhZ2UgPSBtdy5UaXRsZS5uZXdGcm9tVGV4dChjb25maWcubXcud2dQYWdlTmFtZSk7XHJcblx0dmFyIHRhbGtQYWdlID0gY3VycmVudFBhZ2UgJiYgY3VycmVudFBhZ2UuZ2V0VGFsa1BhZ2UoKTtcclxuXHR2YXIgc3ViamVjdFBhZ2UgPSBjdXJyZW50UGFnZSAmJiBjdXJyZW50UGFnZS5nZXRTdWJqZWN0UGFnZSgpO1xyXG4gXHJcblx0Ly8gR2V0IGxpc3RzIG9mIGFsbCBiYW5uZXJzICh0YXNrIDEpXHJcblx0dmFyIGJhbm5lcnNQcm9taXNlID0gZ2V0QmFubmVycygpO1xyXG5cclxuXHQvLyBMb2FkIHRhbGsgcGFnZSAodGFzayAyKVxyXG5cdHZhciBsb2FkVGFsa1Byb21pc2UgPSBBUEkuZ2V0KCB7XHJcblx0XHRhY3Rpb246IFwicXVlcnlcIixcclxuXHRcdHByb3A6IFwicmV2aXNpb25zXCIsXHJcblx0XHRydnByb3A6IFwiY29udGVudFwiLFxyXG5cdFx0cnZzZWN0aW9uOiBcIjBcIixcclxuXHRcdHRpdGxlczogdGFsa1BhZ2UuZ2V0UHJlZml4ZWRUZXh0KCksXHJcblx0XHRpbmRleHBhZ2VpZHM6IDFcclxuXHR9ICkudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XHJcblx0XHR2YXIgaWQgPSByZXN1bHQucXVlcnkucGFnZWlkcztcdFx0XHJcblx0XHR2YXIgd2lraXRleHQgPSAoIGlkIDwgMCApID8gXCJcIiA6IHJlc3VsdC5xdWVyeS5wYWdlc1tpZF0ucmV2aXNpb25zWzBdW1wiKlwiXTtcclxuXHRcdHJldHVybiB3aWtpdGV4dDtcclxuXHR9KTtcclxuXHJcblx0Ly8gUGFyc2UgdGFsayBwYWdlIGZvciBiYW5uZXJzICh0YXNrIDMpXHJcblx0dmFyIHBhcnNlVGFsa1Byb21pc2UgPSBsb2FkVGFsa1Byb21pc2UudGhlbih3aWtpdGV4dCA9PiBwYXJzZVRlbXBsYXRlcyh3aWtpdGV4dCwgdHJ1ZSkpIC8vIEdldCBhbGwgdGVtcGxhdGVzXHJcblx0XHQudGhlbih0ZW1wbGF0ZXMgPT4gZ2V0V2l0aFJlZGlyZWN0VG8odGVtcGxhdGVzKSkgLy8gQ2hlY2sgZm9yIHJlZGlyZWN0c1xyXG5cdFx0LnRoZW4odGVtcGxhdGVzID0+IHtcclxuXHRcdFx0cmV0dXJuIGJhbm5lcnNQcm9taXNlLnRoZW4oKGFsbEJhbm5lcnMpID0+IHsgLy8gR2V0IGxpc3Qgb2YgYWxsIGJhbm5lciB0ZW1wbGF0ZXNcclxuXHRcdFx0XHRyZXR1cm4gdGVtcGxhdGVzLmZpbHRlcih0ZW1wbGF0ZSA9PiB7IC8vIEZpbHRlciBvdXQgbm9uLWJhbm5lcnNcclxuXHRcdFx0XHRcdHZhciBtYWluVGV4dCA9IHRlbXBsYXRlLnJlZGlyZWN0VG9cclxuXHRcdFx0XHRcdFx0PyB0ZW1wbGF0ZS5yZWRpcmVjdFRvLmdldE1haW5UZXh0KClcclxuXHRcdFx0XHRcdFx0OiB0ZW1wbGF0ZS5nZXRUaXRsZSgpLmdldE1haW5UZXh0KCk7XHJcblx0XHRcdFx0XHRyZXR1cm4gYWxsQmFubmVycy53aXRoUmF0aW5ncy5pbmNsdWRlcyhtYWluVGV4dCkgfHwgXHJcbiAgICAgICAgICAgICAgICAgICAgYWxsQmFubmVycy53aXRob3V0UmF0aW5ncy5pbmNsdWRlcyhtYWluVGV4dCkgfHxcclxuICAgICAgICAgICAgICAgICAgICBhbGxCYW5uZXJzLndyYXBwZXJzLmluY2x1ZGVzKG1haW5UZXh0KTtcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0Lm1hcChmdW5jdGlvbih0ZW1wbGF0ZSkgeyAvLyBTZXQgd3JhcHBlciB0YXJnZXQgaWYgbmVlZGVkXHJcblx0XHRcdFx0XHRcdHZhciBtYWluVGV4dCA9IHRlbXBsYXRlLnJlZGlyZWN0VG9cclxuXHRcdFx0XHRcdFx0XHQ/IHRlbXBsYXRlLnJlZGlyZWN0VG8uZ2V0TWFpblRleHQoKVxyXG5cdFx0XHRcdFx0XHRcdDogdGVtcGxhdGUuZ2V0VGl0bGUoKS5nZXRNYWluVGV4dCgpO1xyXG5cdFx0XHRcdFx0XHRpZiAoYWxsQmFubmVycy53cmFwcGVycy5pbmNsdWRlcyhtYWluVGV4dCkpIHtcclxuXHRcdFx0XHRcdFx0XHR0ZW1wbGF0ZS5yZWRpcmVjdHNUbyA9IG13LlRpdGxlLm5ld0Zyb21UZXh0KFwiVGVtcGxhdGU6U3Vic3Q6XCIgKyBtYWluVGV4dCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0cmV0dXJuIHRlbXBsYXRlO1xyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fSk7XHJcblxyXG5cdC8vIFJldHJpZXZlIGFuZCBzdG9yZSBUZW1wbGF0ZURhdGEgKHRhc2sgNClcclxuXHR2YXIgdGVtcGxhdGVEYXRhUHJvbWlzZSA9IHBhcnNlVGFsa1Byb21pc2UudGhlbih0ZW1wbGF0ZXMgPT4ge1xyXG5cdFx0dGVtcGxhdGVzLmZvckVhY2godGVtcGxhdGUgPT4gdGVtcGxhdGUuc2V0UGFyYW1EYXRhQW5kU3VnZ2VzdGlvbnMoKSk7XHJcblx0XHRyZXR1cm4gdGVtcGxhdGVzO1xyXG5cdH0pO1xyXG5cclxuXHQvLyBDaGVjayBpZiBwYWdlIGlzIGEgcmVkaXJlY3QgKHRhc2sgNSkgLSBidXQgZG9uJ3QgZXJyb3Igb3V0IGlmIHJlcXVlc3QgZmFpbHNcclxuXHR2YXIgcmVkaXJlY3RDaGVja1Byb21pc2UgPSBBUEkuZ2V0UmF3KHN1YmplY3RQYWdlLmdldFByZWZpeGVkVGV4dCgpKVxyXG5cdFx0LnRoZW4oXHJcblx0XHRcdC8vIFN1Y2Nlc3NcclxuXHRcdFx0ZnVuY3Rpb24ocmF3UGFnZSkgeyBcclxuXHRcdFx0XHRpZiAoIC9eXFxzKiNSRURJUkVDVC9pLnRlc3QocmF3UGFnZSkgKSB7XHJcblx0XHRcdFx0XHQvLyBnZXQgcmVkaXJlY3Rpb24gdGFyZ2V0LCBvciBib29sZWFuIHRydWVcclxuXHRcdFx0XHRcdHJldHVybiByYXdQYWdlLnNsaWNlKHJhd1BhZ2UuaW5kZXhPZihcIltbXCIpKzIsIHJhd1BhZ2UuaW5kZXhPZihcIl1dXCIpKSB8fCB0cnVlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH0sXHJcblx0XHRcdC8vIEZhaWx1cmUgKGlnbm9yZWQpXHJcblx0XHRcdGZ1bmN0aW9uKCkgeyByZXR1cm4gbnVsbDsgfVxyXG5cdFx0KTtcclxuXHJcblx0Ly8gUmV0cmlldmUgcmF0aW5nIGZyb20gT1JFUyAodGFzayA2LCBvbmx5IG5lZWRlZCBmb3IgYXJ0aWNsZXMpXHJcblx0dmFyIHNob3VsZEdldE9yZXMgPSAoIGNvbmZpZy5tdy53Z05hbWVzcGFjZU51bWJlciA8PSAxICk7XHJcblx0aWYgKCBzaG91bGRHZXRPcmVzICkge1xyXG5cdFx0dmFyIGxhdGVzdFJldklkUHJvbWlzZSA9IGN1cnJlbnRQYWdlLmlzVGFsa1BhZ2UoKVxyXG5cdFx0XHQ/ICQuRGVmZXJyZWQoKS5yZXNvbHZlKGNvbmZpZy5tdy53Z1JldmlzaW9uSWQpXHJcblx0XHRcdDogXHRBUEkuZ2V0KCB7XHJcblx0XHRcdFx0YWN0aW9uOiBcInF1ZXJ5XCIsXHJcblx0XHRcdFx0Zm9ybWF0OiBcImpzb25cIixcclxuXHRcdFx0XHRwcm9wOiBcInJldmlzaW9uc1wiLFxyXG5cdFx0XHRcdHRpdGxlczogc3ViamVjdFBhZ2UuZ2V0UHJlZml4ZWRUZXh0KCksXHJcblx0XHRcdFx0cnZwcm9wOiBcImlkc1wiLFxyXG5cdFx0XHRcdGluZGV4cGFnZWlkczogMVxyXG5cdFx0XHR9ICkudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcclxuXHRcdFx0XHRpZiAocmVzdWx0LnF1ZXJ5LnJlZGlyZWN0cykge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR2YXIgaWQgPSByZXN1bHQucXVlcnkucGFnZWlkcztcclxuXHRcdFx0XHR2YXIgcGFnZSA9IHJlc3VsdC5xdWVyeS5wYWdlc1tpZF07XHJcblx0XHRcdFx0aWYgKHBhZ2UubWlzc2luZyA9PT0gXCJcIikge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoIGlkIDwgMCApIHtcclxuXHRcdFx0XHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBwYWdlLnJldmlzaW9uc1swXS5yZXZpZDtcclxuXHRcdFx0fSk7XHJcblx0XHR2YXIgb3Jlc1Byb21pc2UgPSBsYXRlc3RSZXZJZFByb21pc2UudGhlbihmdW5jdGlvbihsYXRlc3RSZXZJZCkge1xyXG5cdFx0XHRpZiAoIWxhdGVzdFJldklkKSB7XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBBUEkuZ2V0T1JFUyhsYXRlc3RSZXZJZClcclxuXHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcclxuXHRcdFx0XHRcdHZhciBkYXRhID0gcmVzdWx0LmVud2lraS5zY29yZXNbbGF0ZXN0UmV2SWRdLndwMTA7XHJcblx0XHRcdFx0XHRpZiAoIGRhdGEuZXJyb3IgKSB7XHJcblx0XHRcdFx0XHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KGRhdGEuZXJyb3IudHlwZSwgZGF0YS5lcnJvci5tZXNzYWdlKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHJldHVybiBkYXRhLnNjb3JlLnByZWRpY3Rpb247XHJcblx0XHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdC8vIE9wZW4gdGhlIGxvYWQgZGlhbG9nXHJcblx0dmFyIGlzT3BlbmVkUHJvbWlzZSA9ICQuRGVmZXJyZWQoKTtcclxuXHR2YXIgbG9hZERpYWxvZ1dpbiA9IHdpbmRvd01hbmFnZXIub3BlbldpbmRvdyhcImxvYWREaWFsb2dcIiwge1xyXG5cdFx0cHJvbWlzZXM6IFtcclxuXHRcdFx0YmFubmVyc1Byb21pc2UsXHJcblx0XHRcdGxvYWRUYWxrUHJvbWlzZSxcclxuXHRcdFx0cGFyc2VUYWxrUHJvbWlzZSxcclxuXHRcdFx0dGVtcGxhdGVEYXRhUHJvbWlzZSxcclxuXHRcdFx0cmVkaXJlY3RDaGVja1Byb21pc2UsXHJcblx0XHRcdHNob3VsZEdldE9yZXMgJiYgb3Jlc1Byb21pc2VcclxuXHRcdF0sXHJcblx0XHRvcmVzOiBzaG91bGRHZXRPcmVzLFxyXG5cdFx0aXNPcGVuZWQ6IGlzT3BlbmVkUHJvbWlzZVxyXG5cdH0pO1xyXG5cclxuXHRsb2FkRGlhbG9nV2luLm9wZW5lZC50aGVuKGlzT3BlbmVkUHJvbWlzZS5yZXNvbHZlKTtcclxuXHJcblxyXG5cdCQud2hlbihcclxuXHRcdGxvYWRUYWxrUHJvbWlzZSxcclxuXHRcdHRlbXBsYXRlRGF0YVByb21pc2UsXHJcblx0XHRyZWRpcmVjdENoZWNrUHJvbWlzZSxcclxuXHRcdHNob3VsZEdldE9yZXMgJiYgb3Jlc1Byb21pc2VcclxuXHQpLnRoZW4oXHJcblx0XHQvLyBBbGwgc3VjY2VkZWRcclxuXHRcdGZ1bmN0aW9uKHRhbGtXaWtpdGV4dCwgYmFubmVycywgcmVkaXJlY3RUYXJnZXQsIG9yZXNQcmVkaWNpdGlvbiApIHtcclxuXHRcdFx0dmFyIHJlc3VsdCA9IHtcclxuXHRcdFx0XHRzdWNjZXNzOiB0cnVlLFxyXG5cdFx0XHRcdHRhbGtwYWdlOiB0YWxrUGFnZSxcclxuXHRcdFx0XHR0YWxrV2lraXRleHQ6IHRhbGtXaWtpdGV4dCxcclxuXHRcdFx0XHRiYW5uZXJzOiBiYW5uZXJzXHJcblx0XHRcdH07XHJcblx0XHRcdGlmIChyZWRpcmVjdFRhcmdldCkge1xyXG5cdFx0XHRcdHJlc3VsdC5yZWRpcmVjdFRhcmdldCA9IHJlZGlyZWN0VGFyZ2V0O1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChvcmVzUHJlZGljaXRpb24pIHtcclxuXHRcdFx0XHRyZXN1bHQub3Jlc1ByZWRpY2l0aW9uID0gb3Jlc1ByZWRpY2l0aW9uO1xyXG5cdFx0XHR9XHJcblx0XHRcdHdpbmRvd01hbmFnZXIuY2xvc2VXaW5kb3coXCJsb2FkRGlhbG9nXCIsIHJlc3VsdCk7XHJcblx0XHRcdFxyXG5cdFx0fVxyXG5cdCk7IC8vIEFueSBmYWlsdXJlcyBhcmUgaGFuZGxlZCBieSB0aGUgbG9hZERpYWxvZyB3aW5kb3cgaXRzZWxmXHJcblxyXG5cdC8vIE9uIHdpbmRvdyBjbG9zZWQsIGNoZWNrIGRhdGEsIGFuZCByZXNvbHZlL3JlamVjdCBzZXR1cENvbXBsZXRlZFByb21pc2VcclxuXHRsb2FkRGlhbG9nV2luLmNsb3NlZC50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdGlmIChkYXRhICYmIGRhdGEuc3VjY2Vzcykge1xyXG5cdFx0XHQvLyBHb3QgZXZlcnl0aGluZyBuZWVkZWQ6IFJlc29sdmUgcHJvbWlzZSB3aXRoIHRoaXMgZGF0YVxyXG5cdFx0XHRzZXR1cENvbXBsZXRlZFByb21pc2UucmVzb2x2ZShkYXRhKTtcclxuXHRcdH0gZWxzZSBpZiAoZGF0YSAmJiBkYXRhLmVycm9yKSB7XHJcblx0XHRcdC8vIFRoZXJlIHdhcyBhbiBlcnJvcjogUmVqZWN0IHByb21pc2Ugd2l0aCBlcnJvciBjb2RlL2luZm9cclxuXHRcdFx0c2V0dXBDb21wbGV0ZWRQcm9taXNlLnJlamVjdChkYXRhLmVycm9yLmNvZGUsIGRhdGEuZXJyb3IuaW5mbyk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHQvLyBXaW5kb3cgY2xvc2VkIGJlZm9yZSBjb21wbGV0aW9uOiByZXNvbHZlIHByb21pc2Ugd2l0aG91dCBhbnkgZGF0YVxyXG5cdFx0XHRzZXR1cENvbXBsZXRlZFByb21pc2UucmVzb2x2ZShudWxsKTtcclxuXHRcdH1cclxuXHRcdGNhY2hlLmNsZWFySW52YWxpZEl0ZW1zKCk7XHJcblx0fSk7XHJcblxyXG5cdC8vIFRFU1RJTkcgcHVycG9zZXMgb25seTogbG9nIHBhc3NlZCBkYXRhIHRvIGNvbnNvbGVcclxuXHRzZXR1cENvbXBsZXRlZFByb21pc2UudGhlbihcclxuXHRcdGRhdGEgPT4gY29uc29sZS5sb2coXCJzZXR1cCB3aW5kb3cgY2xvc2VkXCIsIGRhdGEpLFxyXG5cdFx0KGNvZGUsIGluZm8pID0+IGNvbnNvbGUubG9nKFwic2V0dXAgd2luZG93IGNsb3NlZCB3aXRoIGVycm9yXCIsIHtjb2RlLCBpbmZvfSlcclxuXHQpO1xyXG5cclxuXHRyZXR1cm4gc2V0dXBDb21wbGV0ZWRQcm9taXNlO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgc2V0dXBSYXRlcjsiLCIvLyBWYXJpb3VzIHV0aWxpdHkgZnVuY3Rpb25zIGFuZCBvYmplY3RzIHRoYXQgbWlnaHQgYmUgdXNlZCBpbiBtdWx0aXBsZSBwbGFjZXNcclxuXHJcbmltcG9ydCBjb25maWcgZnJvbSBcIi4vY29uZmlnXCI7XHJcblxyXG52YXIgaXNBZnRlckRhdGUgPSBmdW5jdGlvbihkYXRlU3RyaW5nKSB7XHJcblx0cmV0dXJuIG5ldyBEYXRlKGRhdGVTdHJpbmcpIDwgbmV3IERhdGUoKTtcclxufTtcclxuXHJcbnZhciBBUEkgPSBuZXcgbXcuQXBpKCB7XHJcblx0YWpheDoge1xyXG5cdFx0aGVhZGVyczogeyBcclxuXHRcdFx0XCJBcGktVXNlci1BZ2VudFwiOiBcIlJhdGVyL1wiICsgY29uZmlnLnNjcmlwdC52ZXJzaW9uICsgXHJcblx0XHRcdFx0XCIgKCBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Vc2VyOkV2YWQzNy9SYXRlciApXCJcclxuXHRcdH1cclxuXHR9XHJcbn0gKTtcclxuLyogLS0tLS0tLS0tLSBBUEkgZm9yIE9SRVMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xyXG5BUEkuZ2V0T1JFUyA9IGZ1bmN0aW9uKHJldmlzaW9uSUQpIHtcclxuXHRyZXR1cm4gJC5nZXQoXCJodHRwczovL29yZXMud2lraW1lZGlhLm9yZy92My9zY29yZXMvZW53aWtpP21vZGVscz13cDEwJnJldmlkcz1cIityZXZpc2lvbklEKTtcclxufTtcclxuLyogLS0tLS0tLS0tLSBSYXcgd2lraXRleHQgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xyXG5BUEkuZ2V0UmF3ID0gZnVuY3Rpb24ocGFnZSkge1xyXG5cdHJldHVybiAkLmdldChcImh0dHBzOlwiICsgY29uZmlnLm13LndnU2VydmVyICsgbXcudXRpbC5nZXRVcmwocGFnZSwge2FjdGlvbjpcInJhd1wifSkpXHJcblx0XHQudGhlbihmdW5jdGlvbihkYXRhKSB7XHJcblx0XHRcdGlmICggIWRhdGEgKSB7XHJcblx0XHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoXCJvay1idXQtZW1wdHlcIik7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGRhdGE7XHJcblx0XHR9KTtcclxufTtcclxuXHJcbnZhciBtYWtlRXJyb3JNc2cgPSBmdW5jdGlvbihmaXJzdCwgc2Vjb25kKSB7XHJcblx0dmFyIGNvZGUsIHhociwgbWVzc2FnZTtcclxuXHRpZiAoIHR5cGVvZiBmaXJzdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2Ygc2Vjb25kID09PSBcInN0cmluZ1wiICkge1xyXG5cdFx0Ly8gRXJyb3JzIGZyb20gJC5nZXQgYmVpbmcgcmVqZWN0ZWQgKE9SRVMgJiBSYXcgd2lraXRleHQpXHJcblx0XHR2YXIgZXJyb3JPYmogPSBmaXJzdC5yZXNwb25zZUpTT04gJiYgZmlyc3QucmVzcG9uc2VKU09OLmVycm9yO1xyXG5cdFx0aWYgKCBlcnJvck9iaiApIHtcclxuXHRcdFx0Ly8gR290IGFuIGFwaS1zcGVjaWZpYyBlcnJvciBjb2RlL21lc3NhZ2VcclxuXHRcdFx0Y29kZSA9IGVycm9yT2JqLmNvZGU7XHJcblx0XHRcdG1lc3NhZ2UgPSBlcnJvck9iai5tZXNzYWdlO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0eGhyID0gZmlyc3Q7XHJcblx0XHR9XHJcblx0fSBlbHNlIGlmICggdHlwZW9mIGZpcnN0ID09PSBcInN0cmluZ1wiICYmIHR5cGVvZiBzZWNvbmQgPT09IFwib2JqZWN0XCIgKSB7XHJcblx0XHQvLyBFcnJvcnMgZnJvbSBtdy5BcGkgb2JqZWN0XHJcblx0XHR2YXIgbXdFcnJvck9iaiA9IHNlY29uZC5lcnJvcjtcclxuXHRcdGlmIChtd0Vycm9yT2JqKSB7XHJcblx0XHRcdC8vIEdvdCBhbiBhcGktc3BlY2lmaWMgZXJyb3IgY29kZS9tZXNzYWdlXHJcblx0XHRcdGNvZGUgPSBlcnJvck9iai5jb2RlO1xyXG5cdFx0XHRtZXNzYWdlID0gZXJyb3JPYmouaW5mbztcclxuXHRcdH0gZWxzZSBpZiAoZmlyc3QgPT09IFwib2stYnV0LWVtcHR5XCIpIHtcclxuXHRcdFx0Y29kZSA9IG51bGw7XHJcblx0XHRcdG1lc3NhZ2UgPSBcIkdvdCBhbiBlbXB0eSByZXNwb25zZSBmcm9tIHRoZSBzZXJ2ZXJcIjtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHhociA9IHNlY29uZCAmJiBzZWNvbmQueGhyO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0aWYgKGNvZGUgJiYgbWVzc2FnZSkge1xyXG5cdFx0cmV0dXJuIGBBUEkgZXJyb3IgJHtjb2RlfTogJHttZXNzYWdlfWA7XHJcblx0fSBlbHNlIGlmIChtZXNzYWdlKSB7XHJcblx0XHRyZXR1cm4gYEFQSSBlcnJvcjogJHttZXNzYWdlfWA7XHJcblx0fSBlbHNlIGlmICh4aHIpIHtcclxuXHRcdHJldHVybiBgSFRUUCBlcnJvciAke3hoci5zdGF0dXN9YDtcclxuXHR9IGVsc2UgaWYgKFxyXG5cdFx0dHlwZW9mIGZpcnN0ID09PSBcInN0cmluZ1wiICYmIGZpcnN0ICE9PSBcImVycm9yXCIgJiZcclxuXHRcdHR5cGVvZiBzZWNvbmQgPT09IFwic3RyaW5nXCIgJiYgc2Vjb25kICE9PSBcImVycm9yXCJcclxuXHQpIHtcclxuXHRcdHJldHVybiBgRXJyb3IgJHtmaXJzdH06ICR7c2Vjb25kfWA7XHJcblx0fSBlbHNlIGlmICh0eXBlb2YgZmlyc3QgPT09IFwic3RyaW5nXCIgJiYgZmlyc3QgIT09IFwiZXJyb3JcIikge1xyXG5cdFx0cmV0dXJuIGBFcnJvcjogJHtmaXJzdH1gO1xyXG5cdH0gZWxzZSB7XHJcblx0XHRyZXR1cm4gXCJVbmtub3duIEFQSSBlcnJvclwiO1xyXG5cdH1cclxufTtcclxuXHJcbmV4cG9ydCB7aXNBZnRlckRhdGUsIEFQSSwgbWFrZUVycm9yTXNnfTsiLCJpbXBvcnQgTG9hZERpYWxvZyBmcm9tIFwiLi9XaW5kb3dzL0xvYWREaWFsb2dcIjtcclxuaW1wb3J0IE1haW5XaW5kb3cgZnJvbSBcIi4vV2luZG93cy9NYWluV2luZG93XCI7XHJcblxyXG52YXIgZmFjdG9yeSA9IG5ldyBPTy5GYWN0b3J5KCk7XHJcblxyXG4vLyBSZWdpc3RlciB3aW5kb3cgY29uc3RydWN0b3JzIHdpdGggdGhlIGZhY3RvcnkuXHJcbmZhY3RvcnkucmVnaXN0ZXIoTG9hZERpYWxvZyk7XHJcbmZhY3RvcnkucmVnaXN0ZXIoTWFpbldpbmRvdyk7XHJcblxyXG52YXIgbWFuYWdlciA9IG5ldyBPTy51aS5XaW5kb3dNYW5hZ2VyKCB7XHJcblx0XCJmYWN0b3J5XCI6IGZhY3RvcnlcclxufSApO1xyXG4kKCBkb2N1bWVudC5ib2R5ICkuYXBwZW5kKCBtYW5hZ2VyLiRlbGVtZW50ICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBtYW5hZ2VyOyJdfQ==
