(function(){
  const $=(s,c=document)=>c.querySelector(s); const $$=(s,c=document)=>Array.from(c.querySelectorAll(s));
  const money=(n)=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(Number.isFinite(n)?n:0);
  const num=(n)=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:1}).format(Number.isFinite(n)?n:0);
  const val=(id,fallback=0)=>{const el=document.getElementById(id); if(!el)return fallback; const x=parseFloat(el.value); return Number.isFinite(x)?x:fallback};
  const set=(id,text)=>{const el=document.getElementById(id); if(el) el.textContent=text};
  const width=(id,v,max)=>{const el=document.getElementById(id); if(el)el.style.width=`${Math.max(0,Math.min(100,max?100*v/max:0))}%`};

  function restructureCampaign(){
    const path=window.location.pathname.replace(/\/+$/,'/');
    const isHome=/\/progress-you-can-prove\/$/.test(path);
    const isMulti=path.includes('/progress-you-can-prove/multi-site/');

    /* Multi-site is an enterprise rollout layer, not a fifth use case. */
    $$('.nav-links a').forEach(a=>{if((a.getAttribute('href')||'').includes('/multi-site/'))a.remove();});

    const footerLinks=$('.footer-links');
    if(footerLinks&&!$('.multi-site-footer',footerLinks)){
      const a=document.createElement('a');
      a.className='multi-site-footer';
      a.href=isHome?'multi-site/':'../multi-site/';
      a.textContent='For multi-site operators';
      const strategy=$('.strategy-open',footerLinks);
      strategy?footerLinks.insertBefore(a,strategy):footerLinks.appendChild(a);
    }

    if(isHome){
      const priority=$('#business-priorities');
      if(priority){
        const heading=$('.section-head h2',priority);
        if(heading)heading.textContent='One measurement platform. Four commercial conversations.';
        const intro=$('.section-head p:last-child',priority);
        if(intro)intro.textContent='Each route starts with a different operator problem and uses the same core idea: make progress easier to see, understand and act on.';
        $$('.pillar',priority).forEach(p=>{const tag=$('.tag',p);if(tag&&tag.textContent.trim().toUpperCase()==='SCALE')p.remove();});
        if(!$('#enterprise-scale')){
          const section=document.createElement('section');
          section.className='section';
          section.id='enterprise-scale';
          section.innerHTML='<div class="container"><div class="intro-split"><div><p class="eyebrow">For multi-site operators</p><h2 class="display">Proven at one club. Designed to scale.</h2></div><div class="intro-copy"><p>Retention, personal training, performance and premium experience are the reasons to engage. For a multi-site operator, the next question is whether the chosen use case works consistently across the estate.</p><p>Start with representative locations, prove member adoption, operational fit and commercial relevance, then use real evidence to decide whether broader deployment makes sense.</p><a class="btn btn--red" href="multi-site/" style="margin-top:18px">Explore the 90-Day Pilot Framework</a></div></div></div>';
          priority.insertAdjacentElement('afterend',section);
        }
      }
      const objective=$('select[name="objective"]');
      if(objective){
        Array.from(objective.options).forEach(o=>{if(/national rollout/i.test(o.textContent))o.remove();});
      }
    }

    if(isMulti){
      const asideLabel=$('.page-hero .hero-aside .eyebrow');
      if(asideLabel)asideLabel.textContent='Enterprise rollout layer';
      const hero=$('.page-hero');
      if(hero&&!$('.enterprise-context')){
        const context=document.createElement('section');
        context.className='section section--tight enterprise-context';
        context.innerHTML='<div class="container"><div class="callout"><p><strong>Start with the use case first.</strong> Retention, PT, performance or premium experience creates the reason to engage. This framework is what happens next when a multi-site operator wants to prove the model before scaling it.</p></div></div>';
        hero.insertAdjacentElement('afterend',context);
      }
    }

    const cardBy=(title)=>$$('.strategy-card').find(card=>$('h3',card)?.textContent.trim()===title);
    const objectiveCard=cardBy('Commercial objective');
    if(objectiveCard){
      const p=$('p',objectiveCard); if(p)p.textContent='Create demand around four operator problems: member retention, personal training, performance programmes and premium member experience. Multi-site is treated as the enterprise conversion layer, not a fifth proposition.';
    }
    const intentCard=cardBy('Content by intent');
    if(intentCard){
      const p=$('p',intentCard); if(p)p.textContent='Retention and PT use calculators where the prospect\'s own economics improve the conversation. Performance and premium use practical guides. The 90-Day Pilot Framework sits later in the journey, once a multi-site account has identified the use case it wants to validate.';
    }
    const hubspotCard=cardBy('HubSpot architecture');
    if(hubspotCard){
      const p=$('p',hubspotCard); if(p)p.textContent='Page behaviour and asset engagement identify interest in the four core use cases. For larger accounts, site count, repeat engagement and multiple stakeholders can move the Company record into an enterprise pilot or ABM path rather than treating multi-site as a separate campaign theme.';
    }
    const note=$('.strategy-note');
    if(note)note.innerHTML='<strong>Principle:</strong> four demand propositions create the reason to engage. Multi-site is the enterprise conversion layer: once the use case is clear, pilot evidence determines whether the operator should scale it.';
  }

  restructureCampaign();

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
