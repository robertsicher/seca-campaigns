(function(){
'use strict';
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>Array.from(c.querySelectorAll(s));
const money=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(n);
const number=n=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:1}).format(n);
const put=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
const value=id=>document.getElementById(id)?.value;
const route=document.body.dataset.route;
const objectives={overview:'Explore TRU Alpha',retention:'Retention','personal-training':'Personal training',performance:'Performance','premium-experience':'Premium experience','multi-site':'Multi-site pilot'};
let scenario=null,calculatorType=null,hasCalculator=false;
const caveats={
retention:'Membership value represents fees associated with retained members over the selected additional months. It is not a net incremental revenue or ROI estimate. Replacement-member revenue, equipment, software and staff costs are excluded. Acquisition savings are optional and separate, and depend on spending actually being avoided. No TRU Alpha uplift is assumed.',
pt:'Gross initial PT package sales before trainer payments, delivery and product costs. Sales may belong to an independent trainer rather than the club. Annual sales assume the same monthly consultation volume and conversion for 12 months. Renewals are excluded. No TRU Alpha uplift is assumed.'
};
function context(){
  const params=new URLSearchParams(location.search),source={};
  ['utm_source','utm_medium','utm_campaign','utm_content'].forEach(k=>{const v=params.get(k);if(v)source[k]=v.slice(0,200);});
  return {campaign:'Progress You Can Prove',objective:objectives[route]||route,page:location.pathname,source:source,calculator:calculatorType,scenario:scenario?.valid?scenario:null,assumptions:calculatorType?caveats[calculatorType]:null,status:'Interview demonstration. No enquiry has been sent.'};
}
function updateContext(){const el=$('#context-preview');if(el)el.textContent=JSON.stringify(context(),null,2);$$('[data-save-scenario]').forEach(b=>{b.disabled=hasCalculator&&!scenario?.valid;});}
function validity(shell,result){
  const error=$('.calc-error',shell);error.hidden=result.valid;error.textContent=result.valid?'':result.errors.join(' ');
  if(!result.valid)$$('.result-value',shell).forEach(el=>el.textContent='–');
  scenario=result;updateContext();return result.valid;
}
const retention=$('[data-calculator="retention"]');
if(retention){
  hasCalculator=true;calculatorType='retention';
  const calc=()=>{
    const include=$('#ret-include-acquisition').checked;
    ['ret-cac','ret-replacement'].forEach(id=>document.getElementById(id).disabled=!include);
    $('#acquisition-result').hidden=!include;
    const result=CampaignCalculators.retention({members:value('ret-members'),monthly:value('ret-monthly'),churn:value('ret-churn'),improvement:value('ret-improve'),months:value('ret-duration'),includeAcquisition:include,cac:value('ret-cac'),replacement:value('ret-replacement')});
    put('ret-improve-label',number(Number(value('ret-improve')))+' percentage points');
    if(!validity(retention,result)){put('ret-description','Complete valid inputs to see your scenario.');return;}
    put('ret-lost',number(result.lost));put('ret-retained',number(result.retained));put('ret-revenue',money(result.membershipValue));
    put('ret-description',number(result.retained)+' retained members × '+money(result.inputs.monthly)+' per month × '+result.inputs.months+' additional months.');
    put('ret-cap-note',result.appliedImprovement<result.inputs.improvement?'Applied improvement capped at '+number(result.appliedImprovement)+' percentage points so retained members cannot exceed those expected to leave.':number(result.inputs.churn)+'% annual churn becomes '+number(result.scenarioChurn)+'% in this scenario.');
    if(include)put('ret-avoided',money(result.acquisitionSaving));
  };
  retention.addEventListener('input',calc);retention.addEventListener('change',calc);calc();
}
const pt=$('[data-calculator="pt"]');
if(pt){
  hasCalculator=true;calculatorType='pt';
  const calc=()=>{
    const result=CampaignCalculators.pt({consultations:value('pt-consults'),conversion:value('pt-conv'),packageValue:value('pt-value'),improvement:value('pt-uplift')});
    if(!validity(pt,result)){put('pt-description','Complete valid inputs to see your scenario.');return;}
    put('pt-current',number(result.current));put('pt-scenario',number(result.scenario));put('pt-additional',number(result.additional));put('pt-monthly',money(result.monthlySales));put('pt-annual',money(result.annualSales));
    put('pt-description',number(result.additional)+' additional initial packages per month × '+money(result.inputs.packageValue)+' × 12 months.');
    put('pt-cap-note',result.appliedImprovement<result.inputs.improvement?'Scenario conversion capped at 100%. Applied improvement: '+number(result.appliedImprovement)+' percentage points.':number(result.inputs.conversion)+'% conversion becomes '+number(result.scenarioConversion)+'% in this scenario.');
  };
  pt.addEventListener('input',calc);pt.addEventListener('change',calc);calc();
}
function saveScenario(){
  const c=context();if(hasCalculator&&!scenario?.valid)return;
  const lines=['PROGRESS YOU CAN PROVE','Business scenario','', 'Objective: '+c.objective,'Page: '+c.page,''];
  if(scenario?.valid){lines.push('INPUTS',JSON.stringify(scenario.inputs,null,2),'','SCENARIO',JSON.stringify(scenario,null,2),'','ASSUMPTIONS',c.assumptions);}
  else lines.push('Explore the member journey, team capacity, operating model and costs with a seca specialist.');
  lines.push('','Interview demonstration. No enquiry has been sent. This file contains no personal contact details.');
  const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');
  a.href=url;a.download='progress-you-can-prove-'+route+'-scenario.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$$('[data-save-scenario]').forEach(b=>b.addEventListener('click',saveScenario));
const navToggle=$('.nav-toggle'),nav=$('.nav-links');
function closeNav(){nav?.classList.remove('is-open');navToggle?.setAttribute('aria-expanded','false');navToggle?.setAttribute('aria-label','Open navigation');}
navToggle?.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');navToggle.setAttribute('aria-expanded',String(open));navToggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');});
$$('a',nav||document).forEach(a=>a.addEventListener('click',closeNav));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('is-open')){closeNav();navToggle.focus();}});
function openDialog(dialog,trigger){
  closeNav();updateContext();dialog.showModal();dialog.dataset.trigger='';
  if(dialog.id==='demo-dialog'){const select=$('select[name="objective"]',dialog);const objective=objectives[route];if(Array.from(select.options).some(o=>o.value===objective))select.value=objective;}
}
$$('[data-demo]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();openDialog($('#demo-dialog'),a);}));
$$('[data-strategy]').forEach(a=>a.addEventListener('click',()=>openDialog($('#strategy-dialog'),a)));
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
$$('[data-demo-form]').forEach(form=>{
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const message=$('.form-message',form),preview=$('[data-enquiry-preview]',form);
    if(preview){
      const objective=$('select[name="objective"]',form)?.value||form.dataset.objective;
      let summary='Priority: '+objective+'. ';
      if(scenario?.valid&&calculatorType==='retention')summary+='Current scenario: '+number(scenario.retained)+' retained members and '+money(scenario.membershipValue)+' in associated membership value across '+scenario.inputs.months+' additional months. ';
      if(scenario?.valid&&calculatorType==='pt')summary+='Current scenario: '+money(scenario.annualSales)+' in additional annual initial-package sales. ';
      if(hasCalculator&&!scenario?.valid)summary+='Calculator inputs need correcting before a scenario can be included. ';
      summary+='A specialist would discuss your current process, operating model and next steps.';
      preview.textContent=summary;
    }
    message.hidden=false;message.focus();updateContext();
  });
  $('[data-sample]',form)?.addEventListener('click',()=>{
    const sample={first:'Alex',email:'alex@example.com',company:'Example Fitness',role:'General manager',sites:'3'};
    Object.entries(sample).forEach(([name,value])=>{const el=form.elements.namedItem(name);if(el)el.value=value;});
  });
  $('fieldset',form).disabled=false;
});
updateContext();
})();