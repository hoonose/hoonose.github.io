'use strict';
const Logistic = (() => {
  const sigmoid=z=>z>=0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));
  const score=(t,p)=>t[0]*p.x+t[1]*p.y+t[2];
  const loss=(z,y)=>{const a=y===1?-z:z;return Math.max(a,0)+Math.log1p(Math.exp(-Math.abs(a)));};
  function evaluate(t,points){
    const gradient=[0,0,0],hessian=Array.from({length:3},()=>[0,0,0]);let total=0,correct=0;
    const rows=points.map(p=>{
      const z=score(t,p),prob=sigmoid(z),error=p.label===1?-sigmoid(-z):prob,v=[p.x,p.y,1],g=v.map(x=>error*x);
      total+=loss(z,p.label);correct+=Number((z>0?1:0)===p.label);
      for(let i=0;i<3;i++){gradient[i]+=g[i];for(let j=0;j<3;j++)hessian[i][j]+=sigmoid(z)*sigmoid(-z)*v[i]*v[j];}
      return {z,prob,error,g,loss:loss(z,p.label)};
    });
    const n=points.length;
    return {loss:n?total/n:null,accuracy:n?correct/n:null,gradient:gradient.map(x=>n?x/n:0),hessian:hessian.map(r=>r.map(x=>n?x/n:0)),rows};
  }
  function update(t,points,rate){const before=evaluate(t,points);return {before,next:t.map((v,i)=>v-rate*before.gradient[i])};}
  const crossEntropy=(p,y)=>y===1?(p===0?Infinity:-Math.log(p)):(p===1?Infinity:-Math.log1p(-p));
  const expectedLoss=(p,eta)=>(eta===0?0:eta*crossEntropy(p,1))+(eta===1?0:(1-eta)*crossEntropy(p,0));
  return {sigmoid,score,loss,evaluate,update,crossEntropy,expectedLoss};
})();
if(typeof module!=='undefined')module.exports=Logistic;
