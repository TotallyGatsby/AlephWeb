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
 
 platform.js - Control an individual platform or door
 
*/

a1.segment(
	'rendermain.platform'
).defines(function(){
    a1.Platform = a1.Class.extend({
        flags: 0,
        
		curFloorHeight: 0,
		
		curCeilingHeight: 0,
		
		update: function(){
			
		},
		
        // All the various flags a platform can have
        isInitiallyActive:function(){
            return (flags & 0x1) != 0;
        },
        
        isInitiallyExtended:function(){
            return (flags & (0x1 << 1)) != 0;
        },
        
        deactivatesAtEachLevel:function(){
            return (flags & (0x1 << 2)) != 0;
        },
        
        deactivatesAtInitialLevel:function(){
            return (flags & (0x1 << 3)) != 0;
        },
        
        activatesAdjacentPlatformsOnDeactivating:function(){
            return (flags & (0x1 << 4)) != 0;
        },
        
        extendsFloorToCeiling:function(){
            return (flags & (0x1 << 3)) != 0;
        },
        
        comesFromFloor:function(){
            return (flags & (0x1 << 6)) != 0;
        },
        
        comesFromCeiling:function(){
            return (flags & (0x1 << 7)) != 0;
        },
        
    });
    
});