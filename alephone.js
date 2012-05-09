/*

    Copyright (C) AlephWeb developers -- github.com/Pfhreak/AlephWeb
    
    Portions of this code are based on the code:
	Copyright (C) 2011-2012 Impact Game Engine (http://impactjs.com/)
    used with permission. You should totally check them out though,
    pretty awesome work.
 
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
 
 alephone.js -- Handles establishing the namespaces for AlephWeb,
     portions lifted from the excellent Impact game engine. (http://impactjs.com/)
     Manages the loading of classes and their dependencies.
     
     Launches the shell.
 
*/

(function(window){

window.a1 = {
        // Global game variables
        version: '0',
        
        segments: {},
        cur: undefined,
        segmentQueue: [],
        
        domLoaded: false,
        waitingForDOMLoad: 0,
        
        copy: function( object ) {
            if(
               !object || typeof(object) != 'object' ||
               object instanceof HTMLElement ||
               object instanceof a1.Class
            ) {
                return object;
            }
            else if( object instanceof Array ) {
                var c = [];
                for( var i = 0, l = object.length; i < l; i++) {
                    c[i] = a1.copy(object[i]);
                }
                return c;
            }
            else {
                var c = {};
                for( var i in object ) {
                    c[i] = a1.copy(object[i]);
                }
                return c;
            }
        },
        
        // A logical division of code, usually 1:1 with files.
        segment: function( name ) {
            // Sanity check
            if( a1.cur ) {
                throw( "The segment '"+ig.cur.name+"' is empty" );
            }
            if( a1.segments[name] && a1.segments[name].body ) {
                throw( "The segment '"+name+"' already exists" );
            }
            
            // Create a entry in our segments object
            a1.cur = {name: name, requires: [], ready: false, body:null};
            a1.segments[name] = a1.cur;
            
            // Queue the segment for loading
            a1.segmentQueue.push(a1.cur);
            
            // Wait for the DOM to complete loading
            a1.waitForDOM();
            
            return a1;
        },
        
        // Indicates another JS file is required by this one
        requires: function() {
            a1.cur.requires = Array.prototype.slice.call(arguments);
            return a1;
        },
        
        // Executes the function passed as body (generally to load)
        defines: function( body ) {
            name = a1.cur.name;
            a1.cur.body = body;
            a1.cur = null;
            a1.runSegments();
        },
        
        // Sets up the wait for the DOM to complete before launching
        waitForDOM: function(){
            // If we've already entered before, we don't need to do this again
            if (a1.domLoaded){
                return;
            }
            
            a1.waitingForDOMLoad++;
            
            if (document.readyState === 'complete'){
                a1.onDOMReady();
            } else {
                document.addEventListener( 'DOMContentLoaded', a1.onDOMReady, false );
                window.addEventListener( 'load', a1.onDOMReady, false );
            }
        },
        
        // Function that waits for the DOM to complete and runs our segments
        onDOMReady: function(){
            if (!a1.domLoaded){
                if (!document.body){
                    return setTimeout( a1.onDOMReady, 7); // SEVEN IS DARKER
                }
                
                a1.domLoaded = true;
                a1.waitingForDOMLoad--;
                a1.runSegments();
            }
            
            return 0;
        },
        
        runSegments: function() {
            var segmentsAdded = false;
            var i = 0;
            var j = 0;
            
            for(i=0; i < a1.segmentQueue.length; i++){
                var seg = a1.segmentQueue[i];
                var loaded = true;
                
                for (j=0; j < seg.requires.length; j++){
                    var name = seg.requires[j];
                    // If there is a dependency that requires loading
                    if (!a1.segments[name]){
                        // Load it!
                        loaded = false;
                        a1.loadJS(name, seg.name);
                    } else if (!a1.segments[name].loaded){
                        // If we've identified a file to be loaded,
                        // but are still waiting
                        // make sure we continue waiting
                        loaded = false;
                    }
                }
                
                if (loaded && seg.body !== null) {
                    a1.segmentQueue.splice(i, 1);
                    seg.loaded = true;
                    seg.body();
                    segmentsAdded = true;
                    i--;
                }
            }
            
            // If we've added segments, rerun this method
            if ( segmentsAdded ) {
                a1.runSegments();
            } else if (a1.waitingForDOMLoad == 0 && a1.segmentQueue.length != 0){
                // Nothing was added, no more files, but more segments to load?
                // TODO: Capture more information about the unloaded files
                throw('Unresolved dependencies');
            }
        },
        
        // Loads another javascript file
        loadJS: function( name, requiredFrom ) {
            a1.segments[name] = {name: name, requires:[], loaded: false, body: null};
            a1.waitingForDOMLoad++;
            
            var path = name.replace(/\./g, '/')+ '.js';
            var script = document.createElement( 'script' );
            
            script.type = 'text/javascript';
            script.src = path;
            script.onload = function() {
                a1.waitingForDOMLoad--;
                a1.runSegments();
            }
            
            script.onerror = function() {
                throw(
                    'Failed to load module '+name+' at ' + path + ' ' +
                    'required from ' + requiredFrom
                );
            };
            document.getElementsByTagName( 'head' )[0].appendChild(script);
        },
    
        // WEBGL Loading and Utility functions
        startWebGL: function(canvas){
            try {
                a1.gl = canvas.getContext("experimental-webgl");
                a1.gl.viewportWidth = canvas.width;
                a1.gl.viewportHeight = canvas.height;
            }
            catch (e) {}
            
            if (!a1.gl){
                alert("Could not launch WebGL.");
            }
        },
        
        // Creates a WebGL shader given the type and a string containing the shader
        createShader: function(shaderType, strShaderFile)
        {
            var shader = a1.gl.createShader(shaderType);
    
            a1.gl.shaderSource(shader, strShaderFile);
    
            a1.gl.compileShader(shader);
    
            // In WebGL, replaces GlGetShaderiv
            var status = a1.gl.getShaderParameter(shader, a1.gl.COMPILE_STATUS);
    
            if (status == false){
                var infolog = a1.gl.getShaderInfoLog(shader);
    
                var strShaderType = "";
    
                switch(shaderType){
                    case a1.gl.VERTEX_SHADER: strShaderType = "vertex"; break;
                    case a1.gl.GEOMETRY_SHADER: strShaderType = "geometry"; break;
                    case a1.gl.FRAGMENT_SHADER: strShaderType = "fragment"; break;
                }
    
                console.error("Compile failure in " + strShaderType + ": " + infolog);
            }
    
            return shader;
        },
        // Create a WebGL program, given a list of shaders
        createProgram: function(shaderList)
        {
            var program = a1.gl.createProgram();
    
            for (var i = 0; i < shaderList.length; i++){
                a1.gl.attachShader(program, shaderList[i]);
            }
    
            a1.gl.linkProgram(program);
    
            var status = a1.gl.getProgramParameter(program, a1.gl.LINK_STATUS);
    
            if (status == false){
                var infolog = a1.gl.getProgramInfoLog(program);
    
                console.error("Linker failure: " + infolog);
            }
    
            return program;
        }
    };
    
    // -----------------------------------------------------------------------------
    // Class object based on John Resigs code; inspired by base2 and Prototype
    // http://ejohn.org/blog/simple-javascript-inheritance/
    
    var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\bparent\b/ : /.*/;

    window.a1.Class = function(){};
        var inject = function(prop) {	
            var proto = this.prototype;
            var parent = {};
            for( var name in prop ) {		
                if( 
                    typeof(prop[name]) == "function" &&
                    typeof(proto[name]) == "function" && 
                    fnTest.test(prop[name])
                ) {
                    parent[name] = proto[name]; // save original function
                    proto[name] = (function(name, fn){
                        return function() {
                            var tmp = this.parent;
                            this.parent = parent[name];
                            var ret = fn.apply(this, arguments);			 
                            this.parent = tmp;
                            return ret;
                        };
                    })( name, prop[name] );
                }
                else {
                    proto[name] = prop[name];
                }
            }
        };

    window.a1.Class.extend = function(prop) {
        var parent = this.prototype;
     
        initializing = true;
        var prototype = new this();
        initializing = false;
     
        for( var name in prop ) {
            if( 
                typeof(prop[name]) == "function" &&
                typeof(parent[name]) == "function" && 
                fnTest.test(prop[name])
            ) {
                prototype[name] = (function(name, fn){
                    return function() {
                        var tmp = this.parent;
                        this.parent = parent[name];
                        var ret = fn.apply(this, arguments);			 
                        this.parent = tmp;
                        return ret;
                    };
                })( name, prop[name] );
            }
            else {
                prototype[name] = prop[name];
            }
        }
     
        function Class() {
            if( !initializing ) {
                
                // If this class has a staticInstantiate method, invoke it
                // and check if we got something back. If not, the normal
                // constructor (init) is called.
                if( this.staticInstantiate ) {
                    var obj = this.staticInstantiate.apply(this, arguments);
                    if( obj ) {
                        return obj;
                    }
                }
                for( var p in this ) {
                    if( typeof(this[p]) == 'object' ) {
                        this[p] = a1.copy(this[p]); // deep copy!
                    }
                }
                if( this.init ) {
                    this.init.apply(this, arguments);
                }
            }
            return this;
        }
        
        Class.prototype = prototype;
        Class.constructor = Class;
        Class.extend = arguments.callee;
        Class.inject = inject;
        
        return Class;
    };
    /**
    * Provides requestAnimationFrame in a cross browser way.
    */
    window.requestAnimFrame = (function() {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
              window.setTimeout(callback, 1000/60);
            };
    })();
})(window);

// Load the shell
a1.segment(
	'alephone'
).requires(
    'shell'
).defines(function(){
    a1.shell.main();
});