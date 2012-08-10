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
 
 shell.js - Main Game Loop and entry point into the game
 
*/
a1.segment(
	'shell'
).requires(
    'gameworld.map',
    'gameworld.player',
    'gameworld.lightmanager',
    'renderother.overheadmap',
    'rendermain.texturemanager',
    'rendermain.renderer',
    'rendermain.surfacemanager'
).defines(function(){
a1.shell = {
    renderer: null,
    
    main: function(){
        console.log("Initialize app");
        console.log("main loop");
        this.initializeApplication();
    },
    
    initializeApplication: function() {
        // Initialize webgl and attach it to a1
        a1.startWebGL($("#alephCanvas")[0]);
        
        a1.TM = new a1.TextureManager();
        a1.mapData = new a1.Map();
        a1.mapData.loadMap("media/scenario/infinity/levels/0/level.json");
        
        a1.mapData.loadAllTextures();
        
        a1.SM = new a1.SurfaceManager();
        a1.SM.loadLevel();
        
        a1.LM = new a1.LightManager();

        this.renderer = new a1.Renderer();
       
        this.renderTick();
        this.tick();
    },
    
    // TODO: Eventually I'd like to separate rendering from the rest of the updating
    // but I only really pay token lip service to that here.
    renderTick:function(){
        requestAnimFrame(a1.shell.renderTick);
        a1.shell.renderer.render();
        a1.P.update();
    },
    
    tick: function(){
        window.setTimeout(a1.shell.tick, 1000/30);
        
        a1.LM.update();
    }
};
});