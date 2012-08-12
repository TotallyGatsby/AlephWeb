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
).requires(
    'gameworld.poly'
).defines(function(){
    a1.SurfaceManager = a1.Class.extend({
        // The raw data for the vertices/texcoords
        surfData: {},

        // List of a1.Poly objects (the static level geometry)
        polys: [],

        // Vertex and texcoord buffers for the surfaces in the game
        surfaceBuffers: {},
        
        // Draw all the surfaces
        draw: function(){
            for (var i = 0; i < this.polys.length; i++){
                this.polys[i].draw();
            }
        },

        // Load the level, creating all the needed poly objects
        loadLevel: function(){
            this.surfData = {};

            var polyCount = a1.mapData.getChunkEntryCount("POLY");
            var polyinfo;
            var poly;
            
            // For each Poly
            for (var i = 0; i < polyCount; i++){
                poly = new a1.Poly();
                polyinfo = a1.mapData.getChunkEntry(i, "POLY");
                poly.setup(polyinfo);

                
                this.polys.push(poly);
            }

            // Actually create our WebGL buffers
            $.each(this.surfData, this.buildBuffers);
            
            // Clean up
            a1.gl.bindBuffer(a1.gl.ARRAY_BUFFER, null);
        },
        

        // Ensures we have the proper data structures in place for each material id
        ensureSurfData: function(matId){
            if (this.surfData[matId] === undefined){
                this.surfData[matId] = {};
                this.surfData[matId].verts = [];
                this.surfData[matId].texCoords = [];
                this.surfData[matId].indices = [];
            }
        },

        // Gets a rendercomponent object and simultaneously manages the buffers
        getSurfaceToken: function(verts, texCoords, matId){
            var curSurfData;

            // If we don't have arrays for that material, create them
            this.ensureSurfData(matId);

            // Get the arrays for the vertices
            curSurfData = this.surfData[matId];
            
            // We need to know how many points are in the index buffer
            // before we add any more to it so all our inserts are relative
            // to the 0th point in this polygon
            var zeroPoint = curSurfData.verts.length/3;
            
            // Put our data into the buffers
            curSurfData.verts.push.apply(curSurfData.verts, verts);
            curSurfData.texCoords.push.apply(curSurfData.texCoords, texCoords);

            var offset = curSurfData.indices.length;
            var length = 0;

            // Render token
            var token = new a1.RenderComponent();
            token.matId = matId;

            // Build the index buffer
            for (var j=2; j < verts.length/3; j++){
                token.indices.push(zeroPoint);
                token.indices.push(j + zeroPoint);
                token.indices.push(j - 1 + zeroPoint);
                length += 3;
            }
            
            token.offset = zeroPoint;
            curSurfData.indices.push.apply(curSurfData.indices, token.indices);

            return token;
        },

        // We create one texture buffer, and one position buffer per
        // material id (ie, texture id)
        buildBuffers: function(matId, data){
            // Create an object to store the buffers
            a1.SM.surfaceBuffers[matId] = {};
            
            // Create the position buffer
            a1.SM.surfaceBuffers[matId].posBuffer = a1.gl.createBuffer();
            a1.gl.bindBuffer(a1.gl.ARRAY_BUFFER, a1.SM.surfaceBuffers[matId].posBuffer);
            // Put our data in the position buffer
            a1.gl.bufferData(a1.gl.ARRAY_BUFFER, new Float32Array(this.verts), a1.gl.STATIC_DRAW);
            a1.SM.surfaceBuffers[matId].posBuffer.itemSize = 3;
            a1.SM.surfaceBuffers[matId].posBuffer.numItems = this.verts.length/3;
            
            // Create the texcoord buffer
            a1.SM.surfaceBuffers[matId].texBuffer = a1.gl.createBuffer();
            a1.gl.bindBuffer(a1.gl.ARRAY_BUFFER, a1.SM.surfaceBuffers[matId].texBuffer);
            
            // Fill the buffer
            a1.gl.bufferData(a1.gl.ARRAY_BUFFER, new Float32Array(this.texCoords), a1.gl.STATIC_DRAW);
            a1.SM.surfaceBuffers[matId].texBuffer.itemSize = 3;
            a1.SM.surfaceBuffers[matId].texBuffer.numItems = this.texCoords.length/3; // Same number of items
        }
    });  
});
