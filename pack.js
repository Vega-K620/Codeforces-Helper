const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const version = pkg.version || '1.0.1';

const releaseDir = path.join(rootDir, 'release');
const outDir = path.join(releaseDir, 'CodeforcesHelper-win32-x64');
const appDir = path.join(outDir, 'resources', 'app');
const zipName = `CodeforcesHelper-v${version}-win64.zip`;
const zipPath = path.join(releaseDir, zipName);

console.log('========================================================');
console.log(`  正在打包 Codeforces Helper v${version} 绿色免安装客户端...`);
console.log('========================================================');

// 1. Stop any running packaged CodeforcesHelper.exe so files aren't locked
try {
  execSync('taskkill /F /IM CodeforcesHelper.exe >nul 2>&1', { stdio: 'ignore' });
} catch (_e) {
  // Ignore if not running
}

// 2. Clean previous output directory
if (fs.existsSync(outDir)) {
  console.log('[1/4] 正在清理旧的免安装目录...');
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

// 3. Copy Electron runtime
const electronDist = path.join(rootDir, 'node_modules', 'electron', 'dist');
if (!fs.existsSync(electronDist)) {
  console.error('❌ 未找到 node_modules\\electron\\dist，请先执行 npm install');
  process.exit(1);
}

console.log('[2/4] 正在复制 Electron 运行时环境...');
fs.cpSync(electronDist, outDir, { recursive: true, force: true });

const oldExe = path.join(outDir, 'electron.exe');
const newExe = path.join(outDir, 'CodeforcesHelper.exe');
if (fs.existsSync(oldExe)) {
  fs.renameSync(oldExe, newExe);
}

const defaultAsar = path.join(outDir, 'resources', 'default_app.asar');
if (fs.existsSync(defaultAsar)) {
  fs.rmSync(defaultAsar, { force: true });
}

// 4. Copy application source & echarts
console.log('[3/4] 正在写入应用源码与图表引擎 (v' + version + ')...');
const echartsTargetDir = path.join(appDir, 'node_modules', 'echarts', 'dist');
fs.mkdirSync(echartsTargetDir, { recursive: true });

const rootFiles = ['package.json', 'main.js', 'preload.js', 'LICENSE', 'README.md'];
for (const file of rootFiles) {
  const srcFile = path.join(rootDir, file);
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, path.join(appDir, file));
  }
}

fs.cpSync(path.join(rootDir, 'src'), path.join(appDir, 'src'), {
  recursive: true,
  force: true
});

const echartsSrc = path.join(rootDir, 'node_modules', 'echarts', 'dist', 'echarts.min.js');
if (fs.existsSync(echartsSrc)) {
  fs.copyFileSync(echartsSrc, path.join(echartsTargetDir, 'echarts.min.js'));
}

// 5. Create GitHub Release zip archive
console.log(`[4/4] 正在生成 GitHub Release 压缩包: ${zipName} ...`);
if (fs.existsSync(zipPath)) {
  fs.rmSync(zipPath, { force: true });
}

execSync(
  `powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '${outDir}' -DestinationPath '${zipPath}' -CompressionLevel Optimal"`,
  { stdio: 'inherit' }
);

console.log('');
console.log('========================================================');
console.log(`  ✅ 打包完成！(版本: v${version})`);
console.log(`  1. 免安装目录: release\\CodeforcesHelper-win32-x64\\CodeforcesHelper.exe`);
console.log(`  2. Release 压缩包: release\\${zipName}`);
console.log('========================================================');
