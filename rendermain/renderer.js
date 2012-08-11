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
 
 render.js - Renders the current game state. Should not alter game state,
        if it does, that's an issue that needs to be logged. Handles
        the roles of Rasterizer and render.cpp since we only need to
        support one platform (webgl) and not 7 hojillion
 
*/

a1.segment(
    'rendermain.renderer'
).requires(
    'rendermain.surfacemanager',
    'rendermain.rendercomponent',
    'renderother.overheadmap'
).defines(function(){      
    a1.Renderer = a1.Class.extend({
        // TODO: These shaders should probably be moved out to separate files
        // so we don't need to mess with multiline strings
        vertShaderStr: "vert",
        
        fragShaderStr: "frag",
        
        visPolys:[],
        prevPolyCount: -1,
        
        camPos: [0, 0, 0], 

        pMatrix: null, // projection matrix
        mvMatrix: null, // model-view matrix of the player's position/rotation
        overheadMap: null, // the overhead map renderer
        overheadMapData: null, 
        
        indexBuffer: null,
        indices: [],

        init:function(){
            // Load our shaders
            $.ajax({async: false,
                url:'media/shaders/main.vert', 
                success: this.loadShaders(this, "vertShaderStr")});
            $.ajax({async: false,
                url:'media/shaders/main.frag', 
                success: this.loadShaders(this, "fragShaderStr")});
            this.overheadMap = new a1.OverheadMap();
            this.overheadMapData = new a1.OverheadMapData();
        },
        
        // Closure to pass the correct variable to be replaced to
        // the jquery ajax call
        loadShaders: function(renderer, varName){
            return function(data){
                renderer[varName] = data;
            }
        },

        initBuffers: function(){
            this.indexBuffer = a1.gl.createBuffer();
	    
            // update the vert shader with the number of surface lights
            var shaderStr = this.vertShaderStr.replace("{0}", a1.mapData.getChunkEntryCount("LITE"));
            
            // Create our shaders and program
            var fragShader = a1.createShader(a1.gl.FRAGMENT_SHADER, this.fragShaderStr);
            var vertShader = a1.createShader(a1.gl.VERTEX_SHADER, shaderStr);
            this.program = a1.createProgram([fragShader, vertShader]);
            
            // create our matrices
            this.pMatrix = mat4.create();
            this.mvMatrix = mat4.create();
            
            // store our uniform locations
            this.program.pMatrixUniform = a1.gl.getUniformLocation(this.program, "uPMatrix");
            this.program.mvMatrixUniform = a1.gl.getUniformLocation(this.program, "uMVMatrix");
            this.program.samplerUniform = a1.gl.getUniformLocation(this.program, "uSampler");
            this.program.surfLightUniform = a1.gl.getUniformLocation(this.program, "uSurfLights");
            
            // Use the program we just built so we can get other addresses from it
            a1.gl.useProgram(this.program);
            
            // Store and enable our texture and vertex position attributes
            this.program.vertexPositionAttribute = a1.gl.getAttribLocation(this.program, "aVertexPosition");
            a1.gl.enableVertexAttribArray(this.program.vertexPositionAttribute);
            
            this.program.texCoordAttribute = a1.gl.getAttribLocation(this.program, "aTextureCoord");
            a1.gl.enableVertexAttribArray(this.program.texCoordAttribute);
            
            
            a1.gl.uniform1i(this.program.samplerUniform, 0);
            
            a1.gl.viewport(0,0,a1.gl.viewportWidth, a1.gl.viewportHeight);
            
            mat4.perspective(50, a1.gl.viewportWidth/ a1.gl.viewportHeight, 10, 100000.0, this.pMatrix);
            a1.gl.uniformMatrix4fv(this.program.pMatrixUniform, false, this.pMatrix);
            
            a1.gl.activeTexture(a1.gl.TEXTURE0);
            
            // TODO: The surface windings in surfacemanager.js could be rewritten in a way that allows us to enable
            // backface culling. But I need to do more research on how marathon renders transparent walls before I'd
            // be comfortable doing that
            a1.gl.disable(a1.gl.CULL_FACE); 
            //a1.gl.blendFunc(a1.gl.SRC_ALPHA, a1.gl.ONE);
        },
        
        /*
        // Renders the player's view
        // Simple! Right?
        // ... right? guys? Where'd everyone go?
        render:function(viewData){
            var i,j;
            var poly,endPt;
            
            if (this.indexBuffer == null){
                this.initBuffers();
            }
            
            // If you are bored, turn this off for bizarro Marathon!
            a1.gl.enable(a1.gl.DEPTH_TEST);
            
            // Clear the screen. I like red, cause it makes it obvious when I have
            // gaps in the level
            a1.gl.clearColor(0.6,0.0,0.0,1.0);
            a1.gl.clear(a1.gl.COLOR_BUFFER_BIT | a1.gl.DEPTH_BUFFER_BIT);

            // Establish our view
            mat4.identity(this.mvMatrix);
            
            this.camPos[0] = a1.P.position[0]*-1;
            this.camPos[1] = a1.P.position[1]*-1;
            this.camPos[2] = a1.P.position[2]*-1;
	                
            mat4.rotate(this.mvMatrix, a1.P.rotation, [0,1,0]);
            mat4.translate(this.mvMatrix, this.camPos);
            a1.gl.uniformMatrix4fv(this.program.mvMatrixUniform, false, this.mvMatrix);
            
            // Reset Overhead Map
            // NOTE: This doesn't do anything yet, but it will become more important later
            a1.mapData.resetOverheadMap();
    
            // Render terminal if active
            if (false)
            {
                // TODO
                // Render awesome terminal text
                // Maybe by displaying a <div> element above the canvas? No need
                // to render everything in WebGL if it makes more sense to render in
                // HTML
            }
            else
            {
                // Determine the visible polys
                // TODO: pull this out and create a subsetting function
                // Ideally determining the visible polys would be a function you could
                // redefine at runtime, so you could create your own debug views directly
                // in the console
                this.visPolys.length = 0;
                
                // RENDER ALL THE THINGS! (All polys rendered)
                for(i = 0; i < a1.mapData.getChunkEntryCount("POLY"); i++){
                    this.visPolys.push(i);                        
                }
                
                // Render the map if active
                if (a1.P.overheadMap){
                    this.overheadMap.render(this.overheadMapData);
                } else {
                    // Render the world if the map isn't active
                    a1.gl.useProgram(this.program);
                    
                    // Update the lighting information
                    a1.gl.uniform1fv(this.program.surfLightUniform, a1.LM.getIntensityArray());

                    // Clear the surface manager's cache
                    if (this.prevPolyCount != this.visPolys.length){
                        a1.SM.clearCache();
                    
                        // Register all the polygons we plan to draw
                        for(i=0; i < this.visPolys.length;i++){
                            a1.SM.registerPoly(this.visPolys[i]);
                        }
                    }
                    
                    this.prevPolyCount = this.visPolys.length;
                    
                    // Bind to the index buffer and texture0 for the frame
                    a1.gl.bindBuffer(a1.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
                    
                    var posBuffer, texBuffer;
                    // For each material in the rendercache
                    // fire off a call to draw elements
                    for (var matID in a1.SM.renderCache){
                        // Fetch references to the vertex and texture buffers for this material
                        posBuffer = a1.SM.surfaceBuffers[matID].posBuffer;
                        texBuffer = a1.SM.surfaceBuffers[matID].texBuffer;
                        
                        // Send the data to the video card
                        a1.gl.bindBuffer(a1.gl.ARRAY_BUFFER, posBuffer);
                        a1.gl.vertexAttribPointer(this.program.vertexPositionAttribute, posBuffer.itemSize, a1.gl.FLOAT, false, 0, 0);
                        a1.gl.bindBuffer(a1.gl.ARRAY_BUFFER, texBuffer);
                        a1.gl.vertexAttribPointer(this.program.texCoordAttribute, texBuffer.itemSize, a1.gl.FLOAT, false, 0, 0);
                        
                        a1.gl.bindTexture(a1.gl.TEXTURE_2D, a1.TM.loadTexture(matID));
                        
                        // Update the index buffer
                        a1.gl.bindBuffer(a1.gl.ELEMENT_ARRAY_BUFFER, a1.SM.surfaceBuffers[matID].idxBuffer);
                        
                        a1.gl.drawElements(a1.gl.TRIANGLES, a1.SM.surfaceBuffers[matID].idxBuffer.numItems, a1.gl.UNSIGNED_SHORT, 0);
                    }

                    // Cleanup
                    a1.gl.bindBuffer(a1.gl.ARRAY_BUFFER, null);
                    a1.gl.bindBuffer(a1.gl.ELEMENT_ARRAY_BUFFER, null);
                    // Determine objects in the view
                }
            }
        },
        */
        // Need two methods
        renderQueue: {}, // Key: matId, Value: list of tokens

        // First method takes a token and queues it
        // Need one queue per material. Each entry is a list of indices
        enqueueToken: function(token){
            if (this.renderQueue[token.matId] === undefined){
                this.renderQueue[token.matId] = [];
            }

            // Put out token on the queue
            // TODO: Optimize by perhaps sorting the tokens to limit the number of draw calls?
            this.renderQueue[token.matId].append(token);

            // For now, no merging of like buffers. (For example, a bunch of billboards)
        },

        setModelView: function(){
            mat4.identity(this.mvMatrix);
            
            this.camPos[0] = a1.P.position[0]*-1;
            this.camPos[1] = a1.P.position[1]*-1;
            this.camPos[2] = a1.P.position[2]*-1;
                    
            mat4.rotate(this.mvMatrix, a1.P.rotation, [0,1,0]);
            mat4.translate(this.mvMatrix, this.camPos);
            a1.gl.uniformMatrix4fv(this.program.mvMatrixUniform, false, this.mvMatrix);
        },

        // Second method renders all queues
        render: function(){
            var i,j;
            var poly,endPt;
            
            // If we don't have buffers, make em
            if (this.indexBuffer == null){
                this.initBuffers();
            }
            
            // If you are bored, turn this off for bizarro Marathon!
            a1.gl.enable(a1.gl.DEPTH_TEST);
            
            // Clear the screen. I like red, cause it makes it obvious when I have
            // gaps in the level
            a1.gl.clearColor(0.6,0.0,0.0,1.0);
            a1.gl.clear(a1.gl.COLOR_BUFFER_BIT | a1.gl.DEPTH_BUFFER_BIT);

            // Establish our view
            this.setModelView();
            
            // Reset Overhead Map
            // NOTE: This doesn't do anything yet, but it will become more important later
            // TODO: Doesn't belong in the render loop, 
            a1.mapData.resetOverheadMap();
    
            // Render terminal if active
            if (false)
            {
                // TODO
                // Render awesome terminal text
                // Maybe by displaying a <div> element above the canvas? No need
                // to render everything in WebGL if it makes more sense to render in
                // HTML
            }
            else
            {
                // Render the map if active
                if (a1.P.overheadMap){
                    this.overheadMap.render(this.overheadMapData);
                } else {
                    // Render the world if the map isn't active
                    a1.gl.useProgram(this.program);
                    
                    // Update the lighting information
                    a1.gl.uniform1fv(this.program.surfLightUniform, a1.LM.getIntensityArray());
                    
                    // Bind to the index buffer and texture0 for the frame
                    a1.gl.bindBuffer(a1.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
                    
                    var posBuffer, texBuffer;
                    // For each material in the rendercache
                    // fire off a call to draw elements
                    for (var matID in this.renderQueue){
                        // Fetch references to the vertex and texture buffers for this material
                        posBuffer = a1.SM.surfaceBuffers[matID].posBuffer;
                        texBuffer = a1.SM.surfaceBuffers[matID].texBuffer;
                        
                        // Bind the data in the video card
                        a1.gl.bindBuffer(a1.gl.ARRAY_BUFFER, posBuffer);
                        a1.gl.vertexAttribPointer(this.program.vertexPositionAttribute, posBuffer.itemSize, a1.gl.FLOAT, false, 0, 0);
                        a1.gl.bindBuffer(a1.gl.ARRAY_BUFFER, texBuffer);
                        a1.gl.vertexAttribPointer(this.program.texCoordAttribute, texBuffer.itemSize, a1.gl.FLOAT, false, 0, 0);
                        
                        // Bind the texture
                        a1.gl.bindTexture(a1.gl.TEXTURE_2D, a1.TM.loadTexture(matID));
                        
                        // Clear our list of indices
                        this.indices = [];
                        
                        // Iterate over our tokens to build the index buffer
                        for (var token in this.renderQueue[matID]){
                            this.indices.push.apply(this.indices, token.indices);
                        }

                        // Push the index buffer data to the card
                        a1.gl.bufferData(a1.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), a1.gl.DYNAMIC_DRAW);
                        this.indexBuffer.numItems = this.indices.length;

                        for (var token in this.renderQueue[matID]){
                            // Draw the triangles for this item
                            a1.gl.drawElements(a1.gl.TRIANGLES, token.indices.length, a1.gl.UNSIGNED_SHORT, token.offset);
                        }
                    }

                    // Cleanup
                    a1.gl.bindBuffer(a1.gl.ARRAY_BUFFER, null);
                    a1.gl.bindBuffer(a1.gl.ELEMENT_ARRAY_BUFFER, null);                    
                }
            }
        },

        getRenderToken: function(verts, texCoords, matId){
            var curSurfData;

            // If we don't have arrays for that material, create them
            a1.SM.ensureSurfData(matID);

            // Get the arrays for the vertices
            curSurfData = a1.SM.surfData[matID];
            
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
        }
    });
});