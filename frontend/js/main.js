// 修改后的 js/main.js
// ==========================================
// 系统核心：APP 动态加载器 (App Loader)
// ==========================================

// 导入角色管理模块
import { 
    initCharacterSystem, 
    updateCharacterDisplay, 
    selectCharacter, 
    getCurrentCharacter 
} from './character.js';

const desktop = document.getElementById('desktop');
const appContainer = document.getElementById('app-container');
let currentAppInstance = null; 

/**
 * 封装一个加载 CSS 的函数
 */
function loadCSS(href, id) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        if (id) link.id = id;
        link.href = href;
        link.onload = () => resolve(); 
        link.onerror = () => reject(new Error(`CSS 加载失败: ${href}`));
        document.head.appendChild(link);
    });
}

/**
 * 核心：打开 APP
 */
export async function openApp(appName) {
    try {
        console.log(`[System] 正在启动应用: ${appName}...`);
        appContainer.classList.remove('show');
        
        const htmlPromise = fetch(`./modules/${appName}/index.html`, { cache: 'no-store' }).then(res => {
            if (!res.ok) throw new Error(`找不到应用 ${appName} 的 HTML 文件`);
            return res.text();
        });
        
        const cssUrl = `./modules/${appName}/style.css?t=${Date.now()}`;
        const cssPromise = loadCSS(cssUrl, 'current-app-css');

        const [htmlText] = await Promise.all([htmlPromise, cssPromise]);

        appContainer.innerHTML = htmlText;
        desktop.style.display = 'none';
        appContainer.classList.remove('hidden');

        requestAnimationFrame(() => {
            appContainer.classList.add('show');
        });

        try {
            const appModule = await import(`../modules/${appName}/script.js`);
            if (appModule && typeof appModule.init === 'function') {
                appModule.init(); 
                currentAppInstance = appModule; 
            }
        } catch (jsError) {
            console.warn(`[System] 应用 ${appName} 没有独立 script.js 或加载失败。`, jsError);
        }

    } catch (error) {
        console.error(`[System] 启动应用 ${appName} 失败:`, error);
        alert(`应用 ${appName} 加载失败`);
        closeApp(); 
    }
}

/**
 * 核心：关闭当前 APP
 */
export function closeApp() {
    console.log('[System] 正在关闭当前应用，返回桌面...');
    appContainer.classList.remove('show');
    appContainer.innerHTML = '';

    const currentCss = document.getElementById('current-app-css');
    if (currentCss) currentCss.remove();

    if (currentAppInstance && typeof currentAppInstance.destroy === 'function') {
        currentAppInstance.destroy();
    }
    currentAppInstance = null;

    appContainer.classList.add('hidden');
    desktop.style.display = '';
    
    // 刷新角色展示（从 character.js 导入）
    updateCharacterDisplay();
}

// ==========================================
// 系统初始化事件绑定
// ==========================================
function initSystem() {
    // 1. 自动为桌面上带有 data-app 属性的图标绑定点击事件
    const menuItems = document.querySelectorAll('.menu-item, .parchment-btn');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
           const moduleName = item.getAttribute('data-app');
            if (moduleName) {
                openApp(moduleName);
            }
        });
    });
    
    // 2. 初始化角色管理系统
    initCharacterSystem();
    
    // 3. 挂载全局 System 对象，方便子模块调用
    window.System = { 
        closeApp, 
        selectCharacter: (char) => selectCharacter(char), 
        getCurrentCharacter: () => getCurrentCharacter() 
    };
    window.System.store = window.System.store || {};

    console.log('[System] 魔法契约已激活... 📜');
}

// 启动系统
initSystem();
