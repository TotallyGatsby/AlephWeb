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
 
 map.js - Loads map data from a json file representing the level
    and provides an inteface to get that data
 
*/
a1.segment(
    'gameworld.map'
).requires(
    'gameworld.mapconfig'
).defines(function(){
    a1.Map = a1.Class.extend({
        // TODO: This buffer belongs in overheadmap.js
        endpointVertexBuffer: null,
        overheadMapMode: null,
        data: null,

        loadMap: function(url){
            // Load the map synchronously
            $.ajax({async:false,context:this,url:url, dataType:'json', error: function(){this.loadError = true;}, success:this.onLoad});
        },
        
        // Returns an entry from a chunk, given an id
        getChunkEntry: function(i, chunk){
            return this.data.levels[0].chunks[chunk].entries[i];
        },
        
        // Returns the number of entries in a given chunk
        getChunkEntryCount: function(chunk){
            return this.data.levels[0].chunks[chunk].entries.length;
        },
        
        // Builds the overhead map vertex buffer
        // TODO: Doesn't this really belong in overheadmap.js?
        buildBuffers:function(){
            this.endpointVertexBuffer = a1.gl.createBuffer();
            var pointCount = this.getChunkEntryCount("EPNT");
            var verts = [];
            var point;
            
            for(var i=0; i < pointCount; i++){
                point = this.getChunkEntry(i, "EPNT");
                verts.push(point.vertx);
                verts.push(point.verty);
                verts.push(0.0);
            }
            
            a1.gl.bindBuffer(a1.gl.ARRAY_BUFFER, this.endpointVertexBuffer);
            a1.gl.bufferData(a1.gl.ARRAY_BUFFER, new Float32Array(verts), a1.gl.STATIC_DRAW);
            this.endpointVertexBuffer.itemSize = 3;
            this.endpointVertexBuffer.numItems = pointCount;
            a1.gl.bindBuffer(a1.gl.ARRAY_BUFFER, null);
        },
        
        onLoad: function(data){
            this.data = data;
            this.buildBuffers();
            this.overheadMapMode = a1.MapCfg.overheadMapMode.normal;
            this.loaded = true;        
        },
        
        // Loads all the textures from the polys/sides in a map
        // TODO: Is this method needed?
        loadAllTextures:function(){
            for(var i=0;i<a1.mapData.getChunkEntryCount("POLY");i++){
                a1.TM.loadTexture(this.getChunkEntry(i, "POLY").ceilingTexture);
                a1.TM.loadTexture(this.getChunkEntry(i, "POLY").floorTexture);
            }
        },
        
        resetOverheadMap:function(){
            switch (this.overheadMapMode)
            {
                case a1.MapCfg.overheadMapMode.currentlyVisible:
                    //TODO clear out the map
                    console.log("You've reached the point where rendering only the visible map is important, check out map.js some time. It feels lonely.");
                    break;
                case a1.MapCfg.overheadMapMode.all:
                    console.log("You told me you would render all the map. Instead I just get this console message from map.js");
                    break;
                default:
                    break;
            }
        }
    });
});