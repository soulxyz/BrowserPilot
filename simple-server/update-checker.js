/**
 * 更新检查模块
 * 在服务器启动时异步检查 GitHub Releases 是否有新版本
 */

const https = require('https');

/**
 * 比较语义化版本号
 * @param {string} v1 - 版本1（如 "1.2.0"）
 * @param {string} v2 - 版本2（如 "1.1.0"）
 * @returns {number} 1 表示 v1 > v2, -1 表示 v1 < v2, 0 表示相等
 */
function compareVersions(v1, v2) {
  // 移除开头的 'v'
  v1 = v1.replace(/^v/, '');
  v2 = v2.replace(/^v/, '');
  
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  
  return 0;
}

/**
 * 从 GitHub API 获取最新 Release 信息
 * @param {string} repoUrl - GitHub 仓库地址（如 "https://github.com/user/repo"）
 * @returns {Promise<Object>} Release 信息
 */
function fetchLatestRelease(repoUrl) {
  return new Promise((resolve, reject) => {
    try {
      // 从仓库 URL 提取 owner/repo
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        return reject(new Error('无效的 GitHub 仓库地址'));
      }
      
      const [, owner, repo] = match;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
      
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${owner}/${repo}/releases/latest`,
        method: 'GET',
        headers: {
          'User-Agent': 'MCP-Browser-Control-Update-Checker',
          'Accept': 'application/vnd.github.v3+json'
        },
        timeout: 5000 // 5秒超时
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const release = JSON.parse(data);
              resolve(release);
            } catch (e) {
              reject(new Error('解析 Release 信息失败'));
            }
          } else if (res.statusCode === 404) {
            reject(new Error('未找到 Release（可能仓库未发布）'));
          } else {
            reject(new Error(`GitHub API 返回 ${res.statusCode}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error(`网络请求失败: ${error.message}`));
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('请求超时'));
      });
      
      req.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 检查是否有新版本
 * @param {string} currentVersion - 当前版本（如 "1.1.0"）
 * @param {string} repoUrl - GitHub 仓库地址
 * @param {Function} log - 日志函数
 * @returns {Promise<Object|null>} 如果有更新返回更新信息，否则返回 null
 */
async function checkForUpdates(currentVersion, repoUrl, log = console.log) {
  try {
    log('正在检查更新...');
    
    const release = await fetchLatestRelease(repoUrl);
    const latestVersion = release.tag_name || release.name;
    
    if (!latestVersion) {
      log('无法获取最新版本号');
      return null;
    }
    
    log(`当前版本: ${currentVersion}, 最新版本: ${latestVersion}`);
    
    // 比较版本
    if (compareVersions(latestVersion, currentVersion) > 0) {
      // 找到 Windows 可执行文件
      let downloadUrl = release.html_url; // 默认跳转到 Release 页面
      const winAsset = release.assets?.find(asset => 
        asset.name.includes('Win') || asset.name.endsWith('.exe')
      );
      
      if (winAsset) {
        downloadUrl = winAsset.browser_download_url;
      }
      
      const updateInfo = {
        hasUpdate: true,
        currentVersion,
        latestVersion,
        releaseTitle: release.name || `版本 ${latestVersion}`,
        releaseUrl: release.html_url,
        downloadUrl,
        releaseNotes: release.body || '暂无更新说明',
        publishedAt: release.published_at
      };
      
      log(`🎉 发现新版本: ${latestVersion}`);
      return updateInfo;
    } else {
      log('✓ 已是最新版本');
      return null;
    }
    
  } catch (error) {
    log(`检查更新失败: ${error.message}`);
    return null;
  }
}

module.exports = {
  checkForUpdates,
  compareVersions
};

