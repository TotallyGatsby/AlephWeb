precision mediump float;
                        
varying vec3 vTextureCoord;  
varying float vIntensity;
uniform sampler2D uSampler;  
                             
vec4  col;                    
float alph;                  
int   src;                     
void main(void) {			 
    col = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
    alph = col.a;          
    col = vIntensity * col;
    col.a = alph;          
    gl_FragColor = col;    
    if (gl_FragColor.a <.5){
        discard;    
    }       
}