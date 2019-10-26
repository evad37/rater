import setupRater from "./setup";
import autoStart from "./autostart";
import diffStyles from "./css.js";
import { makeErrorMsg } from "./util";
import windowManager from "./windowManager";

(function App() {
	console.log("Rater's App.js is running...");

	mw.util.addCSS(diffStyles);

	const showMainWindow = data => {
		if (!data || !data.success) {
			return;
		}

		windowManager.openWindow("main", data);
	};

	const showSetupError = (code, jqxhr) => OO.ui.alert(
		makeErrorMsg(code, jqxhr),	{
			title: "Rater failed to open"
		}
	);

	// Invocation by portlet link 
	mw.util.addPortletLink(
		"p-cactions",
		"#",
		"Rater",
		"ca-rater",
		"Rate quality and importance",
		"5"
	);
	$("#ca-rater").click(() => setupRater().then(showMainWindow, showSetupError) );

	// Invocation by auto-start (do not show message on error)
	autoStart().then(showMainWindow);
})();