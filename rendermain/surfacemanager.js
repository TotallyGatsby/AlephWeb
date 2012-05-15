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
 
 surfacemanager.js - Marathon floors, ceilings, and walls are more or
        less static. Surface Manager builds the necessary buffers to
        render them when the level loads, and tries to use the minimum
        number of surfaces when the game renders.
 
*/

a1.segment(
	'rendermain.surfacemanager'
).defines(function(){
    a1.SurfaceManager = a1.Class.extend({
        surfData: {},
        polyLookup: [],
        surfaceBuffers: {},
        
        // A dictionary of indices to build index buffers
		// Each material gets a list of indices, which are then passed to the index buffer
        renderCache: {},
        
        // Clears the render cache in prep for rendering
        clearCache: function(){
            this.renderCache = {};            
        },
        
        // Called many times per frame, this function
        // takes a Marathon poly, looks up its surfaces
        // and adds indices to the rendercache
        registerPoly: function(index){
            if (this.polyLookup[index] === undefined){
                return;
            }
            var temp;            
            
            for(var i=0; i < this.polyLookup[index].length; i++){
                temp = this.polyLookup[index][i];
                // Get the index buffer info and add it to the cache
                
                if (this.renderCache[temp.matID] === undefined){
                    this.renderCache[temp.matID] = []; // Create the cache if needed
                }
                
                this.renderCache[temp.matID] = this.renderCache[temp.matID].concat(this.surfData[temp.matID].indices.slice(temp.offset, temp.offset+temp.length));
            }
        },

        
        // Populates the necessary data structures to render the level only once
        loadLevel: function(){
            this.surfData = {};
            this.polyLookup.length = 0;
            
            var polyCount = a1.mapData.getChunkEntryCount("POLY");
            var poly;
            
            // For each Poly
            for (var i = 0; i < polyCount; i++){
                this.polyLookup.push([]);
                // For each surface
                poly = a1.mapData.getChunkEntry(i, "POLY");
                
                this.loadFloor(poly, i);
                this.loadCeiling(poly, i);
                this.loadWalls(poly, i);
            }
            // Actually create our WebGL buffers
            $.each(this.surfData, this.buildBuffers);
            
            // Clean up
            a1.gl.bindBuffer(a1.gl.ARRAY_BUFFER, null);
        },
        
        // Each poly in Marathon has a 'sids' struct that contains
        // information relevant to rendering a side.
        // Within it are three texture coordinates:
        //    Primary - Texture for the wall, or if the wall is split
        //              texture for the upper half
        //    Secondary - Texture for the lower half of a split wall
        //    Transparent - Texture for the area between a split wall
        loadWalls: function(poly, polyId){
            var side;
            var sideID;
            var neighborID;
            var curSurfData;
            var matID;
            var zeroPoint;
            var endPt1;
            var line;
            var xOffset;
            var yOffset;
            var zeroPoint;
            
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
                    matID = side.pmat;
                    if (matID != -1){
                        zeroPoint = this.addVertSurface(matID, line, poly.floorHeight,poly.ceilingHeight,side.px, side.py,side.plite)
                        this.polyLookup[polyId].push({"matID":matID, "offset":zeroPoint, "length":6});
                    }
                    matID = side.smat;
                    if (matID != -1){
                        zeroPoint = this.addVertSurface(matID, line, poly.floorHeight,poly.ceilingHeight , side.sx, side.sy,side.slite);
                        this.polyLookup[polyId].push({"matID":matID, "offset":zeroPoint, "length":6});
                    }
                    matID = side.tmat;
                    if (matID != -1){
                        zeroPoint = this.addVertSurface(matID, line, poly.floorHeight,poly.ceilingHeight, side.tx, side.ty,side.tlite);
                        this.polyLookup[polyId].push({"matID":matID, "offset":zeroPoint, "length":6});
                    }
                }
                // If the ceilings of the adjacent polys are equal, use the primary material for the lower area
                else if (line.lAdjCei === poly.ceilingHeight){
                    matID = side.pmat;
                    if (matID != -1){
                        zeroPoint = this.addVertSurface(matID, line, poly.floorHeight, line.hAdjFlr, side.px, side.py,side.plite);
                        this.polyLookup[polyId].push({"matID":matID, "offset":zeroPoint, "length":6});
                    }
                    matID = side.tmat;
                    if (matID != -1){
                        zeroPoint = this.addVertSurface(matID, line, line.hAdjFlr,  line.lAdjCei, side.tx, side.ty,side.tlite);
                        this.polyLookup[polyId].push({"matID":matID, "offset":zeroPoint, "length":6});
                    }
                }
                // We have a split poly, render upper, lower, and transparent sides
                else{
                    matID = side.pmat;
                    if (matID != -1){
                        zeroPoint = this.addVertSurface(matID, line, line.lAdjCei, poly.ceilingHeight, side.px, side.py,side.plite);
                        this.polyLookup[polyId].push({"matID":matID, "offset":zeroPoint, "length":6});
                    }
                    matID = side.smat;
                    if (matID != -1){
                        zeroPoint = this.addVertSurface(matID, line, poly.floorHeight, line.hAdjFlr , side.sx, side.sy,side.slite);
                        this.polyLookup[polyId].push({"matID":matID, "offset":zeroPoint, "length":6});
                    }
                    matID = side.tmat;
                    if (matID != -1){
                        zeroPoint = this.addVertSurface(matID, line, line.hAdjFlr,  line.lAdjCei, side.tx, side.ty,side.tlite);
                        this.polyLookup[polyId].push({"matID":matID, "offset":zeroPoint, "length":6});
                    }
                }
            }
        },
        
        // Adds the information to the buffers render a vertical surface - ie, walls
        addVertSurface:function(matID, line, floor, ceiling, dx, dy, lite){
            this.ensureSurfData(matID);
                    
            var curSurfData = this.surfData[matID];
            
            zeroPoint = curSurfData.verts.length/3;
            
            // Append the data to the Pos, Tex, and Index arrays
            // Build the vertex buffers
            // Add the 4 points needed to render the wall
            endPt1 = a1.mapData.getChunkEntry(line.p0, "EPNT");
            endPt2 = a1.mapData.getChunkEntry(line.p1, "EPNT");
            
            xOffset =  dx/1024.0;
            yOffset = -dy/1024.0;
            // Upper Left
            curSurfData.verts.push(endPt1.vertx);
            curSurfData.verts.push(ceiling);
            curSurfData.verts.push(endPt1.verty);
            curSurfData.texCoords.push(xOffset);
            curSurfData.texCoords.push(1.0+yOffset);
            curSurfData.texCoords.push(lite);
            
            // Upper Right
            curSurfData.verts.push(endPt2.vertx);
            curSurfData.verts.push(ceiling);
            curSurfData.verts.push(endPt2.verty);
            curSurfData.texCoords.push(line.len/1024.0 + xOffset);
            curSurfData.texCoords.push(1.0+yOffset);
            curSurfData.texCoords.push(lite);
	    
            // Lower Right
            curSurfData.verts.push(endPt2.vertx);
            curSurfData.verts.push(floor);
            curSurfData.verts.push(endPt2.verty);
            curSurfData.texCoords.push(line.len/1024.0 + xOffset);
            curSurfData.texCoords.push(1.0-((ceiling-floor)/1024.0)+yOffset);
            curSurfData.texCoords.push(lite);
	    
            // Lower Left
            curSurfData.verts.push(endPt1.vertx);
            curSurfData.verts.push(floor);
            curSurfData.verts.push(endPt1.verty);
            curSurfData.texCoords.push(xOffset);
            curSurfData.texCoords.push(1.0-((ceiling-floor)/1024.0) + yOffset);
            curSurfData.texCoords.push(lite);
	    
            var offset = curSurfData.indices.length;
            var length = 0;
            // Build the index buffer
            for (j=2; j < 4; j++){
                curSurfData.indices.push(zeroPoint);
                curSurfData.indices.push(j + zeroPoint);
                curSurfData.indices.push(j -1 + zeroPoint);
            }
            return offset;
        },
        
        // Build the polygons for our floor
        // TODO: This shares a lot of code with loadCeiling
        //   condense it?
        loadFloor: function(poly, i){
            var curSurfData;
            var matID;
            var endPt;
            // Get the material
            matID = poly.floorTexture;
            
            // If we don't have arrays for that material, create them
            this.ensureSurfData(matID);
            
            curSurfData = this.surfData[matID];
            
            var zeroPoint = curSurfData.verts.length/3;
            
            // Append the data to the Pos, Tex, and Index arrays
            // Build the vertex buffers
            for(var j=0; j < poly.endpointIndices.length; j++){
                // Grab the endpoint coords
                endPt = a1.mapData.getChunkEntry(poly.endpointIndices[j], "EPNT");
                curSurfData.verts.push(endPt.vertx);
                curSurfData.verts.push(poly.floorHeight);
                curSurfData.verts.push(endPt.verty);
                
                // Marathon textures were 128x128px and 1024x1024 world units
                // WebGL Texture coordinates are 0<->1 We can effectively divide
                // the world pos by 1024 to get our texcoords
                // TODO: Handle x/y offset on textures                
                curSurfData.texCoords.push(endPt.verty/1024.0+poly.floorY);
                curSurfData.texCoords.push(-(endPt.vertx/1024.0-poly.floorX)+.5);
                curSurfData.texCoords.push(poly.floorLightIndex);
            }
            
            // We need to know how many points are in the index buffer
            // before we add any more to it so all our inserts are relative
            // to the 0th point in this polygon
            
            var offset = curSurfData.indices.length;
            var length = 0;
            // Build the index buffer
            for (j=2; j < poly.endpointIndices.length; j++){
                curSurfData.indices.push(zeroPoint);
                curSurfData.indices.push(j + zeroPoint);
                curSurfData.indices.push(j - 1 + zeroPoint);
                length+=3;
            }
            
            // Record the MaterialID, the offset in the index buffer,
            // and the length in the index buffer for quick lookups
            this.polyLookup[i].push({"matID":matID, "offset":offset, "length":length});
        },
        
        // Build the polygons for our ceiling
        loadCeiling: function(poly, i){
            var curSurfData;
            var matID;
            var endPt;
            // Get the material
            matID = poly.ceilingTexture;
            
            // If we don't have arrays for that material, create them
            this.ensureSurfData(matID);
            
            curSurfData = this.surfData[matID];
            
            var zeroPoint = curSurfData.verts.length/3;
            
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
            
            // We need to know how many points are in the index buffer
            // before we add any more to it so all our inserts are relative
            // to the 0th point in this polygon
            
            var offset = curSurfData.indices.length;
            var length = 0;
            // Build the index buffer (reversed windings from the floor)
            for (j=2; j < poly.endpointIndices.length; j++){
                curSurfData.indices.push(zeroPoint);
                curSurfData.indices.push(j - 1+ zeroPoint);
                curSurfData.indices.push(j + zeroPoint);
                length += 3;
            }
            
            // Record the MaterialID, the offset in the index buffer,
            // and the length in the index buffer for quick lookups
            this.polyLookup[i].push({"matID":matID, "offset":offset, "length":length});
        },
        
        // Ensures we have the proper data structures in place for each material id
        ensureSurfData: function(matID){
            if (this.surfData[matID] === undefined){
                this.surfData[matID] = {};
                this.surfData[matID].verts = [];
                this.surfData[matID].texCoords = [];
                this.surfData[matID].indices = [];
            }
        },
        
        // We create one index buffer, one texture buffer, and one position buffer per
        // material id (ie, texture id)
        buildBuffers: function(matID, data){
            // Create an object to store the buffers
            a1.SM.surfaceBuffers[matID] = {};
            
            // Create the position buffer
            a1.SM.surfaceBuffers[matID].posBuffer = a1.gl.createBuffer();
            a1.gl.bindBuffer(a1.gl.ARRAY_BUFFER, a1.SM.surfaceBuffers[matID].posBuffer);
            // Put our data in the position buffer
            a1.gl.bufferData(a1.gl.ARRAY_BUFFER, new Float32Array(this.verts), a1.gl.STATIC_DRAW);
            a1.SM.surfaceBuffers[matID].posBuffer.itemSize = 3;
            a1.SM.surfaceBuffers[matID].posBuffer.numItems = this.verts.length/3;
            
            // Create the texcoord buffer
            a1.SM.surfaceBuffers[matID].texBuffer = a1.gl.createBuffer();
            a1.gl.bindBuffer(a1.gl.ARRAY_BUFFER, a1.SM.surfaceBuffers[matID].texBuffer);
            
            // Fill the buffer
            a1.gl.bufferData(a1.gl.ARRAY_BUFFER, new Float32Array(this.texCoords), a1.gl.STATIC_DRAW);
            a1.SM.surfaceBuffers[matID].texBuffer.itemSize = 3;
            a1.SM.surfaceBuffers[matID].texBuffer.numItems = this.texCoords.length/3; // Same number of items
            
            a1.SM.surfaceBuffers[matID].idxBuffer = a1.gl.createBuffer();
            a1.gl.bindBuffer(a1.gl.ELEMENT_ARRAY_BUFFER, a1.SM.surfaceBuffers[matID].idxBuffer);
            a1.gl.bufferData(a1.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), a1.gl.STATIC_DRAW);
            a1.SM.surfaceBuffers[matID].idxBuffer.itemSize = 1;
            a1.SM.surfaceBuffers[matID].idxBuffer.numItems = this.indices.length;
        }
    });  
});
