var Crafty = require('../core/core.js');

// Define helper functions for media assets
var getExt = function(f) {
    return f.substr(f.lastIndexOf('.') + 1).toLowerCase();
};

var getFilePath = function(type,f) {
    var paths = Crafty.paths();
    return (f.search("://") === -1 ? (type === "audio" ? paths.audio + f : paths.images + f) : f);
};

var isAsset = function(a) {
    return Crafty.asset(a) || null;
};

var isSupportedAudio = function(f) {
    return Crafty.support.audio && Crafty.audio.supports(getExt(f));
};

var isValidImage = function(f) {
    return Crafty.imageWhitelist.indexOf(getExt(f)) !== -1;
};

// Currently assumes that the declararation is either:
// - A single file: "buzz.wav"
// - A list of files: ["buzz.wav", "buzz.mp3"]



Crafty.AudioAssetWrapper = function(name, declaration, onload, onerror) {
    this._name = name;
    this._onload = onload;
    this._onerror = onerror;
    // setup default, internal props
    this._files = [];
    this._baseAudioObject = null;

    // Get audio urls from the declaration
    if (typeof declaration === "object") {
        for (var i in declaration) {
            if(this._addFileUrl(declaration[i])){
                this._onload();
                return;
            }
        }
    } else if (typeof declaration === "string") {
        if(this._addFileUrl(declaration)){
            this._onload();
            return;
        }
    } else {
        this._onerror("Invalid declararation");
        return;
    }

    this._init();
};


Crafty.AudioAssetWrapper.prototype = {
    _addFileUrl: function(file) {
        var fileUrl  = getFilePath("audio", file);
        if(isAsset(fileUrl)){
            return true;
        }
        if (isSupportedAudio(fileUrl)) {
            this._files.push(fileUrl);
        }
        return false;
    },

    _init: function() {
        if (this._files.length > 0) {
            var audio = Crafty.audio.add(this._name, this._files);
            var self =  this;

            if (audio.obj) {
                var onReady = function() {
                    // No guarantee that this event occurs only once
                    this.removeEventListener('canplaythrough', onReady);
                    self._onload();
                };
                var onError = function() {
                    self._onerror();
                };
                audio.obj.addEventListener('canplaythrough', onReady, false);
                audio.obj.onerror = onError;
                // Register the asset
                Crafty.assets(audio.obj.src, audio.obj);
                this._url = audio.obj.src;
            } else {
                this._onerror("Not a valid asset");
            }
        }
    }
};

Crafty.ImageAssetWrapper = function (name, declaration, onload, onerror) {
    this._name = name;
    this._onload = onload;
    this._onerror = onerror;
    this._baseImageObject = null;


    this._url = getFilePath("image", name);
    
    if (isAsset(this._url)) {
        this._onload();
        return;
    }
    if (isValidImage(name)) {
        this._init();
        Crafty.asset(this._url, this._baseImageObject);
    }
};

Crafty.ImageAssetWrapper.prototype = {
    _init: function() {
        var img = this._baseImageObject = new Image();
        var self = this;
        img.onload = function(){ self._onload(); };
        img.onerror = function(){ self._onerror(); };
        if (Crafty.support.prefix === 'webkit'){
            img.src = ""; // workaround for webkit bug
        }
        img.src = this._url;
    }
};


Crafty.SpriteAssetWrapper = function (name, declaration, onload, onerror) {
    // Applies all the logic of regular images
    Crafty.ImageAssetWrapper.apply(this, arguments);
    // Then define the sprite from the declaration
    Crafty.sprite(declaration.tile, declaration.tileh, this._url, declaration.map,
        declaration.paddingX, declaration.paddingY, declaration.paddingAroundBorder);
};

Crafty.SpriteAssetWrapper.prototype = Object.create(Crafty.ImageAssetWrapper.prototype);