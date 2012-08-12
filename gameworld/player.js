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
 
 player.js - Stores the player's state, handles input
 
*/

a1.segment(
	'gameworld.player'
).defines(function(){
    // The player doesn't do much yet
    a1.Player = a1.Class.extend({
        //TODO Move input gathering out of the player into a proper class
        curKeys: {},
        rotation: 0,
        position:[-888, 700, 6600],
        overheadMap: false,
        speed: 45,
		
        init: function(){
            $(document).keydown({player:this}, this.handleKeyDown);
            $(document).keyup({player:this}, this.handleKeyUp);
        },
        
        update: function(){
            if (this.curKeys.E === true){
                this.rotation += (3.14/3)/30;
            }
            if (this.curKeys.Q === true){
                this.rotation -= (3.14/3)/30;
            }
            if (this.curKeys.W === true){
                this.position[2] -= Math.cos(this.rotation)*this.speed;
                this.position[0] += Math.sin(this.rotation)*this.speed;
            }
            if (this.curKeys.S === true){
                this.position[2] -= Math.cos(this.rotation)*-this.speed;
                this.position[0] += Math.sin(this.rotation)*-this.speed;
            }
            if (this.curKeys.D === true){
                this.position[2] += Math.sin(this.rotation)*this.speed;
                this.position[0] += Math.cos(this.rotation)*this.speed;
            }
            if (this.curKeys.A === true){
                this.position[2] += Math.sin(this.rotation)*-this.speed;
                this.position[0] += Math.cos(this.rotation)*-this.speed;
            }
            if (this.curKeys.Z === true){
                this.position[1] += 30;
            }
            if (this.curKeys.C === true){
                this.position[1] -= 30;
            }
        },
        
        handleKeyDown:function(event){
            event.data.player.curKeys[String.fromCharCode(event.keyCode)] = true;
            if (String.fromCharCode(event.keyCode)==="M"){
                event.data.player.overheadMap = !event.data.player.overheadMap;
            }
            
            if(event.keyCode >= 48 && event.keyCode <= 57){
                a1.LM.toggle(event.keyCode-48+20);
            }
        },
        
        handleKeyUp:function(event){
            event.data.player.curKeys[String.fromCharCode(event.keyCode)] = false;
        }
    });
    
	// TODO: create the player on level load, rather than page load
	// Otherwise we're gonna have mega problems during multiplayer
    a1.P = new a1.Player();
});