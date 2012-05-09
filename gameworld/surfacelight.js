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
 
 surfacelight.js - Manages the state transition and intensity for a single
       light
 
*/
a1.segment(
	'gameworld.surfacelight'
).defines(function(){
   a1.SurfaceLight = a1.Class.extend({
        intensity: 0, // How bright the light is from 0-1
        id:-1, // The light's index in the LITE chunk
        lite: null, // the entry from the LITE chunk
        state: null, // activating, primary active, secondary active, becoming inactive, primary inactive, secondary inactive
        period: 0, // Amount of time the light should stay in this state
        ticksLeft: -1, // Remainig time in this state
        targetIntensity: 0,
        initialIntensity: 0,
        phase:0,
        active: false,
        
        init: function(id){
            this.id = id;
            this.lite = a1.mapData.getChunkEntry(id, "LITE");
            
            this.state = "pInact";
            if (this.lite.flags & 0x1){
                this.state = "pAct";
                this.active = true;
            }
            
            this.enterState();
            
			// TODO: This debug div is no longer needed now that lights render in the map
			// but it's kind of cool. Maybe it should live on in some debug output div?
            $('<div id="light'+this.id+'" class="meter">'+this.id+'</div>').appendTo('#lightdebug');
        },
        
        getIntensityNormal:function(){
            return Math.max(0, Math.min(1.0,this.intensity/0xFFFF));
        },
        
        enterState: function(){
            // Taken from AlephOne
            this.period = this.lite[this.state].period + Math.floor(Math.random()*0xFFFF)%(this.lite[this.state].deltaperiod+1);
            this.initialIntensity = this.intensity;
            this.targetIntensity = this.lite[this.state].intensity + Math.floor(Math.random()*0xFFFF)%(this.lite[this.state].deltaintensity+1);
            this.phase = 0;

            this.switchState();
        },
        
        activate: function(setActive){
            if (setActive === true){
                this.state = "bAct";
            }
            else{
                this.state = "bInact";
            }
            this.active = setActive;
            this.enterState();
        },
        
        toggle: function(){
            this.activate(!this.active);
        },
        
        switchState: function(){
            if (this.phase >= this.period){
                this.phase -= this.period;
                switch(this.state){
                    case "pAct":
                        this.state = "sAct";
                        break;
                    case "sAct":
                        this.state = "pAct";
                        break;
                    case "pInact":
                        this.state = "sInact";
                        break;
                    case "sInact":
                        this.state = "pInact";
                        break;
                    case "bAct":
                        this.state = "pAct";
                        break;
                    case "bInact":
                        this.state = "pInact";
                        break;
                    default:
                        break;
                }
                
                this.enterState();
            }
        },
        
        update: function(){
            this.phase += 1;
            
            if (this.lite[this.state].func === 0){
                this.intensity = this.targetIntensity;
            }
            else if (this.lite[this.state].func ===1){
                this.intensity = this.initialIntensity + ((this.targetIntensity-this.initialIntensity)*this.phase)/this.period;
            }
            else if (this.lite[this.state].func ===2){
                this.intensity = this.smoothLight;
            }
            else if (this.lite[this.state].func ===3){
                var smooth = this.smoothLight();
                var delta = this.targetIntensity - smooth;
                if (delta !== 0){
                    delta = Math.floor(Math.random()*0xFFFF)%delta;
                }
                this.intensity = smooth +  delta;               
            }
            
            // HTML UPDATE DEBUG JUNK
            var i = parseInt(256*this.getIntensityNormal());
            // Alter the light's intensity here
            $('#light'+this.id).css('background-color','rgb('+i+','+i+','+i+')');
            
            if (i<128){
                $('#light'+this.id).css('color','#FFFFFF');
            }
            else{
                $('#light'+this.id).css('color','#000000');
            }
            // END DEBUG            
            
            this.switchState();            
        },
        
        smoothLight: function(){
            return this.initialIntensity + .5*(this.targetIntensity-this.initialIntensity)*
                                        (Math.cos((this.phase/this.period)*3.14+3.14)+1);
        }
   });
});