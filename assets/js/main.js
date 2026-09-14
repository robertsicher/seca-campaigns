(function(){
  const $=(s,c=document)=>c.querySelector(s); const $$=(s,c=document)=>Array.from(c.querySelectorAll(s));
  const money=(n)=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(Number.isFinite(n)?n:0);
  const num=(n)=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:1}).format(Number.isFinite(n)?n:0);
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

  function retention(){
    const form=$('[data-calculator="retention"]'); if(!form)return;
    const replacementShare=.5;
    const calc=()=>{
      const members=val('ret-members'), monthly=val('ret-monthly'), churn=val('ret-churn')/100, cac=val('ret-cac'), improve=val('ret-improve'), duration=val('ret-duration');
      const lost=members*churn, retained=members*(improve/100), revenue=retained*monthly*duration, avoided=retained*replacementShare*cac, opp=revenue+avoided;
      const currentSpend=lost*replacementShare*cac, scenarioChurn=Math.max(0,churn-improve/100), scenarioCost=members*scenarioChurn*replacementShare*cac;
      set('ret-lost',num(lost)); set('ret-retained',num(retained)); set('ret-revenue',money(revenue)); set('ret-avoided',money(avoided)); set('ret-opportunity',money(opp)); set('ret-improve-label',`${num(improve)} percentage point${improve===1?'':'s'}`);
      const max=Math.max(currentSpend,scenarioCost,1); set('bar-current-label',money(currentSpend));set('bar-scenario-label',money(scenarioCost));width('bar-current',currentSpend,max);width('bar-scenario',scenarioCost,max);
    }; form.addEventListener('input',calc); calc();
  }
  function pt(){
    const form=$('[data-calculator="pt"]'); if(!form)return;
    const calc=()=>{
      const consultations=val('pt-consults'), conv=val('pt-conv')/100, pkg=val('pt-value'), uplift=val('pt-uplift')/100;
      const current=consultations*conv, scenario=consultations*Math.min(1,conv+uplift), add=scenario-current, monthly=add*pkg, annual=monthly*12;
      set('pt-current',num(current)); set('pt-scenario',num(scenario)); set('pt-additional',num(add)); set('pt-monthly',money(monthly)); set('pt-annual',money(annual));
      set('pt-sentence',`If conversion increased from ${num(conv*100)}% to ${num(Math.min(1,conv+uplift)*100)}%, this scenario represents approximately ${money(annual)} in additional annual initial-package revenue.`);
    }; form.addEventListener('input',calc); calc();
  }
  retention(); pt();
})();
