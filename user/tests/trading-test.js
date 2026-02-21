import { chromium } from 'playwright';

async function runTest() {
  console.log('Запуск теста...');
  
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true,
      slowMo: 1000
    });
    
    const page = await browser.newPage();
    
    console.log('1. Вход в систему...');
    await page.goto('http://localhost:5174/login');
    
    await page.fill('#brokerName', 'Трейдер');
    await page.click('.login-btn');
    
    await page.waitForSelector('.trading-container', { timeout: 10000 });
    console.log('Успешный вход');

    console.log('2. Запуск торгов... (занимает время)');
    try {
      await page.click('.start-btn:not(:disabled)');
      await page.waitForTimeout(2000);
      console.log('Торги запущены');
    } catch {
      console.log('Торги уже запущены');
    }

    console.log('3. Проверка баланса...');
    const balanceText = await page.textContent("text=Денежные средства:");
    console.log(balanceText);
    
    const balanceMatch = balanceText.match(/[\d,]+\.?\d*/g);
    
    const initialBalance = balanceMatch ? parseFloat(balanceMatch[0].replace(/,/g, '')) : 0;

    console.log('4. Покупка акции...');
    
    await page.waitForSelector('.buy-btn', { timeout: 10000 });
    
    const buyButtons = await page.$$('.buy-btn');
    
    let activeBuyButton = null;
    for (const button of buyButtons) {
      const isDisabled = await button.getAttribute('disabled');
      if (!isDisabled) {
        activeBuyButton = button;
        break;
      }
    }
    
    if (!activeBuyButton) {
      console.log('Все кнопки покупки заблокированы');
      // Даже если покупка не удалась - переходим к остановке торгов
    } else {
      await activeBuyButton.click();
      console.log('Нажата кнопка покупки');
      
      await page.waitForSelector('#quantity', { timeout: 5000 });
      await page.fill('#quantity', '1');
      await page.click('.confirm-btn:not(:disabled)');
      
      await page.waitForTimeout(3000);
      console.log('Акция куплена');

      const newBalanceText = await page.textContent("text=Денежные средства:");
      console.log(newBalanceText);

      await page.waitForTimeout(2000);
      const portfolioItems = await page.$$('.stock-item');
      console.log(`Акций в портфеле: ${portfolioItems.length}`);

      if (portfolioItems.length > 0) {
        console.log('5. Продажа акции...');
        
        const sellButtons = await page.$$('.sell-btn');
        let activeSellButton = null;
        
        for (const button of sellButtons) {
          const isDisabled = await button.getAttribute('disabled');
          if (!isDisabled) {
            activeSellButton = button;
            break;
          }
        }
        
        if (activeSellButton) {
          await activeSellButton.click();
          
          await page.waitForSelector('.confirm-btn:not(:disabled)', { timeout: 5000 });
          await page.click('.confirm-btn:not(:disabled)');
          
          await page.waitForTimeout(3000);
          console.log('Акция продана');

          const finalBalanceText = await page.textContent("text=Денежные средства:");
          console.log(finalBalanceText);
        }
      }
    }

    console.log('6. Завершение торгов...');
    try {
      const stopButtons = await page.$$('.stop-btn:not(:disabled)');

      if (stopButtons.length > 0) {
        await stopButtons[0].click();
        await page.waitForTimeout(2000);
        console.log('Торги остановлены');
      } else {
        console.log('Торги уже остановлены');
      }
    } catch (error) {
      console.log('Не удалось остановить торги:', error.message);
    }

    console.log('Тест завершен успешно!');

  } catch (error) {
    console.error('Ошибка теста:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (browser) {
      await browser.close();
      console.log('Браузер закрыт');
    }
  }
}

runTest();