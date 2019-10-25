import setupRater from "./setup";
import autoStart from "./autostart";
import diffStyles from "./css.js";

(function App() {
	console.log("Rater's App.js is running...");

	mw.util.addCSS(diffStyles);

	// Add portlet link
	mw.util.addPortletLink(
		"p-cactions",
		"#",
		"Rater",
		"ca-rater",
		"Rate quality and importance",
		"5"
	);
	$("#ca-rater").click(setupRater);

	autoStart();
})();