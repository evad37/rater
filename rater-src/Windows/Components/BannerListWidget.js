var BannerListWidget = function BannerListWidget( config ) {
	config = config || {};

	// Call parent constructor
	BannerListWidget.parent.call( this, config );
	OO.ui.mixin.GroupElement.call( this, {
		$group: this.$element
	} );

	this.$element.css({"padding":"20px 10px 16px 10px"});

	this.aggregate( {
		remove: "bannerRemove"
	} );

	this.connect( this, {
		bannerRemove: "onBannerRemove"
	} );
};

OO.inheritClass( BannerListWidget, OO.ui.Widget );
OO.mixinClass( BannerListWidget, OO.ui.mixin.GroupElement );
/*
methods from mixin:
 - addItems( items, [index] ) : OO.ui.Element  (CHAINABLE)
 - clearItems( ) : OO.ui.Element  (CHAINABLE)
 - findItemFromData( data ) : OO.ui.Element|null
 - findItemsFromData( data ) : OO.ui.Element[]
 - removeItems( items ) : OO.ui.Element  (CHAINABLE)
*/

BannerListWidget.prototype.onBannerRemove = function ( banner ) {
	this.removeItems([banner]);
};



export default BannerListWidget;