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

},{"./autostart":5,"./css.js":8,"./setup":10,"./util":11,"./windowManager":12}],2:[function(require,module,exports){
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

},{"./cache":6,"./config":7,"./util":11}],3:[function(require,module,exports){
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

},{"../util":11}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

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
  this.topBar.$element.append(this.searchBox.$element, this.setAllDropDown.$element, this.doAllButtons.$element); // FIXME: this is placeholder content

  this.content.$element.append("<span>(No project banners yet)</span>");
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
    _this.updateSize();
  }, this);
};

var _default = MainWindow;
exports["default"] = _default;

},{}],5:[function(require,module,exports){
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

},{"./config":7,"./setup":10,"./util":11}],6:[function(require,module,exports){
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

},{"./util":11}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.diffStyles = void 0;
// Attribution: Diff styles from <https://en.wikipedia.org/wiki/Wikipedia:AutoWikiBrowser/style.css>
var diffStyles = "table.diff, td.diff-otitle, td.diff-ntitle { background-color: white; }\ntd.diff-otitle, td.diff-ntitle { text-align: center; }\ntd.diff-marker { text-align: right; font-weight: bold; font-size: 1.25em; }\ntd.diff-lineno { font-weight: bold; }\ntd.diff-addedline, td.diff-deletedline, td.diff-context { font-size: 88%; vertical-align: top; white-space: -moz-pre-wrap; white-space: pre-wrap; }\ntd.diff-addedline, td.diff-deletedline { border-style: solid; border-width: 1px 1px 1px 4px; border-radius: 0.33em; }\ntd.diff-addedline { border-color: #a3d3ff; }\ntd.diff-deletedline { border-color: #ffe49c; }\ntd.diff-context { background: #f3f3f3; color: #333333; border-style: solid; border-width: 1px 1px 1px 4px; border-color: #e6e6e6; border-radius: 0.33em; }\n.diffchange { font-weight: bold; text-decoration: none; }\ntable.diff {\n    border: none;\n    width: 98%; border-spacing: 4px;\n    table-layout: fixed; /* Ensures that colums are of equal width */\n}\ntd.diff-addedline .diffchange, td.diff-deletedline .diffchange { border-radius: 0.33em; padding: 0.25em 0; }\ntd.diff-addedline .diffchange {\tbackground: #d8ecff; }\ntd.diff-deletedline .diffchange { background: #feeec8; }\ntable.diff td {\tpadding: 0.33em 0.66em; }\ntable.diff col.diff-marker { width: 2%; }\ntable.diff col.diff-content { width: 48%; }\ntable.diff td div {\n    /* Force-wrap very long lines such as URLs or page-widening char strings. */\n    word-wrap: break-word;\n    /* As fallback (FF<3.5, Opera <10.5), scrollbars will be added for very wide cells\n        instead of text overflowing or widening */\n    overflow: auto;\n}";
exports.diffStyles = diffStyles;

},{}],9:[function(require,module,exports){
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

},{"./cache":6,"./util":11}],10:[function(require,module,exports){
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

},{"./Template":2,"./cache":6,"./config":7,"./getBanners":9,"./util":11,"./windowManager":12}],11:[function(require,module,exports){
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

},{"./config":7}],12:[function(require,module,exports){
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

},{"./Windows/LoadDialog":3,"./Windows/MainWindow":4}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJyYXRlci1zcmMvQXBwLmpzIiwicmF0ZXItc3JjL1RlbXBsYXRlLmpzIiwicmF0ZXItc3JjL1dpbmRvd3MvTG9hZERpYWxvZy5qcyIsInJhdGVyLXNyYy9XaW5kb3dzL01haW5XaW5kb3cuanMiLCJyYXRlci1zcmMvYXV0b3N0YXJ0LmpzIiwicmF0ZXItc3JjL2NhY2hlLmpzIiwicmF0ZXItc3JjL2NvbmZpZy5qcyIsInJhdGVyLXNyYy9jc3MuanMiLCJyYXRlci1zcmMvZ2V0QmFubmVycy5qcyIsInJhdGVyLXNyYy9zZXR1cC5qcyIsInJhdGVyLXNyYy91dGlsLmpzIiwicmF0ZXItc3JjL3dpbmRvd01hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7O0FBRUEsQ0FBQyxTQUFTLEdBQVQsR0FBZTtBQUNmLEVBQUEsT0FBTyxDQUFDLEdBQVIsQ0FBWSw4QkFBWjtBQUVBLEVBQUEsRUFBRSxDQUFDLElBQUgsQ0FBUSxNQUFSLENBQWUsZUFBZjs7QUFFQSxNQUFNLGNBQWMsR0FBRyxTQUFqQixjQUFpQixDQUFBLElBQUksRUFBSTtBQUM5QixRQUFJLENBQUMsSUFBRCxJQUFTLENBQUMsSUFBSSxDQUFDLE9BQW5CLEVBQTRCO0FBQzNCO0FBQ0E7O0FBRUQsOEJBQWMsVUFBZCxDQUF5QixNQUF6QixFQUFpQyxJQUFqQztBQUNBLEdBTkQ7O0FBUUEsTUFBTSxjQUFjLEdBQUcsU0FBakIsY0FBaUIsQ0FBQyxJQUFELEVBQU8sS0FBUDtBQUFBLFdBQWlCLEVBQUUsQ0FBQyxFQUFILENBQU0sS0FBTixDQUN2Qyx3QkFBYSxJQUFiLEVBQW1CLEtBQW5CLENBRHVDLEVBQ1o7QUFDMUIsTUFBQSxLQUFLLEVBQUU7QUFEbUIsS0FEWSxDQUFqQjtBQUFBLEdBQXZCLENBYmUsQ0FtQmY7OztBQUNBLEVBQUEsRUFBRSxDQUFD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S0FBa0IsUUFEbEIsSUFDOEIsTUFBTSxLQUFLLE9BRm5DLEVBR0w7QUFDRCwyQkFBZ0IsS0FBaEIsZUFBMEIsTUFBMUI7QUFDQSxHQUxNLE1BS0EsSUFBSSxPQUFPLEtBQVAsS0FBaUIsUUFBakIsSUFBNkIsS0FBSyxLQUFLLE9BQTNDLEVBQW9EO0FBQzFELDRCQUFpQixLQUFqQjtBQUNBLEdBRk0sTUFFQTtBQUNOLFdBQU8sbUJBQVA7QUFDQTtBQUNELENBM0NEOzs7Ozs7Ozs7Ozs7QUMvQkE7O0FBQ0E7Ozs7QUFFQSxJQUFJLE9BQU8sR0FBRyxJQUFJLEVBQUUsQ0FBQyxPQUFQLEVBQWQsQyxDQUVBOztBQUNBLE9BQU8sQ0FBQyxRQUFSLENBQWlCLHNCQUFqQjtBQUNBLE9BQU8sQ0FBQyxRQUFSLENBQWlCLHNCQUFqQjtBQUVBLElBQUksT0FBTyxHQUFHLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxhQUFWLENBQXlCO0FBQ3RDLGFBQVc7QUFEMkIsQ0FBekIsQ0FBZDtBQUdBLENBQUMsQ0FBRSxRQUFRLENBQUMsSUFBWCxDQUFELENBQW1CLE1BQW5CLENBQTJCLE9BQU8sQ0FBQyxRQUFuQztlQUVlLE8iLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbXBvcnQgc2V0dXBSYXRlciBmcm9tIFwiLi9zZXR1cFwiO1xyXG5pbXBvcnQgYXV0b1N0YXJ0IGZyb20gXCIuL2F1dG9zdGFydFwiO1xyXG5pbXBvcnQgZGlmZlN0eWxlcyBmcm9tIFwiLi9jc3MuanNcIjtcclxuaW1wb3J0IHsgbWFrZUVycm9yTXNnIH0gZnJvbSBcIi4vdXRpbFwiO1xyXG5pbXBvcnQgd2luZG93TWFuYWdlciBmcm9tIFwiLi93aW5kb3dNYW5hZ2VyXCI7XHJcblxyXG4oZnVuY3Rpb24gQXBwKCkge1xyXG5cdGNvbnNvbGUubG9nKFwiUmF0ZXIncyBBcHAuanMgaXMgcnVubmluZy4uLlwiKTtcclxuXHJcblx0bXcudXRpbC5hZGRDU1MoZGlmZlN0eWxlcyk7XHJcblxyXG5cdGNvbnN0IHNob3dNYWluV2luZG93ID0gZGF0YSA9PiB7XHJcblx0XHRpZiAoIWRhdGEgfHwgIWRhdGEuc3VjY2Vzcykge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0d2luZG93TWFuYWdlci5vcGVuV2luZG93KFwibWFpblwiLCBkYXRhKTtcclxuXHR9O1xyXG5cclxuXHRjb25zdCBzaG93U2V0dXBFcnJvciA9IChjb2RlLCBqcXhocikgPT4gT08udWkuYWxlcnQoXHJcblx0XHRtYWtlRXJyb3JNc2coY29kZSwganF4aHIpLFx0e1xyXG5cdFx0XHR0aXRsZTogXCJSYXRlciBmYWlsZWQgdG8gb3BlblwiXHJcblx0XHR9XHJcblx0KTtcclxuXHJcblx0Ly8gSW52b2NhdGlvbiBieSBwb3J0bGV0IGxpbmsgXHJcblx0bXcudXRpbC5hZGRQb3J0bGV0TGluayhcclxuXHRcdFwicC1jYWN0aW9uc1wiLFxyXG5cdFx0XCIjXCIsXHJcblx0XHRcIlJhdGVyXCIsXHJcblx0XHRcImNhLXJhdGVyXCIsXHJcblx0XHRcIlJhdGUgcXVhbGl0eSBhbmQgaW1wb3J0YW5jZVwiLFxyXG5cdFx0XCI1XCJcclxuXHQpO1xyXG5cdCQoXCIjY2EtcmF0ZXJcIikuY2xpY2soKCkgPT4gc2V0dXBSYXRlcigpLnRoZW4oc2hvd01haW5XaW5kb3csIHNob3dTZXR1cEVycm9yKSApO1xyXG5cclxuXHQvLyBJbnZvY2F0aW9uIGJ5IGF1dG8tc3RhcnQgKGRvIG5vdCBzaG93IG1lc3NhZ2Ugb24gZXJyb3IpXHJcblx0YXV0b1N0YXJ0KCkudGhlbihzaG93TWFpbldpbmRvdyk7XHJcbn0pKCk7IiwiaW1wb3J0IHtBUEksIGlzQWZ0ZXJEYXRlfSBmcm9tIFwiLi91dGlsXCI7XHJcbmltcG9ydCBjb25maWcgZnJvbSBcIi4vY29uZmlnXCI7XHJcbmltcG9ydCAqIGFzIGNhY2hlIGZyb20gXCIuL2NhY2hlXCI7XHJcblxyXG4vKiogVGVtcGxhdGVcclxuICpcclxuICogQGNsYXNzXHJcbiAqIFJlcHJlc2VudHMgdGhlIHdpa2l0ZXh0IG9mIHRlbXBsYXRlIHRyYW5zY2x1c2lvbi4gVXNlZCBieSAjcGFyc2VUZW1wbGF0ZXMuXHJcbiAqIEBwcm9wIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgdGVtcGxhdGVcclxuICogQHByb3Age1N0cmluZ30gd2lraXRleHQgRnVsbCB3aWtpdGV4dCBvZiB0aGUgdHJhbnNjbHVzaW9uXHJcbiAqIEBwcm9wIHtPYmplY3RbXX0gcGFyYW1ldGVycyBQYXJhbWV0ZXJzIHVzZWQgaW4gdGhlIHRyYW5zbGN1c2lvbiwgaW4gb3JkZXIsIG9mIGZvcm06XHJcblx0e1xyXG5cdFx0bmFtZToge1N0cmluZ3xOdW1iZXJ9IHBhcmFtZXRlciBuYW1lLCBvciBwb3NpdGlvbiBmb3IgdW5uYW1lZCBwYXJhbWV0ZXJzLFxyXG5cdFx0dmFsdWU6IHtTdHJpbmd9IFdpa2l0ZXh0IHBhc3NlZCB0byB0aGUgcGFyYW1ldGVyICh3aGl0ZXNwYWNlIHRyaW1tZWQpLFxyXG5cdFx0d2lraXRleHQ6IHtTdHJpbmd9IEZ1bGwgd2lraXRleHQgKGluY2x1ZGluZyBsZWFkaW5nIHBpcGUsIHBhcmFtZXRlciBuYW1lL2VxdWFscyBzaWduIChpZiBhcHBsaWNhYmxlKSwgdmFsdWUsIGFuZCBhbnkgd2hpdGVzcGFjZSlcclxuXHR9XHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge1N0cmluZ30gd2lraXRleHQgV2lraXRleHQgb2YgYSB0ZW1wbGF0ZSB0cmFuc2NsdXNpb24sIHN0YXJ0aW5nIHdpdGggJ3t7JyBhbmQgZW5kaW5nIHdpdGggJ319Jy5cclxuICovXHJcbnZhciBUZW1wbGF0ZSA9IGZ1bmN0aW9uKHdpa2l0ZXh0KSB7XHJcblx0dGhpcy53aWtpdGV4dCA9IHdpa2l0ZXh0O1xyXG5cdHRoaXMucGFyYW1ldGVycyA9IFtdO1xyXG59O1xyXG5UZW1wbGF0ZS5wcm90b3R5cGUuYWRkUGFyYW0gPSBmdW5jdGlvbihuYW1lLCB2YWwsIHdpa2l0ZXh0KSB7XHJcblx0dGhpcy5wYXJhbWV0ZXJzLnB1c2goe1xyXG5cdFx0XCJuYW1lXCI6IG5hbWUsXHJcblx0XHRcInZhbHVlXCI6IHZhbCwgXHJcblx0XHRcIndpa2l0ZXh0XCI6IFwifFwiICsgd2lraXRleHRcclxuXHR9KTtcclxufTtcclxuLyoqXHJcbiAqIEdldCBhIHBhcmFtZXRlciBkYXRhIGJ5IHBhcmFtZXRlciBuYW1lXHJcbiAqLyBcclxuVGVtcGxhdGUucHJvdG90eXBlLmdldFBhcmFtID0gZnVuY3Rpb24ocGFyYW1OYW1lKSB7XHJcblx0cmV0dXJuIHRoaXMucGFyYW1ldGVycy5maW5kKGZ1bmN0aW9uKHApIHsgcmV0dXJuIHAubmFtZSA9PSBwYXJhbU5hbWU7IH0pO1xyXG59O1xyXG5UZW1wbGF0ZS5wcm90b3R5cGUuc2V0TmFtZSA9IGZ1bmN0aW9uKG5hbWUpIHtcclxuXHR0aGlzLm5hbWUgPSBuYW1lLnRyaW0oKTtcclxufTtcclxuVGVtcGxhdGUucHJvdG90eXBlLmdldFRpdGxlID0gZnVuY3Rpb24oKSB7XHJcblx0cmV0dXJuIG13LlRpdGxlLm5ld0Zyb21UZXh0KFwiVGVtcGxhdGU6XCIgKyB0aGlzLm5hbWUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIHBhcnNlVGVtcGxhdGVzXHJcbiAqXHJcbiAqIFBhcnNlcyB0ZW1wbGF0ZXMgZnJvbSB3aWtpdGV4dC5cclxuICogQmFzZWQgb24gU0QwMDAxJ3MgdmVyc2lvbiBhdCA8aHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvVXNlcjpTRDAwMDEvcGFyc2VBbGxUZW1wbGF0ZXMuanM+LlxyXG4gKiBSZXR1cm5zIGFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIHRlbXBsYXRlIGRldGFpbHM6XHJcbiAqICB2YXIgdGVtcGxhdGVzID0gcGFyc2VUZW1wbGF0ZXMoXCJIZWxsbyB7e2ZvbyB8QmFyfGJhej1xdXggfDI9bG9yZW1pcHN1bXwzPX19IHdvcmxkXCIpO1xyXG4gKiAgY29uc29sZS5sb2codGVtcGxhdGVzWzBdKTsgLy8gLS0+IG9iamVjdFxyXG5cdHtcclxuXHRcdG5hbWU6IFwiZm9vXCIsXHJcblx0XHR3aWtpdGV4dDpcInt7Zm9vIHxCYXJ8YmF6PXF1eCB8IDIgPSBsb3JlbWlwc3VtICB8Mz19fVwiLFxyXG5cdFx0cGFyYW1ldGVyczogW1xyXG5cdFx0XHR7XHJcblx0XHRcdFx0bmFtZTogMSxcclxuXHRcdFx0XHR2YWx1ZTogJ0JhcicsXHJcblx0XHRcdFx0d2lraXRleHQ6ICd8QmFyJ1xyXG5cdFx0XHR9LFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0bmFtZTogJ2JheicsXHJcblx0XHRcdFx0dmFsdWU6ICdxdXgnLFxyXG5cdFx0XHRcdHdpa2l0ZXh0OiAnfGJhej1xdXggJ1xyXG5cdFx0XHR9LFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0bmFtZTogJzInLFxyXG5cdFx0XHRcdHZhbHVlOiAnbG9yZW1pcHN1bScsXHJcblx0XHRcdFx0d2lraXRleHQ6ICd8IDIgPSBsb3JlbWlwc3VtICAnXHJcblx0XHRcdH0sXHJcblx0XHRcdHtcclxuXHRcdFx0XHRuYW1lOiAnMycsXHJcblx0XHRcdFx0dmFsdWU6ICcnLFxyXG5cdFx0XHRcdHdpa2l0ZXh0OiAnfDM9J1xyXG5cdFx0XHR9XHJcblx0XHRdLFxyXG5cdFx0Z2V0UGFyYW06IGZ1bmN0aW9uKHBhcmFtTmFtZSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5wYXJhbWV0ZXJzLmZpbmQoZnVuY3Rpb24ocCkgeyByZXR1cm4gcC5uYW1lID09IHBhcmFtTmFtZTsgfSk7XHJcblx0XHR9XHJcblx0fVxyXG4gKiAgICBcclxuICogXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB3aWtpdGV4dFxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHJlY3Vyc2l2ZSBTZXQgdG8gYHRydWVgIHRvIGFsc28gcGFyc2UgdGVtcGxhdGVzIHRoYXQgb2NjdXIgd2l0aGluIG90aGVyIHRlbXBsYXRlcyxcclxuICogIHJhdGhlciB0aGFuIGp1c3QgdG9wLWxldmVsIHRlbXBsYXRlcy4gXHJcbiAqIEByZXR1cm4ge1RlbXBsYXRlW119IHRlbXBsYXRlc1xyXG4qL1xyXG52YXIgcGFyc2VUZW1wbGF0ZXMgPSBmdW5jdGlvbih3aWtpdGV4dCwgcmVjdXJzaXZlKSB7IC8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnRyb2wtcmVnZXggKi9cclxuXHRpZiAoIXdpa2l0ZXh0KSB7XHJcblx0XHRyZXR1cm4gW107XHJcblx0fVxyXG5cdHZhciBzdHJSZXBsYWNlQXQgPSBmdW5jdGlvbihzdHJpbmcsIGluZGV4LCBjaGFyKSB7XHJcblx0XHRyZXR1cm4gc3RyaW5nLnNsaWNlKDAsaW5kZXgpICsgY2hhciArIHN0cmluZy5zbGljZShpbmRleCArIDEpO1xyXG5cdH07XHJcblxyXG5cdHZhciByZXN1bHQgPSBbXTtcclxuXHRcclxuXHR2YXIgcHJvY2Vzc1RlbXBsYXRlVGV4dCA9IGZ1bmN0aW9uIChzdGFydElkeCwgZW5kSWR4KSB7XHJcblx0XHR2YXIgdGV4dCA9IHdpa2l0ZXh0LnNsaWNlKHN0YXJ0SWR4LCBlbmRJZHgpO1xyXG5cclxuXHRcdHZhciB0ZW1wbGF0ZSA9IG5ldyBUZW1wbGF0ZShcInt7XCIgKyB0ZXh0LnJlcGxhY2UoL1xceDAxL2csXCJ8XCIpICsgXCJ9fVwiKTtcclxuXHRcdFxyXG5cdFx0Ly8gc3dhcCBvdXQgcGlwZSBpbiBsaW5rcyB3aXRoIFxceDAxIGNvbnRyb2wgY2hhcmFjdGVyXHJcblx0XHQvLyBbW0ZpbGU6IF1dIGNhbiBoYXZlIG11bHRpcGxlIHBpcGVzLCBzbyBtaWdodCBuZWVkIG11bHRpcGxlIHBhc3Nlc1xyXG5cdFx0d2hpbGUgKCAvKFxcW1xcW1teXFxdXSo/KVxcfCguKj9cXF1cXF0pL2cudGVzdCh0ZXh0KSApIHtcclxuXHRcdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvKFxcW1xcW1teXFxdXSo/KVxcfCguKj9cXF1cXF0pL2csIFwiJDFcXHgwMSQyXCIpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBjaHVua3MgPSB0ZXh0LnNwbGl0KFwifFwiKS5tYXAoZnVuY3Rpb24oY2h1bmspIHtcclxuXHRcdFx0Ly8gY2hhbmdlICdcXHgwMScgY29udHJvbCBjaGFyYWN0ZXJzIGJhY2sgdG8gcGlwZXNcclxuXHRcdFx0cmV0dXJuIGNodW5rLnJlcGxhY2UoL1xceDAxL2csXCJ8XCIpOyBcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRlbXBsYXRlLnNldE5hbWUoY2h1bmtzWzBdKTtcclxuXHRcdFxyXG5cdFx0dmFyIHBhcmFtZXRlckNodW5rcyA9IGNodW5rcy5zbGljZSgxKTtcclxuXHJcblx0XHR2YXIgdW5uYW1lZElkeCA9IDE7XHJcblx0XHRwYXJhbWV0ZXJDaHVua3MuZm9yRWFjaChmdW5jdGlvbihjaHVuaykge1xyXG5cdFx0XHR2YXIgaW5kZXhPZkVxdWFsVG8gPSBjaHVuay5pbmRleE9mKFwiPVwiKTtcclxuXHRcdFx0dmFyIGluZGV4T2ZPcGVuQnJhY2VzID0gY2h1bmsuaW5kZXhPZihcInt7XCIpO1xyXG5cdFx0XHRcclxuXHRcdFx0dmFyIGlzV2l0aG91dEVxdWFscyA9ICFjaHVuay5pbmNsdWRlcyhcIj1cIik7XHJcblx0XHRcdHZhciBoYXNCcmFjZXNCZWZvcmVFcXVhbHMgPSBjaHVuay5pbmNsdWRlcyhcInt7XCIpICYmIGluZGV4T2ZPcGVuQnJhY2VzIDwgaW5kZXhPZkVxdWFsVG87XHRcclxuXHRcdFx0dmFyIGlzVW5uYW1lZFBhcmFtID0gKCBpc1dpdGhvdXRFcXVhbHMgfHwgaGFzQnJhY2VzQmVmb3JlRXF1YWxzICk7XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgcE5hbWUsIHBOdW0sIHBWYWw7XHJcblx0XHRcdGlmICggaXNVbm5hbWVkUGFyYW0gKSB7XHJcblx0XHRcdFx0Ly8gR2V0IHRoZSBuZXh0IG51bWJlciBub3QgYWxyZWFkeSB1c2VkIGJ5IGVpdGhlciBhbiB1bm5hbWVkIHBhcmFtZXRlciwgb3IgYnkgYVxyXG5cdFx0XHRcdC8vIG5hbWVkIHBhcmFtZXRlciBsaWtlIGB8MT12YWxgXHJcblx0XHRcdFx0d2hpbGUgKCB0ZW1wbGF0ZS5nZXRQYXJhbSh1bm5hbWVkSWR4KSApIHtcclxuXHRcdFx0XHRcdHVubmFtZWRJZHgrKztcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cE51bSA9IHVubmFtZWRJZHg7XHJcblx0XHRcdFx0cFZhbCA9IGNodW5rLnRyaW0oKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRwTmFtZSA9IGNodW5rLnNsaWNlKDAsIGluZGV4T2ZFcXVhbFRvKS50cmltKCk7XHJcblx0XHRcdFx0cFZhbCA9IGNodW5rLnNsaWNlKGluZGV4T2ZFcXVhbFRvICsgMSkudHJpbSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRlbXBsYXRlLmFkZFBhcmFtKHBOYW1lIHx8IHBOdW0sIHBWYWwsIGNodW5rKTtcclxuXHRcdH0pO1xyXG5cdFx0XHJcblx0XHRyZXN1bHQucHVzaCh0ZW1wbGF0ZSk7XHJcblx0fTtcclxuXHJcblx0XHJcblx0dmFyIG4gPSB3aWtpdGV4dC5sZW5ndGg7XHJcblx0XHJcblx0Ly8gbnVtYmVyIG9mIHVuY2xvc2VkIGJyYWNlc1xyXG5cdHZhciBudW1VbmNsb3NlZCA9IDA7XHJcblxyXG5cdC8vIGFyZSB3ZSBpbnNpZGUgYSBjb21tZW50IG9yIGJldHdlZW4gbm93aWtpIHRhZ3M/XHJcblx0dmFyIGluQ29tbWVudCA9IGZhbHNlO1xyXG5cdHZhciBpbk5vd2lraSA9IGZhbHNlO1xyXG5cclxuXHR2YXIgc3RhcnRJZHgsIGVuZElkeDtcclxuXHRcclxuXHRmb3IgKHZhciBpPTA7IGk8bjsgaSsrKSB7XHJcblx0XHRcclxuXHRcdGlmICggIWluQ29tbWVudCAmJiAhaW5Ob3dpa2kgKSB7XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAod2lraXRleHRbaV0gPT09IFwie1wiICYmIHdpa2l0ZXh0W2krMV0gPT09IFwie1wiKSB7XHJcblx0XHRcdFx0aWYgKG51bVVuY2xvc2VkID09PSAwKSB7XHJcblx0XHRcdFx0XHRzdGFydElkeCA9IGkrMjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0bnVtVW5jbG9zZWQgKz0gMjtcclxuXHRcdFx0XHRpKys7XHJcblx0XHRcdH0gZWxzZSBpZiAod2lraXRleHRbaV0gPT09IFwifVwiICYmIHdpa2l0ZXh0W2krMV0gPT09IFwifVwiKSB7XHJcblx0XHRcdFx0aWYgKG51bVVuY2xvc2VkID09PSAyKSB7XHJcblx0XHRcdFx0XHRlbmRJZHggPSBpO1xyXG5cdFx0XHRcdFx0cHJvY2Vzc1RlbXBsYXRlVGV4dChzdGFydElkeCwgZW5kSWR4KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0bnVtVW5jbG9zZWQgLT0gMjtcclxuXHRcdFx0XHRpKys7XHJcblx0XHRcdH0gZWxzZSBpZiAod2lraXRleHRbaV0gPT09IFwifFwiICYmIG51bVVuY2xvc2VkID4gMikge1xyXG5cdFx0XHRcdC8vIHN3YXAgb3V0IHBpcGVzIGluIG5lc3RlZCB0ZW1wbGF0ZXMgd2l0aCBcXHgwMSBjaGFyYWN0ZXJcclxuXHRcdFx0XHR3aWtpdGV4dCA9IHN0clJlcGxhY2VBdCh3aWtpdGV4dCwgaSxcIlxceDAxXCIpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKCAvXjwhLS0vLnRlc3Qod2lraXRleHQuc2xpY2UoaSwgaSArIDQpKSApIHtcclxuXHRcdFx0XHRpbkNvbW1lbnQgPSB0cnVlO1xyXG5cdFx0XHRcdGkgKz0gMztcclxuXHRcdFx0fSBlbHNlIGlmICggL148bm93aWtpID8+Ly50ZXN0KHdpa2l0ZXh0LnNsaWNlKGksIGkgKyA5KSkgKSB7XHJcblx0XHRcdFx0aW5Ob3dpa2kgPSB0cnVlO1xyXG5cdFx0XHRcdGkgKz0gNztcclxuXHRcdFx0fSBcclxuXHJcblx0XHR9IGVsc2UgeyAvLyB3ZSBhcmUgaW4gYSBjb21tZW50IG9yIG5vd2lraVxyXG5cdFx0XHRpZiAod2lraXRleHRbaV0gPT09IFwifFwiKSB7XHJcblx0XHRcdFx0Ly8gc3dhcCBvdXQgcGlwZXMgd2l0aCBcXHgwMSBjaGFyYWN0ZXJcclxuXHRcdFx0XHR3aWtpdGV4dCA9IHN0clJlcGxhY2VBdCh3aWtpdGV4dCwgaSxcIlxceDAxXCIpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKC9eLS0+Ly50ZXN0KHdpa2l0ZXh0LnNsaWNlKGksIGkgKyAzKSkpIHtcclxuXHRcdFx0XHRpbkNvbW1lbnQgPSBmYWxzZTtcclxuXHRcdFx0XHRpICs9IDI7XHJcblx0XHRcdH0gZWxzZSBpZiAoL148XFwvbm93aWtpID8+Ly50ZXN0KHdpa2l0ZXh0LnNsaWNlKGksIGkgKyAxMCkpKSB7XHJcblx0XHRcdFx0aW5Ob3dpa2kgPSBmYWxzZTtcclxuXHRcdFx0XHRpICs9IDg7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0fVxyXG5cdFxyXG5cdGlmICggcmVjdXJzaXZlICkge1xyXG5cdFx0dmFyIHN1YnRlbXBsYXRlcyA9IHJlc3VsdC5tYXAoZnVuY3Rpb24odGVtcGxhdGUpIHtcclxuXHRcdFx0cmV0dXJuIHRlbXBsYXRlLndpa2l0ZXh0LnNsaWNlKDIsLTIpO1xyXG5cdFx0fSlcclxuXHRcdFx0LmZpbHRlcihmdW5jdGlvbih0ZW1wbGF0ZVdpa2l0ZXh0KSB7XHJcblx0XHRcdFx0cmV0dXJuIC9cXHtcXHsuKlxcfVxcfS8udGVzdCh0ZW1wbGF0ZVdpa2l0ZXh0KTtcclxuXHRcdFx0fSlcclxuXHRcdFx0Lm1hcChmdW5jdGlvbih0ZW1wbGF0ZVdpa2l0ZXh0KSB7XHJcblx0XHRcdFx0cmV0dXJuIHBhcnNlVGVtcGxhdGVzKHRlbXBsYXRlV2lraXRleHQsIHRydWUpO1xyXG5cdFx0XHR9KTtcclxuXHRcdFxyXG5cdFx0cmV0dXJuIHJlc3VsdC5jb25jYXQuYXBwbHkocmVzdWx0LCBzdWJ0ZW1wbGF0ZXMpO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHJlc3VsdDsgXHJcbn07IC8qIGVzbGludC1lbmFibGUgbm8tY29udHJvbC1yZWdleCAqL1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7VGVtcGxhdGV8VGVtcGxhdGVbXX0gdGVtcGxhdGVzXHJcbiAqIEByZXR1cm4ge1Byb21pc2U8VGVtcGxhdGVbXT59XHJcbiAqL1xyXG52YXIgZ2V0V2l0aFJlZGlyZWN0VG8gPSBmdW5jdGlvbih0ZW1wbGF0ZXMpIHtcclxuXHR2YXIgdGVtcGxhdGVzQXJyYXkgPSBBcnJheS5pc0FycmF5KHRlbXBsYXRlcykgPyB0ZW1wbGF0ZXMgOiBbdGVtcGxhdGVzXTtcclxuXHRpZiAodGVtcGxhdGVzQXJyYXkubGVuZ3RoID09PSAwKSB7XHJcblx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlc29sdmUoW10pO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIEFQSS5nZXQoe1xyXG5cdFx0XCJhY3Rpb25cIjogXCJxdWVyeVwiLFxyXG5cdFx0XCJmb3JtYXRcIjogXCJqc29uXCIsXHJcblx0XHRcInRpdGxlc1wiOiB0ZW1wbGF0ZXNBcnJheS5tYXAodGVtcGxhdGUgPT4gdGVtcGxhdGUuZ2V0VGl0bGUoKS5nZXRQcmVmaXhlZFRleHQoKSksXHJcblx0XHRcInJlZGlyZWN0c1wiOiAxXHJcblx0fSkudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcclxuXHRcdGlmICggIXJlc3VsdCB8fCAhcmVzdWx0LnF1ZXJ5ICkge1xyXG5cdFx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdChcIkVtcHR5IHJlc3BvbnNlXCIpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKCByZXN1bHQucXVlcnkucmVkaXJlY3RzICkge1xyXG5cdFx0XHRyZXN1bHQucXVlcnkucmVkaXJlY3RzLmZvckVhY2goZnVuY3Rpb24ocmVkaXJlY3QpIHtcclxuXHRcdFx0XHR2YXIgaSA9IHRlbXBsYXRlc0FycmF5LmZpbmRJbmRleCh0ZW1wbGF0ZSA9PiB0ZW1wbGF0ZS5nZXRUaXRsZSgpLmdldFByZWZpeGVkVGV4dCgpID09PSByZWRpcmVjdC5mcm9tKTtcclxuXHRcdFx0XHRpZiAoaSAhPT0gLTEpIHtcclxuXHRcdFx0XHRcdHRlbXBsYXRlc0FycmF5W2ldLnJlZGlyZWN0c1RvID0gbXcuVGl0bGUubmV3RnJvbVRleHQocmVkaXJlY3QudG8pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGVtcGxhdGVzQXJyYXk7XHJcblx0fSk7XHJcbn07XHJcblxyXG5UZW1wbGF0ZS5wcm90b3R5cGUuZ2V0RGF0YUZvclBhcmFtID0gZnVuY3Rpb24oa2V5LCBwYXJhTmFtZSkge1xyXG5cdGlmICggIXRoaXMucGFyYW1EYXRhICkge1xyXG5cdFx0cmV0dXJuIG51bGw7XHJcblx0fVxyXG5cdC8vIElmIGFsaWFzLCBzd2l0Y2ggZnJvbSBhbGlhcyB0byBwcmVmZXJyZWQgcGFyYW1ldGVyIG5hbWVcclxuXHR2YXIgcGFyYSA9IHRoaXMucGFyYW1BbGlhc2VzW3BhcmFOYW1lXSB8fCBwYXJhTmFtZTtcdFxyXG5cdGlmICggIXRoaXMucGFyYW1EYXRhW3BhcmFdICkge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHRcclxuXHR2YXIgZGF0YSA9IHRoaXMucGFyYW1EYXRhW3BhcmFdW2tleV07XHJcblx0Ly8gRGF0YSBtaWdodCBhY3R1YWxseSBiZSBhbiBvYmplY3Qgd2l0aCBrZXkgXCJlblwiXHJcblx0aWYgKCBkYXRhICYmIGRhdGEuZW4gJiYgIUFycmF5LmlzQXJyYXkoZGF0YSkgKSB7XHJcblx0XHRyZXR1cm4gZGF0YS5lbjtcclxuXHR9XHJcblx0cmV0dXJuIGRhdGE7XHJcbn07XHJcblxyXG5UZW1wbGF0ZS5wcm90b3R5cGUuc2V0UGFyYW1EYXRhQW5kU3VnZ2VzdGlvbnMgPSBmdW5jdGlvbigpIHtcclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblx0dmFyIHBhcmFtRGF0YVNldCA9ICQuRGVmZXJyZWQoKTtcclxuXHRcclxuXHRpZiAoIHNlbGYucGFyYW1EYXRhICkgeyByZXR1cm4gcGFyYW1EYXRhU2V0LnJlc29sdmUoKTsgfVxyXG4gICAgXHJcblx0dmFyIHByZWZpeGVkVGV4dCA9IHNlbGYucmVkaXJlY3RzVG9cclxuXHRcdD8gc2VsZi5yZWRpcmVjdHNUby5nZXRQcmVmaXhlZFRleHQoKVxyXG5cdFx0OiBzZWxmLmdldFRpdGxlKCkuZ2V0UHJlZml4ZWRUZXh0KCk7XHJcblxyXG5cdHZhciBjYWNoZWRJbmZvID0gY2FjaGUucmVhZChwcmVmaXhlZFRleHQgKyBcIi1wYXJhbXNcIik7XHJcblx0XHJcblx0aWYgKFxyXG5cdFx0Y2FjaGVkSW5mbyAmJlxyXG5cdFx0Y2FjaGVkSW5mby52YWx1ZSAmJlxyXG5cdFx0Y2FjaGVkSW5mby5zdGFsZURhdGUgJiZcclxuXHRcdGNhY2hlZEluZm8udmFsdWUucGFyYW1EYXRhICE9IG51bGwgJiZcclxuXHRcdGNhY2hlZEluZm8udmFsdWUucGFyYW1ldGVyU3VnZ2VzdGlvbnMgIT0gbnVsbCAmJlxyXG5cdFx0Y2FjaGVkSW5mby52YWx1ZS5wYXJhbUFsaWFzZXMgIT0gbnVsbFxyXG5cdCkge1xyXG5cdFx0c2VsZi5ub3RlbXBsYXRlZGF0YSA9IGNhY2hlZEluZm8udmFsdWUubm90ZW1wbGF0ZWRhdGE7XHJcblx0XHRzZWxmLnBhcmFtRGF0YSA9IGNhY2hlZEluZm8udmFsdWUucGFyYW1EYXRhO1xyXG5cdFx0c2VsZi5wYXJhbWV0ZXJTdWdnZXN0aW9ucyA9IGNhY2hlZEluZm8udmFsdWUucGFyYW1ldGVyU3VnZ2VzdGlvbnM7XHJcblx0XHRzZWxmLnBhcmFtQWxpYXNlcyA9IGNhY2hlZEluZm8udmFsdWUucGFyYW1BbGlhc2VzO1xyXG5cdFx0XHJcblx0XHRwYXJhbURhdGFTZXQucmVzb2x2ZSgpO1xyXG5cdFx0aWYgKCAhaXNBZnRlckRhdGUoY2FjaGVkSW5mby5zdGFsZURhdGUpICkge1xyXG5cdFx0XHQvLyBKdXN0IHVzZSB0aGUgY2FjaGVkIGRhdGFcclxuXHRcdFx0cmV0dXJuIHBhcmFtRGF0YVNldDtcclxuXHRcdH0gLy8gZWxzZTogVXNlIHRoZSBjYWNoZSBkYXRhIGZvciBub3csIGJ1dCBhbHNvIGZldGNoIG5ldyBkYXRhIGZyb20gQVBJXHJcblx0fVxyXG5cdFxyXG5cdEFQSS5nZXQoe1xyXG5cdFx0YWN0aW9uOiBcInRlbXBsYXRlZGF0YVwiLFxyXG5cdFx0dGl0bGVzOiBwcmVmaXhlZFRleHQsXHJcblx0XHRyZWRpcmVjdHM6IDEsXHJcblx0XHRpbmNsdWRlTWlzc2luZ1RpdGxlczogMVxyXG5cdH0pXHJcblx0XHQudGhlbihcclxuXHRcdFx0ZnVuY3Rpb24ocmVzcG9uc2UpIHsgcmV0dXJuIHJlc3BvbnNlOyB9LFxyXG5cdFx0XHRmdW5jdGlvbigvKmVycm9yKi8pIHsgcmV0dXJuIG51bGw7IH0gLy8gSWdub3JlIGVycm9ycywgd2lsbCB1c2UgZGVmYXVsdCBkYXRhXHJcblx0XHQpXHJcblx0XHQudGhlbiggZnVuY3Rpb24ocmVzdWx0KSB7XHJcblx0XHQvLyBGaWd1cmUgb3V0IHBhZ2UgaWQgKGJlYWN1c2UgYWN0aW9uPXRlbXBsYXRlZGF0YSBkb2Vzbid0IGhhdmUgYW4gaW5kZXhwYWdlaWRzIG9wdGlvbilcclxuXHRcdFx0dmFyIGlkID0gcmVzdWx0ICYmICQubWFwKHJlc3VsdC5wYWdlcywgZnVuY3Rpb24oIF92YWx1ZSwga2V5ICkgeyByZXR1cm4ga2V5OyB9KTtcclxuXHRcdFxyXG5cdFx0XHRpZiAoICFyZXN1bHQgfHwgIXJlc3VsdC5wYWdlc1tpZF0gfHwgcmVzdWx0LnBhZ2VzW2lkXS5ub3RlbXBsYXRlZGF0YSB8fCAhcmVzdWx0LnBhZ2VzW2lkXS5wYXJhbXMgKSB7XHJcblx0XHRcdC8vIE5vIFRlbXBsYXRlRGF0YSwgc28gdXNlIGRlZmF1bHRzIChndWVzc2VzKVxyXG5cdFx0XHRcdHNlbGYubm90ZW1wbGF0ZWRhdGEgPSB0cnVlO1xyXG5cdFx0XHRcdHNlbGYudGVtcGxhdGVkYXRhQXBpRXJyb3IgPSAhcmVzdWx0O1xyXG5cdFx0XHRcdHNlbGYucGFyYW1EYXRhID0gY29uZmlnLmRlZmF1bHRQYXJhbWV0ZXJEYXRhO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHNlbGYucGFyYW1EYXRhID0gcmVzdWx0LnBhZ2VzW2lkXS5wYXJhbXM7XHJcblx0XHRcdH1cclxuICAgICAgICBcclxuXHRcdFx0c2VsZi5wYXJhbUFsaWFzZXMgPSB7fTtcclxuXHRcdFx0JC5lYWNoKHNlbGYucGFyYW1EYXRhLCBmdW5jdGlvbihwYXJhTmFtZSwgcGFyYURhdGEpIHtcclxuXHRcdFx0XHQvLyBFeHRyYWN0IGFsaWFzZXMgZm9yIGVhc2llciByZWZlcmVuY2UgbGF0ZXIgb25cclxuXHRcdFx0XHRpZiAoIHBhcmFEYXRhLmFsaWFzZXMgJiYgcGFyYURhdGEuYWxpYXNlcy5sZW5ndGggKSB7XHJcblx0XHRcdFx0XHRwYXJhRGF0YS5hbGlhc2VzLmZvckVhY2goZnVuY3Rpb24oYWxpYXMpe1xyXG5cdFx0XHRcdFx0XHRzZWxmLnBhcmFtQWxpYXNlc1thbGlhc10gPSBwYXJhTmFtZTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHQvLyBFeHRyYWN0IGFsbG93ZWQgdmFsdWVzIGFycmF5IGZyb20gZGVzY3JpcHRpb25cclxuXHRcdFx0XHRpZiAoIHBhcmFEYXRhLmRlc2NyaXB0aW9uICYmIC9cXFsuKicuKz8nLio/XFxdLy50ZXN0KHBhcmFEYXRhLmRlc2NyaXB0aW9uLmVuKSApIHtcclxuXHRcdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHRcdHZhciBhbGxvd2VkVmFscyA9IEpTT04ucGFyc2UoXHJcblx0XHRcdFx0XHRcdFx0cGFyYURhdGEuZGVzY3JpcHRpb24uZW5cclxuXHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC9eLipcXFsvLFwiW1wiKVxyXG5cdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoL1wiL2csIFwiXFxcXFxcXCJcIilcclxuXHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC8nL2csIFwiXFxcIlwiKVxyXG5cdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoLyxcXHMqXS8sIFwiXVwiKVxyXG5cdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoL10uKiQvLCBcIl1cIilcclxuXHRcdFx0XHRcdFx0KTtcclxuXHRcdFx0XHRcdFx0c2VsZi5wYXJhbURhdGFbcGFyYU5hbWVdLmFsbG93ZWRWYWx1ZXMgPSBhbGxvd2VkVmFscztcclxuXHRcdFx0XHRcdH0gY2F0Y2goZSkge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oXCJbUmF0ZXJdIENvdWxkIG5vdCBwYXJzZSBhbGxvd2VkIHZhbHVlcyBpbiBkZXNjcmlwdGlvbjpcXG4gIFwiK1xyXG5cdFx0XHRcdFx0cGFyYURhdGEuZGVzY3JpcHRpb24uZW4gKyBcIlxcbiBDaGVjayBUZW1wbGF0ZURhdGEgZm9yIHBhcmFtZXRlciB8XCIgKyBwYXJhTmFtZSArXHJcblx0XHRcdFx0XHRcIj0gaW4gXCIgKyBzZWxmLmdldFRpdGxlKCkuZ2V0UHJlZml4ZWRUZXh0KCkpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHQvLyBNYWtlIHN1cmUgcmVxdWlyZWQvc3VnZ2VzdGVkIHBhcmFtZXRlcnMgYXJlIHByZXNlbnRcclxuXHRcdFx0XHRpZiAoIChwYXJhRGF0YS5yZXF1aXJlZCB8fCBwYXJhRGF0YS5zdWdnZXN0ZWQpICYmICFzZWxmLmdldFBhcmFtKHBhcmFOYW1lKSApIHtcclxuXHRcdFx0XHQvLyBDaGVjayBpZiBhbHJlYWR5IHByZXNlbnQgaW4gYW4gYWxpYXMsIGlmIGFueVxyXG5cdFx0XHRcdFx0aWYgKCBwYXJhRGF0YS5hbGlhc2VzLmxlbmd0aCApIHtcclxuXHRcdFx0XHRcdFx0dmFyIGFsaWFzZXMgPSBzZWxmLnBhcmFtZXRlcnMuZmlsdGVyKHAgPT4ge1xyXG5cdFx0XHRcdFx0XHRcdHZhciBpc0FsaWFzID0gcGFyYURhdGEuYWxpYXNlcy5pbmNsdWRlcyhwLm5hbWUpO1xyXG5cdFx0XHRcdFx0XHRcdHZhciBpc0VtcHR5ID0gIXAudmFsO1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybiBpc0FsaWFzICYmICFpc0VtcHR5O1xyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdFx0aWYgKCBhbGlhc2VzLmxlbmd0aCApIHtcclxuXHRcdFx0XHRcdFx0Ly8gQXQgbGVhc3Qgb25lIG5vbi1lbXB0eSBhbGlhcywgc28gZG8gbm90aGluZ1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Ly8gTm8gbm9uLWVtcHR5IGFsaWFzZXMsIHNvIHNldCBwYXJhbWV0ZXIgdG8gZWl0aGVyIHRoZSBhdXRvdmF1bGUsIG9yXHJcblx0XHRcdFx0XHQvLyBhbiBlbXB0eSBzdHJpbmcgKHdpdGhvdXQgdG91Y2hpbmcsIHVubGVzcyBpdCBpcyBhIHJlcXVpcmVkIHBhcmFtZXRlcilcclxuXHRcdFx0XHRcdHNlbGYucGFyYW1ldGVycy5wdXNoKHtcclxuXHRcdFx0XHRcdFx0bmFtZTpwYXJhTmFtZSxcclxuXHRcdFx0XHRcdFx0dmFsdWU6IHBhcmFEYXRhLmF1dG92YWx1ZSB8fCBcIlwiLFxyXG5cdFx0XHRcdFx0XHRhdXRvZmlsbGVkOiB0cnVlXHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0XHJcblx0XHRcdC8vIE1ha2Ugc3VnZ2VzdGlvbnMgZm9yIGNvbWJvYm94XHJcblx0XHRcdHZhciBhbGxQYXJhbXNBcnJheSA9ICggIXNlbGYubm90ZW1wbGF0ZWRhdGEgJiYgcmVzdWx0LnBhZ2VzW2lkXS5wYXJhbU9yZGVyICkgfHxcclxuXHRcdFx0JC5tYXAoc2VsZi5wYXJhbURhdGEsIGZ1bmN0aW9uKF92YWwsIGtleSl7XHJcblx0XHRcdFx0cmV0dXJuIGtleTtcclxuXHRcdFx0fSk7XHJcblx0XHRcdHNlbGYucGFyYW1ldGVyU3VnZ2VzdGlvbnMgPSBhbGxQYXJhbXNBcnJheS5maWx0ZXIoZnVuY3Rpb24ocGFyYW1OYW1lKSB7XHJcblx0XHRcdFx0cmV0dXJuICggcGFyYW1OYW1lICYmIHBhcmFtTmFtZSAhPT0gXCJjbGFzc1wiICYmIHBhcmFtTmFtZSAhPT0gXCJpbXBvcnRhbmNlXCIgKTtcclxuXHRcdFx0fSlcclxuXHRcdFx0XHQubWFwKGZ1bmN0aW9uKHBhcmFtTmFtZSkge1xyXG5cdFx0XHRcdFx0dmFyIG9wdGlvbk9iamVjdCA9IHtkYXRhOiBwYXJhbU5hbWV9O1xyXG5cdFx0XHRcdFx0dmFyIGxhYmVsID0gc2VsZi5nZXREYXRhRm9yUGFyYW0obGFiZWwsIHBhcmFtTmFtZSk7XHJcblx0XHRcdFx0XHRpZiAoIGxhYmVsICkge1xyXG5cdFx0XHRcdFx0XHRvcHRpb25PYmplY3QubGFiZWwgPSBsYWJlbCArIFwiICh8XCIgKyBwYXJhbU5hbWUgKyBcIj0pXCI7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRyZXR1cm4gb3B0aW9uT2JqZWN0O1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHJcblx0XHRcdGlmICggc2VsZi50ZW1wbGF0ZWRhdGFBcGlFcnJvciApIHtcclxuXHRcdFx0XHQvLyBEb24ndCBzYXZlIGRlZmF1bHRzL2d1ZXNzZXMgdG8gY2FjaGU7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH1cclxuXHRcdFxyXG5cdFx0XHRjYWNoZS53cml0ZShwcmVmaXhlZFRleHQgKyBcIi1wYXJhbXNcIiwge1xyXG5cdFx0XHRcdG5vdGVtcGxhdGVkYXRhOiBzZWxmLm5vdGVtcGxhdGVkYXRhLFxyXG5cdFx0XHRcdHBhcmFtRGF0YTogc2VsZi5wYXJhbURhdGEsXHJcblx0XHRcdFx0cGFyYW1ldGVyU3VnZ2VzdGlvbnM6IHNlbGYucGFyYW1ldGVyU3VnZ2VzdGlvbnMsXHJcblx0XHRcdFx0cGFyYW1BbGlhc2VzOiBzZWxmLnBhcmFtQWxpYXNlc1xyXG5cdFx0XHR9LFx0MVxyXG5cdFx0XHQpO1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH0pXHJcblx0XHQudGhlbihcclxuXHRcdFx0cGFyYW1EYXRhU2V0LnJlc29sdmUsXHJcblx0XHRcdHBhcmFtRGF0YVNldC5yZWplY3RcclxuXHRcdCk7XHJcblx0XHJcblx0cmV0dXJuIHBhcmFtRGF0YVNldDtcdFxyXG59O1xyXG5cclxuZXhwb3J0IHtUZW1wbGF0ZSwgcGFyc2VUZW1wbGF0ZXMsIGdldFdpdGhSZWRpcmVjdFRvfTsiLCJpbXBvcnQge21ha2VFcnJvck1zZ30gZnJvbSBcIi4uL3V0aWxcIjtcclxuXHJcbi8qIHZhciBpbmNyZW1lbnRQcm9ncmVzc0J5SW50ZXJ2YWwgPSBmdW5jdGlvbigpIHtcclxuXHR2YXIgaW5jcmVtZW50SW50ZXJ2YWxEZWxheSA9IDEwMDtcclxuXHR2YXIgaW5jcmVtZW50SW50ZXJ2YWxBbW91bnQgPSAwLjE7XHJcblx0dmFyIGluY3JlbWVudEludGVydmFsTWF4dmFsID0gOTg7XHJcblx0cmV0dXJuIHdpbmRvdy5zZXRJbnRlcnZhbChcclxuXHRcdGluY3JlbWVudFByb2dyZXNzLFxyXG5cdFx0aW5jcmVtZW50SW50ZXJ2YWxEZWxheSxcclxuXHRcdGluY3JlbWVudEludGVydmFsQW1vdW50LFxyXG5cdFx0aW5jcmVtZW50SW50ZXJ2YWxNYXh2YWxcclxuXHQpO1xyXG59OyAqL1xyXG5cclxudmFyIExvYWREaWFsb2cgPSBmdW5jdGlvbiBMb2FkRGlhbG9nKCBjb25maWcgKSB7XHJcblx0TG9hZERpYWxvZy5zdXBlci5jYWxsKCB0aGlzLCBjb25maWcgKTtcclxufTtcclxuT08uaW5oZXJpdENsYXNzKCBMb2FkRGlhbG9nLCBPTy51aS5EaWFsb2cgKTsgXHJcblxyXG5Mb2FkRGlhbG9nLnN0YXRpYy5uYW1lID0gXCJsb2FkRGlhbG9nXCI7XHJcbkxvYWREaWFsb2cuc3RhdGljLnRpdGxlID0gXCJMb2FkaW5nIFJhdGVyLi4uXCI7XHJcblxyXG4vLyBDdXN0b21pemUgdGhlIGluaXRpYWxpemUoKSBmdW5jdGlvbjogVGhpcyBpcyB3aGVyZSB0byBhZGQgY29udGVudCB0byB0aGUgZGlhbG9nIGJvZHkgYW5kIHNldCB1cCBldmVudCBoYW5kbGVycy5cclxuTG9hZERpYWxvZy5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uICgpIHtcclxuXHQvLyBDYWxsIHRoZSBwYXJlbnQgbWV0aG9kLlxyXG5cdExvYWREaWFsb2cuc3VwZXIucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCggdGhpcyApO1xyXG5cdC8vIENyZWF0ZSBhIGxheW91dFxyXG5cdHRoaXMuY29udGVudCA9IG5ldyBPTy51aS5QYW5lbExheW91dCggeyBcclxuXHRcdHBhZGRlZDogdHJ1ZSxcclxuXHRcdGV4cGFuZGVkOiBmYWxzZSBcclxuXHR9ICk7XHJcblx0Ly8gQ3JlYXRlIGNvbnRlbnRcclxuXHR0aGlzLnByb2dyZXNzQmFyID0gbmV3IE9PLnVpLlByb2dyZXNzQmFyV2lkZ2V0KCB7XHJcblx0XHRwcm9ncmVzczogMVxyXG5cdH0gKTtcclxuXHR0aGlzLnNldHVwdGFza3MgPSBbXHJcblx0XHRuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiTG9hZGluZyBsaXN0IG9mIHByb2plY3QgYmFubmVycy4uLlwiLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxwIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrXFxcIj5cIilcclxuXHRcdH0pLFxyXG5cdFx0bmV3IE9PLnVpLkxhYmVsV2lkZ2V0KCB7XHJcblx0XHRcdGxhYmVsOiBcIkxvYWRpbmcgdGFsa3BhZ2Ugd2lraXRleHQuLi5cIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8cCBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KSxcclxuXHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJQYXJzaW5nIHRhbGtwYWdlIHRlbXBsYXRlcy4uLlwiLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxwIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrXFxcIj5cIilcclxuXHRcdH0pLFxyXG5cdFx0bmV3IE9PLnVpLkxhYmVsV2lkZ2V0KCB7XHJcblx0XHRcdGxhYmVsOiBcIkdldHRpbmcgdGVtcGxhdGVzJyBwYXJhbWV0ZXIgZGF0YS4uLlwiLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxwIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrXFxcIj5cIilcclxuXHRcdH0pLFxyXG5cdFx0bmV3IE9PLnVpLkxhYmVsV2lkZ2V0KCB7XHJcblx0XHRcdGxhYmVsOiBcIkNoZWNraW5nIGlmIHBhZ2UgcmVkaXJlY3RzLi4uXCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHAgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSksXHJcblx0XHRuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiUmV0cmlldmluZyBxdWFsaXR5IHByZWRpY3Rpb24uLi5cIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8cCBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KS50b2dnbGUoKSxcclxuXHRdO1xyXG5cdHRoaXMuY2xvc2VCdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KCB7XHJcblx0XHRsYWJlbDogXCJDbG9zZVwiXHJcblx0fSkudG9nZ2xlKCk7XHJcblx0dGhpcy5zZXR1cFByb21pc2VzID0gW107XHJcblxyXG5cdC8vIEFwcGVuZCBjb250ZW50IHRvIGxheW91dFxyXG5cdHRoaXMuY29udGVudC4kZWxlbWVudC5hcHBlbmQoXHJcblx0XHR0aGlzLnByb2dyZXNzQmFyLiRlbGVtZW50LFxyXG5cdFx0KG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJJbml0aWFsaXNpbmc6XCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHN0cm9uZyBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KSkuJGVsZW1lbnQsXHJcblx0XHQuLi50aGlzLnNldHVwdGFza3MubWFwKHdpZGdldCA9PiB3aWRnZXQuJGVsZW1lbnQpLFxyXG5cdFx0dGhpcy5jbG9zZUJ1dHRvbi4kZWxlbWVudFxyXG5cdCk7XHJcblxyXG5cdC8vIEFwcGVuZCBsYXlvdXQgdG8gZGlhbG9nXHJcblx0dGhpcy4kYm9keS5hcHBlbmQoIHRoaXMuY29udGVudC4kZWxlbWVudCApO1xyXG5cclxuXHQvLyBDb25uZWN0IGV2ZW50cyB0byBoYW5kbGVyc1xyXG5cdHRoaXMuY2xvc2VCdXR0b24uY29ubmVjdCggdGhpcywgeyBcImNsaWNrXCI6IFwib25DbG9zZUJ1dHRvbkNsaWNrXCIgfSApO1xyXG59O1xyXG5cclxuTG9hZERpYWxvZy5wcm90b3R5cGUub25DbG9zZUJ1dHRvbkNsaWNrID0gZnVuY3Rpb24oKSB7XHJcblx0Ly8gQ2xvc2UgdGhpcyBkaWFsb2csIHdpdGhvdXQgcGFzc2luZyBhbnkgZGF0YVxyXG5cdHRoaXMuY2xvc2UoKTtcclxufTtcclxuXHJcbi8vIE92ZXJyaWRlIHRoZSBnZXRCb2R5SGVpZ2h0KCkgbWV0aG9kIHRvIHNwZWNpZnkgYSBjdXN0b20gaGVpZ2h0IChvciBkb24ndCB0byB1c2UgdGhlIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVkIGhlaWdodCkuXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmdldEJvZHlIZWlnaHQgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHRoaXMuY29udGVudC4kZWxlbWVudC5vdXRlckhlaWdodCggdHJ1ZSApO1xyXG59O1xyXG5cclxuTG9hZERpYWxvZy5wcm90b3R5cGUuaW5jcmVtZW50UHJvZ3Jlc3MgPSBmdW5jdGlvbihhbW91bnQsIG1heGltdW0pIHtcclxuXHR2YXIgcHJpb3JQcm9ncmVzcyA9IHRoaXMucHJvZ3Jlc3NCYXIuZ2V0UHJvZ3Jlc3MoKTtcclxuXHR2YXIgaW5jcmVtZW50ZWRQcm9ncmVzcyA9IE1hdGgubWluKG1heGltdW0gfHwgMTAwLCBwcmlvclByb2dyZXNzICsgYW1vdW50KTtcclxuXHR0aGlzLnByb2dyZXNzQmFyLnNldFByb2dyZXNzKGluY3JlbWVudGVkUHJvZ3Jlc3MpO1xyXG59O1xyXG5cclxuTG9hZERpYWxvZy5wcm90b3R5cGUuYWRkVGFza1Byb21pc2VIYW5kbGVycyA9IGZ1bmN0aW9uKHRhc2tQcm9taXNlcykge1xyXG5cdHZhciBvblRhc2tEb25lID0gaW5kZXggPT4ge1xyXG5cdFx0Ly8gQWRkIFwiRG9uZSFcIiB0byBsYWJlbFxyXG5cdFx0dmFyIHdpZGdldCA9IHRoaXMuc2V0dXB0YXNrc1tpbmRleF07XHJcblx0XHR3aWRnZXQuc2V0TGFiZWwod2lkZ2V0LmdldExhYmVsKCkgKyBcIiBEb25lIVwiKTtcclxuXHRcdC8vIEluY3JlbWVudCBzdGF0dXMgYmFyLiBTaG93IGEgc21vb3RoIHRyYW5zaXRpb24gYnlcclxuXHRcdC8vIHVzaW5nIHNtYWxsIHN0ZXBzIG92ZXIgYSBzaG9ydCBkdXJhdGlvbi5cclxuXHRcdHZhciB0b3RhbEluY3JlbWVudCA9IDIwOyAvLyBwZXJjZW50XHJcblx0XHR2YXIgdG90YWxUaW1lID0gNDAwOyAvLyBtaWxsaXNlY29uZHNcclxuXHRcdHZhciB0b3RhbFN0ZXBzID0gMTA7XHJcblx0XHR2YXIgaW5jcmVtZW50UGVyU3RlcCA9IHRvdGFsSW5jcmVtZW50IC8gdG90YWxTdGVwcztcclxuXHJcblx0XHRmb3IgKCB2YXIgc3RlcD0wOyBzdGVwIDwgdG90YWxTdGVwczsgc3RlcCsrKSB7XHJcblx0XHRcdHdpbmRvdy5zZXRUaW1lb3V0KFxyXG5cdFx0XHRcdHRoaXMuaW5jcmVtZW50UHJvZ3Jlc3MuYmluZCh0aGlzKSxcclxuXHRcdFx0XHR0b3RhbFRpbWUgKiBzdGVwIC8gdG90YWxTdGVwcyxcclxuXHRcdFx0XHRpbmNyZW1lbnRQZXJTdGVwXHJcblx0XHRcdCk7XHJcblx0XHR9XHJcblx0fTtcclxuXHR2YXIgb25UYXNrRXJyb3IgPSAoaW5kZXgsIGNvZGUsIGluZm8pID0+IHtcclxuXHRcdHZhciB3aWRnZXQgPSB0aGlzLnNldHVwdGFza3NbaW5kZXhdO1xyXG5cdFx0d2lkZ2V0LnNldExhYmVsKFxyXG5cdFx0XHR3aWRnZXQuZ2V0TGFiZWwoKSArIFwiIEZhaWxlZC4gXCIgKyBtYWtlRXJyb3JNc2coY29kZSwgaW5mbylcclxuXHRcdCk7XHJcblx0XHR0aGlzLmNsb3NlQnV0dG9uLnRvZ2dsZSh0cnVlKTtcclxuXHRcdHRoaXMudXBkYXRlU2l6ZSgpO1xyXG5cdH07XHJcblx0dGFza1Byb21pc2VzLmZvckVhY2goZnVuY3Rpb24ocHJvbWlzZSwgaW5kZXgpIHtcclxuXHRcdHByb21pc2UudGhlbihcclxuXHRcdFx0KCkgPT4gb25UYXNrRG9uZShpbmRleCksXHJcblx0XHRcdChjb2RlLCBpbmZvKSA9PiBvblRhc2tFcnJvcihpbmRleCwgY29kZSwgaW5mbylcclxuXHRcdCk7XHJcblx0fSk7XHJcbn07XHJcblxyXG4vLyBVc2UgZ2V0U2V0dXBQcm9jZXNzKCkgdG8gc2V0IHVwIHRoZSB3aW5kb3cgd2l0aCBkYXRhIHBhc3NlZCB0byBpdCBhdCB0aGUgdGltZSBcclxuLy8gb2Ygb3BlbmluZ1xyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5nZXRTZXR1cFByb2Nlc3MgPSBmdW5jdGlvbiAoIGRhdGEgKSB7XHJcblx0ZGF0YSA9IGRhdGEgfHwge307XHJcblx0cmV0dXJuIExvYWREaWFsb2cuc3VwZXIucHJvdG90eXBlLmdldFNldHVwUHJvY2Vzcy5jYWxsKCB0aGlzLCBkYXRhIClcclxuXHRcdC5uZXh0KCAoKSA9PiB7XHJcblx0XHRcdHZhciBzaG93T3Jlc1Rhc2sgPSAhIWRhdGEub3JlcztcclxuXHRcdFx0dGhpcy5zZXR1cHRhc2tzWzVdLnRvZ2dsZShzaG93T3Jlc1Rhc2spO1xyXG5cdFx0XHR2YXIgdGFza1Byb21pc2VzID0gZGF0YS5vcmVzID8gZGF0YS5wcm9taXNlcyA6IGRhdGEucHJvbWlzZXMuc2xpY2UoMCwgLTEpO1xyXG5cdFx0XHRkYXRhLmlzT3BlbmVkLnRoZW4oKCkgPT4gdGhpcy5hZGRUYXNrUHJvbWlzZUhhbmRsZXJzKHRhc2tQcm9taXNlcykpO1xyXG5cdFx0fSwgdGhpcyApO1xyXG59O1xyXG5cclxuLy8gUHJldmVudCB3aW5kb3cgZnJvbSBjbG9zaW5nIHRvbyBxdWlja2x5LCB1c2luZyBnZXRIb2xkUHJvY2VzcygpXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmdldEhvbGRQcm9jZXNzID0gZnVuY3Rpb24gKCBkYXRhICkge1xyXG5cdGRhdGEgPSBkYXRhIHx8IHt9O1xyXG5cdGlmIChkYXRhLnN1Y2Nlc3MpIHtcclxuXHRcdC8vIFdhaXQgYSBiaXQgYmVmb3JlIHByb2Nlc3NpbmcgdGhlIGNsb3NlLCB3aGljaCBoYXBwZW5zIGF1dG9tYXRpY2FsbHlcclxuXHRcdHJldHVybiBMb2FkRGlhbG9nLnN1cGVyLnByb3RvdHlwZS5nZXRIb2xkUHJvY2Vzcy5jYWxsKCB0aGlzLCBkYXRhIClcclxuXHRcdFx0Lm5leHQoODAwKTtcclxuXHR9XHJcblx0Ly8gTm8gbmVlZCB0byB3YWl0IGlmIGNsb3NlZCBtYW51YWxseVxyXG5cdHJldHVybiBMb2FkRGlhbG9nLnN1cGVyLnByb3RvdHlwZS5nZXRIb2xkUHJvY2Vzcy5jYWxsKCB0aGlzLCBkYXRhICk7XHJcbn07XHJcblxyXG4vLyBVc2UgdGhlIGdldFRlYXJkb3duUHJvY2VzcygpIG1ldGhvZCB0byBwZXJmb3JtIGFjdGlvbnMgd2hlbmV2ZXIgdGhlIGRpYWxvZyBpcyBjbG9zZWQuIFxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5nZXRUZWFyZG93blByb2Nlc3MgPSBmdW5jdGlvbiAoIGRhdGEgKSB7XHJcblx0cmV0dXJuIExvYWREaWFsb2cuc3VwZXIucHJvdG90eXBlLmdldFRlYXJkb3duUHJvY2Vzcy5jYWxsKCB0aGlzLCBkYXRhIClcclxuXHRcdC5maXJzdCggKCkgPT4ge1xyXG5cdFx0Ly8gUGVyZm9ybSBjbGVhbnVwOiByZXNldCBsYWJlbHNcclxuXHRcdFx0dGhpcy5zZXR1cHRhc2tzLmZvckVhY2goIHNldHVwdGFzayA9PiB7XHJcblx0XHRcdFx0dmFyIGN1cnJlbnRMYWJlbCA9IHNldHVwdGFzay5nZXRMYWJlbCgpO1xyXG5cdFx0XHRcdHNldHVwdGFzay5zZXRMYWJlbChcclxuXHRcdFx0XHRcdGN1cnJlbnRMYWJlbC5zbGljZSgwLCBjdXJyZW50TGFiZWwuaW5kZXhPZihcIi4uLlwiKSszKVxyXG5cdFx0XHRcdCk7XHJcblx0XHRcdH0gKTtcclxuXHRcdH0sIHRoaXMgKTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IExvYWREaWFsb2c7IiwiZnVuY3Rpb24gTWFpbldpbmRvdyggY29uZmlnICkge1xyXG5cdE1haW5XaW5kb3cuc3VwZXIuY2FsbCggdGhpcywgY29uZmlnICk7XHJcbn1cclxuT08uaW5oZXJpdENsYXNzKCBNYWluV2luZG93LCBPTy51aS5Qcm9jZXNzRGlhbG9nICk7XHJcblxyXG5NYWluV2luZG93LnN0YXRpYy5uYW1lID0gXCJtYWluXCI7XHJcbk1haW5XaW5kb3cuc3RhdGljLnRpdGxlID0gXCJSYXRlclwiO1xyXG5NYWluV2luZG93LnN0YXRpYy5zaXplID0gXCJsYXJnZVwiO1xyXG5NYWluV2luZG93LnN0YXRpYy5hY3Rpb25zID0gW1xyXG5cdC8vIFByaW1hcnkgKHRvcCByaWdodCk6XHJcblx0e1xyXG5cdFx0bGFiZWw6IFwiWFwiLCAvLyBub3QgdXNpbmcgYW4gaWNvbiBzaW5jZSBjb2xvciBiZWNvbWVzIGludmVydGVkLCBpLmUuIHdoaXRlIG9uIGxpZ2h0LWdyZXlcclxuXHRcdHRpdGxlOiBcIkNsb3NlIChhbmQgZGlzY2FyZCBhbnkgY2hhbmdlcylcIixcclxuXHRcdGZsYWdzOiBcInByaW1hcnlcIixcclxuXHR9LFxyXG5cdC8vIFNhZmUgKHRvcCBsZWZ0KVxyXG5cdHtcclxuXHRcdGFjdGlvbjogXCJoZWxwXCIsXHJcblx0XHRmbGFnczogXCJzYWZlXCIsXHJcblx0XHRsYWJlbDogXCI/XCIsIC8vIG5vdCB1c2luZyBpY29uLCB0byBtaXJyb3IgQ2xvc2UgYWN0aW9uXHJcblx0XHR0aXRsZTogXCJoZWxwXCJcclxuXHR9LFxyXG5cdC8vIE90aGVycyAoYm90dG9tKVxyXG5cdHtcclxuXHRcdGFjdGlvbjogXCJzYXZlXCIsXHJcblx0XHRsYWJlbDogbmV3IE9PLnVpLkh0bWxTbmlwcGV0KFwiPHNwYW4gc3R5bGU9J3BhZGRpbmc6MCAxZW07Jz5TYXZlPC9zcGFuPlwiKSxcclxuXHRcdGZsYWdzOiBbXCJwcmltYXJ5XCIsIFwicHJvZ3Jlc3NpdmVcIl1cclxuXHR9LFxyXG5cdHtcclxuXHRcdGFjdGlvbjogXCJwcmV2aWV3XCIsXHJcblx0XHRsYWJlbDogXCJTaG93IHByZXZpZXdcIlxyXG5cdH0sXHJcblx0e1xyXG5cdFx0YWN0aW9uOiBcImNoYW5nZXNcIixcclxuXHRcdGxhYmVsOiBcIlNob3cgY2hhbmdlc1wiXHJcblx0fSxcclxuXHR7XHJcblx0XHRhY3Rpb246IFwiY2FuY2VsXCIsXHJcblx0XHRsYWJlbDogXCJDYW5jZWxcIlxyXG5cdH1cclxuXTtcclxuXHJcbi8vIEN1c3RvbWl6ZSB0aGUgaW5pdGlhbGl6ZSgpIGZ1bmN0aW9uOiBUaGlzIGlzIHdoZXJlIHRvIGFkZCBjb250ZW50IHRvIHRoZSBkaWFsb2cgYm9keSBhbmQgc2V0IHVwIGV2ZW50IGhhbmRsZXJzLlxyXG5NYWluV2luZG93LnByb3RvdHlwZS5pbml0aWFsaXplID0gZnVuY3Rpb24gKCkge1xyXG5cdC8vIENhbGwgdGhlIHBhcmVudCBtZXRob2QuXHJcblx0TWFpbldpbmRvdy5zdXBlci5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKCB0aGlzICk7XHJcblx0Ly8gQ3JlYXRlIGxheW91dHNcclxuXHR0aGlzLnRvcEJhciA9IG5ldyBPTy51aS5QYW5lbExheW91dCgge1xyXG5cdFx0ZXhwYW5kZWQ6IGZhbHNlLFxyXG5cdFx0ZnJhbWVkOiBmYWxzZSxcclxuXHRcdHBhZGRlZDogZmFsc2VcclxuXHR9ICk7XHJcblx0dGhpcy5jb250ZW50ID0gbmV3IE9PLnVpLlBhbmVsTGF5b3V0KCB7XHJcblx0XHRleHBhbmRlZDogdHJ1ZSxcclxuXHRcdHBhZGRlZDogdHJ1ZSxcclxuXHRcdHNjcm9sbGFibGU6IHRydWVcclxuXHR9ICk7XHJcblx0dGhpcy5vdXRlckxheW91dCA9IG5ldyBPTy51aS5TdGFja0xheW91dCgge1xyXG5cdFx0aXRlbXM6IFtcclxuXHRcdFx0dGhpcy50b3BCYXIsXHJcblx0XHRcdHRoaXMuY29udGVudFxyXG5cdFx0XSxcclxuXHRcdGNvbnRpbnVvdXM6IHRydWUsXHJcblx0XHRleHBhbmRlZDogdHJ1ZVxyXG5cdH0gKTtcclxuXHQvLyBDcmVhdGUgdG9wQmFyIGNvbnRlbnRcclxuXHR0aGlzLnNlYXJjaEJveCA9IG5ldyBPTy51aS5Db21ib0JveElucHV0V2lkZ2V0KCB7XHJcblx0XHRwbGFjZWhvbGRlcjogXCJBZGQgYSBXaWtpUHJvamVjdC4uLlwiLFxyXG5cdFx0b3B0aW9uczogW1xyXG5cdFx0XHR7IC8vIEZJWE1FOiBUaGVzZSBhcmUgcGxhY2Vob2xkZXJzLlxyXG5cdFx0XHRcdGRhdGE6IFwiT3B0aW9uIDFcIixcclxuXHRcdFx0XHRsYWJlbDogXCJPcHRpb24gT25lXCJcclxuXHRcdFx0fSxcclxuXHRcdFx0e1xyXG5cdFx0XHRcdGRhdGE6IFwiT3B0aW9uIDJcIixcclxuXHRcdFx0XHRsYWJlbDogXCJPcHRpb24gVHdvXCJcclxuXHRcdFx0fSxcclxuXHRcdFx0e1xyXG5cdFx0XHRcdGRhdGE6IFwiT3B0aW9uIDNcIixcclxuXHRcdFx0XHRsYWJlbDogXCJPcHRpb24gVGhyZWVcIlxyXG5cdFx0XHR9XHJcblx0XHRdLFxyXG5cdFx0JGVsZW1lbnQ6ICQoXCI8ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZS1ibG9jazt3aWR0aDoxMDAlO21heC13aWR0aDo0MjVweDsnPlwiKSxcclxuXHRcdCRvdmVybGF5OiB0aGlzLiRvdmVybGF5LFxyXG5cdH0gKTtcclxuXHJcblx0dGhpcy5zZXRBbGxEcm9wRG93biA9IG5ldyBPTy51aS5Ecm9wZG93bldpZGdldCgge1xyXG5cdFx0bGFiZWw6IG5ldyBPTy51aS5IdG1sU25pcHBldChcIjxzcGFuIHN0eWxlPVxcXCJjb2xvcjojNzc3XFxcIj5TZXQgYWxsLi4uPC9zcGFuPlwiKSxcclxuXHRcdG1lbnU6IHsgLy8gRklYTUU6IG5lZWRzIHJlYWwgZGF0YVxyXG5cdFx0XHRpdGVtczogW1xyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51U2VjdGlvbk9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0bGFiZWw6IFwiQ2xhc3Nlc1wiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcIkJcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIkJcIlxyXG5cdFx0XHRcdH0gKSxcclxuXHRcdFx0XHRuZXcgT08udWkuTWVudU9wdGlvbldpZGdldCgge1xyXG5cdFx0XHRcdFx0ZGF0YTogXCJDXCIsXHJcblx0XHRcdFx0XHRsYWJlbDogXCJDXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwic3RhcnRcIixcclxuXHRcdFx0XHRcdGxhYmVsOiBcIlN0YXJ0XCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVTZWN0aW9uT3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRsYWJlbDogXCJJbXBvcnRhbmNlc1wiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcInRvcFwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiVG9wXCJcclxuXHRcdFx0XHR9ICksXHJcblx0XHRcdFx0bmV3IE9PLnVpLk1lbnVPcHRpb25XaWRnZXQoIHtcclxuXHRcdFx0XHRcdGRhdGE6IFwiaGlnaFwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiSGlnaFwiXHJcblx0XHRcdFx0fSApLFxyXG5cdFx0XHRcdG5ldyBPTy51aS5NZW51T3B0aW9uV2lkZ2V0KCB7XHJcblx0XHRcdFx0XHRkYXRhOiBcIm1pZFwiLFxyXG5cdFx0XHRcdFx0bGFiZWw6IFwiTWlkXCJcclxuXHRcdFx0XHR9IClcclxuXHRcdFx0XVxyXG5cdFx0fSxcclxuXHRcdCRlbGVtZW50OiAkKFwiPHNwYW4gc3R5bGU9XFxcImRpc3BsYXk6aW5saW5lLWJsb2NrO3dpZHRoOmF1dG9cXFwiPlwiKSxcclxuXHRcdCRvdmVybGF5OiB0aGlzLiRvdmVybGF5LFxyXG5cdH0gKTtcclxuXHJcblx0dGhpcy5yZW1vdmVBbGxCdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KCB7XHJcblx0XHRpY29uOiBcInRyYXNoXCIsXHJcblx0XHR0aXRsZTogXCJSZW1vdmUgYWxsXCIsXHJcblx0XHRmbGFnczogXCJkZXN0cnVjdGl2ZVwiXHJcblx0fSApO1xyXG5cdHRoaXMuY2xlYXJBbGxCdXR0b24gPSBuZXcgT08udWkuQnV0dG9uV2lkZ2V0KCB7XHJcblx0XHRpY29uOiBcImNhbmNlbFwiLFxyXG5cdFx0dGl0bGU6IFwiQ2xlYXIgYWxsXCIsXHJcblx0XHRmbGFnczogXCJkZXN0cnVjdGl2ZVwiXHJcblx0fSApO1xyXG5cdHRoaXMuYnlwYXNzQWxsQnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCgge1xyXG5cdFx0aWNvbjogXCJhcnRpY2xlUmVkaXJlY3RcIixcclxuXHRcdHRpdGxlOiBcIkJ5cGFzcyBhbGwgcmVkaXJlY3RzXCJcclxuXHR9ICk7XHJcblx0dGhpcy5kb0FsbEJ1dHRvbnMgPSBuZXcgT08udWkuQnV0dG9uR3JvdXBXaWRnZXQoIHtcclxuXHRcdGl0ZW1zOiBbXHJcblx0XHRcdHRoaXMucmVtb3ZlQWxsQnV0dG9uLFxyXG5cdFx0XHR0aGlzLmNsZWFyQWxsQnV0dG9uLFxyXG5cdFx0XHR0aGlzLmJ5cGFzc0FsbEJ1dHRvblxyXG5cdFx0XSxcclxuXHRcdCRlbGVtZW50OiAkKFwiPHNwYW4gc3R5bGU9J2Zsb2F0OnJpZ2h0Oyc+XCIpLFxyXG5cdH0gKTtcclxuXHJcblx0dGhpcy50b3BCYXIuJGVsZW1lbnQuYXBwZW5kKFxyXG5cdFx0dGhpcy5zZWFyY2hCb3guJGVsZW1lbnQsXHJcblx0XHR0aGlzLnNldEFsbERyb3BEb3duLiRlbGVtZW50LFxyXG5cdFx0dGhpcy5kb0FsbEJ1dHRvbnMuJGVsZW1lbnRcclxuXHQpO1xyXG5cclxuXHQvLyBGSVhNRTogdGhpcyBpcyBwbGFjZWhvbGRlciBjb250ZW50XHJcblx0dGhpcy5jb250ZW50LiRlbGVtZW50LmFwcGVuZCggXCI8c3Bhbj4oTm8gcHJvamVjdCBiYW5uZXJzIHlldCk8L3NwYW4+XCIgKTtcclxuXHJcblx0dGhpcy4kYm9keS5hcHBlbmQoIHRoaXMub3V0ZXJMYXlvdXQuJGVsZW1lbnQgKTtcclxufTtcclxuXHJcbi8vIE92ZXJyaWRlIHRoZSBnZXRCb2R5SGVpZ2h0KCkgbWV0aG9kIHRvIHNwZWNpZnkgYSBjdXN0b20gaGVpZ2h0XHJcbk1haW5XaW5kb3cucHJvdG90eXBlLmdldEJvZHlIZWlnaHQgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHRoaXMudG9wQmFyLiRlbGVtZW50Lm91dGVySGVpZ2h0KCB0cnVlICkgKyB0aGlzLmNvbnRlbnQuJGVsZW1lbnQub3V0ZXJIZWlnaHQoIHRydWUgKTtcclxufTtcclxuXHJcbi8vIFVzZSBnZXRTZXR1cFByb2Nlc3MoKSB0byBzZXQgdXAgdGhlIHdpbmRvdyB3aXRoIGRhdGEgcGFzc2VkIHRvIGl0IGF0IHRoZSB0aW1lIFxyXG4vLyBvZiBvcGVuaW5nXHJcbk1haW5XaW5kb3cucHJvdG90eXBlLmdldFNldHVwUHJvY2VzcyA9IGZ1bmN0aW9uICggZGF0YSApIHtcclxuXHRkYXRhID0gZGF0YSB8fCB7fTtcclxuXHRyZXR1cm4gTWFpbldpbmRvdy5zdXBlci5wcm90b3R5cGUuZ2V0U2V0dXBQcm9jZXNzLmNhbGwoIHRoaXMsIGRhdGEgKVxyXG5cdFx0Lm5leHQoICgpID0+IHtcclxuXHRcdFx0Ly8gVE9ETzogU2V0IHVwIHdpbmRvdyBiYXNlZCBvbiBkYXRhXHJcblxyXG5cdFx0XHR0aGlzLnVwZGF0ZVNpemUoKTtcclxuXHRcdH0sIHRoaXMgKTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IE1haW5XaW5kb3c7IiwiaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuaW1wb3J0IHtBUEksIG1ha2VFcnJvck1zZ30gZnJvbSBcIi4vdXRpbFwiO1xyXG5pbXBvcnQgc2V0dXBSYXRlciBmcm9tIFwiLi9zZXR1cFwiO1xyXG5cclxudmFyIGF1dG9TdGFydCA9IGZ1bmN0aW9uIGF1dG9TdGFydCgpIHtcclxuXHRpZiAoIHdpbmRvdy5yYXRlcl9hdXRvc3RhcnROYW1lc3BhY2VzID09IG51bGwgfHwgY29uZmlnLm13LndnSXNNYWluUGFnZSApIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0fVxyXG5cdFxyXG5cdHZhciBhdXRvc3RhcnROYW1lc3BhY2VzID0gKCAkLmlzQXJyYXkod2luZG93LnJhdGVyX2F1dG9zdGFydE5hbWVzcGFjZXMpICkgPyB3aW5kb3cucmF0ZXJfYXV0b3N0YXJ0TmFtZXNwYWNlcyA6IFt3aW5kb3cucmF0ZXJfYXV0b3N0YXJ0TmFtZXNwYWNlc107XHJcblx0XHJcblx0aWYgKCAtMSA9PT0gYXV0b3N0YXJ0TmFtZXNwYWNlcy5pbmRleE9mKGNvbmZpZy5tdy53Z05hbWVzcGFjZU51bWJlcikgKSB7XHJcblx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgpO1xyXG5cdH1cclxuXHRcclxuXHRpZiAoIC8oPzpcXD98JikoPzphY3Rpb258ZGlmZnxvbGRpZCk9Ly50ZXN0KHdpbmRvdy5sb2NhdGlvbi5ocmVmKSApIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0fVxyXG5cdFxyXG5cdC8vIENoZWNrIGlmIHRhbGsgcGFnZSBleGlzdHNcclxuXHRpZiAoICQoXCIjY2EtdGFsay5uZXdcIikubGVuZ3RoICkge1xyXG5cdFx0cmV0dXJuIHNldHVwUmF0ZXIoKTtcclxuXHR9XHJcblx0XHJcblx0dmFyIHRoaXNQYWdlID0gbXcuVGl0bGUubmV3RnJvbVRleHQoY29uZmlnLm13LndnUGFnZU5hbWUpO1xyXG5cdHZhciB0YWxrUGFnZSA9IHRoaXNQYWdlICYmIHRoaXNQYWdlLmdldFRhbGtQYWdlKCk7XHJcblx0aWYgKCF0YWxrUGFnZSkge1xyXG5cdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHR9XHJcblxyXG5cdC8qIENoZWNrIHRlbXBsYXRlcyBwcmVzZW50IG9uIHRhbGsgcGFnZS4gRmV0Y2hlcyBpbmRpcmVjdGx5IHRyYW5zY2x1ZGVkIHRlbXBsYXRlcywgc28gd2lsbCBmaW5kXHJcblx0XHRUZW1wbGF0ZTpXUEJhbm5lck1ldGEgKGFuZCBpdHMgc3VidGVtcGxhdGVzKS4gQnV0IHNvbWUgYmFubmVycyBzdWNoIGFzIE1JTEhJU1QgZG9uJ3QgdXNlIHRoYXRcclxuXHRcdG1ldGEgdGVtcGxhdGUsIHNvIHdlIGFsc28gaGF2ZSB0byBjaGVjayBmb3IgdGVtcGxhdGUgdGl0bGVzIGNvbnRhaW5nICdXaWtpUHJvamVjdCdcclxuXHQqL1xyXG5cdHJldHVybiBBUEkuZ2V0KHtcclxuXHRcdGFjdGlvbjogXCJxdWVyeVwiLFxyXG5cdFx0Zm9ybWF0OiBcImpzb25cIixcclxuXHRcdHByb3A6IFwidGVtcGxhdGVzXCIsXHJcblx0XHR0aXRsZXM6IHRhbGtQYWdlLmdldFByZWZpeGVkVGV4dCgpLFxyXG5cdFx0dGxuYW1lc3BhY2U6IFwiMTBcIixcclxuXHRcdHRsbGltaXQ6IFwiNTAwXCIsXHJcblx0XHRpbmRleHBhZ2VpZHM6IDFcclxuXHR9KVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XHJcblx0XHRcdHZhciBpZCA9IHJlc3VsdC5xdWVyeS5wYWdlaWRzO1xyXG5cdFx0XHR2YXIgdGVtcGxhdGVzID0gcmVzdWx0LnF1ZXJ5LnBhZ2VzW2lkXS50ZW1wbGF0ZXM7XHJcblx0XHRcclxuXHRcdFx0aWYgKCAhdGVtcGxhdGVzICkge1xyXG5cdFx0XHRcdHJldHVybiBzZXR1cFJhdGVyKCk7XHJcblx0XHRcdH1cclxuXHRcdFxyXG5cdFx0XHR2YXIgaGFzV2lraXByb2plY3QgPSB0ZW1wbGF0ZXMuc29tZSh0ZW1wbGF0ZSA9PiAvKFdpa2lQcm9qZWN0fFdQQmFubmVyKS8udGVzdCh0ZW1wbGF0ZS50aXRsZSkpO1xyXG5cdFx0XHJcblx0XHRcdGlmICggIWhhc1dpa2lwcm9qZWN0ICkge1xyXG5cdFx0XHRcdHJldHVybiBzZXR1cFJhdGVyKCk7XHJcblx0XHRcdH1cclxuXHRcdFxyXG5cdFx0fSxcclxuXHRcdGZ1bmN0aW9uKGNvZGUsIGpxeGhyKSB7XHJcblx0XHQvLyBTaWxlbnRseSBpZ25vcmUgZmFpbHVyZXMgKGp1c3QgbG9nIHRvIGNvbnNvbGUpXHJcblx0XHRcdGNvbnNvbGUud2FybihcclxuXHRcdFx0XHRcIltSYXRlcl0gRXJyb3Igd2hpbGUgY2hlY2tpbmcgd2hldGhlciB0byBhdXRvc3RhcnQuXCIgK1xyXG5cdFx0XHQoIGNvZGUgPT0gbnVsbCApID8gXCJcIiA6IFwiIFwiICsgbWFrZUVycm9yTXNnKGNvZGUsIGpxeGhyKVxyXG5cdFx0XHQpO1xyXG5cdFx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgpO1xyXG5cdFx0fSk7XHJcblxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXV0b1N0YXJ0OyIsImltcG9ydCB7aXNBZnRlckRhdGV9IGZyb20gXCIuL3V0aWxcIjtcclxuXHJcbi8qKiB3cml0ZVxyXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XHJcbiAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fSB2YWxcclxuICogQHBhcmFtIHtOdW1iZXJ9IHN0YWxlRGF5cyBOdW1iZXIgb2YgZGF5cyBhZnRlciB3aGljaCB0aGUgZGF0YSBiZWNvbWVzIHN0YWxlICh1c2FibGUsIGJ1dCBzaG91bGRcclxuICogIGJlIHVwZGF0ZWQgZm9yIG5leHQgdGltZSkuXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBleHBpcnlEYXlzIE51bWJlciBvZiBkYXlzIGFmdGVyIHdoaWNoIHRoZSBjYWNoZWQgZGF0YSBtYXkgYmUgZGVsZXRlZC5cclxuICovXHJcbnZhciB3cml0ZSA9IGZ1bmN0aW9uKGtleSwgdmFsLCBzdGFsZURheXMsIGV4cGlyeURheXMpIHtcclxuXHR0cnkge1xyXG5cdFx0dmFyIGRlZmF1bHRTdGFsZURheXMgPSAxO1xyXG5cdFx0dmFyIGRlZmF1bHRFeHBpcnlEYXlzID0gMzA7XHJcblx0XHR2YXIgbWlsbGlzZWNvbmRzUGVyRGF5ID0gMjQqNjAqNjAqMTAwMDtcclxuXHJcblx0XHR2YXIgc3RhbGVEdXJhdGlvbiA9IChzdGFsZURheXMgfHwgZGVmYXVsdFN0YWxlRGF5cykqbWlsbGlzZWNvbmRzUGVyRGF5O1xyXG5cdFx0dmFyIGV4cGlyeUR1cmF0aW9uID0gKGV4cGlyeURheXMgfHwgZGVmYXVsdEV4cGlyeURheXMpKm1pbGxpc2Vjb25kc1BlckRheTtcclxuXHRcdFxyXG5cdFx0dmFyIHN0cmluZ1ZhbCA9IEpTT04uc3RyaW5naWZ5KHtcclxuXHRcdFx0dmFsdWU6IHZhbCxcclxuXHRcdFx0c3RhbGVEYXRlOiBuZXcgRGF0ZShEYXRlLm5vdygpICsgc3RhbGVEdXJhdGlvbikudG9JU09TdHJpbmcoKSxcclxuXHRcdFx0ZXhwaXJ5RGF0ZTogbmV3IERhdGUoRGF0ZS5ub3coKSArIGV4cGlyeUR1cmF0aW9uKS50b0lTT1N0cmluZygpXHJcblx0XHR9KTtcclxuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiUmF0ZXItXCIra2V5LCBzdHJpbmdWYWwpO1xyXG5cdH0gIGNhdGNoKGUpIHt9IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZW1wdHlcclxufTtcclxuLyoqIHJlYWRcclxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxyXG4gKiBAcmV0dXJucyB7QXJyYXl8T2JqZWN0fFN0cmluZ3xOdWxsfSBDYWNoZWQgYXJyYXkgb3Igb2JqZWN0LCBvciBlbXB0eSBzdHJpbmcgaWYgbm90IHlldCBjYWNoZWQsXHJcbiAqICAgICAgICAgIG9yIG51bGwgaWYgdGhlcmUgd2FzIGVycm9yLlxyXG4gKi9cclxudmFyIHJlYWQgPSBmdW5jdGlvbihrZXkpIHtcclxuXHR2YXIgdmFsO1xyXG5cdHRyeSB7XHJcblx0XHR2YXIgc3RyaW5nVmFsID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJSYXRlci1cIitrZXkpO1xyXG5cdFx0aWYgKCBzdHJpbmdWYWwgIT09IFwiXCIgKSB7XHJcblx0XHRcdHZhbCA9IEpTT04ucGFyc2Uoc3RyaW5nVmFsKTtcclxuXHRcdH1cclxuXHR9ICBjYXRjaChlKSB7XHJcblx0XHRjb25zb2xlLmxvZyhcIltSYXRlcl0gZXJyb3IgcmVhZGluZyBcIiArIGtleSArIFwiIGZyb20gbG9jYWxTdG9yYWdlIGNhY2hlOlwiKTtcclxuXHRcdGNvbnNvbGUubG9nKFxyXG5cdFx0XHRcIlxcdFwiICsgZS5uYW1lICsgXCIgbWVzc2FnZTogXCIgKyBlLm1lc3NhZ2UgK1xyXG5cdFx0XHQoIGUuYXQgPyBcIiBhdDogXCIgKyBlLmF0IDogXCJcIikgK1xyXG5cdFx0XHQoIGUudGV4dCA/IFwiIHRleHQ6IFwiICsgZS50ZXh0IDogXCJcIilcclxuXHRcdCk7XHJcblx0fVxyXG5cdHJldHVybiB2YWwgfHwgbnVsbDtcclxufTtcclxudmFyIGNsZWFySXRlbUlmSW52YWxpZCA9IGZ1bmN0aW9uKGtleSkge1xyXG5cdHZhciBpc1JhdGVyS2V5ID0ga2V5LmluZGV4T2YoXCJSYXRlci1cIikgPT09IDA7XHJcblx0aWYgKCAhaXNSYXRlcktleSApIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0dmFyIGl0ZW0gPSByZWFkKGtleS5yZXBsYWNlKFwiUmF0ZXItXCIsXCJcIikpO1xyXG5cdHZhciBpc0ludmFsaWQgPSAhaXRlbSB8fCAhaXRlbS5leHBpcnlEYXRlIHx8IGlzQWZ0ZXJEYXRlKGl0ZW0uZXhwaXJ5RGF0ZSk7XHJcblx0aWYgKCBpc0ludmFsaWQgKSB7XHJcblx0XHRsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xyXG5cdH1cclxufTtcclxudmFyIGNsZWFySW52YWxpZEl0ZW1zID0gZnVuY3Rpb24oKSB7XHJcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsb2NhbFN0b3JhZ2UubGVuZ3RoOyBpKyspIHtcclxuXHRcdHNldFRpbWVvdXQoY2xlYXJJdGVtSWZJbnZhbGlkLCAxMDAsIGxvY2FsU3RvcmFnZS5rZXkoaSkpO1xyXG5cdH1cclxufTtcclxuXHJcbmV4cG9ydCB7IHdyaXRlLCByZWFkLCBjbGVhckl0ZW1JZkludmFsaWQsIGNsZWFySW52YWxpZEl0ZW1zIH07IiwiLy8gQSBnbG9iYWwgb2JqZWN0IHRoYXQgc3RvcmVzIGFsbCB0aGUgcGFnZSBhbmQgdXNlciBjb25maWd1cmF0aW9uIGFuZCBzZXR0aW5nc1xyXG52YXIgY29uZmlnID0ge307XHJcbi8vIFNjcmlwdCBpbmZvXHJcbmNvbmZpZy5zY3JpcHQgPSB7XHJcblx0Ly8gQWR2ZXJ0IHRvIGFwcGVuZCB0byBlZGl0IHN1bW1hcmllc1xyXG5cdGFkdmVydDogIFwiIChbW1VzZXI6RXZhZDM3L3JhdGVyLmpzfFJhdGVyXV0pXCIsXHJcblx0dmVyc2lvbjogXCIyLjAuMFwiXHJcbn07XHJcbi8vIFByZWZlcmVuY2VzOiBnbG9iYWxzIHZhcnMgYWRkZWQgdG8gdXNlcnMnIGNvbW1vbi5qcywgb3Igc2V0IHRvIGRlZmF1bHRzIGlmIHVuZGVmaW5lZFxyXG5jb25maWcucHJlZnMgPSB7XHJcblx0d2F0Y2hsaXN0OiB3aW5kb3cucmF0ZXJfd2F0Y2hsaXN0IHx8IFwicHJlZmVyZW5jZXNcIlxyXG59O1xyXG4vLyBNZWRpYVdpa2kgY29uZmlndXJhdGlvbiB2YWx1ZXNcclxuY29uZmlnLm13ID0gbXcuY29uZmlnLmdldCggW1xyXG5cdFwic2tpblwiLFxyXG5cdFwid2dQYWdlTmFtZVwiLFxyXG5cdFwid2dOYW1lc3BhY2VOdW1iZXJcIixcclxuXHRcIndnVXNlck5hbWVcIixcclxuXHRcIndnRm9ybWF0dGVkTmFtZXNwYWNlc1wiLFxyXG5cdFwid2dNb250aE5hbWVzXCIsXHJcblx0XCJ3Z1JldmlzaW9uSWRcIixcclxuXHRcIndnU2NyaXB0UGF0aFwiLFxyXG5cdFwid2dTZXJ2ZXJcIixcclxuXHRcIndnQ2F0ZWdvcmllc1wiLFxyXG5cdFwid2dJc01haW5QYWdlXCJcclxuXSApO1xyXG5cclxuY29uZmlnLnJlZ2V4ID0geyAvKiBlc2xpbnQtZGlzYWJsZSBuby11c2VsZXNzLWVzY2FwZSAqL1xyXG5cdC8vIFBhdHRlcm4gdG8gZmluZCB0ZW1wbGF0ZXMsIHdoaWNoIG1heSBjb250YWluIG90aGVyIHRlbXBsYXRlc1xyXG5cdHRlbXBsYXRlOlx0XHQvXFx7XFx7XFxzKihbXiNcXHtcXHNdLis/KVxccyooXFx8KD86LnxcXG4pKj8oPzooPzpcXHtcXHsoPzoufFxcbikqPyg/Oig/Olxce1xceyg/Oi58XFxuKSo/XFx9XFx9KSg/Oi58XFxuKSo/KSo/XFx9XFx9KSg/Oi58XFxuKSo/KSp8KVxcfVxcfVxcbj8vZyxcclxuXHQvLyBQYXR0ZXJuIHRvIGZpbmQgYHxwYXJhbT12YWx1ZWAgb3IgYHx2YWx1ZWAsIHdoZXJlIGB2YWx1ZWAgY2FuIG9ubHkgY29udGFpbiBhIHBpcGVcclxuXHQvLyBpZiB3aXRoaW4gc3F1YXJlIGJyYWNrZXRzIChpLmUuIHdpa2lsaW5rcykgb3IgYnJhY2VzIChpLmUuIHRlbXBsYXRlcylcclxuXHR0ZW1wbGF0ZVBhcmFtczpcdC9cXHwoPyEoPzpbXntdK318W15cXFtdK10pKSg/Oi58XFxzKSo/KD89KD86XFx8fCQpKD8hKD86W157XSt9fFteXFxbXStdKSkpL2dcclxufTsgLyogZXNsaW50LWVuYWJsZSBuby11c2VsZXNzLWVzY2FwZSAqL1xyXG5jb25maWcuZGVmZXJyZWQgPSB7fTtcclxuY29uZmlnLmJhbm5lckRlZmF1bHRzID0ge1xyXG5cdGNsYXNzZXM6IFtcclxuXHRcdFwiRkFcIixcclxuXHRcdFwiRkxcIixcclxuXHRcdFwiQVwiLFxyXG5cdFx0XCJHQVwiLFxyXG5cdFx0XCJCXCIsXHJcblx0XHRcIkNcIixcclxuXHRcdFwiU3RhcnRcIixcclxuXHRcdFwiU3R1YlwiLFxyXG5cdFx0XCJMaXN0XCJcclxuXHRdLFxyXG5cdGltcG9ydGFuY2VzOiBbXHJcblx0XHRcIlRvcFwiLFxyXG5cdFx0XCJIaWdoXCIsXHJcblx0XHRcIk1pZFwiLFxyXG5cdFx0XCJMb3dcIlxyXG5cdF0sXHJcblx0ZXh0ZW5kZWRDbGFzc2VzOiBbXHJcblx0XHRcIkNhdGVnb3J5XCIsXHJcblx0XHRcIkRyYWZ0XCIsXHJcblx0XHRcIkZpbGVcIixcclxuXHRcdFwiUG9ydGFsXCIsXHJcblx0XHRcIlByb2plY3RcIixcclxuXHRcdFwiVGVtcGxhdGVcIixcclxuXHRcdFwiQnBsdXNcIixcclxuXHRcdFwiRnV0dXJlXCIsXHJcblx0XHRcIkN1cnJlbnRcIixcclxuXHRcdFwiRGlzYW1iaWdcIixcclxuXHRcdFwiTkFcIixcclxuXHRcdFwiUmVkaXJlY3RcIixcclxuXHRcdFwiQm9va1wiXHJcblx0XSxcclxuXHRleHRlbmRlZEltcG9ydGFuY2VzOiBbXHJcblx0XHRcIlRvcFwiLFxyXG5cdFx0XCJIaWdoXCIsXHJcblx0XHRcIk1pZFwiLFxyXG5cdFx0XCJMb3dcIixcclxuXHRcdFwiQm90dG9tXCIsXHJcblx0XHRcIk5BXCJcclxuXHRdXHJcbn07XHJcbmNvbmZpZy5jdXN0b21DbGFzc2VzID0ge1xyXG5cdFwiV2lraVByb2plY3QgTWlsaXRhcnkgaGlzdG9yeVwiOiBbXHJcblx0XHRcIkFMXCIsXHJcblx0XHRcIkJMXCIsXHJcblx0XHRcIkNMXCJcclxuXHRdLFxyXG5cdFwiV2lraVByb2plY3QgUG9ydGFsc1wiOiBbXHJcblx0XHRcIkZQb1wiLFxyXG5cdFx0XCJDb21wbGV0ZVwiLFxyXG5cdFx0XCJTdWJzdGFudGlhbFwiLFxyXG5cdFx0XCJCYXNpY1wiLFxyXG5cdFx0XCJJbmNvbXBsZXRlXCIsXHJcblx0XHRcIk1ldGFcIlxyXG5cdF1cclxufTtcclxuY29uZmlnLnNoZWxsVGVtcGxhdGVzID0gW1xyXG5cdFwiV2lraVByb2plY3QgYmFubmVyIHNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdEJhbm5lcnNcIixcclxuXHRcIldpa2lQcm9qZWN0IEJhbm5lcnNcIixcclxuXHRcIldQQlwiLFxyXG5cdFwiV1BCU1wiLFxyXG5cdFwiV2lraXByb2plY3RiYW5uZXJzaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3QgQmFubmVyIFNoZWxsXCIsXHJcblx0XCJXcGJcIixcclxuXHRcIldQQmFubmVyU2hlbGxcIixcclxuXHRcIldwYnNcIixcclxuXHRcIldpa2lwcm9qZWN0YmFubmVyc1wiLFxyXG5cdFwiV1AgQmFubmVyIFNoZWxsXCIsXHJcblx0XCJXUCBiYW5uZXIgc2hlbGxcIixcclxuXHRcIkJhbm5lcnNoZWxsXCIsXHJcblx0XCJXaWtpcHJvamVjdCBiYW5uZXIgc2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0IEJhbm5lcnMgU2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0QmFubmVyIFNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdEJhbm5lclNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdCBCYW5uZXJTaGVsbFwiLFxyXG5cdFwiV2lraXByb2plY3RCYW5uZXJTaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3QgYmFubmVyIHNoZWxsL3JlZGlyZWN0XCIsXHJcblx0XCJXaWtpUHJvamVjdCBTaGVsbFwiLFxyXG5cdFwiQmFubmVyIHNoZWxsXCIsXHJcblx0XCJTY29wZSBzaGVsbFwiLFxyXG5cdFwiUHJvamVjdCBzaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3QgYmFubmVyXCJcclxuXTtcclxuY29uZmlnLmRlZmF1bHRQYXJhbWV0ZXJEYXRhID0ge1xyXG5cdFwiYXV0b1wiOiB7XHJcblx0XHRcImxhYmVsXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIkF1dG8tcmF0ZWRcIlxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiQXV0b21hdGljYWxseSByYXRlZCBieSBhIGJvdC4gQWxsb3dlZCB2YWx1ZXM6IFsneWVzJ10uXCJcclxuXHRcdH0sXHJcblx0XHRcImF1dG92YWx1ZVwiOiBcInllc1wiXHJcblx0fSxcclxuXHRcImxpc3Rhc1wiOiB7XHJcblx0XHRcImxhYmVsXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIkxpc3QgYXNcIlxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiU29ydGtleSBmb3IgdGFsayBwYWdlXCJcclxuXHRcdH1cclxuXHR9LFxyXG5cdFwic21hbGxcIjoge1xyXG5cdFx0XCJsYWJlbFwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJTbWFsbD9cIixcclxuXHRcdH0sXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIkRpc3BsYXkgYSBzbWFsbCB2ZXJzaW9uLiBBbGxvd2VkIHZhbHVlczogWyd5ZXMnXS5cIlxyXG5cdFx0fSxcclxuXHRcdFwiYXV0b3ZhbHVlXCI6IFwieWVzXCJcclxuXHR9LFxyXG5cdFwiYXR0ZW50aW9uXCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiQXR0ZW50aW9uIHJlcXVpcmVkP1wiLFxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiSW1tZWRpYXRlIGF0dGVudGlvbiByZXF1aXJlZC4gQWxsb3dlZCB2YWx1ZXM6IFsneWVzJ10uXCJcclxuXHRcdH0sXHJcblx0XHRcImF1dG92YWx1ZVwiOiBcInllc1wiXHJcblx0fSxcclxuXHRcIm5lZWRzLWltYWdlXCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiTmVlZHMgaW1hZ2U/XCIsXHJcblx0XHR9LFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJSZXF1ZXN0IHRoYXQgYW4gaW1hZ2Ugb3IgcGhvdG9ncmFwaCBvZiB0aGUgc3ViamVjdCBiZSBhZGRlZCB0byB0aGUgYXJ0aWNsZS4gQWxsb3dlZCB2YWx1ZXM6IFsneWVzJ10uXCJcclxuXHRcdH0sXHJcblx0XHRcImFsaWFzZXNcIjogW1xyXG5cdFx0XHRcIm5lZWRzLXBob3RvXCJcclxuXHRcdF0sXHJcblx0XHRcImF1dG92YWx1ZVwiOiBcInllc1wiLFxyXG5cdFx0XCJzdWdnZXN0ZWRcIjogdHJ1ZVxyXG5cdH0sXHJcblx0XCJuZWVkcy1pbmZvYm94XCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiTmVlZHMgaW5mb2JveD9cIixcclxuXHRcdH0sXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIlJlcXVlc3QgdGhhdCBhbiBpbmZvYm94IGJlIGFkZGVkIHRvIHRoZSBhcnRpY2xlLiBBbGxvd2VkIHZhbHVlczogWyd5ZXMnXS5cIlxyXG5cdFx0fSxcclxuXHRcdFwiYWxpYXNlc1wiOiBbXHJcblx0XHRcdFwibmVlZHMtcGhvdG9cIlxyXG5cdFx0XSxcclxuXHRcdFwiYXV0b3ZhbHVlXCI6IFwieWVzXCIsXHJcblx0XHRcInN1Z2dlc3RlZFwiOiB0cnVlXHJcblx0fVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY29uZmlnOyIsIi8vIEF0dHJpYnV0aW9uOiBEaWZmIHN0eWxlcyBmcm9tIDxodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9XaWtpcGVkaWE6QXV0b1dpa2lCcm93c2VyL3N0eWxlLmNzcz5cclxudmFyIGRpZmZTdHlsZXMgPSBgdGFibGUuZGlmZiwgdGQuZGlmZi1vdGl0bGUsIHRkLmRpZmYtbnRpdGxlIHsgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7IH1cclxudGQuZGlmZi1vdGl0bGUsIHRkLmRpZmYtbnRpdGxlIHsgdGV4dC1hbGlnbjogY2VudGVyOyB9XHJcbnRkLmRpZmYtbWFya2VyIHsgdGV4dC1hbGlnbjogcmlnaHQ7IGZvbnQtd2VpZ2h0OiBib2xkOyBmb250LXNpemU6IDEuMjVlbTsgfVxyXG50ZC5kaWZmLWxpbmVubyB7IGZvbnQtd2VpZ2h0OiBib2xkOyB9XHJcbnRkLmRpZmYtYWRkZWRsaW5lLCB0ZC5kaWZmLWRlbGV0ZWRsaW5lLCB0ZC5kaWZmLWNvbnRleHQgeyBmb250LXNpemU6IDg4JTsgdmVydGljYWwtYWxpZ246IHRvcDsgd2hpdGUtc3BhY2U6IC1tb3otcHJlLXdyYXA7IHdoaXRlLXNwYWNlOiBwcmUtd3JhcDsgfVxyXG50ZC5kaWZmLWFkZGVkbGluZSwgdGQuZGlmZi1kZWxldGVkbGluZSB7IGJvcmRlci1zdHlsZTogc29saWQ7IGJvcmRlci13aWR0aDogMXB4IDFweCAxcHggNHB4OyBib3JkZXItcmFkaXVzOiAwLjMzZW07IH1cclxudGQuZGlmZi1hZGRlZGxpbmUgeyBib3JkZXItY29sb3I6ICNhM2QzZmY7IH1cclxudGQuZGlmZi1kZWxldGVkbGluZSB7IGJvcmRlci1jb2xvcjogI2ZmZTQ5YzsgfVxyXG50ZC5kaWZmLWNvbnRleHQgeyBiYWNrZ3JvdW5kOiAjZjNmM2YzOyBjb2xvcjogIzMzMzMzMzsgYm9yZGVyLXN0eWxlOiBzb2xpZDsgYm9yZGVyLXdpZHRoOiAxcHggMXB4IDFweCA0cHg7IGJvcmRlci1jb2xvcjogI2U2ZTZlNjsgYm9yZGVyLXJhZGl1czogMC4zM2VtOyB9XHJcbi5kaWZmY2hhbmdlIHsgZm9udC13ZWlnaHQ6IGJvbGQ7IHRleHQtZGVjb3JhdGlvbjogbm9uZTsgfVxyXG50YWJsZS5kaWZmIHtcclxuICAgIGJvcmRlcjogbm9uZTtcclxuICAgIHdpZHRoOiA5OCU7IGJvcmRlci1zcGFjaW5nOiA0cHg7XHJcbiAgICB0YWJsZS1sYXlvdXQ6IGZpeGVkOyAvKiBFbnN1cmVzIHRoYXQgY29sdW1zIGFyZSBvZiBlcXVhbCB3aWR0aCAqL1xyXG59XHJcbnRkLmRpZmYtYWRkZWRsaW5lIC5kaWZmY2hhbmdlLCB0ZC5kaWZmLWRlbGV0ZWRsaW5lIC5kaWZmY2hhbmdlIHsgYm9yZGVyLXJhZGl1czogMC4zM2VtOyBwYWRkaW5nOiAwLjI1ZW0gMDsgfVxyXG50ZC5kaWZmLWFkZGVkbGluZSAuZGlmZmNoYW5nZSB7XHRiYWNrZ3JvdW5kOiAjZDhlY2ZmOyB9XHJcbnRkLmRpZmYtZGVsZXRlZGxpbmUgLmRpZmZjaGFuZ2UgeyBiYWNrZ3JvdW5kOiAjZmVlZWM4OyB9XHJcbnRhYmxlLmRpZmYgdGQge1x0cGFkZGluZzogMC4zM2VtIDAuNjZlbTsgfVxyXG50YWJsZS5kaWZmIGNvbC5kaWZmLW1hcmtlciB7IHdpZHRoOiAyJTsgfVxyXG50YWJsZS5kaWZmIGNvbC5kaWZmLWNvbnRlbnQgeyB3aWR0aDogNDglOyB9XHJcbnRhYmxlLmRpZmYgdGQgZGl2IHtcclxuICAgIC8qIEZvcmNlLXdyYXAgdmVyeSBsb25nIGxpbmVzIHN1Y2ggYXMgVVJMcyBvciBwYWdlLXdpZGVuaW5nIGNoYXIgc3RyaW5ncy4gKi9cclxuICAgIHdvcmQtd3JhcDogYnJlYWstd29yZDtcclxuICAgIC8qIEFzIGZhbGxiYWNrIChGRjwzLjUsIE9wZXJhIDwxMC41KSwgc2Nyb2xsYmFycyB3aWxsIGJlIGFkZGVkIGZvciB2ZXJ5IHdpZGUgY2VsbHNcclxuICAgICAgICBpbnN0ZWFkIG9mIHRleHQgb3ZlcmZsb3dpbmcgb3Igd2lkZW5pbmcgKi9cclxuICAgIG92ZXJmbG93OiBhdXRvO1xyXG59YDtcclxuXHJcbmV4cG9ydCB7IGRpZmZTdHlsZXMgfTsiLCJpbXBvcnQge0FQSSwgaXNBZnRlckRhdGUsIG1ha2VFcnJvck1zZ30gZnJvbSBcIi4vdXRpbFwiO1xyXG5pbXBvcnQgKiBhcyBjYWNoZSBmcm9tIFwiLi9jYWNoZVwiO1xyXG5cclxudmFyIGNhY2hlQmFubmVycyA9IGZ1bmN0aW9uKGJhbm5lcnMsIGJhbm5lck9wdGlvbnMpIHtcclxuXHRjYWNoZS53cml0ZShcImJhbm5lcnNcIiwgYmFubmVycywgMiwgNjApO1xyXG5cdGNhY2hlLndyaXRlKFwiYmFubmVyT3B0aW9uc1wiLCBiYW5uZXJPcHRpb25zLCAyLCA2MCk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyBiYW5uZXJzL29wdGlvbnMgZnJvbSB0aGUgQXBpXHJcbiAqIFxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gUmVzb2x2ZWQgd2l0aDogYmFubmVycyBvYmplY3QsIGJhbm5lck9wdGlvbnMgYXJyYXlcclxuICovXHJcbnZhciBnZXRMaXN0T2ZCYW5uZXJzRnJvbUFwaSA9IGZ1bmN0aW9uKCkge1xyXG5cclxuXHR2YXIgZmluaXNoZWRQcm9taXNlID0gJC5EZWZlcnJlZCgpO1xyXG5cclxuXHR2YXIgcXVlcnlTa2VsZXRvbiA9IHtcclxuXHRcdGFjdGlvbjogXCJxdWVyeVwiLFxyXG5cdFx0Zm9ybWF0OiBcImpzb25cIixcclxuXHRcdGxpc3Q6IFwiY2F0ZWdvcnltZW1iZXJzXCIsXHJcblx0XHRjbXByb3A6IFwidGl0bGVcIixcclxuXHRcdGNtbmFtZXNwYWNlOiBcIjEwXCIsXHJcblx0XHRjbWxpbWl0OiBcIjUwMFwiXHJcblx0fTtcclxuXHJcblx0dmFyIGNhdGVnb3JpZXMgPSBbXHJcblx0XHR7XHJcblx0XHRcdHRpdGxlOlwiIENhdGVnb3J5Oldpa2lQcm9qZWN0IGJhbm5lcnMgd2l0aCBxdWFsaXR5IGFzc2Vzc21lbnRcIixcclxuXHRcdFx0YWJicmV2aWF0aW9uOiBcIndpdGhSYXRpbmdzXCIsXHJcblx0XHRcdGJhbm5lcnM6IFtdLFxyXG5cdFx0XHRwcm9jZXNzZWQ6ICQuRGVmZXJyZWQoKVxyXG5cdFx0fSxcclxuXHRcdHtcclxuXHRcdFx0dGl0bGU6IFwiQ2F0ZWdvcnk6V2lraVByb2plY3QgYmFubmVycyB3aXRob3V0IHF1YWxpdHkgYXNzZXNzbWVudFwiLFxyXG5cdFx0XHRhYmJyZXZpYXRpb246IFwid2l0aG91dFJhdGluZ3NcIixcclxuXHRcdFx0YmFubmVyczogW10sXHJcblx0XHRcdHByb2Nlc3NlZDogJC5EZWZlcnJlZCgpXHJcblx0XHR9LFxyXG5cdFx0e1xyXG5cdFx0XHR0aXRsZTogXCJDYXRlZ29yeTpXaWtpUHJvamVjdCBiYW5uZXIgd3JhcHBlciB0ZW1wbGF0ZXNcIixcclxuXHRcdFx0YWJicmV2aWF0aW9uOiBcIndyYXBwZXJzXCIsXHJcblx0XHRcdGJhbm5lcnM6IFtdLFxyXG5cdFx0XHRwcm9jZXNzZWQ6ICQuRGVmZXJyZWQoKVxyXG5cdFx0fVxyXG5cdF07XHJcblxyXG5cdHZhciBwcm9jZXNzUXVlcnkgPSBmdW5jdGlvbihyZXN1bHQsIGNhdEluZGV4KSB7XHJcblx0XHRpZiAoICFyZXN1bHQucXVlcnkgfHwgIXJlc3VsdC5xdWVyeS5jYXRlZ29yeW1lbWJlcnMgKSB7XHJcblx0XHRcdC8vIE5vIHJlc3VsdHNcclxuXHRcdFx0Ly8gVE9ETzogZXJyb3Igb3Igd2FybmluZyAqKioqKioqKlxyXG5cdFx0XHRmaW5pc2hlZFByb21pc2UucmVqZWN0KCk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0Ly8gR2F0aGVyIHRpdGxlcyBpbnRvIGFycmF5IC0gZXhjbHVkaW5nIFwiVGVtcGxhdGU6XCIgcHJlZml4XHJcblx0XHR2YXIgcmVzdWx0VGl0bGVzID0gcmVzdWx0LnF1ZXJ5LmNhdGVnb3J5bWVtYmVycy5tYXAoZnVuY3Rpb24oaW5mbykge1xyXG5cdFx0XHRyZXR1cm4gaW5mby50aXRsZS5zbGljZSg5KTtcclxuXHRcdH0pO1xyXG5cdFx0QXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoY2F0ZWdvcmllc1tjYXRJbmRleF0uYmFubmVycywgcmVzdWx0VGl0bGVzKTtcclxuXHRcdFxyXG5cdFx0Ly8gQ29udGludWUgcXVlcnkgaWYgbmVlZGVkXHJcblx0XHRpZiAoIHJlc3VsdC5jb250aW51ZSApIHtcclxuXHRcdFx0ZG9BcGlRdWVyeSgkLmV4dGVuZChjYXRlZ29yaWVzW2NhdEluZGV4XS5xdWVyeSwgcmVzdWx0LmNvbnRpbnVlKSwgY2F0SW5kZXgpO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdGNhdGVnb3JpZXNbY2F0SW5kZXhdLnByb2Nlc3NlZC5yZXNvbHZlKCk7XHJcblx0fTtcclxuXHJcblx0dmFyIGRvQXBpUXVlcnkgPSBmdW5jdGlvbihxLCBjYXRJbmRleCkge1xyXG5cdFx0QVBJLmdldCggcSApXHJcblx0XHRcdC5kb25lKCBmdW5jdGlvbihyZXN1bHQpIHtcclxuXHRcdFx0XHRwcm9jZXNzUXVlcnkocmVzdWx0LCBjYXRJbmRleCk7XHJcblx0XHRcdH0gKVxyXG5cdFx0XHQuZmFpbCggZnVuY3Rpb24oY29kZSwganF4aHIpIHtcclxuXHRcdFx0XHRjb25zb2xlLndhcm4oXCJbUmF0ZXJdIFwiICsgbWFrZUVycm9yTXNnKGNvZGUsIGpxeGhyLCBcIkNvdWxkIG5vdCByZXRyaWV2ZSBwYWdlcyBmcm9tIFtbOlwiICsgcS5jbXRpdGxlICsgXCJdXVwiKSk7XHJcblx0XHRcdFx0ZmluaXNoZWRQcm9taXNlLnJlamVjdCgpO1xyXG5cdFx0XHR9ICk7XHJcblx0fTtcclxuXHRcclxuXHRjYXRlZ29yaWVzLmZvckVhY2goZnVuY3Rpb24oY2F0LCBpbmRleCwgYXJyKSB7XHJcblx0XHRjYXQucXVlcnkgPSAkLmV4dGVuZCggeyBcImNtdGl0bGVcIjpjYXQudGl0bGUgfSwgcXVlcnlTa2VsZXRvbiApO1xyXG5cdFx0JC53aGVuKCBhcnJbaW5kZXgtMV0gJiYgYXJyW2luZGV4LTFdLnByb2Nlc3NlZCB8fCB0cnVlICkudGhlbihmdW5jdGlvbigpe1xyXG5cdFx0XHRkb0FwaVF1ZXJ5KGNhdC5xdWVyeSwgaW5kZXgpO1xyXG5cdFx0fSk7XHJcblx0fSk7XHJcblx0XHJcblx0Y2F0ZWdvcmllc1tjYXRlZ29yaWVzLmxlbmd0aC0xXS5wcm9jZXNzZWQudGhlbihmdW5jdGlvbigpe1xyXG5cdFx0dmFyIGJhbm5lcnMgPSB7fTtcclxuXHRcdHZhciBzdGFzaEJhbm5lciA9IGZ1bmN0aW9uKGNhdE9iamVjdCkge1xyXG5cdFx0XHRiYW5uZXJzW2NhdE9iamVjdC5hYmJyZXZpYXRpb25dID0gY2F0T2JqZWN0LmJhbm5lcnM7XHJcblx0XHR9O1xyXG5cdFx0dmFyIG1lcmdlQmFubmVycyA9IGZ1bmN0aW9uKG1lcmdlSW50b1RoaXNBcnJheSwgY2F0T2JqZWN0KSB7XHJcblx0XHRcdHJldHVybiAkLm1lcmdlKG1lcmdlSW50b1RoaXNBcnJheSwgY2F0T2JqZWN0LmJhbm5lcnMpO1xyXG5cdFx0fTtcclxuXHRcdHZhciBtYWtlT3B0aW9uID0gZnVuY3Rpb24oYmFubmVyTmFtZSkge1xyXG5cdFx0XHR2YXIgaXNXcmFwcGVyID0gKCAtMSAhPT0gJC5pbkFycmF5KGJhbm5lck5hbWUsIGNhdGVnb3JpZXNbMl0uYmFubmVycykgKTtcclxuXHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRkYXRhOiAgKCBpc1dyYXBwZXIgPyBcInN1YnN0OlwiIDogXCJcIikgKyBiYW5uZXJOYW1lLFxyXG5cdFx0XHRcdGxhYmVsOiBiYW5uZXJOYW1lLnJlcGxhY2UoXCJXaWtpUHJvamVjdCBcIiwgXCJcIikgKyAoIGlzV3JhcHBlciA/IFwiIFt0ZW1wbGF0ZSB3cmFwcGVyXVwiIDogXCJcIilcclxuXHRcdFx0fTtcclxuXHRcdH07XHJcblx0XHRjYXRlZ29yaWVzLmZvckVhY2goc3Rhc2hCYW5uZXIpO1xyXG5cdFx0XHJcblx0XHR2YXIgYmFubmVyT3B0aW9ucyA9IGNhdGVnb3JpZXMucmVkdWNlKG1lcmdlQmFubmVycywgW10pLm1hcChtYWtlT3B0aW9uKTtcclxuXHRcdFxyXG5cdFx0ZmluaXNoZWRQcm9taXNlLnJlc29sdmUoYmFubmVycywgYmFubmVyT3B0aW9ucyk7XHJcblx0fSk7XHJcblx0XHJcblx0cmV0dXJuIGZpbmlzaGVkUHJvbWlzZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGJhbm5lcnMvb3B0aW9ucyBmcm9tIGNhY2hlLCBpZiB0aGVyZSBhbmQgbm90IHRvbyBvbGRcclxuICogXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlZCB3aXRoOiBiYW5uZXJzIG9iamVjdCwgYmFubmVyT3B0aW9ucyBvYmplY3RcclxuICovXHJcbnZhciBnZXRCYW5uZXJzRnJvbUNhY2hlID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIGNhY2hlZEJhbm5lcnMgPSBjYWNoZS5yZWFkKFwiYmFubmVyc1wiKTtcclxuXHR2YXIgY2FjaGVkQmFubmVyT3B0aW9ucyA9IGNhY2hlLnJlYWQoXCJiYW5uZXJPcHRpb25zXCIpO1xyXG5cdGlmIChcclxuXHRcdCFjYWNoZWRCYW5uZXJzIHx8XHJcblx0XHQhY2FjaGVkQmFubmVycy52YWx1ZSB8fCAhY2FjaGVkQmFubmVycy5zdGFsZURhdGUgfHxcclxuXHRcdCFjYWNoZWRCYW5uZXJPcHRpb25zIHx8XHJcblx0XHQhY2FjaGVkQmFubmVyT3B0aW9ucy52YWx1ZSB8fCAhY2FjaGVkQmFubmVyT3B0aW9ucy5zdGFsZURhdGVcclxuXHQpIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0fVxyXG5cdGlmICggaXNBZnRlckRhdGUoY2FjaGVkQmFubmVycy5zdGFsZURhdGUpIHx8IGlzQWZ0ZXJEYXRlKGNhY2hlZEJhbm5lck9wdGlvbnMuc3RhbGVEYXRlKSApIHtcclxuXHRcdC8vIFVwZGF0ZSBpbiB0aGUgYmFja2dyb3VuZDsgc3RpbGwgdXNlIG9sZCBsaXN0IHVudGlsIHRoZW4gIFxyXG5cdFx0Z2V0TGlzdE9mQmFubmVyc0Zyb21BcGkoKS50aGVuKGNhY2hlQmFubmVycyk7XHJcblx0fVxyXG5cdHJldHVybiAkLkRlZmVycmVkKCkucmVzb2x2ZShjYWNoZWRCYW5uZXJzLnZhbHVlLCBjYWNoZWRCYW5uZXJPcHRpb25zLnZhbHVlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGJhbm5lcnMvb3B0aW9ucyBmcm9tIGNhY2hlIG9yIEFQSS5cclxuICogSGFzIHNpZGUgYWZmZWN0IG9mIGFkZGluZy91cGRhdGluZy9jbGVhcmluZyBjYWNoZS5cclxuICogXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPE9iamVjdCwgQXJyYXk+fSBiYW5uZXJzIG9iamVjdCwgYmFubmVyT3B0aW9ucyBvYmplY3RcclxuICovXHJcbnZhciBnZXRCYW5uZXJzID0gKCkgPT4gZ2V0QmFubmVyc0Zyb21DYWNoZSgpLnRoZW4oXHJcblx0Ly8gU3VjY2VzczogcGFzcyB0aHJvdWdoXHJcblx0KGJhbm5lcnMsIG9wdGlvbnMpID0+ICQuRGVmZXJyZWQoKS5yZXNvbHZlKGJhbm5lcnMsIG9wdGlvbnMpLFxyXG5cdC8vIEZhaWx1cmU6IGdldCBmcm9tIEFwaSwgdGhlbiBjYWNoZSB0aGVtXHJcblx0KCkgPT4ge1xyXG5cdFx0dmFyIGJhbm5lcnNQcm9taXNlID0gZ2V0TGlzdE9mQmFubmVyc0Zyb21BcGkoKTtcclxuXHRcdGJhbm5lcnNQcm9taXNlLnRoZW4oY2FjaGVCYW5uZXJzKTtcclxuXHRcdHJldHVybiBiYW5uZXJzUHJvbWlzZTtcclxuXHR9XHJcbik7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnZXRCYW5uZXJzOyIsImltcG9ydCBjb25maWcgZnJvbSBcIi4vY29uZmlnXCI7XHJcbmltcG9ydCB7QVBJfSBmcm9tIFwiLi91dGlsXCI7XHJcbmltcG9ydCB7IHBhcnNlVGVtcGxhdGVzLCBnZXRXaXRoUmVkaXJlY3RUbyB9IGZyb20gXCIuL1RlbXBsYXRlXCI7XHJcbmltcG9ydCBnZXRCYW5uZXJzIGZyb20gXCIuL2dldEJhbm5lcnNcIjtcclxuaW1wb3J0ICogYXMgY2FjaGUgZnJvbSBcIi4vY2FjaGVcIjtcclxuaW1wb3J0IHdpbmRvd01hbmFnZXIgZnJvbSBcIi4vd2luZG93TWFuYWdlclwiO1xyXG5cclxudmFyIHNldHVwUmF0ZXIgPSBmdW5jdGlvbihjbGlja0V2ZW50KSB7XHJcblx0aWYgKCBjbGlja0V2ZW50ICkge1xyXG5cdFx0Y2xpY2tFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdH1cclxuXHJcblx0dmFyIHNldHVwQ29tcGxldGVkUHJvbWlzZSA9ICQuRGVmZXJyZWQoKTtcclxuICAgIFxyXG5cdHZhciBjdXJyZW50UGFnZSA9IG13LlRpdGxlLm5ld0Zyb21UZXh0KGNvbmZpZy5tdy53Z1BhZ2VOYW1lKTtcclxuXHR2YXIgdGFsa1BhZ2UgPSBjdXJyZW50UGFnZSAmJiBjdXJyZW50UGFnZS5nZXRUYWxrUGFnZSgpO1xyXG5cdHZhciBzdWJqZWN0UGFnZSA9IGN1cnJlbnRQYWdlICYmIGN1cnJlbnRQYWdlLmdldFN1YmplY3RQYWdlKCk7XHJcbiBcclxuXHQvLyBHZXQgbGlzdHMgb2YgYWxsIGJhbm5lcnMgKHRhc2sgMSlcclxuXHR2YXIgYmFubmVyc1Byb21pc2UgPSBnZXRCYW5uZXJzKCk7XHJcblxyXG5cdC8vIExvYWQgdGFsayBwYWdlICh0YXNrIDIpXHJcblx0dmFyIGxvYWRUYWxrUHJvbWlzZSA9IEFQSS5nZXQoIHtcclxuXHRcdGFjdGlvbjogXCJxdWVyeVwiLFxyXG5cdFx0cHJvcDogXCJyZXZpc2lvbnNcIixcclxuXHRcdHJ2cHJvcDogXCJjb250ZW50XCIsXHJcblx0XHRydnNlY3Rpb246IFwiMFwiLFxyXG5cdFx0dGl0bGVzOiB0YWxrUGFnZS5nZXRQcmVmaXhlZFRleHQoKSxcclxuXHRcdGluZGV4cGFnZWlkczogMVxyXG5cdH0gKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcclxuXHRcdHZhciBpZCA9IHJlc3VsdC5xdWVyeS5wYWdlaWRzO1x0XHRcclxuXHRcdHZhciB3aWtpdGV4dCA9ICggaWQgPCAwICkgPyBcIlwiIDogcmVzdWx0LnF1ZXJ5LnBhZ2VzW2lkXS5yZXZpc2lvbnNbMF1bXCIqXCJdO1xyXG5cdFx0cmV0dXJuIHdpa2l0ZXh0O1xyXG5cdH0pO1xyXG5cclxuXHQvLyBQYXJzZSB0YWxrIHBhZ2UgZm9yIGJhbm5lcnMgKHRhc2sgMylcclxuXHR2YXIgcGFyc2VUYWxrUHJvbWlzZSA9IGxvYWRUYWxrUHJvbWlzZS50aGVuKHdpa2l0ZXh0ID0+IHBhcnNlVGVtcGxhdGVzKHdpa2l0ZXh0LCB0cnVlKSkgLy8gR2V0IGFsbCB0ZW1wbGF0ZXNcclxuXHRcdC50aGVuKHRlbXBsYXRlcyA9PiBnZXRXaXRoUmVkaXJlY3RUbyh0ZW1wbGF0ZXMpKSAvLyBDaGVjayBmb3IgcmVkaXJlY3RzXHJcblx0XHQudGhlbih0ZW1wbGF0ZXMgPT4ge1xyXG5cdFx0XHRyZXR1cm4gYmFubmVyc1Byb21pc2UudGhlbigoYWxsQmFubmVycykgPT4geyAvLyBHZXQgbGlzdCBvZiBhbGwgYmFubmVyIHRlbXBsYXRlc1xyXG5cdFx0XHRcdHJldHVybiB0ZW1wbGF0ZXMuZmlsdGVyKHRlbXBsYXRlID0+IHsgLy8gRmlsdGVyIG91dCBub24tYmFubmVyc1xyXG5cdFx0XHRcdFx0dmFyIG1haW5UZXh0ID0gdGVtcGxhdGUucmVkaXJlY3RUb1xyXG5cdFx0XHRcdFx0XHQ/IHRlbXBsYXRlLnJlZGlyZWN0VG8uZ2V0TWFpblRleHQoKVxyXG5cdFx0XHRcdFx0XHQ6IHRlbXBsYXRlLmdldFRpdGxlKCkuZ2V0TWFpblRleHQoKTtcclxuXHRcdFx0XHRcdHJldHVybiBhbGxCYW5uZXJzLndpdGhSYXRpbmdzLmluY2x1ZGVzKG1haW5UZXh0KSB8fCBcclxuICAgICAgICAgICAgICAgICAgICBhbGxCYW5uZXJzLndpdGhvdXRSYXRpbmdzLmluY2x1ZGVzKG1haW5UZXh0KSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIGFsbEJhbm5lcnMud3JhcHBlcnMuaW5jbHVkZXMobWFpblRleHQpO1xyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFx0XHQubWFwKGZ1bmN0aW9uKHRlbXBsYXRlKSB7IC8vIFNldCB3cmFwcGVyIHRhcmdldCBpZiBuZWVkZWRcclxuXHRcdFx0XHRcdFx0dmFyIG1haW5UZXh0ID0gdGVtcGxhdGUucmVkaXJlY3RUb1xyXG5cdFx0XHRcdFx0XHRcdD8gdGVtcGxhdGUucmVkaXJlY3RUby5nZXRNYWluVGV4dCgpXHJcblx0XHRcdFx0XHRcdFx0OiB0ZW1wbGF0ZS5nZXRUaXRsZSgpLmdldE1haW5UZXh0KCk7XHJcblx0XHRcdFx0XHRcdGlmIChhbGxCYW5uZXJzLndyYXBwZXJzLmluY2x1ZGVzKG1haW5UZXh0KSkge1xyXG5cdFx0XHRcdFx0XHRcdHRlbXBsYXRlLnJlZGlyZWN0c1RvID0gbXcuVGl0bGUubmV3RnJvbVRleHQoXCJUZW1wbGF0ZTpTdWJzdDpcIiArIG1haW5UZXh0KTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gdGVtcGxhdGU7XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHJcblx0Ly8gUmV0cmlldmUgYW5kIHN0b3JlIFRlbXBsYXRlRGF0YSAodGFzayA0KVxyXG5cdHZhciB0ZW1wbGF0ZURhdGFQcm9taXNlID0gcGFyc2VUYWxrUHJvbWlzZS50aGVuKHRlbXBsYXRlcyA9PiB7XHJcblx0XHR0ZW1wbGF0ZXMuZm9yRWFjaCh0ZW1wbGF0ZSA9PiB0ZW1wbGF0ZS5zZXRQYXJhbURhdGFBbmRTdWdnZXN0aW9ucygpKTtcclxuXHRcdHJldHVybiB0ZW1wbGF0ZXM7XHJcblx0fSk7XHJcblxyXG5cdC8vIENoZWNrIGlmIHBhZ2UgaXMgYSByZWRpcmVjdCAodGFzayA1KSAtIGJ1dCBkb24ndCBlcnJvciBvdXQgaWYgcmVxdWVzdCBmYWlsc1xyXG5cdHZhciByZWRpcmVjdENoZWNrUHJvbWlzZSA9IEFQSS5nZXRSYXcoc3ViamVjdFBhZ2UuZ2V0UHJlZml4ZWRUZXh0KCkpXHJcblx0XHQudGhlbihcclxuXHRcdFx0Ly8gU3VjY2Vzc1xyXG5cdFx0XHRmdW5jdGlvbihyYXdQYWdlKSB7IFxyXG5cdFx0XHRcdGlmICggL15cXHMqI1JFRElSRUNUL2kudGVzdChyYXdQYWdlKSApIHtcclxuXHRcdFx0XHRcdC8vIGdldCByZWRpcmVjdGlvbiB0YXJnZXQsIG9yIGJvb2xlYW4gdHJ1ZVxyXG5cdFx0XHRcdFx0cmV0dXJuIHJhd1BhZ2Uuc2xpY2UocmF3UGFnZS5pbmRleE9mKFwiW1tcIikrMiwgcmF3UGFnZS5pbmRleE9mKFwiXV1cIikpIHx8IHRydWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fSxcclxuXHRcdFx0Ly8gRmFpbHVyZSAoaWdub3JlZClcclxuXHRcdFx0ZnVuY3Rpb24oKSB7IHJldHVybiBudWxsOyB9XHJcblx0XHQpO1xyXG5cclxuXHQvLyBSZXRyaWV2ZSByYXRpbmcgZnJvbSBPUkVTICh0YXNrIDYsIG9ubHkgbmVlZGVkIGZvciBhcnRpY2xlcylcclxuXHR2YXIgc2hvdWxkR2V0T3JlcyA9ICggY29uZmlnLm13LndnTmFtZXNwYWNlTnVtYmVyIDw9IDEgKTtcclxuXHRpZiAoIHNob3VsZEdldE9yZXMgKSB7XHJcblx0XHR2YXIgbGF0ZXN0UmV2SWRQcm9taXNlID0gY3VycmVudFBhZ2UuaXNUYWxrUGFnZSgpXHJcblx0XHRcdD8gJC5EZWZlcnJlZCgpLnJlc29sdmUoY29uZmlnLm13LndnUmV2aXNpb25JZClcclxuXHRcdFx0OiBcdEFQSS5nZXQoIHtcclxuXHRcdFx0XHRhY3Rpb246IFwicXVlcnlcIixcclxuXHRcdFx0XHRmb3JtYXQ6IFwianNvblwiLFxyXG5cdFx0XHRcdHByb3A6IFwicmV2aXNpb25zXCIsXHJcblx0XHRcdFx0dGl0bGVzOiBzdWJqZWN0UGFnZS5nZXRQcmVmaXhlZFRleHQoKSxcclxuXHRcdFx0XHRydnByb3A6IFwiaWRzXCIsXHJcblx0XHRcdFx0aW5kZXhwYWdlaWRzOiAxXHJcblx0XHRcdH0gKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0XHRcdGlmIChyZXN1bHQucXVlcnkucmVkaXJlY3RzKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHZhciBpZCA9IHJlc3VsdC5xdWVyeS5wYWdlaWRzO1xyXG5cdFx0XHRcdHZhciBwYWdlID0gcmVzdWx0LnF1ZXJ5LnBhZ2VzW2lkXTtcclxuXHRcdFx0XHRpZiAocGFnZS5taXNzaW5nID09PSBcIlwiKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICggaWQgPCAwICkge1xyXG5cdFx0XHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHBhZ2UucmV2aXNpb25zWzBdLnJldmlkO1xyXG5cdFx0XHR9KTtcclxuXHRcdHZhciBvcmVzUHJvbWlzZSA9IGxhdGVzdFJldklkUHJvbWlzZS50aGVuKGZ1bmN0aW9uKGxhdGVzdFJldklkKSB7XHJcblx0XHRcdGlmICghbGF0ZXN0UmV2SWQpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIEFQSS5nZXRPUkVTKGxhdGVzdFJldklkKVxyXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0XHRcdFx0dmFyIGRhdGEgPSByZXN1bHQuZW53aWtpLnNjb3Jlc1tsYXRlc3RSZXZJZF0ud3AxMDtcclxuXHRcdFx0XHRcdGlmICggZGF0YS5lcnJvciApIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoZGF0YS5lcnJvci50eXBlLCBkYXRhLmVycm9yLm1lc3NhZ2UpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cmV0dXJuIGRhdGEuc2NvcmUucHJlZGljdGlvbjtcclxuXHRcdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0Ly8gT3BlbiB0aGUgbG9hZCBkaWFsb2dcclxuXHR2YXIgaXNPcGVuZWRQcm9taXNlID0gJC5EZWZlcnJlZCgpO1xyXG5cdHZhciBsb2FkRGlhbG9nV2luID0gd2luZG93TWFuYWdlci5vcGVuV2luZG93KFwibG9hZERpYWxvZ1wiLCB7XHJcblx0XHRwcm9taXNlczogW1xyXG5cdFx0XHRiYW5uZXJzUHJvbWlzZSxcclxuXHRcdFx0bG9hZFRhbGtQcm9taXNlLFxyXG5cdFx0XHRwYXJzZVRhbGtQcm9taXNlLFxyXG5cdFx0XHR0ZW1wbGF0ZURhdGFQcm9taXNlLFxyXG5cdFx0XHRyZWRpcmVjdENoZWNrUHJvbWlzZSxcclxuXHRcdFx0c2hvdWxkR2V0T3JlcyAmJiBvcmVzUHJvbWlzZVxyXG5cdFx0XSxcclxuXHRcdG9yZXM6IHNob3VsZEdldE9yZXMsXHJcblx0XHRpc09wZW5lZDogaXNPcGVuZWRQcm9taXNlXHJcblx0fSk7XHJcblxyXG5cdGxvYWREaWFsb2dXaW4ub3BlbmVkLnRoZW4oaXNPcGVuZWRQcm9taXNlLnJlc29sdmUpO1xyXG5cclxuXHJcblx0JC53aGVuKFxyXG5cdFx0bG9hZFRhbGtQcm9taXNlLFxyXG5cdFx0dGVtcGxhdGVEYXRhUHJvbWlzZSxcclxuXHRcdHJlZGlyZWN0Q2hlY2tQcm9taXNlLFxyXG5cdFx0c2hvdWxkR2V0T3JlcyAmJiBvcmVzUHJvbWlzZVxyXG5cdCkudGhlbihcclxuXHRcdC8vIEFsbCBzdWNjZWRlZFxyXG5cdFx0ZnVuY3Rpb24odGFsa1dpa2l0ZXh0LCBiYW5uZXJzLCByZWRpcmVjdFRhcmdldCwgb3Jlc1ByZWRpY2l0aW9uICkge1xyXG5cdFx0XHR2YXIgcmVzdWx0ID0ge1xyXG5cdFx0XHRcdHN1Y2Nlc3M6IHRydWUsXHJcblx0XHRcdFx0dGFsa3BhZ2U6IHRhbGtQYWdlLFxyXG5cdFx0XHRcdHRhbGtXaWtpdGV4dDogdGFsa1dpa2l0ZXh0LFxyXG5cdFx0XHRcdGJhbm5lcnM6IGJhbm5lcnNcclxuXHRcdFx0fTtcclxuXHRcdFx0aWYgKHJlZGlyZWN0VGFyZ2V0KSB7XHJcblx0XHRcdFx0cmVzdWx0LnJlZGlyZWN0VGFyZ2V0ID0gcmVkaXJlY3RUYXJnZXQ7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKG9yZXNQcmVkaWNpdGlvbikge1xyXG5cdFx0XHRcdHJlc3VsdC5vcmVzUHJlZGljaXRpb24gPSBvcmVzUHJlZGljaXRpb247XHJcblx0XHRcdH1cclxuXHRcdFx0d2luZG93TWFuYWdlci5jbG9zZVdpbmRvdyhcImxvYWREaWFsb2dcIiwgcmVzdWx0KTtcclxuXHRcdFx0XHJcblx0XHR9XHJcblx0KTsgLy8gQW55IGZhaWx1cmVzIGFyZSBoYW5kbGVkIGJ5IHRoZSBsb2FkRGlhbG9nIHdpbmRvdyBpdHNlbGZcclxuXHJcblx0Ly8gT24gd2luZG93IGNsb3NlZCwgY2hlY2sgZGF0YSwgYW5kIHJlc29sdmUvcmVqZWN0IHNldHVwQ29tcGxldGVkUHJvbWlzZVxyXG5cdGxvYWREaWFsb2dXaW4uY2xvc2VkLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0aWYgKGRhdGEgJiYgZGF0YS5zdWNjZXNzKSB7XHJcblx0XHRcdC8vIEdvdCBldmVyeXRoaW5nIG5lZWRlZDogUmVzb2x2ZSBwcm9taXNlIHdpdGggdGhpcyBkYXRhXHJcblx0XHRcdHNldHVwQ29tcGxldGVkUHJvbWlzZS5yZXNvbHZlKGRhdGEpO1xyXG5cdFx0fSBlbHNlIGlmIChkYXRhICYmIGRhdGEuZXJyb3IpIHtcclxuXHRcdFx0Ly8gVGhlcmUgd2FzIGFuIGVycm9yOiBSZWplY3QgcHJvbWlzZSB3aXRoIGVycm9yIGNvZGUvaW5mb1xyXG5cdFx0XHRzZXR1cENvbXBsZXRlZFByb21pc2UucmVqZWN0KGRhdGEuZXJyb3IuY29kZSwgZGF0YS5lcnJvci5pbmZvKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdC8vIFdpbmRvdyBjbG9zZWQgYmVmb3JlIGNvbXBsZXRpb246IHJlc29sdmUgcHJvbWlzZSB3aXRob3V0IGFueSBkYXRhXHJcblx0XHRcdHNldHVwQ29tcGxldGVkUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xyXG5cdFx0fVxyXG5cdFx0Y2FjaGUuY2xlYXJJbnZhbGlkSXRlbXMoKTtcclxuXHR9KTtcclxuXHJcblx0Ly8gVEVTVElORyBwdXJwb3NlcyBvbmx5OiBsb2cgcGFzc2VkIGRhdGEgdG8gY29uc29sZVxyXG5cdHNldHVwQ29tcGxldGVkUHJvbWlzZS50aGVuKFxyXG5cdFx0ZGF0YSA9PiBjb25zb2xlLmxvZyhcInNldHVwIHdpbmRvdyBjbG9zZWRcIiwgZGF0YSksXHJcblx0XHQoY29kZSwgaW5mbykgPT4gY29uc29sZS5sb2coXCJzZXR1cCB3aW5kb3cgY2xvc2VkIHdpdGggZXJyb3JcIiwge2NvZGUsIGluZm99KVxyXG5cdCk7XHJcblxyXG5cdHJldHVybiBzZXR1cENvbXBsZXRlZFByb21pc2U7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzZXR1cFJhdGVyOyIsIi8vIFZhcmlvdXMgdXRpbGl0eSBmdW5jdGlvbnMgYW5kIG9iamVjdHMgdGhhdCBtaWdodCBiZSB1c2VkIGluIG11bHRpcGxlIHBsYWNlc1xyXG5cclxuaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuXHJcbnZhciBpc0FmdGVyRGF0ZSA9IGZ1bmN0aW9uKGRhdGVTdHJpbmcpIHtcclxuXHRyZXR1cm4gbmV3IERhdGUoZGF0ZVN0cmluZykgPCBuZXcgRGF0ZSgpO1xyXG59O1xyXG5cclxudmFyIEFQSSA9IG5ldyBtdy5BcGkoIHtcclxuXHRhamF4OiB7XHJcblx0XHRoZWFkZXJzOiB7IFxyXG5cdFx0XHRcIkFwaS1Vc2VyLUFnZW50XCI6IFwiUmF0ZXIvXCIgKyBjb25maWcuc2NyaXB0LnZlcnNpb24gKyBcclxuXHRcdFx0XHRcIiAoIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1VzZXI6RXZhZDM3L1JhdGVyIClcIlxyXG5cdFx0fVxyXG5cdH1cclxufSApO1xyXG4vKiAtLS0tLS0tLS0tIEFQSSBmb3IgT1JFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXHJcbkFQSS5nZXRPUkVTID0gZnVuY3Rpb24ocmV2aXNpb25JRCkge1xyXG5cdHJldHVybiAkLmdldChcImh0dHBzOi8vb3Jlcy53aWtpbWVkaWEub3JnL3YzL3Njb3Jlcy9lbndpa2k/bW9kZWxzPXdwMTAmcmV2aWRzPVwiK3JldmlzaW9uSUQpO1xyXG59O1xyXG4vKiAtLS0tLS0tLS0tIFJhdyB3aWtpdGV4dCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXHJcbkFQSS5nZXRSYXcgPSBmdW5jdGlvbihwYWdlKSB7XHJcblx0cmV0dXJuICQuZ2V0KFwiaHR0cHM6XCIgKyBjb25maWcubXcud2dTZXJ2ZXIgKyBtdy51dGlsLmdldFVybChwYWdlLCB7YWN0aW9uOlwicmF3XCJ9KSlcclxuXHRcdC50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdFx0aWYgKCAhZGF0YSApIHtcclxuXHRcdFx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdChcIm9rLWJ1dC1lbXB0eVwiKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gZGF0YTtcclxuXHRcdH0pO1xyXG59O1xyXG5cclxudmFyIG1ha2VFcnJvck1zZyA9IGZ1bmN0aW9uKGZpcnN0LCBzZWNvbmQpIHtcclxuXHR2YXIgY29kZSwgeGhyLCBtZXNzYWdlO1xyXG5cdGlmICggdHlwZW9mIGZpcnN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBzZWNvbmQgPT09IFwic3RyaW5nXCIgKSB7XHJcblx0XHQvLyBFcnJvcnMgZnJvbSAkLmdldCBiZWluZyByZWplY3RlZCAoT1JFUyAmIFJhdyB3aWtpdGV4dClcclxuXHRcdHZhciBlcnJvck9iaiA9IGZpcnN0LnJlc3BvbnNlSlNPTiAmJiBmaXJzdC5yZXNwb25zZUpTT04uZXJyb3I7XHJcblx0XHRpZiAoIGVycm9yT2JqICkge1xyXG5cdFx0XHQvLyBHb3QgYW4gYXBpLXNwZWNpZmljIGVycm9yIGNvZGUvbWVzc2FnZVxyXG5cdFx0XHRjb2RlID0gZXJyb3JPYmouY29kZTtcclxuXHRcdFx0bWVzc2FnZSA9IGVycm9yT2JqLm1lc3NhZ2U7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR4aHIgPSBmaXJzdDtcclxuXHRcdH1cclxuXHR9IGVsc2UgaWYgKCB0eXBlb2YgZmlyc3QgPT09IFwic3RyaW5nXCIgJiYgdHlwZW9mIHNlY29uZCA9PT0gXCJvYmplY3RcIiApIHtcclxuXHRcdC8vIEVycm9ycyBmcm9tIG13LkFwaSBvYmplY3RcclxuXHRcdHZhciBtd0Vycm9yT2JqID0gc2Vjb25kLmVycm9yO1xyXG5cdFx0aWYgKG13RXJyb3JPYmopIHtcclxuXHRcdFx0Ly8gR290IGFuIGFwaS1zcGVjaWZpYyBlcnJvciBjb2RlL21lc3NhZ2VcclxuXHRcdFx0Y29kZSA9IGVycm9yT2JqLmNvZGU7XHJcblx0XHRcdG1lc3NhZ2UgPSBlcnJvck9iai5pbmZvO1xyXG5cdFx0fSBlbHNlIGlmIChmaXJzdCA9PT0gXCJvay1idXQtZW1wdHlcIikge1xyXG5cdFx0XHRjb2RlID0gbnVsbDtcclxuXHRcdFx0bWVzc2FnZSA9IFwiR290IGFuIGVtcHR5IHJlc3BvbnNlIGZyb20gdGhlIHNlcnZlclwiO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0eGhyID0gc2Vjb25kICYmIHNlY29uZC54aHI7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRpZiAoY29kZSAmJiBtZXNzYWdlKSB7XHJcblx0XHRyZXR1cm4gYEFQSSBlcnJvciAke2NvZGV9OiAke21lc3NhZ2V9YDtcclxuXHR9IGVsc2UgaWYgKG1lc3NhZ2UpIHtcclxuXHRcdHJldHVybiBgQVBJIGVycm9yOiAke21lc3NhZ2V9YDtcclxuXHR9IGVsc2UgaWYgKHhocikge1xyXG5cdFx0cmV0dXJuIGBIVFRQIGVycm9yICR7eGhyLnN0YXR1c31gO1xyXG5cdH0gZWxzZSBpZiAoXHJcblx0XHR0eXBlb2YgZmlyc3QgPT09IFwic3RyaW5nXCIgJiYgZmlyc3QgIT09IFwiZXJyb3JcIiAmJlxyXG5cdFx0dHlwZW9mIHNlY29uZCA9PT0gXCJzdHJpbmdcIiAmJiBzZWNvbmQgIT09IFwiZXJyb3JcIlxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIGBFcnJvciAke2ZpcnN0fTogJHtzZWNvbmR9YDtcclxuXHR9IGVsc2UgaWYgKHR5cGVvZiBmaXJzdCA9PT0gXCJzdHJpbmdcIiAmJiBmaXJzdCAhPT0gXCJlcnJvclwiKSB7XHJcblx0XHRyZXR1cm4gYEVycm9yOiAke2ZpcnN0fWA7XHJcblx0fSBlbHNlIHtcclxuXHRcdHJldHVybiBcIlVua25vd24gQVBJIGVycm9yXCI7XHJcblx0fVxyXG59O1xyXG5cclxuZXhwb3J0IHtpc0FmdGVyRGF0ZSwgQVBJLCBtYWtlRXJyb3JNc2d9OyIsImltcG9ydCBMb2FkRGlhbG9nIGZyb20gXCIuL1dpbmRvd3MvTG9hZERpYWxvZ1wiO1xyXG5pbXBvcnQgTWFpbldpbmRvdyBmcm9tIFwiLi9XaW5kb3dzL01haW5XaW5kb3dcIjtcclxuXHJcbnZhciBmYWN0b3J5ID0gbmV3IE9PLkZhY3RvcnkoKTtcclxuXHJcbi8vIFJlZ2lzdGVyIHdpbmRvdyBjb25zdHJ1Y3RvcnMgd2l0aCB0aGUgZmFjdG9yeS5cclxuZmFjdG9yeS5yZWdpc3RlcihMb2FkRGlhbG9nKTtcclxuZmFjdG9yeS5yZWdpc3RlcihNYWluV2luZG93KTtcclxuXHJcbnZhciBtYW5hZ2VyID0gbmV3IE9PLnVpLldpbmRvd01hbmFnZXIoIHtcclxuXHRcImZhY3RvcnlcIjogZmFjdG9yeVxyXG59ICk7XHJcbiQoIGRvY3VtZW50LmJvZHkgKS5hcHBlbmQoIG1hbmFnZXIuJGVsZW1lbnQgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IG1hbmFnZXI7Il19
