// Bắt lỗi làm TRẮNG TRANG: dựng app.jsx y như browser (engine.js + data.js + app.jsx
// cùng một scope script) rồi render một lần. Chạy trước khi quay demo.
//   node eval/smoke.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const https = require('https');

const M = path.join(__dirname, '..', 'mockup');
const CACHE = path.join(__dirname, '.cache');
const CDN = {
  'babel.js': 'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.26.2/babel.min.js',
  'react.js': 'https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js',
  'react-dom-server.js':
    'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom-server-legacy.browser.production.min.js',
};

const get = (url, file) =>
  new Promise((res, rej) =>
    https.get(url, (r) => {
      const out = fs.createWriteStream(file);
      r.pipe(out);
      out.on('finish', () => out.close(res));
      r.on('error', rej);
    })
  );

(async () => {
  fs.mkdirSync(CACHE, { recursive: true });
  for (const [f, url] of Object.entries(CDN)) {
    const p = path.join(CACHE, f);
    if (!fs.existsSync(p)) {
      process.stdout.write(`tải ${f}… `);
      await get(url, p);
      console.log('xong');
    }
  }

  const Babel = require(path.join(CACHE, 'babel.js'));
  const ctx = {
    console, setTimeout, clearInterval, setInterval, Date, URL, JSON, Math, Object, Array,
    String, Boolean, Number, Error, Promise, RegExp, TextEncoder, TextDecoder, Uint8Array,
    Map, Set, Symbol,
    document: { getElementById: () => ({}), createElement: () => ({ click() {} }) },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  };
  ctx.self = ctx.window = ctx.global = ctx.globalThis = ctx;
  vm.createContext(ctx);

  try {
    vm.runInContext(fs.readFileSync(path.join(CACHE, 'react.js'), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(CACHE, 'react-dom-server.js'), 'utf8'), ctx);
    // đúng thứ tự thẻ <script> trong index.html — cùng một scope, nên trùng tên biến là chết
    vm.runInContext(fs.readFileSync(path.join(M, 'engine.js'), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(M, 'data.js'), 'utf8'), ctx);
    const jsx = fs.readFileSync(path.join(M, 'app.jsx'), 'utf8');
    const code = Babel.transform(jsx, { presets: ['react'] }).code.replace(
      /ReactDOM\.createRoot[\s\S]*/,
      ''
    );
    vm.runInContext(code, ctx);
    const html = vm.runInContext('ReactDOMServer.renderToString(React.createElement(App))', ctx);
    if (!html.includes('ColdBrew')) throw new Error('render ra nhưng không thấy tiêu đề ColdBrew');
    console.log(`\n✅ Trang dựng được (${html.length} ký tự HTML) — không trắng trang.`);
  } catch (e) {
    console.error('\n❌ TRANG SẼ TRẮNG:', e.message);
    process.exit(1);
  }
})();
