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
 
 lightmanager.js - Manages the state transition and intensity for all lights
    on the surfaces of marathon maps
 
*/

a1.segment(
	'gameworld.lightmanager'
).requires(
    'gameworld.surfacelight'
).defines(function(){
    
    a1.LightManager = a1.Class.extend({
        lights:[],
        
        init:function(){
            // Create a light entry for every light in the map?
            // We lazy load them in getIntensity right now
        },
        
        // Enables or disables a light given an id
        toggle:function(id){
            this.lights[id].toggle();    
        },
        
        // Returns a the intensity of a light clamped to .15 to 1.0
        getIntensity:function(id){
            // Lazy load the requested light
            if (this.lights[id] === undefined){
                this.lights[id] = new a1.SurfaceLight(id);
            }
            
            // TODO: Once we can render a minimum light level around the player
            // we can remove the clamp of .15, and instead clamp to 0
            return Math.min(1.0, Math.max(this.lights[id].getIntensityNormal(), .15));
        },
        
        // Returns an array representing the intensities of all the lights
        getIntensityArray:function(){
            // TODO: Don't create an object every frame?   
            var retVal = [];
            for(var i=0; i < a1.mapData.getChunkEntryCount("LITE");i++){
                retVal.push(this.getIntensity(i));
            }
            return retVal;
        },
	
        // Updates all the lights on the map
        update: function(){
            for(var i = 0; i < a1.mapData.getChunkEntryCount("LITE");i++){
                // Lazy load the requested light
                if (this.lights[i]=== undefined)
                {
                    this.lights[i] = new a1.SurfaceLight(i);
                }
                this.lights[i].update();
            }
        }
    });
});