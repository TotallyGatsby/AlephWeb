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
    		this.loadWalls(poly);
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
                verts.push(endPt.vertx);
                verts.push(poly.ceilingHeight);
                verts.push(endPt.verty);
                
                // Marathon textures were 128x128px and 1024x1024 world units
                // WebGL Texture coordinates are 0<->1 We can effectively divide
                // the world pos by 1024 to get our texcoords
                // TODO: Handle x/y offset on textures
                texCoords.push(endPt.verty/1024.0+poly.floorY);
                texCoords.push(endPt.vertx/1024.0+poly.floorX);
                texCoords.push(poly.ceilingLightIndex);
            }
            
            this.tokens.push(a1.SM.getSurfaceToken(verts, texCoords, poly.floorTexture));
        },


        // Each poly in Marathon has a 'sids' struct that contains
        // information relevant to rendering a side.
        // Within it are three texture coordinates:
        //    Primary - Texture for the wall, or if the wall is split
        //              texture for the upper half
        //    Secondary - Texture for the lower half of a split wall
        //    Transparent - Texture for the area between a split wall
        loadWalls: function(poly){
            var side;
            var sideID;
            var neighborID;
            var matId;
            var line;
            
            for(var i = 0; i < poly.sideIndices.length; i++){
                sideID = poly.sideIndices[i];
                if(sideID === -1)
                    continue;
                
                // Get the actual side data
                side = a1.mapData.getChunkEntry(sideID,"SIDS" );
                line = a1.mapData.getChunkEntry(side.lineidx,"LINS" );
                
                var neighborID = poly.neighbors[i];
                
                // If our neighbor poly is -1, this is an edge of the world
                if (neighborID === -1){
                    matId = side.pmat;
                    if (matId != -1){
                        this.addVertSurface(matId, line, poly.floorHeight, poly.ceilingHeight, side.px, side.py, side.plite)
                    }
                    matId = side.smat;
                    if (matId != -1){
                        this.addVertSurface(matId, line, poly.floorHeight, poly.ceilingHeight, side.sx, side.sy, side.slite);
                    }
                    matId = side.tmat;
                    if (matId != -1){
                        this.addVertSurface(matId, line, poly.floorHeight, poly.ceilingHeight, side.tx, side.ty, side.tlite);
                    }
                }
                // If the ceilings of the adjacent polys are equal, use the primary material for the lower area
                else if (line.lAdjCei === poly.ceilingHeight){
                    matId = side.pmat;
                    if (matId != -1){
                        this.addVertSurface(matId, line, poly.floorHeight, line.hAdjFlr, side.px, side.py,side.plite);
                    }
                    matId = side.tmat;
                    if (matId != -1){
                        this.addVertSurface(matId, line, line.hAdjFlr,  line.lAdjCei, side.tx, side.ty,side.tlite);
                    }
                }
                // We have a split poly, render upper, lower, and transparent sides
                else{
                    matId = side.pmat;
                    if (matId != -1){
                        this.addVertSurface(matId, line, line.lAdjCei, poly.ceilingHeight, side.px, side.py,side.plite);
                    }
                    matId = side.smat;
                    if (matId != -1){
                        this.addVertSurface(matId, line, poly.floorHeight, line.hAdjFlr , side.sx, side.sy,side.slite);
                    }
                    matId = side.tmat;
                    if (matId != -1){
                        this.addVertSurface(matId, line, line.hAdjFlr,  line.lAdjCei, side.tx, side.ty,side.tlite);
                    }
                }
            }
        },
        
        // Adds the information to the buffers render a vertical surface - ie, walls
        addVertSurface:function(matId, line, floor, ceiling, dx, dy, lite){
        	var verts = [];
        	var texCoords = [];
            
            // Append the data to the Pos, Tex, and Index arrays
            // Build the vertex buffers
            // Add the 4 points needed to render the wall
            endPt1 = a1.mapData.getChunkEntry(line.p0, "EPNT");
            endPt2 = a1.mapData.getChunkEntry(line.p1, "EPNT");
            
            xOffset =  dx/1024.0;
            yOffset = -dy/1024.0;

            // Upper Left
            verts.push(endPt1.vertx);
            verts.push(ceiling);
            verts.push(endPt1.verty);
            texCoords.push(xOffset);
            texCoords.push(1.0+yOffset);
            texCoords.push(lite);
            
            // Upper Right
            verts.push(endPt2.vertx);
            verts.push(ceiling);
            verts.push(endPt2.verty);
            texCoords.push(line.len/1024.0 + xOffset);
            texCoords.push(1.0+yOffset);
            texCoords.push(lite);
	    
            // Lower Right
            verts.push(endPt2.vertx);
            verts.push(floor);
            verts.push(endPt2.verty);
            texCoords.push(line.len/1024.0 + xOffset);
            texCoords.push(1.0-((ceiling-floor)/1024.0)+yOffset);
            texCoords.push(lite);
	    
            // Lower Left
            verts.push(endPt1.vertx);
            verts.push(floor);
            verts.push(endPt1.verty);
            texCoords.push(xOffset);
            texCoords.push(1.0-((ceiling-floor)/1024.0) + yOffset);
            texCoords.push(lite);

            this.tokens.push(a1.SM.getSurfaceToken(verts, texCoords, matId));
        },
    });
});