/** Quantitation core. It deliberately has no DOM dependency. */
export function grayFromRgba(data) { const out=new Uint8ClampedArray(data.length/4); for(let i=0,j=0;i<data.length;i+=4,j++) out[j]=Math.round(.299*data[i]+.587*data[i+1]+.114*data[i+2]); return out; }

// Fast local bright-background estimate. This is NOT ImageJ's RollingBall; see README.
// The deque uses a moving head instead of Array.shift(), keeping this O(width*height)
// for high-resolution blot images.
export function approximateLightBackground(gray,w,h,radius=50){ const tmp=new Uint8ClampedArray(gray.length), out=new Uint8ClampedArray(gray.length); const span=radius*2+1;
  for(let y=0;y<h;y++){const q=new Int32Array(w+radius), valueAt=i=>gray[y*w+Math.min(i,w-1)];let head=0,tail=0;for(let x=0;x<w+radius;x++){const v=valueAt(x);while(head<tail&&q[head]<x-span+1)head++;while(head<tail&&valueAt(q[tail-1])<=v)tail--;q[tail++]=x;if(x>=radius)tmp[y*w+x-radius]=valueAt(q[head]);}}
  for(let x=0;x<w;x++){const q=new Int32Array(h+radius), valueAt=i=>tmp[Math.min(i,h-1)*w+x];let head=0,tail=0;for(let y=0;y<h+radius;y++){const v=valueAt(y);while(head<tail&&q[head]<y-span+1)head++;while(head<tail&&valueAt(q[tail-1])<=v)tail--;q[tail++]=y;if(y>=radius)out[(y-radius)*w+x]=valueAt(q[head]);}}
  const corrected=new Uint8ClampedArray(gray.length);for(let i=0;i<gray.length;i++)corrected[i]=Math.max(0,255-(out[i]-gray[i]));return corrected;
}
export function profile(gray,w,roi){ const r=normaliseRoi(roi,w,Math.floor(gray.length/w)), p=new Float64Array(r.w); for(let x=0;x<r.w;x++){let sum=0;for(let y=0;y<r.h;y++)sum+=255-gray[(r.y+y)*w+r.x+x];p[x]=sum/r.h;}return p; }
export function normaliseRoi(r,w,h){let x=Math.max(0,Math.round(r.x)),y=Math.max(0,Math.round(r.y)),rw=Math.max(2,Math.round(r.w)),rh=Math.max(2,Math.round(r.h));rw=Math.min(rw,w-x);rh=Math.min(rh,h-y);return{x,y,w:rw,h:rh};}
export function autoDividers(p,n){const len=p.length, centers=[];for(let i=0;i<n;i++){const lo=Math.floor(i*len/n),hi=Math.max(lo+1,Math.floor((i+1)*len/n));let best=lo,bv=-Infinity;for(let x=lo;x<hi;x++)if(p[x]>bv){bv=p[x];best=x;}centers.push(best);}const d=[0];for(let i=0;i<n-1;i++){let lo=Math.min(centers[i],centers[i+1]),hi=Math.max(centers[i],centers[i+1]),best=lo,bv=Infinity;for(let x=lo;x<=hi;x++)if(p[x]<bv){bv=p[x];best=x;}d.push(best);}d.push(len-1);return{centers,dividers:d};}

/** ImageJ GelAnalyzer default plot geometry (horizontal scale factor = 1). */
export function imageJPlotDimensions(profileLength){let plotWidth=profileLength;if(plotWidth<650)plotWidth=650;if(plotWidth>4*profileLength)plotWidth=4*profileLength;plotWidth=Math.max(2,Math.round(plotWidth));let plotHeight=Math.floor(plotWidth/2);if(plotHeight<250)plotHeight=250;return{plotWidth,plotHeight};}

/**
 * Raster-oriented ImageJ GelAnalyzer peak measurement.
 * The curve is first mapped to ImageJ's fixed plot grid. Pixel interiors are
 * counted between the rasterized curve and baseline, then perimeter/2 is added
 * as GelAnalyzer.PlotsCanvas does after a Wand selection.
 */
export function imageJPeakAreas(p,dividers){const {plotWidth,plotHeight}=imageJPlotDimensions(p.length),min=Math.min(...p),max=Math.max(...p),xScale=plotWidth/p.length,yScale=max===min?1:plotHeight/(max-min),curveY=new Int32Array(plotWidth);curveY.fill(-1);const points=[];for(let i=0;i<p.length;i++)points.push([Math.min(plotWidth-1,Math.floor(i*xScale+.5)),plotHeight-Math.floor((p[i]-min)*yScale+.5)]);const mark=(x,y)=>{if(x>=0&&x<plotWidth)curveY[x]=Math.max(curveY[x],Math.max(0,Math.min(plotHeight,y)));};for(let i=1;i<points.length;i++){let [x0,y0]=points[i-1], [x1,y1]=points[i],dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,err=dx+dy;for(;;){mark(x0,y0);if(x0===x1&&y0===y1)break;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx;}if(e2<=dx){err+=dx;y0+=sy;}}}let last=plotHeight;for(let x=0;x<plotWidth;x++){if(curveY[x]>=0)last=curveY[x];else curveY[x]=last;}last=curveY[plotWidth-1];for(let x=plotWidth-1;x>=0;x--){if(curveY[x]>=0)last=curveY[x];else curveY[x]=last;}const plotDividers=dividers.map((d,i)=>i===0?0:i===dividers.length-1?plotWidth-1:Math.max(1,Math.min(plotWidth-2,Math.floor(d*xScale+.5))));return plotDividers.slice(0,-1).map((left,k)=>{const right=plotDividers[k+1];let pixelCount=0;for(let x=left+1;x<right;x++)pixelCount+=Math.max(0,plotHeight-curveY[x]-1);let curveLength=0;for(let x=left;x<right;x++)curveLength+=Math.hypot(1,curveY[x+1]-curveY[x]);const perimeter=(right-left)+(plotHeight-curveY[left])+(plotHeight-curveY[right])+curveLength;const srcLeft=dividers[k],srcRight=dividers[k+1];return{area:pixelCount+perimeter/2,signal:p.slice(srcLeft,srcRight+1).reduce((s,v)=>s+v,0)};});}
// ImageJ's GelAnalyzer reports Wand pixelCount + perimeter/2. We calculate the
// corresponding closed curve geometry in plot-coordinate pixels (not intensity integral).
export function peakAreas(p,dividers,plotW,plotH){const min=Math.min(...p),max=Math.max(...p),scale=max===min?1:plotH/(max-min);return dividers.slice(0,-1).map((left,k)=>{const right=dividers[k+1], pts=[[left*plotW/(p.length-1),plotH]];for(let x=left;x<=right;x++)pts.push([x*plotW/(p.length-1),plotH-(p[x]-min)*scale]);pts.push([right*plotW/(p.length-1),plotH]);let a=0,per=0;for(let i=0;i<pts.length;i++){const q=pts[(i+1)%pts.length],z=pts[i];a+=z[0]*q[1]-q[0]*z[1];per+=Math.hypot(q[0]-z[0],q[1]-z[1]);}return {area:Math.abs(a)/2+per/2, signal: p.slice(left,right+1).reduce((s,v)=>s+v,0)};});}
