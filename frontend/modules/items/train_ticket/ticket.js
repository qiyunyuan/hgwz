// modules/items/train_ticket/ticket.js
import store from '../../../js/store.js';

export async function show() {
    return new Promise(async (resolve) => {
        // 1. 加载 CSS
        if (!document.getElementById('style-train-ticket')) {
            const link = document.createElement('link');
            link.id = 'style-train-ticket';
            link.rel = 'stylesheet';
            link.href = './modules/items/train_ticket/ticket.css';
            document.head.appendChild(link);
        }

        // 2. 获取 HTML
        const response = await fetch('./modules/items/train_ticket/ticket.html');
        const html = await response.text();

        // 3. 准备模态框
        let modal = document.getElementById('common-modal-overlay');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'common-modal-overlay';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = html;
        modal.classList.add('active');

        // 4. 核心逻辑：标记“已查看车票”
        store.set('has_viewed_ticket', true);
        checkUnlockProgress();

        // 5. 绑定关闭
        document.getElementById('btn-close-ticket').onclick = () => {
            modal.classList.remove('active');
            resolve();
        };
    });
}

// 检查是否满足解锁地图的条件
function checkUnlockProgress() {
    const viewedList = store.get('has_viewed_list');
    const viewedTicket = store.get('has_viewed_ticket');
    
    if (viewedList && viewedTicket) {
        console.log("[Event] 🎊 清单和车票都看过了，准备解锁地图功能！");
        store.set('is_map_unlocked', true);
    }
}
