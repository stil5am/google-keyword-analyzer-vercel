const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

module.exports = async (req, res) => {
  try {
    const { keyword: rawKeyword } = req.body || {};
    const keyword = (rawKeyword || '').replace(/\s/g, '');

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless
    });

    const page = await browser.newPage();
    const url = `https://www.google.com/search?q=site:blog.naver.com+${encodeURIComponent(keyword)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const contentText = await page.$eval('#result-stats', el => el.textContent || '');
    const match = contentText.replace(/[\s,]/g, '').match(/약?(\d+)/);
    const contentCount = match?.[1] ? parseInt(match[1], 10) : 0;

    await browser.close();

    res.status(200).json({
      keyword,
      contentCount,
      competition: Math.min(1, contentCount / 1000000).toFixed(2),
      saturation: Math.min(100, Math.floor(contentCount / 10000))
    });
  } catch (e) {
    console.error('분석 오류:', e);
    res.status(500).json({ error: '분석 실패' });
  }
};
