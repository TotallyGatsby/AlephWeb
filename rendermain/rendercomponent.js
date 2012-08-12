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
 
 rendercomponent.js - A small token object that serves as the interface 
  		between the renderer and objects in the game world.
 
*/

a1.segment(
	'rendermain.rendercomponent'
).defines(function(){
	a1.RenderComponent = function(){
		this.matId     = -1; // Material Id
		this.indices   = []; // Array of ints -- used to construct an index buffer
		// TODO: Maybe keep only one instance of the identity matrix around?
		this.transform = null; // Transformation matrix for the renderable

		this.draw      = function(){
			a1.shell.renderer.enqueueToken(this);
		};
	};
});