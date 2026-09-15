'use strict';
const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const state = {points: [], w: [0, 0], b: 0, next: 0, passes: 0, updates: 0, passUpdates: 0, last: -1, done: false, timer: null, worked: false, marginExample: false, lastStep: null};
const score = p => state.w[0] * p.x + state.w[1] * p.y + state.b;
const eta = () => Number($('rate').value);
const fmt = n => (Math.abs(n) < 0.0005 ? 0 : n).toFixed(3);
function node(tag, attrs, text, target = 'plot') {
  const el = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  if (text !== undefined) el.textContent = text;
  $(target).appendChild(el);
  return el;
}
const px = x => 300 + 260 * x;
const py = y => 300 - 260 * y;
function region(sign) {
  const corners = [{x:-1,y:-1},{x:1,y:-1},{x:1,y:1},{x:-1,y:1}];
  const output = [];
  for (let i=0;i<4;i++) {
    const a = corners[i], b = corners[(i+1)%4];
    const sa = sign * score(a), sb = sign * score(b);
    if (sa >= 0) output.push(a);
    if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) {
      const t = sa / (sa - sb);
      output.push({x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y)});
    }
  }
  return output.map(p => `${px(p.x)},${py(p.y)}`).join(' ');
}
function draw() {
  $('plot').replaceChildren();
  node('title',{},'Training data and current perceptron decision boundary');
  node('rect',{x:40,y:40,width:520,height:520,fill:'#fafcfb'});
  if (state.w.some(v=>v!==0) || state.b!==0) {
    node('polygon',{points:region(1),fill:'#e9f0ff'});
    node('polygon',{points:region(-1),fill:'#fff0e3'});
  }
  for (let v=-1;v<=1.01;v+=0.25) {
    const color = v===0 ? '#a1b2a8' : '#dce5df';
    node('line',{x1:px(v),y1:40,x2:px(v),y2:560,stroke:color});
    node('line',{x1:40,y1:py(v),x2:560,y2:py(v),stroke:color});
  }
  for (const v of [-1,-0.5,0,0.5,1]) {
    node('text',{x:px(v),y:580,'text-anchor':'middle',fill:'#52645f','font-size':12},v);
    node('text',{x:28,y:py(v)+4,'text-anchor':'end',fill:'#52645f','font-size':12},v);
  }
  node('text',{x:588,y:304,fill:'#52645f','font-size':15},'x₁');
  node('text',{x:294,y:22,fill:'#52645f','font-size':15},'x₂');
  const [w1,w2] = state.w;
  const pair = boundary(state.w,state.b);
  const previous = state.lastStep;
  const showUpdate = $('show-update').checked;
  if(showUpdate && previous && previous.changed) {
    const old = boundary(previous.w,previous.b);
    if(old) node('line',{x1:px(old[0].x),y1:py(old[0].y),x2:px(old[1].x),y2:py(old[1].y),stroke:'#84938c','stroke-width':2,'stroke-dasharray':'7 6'});
  }
  if(pair) node('line',{x1:px(pair[0].x),y1:py(pair[0].y),x2:px(pair[1].x),y2:py(pair[1].y),stroke:'#28463e','stroke-width':2.5});
  const norm = Math.hypot(w1,w2);
  if(norm && $('show-weight').checked) {
    let anchor=pair?{x:(pair[0].x+pair[1].x)/2,y:(pair[0].y+pair[1].y)/2}:{x:0,y:0};
    if(Math.abs(anchor.x+0.23*w1/norm)>0.95 || Math.abs(anchor.y+0.23*w2/norm)>0.95) anchor={x:0,y:0};
    arrow('plot',px(anchor.x),py(anchor.y),px(anchor.x+0.23*w1/norm),py(anchor.y+0.23*w2/norm),'#167b5a');
    node('text',{x:px(anchor.x+0.23*w1/norm)+9,y:py(anchor.y+0.23*w2/norm)-7,fill:'#167b5a','font-size':17,'font-weight':700},'w');
  }
  $('geometry-note').textContent = !norm ? 'w = 0: there is no oriented boundary or weight direction.' :
    `${pair?'Solid line = current boundary.':'The boundary is outside this view.'} ${$('show-weight').checked?'Green arrow = direction of increasing score, perpendicular to the boundary. ':''}${showUpdate && previous?.changed?'Dashed gray = boundary before the update, if visible.':''}`;
  if(state.marginExample) {
    const norm=Math.hypot(...state.w);
    const margin=norm?Math.min(...state.points.map(p=>p.label*score(p)))/norm:null;
    if(margin>0) {
      const p=state.points.reduce((a,b)=>a.label*score(a)<b.label*score(b)?a:b);
      const t=score(p)/(norm*norm);
      node('line',{x1:px(p.x),y1:py(p.y),x2:px(p.x-t*state.w[0]),y2:py(p.y-t*state.w[1]),stroke:'#28463e','stroke-width':4});
    }
  }
  state.points.forEach((p,i)=>{
    if(i===state.last) node('circle',{cx:px(p.x),cy:py(p.y),r:13,fill:'none',stroke:'#28463e','stroke-width':2});
    const attrs={fill:p.label===1?'#306dd2':'#c55c22',stroke:'white','stroke-width':2};
    if(p.label===1) node('circle',{...attrs,cx:px(p.x),cy:py(p.y),r:7});
    else node('rect',{...attrs,x:px(p.x)-7,y:py(p.y)-7,width:14,height:14,rx:1});
    node('text',{x:px(p.x)+(p.x>0? -18:18),y:py(p.y)+5,'text-anchor':p.x>0?'end':'start',fill:'#18302e','font-size':16,'font-weight':700},`P${p.id}`);
  });
  $('order').textContent = state.points.length ? 'Visit order: '+state.points.map(p=>`P${p.id}`).join(' → ') : '';
  $('shuffle').disabled=state.points.length<2;
  for(const [key,value] of [['w1',w1],['w2',w2],['b',state.b]]) {
    const control=$(`manual-${key}`), limit=Math.max(3,Math.ceil(Math.abs(value)));
    control.min=-limit;control.max=limit;control.value=value;
    $(`manual-${key}-value`).textContent=fmt(value);
  }
  $('weights').textContent=`w₁ = ${fmt(w1)}   w₂ = ${fmt(w2)}   b = ${fmt(state.b)}`;
  $('pass').textContent=state.passes+(state.next>0?1:0);
  $('updates').textContent=state.updates;
  $('accuracy').textContent=state.points.length?`${Math.round(100*state.points.filter(p=>p.label*score(p)>0).length/state.points.length)}%`:'—';
  $('step').disabled=!state.points.length || state.done;
  $('run').disabled=!state.points.length || state.done;
  $('run').textContent=state.timer===null?'Run':'Pause';
}
function pause() {if(state.timer!==null) clearInterval(state.timer);state.timer=null;}
function reset(initial = null) {
  pause();Object.assign(state,{w:initial?[...initial.w]:[0,0],b:initial?initial.b:0,next:0,passes:0,updates:0,passUpdates:0,last:-1,done:false,lastStep:null});
  $('status').textContent=state.points.length?`${state.points.length} points ready. Weights start at zero.`:'Add points to begin.';
  $('calculation-intro').textContent='Follow the displayed point order. Inspect the score before each update, then compare the resulting boundary.';
  $('calculation').textContent=`Start: w = (${fmt(state.w[0])}, ${fmt(state.w[1])}), b = ${fmt(state.b)}.\nPress Step one point to begin.`;
  $('previous-result').hidden=true;
  if(initial) $('status').textContent='Manual parameters set. Step or Run to train from here.';
  $('last').textContent='Press Step to inspect the first example.';draw();
}
function step() {
  if(!state.points.length || state.done) return;
  const i=state.next,p=state.points[i],margin=p.label*score(p);
  const before = {w:[...state.w], b:state.b}, oldScore=score(p), rate=eta();
  state.lastStep={...before, changed:margin<=0, delta:[rate*p.label*p.x,rate*p.label*p.y], db:rate*p.label, pointId:p.id};
  state.last=i;
  if(margin<=0) {
    state.w[0]+=eta()*p.label*p.x;state.w[1]+=eta()*p.label*p.y;state.b+=eta()*p.label;
    state.updates++;state.passUpdates++;
  }
  $('last').textContent=`Point P${p.id}: y = ${p.label>0?'+1':'−1'}, signed margin before update = ${fmt(margin)}. ${margin<=0?'Updated weights and bias.':'Correct side; no update.'}`;
  const number = n => String(Number(fmt(n)));
  const term = n => `(${number(n)})`;
  const lines = [
    `Pass ${state.passes+1} · Point P${p.id}: x = (${number(p.x)}, ${number(p.y)}), y = ${p.label>0?'+1':'−1'}, η = ${number(rate)}`,
    `Before: w = (${number(before.w[0])}, ${number(before.w[1])}), b = ${number(before.b)}`,
    '',
    `Score s = w₁x₁ + w₂x₂ + b`,
    `  = ${term(before.w[0])} × ${term(p.x)} + ${term(before.w[1])} × ${term(p.y)} + ${term(before.b)}`,
    `  = ${number(oldScore)}`,
    `y × s = ${term(p.label)} × ${term(oldScore)} = ${number(margin)}`,
    margin<=0?'y × s ≤ 0 → update (including a tie at zero).':'y × s > 0 → no update.',
    ''
  ];
  if(margin<=0) {
    lines.push(`w₁ ← ${term(before.w[0])} + ${term(rate)} × ${term(p.label)} × ${term(p.x)} = ${number(state.w[0])}`,
      `w₂ ← ${term(before.w[1])} + ${term(rate)} × ${term(p.label)} × ${term(p.y)} = ${number(state.w[1])}`,
      `b  ← ${term(before.b)} + ${term(rate)} × ${term(p.label)} = ${number(state.b)}`);
  } else lines.push('Keep the same weights and bias.');
  lines.push(`After: w = (${number(state.w[0])}, ${number(state.w[1])}), b = ${number(state.b)}`);
  $('calculation').textContent=lines.join('\n');
  state.next++;
  $('status').textContent=`Pass ${state.passes+1}: visited P${p.id} (${i+1} of ${state.points.length}).`;
  if(state.next===state.points.length) {
    state.passes++;state.next=0;
    if(state.passUpdates===0) {state.done=true;pause();$('status').textContent='Converged: a complete pass with no updates.';}
    else if(state.passes%100===0) {pause();$('status').textContent='Paused after 100 more passes. The data may not be linearly separable. Run to continue.';}
    state.passUpdates=0;
  }
  draw();
}
function add(x,y) {
  state.worked=false;state.marginExample=false;
  state.points.push({x,y,id:Math.max(0,...state.points.map(p=>p.id))+1,label:Number(document.querySelector('input[name="label"]:checked').value)});reset();
}
$('plot').addEventListener('click',event=>{
  const point=new DOMPoint(event.clientX,event.clientY).matrixTransform($('plot').getScreenCTM().inverse());
  const x=(point.x-300)/260,y=(300-point.y)/260;
  if(x>=-1 && x<=1 && y>=-1 && y<=1) add(x,y);
});
$('add-form').addEventListener('submit',event=>{event.preventDefault();add(Number($('input-x').value),Number($('input-y').value));});
$('step').addEventListener('click',()=>{pause();step();});
$('run').addEventListener('click',()=>{
  if(state.timer!==null) pause();
  else state.timer=setInterval(step,(state.worked || state.marginExample)?1800:700);
  draw();
});
$('reset').addEventListener('click',()=>reset());
$('clear').addEventListener('click',()=>{state.points=[];state.worked=false;state.marginExample=false;reset();});
$('rate').addEventListener('input',()=>{$('rate-value').textContent=eta();reset();});
function example(kind) {
  state.marginExample=kind==='margin';
  state.worked=kind==='worked';
  if(state.worked || state.marginExample) {$('rate').value='1';$('rate-value').textContent='1';}
  state.points=state.marginExample?
    [{x:0.72,y:0.72,label:1},{x:-0.72,y:-0.72,label:-1},{x:0.9,y:0.7,label:1},{x:-0.9,y:-0.7,label:-1},{x:0.7,y:0.9,label:1},{x:-0.7,y:-0.9,label:-1}]:state.worked?
    [{x:1,y:0,label:1},{x:0,y:1,label:-1},{x:-1,y:0,label:-1}]:kind==='xor'?
    [{x:-0.6,y:-0.6,label:1},{x:0.6,y:0.6,label:1},{x:-0.6,y:0.6,label:-1},{x:0.6,y:-0.6,label:-1}]:
    [{x:-0.75,y:-0.45,label:-1},{x:0.4,y:0.65,label:1},{x:-0.25,y:-0.65,label:-1},{x:0.75,y:0.2,label:1},{x:-0.6,y:0.1,label:-1},{x:0.1,y:0.45,label:1},{x:0.15,y:-0.7,label:-1},{x:0.65,y:0.75,label:1}];
  state.points.forEach((p,i)=>p.id=i+1);
  reset();
}
$('margin-example').addEventListener('click',()=>example('margin'));
$('worked').addEventListener('click',()=>example('worked'));
$('separable').addEventListener('click',()=>example('separable'));
$('xor').addEventListener('click',()=>example('xor'));
$('shuffle').addEventListener('click',shuffle);
for(const key of ['w1','w2','b']) $(`manual-${key}`).addEventListener('input',()=>{
  const next={w:[...state.w],b:state.b}, value=Number($(`manual-${key}`).value);
  if(key==='b') next.b=value; else next.w[key==='w1'?0:1]=value;
  reset(next);
});
for(const id of ['show-weight','show-update']) $(id).addEventListener('change',draw);
example('margin');

