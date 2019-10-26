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
    if (data.ores) {
      _this2.setuptasks[5].toggle();
    }

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
  title: "Close (and discard any changes)",
  flags: "primary",
  label: new OO.ui.HtmlSnippet("Close <span style='font-weight:bold'>X</span>") // not using an icon since color becomes inverted, i.e. white on light-grey

}, // Safe (top left)
{
  label: "Help",
  action: "help",
  icon: "helpNotice",
  flags: "safe",
  title: "help" // no label, to mirror size of Close action

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
    framed: true,
    padded: true
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
    }]
  });
  this.addProjectButton = new OO.ui.ButtonWidget({
    label: "Add",
    icon: "add",
    title: "Add project",
    flags: "progressive"
  });
  this.topBar.$element.append(new OO.ui.ActionFieldLayout(this.searchBox, this.addProjectButton).$element); // FIXME: this is placeholder content

  this.content.$element.append("<p>(No project banners yet)</p>");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJyYXRlci1zcmMvQXBwLmpzIiwicmF0ZXItc3JjL1RlbXBsYXRlLmpzIiwicmF0ZXItc3JjL1dpbmRvd3MvTG9hZERpYWxvZy5qcyIsInJhdGVyLXNyYy9XaW5kb3dzL01haW5XaW5kb3cuanMiLCJyYXRlci1zcmMvYXV0b3N0YXJ0LmpzIiwicmF0ZXItc3JjL2NhY2hlLmpzIiwicmF0ZXItc3JjL2NvbmZpZy5qcyIsInJhdGVyLXNyYy9jc3MuanMiLCJyYXRlci1zcmMvZ2V0QmFubmVycy5qcyIsInJhdGVyLXNyYy9zZXR1cC5qcyIsInJhdGVyLXNyYy91dGlsLmpzIiwicmF0ZXItc3JjL3dpbmRvd01hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7O0FBRUEsQ0FBQyxTQUFTLEdBQVQsR0FBZTtBQUNmLEVBQUEsT0FBTyxDQUFDLEdBQVIsQ0FBWSw4QkFBWjtBQUVBLEVBQUEsRUFBRSxDQUFDLElBQUgsQ0FBUSxNQUFSLENBQWUsZUFBZjs7QUFFQSxNQUFNLGNBQWMsR0FBRyxTQUFqQixjQUFpQixDQUFBLElBQUksRUFBSTtBQUM5QixRQUFJLENBQUMsSUFBRCxJQUFTLENBQUMsSUFBSSxDQUFDLE9BQW5CLEVBQTRCO0FBQzNCO0FBQ0E7O0FBRUQsOEJBQWMsVUFBZCxDQUF5QixNQUF6QixFQUFpQyxJQUFqQztBQUNBLEdBTkQ7O0FBUUEsTUFBTSxjQUFjLEdBQUcsU0FBakIsY0FBaUIsQ0FBQyxJQUFELEVBQU8sS0FBUDtBQUFBLFdBQWlCLEVBQUUsQ0FBQyxFQUFILENBQU0sS0FBTixDQUN2Qyx3QkFBYSxJQUFiLEVBQW1CLEtBQW5CLENBRHVDLEVBQ1o7QUFDMUIsTUFBQSxLQUFLLEVBQUU7QUFEbUIsS0FEWSxDQUFqQjtBQUFBLEdBQXZCLENBYmUsQ0FtQmY7OztBQUNBLEVBQUEsRUFBRSxDQUFDLElBQUgsQ0FBUSxjQUFSLENBQ0MsWUFERCxFQUVDLEdBRkQsRUFHQyxPQUhELEVBSUMsVUFKRCxFQUtDLDZCQUxELEVBTUMsR0FORDtBQVFBLEVBQUEsQ0FBQyxDQUFDLFdBQUQsQ0FBRCxDQUFlLEtBQWYsQ0FBcUI7QUFBQSxXQUFNLHlCQUFhLElBQWIsQ0FBa0IsY0FBbEIsRUFBa0MsY0FBbEMsQ0FBTjtBQUFBLEdBQXJCLEVBNUJlLENBOEJmOztBQUNBLCtCQUFZLElBQVosQ0FBaUIsY0FBakI7QUFDQSxDQWhDRDs7Ozs7Ozs7OztBQ05BOztBQUNBOztBQUNBOzs7Ozs7OztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7QUFlQSxJQUFJLFFBQVEsR0FBRyxTQUFYLFFBQVcsQ0FBUyxRQUFULEVBQW1CO0FBQ2pDLE9BQUssUUFBTCxHQUFnQixRQUFoQjtBQUNBLE9BQUssVUFBTCxHQUFrQixFQUFsQjtBQUNBLENBSEQ7Ozs7QUFJQSxRQUFRLENBQUMsU0FBVCxDQUFtQixRQUFuQixHQUE4QixVQUFTLElBQVQsRUFBZSxHQUFmLEVBQW9CLFFBQXBCLEVBQThCO0FBQzNELE9BQUssVUFBTCxDQUFnQixJQUFoQixDQUFxQjtBQUNwQixZQUFRLElBRFk7QUFFcEIsYUFBUyxHQUZXO0FBR3BCLGdCQUFZLE1BQU07QUFIRSxHQUFyQjtBQUtBLENBTkQ7QUFPQTs7Ozs7QUFHQSxRQUFRLENBQUMsU0FBVCxDQUFtQixRQUFuQixHQUE4QixVQUFTLFNBQVQsRUFBb0I7QUFDakQsU0FBTyxLQUFLLFVBQUwsQ0FBZ0IsSUFBaEIsQ0FBcUIsVUFBUyxDQUFULEVBQVk7QUFBRSxXQUFPLENBQUMsQ0FBQyxJQUFGLElBQVUsU0FBakI7QUFBNkIsR0FBaEUsQ0FBUDtBQUNBLENBRkQ7O0FBR0EsUUFBUSxDQUFDLFNBQVQsQ0FBbUIsT0FBbkIsR0FBNkIsVUFBUyxJQUFULEVBQWU7QUFDM0MsT0FBSyxJQUFMLEdBQVksSUFBSSxDQUFDLElBQUwsRUFBWjtBQUNBLENBRkQ7O0FBR0EsUUFBUSxDQUFDLFNBQVQsQ0FBbUIsUUFBbkIsR0FBOEIsWUFBVztBQUN4QyxTQUFPLEVBQUUsQ0FBQyxLQUFILENBQVMsV0FBVCxDQUFxQixjQUFjLEtBQUssSUFBeEMsQ0FBUDtBQUNBLENBRkQ7QUFJQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTRDQSxJQUFJLGNBQWMsR0FBRyxTQUFqQixjQUFpQixDQUFTLFFBQVQsRUFBbUIsU0FBbkIsRUFBOEI7QUFBRTtBQUNwRCxNQUFJLENBQUMsUUFBTCxFQUFlO0FBQ2QsV0FBTyxFQUFQO0FBQ0E7O0FBQ0QsTUFBSSxZQUFZLEdBQUcsU0FBZixZQUFlLENBQVMsTUFBVCxFQUFpQixLQUFqQixFQUF3QixLQUF4QixFQUE4QjtBQUNoRCxXQUFPLE1BQU0sQ0FBQyxLQUFQLENBQWEsQ0FBYixFQUFlLEtBQWYsSUFBd0IsS0FBeEIsR0FBK0IsTUFBTSxDQUFDLEtBQVAsQ0FBYSxLQUFLLEdBQUcsQ0FBckIsQ0FBdEM7QUFDQSxHQUZEOztBQUlBLE1BQUksTUFBTSxHQUFHLEVBQWI7O0FBRUEsTUFBSSxtQkFBbUIsR0FBRyxTQUF0QixtQkFBc0IsQ0FBVSxRQUFWLEVBQW9CLE1BQXBCLEVBQTRCO0FBQ3JELFFBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxLQUFULENBQWUsUUFBZixFQUF5QixNQUF6QixDQUFYO0FBRUEsUUFBSSxRQUFRLEdBQUcsSUFBSSxRQUFKLENBQWEsT0FBTyxJQUFJLENBQUMsT0FBTCxDQUFhLE9BQWIsRUFBcUIsR0FBckIsQ0FBUCxHQUFtQyxJQUFoRCxDQUFmLENBSHFELENBS3JEO0FBQ0E7O0FBQ0EsV0FBUSw0QkFBNEIsSUFBNUIsQ0FBaUMsSUFBakMsQ0FBUixFQUFpRDtBQUNoRCxNQUFBLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTCxDQUFhLDJCQUFiLEVBQTBDLFVBQTFDLENBQVA7QUFDQTs7QUFFRCxRQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBTCxDQUFXLEdBQVgsRUFBZ0IsR0FBaEIsQ0FBb0IsVUFBUyxLQUFULEVBQWdCO0FBQ2hEO0FBQ0EsYUFBTyxLQUFLLENBQUMsT0FBTixDQUFjLE9BQWQsRUFBc0IsR0FBdEIsQ0FBUDtBQUNBLEtBSFksQ0FBYjtBQUtBLElBQUEsUUFBUSxDQUFDLE9BQVQsQ0FBaUIsTUFBTSxDQUFDLENBQUQsQ0FBdkI7QUFFQSxRQUFJLGVBQWUsR0FBRyxNQUFNLENBQUMsS0FBUCxDQUFhLENBQWIsQ0FBdEI7QUFFQSxRQUFJLFVBQVUsR0FBRyxDQUFqQjtBQUNBLElBQUEsZUFBZSxDQUFDLE9BQWhCLENBQXdCLFVBQVMsS0FBVCxFQUFnQjtBQUN2QyxVQUFJLGNBQWMsR0FBRyxLQUFLLENBQUMsT0FBTixDQUFjLEdBQWQsQ0FBckI7QUFDQSxVQUFJLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxPQUFOLENBQWMsSUFBZCxDQUF4QjtBQUVBLFVBQUksZUFBZSxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQU4sQ0FBZSxHQUFmLENBQXZCO0FBQ0EsVUFBSSxxQkFBcUIsR0FBRyxLQUFLLENBQUMsUUFBTixDQUFlLElBQWYsS0FBd0IsaUJBQWlCLEdBQUcsY0FBeEU7QUFDQSxVQUFJLGNBQWMsR0FBSyxlQUFlLElBQUkscUJBQTFDO0FBRUEsVUFBSSxLQUFKLEVBQVcsSUFBWCxFQUFpQixJQUFqQjs7QUFDQSxVQUFLLGNBQUwsRUFBc0I7QUFDckI7QUFDQTtBQUNBLGVBQVEsUUFBUSxDQUFDLFFBQVQsQ0FBa0IsVUFBbEIsQ0FBUixFQUF3QztBQUN2QyxVQUFBLFVBQVU7QUFDVjs7QUFDRCxRQUFBLElBQUksR0FBRyxVQUFQO0FBQ0EsUUFBQSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQU4sRUFBUDtBQUNBLE9BUkQsTUFRTztBQUNOLFFBQUEsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFOLENBQVksQ0FBWixFQUFlLGNBQWYsRUFBK0IsSUFBL0IsRUFBUjtBQUNBLFFBQUEsSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFOLENBQVksY0FBYyxHQUFHLENBQTdCLEVBQWdDLElBQWhDLEVBQVA7QUFDQTs7QUFDRCxNQUFBLFFBQVEsQ0FBQyxRQUFULENBQWtCLEtBQUssSUFBSSxJQUEzQixFQUFpQyxJQUFqQyxFQUF1QyxLQUF2QztBQUNBLEtBdEJEO0FBd0JBLElBQUEsTUFBTSxDQUFDLElBQVAsQ0FBWSxRQUFaO0FBQ0EsR0E5Q0Q7O0FBaURBLE1BQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFqQixDQTNEa0QsQ0E2RGxEOztBQUNBLE1BQUksV0FBVyxHQUFHLENBQWxCLENBOURrRCxDQWdFbEQ7O0FBQ0EsTUFBSSxTQUFTLEdBQUcsS0FBaEI7QUFDQSxNQUFJLFFBQVEsR0FBRyxLQUFmO0FBRUEsTUFBSSxRQUFKLEVBQWMsTUFBZDs7QUFFQSxPQUFLLElBQUksQ0FBQyxHQUFDLENBQVgsRUFBYyxDQUFDLEdBQUMsQ0FBaEIsRUFBbUIsQ0FBQyxFQUFwQixFQUF3QjtBQUV2QixRQUFLLENBQUMsU0FBRCxJQUFjLENBQUMsUUFBcEIsRUFBK0I7QUFFOUIsVUFBSSxRQUFRLENBQUMsQ0FBRCxDQUFSLEtBQWdCLEdBQWhCLElBQXVCLFFBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBSCxDQUFSLEtBQWtCLEdBQTdDLEVBQWtEO0FBQ2pELFlBQUksV0FBVyxLQUFLLENBQXBCLEVBQXVCO0FBQ3RCLFVBQUEsUUFBUSxHQUFHLENBQUMsR0FBQyxDQUFiO0FBQ0E7O0FBQ0QsUUFBQSxXQUFXLElBQUksQ0FBZjtBQUNBLFFBQUEsQ0FBQztBQUNELE9BTkQsTUFNTyxJQUFJLFFBQVEsQ0FBQyxDQUFELENBQVIsS0FBZ0IsR0FBaEIsSUFBdUIsUUFBUSxDQUFDLENBQUMsR0FBQyxDQUFILENBQVIsS0FBa0IsR0FBN0MsRUFBa0Q7QUFDeEQsWUFBSSxXQUFXLEtBQUssQ0FBcEIsRUFBdUI7QUFDdEIsVUFBQSxNQUFNLEdBQUcsQ0FBVDtBQUNBLFVBQUEsbUJBQW1CLENBQUMsUUFBRCxFQUFXLE1BQVgsQ0FBbkI7QUFDQTs7QUFDRCxRQUFBLFdBQVcsSUFBSSxDQUFmO0FBQ0EsUUFBQSxDQUFDO0FBQ0QsT0FQTSxNQU9BLElBQUksUUFBUSxDQUFDLENBQUQsQ0FBUixLQUFnQixHQUFoQixJQUF1QixXQUFXLEdBQUcsQ0FBekMsRUFBNEM7QUFDbEQ7QUFDQSxRQUFBLFFBQVEsR0FBRyxZQUFZLENBQUMsUUFBRCxFQUFXLENBQVgsRUFBYSxNQUFiLENBQXZCO0FBQ0EsT0FITSxNQUdBLElBQUssUUFBUSxJQUFSLENBQWEsUUFBUSxDQUFDLEtBQVQsQ0FBZSxDQUFmLEVBQWtCLENBQUMsR0FBRyxDQUF0QixDQUFiLENBQUwsRUFBOEM7QUFDcEQsUUFBQSxTQUFTLEdBQUcsSUFBWjtBQUNBLFFBQUEsQ0FBQyxJQUFJLENBQUw7QUFDQSxPQUhNLE1BR0EsSUFBSyxjQUFjLElBQWQsQ0FBbUIsUUFBUSxDQUFDLEtBQVQsQ0FBZSxDQUFmLEVBQWtCLENBQUMsR0FBRyxDQUF0QixDQUFuQixDQUFMLEVBQW9EO0FBQzFELFFBQUEsUUFBUSxHQUFHLElBQVg7QUFDQSxRQUFBLENBQUMsSUFBSSxDQUFMO0FBQ0E7QUFFRCxLQTFCRCxNQTBCTztBQUFFO0FBQ1IsVUFBSSxRQUFRLENBQUMsQ0FBRCxDQUFSLEtBQWdCLEdBQXBCLEVBQXlCO0FBQ3hCO0FBQ0EsUUFBQSxRQUFRLEdBQUcsWUFBWSxDQUFDLFFBQUQsRUFBVyxDQUFYLEVBQWEsTUFBYixDQUF2QjtBQUNBLE9BSEQsTUFHTyxJQUFJLE9BQU8sSUFBUCxDQUFZLFFBQVEsQ0FBQyxLQUFULENBQWUsQ0FBZixFQUFrQixDQUFDLEdBQUcsQ0FBdEIsQ0FBWixDQUFKLEVBQTJDO0FBQ2pELFFBQUEsU0FBUyxHQUFHLEtBQVo7QUFDQSxRQUFBLENBQUMsSUFBSSxDQUFMO0FBQ0EsT0FITSxNQUdBLElBQUksZ0JBQWdCLElBQWhCLENBQXFCLFFBQVEsQ0FBQyxLQUFULENBQWUsQ0FBZixFQUFrQixDQUFDLEdBQUcsRUFBdEIsQ0FBckIsQ0FBSixFQUFxRDtBQUMzRCxRQUFBLFFBQVEsR0FBRyxLQUFYO0FBQ0EsUUFBQSxDQUFDLElBQUksQ0FBTDtBQUNBO0FBQ0Q7QUFFRDs7QUFFRCxNQUFLLFNBQUwsRUFBaUI7QUFDaEIsUUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDLEdBQVAsQ0FBVyxVQUFTLFFBQVQsRUFBbUI7QUFDaEQsYUFBTyxRQUFRLENBQUMsUUFBVCxDQUFrQixLQUFsQixDQUF3QixDQUF4QixFQUEwQixDQUFDLENBQTNCLENBQVA7QUFDQSxLQUZrQixFQUdqQixNQUhpQixDQUdWLFVBQVMsZ0JBQVQsRUFBMkI7QUFDbEMsYUFBTyxhQUFhLElBQWIsQ0FBa0IsZ0JBQWxCLENBQVA7QUFDQSxLQUxpQixFQU1qQixHQU5pQixDQU1iLFVBQVMsZ0JBQVQsRUFBMkI7QUFDL0IsYUFBTyxjQUFjLENBQUMsZ0JBQUQsRUFBbUIsSUFBbkIsQ0FBckI7QUFDQSxLQVJpQixDQUFuQjtBQVVBLFdBQU8sTUFBTSxDQUFDLE1BQVAsQ0FBYyxLQUFkLENBQW9CLE1BQXBCLEVBQTRCLFlBQTVCLENBQVA7QUFDQTs7QUFFRCxTQUFPLE1BQVA7QUFDQSxDQWhJRDtBQWdJRzs7QUFFSDs7Ozs7Ozs7QUFJQSxJQUFJLGlCQUFpQixHQUFHLFNBQXBCLGlCQUFvQixDQUFTLFNBQVQsRUFBb0I7QUFDM0MsTUFBSSxjQUFjLEdBQUcsS0FBSyxDQUFDLE9BQU4sQ0FBYyxTQUFkLElBQTJCLFNBQTNCLEdBQXVDLENBQUMsU0FBRCxDQUE1RDs7QUFDQSxNQUFJLGNBQWMsQ0FBQyxNQUFmLEtBQTBCLENBQTlCLEVBQWlDO0FBQ2hDLFdBQU8sQ0FBQyxDQUFDLFFBQUYsR0FBYSxPQUFiLENBQXFCLEVBQXJCLENBQVA7QUFDQTs7QUFFRCxTQUFPLFVBQUksR0FBSixDQUFRO0FBQ2QsY0FBVSxPQURJO0FBRWQsY0FBVSxNQUZJO0FBR2QsY0FBVSxjQUFjLENBQUMsR0FBZixDQUFtQixVQUFBLFFBQVE7QUFBQSxhQUFJLFFBQVEsQ0FBQyxRQUFULEdBQW9CLGVBQXBCLEVBQUo7QUFBQSxLQUEzQixDQUhJO0FBSWQsaUJBQWE7QUFKQyxHQUFSLEVBS0osSUFMSSxDQUtDLFVBQVMsTUFBVCxFQUFpQjtBQUN4QixRQUFLLENBQUMsTUFBRCxJQUFXLENBQUMsTUFBTSxDQUFDLEtBQXhCLEVBQWdDO0FBQy9CLGFBQU8sQ0FBQyxDQUFDLFFBQUYsR0FBYSxNQUFiLENBQW9CLGdCQUFwQixDQUFQO0FBQ0E7O0FBQ0QsUUFBSyxNQUFNLENBQUMsS0FBUCxDQUFhLFNBQWxCLEVBQThCO0FBQzdCLE1BQUEsTUFBTSxDQUFDLEtBQVAsQ0FBYSxTQUFiLENBQXVCLE9BQXZCLENBQStCLFVBQVMsUUFBVCxFQUFtQjtBQUNqRCxZQUFJLENBQUMsR0FBRyxjQUFjLENBQUMsU0FBZixDQUF5QixVQUFBLFFBQVE7QUFBQSxpQkFBSSxRQUFRLENBQUMsUUFBVCxHQUFvQixlQUFwQixPQUEwQyxRQUFRLENBQUMsSUFBdkQ7QUFBQSxTQUFqQyxDQUFSOztBQUNBLFlBQUksQ0FBQyxLQUFLLENBQUMsQ0FBWCxFQUFjO0FBQ2IsVUFBQSxjQUFjLENBQUMsQ0FBRCxDQUFkLENBQWtCLFdBQWxCLEdBQWdDLEVBQUUsQ0FBQyxLQUFILENBQVMsV0FBVCxDQUFxQixRQUFRLENBQUMsRUFBOUIsQ0FBaEM7QUFDQTtBQUNELE9BTEQ7QUFNQTs7QUFDRCxXQUFPLGNBQVA7QUFDQSxHQWxCTSxDQUFQO0FBbUJBLENBekJEOzs7O0FBMkJBLFFBQVEsQ0FBQyxTQUFULENBQW1CLGVBQW5CLEdBQXFDLFVBQVMsR0FBVCxFQUFjLFFBQWQsRUFBd0I7QUFDNUQsTUFBSyxDQUFDLEtBQUssU0FBWCxFQUF1QjtBQUN0QixXQUFPLElBQVA7QUFDQSxHQUgyRCxDQUk1RDs7O0FBQ0EsTUFBSSxJQUFJLEdBQUcsS0FBSyxZQUFMLENBQWtCLFFBQWxCLEtBQStCLFFBQTFDOztBQUNBLE1BQUssQ0FBQyxLQUFLLFNBQUwsQ0FBZSxJQUFmLENBQU4sRUFBNkI7QUFDNUI7QUFDQTs7QUFFRCxNQUFJLElBQUksR0FBRyxLQUFLLFNBQUwsQ0FBZSxJQUFmLEVBQXFCLEdBQXJCLENBQVgsQ0FWNEQsQ0FXNUQ7O0FBQ0EsTUFBSyxJQUFJLElBQUksSUFBSSxDQUFDLEVBQWIsSUFBbUIsQ0FBQyxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQsQ0FBekIsRUFBK0M7QUFDOUMsV0FBTyxJQUFJLENBQUMsRUFBWjtBQUNBOztBQUNELFNBQU8sSUFBUDtBQUNBLENBaEJEOztBQWtCQSxRQUFRLENBQUMsU0FBVCxDQUFtQiwwQkFBbkIsR0FBZ0QsWUFBVztBQUMxRCxNQUFJLElBQUksR0FBRyxJQUFYO0FBQ0EsTUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDLFFBQUYsRUFBbkI7O0FBRUEsTUFBSyxJQUFJLENBQUMsU0FBVixFQUFzQjtBQUFFLFdBQU8sWUFBWSxDQUFDLE9BQWIsRUFBUDtBQUFnQzs7QUFFeEQsTUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLFdBQUwsR0FDaEIsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsZUFBakIsRUFEZ0IsR0FFaEIsSUFBSSxDQUFDLFFBQUwsR0FBZ0IsZUFBaEIsRUFGSDtBQUlBLE1BQUksVUFBVSxHQUFHLEtBQUssQ0FBQyxJQUFOLENBQVcsWUFBWSxHQUFHLFNBQTFCLENBQWpCOztBQUVBLE1BQ0MsVUFBVSxJQUNWLFVBQVUsQ0FBQyxLQURYLElBRUEsVUFBVSxDQUFDLFNBRlgsSUFHQSxVQUFVLENBQUMsS0FBWCxDQUFpQixTQUFqQixJQUE4QixJQUg5QixJQUlBLFVBQVUsQ0FBQyxLQUFYLENBQWlCLG9CQUFqQixJQUF5QyxJQUp6QyxJQUtBLFVBQVUsQ0FBQyxLQUFYLENBQWlCLFlBQWpCLElBQWlDLElBTmxDLEVBT0U7QUFDRCxJQUFBLElBQUksQ0FBQyxjQUFMLEdBQXNCLFVBQVUsQ0FBQyxLQUFYLENBQWlCLGNBQXZDO0FBQ0EsSUFBQSxJQUFJLENBQUMsU0FBTCxHQUFpQixVQUFVLENBQUMsS0FBWCxDQUFpQixTQUFsQztBQUNBLElBQUEsSUFBSSxDQUFDLG9CQUFMLEdBQTRCLFVBQVUsQ0FBQyxLQUFYLENBQWlCLG9CQUE3QztBQUNBLElBQUEsSUFBSSxDQUFDLFlBQUwsR0FBb0IsVUFBVSxDQUFDLEtBQVgsQ0FBaUIsWUFBckM7QUFFQSxJQUFBLFlBQVksQ0FBQyxPQUFiOztBQUNBLFFBQUssQ0FBQyx1QkFBWSxVQUFVLENBQUMsU0FBdkIsQ0FBTixFQUEwQztBQUN6QztBQUNBLGFBQU8sWUFBUDtBQUNBLEtBVkEsQ0FVQzs7QUFDRjs7QUFFRCxZQUFJLEdBQUosQ0FBUTtBQUNQLElBQUEsTUFBTSxFQUFFLGNBREQ7QUFFUCxJQUFBLE1BQU0sRUFBRSxZQUZEO0FBR1AsSUFBQSxTQUFTLEVBQUUsQ0FISjtBQUlQLElBQUEsb0JBQW9CLEVBQUU7QUFKZixHQUFSLEVBTUUsSUFORixDQU9FLFVBQVMsUUFBVCxFQUFtQjtBQUFFLFdBQU8sUUFBUDtBQUFrQixHQVB6QyxFQVFFO0FBQVM7QUFBVztBQUFFLFdBQU8sSUFBUDtBQUFjLEdBUnRDLENBUXVDO0FBUnZDLElBVUUsSUFWRixDQVVRLFVBQVMsTUFBVCxFQUFpQjtBQUN4QjtBQUNDLFFBQUksRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRixDQUFNLE1BQU0sQ0FBQyxLQUFiLEVBQW9CLFVBQVUsTUFBVixFQUFrQixHQUFsQixFQUF3QjtBQUFFLGFBQU8sR0FBUDtBQUFhLEtBQTNELENBQW5COztBQUVBLFFBQUssQ0FBQyxNQUFELElBQVcsQ0FBQyxNQUFNLENBQUMsS0FBUCxDQUFhLEVBQWIsQ0FBWixJQUFnQyxNQUFNLENBQUMsS0FBUCxDQUFhLEVBQWIsRUFBaUIsY0FBakQsSUFBbUUsQ0FBQyxNQUFNLENBQUMsS0FBUCxDQUFhLEVBQWIsRUFBaUIsTUFBMUYsRUFBbUc7QUFDbkc7QUFDQyxNQUFBLElBQUksQ0FBQyxjQUFMLEdBQXNCLElBQXRCO0FBQ0EsTUFBQSxJQUFJLENBQUMsb0JBQUwsR0FBNEIsQ0FBQyxNQUE3QjtBQUNBLE1BQUEsSUFBSSxDQUFDLFNBQUwsR0FBaUIsbUJBQU8sb0JBQXhCO0FBQ0EsS0FMRCxNQUtPO0FBQ04sTUFBQSxJQUFJLENBQUMsU0FBTCxHQUFpQixNQUFNLENBQUMsS0FBUCxDQUFhLEVBQWIsRUFBaUIsTUFBbEM7QUFDQTs7QUFFRCxJQUFBLElBQUksQ0FBQyxZQUFMLEdBQW9CLEVBQXBCO0FBQ0EsSUFBQSxDQUFDLENBQUMsSUFBRixDQUFPLElBQUksQ0FBQyxTQUFaLEVBQXVCLFVBQVMsUUFBVCxFQUFtQixRQUFuQixFQUE2QjtBQUNuRDtBQUNBLFVBQUssUUFBUSxDQUFDLE9BQVQsSUFBb0IsUUFBUSxDQUFDLE9BQVQsQ0FBaUIsTUFBMUMsRUFBbUQ7QUFDbEQsUUFBQSxRQUFRLENBQUMsT0FBVCxDQUFpQixPQUFqQixDQUF5QixVQUFTLEtBQVQsRUFBZTtBQUN2QyxVQUFBLElBQUksQ0FBQyxZQUFMLENBQWtCLEtBQWxCLElBQTJCLFFBQTNCO0FBQ0EsU0FGRDtBQUdBLE9BTmtELENBT25EOzs7QUFDQSxVQUFLLFFBQVEsQ0FBQyxXQUFULElBQXdCLGlCQUFpQixJQUFqQixDQUFzQixRQUFRLENBQUMsV0FBVCxDQUFxQixFQUEzQyxDQUE3QixFQUE4RTtBQUM3RSxZQUFJO0FBQ0gsY0FBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUwsQ0FDakIsUUFBUSxDQUFDLFdBQVQsQ0FBcUIsRUFBckIsQ0FDRSxPQURGLENBQ1UsT0FEVixFQUNrQixHQURsQixFQUVFLE9BRkYsQ0FFVSxJQUZWLEVBRWdCLE1BRmhCLEVBR0UsT0FIRixDQUdVLElBSFYsRUFHZ0IsSUFIaEIsRUFJRSxPQUpGLENBSVUsT0FKVixFQUltQixHQUpuQixFQUtFLE9BTEYsQ0FLVSxNQUxWLEVBS2tCLEdBTGxCLENBRGlCLENBQWxCO0FBUUEsVUFBQSxJQUFJLENBQUMsU0FBTCxDQUFlLFFBQWYsRUFBeUIsYUFBekIsR0FBeUMsV0FBekM7QUFDQSxTQVZELENBVUUsT0FBTSxDQUFOLEVBQVM7QUFDVixVQUFBLE9BQU8sQ0FBQyxJQUFSLENBQWEsK0RBQ2QsUUFBUSxDQUFDLFdBQVQsQ0FBcUIsRUFEUCxHQUNZLHVDQURaLEdBQ3NELFFBRHRELEdBRWQsT0FGYyxHQUVKLElBQUksQ0FBQyxRQUFMLEdBQWdCLGVBQWhCLEVBRlQ7QUFHQTtBQUNELE9BeEJrRCxDQXlCbkQ7OztBQUNBLFVBQUssQ0FBQyxRQUFRLENBQUMsUUFBVCxJQUFxQixRQUFRLENBQUMsU0FBL0IsS0FBNkMsQ0FBQyxJQUFJLENBQUMsUUFBTCxDQUFjLFFBQWQsQ0FBbkQsRUFBNkU7QUFDN0U7QUFDQyxZQUFLLFFBQVEsQ0FBQyxPQUFULENBQWlCLE1BQXRCLEVBQStCO0FBQzlCLGNBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFMLENBQWdCLE1BQWhCLENBQXVCLFVBQUEsQ0FBQyxFQUFJO0FBQ3pDLGdCQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsT0FBVCxDQUFpQixRQUFqQixDQUEwQixDQUFDLENBQUMsSUFBNUIsQ0FBZDtBQUNBLGdCQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFqQjtBQUNBLG1CQUFPLE9BQU8sSUFBSSxDQUFDLE9BQW5CO0FBQ0EsV0FKYSxDQUFkOztBQUtBLGNBQUssT0FBTyxDQUFDLE1BQWIsRUFBc0I7QUFDdEI7QUFDQztBQUNBO0FBQ0QsU0FaMkUsQ0FhNUU7QUFDQTs7O0FBQ0EsUUFBQSxJQUFJLENBQUMsVUFBTCxDQUFnQixJQUFoQixDQUFxQjtBQUNwQixVQUFBLElBQUksRUFBQyxRQURlO0FBRXBCLFVBQUEsS0FBSyxFQUFFLFFBQVEsQ0FBQyxTQUFULElBQXNCLEVBRlQ7QUFHcEIsVUFBQSxVQUFVLEVBQUU7QUFIUSxTQUFyQjtBQUtBO0FBQ0QsS0EvQ0QsRUFkdUIsQ0ErRHZCOztBQUNBLFFBQUksY0FBYyxHQUFLLENBQUMsSUFBSSxDQUFDLGNBQU4sSUFBd0IsTUFBTSxDQUFDLEtBQVAsQ0FBYSxFQUFiLEVBQWlCLFVBQTNDLElBQ3JCLENBQUMsQ0FBQyxHQUFGLENBQU0sSUFBSSxDQUFDLFNBQVgsRUFBc0IsVUFBUyxJQUFULEVBQWUsR0FBZixFQUFtQjtBQUN4QyxhQUFPLEdBQVA7QUFDQSxLQUZELENBREE7QUFJQSxJQUFBLElBQUksQ0FBQyxvQkFBTCxHQUE0QixjQUFjLENBQUMsTUFBZixDQUFzQixVQUFTLFNBQVQsRUFBb0I7QUFDckUsYUFBUyxTQUFTLElBQUksU0FBUyxLQUFLLE9BQTNCLElBQXNDLFNBQVMsS0FBSyxZQUE3RDtBQUNBLEtBRjJCLEVBRzFCLEdBSDBCLENBR3RCLFVBQVMsU0FBVCxFQUFvQjtBQUN4QixVQUFJLFlBQVksR0FBRztBQUFDLFFBQUEsSUFBSSxFQUFFO0FBQVAsT0FBbkI7QUFDQSxVQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsZUFBTCxDQUFxQixLQUFyQixFQUE0QixTQUE1QixDQUFaOztBQUNBLFVBQUssS0FBTCxFQUFhO0FBQ1osUUFBQSxZQUFZLENBQUMsS0FBYixHQUFxQixLQUFLLEdBQUcsS0FBUixHQUFnQixTQUFoQixHQUE0QixJQUFqRDtBQUNBOztBQUNELGFBQU8sWUFBUDtBQUNBLEtBVjBCLENBQTVCOztBQVlBLFFBQUssSUFBSSxDQUFDLG9CQUFWLEVBQWlDO0FBQ2hDO0FBQ0EsYUFBTyxJQUFQO0FBQ0E7O0FBRUQsSUFBQSxLQUFLLENBQUMsS0FBTixDQUFZLFlBQVksR0FBRyxTQUEzQixFQUFzQztBQUNyQyxNQUFBLGNBQWMsRUFBRSxJQUFJLENBQUMsY0FEZ0I7QUFFckMsTUFBQSxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBRnFCO0FBR3JDLE1BQUEsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLG9CQUhVO0FBSXJDLE1BQUEsWUFBWSxFQUFFLElBQUksQ0FBQztBQUprQixLQUF0QyxFQUtHLENBTEg7QUFPQSxXQUFPLElBQVA7QUFDQSxHQXZHRixFQXdHRSxJQXhHRixDQXlHRSxZQUFZLENBQUMsT0F6R2YsRUEwR0UsWUFBWSxDQUFDLE1BMUdmOztBQTZHQSxTQUFPLFlBQVA7QUFDQSxDQTlJRDs7Ozs7Ozs7OztBQzFRQTs7Ozs7Ozs7OztBQUVBOzs7Ozs7Ozs7OztBQVlBLElBQUksVUFBVSxHQUFHLFNBQVMsVUFBVCxDQUFxQixNQUFyQixFQUE4QjtBQUM5QyxFQUFBLFVBQVUsU0FBVixDQUFpQixJQUFqQixDQUF1QixJQUF2QixFQUE2QixNQUE3QjtBQUNBLENBRkQ7O0FBR0EsRUFBRSxDQUFDLFlBQUgsQ0FBaUIsVUFBakIsRUFBNkIsRUFBRSxDQUFDLEVBQUgsQ0FBTSxNQUFuQztBQUVBLFVBQVUsVUFBVixDQUFrQixJQUFsQixHQUF5QixZQUF6QjtBQUNBLFVBQVUsVUFBVixDQUFrQixLQUFsQixHQUEwQixrQkFBMUIsQyxDQUVBOztBQUNBLFVBQVUsQ0FBQyxTQUFYLENBQXFCLFVBQXJCLEdBQWtDLFlBQVk7QUFBQTs7QUFDN0M7QUFDQSxFQUFBLFVBQVUsU0FBVixDQUFpQixTQUFqQixDQUEyQixVQUEzQixDQUFzQyxJQUF0QyxDQUE0QyxJQUE1QyxFQUY2QyxDQUc3Qzs7QUFDQSxPQUFLLE9BQUwsR0FBZSxJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sV0FBVixDQUF1QjtBQUNyQyxJQUFBLE1BQU0sRUFBRSxJQUQ2QjtBQUVyQyxJQUFBLFFBQVEsRUFBRTtBQUYyQixHQUF2QixDQUFmLENBSjZDLENBUTdDOztBQUNBLE9BQUssV0FBTCxHQUFtQixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0saUJBQVYsQ0FBNkI7QUFDL0MsSUFBQSxRQUFRLEVBQUU7QUFEcUMsR0FBN0IsQ0FBbkI7QUFHQSxPQUFLLFVBQUwsR0FBa0IsQ0FDakIsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLFdBQVYsQ0FBdUI7QUFDdEIsSUFBQSxLQUFLLEVBQUUsb0NBRGU7QUFFdEIsSUFBQSxRQUFRLEVBQUUsQ0FBQyxDQUFDLDZCQUFEO0FBRlcsR0FBdkIsQ0FEaUIsRUFLakIsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLFdBQVYsQ0FBdUI7QUFDdEIsSUFBQSxLQUFLLEVBQUUsOEJBRGU7QUFFdEIsSUFBQSxRQUFRLEVBQUUsQ0FBQyxDQUFDLDZCQUFEO0FBRlcsR0FBdkIsQ0FMaUIsRUFTakIsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLFdBQVYsQ0FBdUI7QUFDdEIsSUFBQSxLQUFLLEVBQUUsK0JBRGU7QUFFdEIsSUFBQSxRQUFRLEVBQUUsQ0FBQyxDQUFDLDZCQUFEO0FBRlcsR0FBdkIsQ0FUaUIsRUFhakIsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLFdBQVYsQ0FBdUI7QUFDdEIsSUFBQSxLQUFLLEVBQUUsc0NBRGU7QUFFdEIsSUFBQSxRQUFRLEVBQUUsQ0FBQyxDQUFDLDZCQUFEO0FBRlcsR0FBdkIsQ0FiaUIsRUFpQmpCLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxXQUFWLENBQXVCO0FBQ3RCLElBQUEsS0FBSyxFQUFFLCtCQURlO0FBRXRCLElBQUEsUUFBUSxFQUFFLENBQUMsQ0FBQyw2QkFBRDtBQUZXLEdBQXZCLENBakJpQixFQXFCakIsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLFdBQVYsQ0FBdUI7QUFDdEIsSUFBQSxLQUFLLEVBQUUsa0NBRGU7QUFFdEIsSUFBQSxRQUFRLEVBQUUsQ0FBQyxDQUFDLDZCQUFEO0FBRlcsR0FBdkIsRUFHRyxNQUhILEVBckJpQixDQUFsQjtBQTBCQSxPQUFLLFdBQUwsR0FBbUIsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLFlBQVYsQ0FBd0I7QUFDMUMsSUFBQSxLQUFLLEVBQUU7QUFEbUMsR0FBeEIsRUFFaEIsTUFGZ0IsRUFBbkI7QUFHQSxPQUFLLGFBQUwsR0FBcUIsRUFBckIsQ0F6QzZDLENBMkM3Qzs7QUFDQSxnQ0FBSyxPQUFMLENBQWEsUUFBYixFQUFzQixNQUF0QiwrQkFDQyxLQUFLLFdBQUwsQ0FBaUIsUUFEbEIsRUFFRSxJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sV0FBVixDQUF1QjtBQUN2QixJQUFBLEtBQUssRUFBRSxlQURnQjtBQUV2QixJQUFBLFFBQVEsRUFBRSxDQUFDLENBQUMsa0NBQUQ7QUFGWSxHQUF2QixDQUFELENBR0ksUUFMTCw0QkFNSSxLQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsVUFBQSxNQUFNO0FBQUEsV0FBSSxNQUFNLENBQUMsUUFBWDtBQUFBLEdBQTFCLENBTkosSUFPQyxLQUFLLFdBQUwsQ0FBaUIsUUFQbEIsSUE1QzZDLENBc0Q3Qzs7O0FBQ0EsT0FBSyxLQUFMLENBQVcsTUFBWCxDQUFtQixLQUFLLE9BQUwsQ0FBYSxRQUFoQyxFQXZENkMsQ0F5RDdDOztBQUNBLE9BQUssV0FBTCxDQUFpQixPQUFqQixDQUEwQixJQUExQixFQUFnQztBQUFFLGFBQVM7QUFBWCxHQUFoQztBQUNBLENBM0REOztBQTZEQSxVQUFVLENBQUMsU0FBWCxDQUFxQixrQkFBckIsR0FBMEMsWUFBVztBQUNwRDtBQUNBLE9BQUssS0FBTDtBQUNBLENBSEQsQyxDQUtBOzs7QUFDQSxVQUFVLENBQUMsU0FBWCxDQUFxQixhQUFyQixHQUFxQyxZQUFZO0FBQ2hELFNBQU8sS0FBSyxPQUFMLENBQWEsUUFBYixDQUFzQixXQUF0QixDQUFtQyxJQUFuQyxDQUFQO0FBQ0EsQ0FGRDs7QUFJQSxVQUFVLENBQUMsU0FBWCxDQUFxQixpQkFBckIsR0FBeUMsVUFBUyxNQUFULEVBQWlCLE9BQWpCLEVBQTBCO0FBQ2xFLE1BQUksYUFBYSxHQUFHLEtBQUssV0FBTCxDQUFpQixXQUFqQixFQUFwQjtBQUNBLE1BQUksbUJBQW1CLEdBQUcsSUFBSSxDQUFDLEdBQUwsQ0FBUyxPQUFPLElBQUksR0FBcEIsRUFBeUIsYUFBYSxHQUFHLE1BQXpDLENBQTFCO0FBQ0EsT0FBSyxXQUFMLENBQWlCLFdBQWpCLENBQTZCLG1CQUE3QjtBQUNBLENBSkQ7O0FBTUEsVUFBVSxDQUFDLFNBQVgsQ0FBcUIsc0JBQXJCLEdBQThDLFVBQVMsWUFBVCxFQUF1QjtBQUFBOztBQUNwRSxNQUFJLFVBQVUsR0FBRyxTQUFiLFVBQWEsQ0FBQSxLQUFLLEVBQUk7QUFDekI7QUFDQSxRQUFJLE1BQU0sR0FBRyxLQUFJLENBQUMsVUFBTCxDQUFnQixLQUFoQixDQUFiO0FBQ0EsSUFBQSxNQUFNLENBQUMsUUFBUCxDQUFnQixNQUFNLENBQUMsUUFBUCxLQUFvQixRQUFwQyxFQUh5QixDQUl6QjtBQUNBOztBQUNBLFFBQUksY0FBYyxHQUFHLEVBQXJCLENBTnlCLENBTUE7O0FBQ3pCLFFBQUksU0FBUyxHQUFHLEdBQWhCLENBUHlCLENBT0o7O0FBQ3JCLFFBQUksVUFBVSxHQUFHLEVBQWpCO0FBQ0EsUUFBSSxnQkFBZ0IsR0FBRyxjQUFjLEdBQUcsVUFBeEM7O0FBRUEsU0FBTSxJQUFJLElBQUksR0FBQyxDQUFmLEVBQWtCLElBQUksR0FBRyxVQUF6QixFQUFxQyxJQUFJLEVBQXpDLEVBQTZDO0FBQzVDLE1BQUEsTUFBTSxDQUFDLFVBQVAsQ0FDQyxLQUFJLENBQUMsaUJBQUwsQ0FBdUIsSUFBdkIsQ0FBNEIsS0FBNUIsQ0FERCxFQUVDLFNBQVMsR0FBRyxJQUFaLEdBQW1CLFVBRnBCLEVBR0MsZ0JBSEQ7QUFLQTtBQUNELEdBbEJEOztBQW1CQSxNQUFJLFdBQVcsR0FBRyxTQUFkLFdBQWMsQ0FBQyxLQUFELEVBQVEsSUFBUixFQUFjLElBQWQsRUFBdUI7QUFDeEMsUUFBSSxNQUFNLEdBQUcsS0FBSSxDQUFDLFVBQUwsQ0FBZ0IsS0FBaEIsQ0FBYjtBQUNBLElBQUEsTUFBTSxDQUFDLFFBQVAsQ0FDQyxNQUFNLENBQUMsUUFBUCxLQUFvQixXQUFwQixHQUFrQyx3QkFBYSxJQUFiLEVBQW1CLElBQW5CLENBRG5DOztBQUdBLElBQUEsS0FBSSxDQUFDLFdBQUwsQ0FBaUIsTUFBakIsQ0FBd0IsSUFBeEI7O0FBQ0EsSUFBQSxLQUFJLENBQUMsVUFBTDtBQUNBLEdBUEQ7O0FBUUEsRUFBQSxZQUFZLENBQUMsT0FBYixDQUFxQixVQUFTLE9BQVQsRUFBa0IsS0FBbEIsRUFBeUI7QUFDN0MsSUFBQSxPQUFPLENBQUMsSUFBUixDQUNDO0FBQUEsYUFBTSxVQUFVLENBQUMsS0FBRCxDQUFoQjtBQUFBLEtBREQsRUFFQyxVQUFDLElBQUQsRUFBTyxJQUFQO0FBQUEsYUFBZ0IsV0FBVyxDQUFDLEtBQUQsRUFBUSxJQUFSLEVBQWMsSUFBZCxDQUEzQjtBQUFBLEtBRkQ7QUFJQSxHQUxEO0FBTUEsQ0FsQ0QsQyxDQW9DQTtBQUNBOzs7QUFDQSxVQUFVLENBQUMsU0FBWCxDQUFxQixlQUFyQixHQUF1QyxVQUFXLElBQVgsRUFBa0I7QUFBQTs7QUFDeEQsRUFBQSxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQWY7QUFDQSxTQUFPLFVBQVUsU0FBVixDQUFpQixTQUFqQixDQUEyQixlQUEzQixDQUEyQyxJQUEzQyxDQUFpRCxJQUFqRCxFQUF1RCxJQUF2RCxFQUNMLElBREssQ0FDQyxZQUFNO0FBQ1osUUFBSSxJQUFJLENBQUMsSUFBVCxFQUFlO0FBQ2QsTUFBQSxNQUFJLENBQUMsVUFBTCxDQUFnQixDQUFoQixFQUFtQixNQUFuQjtBQUNBOztBQUNELFFBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFMLEdBQVksSUFBSSxDQUFDLFFBQWpCLEdBQTRCLElBQUksQ0FBQyxRQUFMLENBQWMsS0FBZCxDQUFvQixDQUFwQixFQUF1QixDQUFDLENBQXhCLENBQS9DO0FBQ0EsSUFBQSxJQUFJLENBQUMsUUFBTCxDQUFjLElBQWQsQ0FBbUI7QUFBQSxhQUFNLE1BQUksQ0FBQyxzQkFBTCxDQUE0QixZQUE1QixDQUFOO0FBQUEsS0FBbkI7QUFDQSxHQVBLLEVBT0gsSUFQRyxDQUFQO0FBUUEsQ0FWRCxDLENBWUE7OztBQUNBLFVBQVUsQ0FBQyxTQUFYLENBQXFCLGNBQXJCLEdBQXNDLFVBQVcsSUFBWCxFQUFrQjtBQUN2RCxFQUFBLElBQUksR0FBRyxJQUFJLElBQUksRUFBZjs7QUFDQSxNQUFJLElBQUksQ0FBQyxPQUFULEVBQWtCO0FBQ2pCO0FBQ0EsV0FBTyxVQUFVLFNBQVYsQ0FBaUIsU0FBakIsQ0FBMkIsY0FBM0IsQ0FBMEMsSUFBMUMsQ0FBZ0QsSUFBaEQsRUFBc0QsSUFBdEQsRUFDTCxJQURLLENBQ0EsR0FEQSxDQUFQO0FBRUEsR0FOc0QsQ0FPdkQ7OztBQUNBLFNBQU8sVUFBVSxTQUFWLENBQWlCLFNBQWpCLENBQTJCLGNBQTNCLENBQTBDLElBQTFDLENBQWdELElBQWhELEVBQXNELElBQXRELENBQVA7QUFDQSxDQVREOztlQVdlLFU7Ozs7Ozs7Ozs7O0FDbEtmLFNBQVMsVUFBVCxDQUFxQixNQUFyQixFQUE4QjtBQUM3QixFQUFBLFVBQVUsU0FBVixDQUFpQixJQUFqQixDQUF1QixJQUF2QixFQUE2QixNQUE3QjtBQUNBOztBQUNELEVBQUUsQ0FBQyxZQUFILENBQWlCLFVBQWpCLEVBQTZCLEVBQUUsQ0FBQyxFQUFILENBQU0sYUFBbkM7QUFFQSxVQUFVLFVBQVYsQ0FBa0IsSUFBbEIsR0FBeUIsTUFBekI7QUFDQSxVQUFVLFVBQVYsQ0FBa0IsS0FBbEIsR0FBMEIsT0FBMUI7QUFDQSxVQUFVLFVBQVYsQ0FBa0IsSUFBbEIsR0FBeUIsT0FBekI7QUFDQSxVQUFVLFVBQVYsQ0FBa0IsT0FBbEIsR0FBNEIsQ0FDM0I7QUFDQTtBQUNDLEVBQUEsS0FBSyxFQUFFLGlDQURSO0FBRUMsRUFBQSxLQUFLLEVBQUUsU0FGUjtBQUdDLEVBQUEsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxXQUFWLENBQXNCLCtDQUF0QixDQUhSLENBR2dGOztBQUhoRixDQUYyQixFQU8zQjtBQUNBO0FBQ0MsRUFBQSxLQUFLLEVBQUUsTUFEUjtBQUVDLEVBQUEsTUFBTSxFQUFFLE1BRlQ7QUFHQyxFQUFBLElBQUksRUFBRSxZQUhQO0FBSUMsRUFBQSxLQUFLLEVBQUUsTUFKUjtBQUtDLEVBQUEsS0FBSyxFQUFFLE1BTFIsQ0FNQzs7QUFORCxDQVIyQixFQWdCM0I7QUFDQTtBQUNDLEVBQUEsTUFBTSxFQUFFLE1BRFQ7QUFFQyxFQUFBLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sV0FBVixDQUFzQiwwQ0FBdEIsQ0FGUjtBQUdDLEVBQUEsS0FBSyxFQUFFLENBQUMsU0FBRCxFQUFZLGFBQVo7QUFIUixDQWpCMkIsRUFzQjNCO0FBQ0MsRUFBQSxNQUFNLEVBQUUsU0FEVDtBQUVDLEVBQUEsS0FBSyxFQUFFO0FBRlIsQ0F0QjJCLEVBMEIzQjtBQUNDLEVBQUEsTUFBTSxFQUFFLFNBRFQ7QUFFQyxFQUFBLEtBQUssRUFBRTtBQUZSLENBMUIyQixFQThCM0I7QUFDQyxFQUFBLE1BQU0sRUFBRSxRQURUO0FBRUMsRUFBQSxLQUFLLEVBQUU7QUFGUixDQTlCMkIsQ0FBNUIsQyxDQW9DQTs7QUFDQSxVQUFVLENBQUMsU0FBWCxDQUFxQixVQUFyQixHQUFrQyxZQUFZO0FBQzdDO0FBQ0EsRUFBQSxVQUFVLFNBQVYsQ0FBaUIsU0FBakIsQ0FBMkIsVUFBM0IsQ0FBc0MsSUFBdEMsQ0FBNEMsSUFBNUMsRUFGNkMsQ0FHN0M7O0FBQ0EsT0FBSyxNQUFMLEdBQWMsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLFdBQVYsQ0FBdUI7QUFDcEMsSUFBQSxRQUFRLEVBQUUsS0FEMEI7QUFFcEMsSUFBQSxNQUFNLEVBQUUsSUFGNEI7QUFHcEMsSUFBQSxNQUFNLEVBQUU7QUFINEIsR0FBdkIsQ0FBZDtBQUtBLE9BQUssT0FBTCxHQUFlLElBQUksRUFBRSxDQUFDLEVBQUgsQ0FBTSxXQUFWLENBQXVCO0FBQ3JDLElBQUEsUUFBUSxFQUFFLElBRDJCO0FBRXJDLElBQUEsTUFBTSxFQUFFLElBRjZCO0FBR3JDLElBQUEsVUFBVSxFQUFFO0FBSHlCLEdBQXZCLENBQWY7QUFLQSxPQUFLLFdBQUwsR0FBbUIsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLFdBQVYsQ0FBdUI7QUFDekMsSUFBQSxLQUFLLEVBQUUsQ0FDTixLQUFLLE1BREMsRUFFTixLQUFLLE9BRkMsQ0FEa0M7QUFLekMsSUFBQSxVQUFVLEVBQUUsSUFMNkI7QUFNekMsSUFBQSxRQUFRLEVBQUU7QUFOK0IsR0FBdkIsQ0FBbkIsQ0FkNkMsQ0FzQjdDOztBQUNBLE9BQUssU0FBTCxHQUFpQixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sbUJBQVYsQ0FBK0I7QUFDL0MsSUFBQSxXQUFXLEVBQUUsc0JBRGtDO0FBRS9DLElBQUEsT0FBTyxFQUFFLENBQ1I7QUFBRTtBQUNELE1BQUEsSUFBSSxFQUFFLFVBRFA7QUFFQyxNQUFBLEtBQUssRUFBRTtBQUZSLEtBRFEsRUFLUjtBQUNDLE1BQUEsSUFBSSxFQUFFLFVBRFA7QUFFQyxNQUFBLEtBQUssRUFBRTtBQUZSLEtBTFEsRUFTUjtBQUNDLE1BQUEsSUFBSSxFQUFFLFVBRFA7QUFFQyxNQUFBLEtBQUssRUFBRTtBQUZSLEtBVFE7QUFGc0MsR0FBL0IsQ0FBakI7QUFpQkEsT0FBSyxnQkFBTCxHQUF3QixJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0sWUFBVixDQUF3QjtBQUMvQyxJQUFBLEtBQUssRUFBRSxLQUR3QztBQUUvQyxJQUFBLElBQUksRUFBRSxLQUZ5QztBQUcvQyxJQUFBLEtBQUssRUFBRSxhQUh3QztBQUkvQyxJQUFBLEtBQUssRUFBRTtBQUp3QyxHQUF4QixDQUF4QjtBQU1BLE9BQUssTUFBTCxDQUFZLFFBQVosQ0FBcUIsTUFBckIsQ0FDRSxJQUFJLEVBQUUsQ0FBQyxFQUFILENBQU0saUJBQVYsQ0FBNEIsS0FBSyxTQUFqQyxFQUE0QyxLQUFLLGdCQUFqRCxDQUFELENBQXFFLFFBRHRFLEVBOUM2QyxDQWtEN0M7O0FBQ0EsT0FBSyxPQUFMLENBQWEsUUFBYixDQUFzQixNQUF0QixDQUE4QixpQ0FBOUI7QUFFQSxPQUFLLEtBQUwsQ0FBVyxNQUFYLENBQW1CLEtBQUssV0FBTCxDQUFpQixRQUFwQztBQUNBLENBdERELEMsQ0F3REE7OztBQUNBLFVBQVUsQ0FBQyxTQUFYLENBQXFCLGFBQXJCLEdBQXFDLFlBQVk7QUFDaEQsU0FBTyxLQUFLLE1BQUwsQ0FBWSxRQUFaLENBQXFCLFdBQXJCLENBQWtDLElBQWxDLElBQTJDLEtBQUssT0FBTCxDQUFhLFFBQWIsQ0FBc0IsV0FBdEIsQ0FBbUMsSUFBbkMsQ0FBbEQ7QUFDQSxDQUZELEMsQ0FJQTtBQUNBOzs7QUFDQSxVQUFVLENBQUMsU0FBWCxDQUFxQixlQUFyQixHQUF1QyxVQUFXLElBQVgsRUFBa0I7QUFBQTs7QUFDeEQsRUFBQSxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQWY7QUFDQSxTQUFPLFVBQVUsU0FBVixDQUFpQixTQUFqQixDQUEyQixlQUEzQixDQUEyQyxJQUEzQyxDQUFpRCxJQUFqRCxFQUF1RCxJQUF2RCxFQUNMLElBREssQ0FDQyxZQUFNO0FBQ1o7QUFFQSxJQUFBLEtBQUksQ0FBQyxVQUFMO0FBQ0EsR0FMSyxFQUtILElBTEcsQ0FBUDtBQU1BLENBUkQ7O2VBVWUsVTs7Ozs7Ozs7Ozs7QUN0SGY7O0FBQ0E7O0FBQ0E7Ozs7QUFFQSxJQUFJLFNBQVMsR0FBRyxTQUFTLFNBQVQsR0FBcUI7QUFDcEMsTUFBSyxNQUFNLENBQUMseUJBQVAsSUFBb0MsSUFBcEMsSUFBNEMsbUJBQU8sRUFBUCxDQUFVLFlBQTNELEVBQTBFO0FBQ3pFLFdBQU8sQ0FBQyxDQUFDLFFBQUYsR0FBYSxNQUFiLEVBQVA7QUFDQTs7QUFFRCxNQUFJLG1CQUFtQixHQUFLLENBQUMsQ0FBQyxPQUFGLENBQVUsTUFBTSxDQUFDLHlCQUFqQixDQUFGLEdBQWtELE1BQU0sQ0FBQyx5QkFBekQsR0FBcUYsQ0FBQyxNQUFNLENBQUMseUJBQVIsQ0FBL0c7O0FBRUEsTUFBSyxDQUFDLENBQUQsS0FBTyxtQkFBbUIsQ0FBQyxPQUFwQixDQUE0QixtQkFBTyxFQUFQLENBQVUsaUJBQXRDLENBQVosRUFBdUU7QUFDdEUsV0FBTyxDQUFDLENBQUMsUUFBRixHQUFhLE1BQWIsRUFBUDtBQUNBOztBQUVELE1BQUssaUNBQWlDLElBQWpDLENBQXNDLE1BQU0sQ0FBQyxRQUFQLENBQWdCLElBQXRELENBQUwsRUFBbUU7QUFDbEUsV0FBTyxDQUFDLENBQUMsUUFBRixHQUFhLE1BQWIsRUFBUDtBQUNBLEdBYm1DLENBZXBDOzs7QUFDQSxNQUFLLENBQUMsQ0FBQyxjQUFELENBQUQsQ0FBa0IsTUFBdkIsRUFBZ0M7QUFDL0IsV0FBTyx3QkFBUDtBQUNBOztBQUVELE1BQUksUUFBUSxHQUFHLEVBQUUsQ0FBQyxLQUFILENBQVMsV0FBVCxDQUFxQixtQkFBTyxFQUFQLENBQVUsVUFBL0IsQ0FBZjtBQUNBLE1BQUksUUFBUSxHQUFHLFFBQVEsSUFBSSxRQUFRLENBQUMsV0FBVCxFQUEzQjs7QUFDQSxNQUFJLENBQUMsUUFBTCxFQUFlO0FBQ2QsV0FBTyxDQUFDLENBQUMsUUFBRixHQUFhLE1BQWIsRUFBUDtBQUNBO0FBRUQ7Ozs7OztBQUlBLFNBQU8sVUFBSSxHQUFKLENBQVE7QUFDZCxJQUFBLE1BQU0sRUFBRSxPQURNO0FBRWQsSUFBQSxNQUFNLEVBQUUsTUFGTTtBQUdkLElBQUEsSUFBSSxFQUFFLFdBSFE7QUFJZCxJQUFBLE1BQU0sRUFBRSxRQUFRLENBQUMsZUFBVCxFQUpNO0FBS2QsSUFBQSxXQUFXLEVBQUUsSUFMQztBQU1kLElBQUEsT0FBTyxFQUFFLEtBTks7QUFPZCxJQUFBLFlBQVksRUFBRTtBQVBBLEdBQVIsRUFTTCxJQVRLLENBU0EsVUFBUyxNQUFULEVBQWlCO0FBQ3RCLFFBQUksRUFBRSxHQUFHLE1BQU0sQ0FBQyxLQUFQLENBQWEsT0FBdEI7QUFDQSxRQUFJLFNBQVMsR0FBRyxNQUFNLENBQUMsS0FBUCxDQUFhLEtBQWIsQ0FBbUIsRUFBbkIsRUFBdUIsU0FBdkM7O0FBRUEsUUFBSyxDQUFDLFNBQU4sRUFBa0I7QUFDakIsYUFBTyx3QkFBUDtBQUNBOztBQUVELFFBQUksY0FBYyxHQUFHLFNBQVMsQ0FBQyxJQUFWLENBQWUsVUFBQSxRQUFRO0FBQUEsYUFBSSx5QkFBeUIsSUFBekIsQ0FBOEIsUUFBUSxDQUFDLEtBQXZDLENBQUo7QUFBQSxLQUF2QixDQUFyQjs7QUFFQSxRQUFLLENBQUMsY0FBTixFQUF1QjtBQUN0QixhQUFPLHdCQUFQO0FBQ0E7QUFFRCxHQXZCSyxFQXdCTixVQUFTLElBQVQsRUFBZSxLQUFmLEVBQXNCO0FBQ3RCO0FBQ0MsSUFBQSxPQUFPLENBQUMsSUFBUixDQUNDLHdEQUNDLElBQUksSUFBSSxJQURULElBQ2tCLEVBRGxCLEdBQ3VCLE1BQU0sd0JBQWEsSUFBYixFQUFtQixLQUFuQixDQUY5QjtBQUlBLFdBQU8sQ0FBQyxDQUFDLFFBQUYsR0FBYSxNQUFiLEVBQVA7QUFDQSxHQS9CSyxDQUFQO0FBaUNBLENBL0REOztlQWlFZSxTOzs7Ozs7Ozs7OztBQ3JFZjs7QUFFQTs7Ozs7OztBQU9BLElBQUksS0FBSyxHQUFHLFNBQVIsS0FBUSxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLFNBQW5CLEVBQThCLFVBQTlCLEVBQTBDO0FBQ3JELE1BQUk7QUFDSCxRQUFJLGdCQUFnQixHQUFHLENBQXZCO0FBQ0EsUUFBSSxpQkFBaUIsR0FBRyxFQUF4QjtBQUNBLFFBQUksa0JBQWtCLEdBQUcsS0FBRyxFQUFILEdBQU0sRUFBTixHQUFTLElBQWxDO0FBRUEsUUFBSSxhQUFhLEdBQUcsQ0FBQyxTQUFTLElBQUksZ0JBQWQsSUFBZ0Msa0JBQXBEO0FBQ0EsUUFBSSxjQUFjLEdBQUcsQ0FBQyxVQUFVLElBQUksaUJBQWYsSUFBa0Msa0JBQXZEO0FBRUEsUUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQUwsQ0FBZTtBQUM5QixNQUFBLEtBQUssRUFBRSxHQUR1QjtBQUU5QixNQUFBLFNBQVMsRUFBRSxJQUFJLElBQUosQ0FBUyxJQUFJLENBQUMsR0FBTCxLQUFhLGFBQXRCLEVBQXFDLFdBQXJDLEVBRm1CO0FBRzlCLE1BQUEsVUFBVSxFQUFFLElBQUksSUFBSixDQUFTLElBQUksQ0FBQyxHQUFMLEtBQWEsY0FBdEIsRUFBc0MsV0FBdEM7QUFIa0IsS0FBZixDQUFoQjtBQUtBLElBQUEsWUFBWSxDQUFDLE9BQWIsQ0FBcUIsV0FBUyxHQUE5QixFQUFtQyxTQUFuQztBQUNBLEdBZEQsQ0FjRyxPQUFNLENBQU4sRUFBUyxDQUFFLENBZnVDLENBZXRDOztBQUNmLENBaEJEO0FBaUJBOzs7Ozs7Ozs7QUFLQSxJQUFJLElBQUksR0FBRyxTQUFQLElBQU8sQ0FBUyxHQUFULEVBQWM7QUFDeEIsTUFBSSxHQUFKOztBQUNBLE1BQUk7QUFDSCxRQUFJLFNBQVMsR0FBRyxZQUFZLENBQUMsT0FBYixDQUFxQixXQUFTLEdBQTlCLENBQWhCOztBQUNBLFFBQUssU0FBUyxLQUFLLEVBQW5CLEVBQXdCO0FBQ3ZCLE1BQUEsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFMLENBQVcsU0FBWCxDQUFOO0FBQ0E7QUFDRCxHQUxELENBS0csT0FBTSxDQUFOLEVBQVM7QUFDWCxJQUFBLE9BQU8sQ0FBQyxHQUFSLENBQVksMkJBQTJCLEdBQTNCLEdBQWlDLDJCQUE3QztBQUNBLElBQUEsT0FBTyxDQUFDLEdBQVIsQ0FDQyxPQUFPLENBQUMsQ0FBQyxJQUFULEdBQWdCLFlBQWhCLEdBQStCLENBQUMsQ0FBQyxPQUFqQyxJQUNFLENBQUMsQ0FBQyxFQUFGLEdBQU8sVUFBVSxDQUFDLENBQUMsRUFBbkIsR0FBd0IsRUFEMUIsS0FFRSxDQUFDLENBQUMsSUFBRixHQUFTLFlBQVksQ0FBQyxDQUFDLElBQXZCLEdBQThCLEVBRmhDLENBREQ7QUFLQTs7QUFDRCxTQUFPLEdBQUcsSUFBSSxJQUFkO0FBQ0EsQ0FoQkQ7Ozs7QUFpQkEsSUFBSSxrQkFBa0IsR0FBRyxTQUFyQixrQkFBcUIsQ0FBUyxHQUFULEVBQWM7QUFDdEMsTUFBSSxVQUFVLEdBQUcsR0FBRyxDQUFDLE9BQUosQ0FBWSxRQUFaLE1BQTBCLENBQTNDOztBQUNBLE1BQUssQ0FBQyxVQUFOLEVBQW1CO0FBQ2xCO0FBQ0E7O0FBQ0QsTUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFKLENBQVksUUFBWixFQUFxQixFQUFyQixDQUFELENBQWY7QUFDQSxNQUFJLFNBQVMsR0FBRyxDQUFDLElBQUQsSUFBUyxDQUFDLElBQUksQ0FBQyxVQUFmLElBQTZCLHVCQUFZLElBQUksQ0FBQyxVQUFqQixDQUE3Qzs7QUFDQSxNQUFLLFNBQUwsRUFBaUI7QUFDaEIsSUFBQSxZQUFZLENBQUMsVUFBYixDQUF3QixHQUF4QjtBQUNBO0FBQ0QsQ0FWRDs7OztBQVdBLElBQUksaUJBQWlCLEdBQUcsU0FBcEIsaUJBQW9CLEdBQVc7QUFDbEMsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFiLEVBQWdCLENBQUMsR0FBRyxZQUFZLENBQUMsTUFBakMsRUFBeUMsQ0FBQyxFQUExQyxFQUE4QztBQUM3QyxJQUFBLFVBQVUsQ0FBQyxrQkFBRCxFQUFxQixHQUFyQixFQUEwQixZQUFZLENBQUMsR0FBYixDQUFpQixDQUFqQixDQUExQixDQUFWO0FBQ0E7QUFDRCxDQUpEOzs7Ozs7Ozs7OztBQzNEQTtBQUNBLElBQUksTUFBTSxHQUFHLEVBQWIsQyxDQUNBOztBQUNBLE1BQU0sQ0FBQyxNQUFQLEdBQWdCO0FBQ2Y7QUFDQSxFQUFBLE1BQU0sRUFBRyxtQ0FGTTtBQUdmLEVBQUEsT0FBTyxFQUFFO0FBSE0sQ0FBaEIsQyxDQUtBOztBQUNBLE1BQU0sQ0FBQyxLQUFQLEdBQWU7QUFDZCxFQUFBLFNBQVMsRUFBRSxNQUFNLENBQUMsZUFBUCxJQUEwQjtBQUR2QixDQUFmLEMsQ0FHQTs7QUFDQSxNQUFNLENBQUMsRUFBUCxHQUFZLEVBQUUsQ0FBQyxNQUFILENBQVUsR0FBVixDQUFlLENBQzFCLE1BRDBCLEVBRTFCLFlBRjBCLEVBRzFCLG1CQUgwQixFQUkxQixZQUowQixFQUsxQix1QkFMMEIsRUFNMUIsY0FOMEIsRUFPMUIsY0FQMEIsRUFRMUIsY0FSMEIsRUFTMUIsVUFUMEIsRUFVMUIsY0FWMEIsRUFXMUIsY0FYMEIsQ0FBZixDQUFaO0FBY0EsTUFBTSxDQUFDLEtBQVAsR0FBZTtBQUFFO0FBQ2hCO0FBQ0EsRUFBQSxRQUFRLEVBQUcsMkhBRkc7QUFHZDtBQUNBO0FBQ0EsRUFBQSxjQUFjLEVBQUU7QUFMRixDQUFmO0FBTUc7O0FBQ0gsTUFBTSxDQUFDLFFBQVAsR0FBa0IsRUFBbEI7QUFDQSxNQUFNLENBQUMsY0FBUCxHQUF3QjtBQUN2QixFQUFBLE9BQU8sRUFBRSxDQUNSLElBRFEsRUFFUixJQUZRLEVBR1IsR0FIUSxFQUlSLElBSlEsRUFLUixHQUxRLEVBTVIsR0FOUSxFQU9SLE9BUFEsRUFRUixNQVJRLEVBU1IsTUFUUSxDQURjO0FBWXZCLEVBQUEsV0FBVyxFQUFFLENBQ1osS0FEWSxFQUVaLE1BRlksRUFHWixLQUhZLEVBSVosS0FKWSxDQVpVO0FBa0J2QixFQUFBLGVBQWUsRUFBRSxDQUNoQixVQURnQixFQUVoQixPQUZnQixFQUdoQixNQUhnQixFQUloQixRQUpnQixFQUtoQixTQUxnQixFQU1oQixVQU5nQixFQU9oQixPQVBnQixFQVFoQixRQVJnQixFQVNoQixTQVRnQixFQVVoQixVQVZnQixFQVdoQixJQVhnQixFQVloQixVQVpnQixFQWFoQixNQWJnQixDQWxCTTtBQWlDdkIsRUFBQSxtQkFBbUIsRUFBRSxDQUNwQixLQURvQixFQUVwQixNQUZvQixFQUdwQixLQUhvQixFQUlwQixLQUpvQixFQUtwQixRQUxvQixFQU1wQixJQU5vQjtBQWpDRSxDQUF4QjtBQTBDQSxNQUFNLENBQUMsYUFBUCxHQUF1QjtBQUN0QixrQ0FBZ0MsQ0FDL0IsSUFEK0IsRUFFL0IsSUFGK0IsRUFHL0IsSUFIK0IsQ0FEVjtBQU10Qix5QkFBdUIsQ0FDdEIsS0FEc0IsRUFFdEIsVUFGc0IsRUFHdEIsYUFIc0IsRUFJdEIsT0FKc0IsRUFLdEIsWUFMc0IsRUFNdEIsTUFOc0I7QUFORCxDQUF2QjtBQWVBLE1BQU0sQ0FBQyxjQUFQLEdBQXdCLENBQ3ZCLDBCQUR1QixFQUV2QixvQkFGdUIsRUFHdkIscUJBSHVCLEVBSXZCLEtBSnVCLEVBS3ZCLE1BTHVCLEVBTXZCLHdCQU51QixFQU92QiwwQkFQdUIsRUFRdkIsS0FSdUIsRUFTdkIsZUFUdUIsRUFVdkIsTUFWdUIsRUFXdkIsb0JBWHVCLEVBWXZCLGlCQVp1QixFQWF2QixpQkFidUIsRUFjdkIsYUFkdUIsRUFldkIsMEJBZnVCLEVBZ0J2QiwyQkFoQnVCLEVBaUJ2Qix5QkFqQnVCLEVBa0J2Qix3QkFsQnVCLEVBbUJ2Qix5QkFuQnVCLEVBb0J2Qix3QkFwQnVCLEVBcUJ2QixtQ0FyQnVCLEVBc0J2QixtQkF0QnVCLEVBdUJ2QixjQXZCdUIsRUF3QnZCLGFBeEJ1QixFQXlCdkIsZUF6QnVCLEVBMEJ2QixvQkExQnVCLENBQXhCO0FBNEJBLE1BQU0sQ0FBQyxvQkFBUCxHQUE4QjtBQUM3QixVQUFRO0FBQ1AsYUFBUztBQUNSLFlBQU07QUFERSxLQURGO0FBSVAsbUJBQWU7QUFDZCxZQUFNO0FBRFEsS0FKUjtBQU9QLGlCQUFhO0FBUE4sR0FEcUI7QUFVN0IsWUFBVTtBQUNULGFBQVM7QUFDUixZQUFNO0FBREUsS0FEQTtBQUlULG1CQUFlO0FBQ2QsWUFBTTtBQURRO0FBSk4sR0FWbUI7QUFrQjdCLFdBQVM7QUFDUixhQUFTO0FBQ1IsWUFBTTtBQURFLEtBREQ7QUFJUixtQkFBZTtBQUNkLFlBQU07QUFEUSxLQUpQO0FBT1IsaUJBQWE7QUFQTCxHQWxCb0I7QUEyQjdCLGVBQWE7QUFDWixhQUFTO0FBQ1IsWUFBTTtBQURFLEtBREc7QUFJWixtQkFBZTtBQUNkLFlBQU07QUFEUSxLQUpIO0FBT1osaUJBQWE7QUFQRCxHQTNCZ0I7QUFvQzdCLGlCQUFlO0FBQ2QsYUFBUztBQUNSLFlBQU07QUFERSxLQURLO0FBSWQsbUJBQWU7QUFDZCxZQUFNO0FBRFEsS0FKRDtBQU9kLGVBQVcsQ0FDVixhQURVLENBUEc7QUFVZCxpQkFBYSxLQVZDO0FBV2QsaUJBQWE7QUFYQyxHQXBDYztBQWlEN0IsbUJBQWlCO0FBQ2hCLGFBQVM7QUFDUixZQUFNO0FBREUsS0FETztBQUloQixtQkFBZTtBQUNkLFlBQU07QUFEUSxLQUpDO0FBT2hCLGVBQVcsQ0FDVixhQURVLENBUEs7QUFVaEIsaUJBQWEsS0FWRztBQVdoQixpQkFBYTtBQVhHO0FBakRZLENBQTlCO2VBZ0VlLE07Ozs7Ozs7Ozs7QUN4TGY7QUFDQSxJQUFJLFVBQVUsc2xEQUFkOzs7Ozs7Ozs7OztBQ0RBOztBQUNBOzs7Ozs7QUFFQSxJQUFJLFlBQVksR0FBRyxTQUFmLFlBQWUsQ0FBUyxPQUFULEVBQWtCLGFBQWxCLEVBQWlDO0FBQ25ELEVBQUEsS0FBSyxDQUFDLEtBQU4sQ0FBWSxTQUFaLEVBQXVCLE9BQXZCLEVBQWdDLENBQWhDLEVBQW1DLEVBQW5DO0FBQ0EsRUFBQSxLQUFLLENBQUMsS0FBTixDQUFZLGVBQVosRUFBNkIsYUFBN0IsRUFBNEMsQ0FBNUMsRUFBK0MsRUFBL0M7QUFDQSxDQUhEO0FBS0E7Ozs7Ozs7QUFLQSxJQUFJLHVCQUF1QixHQUFHLFNBQTFCLHVCQUEwQixHQUFXO0FBRXhDLE1BQUksZUFBZSxHQUFHLENBQUMsQ0FBQyxRQUFGLEVBQXRCO0FBRUEsTUFBSSxhQUFhLEdBQUc7QUFDbkIsSUFBQSxNQUFNLEVBQUUsT0FEVztBQUVuQixJQUFBLE1BQU0sRUFBRSxNQUZXO0FBR25CLElBQUEsSUFBSSxFQUFFLGlCQUhhO0FBSW5CLElBQUEsTUFBTSxFQUFFLE9BSlc7QUFLbkIsSUFBQSxXQUFXLEVBQUUsSUFMTTtBQU1uQixJQUFBLE9BQU8sRUFBRTtBQU5VLEdBQXBCO0FBU0EsTUFBSSxVQUFVLEdBQUcsQ0FDaEI7QUFDQyxJQUFBLEtBQUssRUFBQyx1REFEUDtBQUVDLElBQUEsWUFBWSxFQUFFLGFBRmY7QUFHQyxJQUFBLE9BQU8sRUFBRSxFQUhWO0FBSUMsSUFBQSxTQUFTLEVBQUUsQ0FBQyxDQUFDLFFBQUY7QUFKWixHQURnQixFQU9oQjtBQUNDLElBQUEsS0FBSyxFQUFFLHlEQURSO0FBRUMsSUFBQSxZQUFZLEVBQUUsZ0JBRmY7QUFHQyxJQUFBLE9BQU8sRUFBRSxFQUhWO0FBSUMsSUFBQSxTQUFTLEVBQUUsQ0FBQyxDQUFDLFFBQUY7QUFKWixHQVBnQixFQWFoQjtBQUNDLElBQUEsS0FBSyxFQUFFLCtDQURSO0FBRUMsSUFBQSxZQUFZLEVBQUUsVUFGZjtBQUdDLElBQUEsT0FBTyxFQUFFLEVBSFY7QUFJQyxJQUFBLFNBQVMsRUFBRSxDQUFDLENBQUMsUUFBRjtBQUpaLEdBYmdCLENBQWpCOztBQXFCQSxNQUFJLFlBQVksR0FBRyxTQUFmLFlBQWUsQ0FBUyxNQUFULEVBQWlCLFFBQWpCLEVBQTJCO0FBQzdDLFFBQUssQ0FBQyxNQUFNLENBQUMsS0FBUixJQUFpQixDQUFDLE1BQU0sQ0FBQyxLQUFQLENBQWEsZUFBcEMsRUFBc0Q7QUFDckQ7QUFDQTtBQUNBLE1BQUEsZUFBZSxDQUFDLE1BQWhCO0FBQ0E7QUFDQSxLQU40QyxDQVE3Qzs7O0FBQ0EsUUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDLEtBQVAsQ0FBYSxlQUFiLENBQTZCLEdBQTdCLENBQWlDLFVBQVMsSUFBVCxFQUFlO0FBQ2xFLGFBQU8sSUFBSSxDQUFDLEtBQUwsQ0FBVyxLQUFYLENBQWlCLENBQWpCLENBQVA7QUFDQSxLQUZrQixDQUFuQjtBQUdBLElBQUEsS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsSUFBaEIsQ0FBcUIsS0FBckIsQ0FBMkIsVUFBVSxDQUFDLFFBQUQsQ0FBVixDQUFxQixPQUFoRCxFQUF5RCxZQUF6RCxFQVo2QyxDQWM3Qzs7QUFDQSxRQUFLLE1BQU0sWUFBWCxFQUF1QjtBQUN0QixNQUFBLFVBQVUsQ0FBQyxDQUFDLENBQUMsTUFBRixDQUFTLFVBQVUsQ0FBQyxRQUFELENBQVYsQ0FBcUIsS0FBOUIsRUFBcUMsTUFBTSxZQUEzQyxDQUFELEVBQXdELFFBQXhELENBQVY7QUFDQTtBQUNBOztBQUVELElBQUEsVUFBVSxDQUFDLFFBQUQsQ0FBVixDQUFxQixTQUFyQixDQUErQixPQUEvQjtBQUNBLEdBckJEOztBQXVCQSxNQUFJLFVBQVUsR0FBRyxTQUFiLFVBQWEsQ0FBUyxDQUFULEVBQVksUUFBWixFQUFzQjtBQUN0QyxjQUFJLEdBQUosQ0FBUyxDQUFULEVBQ0UsSUFERixDQUNRLFVBQVMsTUFBVCxFQUFpQjtBQUN2QixNQUFBLFlBQVksQ0FBQyxNQUFELEVBQVMsUUFBVCxDQUFaO0FBQ0EsS0FIRixFQUlFLElBSkYsQ0FJUSxVQUFTLElBQVQsRUFBZSxLQUFmLEVBQXNCO0FBQzVCLE1BQUEsT0FBTyxDQUFDLElBQVIsQ0FBYSxhQUFhLHdCQUFhLElBQWIsRUFBbUIsS0FBbkIsRUFBMEIsc0NBQXNDLENBQUMsQ0FBQyxPQUF4QyxHQUFrRCxJQUE1RSxDQUExQjtBQUNBLE1BQUEsZUFBZSxDQUFDLE1BQWhCO0FBQ0EsS0FQRjtBQVFBLEdBVEQ7O0FBV0EsRUFBQSxVQUFVLENBQUMsT0FBWCxDQUFtQixVQUFTLEdBQVQsRUFBYyxLQUFkLEVBQXFCLEdBQXJCLEVBQTBCO0FBQzVDLElBQUEsR0FBRyxDQUFDLEtBQUosR0FBWSxDQUFDLENBQUMsTUFBRixDQUFVO0FBQUUsaUJBQVUsR0FBRyxDQUFDO0FBQWhCLEtBQVYsRUFBbUMsYUFBbkMsQ0FBWjtBQUNBLElBQUEsQ0FBQyxDQUFDLElBQUYsQ0FBUSxHQUFHLENBQUMsS0FBSyxHQUFDLENBQVAsQ0FBSCxJQUFnQixHQUFHLENBQUMsS0FBSyxHQUFDLENBQVAsQ0FBSCxDQUFhLFNBQTdCLElBQTBDLElBQWxELEVBQXlELElBQXpELENBQThELFlBQVU7QUFDdkUsTUFBQSxVQUFVLENBQUMsR0FBRyxDQUFDLEtBQUwsRUFBWSxLQUFaLENBQVY7QUFDQSxLQUZEO0FBR0EsR0FMRDtBQU9BLEVBQUEsVUFBVSxDQUFDLFVBQVUsQ0FBQyxNQUFYLEdBQWtCLENBQW5CLENBQVYsQ0FBZ0MsU0FBaEMsQ0FBMEMsSUFBMUMsQ0FBK0MsWUFBVTtBQUN4RCxRQUFJLE9BQU8sR0FBRyxFQUFkOztBQUNBLFFBQUksV0FBVyxHQUFHLFNBQWQsV0FBYyxDQUFTLFNBQVQsRUFBb0I7QUFDckMsTUFBQSxPQUFPLENBQUMsU0FBUyxDQUFDLFlBQVgsQ0FBUCxHQUFrQyxTQUFTLENBQUMsT0FBNUM7QUFDQSxLQUZEOztBQUdBLFFBQUksWUFBWSxHQUFHLFNBQWYsWUFBZSxDQUFTLGtCQUFULEVBQTZCLFNBQTdCLEVBQXdDO0FBQzFELGFBQU8sQ0FBQyxDQUFDLEtBQUYsQ0FBUSxrQkFBUixFQUE0QixTQUFTLENBQUMsT0FBdEMsQ0FBUDtBQUNBLEtBRkQ7O0FBR0EsUUFBSSxVQUFVLEdBQUcsU0FBYixVQUFhLENBQVMsVUFBVCxFQUFxQjtBQUNyQyxVQUFJLFNBQVMsR0FBSyxDQUFDLENBQUQsS0FBTyxDQUFDLENBQUMsT0FBRixDQUFVLFVBQVYsRUFBc0IsVUFBVSxDQUFDLENBQUQsQ0FBVixDQUFjLE9BQXBDLENBQXpCO0FBQ0EsYUFBTztBQUNOLFFBQUEsSUFBSSxFQUFHLENBQUUsU0FBUyxHQUFHLFFBQUgsR0FBYyxFQUF6QixJQUErQixVQURoQztBQUVOLFFBQUEsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFYLENBQW1CLGNBQW5CLEVBQW1DLEVBQW5DLEtBQTJDLFNBQVMsR0FBRyxxQkFBSCxHQUEyQixFQUEvRTtBQUZELE9BQVA7QUFJQSxLQU5EOztBQU9BLElBQUEsVUFBVSxDQUFDLE9BQVgsQ0FBbUIsV0FBbkI7QUFFQSxRQUFJLGFBQWEsR0FBRyxVQUFVLENBQUMsTUFBWCxDQUFrQixZQUFsQixFQUFnQyxFQUFoQyxFQUFvQyxHQUFwQyxDQUF3QyxVQUF4QyxDQUFwQjtBQUVBLElBQUEsZUFBZSxDQUFDLE9BQWhCLENBQXdCLE9BQXhCLEVBQWlDLGFBQWpDO0FBQ0EsR0FwQkQ7QUFzQkEsU0FBTyxlQUFQO0FBQ0EsQ0FsR0Q7QUFvR0E7Ozs7Ozs7QUFLQSxJQUFJLG1CQUFtQixHQUFHLFNBQXRCLG1CQUFzQixHQUFXO0FBQ3BDLE1BQUksYUFBYSxHQUFHLEtBQUssQ0FBQyxJQUFOLENBQVcsU0FBWCxDQUFwQjtBQUNBLE1BQUksbUJBQW1CLEdBQUcsS0FBSyxDQUFDLElBQU4sQ0FBVyxlQUFYLENBQTFCOztBQUNBLE1BQ0MsQ0FBQyxhQUFELElBQ0EsQ0FBQyxhQUFhLENBQUMsS0FEZixJQUN3QixDQUFDLGFBQWEsQ0FBQyxTQUR2QyxJQUVBLENBQUMsbUJBRkQsSUFHQSxDQUFDLG1CQUFtQixDQUFDLEtBSHJCLElBRzhCLENBQUMsbUJBQW1CLENBQUMsU0FKcEQsRUFLRTtBQUNELFdBQU8sQ0FBQyxDQUFDLFFBQUYsR0FBYSxNQUFiLEVBQVA7QUFDQTs7QUFDRCxNQUFLLHVCQUFZLGFBQWEsQ0FBQyxTQUExQixLQUF3Qyx1QkFBWSxtQkFBbUIsQ0FBQyxTQUFoQyxDQUE3QyxFQUEwRjtBQUN6RjtBQUNBLElBQUEsdUJBQXVCLEdBQUcsSUFBMUIsQ0FBK0IsWUFBL0I7QUFDQTs7QUFDRCxTQUFPLENBQUMsQ0FBQyxRQUFGLEdBQWEsT0FBYixDQUFxQixhQUFhLENBQUMsS0FBbkMsRUFBMEMsbUJBQW1CLENBQUMsS0FBOUQsQ0FBUDtBQUNBLENBaEJEO0FBa0JBOzs7Ozs7OztBQU1BLElBQUksVUFBVSxHQUFHLFNBQWIsVUFBYTtBQUFBLFNBQU0sbUJBQW1CLEdBQUcsSUFBdEIsRUFDdEI7QUFDQSxZQUFDLE9BQUQsRUFBVSxPQUFWO0FBQUEsV0FBc0IsQ0FBQyxDQUFDLFFBQUYsR0FBYSxPQUFiLENBQXFCLE9BQXJCLEVBQThCLE9BQTlCLENBQXRCO0FBQUEsR0FGc0IsRUFHdEI7QUFDQSxjQUFNO0FBQ0wsUUFBSSxjQUFjLEdBQUcsdUJBQXVCLEVBQTVDO0FBQ0EsSUFBQSxjQUFjLENBQUMsSUFBZixDQUFvQixZQUFwQjtBQUNBLFdBQU8sY0FBUDtBQUNBLEdBUnFCLENBQU47QUFBQSxDQUFqQjs7ZUFXZSxVOzs7Ozs7Ozs7OztBQ3pKZjs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUFFQSxJQUFJLFVBQVUsR0FBRyxTQUFiLFVBQWEsQ0FBUyxVQUFULEVBQXFCO0FBQ3JDLE1BQUssVUFBTCxFQUFrQjtBQUNqQixJQUFBLFVBQVUsQ0FBQyxjQUFYO0FBQ0E7O0FBRUQsTUFBSSxxQkFBcUIsR0FBRyxDQUFDLENBQUMsUUFBRixFQUE1QjtBQUVBLE1BQUksV0FBVyxHQUFHLEVBQUUsQ0FBQyxLQUFILENBQVMsV0FBVCxDQUFxQixtQkFBTyxFQUFQLENBQVUsVUFBL0IsQ0FBbEI7QUFDQSxNQUFJLFFBQVEsR0FBRyxXQUFXLElBQUksV0FBVyxDQUFDLFdBQVosRUFBOUI7QUFDQSxNQUFJLFdBQVcsR0FBRyxXQUFXLElBQUksV0FBVyxDQUFDLGNBQVosRUFBakMsQ0FUcUMsQ0FXckM7O0FBQ0EsTUFBSSxjQUFjLEdBQUcsNkJBQXJCLENBWnFDLENBY3JDOztBQUNBLE1BQUksZUFBZSxHQUFHLFVBQUksR0FBSixDQUFTO0FBQzlCLElBQUEsTUFBTSxFQUFFLE9BRHNCO0FBRTlCLElBQUEsSUFBSSxFQUFFLFdBRndCO0FBRzlCLElBQUEsTUFBTSxFQUFFLFNBSHNCO0FBSTlCLElBQUEsU0FBUyxFQUFFLEdBSm1CO0FBSzlCLElBQUEsTUFBTSxFQUFFLFFBQVEsQ0FBQyxlQUFULEVBTHNCO0FBTTlCLElBQUEsWUFBWSxFQUFFO0FBTmdCLEdBQVQsRUFPbEIsSUFQa0IsQ0FPYixVQUFVLE1BQVYsRUFBa0I7QUFDMUIsUUFBSSxFQUFFLEdBQUcsTUFBTSxDQUFDLEtBQVAsQ0FBYSxPQUF0QjtBQUNBLFFBQUksUUFBUSxHQUFLLEVBQUUsR0FBRyxDQUFQLEdBQWEsRUFBYixHQUFrQixNQUFNLENBQUMsS0FBUCxDQUFhLEtBQWIsQ0FBbUIsRUFBbkIsRUFBdUIsU0FBdkIsQ0FBaUMsQ0FBakMsRUFBb0MsR0FBcEMsQ0FBakM7QUFDQSxXQUFPLFFBQVA7QUFDQSxHQVhxQixDQUF0QixDQWZxQyxDQTRCckM7OztBQUNBLE1BQUksZ0JBQWdCLEdBQUcsZUFBZSxDQUFDLElBQWhCLENBQXFCLFVBQUEsUUFBUTtBQUFBLFdBQUksOEJBQWUsUUFBZixFQUF5QixJQUF6QixDQUFKO0FBQUEsR0FBN0IsRUFBaUU7QUFBakUsR0FDckIsSUFEcUIsQ0FDaEIsVUFBQSxTQUFTO0FBQUEsV0FBSSxpQ0FBa0IsU0FBbEIsQ0FBSjtBQUFBLEdBRE8sRUFDMkI7QUFEM0IsR0FFckIsSUFGcUIsQ0FFaEIsVUFBQSxTQUFTLEVBQUk7QUFDbEIsV0FBTyxjQUFjLENBQUMsSUFBZixDQUFvQixVQUFDLFVBQUQsRUFBZ0I7QUFBRTtBQUM1QyxhQUFPLFNBQVMsQ0FBQyxNQUFWLENBQWlCLFVBQUEsUUFBUSxFQUFJO0FBQUU7QUFDckMsWUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLFVBQVQsR0FDWixRQUFRLENBQUMsVUFBVCxDQUFvQixXQUFwQixFQURZLEdBRVosUUFBUSxDQUFDLFFBQVQsR0FBb0IsV0FBcEIsRUFGSDtBQUdBLGVBQU8sVUFBVSxDQUFDLFdBQVgsQ0FBdUIsUUFBdkIsQ0FBZ0MsUUFBaEMsS0FDUSxVQUFVLENBQUMsY0FBWCxDQUEwQixRQUExQixDQUFtQyxRQUFuQyxDQURSLElBRVEsVUFBVSxDQUFDLFFBQVgsQ0FBb0IsUUFBcEIsQ0FBNkIsUUFBN0IsQ0FGZjtBQUdBLE9BUE0sRUFRTCxHQVJLLENBUUQsVUFBUyxRQUFULEVBQW1CO0FBQUU7QUFDekIsWUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLFVBQVQsR0FDWixRQUFRLENBQUMsVUFBVCxDQUFvQixXQUFwQixFQURZLEdBRVosUUFBUSxDQUFDLFFBQVQsR0FBb0IsV0FBcEIsRUFGSDs7QUFHQSxZQUFJLFVBQVUsQ0FBQyxRQUFYLENBQW9CLFFBQXBCLENBQTZCLFFBQTdCLENBQUosRUFBNEM7QUFDM0MsVUFBQSxRQUFRLENBQUMsV0FBVCxHQUF1QixFQUFFLENBQUMsS0FBSCxDQUFTLFdBQVQsQ0FBcUIsb0JBQW9CLFFBQXpDLENBQXZCO0FBQ0E7O0FBQ0QsZUFBTyxRQUFQO0FBQ0EsT0FoQkssQ0FBUDtBQWlCQSxLQWxCTSxDQUFQO0FBbUJBLEdBdEJxQixDQUF2QixDQTdCcUMsQ0FxRHJDOztBQUNBLE1BQUksbUJBQW1CLEdBQUcsZ0JBQWdCLENBQUMsSUFBakIsQ0FBc0IsVUFBQSxTQUFTLEVBQUk7QUFDNUQsSUFBQSxTQUFTLENBQUMsT0FBVixDQUFrQixVQUFBLFFBQVE7QUFBQSxhQUFJLFFBQVEsQ0FBQywwQkFBVCxFQUFKO0FBQUEsS0FBMUI7QUFDQSxXQUFPLFNBQVA7QUFDQSxHQUh5QixDQUExQixDQXREcUMsQ0EyRHJDOztBQUNBLE1BQUksb0JBQW9CLEdBQUcsVUFBSSxNQUFKLENBQVcsV0FBVyxDQUFDLGVBQVosRUFBWCxFQUN6QixJQUR5QixFQUV6QjtBQUNBLFlBQVMsT0FBVCxFQUFrQjtBQUNqQixRQUFLLGlCQUFpQixJQUFqQixDQUFzQixPQUF0QixDQUFMLEVBQXNDO0FBQ3JDO0FBQ0EsYUFBTyxPQUFPLENBQUMsS0FBUixDQUFjLE9BQU8sQ0FBQyxPQUFSLENBQWdCLElBQWhCLElBQXNCLENBQXBDLEVBQXVDLE9BQU8sQ0FBQyxPQUFSLENBQWdCLElBQWhCLENBQXZDLEtBQWlFLElBQXhFO0FBQ0E7O0FBQ0QsV0FBTyxLQUFQO0FBQ0EsR0FUd0IsRUFVekI7QUFDQSxjQUFXO0FBQUUsV0FBTyxJQUFQO0FBQWMsR0FYRixDQUEzQixDQTVEcUMsQ0EwRXJDOzs7QUFDQSxNQUFJLGFBQWEsR0FBSyxtQkFBTyxFQUFQLENBQVUsaUJBQVYsSUFBK0IsQ0FBckQ7O0FBQ0EsTUFBSyxhQUFMLEVBQXFCO0FBQ3BCLFFBQUksa0JBQWtCLEdBQUcsV0FBVyxDQUFDLFVBQVosS0FDdEIsQ0FBQyxDQUFDLFFBQUYsR0FBYSxPQUFiLENBQXFCLG1CQUFPLEVBQVAsQ0FBVSxZQUEvQixDQURzQixHQUVyQixVQUFJLEdBQUosQ0FBUztBQUNYLE1BQUEsTUFBTSxFQUFFLE9BREc7QUFFWCxNQUFBLE1BQU0sRUFBRSxNQUZHO0FBR1gsTUFBQSxJQUFJLEVBQUUsV0FISztBQUlYLE1BQUEsTUFBTSxFQUFFLFdBQVcsQ0FBQyxlQUFaLEVBSkc7QUFLWCxNQUFBLE1BQU0sRUFBRSxLQUxHO0FBTVgsTUFBQSxZQUFZLEVBQUU7QUFOSCxLQUFULEVBT0MsSUFQRCxDQU9NLFVBQVMsTUFBVCxFQUFpQjtBQUN6QixVQUFJLE1BQU0sQ0FBQyxLQUFQLENBQWEsU0FBakIsRUFBNEI7QUFDM0IsZUFBTyxLQUFQO0FBQ0E7O0FBQ0QsVUFBSSxFQUFFLEdBQUcsTUFBTSxDQUFDLEtBQVAsQ0FBYSxPQUF0QjtBQUNBLFVBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxLQUFQLENBQWEsS0FBYixDQUFtQixFQUFuQixDQUFYOztBQUNBLFVBQUksSUFBSSxDQUFDLE9BQUwsS0FBaUIsRUFBckIsRUFBeUI7QUFDeEIsZUFBTyxLQUFQO0FBQ0E7O0FBQ0QsVUFBSyxFQUFFLEdBQUcsQ0FBVixFQUFjO0FBQ2IsZUFBTyxDQUFDLENBQUMsUUFBRixHQUFhLE1BQWIsRUFBUDtBQUNBOztBQUNELGFBQU8sSUFBSSxDQUFDLFNBQUwsQ0FBZSxDQUFmLEVBQWtCLEtBQXpCO0FBQ0EsS0FwQkUsQ0FGSjtBQXVCQSxRQUFJLFdBQVcsR0FBRyxrQkFBa0IsQ0FBQyxJQUFuQixDQUF3QixVQUFTLFdBQVQsRUFBc0I7QUFDL0QsVUFBSSxDQUFDLFdBQUwsRUFBa0I7QUFDakIsZUFBTyxLQUFQO0FBQ0E7O0FBQ0QsYUFBTyxVQUFJLE9BQUosQ0FBWSxXQUFaLEVBQ0wsSUFESyxDQUNBLFVBQVMsTUFBVCxFQUFpQjtBQUN0QixZQUFJLElBQUksR0FBRyxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQWQsQ0FBcUIsV0FBckIsRUFBa0MsSUFBN0M7O0FBQ0EsWUFBSyxJQUFJLENBQUMsS0FBVixFQUFrQjtBQUNqQixpQkFBTyxDQUFDLENBQUMsUUFBRixHQUFhLE1BQWIsQ0FBb0IsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUEvQixFQUFxQyxJQUFJLENBQUMsS0FBTCxDQUFXLE9BQWhELENBQVA7QUFDQTs7QUFDRCxlQUFPLElBQUksQ0FBQyxLQUFMLENBQVcsVUFBbEI7QUFDQSxPQVBLLENBQVA7QUFRQSxLQVppQixDQUFsQjtBQWFBLEdBakhvQyxDQW1IckM7OztBQUNBLE1BQUksZUFBZSxHQUFHLENBQUMsQ0FBQyxRQUFGLEVBQXRCOztBQUNBLE1BQUksYUFBYSxHQUFHLDBCQUFjLFVBQWQsQ0FBeUIsWUFBekIsRUFBdUM7QUFDMUQsSUFBQSxRQUFRLEVBQUUsQ0FDVCxjQURTLEVBRVQsZUFGUyxFQUdULGdCQUhTLEVBSVQsbUJBSlMsRUFLVCxvQkFMUyxFQU1ULGFBQWEsSUFBSSxXQU5SLENBRGdEO0FBUzFELElBQUEsSUFBSSxFQUFFLGFBVG9EO0FBVTFELElBQUEsUUFBUSxFQUFFO0FBVmdELEdBQXZDLENBQXBCOztBQWFBLEVBQUEsYUFBYSxDQUFDLE1BQWQsQ0FBcUIsSUFBckIsQ0FBMEIsZUFBZSxDQUFDLE9BQTFDO0FBR0EsRUFBQSxDQUFDLENBQUMsSUFBRixDQUNDLGVBREQsRUFFQyxtQkFGRCxFQUdDLG9CQUhELEVBSUMsYUFBYSxJQUFJLFdBSmxCLEVBS0UsSUFMRixFQU1DO0FBQ0EsWUFBUyxZQUFULEVBQXVCLE9BQXZCLEVBQWdDLGNBQWhDLEVBQWdELGVBQWhELEVBQWtFO0FBQ2pFLFFBQUksTUFBTSxHQUFHO0FBQ1osTUFBQSxPQUFPLEVBQUUsSUFERztBQUVaLE1BQUEsUUFBUSxFQUFFLFFBRkU7QUFHWixNQUFBLFlBQVksRUFBRSxZQUhGO0FBSVosTUFBQSxPQUFPLEVBQUU7QUFKRyxLQUFiOztBQU1BLFFBQUksY0FBSixFQUFvQjtBQUNuQixNQUFBLE1BQU0sQ0FBQyxjQUFQLEdBQXdCLGNBQXhCO0FBQ0E7O0FBQ0QsUUFBSSxlQUFKLEVBQXFCO0FBQ3BCLE1BQUEsTUFBTSxDQUFDLGVBQVAsR0FBeUIsZUFBekI7QUFDQTs7QUFDRCw4QkFBYyxXQUFkLENBQTBCLFlBQTFCLEVBQXdDLE1BQXhDO0FBRUEsR0F0QkYsRUFySXFDLENBNEpsQztBQUVIOztBQUNBLEVBQUEsYUFBYSxDQUFDLE1BQWQsQ0FBcUIsSUFBckIsQ0FBMEIsVUFBUyxJQUFULEVBQWU7QUFDeEMsUUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLE9BQWpCLEVBQTBCO0FBQ3pCO0FBQ0EsTUFBQSxxQkFBcUIsQ0FBQyxPQUF0QixDQUE4QixJQUE5QjtBQUNBLEtBSEQsTUFHTyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsS0FBakIsRUFBd0I7QUFDOUI7QUFDQSxNQUFBLHFCQUFxQixDQUFDLE1BQXRCLENBQTZCLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBeEMsRUFBOEMsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUF6RDtBQUNBLEtBSE0sTUFHQTtBQUNOO0FBQ0EsTUFBQSxxQkFBcUIsQ0FBQyxPQUF0QixDQUE4QixJQUE5QjtBQUNBOztBQUNELElBQUEsS0FBSyxDQUFDLGlCQUFOO0FBQ0EsR0FaRCxFQS9KcUMsQ0E2S3JDOztBQUNBLEVBQUEscUJBQXFCLENBQUMsSUFBdEIsQ0FDQyxVQUFBLElBQUk7QUFBQSxXQUFJLE9BQU8sQ0FBQyxHQUFSLENBQVkscUJBQVosRUFBbUMsSUFBbkMsQ0FBSjtBQUFBLEdBREwsRUFFQyxVQUFDLElBQUQsRUFBTyxJQUFQO0FBQUEsV0FBZ0IsT0FBTyxDQUFDLEdBQVIsQ0FBWSxnQ0FBWixFQUE4QztBQUFDLE1BQUEsSUFBSSxFQUFKLElBQUQ7QUFBTyxNQUFBLElBQUksRUFBSjtBQUFQLEtBQTlDLENBQWhCO0FBQUEsR0FGRDtBQUtBLFNBQU8scUJBQVA7QUFDQSxDQXBMRDs7ZUFzTGUsVTs7Ozs7Ozs7Ozs7QUMzTGY7Ozs7OztBQUVBLElBQUksV0FBVyxHQUFHLFNBQWQsV0FBYyxDQUFTLFVBQVQsRUFBcUI7QUFDdEMsU0FBTyxJQUFJLElBQUosQ0FBUyxVQUFULElBQXVCLElBQUksSUFBSixFQUE5QjtBQUNBLENBRkQ7OztBQUlBLElBQUksR0FBRyxHQUFHLElBQUksRUFBRSxDQUFDLEdBQVAsQ0FBWTtBQUNyQixFQUFBLElBQUksRUFBRTtBQUNMLElBQUEsT0FBTyxFQUFFO0FBQ1Isd0JBQWtCLFdBQVcsbUJBQU8sTUFBUCxDQUFjLE9BQXpCLEdBQ2pCO0FBRk87QUFESjtBQURlLENBQVosQ0FBVjtBQVFBOzs7O0FBQ0EsR0FBRyxDQUFDLE9BQUosR0FBYyxVQUFTLFVBQVQsRUFBcUI7QUFDbEMsU0FBTyxDQUFDLENBQUMsR0FBRixDQUFNLG9FQUFrRSxVQUF4RSxDQUFQO0FBQ0EsQ0FGRDtBQUdBOzs7QUFDQSxHQUFHLENBQUMsTUFBSixHQUFhLFVBQVMsSUFBVCxFQUFlO0FBQzNCLFNBQU8sQ0FBQyxDQUFDLEdBQUYsQ0FBTSxXQUFXLG1CQUFPLEVBQVAsQ0FBVSxRQUFyQixHQUFnQyxFQUFFLENBQUMsSUFBSCxDQUFRLE1BQVIsQ0FBZSxJQUFmLEVBQXFCO0FBQUMsSUFBQSxNQUFNLEVBQUM7QUFBUixHQUFyQixDQUF0QyxFQUNMLElBREssQ0FDQSxVQUFTLElBQVQsRUFBZTtBQUNwQixRQUFLLENBQUMsSUFBTixFQUFhO0FBQ1osYUFBTyxDQUFDLENBQUMsUUFBRixHQUFhLE1BQWIsQ0FBb0IsY0FBcEIsQ0FBUDtBQUNBOztBQUNELFdBQU8sSUFBUDtBQUNBLEdBTkssQ0FBUDtBQU9BLENBUkQ7O0FBVUEsSUFBSSxZQUFZLEdBQUcsU0FBZixZQUFlLENBQVMsS0FBVCxFQUFnQixNQUFoQixFQUF3QjtBQUMxQyxNQUFJLElBQUosRUFBVSxHQUFWLEVBQWUsT0FBZjs7QUFDQSxNQUFLLFFBQU8sS0FBUCxNQUFpQixRQUFqQixJQUE2QixPQUFPLE1BQVAsS0FBa0IsUUFBcEQsRUFBK0Q7QUFDOUQ7QUFDQSxRQUFJLFFBQVEsR0FBRyxLQUFLLENBQUMsWUFBTixJQUFzQixLQUFLLENBQUMsWUFBTixDQUFtQixLQUF4RDs7QUFDQSxRQUFLLFFBQUwsRUFBZ0I7QUFDZjtBQUNBLE1BQUEsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFoQjtBQUNBLE1BQUEsT0FBTyxHQUFHLFFBQVEsQ0FBQyxPQUFuQjtBQUNBLEtBSkQsTUFJTztBQUNOLE1BQUEsR0FBRyxHQUFHLEtBQU47QUFDQTtBQUNELEdBVkQsTUFVTyxJQUFLLE9BQU8sS0FBUCxLQUFpQixRQUFqQixJQUE2QixRQUFPLE1BQVAsTUFBa0IsUUFBcEQsRUFBK0Q7QUFDckU7QUFDQSxRQUFJLFVBQVUsR0FBRyxNQUFNLENBQUMsS0FBeEI7O0FBQ0EsUUFBSSxVQUFKLEVBQWdCO0FBQ2Y7QUFDQSxNQUFBLElBQUksR0FBRyxRQUFRLENBQUMsSUFBaEI7QUFDQSxNQUFBLE9BQU8sR0FBRyxRQUFRLENBQUMsSUFBbkI7QUFDQSxLQUpELE1BSU8sSUFBSSxLQUFLLEtBQUssY0FBZCxFQUE4QjtBQUNwQyxNQUFBLElBQUksR0FBRyxJQUFQO0FBQ0EsTUFBQSxPQUFPLEdBQUcsdUNBQVY7QUFDQSxLQUhNLE1BR0E7QUFDTixNQUFBLEdBQUcsR0FBRyxNQUFNLElBQUksTUFBTSxDQUFDLEdBQXZCO0FBQ0E7QUFDRDs7QUFFRCxNQUFJLElBQUksSUFBSSxPQUFaLEVBQXFCO0FBQ3BCLCtCQUFvQixJQUFwQixlQUE2QixPQUE3QjtBQUNBLEdBRkQsTUFFTyxJQUFJLE9BQUosRUFBYTtBQUNuQixnQ0FBcUIsT0FBckI7QUFDQSxHQUZNLE1BRUEsSUFBSSxHQUFKLEVBQVM7QUFDZixnQ0FBcUIsR0FBRyxDQUFDLE1BQXpCO0FBQ0EsR0FGTSxNQUVBLElBQ04sT0FBTyxLQUFQLEtBQWlCLFFBQWpCLElBQTZCLEtBQUssS0FBSyxPQUF2QyxJQUNBLE9BQU8sTUFBUCxLQUFrQixRQURsQixJQUM4QixNQUFNLEtBQUssT0FGbkMsRUFHTDtBQUNELDJCQUFnQixLQUFoQixlQUEwQixNQUExQjtBQUNBLEdBTE0sTUFLQSxJQUFJLE9BQU8sS0FBUCxLQUFpQixRQUFqQixJQUE2QixLQUFLLEtBQUssT0FBM0MsRUFBb0Q7QUFDMUQsNEJBQWlCLEtBQWpCO0FBQ0EsR0FGTSxNQUVBO0FBQ04sV0FBTyxtQkFBUDtBQUNBO0FBQ0QsQ0EzQ0Q7Ozs7Ozs7Ozs7OztBQy9CQTs7QUFDQTs7OztBQUVBLElBQUksT0FBTyxHQUFHLElBQUksRUFBRSxDQUFDLE9BQVAsRUFBZCxDLENBRUE7O0FBQ0EsT0FBTyxDQUFDLFFBQVIsQ0FBaUIsc0JBQWpCO0FBQ0EsT0FBTyxDQUFDLFFBQVIsQ0FBaUIsc0JBQWpCO0FBRUEsSUFBSSxPQUFPLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBSCxDQUFNLGFBQVYsQ0FBeUI7QUFDdEMsYUFBVztBQUQyQixDQUF6QixDQUFkO0FBR0EsQ0FBQyxDQUFFLFFBQVEsQ0FBQyxJQUFYLENBQUQsQ0FBbUIsTUFBbkIsQ0FBMkIsT0FBTyxDQUFDLFFBQW5DO2VBRWUsTyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImltcG9ydCBzZXR1cFJhdGVyIGZyb20gXCIuL3NldHVwXCI7XHJcbmltcG9ydCBhdXRvU3RhcnQgZnJvbSBcIi4vYXV0b3N0YXJ0XCI7XHJcbmltcG9ydCBkaWZmU3R5bGVzIGZyb20gXCIuL2Nzcy5qc1wiO1xyXG5pbXBvcnQgeyBtYWtlRXJyb3JNc2cgfSBmcm9tIFwiLi91dGlsXCI7XHJcbmltcG9ydCB3aW5kb3dNYW5hZ2VyIGZyb20gXCIuL3dpbmRvd01hbmFnZXJcIjtcclxuXHJcbihmdW5jdGlvbiBBcHAoKSB7XHJcblx0Y29uc29sZS5sb2coXCJSYXRlcidzIEFwcC5qcyBpcyBydW5uaW5nLi4uXCIpO1xyXG5cclxuXHRtdy51dGlsLmFkZENTUyhkaWZmU3R5bGVzKTtcclxuXHJcblx0Y29uc3Qgc2hvd01haW5XaW5kb3cgPSBkYXRhID0+IHtcclxuXHRcdGlmICghZGF0YSB8fCAhZGF0YS5zdWNjZXNzKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHR3aW5kb3dNYW5hZ2VyLm9wZW5XaW5kb3coXCJtYWluXCIsIGRhdGEpO1xyXG5cdH07XHJcblxyXG5cdGNvbnN0IHNob3dTZXR1cEVycm9yID0gKGNvZGUsIGpxeGhyKSA9PiBPTy51aS5hbGVydChcclxuXHRcdG1ha2VFcnJvck1zZyhjb2RlLCBqcXhociksXHR7XHJcblx0XHRcdHRpdGxlOiBcIlJhdGVyIGZhaWxlZCB0byBvcGVuXCJcclxuXHRcdH1cclxuXHQpO1xyXG5cclxuXHQvLyBJbnZvY2F0aW9uIGJ5IHBvcnRsZXQgbGluayBcclxuXHRtdy51dGlsLmFkZFBvcnRsZXRMaW5rKFxyXG5cdFx0XCJwLWNhY3Rpb25zXCIsXHJcblx0XHRcIiNcIixcclxuXHRcdFwiUmF0ZXJcIixcclxuXHRcdFwiY2EtcmF0ZXJcIixcclxuXHRcdFwiUmF0ZSBxdWFsaXR5IGFuZCBpbXBvcnRhbmNlXCIsXHJcblx0XHRcIjVcIlxyXG5cdCk7XHJcblx0JChcIiNjYS1yYXRlclwiKS5jbGljaygoKSA9PiBzZXR1cFJhdGVyKCkudGhlbihzaG93TWFpbldpbmRvdywgc2hvd1NldHVwRXJyb3IpICk7XHJcblxyXG5cdC8vIEludm9jYXRpb24gYnkgYXV0by1zdGFydCAoZG8gbm90IHNob3cgbWVzc2FnZSBvbiBlcnJvcilcclxuXHRhdXRvU3RhcnQoKS50aGVuKHNob3dNYWluV2luZG93KTtcclxufSkoKTsiLCJpbXBvcnQge0FQSSwgaXNBZnRlckRhdGV9IGZyb20gXCIuL3V0aWxcIjtcclxuaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuaW1wb3J0ICogYXMgY2FjaGUgZnJvbSBcIi4vY2FjaGVcIjtcclxuXHJcbi8qKiBUZW1wbGF0ZVxyXG4gKlxyXG4gKiBAY2xhc3NcclxuICogUmVwcmVzZW50cyB0aGUgd2lraXRleHQgb2YgdGVtcGxhdGUgdHJhbnNjbHVzaW9uLiBVc2VkIGJ5ICNwYXJzZVRlbXBsYXRlcy5cclxuICogQHByb3Age1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSB0ZW1wbGF0ZVxyXG4gKiBAcHJvcCB7U3RyaW5nfSB3aWtpdGV4dCBGdWxsIHdpa2l0ZXh0IG9mIHRoZSB0cmFuc2NsdXNpb25cclxuICogQHByb3Age09iamVjdFtdfSBwYXJhbWV0ZXJzIFBhcmFtZXRlcnMgdXNlZCBpbiB0aGUgdHJhbnNsY3VzaW9uLCBpbiBvcmRlciwgb2YgZm9ybTpcclxuXHR7XHJcblx0XHRuYW1lOiB7U3RyaW5nfE51bWJlcn0gcGFyYW1ldGVyIG5hbWUsIG9yIHBvc2l0aW9uIGZvciB1bm5hbWVkIHBhcmFtZXRlcnMsXHJcblx0XHR2YWx1ZToge1N0cmluZ30gV2lraXRleHQgcGFzc2VkIHRvIHRoZSBwYXJhbWV0ZXIgKHdoaXRlc3BhY2UgdHJpbW1lZCksXHJcblx0XHR3aWtpdGV4dDoge1N0cmluZ30gRnVsbCB3aWtpdGV4dCAoaW5jbHVkaW5nIGxlYWRpbmcgcGlwZSwgcGFyYW1ldGVyIG5hbWUvZXF1YWxzIHNpZ24gKGlmIGFwcGxpY2FibGUpLCB2YWx1ZSwgYW5kIGFueSB3aGl0ZXNwYWNlKVxyXG5cdH1cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB3aWtpdGV4dCBXaWtpdGV4dCBvZiBhIHRlbXBsYXRlIHRyYW5zY2x1c2lvbiwgc3RhcnRpbmcgd2l0aCAne3snIGFuZCBlbmRpbmcgd2l0aCAnfX0nLlxyXG4gKi9cclxudmFyIFRlbXBsYXRlID0gZnVuY3Rpb24od2lraXRleHQpIHtcclxuXHR0aGlzLndpa2l0ZXh0ID0gd2lraXRleHQ7XHJcblx0dGhpcy5wYXJhbWV0ZXJzID0gW107XHJcbn07XHJcblRlbXBsYXRlLnByb3RvdHlwZS5hZGRQYXJhbSA9IGZ1bmN0aW9uKG5hbWUsIHZhbCwgd2lraXRleHQpIHtcclxuXHR0aGlzLnBhcmFtZXRlcnMucHVzaCh7XHJcblx0XHRcIm5hbWVcIjogbmFtZSxcclxuXHRcdFwidmFsdWVcIjogdmFsLCBcclxuXHRcdFwid2lraXRleHRcIjogXCJ8XCIgKyB3aWtpdGV4dFxyXG5cdH0pO1xyXG59O1xyXG4vKipcclxuICogR2V0IGEgcGFyYW1ldGVyIGRhdGEgYnkgcGFyYW1ldGVyIG5hbWVcclxuICovIFxyXG5UZW1wbGF0ZS5wcm90b3R5cGUuZ2V0UGFyYW0gPSBmdW5jdGlvbihwYXJhbU5hbWUpIHtcclxuXHRyZXR1cm4gdGhpcy5wYXJhbWV0ZXJzLmZpbmQoZnVuY3Rpb24ocCkgeyByZXR1cm4gcC5uYW1lID09IHBhcmFtTmFtZTsgfSk7XHJcbn07XHJcblRlbXBsYXRlLnByb3RvdHlwZS5zZXROYW1lID0gZnVuY3Rpb24obmFtZSkge1xyXG5cdHRoaXMubmFtZSA9IG5hbWUudHJpbSgpO1xyXG59O1xyXG5UZW1wbGF0ZS5wcm90b3R5cGUuZ2V0VGl0bGUgPSBmdW5jdGlvbigpIHtcclxuXHRyZXR1cm4gbXcuVGl0bGUubmV3RnJvbVRleHQoXCJUZW1wbGF0ZTpcIiArIHRoaXMubmFtZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogcGFyc2VUZW1wbGF0ZXNcclxuICpcclxuICogUGFyc2VzIHRlbXBsYXRlcyBmcm9tIHdpa2l0ZXh0LlxyXG4gKiBCYXNlZCBvbiBTRDAwMDEncyB2ZXJzaW9uIGF0IDxodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Vc2VyOlNEMDAwMS9wYXJzZUFsbFRlbXBsYXRlcy5qcz4uXHJcbiAqIFJldHVybnMgYW4gYXJyYXkgY29udGFpbmluZyB0aGUgdGVtcGxhdGUgZGV0YWlsczpcclxuICogIHZhciB0ZW1wbGF0ZXMgPSBwYXJzZVRlbXBsYXRlcyhcIkhlbGxvIHt7Zm9vIHxCYXJ8YmF6PXF1eCB8Mj1sb3JlbWlwc3VtfDM9fX0gd29ybGRcIik7XHJcbiAqICBjb25zb2xlLmxvZyh0ZW1wbGF0ZXNbMF0pOyAvLyAtLT4gb2JqZWN0XHJcblx0e1xyXG5cdFx0bmFtZTogXCJmb29cIixcclxuXHRcdHdpa2l0ZXh0Olwie3tmb28gfEJhcnxiYXo9cXV4IHwgMiA9IGxvcmVtaXBzdW0gIHwzPX19XCIsXHJcblx0XHRwYXJhbWV0ZXJzOiBbXHJcblx0XHRcdHtcclxuXHRcdFx0XHRuYW1lOiAxLFxyXG5cdFx0XHRcdHZhbHVlOiAnQmFyJyxcclxuXHRcdFx0XHR3aWtpdGV4dDogJ3xCYXInXHJcblx0XHRcdH0sXHJcblx0XHRcdHtcclxuXHRcdFx0XHRuYW1lOiAnYmF6JyxcclxuXHRcdFx0XHR2YWx1ZTogJ3F1eCcsXHJcblx0XHRcdFx0d2lraXRleHQ6ICd8YmF6PXF1eCAnXHJcblx0XHRcdH0sXHJcblx0XHRcdHtcclxuXHRcdFx0XHRuYW1lOiAnMicsXHJcblx0XHRcdFx0dmFsdWU6ICdsb3JlbWlwc3VtJyxcclxuXHRcdFx0XHR3aWtpdGV4dDogJ3wgMiA9IGxvcmVtaXBzdW0gICdcclxuXHRcdFx0fSxcclxuXHRcdFx0e1xyXG5cdFx0XHRcdG5hbWU6ICczJyxcclxuXHRcdFx0XHR2YWx1ZTogJycsXHJcblx0XHRcdFx0d2lraXRleHQ6ICd8Mz0nXHJcblx0XHRcdH1cclxuXHRcdF0sXHJcblx0XHRnZXRQYXJhbTogZnVuY3Rpb24ocGFyYW1OYW1lKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnBhcmFtZXRlcnMuZmluZChmdW5jdGlvbihwKSB7IHJldHVybiBwLm5hbWUgPT0gcGFyYW1OYW1lOyB9KTtcclxuXHRcdH1cclxuXHR9XHJcbiAqICAgIFxyXG4gKiBcclxuICogQHBhcmFtIHtTdHJpbmd9IHdpa2l0ZXh0XHJcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gcmVjdXJzaXZlIFNldCB0byBgdHJ1ZWAgdG8gYWxzbyBwYXJzZSB0ZW1wbGF0ZXMgdGhhdCBvY2N1ciB3aXRoaW4gb3RoZXIgdGVtcGxhdGVzLFxyXG4gKiAgcmF0aGVyIHRoYW4ganVzdCB0b3AtbGV2ZWwgdGVtcGxhdGVzLiBcclxuICogQHJldHVybiB7VGVtcGxhdGVbXX0gdGVtcGxhdGVzXHJcbiovXHJcbnZhciBwYXJzZVRlbXBsYXRlcyA9IGZ1bmN0aW9uKHdpa2l0ZXh0LCByZWN1cnNpdmUpIHsgLyogZXNsaW50LWRpc2FibGUgbm8tY29udHJvbC1yZWdleCAqL1xyXG5cdGlmICghd2lraXRleHQpIHtcclxuXHRcdHJldHVybiBbXTtcclxuXHR9XHJcblx0dmFyIHN0clJlcGxhY2VBdCA9IGZ1bmN0aW9uKHN0cmluZywgaW5kZXgsIGNoYXIpIHtcclxuXHRcdHJldHVybiBzdHJpbmcuc2xpY2UoMCxpbmRleCkgKyBjaGFyICsgc3RyaW5nLnNsaWNlKGluZGV4ICsgMSk7XHJcblx0fTtcclxuXHJcblx0dmFyIHJlc3VsdCA9IFtdO1xyXG5cdFxyXG5cdHZhciBwcm9jZXNzVGVtcGxhdGVUZXh0ID0gZnVuY3Rpb24gKHN0YXJ0SWR4LCBlbmRJZHgpIHtcclxuXHRcdHZhciB0ZXh0ID0gd2lraXRleHQuc2xpY2Uoc3RhcnRJZHgsIGVuZElkeCk7XHJcblxyXG5cdFx0dmFyIHRlbXBsYXRlID0gbmV3IFRlbXBsYXRlKFwie3tcIiArIHRleHQucmVwbGFjZSgvXFx4MDEvZyxcInxcIikgKyBcIn19XCIpO1xyXG5cdFx0XHJcblx0XHQvLyBzd2FwIG91dCBwaXBlIGluIGxpbmtzIHdpdGggXFx4MDEgY29udHJvbCBjaGFyYWN0ZXJcclxuXHRcdC8vIFtbRmlsZTogXV0gY2FuIGhhdmUgbXVsdGlwbGUgcGlwZXMsIHNvIG1pZ2h0IG5lZWQgbXVsdGlwbGUgcGFzc2VzXHJcblx0XHR3aGlsZSAoIC8oXFxbXFxbW15cXF1dKj8pXFx8KC4qP1xcXVxcXSkvZy50ZXN0KHRleHQpICkge1xyXG5cdFx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFxbXFxbW15cXF1dKj8pXFx8KC4qP1xcXVxcXSkvZywgXCIkMVxceDAxJDJcIik7XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGNodW5rcyA9IHRleHQuc3BsaXQoXCJ8XCIpLm1hcChmdW5jdGlvbihjaHVuaykge1xyXG5cdFx0XHQvLyBjaGFuZ2UgJ1xceDAxJyBjb250cm9sIGNoYXJhY3RlcnMgYmFjayB0byBwaXBlc1xyXG5cdFx0XHRyZXR1cm4gY2h1bmsucmVwbGFjZSgvXFx4MDEvZyxcInxcIik7IFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGVtcGxhdGUuc2V0TmFtZShjaHVua3NbMF0pO1xyXG5cdFx0XHJcblx0XHR2YXIgcGFyYW1ldGVyQ2h1bmtzID0gY2h1bmtzLnNsaWNlKDEpO1xyXG5cclxuXHRcdHZhciB1bm5hbWVkSWR4ID0gMTtcclxuXHRcdHBhcmFtZXRlckNodW5rcy5mb3JFYWNoKGZ1bmN0aW9uKGNodW5rKSB7XHJcblx0XHRcdHZhciBpbmRleE9mRXF1YWxUbyA9IGNodW5rLmluZGV4T2YoXCI9XCIpO1xyXG5cdFx0XHR2YXIgaW5kZXhPZk9wZW5CcmFjZXMgPSBjaHVuay5pbmRleE9mKFwie3tcIik7XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgaXNXaXRob3V0RXF1YWxzID0gIWNodW5rLmluY2x1ZGVzKFwiPVwiKTtcclxuXHRcdFx0dmFyIGhhc0JyYWNlc0JlZm9yZUVxdWFscyA9IGNodW5rLmluY2x1ZGVzKFwie3tcIikgJiYgaW5kZXhPZk9wZW5CcmFjZXMgPCBpbmRleE9mRXF1YWxUbztcdFxyXG5cdFx0XHR2YXIgaXNVbm5hbWVkUGFyYW0gPSAoIGlzV2l0aG91dEVxdWFscyB8fCBoYXNCcmFjZXNCZWZvcmVFcXVhbHMgKTtcclxuXHRcdFx0XHJcblx0XHRcdHZhciBwTmFtZSwgcE51bSwgcFZhbDtcclxuXHRcdFx0aWYgKCBpc1VubmFtZWRQYXJhbSApIHtcclxuXHRcdFx0XHQvLyBHZXQgdGhlIG5leHQgbnVtYmVyIG5vdCBhbHJlYWR5IHVzZWQgYnkgZWl0aGVyIGFuIHVubmFtZWQgcGFyYW1ldGVyLCBvciBieSBhXHJcblx0XHRcdFx0Ly8gbmFtZWQgcGFyYW1ldGVyIGxpa2UgYHwxPXZhbGBcclxuXHRcdFx0XHR3aGlsZSAoIHRlbXBsYXRlLmdldFBhcmFtKHVubmFtZWRJZHgpICkge1xyXG5cdFx0XHRcdFx0dW5uYW1lZElkeCsrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRwTnVtID0gdW5uYW1lZElkeDtcclxuXHRcdFx0XHRwVmFsID0gY2h1bmsudHJpbSgpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHBOYW1lID0gY2h1bmsuc2xpY2UoMCwgaW5kZXhPZkVxdWFsVG8pLnRyaW0oKTtcclxuXHRcdFx0XHRwVmFsID0gY2h1bmsuc2xpY2UoaW5kZXhPZkVxdWFsVG8gKyAxKS50cmltKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0dGVtcGxhdGUuYWRkUGFyYW0ocE5hbWUgfHwgcE51bSwgcFZhbCwgY2h1bmspO1xyXG5cdFx0fSk7XHJcblx0XHRcclxuXHRcdHJlc3VsdC5wdXNoKHRlbXBsYXRlKTtcclxuXHR9O1xyXG5cclxuXHRcclxuXHR2YXIgbiA9IHdpa2l0ZXh0Lmxlbmd0aDtcclxuXHRcclxuXHQvLyBudW1iZXIgb2YgdW5jbG9zZWQgYnJhY2VzXHJcblx0dmFyIG51bVVuY2xvc2VkID0gMDtcclxuXHJcblx0Ly8gYXJlIHdlIGluc2lkZSBhIGNvbW1lbnQgb3IgYmV0d2VlbiBub3dpa2kgdGFncz9cclxuXHR2YXIgaW5Db21tZW50ID0gZmFsc2U7XHJcblx0dmFyIGluTm93aWtpID0gZmFsc2U7XHJcblxyXG5cdHZhciBzdGFydElkeCwgZW5kSWR4O1xyXG5cdFxyXG5cdGZvciAodmFyIGk9MDsgaTxuOyBpKyspIHtcclxuXHRcdFxyXG5cdFx0aWYgKCAhaW5Db21tZW50ICYmICFpbk5vd2lraSApIHtcclxuXHRcdFx0XHJcblx0XHRcdGlmICh3aWtpdGV4dFtpXSA9PT0gXCJ7XCIgJiYgd2lraXRleHRbaSsxXSA9PT0gXCJ7XCIpIHtcclxuXHRcdFx0XHRpZiAobnVtVW5jbG9zZWQgPT09IDApIHtcclxuXHRcdFx0XHRcdHN0YXJ0SWR4ID0gaSsyO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRudW1VbmNsb3NlZCArPSAyO1xyXG5cdFx0XHRcdGkrKztcclxuXHRcdFx0fSBlbHNlIGlmICh3aWtpdGV4dFtpXSA9PT0gXCJ9XCIgJiYgd2lraXRleHRbaSsxXSA9PT0gXCJ9XCIpIHtcclxuXHRcdFx0XHRpZiAobnVtVW5jbG9zZWQgPT09IDIpIHtcclxuXHRcdFx0XHRcdGVuZElkeCA9IGk7XHJcblx0XHRcdFx0XHRwcm9jZXNzVGVtcGxhdGVUZXh0KHN0YXJ0SWR4LCBlbmRJZHgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRudW1VbmNsb3NlZCAtPSAyO1xyXG5cdFx0XHRcdGkrKztcclxuXHRcdFx0fSBlbHNlIGlmICh3aWtpdGV4dFtpXSA9PT0gXCJ8XCIgJiYgbnVtVW5jbG9zZWQgPiAyKSB7XHJcblx0XHRcdFx0Ly8gc3dhcCBvdXQgcGlwZXMgaW4gbmVzdGVkIHRlbXBsYXRlcyB3aXRoIFxceDAxIGNoYXJhY3RlclxyXG5cdFx0XHRcdHdpa2l0ZXh0ID0gc3RyUmVwbGFjZUF0KHdpa2l0ZXh0LCBpLFwiXFx4MDFcIik7XHJcblx0XHRcdH0gZWxzZSBpZiAoIC9ePCEtLS8udGVzdCh3aWtpdGV4dC5zbGljZShpLCBpICsgNCkpICkge1xyXG5cdFx0XHRcdGluQ29tbWVudCA9IHRydWU7XHJcblx0XHRcdFx0aSArPSAzO1xyXG5cdFx0XHR9IGVsc2UgaWYgKCAvXjxub3dpa2kgPz4vLnRlc3Qod2lraXRleHQuc2xpY2UoaSwgaSArIDkpKSApIHtcclxuXHRcdFx0XHRpbk5vd2lraSA9IHRydWU7XHJcblx0XHRcdFx0aSArPSA3O1xyXG5cdFx0XHR9IFxyXG5cclxuXHRcdH0gZWxzZSB7IC8vIHdlIGFyZSBpbiBhIGNvbW1lbnQgb3Igbm93aWtpXHJcblx0XHRcdGlmICh3aWtpdGV4dFtpXSA9PT0gXCJ8XCIpIHtcclxuXHRcdFx0XHQvLyBzd2FwIG91dCBwaXBlcyB3aXRoIFxceDAxIGNoYXJhY3RlclxyXG5cdFx0XHRcdHdpa2l0ZXh0ID0gc3RyUmVwbGFjZUF0KHdpa2l0ZXh0LCBpLFwiXFx4MDFcIik7XHJcblx0XHRcdH0gZWxzZSBpZiAoL14tLT4vLnRlc3Qod2lraXRleHQuc2xpY2UoaSwgaSArIDMpKSkge1xyXG5cdFx0XHRcdGluQ29tbWVudCA9IGZhbHNlO1xyXG5cdFx0XHRcdGkgKz0gMjtcclxuXHRcdFx0fSBlbHNlIGlmICgvXjxcXC9ub3dpa2kgPz4vLnRlc3Qod2lraXRleHQuc2xpY2UoaSwgaSArIDEwKSkpIHtcclxuXHRcdFx0XHRpbk5vd2lraSA9IGZhbHNlO1xyXG5cdFx0XHRcdGkgKz0gODtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHR9XHJcblx0XHJcblx0aWYgKCByZWN1cnNpdmUgKSB7XHJcblx0XHR2YXIgc3VidGVtcGxhdGVzID0gcmVzdWx0Lm1hcChmdW5jdGlvbih0ZW1wbGF0ZSkge1xyXG5cdFx0XHRyZXR1cm4gdGVtcGxhdGUud2lraXRleHQuc2xpY2UoMiwtMik7XHJcblx0XHR9KVxyXG5cdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKHRlbXBsYXRlV2lraXRleHQpIHtcclxuXHRcdFx0XHRyZXR1cm4gL1xce1xcey4qXFx9XFx9Ly50ZXN0KHRlbXBsYXRlV2lraXRleHQpO1xyXG5cdFx0XHR9KVxyXG5cdFx0XHQubWFwKGZ1bmN0aW9uKHRlbXBsYXRlV2lraXRleHQpIHtcclxuXHRcdFx0XHRyZXR1cm4gcGFyc2VUZW1wbGF0ZXModGVtcGxhdGVXaWtpdGV4dCwgdHJ1ZSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHJcblx0XHRyZXR1cm4gcmVzdWx0LmNvbmNhdC5hcHBseShyZXN1bHQsIHN1YnRlbXBsYXRlcyk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gcmVzdWx0OyBcclxufTsgLyogZXNsaW50LWVuYWJsZSBuby1jb250cm9sLXJlZ2V4ICovXHJcblxyXG4vKipcclxuICogQHBhcmFtIHtUZW1wbGF0ZXxUZW1wbGF0ZVtdfSB0ZW1wbGF0ZXNcclxuICogQHJldHVybiB7UHJvbWlzZTxUZW1wbGF0ZVtdPn1cclxuICovXHJcbnZhciBnZXRXaXRoUmVkaXJlY3RUbyA9IGZ1bmN0aW9uKHRlbXBsYXRlcykge1xyXG5cdHZhciB0ZW1wbGF0ZXNBcnJheSA9IEFycmF5LmlzQXJyYXkodGVtcGxhdGVzKSA/IHRlbXBsYXRlcyA6IFt0ZW1wbGF0ZXNdO1xyXG5cdGlmICh0ZW1wbGF0ZXNBcnJheS5sZW5ndGggPT09IDApIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVzb2x2ZShbXSk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gQVBJLmdldCh7XHJcblx0XHRcImFjdGlvblwiOiBcInF1ZXJ5XCIsXHJcblx0XHRcImZvcm1hdFwiOiBcImpzb25cIixcclxuXHRcdFwidGl0bGVzXCI6IHRlbXBsYXRlc0FycmF5Lm1hcCh0ZW1wbGF0ZSA9PiB0ZW1wbGF0ZS5nZXRUaXRsZSgpLmdldFByZWZpeGVkVGV4dCgpKSxcclxuXHRcdFwicmVkaXJlY3RzXCI6IDFcclxuXHR9KS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0aWYgKCAhcmVzdWx0IHx8ICFyZXN1bHQucXVlcnkgKSB7XHJcblx0XHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KFwiRW1wdHkgcmVzcG9uc2VcIik7XHJcblx0XHR9XHJcblx0XHRpZiAoIHJlc3VsdC5xdWVyeS5yZWRpcmVjdHMgKSB7XHJcblx0XHRcdHJlc3VsdC5xdWVyeS5yZWRpcmVjdHMuZm9yRWFjaChmdW5jdGlvbihyZWRpcmVjdCkge1xyXG5cdFx0XHRcdHZhciBpID0gdGVtcGxhdGVzQXJyYXkuZmluZEluZGV4KHRlbXBsYXRlID0+IHRlbXBsYXRlLmdldFRpdGxlKCkuZ2V0UHJlZml4ZWRUZXh0KCkgPT09IHJlZGlyZWN0LmZyb20pO1xyXG5cdFx0XHRcdGlmIChpICE9PSAtMSkge1xyXG5cdFx0XHRcdFx0dGVtcGxhdGVzQXJyYXlbaV0ucmVkaXJlY3RzVG8gPSBtdy5UaXRsZS5uZXdGcm9tVGV4dChyZWRpcmVjdC50byk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0ZW1wbGF0ZXNBcnJheTtcclxuXHR9KTtcclxufTtcclxuXHJcblRlbXBsYXRlLnByb3RvdHlwZS5nZXREYXRhRm9yUGFyYW0gPSBmdW5jdGlvbihrZXksIHBhcmFOYW1lKSB7XHJcblx0aWYgKCAhdGhpcy5wYXJhbURhdGEgKSB7XHJcblx0XHRyZXR1cm4gbnVsbDtcclxuXHR9XHJcblx0Ly8gSWYgYWxpYXMsIHN3aXRjaCBmcm9tIGFsaWFzIHRvIHByZWZlcnJlZCBwYXJhbWV0ZXIgbmFtZVxyXG5cdHZhciBwYXJhID0gdGhpcy5wYXJhbUFsaWFzZXNbcGFyYU5hbWVdIHx8IHBhcmFOYW1lO1x0XHJcblx0aWYgKCAhdGhpcy5wYXJhbURhdGFbcGFyYV0gKSB7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdFxyXG5cdHZhciBkYXRhID0gdGhpcy5wYXJhbURhdGFbcGFyYV1ba2V5XTtcclxuXHQvLyBEYXRhIG1pZ2h0IGFjdHVhbGx5IGJlIGFuIG9iamVjdCB3aXRoIGtleSBcImVuXCJcclxuXHRpZiAoIGRhdGEgJiYgZGF0YS5lbiAmJiAhQXJyYXkuaXNBcnJheShkYXRhKSApIHtcclxuXHRcdHJldHVybiBkYXRhLmVuO1xyXG5cdH1cclxuXHRyZXR1cm4gZGF0YTtcclxufTtcclxuXHJcblRlbXBsYXRlLnByb3RvdHlwZS5zZXRQYXJhbURhdGFBbmRTdWdnZXN0aW9ucyA9IGZ1bmN0aW9uKCkge1xyXG5cdHZhciBzZWxmID0gdGhpcztcclxuXHR2YXIgcGFyYW1EYXRhU2V0ID0gJC5EZWZlcnJlZCgpO1xyXG5cdFxyXG5cdGlmICggc2VsZi5wYXJhbURhdGEgKSB7IHJldHVybiBwYXJhbURhdGFTZXQucmVzb2x2ZSgpOyB9XHJcbiAgICBcclxuXHR2YXIgcHJlZml4ZWRUZXh0ID0gc2VsZi5yZWRpcmVjdHNUb1xyXG5cdFx0PyBzZWxmLnJlZGlyZWN0c1RvLmdldFByZWZpeGVkVGV4dCgpXHJcblx0XHQ6IHNlbGYuZ2V0VGl0bGUoKS5nZXRQcmVmaXhlZFRleHQoKTtcclxuXHJcblx0dmFyIGNhY2hlZEluZm8gPSBjYWNoZS5yZWFkKHByZWZpeGVkVGV4dCArIFwiLXBhcmFtc1wiKTtcclxuXHRcclxuXHRpZiAoXHJcblx0XHRjYWNoZWRJbmZvICYmXHJcblx0XHRjYWNoZWRJbmZvLnZhbHVlICYmXHJcblx0XHRjYWNoZWRJbmZvLnN0YWxlRGF0ZSAmJlxyXG5cdFx0Y2FjaGVkSW5mby52YWx1ZS5wYXJhbURhdGEgIT0gbnVsbCAmJlxyXG5cdFx0Y2FjaGVkSW5mby52YWx1ZS5wYXJhbWV0ZXJTdWdnZXN0aW9ucyAhPSBudWxsICYmXHJcblx0XHRjYWNoZWRJbmZvLnZhbHVlLnBhcmFtQWxpYXNlcyAhPSBudWxsXHJcblx0KSB7XHJcblx0XHRzZWxmLm5vdGVtcGxhdGVkYXRhID0gY2FjaGVkSW5mby52YWx1ZS5ub3RlbXBsYXRlZGF0YTtcclxuXHRcdHNlbGYucGFyYW1EYXRhID0gY2FjaGVkSW5mby52YWx1ZS5wYXJhbURhdGE7XHJcblx0XHRzZWxmLnBhcmFtZXRlclN1Z2dlc3Rpb25zID0gY2FjaGVkSW5mby52YWx1ZS5wYXJhbWV0ZXJTdWdnZXN0aW9ucztcclxuXHRcdHNlbGYucGFyYW1BbGlhc2VzID0gY2FjaGVkSW5mby52YWx1ZS5wYXJhbUFsaWFzZXM7XHJcblx0XHRcclxuXHRcdHBhcmFtRGF0YVNldC5yZXNvbHZlKCk7XHJcblx0XHRpZiAoICFpc0FmdGVyRGF0ZShjYWNoZWRJbmZvLnN0YWxlRGF0ZSkgKSB7XHJcblx0XHRcdC8vIEp1c3QgdXNlIHRoZSBjYWNoZWQgZGF0YVxyXG5cdFx0XHRyZXR1cm4gcGFyYW1EYXRhU2V0O1xyXG5cdFx0fSAvLyBlbHNlOiBVc2UgdGhlIGNhY2hlIGRhdGEgZm9yIG5vdywgYnV0IGFsc28gZmV0Y2ggbmV3IGRhdGEgZnJvbSBBUElcclxuXHR9XHJcblx0XHJcblx0QVBJLmdldCh7XHJcblx0XHRhY3Rpb246IFwidGVtcGxhdGVkYXRhXCIsXHJcblx0XHR0aXRsZXM6IHByZWZpeGVkVGV4dCxcclxuXHRcdHJlZGlyZWN0czogMSxcclxuXHRcdGluY2x1ZGVNaXNzaW5nVGl0bGVzOiAxXHJcblx0fSlcclxuXHRcdC50aGVuKFxyXG5cdFx0XHRmdW5jdGlvbihyZXNwb25zZSkgeyByZXR1cm4gcmVzcG9uc2U7IH0sXHJcblx0XHRcdGZ1bmN0aW9uKC8qZXJyb3IqLykgeyByZXR1cm4gbnVsbDsgfSAvLyBJZ25vcmUgZXJyb3JzLCB3aWxsIHVzZSBkZWZhdWx0IGRhdGFcclxuXHRcdClcclxuXHRcdC50aGVuKCBmdW5jdGlvbihyZXN1bHQpIHtcclxuXHRcdC8vIEZpZ3VyZSBvdXQgcGFnZSBpZCAoYmVhY3VzZSBhY3Rpb249dGVtcGxhdGVkYXRhIGRvZXNuJ3QgaGF2ZSBhbiBpbmRleHBhZ2VpZHMgb3B0aW9uKVxyXG5cdFx0XHR2YXIgaWQgPSByZXN1bHQgJiYgJC5tYXAocmVzdWx0LnBhZ2VzLCBmdW5jdGlvbiggX3ZhbHVlLCBrZXkgKSB7IHJldHVybiBrZXk7IH0pO1xyXG5cdFx0XHJcblx0XHRcdGlmICggIXJlc3VsdCB8fCAhcmVzdWx0LnBhZ2VzW2lkXSB8fCByZXN1bHQucGFnZXNbaWRdLm5vdGVtcGxhdGVkYXRhIHx8ICFyZXN1bHQucGFnZXNbaWRdLnBhcmFtcyApIHtcclxuXHRcdFx0Ly8gTm8gVGVtcGxhdGVEYXRhLCBzbyB1c2UgZGVmYXVsdHMgKGd1ZXNzZXMpXHJcblx0XHRcdFx0c2VsZi5ub3RlbXBsYXRlZGF0YSA9IHRydWU7XHJcblx0XHRcdFx0c2VsZi50ZW1wbGF0ZWRhdGFBcGlFcnJvciA9ICFyZXN1bHQ7XHJcblx0XHRcdFx0c2VsZi5wYXJhbURhdGEgPSBjb25maWcuZGVmYXVsdFBhcmFtZXRlckRhdGE7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0c2VsZi5wYXJhbURhdGEgPSByZXN1bHQucGFnZXNbaWRdLnBhcmFtcztcclxuXHRcdFx0fVxyXG4gICAgICAgIFxyXG5cdFx0XHRzZWxmLnBhcmFtQWxpYXNlcyA9IHt9O1xyXG5cdFx0XHQkLmVhY2goc2VsZi5wYXJhbURhdGEsIGZ1bmN0aW9uKHBhcmFOYW1lLCBwYXJhRGF0YSkge1xyXG5cdFx0XHRcdC8vIEV4dHJhY3QgYWxpYXNlcyBmb3IgZWFzaWVyIHJlZmVyZW5jZSBsYXRlciBvblxyXG5cdFx0XHRcdGlmICggcGFyYURhdGEuYWxpYXNlcyAmJiBwYXJhRGF0YS5hbGlhc2VzLmxlbmd0aCApIHtcclxuXHRcdFx0XHRcdHBhcmFEYXRhLmFsaWFzZXMuZm9yRWFjaChmdW5jdGlvbihhbGlhcyl7XHJcblx0XHRcdFx0XHRcdHNlbGYucGFyYW1BbGlhc2VzW2FsaWFzXSA9IHBhcmFOYW1lO1xyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIEV4dHJhY3QgYWxsb3dlZCB2YWx1ZXMgYXJyYXkgZnJvbSBkZXNjcmlwdGlvblxyXG5cdFx0XHRcdGlmICggcGFyYURhdGEuZGVzY3JpcHRpb24gJiYgL1xcWy4qJy4rPycuKj9cXF0vLnRlc3QocGFyYURhdGEuZGVzY3JpcHRpb24uZW4pICkge1xyXG5cdFx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdFx0dmFyIGFsbG93ZWRWYWxzID0gSlNPTi5wYXJzZShcclxuXHRcdFx0XHRcdFx0XHRwYXJhRGF0YS5kZXNjcmlwdGlvbi5lblxyXG5cdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoL14uKlxcWy8sXCJbXCIpXHJcblx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvXCIvZywgXCJcXFxcXFxcIlwiKVxyXG5cdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoLycvZywgXCJcXFwiXCIpXHJcblx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvLFxccypdLywgXCJdXCIpXHJcblx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvXS4qJC8sIFwiXVwiKVxyXG5cdFx0XHRcdFx0XHQpO1xyXG5cdFx0XHRcdFx0XHRzZWxmLnBhcmFtRGF0YVtwYXJhTmFtZV0uYWxsb3dlZFZhbHVlcyA9IGFsbG93ZWRWYWxzO1xyXG5cdFx0XHRcdFx0fSBjYXRjaChlKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUud2FybihcIltSYXRlcl0gQ291bGQgbm90IHBhcnNlIGFsbG93ZWQgdmFsdWVzIGluIGRlc2NyaXB0aW9uOlxcbiAgXCIrXHJcblx0XHRcdFx0XHRwYXJhRGF0YS5kZXNjcmlwdGlvbi5lbiArIFwiXFxuIENoZWNrIFRlbXBsYXRlRGF0YSBmb3IgcGFyYW1ldGVyIHxcIiArIHBhcmFOYW1lICtcclxuXHRcdFx0XHRcdFwiPSBpbiBcIiArIHNlbGYuZ2V0VGl0bGUoKS5nZXRQcmVmaXhlZFRleHQoKSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIE1ha2Ugc3VyZSByZXF1aXJlZC9zdWdnZXN0ZWQgcGFyYW1ldGVycyBhcmUgcHJlc2VudFxyXG5cdFx0XHRcdGlmICggKHBhcmFEYXRhLnJlcXVpcmVkIHx8IHBhcmFEYXRhLnN1Z2dlc3RlZCkgJiYgIXNlbGYuZ2V0UGFyYW0ocGFyYU5hbWUpICkge1xyXG5cdFx0XHRcdC8vIENoZWNrIGlmIGFscmVhZHkgcHJlc2VudCBpbiBhbiBhbGlhcywgaWYgYW55XHJcblx0XHRcdFx0XHRpZiAoIHBhcmFEYXRhLmFsaWFzZXMubGVuZ3RoICkge1xyXG5cdFx0XHRcdFx0XHR2YXIgYWxpYXNlcyA9IHNlbGYucGFyYW1ldGVycy5maWx0ZXIocCA9PiB7XHJcblx0XHRcdFx0XHRcdFx0dmFyIGlzQWxpYXMgPSBwYXJhRGF0YS5hbGlhc2VzLmluY2x1ZGVzKHAubmFtZSk7XHJcblx0XHRcdFx0XHRcdFx0dmFyIGlzRW1wdHkgPSAhcC52YWw7XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGlzQWxpYXMgJiYgIWlzRW1wdHk7XHJcblx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0XHRpZiAoIGFsaWFzZXMubGVuZ3RoICkge1xyXG5cdFx0XHRcdFx0XHQvLyBBdCBsZWFzdCBvbmUgbm9uLWVtcHR5IGFsaWFzLCBzbyBkbyBub3RoaW5nXHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvLyBObyBub24tZW1wdHkgYWxpYXNlcywgc28gc2V0IHBhcmFtZXRlciB0byBlaXRoZXIgdGhlIGF1dG92YXVsZSwgb3JcclxuXHRcdFx0XHRcdC8vIGFuIGVtcHR5IHN0cmluZyAod2l0aG91dCB0b3VjaGluZywgdW5sZXNzIGl0IGlzIGEgcmVxdWlyZWQgcGFyYW1ldGVyKVxyXG5cdFx0XHRcdFx0c2VsZi5wYXJhbWV0ZXJzLnB1c2goe1xyXG5cdFx0XHRcdFx0XHRuYW1lOnBhcmFOYW1lLFxyXG5cdFx0XHRcdFx0XHR2YWx1ZTogcGFyYURhdGEuYXV0b3ZhbHVlIHx8IFwiXCIsXHJcblx0XHRcdFx0XHRcdGF1dG9maWxsZWQ6IHRydWVcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHRcclxuXHRcdFx0Ly8gTWFrZSBzdWdnZXN0aW9ucyBmb3IgY29tYm9ib3hcclxuXHRcdFx0dmFyIGFsbFBhcmFtc0FycmF5ID0gKCAhc2VsZi5ub3RlbXBsYXRlZGF0YSAmJiByZXN1bHQucGFnZXNbaWRdLnBhcmFtT3JkZXIgKSB8fFxyXG5cdFx0XHQkLm1hcChzZWxmLnBhcmFtRGF0YSwgZnVuY3Rpb24oX3ZhbCwga2V5KXtcclxuXHRcdFx0XHRyZXR1cm4ga2V5O1xyXG5cdFx0XHR9KTtcclxuXHRcdFx0c2VsZi5wYXJhbWV0ZXJTdWdnZXN0aW9ucyA9IGFsbFBhcmFtc0FycmF5LmZpbHRlcihmdW5jdGlvbihwYXJhbU5hbWUpIHtcclxuXHRcdFx0XHRyZXR1cm4gKCBwYXJhbU5hbWUgJiYgcGFyYW1OYW1lICE9PSBcImNsYXNzXCIgJiYgcGFyYW1OYW1lICE9PSBcImltcG9ydGFuY2VcIiApO1xyXG5cdFx0XHR9KVxyXG5cdFx0XHRcdC5tYXAoZnVuY3Rpb24ocGFyYW1OYW1lKSB7XHJcblx0XHRcdFx0XHR2YXIgb3B0aW9uT2JqZWN0ID0ge2RhdGE6IHBhcmFtTmFtZX07XHJcblx0XHRcdFx0XHR2YXIgbGFiZWwgPSBzZWxmLmdldERhdGFGb3JQYXJhbShsYWJlbCwgcGFyYW1OYW1lKTtcclxuXHRcdFx0XHRcdGlmICggbGFiZWwgKSB7XHJcblx0XHRcdFx0XHRcdG9wdGlvbk9iamVjdC5sYWJlbCA9IGxhYmVsICsgXCIgKHxcIiArIHBhcmFtTmFtZSArIFwiPSlcIjtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHJldHVybiBvcHRpb25PYmplY3Q7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcclxuXHRcdFx0aWYgKCBzZWxmLnRlbXBsYXRlZGF0YUFwaUVycm9yICkge1xyXG5cdFx0XHRcdC8vIERvbid0IHNhdmUgZGVmYXVsdHMvZ3Vlc3NlcyB0byBjYWNoZTtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHJcblx0XHRcdGNhY2hlLndyaXRlKHByZWZpeGVkVGV4dCArIFwiLXBhcmFtc1wiLCB7XHJcblx0XHRcdFx0bm90ZW1wbGF0ZWRhdGE6IHNlbGYubm90ZW1wbGF0ZWRhdGEsXHJcblx0XHRcdFx0cGFyYW1EYXRhOiBzZWxmLnBhcmFtRGF0YSxcclxuXHRcdFx0XHRwYXJhbWV0ZXJTdWdnZXN0aW9uczogc2VsZi5wYXJhbWV0ZXJTdWdnZXN0aW9ucyxcclxuXHRcdFx0XHRwYXJhbUFsaWFzZXM6IHNlbGYucGFyYW1BbGlhc2VzXHJcblx0XHRcdH0sXHQxXHJcblx0XHRcdCk7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fSlcclxuXHRcdC50aGVuKFxyXG5cdFx0XHRwYXJhbURhdGFTZXQucmVzb2x2ZSxcclxuXHRcdFx0cGFyYW1EYXRhU2V0LnJlamVjdFxyXG5cdFx0KTtcclxuXHRcclxuXHRyZXR1cm4gcGFyYW1EYXRhU2V0O1x0XHJcbn07XHJcblxyXG5leHBvcnQge1RlbXBsYXRlLCBwYXJzZVRlbXBsYXRlcywgZ2V0V2l0aFJlZGlyZWN0VG99OyIsImltcG9ydCB7bWFrZUVycm9yTXNnfSBmcm9tIFwiLi4vdXRpbFwiO1xyXG5cclxuLyogdmFyIGluY3JlbWVudFByb2dyZXNzQnlJbnRlcnZhbCA9IGZ1bmN0aW9uKCkge1xyXG5cdHZhciBpbmNyZW1lbnRJbnRlcnZhbERlbGF5ID0gMTAwO1xyXG5cdHZhciBpbmNyZW1lbnRJbnRlcnZhbEFtb3VudCA9IDAuMTtcclxuXHR2YXIgaW5jcmVtZW50SW50ZXJ2YWxNYXh2YWwgPSA5ODtcclxuXHRyZXR1cm4gd2luZG93LnNldEludGVydmFsKFxyXG5cdFx0aW5jcmVtZW50UHJvZ3Jlc3MsXHJcblx0XHRpbmNyZW1lbnRJbnRlcnZhbERlbGF5LFxyXG5cdFx0aW5jcmVtZW50SW50ZXJ2YWxBbW91bnQsXHJcblx0XHRpbmNyZW1lbnRJbnRlcnZhbE1heHZhbFxyXG5cdCk7XHJcbn07ICovXHJcblxyXG52YXIgTG9hZERpYWxvZyA9IGZ1bmN0aW9uIExvYWREaWFsb2coIGNvbmZpZyApIHtcclxuXHRMb2FkRGlhbG9nLnN1cGVyLmNhbGwoIHRoaXMsIGNvbmZpZyApO1xyXG59O1xyXG5PTy5pbmhlcml0Q2xhc3MoIExvYWREaWFsb2csIE9PLnVpLkRpYWxvZyApOyBcclxuXHJcbkxvYWREaWFsb2cuc3RhdGljLm5hbWUgPSBcImxvYWREaWFsb2dcIjtcclxuTG9hZERpYWxvZy5zdGF0aWMudGl0bGUgPSBcIkxvYWRpbmcgUmF0ZXIuLi5cIjtcclxuXHJcbi8vIEN1c3RvbWl6ZSB0aGUgaW5pdGlhbGl6ZSgpIGZ1bmN0aW9uOiBUaGlzIGlzIHdoZXJlIHRvIGFkZCBjb250ZW50IHRvIHRoZSBkaWFsb2cgYm9keSBhbmQgc2V0IHVwIGV2ZW50IGhhbmRsZXJzLlxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5pbml0aWFsaXplID0gZnVuY3Rpb24gKCkge1xyXG5cdC8vIENhbGwgdGhlIHBhcmVudCBtZXRob2QuXHJcblx0TG9hZERpYWxvZy5zdXBlci5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKCB0aGlzICk7XHJcblx0Ly8gQ3JlYXRlIGEgbGF5b3V0XHJcblx0dGhpcy5jb250ZW50ID0gbmV3IE9PLnVpLlBhbmVsTGF5b3V0KCB7IFxyXG5cdFx0cGFkZGVkOiB0cnVlLFxyXG5cdFx0ZXhwYW5kZWQ6IGZhbHNlIFxyXG5cdH0gKTtcclxuXHQvLyBDcmVhdGUgY29udGVudFxyXG5cdHRoaXMucHJvZ3Jlc3NCYXIgPSBuZXcgT08udWkuUHJvZ3Jlc3NCYXJXaWRnZXQoIHtcclxuXHRcdHByb2dyZXNzOiAxXHJcblx0fSApO1xyXG5cdHRoaXMuc2V0dXB0YXNrcyA9IFtcclxuXHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJMb2FkaW5nIGxpc3Qgb2YgcHJvamVjdCBiYW5uZXJzLi4uXCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHAgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSksXHJcblx0XHRuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiTG9hZGluZyB0YWxrcGFnZSB3aWtpdGV4dC4uLlwiLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxwIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrXFxcIj5cIilcclxuXHRcdH0pLFxyXG5cdFx0bmV3IE9PLnVpLkxhYmVsV2lkZ2V0KCB7XHJcblx0XHRcdGxhYmVsOiBcIlBhcnNpbmcgdGFsa3BhZ2UgdGVtcGxhdGVzLi4uXCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHAgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSksXHJcblx0XHRuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiR2V0dGluZyB0ZW1wbGF0ZXMnIHBhcmFtZXRlciBkYXRhLi4uXCIsXHJcblx0XHRcdCRlbGVtZW50OiAkKFwiPHAgc3R5bGU9XFxcImRpc3BsYXk6YmxvY2tcXFwiPlwiKVxyXG5cdFx0fSksXHJcblx0XHRuZXcgT08udWkuTGFiZWxXaWRnZXQoIHtcclxuXHRcdFx0bGFiZWw6IFwiQ2hlY2tpbmcgaWYgcGFnZSByZWRpcmVjdHMuLi5cIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8cCBzdHlsZT1cXFwiZGlzcGxheTpibG9ja1xcXCI+XCIpXHJcblx0XHR9KSxcclxuXHRcdG5ldyBPTy51aS5MYWJlbFdpZGdldCgge1xyXG5cdFx0XHRsYWJlbDogXCJSZXRyaWV2aW5nIHF1YWxpdHkgcHJlZGljdGlvbi4uLlwiLFxyXG5cdFx0XHQkZWxlbWVudDogJChcIjxwIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrXFxcIj5cIilcclxuXHRcdH0pLnRvZ2dsZSgpLFxyXG5cdF07XHJcblx0dGhpcy5jbG9zZUJ1dHRvbiA9IG5ldyBPTy51aS5CdXR0b25XaWRnZXQoIHtcclxuXHRcdGxhYmVsOiBcIkNsb3NlXCJcclxuXHR9KS50b2dnbGUoKTtcclxuXHR0aGlzLnNldHVwUHJvbWlzZXMgPSBbXTtcclxuXHJcblx0Ly8gQXBwZW5kIGNvbnRlbnQgdG8gbGF5b3V0XHJcblx0dGhpcy5jb250ZW50LiRlbGVtZW50LmFwcGVuZChcclxuXHRcdHRoaXMucHJvZ3Jlc3NCYXIuJGVsZW1lbnQsXHJcblx0XHQobmV3IE9PLnVpLkxhYmVsV2lkZ2V0KCB7XHJcblx0XHRcdGxhYmVsOiBcIkluaXRpYWxpc2luZzpcIixcclxuXHRcdFx0JGVsZW1lbnQ6ICQoXCI8c3Ryb25nIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrXFxcIj5cIilcclxuXHRcdH0pKS4kZWxlbWVudCxcclxuXHRcdC4uLnRoaXMuc2V0dXB0YXNrcy5tYXAod2lkZ2V0ID0+IHdpZGdldC4kZWxlbWVudCksXHJcblx0XHR0aGlzLmNsb3NlQnV0dG9uLiRlbGVtZW50XHJcblx0KTtcclxuXHJcblx0Ly8gQXBwZW5kIGxheW91dCB0byBkaWFsb2dcclxuXHR0aGlzLiRib2R5LmFwcGVuZCggdGhpcy5jb250ZW50LiRlbGVtZW50ICk7XHJcblxyXG5cdC8vIENvbm5lY3QgZXZlbnRzIHRvIGhhbmRsZXJzXHJcblx0dGhpcy5jbG9zZUJ1dHRvbi5jb25uZWN0KCB0aGlzLCB7IFwiY2xpY2tcIjogXCJvbkNsb3NlQnV0dG9uQ2xpY2tcIiB9ICk7XHJcbn07XHJcblxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5vbkNsb3NlQnV0dG9uQ2xpY2sgPSBmdW5jdGlvbigpIHtcclxuXHQvLyBDbG9zZSB0aGlzIGRpYWxvZywgd2l0aG91dCBwYXNzaW5nIGFueSBkYXRhXHJcblx0dGhpcy5jbG9zZSgpO1xyXG59O1xyXG5cclxuLy8gT3ZlcnJpZGUgdGhlIGdldEJvZHlIZWlnaHQoKSBtZXRob2QgdG8gc3BlY2lmeSBhIGN1c3RvbSBoZWlnaHQgKG9yIGRvbid0IHRvIHVzZSB0aGUgYXV0b21hdGljYWxseSBnZW5lcmF0ZWQgaGVpZ2h0KS5cclxuTG9hZERpYWxvZy5wcm90b3R5cGUuZ2V0Qm9keUhlaWdodCA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gdGhpcy5jb250ZW50LiRlbGVtZW50Lm91dGVySGVpZ2h0KCB0cnVlICk7XHJcbn07XHJcblxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5pbmNyZW1lbnRQcm9ncmVzcyA9IGZ1bmN0aW9uKGFtb3VudCwgbWF4aW11bSkge1xyXG5cdHZhciBwcmlvclByb2dyZXNzID0gdGhpcy5wcm9ncmVzc0Jhci5nZXRQcm9ncmVzcygpO1xyXG5cdHZhciBpbmNyZW1lbnRlZFByb2dyZXNzID0gTWF0aC5taW4obWF4aW11bSB8fCAxMDAsIHByaW9yUHJvZ3Jlc3MgKyBhbW91bnQpO1xyXG5cdHRoaXMucHJvZ3Jlc3NCYXIuc2V0UHJvZ3Jlc3MoaW5jcmVtZW50ZWRQcm9ncmVzcyk7XHJcbn07XHJcblxyXG5Mb2FkRGlhbG9nLnByb3RvdHlwZS5hZGRUYXNrUHJvbWlzZUhhbmRsZXJzID0gZnVuY3Rpb24odGFza1Byb21pc2VzKSB7XHJcblx0dmFyIG9uVGFza0RvbmUgPSBpbmRleCA9PiB7XHJcblx0XHQvLyBBZGQgXCJEb25lIVwiIHRvIGxhYmVsXHJcblx0XHR2YXIgd2lkZ2V0ID0gdGhpcy5zZXR1cHRhc2tzW2luZGV4XTtcclxuXHRcdHdpZGdldC5zZXRMYWJlbCh3aWRnZXQuZ2V0TGFiZWwoKSArIFwiIERvbmUhXCIpO1xyXG5cdFx0Ly8gSW5jcmVtZW50IHN0YXR1cyBiYXIuIFNob3cgYSBzbW9vdGggdHJhbnNpdGlvbiBieVxyXG5cdFx0Ly8gdXNpbmcgc21hbGwgc3RlcHMgb3ZlciBhIHNob3J0IGR1cmF0aW9uLlxyXG5cdFx0dmFyIHRvdGFsSW5jcmVtZW50ID0gMjA7IC8vIHBlcmNlbnRcclxuXHRcdHZhciB0b3RhbFRpbWUgPSA0MDA7IC8vIG1pbGxpc2Vjb25kc1xyXG5cdFx0dmFyIHRvdGFsU3RlcHMgPSAxMDtcclxuXHRcdHZhciBpbmNyZW1lbnRQZXJTdGVwID0gdG90YWxJbmNyZW1lbnQgLyB0b3RhbFN0ZXBzO1xyXG5cclxuXHRcdGZvciAoIHZhciBzdGVwPTA7IHN0ZXAgPCB0b3RhbFN0ZXBzOyBzdGVwKyspIHtcclxuXHRcdFx0d2luZG93LnNldFRpbWVvdXQoXHJcblx0XHRcdFx0dGhpcy5pbmNyZW1lbnRQcm9ncmVzcy5iaW5kKHRoaXMpLFxyXG5cdFx0XHRcdHRvdGFsVGltZSAqIHN0ZXAgLyB0b3RhbFN0ZXBzLFxyXG5cdFx0XHRcdGluY3JlbWVudFBlclN0ZXBcclxuXHRcdFx0KTtcclxuXHRcdH1cclxuXHR9O1xyXG5cdHZhciBvblRhc2tFcnJvciA9IChpbmRleCwgY29kZSwgaW5mbykgPT4ge1xyXG5cdFx0dmFyIHdpZGdldCA9IHRoaXMuc2V0dXB0YXNrc1tpbmRleF07XHJcblx0XHR3aWRnZXQuc2V0TGFiZWwoXHJcblx0XHRcdHdpZGdldC5nZXRMYWJlbCgpICsgXCIgRmFpbGVkLiBcIiArIG1ha2VFcnJvck1zZyhjb2RlLCBpbmZvKVxyXG5cdFx0KTtcclxuXHRcdHRoaXMuY2xvc2VCdXR0b24udG9nZ2xlKHRydWUpO1xyXG5cdFx0dGhpcy51cGRhdGVTaXplKCk7XHJcblx0fTtcclxuXHR0YXNrUHJvbWlzZXMuZm9yRWFjaChmdW5jdGlvbihwcm9taXNlLCBpbmRleCkge1xyXG5cdFx0cHJvbWlzZS50aGVuKFxyXG5cdFx0XHQoKSA9PiBvblRhc2tEb25lKGluZGV4KSxcclxuXHRcdFx0KGNvZGUsIGluZm8pID0+IG9uVGFza0Vycm9yKGluZGV4LCBjb2RlLCBpbmZvKVxyXG5cdFx0KTtcclxuXHR9KTtcclxufTtcclxuXHJcbi8vIFVzZSBnZXRTZXR1cFByb2Nlc3MoKSB0byBzZXQgdXAgdGhlIHdpbmRvdyB3aXRoIGRhdGEgcGFzc2VkIHRvIGl0IGF0IHRoZSB0aW1lIFxyXG4vLyBvZiBvcGVuaW5nXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmdldFNldHVwUHJvY2VzcyA9IGZ1bmN0aW9uICggZGF0YSApIHtcclxuXHRkYXRhID0gZGF0YSB8fCB7fTtcclxuXHRyZXR1cm4gTG9hZERpYWxvZy5zdXBlci5wcm90b3R5cGUuZ2V0U2V0dXBQcm9jZXNzLmNhbGwoIHRoaXMsIGRhdGEgKVxyXG5cdFx0Lm5leHQoICgpID0+IHtcclxuXHRcdFx0aWYgKGRhdGEub3Jlcykge1xyXG5cdFx0XHRcdHRoaXMuc2V0dXB0YXNrc1s1XS50b2dnbGUoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR2YXIgdGFza1Byb21pc2VzID0gZGF0YS5vcmVzID8gZGF0YS5wcm9taXNlcyA6IGRhdGEucHJvbWlzZXMuc2xpY2UoMCwgLTEpO1xyXG5cdFx0XHRkYXRhLmlzT3BlbmVkLnRoZW4oKCkgPT4gdGhpcy5hZGRUYXNrUHJvbWlzZUhhbmRsZXJzKHRhc2tQcm9taXNlcykpO1xyXG5cdFx0fSwgdGhpcyApO1xyXG59O1xyXG5cclxuLy8gUHJldmVudCB3aW5kb3cgZnJvbSBjbG9zaW5nIHRvbyBxdWlja2x5LCB1c2luZyBnZXRIb2xkUHJvY2VzcygpXHJcbkxvYWREaWFsb2cucHJvdG90eXBlLmdldEhvbGRQcm9jZXNzID0gZnVuY3Rpb24gKCBkYXRhICkge1xyXG5cdGRhdGEgPSBkYXRhIHx8IHt9O1xyXG5cdGlmIChkYXRhLnN1Y2Nlc3MpIHtcclxuXHRcdC8vIFdhaXQgYSBiaXQgYmVmb3JlIHByb2Nlc3NpbmcgdGhlIGNsb3NlLCB3aGljaCBoYXBwZW5zIGF1dG9tYXRpY2FsbHlcclxuXHRcdHJldHVybiBMb2FkRGlhbG9nLnN1cGVyLnByb3RvdHlwZS5nZXRIb2xkUHJvY2Vzcy5jYWxsKCB0aGlzLCBkYXRhIClcclxuXHRcdFx0Lm5leHQoODAwKTtcclxuXHR9XHJcblx0Ly8gTm8gbmVlZCB0byB3YWl0IGlmIGNsb3NlZCBtYW51YWxseVxyXG5cdHJldHVybiBMb2FkRGlhbG9nLnN1cGVyLnByb3RvdHlwZS5nZXRIb2xkUHJvY2Vzcy5jYWxsKCB0aGlzLCBkYXRhICk7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBMb2FkRGlhbG9nOyIsImZ1bmN0aW9uIE1haW5XaW5kb3coIGNvbmZpZyApIHtcclxuXHRNYWluV2luZG93LnN1cGVyLmNhbGwoIHRoaXMsIGNvbmZpZyApO1xyXG59XHJcbk9PLmluaGVyaXRDbGFzcyggTWFpbldpbmRvdywgT08udWkuUHJvY2Vzc0RpYWxvZyApO1xyXG5cclxuTWFpbldpbmRvdy5zdGF0aWMubmFtZSA9IFwibWFpblwiO1xyXG5NYWluV2luZG93LnN0YXRpYy50aXRsZSA9IFwiUmF0ZXJcIjtcclxuTWFpbldpbmRvdy5zdGF0aWMuc2l6ZSA9IFwibGFyZ2VcIjtcclxuTWFpbldpbmRvdy5zdGF0aWMuYWN0aW9ucyA9IFtcclxuXHQvLyBQcmltYXJ5ICh0b3AgcmlnaHQpOlxyXG5cdHtcclxuXHRcdHRpdGxlOiBcIkNsb3NlIChhbmQgZGlzY2FyZCBhbnkgY2hhbmdlcylcIixcclxuXHRcdGZsYWdzOiBcInByaW1hcnlcIixcclxuXHRcdGxhYmVsOiBuZXcgT08udWkuSHRtbFNuaXBwZXQoXCJDbG9zZSA8c3BhbiBzdHlsZT0nZm9udC13ZWlnaHQ6Ym9sZCc+WDwvc3Bhbj5cIiksIC8vIG5vdCB1c2luZyBhbiBpY29uIHNpbmNlIGNvbG9yIGJlY29tZXMgaW52ZXJ0ZWQsIGkuZS4gd2hpdGUgb24gbGlnaHQtZ3JleVxyXG5cdH0sXHJcblx0Ly8gU2FmZSAodG9wIGxlZnQpXHJcblx0e1xyXG5cdFx0bGFiZWw6IFwiSGVscFwiLFxyXG5cdFx0YWN0aW9uOiBcImhlbHBcIixcclxuXHRcdGljb246IFwiaGVscE5vdGljZVwiLFxyXG5cdFx0ZmxhZ3M6IFwic2FmZVwiLFxyXG5cdFx0dGl0bGU6IFwiaGVscFwiXHJcblx0XHQvLyBubyBsYWJlbCwgdG8gbWlycm9yIHNpemUgb2YgQ2xvc2UgYWN0aW9uXHJcblx0fSxcclxuXHQvLyBPdGhlcnMgKGJvdHRvbSlcclxuXHR7XHJcblx0XHRhY3Rpb246IFwic2F2ZVwiLFxyXG5cdFx0bGFiZWw6IG5ldyBPTy51aS5IdG1sU25pcHBldChcIjxzcGFuIHN0eWxlPSdwYWRkaW5nOjAgMWVtOyc+U2F2ZTwvc3Bhbj5cIiksXHJcblx0XHRmbGFnczogW1wicHJpbWFyeVwiLCBcInByb2dyZXNzaXZlXCJdXHJcblx0fSxcclxuXHR7XHJcblx0XHRhY3Rpb246IFwicHJldmlld1wiLFxyXG5cdFx0bGFiZWw6IFwiU2hvdyBwcmV2aWV3XCJcclxuXHR9LFxyXG5cdHtcclxuXHRcdGFjdGlvbjogXCJjaGFuZ2VzXCIsXHJcblx0XHRsYWJlbDogXCJTaG93IGNoYW5nZXNcIlxyXG5cdH0sXHJcblx0e1xyXG5cdFx0YWN0aW9uOiBcImNhbmNlbFwiLFxyXG5cdFx0bGFiZWw6IFwiQ2FuY2VsXCJcclxuXHR9XHJcbl07XHJcblxyXG4vLyBDdXN0b21pemUgdGhlIGluaXRpYWxpemUoKSBmdW5jdGlvbjogVGhpcyBpcyB3aGVyZSB0byBhZGQgY29udGVudCB0byB0aGUgZGlhbG9nIGJvZHkgYW5kIHNldCB1cCBldmVudCBoYW5kbGVycy5cclxuTWFpbldpbmRvdy5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uICgpIHtcclxuXHQvLyBDYWxsIHRoZSBwYXJlbnQgbWV0aG9kLlxyXG5cdE1haW5XaW5kb3cuc3VwZXIucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCggdGhpcyApO1xyXG5cdC8vIENyZWF0ZSBsYXlvdXRzXHJcblx0dGhpcy50b3BCYXIgPSBuZXcgT08udWkuUGFuZWxMYXlvdXQoIHtcclxuXHRcdGV4cGFuZGVkOiBmYWxzZSxcclxuXHRcdGZyYW1lZDogdHJ1ZSxcclxuXHRcdHBhZGRlZDogdHJ1ZVxyXG5cdH0gKTtcclxuXHR0aGlzLmNvbnRlbnQgPSBuZXcgT08udWkuUGFuZWxMYXlvdXQoIHtcclxuXHRcdGV4cGFuZGVkOiB0cnVlLFxyXG5cdFx0cGFkZGVkOiB0cnVlLFxyXG5cdFx0c2Nyb2xsYWJsZTogdHJ1ZVxyXG5cdH0gKTtcclxuXHR0aGlzLm91dGVyTGF5b3V0ID0gbmV3IE9PLnVpLlN0YWNrTGF5b3V0KCB7XHJcblx0XHRpdGVtczogW1xyXG5cdFx0XHR0aGlzLnRvcEJhcixcclxuXHRcdFx0dGhpcy5jb250ZW50XHJcblx0XHRdLFxyXG5cdFx0Y29udGludW91czogdHJ1ZSxcclxuXHRcdGV4cGFuZGVkOiB0cnVlXHJcblx0fSApO1xyXG5cdC8vIENyZWF0ZSB0b3BCYXIgY29udGVudFxyXG5cdHRoaXMuc2VhcmNoQm94ID0gbmV3IE9PLnVpLkNvbWJvQm94SW5wdXRXaWRnZXQoIHtcclxuXHRcdHBsYWNlaG9sZGVyOiBcIkFkZCBhIFdpa2lQcm9qZWN0Li4uXCIsXHJcblx0XHRvcHRpb25zOiBbXHJcblx0XHRcdHsgLy8gRklYTUU6IFRoZXNlIGFyZSBwbGFjZWhvbGRlcnMuXHJcblx0XHRcdFx0ZGF0YTogXCJPcHRpb24gMVwiLFxyXG5cdFx0XHRcdGxhYmVsOiBcIk9wdGlvbiBPbmVcIlxyXG5cdFx0XHR9LFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0ZGF0YTogXCJPcHRpb24gMlwiLFxyXG5cdFx0XHRcdGxhYmVsOiBcIk9wdGlvbiBUd29cIlxyXG5cdFx0XHR9LFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0ZGF0YTogXCJPcHRpb24gM1wiLFxyXG5cdFx0XHRcdGxhYmVsOiBcIk9wdGlvbiBUaHJlZVwiXHJcblx0XHRcdH1cclxuXHRcdF1cclxuXHR9ICk7XHJcblx0dGhpcy5hZGRQcm9qZWN0QnV0dG9uID0gbmV3IE9PLnVpLkJ1dHRvbldpZGdldCgge1xyXG5cdFx0bGFiZWw6IFwiQWRkXCIsXHJcblx0XHRpY29uOiBcImFkZFwiLFxyXG5cdFx0dGl0bGU6IFwiQWRkIHByb2plY3RcIixcclxuXHRcdGZsYWdzOiBcInByb2dyZXNzaXZlXCJcclxuXHR9ICk7XHJcblx0dGhpcy50b3BCYXIuJGVsZW1lbnQuYXBwZW5kKFxyXG5cdFx0KG5ldyBPTy51aS5BY3Rpb25GaWVsZExheW91dCh0aGlzLnNlYXJjaEJveCwgdGhpcy5hZGRQcm9qZWN0QnV0dG9uKSkuJGVsZW1lbnRcclxuXHQpO1xyXG5cclxuXHQvLyBGSVhNRTogdGhpcyBpcyBwbGFjZWhvbGRlciBjb250ZW50XHJcblx0dGhpcy5jb250ZW50LiRlbGVtZW50LmFwcGVuZCggXCI8cD4oTm8gcHJvamVjdCBiYW5uZXJzIHlldCk8L3A+XCIgKTtcclxuXHJcblx0dGhpcy4kYm9keS5hcHBlbmQoIHRoaXMub3V0ZXJMYXlvdXQuJGVsZW1lbnQgKTtcclxufTtcclxuXHJcbi8vIE92ZXJyaWRlIHRoZSBnZXRCb2R5SGVpZ2h0KCkgbWV0aG9kIHRvIHNwZWNpZnkgYSBjdXN0b20gaGVpZ2h0XHJcbk1haW5XaW5kb3cucHJvdG90eXBlLmdldEJvZHlIZWlnaHQgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHRoaXMudG9wQmFyLiRlbGVtZW50Lm91dGVySGVpZ2h0KCB0cnVlICkgKyB0aGlzLmNvbnRlbnQuJGVsZW1lbnQub3V0ZXJIZWlnaHQoIHRydWUgKTtcclxufTtcclxuXHJcbi8vIFVzZSBnZXRTZXR1cFByb2Nlc3MoKSB0byBzZXQgdXAgdGhlIHdpbmRvdyB3aXRoIGRhdGEgcGFzc2VkIHRvIGl0IGF0IHRoZSB0aW1lIFxyXG4vLyBvZiBvcGVuaW5nXHJcbk1haW5XaW5kb3cucHJvdG90eXBlLmdldFNldHVwUHJvY2VzcyA9IGZ1bmN0aW9uICggZGF0YSApIHtcclxuXHRkYXRhID0gZGF0YSB8fCB7fTtcclxuXHRyZXR1cm4gTWFpbldpbmRvdy5zdXBlci5wcm90b3R5cGUuZ2V0U2V0dXBQcm9jZXNzLmNhbGwoIHRoaXMsIGRhdGEgKVxyXG5cdFx0Lm5leHQoICgpID0+IHtcclxuXHRcdFx0Ly8gVE9ETzogU2V0IHVwIHdpbmRvdyBiYXNlZCBvbiBkYXRhXHJcblxyXG5cdFx0XHR0aGlzLnVwZGF0ZVNpemUoKTtcclxuXHRcdH0sIHRoaXMgKTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IE1haW5XaW5kb3c7IiwiaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuaW1wb3J0IHtBUEksIG1ha2VFcnJvck1zZ30gZnJvbSBcIi4vdXRpbFwiO1xyXG5pbXBvcnQgc2V0dXBSYXRlciBmcm9tIFwiLi9zZXR1cFwiO1xyXG5cclxudmFyIGF1dG9TdGFydCA9IGZ1bmN0aW9uIGF1dG9TdGFydCgpIHtcclxuXHRpZiAoIHdpbmRvdy5yYXRlcl9hdXRvc3RhcnROYW1lc3BhY2VzID09IG51bGwgfHwgY29uZmlnLm13LndnSXNNYWluUGFnZSApIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0fVxyXG5cdFxyXG5cdHZhciBhdXRvc3RhcnROYW1lc3BhY2VzID0gKCAkLmlzQXJyYXkod2luZG93LnJhdGVyX2F1dG9zdGFydE5hbWVzcGFjZXMpICkgPyB3aW5kb3cucmF0ZXJfYXV0b3N0YXJ0TmFtZXNwYWNlcyA6IFt3aW5kb3cucmF0ZXJfYXV0b3N0YXJ0TmFtZXNwYWNlc107XHJcblx0XHJcblx0aWYgKCAtMSA9PT0gYXV0b3N0YXJ0TmFtZXNwYWNlcy5pbmRleE9mKGNvbmZpZy5tdy53Z05hbWVzcGFjZU51bWJlcikgKSB7XHJcblx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgpO1xyXG5cdH1cclxuXHRcclxuXHRpZiAoIC8oPzpcXD98JikoPzphY3Rpb258ZGlmZnxvbGRpZCk9Ly50ZXN0KHdpbmRvdy5sb2NhdGlvbi5ocmVmKSApIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0fVxyXG5cdFxyXG5cdC8vIENoZWNrIGlmIHRhbGsgcGFnZSBleGlzdHNcclxuXHRpZiAoICQoXCIjY2EtdGFsay5uZXdcIikubGVuZ3RoICkge1xyXG5cdFx0cmV0dXJuIHNldHVwUmF0ZXIoKTtcclxuXHR9XHJcblx0XHJcblx0dmFyIHRoaXNQYWdlID0gbXcuVGl0bGUubmV3RnJvbVRleHQoY29uZmlnLm13LndnUGFnZU5hbWUpO1xyXG5cdHZhciB0YWxrUGFnZSA9IHRoaXNQYWdlICYmIHRoaXNQYWdlLmdldFRhbGtQYWdlKCk7XHJcblx0aWYgKCF0YWxrUGFnZSkge1xyXG5cdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHR9XHJcblxyXG5cdC8qIENoZWNrIHRlbXBsYXRlcyBwcmVzZW50IG9uIHRhbGsgcGFnZS4gRmV0Y2hlcyBpbmRpcmVjdGx5IHRyYW5zY2x1ZGVkIHRlbXBsYXRlcywgc28gd2lsbCBmaW5kXHJcblx0XHRUZW1wbGF0ZTpXUEJhbm5lck1ldGEgKGFuZCBpdHMgc3VidGVtcGxhdGVzKS4gQnV0IHNvbWUgYmFubmVycyBzdWNoIGFzIE1JTEhJU1QgZG9uJ3QgdXNlIHRoYXRcclxuXHRcdG1ldGEgdGVtcGxhdGUsIHNvIHdlIGFsc28gaGF2ZSB0byBjaGVjayBmb3IgdGVtcGxhdGUgdGl0bGVzIGNvbnRhaW5nICdXaWtpUHJvamVjdCdcclxuXHQqL1xyXG5cdHJldHVybiBBUEkuZ2V0KHtcclxuXHRcdGFjdGlvbjogXCJxdWVyeVwiLFxyXG5cdFx0Zm9ybWF0OiBcImpzb25cIixcclxuXHRcdHByb3A6IFwidGVtcGxhdGVzXCIsXHJcblx0XHR0aXRsZXM6IHRhbGtQYWdlLmdldFByZWZpeGVkVGV4dCgpLFxyXG5cdFx0dGxuYW1lc3BhY2U6IFwiMTBcIixcclxuXHRcdHRsbGltaXQ6IFwiNTAwXCIsXHJcblx0XHRpbmRleHBhZ2VpZHM6IDFcclxuXHR9KVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XHJcblx0XHRcdHZhciBpZCA9IHJlc3VsdC5xdWVyeS5wYWdlaWRzO1xyXG5cdFx0XHR2YXIgdGVtcGxhdGVzID0gcmVzdWx0LnF1ZXJ5LnBhZ2VzW2lkXS50ZW1wbGF0ZXM7XHJcblx0XHRcclxuXHRcdFx0aWYgKCAhdGVtcGxhdGVzICkge1xyXG5cdFx0XHRcdHJldHVybiBzZXR1cFJhdGVyKCk7XHJcblx0XHRcdH1cclxuXHRcdFxyXG5cdFx0XHR2YXIgaGFzV2lraXByb2plY3QgPSB0ZW1wbGF0ZXMuc29tZSh0ZW1wbGF0ZSA9PiAvKFdpa2lQcm9qZWN0fFdQQmFubmVyKS8udGVzdCh0ZW1wbGF0ZS50aXRsZSkpO1xyXG5cdFx0XHJcblx0XHRcdGlmICggIWhhc1dpa2lwcm9qZWN0ICkge1xyXG5cdFx0XHRcdHJldHVybiBzZXR1cFJhdGVyKCk7XHJcblx0XHRcdH1cclxuXHRcdFxyXG5cdFx0fSxcclxuXHRcdGZ1bmN0aW9uKGNvZGUsIGpxeGhyKSB7XHJcblx0XHQvLyBTaWxlbnRseSBpZ25vcmUgZmFpbHVyZXMgKGp1c3QgbG9nIHRvIGNvbnNvbGUpXHJcblx0XHRcdGNvbnNvbGUud2FybihcclxuXHRcdFx0XHRcIltSYXRlcl0gRXJyb3Igd2hpbGUgY2hlY2tpbmcgd2hldGhlciB0byBhdXRvc3RhcnQuXCIgK1xyXG5cdFx0XHQoIGNvZGUgPT0gbnVsbCApID8gXCJcIiA6IFwiIFwiICsgbWFrZUVycm9yTXNnKGNvZGUsIGpxeGhyKVxyXG5cdFx0XHQpO1xyXG5cdFx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgpO1xyXG5cdFx0fSk7XHJcblxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXV0b1N0YXJ0OyIsImltcG9ydCB7aXNBZnRlckRhdGV9IGZyb20gXCIuL3V0aWxcIjtcclxuXHJcbi8qKiB3cml0ZVxyXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XHJcbiAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fSB2YWxcclxuICogQHBhcmFtIHtOdW1iZXJ9IHN0YWxlRGF5cyBOdW1iZXIgb2YgZGF5cyBhZnRlciB3aGljaCB0aGUgZGF0YSBiZWNvbWVzIHN0YWxlICh1c2FibGUsIGJ1dCBzaG91bGRcclxuICogIGJlIHVwZGF0ZWQgZm9yIG5leHQgdGltZSkuXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBleHBpcnlEYXlzIE51bWJlciBvZiBkYXlzIGFmdGVyIHdoaWNoIHRoZSBjYWNoZWQgZGF0YSBtYXkgYmUgZGVsZXRlZC5cclxuICovXHJcbnZhciB3cml0ZSA9IGZ1bmN0aW9uKGtleSwgdmFsLCBzdGFsZURheXMsIGV4cGlyeURheXMpIHtcclxuXHR0cnkge1xyXG5cdFx0dmFyIGRlZmF1bHRTdGFsZURheXMgPSAxO1xyXG5cdFx0dmFyIGRlZmF1bHRFeHBpcnlEYXlzID0gMzA7XHJcblx0XHR2YXIgbWlsbGlzZWNvbmRzUGVyRGF5ID0gMjQqNjAqNjAqMTAwMDtcclxuXHJcblx0XHR2YXIgc3RhbGVEdXJhdGlvbiA9IChzdGFsZURheXMgfHwgZGVmYXVsdFN0YWxlRGF5cykqbWlsbGlzZWNvbmRzUGVyRGF5O1xyXG5cdFx0dmFyIGV4cGlyeUR1cmF0aW9uID0gKGV4cGlyeURheXMgfHwgZGVmYXVsdEV4cGlyeURheXMpKm1pbGxpc2Vjb25kc1BlckRheTtcclxuXHRcdFxyXG5cdFx0dmFyIHN0cmluZ1ZhbCA9IEpTT04uc3RyaW5naWZ5KHtcclxuXHRcdFx0dmFsdWU6IHZhbCxcclxuXHRcdFx0c3RhbGVEYXRlOiBuZXcgRGF0ZShEYXRlLm5vdygpICsgc3RhbGVEdXJhdGlvbikudG9JU09TdHJpbmcoKSxcclxuXHRcdFx0ZXhwaXJ5RGF0ZTogbmV3IERhdGUoRGF0ZS5ub3coKSArIGV4cGlyeUR1cmF0aW9uKS50b0lTT1N0cmluZygpXHJcblx0XHR9KTtcclxuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiUmF0ZXItXCIra2V5LCBzdHJpbmdWYWwpO1xyXG5cdH0gIGNhdGNoKGUpIHt9IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZW1wdHlcclxufTtcclxuLyoqIHJlYWRcclxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxyXG4gKiBAcmV0dXJucyB7QXJyYXl8T2JqZWN0fFN0cmluZ3xOdWxsfSBDYWNoZWQgYXJyYXkgb3Igb2JqZWN0LCBvciBlbXB0eSBzdHJpbmcgaWYgbm90IHlldCBjYWNoZWQsXHJcbiAqICAgICAgICAgIG9yIG51bGwgaWYgdGhlcmUgd2FzIGVycm9yLlxyXG4gKi9cclxudmFyIHJlYWQgPSBmdW5jdGlvbihrZXkpIHtcclxuXHR2YXIgdmFsO1xyXG5cdHRyeSB7XHJcblx0XHR2YXIgc3RyaW5nVmFsID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJSYXRlci1cIitrZXkpO1xyXG5cdFx0aWYgKCBzdHJpbmdWYWwgIT09IFwiXCIgKSB7XHJcblx0XHRcdHZhbCA9IEpTT04ucGFyc2Uoc3RyaW5nVmFsKTtcclxuXHRcdH1cclxuXHR9ICBjYXRjaChlKSB7XHJcblx0XHRjb25zb2xlLmxvZyhcIltSYXRlcl0gZXJyb3IgcmVhZGluZyBcIiArIGtleSArIFwiIGZyb20gbG9jYWxTdG9yYWdlIGNhY2hlOlwiKTtcclxuXHRcdGNvbnNvbGUubG9nKFxyXG5cdFx0XHRcIlxcdFwiICsgZS5uYW1lICsgXCIgbWVzc2FnZTogXCIgKyBlLm1lc3NhZ2UgK1xyXG5cdFx0XHQoIGUuYXQgPyBcIiBhdDogXCIgKyBlLmF0IDogXCJcIikgK1xyXG5cdFx0XHQoIGUudGV4dCA/IFwiIHRleHQ6IFwiICsgZS50ZXh0IDogXCJcIilcclxuXHRcdCk7XHJcblx0fVxyXG5cdHJldHVybiB2YWwgfHwgbnVsbDtcclxufTtcclxudmFyIGNsZWFySXRlbUlmSW52YWxpZCA9IGZ1bmN0aW9uKGtleSkge1xyXG5cdHZhciBpc1JhdGVyS2V5ID0ga2V5LmluZGV4T2YoXCJSYXRlci1cIikgPT09IDA7XHJcblx0aWYgKCAhaXNSYXRlcktleSApIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0dmFyIGl0ZW0gPSByZWFkKGtleS5yZXBsYWNlKFwiUmF0ZXItXCIsXCJcIikpO1xyXG5cdHZhciBpc0ludmFsaWQgPSAhaXRlbSB8fCAhaXRlbS5leHBpcnlEYXRlIHx8IGlzQWZ0ZXJEYXRlKGl0ZW0uZXhwaXJ5RGF0ZSk7XHJcblx0aWYgKCBpc0ludmFsaWQgKSB7XHJcblx0XHRsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xyXG5cdH1cclxufTtcclxudmFyIGNsZWFySW52YWxpZEl0ZW1zID0gZnVuY3Rpb24oKSB7XHJcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsb2NhbFN0b3JhZ2UubGVuZ3RoOyBpKyspIHtcclxuXHRcdHNldFRpbWVvdXQoY2xlYXJJdGVtSWZJbnZhbGlkLCAxMDAsIGxvY2FsU3RvcmFnZS5rZXkoaSkpO1xyXG5cdH1cclxufTtcclxuXHJcbmV4cG9ydCB7IHdyaXRlLCByZWFkLCBjbGVhckl0ZW1JZkludmFsaWQsIGNsZWFySW52YWxpZEl0ZW1zIH07IiwiLy8gQSBnbG9iYWwgb2JqZWN0IHRoYXQgc3RvcmVzIGFsbCB0aGUgcGFnZSBhbmQgdXNlciBjb25maWd1cmF0aW9uIGFuZCBzZXR0aW5nc1xyXG52YXIgY29uZmlnID0ge307XHJcbi8vIFNjcmlwdCBpbmZvXHJcbmNvbmZpZy5zY3JpcHQgPSB7XHJcblx0Ly8gQWR2ZXJ0IHRvIGFwcGVuZCB0byBlZGl0IHN1bW1hcmllc1xyXG5cdGFkdmVydDogIFwiIChbW1VzZXI6RXZhZDM3L3JhdGVyLmpzfFJhdGVyXV0pXCIsXHJcblx0dmVyc2lvbjogXCIyLjAuMFwiXHJcbn07XHJcbi8vIFByZWZlcmVuY2VzOiBnbG9iYWxzIHZhcnMgYWRkZWQgdG8gdXNlcnMnIGNvbW1vbi5qcywgb3Igc2V0IHRvIGRlZmF1bHRzIGlmIHVuZGVmaW5lZFxyXG5jb25maWcucHJlZnMgPSB7XHJcblx0d2F0Y2hsaXN0OiB3aW5kb3cucmF0ZXJfd2F0Y2hsaXN0IHx8IFwicHJlZmVyZW5jZXNcIlxyXG59O1xyXG4vLyBNZWRpYVdpa2kgY29uZmlndXJhdGlvbiB2YWx1ZXNcclxuY29uZmlnLm13ID0gbXcuY29uZmlnLmdldCggW1xyXG5cdFwic2tpblwiLFxyXG5cdFwid2dQYWdlTmFtZVwiLFxyXG5cdFwid2dOYW1lc3BhY2VOdW1iZXJcIixcclxuXHRcIndnVXNlck5hbWVcIixcclxuXHRcIndnRm9ybWF0dGVkTmFtZXNwYWNlc1wiLFxyXG5cdFwid2dNb250aE5hbWVzXCIsXHJcblx0XCJ3Z1JldmlzaW9uSWRcIixcclxuXHRcIndnU2NyaXB0UGF0aFwiLFxyXG5cdFwid2dTZXJ2ZXJcIixcclxuXHRcIndnQ2F0ZWdvcmllc1wiLFxyXG5cdFwid2dJc01haW5QYWdlXCJcclxuXSApO1xyXG5cclxuY29uZmlnLnJlZ2V4ID0geyAvKiBlc2xpbnQtZGlzYWJsZSBuby11c2VsZXNzLWVzY2FwZSAqL1xyXG5cdC8vIFBhdHRlcm4gdG8gZmluZCB0ZW1wbGF0ZXMsIHdoaWNoIG1heSBjb250YWluIG90aGVyIHRlbXBsYXRlc1xyXG5cdHRlbXBsYXRlOlx0XHQvXFx7XFx7XFxzKihbXiNcXHtcXHNdLis/KVxccyooXFx8KD86LnxcXG4pKj8oPzooPzpcXHtcXHsoPzoufFxcbikqPyg/Oig/Olxce1xceyg/Oi58XFxuKSo/XFx9XFx9KSg/Oi58XFxuKSo/KSo/XFx9XFx9KSg/Oi58XFxuKSo/KSp8KVxcfVxcfVxcbj8vZyxcclxuXHQvLyBQYXR0ZXJuIHRvIGZpbmQgYHxwYXJhbT12YWx1ZWAgb3IgYHx2YWx1ZWAsIHdoZXJlIGB2YWx1ZWAgY2FuIG9ubHkgY29udGFpbiBhIHBpcGVcclxuXHQvLyBpZiB3aXRoaW4gc3F1YXJlIGJyYWNrZXRzIChpLmUuIHdpa2lsaW5rcykgb3IgYnJhY2VzIChpLmUuIHRlbXBsYXRlcylcclxuXHR0ZW1wbGF0ZVBhcmFtczpcdC9cXHwoPyEoPzpbXntdK318W15cXFtdK10pKSg/Oi58XFxzKSo/KD89KD86XFx8fCQpKD8hKD86W157XSt9fFteXFxbXStdKSkpL2dcclxufTsgLyogZXNsaW50LWVuYWJsZSBuby11c2VsZXNzLWVzY2FwZSAqL1xyXG5jb25maWcuZGVmZXJyZWQgPSB7fTtcclxuY29uZmlnLmJhbm5lckRlZmF1bHRzID0ge1xyXG5cdGNsYXNzZXM6IFtcclxuXHRcdFwiRkFcIixcclxuXHRcdFwiRkxcIixcclxuXHRcdFwiQVwiLFxyXG5cdFx0XCJHQVwiLFxyXG5cdFx0XCJCXCIsXHJcblx0XHRcIkNcIixcclxuXHRcdFwiU3RhcnRcIixcclxuXHRcdFwiU3R1YlwiLFxyXG5cdFx0XCJMaXN0XCJcclxuXHRdLFxyXG5cdGltcG9ydGFuY2VzOiBbXHJcblx0XHRcIlRvcFwiLFxyXG5cdFx0XCJIaWdoXCIsXHJcblx0XHRcIk1pZFwiLFxyXG5cdFx0XCJMb3dcIlxyXG5cdF0sXHJcblx0ZXh0ZW5kZWRDbGFzc2VzOiBbXHJcblx0XHRcIkNhdGVnb3J5XCIsXHJcblx0XHRcIkRyYWZ0XCIsXHJcblx0XHRcIkZpbGVcIixcclxuXHRcdFwiUG9ydGFsXCIsXHJcblx0XHRcIlByb2plY3RcIixcclxuXHRcdFwiVGVtcGxhdGVcIixcclxuXHRcdFwiQnBsdXNcIixcclxuXHRcdFwiRnV0dXJlXCIsXHJcblx0XHRcIkN1cnJlbnRcIixcclxuXHRcdFwiRGlzYW1iaWdcIixcclxuXHRcdFwiTkFcIixcclxuXHRcdFwiUmVkaXJlY3RcIixcclxuXHRcdFwiQm9va1wiXHJcblx0XSxcclxuXHRleHRlbmRlZEltcG9ydGFuY2VzOiBbXHJcblx0XHRcIlRvcFwiLFxyXG5cdFx0XCJIaWdoXCIsXHJcblx0XHRcIk1pZFwiLFxyXG5cdFx0XCJMb3dcIixcclxuXHRcdFwiQm90dG9tXCIsXHJcblx0XHRcIk5BXCJcclxuXHRdXHJcbn07XHJcbmNvbmZpZy5jdXN0b21DbGFzc2VzID0ge1xyXG5cdFwiV2lraVByb2plY3QgTWlsaXRhcnkgaGlzdG9yeVwiOiBbXHJcblx0XHRcIkFMXCIsXHJcblx0XHRcIkJMXCIsXHJcblx0XHRcIkNMXCJcclxuXHRdLFxyXG5cdFwiV2lraVByb2plY3QgUG9ydGFsc1wiOiBbXHJcblx0XHRcIkZQb1wiLFxyXG5cdFx0XCJDb21wbGV0ZVwiLFxyXG5cdFx0XCJTdWJzdGFudGlhbFwiLFxyXG5cdFx0XCJCYXNpY1wiLFxyXG5cdFx0XCJJbmNvbXBsZXRlXCIsXHJcblx0XHRcIk1ldGFcIlxyXG5cdF1cclxufTtcclxuY29uZmlnLnNoZWxsVGVtcGxhdGVzID0gW1xyXG5cdFwiV2lraVByb2plY3QgYmFubmVyIHNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdEJhbm5lcnNcIixcclxuXHRcIldpa2lQcm9qZWN0IEJhbm5lcnNcIixcclxuXHRcIldQQlwiLFxyXG5cdFwiV1BCU1wiLFxyXG5cdFwiV2lraXByb2plY3RiYW5uZXJzaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3QgQmFubmVyIFNoZWxsXCIsXHJcblx0XCJXcGJcIixcclxuXHRcIldQQmFubmVyU2hlbGxcIixcclxuXHRcIldwYnNcIixcclxuXHRcIldpa2lwcm9qZWN0YmFubmVyc1wiLFxyXG5cdFwiV1AgQmFubmVyIFNoZWxsXCIsXHJcblx0XCJXUCBiYW5uZXIgc2hlbGxcIixcclxuXHRcIkJhbm5lcnNoZWxsXCIsXHJcblx0XCJXaWtpcHJvamVjdCBiYW5uZXIgc2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0IEJhbm5lcnMgU2hlbGxcIixcclxuXHRcIldpa2lQcm9qZWN0QmFubmVyIFNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdEJhbm5lclNoZWxsXCIsXHJcblx0XCJXaWtpUHJvamVjdCBCYW5uZXJTaGVsbFwiLFxyXG5cdFwiV2lraXByb2plY3RCYW5uZXJTaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3QgYmFubmVyIHNoZWxsL3JlZGlyZWN0XCIsXHJcblx0XCJXaWtpUHJvamVjdCBTaGVsbFwiLFxyXG5cdFwiQmFubmVyIHNoZWxsXCIsXHJcblx0XCJTY29wZSBzaGVsbFwiLFxyXG5cdFwiUHJvamVjdCBzaGVsbFwiLFxyXG5cdFwiV2lraVByb2plY3QgYmFubmVyXCJcclxuXTtcclxuY29uZmlnLmRlZmF1bHRQYXJhbWV0ZXJEYXRhID0ge1xyXG5cdFwiYXV0b1wiOiB7XHJcblx0XHRcImxhYmVsXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIkF1dG8tcmF0ZWRcIlxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiQXV0b21hdGljYWxseSByYXRlZCBieSBhIGJvdC4gQWxsb3dlZCB2YWx1ZXM6IFsneWVzJ10uXCJcclxuXHRcdH0sXHJcblx0XHRcImF1dG92YWx1ZVwiOiBcInllc1wiXHJcblx0fSxcclxuXHRcImxpc3Rhc1wiOiB7XHJcblx0XHRcImxhYmVsXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIkxpc3QgYXNcIlxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiU29ydGtleSBmb3IgdGFsayBwYWdlXCJcclxuXHRcdH1cclxuXHR9LFxyXG5cdFwic21hbGxcIjoge1xyXG5cdFx0XCJsYWJlbFwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJTbWFsbD9cIixcclxuXHRcdH0sXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIkRpc3BsYXkgYSBzbWFsbCB2ZXJzaW9uLiBBbGxvd2VkIHZhbHVlczogWyd5ZXMnXS5cIlxyXG5cdFx0fSxcclxuXHRcdFwiYXV0b3ZhbHVlXCI6IFwieWVzXCJcclxuXHR9LFxyXG5cdFwiYXR0ZW50aW9uXCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiQXR0ZW50aW9uIHJlcXVpcmVkP1wiLFxyXG5cdFx0fSxcclxuXHRcdFwiZGVzY3JpcHRpb25cIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiSW1tZWRpYXRlIGF0dGVudGlvbiByZXF1aXJlZC4gQWxsb3dlZCB2YWx1ZXM6IFsneWVzJ10uXCJcclxuXHRcdH0sXHJcblx0XHRcImF1dG92YWx1ZVwiOiBcInllc1wiXHJcblx0fSxcclxuXHRcIm5lZWRzLWltYWdlXCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiTmVlZHMgaW1hZ2U/XCIsXHJcblx0XHR9LFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiB7XHJcblx0XHRcdFwiZW5cIjogXCJSZXF1ZXN0IHRoYXQgYW4gaW1hZ2Ugb3IgcGhvdG9ncmFwaCBvZiB0aGUgc3ViamVjdCBiZSBhZGRlZCB0byB0aGUgYXJ0aWNsZS4gQWxsb3dlZCB2YWx1ZXM6IFsneWVzJ10uXCJcclxuXHRcdH0sXHJcblx0XHRcImFsaWFzZXNcIjogW1xyXG5cdFx0XHRcIm5lZWRzLXBob3RvXCJcclxuXHRcdF0sXHJcblx0XHRcImF1dG92YWx1ZVwiOiBcInllc1wiLFxyXG5cdFx0XCJzdWdnZXN0ZWRcIjogdHJ1ZVxyXG5cdH0sXHJcblx0XCJuZWVkcy1pbmZvYm94XCI6IHtcclxuXHRcdFwibGFiZWxcIjoge1xyXG5cdFx0XHRcImVuXCI6IFwiTmVlZHMgaW5mb2JveD9cIixcclxuXHRcdH0sXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IHtcclxuXHRcdFx0XCJlblwiOiBcIlJlcXVlc3QgdGhhdCBhbiBpbmZvYm94IGJlIGFkZGVkIHRvIHRoZSBhcnRpY2xlLiBBbGxvd2VkIHZhbHVlczogWyd5ZXMnXS5cIlxyXG5cdFx0fSxcclxuXHRcdFwiYWxpYXNlc1wiOiBbXHJcblx0XHRcdFwibmVlZHMtcGhvdG9cIlxyXG5cdFx0XSxcclxuXHRcdFwiYXV0b3ZhbHVlXCI6IFwieWVzXCIsXHJcblx0XHRcInN1Z2dlc3RlZFwiOiB0cnVlXHJcblx0fVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY29uZmlnOyIsIi8vIEF0dHJpYnV0aW9uOiBEaWZmIHN0eWxlcyBmcm9tIDxodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9XaWtpcGVkaWE6QXV0b1dpa2lCcm93c2VyL3N0eWxlLmNzcz5cclxudmFyIGRpZmZTdHlsZXMgPSBgdGFibGUuZGlmZiwgdGQuZGlmZi1vdGl0bGUsIHRkLmRpZmYtbnRpdGxlIHsgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7IH1cclxudGQuZGlmZi1vdGl0bGUsIHRkLmRpZmYtbnRpdGxlIHsgdGV4dC1hbGlnbjogY2VudGVyOyB9XHJcbnRkLmRpZmYtbWFya2VyIHsgdGV4dC1hbGlnbjogcmlnaHQ7IGZvbnQtd2VpZ2h0OiBib2xkOyBmb250LXNpemU6IDEuMjVlbTsgfVxyXG50ZC5kaWZmLWxpbmVubyB7IGZvbnQtd2VpZ2h0OiBib2xkOyB9XHJcbnRkLmRpZmYtYWRkZWRsaW5lLCB0ZC5kaWZmLWRlbGV0ZWRsaW5lLCB0ZC5kaWZmLWNvbnRleHQgeyBmb250LXNpemU6IDg4JTsgdmVydGljYWwtYWxpZ246IHRvcDsgd2hpdGUtc3BhY2U6IC1tb3otcHJlLXdyYXA7IHdoaXRlLXNwYWNlOiBwcmUtd3JhcDsgfVxyXG50ZC5kaWZmLWFkZGVkbGluZSwgdGQuZGlmZi1kZWxldGVkbGluZSB7IGJvcmRlci1zdHlsZTogc29saWQ7IGJvcmRlci13aWR0aDogMXB4IDFweCAxcHggNHB4OyBib3JkZXItcmFkaXVzOiAwLjMzZW07IH1cclxudGQuZGlmZi1hZGRlZGxpbmUgeyBib3JkZXItY29sb3I6ICNhM2QzZmY7IH1cclxudGQuZGlmZi1kZWxldGVkbGluZSB7IGJvcmRlci1jb2xvcjogI2ZmZTQ5YzsgfVxyXG50ZC5kaWZmLWNvbnRleHQgeyBiYWNrZ3JvdW5kOiAjZjNmM2YzOyBjb2xvcjogIzMzMzMzMzsgYm9yZGVyLXN0eWxlOiBzb2xpZDsgYm9yZGVyLXdpZHRoOiAxcHggMXB4IDFweCA0cHg7IGJvcmRlci1jb2xvcjogI2U2ZTZlNjsgYm9yZGVyLXJhZGl1czogMC4zM2VtOyB9XHJcbi5kaWZmY2hhbmdlIHsgZm9udC13ZWlnaHQ6IGJvbGQ7IHRleHQtZGVjb3JhdGlvbjogbm9uZTsgfVxyXG50YWJsZS5kaWZmIHtcclxuICAgIGJvcmRlcjogbm9uZTtcclxuICAgIHdpZHRoOiA5OCU7IGJvcmRlci1zcGFjaW5nOiA0cHg7XHJcbiAgICB0YWJsZS1sYXlvdXQ6IGZpeGVkOyAvKiBFbnN1cmVzIHRoYXQgY29sdW1zIGFyZSBvZiBlcXVhbCB3aWR0aCAqL1xyXG59XHJcbnRkLmRpZmYtYWRkZWRsaW5lIC5kaWZmY2hhbmdlLCB0ZC5kaWZmLWRlbGV0ZWRsaW5lIC5kaWZmY2hhbmdlIHsgYm9yZGVyLXJhZGl1czogMC4zM2VtOyBwYWRkaW5nOiAwLjI1ZW0gMDsgfVxyXG50ZC5kaWZmLWFkZGVkbGluZSAuZGlmZmNoYW5nZSB7XHRiYWNrZ3JvdW5kOiAjZDhlY2ZmOyB9XHJcbnRkLmRpZmYtZGVsZXRlZGxpbmUgLmRpZmZjaGFuZ2UgeyBiYWNrZ3JvdW5kOiAjZmVlZWM4OyB9XHJcbnRhYmxlLmRpZmYgdGQge1x0cGFkZGluZzogMC4zM2VtIDAuNjZlbTsgfVxyXG50YWJsZS5kaWZmIGNvbC5kaWZmLW1hcmtlciB7IHdpZHRoOiAyJTsgfVxyXG50YWJsZS5kaWZmIGNvbC5kaWZmLWNvbnRlbnQgeyB3aWR0aDogNDglOyB9XHJcbnRhYmxlLmRpZmYgdGQgZGl2IHtcclxuICAgIC8qIEZvcmNlLXdyYXAgdmVyeSBsb25nIGxpbmVzIHN1Y2ggYXMgVVJMcyBvciBwYWdlLXdpZGVuaW5nIGNoYXIgc3RyaW5ncy4gKi9cclxuICAgIHdvcmQtd3JhcDogYnJlYWstd29yZDtcclxuICAgIC8qIEFzIGZhbGxiYWNrIChGRjwzLjUsIE9wZXJhIDwxMC41KSwgc2Nyb2xsYmFycyB3aWxsIGJlIGFkZGVkIGZvciB2ZXJ5IHdpZGUgY2VsbHNcclxuICAgICAgICBpbnN0ZWFkIG9mIHRleHQgb3ZlcmZsb3dpbmcgb3Igd2lkZW5pbmcgKi9cclxuICAgIG92ZXJmbG93OiBhdXRvO1xyXG59YDtcclxuXHJcbmV4cG9ydCB7IGRpZmZTdHlsZXMgfTsiLCJpbXBvcnQge0FQSSwgaXNBZnRlckRhdGUsIG1ha2VFcnJvck1zZ30gZnJvbSBcIi4vdXRpbFwiO1xyXG5pbXBvcnQgKiBhcyBjYWNoZSBmcm9tIFwiLi9jYWNoZVwiO1xyXG5cclxudmFyIGNhY2hlQmFubmVycyA9IGZ1bmN0aW9uKGJhbm5lcnMsIGJhbm5lck9wdGlvbnMpIHtcclxuXHRjYWNoZS53cml0ZShcImJhbm5lcnNcIiwgYmFubmVycywgMiwgNjApO1xyXG5cdGNhY2hlLndyaXRlKFwiYmFubmVyT3B0aW9uc1wiLCBiYW5uZXJPcHRpb25zLCAyLCA2MCk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyBiYW5uZXJzL29wdGlvbnMgZnJvbSB0aGUgQXBpXHJcbiAqIFxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gUmVzb2x2ZWQgd2l0aDogYmFubmVycyBvYmplY3QsIGJhbm5lck9wdGlvbnMgYXJyYXlcclxuICovXHJcbnZhciBnZXRMaXN0T2ZCYW5uZXJzRnJvbUFwaSA9IGZ1bmN0aW9uKCkge1xyXG5cclxuXHR2YXIgZmluaXNoZWRQcm9taXNlID0gJC5EZWZlcnJlZCgpO1xyXG5cclxuXHR2YXIgcXVlcnlTa2VsZXRvbiA9IHtcclxuXHRcdGFjdGlvbjogXCJxdWVyeVwiLFxyXG5cdFx0Zm9ybWF0OiBcImpzb25cIixcclxuXHRcdGxpc3Q6IFwiY2F0ZWdvcnltZW1iZXJzXCIsXHJcblx0XHRjbXByb3A6IFwidGl0bGVcIixcclxuXHRcdGNtbmFtZXNwYWNlOiBcIjEwXCIsXHJcblx0XHRjbWxpbWl0OiBcIjUwMFwiXHJcblx0fTtcclxuXHJcblx0dmFyIGNhdGVnb3JpZXMgPSBbXHJcblx0XHR7XHJcblx0XHRcdHRpdGxlOlwiIENhdGVnb3J5Oldpa2lQcm9qZWN0IGJhbm5lcnMgd2l0aCBxdWFsaXR5IGFzc2Vzc21lbnRcIixcclxuXHRcdFx0YWJicmV2aWF0aW9uOiBcIndpdGhSYXRpbmdzXCIsXHJcblx0XHRcdGJhbm5lcnM6IFtdLFxyXG5cdFx0XHRwcm9jZXNzZWQ6ICQuRGVmZXJyZWQoKVxyXG5cdFx0fSxcclxuXHRcdHtcclxuXHRcdFx0dGl0bGU6IFwiQ2F0ZWdvcnk6V2lraVByb2plY3QgYmFubmVycyB3aXRob3V0IHF1YWxpdHkgYXNzZXNzbWVudFwiLFxyXG5cdFx0XHRhYmJyZXZpYXRpb246IFwid2l0aG91dFJhdGluZ3NcIixcclxuXHRcdFx0YmFubmVyczogW10sXHJcblx0XHRcdHByb2Nlc3NlZDogJC5EZWZlcnJlZCgpXHJcblx0XHR9LFxyXG5cdFx0e1xyXG5cdFx0XHR0aXRsZTogXCJDYXRlZ29yeTpXaWtpUHJvamVjdCBiYW5uZXIgd3JhcHBlciB0ZW1wbGF0ZXNcIixcclxuXHRcdFx0YWJicmV2aWF0aW9uOiBcIndyYXBwZXJzXCIsXHJcblx0XHRcdGJhbm5lcnM6IFtdLFxyXG5cdFx0XHRwcm9jZXNzZWQ6ICQuRGVmZXJyZWQoKVxyXG5cdFx0fVxyXG5cdF07XHJcblxyXG5cdHZhciBwcm9jZXNzUXVlcnkgPSBmdW5jdGlvbihyZXN1bHQsIGNhdEluZGV4KSB7XHJcblx0XHRpZiAoICFyZXN1bHQucXVlcnkgfHwgIXJlc3VsdC5xdWVyeS5jYXRlZ29yeW1lbWJlcnMgKSB7XHJcblx0XHRcdC8vIE5vIHJlc3VsdHNcclxuXHRcdFx0Ly8gVE9ETzogZXJyb3Igb3Igd2FybmluZyAqKioqKioqKlxyXG5cdFx0XHRmaW5pc2hlZFByb21pc2UucmVqZWN0KCk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0Ly8gR2F0aGVyIHRpdGxlcyBpbnRvIGFycmF5IC0gZXhjbHVkaW5nIFwiVGVtcGxhdGU6XCIgcHJlZml4XHJcblx0XHR2YXIgcmVzdWx0VGl0bGVzID0gcmVzdWx0LnF1ZXJ5LmNhdGVnb3J5bWVtYmVycy5tYXAoZnVuY3Rpb24oaW5mbykge1xyXG5cdFx0XHRyZXR1cm4gaW5mby50aXRsZS5zbGljZSg5KTtcclxuXHRcdH0pO1xyXG5cdFx0QXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoY2F0ZWdvcmllc1tjYXRJbmRleF0uYmFubmVycywgcmVzdWx0VGl0bGVzKTtcclxuXHRcdFxyXG5cdFx0Ly8gQ29udGludWUgcXVlcnkgaWYgbmVlZGVkXHJcblx0XHRpZiAoIHJlc3VsdC5jb250aW51ZSApIHtcclxuXHRcdFx0ZG9BcGlRdWVyeSgkLmV4dGVuZChjYXRlZ29yaWVzW2NhdEluZGV4XS5xdWVyeSwgcmVzdWx0LmNvbnRpbnVlKSwgY2F0SW5kZXgpO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdGNhdGVnb3JpZXNbY2F0SW5kZXhdLnByb2Nlc3NlZC5yZXNvbHZlKCk7XHJcblx0fTtcclxuXHJcblx0dmFyIGRvQXBpUXVlcnkgPSBmdW5jdGlvbihxLCBjYXRJbmRleCkge1xyXG5cdFx0QVBJLmdldCggcSApXHJcblx0XHRcdC5kb25lKCBmdW5jdGlvbihyZXN1bHQpIHtcclxuXHRcdFx0XHRwcm9jZXNzUXVlcnkocmVzdWx0LCBjYXRJbmRleCk7XHJcblx0XHRcdH0gKVxyXG5cdFx0XHQuZmFpbCggZnVuY3Rpb24oY29kZSwganF4aHIpIHtcclxuXHRcdFx0XHRjb25zb2xlLndhcm4oXCJbUmF0ZXJdIFwiICsgbWFrZUVycm9yTXNnKGNvZGUsIGpxeGhyLCBcIkNvdWxkIG5vdCByZXRyaWV2ZSBwYWdlcyBmcm9tIFtbOlwiICsgcS5jbXRpdGxlICsgXCJdXVwiKSk7XHJcblx0XHRcdFx0ZmluaXNoZWRQcm9taXNlLnJlamVjdCgpO1xyXG5cdFx0XHR9ICk7XHJcblx0fTtcclxuXHRcclxuXHRjYXRlZ29yaWVzLmZvckVhY2goZnVuY3Rpb24oY2F0LCBpbmRleCwgYXJyKSB7XHJcblx0XHRjYXQucXVlcnkgPSAkLmV4dGVuZCggeyBcImNtdGl0bGVcIjpjYXQudGl0bGUgfSwgcXVlcnlTa2VsZXRvbiApO1xyXG5cdFx0JC53aGVuKCBhcnJbaW5kZXgtMV0gJiYgYXJyW2luZGV4LTFdLnByb2Nlc3NlZCB8fCB0cnVlICkudGhlbihmdW5jdGlvbigpe1xyXG5cdFx0XHRkb0FwaVF1ZXJ5KGNhdC5xdWVyeSwgaW5kZXgpO1xyXG5cdFx0fSk7XHJcblx0fSk7XHJcblx0XHJcblx0Y2F0ZWdvcmllc1tjYXRlZ29yaWVzLmxlbmd0aC0xXS5wcm9jZXNzZWQudGhlbihmdW5jdGlvbigpe1xyXG5cdFx0dmFyIGJhbm5lcnMgPSB7fTtcclxuXHRcdHZhciBzdGFzaEJhbm5lciA9IGZ1bmN0aW9uKGNhdE9iamVjdCkge1xyXG5cdFx0XHRiYW5uZXJzW2NhdE9iamVjdC5hYmJyZXZpYXRpb25dID0gY2F0T2JqZWN0LmJhbm5lcnM7XHJcblx0XHR9O1xyXG5cdFx0dmFyIG1lcmdlQmFubmVycyA9IGZ1bmN0aW9uKG1lcmdlSW50b1RoaXNBcnJheSwgY2F0T2JqZWN0KSB7XHJcblx0XHRcdHJldHVybiAkLm1lcmdlKG1lcmdlSW50b1RoaXNBcnJheSwgY2F0T2JqZWN0LmJhbm5lcnMpO1xyXG5cdFx0fTtcclxuXHRcdHZhciBtYWtlT3B0aW9uID0gZnVuY3Rpb24oYmFubmVyTmFtZSkge1xyXG5cdFx0XHR2YXIgaXNXcmFwcGVyID0gKCAtMSAhPT0gJC5pbkFycmF5KGJhbm5lck5hbWUsIGNhdGVnb3JpZXNbMl0uYmFubmVycykgKTtcclxuXHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRkYXRhOiAgKCBpc1dyYXBwZXIgPyBcInN1YnN0OlwiIDogXCJcIikgKyBiYW5uZXJOYW1lLFxyXG5cdFx0XHRcdGxhYmVsOiBiYW5uZXJOYW1lLnJlcGxhY2UoXCJXaWtpUHJvamVjdCBcIiwgXCJcIikgKyAoIGlzV3JhcHBlciA/IFwiIFt0ZW1wbGF0ZSB3cmFwcGVyXVwiIDogXCJcIilcclxuXHRcdFx0fTtcclxuXHRcdH07XHJcblx0XHRjYXRlZ29yaWVzLmZvckVhY2goc3Rhc2hCYW5uZXIpO1xyXG5cdFx0XHJcblx0XHR2YXIgYmFubmVyT3B0aW9ucyA9IGNhdGVnb3JpZXMucmVkdWNlKG1lcmdlQmFubmVycywgW10pLm1hcChtYWtlT3B0aW9uKTtcclxuXHRcdFxyXG5cdFx0ZmluaXNoZWRQcm9taXNlLnJlc29sdmUoYmFubmVycywgYmFubmVyT3B0aW9ucyk7XHJcblx0fSk7XHJcblx0XHJcblx0cmV0dXJuIGZpbmlzaGVkUHJvbWlzZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGJhbm5lcnMvb3B0aW9ucyBmcm9tIGNhY2hlLCBpZiB0aGVyZSBhbmQgbm90IHRvbyBvbGRcclxuICogXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlZCB3aXRoOiBiYW5uZXJzIG9iamVjdCwgYmFubmVyT3B0aW9ucyBvYmplY3RcclxuICovXHJcbnZhciBnZXRCYW5uZXJzRnJvbUNhY2hlID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIGNhY2hlZEJhbm5lcnMgPSBjYWNoZS5yZWFkKFwiYmFubmVyc1wiKTtcclxuXHR2YXIgY2FjaGVkQmFubmVyT3B0aW9ucyA9IGNhY2hlLnJlYWQoXCJiYW5uZXJPcHRpb25zXCIpO1xyXG5cdGlmIChcclxuXHRcdCFjYWNoZWRCYW5uZXJzIHx8XHJcblx0XHQhY2FjaGVkQmFubmVycy52YWx1ZSB8fCAhY2FjaGVkQmFubmVycy5zdGFsZURhdGUgfHxcclxuXHRcdCFjYWNoZWRCYW5uZXJPcHRpb25zIHx8XHJcblx0XHQhY2FjaGVkQmFubmVyT3B0aW9ucy52YWx1ZSB8fCAhY2FjaGVkQmFubmVyT3B0aW9ucy5zdGFsZURhdGVcclxuXHQpIHtcclxuXHRcdHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCk7XHJcblx0fVxyXG5cdGlmICggaXNBZnRlckRhdGUoY2FjaGVkQmFubmVycy5zdGFsZURhdGUpIHx8IGlzQWZ0ZXJEYXRlKGNhY2hlZEJhbm5lck9wdGlvbnMuc3RhbGVEYXRlKSApIHtcclxuXHRcdC8vIFVwZGF0ZSBpbiB0aGUgYmFja2dyb3VuZDsgc3RpbGwgdXNlIG9sZCBsaXN0IHVudGlsIHRoZW4gIFxyXG5cdFx0Z2V0TGlzdE9mQmFubmVyc0Zyb21BcGkoKS50aGVuKGNhY2hlQmFubmVycyk7XHJcblx0fVxyXG5cdHJldHVybiAkLkRlZmVycmVkKCkucmVzb2x2ZShjYWNoZWRCYW5uZXJzLnZhbHVlLCBjYWNoZWRCYW5uZXJPcHRpb25zLnZhbHVlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGJhbm5lcnMvb3B0aW9ucyBmcm9tIGNhY2hlIG9yIEFQSS5cclxuICogSGFzIHNpZGUgYWZmZWN0IG9mIGFkZGluZy91cGRhdGluZy9jbGVhcmluZyBjYWNoZS5cclxuICogXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPE9iamVjdCwgQXJyYXk+fSBiYW5uZXJzIG9iamVjdCwgYmFubmVyT3B0aW9ucyBvYmplY3RcclxuICovXHJcbnZhciBnZXRCYW5uZXJzID0gKCkgPT4gZ2V0QmFubmVyc0Zyb21DYWNoZSgpLnRoZW4oXHJcblx0Ly8gU3VjY2VzczogcGFzcyB0aHJvdWdoXHJcblx0KGJhbm5lcnMsIG9wdGlvbnMpID0+ICQuRGVmZXJyZWQoKS5yZXNvbHZlKGJhbm5lcnMsIG9wdGlvbnMpLFxyXG5cdC8vIEZhaWx1cmU6IGdldCBmcm9tIEFwaSwgdGhlbiBjYWNoZSB0aGVtXHJcblx0KCkgPT4ge1xyXG5cdFx0dmFyIGJhbm5lcnNQcm9taXNlID0gZ2V0TGlzdE9mQmFubmVyc0Zyb21BcGkoKTtcclxuXHRcdGJhbm5lcnNQcm9taXNlLnRoZW4oY2FjaGVCYW5uZXJzKTtcclxuXHRcdHJldHVybiBiYW5uZXJzUHJvbWlzZTtcclxuXHR9XHJcbik7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnZXRCYW5uZXJzOyIsImltcG9ydCBjb25maWcgZnJvbSBcIi4vY29uZmlnXCI7XHJcbmltcG9ydCB7QVBJfSBmcm9tIFwiLi91dGlsXCI7XHJcbmltcG9ydCB7IHBhcnNlVGVtcGxhdGVzLCBnZXRXaXRoUmVkaXJlY3RUbyB9IGZyb20gXCIuL1RlbXBsYXRlXCI7XHJcbmltcG9ydCBnZXRCYW5uZXJzIGZyb20gXCIuL2dldEJhbm5lcnNcIjtcclxuaW1wb3J0ICogYXMgY2FjaGUgZnJvbSBcIi4vY2FjaGVcIjtcclxuaW1wb3J0IHdpbmRvd01hbmFnZXIgZnJvbSBcIi4vd2luZG93TWFuYWdlclwiO1xyXG5cclxudmFyIHNldHVwUmF0ZXIgPSBmdW5jdGlvbihjbGlja0V2ZW50KSB7XHJcblx0aWYgKCBjbGlja0V2ZW50ICkge1xyXG5cdFx0Y2xpY2tFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdH1cclxuXHJcblx0dmFyIHNldHVwQ29tcGxldGVkUHJvbWlzZSA9ICQuRGVmZXJyZWQoKTtcclxuICAgIFxyXG5cdHZhciBjdXJyZW50UGFnZSA9IG13LlRpdGxlLm5ld0Zyb21UZXh0KGNvbmZpZy5tdy53Z1BhZ2VOYW1lKTtcclxuXHR2YXIgdGFsa1BhZ2UgPSBjdXJyZW50UGFnZSAmJiBjdXJyZW50UGFnZS5nZXRUYWxrUGFnZSgpO1xyXG5cdHZhciBzdWJqZWN0UGFnZSA9IGN1cnJlbnRQYWdlICYmIGN1cnJlbnRQYWdlLmdldFN1YmplY3RQYWdlKCk7XHJcbiBcclxuXHQvLyBHZXQgbGlzdHMgb2YgYWxsIGJhbm5lcnMgKHRhc2sgMSlcclxuXHR2YXIgYmFubmVyc1Byb21pc2UgPSBnZXRCYW5uZXJzKCk7XHJcblxyXG5cdC8vIExvYWQgdGFsayBwYWdlICh0YXNrIDIpXHJcblx0dmFyIGxvYWRUYWxrUHJvbWlzZSA9IEFQSS5nZXQoIHtcclxuXHRcdGFjdGlvbjogXCJxdWVyeVwiLFxyXG5cdFx0cHJvcDogXCJyZXZpc2lvbnNcIixcclxuXHRcdHJ2cHJvcDogXCJjb250ZW50XCIsXHJcblx0XHRydnNlY3Rpb246IFwiMFwiLFxyXG5cdFx0dGl0bGVzOiB0YWxrUGFnZS5nZXRQcmVmaXhlZFRleHQoKSxcclxuXHRcdGluZGV4cGFnZWlkczogMVxyXG5cdH0gKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcclxuXHRcdHZhciBpZCA9IHJlc3VsdC5xdWVyeS5wYWdlaWRzO1x0XHRcclxuXHRcdHZhciB3aWtpdGV4dCA9ICggaWQgPCAwICkgPyBcIlwiIDogcmVzdWx0LnF1ZXJ5LnBhZ2VzW2lkXS5yZXZpc2lvbnNbMF1bXCIqXCJdO1xyXG5cdFx0cmV0dXJuIHdpa2l0ZXh0O1xyXG5cdH0pO1xyXG5cclxuXHQvLyBQYXJzZSB0YWxrIHBhZ2UgZm9yIGJhbm5lcnMgKHRhc2sgMylcclxuXHR2YXIgcGFyc2VUYWxrUHJvbWlzZSA9IGxvYWRUYWxrUHJvbWlzZS50aGVuKHdpa2l0ZXh0ID0+IHBhcnNlVGVtcGxhdGVzKHdpa2l0ZXh0LCB0cnVlKSkgLy8gR2V0IGFsbCB0ZW1wbGF0ZXNcclxuXHRcdC50aGVuKHRlbXBsYXRlcyA9PiBnZXRXaXRoUmVkaXJlY3RUbyh0ZW1wbGF0ZXMpKSAvLyBDaGVjayBmb3IgcmVkaXJlY3RzXHJcblx0XHQudGhlbih0ZW1wbGF0ZXMgPT4ge1xyXG5cdFx0XHRyZXR1cm4gYmFubmVyc1Byb21pc2UudGhlbigoYWxsQmFubmVycykgPT4geyAvLyBHZXQgbGlzdCBvZiBhbGwgYmFubmVyIHRlbXBsYXRlc1xyXG5cdFx0XHRcdHJldHVybiB0ZW1wbGF0ZXMuZmlsdGVyKHRlbXBsYXRlID0+IHsgLy8gRmlsdGVyIG91dCBub24tYmFubmVyc1xyXG5cdFx0XHRcdFx0dmFyIG1haW5UZXh0ID0gdGVtcGxhdGUucmVkaXJlY3RUb1xyXG5cdFx0XHRcdFx0XHQ/IHRlbXBsYXRlLnJlZGlyZWN0VG8uZ2V0TWFpblRleHQoKVxyXG5cdFx0XHRcdFx0XHQ6IHRlbXBsYXRlLmdldFRpdGxlKCkuZ2V0TWFpblRleHQoKTtcclxuXHRcdFx0XHRcdHJldHVybiBhbGxCYW5uZXJzLndpdGhSYXRpbmdzLmluY2x1ZGVzKG1haW5UZXh0KSB8fCBcclxuICAgICAgICAgICAgICAgICAgICBhbGxCYW5uZXJzLndpdGhvdXRSYXRpbmdzLmluY2x1ZGVzKG1haW5UZXh0KSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIGFsbEJhbm5lcnMud3JhcHBlcnMuaW5jbHVkZXMobWFpblRleHQpO1xyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFx0XHQubWFwKGZ1bmN0aW9uKHRlbXBsYXRlKSB7IC8vIFNldCB3cmFwcGVyIHRhcmdldCBpZiBuZWVkZWRcclxuXHRcdFx0XHRcdFx0dmFyIG1haW5UZXh0ID0gdGVtcGxhdGUucmVkaXJlY3RUb1xyXG5cdFx0XHRcdFx0XHRcdD8gdGVtcGxhdGUucmVkaXJlY3RUby5nZXRNYWluVGV4dCgpXHJcblx0XHRcdFx0XHRcdFx0OiB0ZW1wbGF0ZS5nZXRUaXRsZSgpLmdldE1haW5UZXh0KCk7XHJcblx0XHRcdFx0XHRcdGlmIChhbGxCYW5uZXJzLndyYXBwZXJzLmluY2x1ZGVzKG1haW5UZXh0KSkge1xyXG5cdFx0XHRcdFx0XHRcdHRlbXBsYXRlLnJlZGlyZWN0c1RvID0gbXcuVGl0bGUubmV3RnJvbVRleHQoXCJUZW1wbGF0ZTpTdWJzdDpcIiArIG1haW5UZXh0KTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gdGVtcGxhdGU7XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHJcblx0Ly8gUmV0cmlldmUgYW5kIHN0b3JlIFRlbXBsYXRlRGF0YSAodGFzayA0KVxyXG5cdHZhciB0ZW1wbGF0ZURhdGFQcm9taXNlID0gcGFyc2VUYWxrUHJvbWlzZS50aGVuKHRlbXBsYXRlcyA9PiB7XHJcblx0XHR0ZW1wbGF0ZXMuZm9yRWFjaCh0ZW1wbGF0ZSA9PiB0ZW1wbGF0ZS5zZXRQYXJhbURhdGFBbmRTdWdnZXN0aW9ucygpKTtcclxuXHRcdHJldHVybiB0ZW1wbGF0ZXM7XHJcblx0fSk7XHJcblxyXG5cdC8vIENoZWNrIGlmIHBhZ2UgaXMgYSByZWRpcmVjdCAodGFzayA1KSAtIGJ1dCBkb24ndCBlcnJvciBvdXQgaWYgcmVxdWVzdCBmYWlsc1xyXG5cdHZhciByZWRpcmVjdENoZWNrUHJvbWlzZSA9IEFQSS5nZXRSYXcoc3ViamVjdFBhZ2UuZ2V0UHJlZml4ZWRUZXh0KCkpXHJcblx0XHQudGhlbihcclxuXHRcdFx0Ly8gU3VjY2Vzc1xyXG5cdFx0XHRmdW5jdGlvbihyYXdQYWdlKSB7IFxyXG5cdFx0XHRcdGlmICggL15cXHMqI1JFRElSRUNUL2kudGVzdChyYXdQYWdlKSApIHtcclxuXHRcdFx0XHRcdC8vIGdldCByZWRpcmVjdGlvbiB0YXJnZXQsIG9yIGJvb2xlYW4gdHJ1ZVxyXG5cdFx0XHRcdFx0cmV0dXJuIHJhd1BhZ2Uuc2xpY2UocmF3UGFnZS5pbmRleE9mKFwiW1tcIikrMiwgcmF3UGFnZS5pbmRleE9mKFwiXV1cIikpIHx8IHRydWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fSxcclxuXHRcdFx0Ly8gRmFpbHVyZSAoaWdub3JlZClcclxuXHRcdFx0ZnVuY3Rpb24oKSB7IHJldHVybiBudWxsOyB9XHJcblx0XHQpO1xyXG5cclxuXHQvLyBSZXRyaWV2ZSByYXRpbmcgZnJvbSBPUkVTICh0YXNrIDYsIG9ubHkgbmVlZGVkIGZvciBhcnRpY2xlcylcclxuXHR2YXIgc2hvdWxkR2V0T3JlcyA9ICggY29uZmlnLm13LndnTmFtZXNwYWNlTnVtYmVyIDw9IDEgKTtcclxuXHRpZiAoIHNob3VsZEdldE9yZXMgKSB7XHJcblx0XHR2YXIgbGF0ZXN0UmV2SWRQcm9taXNlID0gY3VycmVudFBhZ2UuaXNUYWxrUGFnZSgpXHJcblx0XHRcdD8gJC5EZWZlcnJlZCgpLnJlc29sdmUoY29uZmlnLm13LndnUmV2aXNpb25JZClcclxuXHRcdFx0OiBcdEFQSS5nZXQoIHtcclxuXHRcdFx0XHRhY3Rpb246IFwicXVlcnlcIixcclxuXHRcdFx0XHRmb3JtYXQ6IFwianNvblwiLFxyXG5cdFx0XHRcdHByb3A6IFwicmV2aXNpb25zXCIsXHJcblx0XHRcdFx0dGl0bGVzOiBzdWJqZWN0UGFnZS5nZXRQcmVmaXhlZFRleHQoKSxcclxuXHRcdFx0XHRydnByb3A6IFwiaWRzXCIsXHJcblx0XHRcdFx0aW5kZXhwYWdlaWRzOiAxXHJcblx0XHRcdH0gKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0XHRcdGlmIChyZXN1bHQucXVlcnkucmVkaXJlY3RzKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHZhciBpZCA9IHJlc3VsdC5xdWVyeS5wYWdlaWRzO1xyXG5cdFx0XHRcdHZhciBwYWdlID0gcmVzdWx0LnF1ZXJ5LnBhZ2VzW2lkXTtcclxuXHRcdFx0XHRpZiAocGFnZS5taXNzaW5nID09PSBcIlwiKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICggaWQgPCAwICkge1xyXG5cdFx0XHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHBhZ2UucmV2aXNpb25zWzBdLnJldmlkO1xyXG5cdFx0XHR9KTtcclxuXHRcdHZhciBvcmVzUHJvbWlzZSA9IGxhdGVzdFJldklkUHJvbWlzZS50aGVuKGZ1bmN0aW9uKGxhdGVzdFJldklkKSB7XHJcblx0XHRcdGlmICghbGF0ZXN0UmV2SWQpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIEFQSS5nZXRPUkVTKGxhdGVzdFJldklkKVxyXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xyXG5cdFx0XHRcdFx0dmFyIGRhdGEgPSByZXN1bHQuZW53aWtpLnNjb3Jlc1tsYXRlc3RSZXZJZF0ud3AxMDtcclxuXHRcdFx0XHRcdGlmICggZGF0YS5lcnJvciApIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoZGF0YS5lcnJvci50eXBlLCBkYXRhLmVycm9yLm1lc3NhZ2UpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cmV0dXJuIGRhdGEuc2NvcmUucHJlZGljdGlvbjtcclxuXHRcdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0Ly8gT3BlbiB0aGUgbG9hZCBkaWFsb2dcclxuXHR2YXIgaXNPcGVuZWRQcm9taXNlID0gJC5EZWZlcnJlZCgpO1xyXG5cdHZhciBsb2FkRGlhbG9nV2luID0gd2luZG93TWFuYWdlci5vcGVuV2luZG93KFwibG9hZERpYWxvZ1wiLCB7XHJcblx0XHRwcm9taXNlczogW1xyXG5cdFx0XHRiYW5uZXJzUHJvbWlzZSxcclxuXHRcdFx0bG9hZFRhbGtQcm9taXNlLFxyXG5cdFx0XHRwYXJzZVRhbGtQcm9taXNlLFxyXG5cdFx0XHR0ZW1wbGF0ZURhdGFQcm9taXNlLFxyXG5cdFx0XHRyZWRpcmVjdENoZWNrUHJvbWlzZSxcclxuXHRcdFx0c2hvdWxkR2V0T3JlcyAmJiBvcmVzUHJvbWlzZVxyXG5cdFx0XSxcclxuXHRcdG9yZXM6IHNob3VsZEdldE9yZXMsXHJcblx0XHRpc09wZW5lZDogaXNPcGVuZWRQcm9taXNlXHJcblx0fSk7XHJcblxyXG5cdGxvYWREaWFsb2dXaW4ub3BlbmVkLnRoZW4oaXNPcGVuZWRQcm9taXNlLnJlc29sdmUpO1xyXG5cclxuXHJcblx0JC53aGVuKFxyXG5cdFx0bG9hZFRhbGtQcm9taXNlLFxyXG5cdFx0dGVtcGxhdGVEYXRhUHJvbWlzZSxcclxuXHRcdHJlZGlyZWN0Q2hlY2tQcm9taXNlLFxyXG5cdFx0c2hvdWxkR2V0T3JlcyAmJiBvcmVzUHJvbWlzZVxyXG5cdCkudGhlbihcclxuXHRcdC8vIEFsbCBzdWNjZWRlZFxyXG5cdFx0ZnVuY3Rpb24odGFsa1dpa2l0ZXh0LCBiYW5uZXJzLCByZWRpcmVjdFRhcmdldCwgb3Jlc1ByZWRpY2l0aW9uICkge1xyXG5cdFx0XHR2YXIgcmVzdWx0ID0ge1xyXG5cdFx0XHRcdHN1Y2Nlc3M6IHRydWUsXHJcblx0XHRcdFx0dGFsa3BhZ2U6IHRhbGtQYWdlLFxyXG5cdFx0XHRcdHRhbGtXaWtpdGV4dDogdGFsa1dpa2l0ZXh0LFxyXG5cdFx0XHRcdGJhbm5lcnM6IGJhbm5lcnNcclxuXHRcdFx0fTtcclxuXHRcdFx0aWYgKHJlZGlyZWN0VGFyZ2V0KSB7XHJcblx0XHRcdFx0cmVzdWx0LnJlZGlyZWN0VGFyZ2V0ID0gcmVkaXJlY3RUYXJnZXQ7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKG9yZXNQcmVkaWNpdGlvbikge1xyXG5cdFx0XHRcdHJlc3VsdC5vcmVzUHJlZGljaXRpb24gPSBvcmVzUHJlZGljaXRpb247XHJcblx0XHRcdH1cclxuXHRcdFx0d2luZG93TWFuYWdlci5jbG9zZVdpbmRvdyhcImxvYWREaWFsb2dcIiwgcmVzdWx0KTtcclxuXHRcdFx0XHJcblx0XHR9XHJcblx0KTsgLy8gQW55IGZhaWx1cmVzIGFyZSBoYW5kbGVkIGJ5IHRoZSBsb2FkRGlhbG9nIHdpbmRvdyBpdHNlbGZcclxuXHJcblx0Ly8gT24gd2luZG93IGNsb3NlZCwgY2hlY2sgZGF0YSwgYW5kIHJlc29sdmUvcmVqZWN0IHNldHVwQ29tcGxldGVkUHJvbWlzZVxyXG5cdGxvYWREaWFsb2dXaW4uY2xvc2VkLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0aWYgKGRhdGEgJiYgZGF0YS5zdWNjZXNzKSB7XHJcblx0XHRcdC8vIEdvdCBldmVyeXRoaW5nIG5lZWRlZDogUmVzb2x2ZSBwcm9taXNlIHdpdGggdGhpcyBkYXRhXHJcblx0XHRcdHNldHVwQ29tcGxldGVkUHJvbWlzZS5yZXNvbHZlKGRhdGEpO1xyXG5cdFx0fSBlbHNlIGlmIChkYXRhICYmIGRhdGEuZXJyb3IpIHtcclxuXHRcdFx0Ly8gVGhlcmUgd2FzIGFuIGVycm9yOiBSZWplY3QgcHJvbWlzZSB3aXRoIGVycm9yIGNvZGUvaW5mb1xyXG5cdFx0XHRzZXR1cENvbXBsZXRlZFByb21pc2UucmVqZWN0KGRhdGEuZXJyb3IuY29kZSwgZGF0YS5lcnJvci5pbmZvKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdC8vIFdpbmRvdyBjbG9zZWQgYmVmb3JlIGNvbXBsZXRpb246IHJlc29sdmUgcHJvbWlzZSB3aXRob3V0IGFueSBkYXRhXHJcblx0XHRcdHNldHVwQ29tcGxldGVkUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xyXG5cdFx0fVxyXG5cdFx0Y2FjaGUuY2xlYXJJbnZhbGlkSXRlbXMoKTtcclxuXHR9KTtcclxuXHJcblx0Ly8gVEVTVElORyBwdXJwb3NlcyBvbmx5OiBsb2cgcGFzc2VkIGRhdGEgdG8gY29uc29sZVxyXG5cdHNldHVwQ29tcGxldGVkUHJvbWlzZS50aGVuKFxyXG5cdFx0ZGF0YSA9PiBjb25zb2xlLmxvZyhcInNldHVwIHdpbmRvdyBjbG9zZWRcIiwgZGF0YSksXHJcblx0XHQoY29kZSwgaW5mbykgPT4gY29uc29sZS5sb2coXCJzZXR1cCB3aW5kb3cgY2xvc2VkIHdpdGggZXJyb3JcIiwge2NvZGUsIGluZm99KVxyXG5cdCk7XHJcblxyXG5cdHJldHVybiBzZXR1cENvbXBsZXRlZFByb21pc2U7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzZXR1cFJhdGVyOyIsIi8vIFZhcmlvdXMgdXRpbGl0eSBmdW5jdGlvbnMgYW5kIG9iamVjdHMgdGhhdCBtaWdodCBiZSB1c2VkIGluIG11bHRpcGxlIHBsYWNlc1xyXG5cclxuaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi9jb25maWdcIjtcclxuXHJcbnZhciBpc0FmdGVyRGF0ZSA9IGZ1bmN0aW9uKGRhdGVTdHJpbmcpIHtcclxuXHRyZXR1cm4gbmV3IERhdGUoZGF0ZVN0cmluZykgPCBuZXcgRGF0ZSgpO1xyXG59O1xyXG5cclxudmFyIEFQSSA9IG5ldyBtdy5BcGkoIHtcclxuXHRhamF4OiB7XHJcblx0XHRoZWFkZXJzOiB7IFxyXG5cdFx0XHRcIkFwaS1Vc2VyLUFnZW50XCI6IFwiUmF0ZXIvXCIgKyBjb25maWcuc2NyaXB0LnZlcnNpb24gKyBcclxuXHRcdFx0XHRcIiAoIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1VzZXI6RXZhZDM3L1JhdGVyIClcIlxyXG5cdFx0fVxyXG5cdH1cclxufSApO1xyXG4vKiAtLS0tLS0tLS0tIEFQSSBmb3IgT1JFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXHJcbkFQSS5nZXRPUkVTID0gZnVuY3Rpb24ocmV2aXNpb25JRCkge1xyXG5cdHJldHVybiAkLmdldChcImh0dHBzOi8vb3Jlcy53aWtpbWVkaWEub3JnL3YzL3Njb3Jlcy9lbndpa2k/bW9kZWxzPXdwMTAmcmV2aWRzPVwiK3JldmlzaW9uSUQpO1xyXG59O1xyXG4vKiAtLS0tLS0tLS0tIFJhdyB3aWtpdGV4dCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXHJcbkFQSS5nZXRSYXcgPSBmdW5jdGlvbihwYWdlKSB7XHJcblx0cmV0dXJuICQuZ2V0KFwiaHR0cHM6XCIgKyBjb25maWcubXcud2dTZXJ2ZXIgKyBtdy51dGlsLmdldFVybChwYWdlLCB7YWN0aW9uOlwicmF3XCJ9KSlcclxuXHRcdC50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdFx0aWYgKCAhZGF0YSApIHtcclxuXHRcdFx0XHRyZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdChcIm9rLWJ1dC1lbXB0eVwiKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gZGF0YTtcclxuXHRcdH0pO1xyXG59O1xyXG5cclxudmFyIG1ha2VFcnJvck1zZyA9IGZ1bmN0aW9uKGZpcnN0LCBzZWNvbmQpIHtcclxuXHR2YXIgY29kZSwgeGhyLCBtZXNzYWdlO1xyXG5cdGlmICggdHlwZW9mIGZpcnN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBzZWNvbmQgPT09IFwic3RyaW5nXCIgKSB7XHJcblx0XHQvLyBFcnJvcnMgZnJvbSAkLmdldCBiZWluZyByZWplY3RlZCAoT1JFUyAmIFJhdyB3aWtpdGV4dClcclxuXHRcdHZhciBlcnJvck9iaiA9IGZpcnN0LnJlc3BvbnNlSlNPTiAmJiBmaXJzdC5yZXNwb25zZUpTT04uZXJyb3I7XHJcblx0XHRpZiAoIGVycm9yT2JqICkge1xyXG5cdFx0XHQvLyBHb3QgYW4gYXBpLXNwZWNpZmljIGVycm9yIGNvZGUvbWVzc2FnZVxyXG5cdFx0XHRjb2RlID0gZXJyb3JPYmouY29kZTtcclxuXHRcdFx0bWVzc2FnZSA9IGVycm9yT2JqLm1lc3NhZ2U7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR4aHIgPSBmaXJzdDtcclxuXHRcdH1cclxuXHR9IGVsc2UgaWYgKCB0eXBlb2YgZmlyc3QgPT09IFwic3RyaW5nXCIgJiYgdHlwZW9mIHNlY29uZCA9PT0gXCJvYmplY3RcIiApIHtcclxuXHRcdC8vIEVycm9ycyBmcm9tIG13LkFwaSBvYmplY3RcclxuXHRcdHZhciBtd0Vycm9yT2JqID0gc2Vjb25kLmVycm9yO1xyXG5cdFx0aWYgKG13RXJyb3JPYmopIHtcclxuXHRcdFx0Ly8gR290IGFuIGFwaS1zcGVjaWZpYyBlcnJvciBjb2RlL21lc3NhZ2VcclxuXHRcdFx0Y29kZSA9IGVycm9yT2JqLmNvZGU7XHJcblx0XHRcdG1lc3NhZ2UgPSBlcnJvck9iai5pbmZvO1xyXG5cdFx0fSBlbHNlIGlmIChmaXJzdCA9PT0gXCJvay1idXQtZW1wdHlcIikge1xyXG5cdFx0XHRjb2RlID0gbnVsbDtcclxuXHRcdFx0bWVzc2FnZSA9IFwiR290IGFuIGVtcHR5IHJlc3BvbnNlIGZyb20gdGhlIHNlcnZlclwiO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0eGhyID0gc2Vjb25kICYmIHNlY29uZC54aHI7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRpZiAoY29kZSAmJiBtZXNzYWdlKSB7XHJcblx0XHRyZXR1cm4gYEFQSSBlcnJvciAke2NvZGV9OiAke21lc3NhZ2V9YDtcclxuXHR9IGVsc2UgaWYgKG1lc3NhZ2UpIHtcclxuXHRcdHJldHVybiBgQVBJIGVycm9yOiAke21lc3NhZ2V9YDtcclxuXHR9IGVsc2UgaWYgKHhocikge1xyXG5cdFx0cmV0dXJuIGBIVFRQIGVycm9yICR7eGhyLnN0YXR1c31gO1xyXG5cdH0gZWxzZSBpZiAoXHJcblx0XHR0eXBlb2YgZmlyc3QgPT09IFwic3RyaW5nXCIgJiYgZmlyc3QgIT09IFwiZXJyb3JcIiAmJlxyXG5cdFx0dHlwZW9mIHNlY29uZCA9PT0gXCJzdHJpbmdcIiAmJiBzZWNvbmQgIT09IFwiZXJyb3JcIlxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIGBFcnJvciAke2ZpcnN0fTogJHtzZWNvbmR9YDtcclxuXHR9IGVsc2UgaWYgKHR5cGVvZiBmaXJzdCA9PT0gXCJzdHJpbmdcIiAmJiBmaXJzdCAhPT0gXCJlcnJvclwiKSB7XHJcblx0XHRyZXR1cm4gYEVycm9yOiAke2ZpcnN0fWA7XHJcblx0fSBlbHNlIHtcclxuXHRcdHJldHVybiBcIlVua25vd24gQVBJIGVycm9yXCI7XHJcblx0fVxyXG59O1xyXG5cclxuZXhwb3J0IHtpc0FmdGVyRGF0ZSwgQVBJLCBtYWtlRXJyb3JNc2d9OyIsImltcG9ydCBMb2FkRGlhbG9nIGZyb20gXCIuL1dpbmRvd3MvTG9hZERpYWxvZ1wiO1xyXG5pbXBvcnQgTWFpbldpbmRvdyBmcm9tIFwiLi9XaW5kb3dzL01haW5XaW5kb3dcIjtcclxuXHJcbnZhciBmYWN0b3J5ID0gbmV3IE9PLkZhY3RvcnkoKTtcclxuXHJcbi8vIFJlZ2lzdGVyIHdpbmRvdyBjb25zdHJ1Y3RvcnMgd2l0aCB0aGUgZmFjdG9yeS5cclxuZmFjdG9yeS5yZWdpc3RlcihMb2FkRGlhbG9nKTtcclxuZmFjdG9yeS5yZWdpc3RlcihNYWluV2luZG93KTtcclxuXHJcbnZhciBtYW5hZ2VyID0gbmV3IE9PLnVpLldpbmRvd01hbmFnZXIoIHtcclxuXHRcImZhY3RvcnlcIjogZmFjdG9yeVxyXG59ICk7XHJcbiQoIGRvY3VtZW50LmJvZHkgKS5hcHBlbmQoIG1hbmFnZXIuJGVsZW1lbnQgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IG1hbmFnZXI7Il19
