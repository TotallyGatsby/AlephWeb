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
 
 overheadmap.js - Rendering the (totally wicked) overhead map
 
*/

a1.segment(
	'renderother.overheadmap'
).defines(function(){
    // Configuration data passed to the
    // map renderer
    // TODO: Pull this out to a separate file? out entirely? Is this really needed?
    a1.OverheadMapData = a1.Class.extend({
        mode: 0,
        scale: 0,
        origin: {x:0, y:0},
        originPolyIndex: 0,
        halfWidth: 0,
        halfHeight: 0,
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        drawEverything: true
    });
    
    a1.OverheadMap = a1.Class.extend({
        // TODO: Move shaders out of this file into a separate one
        vertShaderStr: "attribute vec3 aVertexPosition; \n\
                                                        \n\
            uniform mat4 uMVMatrix;                     \n\
            uniform mat4 uPMatrix;                      \n\
                                                        \n\
            void main(void) {                           \n\
                gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n\
            }",
        
        fragShaderStr: "precision mediump float;        \n\
                                                        \n\
            uniform vec4 uColor;                        \n\
                                                        \n\
            void main(void) {                           \n\
                gl_FragColor = uColor;                  \n\
            }",
        program: null,
        uColorLoc:null,
        pMatrix: null,
        mvMatrix: null,
        idxBuffer:null,
        
        
        // Saved RGB value for rendering polys/lines
        savedColor: [0,0,0],
        
        // I'm sure there's a joke about pen size to be had here
        savedPenSize: 1,
        
        // Cached list of polygons to render
        polygonCache: [],
        
        // Cached list of lines to render
        lineCache:[],

        // TODO: Does ColorsEqual belong somewhere else? A utility?
        colorsEqual: function(color1, color2){
            if (color1[0] !== color2[0] ||
                color1[1] !== color2[1] ||
                color1[2] !== color2[2]){
                return false;
            }
            return true;
        },
        
        // Creates our shaders, buffers, program, and perspective matrix
        init: function(){
            var fragShader = a1.createShader(a1.gl.FRAGMENT_SHADER, this.fragShaderStr);
            var vertShader = a1.createShader(a1.gl.VERTEX_SHADER, this.vertShaderStr);
            
            this.program = a1.createProgram([fragShader, vertShader]);
            this.pMatrix = mat4.create();
            this.mvMatrix = mat4.create();
            this.idxBuffer = a1.gl.createBuffer();
            this.idxBuffer.itemSize = 1;
            
            mat4.perspective(45, a1.gl.viewportWidth/ a1.gl.viewportHeight, 100.0, 18000.0, this.pMatrix);
            
            a1.gl.useProgram(this.program);
            
            this.program.vertexPositionAttribute = a1.gl.getAttribLocation(this.program, "aVertexPosition");
            a1.gl.enableVertexAttribArray(this.program.vertexPositionAttribute);
            this.program.pMatrixUniform = a1.gl.getUniformLocation(this.program, "uPMatrix");
            this.program.mvMatrixUniform = a1.gl.getUniformLocation(this.program, "uMVMatrix");
            this.uColorLoc = a1.gl.getUniformLocation(this.program, "uColor");
        },
        
        beginOverall: function(){           
            // Don't erase the HUD
            // TODO: Or maybe the HUD could be rendered in a <div> on top of the canvas
            // yeah, that'd be pretty cool actually. Screw rendering the hud in WebGL
            //a1.gl.enable(a1.gl.SCISSOR_TEST);
            a1.gl.clearColor(0.0,0.0,0.0,1.0);
            a1.gl.clear(a1.gl.COLOR_BUFFER_BIT | a1.gl.DEPTH_BUFFER_BIT);
            //a1.gl.disable(a1.gl.SCISSOR_TEST);
            
            // Set variables for the overhead map
            a1.gl.disable(a1.gl.CULL_FACE);
            a1.gl.disable(a1.gl.DEPTH_TEST);
            a1.gl.disable(a1.gl.BLEND);
            a1.gl.lineWidth(1.0);
            
            a1.gl.useProgram(this.program);
            a1.gl.bindBuffer(a1.gl.ARRAY_BUFFER, a1.mapData.endpointVertexBuffer);

            // Establish our view
            a1.gl.viewport(0,0,a1.gl.viewportWidth, a1.gl.viewportHeight);
            
            mat4.identity(this.mvMatrix);
            // TODO: change the transformation matrix based on the player position and scale
            mat4.translate(this.mvMatrix, [-a1.P.position[0]*.23, a1.P.position[2]*.23, -15508.0]);
            
            // TODO: Magic scale numbers. Look good for now, needs to be cleaned up later
            mat4.scale(this.mvMatrix, [.23, -.23, .23]);
            
            
            a1.gl.uniformMatrix4fv(this.program.pMatrixUniform, false, this.pMatrix);
            a1.gl.uniformMatrix4fv(this.program.mvMatrixUniform, false, this.mvMatrix);            
        },
        
        endOverall: function(){
            // Reset the line width
            a1.gl.lineWidth(1.0);
        },
        
        beginPolygons: function(){  
            this.polygonCache.length = 0;
            this.savedColor[0] = -1;
        },
        
        endPolygons: function() {
            this.drawCachedPolygons();
        },
        
        drawPolygon: function(vertices, color){
            if (!this.colorsEqual(color, this.savedColor)){
                this.drawCachedPolygons();
                a1.gl.uniform4f(this.uColorLoc, color[0], color[1], color[2], 1.0);
                this.savedColor = color;
            }
            
            // Push our poly into the cache
            // uses polygon fans
            for (var i = 2; i < vertices.length; i++){                
                this.polygonCache.push(vertices[0]);
                this.polygonCache.push(vertices[i-1]);
                this.polygonCache.push(vertices[i]);
            }
        },
        
        drawCachedPolygons: function(){
            // Setup the index buffer
            a1.gl.bindBuffer(a1.gl.ELEMENT_ARRAY_BUFFER, this.idxBuffer);
            a1.gl.bufferData(a1.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.polygonCache), a1.gl.STATIC_DRAW);
            this.idxBuffer.numItems = this.polygonCache.length;
            
            // Setup the vertex buffer
            a1.gl.bindBuffer(a1.gl.ARRAY_BUFFER, a1.mapData.endpointVertexBuffer);
            a1.gl.vertexAttribPointer(this.program.vertexPositionAttribute, a1.mapData.endpointVertexBuffer.itemSize, a1.gl.FLOAT, false, 0, 0);        
            
            // Draw the elements and clear the cache
            a1.gl.drawElements(a1.gl.TRIANGLES, this.idxBuffer.numItems, a1.gl.UNSIGNED_SHORT, 0);
            a1.gl.bindBuffer(a1.gl.ARRAY_BUFFER, null);
            a1.gl.bindBuffer(a1.gl.ELEMENT_ARRAY_BUFFER, null);
            this.polygonCache.length = 0;
        },
        
        beginLines: function(){
            a1.gl.lineWidth(1.0);
        },
        
        drawLine: function(vertices, color, pensize){
            var colorsEqual = this.colorsEqual(color, this.savedColor);
            var pensizeEqual = (this.savedPenSize === pensize);
            
            if (!colorsEqual || !pensizeEqual){
                this.drawCachedLines();
                a1.gl.uniform4f(this.uColorLoc, color[0], color[1], color[2], 1.0);
                this.savedColor = color;
                a1.gl.lineWidth(pensize);
            }
            
            this.lineCache.push(vertices[0]);
            this.lineCache.push(vertices[1]);
        },
        
        endLines: function(){
            this.drawCachedLines();
        },
        
        drawCachedLines:function(){
            // Setup the index buffer
            a1.gl.bindBuffer(a1.gl.ELEMENT_ARRAY_BUFFER, this.idxBuffer);
            a1.gl.bufferData(a1.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.lineCache), a1.gl.STATIC_DRAW);
            this.idxBuffer.numItems = this.lineCache.length;
            
            // Setup the vertex buffer (uses the same points as polys)
            a1.gl.bindBuffer(a1.gl.ARRAY_BUFFER, a1.mapData.endpointVertexBuffer);
            a1.gl.vertexAttribPointer(this.program.vertexPositionAttribute, a1.mapData.endpointVertexBuffer.itemSize, a1.gl.FLOAT, false, 0, 0);        
            
            // DRAW!
            a1.gl.drawElements(a1.gl.LINES, this.idxBuffer.numItems, a1.gl.UNSIGNED_SHORT, 0);
            a1.gl.bindBuffer(a1.gl.ARRAY_BUFFER, null);
            this.lineCache.length = 0;
        },
        
        render: function(mapData){
            var origin = {x: mapData.origin.x, y:mapData.origin.y};
            var scale = mapData.scale;
            var location = {};
            var i, polyCount, polydata, lineCount, lineData;
            var color;
            
            this.beginOverall();
            
            // NOTE:
            // Alephone called transform_endpoints_for_overhead_map here
            // We do this with a transformation matrix (elminating the need
            // to store transformed x/y coords for every point)
            
            this.beginPolygons();
            
            polyCount = a1.mapData.getChunkEntryCount("POLY");
            // Shade all visible polygons
            for (i = 0; i < polyCount; i++){
                polydata = a1.mapData.getChunkEntry(i, "POLY");
                
                // TODO: Shade hidden platforms properly
                switch(polydata.type){
                    case a1.MapCfg.polygonType.platform: // TODO: Whoa, that's a long string of dots
                        color = a1.MapCfg.polygonColors.platform;
                        break;
                    default:
                        color = a1.MapCfg.polygonColors.plain;
                        break;
                }
                
                if (polydata.mediaIndex !== -1){
                    // TODO: Not all maps are sewage maps, derp.
                    // get the other colors depending on the map type
                    color = a1.MapCfg.polygonColors.sewage;
                }
                this.drawPolygon(polydata.endpointIndices, color);
            }
            
            this.endPolygons();
            
            
            // Begin our line drawing
            this.beginLines();
            lineCount = a1.mapData.getChunkEntryCount("LINS");
            
            for (i=0; i < lineCount; i++){
                lineData = a1.mapData.getChunkEntry(i, "LINS");
                // TODO: Skip drawing lines between polys with the same floor height
                this.drawLine([lineData.p0, lineData.p1], a1.MapCfg.lineColors.elevation, 1.0);
            }
            
            this.endLines();
        }
    });
});