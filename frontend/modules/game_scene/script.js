import { openApp } from '../../js/main.js';

export function init() {
    // 返回桌面
    document.getElementById('btn-back-desktop').addEventListener('click', () => {
        if (window.System && window.System.closeApp) {
            window.System.closeApp();
        }
    });

    // 点击进入第一章
    document.getElementById('chapter-1').addEventListener('click', () => {
        // 检查玩家是否已经选择了角色
        if (!window.System.getCurrentCharacter()) {
            alert('请先在桌面的【角色档案】中创建并选择一个角色！');
            return;
        }
        // 打开真正的游戏剧情界面
        openApp('scene_explore');
    });
}

export function destroy() {
    // 退出时清理
}
