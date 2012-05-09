/*

    Copyright (C) AlephWeb developers -- github.com/Pfhreak/AlephWeb
    Portions of this code are based on the code:
	Copyright (C) 1991-2001 and beyond by Bungie Studios, Inc.
	and the "Aleph One" developers.
 
	This program is free software; you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation; either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	This license is contained in the file "COPYING",
	which is included with this source code; it is available online at
	http://www.gnu.org/licenses/gpl.html

*/

/*
 
 texturemanager.js - Responsible for loading, storing, and managing textures
 
*/

// NOTE: The texture manager currently only supports the marathon infinity scenario
// TODO: Unload textures if they aren't used for a certain period of time?
a1.segment(
	'rendermain.texturemanager'
).defines(function(){
    TextureManager = a1.Class.extend({
        
        loadedTextures: {},
        
        // Loads a texture from the web
        loadTexture: function(matID){
            if (this.loadedTextures[matID] != undefined){
                return this.loadedTextures[matID];
            }

            var texture = a1.gl.createTexture();
            var onload = this.handleLoad;
            texture.image = new Image();
            
            // TODO: onerror to load the beautiful error texture.
            texture.image.onload = function(){
                onload(matID, texture);
            };
            // TODO Handle the actual error conditions appropriately
            // rather than making the assumption we are here
            if (parseInt(matID) > 7000 || parseInt(matID) < 0){
                texture.image.src = "media/img/error.png";
            }
            else {
                
                texture.image.src = this.getURLFromBits(matID);
            }
            this.loadedTextures[matID] = texture;
            return texture;
        },
        
        // Processes the texture into the videocard
        handleLoad: function(name, texture){
            a1.gl.bindTexture(a1.gl.TEXTURE_2D, texture);
            a1.gl.pixelStorei(a1.gl.UNPACK_FLIP_Y_WEBGL, true);
            a1.gl.texImage2D(a1.gl.TEXTURE_2D, 0, a1.gl.RGBA, a1.gl.RGBA, a1.gl.UNSIGNED_BYTE, texture.image);
            a1.gl.texParameteri(a1.gl.TEXTURE_2D, a1.gl.TEXTURE_MAG_FILTER, a1.gl.NEAREST);
            a1.gl.texParameteri(a1.gl.TEXTURE_2D, a1.gl.TEXTURE_MIN_FILTER, a1.gl.NEAREST);
            a1.gl.bindTexture(a1.gl.TEXTURE_2D, null);
        },
        
        // Converts a material id into a URL to download
        getURLFromBits:function(matID){
            // Marathon stores texture references in a single
            // short with 3 bits for the CLUT, 5 for the collection
            // and 8 for the actual shape index
            var CLUT = matID >> 13; // first 3 bits
            var collection = (matID >> 8) & 0x1F; // 5 bits masked
            var shape = matID & 0xFF; // 8 bits masked
            // TODO
            // Handle scenarios besides Marathon Infinity
            return "media/scenario/infinity/img/"+collection+"/"+shape+".png";
        }
    });
    
});