(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const e of i)if(e.type==="childList")for(const n of e.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function l(i){const e={};return i.integrity&&(e.integrity=i.integrity),i.referrerPolicy&&(e.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?e.credentials="include":i.crossOrigin==="anonymous"?e.credentials="omit":e.credentials="same-origin",e}function s(i){if(i.ep)return;i.ep=!0;const e=l(i);fetch(i.href,e)}})();const V=[..."!),.:;?]]¢—’”‰℃℉、。々〉》」』】〕〟ぁぃぅぇぉっゃゅょゎ゛゜ゝゞァィゥェォッャュョヮヵヶ・ーヽヾ！％），．：；？］｝"],z=[..."([{£§‘“〈《「『【〒〔〝＃＄（＠［｛￥"],B=[...V,...z],L=[..."0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"],_=(t,o,l)=>{const s=[o[l]];let i=1,e=o[l].metrix.width;if(L.includes(t[l])){for(let n=l+1;n<t.length&&L.includes(t[n]);n++)i++,e+=o[n].metrix.width,s.push(o[n]);return{length:i,width:e,chars:s}}if(B.includes(t[l])){for(let n=l+1;n<t.length&&B.includes(t[n]);n++)i++,e+=o[n].metrix.width,s.push(o[n]);return{length:i,width:e,chars:s}}return{length:i,width:e,chars:s}},I=(t,o,l)=>{const s=_(t,o,l);let i=l+s.length;for(;i<o.length;){const e=o[i];if(V.includes(t[i]))s.length++,s.width+=e.metrix.width,s.chars.push(e),i++;else break}return s},R=(t,o,l)=>{const s=[],i=()=>{const a={at:0,width:0,lineAscent:0,lineDescent:0,lineMargin:0};return s.push(a),a};let e=i(),n=0;for(;n<o.length;){if(t[n]===`
`){e.lineAscent=Math.max(e.lineAscent,o[n].metrix.fontBoundingBoxAscent),e.lineDescent=Math.max(e.lineDescent,o[n].metrix.fontBoundingBoxDescent),n++,e=i(),e.at=n;continue}const c=I(t,o,n);e.width+c.width>l&&(e=i(),e.at=n),e.width+=c.width,e.lineAscent=Math.max(e.lineAscent,...c.chars.map(f=>f.metrix.fontBoundingBoxAscent)),e.lineDescent=Math.max(e.lineDescent,...c.chars.map(f=>f.metrix.fontBoundingBoxDescent)),n+=c.length}return s};let v=!1;const F=t=>{v=t},p=document.createElement("canvas");p.width=1;p.height=1;p.style.writingMode="vertical-rl";const b=p.getContext("2d"),W=(t,o)=>{t.font=`${o.fontStyle} ${o.fontWeight} ${o.fontSize}px ${o.fontFamily}`,t.fillStyle=o.fontColor},P=t=>{const{initialStyle:o,styles:l}=t,s=[],i=[];l.forEach(n=>i[n.at]=n),W(b,o);let e={...o};for(let n=0;n<t.text.length;n++){const a=t.text[n],c=i[n];c&&(e={...e,...c.style},W(b,e)),s.push({metrix:b.measureText(a)})}return s},k=(t,o)=>(t.lineAscent+t.lineDescent)*(o-1)/2,U=(t,o,l,s,i)=>{const{initialStyle:e,styles:n,text:a,lineHeight:c=1}=o,f=[];n.forEach(d=>f[d.at]=d);const u=[];if(s.forEach(d=>u[d.at]=d),a.length!==l.length)throw new Error("text length and charWidths length are not equal");const A=()=>{switch(o.align){case"center":return(i-h.width)/2;case"right":return i-h.width;default:return 0}};let h=u[0],S={...e};W(t,S);let m=A(),g=(h.lineAscent+h.lineDescent)*(c-1)/2;for(let d=0;d<a.length;d++){const O=a[d],y=l[d],H=f[d];if(u[d]){if(d!==0){if(g+=h.lineAscent+h.lineDescent,g+=k(h,c),v){t.save(),t.beginPath(),t.strokeStyle="blue",t.setLineDash([2,2]);const T=A();t.moveTo(T,g),t.lineTo(T+h.width,g),t.stroke(),t.restore()}h=u[d],m=A(),g+=k(h,c)}v&&(t.save(),t.beginPath(),t.strokeStyle="blue",t.strokeRect(m,g,h.width,h.lineAscent+h.lineDescent),t.setLineDash([5,5]),t.moveTo(m,g+h.lineAscent),t.lineTo(m+h.width,g+h.lineAscent),t.stroke(),t.restore())}H&&(S={...S,...H.style},W(t,S)),t.fillText(O,m,g+h.lineAscent),v&&(t.save(),t.strokeStyle="red",t.strokeRect(m,g+h.lineAscent-y.metrix.actualBoundingBoxAscent,y.metrix.width,y.metrix.actualBoundingBoxAscent+y.metrix.actualBoundingBoxDescent),t.restore()),m+=y.metrix.width}},N=(t,o,l,s,i,e)=>{p.style.writingMode=o.direction==="vertical"?"vertical-rl":"horizontal-tb";const n=e!=null&&e.charWidths?e==null?void 0:e.charWidths:P(o),a=e!=null&&e.charWidths&&(e!=null&&e.lineBreaks)?e==null?void 0:e.lineBreaks:R(o.text,n,i);t.save();const c=a.reduce((f,u)=>f+(u.lineAscent+u.lineDescent)*(o.lineHeight??1),0);return o.direction==="vertical"?(t.rotate(Math.PI/2*1),t.translate(s,-l)):t.translate(l,s),v&&(t.save(),t.strokeStyle="green",t.strokeRect(-1,-1,i+2,c+2),t.restore()),U(t,o,n,a,i),t.restore(),{charWidths:n,lineBreaks:a}},C=400,E=700,D={text:`Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt _~^,|... 

  花子は、古びたアトリエで縦書きCanvasに思いを馳せていた。彼女の心は、過去の情熱的な絵画と未来の可能性とで彩られていた。CanvasRenderingContext2Dを通じて、彼女の筆が魔法のように踊り、色と形が交じり合う。「その魔法のキャンバスには、季節が舞い、想像が咲く」。花子の作品は、縦書きならではの風情が溢れ、心の底からの芸術の詩となるのだった。`,initialStyle:{fontFamily:"sans-serif",fontSize:20,fontColor:"#333",fontWeight:C,fontStyle:"normal"},styles:[{at:5,style:{fontFamily:'"Times"',fontWeight:E,fontSize:36,fontColor:"#39a"}},{at:12,style:{fontFamily:'"Hiragino Maru Gothic Pro"',fontSize:18,fontColor:"#777"}},{at:22,style:{fontWeight:E,fontSize:32,fontColor:"#ea3"}},{at:27,style:{fontWeight:C,fontColor:"#777"}},{at:58,style:{fontFamily:'"HanaMinA"',fontColor:"#f63",fontSize:40}},{at:61,style:{fontColor:"#777",fontSize:18}}],lineHeight:1.5,align:"left",direction:"horizontal"};const w=t=>document.querySelector(t),$=w("#app"),r={wrapWidth:500,debug:!1,isVertical:D.direction==="vertical",lineHeight:D.lineHeight,onUpdate:()=>{}},G=()=>{const t=w("#wrapWidth");t.value=r.wrapWidth.toString();const o=w("#wrapWidthValue");t.addEventListener("input",()=>{o.innerText=t.value+"px",r.wrapWidth=t.valueAsNumber,r.onUpdate()});const l=w("#debug");l.checked=r.debug,l.addEventListener("change",n=>{r.debug=n.target.checked,r.onUpdate()});const s=w("#vertical");s.checked=r.isVertical,s.addEventListener("change",n=>{r.isVertical=n.target.checked,r.onUpdate()});const i=w("#lineHeight");i.value=r.lineHeight.toString();const e=w("#lineHeightValue");i.addEventListener("input",()=>{e.innerText=i.value,r.lineHeight=i.valueAsNumber,r.onUpdate()})},q=()=>{const t=document.createElement("canvas"),o=t.getContext("2d");t.style.border="1px solid black",$.appendChild(t);const l={wrapWidth:r.wrapWidth,isVertical:r.isVertical};let s;const i=()=>{F(r.debug);const e={...D};e.lineHeight=r.lineHeight,e.direction=r.isVertical?"vertical":"horizontal";const n=e.direction==="vertical";t.style.writingMode=n?"vertical-rl":"horizontal-tb";const a=t.width/2,c=t.height/2,f=n?a:0,u=n?c:a;console.time("drawText"),s=N(o,e,f,0,u,{charWidths:s}).charWidths,console.timeEnd("drawText")};r.onUpdate=()=>{const e=r.isVertical,n=800,a=e?n:r.wrapWidth,c=e?r.wrapWidth:n;t.width=a*2,t.height=c*2,t.style.width=`${a}px`,t.style.height=`${c}px`,o.resetTransform(),o.scale(2,2),(l.wrapWidth!==r.wrapWidth||l.isVertical!==r.isVertical)&&(s=void 0),i()},G(),r.onUpdate()};q();
