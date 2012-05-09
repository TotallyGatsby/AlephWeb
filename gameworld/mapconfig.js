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
 
 mapconfig.js - Contains all the configuration data for rendering the
        map
 
*/
a1.segment(
    'gameworld.mapconfig'
).defines(function(){
    a1.MapCfg = {
        polygonType: {
            normal:     0,
            itemImpassible:     1,
            monsterImpassible:  2,
            hill:       3,
            base:       4, // TODO, get the rest of the types
            platform:   5 // Taken from map.h line 644
        },
        
        //Polygon colors from overhead_map.cpp line 137
        polygonColors: { // AlephOne uses X/65536, WebGL uses 0<->1
            plain: [0.0, .1831, 0.0], // [0, 12000, 0]
            platform: [0.4578, 0.0, 0.0], // [30000, 0, 0]
            water: [0.0547, 0.1445, 0.2461], // [14*256, 37*256, 63*256]
            lava: [0.2969, 0.1055, 0.0], // [76*256, 27*256, 0]
            sewage: [0.2734, 0.3516, 0.0], // [70*256, 90*256, 0]
        },
        
        lineColors: {
            solid: [0.0, 1.0, 0.0], // [0, 65535, 0]
            elevation: [0.0, 0.6104, 0.0], // [0, 40000,0]
        },
        
        // How the map should render this pass
        overheadMapMode: {
            normal: 0, // cumulative 
            currentlyVisible: 1, // only show what the player can see
            all: 2 // The whole shebang
        }
    };
});