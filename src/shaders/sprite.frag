varying mediump vec2 vTextureCoord;
  
uniform sampler2D uSampler;
uniform mediump vec2 uTextureDimensions;

void main(void) {
  highp vec2 coord =   vTextureCoord / uTextureDimensions;
  gl_FragColor = texture2D(uSampler, coord);
}