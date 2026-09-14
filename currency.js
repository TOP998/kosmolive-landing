(function(){
  const buttons=[...document.querySelectorAll('.currency-switcher button')];
  const amounts=[...document.querySelectorAll('.amount[data-rub]')];
  const converted=[...document.querySelectorAll('.converted[data-converted]')];
  const symbols={RUB:'₽',USD:'$',EUR:'€',GEL:'₾'};
  const rates={RUB:1,USD:0.01616,EUR:0.01507,GEL:0.030923};
  let selected='RUB';

  function format(value,currency){
    const digits=currency==='RUB'||currency==='GEL'?0:2;
    return new Intl.NumberFormat('ru-RU',{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(value);
  }

  function render(){
    amounts.forEach(el=>{
      const rub=Number(el.dataset.rub);
      if(selected==='RUB') el.textContent='от '+format(rub,'RUB')+' ₽';
      else el.textContent='от '+format(rub*rates[selected],selected)+' '+symbols[selected];
    });
    converted.forEach(el=>{
      const rub=Number(el.dataset.converted);
      el.textContent=selected==='RUB'?'':'≈ '+format(rub*rates[selected],selected)+' '+symbols[selected];
    });
  }

  buttons.forEach(btn=>btn.addEventListener('click',()=>{
    selected=btn.dataset.currency;
    buttons.forEach(b=>b.classList.toggle('active',b===btn));
    render();
  }));

  render();
})();
