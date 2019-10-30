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
          templatesArray[i].redirectTarget = mw.Title.newFromText(redirect.to);
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

  this.layout = new OO.ui.FieldsetLayout(); // this.mainLabel = new OO.ui.LabelWidget({
  // 	label: "{{" + this.template.getTitle().getMainText() + "}}",
  // });

  this.removeButton = new OO.ui.ButtonWidget({
    icon: "trash",
    label: "Remove banner",
    title: "Remove banner",
    flags: "destructive",
    $element: $("<div style=\"width:100%\">")
  });
  this.clearButton = new OO.ui.ButtonWidget({
    icon: "cancel",
    label: "Clear parameters",
    title: "Clear parameters",
    flags: "destructive",
    $element: $("<div style=\"width:100%\">")
  });
  this.bypassButton = new OO.ui.ButtonWidget({
    icon: "articleRedirect",
    label: "Bypass redirect",
    title: "Bypass redirect",
    $element: $("<div style=\"width:100%\">")
  });
  this.removeButton.$element.find("a").css("width", "100%");
  this.clearButton.$element.find("a").css("width", "100%");
  this.bypassButton.$element.find("a").css("width", "100%");
  this.titleButtonsGroup = new OO.ui.ButtonGroupWidget({
    items: template.redirectTarget ? [this.removeButton, this.clearButton, this.bypassButton] : [this.removeButton, this.clearButton],
    $element: $("<span style='width:100%;'>")
  });
  this.mainLabelPopupButton = new OO.ui.PopupButtonWidget({
    label: "{{" + this.template.getTitle().getMainText() + "}}",
    $element: $("<span style='display:inline-block;width:48%;margin-right:0;padding-right:8px'>"),
    indicator: "down",
    framed: false,
    popup: {
      $content: this.titleButtonsGroup.$element,
      width: 200,
      padded: false,
      align: "force-right",
      anchor: false
    }
  });
  this.mainLabelPopupButton.$element.children("a").first().css({
    "font-size": "110%"
  }).find("span.oo-ui-labelElement-label").css({
    "white-space": "normal"
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
  this.titlelayout = new OO.ui.HorizontalLayout({
    items: [this.mainLabelPopupButton, this.classDropdown, this.importanceDropdown]
  });
  var parameterWidgets = this.template.parameters.filter(function (param) {
    return param.name !== "class" && param.name !== "importance";
  }).map(function (param) {
    return new _ParameterWidget["default"](param, _this.template.paramData[param.name]);
  }); // Limit how many parameters will be displayed initially

  var initialParameterLimit = 5; // But only hide if there's more than one to hide (otherwise, it's not much of a space saving
  // and just annoying for users)

  var hideSomeParams = parameterWidgets.length > initialParameterLimit + 1;

  if (hideSomeParams) {
    parameterWidgets.forEach(function (parameterWidget, index) {
      parameterWidget.toggle(index < initialParameterLimit);
    });
  }

  this.showMoreParametersButton = new OO.ui.ButtonWidget({
    label: "Show " + (parameterWidgets.length - initialParameterLimit) + " more paramters",
    framed: false,
    $element: $("<span style='margin-bottom:0'>")
  });
  this.showAddParameterInputsButton = new OO.ui.ButtonWidget({
    label: "Add paramter",
    icon: "add",
    framed: false,
    $element: $("<span style='margin-bottom:0'>")
  });
  this.parameterWidgetsLayout = new OO.ui.HorizontalLayout({
    items: hideSomeParams ? [].concat(_toConsumableArray(parameterWidgets), [this.showMoreParametersButton, this.showAddParameterInputsButton]) : [].concat(_toConsumableArray(parameterWidgets), [this.showAddParameterInputsButton])
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
  }).toggle(false); // And another hack

  this.addParameterLayout.$element.find(".oo-ui-fieldLayout-messages").css({
    "clear": "both",
    "padding-top": 0
  }); // Add everything to the layout

  this.layout.addItems([this.titlelayout, this.parameterWidgetsLayout, this.addParameterLayout]);
  this.$element.append(this.layout.$element, $("<hr>"));
  this.parameterWidgetsLayout.aggregate.call(this.parameterWidgetsLayout, {
    "delete": "parameterDelete"
  });
  this.parameterWidgetsLayout.connect(this, {
    "parameterDelete": "onParameterDelete"
  });
  this.showMoreParametersButton.connect(this, {
    "click": "showMoreParameters"
  });
  this.showAddParameterInputsButton.connect(this, {
    "click": "showAddParameterInputs"
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

BannerWidget.prototype.onParameterDelete = function (itemWidget) {
  this.parameterWidgetsLayout.removeItems([itemWidget]);
};

BannerWidget.prototype.showMoreParameters = function () {
  this.parameterWidgetsLayout.removeItems([this.showMoreParametersButton]);
  this.parameterWidgetsLayout.forEach(function (parameterWidget) {
    return parameterWidget.toggle(true);
  });
};

BannerWidget.prototype.showAddParameterInputs = function () {
  this.parameterWidgetsLayout.removeItems([this.showAddParameterInputsButton]);
  this.addParameterLayout.toggle(true);
};

BannerWidget.prototype.getAddParametersInfo = function (nameInputVal, valueInputVal) {
  var name = nameInputVal && nameInputVal.trim() || this.addParameterNameInput.getValue().trim();
  var paramAlreadyIncluded = name === "class" || name === "importance" || this.parameterWidgetsLayout.items.some(function (paramWidget) {
    return paramWidget.parameter && paramWidget.parameter.name === name;
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
  this.deleteButton.connect(this, {
    "click": "onDeleteClick"
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

ParameterWidget.prototype.onDeleteClick = function () {
  this.emit("delete");
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
    return _this2.searchBox.focus();
  });
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
        var mainText = template.redirectTarget ? template.redirectTarget.getMainText() : template.getTitle().getMainText();
        return allBanners.withRatings.includes(mainText) || allBanners.withoutRatings.includes(mainText) || allBanners.wrappers.includes(mainText);
      }).map(function (template) {
        // Set wrapper target if needed
        var mainText = template.redirectTarget ? template.redirectTarget.getMainText() : template.getTitle().getMainText();

        if (allBanners.wrappers.includes(mainText)) {
          template.redirectTarget = mw.Title.newFromText("Template:Subst:" + mainText);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJyYXRlci1zcmMvQXBwLmpzIiwicmF0ZXItc3JjL1RlbXBsYXRlLmpzIiwicmF0ZXItc3JjL1dpbmRvd3MvQ29tcG9uZW50cy9CYW5uZXJXaWRnZXQuanMiLCJyYXRlci1zcmMvV2luZG93cy9Db21wb25lbnRzL1BhcmFtZXRlcldpZGdldC5qcyIsInJhdGVyLXNyYy9XaW5kb3dzL0NvbXBvbmVudHMvU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldC5qcyIsInJhdGVyLXNyYy9XaW5kb3dzL0xvYWREaWFsb2cuanMiLCJyYXRlci1zcmMvV2luZG93cy9NYWluV2luZG93LmpzIiwicmF0ZXItc3JjL2F1dG9zdGFydC5qcyIsInJhdGVyLXNyYy9jYWNoZS5qcyIsInJhdGVyLXNyYy9jb25maWcuanMiLCJyYXRlci1zcmMvY3NzLmpzIiwicmF0ZXItc3JjL2dldEJhbm5lcnMuanMiLCJyYXRlci1zcmMvc2V0dXAuanMiLCJyYXRlci1zcmMvdXRpbC5qcyIsInJhdGVyLXNyYy93aW5kb3dNYW5hZ2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUVBLENBQUMsU0FBUyxHQUFULEdBQWU7QUFDZixFQUFBLE9BQU8sQ0FBQyxHQUFSLENBQVksOEJBQVo7QUFFQSxFQUFBLEVBQUUsQ0FBQyxJQUFILENBQVEsTUFBUixDQUFlLGVBQWY7O0FBRUEsTUFBTSxjQUFjLEdBQUcsU0FBakIsY0FBaUIsQ0FBQSxJQUFJLEVBQUk7QUFDOUIsUUFBSSxDQUFDLElBQUQsSUFBUyxDQUFDLElBQUksQ0FBQyxPQUFuQixFQUE0QjtBQUMzQjtBQUNBOztBQUVELDhCQUFjLFVBQWQsQ0FBeUIsTUFBekIsRUFBaUMsSUFBakM7QUFDQSxHQU5EOztBQVFBLE1BQU0sY0FBYyxHQUFHLFNBQWpCLGNBQWlCLENBQUMsSUFBRCxFQUFP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R0FBSixFQUFTO0FBQ2YsZ0NBQXFCLEdBQUcsQ0FBQyxNQUF6QjtBQUNBLEdBRk0sTUFFQSxJQUNOLE9BQU8sS0FBUCxLQUFpQixRQUFqQixJQUE2QixLQUFLLEtBQUssT0FBdkMsSUFDQSxPQUFPLE1BQVAsS0FBa0IsUUFEbEIsSUFDOEIsTUFBTSxLQUFLLE9BRm5DLEVBR0w7QUFDRCwyQkFBZ0IsS0FBaEIsZUFBMEIsTUFBMUI7QUFDQSxHQUxNLE1BS0EsSUFBSSxPQUFPLEtBQVAsS0FBaUIsUUFBakIsSUFBNkIsS0FBSyxLQUFLLE9BQTNDLEVBQW9EO0FBQzFELDRCQUFpQixLQUFqQjtBQUNBLEdBRk0sTUFFQTtBQUNOLFdBQU8sbUJBQVA7QUFDQTtBQUNELENBM0NEOzs7Ozs7Ozs7Ozs7QUMvQkE7O0FBQ0E7Ozs7QUFFQSxJQUFJLE9BQU8sR0FBRyxJQUFJLEVBQUUsQ0FBQyxPQUFQLEVBQWQsQyxDQUVBOztBQUNBLE9BQU8sQ0FBQyxRQUFSLENBQWlCLHNCQUFqQjtBQUNBLE9BQU8sQ0FBQyxRQUFSLENBQWlCLHNCQUFqQjtBQUVBLElBQUksT0FBTyxHQUFHLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxhQUFWLENBQXlCO0FBQ3RDLGFBQVc7QUFEMkIsQ0FBekIsQ0FBZDtBQUdBLENBQUMsQ0FBRSxRQUFRLENBQUMsSUFBWCxDQUFELENBQW1CLE1BQW5CLENBQTJCLE9BQU8sQ0FBQyxRQUFuQztlQUVlLE8iLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbXBvcnQgc2V0dXBSYXRlciBmcm9tIFwiLi9zZXR1cFwiO1xyXG5pbXBvcnQgYXV0b1N0YXJ0IGZyb20gXCIuL2F1dG9zdGFydFwiO1xyXG5pbXBvcnQgZGlmZlN0eWxlcyBmcm9tIFwiLi9jc3MuanNcIjtcclxuaW1wb3J0IHsgbWFrZUVycm9yTXNnIH0gZnJvbSBcIi4vdXRpbFwiO1xyXG5pbXBvcnQgd2luZG93TWFuYWdlciBmcm9tIFwiLi93aW5kb3dNYW5hZ2VyXCI7XHJcblxyXG4oZnVuY3Rpb24gQXBwKCkge1xyXG5cdGNvbnNvbGUubG9nKFwiUmF0ZXIncyBBcHAuanMgaXMgcnVubmluZy4uLlwiKTtcclxuXHJcblx0bXcudXRpbC5hZGRDU1MoZGlmZlN0eWxlcyk7XHJcblxyXG5cdGNvbnN0IHNob3dNYWluV2luZG93ID0gZGF0YSA9PiB7XHJcblx0XHRpZiAoIWRhdGEgfHwgIWRhdGEuc3VjY2Vzcykge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0d2luZG93TWFuYWdlci5vcGVuV2luZG93KFwibWFpblwiLCBkYXRhKTtcclxuXHR9O1xyXG5cclxuXHRjb25zdCBzaG93U2V0dXBFcnJvciA9IChjb2RlLCBqcXhocikgPT4gT08udWkuYWxlcnQoXHJcblx0XHRtYWtlRXJyb3JNc2coY29kZSwganF4aHIpLFx0e1xyXG5cdFx0XHR0aXRsZTogXCJSYXRlciBmYWlsZWQgdG8gb3BlblwiXHJcblx0XHR9XHJcblx0KTtcclxuXHJcblx0Ly8gSW52b2NhdGlvbiBieSBwb3J0bGV0IGxpbmsgXHJcblx0bXcudXRpbC5hZGRQb3J0bGV0TGluayhcclxuXHRcdFwicC1jYWN0aW9uc1wiLFxyXG5cdFx0XCIjXCIsXHJcblx0XHRcIlJhdGVyXCIsXHJcblx0XHRcImNhLXJhdGVyXCIsXHJcblx0XHRcIlJhdGUgcXVhbGl0eSBhbmQgaW1wb3J0YW5jZVwiLFxyXG5cdFx0XCI1XCJcclxuXHQpO1xyXG5cdCQoXCIjY2EtcmF0ZXJcIikuY2xpY2soKCkgPT4gc2V0dXBSYXRlcigpLnRoZW4oc2hvd01haW5XaW5kb3csIHNob3dTZXR1cEVycm9yKSApO1xyXG5cclxuXHQvLyBJbnZvY2F0aW9uIGJ5IGF1dG8tc3RhcnQgKGRvIG5vdCBzaG93IG1lc3NhZ2Ugb24gZXJyb3IpXHJcblx0YXV0b1N0YXJ0KCkudGhlbihzaG93TWFpbldpbmRvdyk7XHJcbn0pKCk7IiwiaW1wb3J0IHtBUEksIGlzQWZ0ZXJEYXRlfSBmcm9tIFwiLi91dGlsXCI7XHJcbmltcG9ydCBjb25maWcgZnJvbSBcIi4vY29uZmlnXCI7XHJcbmltcG9ydCAqIGFzIGNhY2hlIGZyb20gXCIuL2NhY2hlXCI7XHJcblxyXG4vKiogVGVtcGxhdGVcclxuICpcclxuICogQGNsYXNzXHJcbiAqIFJlcHJlc2VudHMgdGhlIHdpa2l0ZXh0IG9mIHRlbXBsYXRlIHRyYW5zY2x1c2lvbi4gVXNlZCBieSAjcGFyc2VUZW1wbGF0ZXMuXHJcbiAqIEBwcm9wIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgdGVtcGxhdGVcclxuICogQHByb3Age1N0cmluZ30gd2lraXRleHQgRnVsbCB3aWtpdGV4dCBvZiB0aGUgdHJhbnNjbHVzaW9uXHJcbiAqIEBwcm9wIHtPYmplY3RbXX0gcGFyYW1ldGVycyBQYXJhbWV0ZXJzIHVzZWQgaW4gdGhlIHRyYW5zbGN1c2lvbiwgaW4gb3JkZXIsIG9mIGZvcm06XHJcblx0e1xyXG5cdFx0bmFtZToge1N0cmluZ3xOdW1iZXJ9IHBhcmFtZXRlciBuYW1lLCBvciBwb3NpdGlvbiBmb3IgdW5uYW1lZCBwYXJhbWV0ZXJzLFxyXG5cdFx0dmFsdWU6IHtTdHJpbmd9IFdpa2l0ZXh0IHBhc3NlZCB0byB0aGUgcGFyYW1ldGVyICh3aGl0ZXNwYWNlIHRyaW1tZWQpLFxyXG5cdFx0d2lraXRleHQ6IHtTdHJpbmd9IEZ1bGwgd2lraXRleHQgKGluY2x1ZGluZyBsZWFkaW5nIHBpcGUsIHBhcmFtZXRlciBuYW1lL2VxdWFscyBzaWduIChpZiBhcHBsaWNhYmxlKSwgdmFsdWUsIGFuZCBhbnkgd2hpdGVzcGFjZSlcclxuXHR9XHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge1N0cmluZ30gd2lraXRleHQgV2lraXRleHQgb2YgYSB0ZW1wbGF0ZSB0cmFuc2NsdXNpb24sIHN0YXJ0aW5nIHdpdGggJ3t7JyBhbmQgZW5kaW5nIHdpdGggJ319Jy5cclxuICovXHJcbnZhciBUZW1wbGF0ZSA9IGZ1bmN0aW9uKHdpa2l0ZXh0KSB7XHJcblx0dGhpcy53aWtpdGV4dCA9IHdpa2l0ZXh0O1xyXG5cdHRoaXMucGFyYW1ldGVycyA9IFtdO1xyXG59O1xyXG5UZW1wbGF0ZS5wcm90b3R5cGUuYWRkUGFyYW0gPSBmdW5jdGlvbihuYW1lLCB2YWwsIHdpa2l0ZXh0KSB7XHJcblx0dGhpcy5wYXJhbWV0ZXJzLnB1c2goe1xyXG5cdFx0XCJuYW1lXCI6IG5hbWUsXHJcblx0XHRcInZhbHVlXCI6IHZhbCwgXHJcblx0XHRcIndpa2l0ZXh0XCI6IFwifFwiICsgd2lraXRleHRcclxuXHR9KTtcclxufTtcclxuLyoqXHJcbiAqIEdldCBhIHBhcmFtZXRlciBkYXRhIGJ5IHBhcmFtZXRlciBuYW1lXHJcbiAqLyBcclxuVGVtcGxhdGUucHJvdG90eXBlLmdldFBhcmFtID0gZnVuY3Rpb24ocGFyYW1OYW1lKSB7XHJcblx0cmV0dXJuIHRoaXMucGFyYW1ldGVycy5maW5kKGZ1bmN0aW9uKHApIHsgcmV0dXJuIHAubmFtZSA9PSBwYXJhbU5hbWU7IH0pO1xyXG59O1xyXG5UZW1wbGF0ZS5wcm90b3R5cGUuc2V0TmFtZSA9IGZ1bmN0aW9uKG5hbWUpIHtcclxuXHR0aGlzLm5hbWUgPSBuYW1lLnRyaW0oKTtcclxufTtcclxuVGVtcGxhdGUucHJvdG90eXBlLmdldFRpdGxlID0gZnVuY3Rpb24oKSB7XHJcblx0cmV0dXJuIG13LlRpdGxlLm5ld0Zyb21UZXh0KFwiVGVtcGxhdGU6XCIgKyB0aGlzLm5hbWUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIHBhcnNlVGVtcGxhdGVzXHJcbiAqXHJcbiAqIFBhcnNlcyB0ZW1wbGF0ZXMgZnJvbSB3aWtpdGV4dC5cclxuICogQmFzZWQgb24gU0QwMDAxJ3MgdmVyc2lvbiBhdCA8aHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvVXNlcjpTRDAwMDEvcGFyc2VBbGxUZW1wbGF0ZXMuanM+LlxyXG4gKiBSZXR1cm5zIGFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIHRlbXBsYXRlIGRldGFpbHM6XHJcbiAqICB2YXIgdGVtcGxhdGVzID0gcGFyc2VUZW1wbGF0ZXMoXCJIZWxsbyB7e2ZvbyB8QmFyfGJhej1xdXggfDI9bG9yZW1pcHN1bXwzPX19IHdvcmxkXCIpO1xyXG4gKiAgY29uc29sZS5sb2codGVtcGxhdGVzWzBdKTsgLy8gLS0+IG9iamVjdFxyXG5cdHtcclxuXHRcdG5hbWU6IFwiZm9vXCIsXHJcblx0XHR3aWtpdGV4dDpcInt7Zm9vIHxCYXJ8YmF6PXF1eCB8IDIgPSBsb3JlbWlwc3VtICB8Mz19fVwiLFxyXG5cdFx0cGFyYW1ldGVyczogW1xyXG5cdFx0XHR7XHJcblx0XHRcdFx0bmFtZTogMSxcclxuXHRcdFx0XHR2YWx1ZTogJ0JhcicsXHJcblx0XHRcdFx0d2lraXRleHQ6ICd8QmFyJ1xyXG5cdFx0XHR9LFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0bmFtZTogJ2JheicsXHJcblx0XHRcdFx0dmFsdWU6ICdxdXgnLFxyXG5cdFx0XHRcdHdpa2l0ZXh0OiAnfGJhej1xdXggJ1xyXG5cdFx0XHR9LFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0bmFtZTogJzInLFxyXG5cdFx0XHRcdHZhbHVlOiAnbG9yZW1pcHN1bScsXHJcblx0XHRcdFx0d2lraXRleHQ6ICd8IDIgPSBsb3JlbWlwc3VtICAnXHJcblx0XHRcdH0sXHJcblx0XHRcdHtcclxuXHRcdFx0XHRuYW1lOiAnMycsXHJcblx0XHRcdFx0dmFsdWU6ICcnLFxyXG5cdFx0XHRcdHdpa2l0ZXh0OiAnfDM9J1xyXG5cdFx0XHR9XHJcblx0XHRdLFxyXG5cdFx0Z2V0UGFyYW06IGZ1bmN0aW9uKHBhcmFtTmFtZSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5wYXJhbWV0ZXJzLmZpbmQoZnVuY3Rpb24ocCkgeyByZXR1cm4gcC5uYW1lID09IHBhcmFtTmFtZTsgfSk7XHJcblx0XHR9XHJcblx0fVxyXG4gKiAgICBcclxuICogXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB3aWtpdGV4dFxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHJlY3Vyc2l2ZSBTZXQgdG8gYHRydWVgIHRvIGFsc28gcGFyc2UgdGVtcGxhdGVzIHRoYXQgb2NjdXIgd2l0aGluIG90aGVyIHRlbXBsYXRlcyxcclxuICogIHJhdGhlciB0aGFuIGp1c3QgdG9wLWxldmVsIHRlbXBsYXRlcy4gXHJcbiAqIEByZXR1cm4ge1RlbXBsYXRlW119IHRlbXBsYXRlc1xyXG4qL1xyXG52YXIgcGFyc2VUZW1wbGF0ZXMgPSBmdW5jdGlvbih3aWtpdGV4dCwgcmVjdXJzaXZlKSB7IC8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnRyb2wtcmVnZXggKi9cclxuXHRpZiAoIXdpa2l0ZXh0KSB7XHJcblx0XHRyZXR1cm4gW107XHJcblx0fVxyXG5cdHZhciBzdHJSZXBsYWNlQXQgPSBmdW5jdGlvbihzdHJpbmcsIGluZGV4LCBjaGFyKSB7XHJcblx0XHRyZXR1cm4gc3RyaW5nLnNsaWNlKDAsaW5kZXgpICsgY2hhciArIHN0cmluZy5zbGljZShpbmRleCArIDEpO1xyXG5cdH07XHJcblxyXG5cdHZhciByZXN1bHQgPSBbXTtcclxuXHRcclxuXHR2YXIgcHJvY2Vzc1RlbXBsYXRlVGV4dCA9IGZ1bmN0aW9uIChzdGFydElkeCwgZW5kSWR4KSB7XHJcblx0XHR2YXIgdGV4dCA9IHdpa2l0ZXh0LnNsaWNlKHN0YXJ0SWR4LCBlbmRJZHgpO1xyXG5cclxuXHRcdHZhciB0ZW1wbGF0ZSA9IG5ldyBUZW1wbGF0ZShcInt7XCIgKyB0ZXh0LnJlcGxhY2UoL1xceDAxL2csXCJ8XCIpICsgXCJ9fVwiKTtcclxuXHRcdFxyXG5cdFx0Ly8gc3dhcCBvdXQgcGlwZSBpbiBsaW5rcyB3aXRoIFxceDAxIGNvbnRyb2wgY2hhcmFjdGVyXHJcblx0XHQvLyBbW0ZpbGU6IF1dIGNhbiBoYXZlIG11bHRpcGxlIHBpcGVzLCBzbyBtaWdodCBuZWVkIG11bHRpcGxlIHBhc3Nlc1xyXG5cdFx0d2hpbGUgKCAvKFxcW1xcW1teXFxdXSo/KVxcfCguKj9cXF1cXF0pL2cudGVzdCh0ZXh0KSApIHtcclxuXHRcdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvKFxcW1xcW1teXFxdXSo/KVxcfCguKj9cXF1cXF0pL2csIFwiJDFcXHgwMSQyXCIpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBjaHVua3MgPSB0ZXh0LnNwbGl0KFwifFwiKS5tYXAoZnVuY3Rpb24oY2h1bmspIHtcclxuXHRcdFx0Ly8gY2hhbmdlICdcXHgwMScgY29udHJvbCBjaGFyYWN0ZXJzIGJhY2sgdG8gcGlwZXNcclxuXHRcdFx0cmV0dXJuIGNodW5rLnJlcGxhY2UoL1xceDAxL2csXCJ8XCIpOyBcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRlbXBsYXRlLnNldE5hbWUoY2h1bmtzWzBdKTtcclxuXHRcdFxyXG5cdFx0dmFyIHBhcmFtZXRlckNodW5rcyA9IGNodW5rcy5zbGljZSgxKTtcclxuXHJcblx0XHR2YXIgdW5uYW1lZElkeCA9IDE7XHJcblx0XHRwYXJhbWV0ZXJDaHVua3MuZm9yRWFjaChmdW5jdGlvbihjaHVuaykge1xyXG5cdFx0XHR2YXIgaW5kZXhPZkVxdWFsVG8gPSBjaHVuay5pbmRleE9mKFwiPVwiKTtcclxuXHRcdFx0dmFyIGluZGV4T2ZPcGVuQnJhY2VzID0gY2h1bmsuaW5kZXhPZihcInt7XCIpO1xyXG5cdFx0XHRcclxuXHRcdFx0dmFyIGlzV2l0aG91dEVxdWFscyA9ICFjaHVuay5pbmNsdWRlcyhcIj1cIik7XHJcblx0XHRcdHZhciBoYXNCcmFjZXNCZWZvcmVFcXVhbHMgPSBjaHVuay5pbmNsdWRlcyhcInt7XCIpICYmIGluZGV4T2ZPcGVuQnJhY2VzIDwgaW5kZXhPZkVxdWFsVG87XHRcclxuXHRcdFx0dmFyIGlzVW5uYW1lZFBhcmFtID0gKCBpc1dpdGhvdXRFcXVhbHMgfHwgaGFzQnJhY2VzQmVmb3JlRXF1YWxzICk7XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgcE5hbWUsIHBOdW0sIHBWYWw7XHJcblx0XHRcdGlmICggaXNVbm5hbWVkUGFyYW0gKSB7XHJcblx0XHRcdFx0Ly8gR2V0IHRoZSBuZXh0IG51bWJlciBub3QgYWxyZWFkeSB1c2VkIGJ5IGVpdGhlciBhbiB1bm5hbWVkIHBhcmFtZXRlciwgb3IgYnkgYVxyXG5cdFx0XHRcdC8vIG5hbWVkIHBhcmFtZXRlciBsaWtlIGB8MT12YWxgXHJcblx0XHRcdFx0d2hpbGUgKCB0ZW1wbGF0ZS5nZXRQYXJhbSh1bm5hbWVkSWR4KSApIHtcclxuXHRcdFx0XHRcdHVubmFtZWRJZHgrKztcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cE51bSA9IHVubmFtZWRJZHg7XHJcblx0XHRcdFx0cFZhbCA9IGNodW5rLnRyaW0oKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRwTmFtZSA9IGNodW5rLnNsaWNlKDAsIGluZGV4T2ZFcXVhbFRvKS50cmltKCk7XHJcblx0XHRcdFx0cFZhbCA9IGNodW5rLnNsaWNlKGluZGV4T2ZFcXVhbFRvICsgMSkudHJpbSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRlbXBsYXRlLmFkZFBhcmFtKHBOYW1lIHx8IHBOdW0sIHBWYWwsIGNodW5rKTtcclxuXHRcdH0pO1xyXG5cdFx0XHJcblx0XHRyZXN1bHQucHVzaCh0ZW1wbGF0ZSk7XHJcblx0fTtcclxuXHJcblx0XHJcblx0dmFyIG4gPSB3aWtpdGV4dC5sZW5ndGg7XHJcblx0XHJcblx0Ly8gbnVtYmVyIG9mIHVuY2xvc2VkIGJyYWNlc1xyXG5cdHZhciBudW1VbmNsb3NlZCA9IDA7XHJcblxyXG5cdC8vIGFyZSB3ZSBpbnNpZGUgYSBjb21tZW50IG9yIGJldHdlZW4gbm93aWtpIHRhZ3M/XHJcblx0dmFyIGluQ29tbWVudCA9IGZhbHNlO1xyXG5cdHZhciBpbk5vd2lraSA9IGZhbHNlO1xyXG5cclxuXHR2YXIgc3RhcnRJZHgsIGVuZElkeDtcclxuXHRcclxuXHRmb3IgKHZhciBpPTA7IGk8bjsgaSsrKSB7XHJcblx0XHRcclxuXHRcdGlmICggIWluQ29tbWVudCAmJiAhaW5Ob3dpa2kgKSB7XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAod2lraXRleHRbaV0gPT09IFwie1wiICYmIHdpa2l0ZXh0W2krMV0gPT09IFwie1wiKSB7XHJcblx0XHRcdFx0aWYgKG51bVVuY2xvc2VkID09PSAwKSB7XHJcblx0XHRcdFx0XHRzdGFydElkeCA9IGkrMjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0bnVtVW5jbG9zZWQgKz0gMjtcclxuXHRcdFx0XHRpKys7XHJcblx0XHRcdH0gZWxzZSBpZiAod2lraXRleHRbaV0gPT09IFwifVwiICYmIHdpa2l0ZXh0W2krMV0gPT09IFwifVwiKSB7XHJcblx0XHRcdFx0aWYgKG51bVVuY2xvc2VkID09PSAyKSB7XHJcblx0XHRcdFx0XHRlbmRJZHggPSBpO1xyXG5cdFx0XHRcdFx0cHJvY2Vzc1RlbXBsYXRlVGV4dChzdGFydElkeCwgZW5kSWR4KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0bnVtVW5jbG9zZWQgLT0gMjtcclxuXHRcdFx0XHRpKys7XHJcblx0XHRcdH0gZWxzZSBpZiAod2lraXRleHRbaV0gPT09IFwifFwiICYmIG51bVVuY2xvc2VkID4gMikge1xyXG5cdFx0XHRcdC8vIHN3YXAgb3V0IHBpcGVzIGluIG5lc3RlZCB0ZW1wbGF0ZXMgd2l0aCBcXHgwMSBjaGFyYWN0ZXJcclxuXHRcdFx0XHR3aWtpdGV4dCA9IHN0clJlcGxhY2VBdCh3aWtpdGV4dCwgaSxcIlxceDAxXCIpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKCAvXjwhLS0vLnRlc3Qod2lraXRleHQuc2xpY2UoaSwgaSArIDQpKSApIHtcclxuXHRcdFx0XHRpbkNvbW1lbnQgPSB0cnVlO1xyXG5cdFx0XHRcdGkgKz0gMztcclxuXHRcdFx0fSBlbHNlIGlmICggL148bm93aWtpID8+Ly50ZXN0KHdpa2l0ZXh0LnNsaWNlKGksIGkgKyA5KSkgKSB7XHJcblx0XHRcdFx0aW5Ob3dpa2kgPSB0cnVlO1xyXG5cdFx0XHRcdGkgKz0gNztcclxuXHRcdFx0fSBcclxuXHJcblx0XHR9IGVsc2UgeyAvLyB3ZSBhcmUgaW4gYSBjb21tZW50IG9yIG5vd2lraVxyXG5cdFx0XHRpZiAod2lraXRleHRbaV0gPT09IFwifFwiKSB7XHJcblx0XHRcdFx0Ly8gc3dhcCBvdXQgcGlwZXMgd2l0aCBcXHgwMSBjaGFyYWN0ZXJcclxuXHRcdFx0XHR3aWtpdGV4dCA9IHN0clJlcGxhY2VBdCh3aWtpdGV4dCwgaSxcIlxceDAxXCIpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKC9eLS0+Ly50ZXN0KHdpa2l0ZXh0LnNsaWNlKGksIGkgKyAzKSkpIHtcclxuXHRcdFx0XHRpbkNvbW1lbnQgPSBmYWxzZTtcclxuXHRcdFx0XHRpICs9IDI7XHJcblx0XHRcdH0gZWxzZSBpZiAoL148XFwvbm93aWtpID8+Ly50ZXN0KHdpa2l0ZXh0LnNsaWNlKGksIGkgKyAxMCkpKSB7XHJcblx0XHRcdFx0aW5Ob3dpa2kgPSBmYWxzZTtcclxuXHRcdFx0XHRpICs9IDg7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0fVxyXG5cdFxyXG5cdGlmICggcmVjdXJzaXZlICkge1xyXG5cdFx0dmFyIHN1YnRlbXBsYXRlcyA9IHJlc3VsdC5tYXAoZnVuY3Rpb24odGVtcGxhdGUpIHtcclxuXHRcdFx0cmV0dXJuIHRlbXBsYXRlLndpa2l0ZXh0LnNsaWNlKDIsLTIpO1xyXG5cdFx0fSlcclxuXHRcdFx0LmZpbHRlcihmdW5jdGlvbih0ZW1wbGF0ZVdpa2l0ZXh0KSB7XHJcblx0XHRcdFx0cmV0dXJuIC9cXHtcXHsuKlxcfVxcfS8udGVzdCh0ZW1wbGF0ZVdpa2l0ZXh0KTtcclxuXHRcdFx0fSlcclxuXHRcdFx0Lm1hcChmdW5jdGlvbih0ZW1wbGF0ZVdpa2l0ZXh0KSB7XHJcblx0XHRcdFx0cmV0dXJuIHBhcnNlVGVtcGxhdGVzKHRlbXBsYXRlV2lraXRleHQsIHRydWUpO1xyXG5cdFx0XHR9KTtcclxuXHRcdFxyXG5cdFx0cmV0dXJuIHJlc3VsdC5jb25jYXQuYXBwbHkocmVzdWx0LCBzdWJ0ZW1wbGF0ZXMpO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHJlc3VsdDsgXHJcbn07IC8qIGVzbGludC1lbmFibGUgbm8tY29udHJvbC1yZWdleCAqL1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7VGVtcGxhdGV8VGVtcGxhdGVbXX0gdGVtcGxhdGVzXHJcbiAqIEByZXR1cm4ge1Byb21pc2U8VGVtcGxhdGVbXT59XHJcbiAqL1xyXG52YXIgZ2V0V2l0aFJlZGlyZWN0VG8gPSBmdW5jdGlvbih0ZW1wbGF0ZXMpIHtcclxuXHR2YXIgdGVtcGxhdGVzQXJyYXkgPSBBcnJheS5pc0FycmF5KHRlbXBsYXRlcykgPyB0ZW1wbGF0ZXMgOiBbdGVtcGxhdGVzXTtcclxuXHRpZiAodGVtcGxhdGVzQXJyYXkubGVuZ3RoID09PSAwKSB7XHJcblx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlc29sdmUoW10pO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIEFQSS5nZXQoe1xyXG5cdFx0XCJhY3Rpb25cIjogXCJxdWVyeVwiLFxyXG5cdFx0XCJmb3JtYXRcIjogXCJqc29uXCIsXHJcblx0XHRcInRpdGxlc1wiOiB0ZW1wbGF0ZXNBcnJheS5tYXAodGVtcGxhdGUgPT4gdGVtcGxhdGUuZ2V0VGl0bGUoKS5nZXRQcmVmaXhlZFRleHQoKSksXHJcblx0XHRcInJlZGlyZWN0c1wiOiAxXHJcblx0fSkudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcclxuXHRcdGlmICggIXJlc3VsdCB8fCAhcmVzdWx0LnF1ZXJ5ICkge1xyXG5cdFx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdChcIkVtcHR5IHJlc3BvbnNlXCIpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKCByZXN1bHQucXVlcnkucmVkaXJlY3RzICkge1xyXG5cdFx0XHRyZXN1bHQucXVlcnkucmVkaXJlY3RzLmZvckVhY2goZnVuY3Rpb24ocmVkaXJlY3QpIHtcclxuXHRcdFx0XHR2YXIgaSA9IHRlbXBsYXRlc0FycmF5LmZpbmRJbmRleCh0ZW1wbGF0ZSA9PiB0ZW1wbGF0ZS5nZXRUaXRsZSgpLmdldFByZWZpeGVkVGV4dCgpID09PSByZWRpcmVjdC5mcm9tKTtcclxuXHRcdFx0XHRpZiAoaSAhPT0gLTEpIHtcclxuXHRcdFx0XHRcdHRlbXBsYXRlc0FycmF5W2ldLnJlZGlyZWN0VGFyZ2V0ID0gbXcuVGl0bGUubmV3RnJvbVRleHQocmVkaXJlY3QudG8pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGVtcGxhdGVzQXJyYXk7XHJcblx0fSk7XHJcbn07XHJcblxyXG5UZW1wbGF0ZS5wcm90b3R5cGUuZ2V0RGF0YUZvclBhcmFtID0gZnVuY3Rpb24oa2V5LCBwYXJhTmFtZSkge1xyXG5cdGlmICggIXRoaXMucGFyYW1EYXRhICkge1xyXG5cdFx0cmV0dXJuIG51bGw7XHJcblx0fVxyXG5cdC8vIElmIGFsaWFzLCBzd2l0Y2ggZnJvbSBhbGlhcyB0byBwcmVmZXJyZWQgcGFyYW1ldGVyIG5hbWVcclxuXHR2YXIgcGFyYSA9IHRoaXMucGFyYW1BbGlhc2VzW3BhcmFOYW1lXSB8fCBwYXJhTmFtZTtcdFxyXG5cdGlmICggIXRoaXMucGFyYW1EYXRhW3BhcmFdICkge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHRcclxuXHR2YXIgZGF0YSA9IHRoaXMucGFyYW1EYXRhW3BhcmFdW2tleV07XHJcblx0Ly8gRGF0YSBtaWdodCBhY3R1YWxseSBiZSBhbiBvYmplY3Qgd2l0aCBrZXkgXCJlblwiXHJcblx0aWYgKCBkYXRhICYmIGRhdGEuZW4gJiYgIUFycmF5LmlzQXJyYXkoZGF0YSkgKSB7XHJcblx0XHRyZXR1cm4gZGF0YS5lbjtcclxuXHR9XHJcblx0cmV0dXJuIGRhdGE7XHJcbn07XHJcblxyXG5UZW1wbGF0ZS5wcm90b3R5cGUuc2V0UGFyYW1EYXRhQW5kU3VnZ2VzdGlvbnMgPSBmdW5jdGlvbigpIHtcclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblx0dmFyIHBhcmFtRGF0YVNldCA9ICQuRGVmZXJyZWQoKTtcclxuXHRcclxuXHRpZiAoIHNlbGYucGFyYW1EYXRhICkgeyByZXR1cm4gcGFyYW1EYXRhU2V0LnJlc29sdmUoKTsgfVxyXG4gICAgXHJcblx0dmFyIHByZWZpeGVkVGV4dCA9IHNlbGYucmVkaXJlY3RzVG9cclxuXHRcdD8gc2VsZi5yZWRpcmVjdHNUby5nZXRQcmVmaXhlZFRleHQoKVxyXG5cdFx0OiBzZWxmLmdldFRpdGxlKCkuZ2V0UHJlZml4ZWRUZXh0KCk7XHJcblxyXG5cdHZhciBjYWNoZWRJbmZvID0gY2FjaGUucmVhZChwcmVmaXhlZFRleHQgKyBcIi1wYXJhbXNcIik7XHJcblx0XHJcblx0aWYgKFxyXG5cdFx0Y2FjaGVkSW5mbyAmJlxyXG5cdFx0Y2FjaGVkSW5mby52YWx1ZSAmJlxyXG5cdFx0Y2FjaGVkSW5mby5zdGFsZURhdGUgJiZcclxuXHRcdGNhY2hlZEluZm8udmFsdWUucGFyYW1EYXRhICE9IG51bGwgJiZcclxuXHRcdGNhY2hlZEluZm8udmFsdWUucGFyYW1ldGVyU3VnZ2VzdGlvbnMgIT0gbnVsbCAmJlxyXG5cdFx0Y2FjaGVkSW5mby52YWx1ZS5wYXJhbUFsaWFzZXMgIT0gbnVsbFxyXG5cdCkge1xyXG5cdFx0c2VsZi5ub3RlbXBsYXRlZGF0YSA9IGNhY2hlZEluZm8udmFsdWUubm90ZW1wbGF0ZWRhdGE7XHJcblx0XHRzZWxmLnBhcmFtRGF0YSA9IGNhY2hlZEluZm8udmFsdWUucGFyYW1EYXRhO1xyXG5cdFx0c2VsZi5wYXJhbWV0ZXJTdWdnZXN0aW9ucyA9IGNhY2hlZEluZm8udmFsdWUucGFyYW1ldGVyU3VnZ2VzdGlvbnM7XHJcblx0XHRzZWxmLnBhcmFtQWxpYXNlcyA9IGNhY2hlZEluZm8udmFsdWUucGFyYW1BbGlhc2VzO1xyXG5cdFx0XHJcblx0XHRwYXJhbURhdGFTZXQucmVzb2x2ZSgpO1xyXG5cdFx0aWYgKCAhaXNBZnRlckRhdGUoY2FjaGVkSW5mby5zdGFsZURhdGUpICkge1xyXG5cdFx0XHQvLyBKdXN0IHVzZSB0aGUgY2FjaGVkIGRhdGFcclxuXHRcdFx0cmV0dXJuIHBhcmFtRGF0YVNldDtcclxuXHRcdH0gLy8gZWxzZTogVXNlIHRoZSBjYWNoZSBkYXRhIGZvciBub3csIGJ1dCBhbHNvIGZldGNoIG5ldyBkYXRhIGZyb20gQVBJXHJcblx0fVxyXG5cdFxyXG5cdEFQSS5nZXQoe1xyXG5cdFx0YWN0aW9uOiBcInRlbXBsYXRlZGF0YVwiLFxyXG5cdFx0dGl0bGVzOiBwcmVmaXhlZFRleHQsXHJcblx0XHRyZWRpcmVjdHM6IDEsXHJcblx0XHRpbmNsdWRlTWlzc2luZ1RpdGxlczogMVxyXG5cdH0pXHJcblx0XHQudGhlbihcclxuXHRcdFx0ZnVuY3Rpb24ocmVzcG9uc2UpIHsgcmV0dXJuIHJlc3BvbnNlOyB9LFxyXG5cdFx0XHRmdW5jdGlvbigvKmVycm9yKi8pIHsgcmV0dXJuIG51bGw7IH0gLy8gSWdub3JlIGVycm9ycywgd2lsbCB1c2UgZGVmYXVsdCBkYXRhXHJcblx0XHQpXHJcblx0XHQudGhlbiggZnVuY3Rpb24ocmVzdWx0KSB7XHJcblx0XHQvLyBGaWd1cmUgb3V0IHBhZ2UgaWQgKGJlYWN1c2UgYWN0aW9uPXRlbXBsYXRlZGF0YSBkb2Vzbid0IGhhdmUgYW4gaW5kZXhwYWdlaWRzIG9wdGlvbilcclxuXHRcdFx0dmFyIGlkID0gcmVzdWx0ICYmICQubWFwKHJlc3VsdC5wYWdlcywgZnVuY3Rpb24oIF92YWx1ZSwga2V5ICkgeyByZXR1cm4ga2V5OyB9KTtcclxuXHRcdFxyXG5cdFx0XHRpZiAoICFyZXN1bHQgfHwgIXJlc3VsdC5wYWdlc1tpZF0gfHwgcmVzdWx0LnBhZ2VzW2lkXS5ub3RlbXBsYXRlZGF0YSB8fCAhcmVzdWx0LnBhZ2VzW2lkXS5wYXJhbXMgKSB7XHJcblx0XHRcdC8vIE5vIFRlbXBsYXRlRGF0YSwgc28gdXNlIGRlZmF1bHRzIChndWVzc2VzKVxyXG5cdFx0XHRcdHNlbGYubm90ZW1wbGF0ZWRhdGEgPSB0cnVlO1xyXG5cdFx0XHRcdHNlbGYudGVtcGxhdGVkYXRhQXBpRXJyb3IgPSAhcmVzdWx0O1xyXG5cdFx0XHRcdHNlbGYucGFyYW1EYXRhID0gY29uZmlnLmRlZmF1bHRQYXJhbWV0ZXJEYXRhO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHNlbGYucGFyYW1EYXRhID0gcmVzdWx0LnBhZ2VzW2lkXS5wYXJhbXM7XHJcblx0XHRcdH1cclxuICAgICAgICBcclxuXHRcdFx0c2VsZi5wYXJhbUFsaWFzZXMgPSB7fTtcclxuXHRcdFx0JC5lYWNoKHNlbGYucGFyYW1EYXRhLCBmdW5jdGlvbihwYXJhTmFtZSwgcGFyYURhdGEpIHtcclxuXHRcdFx0XHQvLyBFeHRyYWN0IGFsaWFzZXMgZm9yIGVhc2llciByZWZlcmVuY2UgbGF0ZXIgb25cclxuXHRcdFx0XHRpZiAoIHBhcmFEYXRhLmFsaWFzZXMgJiYgcGFyYURhdGEuYWxpYXNlcy5sZW5ndGggKSB7XHJcblx0XHRcdFx0XHRwYXJhRGF0YS5hbGlhc2VzLmZvckVhY2goZnVuY3Rpb24oYWxpYXMpe1xyXG5cdFx0XHRcdFx0XHRzZWxmLnBhcmFtQWxpYXNlc1thbGlhc10gPSBwYXJhTmFtZTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHQvLyBFeHRyYWN0IGFsbG93ZWQgdmFsdWVzIGFycmF5IGZyb20gZGVzY3JpcHRpb25cclxuXHRcdFx0XHRpZiAoIHBhcmFEYXRhLmRlc2NyaXB0aW9uICYmIC9cXFsuKicuKz8nLio/XFxdLy50ZXN0KHBhcmFEYXRhLmRlc2NyaXB0aW9uLmVuKSApIHtcclxuXHRcdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHRcdHZhciBhbGxvd2VkVmFscyA9IEpTT04ucGFyc2UoXHJcblx0XHRcdFx0XHRcdFx0cGFyYURhdGEuZGVzY3JpcHRpb24uZW5cclxuXHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC9eLipcXFsvLFwiW1wiKVxyXG5cdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoL1wiL2csIFwiXFxcXFxcXCJcIilcclxuXHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC8nL2csIFwiXFxcIlwiKVxyXG5cdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoLyxcXHMqXS8sIFwiXVwiKVxyXG5cdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoL10uKiQvLCBcIl1cIilcclxuXHRcdFx0XHRcdFx0KTtcclxuXHRcdFx0XHRcdFx0c2VsZi5wYXJhbURhdGFbcGFyYU5hbWVdLmFsbG93ZWRWYWx1ZXMgPSBhbGxvd2VkVmFscztcclxuXHRcdFx0XHRcdH0gY2F0Y2goZSkge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oXCJbUmF0ZXJdIENvdWxkIG5vdCBwYXJzZSBhbGxvd2VkIHZhbHVlcyBpbiBkZXNjcmlwdGlvbjpcXG4gIFwiK1xyXG5cdFx0XHRcdFx0cGFyYURhdGEuZGVzY3JpcHRpb24uZW4gKyBcIlxcbiBDaGVjayBUZW1wbGF0ZURhdGEgZm9yIHBhcmFtZXRlciB8XCIgKyBwYXJhTmFtZSArXHJcblx0XHRcdFx0XHRcIj0gaW4gXCIgKyBzZWxmLmdldFRpdGxlKCkuZ2V0UHJlZml4ZWRUZXh0KCkpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHQvLyBNYWtlIHN1cmUgcmVxdWlyZWQvc3VnZ2VzdGVkIHBhcmFtZXRlcnMgYXJlIHByZXNlbnRcclxuXHRcdFx0XHRpZiAoIChwYXJhRGF0YS5yZXF1aXJlZCB8fCBwYXJhRGF0YS5zdWdnZXN0ZWQpICYmICFzZWxmLmdldFBhcmFtKHBhcmFOYW1lKSApIHtcclxuXHRcdFx0XHQvLyBDaGVjayBpZiBhbHJlYWR5IHByZXNlbnQgaW4gYW4gYWxpYXMsIGlmIGFueVxyXG5cdFx0XHRcdFx0aWYgKCBwYXJhRGF0YS5hbGlhc2VzLmxlbmd0aCApIHtcclxuXHRcdFx0XHRcdFx0dmFyIGFsaWFzZXMgPSBzZWxmLnBhcmFtZXRlcnMuZmlsdGVyKHAgPT4ge1xyXG5cdFx0XHRcdFx0XHRcdHZhciBpc0FsaWFzID0gcGFyYURhdGEuYWxpYXNlcy5pbmNsdWRlcyhwLm5hbWUpO1xyXG5cdFx0XHRcdFx0XHRcdHZhciBpc0VtcHR5ID0gIXAudmFsO1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybiBpc0FsaWFzICYmICFpc0VtcHR5O1xyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdFx0aWYgKCBhbGlhc2VzLmxlbmd0aCApIHtcclxuXHRcdFx0XHRcdFx0Ly8gQXQgbGVhc3Qgb25lIG5vbi1lbXB0eSBhbGlhcywgc28gZG8gbm90aGluZ1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Ly8gTm8gbm9uLWVtcHR5IGFsaWFzZXMsIHNvIHNldCBwYXJhbWV0ZXIgdG8gZWl0aGVyIHRoZSBhdXRvdmF1bGUsIG9yXHJcblx0XHRcdFx0XHQvLyBhbiBlbXB0eSBzdHJpbmcgKHdpdGhvdXQgdG91Y2hpbmcsIHVubGVzcyBpdCBpcyBhIHJlcXVpcmVkIHBhcmFtZXRlcilcclxuXHRcdFx0XHRcdHNlbGYucGFyYW1ldGVycy5wdXNoKHtcclxuXHRcdFx0XHRcdFx0bmFtZTpwYXJhTmFtZSxcclxuXHRcdFx0XHRcdFx0dmFsdWU6IHBhcmFEYXRhLmF1dG92YWx1ZSB8fCBcIlwiLFxyXG5cdFx0XHRcdFx0XHRhdXRvZmlsbGVkOiB0cnVlXHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0XHJcblx0XHRcdC8vIE1ha2Ugc3VnZ2VzdGlvbnMgZm9yIGNvbWJvYm94XHJcblx0XHRcdHZhciBhbGxQYXJhbXNBcnJheSA9ICggIXNlbGYubm90ZW1wbGF0ZWRhdGEgJiYgcmVzdWx0LnBhZ2VzW2lkXS5wYXJhbU9yZGVyICkgfHxcclxuXHRcdFx0JC5tYXAoc2VsZi5wYXJhbURhdGEsIGZ1bmN0aW9uKF92YWwsIGtleSl7XHJcblx0XHRcdFx0cmV0dXJuIGtleTtcclxuXHRcdFx0fSk7XHJcblx0XHRcdHNlbGYucGFyYW1ldGVyU3VnZ2VzdGlvbnMgPSBhbGxQYXJhbXNBcnJheS5maWx0ZXIoZnVuY3Rpb24ocGFyYW1OYW1lKSB7XHJcblx0XHRcdFx0cmV0dXJuICggcGFyYW1OYW1lICYmIHBhcmFtTmFtZSAhPT0gXCJjbGFzc1wiICYmIHBhcmFtTmFtZSAhPT0gXCJpbXBvcnRhbmNlXCIgKTtcclxuXHRcdFx0fSlcclxuXHRcdFx0XHQubWFwKGZ1bmN0aW9uKHBhcmFtTmFtZSkge1xyXG5cdFx0XHRcdFx0dmFyIG9wdGlvbk9iamVjdCA9IHtkYXRhOiBwYXJhbU5hbWV9O1xyXG5cdFx0XHRcdFx0dmFyIGxhYmVsID0gc2VsZi5nZXREYXRhRm9yUGFyYW0obGFiZWwsIHBhcmFtTmFtZSk7XHJcblx0XHRcdFx0XHRpZiAoIGxhYmVsICkge1xyXG5cdFx0XHRcdFx0XHRvcHRpb25PYmplY3QubGFiZWwgPSBsYWJlbCArIFwiICh8XCIgKyBwYXJhbU5hbWUgKyBcIj0pXCI7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRyZXR1cm4gb3B0aW9uT2JqZWN0O1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHJcblx0XHRcdGlmICggc2VsZi50ZW1wbGF0ZWRhdGFBcGlFcnJvciApIHtcclxuXHRcdFx0XHQvLyBEb24ndCBzYXZlIGRlZmF1bHRzL2d1ZXNzZXMgdG8gY2FjaGU7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH1cclxuXHRcdFxyXG5cdFx0XHRjYWNoZS53cml0ZShwcmVmaXhlZFRleHQgKyBcIi1wYXJhbXNcIiwge1xyXG5cdFx0XHRcdG5vdGVtcGxhdGVkYXRhOiBzZWxmLm5vdGVtcGxhdGVkYXRhLFxyXG5cdFx0XHRcdHBhcmFtRGF0YTogc2VsZi5wYXJhbURhdGEsXHJcblx0XHRcdFx0cGFyYW1ldGVyU3VnZ2VzdGlvbnM6IHNlbGYucGFyYW1ldGVyU3VnZ2VzdGlvbnMsXHJcblx0XHRcdFx0cGFyYW1BbGlhc2VzOiBzZWxmLnBhcmFtQWxpYXNlc1xyXG5cdFx0XHR9LFx0MVxyXG5cdFx0XHQpO1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH0pXHJcblx0XHQudGhlbihcclxuXHRcdFx0cGFyYW1EYXRhU2V0LnJlc29sdmUsXHJcblx0XHRcdHBhcmFtRGF0YVNldC5yZWplY3RcclxuXHRcdCk7XHJcblx0XHJcblx0cmV0dXJuIHBhcmFtRGF0YVNldDtcdFxyXG59O1xyXG5cclxuZXhwb3J0IHtUZW1wbGF0ZSwgcGFyc2VUZW1wbGF0ZXMsIGdldFdpdGhSZWRpcmVjdFRvfTsiLCJpbXBvcnQgUGFyYW1ldGVyV2lkZ2V0IGZyb20gXCIuL1BhcmFtZXRlcldpZGdldFwiO1xyXG5pbXBvcnQgU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldCBmcm9tIFwiLi9TdWdnZXN0aW9uTG9va3VwVGV4dElucHV0V2lkZ2V0XCI7XHJcblxyXG4vKiBUYXJnZXQgb3V0cHV0IChmcm9tIHJhdGVyIHYxKTpcclxuLy8gSFRNTFxyXG48c3BhbiBjbGFzcz1cInJhdGVyLWRpYWxvZy1wYXJhSW5wdXQgcmF0ZXItZGlhbG9nLXRleHRJbnB1dENvbnRhaW5lclwiPlxyXG5cdDxsYWJlbD48c3BhbiBjbGFzcz1cInJhdGVyLWRpYWxvZy1wYXJhLWNvZGVcIj5jYXRlZ29yeTwvc3Bhbj48L2xhYmVsPlxyXG5cdDxpbnB1dCB0eXBlPVwidGV4dFwiLz48YSB0aXRsZT1cInJlbW92ZVwiPng8L2E+PHdici8+XHJcbjwvc3Bhbj5cclxuLy8gQ1NTXHJcbi5yYXRlci1kaWFsb2ctcm93ID4gZGl2ID4gc3BhbiB7XHJcbiAgICBwYWRkaW5nLXJpZ2h0OiAwLjVlbTtcclxuICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XHJcbn1cclxuLnJhdGVyLWRpYWxvZy1hdXRvZmlsbCB7XHJcbiAgICBib3JkZXI6IDFweCBkYXNoZWQgI2NkMjBmZjtcclxuICAgIHBhZGRpbmc6IDAuMmVtO1xyXG4gICAgbWFyZ2luLXJpZ2h0OiAwLjJlbTtcclxufVxyXG5yYXRlci1kaWFsb2ctYXV0b2ZpbGw6OmFmdGVyIHtcclxuICAgIGNvbnRlbnQ6IFwiYXV0b2ZpbGxlZFwiO1xyXG4gICAgY29sb3I6ICNjZDIwZmY7XHJcbiAgICBmb250LXdlaWdodDogYm9sZDtcclxuICAgIGZvbnQtc2l6ZTogOTYlO1xyXG59XHJcbiovXHJcblxyXG5mdW5jdGlvbiBCYW5uZXJXaWRnZXQoIHRlbXBsYXRlLCBjb25maWcgKSB7XHJcblx0Ly8gQ29uZmlndXJhdGlvbiBpbml0aWFsaXphdGlvblxyXG5cdGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcclxuXHQvLyBDYWxsIHBhcmVudCBjb25zdHJ1Y3RvclxyXG5cdEJhbm5lcldpZGdldC5zdXBlci5jYWxsKCB0aGlzLCBjb25maWcgKTtcclxuXHJcblx0dGhpcy50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xyXG5cclxuXHQvLyBDcmVhdGUgYSBsYXlvdXRcclxuXHR0aGlzLmxheW91dCA9IG5ldyBPTy51aS5GaWVsZHNldExheW91dCgpO1xyXG5cdFxyXG5cdC8vIHRoaXMubWFpbkxhYmVsID0gbmV3IE9PLnVpLkxhYmVsV2lkZ2V0KHtcclxuXHQvLyBcdGxhYmVsOiBcInt7XCIgKyB0aGlzLnRlbXBsYXRlLmdldFRpdGxlKCkuZ2V0TWFpblRleHQoKSArIFwifX1cIixcclxuXHQvLyB9KTtcclxuXHJcblx0dGhpcy5yZW1vdmVCdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KCB7XHJcblx0XHRpY29uOiBcInRyYXNoXCIsXHJcblx0XHRsYWJlbDogXCJSZW1vdmUgYmFubmVyXCIsXHJcblx0XHR0aXRsZTogXCJSZW1vdmUgYmFubmVyXCIsXHJcblx0XHRmbGFnczogXCJkZXN0cnVjdGl2ZVwiLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8ZGl2IHN0eWxlPVxcXCJ3aWR0aDoxMDAlXFxcIj5cIilcclxuXHR9ICk7XHJcblx0dGhpcy5jbGVhckJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoIHtcclxuXHRcdGljb246IFwiY2FuY2VsXCIsXHJcblx0XHRsYWJlbDogXCJDbGVhciBwYXJhbWV0ZXJzXCIsXHJcblx0XHR0aXRsZTogXCJDbGVhciBwYXJhbWV0ZXJzXCIsXHJcblx0XHRmbGFnczogXCJkZXN0cnVjdGl2ZVwiLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8ZGl2IHN0eWxlPVxcXCJ3aWR0aDoxMDAlXFxcIj5cIilcclxuXHR9ICk7XHJcblx0dGhpcy5ieXBhc3NCdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KCB7XHJcblx0XHRpY29uOiBcImFydGljbGVSZWRpcmVjdFwiLFxyXG5cdFx0bGFiZWw6IFwiQnlwYXNzIHJlZGlyZWN0XCIsXHJcblx0XHR0aXRsZTogXCJCeXBhc3MgcmVkaXJlY3RcIixcclxuXHRcdCRlbGVtZW50OiAkKFwiPGRpdiBzdHlsZT1cXFwid2lkdGg6MTAwJVxcXCI+XCIpXHJcblx0fSApO1xyXG5cdHRoaXMucmVtb3ZlQnV0dG9uLiRlbGVtZW50LmZpbmQoXCJhXCIpLmNzcyhcIndpZHRoXCIsXCIxMDAlXCIpO1xyXG5cdHRoaXMuY2xlYXJCdXR0b24uJGVsZW1lbnQuZmluZChcImFcIikuY3NzKFwid2lkdGhcIixcIjEwMCVcIik7XHJcblx0dGhpcy5ieXBhc3NCdXR0b24uJGVsZW1lbnQuZmluZChcImFcIikuY3NzKFwid2lkdGhcIixcIjEwMCVcIik7XHJcblxyXG5cdHRoaXMudGl0bGVCdXR0b25zR3JvdXAgPSBuZXcgT08udWkuQnV0dG9uR3JvdXBXaWRnZXQoIHtcclxuXHRcdGl0ZW1zOiB0ZW1wbGF0ZS5yZWRpcmVjdFRhcmdldFxyXG5cdFx0XHQ/IFsgdGhpcy5yZW1vdmVCdXR0b24sXHJcblx0XHRcdFx0dGhpcy5jbGVhckJ1dHRvbixcclxuXHRcdFx0XHR0aGlzLmJ5cGFzc0J1dHRvbiBdXHJcblx0XHRcdDogWyB0aGlzLnJlbW92ZUJ1dHRvbixcclxuXHRcdFx0XHR0aGlzLmNsZWFyQnV0dG9uIF0sXHJcblx0XHQkZWxlbWVudDogJChcIjxzcGFuIHN0eWxlPSd3aWR0aDoxMDAlOyc+XCIpLFxyXG5cdH0gKTtcclxuXHJcblx0dGhpcy5tYWluTGFiZWxQb3B1cEJ1dHRvbiA9IG5ldyBPTy51aS5Qb3B1cEJ1dHRvbldpZGdldCgge1xyXG5cdFx0bGFiZWw6IFwie3tcIiArIHRoaXMudGVtcGxhdGUuZ2V0VGl0bGUoKS5nZXRNYWluVGV4dCgpICsgXCJ9fVwiLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8c3BhbiBzdHlsZT0nZGlzcGxheTppbmxpbmUtYmxvY2s7d2lkdGg6NDglO21hcmdpbi1yaWdodDowO3BhZGRpbmctcmlnaHQ6OHB4Jz5cIiksXHJcblx0XHRpbmRpY2F0b3I6XCJkb3duXCIsXHJcblx0XHRmcmFtZWQ6ZmFsc2UsXHJcblx0XHRwb3B1cDoge1xyXG5cdFx0XHQkY29udGVudDogdGhpcy50aXRsZUJ1dHRvbnNHcm91cC4kZWxlbWVudCxcclxuXHRcdFx0d2lkdGg6IDIwMCxcclxuXHRcdFx0cGFkZGVkOiBmYWxzZSxcclxuXHRcdFx0YWxpZ246IFwiZm9yY2UtcmlnaHRcIixcclxuXHRcdFx0YW5jaG9yOiBmYWxzZVxyXG5cdFx0fVxyXG5cdH0gKTtcclxuXHR0aGlzLm1haW5MYWJlbFBvcHVwQnV0dG9uLiRlbGVtZW50XHJcblx0XHQuY2hpbGRyZW4oXCJhXCIpLmZpcnN0KCkuY3NzKHtcImZvbnQtc2l6ZVwiOlwiMTEwJVwifSlcclxuXHRcdC5maW5kKFwic3Bhbi5vby11aS1sYWJlbEVsZW1lbnQtbGFiZWxcIikuY3NzKHtcIndoaXRlLXNwYWNlXCI6XCJub3JtYWxcIn0pO1xyXG5cclxuXHQvLyBSYXRpbmcgZHJvcGRvd25zXHJcblx0dGhpcy5jbGFzc0Ryb3Bkb3duID0gbmV3IE9PLnVpLkRyb3Bkb3duV2lkZ2V0KCB7XHJcblx0XHRsYWJlbDogbmV3IE9PLnVpLkh0bWxTbmlwcGV0KFwiPHNwYW4gc3R5bGU9XFxcImNvbG9yOiM3NzdcXFwiPkNsYXNzPC9zcGFuPlwiKSxcclxuXHRcdG1lbnU6IHsgLy8gRklYTUU6IG5lZWRzIHJlYWwgZGF0YVxyXG5cdFx0XHRpdGVtczogW1xyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcIlwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiIFwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcIkJcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIkJcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJDXCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJDXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwic3RhcnRcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIlN0YXJ0XCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdF1cclxuXHRcdH0sXHJcblx0XHQkZWxlbWVudDogJChcIjxzcGFuIHN0eWxlPSdkaXNwbGF5OmlubGluZS1ibG9jazt3aWR0aDoyNCUnPlwiKSxcclxuXHRcdCRvdmVybGF5OiB0aGlzLiRvdmVybGF5LFxyXG5cdH0gKTtcclxuXHR0aGlzLmltcG9ydGFuY2VEcm9wZG93biA9IG5ldyBPTy51aS5Ecm9wZG93bldpZGdldCgge1xyXG5cdFx0bGFiZWw6IG5ldyBPTy51aS5IdG1sU25pcHBldChcIjxzcGFuIHN0eWxlPVxcXCJjb2xvcjojNzc3XFxcIj5JbXBvcnRhbmNlPC9zcGFuPlwiKSxcclxuXHRcdG1lbnU6IHsgLy8gRklYTUU6IG5lZWRzIHJlYWwgZGF0YVxyXG5cdFx0XHRpdGVtczogW1xyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcIlwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiIFwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcInRvcFwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiVG9wXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwiaGlnaFwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiSGlnaFwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcIm1pZFwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiTWlkXCJcclxuXHRcdFx0XHR9IClcclxuXHRcdFx0XVxyXG5cdFx0fSxcclxuXHRcdCRlbGVtZW50OiAkKFwiPHNwYW4gc3R5bGU9J2Rpc3BsYXk6aW5saW5lLWJsb2NrO3dpZHRoOjI0JSc+XCIpLFxyXG5cdFx0JG92ZXJsYXk6IHRoaXMuJG92ZXJsYXksXHJcblx0fSApO1xyXG5cdHRoaXMudGl0bGVsYXlvdXQgPSBuZXcgT08udWkuSG9yaXpvbnRhbExheW91dCgge1xyXG5cdFx0aXRlbXM6IFtcclxuXHRcdFx0dGhpcy5tYWluTGFiZWxQb3B1cEJ1dHRvbixcclxuXHRcdFx0dGhpcy5jbGFzc0Ryb3Bkb3duLFxyXG5cdFx0XHR0aGlzLmltcG9ydGFuY2VEcm9wZG93bixcclxuXHRcdF1cclxuXHR9ICk7XHJcblxyXG5cdHZhciBwYXJhbWV0ZXJXaWRnZXRzID0gdGhpcy50ZW1wbGF0ZS5wYXJhbWV0ZXJzXHJcblx0XHQuZmlsdGVyKHBhcmFtID0+IHBhcmFtLm5hbWUgIT09IFwiY2xhc3NcIiAmJiBwYXJhbS5uYW1lICE9PSBcImltcG9ydGFuY2VcIilcclxuXHRcdC5tYXAocGFyYW0gPT4gbmV3IFBhcmFtZXRlcldpZGdldChwYXJhbSwgdGhpcy50ZW1wbGF0ZS5wYXJhbURhdGFbcGFyYW0ubmFtZV0pKTtcclxuXHQvLyBMaW1pdCBob3cgbWFueSBwYXJhbWV0ZXJzIHdpbGwgYmUgZGlzcGxheWVkIGluaXRpYWxseVxyXG5cdHZhciBpbml0aWFsUGFyYW1ldGVyTGltaXQgPSA1O1xyXG5cdC8vIEJ1dCBvbmx5IGhpZGUgaWYgdGhlcmUncyBtb3JlIHRoYW4gb25lIHRvIGhpZGUgKG90aGVyd2lzZSwgaXQncyBub3QgbXVjaCBvZiBhIHNwYWNlIHNhdmluZ1xyXG5cdC8vIGFuZCBqdXN0IGFubm95aW5nIGZvciB1c2VycylcclxuXHR2YXIgaGlkZVNvbWVQYXJhbXMgPSBwYXJhbWV0ZXJXaWRnZXRzLmxlbmd0aCA+IGluaXRpYWxQYXJhbWV0ZXJMaW1pdCArIDE7XHJcblx0aWYgKGhpZGVTb21lUGFyYW1zKSB7XHJcblx0XHRwYXJhbWV0ZXJXaWRnZXRzLmZvckVhY2goKHBhcmFtZXRlcldpZGdldCwgaW5kZXgpID0+IHtcclxuXHRcdFx0cGFyYW1ldGVyV2lkZ2V0LnRvZ2dsZShpbmRleCA8IGluaXRpYWxQYXJhbWV0ZXJMaW1pdCk7XHJcblx0XHR9KTtcclxuXHR9XHJcblx0XHJcblx0dGhpcy5zaG93TW9yZVBhcmFtZXRlcnNCdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KHtcclxuXHRcdGxhYmVsOiBcIlNob3cgXCIrKHBhcmFtZXRlcldpZGdldHMubGVuZ3RoIC0gaW5pdGlhbFBhcmFtZXRlckxpbWl0KStcIiBtb3JlIHBhcmFtdGVyc1wiLFxyXG5cdFx0ZnJhbWVkOiBmYWxzZSxcclxuXHRcdCRlbGVtZW50OiAkKFwiPHNwYW4gc3R5bGU9J21hcmdpbi1ib3R0b206MCc+XCIpXHJcblx0fSk7XHJcblxyXG5cdHRoaXMuc2hvd0FkZFBhcmFtZXRlcklucHV0c0J1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoe1xyXG5cdFx0bGFiZWw6IFwiQWRkIHBhcmFtdGVyXCIsXHJcblx0XHRpY29uOiBcImFkZFwiLFxyXG5cdFx0ZnJhbWVkOiBmYWxzZSxcclxuXHRcdCRlbGVtZW50OiAkKFwiPHNwYW4gc3R5bGU9J21hcmdpbi1ib3R0b206MCc+XCIpXHJcblx0fSk7XHJcblxyXG5cdHRoaXMucGFyYW1ldGVyV2lkZ2V0c0xheW91dCA9IG5ldyBPTy51aS5Ib3Jpem9udGFsTGF5b3V0KCB7XHJcblx0XHRpdGVtczogaGlkZVNvbWVQYXJhbXNcclxuXHRcdFx0PyBbIC4uLnBhcmFtZXRlcldpZGdldHMsXHJcblx0XHRcdFx0dGhpcy5zaG93TW9yZVBhcmFtZXRlcnNCdXR0b24sXHJcblx0XHRcdFx0dGhpcy5zaG93QWRkUGFyYW1ldGVySW5wdXRzQnV0dG9uIF1cclxuXHRcdFx0OiBbLi4ucGFyYW1ldGVyV2lkZ2V0cywgdGhpcy5zaG93QWRkUGFyYW1ldGVySW5wdXRzQnV0dG9uIF1cclxuXHR9ICk7XHJcblxyXG5cdHRoaXMuYWRkUGFyYW1ldGVyTmFtZUlucHV0ID0gbmV3IFN1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXQoe1xyXG5cdFx0c3VnZ2VzdGlvbnM6IHRoaXMudGVtcGxhdGUucGFyYW1ldGVyU3VnZ2VzdGlvbnMsXHJcblx0XHRwbGFjZWhvbGRlcjogXCJwYXJhbWV0ZXIgbmFtZVwiLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZS1ibG9jazt3aWR0aDo0MCUnPlwiKSxcclxuXHRcdHZhbGlkYXRlOiBmdW5jdGlvbih2YWwpIHtcclxuXHRcdFx0bGV0IHt2YWxpZE5hbWUsIG5hbWUsIHZhbHVlfSA9IHRoaXMuZ2V0QWRkUGFyYW1ldGVyc0luZm8odmFsKTtcclxuXHRcdFx0cmV0dXJuICghbmFtZSAmJiAhdmFsdWUpID8gdHJ1ZSA6IHZhbGlkTmFtZTtcclxuXHRcdH0uYmluZCh0aGlzKVxyXG5cdH0pO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyVmFsdWVJbnB1dCA9IG5ldyBTdWdnZXN0aW9uTG9va3VwVGV4dElucHV0V2lkZ2V0KHtcclxuXHRcdHBsYWNlaG9sZGVyOiBcInBhcmFtZXRlciB2YWx1ZVwiLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZS1ibG9jazt3aWR0aDo0MCUnPlwiKSxcclxuXHRcdHZhbGlkYXRlOiBmdW5jdGlvbih2YWwpIHtcclxuXHRcdFx0bGV0IHt2YWxpZFZhbHVlLCBuYW1lLCB2YWx1ZX0gPSB0aGlzLmdldEFkZFBhcmFtZXRlcnNJbmZvKG51bGwsIHZhbCk7XHJcblx0XHRcdHJldHVybiAoIW5hbWUgJiYgIXZhbHVlKSA/IHRydWUgOiB2YWxpZFZhbHVlO1xyXG5cdFx0fS5iaW5kKHRoaXMpXHJcblx0fSk7XHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJCdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KHtcclxuXHRcdGxhYmVsOiBcIkFkZFwiLFxyXG5cdFx0aWNvbjogXCJhZGRcIixcclxuXHRcdGZsYWdzOiBcInByb2dyZXNzaXZlXCJcclxuXHR9KS5zZXREaXNhYmxlZCh0cnVlKTtcclxuXHR0aGlzLmFkZFBhcmFtZXRlckNvbnRyb2xzID0gbmV3IE9PLnVpLkhvcml6b250YWxMYXlvdXQoIHtcclxuXHRcdGl0ZW1zOiBbXHJcblx0XHRcdHRoaXMuYWRkUGFyYW1ldGVyTmFtZUlucHV0LFxyXG5cdFx0XHRuZXcgT08udWkuTGFiZWxXaWRnZXQoe2xhYmVsOlwiPVwifSksXHJcblx0XHRcdHRoaXMuYWRkUGFyYW1ldGVyVmFsdWVJbnB1dCxcclxuXHRcdFx0dGhpcy5hZGRQYXJhbWV0ZXJCdXR0b25cclxuXHRcdF1cclxuXHR9ICk7XHJcblx0Ly8gSGFja3MgdG8gbWFrZSB0aGlzIEhvcml6b250YWxMYXlvdXQgZ28gaW5zaWRlIGEgRmllbGRMYXlvdXRcclxuXHR0aGlzLmFkZFBhcmFtZXRlckNvbnRyb2xzLmdldElucHV0SWQgPSAoKSA9PiBmYWxzZTtcclxuXHR0aGlzLmFkZFBhcmFtZXRlckNvbnRyb2xzLmlzRGlzYWJsZWQgPSAoKSA9PiBmYWxzZTtcclxuXHR0aGlzLmFkZFBhcmFtZXRlckNvbnRyb2xzLnNpbXVsYXRlTGFiZWxDbGljayA9ICgpID0+IHRydWU7XHJcblxyXG5cdHRoaXMuYWRkUGFyYW1ldGVyTGF5b3V0ID0gbmV3IE9PLnVpLkZpZWxkTGF5b3V0KHRoaXMuYWRkUGFyYW1ldGVyQ29udHJvbHMsIHtcclxuXHRcdGxhYmVsOiBcIkFkZCBwYXJhbWV0ZXI6XCIsXHJcblx0XHRhbGlnbjogXCJ0b3BcIlxyXG5cdH0pLnRvZ2dsZShmYWxzZSk7XHJcblx0Ly8gQW5kIGFub3RoZXIgaGFja1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyTGF5b3V0LiRlbGVtZW50LmZpbmQoXCIub28tdWktZmllbGRMYXlvdXQtbWVzc2FnZXNcIikuY3NzKHtcclxuXHRcdFwiY2xlYXJcIjogXCJib3RoXCIsXHJcblx0XHRcInBhZGRpbmctdG9wXCI6IDBcclxuXHR9KTtcclxuXHJcblx0Ly8gQWRkIGV2ZXJ5dGhpbmcgdG8gdGhlIGxheW91dFxyXG5cdHRoaXMubGF5b3V0LmFkZEl0ZW1zKFtcclxuXHRcdHRoaXMudGl0bGVsYXlvdXQsXHJcblx0XHR0aGlzLnBhcmFtZXRlcldpZGdldHNMYXlvdXQsXHJcblx0XHR0aGlzLmFkZFBhcmFtZXRlckxheW91dFxyXG5cdF0pO1xyXG5cdFxyXG5cdHRoaXMuJGVsZW1lbnQuYXBwZW5kKHRoaXMubGF5b3V0LiRlbGVtZW50LCAkKFwiPGhyPlwiKSk7XHJcblxyXG5cdHRoaXMucGFyYW1ldGVyV2lkZ2V0c0xheW91dC5hZ2dyZWdhdGUuY2FsbCh0aGlzLnBhcmFtZXRlcldpZGdldHNMYXlvdXQsIHtcImRlbGV0ZVwiOiBcInBhcmFtZXRlckRlbGV0ZVwifSApO1xyXG5cdHRoaXMucGFyYW1ldGVyV2lkZ2V0c0xheW91dC5jb25uZWN0KHRoaXMsIHtcInBhcmFtZXRlckRlbGV0ZVwiOiBcIm9uUGFyYW1ldGVyRGVsZXRlXCJ9ICk7XHJcblx0dGhpcy5zaG93TW9yZVBhcmFtZXRlcnNCdXR0b24uY29ubmVjdCggdGhpcywgeyBcImNsaWNrXCI6IFwic2hvd01vcmVQYXJhbWV0ZXJzXCIgfSApO1xyXG5cdHRoaXMuc2hvd0FkZFBhcmFtZXRlcklucHV0c0J1dHRvbi5jb25uZWN0KCB0aGlzLCB7IFwiY2xpY2tcIjogXCJzaG93QWRkUGFyYW1ldGVySW5wdXRzXCIgfSApO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyQnV0dG9uLmNvbm5lY3QodGhpcywgeyBcImNsaWNrXCI6IFwib25QYXJhbWV0ZXJBZGRcIiB9KTtcclxuXHR0aGlzLmFkZFBhcmFtZXRlck5hbWVJbnB1dC5jb25uZWN0KHRoaXMsIHsgXCJjaGFuZ2VcIjogXCJvbkFkZFBhcmFtZXRlck5hbWVDaGFuZ2VcIn0pO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyVmFsdWVJbnB1dC5jb25uZWN0KHRoaXMsIHsgXCJjaGFuZ2VcIjogXCJvbkFkZFBhcmFtZXRlclZhbHVlQ2hhbmdlXCJ9KTtcclxufVxyXG5PTy5pbmhlcml0Q2xhc3MoIEJhbm5lcldpZGdldCwgT08udWkuV2lkZ2V0ICk7XHJcblxyXG5CYW5uZXJXaWRnZXQucHJvdG90eXBlLm9uUGFyYW1ldGVyRGVsZXRlID0gZnVuY3Rpb24gKCBpdGVtV2lkZ2V0ICkge1xyXG5cdHRoaXMucGFyYW1ldGVyV2lkZ2V0c0xheW91dC5yZW1vdmVJdGVtcyggWyBpdGVtV2lkZ2V0IF0gKTtcclxufTtcclxuXHJcbkJhbm5lcldpZGdldC5wcm90b3R5cGUuc2hvd01vcmVQYXJhbWV0ZXJzID0gZnVuY3Rpb24oKSB7XHJcblx0dGhpcy5wYXJhbWV0ZXJXaWRnZXRzTGF5b3V0XHJcblx0XHQucmVtb3ZlSXRlbXMoW3RoaXMuc2hvd01vcmVQYXJhbWV0ZXJzQnV0dG9uXSk7XHJcblx0dGhpcy5wYXJhbWV0ZXJXaWRnZXRzTGF5b3V0LmZvckVhY2gocGFyYW1ldGVyV2lkZ2V0ID0+IHBhcmFtZXRlcldpZGdldC50b2dnbGUodHJ1ZSkpO1xyXG59O1xyXG5cclxuQmFubmVyV2lkZ2V0LnByb3RvdHlwZS5zaG93QWRkUGFyYW1ldGVySW5wdXRzID0gZnVuY3Rpb24oKSB7XHJcblx0dGhpcy5wYXJhbWV0ZXJXaWRnZXRzTGF5b3V0LnJlbW92ZUl0ZW1zKFt0aGlzLnNob3dBZGRQYXJhbWV0ZXJJbnB1dHNCdXR0b25dKTtcclxuXHR0aGlzLmFkZFBhcmFtZXRlckxheW91dC50b2dnbGUodHJ1ZSk7XHJcbn07XHJcblxyXG5CYW5uZXJXaWRnZXQucHJvdG90eXBlLmdldEFkZFBhcmFtZXRlcnNJbmZvID0gZnVuY3Rpb24obmFtZUlucHV0VmFsLCB2YWx1ZUlucHV0VmFsKSB7XHJcblx0dmFyIG5hbWUgPSBuYW1lSW5wdXRWYWwgJiYgbmFtZUlucHV0VmFsLnRyaW0oKSB8fCB0aGlzLmFkZFBhcmFtZXRlck5hbWVJbnB1dC5nZXRWYWx1ZSgpLnRyaW0oKTtcclxuXHR2YXIgcGFyYW1BbHJlYWR5SW5jbHVkZWQgPSBuYW1lID09PSBcImNsYXNzXCIgfHxcclxuXHRcdG5hbWUgPT09IFwiaW1wb3J0YW5jZVwiIHx8XHJcblx0XHR0aGlzLnBhcmFtZXRlcldpZGdldHNMYXlvdXQuaXRlbXMuc29tZShwYXJhbVdpZGdldCA9PiBwYXJhbVdpZGdldC5wYXJhbWV0ZXIgJiYgcGFyYW1XaWRnZXQucGFyYW1ldGVyLm5hbWUgPT09IG5hbWUpO1xyXG5cdHZhciB2YWx1ZSA9IHZhbHVlSW5wdXRWYWwgJiYgdmFsdWVJbnB1dFZhbC50cmltKCkgfHwgdGhpcy5hZGRQYXJhbWV0ZXJWYWx1ZUlucHV0LmdldFZhbHVlKCkudHJpbSgpO1xyXG5cdHZhciBhdXRvdmFsdWUgPSBuYW1lICYmIHRoaXMudGVtcGxhdGUucGFyYW1EYXRhW25hbWVdICYmIHRoaXMudGVtcGxhdGUucGFyYW1EYXRhW25hbWVdLmF1dG92YWx1ZSB8fCBudWxsO1xyXG5cdHJldHVybiB7XHJcblx0XHR2YWxpZE5hbWU6ICEhKG5hbWUgJiYgIXBhcmFtQWxyZWFkeUluY2x1ZGVkKSxcclxuXHRcdHZhbGlkVmFsdWU6ICEhKHZhbHVlIHx8IGF1dG92YWx1ZSksXHJcblx0XHRpc0F1dG92YWx1ZTogISEoIXZhbHVlICYmIGF1dG92YWx1ZSksXHJcblx0XHRpc0FscmVhZHlJbmNsdWRlZDogISEobmFtZSAmJiBwYXJhbUFscmVhZHlJbmNsdWRlZCksXHJcblx0XHRuYW1lLFxyXG5cdFx0dmFsdWUsXHJcblx0XHRhdXRvdmFsdWVcclxuXHR9O1xyXG59O1xyXG5cclxuQmFubmVyV2lkZ2V0LnByb3RvdHlwZS5vbkFkZFBhcmFtZXRlck5hbWVDaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuXHRsZXQgeyB2YWxpZE5hbWUsIHZhbGlkVmFsdWUsIGlzQXV0b3ZhbHVlLCBpc0FscmVhZHlJbmNsdWRlZCwgbmFtZSwgYXV0b3ZhbHVlIH0gPSB0aGlzLmdldEFkZFBhcmFtZXRlcnNJbmZvKCk7XHJcblx0Ly8gU2V0IHZhbHVlIGlucHV0IHBsYWNlaG9sZGVyIGFzIHRoZSBhdXRvdmFsdWVcclxuXHR0aGlzLmFkZFBhcmFtZXRlclZhbHVlSW5wdXQuJGlucHV0LmF0dHIoIFwicGxhY2Vob2xkZXJcIiwgIGF1dG92YWx1ZSB8fCBcIlwiICk7XHJcblx0Ly8gU2V0IHN1Z2dlc3Rpb25zLCBpZiB0aGUgcGFyYW1ldGVyIGhhcyBhIGxpc3Qgb2YgYWxsb3dlZCB2YWx1ZXNcclxuXHR2YXIgYWxsb3dlZFZhbHVlcyA9IHRoaXMudGVtcGxhdGUucGFyYW1EYXRhW25hbWVdICYmXHJcblx0XHR0aGlzLnRlbXBsYXRlLnBhcmFtRGF0YVtuYW1lXS5hbGxvd2VkVmFsdWVzICYmIFxyXG5cdFx0dGhpcy50ZW1wbGF0ZS5wYXJhbURhdGFbbmFtZV0uYWxsb3dlZFZhbHVlcy5tYXAodmFsID0+IHtyZXR1cm4ge2RhdGE6IHZhbCwgbGFiZWw6dmFsfTsgfSk7XHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJWYWx1ZUlucHV0LnNldFN1Z2dlc3Rpb25zKGFsbG93ZWRWYWx1ZXMgfHwgW10pO1xyXG5cdC8vIFNldCBidXR0b24gZGlzYWJsZWQgc3RhdGUgYmFzZWQgb24gdmFsaWRpdHlcclxuXHR0aGlzLmFkZFBhcmFtZXRlckJ1dHRvbi5zZXREaXNhYmxlZCghdmFsaWROYW1lIHx8ICF2YWxpZFZhbHVlKTtcclxuXHQvLyBTaG93IG5vdGljZSBpZiBhdXRvdmFsdWUgd2lsbCBiZSB1c2VkXHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJMYXlvdXQuc2V0Tm90aWNlcyggdmFsaWROYW1lICYmIGlzQXV0b3ZhbHVlID8gW1wiUGFyYW1ldGVyIHZhbHVlIHdpbGwgYmUgYXV0b2ZpbGxlZFwiXSA6IFtdICk7XHJcblx0Ly8gU2hvdyBlcnJvciBpcyB0aGUgYmFubmVyIGFscmVhZHkgaGFzIHRoZSBwYXJhbWV0ZXIgc2V0XHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJMYXlvdXQuc2V0RXJyb3JzKCBpc0FscmVhZHlJbmNsdWRlZCA/IFtcIlBhcmFtZXRlciBpcyBhbHJlYWR5IHByZXNlbnRcIl0gOiBbXSApO1xyXG59O1xyXG5cclxuQmFubmVyV2lkZ2V0LnByb3RvdHlwZS5vbkFkZFBhcmFtZXRlclZhbHVlQ2hhbmdlID0gZnVuY3Rpb24oKSB7XHJcblx0bGV0IHsgdmFsaWROYW1lLCB2YWxpZFZhbHVlLCBpc0F1dG92YWx1ZSB9ID0gdGhpcy5nZXRBZGRQYXJhbWV0ZXJzSW5mbygpO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyQnV0dG9uLnNldERpc2FibGVkKCF2YWxpZE5hbWUgfHwgIXZhbGlkVmFsdWUpO1xyXG5cdHRoaXMuYWRkUGFyYW1ldGVyTGF5b3V0LnNldE5vdGljZXMoIHZhbGlkTmFtZSAmJiBpc0F1dG92YWx1ZSA/IFtcIlBhcmFtZXRlciB2YWx1ZSB3aWxsIGJlIGF1dG9maWxsZWRcIl0gOiBbXSApOyBcclxufTtcclxuXHJcbkJhbm5lcldpZGdldC5wcm90b3R5cGUub25QYXJhbWV0ZXJBZGQgPSBmdW5jdGlvbigpIHtcclxuXHRsZXQgeyB2YWxpZE5hbWUsIHZhbGlkVmFsdWUsIG5hbWUsIHZhbHVlLCBhdXRvdmFsdWUgfSAgPSB0aGlzLmdldEFkZFBhcmFtZXRlcnNJbmZvKCk7XHJcblx0aWYgKCF2YWxpZE5hbWUgfHwgIXZhbGlkVmFsdWUpIHtcclxuXHRcdC8vIEVycm9yIHNob3VsZCBhbHJlYWR5IGJlIHNob3duIHZpYSBvbkFkZFBhcmFtZXRlci4uLkNoYW5nZSBtZXRob2RzXHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdHZhciBuZXdQYXJhbWV0ZXIgPSBuZXcgUGFyYW1ldGVyV2lkZ2V0KFxyXG5cdFx0e1xyXG5cdFx0XHRcIm5hbWVcIjogbmFtZSxcclxuXHRcdFx0XCJ2YWx1ZVwiOiB2YWx1ZSB8fCBhdXRvdmFsdWVcclxuXHRcdH0sXHJcblx0XHR0aGlzLnRlbXBsYXRlLnBhcmFtRGF0YVtuYW1lXVxyXG5cdCk7XHJcblx0dGhpcy5wYXJhbWV0ZXJXaWRnZXRzTGF5b3V0LmFkZEl0ZW1zKFtuZXdQYXJhbWV0ZXJdKTtcclxuXHR0aGlzLmFkZFBhcmFtZXRlck5hbWVJbnB1dC5zZXRWYWx1ZShcIlwiKTtcclxuXHR0aGlzLmFkZFBhcmFtZXRlclZhbHVlSW5wdXQuc2V0VmFsdWUoXCJcIik7XHJcblx0dGhpcy5hZGRQYXJhbWV0ZXJOYW1lSW5wdXQuZm9jdXMoKTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IEJhbm5lcldpZGdldDsiLCJmdW5jdGlvbiBQYXJhbWV0ZXJXaWRnZXQoIHBhcmFtZXRlciwgcGFyYW1EYXRhLCBjb25maWcgKSB7XHJcblx0Ly8gQ29uZmlndXJhdGlvbiBpbml0aWFsaXphdGlvblxyXG5cdGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcclxuXHQvLyBDYWxsIHBhcmVudCBjb25zdHJ1Y3RvclxyXG5cdFBhcmFtZXRlcldpZGdldC5zdXBlci5jYWxsKCB0aGlzLCBjb25maWcgKTtcclxuICAgIFxyXG5cdHRoaXMucGFyYW1ldGVyID0gcGFyYW1ldGVyO1xyXG5cdHRoaXMucGFyYW1EYXRhID0gcGFyYW1EYXRhIHx8IHt9O1xyXG5cclxuXHQvLyBNYWtlIHRoZSBpbnB1dC4gVHlwZSBjYW4gYmUgY2hlY2tib3gsIG9yIGRyb3Bkb3duLCBvciB0ZXh0IGlucHV0LFxyXG5cdC8vIGRlcGVuZGluZyBvbiBudW1iZXIgb2YgYWxsb3dlZCB2YWx1ZXMgaW4gcGFyYW0gZGF0YS5cclxuXHR0aGlzLmFsbG93ZWRWYWx1ZXMgPSBwYXJhbURhdGEgJiYgcGFyYW1EYXRhLmFsbG93ZWRWYWx1ZXMgfHwgW107XHJcblx0Ly8gc3dpdGNoICh0cnVlKSB7XHJcblx0Ly8gY2FzZSB0aGlzLmFsbG93ZWRWYWx1ZXMubGVuZ3RoID09PSAwOlxyXG5cdC8vIGNhc2UgcGFyYW1ldGVyLnZhbHVlICYmICF0aGlzLmFsbG93ZWRWYWx1ZXMuaW5jbHVkZXMocGFyYW1ldGVyLnZhbHVlKTpcclxuXHQvLyBcdC8vIFRleHQgaW5wdXRcclxuXHQvLyBcdGJyZWFrO1xyXG5cdC8vIGNhc2UgMTpcclxuXHQvLyBcdC8vIENoZWNrYm94IChsYWJlbGxlZCBvbmx5IHdoZW4gYm90aCBjaGVja2VkKVxyXG5cdC8vIFx0dGhpcy5hbGxvd2VkVmFsdWVzID0gW251bGwsIC4uLnRoaXMuYWxsb3dlZFZhbHVlc107XHJcblx0Ly8gXHQvKiAuLi5mYWxscyB0aHJvdWdoLi4uICovXHJcblx0Ly8gY2FzZSAyOlxyXG5cdC8vIFx0Ly8gQ2hlY2tib3ggKGxhYmVsbGVkIHdoZW4gYm90aCBjaGVja2VkIGFuZCBub3QgY2hlY2tlZClcclxuXHQvLyBcdHRoaXMuaW5wdXQgPSBuZXcgT08udWkuQ2hlY2tib3hNdWx0aW9wdGlvbldpZGdldCgge1xyXG5cdC8vIFx0XHRkYXRhOiBwYXJhbWV0ZXIudmFsdWUsXHJcblx0Ly8gXHRcdHNlbGVjdGVkOiB0aGlzLmFsbG93ZWRWYWx1ZXMuaW5kZXhPZihwYXJhbWV0ZXIudmFsdWUpID09PSAxLFxyXG5cdC8vIFx0XHRsYWJlbDogJChcIjxjb2RlPlwiKS50ZXh0KHBhcmFtZXRlci52YWx1ZSB8fCBcIlwiKVxyXG5cdC8vIFx0fSApO1xyXG5cdC8vIFx0YnJlYWs7XHJcblx0Ly8gZGVmYXVsdDpcclxuXHQvLyBcdC8vIERyb3Bkb3duXHJcblx0Ly8gXHR0aGlzLmlucHV0ID0gbmV3IE9PLnVpLkRyb3Bkb3duV2lkZ2V0KCB7XHJcblx0Ly8gXHRcdG1lbnU6IHtcclxuXHQvLyBcdFx0XHRpdGVtczogdGhpcy5hbGxvd2VkVmFsdWVzLm1hcChhbGxvd2VkVmFsID0+IG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KHtcclxuXHQvLyBcdFx0XHRcdGRhdGE6IGFsbG93ZWRWYWwsXHJcblx0Ly8gXHRcdFx0XHRsYWJlbDogYWxsb3dlZFZhbFxyXG5cdC8vIFx0XHRcdH0pIClcclxuXHQvLyBcdFx0fVxyXG5cdC8vIFx0fSApO1xyXG5cdC8vIFx0dGhpcy5pbnB1dC5nZXRNZW51KCkuc2VsZWN0SXRlbUJ5RGF0YShwYXJhbWV0ZXIudmFsdWUpO1xyXG5cdC8vIFx0YnJlYWs7XHJcblx0Ly8gfVxyXG5cdC8vIFRPRE86IFVzZSBhYm92ZSBsb2dpYywgb3Igc29tZXRoaW5nIHNpbWlsYXIuIEZvciBub3csIGp1c3QgY3JlYXRlIGEgQ29tYm9Cb3hcclxuXHR0aGlzLmlucHV0ID0gbmV3IE9PLnVpLkNvbWJvQm94SW5wdXRXaWRnZXQoIHtcclxuXHRcdHZhbHVlOiB0aGlzLnBhcmFtZXRlci52YWx1ZSxcclxuXHRcdC8vIGxhYmVsOiBwYXJhbWV0ZXIubmFtZSArIFwiID1cIixcclxuXHRcdC8vIGxhYmVsUG9zaXRpb246IFwiYmVmb3JlXCIsXHJcblx0XHRvcHRpb25zOiB0aGlzLmFsbG93ZWRWYWx1ZXMubWFwKHZhbCA9PiB7cmV0dXJuIHtkYXRhOiB2YWwsIGxhYmVsOnZhbH07IH0pLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8ZGl2IHN0eWxlPSd3aWR0aDpjYWxjKDEwMCUgLSA3MHB4KTttYXJnaW4tcmlnaHQ6MDsnPlwiKSAvLyB0aGUgNzBweCBsZWF2ZXMgcm9vbSBmb3IgYnV0dG9uc1xyXG5cdH0gKTtcclxuXHQvLyBSZWR1Y2UgdGhlIGV4Y2Vzc2l2ZSB3aGl0ZXNwYWNlL2hlaWdodFxyXG5cdHRoaXMuaW5wdXQuJGVsZW1lbnQuZmluZChcImlucHV0XCIpLmNzcyh7XHJcblx0XHRcInBhZGRpbmctdG9wXCI6IDAsXHJcblx0XHRcInBhZGRpbmctYm90dG9tXCI6IFwiMnB4XCIsXHJcblx0XHRcImhlaWdodFwiOiBcIjI0cHhcIlxyXG5cdH0pO1xyXG5cdC8vIEZpeCBsYWJlbCBwb3NpdGlvbmluZyB3aXRoaW4gdGhlIHJlZHVjZWQgaGVpZ2h0XHJcblx0dGhpcy5pbnB1dC4kZWxlbWVudC5maW5kKFwic3Bhbi5vby11aS1sYWJlbEVsZW1lbnQtbGFiZWxcIikuY3NzKHtcImxpbmUtaGVpZ2h0XCI6IFwibm9ybWFsXCJ9KTtcclxuXHQvLyBBbHNvIHJlZHVjZSBoZWlnaHQgb2YgZHJvcGRvd24gYnV0dG9uIChpZiBvcHRpb25zIGFyZSBwcmVzZW50KVxyXG5cdHRoaXMuaW5wdXQuJGVsZW1lbnQuZmluZChcImEub28tdWktYnV0dG9uRWxlbWVudC1idXR0b25cIikuY3NzKHtcclxuXHRcdFwicGFkZGluZy10b3BcIjogMCxcclxuXHRcdFwiaGVpZ2h0XCI6IFwiMjRweFwiLFxyXG5cdFx0XCJtaW4taGVpZ2h0XCI6IFwiMFwiXHJcblx0fSk7XHJcblxyXG5cdC8vdmFyIGRlc2NyaXB0aW9uID0gdGhpcy5wYXJhbURhdGFbcGFyYW1ldGVyLm5hbWVdICYmIHRoaXMucGFyYW1EYXRhW3BhcmFtZXRlci5uYW1lXS5sYWJlbCAmJiB0aGlzLnBhcmFtRGF0YVtwYXJhbWV0ZXIubmFtZV0ubGFiZWwuZW47XHJcblx0Ly8gdmFyIHBhcmFtTmFtZSA9IG5ldyBPTy51aS5MYWJlbFdpZGdldCh7XHJcblx0Ly8gXHRsYWJlbDogXCJ8XCIgKyBwYXJhbWV0ZXIubmFtZSArIFwiPVwiLFxyXG5cdC8vIFx0JGVsZW1lbnQ6ICQoXCI8Y29kZT5cIilcclxuXHQvLyB9KTtcclxuXHR0aGlzLmRlbGV0ZUJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoe1xyXG5cdFx0aWNvbjogXCJjbGVhclwiLFxyXG5cdFx0ZnJhbWVkOiBmYWxzZSxcclxuXHRcdGZsYWdzOiBcImRlc3RydWN0aXZlXCJcclxuXHR9KTtcclxuXHR0aGlzLmRlbGV0ZUJ1dHRvbi4kZWxlbWVudC5maW5kKFwiYSBzcGFuXCIpLmZpcnN0KCkuY3NzKHtcclxuXHRcdFwibWluLXdpZHRoXCI6IFwidW5zZXRcIixcclxuXHRcdFwid2lkdGhcIjogXCIxNnB4XCJcclxuXHR9KTtcclxuICAgIFxyXG5cdHRoaXMuY29uZmlybUJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoe1xyXG5cdFx0aWNvbjogXCJjaGVja1wiLFxyXG5cdFx0ZnJhbWVkOiBmYWxzZSxcclxuXHRcdGZsYWdzOiBcInByb2dyZXNzaXZlXCIsXHJcblx0XHQkZWxlbWVudDogJChcIjxzcGFuIHN0eWxlPSdtYXJnaW4tcmlnaHQ6MCc+XCIpXHJcblx0fSk7XHJcblx0dGhpcy5jb25maXJtQnV0dG9uLiRlbGVtZW50LmZpbmQoXCJhIHNwYW5cIikuZmlyc3QoKS5jc3Moe1xyXG5cdFx0XCJtaW4td2lkdGhcIjogXCJ1bnNldFwiLFxyXG5cdFx0XCJ3aWR0aFwiOiBcIjE2cHhcIixcclxuXHRcdFwibWFyZ2luLXJpZ2h0XCI6IDBcclxuXHR9KTtcclxuXHJcblx0dGhpcy5lZGl0TGF5b3V0Q29udHJvbHMgPSBuZXcgT08udWkuSG9yaXpvbnRhbExheW91dCh7XHJcblx0XHRpdGVtczogW1xyXG5cdFx0XHR0aGlzLmlucHV0LFxyXG5cdFx0XHR0aGlzLmNvbmZpcm1CdXR0b24sXHJcblx0XHRcdHRoaXMuZGVsZXRlQnV0dG9uXHJcblx0XHRdLFxyXG5cdFx0Ly8kZWxlbWVudDogJChcIjxkaXYgc3R5bGU9J3dpZHRoOiA0OCU7bWFyZ2luOjA7Jz5cIilcclxuXHR9KTtcclxuXHQvLyBIYWNrcyB0byBtYWtlIHRoaXMgSG9yaXpvbnRhbExheW91dCBnbyBpbnNpZGUgYSBGaWVsZExheW91dFxyXG5cdHRoaXMuZWRpdExheW91dENvbnRyb2xzLmdldElucHV0SWQgPSAoKSA9PiBmYWxzZTtcclxuXHR0aGlzLmVkaXRMYXlvdXRDb250cm9scy5pc0Rpc2FibGVkID0gKCkgPT4gZmFsc2U7XHJcblx0dGhpcy5lZGl0TGF5b3V0Q29udHJvbHMuc2ltdWxhdGVMYWJlbENsaWNrID0gKCkgPT4gdHJ1ZTtcclxuXHJcblx0dGhpcy5lZGl0TGF5b3V0ID0gbmV3IE9PLnVpLkZpZWxkTGF5b3V0KCB0aGlzLmVkaXRMYXlvdXRDb250cm9scywge1xyXG5cdFx0bGFiZWw6IHRoaXMucGFyYW1ldGVyLm5hbWUgKyBcIiA9XCIsXHJcblx0XHRhbGlnbjogXCJ0b3BcIixcclxuXHRcdGhlbHA6IHRoaXMucGFyYW1EYXRhLmRlc2NyaXB0aW9uICYmIHRoaXMucGFyYW1EYXRhLmRlc2NyaXB0aW9uLmVuIHx8IGZhbHNlLFxyXG5cdFx0aGVscElubGluZTogdHJ1ZVxyXG5cdH0pLnRvZ2dsZSgpO1xyXG5cdHRoaXMuZWRpdExheW91dC4kZWxlbWVudC5maW5kKFwibGFiZWwub28tdWktaW5saW5lLWhlbHBcIikuY3NzKHtcIm1hcmdpblwiOiBcIi0xMHB4IDAgNXB4IDEwcHhcIn0pO1xyXG5cclxuXHR0aGlzLmZ1bGxMYWJlbCA9IG5ldyBPTy51aS5MYWJlbFdpZGdldCh7XHJcblx0XHRsYWJlbDogdGhpcy5wYXJhbWV0ZXIubmFtZSArIFwiID0gXCIgKyB0aGlzLnBhcmFtZXRlci52YWx1ZSxcclxuXHRcdCRlbGVtZW50OiAkKFwiPGxhYmVsIHN0eWxlPSdtYXJnaW46IDA7Jz5cIilcclxuXHR9KTtcclxuXHR0aGlzLmVkaXRCdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KHtcclxuXHRcdGljb246IFwiZWRpdFwiLFxyXG5cdFx0ZnJhbWVkOiBmYWxzZSxcclxuXHRcdCRlbGVtZW50OiAkKFwiPHNwYW4gc3R5bGU9J21hcmdpbi1ib3R0b206IDA7Jz5cIilcclxuXHR9KTtcclxuXHR0aGlzLmVkaXRCdXR0b24uJGVsZW1lbnQuZmluZChcImFcIikuY3NzKHtcclxuXHRcdFwiYm9yZGVyLXJhZGl1c1wiOiBcIjAgMTBweCAxMHB4IDBcIixcclxuXHRcdFwibWFyZ2luLWxlZnRcIjogXCI1cHhcIlxyXG5cdH0pO1xyXG5cdHRoaXMuZWRpdEJ1dHRvbi4kZWxlbWVudC5maW5kKFwiYSBzcGFuXCIpLmZpcnN0KCkuY3NzKHtcclxuXHRcdFwibWluLXdpZHRoXCI6IFwidW5zZXRcIixcclxuXHRcdFwid2lkdGhcIjogXCIxNnB4XCJcclxuXHR9KTtcclxuXHJcblx0dGhpcy5yZWFkTGF5b3V0ID0gbmV3IE9PLnVpLkhvcml6b250YWxMYXlvdXQoe1xyXG5cdFx0aXRlbXM6IFtcclxuXHRcdFx0dGhpcy5mdWxsTGFiZWwsXHJcblx0XHRcdHRoaXMuZWRpdEJ1dHRvblxyXG5cdFx0XSxcclxuXHRcdCRlbGVtZW50OiAkKFwiPHNwYW4gc3R5bGU9J21hcmdpbjowO3dpZHRoOnVuc2V0Oyc+XCIpXHJcblx0fSk7XHJcblxyXG5cdHRoaXMuJGVsZW1lbnQgPSAkKFwiPGRpdj5cIilcclxuXHRcdC5jc3Moe1xyXG5cdFx0XHRcIndpZHRoXCI6IFwidW5zZXRcIixcclxuXHRcdFx0XCJkaXNwbGF5XCI6IFwiaW5saW5lLWJsb2NrXCIsXHJcblx0XHRcdFwiYm9yZGVyXCI6IFwiMXB4IHNvbGlkICNkZGRcIixcclxuXHRcdFx0XCJib3JkZXItcmFkaXVzXCI6IFwiMTBweFwiLFxyXG5cdFx0XHRcInBhZGRpbmctbGVmdFwiOiBcIjEwcHhcIixcclxuXHRcdFx0XCJtYXJnaW5cIjogXCIwIDhweCA4cHggMFwiXHJcblx0XHR9KVxyXG5cdFx0LmFwcGVuZCh0aGlzLnJlYWRMYXlvdXQuJGVsZW1lbnQsIHRoaXMuZWRpdExheW91dC4kZWxlbWVudCk7XHJcbiAgICBcclxuXHR0aGlzLmVkaXRCdXR0b24uY29ubmVjdCggdGhpcywgeyBcImNsaWNrXCI6IFwib25FZGl0Q2xpY2tcIiB9ICk7XHJcblx0dGhpcy5jb25maXJtQnV0dG9uLmNvbm5lY3QoIHRoaXMsIHsgXCJjbGlja1wiOiBcIm9uQ29uZmlybUNsaWNrXCIgfSApO1xyXG5cdHRoaXMuZGVsZXRlQnV0dG9uLmNvbm5lY3QoIHRoaXMsIHsgXCJjbGlja1wiOiBcIm9uRGVsZXRlQ2xpY2tcIiB9ICk7XHJcbn1cclxuT08uaW5oZXJpdENsYXNzKCBQYXJhbWV0ZXJXaWRnZXQsIE9PLnVpLldpZGdldCApO1xyXG5cclxuUGFyYW1ldGVyV2lkZ2V0LnByb3RvdHlwZS5vbkVkaXRDbGljayA9IGZ1bmN0aW9uKCkge1xyXG5cdHRoaXMucmVhZExheW91dC50b2dnbGUoZmFsc2UpO1xyXG5cdHRoaXMuZWRpdExheW91dC50b2dnbGUodHJ1ZSk7XHJcblx0dGhpcy5pbnB1dC5mb2N1cygpO1xyXG59O1xyXG5cclxuUGFyYW1ldGVyV2lkZ2V0LnByb3RvdHlwZS5vbkNvbmZpcm1DbGljayA9IGZ1bmN0aW9uKCkge1xyXG5cdHRoaXMucGFyYW1ldGVyLnZhbHVlID0gdGhpcy5pbnB1dC5nZXRWYWx1ZSgpO1xyXG5cdHRoaXMuZnVsbExhYmVsLnNldExhYmVsKHRoaXMucGFyYW1ldGVyLm5hbWUgKyBcIiA9IFwiICsgdGhpcy5wYXJhbWV0ZXIudmFsdWUpO1xyXG5cdHRoaXMucmVhZExheW91dC50b2dnbGUodHJ1ZSk7XHJcblx0dGhpcy5lZGl0TGF5b3V0LnRvZ2dsZShmYWxzZSk7XHJcbn07XHJcblxyXG5QYXJhbWV0ZXJXaWRnZXQucHJvdG90eXBlLm9uRGVsZXRlQ2xpY2sgPSBmdW5jdGlvbigpIHtcclxuXHR0aGlzLmVtaXQoXCJkZWxldGVcIik7XHJcbn07XHJcblxyXG5QYXJhbWV0ZXJXaWRnZXQucHJvdG90eXBlLmZvY3VzSW5wdXQgPSBmdW5jdGlvbigpIHtcclxuXHRyZXR1cm4gdGhpcy5pbnB1dC5mb2N1cygpO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgUGFyYW1ldGVyV2lkZ2V0OyIsInZhciBTdWdnZXN0aW9uTG9va3VwVGV4dElucHV0V2lkZ2V0ID0gZnVuY3Rpb24gU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldCggY29uZmlnICkge1xyXG5cdE9PLnVpLlRleHRJbnB1dFdpZGdldC5jYWxsKCB0aGlzLCBjb25maWcgKTtcclxuXHRPTy51aS5taXhpbi5Mb29rdXBFbGVtZW50LmNhbGwoIHRoaXMsIGNvbmZpZyApO1xyXG5cdHRoaXMuc3VnZ2VzdGlvbnMgPSBjb25maWcuc3VnZ2VzdGlvbnMgfHwgW107XHJcbn07XHJcbk9PLmluaGVyaXRDbGFzcyggU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldCwgT08udWkuVGV4dElucHV0V2lkZ2V0ICk7XHJcbk9PLm1peGluQ2xhc3MoIFN1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXQsIE9PLnVpLm1peGluLkxvb2t1cEVsZW1lbnQgKTtcclxuXHJcbi8vIFNldCBzdWdnZXN0aW9uLiBwYXJhbTogT2JqZWN0W10gd2l0aCBvYmplY3RzIG9mIHRoZSBmb3JtIHsgZGF0YTogLi4uICwgbGFiZWw6IC4uLiB9XHJcblN1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXQucHJvdG90eXBlLnNldFN1Z2dlc3Rpb25zID0gZnVuY3Rpb24oc3VnZ2VzdGlvbnMpIHtcclxuXHR0aGlzLnN1Z2dlc3Rpb25zID0gc3VnZ2VzdGlvbnM7XHJcbn07XHJcblxyXG4vLyBSZXR1cm5zIGRhdGEsIGFzIGEgcmVzb2x1dGlvbiB0byBhIHByb21pc2UsIHRvIGJlIHBhc3NlZCB0byAjZ2V0TG9va3VwTWVudU9wdGlvbnNGcm9tRGF0YVxyXG5TdWdnZXN0aW9uTG9va3VwVGV4dElucHV0V2lkZ2V0LnByb3RvdHlwZS5nZXRMb29rdXBSZXF1ZXN0ID0gZnVuY3Rpb24gKCkge1xyXG5cdHZhciBkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKS5yZXNvbHZlKG5ldyBSZWdFeHAoXCJcXFxcYlwiICsgbXcudXRpbC5lc2NhcGVSZWdFeHAodGhpcy5nZXRWYWx1ZSgpKSwgXCJpXCIpKTtcclxuXHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZSggeyBhYm9ydDogZnVuY3Rpb24gKCkge30gfSApO1xyXG59O1xyXG5cclxuLy8gPz8/XHJcblN1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXQucHJvdG90eXBlLmdldExvb2t1cENhY2hlRGF0YUZyb21SZXNwb25zZSA9IGZ1bmN0aW9uICggcmVzcG9uc2UgKSB7XHJcblx0cmV0dXJuIHJlc3BvbnNlIHx8IFtdO1xyXG59O1xyXG5cclxuLy8gSXMgcGFzc2VkIGRhdGEgZnJvbSAjZ2V0TG9va3VwUmVxdWVzdCwgcmV0dXJucyBhbiBhcnJheSBvZiBtZW51IGl0ZW0gd2lkZ2V0cyBcclxuU3VnZ2VzdGlvbkxvb2t1cFRleHRJbnB1dFdpZGdldC5wcm90b3R5cGUuZ2V0TG9va3VwTWVudU9wdGlvbnNGcm9tRGF0YSA9IGZ1bmN0aW9uICggcGF0dGVybiApIHtcclxuXHR2YXIgbGFiZWxNYXRjaGVzSW5wdXRWYWwgPSBmdW5jdGlvbihzdWdnZXN0aW9uSXRlbSkge1xyXG5cdFx0cmV0dXJuIHBhdHRlcm4udGVzdChzdWdnZXN0aW9uSXRlbS5sYWJlbCkgfHwgKCAhc3VnZ2VzdGlvbkl0ZW0ubGFiZWwgJiYgcGF0dGVybi50ZXN0KHN1Z2dlc3Rpb25JdGVtLmRhdGEpICk7XHJcblx0fTtcclxuXHR2YXIgbWFrZU1lbnVPcHRpb25XaWRnZXQgPSBmdW5jdGlvbihvcHRpb25JdGVtKSB7XHJcblx0XHRyZXR1cm4gbmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0ZGF0YTogb3B0aW9uSXRlbS5kYXRhLFxyXG5cdFx0XHRsYWJlbDogb3B0aW9uSXRlbS5sYWJlbCB8fCBvcHRpb25JdGVtLmRhdGFcclxuXHRcdH0gKTtcclxuXHR9O1xyXG5cdHJldHVybiB0aGlzLnN1Z2dlc3Rpb25zLmZpbHRlcihsYWJlbE1hdGNoZXNJbnB1dFZhbCkubWFwKG1ha2VNZW51T3B0aW9uV2lkZ2V0KTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFN1Z2dlc3Rpb25Mb29rdXBUZXh0SW5wdXRXaWRnZXQ7IiwiaW1wb3J0IHttYWtlRXJyb3JNc2d9IGZyb20gXCIuLi91dGlsXCI7XHJcblxyXG4vKiB2YXIgaW5jcmVtZW50UHJvZ3Jlc3NCeUludGVydmFsID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIGluY3JlbWVudEludGVydmFsRGVsYXkgPSAxMDA7XHJcblx0dmFyIGluY3JlbWVudEludGVydmFsQW1vdW50ID0gMC4xO1xyXG5cdHZhciBpbmNyZW1lbnRJbnRlcnZhbE1heHZhbCA9IDk4O1xyXG5cdHJldHVybiB3aW5kb3cuc2V0SW50ZXJ2YWwoXHJcblx0XHRpbmNyZW1lbnRQcm9ncmVzcyxcclxuXHRcdGluY3JlbWVudEludGVydmFsRGVsYXksXHJcblx0XHRpbmNyZW1lbnRJbnRlcnZhbEFtb3VudCxcclxuXHRcdGluY3JlbWVudEludGVydmFsTWF4dmFsXHJcblx0KTtcclxufTsgKi9cclxuXHJcbnZhciBMb2FkRGlhbG9nID0gZnVuY3Rpb24gTG9hZERpYWxvZyggY29uZmlnICkge1xyXG5cdExvYWREaWFsb2cuc3VwZXIuY2FsbCggdGhpcywgY29uZmlnICk7XHJcbn07XHJcbk9PLmluaGVyaXRDbGFzcyggTG9hZERpYWxvZywgT08udWkuRGlhbG9nICk7IFxyXG5cclxuTG9hZERpYWxvZy5zdGF0aWMubmFtZSA9IFwibG9hZERpYWxvZ1wiO1xyXG5Mb2FkRGlhbG9nLnN0YXRpYy50aXRsZSA9IFwiTG9hZGluZyBSYXRlci4uLlwiO1xyXG5cclxuLy8gQ3VzdG9taXplIHRoZSBpbml0aWFsaXplKCkgZnVuY3Rpb246IFRoaXMgaXMgd2hlcmUgdG8gYWRkIGNvbnRlbnQgdG8gdGhlIGRpYWxvZyBib2R5IGFuZCBzZXQgdXAgZXZlbnQgaGFuZGxlcnMuXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmluaXRpYWxpemUgPSBmdW5jdGlvbiAoKSB7XHJcblx0Ly8gQ2FsbCB0aGUgcGFyZW50IG1ldGhvZC5cclxuXHRMb2FkRGlhbG9nLnN1cGVyLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwoIHRoaXMgKTtcclxuXHQvLyBDcmVhdGUgYSBsYXlvdXRcclxuXHR0aGlzLmNvbnRlbnQgPSBuZXcgT08udWkuUGFuZWxMYXlvdXQoIHsgXHJcblx0XHRwYWRkZWQ6IHRydWUsXHJcblx0XHRleHBhbmRlZDogZmFsc2UgXHJcblx0fSApO1xyXG5cdC8vIENyZWF0ZSBjb250ZW50XHJcblx0dGhpcy5wcm9ncmVzc0JhciA9IG5ldyBPTy51aS5Qcm9ncmVzc0JhcldpZGdldCgge1xyXG5cdFx0cHJvZ3Jlc3M6IDFcclxuXHR9ICk7XHJcblx0dGhpcy5zZXR1cHRhc2tzID0gW1xyXG5cdFx0bmV3IE9PLnVpLkxhYmVsV2lkZ2V0KCB7XHJcblx0XHRcdGxhYmVsOiBcIkxvYWRpbmcgbGlzdCBvZiBwcm9qZWN0IGJhbm5lcnMuLi5cIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8cCBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KSxcclxuXHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJMb2FkaW5nIHRhbGtwYWdlIHdpa2l0ZXh0Li4uXCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHAgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSksXHJcblx0XHRuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiUGFyc2luZyB0YWxrcGFnZSB0ZW1wbGF0ZXMuLi5cIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8cCBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KSxcclxuXHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJHZXR0aW5nIHRlbXBsYXRlcycgcGFyYW1ldGVyIGRhdGEuLi5cIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8cCBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KSxcclxuXHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJDaGVja2luZyBpZiBwYWdlIHJlZGlyZWN0cy4uLlwiLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxwIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrXFxcIj5cIilcclxuXHRcdH0pLFxyXG5cdFx0bmV3IE9PLnVpLkxhYmVsV2lkZ2V0KCB7XHJcblx0XHRcdGxhYmVsOiBcIlJldHJpZXZpbmcgcXVhbGl0eSBwcmVkaWN0aW9uLi4uXCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHAgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSkudG9nZ2xlKCksXHJcblx0XTtcclxuXHR0aGlzLmNsb3NlQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCgge1xyXG5cdFx0bGFiZWw6IFwiQ2xvc2VcIlxyXG5cdH0pLnRvZ2dsZSgpO1xyXG5cdHRoaXMuc2V0dXBQcm9taXNlcyA9IFtdO1xyXG5cclxuXHQvLyBBcHBlbmQgY29udGVudCB0byBsYXlvdXRcclxuXHR0aGlzLmNvbnRlbnQuJGVsZW1lbnQuYXBwZW5kKFxyXG5cdFx0dGhpcy5wcm9ncmVzc0Jhci4kZWxlbWVudCxcclxuXHRcdChuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiSW5pdGlhbGlzaW5nOlwiLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxzdHJvbmcgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSkpLiRlbGVtZW50LFxyXG5cdFx0Li4udGhpcy5zZXR1cHRhc2tzLm1hcCh3aWRnZXQgPT4gd2lkZ2V0LiRlbGVtZW50KSxcclxuXHRcdHRoaXMuY2xvc2VCdXR0b24uJGVsZW1lbnRcclxuXHQpO1xyXG5cclxuXHQvLyBBcHBlbmQgbGF5b3V0IHRvIGRpYWxvZ1xyXG5cdHRoaXMuJGJvZHkuYXBwZW5kKCB0aGlzLmNvbnRlbnQuJGVsZW1lbnQgKTtcclxuXHJcblx0Ly8gQ29ubmVjdCBldmVudHMgdG8gaGFuZGxlcnNcclxuXHR0aGlzLmNsb3NlQnV0dG9uLmNvbm5lY3QoIHRoaXMsIHsgXCJjbGlja1wiOiBcIm9uQ2xvc2VCdXR0b25DbGlja1wiIH0gKTtcclxufTtcclxuXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLm9uQ2xvc2VCdXR0b25DbGljayA9IGZ1bmN0aW9uKCkge1xyXG5cdC8vIENsb3NlIHRoaXMgZGlhbG9nLCB3aXRob3V0IHBhc3NpbmcgYW55IGRhdGFcclxuXHR0aGlzLmNsb3NlKCk7XHJcbn07XHJcblxyXG4vLyBPdmVycmlkZSB0aGUgZ2V0Qm9keUhlaWdodCgpIG1ldGhvZCB0byBzcGVjaWZ5IGEgY3VzdG9tIGhlaWdodCAob3IgZG9uJ3QgdG8gdXNlIHRoZSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRlZCBoZWlnaHQpLlxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5nZXRCb2R5SGVpZ2h0ID0gZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiB0aGlzLmNvbnRlbnQuJGVsZW1lbnQub3V0ZXJIZWlnaHQoIHRydWUgKTtcclxufTtcclxuXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmluY3JlbWVudFByb2dyZXNzID0gZnVuY3Rpb24oYW1vdW50LCBtYXhpbXVtKSB7XHJcblx0dmFyIHByaW9yUHJvZ3Jlc3MgPSB0aGlzLnByb2dyZXNzQmFyLmdldFByb2dyZXNzKCk7XHJcblx0dmFyIGluY3JlbWVudGVkUHJvZ3Jlc3MgPSBNYXRoLm1pbihtYXhpbXVtIHx8IDEwMCwgcHJpb3JQcm9ncmVzcyArIGFtb3VudCk7XHJcblx0dGhpcy5wcm9ncmVzc0Jhci5zZXRQcm9ncmVzcyhpbmNyZW1lbnRlZFByb2dyZXNzKTtcclxufTtcclxuXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmFkZFRhc2tQcm9taXNlSGFuZGxlcnMgPSBmdW5jdGlvbih0YXNrUHJvbWlzZXMpIHtcclxuXHR2YXIgb25UYXNrRG9uZSA9IGluZGV4ID0+IHtcclxuXHRcdC8vIEFkZCBcIkRvbmUhXCIgdG8gbGFiZWxcclxuXHRcdHZhciB3aWRnZXQgPSB0aGlzLnNldHVwdGFza3NbaW5kZXhdO1xyXG5cdFx0d2lkZ2V0LnNldExhYmVsKHdpZGdldC5nZXRMYWJlbCgpICsgXCIgRG9uZSFcIik7XHJcblx0XHQvLyBJbmNyZW1lbnQgc3RhdHVzIGJhci4gU2hvdyBhIHNtb290aCB0cmFuc2l0aW9uIGJ5XHJcblx0XHQvLyB1c2luZyBzbWFsbCBzdGVwcyBvdmVyIGEgc2hvcnQgZHVyYXRpb24uXHJcblx0XHR2YXIgdG90YWxJbmNyZW1lbnQgPSAyMDsgLy8gcGVyY2VudFxyXG5cdFx0dmFyIHRvdGFsVGltZSA9IDQwMDsgLy8gbWlsbGlzZWNvbmRzXHJcblx0XHR2YXIgdG90YWxTdGVwcyA9IDEwO1xyXG5cdFx0dmFyIGluY3JlbWVudFBlclN0ZXAgPSB0b3RhbEluY3JlbWVudCAvIHRvdGFsU3RlcHM7XHJcblxyXG5cdFx0Zm9yICggdmFyIHN0ZXA9MDsgc3RlcCA8IHRvdGFsU3RlcHM7IHN0ZXArKykge1xyXG5cdFx0XHR3aW5kb3cuc2V0VGltZW91dChcclxuXHRcdFx0XHR0aGlzLmluY3JlbWVudFByb2dyZXNzLmJpbmQodGhpcyksXHJcblx0XHRcdFx0dG90YWxUaW1lICogc3RlcCAvIHRvdGFsU3RlcHMsXHJcblx0XHRcdFx0aW5jcmVtZW50UGVyU3RlcFxyXG5cdFx0XHQpO1xyXG5cdFx0fVxyXG5cdH07XHJcblx0dmFyIG9uVGFza0Vycm9yID0gKGluZGV4LCBjb2RlLCBpbmZvKSA9PiB7XHJcblx0XHR2YXIgd2lkZ2V0ID0gdGhpcy5zZXR1cHRhc2tzW2luZGV4XTtcclxuXHRcdHdpZGdldC5zZXRMYWJlbChcclxuXHRcdFx0d2lkZ2V0LmdldExhYmVsKCkgKyBcIiBGYWlsZWQuIFwiICsgbWFrZUVycm9yTXNnKGNvZGUsIGluZm8pXHJcblx0XHQpO1xyXG5cdFx0dGhpcy5jbG9zZUJ1dHRvbi50b2dnbGUodHJ1ZSk7XHJcblx0XHR0aGlzLnVwZGF0ZVNpemUoKTtcclxuXHR9O1xyXG5cdHRhc2tQcm9taXNlcy5mb3JFYWNoKGZ1bmN0aW9uKHByb21pc2UsIGluZGV4KSB7XHJcblx0XHRwcm9taXNlLnRoZW4oXHJcblx0XHRcdCgpID0+IG9uVGFza0RvbmUoaW5kZXgpLFxyXG5cdFx0XHQoY29kZSwgaW5mbykgPT4gb25UYXNrRXJyb3IoaW5kZXgsIGNvZGUsIGluZm8pXHJcblx0XHQpO1xyXG5cdH0pO1xyXG59O1xyXG5cclxuLy8gVXNlIGdldFNldHVwUHJvY2VzcygpIHRvIHNldCB1cCB0aGUgd2luZG93IHdpdGggZGF0YSBwYXNzZWQgdG8gaXQgYXQgdGhlIHRpbWUgXHJcbi8vIG9mIG9wZW5pbmdcclxuTG9hZERpYWxvZy5wcm90b3R5cGUuZ2V0U2V0dXBQcm9jZXNzID0gZnVuY3Rpb24gKCBkYXRhICkge1xyXG5cdGRhdGEgPSBkYXRhIHx8IHt9O1xyXG5cdHJldHVybiBMb2FkRGlhbG9nLnN1cGVyLnByb3RvdHlwZS5nZXRTZXR1cFByb2Nlc3MuY2FsbCggdGhpcywgZGF0YSApXHJcblx0XHQubmV4dCggKCkgPT4ge1xyXG5cdFx0XHR2YXIgc2hvd09yZXNUYXNrID0gISFkYXRhLm9yZXM7XHJcblx0XHRcdHRoaXMuc2V0dXB0YXNrc1s1XS50b2dnbGUoc2hvd09yZXNUYXNrKTtcclxuXHRcdFx0dmFyIHRhc2tQcm9taXNlcyA9IGRhdGEub3JlcyA/IGRhdGEucHJvbWlzZXMgOiBkYXRhLnByb21pc2VzLnNsaWNlKDAsIC0xKTtcclxuXHRcdFx0ZGF0YS5pc09wZW5lZC50aGVuKCgpID0+IHRoaXMuYWRkVGFza1Byb21pc2VIYW5kbGVycyh0YXNrUHJvbWlzZXMpKTtcclxuXHRcdH0sIHRoaXMgKTtcclxufTtcclxuXHJcbi8vIFByZXZlbnQgd2luZG93IGZyb20gY2xvc2luZyB0b28gcXVpY2tseSwgdXNpbmcgZ2V0SG9sZFByb2Nlc3MoKVxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5nZXRIb2xkUHJvY2VzcyA9IGZ1bmN0aW9uICggZGF0YSApIHtcclxuXHRkYXRhID0gZGF0YSB8fCB7fTtcclxuXHRpZiAoZGF0YS5zdWNjZXNzKSB7XHJcblx0XHQvLyBXYWl0IGEgYml0IGJlZm9yZSBwcm9jZXNzaW5nIHRoZSBjbG9zZSwgd2hpY2ggaGFwcGVucyBhdXRvbWF0aWNhbGx5XHJcblx0XHRyZXR1cm4gTG9hZERpYWxvZy5zdXBlci5wcm90b3R5cGUuZ2V0SG9sZFByb2Nlc3MuY2FsbCggdGhpcywgZGF0YSApXHJcblx0XHRcdC5uZXh0KDgwMCk7XHJcblx0fVxyXG5cdC8vIE5vIG5lZWQgdG8gd2FpdCBpZiBjbG9zZWQgbWFudWFsbHlcclxuXHRyZXR1cm4gTG9hZERpYWxvZy5zdXBlci5wcm90b3R5cGUuZ2V0SG9sZFByb2Nlc3MuY2FsbCggdGhpcywgZGF0YSApO1xyXG59O1xyXG5cclxuLy8gVXNlIHRoZSBnZXRUZWFyZG93blByb2Nlc3MoKSBtZXRob2QgdG8gcGVyZm9ybSBhY3Rpb25zIHdoZW5ldmVyIHRoZSBkaWFsb2cgaXMgY2xvc2VkLiBcclxuTG9hZERpYWxvZy5wcm90b3R5cGUuZ2V0VGVhcmRvd25Qcm9jZXNzID0gZnVuY3Rpb24gKCBkYXRhICkge1xyXG5cdHJldHVybiBMb2FkRGlhbG9nLnN1cGVyLnByb3RvdHlwZS5nZXRUZWFyZG93blByb2Nlc3MuY2FsbCggdGhpcywgZGF0YSApXHJcblx0XHQuZmlyc3QoICgpID0+IHtcclxuXHRcdC8vIFBlcmZvcm0gY2xlYW51cDogcmVzZXQgbGFiZWxzXHJcblx0XHRcdHRoaXMuc2V0dXB0YXNrcy5mb3JFYWNoKCBzZXR1cHRhc2sgPT4ge1xyXG5cdFx0XHRcdHZhciBjdXJyZW50TGFiZWwgPSBzZXR1cHRhc2suZ2V0TGFiZWwoKTtcclxuXHRcdFx0XHRzZXR1cHRhc2suc2V0TGFiZWwoXHJcblx0XHRcdFx0XHRjdXJyZW50TGFiZWwuc2xpY2UoMCwgY3VycmVudExhYmVsLmluZGV4T2YoXCIuLi5cIikrMylcclxuXHRcdFx0XHQpO1xyXG5cdFx0XHR9ICk7XHJcblx0XHR9LCB0aGlzICk7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBMb2FkRGlhbG9nOyIsImltcG9ydCBCYW5uZXJXaWRnZXQgZnJvbSBcIi4vQ29tcG9uZW50cy9CYW5uZXJXaWRnZXRcIjtcclxuXHJcbmZ1bmN0aW9uIE1haW5XaW5kb3coIGNvbmZpZyApIHtcclxuXHRNYWluV2luZG93LnN1cGVyLmNhbGwoIHRoaXMsIGNvbmZpZyApO1xyXG59XHJcbk9PLmluaGVyaXRDbGFzcyggTWFpbldpbmRvdywgT08udWkuUHJvY2Vzc0RpYWxvZyApO1xyXG5cclxuTWFpbldpbmRvdy5zdGF0aWMubmFtZSA9IFwibWFpblwiO1xyXG5NYWluV2luZG93LnN0YXRpYy50aXRsZSA9IFwiUmF0ZXJcIjtcclxuTWFpbldpbmRvdy5zdGF0aWMuc2l6ZSA9IFwibGFyZ2VcIjtcclxuTWFpbldpbmRvdy5zdGF0aWMuYWN0aW9ucyA9IFtcclxuXHQvLyBQcmltYXJ5ICh0b3AgcmlnaHQpOlxyXG5cdHtcclxuXHRcdGxhYmVsOiBcIlhcIiwgLy8gbm90IHVzaW5nIGFuIGljb24gc2luY2UgY29sb3IgYmVjb21lcyBpbnZlcnRlZCwgaS5lLiB3aGl0ZSBvbiBsaWdodC1ncmV5XHJcblx0XHR0aXRsZTogXCJDbG9zZSAoYW5kIGRpc2NhcmQgYW55IGNoYW5nZXMpXCIsXHJcblx0XHRmbGFnczogXCJwcmltYXJ5XCIsXHJcblx0fSxcclxuXHQvLyBTYWZlICh0b3AgbGVmdClcclxuXHR7XHJcblx0XHRhY3Rpb246IFwiaGVscFwiLFxyXG5cdFx0ZmxhZ3M6IFwic2FmZVwiLFxyXG5cdFx0bGFiZWw6IFwiP1wiLCAvLyBub3QgdXNpbmcgaWNvbiwgdG8gbWlycm9yIENsb3NlIGFjdGlvblxyXG5cdFx0dGl0bGU6IFwiaGVscFwiXHJcblx0fSxcclxuXHQvLyBPdGhlcnMgKGJvdHRvbSlcclxuXHR7XHJcblx0XHRhY3Rpb246IFwic2F2ZVwiLFxyXG5cdFx0bGFiZWw6IG5ldyBPTy51aS5IdG1sU25pcHBldChcIjxzcGFuIHN0eWxlPSdwYWRkaW5nOjAgMWVtOyc+U2F2ZTwvc3Bhbj5cIiksXHJcblx0XHRmbGFnczogW1wicHJpbWFyeVwiLCBcInByb2dyZXNzaXZlXCJdXHJcblx0fSxcclxuXHR7XHJcblx0XHRhY3Rpb246IFwicHJldmlld1wiLFxyXG5cdFx0bGFiZWw6IFwiU2hvdyBwcmV2aWV3XCJcclxuXHR9LFxyXG5cdHtcclxuXHRcdGFjdGlvbjogXCJjaGFuZ2VzXCIsXHJcblx0XHRsYWJlbDogXCJTaG93IGNoYW5nZXNcIlxyXG5cdH0sXHJcblx0e1xyXG5cdFx0YWN0aW9uOiBcImNhbmNlbFwiLFxyXG5cdFx0bGFiZWw6IFwiQ2FuY2VsXCJcclxuXHR9XHJcbl07XHJcblxyXG4vLyBDdXN0b21pemUgdGhlIGluaXRpYWxpemUoKSBmdW5jdGlvbjogVGhpcyBpcyB3aGVyZSB0byBhZGQgY29udGVudCB0byB0aGUgZGlhbG9nIGJvZHkgYW5kIHNldCB1cCBldmVudCBoYW5kbGVycy5cclxuTWFpbldpbmRvdy5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uICgpIHtcclxuXHQvLyBDYWxsIHRoZSBwYXJlbnQgbWV0aG9kLlxyXG5cdE1haW5XaW5kb3cuc3VwZXIucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCggdGhpcyApO1xyXG5cdC8vIENyZWF0ZSBsYXlvdXRzXHJcblx0dGhpcy50b3BCYXIgPSBuZXcgT08udWkuUGFuZWxMYXlvdXQoIHtcclxuXHRcdGV4cGFuZGVkOiBmYWxzZSxcclxuXHRcdGZyYW1lZDogZmFsc2UsXHJcblx0XHRwYWRkZWQ6IGZhbHNlXHJcblx0fSApO1xyXG5cdHRoaXMuY29udGVudCA9IG5ldyBPTy51aS5QYW5lbExheW91dCgge1xyXG5cdFx0ZXhwYW5kZWQ6IHRydWUsXHJcblx0XHRwYWRkZWQ6IHRydWUsXHJcblx0XHRzY3JvbGxhYmxlOiB0cnVlXHJcblx0fSApO1xyXG5cdHRoaXMub3V0ZXJMYXlvdXQgPSBuZXcgT08udWkuU3RhY2tMYXlvdXQoIHtcclxuXHRcdGl0ZW1zOiBbXHJcblx0XHRcdHRoaXMudG9wQmFyLFxyXG5cdFx0XHR0aGlzLmNvbnRlbnRcclxuXHRcdF0sXHJcblx0XHRjb250aW51b3VzOiB0cnVlLFxyXG5cdFx0ZXhwYW5kZWQ6IHRydWVcclxuXHR9ICk7XHJcblx0Ly8gQ3JlYXRlIHRvcEJhciBjb250ZW50XHJcblx0dGhpcy5zZWFyY2hCb3ggPSBuZXcgT08udWkuQ29tYm9Cb3hJbnB1dFdpZGdldCgge1xyXG5cdFx0cGxhY2Vob2xkZXI6IFwiQWRkIGEgV2lraVByb2plY3QuLi5cIixcclxuXHRcdG9wdGlvbnM6IFtcclxuXHRcdFx0eyAvLyBGSVhNRTogVGhlc2UgYXJlIHBsYWNlaG9sZGVycy5cclxuXHRcdFx0XHRkYXRhOiBcIk9wdGlvbiAxXCIsXHJcblx0XHRcdFx0bGFiZWw6IFwiT3B0aW9uIE9uZVwiXHJcblx0XHRcdH0sXHJcblx0XHRcdHtcclxuXHRcdFx0XHRkYXRhOiBcIk9wdGlvbiAyXCIsXHJcblx0XHRcdFx0bGFiZWw6IFwiT3B0aW9uIFR3b1wiXHJcblx0XHRcdH0sXHJcblx0XHRcdHtcclxuXHRcdFx0XHRkYXRhOiBcIk9wdGlvbiAzXCIsXHJcblx0XHRcdFx0bGFiZWw6IFwiT3B0aW9uIFRocmVlXCJcclxuXHRcdFx0fVxyXG5cdFx0XSxcclxuXHRcdCRlbGVtZW50OiAkKFwiPGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmUtYmxvY2s7d2lkdGg6MTAwJTttYXgtd2lkdGg6NDI1cHg7Jz5cIiksXHJcblx0XHQkb3ZlcmxheTogdGhpcy4kb3ZlcmxheSxcclxuXHR9ICk7XHJcblxyXG5cdHRoaXMuc2V0QWxsRHJvcERvd24gPSBuZXcgT08udWkuRHJvcGRvd25XaWRnZXQoIHtcclxuXHRcdGxhYmVsOiBuZXcgT08udWkuSHRtbFNuaXBwZXQoXCI8c3BhbiBzdHlsZT1cXFwiY29sb3I6Izc3N1xcXCI+U2V0IGFsbC4uLjwvc3Bhbj5cIiksXHJcblx0XHRtZW51OiB7IC8vIEZJWE1FOiBuZWVkcyByZWFsIGRhdGFcclxuXHRcdFx0aXRlbXM6IFtcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudVNlY3Rpb25PcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGxhYmVsOiBcIkNsYXNzZXNcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJCXCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJCXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwiQ1wiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiQ1wiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcInN0YXJ0XCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJTdGFydFwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51U2VjdGlvbk9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0bGFiZWw6IFwiSW1wb3J0YW5jZXNcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJ0b3BcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIlRvcFwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcImhpZ2hcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIkhpZ2hcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJtaWRcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIk1pZFwiXHJcblx0XHRcdFx0fSApXHJcblx0XHRcdF1cclxuXHRcdH0sXHJcblx0XHQkZWxlbWVudDogJChcIjxzcGFuIHN0eWxlPVxcXCJkaXNwbGF5OmlubGluZS1ibG9jazt3aWR0aDphdXRvXFxcIj5cIiksXHJcblx0XHQkb3ZlcmxheTogdGhpcy4kb3ZlcmxheSxcclxuXHR9ICk7XHJcblxyXG5cdHRoaXMucmVtb3ZlQWxsQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCgge1xyXG5cdFx0aWNvbjogXCJ0cmFzaFwiLFxyXG5cdFx0dGl0bGU6IFwiUmVtb3ZlIGFsbFwiLFxyXG5cdFx0ZmxhZ3M6IFwiZGVzdHJ1Y3RpdmVcIlxyXG5cdH0gKTtcclxuXHR0aGlzLmNsZWFyQWxsQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCgge1xyXG5cdFx0aWNvbjogXCJjYW5jZWxcIixcclxuXHRcdHRpdGxlOiBcIkNsZWFyIGFsbFwiLFxyXG5cdFx0ZmxhZ3M6IFwiZGVzdHJ1Y3RpdmVcIlxyXG5cdH0gKTtcclxuXHR0aGlzLmJ5cGFzc0FsbEJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoIHtcclxuXHRcdGljb246IFwiYXJ0aWNsZVJlZGlyZWN0XCIsXHJcblx0XHR0aXRsZTogXCJCeXBhc3MgYWxsIHJlZGlyZWN0c1wiXHJcblx0fSApO1xyXG5cdHRoaXMuZG9BbGxCdXR0b25zID0gbmV3IE9PLnVpLkJ1dHRvbkdyb3VwV2lkZ2V0KCB7XHJcblx0XHRpdGVtczogW1xyXG5cdFx0XHR0aGlzLnJlbW92ZUFsbEJ1dHRvbixcclxuXHRcdFx0dGhpcy5jbGVhckFsbEJ1dHRvbixcclxuXHRcdFx0dGhpcy5ieXBhc3NBbGxCdXR0b25cclxuXHRcdF0sXHJcblx0XHQkZWxlbWVudDogJChcIjxzcGFuIHN0eWxlPSdmbG9hdDpyaWdodDsnPlwiKSxcclxuXHR9ICk7XHJcblxyXG5cdHRoaXMudG9wQmFyLiRlbGVtZW50LmFwcGVuZChcclxuXHRcdHRoaXMuc2VhcmNoQm94LiRlbGVtZW50LFxyXG5cdFx0dGhpcy5zZXRBbGxEcm9wRG93bi4kZWxlbWVudCxcclxuXHRcdHRoaXMuZG9BbGxCdXR0b25zLiRlbGVtZW50XHJcblx0KS5jc3MoXCJiYWNrZ3JvdW5kXCIsXCIjY2NjXCIpO1xyXG5cclxuXHQvLyBGSVhNRTogdGhpcyBpcyBwbGFjZWhvbGRlciBjb250ZW50XHJcblx0Ly8gdGhpcy5jb250ZW50LiRlbGVtZW50LmFwcGVuZCggXCI8c3Bhbj4oTm8gcHJvamVjdCBiYW5uZXJzIHlldCk8L3NwYW4+XCIgKTtcclxuXHJcblx0dGhpcy4kYm9keS5hcHBlbmQoIHRoaXMub3V0ZXJMYXlvdXQuJGVsZW1lbnQgKTtcclxufTtcclxuXHJcbi8vIE92ZXJyaWRlIHRoZSBnZXRCb2R5SGVpZ2h0KCkgbWV0aG9kIHRvIHNwZWNpZnkgYSBjdXN0b20gaGVpZ2h0XHJcbk1haW5XaW5kb3cucHJvdG90eXBlLmdldEJvZHlIZWlnaHQgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHRoaXMudG9wQmFyLiRlbGVtZW50Lm91dGVySGVpZ2h0KCB0cnVlICkgKyB0aGlzLmNvbnRlbnQuJGVsZW1lbnQub3V0ZXJIZWlnaHQoIHRydWUgKTtcclxufTtcclxuXHJcbi8vIFVzZSBnZXRTZXR1cFByb2Nlc3MoKSB0byBzZXQgdXAgdGhlIHdpbmRvdyB3aXRoIGRhdGEgcGFzc2VkIHRvIGl0IGF0IHRoZSB0aW1lIFxyXG4vLyBvZiBvcGVuaW5nXHJcbk1haW5XaW5kb3cucHJvdG90eXBlLmdldFNldHVwUHJvY2VzcyA9IGZ1bmN0aW9uICggZGF0YSApIHtcclxuXHRkYXRhID0gZGF0YSB8fCB7fTtcclxuXHRyZXR1cm4gTWFpbldpbmRvdy5zdXBlci5wcm90b3R5cGUuZ2V0U2V0dXBQcm9jZXNzLmNhbGwoIHRoaXMsIGRhdGEgKVxyXG5cdFx0Lm5leHQoICgpID0+IHtcclxuXHRcdFx0Ly8gVE9ETzogU2V0IHVwIHdpbmRvdyBiYXNlZCBvbiBkYXRhXHJcblx0XHRcdHRoaXMuYmFubmVycyA9IGRhdGEuYmFubmVycy5tYXAoYmFubmVyVGVtcGxhdGUgPT4gbmV3IEJhbm5lcldpZGdldChiYW5uZXJUZW1wbGF0ZSkpO1xyXG5cdFx0XHRmb3IgKGNvbnN0IGJhbm5lciBvZiB0aGlzLmJhbm5lcnMpIHtcclxuXHRcdFx0XHR0aGlzLmNvbnRlbnQuJGVsZW1lbnQuYXBwZW5kKGJhbm5lci4kZWxlbWVudCk7XHJcblx0XHRcdH1cclxuXHRcdFx0dGhpcy50YWxrV2lraXRleHQgPSBkYXRhLnRhbGtXaWtpdGV4dDtcclxuXHRcdFx0dGhpcy50YWxrcGFnZSA9IGRhdGEudGFsa3BhZ2U7XHJcblx0XHRcdHRoaXMudXBkYXRlU2l6ZSgpO1xyXG5cdFx0fSwgdGhpcyApO1xyXG59O1xyXG5cclxuLy8gU2V0IHVwIHRoZSB3aW5kb3cgaXQgaXMgcmVhZHk6IGF0dGFjaGVkIHRvIHRoZSBET00sIGFuZCBvcGVuaW5nIGFuaW1hdGlvbiBjb21wbGV0ZWRcclxuTWFpbldpbmRvdy5wcm90b3R5cGUuZ2V0UmVhZHlQcm9jZXNzID0gZnVuY3Rpb24gKCBkYXRhICkge1xyXG5cdGRhdGEgPSBkYXRhIHx8IHt9O1xyXG5cdHJldHVybiBNYWluV2luZG93LnN1cGVyLnByb3RvdHlwZS5nZXRSZWFkeVByb2Nlc3MuY2FsbCggdGhpcywgZGF0YSApXHJcblx0XHQubmV4dCggKCkgPT4gdGhpcy5zZWFyY2hCb3guZm9jdXMoKSApO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgTWFpbldpbmRvdzsiLCJpbXBvcnQgY29uZmlnIGZyb20gXCIuL2NvbmZpZ1wiO1xyXG5pbXBvcnQge0FQSSwgbWFrZUVycm9yTXNnfSBmcm9tIFwiLi91dGlsXCI7XHJcbmltcG9ydCBzZXR1cFJhdGVyIGZyb20gXCIuL3NldHVwXCI7XHJcblxyXG52YXIgYXV0b1N0YXJ0ID0gZnVuY3Rpb24gYXV0b1N0YXJ0KCkge1xyXG5cdGlmICggd2luZG93LnJhdGVyX2F1dG9zdGFydE5hbWVzcGFjZXMgPT0gbnVsbCB8fCBjb25maWcubXcud2dJc01haW5QYWdlICkge1xyXG5cdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHR9XHJcblx0XHJcblx0dmFyIGF1dG9zdGFydE5hbWVzcGFjZXMgPSAoICQuaXNBcnJheSh3aW5kb3cucmF0ZXJfYXV0b3N0YXJ0TmFtZXNwYWNlcykgKSA/IHdpbmRvdy5yYXRlcl9hdXRvc3RhcnROYW1lc3BhY2VzIDogW3dpbmRvdy5yYXRlcl9hdXRvc3RhcnROYW1lc3BhY2VzXTtcclxuXHRcclxuXHRpZiAoIC0xID09PSBhdXRvc3RhcnROYW1lc3BhY2VzLmluZGV4T2YoY29uZmlnLm13LndnTmFtZXNwYWNlTnVtYmVyKSApIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0fVxyXG5cdFxyXG5cdGlmICggLyg/OlxcP3wmKSg/OmFjdGlvbnxkaWZmfG9sZGlkKT0vLnRlc3Qod2luZG93LmxvY2F0aW9uLmhyZWYpICkge1xyXG5cdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHR9XHJcblx0XHJcblx0Ly8gQ2hlY2sgaWYgdGFsayBwYWdlIGV4aXN0c1xyXG5cdGlmICggJChcIiNjYS10YWxrLm5ld1wiKS5sZW5ndGggKSB7XHJcblx0XHRyZXR1cm4gc2V0dXBSYXRlcigpO1xyXG5cdH1cclxuXHRcclxuXHR2YXIgdGhpc1BhZ2UgPSBtdy5UaXRsZS5uZXdGcm9tVGV4dChjb25maWcubXcud2dQYWdlTmFtZSk7XHJcblx0dmFyIHRhbGtQYWdlID0gdGhpc1BhZ2UgJiYgdGhpc1BhZ2UuZ2V0VGFsa1BhZ2UoKTtcclxuXHRpZiAoIXRhbGtQYWdlKSB7XHJcblx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgpO1xyXG5cdH1cclxuXHJcblx0LyogQ2hlY2sgdGVtcGxhdGVzIHByZXNlbnQgb24gdGFsayBwYWdlLiBGZXRjaGVzIGluZGlyZWN0bHkgdHJhbnNjbHVkZWQgdGVtcGxhdGVzLCBzbyB3aWxsIGZpbmRcclxuXHRcdFRlbXBsYXRlOldQQmFubmVyTWV0YSAoYW5kIGl0cyBzdWJ0ZW1wbGF0ZXMpLiBCdXQgc29tZSBiYW5uZXJzIHN1Y2ggYXMgTUlMSElTVCBkb24ndCB1c2UgdGhhdFxyXG5cdFx0bWV0YSB0ZW1wbGF0ZSwgc28gd2UgYWxzbyBoYXZlIHRvIGNoZWNrIGZvciB0ZW1wbGF0ZSB0aXRsZXMgY29udGFpbmcgJ1dpa2lQcm9qZWN0J1xyXG5cdCovXHJcblx0cmV0dXJuIEFQSS5nZXQoe1xyXG5cdFx0YWN0aW9uOiBcInF1ZXJ5XCIsXHJcblx0XHRmb3JtYXQ6IFwianNvblwiLFxyXG5cdFx0cHJvcDogXCJ0ZW1wbGF0ZXNcIixcclxuXHRcdHRpdGxlczogdGFsa1BhZ2UuZ2V0UHJlZml4ZWRUZXh0KCksXHJcblx0XHR0bG5hbWVzcGFjZTogXCIxMFwiLFxyXG5cdFx0dGxsaW1pdDogXCI1MDBcIixcclxuXHRcdGluZGV4cGFnZWlkczogMVxyXG5cdH0pXHJcblx0XHQudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcclxuXHRcdFx0dmFyIGlkID0gcmVzdWx0LnF1ZXJ5LnBhZ2VpZHM7XHJcblx0XHRcdHZhciB0ZW1wbGF0ZXMgPSByZXN1bHQucXVlcnkucGFnZXNbaWRdLnRlbXBsYXRlcztcclxuXHRcdFxyXG5cdFx0XHRpZiAoICF0ZW1wbGF0ZXMgKSB7XHJcblx0XHRcdFx0cmV0dXJuIHNldHVwUmF0ZXIoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHJcblx0XHRcdHZhciBoYXNXaWtpcHJvamVjdCA9IHRlbXBsYXRlcy5zb21lKHRlbXBsYXRlID0+IC8oV2lraVByb2plY3R8V1BCYW5uZXIpLy50ZXN0KHRlbXBsYXRlLnRpdGxlKSk7XHJcblx0XHRcclxuXHRcdFx0aWYgKCAhaGFzV2lraXByb2plY3QgKSB7XHJcblx0XHRcdFx0cmV0dXJuIHNldHVwUmF0ZXIoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHJcblx0XHR9LFxyXG5cdFx0ZnVuY3Rpb24oY29kZSwganF4aHIpIHtcclxuXHRcdC8vIFNpbGVudGx5IGlnbm9yZSBmYWlsdXJlcyAoanVzdCBsb2cgdG8gY29uc29sZSlcclxuXHRcdFx0Y29uc29sZS53YXJuKFxyXG5cdFx0XHRcdFwiW1JhdGVyXSBFcnJvciB3aGlsZSBjaGVja2luZyB3aGV0aGVyIHRvIGF1dG9zdGFydC5cIiArXHJcblx0XHRcdCggY29kZSA9PSBudWxsICkgPyBcIlwiIDogXCIgXCIgKyBtYWtlRXJyb3JNc2coY29kZSwganF4aHIpXHJcblx0XHRcdCk7XHJcblx0XHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0XHR9KTtcclxuXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhdXRvU3RhcnQ7IiwiaW1wb3J0IHtpc0FmdGVyRGF0ZX0gZnJvbSBcIi4vdXRpbFwiO1xyXG5cclxuLyoqIHdyaXRlXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcclxuICogQHBhcmFtIHtBcnJheXxPYmplY3R9IHZhbFxyXG4gKiBAcGFyYW0ge051bWJlcn0gc3RhbGVEYXlzIE51bWJlciBvZiBkYXlzIGFmdGVyIHdoaWNoIHRoZSBkYXRhIGJlY29tZXMgc3RhbGUgKHVzYWJsZSwgYnV0IHNob3VsZFxyXG4gKiAgYmUgdXBkYXRlZCBmb3IgbmV4dCB0aW1lKS5cclxuICogQHBhcmFtIHtOdW1iZXJ9IGV4cGlyeURheXMgTnVtYmVyIG9mIGRheXMgYWZ0ZXIgd2hpY2ggdGhlIGNhY2hlZCBkYXRhIG1heSBiZSBkZWxldGVkLlxyXG4gKi9cclxudmFyIHdyaXRlID0gZnVuY3Rpb24oa2V5LCB2YWwsIHN0YWxlRGF5cywgZXhwaXJ5RGF5cykge1xyXG5cdHRyeSB7XHJcblx0XHR2YXIgZGVmYXVsdFN0YWxlRGF5cyA9IDE7XHJcblx0XHR2YXIgZGVmYXVsdEV4cGlyeURheXMgPSAzMDtcclxuXHRcdHZhciBtaWxsaXNlY29uZHNQZXJEYXkgPSAyNCo2MCo2MCoxMDAwO1xyXG5cclxuXHRcdHZhciBzdGFsZUR1cmF0aW9uID0gKHN0YWxlRGF5cyB8fCBkZWZhdWx0U3RhbGVEYXlzKSptaWxsaXNlY29uZHNQZXJEYXk7XHJcblx0XHR2YXIgZXhwaXJ5RHVyYXRpb24gPSAoZXhwaXJ5RGF5cyB8fCBkZWZhdWx0RXhwaXJ5RGF5cykqbWlsbGlzZWNvbmRzUGVyRGF5O1xyXG5cdFx0XHJcblx0XHR2YXIgc3RyaW5nVmFsID0gSlNPTi5zdHJpbmdpZnkoe1xyXG5cdFx0XHR2YWx1ZTogdmFsLFxyXG5cdFx0XHRzdGFsZURhdGU6IG5ldyBEYXRlKERhdGUubm93KCkgKyBzdGFsZUR1cmF0aW9uKS50b0lTT1N0cmluZygpLFxyXG5cdFx0XHRleHBpcnlEYXRlOiBuZXcgRGF0ZShEYXRlLm5vdygpICsgZXhwaXJ5RHVyYXRpb24pLnRvSVNPU3RyaW5nKClcclxuXHRcdH0pO1xyXG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJSYXRlci1cIitrZXksIHN0cmluZ1ZhbCk7XHJcblx0fSAgY2F0Y2goZSkge30gLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1lbXB0eVxyXG59O1xyXG4vKiogcmVhZFxyXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XHJcbiAqIEByZXR1cm5zIHtBcnJheXxPYmplY3R8U3RyaW5nfE51bGx9IENhY2hlZCBhcnJheSBvciBvYmplY3QsIG9yIGVtcHR5IHN0cmluZyBpZiBub3QgeWV0IGNhY2hlZCxcclxuICogICAgICAgICAgb3IgbnVsbCBpZiB0aGVyZSB3YXMgZXJyb3IuXHJcbiAqL1xyXG52YXIgcmVhZCA9IGZ1bmN0aW9uKGtleSkge1xyXG5cdHZhciB2YWw7XHJcblx0dHJ5IHtcclxuXHRcdHZhciBzdHJpbmdWYWwgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcIlJhdGVyLVwiK2tleSk7XHJcblx0XHRpZiAoIHN0cmluZ1ZhbCAhPT0gXCJcIiApIHtcclxuXHRcdFx0dmFsID0gSlNPTi5wYXJzZShzdHJpbmdWYWwpO1xyXG5cdFx0fVxyXG5cdH0gIGNhdGNoKGUpIHtcclxuXHRcdGNvbnNvbGUubG9nKFwiW1JhdGVyXSBlcnJvciByZWFkaW5nIFwiICsga2V5ICsgXCIgZnJvbSBsb2NhbFN0b3JhZ2UgY2FjaGU6XCIpO1xyXG5cdFx0Y29uc29sZS5sb2coXHJcblx0XHRcdFwiXFx0XCIgKyBlLm5hbWUgKyBcIiBtZXNzYWdlOiBcIiArIGUubWVzc2FnZSArXHJcblx0XHRcdCggZS5hdCA/IFwiIGF0OiBcIiArIGUuYXQgOiBcIlwiKSArXHJcblx0XHRcdCggZS50ZXh0ID8gXCIgdGV4dDogXCIgKyBlLnRleHQgOiBcIlwiKVxyXG5cdFx0KTtcclxuXHR9XHJcblx0cmV0dXJuIHZhbCB8fCBudWxsO1xyXG59O1xyXG52YXIgY2xlYXJJdGVtSWZJbnZhbGlkID0gZnVuY3Rpb24oa2V5KSB7XHJcblx0dmFyIGlzUmF0ZXJLZXkgPSBrZXkuaW5kZXhPZihcIlJhdGVyLVwiKSA9PT0gMDtcclxuXHRpZiAoICFpc1JhdGVyS2V5ICkge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHR2YXIgaXRlbSA9IHJlYWQoa2V5LnJlcGxhY2UoXCJSYXRlci1cIixcIlwiKSk7XHJcblx0dmFyIGlzSW52YWxpZCA9ICFpdGVtIHx8ICFpdGVtLmV4cGlyeURhdGUgfHwgaXNBZnRlckRhdGUoaXRlbS5leHBpcnlEYXRlKTtcclxuXHRpZiAoIGlzSW52YWxpZCApIHtcclxuXHRcdGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGtleSk7XHJcblx0fVxyXG59O1xyXG52YXIgY2xlYXJJbnZhbGlkSXRlbXMgPSBmdW5jdGlvbigpIHtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGxvY2FsU3RvcmFnZS5sZW5ndGg7IGkrKykge1xyXG5cdFx0c2V0VGltZW91dChjbGVhckl0ZW1JZkludmFsaWQsIDEwMCwgbG9jYWxTdG9yYWdlLmtleShpKSk7XHJcblx0fVxyXG59O1xyXG5cclxuZXhwb3J0IHsgd3JpdGUsIHJlYWQsIGNsZWFySXRlbUlmSW52YWxpZCwgY2xlYXJJbnZhbGlkSXRlbXMgfTsiLCIvLyBBIGdsb2JhbCBvYmplY3QgdGhhdCBzdG9yZXMgYWxsIHRoZSBwYWdlIGFuZCB1c2VyIGNvbmZpZ3VyYXRpb24gYW5kIHNldHRpbmdzXHJcbnZhciBjb25maWcgPSB7fTtcclxuLy8gU2NyaXB0IGluZm9cclxuY29uZmlnLnNjcmlwdCA9IHtcclxuXHQvLyBBZHZlcnQgdG8gYXBwZW5kIHRvIGVkaXQgc3VtbWFyaWVzXHJcblx0YWR2ZXJ0OiAgXCIgKFtbVXNlcjpFdmFkMzcvcmF0ZXIuanN8UmF0ZXJdXSlcIixcclxuXHR2ZXJzaW9uOiBcIjIuMC4wXCJcclxufTtcclxuLy8gUHJlZmVyZW5jZXM6IGdsb2JhbHMgdmFycyBhZGRlZCB0byB1c2VycycgY29tbW9uLmpzLCBvciBzZXQgdG8gZGVmYXVsdHMgaWYgdW5kZWZpbmVkXHJcbmNvbmZpZy5wcmVmcyA9IHtcclxuXHR3YXRjaGxpc3Q6IHdpbmRvdy5yYXRlcl93YXRjaGxpc3QgfHwgXCJwcmVmZXJlbmNlc1wiXHJcbn07XHJcbi8vIE1lZGlhV2lraSBjb25maWd1cmF0aW9uIHZhbHVlc1xyXG5jb25maWcubXcgPSBtdy5jb25maWcuZ2V0KCBbXHJcblx0XCJza2luXCIsXHJcblx0XCJ3Z1BhZ2VOYW1lXCIsXHJcblx0XCJ3Z05hbWVzcGFjZU51bWJlclwiLFxyXG5cdFwid2dVc2VyTmFtZVwiLFxyXG5cdFwid2dGb3JtYXR0ZWROYW1lc3BhY2VzXCIsXHJcblx0XCJ3Z01vbnRoTmFtZXNcIixcclxuXHRcIndnUmV2aXNpb25JZFwiLFxyXG5cdFwid2dTY3JpcHRQYXRoXCIsXHJcblx0XCJ3Z1NlcnZlclwiLFxyXG5cdFwid2dDYXRlZ29yaWVzXCIsXHJcblx0XCJ3Z0lzTWFpblBhZ2VcIlxyXG5dICk7XHJcblxyXG5jb25maWcucmVnZXggPSB7IC8qIGVzbGludC1kaXNhYmxlIG5vLXVzZWxlc3MtZXNjYXBlICovXHJcblx0Ly8gUGF0dGVybiB0byBmaW5kIHRlbXBsYXRlcywgd2hpY2ggbWF5IGNvbnRhaW4gb3RoZXIgdGVtcGxhdGVzXHJcblx0dGVtcGxhdGU6XHRcdC9cXHtcXHtcXHMqKFteI1xce1xcc10uKz8pXFxzKihcXHwoPzoufFxcbikqPyg/Oig/Olxce1xceyg/Oi58XFxuKSo/KD86KD86XFx7XFx7KD86LnxcXG4pKj9cXH1cXH0pKD86LnxcXG4pKj8pKj9cXH1cXH0pKD86LnxcXG4pKj8pKnwpXFx9XFx9XFxuPy9nLFxyXG5cdC8vIFBhdHRlcm4gdG8gZmluZCBgfHBhcmFtPXZhbHVlYCBvciBgfHZhbHVlYCwgd2hlcmUgYHZhbHVlYCBjYW4gb25seSBjb250YWluIGEgcGlwZVxyXG5cdC8vIGlmIHdpdGhpbiBzcXVhcmUgYnJhY2tldHMgKGkuZS4gd2lraWxpbmtzKSBvciBicmFjZXMgKGkuZS4gdGVtcGxhdGVzKVxyXG5cdHRlbXBsYXRlUGFyYW1zOlx0L1xcfCg/ISg/Oltee10rfXxbXlxcW10rXSkpKD86LnxcXHMpKj8oPz0oPzpcXHx8JCkoPyEoPzpbXntdK318W15cXFtdK10pKSkvZ1xyXG59OyAvKiBlc2xpbnQtZW5hYmxlIG5vLXVzZWxlc3MtZXNjYXBlICovXHJcbmNvbmZpZy5kZWZlcnJlZCA9IHt9O1xyXG5jb25maWcuYmFubmVyRGVmYXVsdHMgPSB7XHJcblx0Y2xhc3NlczogW1xyXG5cdFx0XCJGQVwiLFxyXG5cdFx0XCJGTFwiLFxyXG5cdFx0XCJBXCIsXHJcblx0XHRcIkdBXCIsXHJcblx0XHRcIkJcIixcclxuXHRcdFwiQ1wiLFxyXG5cdFx0XCJTdGFydFwiLFxyXG5cdFx0XCJTdHViXCIsXHJcblx0XHRcIkxpc3RcIlxyXG5cdF0sXHJcblx0aW1wb3J0YW5jZXM6IFtcclxuXHRcdFwiVG9wXCIsXHJcblx0XHRcIkhpZ2hcIixcclxuXHRcdFwiTWlkXCIsXHJcblx0XHRcIkxvd1wiXHJcblx0XSxcclxuXHRleHRlbmRlZENsYXNzZXM6IFtcclxuXHRcdFwiQ2F0ZWdvcnlcIixcclxuXHRcdFwiRHJhZnRcIixcclxuXHRcdFwiRmlsZVwiLFxyXG5cdFx0XCJQb3J0YWxcIixcclxuXHRcdFwiUHJvamVjdFwiLFxyXG5cdFx0XCJUZW1wbGF0ZVwiLFxyXG5cdFx0XCJCcGx1c1wiLFxyXG5cdFx0XCJGdXR1cmVcIixcclxuXHRcdFwiQ3VycmVudFwiLFxyXG5cdFx0XCJEaXNhbWJpZ1wiLFxyXG5cdFx0XCJOQVwiLFxyXG5cdFx0XCJSZWRpcmVjdFwiLFxyXG5cdFx0XCJCb29rXCJcclxuXHRdLFxyXG5cdGV4dGVuZGVkSW1wb3J0YW5jZXM6IFtcclxuXHRcdFwiVG9wXCIsXHJcblx0XHRcIkhpZ2hcIixcclxuXHRcdFwiTWlkXCIsXHJcblx0XHRcIkxvd1wiLFxyXG5cdFx0XCJCb3R0b21cIixcclxuXHRcdFwiTkFcIlxyXG5cdF1cclxufTtcclxuY29uZmlnLmN1c3RvbUNsYXNzZXMgPSB7XHJcblx0XCJXaWtpUHJvamVjdCBNaWxpdGFyeSBoaXN0b3J5XCI6IFtcclxuXHRcdFwiQUxcIixcclxuXHRcdFwiQkxcIixcclxuXHRcdFwiQ0xcIlxyXG5cdF0sXHJcblx0XCJXaWtpUHJvamVjdCBQb3J0YWxzXCI6IFtcclxuXHRcdFwiRlBvXCIsXHJcblx0XHRcIkNvbXBsZXRlXCIsXHJcblx0XHRcIlN1YnN0YW50aWFsXCIsXHJcblx0XHRcIkJhc2ljXCIsXHJcblx0XHRcIkluY29tcGxldGVcIixcclxuXHRcdFwiTWV0YVwiXHJcblx0XVxyXG59O1xyXG5jb25maWcuc2hlbGxUZW1wbGF0ZXMgPSBbXHJcblx0XCJXaWtpUHJvamVjdCBiYW5uZXIgc2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0QmFubmVyc1wiLFxyXG5cdFwiV2lraVByb2plY3QgQmFubmVyc1wiLFxyXG5cdFwiV1BCXCIsXHJcblx0XCJXUEJTXCIsXHJcblx0XCJXaWtpcHJvamVjdGJhbm5lcnNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdCBCYW5uZXIgU2hlbGxcIixcclxuXHRcIldwYlwiLFxyXG5cdFwiV1BCYW5uZXJTaGVsbFwiLFxyXG5cdFwiV3Bic1wiLFxyXG5cdFwiV2lraXByb2plY3RiYW5uZXJzXCIsXHJcblx0XCJXUCBCYW5uZXIgU2hlbGxcIixcclxuXHRcIldQIGJhbm5lciBzaGVsbFwiLFxyXG5cdFwiQmFubmVyc2hlbGxcIixcclxuXHRcIldpa2lwcm9qZWN0IGJhbm5lciBzaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3QgQmFubmVycyBTaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3RCYW5uZXIgU2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0QmFubmVyU2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0IEJhbm5lclNoZWxsXCIsXHJcblx0XCJXaWtpcHJvamVjdEJhbm5lclNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdCBiYW5uZXIgc2hlbGwvcmVkaXJlY3RcIixcclxuXHRcIldpa2lQcm9qZWN0IFNoZWxsXCIsXHJcblx0XCJCYW5uZXIgc2hlbGxcIixcclxuXHRcIlNjb3BlIHNoZWxsXCIsXHJcblx0XCJQcm9qZWN0IHNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdCBiYW5uZXJcIlxyXG5dO1xyXG5jb25maWcuZGVmYXVsdFBhcmFtZXRlckRhdGEgPSB7XHJcblx0XCJhdXRvXCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiQXV0by1yYXRlZFwiXHJcblx0XHR9LFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJBdXRvbWF0aWNhbGx5IHJhdGVkIGJ5IGEgYm90LiBBbGxvd2VkIHZhbHVlczogWyd5ZXMnXS5cIlxyXG5cdFx0fSxcclxuXHRcdFwiYXV0b3ZhbHVlXCI6IFwieWVzXCJcclxuXHR9LFxyXG5cdFwibGlzdGFzXCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiTGlzdCBhc1wiXHJcblx0XHR9LFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJTb3J0a2V5IGZvciB0YWxrIHBhZ2VcIlxyXG5cdFx0fVxyXG5cdH0sXHJcblx0XCJzbWFsbFwiOiB7XHJcblx0XHRcImxhYmVsXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIlNtYWxsP1wiLFxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiRGlzcGxheSBhIHNtYWxsIHZlcnNpb24uIEFsbG93ZWQgdmFsdWVzOiBbJ3llcyddLlwiXHJcblx0XHR9LFxyXG5cdFx0XCJhdXRvdmFsdWVcIjogXCJ5ZXNcIlxyXG5cdH0sXHJcblx0XCJhdHRlbnRpb25cIjoge1xyXG5cdFx0XCJsYWJlbFwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJBdHRlbnRpb24gcmVxdWlyZWQ/XCIsXHJcblx0XHR9LFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJJbW1lZGlhdGUgYXR0ZW50aW9uIHJlcXVpcmVkLiBBbGxvd2VkIHZhbHVlczogWyd5ZXMnXS5cIlxyXG5cdFx0fSxcclxuXHRcdFwiYXV0b3ZhbHVlXCI6IFwieWVzXCJcclxuXHR9LFxyXG5cdFwibmVlZHMtaW1hZ2VcIjoge1xyXG5cdFx0XCJsYWJlbFwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJOZWVkcyBpbWFnZT9cIixcclxuXHRcdH0sXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIlJlcXVlc3QgdGhhdCBhbiBpbWFnZSBvciBwaG90b2dyYXBoIG9mIHRoZSBzdWJqZWN0IGJlIGFkZGVkIHRvIHRoZSBhcnRpY2xlLiBBbGxvd2VkIHZhbHVlczogWyd5ZXMnXS5cIlxyXG5cdFx0fSxcclxuXHRcdFwiYWxpYXNlc1wiOiBbXHJcblx0XHRcdFwibmVlZHMtcGhvdG9cIlxyXG5cdFx0XSxcclxuXHRcdFwiYXV0b3ZhbHVlXCI6IFwieWVzXCIsXHJcblx0XHRcInN1Z2dlc3RlZFwiOiB0cnVlXHJcblx0fSxcclxuXHRcIm5lZWRzLWluZm9ib3hcIjoge1xyXG5cdFx0XCJsYWJlbFwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJOZWVkcyBpbmZvYm94P1wiLFxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiUmVxdWVzdCB0aGF0IGFuIGluZm9ib3ggYmUgYWRkZWQgdG8gdGhlIGFydGljbGUuIEFsbG93ZWQgdmFsdWVzOiBbJ3llcyddLlwiXHJcblx0XHR9LFxyXG5cdFx0XCJhbGlhc2VzXCI6IFtcclxuXHRcdFx0XCJuZWVkcy1waG90b1wiXHJcblx0XHRdLFxyXG5cdFx0XCJhdXRvdmFsdWVcIjogXCJ5ZXNcIixcclxuXHRcdFwic3VnZ2VzdGVkXCI6IHRydWVcclxuXHR9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjb25maWc7IiwiLy8gQXR0cmlidXRpb246IERpZmYgc3R5bGVzIGZyb20gPGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1dpa2lwZWRpYTpBdXRvV2lraUJyb3dzZXIvc3R5bGUuY3NzPlxyXG52YXIgZGlmZlN0eWxlcyA9IGB0YWJsZS5kaWZmLCB0ZC5kaWZmLW90aXRsZSwgdGQuZGlmZi1udGl0bGUgeyBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZTsgfVxyXG50ZC5kaWZmLW90aXRsZSwgdGQuZGlmZi1udGl0bGUgeyB0ZXh0LWFsaWduOiBjZW50ZXI7IH1cclxudGQuZGlmZi1tYXJrZXIgeyB0ZXh0LWFsaWduOiByaWdodDsgZm9udC13ZWlnaHQ6IGJvbGQ7IGZvbnQtc2l6ZTogMS4yNWVtOyB9XHJcbnRkLmRpZmYtbGluZW5vIHsgZm9udC13ZWlnaHQ6IGJvbGQ7IH1cclxudGQuZGlmZi1hZGRlZGxpbmUsIHRkLmRpZmYtZGVsZXRlZGxpbmUsIHRkLmRpZmYtY29udGV4dCB7IGZvbnQtc2l6ZTogODglOyB2ZXJ0aWNhbC1hbGlnbjogdG9wOyB3aGl0ZS1zcGFjZTogLW1vei1wcmUtd3JhcDsgd2hpdGUtc3BhY2U6IHByZS13cmFwOyB9XHJcbnRkLmRpZmYtYWRkZWRsaW5lLCB0ZC5kaWZmLWRlbGV0ZWRsaW5lIHsgYm9yZGVyLXN0eWxlOiBzb2xpZDsgYm9yZGVyLXdpZHRoOiAxcHggMXB4IDFweCA0cHg7IGJvcmRlci1yYWRpdXM6IDAuMzNlbTsgfVxyXG50ZC5kaWZmLWFkZGVkbGluZSB7IGJvcmRlci1jb2xvcjogI2EzZDNmZjsgfVxyXG50ZC5kaWZmLWRlbGV0ZWRsaW5lIHsgYm9yZGVyLWNvbG9yOiAjZmZlNDljOyB9XHJcbnRkLmRpZmYtY29udGV4dCB7IGJhY2tncm91bmQ6ICNmM2YzZjM7IGNvbG9yOiAjMzMzMzMzOyBib3JkZXItc3R5bGU6IHNvbGlkOyBib3JkZXItd2lkdGg6IDFweCAxcHggMXB4IDRweDsgYm9yZGVyLWNvbG9yOiAjZTZlNmU2OyBib3JkZXItcmFkaXVzOiAwLjMzZW07IH1cclxuLmRpZmZjaGFuZ2UgeyBmb250LXdlaWdodDogYm9sZDsgdGV4dC1kZWNvcmF0aW9uOiBub25lOyB9XHJcbnRhYmxlLmRpZmYge1xyXG4gICAgYm9yZGVyOiBub25lO1xyXG4gICAgd2lkdGg6IDk4JTsgYm9yZGVyLXNwYWNpbmc6IDRweDtcclxuICAgIHRhYmxlLWxheW91dDogZml4ZWQ7IC8qIEVuc3VyZXMgdGhhdCBjb2x1bXMgYXJlIG9mIGVxdWFsIHdpZHRoICovXHJcbn1cclxudGQuZGlmZi1hZGRlZGxpbmUgLmRpZmZjaGFuZ2UsIHRkLmRpZmYtZGVsZXRlZGxpbmUgLmRpZmZjaGFuZ2UgeyBib3JkZXItcmFkaXVzOiAwLjMzZW07IHBhZGRpbmc6IDAuMjVlbSAwOyB9XHJcbnRkLmRpZmYtYWRkZWRsaW5lIC5kaWZmY2hhbmdlIHtcdGJhY2tncm91bmQ6ICNkOGVjZmY7IH1cclxudGQuZGlmZi1kZWxldGVkbGluZSAuZGlmZmNoYW5nZSB7IGJhY2tncm91bmQ6ICNmZWVlYzg7IH1cclxudGFibGUuZGlmZiB0ZCB7XHRwYWRkaW5nOiAwLjMzZW0gMC42NmVtOyB9XHJcbnRhYmxlLmRpZmYgY29sLmRpZmYtbWFya2VyIHsgd2lkdGg6IDIlOyB9XHJcbnRhYmxlLmRpZmYgY29sLmRpZmYtY29udGVudCB7IHdpZHRoOiA0OCU7IH1cclxudGFibGUuZGlmZiB0ZCBkaXYge1xyXG4gICAgLyogRm9yY2Utd3JhcCB2ZXJ5IGxvbmcgbGluZXMgc3VjaCBhcyBVUkxzIG9yIHBhZ2Utd2lkZW5pbmcgY2hhciBzdHJpbmdzLiAqL1xyXG4gICAgd29yZC13cmFwOiBicmVhay13b3JkO1xyXG4gICAgLyogQXMgZmFsbGJhY2sgKEZGPDMuNSwgT3BlcmEgPDEwLjUpLCBzY3JvbGxiYXJzIHdpbGwgYmUgYWRkZWQgZm9yIHZlcnkgd2lkZSBjZWxsc1xyXG4gICAgICAgIGluc3RlYWQgb2YgdGV4dCBvdmVyZmxvd2luZyBvciB3aWRlbmluZyAqL1xyXG4gICAgb3ZlcmZsb3c6IGF1dG87XHJcbn1gO1xyXG5cclxuZXhwb3J0IHsgZGlmZlN0eWxlcyB9OyIsImltcG9ydCB7QVBJLCBpc0FmdGVyRGF0ZSwgbWFrZUVycm9yTXNnfSBmcm9tIFwiLi91dGlsXCI7XHJcbmltcG9ydCAqIGFzIGNhY2hlIGZyb20gXCIuL2NhY2hlXCI7XHJcblxyXG52YXIgY2FjaGVCYW5uZXJzID0gZnVuY3Rpb24oYmFubmVycywgYmFubmVyT3B0aW9ucykge1xyXG5cdGNhY2hlLndyaXRlKFwiYmFubmVyc1wiLCBiYW5uZXJzLCAyLCA2MCk7XHJcblx0Y2FjaGUud3JpdGUoXCJiYW5uZXJPcHRpb25zXCIsIGJhbm5lck9wdGlvbnMsIDIsIDYwKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGJhbm5lcnMvb3B0aW9ucyBmcm9tIHRoZSBBcGlcclxuICogXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlZCB3aXRoOiBiYW5uZXJzIG9iamVjdCwgYmFubmVyT3B0aW9ucyBhcnJheVxyXG4gKi9cclxudmFyIGdldExpc3RPZkJhbm5lcnNGcm9tQXBpID0gZnVuY3Rpb24oKSB7XHJcblxyXG5cdHZhciBmaW5pc2hlZFByb21pc2UgPSAkLkRlZmVycmVkKCk7XHJcblxyXG5cdHZhciBxdWVyeVNrZWxldG9uID0ge1xyXG5cdFx0YWN0aW9uOiBcInF1ZXJ5XCIsXHJcblx0XHRmb3JtYXQ6IFwianNvblwiLFxyXG5cdFx0bGlzdDogXCJjYXRlZ29yeW1lbWJlcnNcIixcclxuXHRcdGNtcHJvcDogXCJ0aXRsZVwiLFxyXG5cdFx0Y21uYW1lc3BhY2U6IFwiMTBcIixcclxuXHRcdGNtbGltaXQ6IFwiNTAwXCJcclxuXHR9O1xyXG5cclxuXHR2YXIgY2F0ZWdvcmllcyA9IFtcclxuXHRcdHtcclxuXHRcdFx0dGl0bGU6XCIgQ2F0ZWdvcnk6V2lraVByb2plY3QgYmFubmVycyB3aXRoIHF1YWxpdHkgYXNzZXNzbWVudFwiLFxyXG5cdFx0XHRhYmJyZXZpYXRpb246IFwid2l0aFJhdGluZ3NcIixcclxuXHRcdFx0YmFubmVyczogW10sXHJcblx0XHRcdHByb2Nlc3NlZDogJC5EZWZlcnJlZCgpXHJcblx0XHR9LFxyXG5cdFx0e1xyXG5cdFx0XHR0aXRsZTogXCJDYXRlZ29yeTpXaWtpUHJvamVjdCBiYW5uZXJzIHdpdGhvdXQgcXVhbGl0eSBhc3Nlc3NtZW50XCIsXHJcblx0XHRcdGFiYnJldmlhdGlvbjogXCJ3aXRob3V0UmF0aW5nc1wiLFxyXG5cdFx0XHRiYW5uZXJzOiBbXSxcclxuXHRcdFx0cHJvY2Vzc2VkOiAkLkRlZmVycmVkKClcclxuXHRcdH0sXHJcblx0XHR7XHJcblx0XHRcdHRpdGxlOiBcIkNhdGVnb3J5Oldpa2lQcm9qZWN0IGJhbm5lciB3cmFwcGVyIHRlbXBsYXRlc1wiLFxyXG5cdFx0XHRhYmJyZXZpYXRpb246IFwid3JhcHBlcnNcIixcclxuXHRcdFx0YmFubmVyczogW10sXHJcblx0XHRcdHByb2Nlc3NlZDogJC5EZWZlcnJlZCgpXHJcblx0XHR9XHJcblx0XTtcclxuXHJcblx0dmFyIHByb2Nlc3NRdWVyeSA9IGZ1bmN0aW9uKHJlc3VsdCwgY2F0SW5kZXgpIHtcclxuXHRcdGlmICggIXJlc3VsdC5xdWVyeSB8fCAhcmVzdWx0LnF1ZXJ5LmNhdGVnb3J5bWVtYmVycyApIHtcclxuXHRcdFx0Ly8gTm8gcmVzdWx0c1xyXG5cdFx0XHQvLyBUT0RPOiBlcnJvciBvciB3YXJuaW5nICoqKioqKioqXHJcblx0XHRcdGZpbmlzaGVkUHJvbWlzZS5yZWplY3QoKTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHQvLyBHYXRoZXIgdGl0bGVzIGludG8gYXJyYXkgLSBleGNsdWRpbmcgXCJUZW1wbGF0ZTpcIiBwcmVmaXhcclxuXHRcdHZhciByZXN1bHRUaXRsZXMgPSByZXN1bHQucXVlcnkuY2F0ZWdvcnltZW1iZXJzLm1hcChmdW5jdGlvbihpbmZvKSB7XHJcblx0XHRcdHJldHVybiBpbmZvLnRpdGxlLnNsaWNlKDkpO1xyXG5cdFx0fSk7XHJcblx0XHRBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShjYXRlZ29yaWVzW2NhdEluZGV4XS5iYW5uZXJzLCByZXN1bHRUaXRsZXMpO1xyXG5cdFx0XHJcblx0XHQvLyBDb250aW51ZSBxdWVyeSBpZiBuZWVkZWRcclxuXHRcdGlmICggcmVzdWx0LmNvbnRpbnVlICkge1xyXG5cdFx0XHRkb0FwaVF1ZXJ5KCQuZXh0ZW5kKGNhdGVnb3JpZXNbY2F0SW5kZXhdLnF1ZXJ5LCByZXN1bHQuY29udGludWUpLCBjYXRJbmRleCk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0Y2F0ZWdvcmllc1tjYXRJbmRleF0ucHJvY2Vzc2VkLnJlc29sdmUoKTtcclxuXHR9O1xyXG5cclxuXHR2YXIgZG9BcGlRdWVyeSA9IGZ1bmN0aW9uKHEsIGNhdEluZGV4KSB7XHJcblx0XHRBUEkuZ2V0KCBxIClcclxuXHRcdFx0LmRvbmUoIGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0XHRcdHByb2Nlc3NRdWVyeShyZXN1bHQsIGNhdEluZGV4KTtcclxuXHRcdFx0fSApXHJcblx0XHRcdC5mYWlsKCBmdW5jdGlvbihjb2RlLCBqcXhocikge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihcIltSYXRlcl0gXCIgKyBtYWtlRXJyb3JNc2coY29kZSwganF4aHIsIFwiQ291bGQgbm90IHJldHJpZXZlIHBhZ2VzIGZyb20gW1s6XCIgKyBxLmNtdGl0bGUgKyBcIl1dXCIpKTtcclxuXHRcdFx0XHRmaW5pc2hlZFByb21pc2UucmVqZWN0KCk7XHJcblx0XHRcdH0gKTtcclxuXHR9O1xyXG5cdFxyXG5cdGNhdGVnb3JpZXMuZm9yRWFjaChmdW5jdGlvbihjYXQsIGluZGV4LCBhcnIpIHtcclxuXHRcdGNhdC5xdWVyeSA9ICQuZXh0ZW5kKCB7IFwiY210aXRsZVwiOmNhdC50aXRsZSB9LCBxdWVyeVNrZWxldG9uICk7XHJcblx0XHQkLndoZW4oIGFycltpbmRleC0xXSAmJiBhcnJbaW5kZXgtMV0ucHJvY2Vzc2VkIHx8IHRydWUgKS50aGVuKGZ1bmN0aW9uKCl7XHJcblx0XHRcdGRvQXBpUXVlcnkoY2F0LnF1ZXJ5LCBpbmRleCk7XHJcblx0XHR9KTtcclxuXHR9KTtcclxuXHRcclxuXHRjYXRlZ29yaWVzW2NhdGVnb3JpZXMubGVuZ3RoLTFdLnByb2Nlc3NlZC50aGVuKGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgYmFubmVycyA9IHt9O1xyXG5cdFx0dmFyIHN0YXNoQmFubmVyID0gZnVuY3Rpb24oY2F0T2JqZWN0KSB7XHJcblx0XHRcdGJhbm5lcnNbY2F0T2JqZWN0LmFiYnJldmlhdGlvbl0gPSBjYXRPYmplY3QuYmFubmVycztcclxuXHRcdH07XHJcblx0XHR2YXIgbWVyZ2VCYW5uZXJzID0gZnVuY3Rpb24obWVyZ2VJbnRvVGhpc0FycmF5LCBjYXRPYmplY3QpIHtcclxuXHRcdFx0cmV0dXJuICQubWVyZ2UobWVyZ2VJbnRvVGhpc0FycmF5LCBjYXRPYmplY3QuYmFubmVycyk7XHJcblx0XHR9O1xyXG5cdFx0dmFyIG1ha2VPcHRpb24gPSBmdW5jdGlvbihiYW5uZXJOYW1lKSB7XHJcblx0XHRcdHZhciBpc1dyYXBwZXIgPSAoIC0xICE9PSAkLmluQXJyYXkoYmFubmVyTmFtZSwgY2F0ZWdvcmllc1syXS5iYW5uZXJzKSApO1xyXG5cdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdGRhdGE6ICAoIGlzV3JhcHBlciA/IFwic3Vic3Q6XCIgOiBcIlwiKSArIGJhbm5lck5hbWUsXHJcblx0XHRcdFx0bGFiZWw6IGJhbm5lck5hbWUucmVwbGFjZShcIldpa2lQcm9qZWN0IFwiLCBcIlwiKSArICggaXNXcmFwcGVyID8gXCIgW3RlbXBsYXRlIHdyYXBwZXJdXCIgOiBcIlwiKVxyXG5cdFx0XHR9O1xyXG5cdFx0fTtcclxuXHRcdGNhdGVnb3JpZXMuZm9yRWFjaChzdGFzaEJhbm5lcik7XHJcblx0XHRcclxuXHRcdHZhciBiYW5uZXJPcHRpb25zID0gY2F0ZWdvcmllcy5yZWR1Y2UobWVyZ2VCYW5uZXJzLCBbXSkubWFwKG1ha2VPcHRpb24pO1xyXG5cdFx0XHJcblx0XHRmaW5pc2hlZFByb21pc2UucmVzb2x2ZShiYW5uZXJzLCBiYW5uZXJPcHRpb25zKTtcclxuXHR9KTtcclxuXHRcclxuXHRyZXR1cm4gZmluaXNoZWRQcm9taXNlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYmFubmVycy9vcHRpb25zIGZyb20gY2FjaGUsIGlmIHRoZXJlIGFuZCBub3QgdG9vIG9sZFxyXG4gKiBcclxuICogQHJldHVybnMge1Byb21pc2V9IFJlc29sdmVkIHdpdGg6IGJhbm5lcnMgb2JqZWN0LCBiYW5uZXJPcHRpb25zIG9iamVjdFxyXG4gKi9cclxudmFyIGdldEJhbm5lcnNGcm9tQ2FjaGUgPSBmdW5jdGlvbigpIHtcclxuXHR2YXIgY2FjaGVkQmFubmVycyA9IGNhY2hlLnJlYWQoXCJiYW5uZXJzXCIpO1xyXG5cdHZhciBjYWNoZWRCYW5uZXJPcHRpb25zID0gY2FjaGUucmVhZChcImJhbm5lck9wdGlvbnNcIik7XHJcblx0aWYgKFxyXG5cdFx0IWNhY2hlZEJhbm5lcnMgfHxcclxuXHRcdCFjYWNoZWRCYW5uZXJzLnZhbHVlIHx8ICFjYWNoZWRCYW5uZXJzLnN0YWxlRGF0ZSB8fFxyXG5cdFx0IWNhY2hlZEJhbm5lck9wdGlvbnMgfHxcclxuXHRcdCFjYWNoZWRCYW5uZXJPcHRpb25zLnZhbHVlIHx8ICFjYWNoZWRCYW5uZXJPcHRpb25zLnN0YWxlRGF0ZVxyXG5cdCkge1xyXG5cdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHR9XHJcblx0aWYgKCBpc0FmdGVyRGF0ZShjYWNoZWRCYW5uZXJzLnN0YWxlRGF0ZSkgfHwgaXNBZnRlckRhdGUoY2FjaGVkQmFubmVyT3B0aW9ucy5zdGFsZURhdGUpICkge1xyXG5cdFx0Ly8gVXBkYXRlIGluIHRoZSBiYWNrZ3JvdW5kOyBzdGlsbCB1c2Ugb2xkIGxpc3QgdW50aWwgdGhlbiAgXHJcblx0XHRnZXRMaXN0T2ZCYW5uZXJzRnJvbUFwaSgpLnRoZW4oY2FjaGVCYW5uZXJzKTtcclxuXHR9XHJcblx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZXNvbHZlKGNhY2hlZEJhbm5lcnMudmFsdWUsIGNhY2hlZEJhbm5lck9wdGlvbnMudmFsdWUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYmFubmVycy9vcHRpb25zIGZyb20gY2FjaGUgb3IgQVBJLlxyXG4gKiBIYXMgc2lkZSBhZmZlY3Qgb2YgYWRkaW5nL3VwZGF0aW5nL2NsZWFyaW5nIGNhY2hlLlxyXG4gKiBcclxuICogQHJldHVybnMge1Byb21pc2U8T2JqZWN0LCBBcnJheT59IGJhbm5lcnMgb2JqZWN0LCBiYW5uZXJPcHRpb25zIG9iamVjdFxyXG4gKi9cclxudmFyIGdldEJhbm5lcnMgPSAoKSA9PiBnZXRCYW5uZXJzRnJvbUNhY2hlKCkudGhlbihcclxuXHQvLyBTdWNjZXNzOiBwYXNzIHRocm91Z2hcclxuXHQoYmFubmVycywgb3B0aW9ucykgPT4gJC5EZWZlcnJlZCgpLnJlc29sdmUoYmFubmVycywgb3B0aW9ucyksXHJcblx0Ly8gRmFpbHVyZTogZ2V0IGZyb20gQXBpLCB0aGVuIGNhY2hlIHRoZW1cclxuXHQoKSA9PiB7XHJcblx0XHR2YXIgYmFubmVyc1Byb21pc2UgPSBnZXRMaXN0T2ZCYW5uZXJzRnJvbUFwaSgpO1xyXG5cdFx0YmFubmVyc1Byb21pc2UudGhlbihjYWNoZUJhbm5lcnMpO1xyXG5cdFx0cmV0dXJuIGJhbm5lcnNQcm9taXNlO1xyXG5cdH1cclxuKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdldEJhbm5lcnM7IiwiaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuaW1wb3J0IHtBUEl9IGZyb20gXCIuL3V0aWxcIjtcclxuaW1wb3J0IHsgcGFyc2VUZW1wbGF0ZXMsIGdldFdpdGhSZWRpcmVjdFRvIH0gZnJvbSBcIi4vVGVtcGxhdGVcIjtcclxuaW1wb3J0IGdldEJhbm5lcnMgZnJvbSBcIi4vZ2V0QmFubmVyc1wiO1xyXG5pbXBvcnQgKiBhcyBjYWNoZSBmcm9tIFwiLi9jYWNoZVwiO1xyXG5pbXBvcnQgd2luZG93TWFuYWdlciBmcm9tIFwiLi93aW5kb3dNYW5hZ2VyXCI7XHJcblxyXG52YXIgc2V0dXBSYXRlciA9IGZ1bmN0aW9uKGNsaWNrRXZlbnQpIHtcclxuXHRpZiAoIGNsaWNrRXZlbnQgKSB7XHJcblx0XHRjbGlja0V2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0fVxyXG5cclxuXHR2YXIgc2V0dXBDb21wbGV0ZWRQcm9taXNlID0gJC5EZWZlcnJlZCgpO1xyXG4gICAgXHJcblx0dmFyIGN1cnJlbnRQYWdlID0gbXcuVGl0bGUubmV3RnJvbVRleHQoY29uZmlnLm13LndnUGFnZU5hbWUpO1xyXG5cdHZhciB0YWxrUGFnZSA9IGN1cnJlbnRQYWdlICYmIGN1cnJlbnRQYWdlLmdldFRhbGtQYWdlKCk7XHJcblx0dmFyIHN1YmplY3RQYWdlID0gY3VycmVudFBhZ2UgJiYgY3VycmVudFBhZ2UuZ2V0U3ViamVjdFBhZ2UoKTtcclxuIFxyXG5cdC8vIEdldCBsaXN0cyBvZiBhbGwgYmFubmVycyAodGFzayAxKVxyXG5cdHZhciBiYW5uZXJzUHJvbWlzZSA9IGdldEJhbm5lcnMoKTtcclxuXHJcblx0Ly8gTG9hZCB0YWxrIHBhZ2UgKHRhc2sgMilcclxuXHR2YXIgbG9hZFRhbGtQcm9taXNlID0gQVBJLmdldCgge1xyXG5cdFx0YWN0aW9uOiBcInF1ZXJ5XCIsXHJcblx0XHRwcm9wOiBcInJldmlzaW9uc1wiLFxyXG5cdFx0cnZwcm9wOiBcImNvbnRlbnRcIixcclxuXHRcdHJ2c2VjdGlvbjogXCIwXCIsXHJcblx0XHR0aXRsZXM6IHRhbGtQYWdlLmdldFByZWZpeGVkVGV4dCgpLFxyXG5cdFx0aW5kZXhwYWdlaWRzOiAxXHJcblx0fSApLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xyXG5cdFx0dmFyIGlkID0gcmVzdWx0LnF1ZXJ5LnBhZ2VpZHM7XHRcdFxyXG5cdFx0dmFyIHdpa2l0ZXh0ID0gKCBpZCA8IDAgKSA/IFwiXCIgOiByZXN1bHQucXVlcnkucGFnZXNbaWRdLnJldmlzaW9uc1swXVtcIipcIl07XHJcblx0XHRyZXR1cm4gd2lraXRleHQ7XHJcblx0fSk7XHJcblxyXG5cdC8vIFBhcnNlIHRhbGsgcGFnZSBmb3IgYmFubmVycyAodGFzayAzKVxyXG5cdHZhciBwYXJzZVRhbGtQcm9taXNlID0gbG9hZFRhbGtQcm9taXNlLnRoZW4od2lraXRleHQgPT4gcGFyc2VUZW1wbGF0ZXMod2lraXRleHQsIHRydWUpKSAvLyBHZXQgYWxsIHRlbXBsYXRlc1xyXG5cdFx0LnRoZW4odGVtcGxhdGVzID0+IGdldFdpdGhSZWRpcmVjdFRvKHRlbXBsYXRlcykpIC8vIENoZWNrIGZvciByZWRpcmVjdHNcclxuXHRcdC50aGVuKHRlbXBsYXRlcyA9PiB7XHJcblx0XHRcdHJldHVybiBiYW5uZXJzUHJvbWlzZS50aGVuKChhbGxCYW5uZXJzKSA9PiB7IC8vIEdldCBsaXN0IG9mIGFsbCBiYW5uZXIgdGVtcGxhdGVzXHJcblx0XHRcdFx0cmV0dXJuIHRlbXBsYXRlcy5maWx0ZXIodGVtcGxhdGUgPT4geyAvLyBGaWx0ZXIgb3V0IG5vbi1iYW5uZXJzXHJcblx0XHRcdFx0XHR2YXIgbWFpblRleHQgPSB0ZW1wbGF0ZS5yZWRpcmVjdFRhcmdldFxyXG5cdFx0XHRcdFx0XHQ/IHRlbXBsYXRlLnJlZGlyZWN0VGFyZ2V0LmdldE1haW5UZXh0KClcclxuXHRcdFx0XHRcdFx0OiB0ZW1wbGF0ZS5nZXRUaXRsZSgpLmdldE1haW5UZXh0KCk7XHJcblx0XHRcdFx0XHRyZXR1cm4gYWxsQmFubmVycy53aXRoUmF0aW5ncy5pbmNsdWRlcyhtYWluVGV4dCkgfHwgXHJcbiAgICAgICAgICAgICAgICAgICAgYWxsQmFubmVycy53aXRob3V0UmF0aW5ncy5pbmNsdWRlcyhtYWluVGV4dCkgfHxcclxuICAgICAgICAgICAgICAgICAgICBhbGxCYW5uZXJzLndyYXBwZXJzLmluY2x1ZGVzKG1haW5UZXh0KTtcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0Lm1hcChmdW5jdGlvbih0ZW1wbGF0ZSkgeyAvLyBTZXQgd3JhcHBlciB0YXJnZXQgaWYgbmVlZGVkXHJcblx0XHRcdFx0XHRcdHZhciBtYWluVGV4dCA9IHRlbXBsYXRlLnJlZGlyZWN0VGFyZ2V0XHJcblx0XHRcdFx0XHRcdFx0PyB0ZW1wbGF0ZS5yZWRpcmVjdFRhcmdldC5nZXRNYWluVGV4dCgpXHJcblx0XHRcdFx0XHRcdFx0OiB0ZW1wbGF0ZS5nZXRUaXRsZSgpLmdldE1haW5UZXh0KCk7XHJcblx0XHRcdFx0XHRcdGlmIChhbGxCYW5uZXJzLndyYXBwZXJzLmluY2x1ZGVzKG1haW5UZXh0KSkge1xyXG5cdFx0XHRcdFx0XHRcdHRlbXBsYXRlLnJlZGlyZWN0VGFyZ2V0ID0gbXcuVGl0bGUubmV3RnJvbVRleHQoXCJUZW1wbGF0ZTpTdWJzdDpcIiArIG1haW5UZXh0KTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gdGVtcGxhdGU7XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHJcblx0Ly8gUmV0cmlldmUgYW5kIHN0b3JlIFRlbXBsYXRlRGF0YSAodGFzayA0KVxyXG5cdHZhciB0ZW1wbGF0ZURhdGFQcm9taXNlID0gcGFyc2VUYWxrUHJvbWlzZS50aGVuKHRlbXBsYXRlcyA9PiB7XHJcblx0XHR0ZW1wbGF0ZXMuZm9yRWFjaCh0ZW1wbGF0ZSA9PiB0ZW1wbGF0ZS5zZXRQYXJhbURhdGFBbmRTdWdnZXN0aW9ucygpKTtcclxuXHRcdHJldHVybiB0ZW1wbGF0ZXM7XHJcblx0fSk7XHJcblxyXG5cdC8vIENoZWNrIGlmIHBhZ2UgaXMgYSByZWRpcmVjdCAodGFzayA1KSAtIGJ1dCBkb24ndCBlcnJvciBvdXQgaWYgcmVxdWVzdCBmYWlsc1xyXG5cdHZhciByZWRpcmVjdENoZWNrUHJvbWlzZSA9IEFQSS5nZXRSYXcoc3ViamVjdFBhZ2UuZ2V0UHJlZml4ZWRUZXh0KCkpXHJcblx0XHQudGhlbihcclxuXHRcdFx0Ly8gU3VjY2Vzc1xyXG5cdFx0XHRmdW5jdGlvbihyYXdQYWdlKSB7IFxyXG5cdFx0XHRcdGlmICggL15cXHMqI1JFRElSRUNUL2kudGVzdChyYXdQYWdlKSApIHtcclxuXHRcdFx0XHRcdC8vIGdldCByZWRpcmVjdGlvbiB0YXJnZXQsIG9yIGJvb2xlYW4gdHJ1ZVxyXG5cdFx0XHRcdFx0cmV0dXJuIHJhd1BhZ2Uuc2xpY2UocmF3UGFnZS5pbmRleE9mKFwiW1tcIikrMiwgcmF3UGFnZS5pbmRleE9mKFwiXV1cIikpIHx8IHRydWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fSxcclxuXHRcdFx0Ly8gRmFpbHVyZSAoaWdub3JlZClcclxuXHRcdFx0ZnVuY3Rpb24oKSB7IHJldHVybiBudWxsOyB9XHJcblx0XHQpO1xyXG5cclxuXHQvLyBSZXRyaWV2ZSByYXRpbmcgZnJvbSBPUkVTICh0YXNrIDYsIG9ubHkgbmVlZGVkIGZvciBhcnRpY2xlcylcclxuXHR2YXIgc2hvdWxkR2V0T3JlcyA9ICggY29uZmlnLm13LndnTmFtZXNwYWNlTnVtYmVyIDw9IDEgKTtcclxuXHRpZiAoIHNob3VsZEdldE9yZXMgKSB7XHJcblx0XHR2YXIgbGF0ZXN0UmV2SWRQcm9taXNlID0gY3VycmVudFBhZ2UuaXNUYWxrUGFnZSgpXHJcblx0XHRcdD8gJC5EZWZlcnJlZCgpLnJlc29sdmUoY29uZmlnLm13LndnUmV2aXNpb25JZClcclxuXHRcdFx0OiBcdEFQSS5nZXQoIHtcclxuXHRcdFx0XHRhY3Rpb246IFwicXVlcnlcIixcclxuXHRcdFx0XHRmb3JtYXQ6IFwianNvblwiLFxyXG5cdFx0XHRcdHByb3A6IFwicmV2aXNpb25zXCIsXHJcblx0XHRcdFx0dGl0bGVzOiBzdWJqZWN0UGFnZS5nZXRQcmVmaXhlZFRleHQoKSxcclxuXHRcdFx0XHRydnByb3A6IFwiaWRzXCIsXHJcblx0XHRcdFx0aW5kZXhwYWdlaWRzOiAxXHJcblx0XHRcdH0gKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0XHRcdGlmIChyZXN1bHQucXVlcnkucmVkaXJlY3RzKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHZhciBpZCA9IHJlc3VsdC5xdWVyeS5wYWdlaWRzO1xyXG5cdFx0XHRcdHZhciBwYWdlID0gcmVzdWx0LnF1ZXJ5LnBhZ2VzW2lkXTtcclxuXHRcdFx0XHRpZiAocGFnZS5taXNzaW5nID09PSBcIlwiKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICggaWQgPCAwICkge1xyXG5cdFx0XHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHBhZ2UucmV2aXNpb25zWzBdLnJldmlkO1xyXG5cdFx0XHR9KTtcclxuXHRcdHZhciBvcmVzUHJvbWlzZSA9IGxhdGVzdFJldklkUHJvbWlzZS50aGVuKGZ1bmN0aW9uKGxhdGVzdFJldklkKSB7XHJcblx0XHRcdGlmICghbGF0ZXN0UmV2SWQpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIEFQSS5nZXRPUkVTKGxhdGVzdFJldklkKVxyXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0XHRcdFx0dmFyIGRhdGEgPSByZXN1bHQuZW53aWtpLnNjb3Jlc1tsYXRlc3RSZXZJZF0ud3AxMDtcclxuXHRcdFx0XHRcdGlmICggZGF0YS5lcnJvciApIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoZGF0YS5lcnJvci50eXBlLCBkYXRhLmVycm9yLm1lc3NhZ2UpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cmV0dXJuIGRhdGEuc2NvcmUucHJlZGljdGlvbjtcclxuXHRcdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0Ly8gT3BlbiB0aGUgbG9hZCBkaWFsb2dcclxuXHR2YXIgaXNPcGVuZWRQcm9taXNlID0gJC5EZWZlcnJlZCgpO1xyXG5cdHZhciBsb2FkRGlhbG9nV2luID0gd2luZG93TWFuYWdlci5vcGVuV2luZG93KFwibG9hZERpYWxvZ1wiLCB7XHJcblx0XHRwcm9taXNlczogW1xyXG5cdFx0XHRiYW5uZXJzUHJvbWlzZSxcclxuXHRcdFx0bG9hZFRhbGtQcm9taXNlLFxyXG5cdFx0XHRwYXJzZVRhbGtQcm9taXNlLFxyXG5cdFx0XHR0ZW1wbGF0ZURhdGFQcm9taXNlLFxyXG5cdFx0XHRyZWRpcmVjdENoZWNrUHJvbWlzZSxcclxuXHRcdFx0c2hvdWxkR2V0T3JlcyAmJiBvcmVzUHJvbWlzZVxyXG5cdFx0XSxcclxuXHRcdG9yZXM6IHNob3VsZEdldE9yZXMsXHJcblx0XHRpc09wZW5lZDogaXNPcGVuZWRQcm9taXNlXHJcblx0fSk7XHJcblxyXG5cdGxvYWREaWFsb2dXaW4ub3BlbmVkLnRoZW4oaXNPcGVuZWRQcm9taXNlLnJlc29sdmUpO1xyXG5cclxuXHJcblx0JC53aGVuKFxyXG5cdFx0bG9hZFRhbGtQcm9taXNlLFxyXG5cdFx0dGVtcGxhdGVEYXRhUHJvbWlzZSxcclxuXHRcdHJlZGlyZWN0Q2hlY2tQcm9taXNlLFxyXG5cdFx0c2hvdWxkR2V0T3JlcyAmJiBvcmVzUHJvbWlzZVxyXG5cdCkudGhlbihcclxuXHRcdC8vIEFsbCBzdWNjZWRlZFxyXG5cdFx0ZnVuY3Rpb24odGFsa1dpa2l0ZXh0LCBiYW5uZXJzLCByZWRpcmVjdFRhcmdldCwgb3Jlc1ByZWRpY2l0aW9uICkge1xyXG5cdFx0XHR2YXIgcmVzdWx0ID0ge1xyXG5cdFx0XHRcdHN1Y2Nlc3M6IHRydWUsXHJcblx0XHRcdFx0dGFsa3BhZ2U6IHRhbGtQYWdlLFxyXG5cdFx0XHRcdHRhbGtXaWtpdGV4dDogdGFsa1dpa2l0ZXh0LFxyXG5cdFx0XHRcdGJhbm5lcnM6IGJhbm5lcnNcclxuXHRcdFx0fTtcclxuXHRcdFx0aWYgKHJlZGlyZWN0VGFyZ2V0KSB7XHJcblx0XHRcdFx0cmVzdWx0LnJlZGlyZWN0VGFyZ2V0ID0gcmVkaXJlY3RUYXJnZXQ7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKG9yZXNQcmVkaWNpdGlvbikge1xyXG5cdFx0XHRcdHJlc3VsdC5vcmVzUHJlZGljaXRpb24gPSBvcmVzUHJlZGljaXRpb247XHJcblx0XHRcdH1cclxuXHRcdFx0d2luZG93TWFuYWdlci5jbG9zZVdpbmRvdyhcImxvYWREaWFsb2dcIiwgcmVzdWx0KTtcclxuXHRcdFx0XHJcblx0XHR9XHJcblx0KTsgLy8gQW55IGZhaWx1cmVzIGFyZSBoYW5kbGVkIGJ5IHRoZSBsb2FkRGlhbG9nIHdpbmRvdyBpdHNlbGZcclxuXHJcblx0Ly8gT24gd2luZG93IGNsb3NlZCwgY2hlY2sgZGF0YSwgYW5kIHJlc29sdmUvcmVqZWN0IHNldHVwQ29tcGxldGVkUHJvbWlzZVxyXG5cdGxvYWREaWFsb2dXaW4uY2xvc2VkLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0aWYgKGRhdGEgJiYgZGF0YS5zdWNjZXNzKSB7XHJcblx0XHRcdC8vIEdvdCBldmVyeXRoaW5nIG5lZWRlZDogUmVzb2x2ZSBwcm9taXNlIHdpdGggdGhpcyBkYXRhXHJcblx0XHRcdHNldHVwQ29tcGxldGVkUHJvbWlzZS5yZXNvbHZlKGRhdGEpO1xyXG5cdFx0fSBlbHNlIGlmIChkYXRhICYmIGRhdGEuZXJyb3IpIHtcclxuXHRcdFx0Ly8gVGhlcmUgd2FzIGFuIGVycm9yOiBSZWplY3QgcHJvbWlzZSB3aXRoIGVycm9yIGNvZGUvaW5mb1xyXG5cdFx0XHRzZXR1cENvbXBsZXRlZFByb21pc2UucmVqZWN0KGRhdGEuZXJyb3IuY29kZSwgZGF0YS5lcnJvci5pbmZvKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdC8vIFdpbmRvdyBjbG9zZWQgYmVmb3JlIGNvbXBsZXRpb246IHJlc29sdmUgcHJvbWlzZSB3aXRob3V0IGFueSBkYXRhXHJcblx0XHRcdHNldHVwQ29tcGxldGVkUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xyXG5cdFx0fVxyXG5cdFx0Y2FjaGUuY2xlYXJJbnZhbGlkSXRlbXMoKTtcclxuXHR9KTtcclxuXHJcblx0Ly8gVEVTVElORyBwdXJwb3NlcyBvbmx5OiBsb2cgcGFzc2VkIGRhdGEgdG8gY29uc29sZVxyXG5cdHNldHVwQ29tcGxldGVkUHJvbWlzZS50aGVuKFxyXG5cdFx0ZGF0YSA9PiBjb25zb2xlLmxvZyhcInNldHVwIHdpbmRvdyBjbG9zZWRcIiwgZGF0YSksXHJcblx0XHQoY29kZSwgaW5mbykgPT4gY29uc29sZS5sb2coXCJzZXR1cCB3aW5kb3cgY2xvc2VkIHdpdGggZXJyb3JcIiwge2NvZGUsIGluZm99KVxyXG5cdCk7XHJcblxyXG5cdHJldHVybiBzZXR1cENvbXBsZXRlZFByb21pc2U7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzZXR1cFJhdGVyOyIsIi8vIFZhcmlvdXMgdXRpbGl0eSBmdW5jdGlvbnMgYW5kIG9iamVjdHMgdGhhdCBtaWdodCBiZSB1c2VkIGluIG11bHRpcGxlIHBsYWNlc1xyXG5cclxuaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuXHJcbnZhciBpc0FmdGVyRGF0ZSA9IGZ1bmN0aW9uKGRhdGVTdHJpbmcpIHtcclxuXHRyZXR1cm4gbmV3IERhdGUoZGF0ZVN0cmluZykgPCBuZXcgRGF0ZSgpO1xyXG59O1xyXG5cclxudmFyIEFQSSA9IG5ldyBtdy5BcGkoIHtcclxuXHRhamF4OiB7XHJcblx0XHRoZWFkZXJzOiB7IFxyXG5cdFx0XHRcIkFwaS1Vc2VyLUFnZW50XCI6IFwiUmF0ZXIvXCIgKyBjb25maWcuc2NyaXB0LnZlcnNpb24gKyBcclxuXHRcdFx0XHRcIiAoIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1VzZXI6RXZhZDM3L1JhdGVyIClcIlxyXG5cdFx0fVxyXG5cdH1cclxufSApO1xyXG4vKiAtLS0tLS0tLS0tIEFQSSBmb3IgT1JFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXHJcbkFQSS5nZXRPUkVTID0gZnVuY3Rpb24ocmV2aXNpb25JRCkge1xyXG5cdHJldHVybiAkLmdldChcImh0dHBzOi8vb3Jlcy53aWtpbWVkaWEub3JnL3YzL3Njb3Jlcy9lbndpa2k/bW9kZWxzPXdwMTAmcmV2aWRzPVwiK3JldmlzaW9uSUQpO1xyXG59O1xyXG4vKiAtLS0tLS0tLS0tIFJhdyB3aWtpdGV4dCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXHJcbkFQSS5nZXRSYXcgPSBmdW5jdGlvbihwYWdlKSB7XHJcblx0cmV0dXJuICQuZ2V0KFwiaHR0cHM6XCIgKyBjb25maWcubXcud2dTZXJ2ZXIgKyBtdy51dGlsLmdldFVybChwYWdlLCB7YWN0aW9uOlwicmF3XCJ9KSlcclxuXHRcdC50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdFx0aWYgKCAhZGF0YSApIHtcclxuXHRcdFx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdChcIm9rLWJ1dC1lbXB0eVwiKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gZGF0YTtcclxuXHRcdH0pO1xyXG59O1xyXG5cclxudmFyIG1ha2VFcnJvck1zZyA9IGZ1bmN0aW9uKGZpcnN0LCBzZWNvbmQpIHtcclxuXHR2YXIgY29kZSwgeGhyLCBtZXNzYWdlO1xyXG5cdGlmICggdHlwZW9mIGZpcnN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBzZWNvbmQgPT09IFwic3RyaW5nXCIgKSB7XHJcblx0XHQvLyBFcnJvcnMgZnJvbSAkLmdldCBiZWluZyByZWplY3RlZCAoT1JFUyAmIFJhdyB3aWtpdGV4dClcclxuXHRcdHZhciBlcnJvck9iaiA9IGZpcnN0LnJlc3BvbnNlSlNPTiAmJiBmaXJzdC5yZXNwb25zZUpTT04uZXJyb3I7XHJcblx0XHRpZiAoIGVycm9yT2JqICkge1xyXG5cdFx0XHQvLyBHb3QgYW4gYXBpLXNwZWNpZmljIGVycm9yIGNvZGUvbWVzc2FnZVxyXG5cdFx0XHRjb2RlID0gZXJyb3JPYmouY29kZTtcclxuXHRcdFx0bWVzc2FnZSA9IGVycm9yT2JqLm1lc3NhZ2U7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR4aHIgPSBmaXJzdDtcclxuXHRcdH1cclxuXHR9IGVsc2UgaWYgKCB0eXBlb2YgZmlyc3QgPT09IFwic3RyaW5nXCIgJiYgdHlwZW9mIHNlY29uZCA9PT0gXCJvYmplY3RcIiApIHtcclxuXHRcdC8vIEVycm9ycyBmcm9tIG13LkFwaSBvYmplY3RcclxuXHRcdHZhciBtd0Vycm9yT2JqID0gc2Vjb25kLmVycm9yO1xyXG5cdFx0aWYgKG13RXJyb3JPYmopIHtcclxuXHRcdFx0Ly8gR290IGFuIGFwaS1zcGVjaWZpYyBlcnJvciBjb2RlL21lc3NhZ2VcclxuXHRcdFx0Y29kZSA9IGVycm9yT2JqLmNvZGU7XHJcblx0XHRcdG1lc3NhZ2UgPSBlcnJvck9iai5pbmZvO1xyXG5cdFx0fSBlbHNlIGlmIChmaXJzdCA9PT0gXCJvay1idXQtZW1wdHlcIikge1xyXG5cdFx0XHRjb2RlID0gbnVsbDtcclxuXHRcdFx0bWVzc2FnZSA9IFwiR290IGFuIGVtcHR5IHJlc3BvbnNlIGZyb20gdGhlIHNlcnZlclwiO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0eGhyID0gc2Vjb25kICYmIHNlY29uZC54aHI7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRpZiAoY29kZSAmJiBtZXNzYWdlKSB7XHJcblx0XHRyZXR1cm4gYEFQSSBlcnJvciAke2NvZGV9OiAke21lc3NhZ2V9YDtcclxuXHR9IGVsc2UgaWYgKG1lc3NhZ2UpIHtcclxuXHRcdHJldHVybiBgQVBJIGVycm9yOiAke21lc3NhZ2V9YDtcclxuXHR9IGVsc2UgaWYgKHhocikge1xyXG5cdFx0cmV0dXJuIGBIVFRQIGVycm9yICR7eGhyLnN0YXR1c31gO1xyXG5cdH0gZWxzZSBpZiAoXHJcblx0XHR0eXBlb2YgZmlyc3QgPT09IFwic3RyaW5nXCIgJiYgZmlyc3QgIT09IFwiZXJyb3JcIiAmJlxyXG5cdFx0dHlwZW9mIHNlY29uZCA9PT0gXCJzdHJpbmdcIiAmJiBzZWNvbmQgIT09IFwiZXJyb3JcIlxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIGBFcnJvciAke2ZpcnN0fTogJHtzZWNvbmR9YDtcclxuXHR9IGVsc2UgaWYgKHR5cGVvZiBmaXJzdCA9PT0gXCJzdHJpbmdcIiAmJiBmaXJzdCAhPT0gXCJlcnJvclwiKSB7XHJcblx0XHRyZXR1cm4gYEVycm9yOiAke2ZpcnN0fWA7XHJcblx0fSBlbHNlIHtcclxuXHRcdHJldHVybiBcIlVua25vd24gQVBJIGVycm9yXCI7XHJcblx0fVxyXG59O1xyXG5cclxuZXhwb3J0IHtpc0FmdGVyRGF0ZSwgQVBJLCBtYWtlRXJyb3JNc2d9OyIsImltcG9ydCBMb2FkRGlhbG9nIGZyb20gXCIuL1dpbmRvd3MvTG9hZERpYWxvZ1wiO1xyXG5pbXBvcnQgTWFpbldpbmRvdyBmcm9tIFwiLi9XaW5kb3dzL01haW5XaW5kb3dcIjtcclxuXHJcbnZhciBmYWN0b3J5ID0gbmV3IE9PLkZhY3RvcnkoKTtcclxuXHJcbi8vIFJlZ2lzdGVyIHdpbmRvdyBjb25zdHJ1Y3RvcnMgd2l0aCB0aGUgZmFjdG9yeS5cclxuZmFjdG9yeS5yZWdpc3RlcihMb2FkRGlhbG9nKTtcclxuZmFjdG9yeS5yZWdpc3RlcihNYWluV2luZG93KTtcclxuXHJcbnZhciBtYW5hZ2VyID0gbmV3IE9PLnVpLldpbmRvd01hbmFnZXIoIHtcclxuXHRcImZhY3RvcnlcIjogZmFjdG9yeVxyXG59ICk7XHJcbiQoIGRvY3VtZW50LmJvZHkgKS5hcHBlbmQoIG1hbmFnZXIuJGVsZW1lbnQgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IG1hbmFnZXI7Il19
