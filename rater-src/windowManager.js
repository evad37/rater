import LoadDialog from "./Windows/LoadDialog";
import MainWindow from "./Windows/MainWindow";
// <nowiki>

var factory = new OO.Factory();

// Register window constructors with the factory.
factory.register(LoadDialog);
factory.register(MainWindow);

var manager = new OO.ui.WindowManager( {
	"factory": factory
} );
$( document.body ).append( manager.$element );

export default manager;
// </nowiki>