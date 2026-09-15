'use strict';
const $=id=>document.getElementById(id), L=Logistic;
const state={t:[0,0,0],points:[],probe:{x:.5,y:0,label:1},selected:null,steps:0,timer:null,history:[],last:null,panel:'sigmoid',kind:'worked',runSteps:0};
const fmt=n=>n===null?'—':!Number.isFinite(n)?'∞':Math.abs(n)>1e6?n.toExponential(2):(Math.abs(n)<.00005?0:n).toFixed(4);
const vec=v=>'('+v.map(fmt).join(', ')+')';
const rate=()=>Number($('rate').value);
function svg(id,tag,attrs={},text){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;$(id).appendChild(el);return el;}
const px=x=>300+260*x,py=y=>300-260*y;
function boundary(t){
 const [a,b,c]=t,points=[];
 for(const x of [-1,1])if(b){const y=-(a*x+c)/b;if(y>=-1&&y<=1)points.push({x,y});}
 for(const y of [-1,1])if(a){const x=-(b*y+c)/a;if(x>=-1&&x<=1)points.push({x,y});}
 let result=null,d=0;for(const p of points)for(const q of points){const n=(p.x-q.x)**2+(p.y-q.y)**2;if(n>d){d=n;result=[p,q];}}return result;
}
function inspected(){return state.points.find(p=>p.id===state.selected)||{...state.probe,label:Number($('probe-label').value)};}
function shade(p){const base=[250,251,248],end=p<.5?[233,167,126]:[129,171,233],a=Math.abs(p-.5)*2;return 'rgb('+base.map((v,i)=>Math.round(v+(end[i]-v)*a)).join(',')+')';}
function drawPlot(){
 $('plot').replaceChildren();svg('plot','title',{},'Logistic regression probabilities and training points');
 // A sampled probability field, overlaid with an exact linear decision boundary.
 const cells=36,cell=520/cells,hard=$('hard').checked;
 for(let i=0;i<cells;i++)for(let j=0;j<cells;j++){
  const p={x:-1+(i+.5)*2/cells,y:1-(j+.5)*2/cells},z=L.score(state.t,p);
  svg('plot','rect',{x:40+i*cell,y:40+j*cell,width:cell+.2,height:cell+.2,fill:shade(hard?(z>0?1:0):L.sigmoid(z))});
 }
 for(let i=-4;i<=4;i++){const v=i/4;svg('plot','line',{x1:px(v),y1:40,x2:px(v),y2:560,stroke:v===0?'#b2beb5':'#e0e7df','stroke-opacity':.65});svg('plot','line',{x1:40,y1:py(v),x2:560,y2:py(v),stroke:v===0?'#b2beb5':'#e0e7df','stroke-opacity':.65});}
 for(const v of [-1,-.5,0,.5,1]){svg('plot','text',{x:px(v),y:580,'text-anchor':'middle',fill:'#52645f','font-size':12},v);svg('plot','text',{x:28,y:py(v)+4,'text-anchor':'end',fill:'#52645f','font-size':12},v);}
 svg('plot','text',{x:577,y:304,fill:'#52645f','font-size':15},'x₁');svg('plot','text',{x:295,y:22,fill:'#52645f','font-size':15},'x₂');
 const pair=boundary(state.t),norm=Math.hypot(state.t[0],state.t[1]);
 if(pair)svg('plot','line',{x1:px(pair[0].x),y1:py(pair[0].y),x2:px(pair[1].x),y2:py(pair[1].y),stroke:'#28463e','stroke-width':2.5});
 if(norm&&$('normal').checked){const dx=state.t[0]/norm,dy=state.t[1]/norm;let a=pair?{x:(pair[0].x+pair[1].x)/2,y:(pair[0].y+pair[1].y)/2}:{x:0,y:0};if(Math.abs(a.x+.22*dx)>.95||Math.abs(a.y+.22*dy)>.95)a={x:0,y:0};const x=px(a.x+.22*dx),y=py(a.y+.22*dy);svg('plot','line',{x1:px(a.x),y1:py(a.y),x2:x,y2:y,stroke:'#167b5a','stroke-width':3});svg('plot','polygon',{points:`${x},${y} ${x-10*dx+4*dy},${y+10*dy+4*dx} ${x-10*dx-4*dy},${y+10*dy-4*dx}`,fill:'#167b5a'});svg('plot','text',{x:x+8,y:y-7,fill:'#167b5a','font-size':16},'w');}
 const chosen=inspected();svg('plot','circle',{cx:px(chosen.x),cy:py(chosen.y),r:13,fill:'none',stroke:'#28463e','stroke-width':2});
 for(const p of state.points){const attrs={fill:p.label===1?'#306dd2':'#c55c22',stroke:'white','stroke-width':2};if(p.label===1)svg('plot','circle',{...attrs,cx:px(p.x),cy:py(p.y),r:7});else svg('plot','rect',{...attrs,x:px(p.x)-7,y:py(p.y)-7,width:14,height:14,rx:1});}
 const base=hard?'Background shows predicted labels.':'Background shows P(y = 1 | x).';
 $('plot-note').textContent=base+' '+(!norm?`w = 0: every location has p = ${fmt(L.sigmoid(state.t[2]))}; there is no oriented boundary.`:pair?'Dark line: p = 0.5. Axes run from −1 to 1.':'The p = 0.5 boundary is outside this view.')+($('normal').checked?' The arrow shows the direction of w at a fixed display length.':'');
}
function chart(id,xmin,xmax,ymin,ymax,xlabel,ylabel,width=560,height=240){
 $(id).replaceChildren();const left=52,right=width-20,top=20,bottom=height-40;
 const x=v=>left+(v-xmin)/(xmax-xmin)*(right-left),y=v=>bottom-(v-ymin)/(ymax-ymin)*(bottom-top);
 for(let i=0;i<=4;i++){const v=ymin+i*(ymax-ymin)/4;svg(id,'line',{x1:left,y1:y(v),x2:right,y2:y(v),stroke:'#e0e7df'});svg(id,'text',{x:left-8,y:y(v)+4,'text-anchor':'end','font-size':11,fill:'#52645f'},Number(v.toFixed(2)));}
 for(let i=0;i<=4;i++){const v=xmin+i*(xmax-xmin)/4;svg(id,'text',{x:x(v),y:bottom+17,'text-anchor':'middle','font-size':11,fill:'#52645f'},Number(v.toFixed(2)));}
 svg(id,'text',{x:(left+right)/2,y:height-4,'text-anchor':'middle','font-size':12,fill:'#52645f'},xlabel);svg(id,'text',{x:left,y:12,'font-size':12,fill:'#52645f'},ylabel);
 return {x,y,line:(values,color,dash=false)=>svg(id,'polyline',{points:values.map(p=>x(p[0])+','+y(Math.max(ymin,Math.min(ymax,p[1])))).join(' '),fill:'none',stroke:color,'stroke-width':2.5,...(dash?{'stroke-dasharray':'6 5'}:{})}),dot:(a,b,color='#234b3d')=>svg(id,'circle',{cx:x(a),cy:y(b),r:5,fill:color,stroke:'white','stroke-width':1.5})};
}
function drawSigmoid(){
 const p=inspected(),z=L.score(state.t,p),norm=Math.hypot(state.t[0],state.t[1]),distance=$('sigmoid-axis').value==='distance';
 if(distance&&!norm){$('sigmoid-chart').replaceChildren();$('sigmoid-note').textContent='Set a nonzero weight to define a boundary and a signed distance. At zero weights, distance is undefined.';return;}
 const position=distance?z/norm:z,extent=Math.max(distance?2:6,Math.abs(position)*1.1),c=chart('sigmoid-chart',-extent,extent,0,1,distance?'Signed distance d':'Score z','p');
 const points=Array.from({length:201},(_,i)=>{const x=-extent+2*extent*i/200;return [x,L.sigmoid(distance?norm*x:x)];});c.line(points,'#236958');
 if($('threshold-curve').checked)c.line([[-extent,0],[0,0],[0,1],[extent,1]],'#758a7e',true);
 c.dot(position,L.sigmoid(z));
 $('sigmoid-note').textContent=distance?`p = sigmoid(‖w‖d), with ‖w‖ = ${fmt(norm)}. Scaling the parameters steepens this curve without moving the boundary.`:`The dot is your inspected point: z = ${fmt(z)}, p = ${fmt(L.sigmoid(z))}. The sigmoid function itself stays fixed; changing weights moves the point along it.`;
}
function drawLoss(){
 const p=Number($('loss-p').value),eta=Number($('true-prob').value);$('loss-p-value').textContent=p.toFixed(2);$('true-value').textContent=eta.toFixed(2);
 $('loss-values').textContent=`y = 1: −log(p) = ${fmt(L.crossEntropy(p,1))}\ny = 0: −log(1−p) = ${fmt(L.crossEntropy(p,0))}`;
 const c=chart('loss-chart',0,1,0,5,'Predicted probability p','Loss (nats)');
 for(const [f,color] of [[x=>L.crossEntropy(x,1),'#306dd2'],[x=>L.crossEntropy(x,0),'#c55c22'],[x=>L.expectedLoss(x,eta),'#236958']]){c.line(Array.from({length:201},(_,i)=>[i/200,f(i/200)]),color);const value=f(p);if(value<=5)c.dot(p,value,color);}
 $('expected-value').textContent=`Blue: y = 1. Orange: y = 0. Green: expected loss at η = ${eta.toFixed(2)}. At p = ${p.toFixed(2)}, expected loss is ${fmt(L.expectedLoss(p,eta))}; minimized at p = ${eta.toFixed(2)}. Curves above 5 nats are clipped; impossible observed outcomes have infinite loss.`;
 const e=L.evaluate(state.t,state.points);$('likelihood').textContent=state.points.length?`Current dataset: n = ${state.points.length}; log likelihood = ${fmt(-state.points.length*e.loss)}; mean loss = ${fmt(e.loss)}.`:'Add points to evaluate the dataset likelihood.';
}
function drawGradient(){
 const last=state.last;$('gradient-rows').replaceChildren();
 if(!last){$('gradient-calculation').textContent='Press Step to record one full-batch update.';return;}
 const rows=last.before.rows,g=last.before.gradient;
 $('gradient-calculation').textContent=`Before: (w₁, w₂, b) = ${vec(last.t)}\nα = ${fmt(last.rate)}, n = ${rows.length}\n\nMean gradient = (1/n) Σᵢ (pᵢ−yᵢ)(xᵢ₁, xᵢ₂, 1)\n              = ${vec(g)}\n\nw₁ ← ${fmt(last.t[0])} − ${fmt(last.rate)} × (${fmt(g[0])}) = ${fmt(last.next[0])}\nw₂ ← ${fmt(last.t[1])} − ${fmt(last.rate)} × (${fmt(g[1])}) = ${fmt(last.next[1])}\nb  ← ${fmt(last.t[2])} − ${fmt(last.rate)} × (${fmt(g[2])}) = ${fmt(last.next[2])}\n\nMean loss: ${fmt(last.before.loss)} → ${fmt(last.afterLoss)}`;
 rows.forEach((r,i)=>{const tr=document.createElement('tr');for(const text of ['P'+state.points[i].id,state.points[i].label,fmt(r.prob),fmt(r.error),...r.g.map(fmt)]){const td=document.createElement('td');td.textContent=text;tr.appendChild(td);}$('gradient-rows').appendChild(tr);});
}
function drawConvex(){
 if(!state.points.length){$('convex-chart').replaceChildren();$('convex-note').textContent='Add training points to see their mean loss.';return;}
 const axis=Number($('slice-axis').value),value=state.t[axis],span=Math.max(4,Math.abs(value)*.2),lo=value-span,hi=value+span;
 const values=Array.from({length:81},(_,i)=>{const v=lo+(hi-lo)*i/80,t=[...state.t];t[axis]=v;return [v,L.evaluate(t,state.points).loss];});
 const max=Math.max(.01,...values.map(v=>v[1]))*1.12,c=chart('convex-chart',lo,hi,0,max,['w₁','w₂','b'][axis],'Mean loss');
 c.line(values,'#236958');c.line([values[0],values[80]],'#89978e',true);const current=L.evaluate(state.t,state.points);c.dot(value,current.loss);
 $('convex-note').textContent=`The loss curve lies below the dashed chord. At the current parameters: derivative = ${fmt(current.gradient[axis])}, curvature = ${fmt(current.hessian[axis][axis])} ≥ 0. This is a one-parameter slice, not the entire loss surface.`;
}
function drawHistory(){
 if(!state.history.length){$('history-chart').replaceChildren();return;}
 const data=state.history,top=Math.max(.01,...data.map(p=>p[1]))*1.1,c=chart('history-chart',0,Math.max(1,data.at(-1)[0]),0,top,'Training step','Loss',350,125);c.line(data,'#236958');c.dot(...data.at(-1));
}
function drawInspect(){
 const p=inspected(),r=L.evaluate(state.t,[p]).rows[0],title=state.selected===null?'Probe':'P'+state.selected;
 $('inspect-values').textContent=`${title}: x = (${fmt(p.x)}, ${fmt(p.y)}), y = ${p.label}\nz = ${fmt(r.z)}\np = ${fmt(r.prob)} → predict ${r.z>0?1:0}\nCross-entropy = ${fmt(r.loss)}`;
 const odds=r.z>700?'exp('+fmt(r.z)+')':fmt(Math.exp(r.z));
 $('inspect-detail').textContent=`z = (${fmt(state.t[0])})(${fmt(p.x)}) + (${fmt(state.t[1])})(${fmt(p.y)}) + (${fmt(state.t[2])})\n  = ${fmt(r.z)}\nLog-odds log(p/(1−p)) = z\nOdds = exp(z) = ${odds}\np − y = ${fmt(r.error)}\n∇ℓ = (p−y)(x₁, x₂, 1)\n   = ${vec(r.g)}`;
 $('remove-point').disabled=state.selected===null;$('probe-label-control').hidden=state.selected!==null;$('inspect-point').value=state.selected===null?'probe':String(state.selected);
}
function drawPanel(){({sigmoid:drawSigmoid,loss:drawLoss,gradient:drawGradient,convex:drawConvex})[state.panel]();}
function draw(){
 const e=L.evaluate(state.t,state.points);drawPlot();drawInspect();drawHistory();drawPanel();
 $('steps').textContent=state.steps;$('mean-loss').textContent=e.loss===null?'—':e.loss.toFixed(3);$('accuracy').textContent=e.accuracy===null?'—':Math.round(e.accuracy*100)+'%';
 $('step').disabled=$('run').disabled=!state.points.length;$('run').textContent=state.timer===null?'Run':'Pause';
 for(const [i,id] of ['w1','w2','bias'].entries()){const limit=Math.max(5,Math.ceil(Math.abs(state.t[i])));$(id).min=-limit;$(id).max=limit;$(id).value=state.t[i];$(id+'-value').textContent=fmt(state.t[i]);}
}
function pause(){if(state.timer!==null)clearInterval(state.timer);state.timer=null;}
function restart(message){pause();state.steps=0;state.last=null;state.runSteps=0;const e=L.evaluate(state.t,state.points);state.history=state.points.length?[[0,e.loss]]:[];$('status').textContent=message;draw();}
function reset(){state.t=[0,0,0];restart(state.points.length?'Weights reset. Every point starts at p = 0.5.':'Add points to begin.');}
function step(){
 if(!state.points.length)return;
 const t=[...state.t],{before,next}=L.update(t,state.points,rate());
 if(!next.every(Number.isFinite)){pause();$('status').textContent='Paused: parameters exceeded the numerical range. Reset weights or use a smaller learning rate.';draw();return;}
 if(Math.hypot(...before.gradient)<1e-4){pause();$('status').textContent='Paused: gradient norm < 0.0001 (numerically near stationary).';draw();return;}
 state.t=next;state.steps++;state.runSteps++;
 const afterLoss=L.evaluate(next,state.points).loss;state.last={t,before,next:[...next],rate:rate(),afterLoss};state.history.push([state.steps,afterLoss]);
 // Keep the history bounded for long classroom sessions without changing the model.
 if(state.history.length>2001)state.history=state.history.filter((_,i)=>i%2===0||i===state.history.length-1);
 $('status').textContent=afterLoss>before.loss+1e-10?'Loss increased on this step. Try a smaller learning rate.':`Step ${state.steps}: mean loss ${before.loss.toFixed(4)} → ${afterLoss.toFixed(4)}.`;
 if(state.timer!==null&&state.runSteps>=200){pause();$('status').textContent='Paused after 200 steps. Run again to continue.';}draw();
}
function rebuildSelect(){const select=$('inspect-point');select.replaceChildren();for(const [value,label] of [['probe','Free probe'],...state.points.map(p=>[String(p.id),`P${p.id}: (${p.x}, ${p.y}), y=${p.label}`])]){const option=document.createElement('option');option.value=value;option.textContent=label;select.appendChild(option);}}
function act(x,y){
 const action=document.querySelector('input[name="action"]:checked').value;
 if(action==='inspect'){const close=state.points.find(p=>Math.hypot(px(p.x)-px(x),py(p.y)-py(y))<13);state.selected=close?close.id:null;state.probe={x,y};draw();return;}
 const p={x,y,label:Number(action),id:Math.max(0,...state.points.map(p=>p.id))+1};state.points.push(p);state.selected=p.id;state.kind='custom';$('dataset-note').textContent='Your dataset. Use Inspect to select or remove a point.';rebuildSelect();restart('Point added. Training restarts from the current weights.');
}
function example(kind){
 state.kind=kind;
 const data={worked:[[1,0,1],[0,1,0],[-1,0,0]],separable:[[.72,.72,1],[-.72,-.72,0],[.9,.7,1],[-.9,-.7,0],[.7,.9,1],[-.7,-.9,0]],overlap:[[-.8,-.7,0],[-.7,.4,0],[.7,.6,1],[.8,-.4,1],[.15,.1,0],[-.15,-.1,1],[.2,-.65,0],[-.2,.65,1]],xor:[[-.65,-.65,1],[.65,.65,1],[-.65,.65,0],[.65,-.65,0]]};
 state.points=data[kind].map(([x,y,label],i)=>({x,y,label,id:i+1}));state.selected=1;
 $('dataset-note').textContent={worked:'Three points with integer coordinates. Open Gradient step and press Step to see the arithmetic.',separable:'All points can be classified correctly, but cross-entropy still pushes probabilities toward 0 and 1. Without regularization, no finite maximum-likelihood estimate exists for these data.',overlap:'The classes overlap. Training can settle on a probabilistic compromise, even when no line classifies every point correctly.',xor:'A linear model cannot represent XOR. At zero weights the gradient is exactly zero: p = 0.5 everywhere is a global minimum. Try moving the weights manually, then train back.'}[kind];
 rebuildSelect();reset();
}
function scale(factor){const next=state.t.map(v=>v*factor);if(next.some(v=>Math.abs(v)>1e6)){pause();$('status').textContent='Display limit reached (|parameter| ≤ 1,000,000). Scale down or reset.';draw();return;}state.t=next;restart('Parameters scaled together. The boundary is unchanged; inspect the probabilities.');}
function tab(name,focus=false){state.panel=name;for(const b of document.querySelectorAll('[data-panel]')){const active=b.dataset.panel===name;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;$('panel-'+b.dataset.panel).hidden=!active;if(active&&focus)b.focus();}drawPanel();}
$('plot').addEventListener('click',event=>{const p=new DOMPoint(event.clientX,event.clientY).matrixTransform($('plot').getScreenCTM().inverse()),x=(p.x-300)/260,y=(300-p.y)/260;if(x>=-1&&x<=1&&y>=-1&&y<=1)act(x,y);});
$('point-form').addEventListener('submit',event=>{event.preventDefault();act(Number($('point-x').value),Number($('point-y').value));});
for(const b of document.querySelectorAll('[data-example]'))b.addEventListener('click',()=>example(b.dataset.example));
$('step').addEventListener('click',()=>{pause();step();});$('run').addEventListener('click',()=>{if(state.timer!==null)pause();else{state.runSteps=0;state.timer=setInterval(step,200);}draw();});$('reset').addEventListener('click',reset);
$('clear').addEventListener('click',()=>{state.points=[];state.selected=null;state.kind='custom';$('dataset-note').textContent='Choose Add y = 0 or Add y = 1, then place points.';rebuildSelect();reset();});
$('rate').addEventListener('input',()=>{$('rate-value').textContent=rate();pause();$('status').textContent='Learning rate changed. Continue training from the current weights.';draw();});
for(const [i,id] of ['w1','w2','bias'].entries())$(id).addEventListener('input',()=>{state.t[i]=Number($(id).value);restart('Manual parameters set. Step or Run to train from here.');});
$('scale-up').addEventListener('click',()=>scale(10));$('scale-down').addEventListener('click',()=>scale(.1));
for(const id of ['hard','normal'])$(id).addEventListener('change',draw);
for(const id of ['sigmoid-axis','threshold-curve','slice-axis'])$(id).addEventListener('change',drawPanel);
for(const id of ['loss-p','true-prob'])$(id).addEventListener('input',drawLoss);
$('probe-label').addEventListener('change',()=>{drawInspect();drawPanel();});
$('inspect-point').addEventListener('change',()=>{state.selected=$('inspect-point').value==='probe'?null:Number($('inspect-point').value);draw();});
$('remove-point').addEventListener('click',()=>{if(state.selected===null)return;state.points=state.points.filter(p=>p.id!==state.selected);state.selected=null;$('dataset-note').textContent='Custom dataset.';rebuildSelect();restart('Selected point removed. Training restarts from current weights.');});
for(const b of document.querySelectorAll('[data-panel]')){b.addEventListener('click',()=>tab(b.dataset.panel));b.addEventListener('keydown',e=>{const names=['sigmoid','loss','gradient','convex'],i=names.indexOf(state.panel);if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();tab(names[e.key==='Home'?0:e.key==='End'?3:(i+(e.key==='ArrowRight'?1:3))%4],true);}});}
example('worked');
