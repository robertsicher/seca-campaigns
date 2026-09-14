(function(){
  const $=(s,c=document)=>c.querySelector(s); const $$=(s,c=document)=>Array.from(c.querySelectorAll(s));
  const money=(n)=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(Number.isFinite(n)?n:0);
  const num=(n)=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:1}).format(Number.isFinite(n)?n:0);
  const pct=(n)=>`${num(n)}%`;
  const val=(id,fallback=0)=>{const el=document.getElementById(id); if(!el)return fallback; const x=parseFloat(el.value); return Number.isFinite(x)?x:fallback};
  const set=(id,text)=>{const el=document.getElementById(id); if(el) el.textContent=text};
  const width=(id,v,max)=>{const el=document.getElementById(id); if(el)el.style.width=`${Math.max(0,Math.min(100,max?100*v/max:0))}%`};

  const navToggle=$('.nav-toggle'), navLinks=$('.nav-links');
  if(navToggle&&navLinks){navToggle.addEventListener('click',()=>{const o=navLinks.classList.toggle('is-open');navToggle.setAttribute('aria-expanded',o)});}

  const modal=$('#strategy-modal');
  $$('.strategy-open').forEach(a=>a.addEventListener('click',e=>{e.preventDefault(); if(modal){modal.classList.add('is-open');modal.setAttribute('aria-hidden','false'); $('.modal-close',modal)?.focus();}}));
  $('.modal-close',modal||document)?.addEventListener('click',()=>{modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true')});
  modal?.addEventListener('click',e=>{if(e.target===modal){modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true')}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal?.classList.contains('is-open')){$('.modal-close',modal)?.click()}});

  $$('.mock-lead-form').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault(); $('.form-message',form)?.classList.add('is-visible')}));

  function syncRange(rangeId,inputId,suffix=''){
    const r=document.getElementById(rangeId),i=document.getElementById(inputId); if(!r||!i)return;
    const fn=()=>{i.value=r.value; i.dispatchEvent(new Event('input',{bubbles:true}))};
    r.addEventListener('input',fn); i.addEventListener('input',()=>{r.value=i.value});
  }

  function retention(){
    const form=$('[data-calculator="retention"]'); if(!form)return;
    const calc=()=>{
      const members=val('ret-members'), monthly=val('ret-monthly'), churn=val('ret-churn')/100, cac=val('ret-cac'), replace=val('ret-replace')/100, improve=val('ret-improve'), duration=val('ret-duration'), marginRaw=document.getElementById('ret-margin')?.value.trim(), margin=marginRaw===''?null:val('ret-margin')/100;
      const lost=members*churn, currentSpend=lost*replace*cac, retained=members*(improve/100), revenue=retained*monthly*duration, avoided=retained*replace*cac, opp=revenue+avoided;
      set('ret-lost',num(lost));set('ret-current-spend',money(currentSpend));set('ret-retained',num(retained));set('ret-revenue',money(revenue));set('ret-avoided',money(avoided));set('ret-opportunity',money(opp));set('ret-improve-label',`${num(improve)} percentage points`);
      const contribWrap=$('#ret-contrib-wrap'); if(margin!==null){const contrib=revenue*margin;set('ret-contrib',money(contrib));set('ret-contrib-total',money(contrib+avoided));contribWrap?.removeAttribute('hidden')}else contribWrap?.setAttribute('hidden','');
      const scenarioChurn=Math.max(0,churn-improve/100), scenarioCost=(members*scenarioChurn*replace*cac); const max=Math.max(currentSpend,scenarioCost,1); set('bar-current-label',money(currentSpend));set('bar-scenario-label',money(scenarioCost));width('bar-current',currentSpend,max);width('bar-scenario',scenarioCost,max);
    };
    form.addEventListener('input',calc);calc();
  }
  function pt(){
    const form=$('[data-calculator="pt"]'); if(!form)return;
    const calc=()=>{
      const members=val('pt-members'),newM=val('pt-new'),intro=val('pt-intro')/100,conv=val('pt-conv')/100,pkg=val('pt-value'),uplift=val('pt-uplift')/100;
      const pool=newM*intro, current=pool*conv, scenario=pool*Math.min(1,conv+uplift),add=scenario-current,monthly=add*pkg,annual=monthly*12;
      set('pt-current',num(current));set('pt-scenario',num(scenario));set('pt-additional',num(add));set('pt-monthly',money(monthly));set('pt-annual',money(annual));set('pt-sentence',`If a measurement-led consultation increased PT conversion by ${num(uplift*100)} percentage points, this scenario represents approximately ${money(annual)} in additional annual PT revenue.`);set('pt-members-display',num(members));
    };form.addEventListener('input',calc);calc();
  }
  function premium(){
    const form=$('[data-calculator="premium"]'); if(!form)return;
    const calc=()=>{const active=val('prem-active'),current=val('prem-current'),diff=val('prem-diff'),up=val('prem-upgrades'),fee=val('prem-fee'),vol=val('prem-volume');const monthly=up*diff,annual=monthly*12,assess=fee*vol*12,total=annual+assess;set('prem-monthly',money(monthly));set('prem-annual',money(annual));set('prem-assess',money(assess));set('prem-total',money(total));set('prem-context',`${num(current)} of ${num(active)} members are currently on premium membership in this illustrative model.`)};form.addEventListener('input',calc);calc();
  }
  function multisite(){
    const form=$('[data-calculator="multi"]'); if(!form)return;
    const calc=()=>{
      const sites=val('multi-sites'),membersSite=val('multi-members'),units=val('multi-units'),investUnit=val('multi-invest'),churn=val('multi-churn')/100,monthly=val('multi-membership'),cac=val('multi-cac'),pt=val('multi-pt'),retPP=val('multi-ret-pp')/100,ptUplift=val('multi-pt-uplift')/100,premUp=val('multi-prem-upgrades'),premDiff=val('multi-prem-diff'),assessFee=val('multi-assess-fee'),assessVol=val('multi-assess-vol');
      const totalMembers=sites*membersSite, investment=sites*units*investUnit;
      const useRet=document.getElementById('multi-use-ret')?.checked, usePt=document.getElementById('multi-use-pt')?.checked,usePrem=document.getElementById('multi-use-prem')?.checked,useAssess=document.getElementById('multi-use-assess')?.checked;
      const retention=useRet?(totalMembers*retPP*monthly*12 + totalMembers*retPP*cac):0;
      const ptOpp=usePt?(totalMembers*ptUplift*pt):0;
      const premium=usePrem?(sites*premUp*premDiff*12):0;
      const assess=useAssess?(sites*assessVol*assessFee*12):0;
      const total=retention+ptOpp+premium+assess; const payback=total>0?investment/(total/12):0;
      set('multi-total',money(total));set('multi-investment',money(investment));set('multi-payback',payback?`${num(payback)} months`:'N/A');set('multi-member-base',num(totalMembers));set('multi-retention',money(retention));set('multi-pt',money(ptOpp));set('multi-premium',money(premium));set('multi-assess',money(assess));set('multi-churn-display',pct(churn*100));
    };form.addEventListener('input',calc);calc();
  }
  retention();pt();premium();multisite();
})();
