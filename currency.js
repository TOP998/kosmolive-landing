(function(){
  const buttons=[...document.querySelectorAll('.currency-switcher button')];
  const amounts=[...document.querySelectorAll('.amount[data-rub]')];
  const converted=[...document.querySelectorAll('.converted[data-converted]')];
  const symbols={RUB:'₽',USD:'$',EUR:'€',GEL:'₾'};
  const fallback={RUB:1,USD:0.01616,EUR:0.01507,GEL:0.030923};
  const API='https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/';
  const CACHE_KEY='kosmolive_fx_rates_v1';
  const CACHE_TTL=6*60*60*1000;
  let rates={...fallback};
  let selected='RUB';

  function format(value,currency){
    const digits=currency==='RUB'||currency==='GEL'?0:2;
    return new Intl.NumberFormat('ru-RU',{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(value);
  }

  function render(){
    amounts.forEach(el=>{
      const rub=Number(el.dataset.rub);
      const monthly=el.dataset.monthly==='true'?' /мес.':'';
      if(selected==='RUB') el.textContent='от '+format(rub,'RUB')+' ₽'+monthly;
      else el.textContent='от '+format(rub*rates[selected],selected)+' '+symbols[selected]+monthly;
    });
    converted.forEach(el=>{
      const rub=Number(el.dataset.converted);
      el.textContent=selected==='RUB'?'':'≈ '+format(rub*rates[selected],selected)+' '+symbols[selected];
    });
  }

  function applyRates(data){
    const currencies=data?.[0]?.currencies||[];
    const next={RUB:1};
    currencies.forEach(item=>{
      if(!item.code || !item.rate || !item.quantity) return;
      const gelPerUnit=Number(item.rate)/Number(item.quantity);
      if(item.code==='RUB') next.RUB=1;
      if(item.code==='USD') next.USD=gelPerUnit/(next.USD_GEL||1);
      if(item.code==='EUR') next.EUR=gelPerUnit/(next.EUR_GEL||1);
      if(item.code==='GEL') next.GEL=gelPerUnit;
    });

    const rub=currencies.find(x=>x.code==='RUB');
    const usd=currencies.find(x=>x.code==='USD');
    const eur=currencies.find(x=>x.code==='EUR');
    if(!rub||!usd||!eur) throw new Error('NBG rates are incomplete');

    const rubGel=Number(rub.rate)/Number(rub.quantity);
    const usdGel=Number(usd.rate)/Number(usd.quantity);
    const eurGel=Number(eur.rate)/Number(eur.quantity);
    rates={
      RUB:1,
      GEL:rubGel,
      USD:rubGel/usdGel,
      EUR:rubGel/eurGel
    };

    try{localStorage.setItem(CACHE_KEY,JSON.stringify({savedAt:Date.now(),rates}));}catch(e){}
    render();
  }

  function loadCached(){
    try{
      const cached=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');
      if(cached?.rates && Date.now()-cached.savedAt<CACHE_TTL){
        rates={...fallback,...cached.rates};
        render();
        return true;
      }
    }catch(e){}
    return false;
  }

  async function updateRates(){
    try{
      const response=await fetch(API,{cache:'no-store'});
      if(!response.ok) throw new Error('NBG request failed: '+response.status);
      applyRates(await response.json());
    }catch(error){
      console.warn('Kosmolive currency update failed:',error);
      render();
    }
  }

  buttons.forEach(btn=>btn.addEventListener('click',()=>{
    selected=btn.dataset.currency;
    buttons.forEach(b=>b.classList.toggle('active',b===btn));
    render();
  }));

  loadCached();
  updateRates();
  setInterval(updateRates,CACHE_TTL);
})();
