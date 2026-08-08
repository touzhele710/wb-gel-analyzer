/** Rotate an 8-bit image around its center without cropping.
 * Positive degrees rotate clockwise. Nearest-neighbor sampling avoids creating
 * interpolated gray values; uncovered pixels use the light-background value 255.
 */
export function rotateGray8(src,w,h,degrees){
  const rad=degrees*Math.PI/180;
  let c=Math.cos(rad),s=Math.sin(rad);
  if(Math.abs(c)<1e-12)c=0;
  if(Math.abs(s)<1e-12)s=0;
  const newW=Math.max(1,Math.ceil(Math.abs(w*c)+Math.abs(h*s)));
  const newH=Math.max(1,Math.ceil(Math.abs(w*s)+Math.abs(h*c)));
  const out=new Uint8ClampedArray(newW*newH);
  out.fill(255);
  const scx=(w-1)/2,scy=(h-1)/2,dcx=(newW-1)/2,dcy=(newH-1)/2;
  for(let y=0;y<newH;y++)for(let x=0;x<newW;x++){
    const dx=x-dcx,dy=y-dcy;
    const sx=Math.round(c*dx+s*dy+scx),sy=Math.round(-s*dx+c*dy+scy);
    if(sx>=0&&sx<w&&sy>=0&&sy<h)out[y*newW+x]=src[sy*w+sx];
  }
  return{pixels:out,width:newW,height:newH};
}