function boundary(w,b) {
  const points=[];
  for(const x of [-1,1]) if(w[1]!==0) {const y=-(w[0]*x+b)/w[1];if(y>=-1&&y<=1)points.push({x,y});}
  for(const y of [-1,1]) if(w[0]!==0) {const x=-(w[1]*y+b)/w[0];if(x>=-1&&x<=1)points.push({x,y});}
  let pair=null, longest=0;
  for(const a of points)for(const c of points){const d=(a.x-c.x)**2+(a.y-c.y)**2;if(d>longest){longest=d;pair=[a,c];}}
  return pair;
}
function arrow(target,x1,y1,x2,y2,color,dashed=false) {
  const dx=x2-x1,dy=y2-y1,length=Math.hypot(dx,dy);
  if(length<0.01) {node('circle',{cx:x1,cy:y1,r:3,fill:color},undefined,target);return;}
  node('line',{x1,y1,x2,y2,stroke:color,'stroke-width':3,...(dashed?{'stroke-dasharray':'6 4'}:{})},undefined,target);
  const ux=dx/length,uy=dy/length;
  node('polygon',{points:`${x2},${y2} ${x2-10*ux+4*uy},${y2-10*uy-4*ux} ${x2-10*ux-4*uy},${y2-10*uy+4*ux}`,fill:color},undefined,target);
}
function shuffle() {
  if(state.points.length<2)return;
  const oldOrder=state.points.map(p=>p.id).join(',');
  const norm=Math.hypot(...state.w);
  const margin=norm?Math.min(...state.points.map(p=>p.label*score(p)))/norm:null;
  const previous=`Before shuffle: w = (${fmt(state.w[0])}, ${fmt(state.w[1])}), b = ${fmt(state.b)}; signed margin ${margin===null?'undefined':fmt(margin)}${state.done?' (converged)':''}.`;
  for(let i=state.points.length-1;i>0;i--) {const j=Math.floor(Math.random()*(i+1));[state.points[i],state.points[j]]=[state.points[j],state.points[i]];}
  if(state.points.map(p=>p.id).join(',')===oldOrder)state.points.push(state.points.shift());
  reset();
  $('previous-result').textContent=previous;$('previous-result').hidden=false;
  $('status').textContent='Order shuffled; weights reset to zero. The points and their labels are unchanged.';
}
