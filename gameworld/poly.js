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
 
 poly.js - Representation of a map poly.
 
*/

a1.segment(
	'gameworld.poly'
).defines(function(){
    a1.Poly = a1.Class.extend({
    	tokens: [], // The rendertokens

    	/*
			Request a rendertoken giving the vertices and the material ID
    	*/
    	setup: function(poly){
    		this.loadFloor(poly);
    		this.loadCeiling(poly);
    	},

		draw: function(){
    		for (var i = 0; i < this.tokens.length; i++){
    			this.tokens[i].draw();
    		}
    	},
    	// Build the polygons for our floor
        // TODO: This shares a lot of code with loadCeiling
        //   condense it?
        loadFloor: function(poly){
            var endPt;

            var verts = [];
            var texCoords = [];

            // Append the data to the Pos, Tex, and Index arrays
            // Build the vertex buffers
            for(var j=0; j < poly.endpointIndices.length; j++){
                // Grab the endpoint coords
                endPt = a1.mapData.getChunkEntry(poly.endpointIndices[j], "EPNT");
                verts.push(endPt.vertx);
                verts.push(poly.floorHeight);
                verts.push(endPt.verty);
                
                // Marathon textures were 128x128px and 1024x1024 world units
                // WebGL Texture coordinates are 0<->1 We can effectively divide
                // the world pos by 1024 to get our texcoords
                // TODO: Handle x/y offset on textures                
                texCoords.push(endPt.verty/1024.0+poly.floorY);
                texCoords.push(-(endPt.vertx/1024.0-poly.floorX)+.5);
                texCoords.push(poly.floorLightIndex);
            }
            
            this.tokens.push(a1.SM.getSurfaceToken(verts, texCoords, poly.floorTexture));
        },

        // Build the polygons for our ceiling
        loadCeiling: function(poly){
            var endPt;

            var verts = [];
            var texCoords = [];
            
            // Append the data to the Pos, Tex, and Index arrays
            // Build the vertex buffers
            for(var j=0; j < poly.endpointIndices.length; j++){
                // Grab the endpoint coords
                endPt = a1.mapData.getChunkEntry(poly.endpointIndices[j], "EPNT");
                curSurfData.verts.push(endPt.vertx);
                curSurfData.verts.push(poly.ceilingHeight);
                curSurfData.verts.push(endPt.verty);
                
                // Marathon textures were 128x128px and 1024x1024 world units
                // WebGL Texture coordinates are 0<->1 We can effectively divide
                // the world pos by 1024 to get our texcoords
                // TODO: Handle x/y offset on textures
                curSurfData.texCoords.push(endPt.verty/1024.0+poly.floorY);
                curSurfData.texCoords.push(endPt.vertx/1024.0+poly.floorX);
                curSurfData.texCoords.push(poly.ceilingLightIndex);
            }
            
            this.tokens.push(a1.SM.getSurfaceToken(verts, texCoords, poly.floorTexture));
        },
    });
});