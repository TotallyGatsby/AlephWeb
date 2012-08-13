precision mediump float;        
attribute vec3 aVertexPosition;             
attribute vec3 aTextureCoord;               
uniform   mat4 uMVMatrix;                     
uniform   mat4 uPMatrix;                      
uniform   mat4 objMatrix; 

varying vec3 vTextureCoord;                 
varying float vIntensity;                   
const   int NUM_SURFLIGHTS={0};               
uniform float uSurfLights[NUM_SURFLIGHTS];  
                                            
void main(void) {                           
    gl_Position = uPMatrix * uMVMatrix * objMatrix * vec4(aVertexPosition, 1.0);
    vTextureCoord = aTextureCoord;          

    vIntensity = uSurfLights[int(aTextureCoord.p + 0.1)];
}