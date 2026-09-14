/* Pure, independently testable scenario models. No product uplift is assumed. */
(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory();
  else root.CampaignCalculators=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function read(input,key,label,min,max,integer,errors){
    var raw=input[key], n=(raw===null||raw===undefined||String(raw).trim()==='')?NaN:Number(raw);
    if(!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n))){
      errors.push('Enter '+label+' between '+min+' and '+max+(integer?' as a whole number.':'.'));
    }
    return n;
  }
  function retention(input){
    var errors=[];
    var members=read(input,'members','active members',1,10000000,true,errors);
    var monthly=read(input,'monthly','monthly membership revenue',0,100000,false,errors);
    var churn=read(input,'churn','annual churn',0,100,false,errors);
    var improvement=read(input,'improvement','retention improvement',0,100,false,errors);
    var months=read(input,'months','additional months retained',1,24,true,errors);
    var includeAcquisition=input.includeAcquisition===true,cac=0,replacement=0;
    if(includeAcquisition){cac=read(input,'cac','paid acquisition cost',0,1000000,false,errors);replacement=read(input,'replacement','paid replacement share',0,100,false,errors);}
    if(errors.length)return {valid:false,errors:errors};
    var appliedImprovement=Math.min(churn,improvement),lost=members*churn/100,retained=members*appliedImprovement/100;
    return {valid:true,inputs:{members:members,monthly:monthly,churn:churn,improvement:improvement,months:months,includeAcquisition:includeAcquisition,cac:includeAcquisition?cac:null,replacement:includeAcquisition?replacement:null},appliedImprovement:appliedImprovement,scenarioChurn:Math.max(0,churn-appliedImprovement),lost:lost,retained:retained,membershipValue:retained*monthly*months,acquisitionSaving:includeAcquisition?retained*replacement/100*cac:null};
  }
  function pt(input){
    var errors=[];
    var consultations=read(input,'consultations','monthly consultations',0,1000000,true,errors);
    var conversion=read(input,'conversion','current conversion',0,100,false,errors);
    var packageValue=read(input,'packageValue','initial package value',0,1000000,false,errors);
    var improvement=read(input,'improvement','conversion improvement',0,100,false,errors);
    if(errors.length)return {valid:false,errors:errors};
    var scenarioConversion=Math.min(100,conversion+improvement),current=consultations*conversion/100,scenario=consultations*scenarioConversion/100,additional=Math.max(0,scenario-current);
    return {valid:true,inputs:{consultations:consultations,conversion:conversion,packageValue:packageValue,improvement:improvement},appliedImprovement:scenarioConversion-conversion,scenarioConversion:scenarioConversion,current:current,scenario:scenario,additional:additional,monthlySales:additional*packageValue,annualSales:additional*packageValue*12};
  }
  return {retention:retention,pt:pt};
});
