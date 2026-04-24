import store from '../../js/store.js';

let overlay = null;
let isRendering = false;

export async function show() {
    // 如果正在加载中，直接返回，避免重复触发
    if (isRendering) return;
    
    if (!overlay) {
        await render();
    }
    
    if (overlay) {
        document.getElementById('app-container').appendChild(overlay);
        setTimeout(() => overlay.classList.add('show'), 10);
    }
}

async function render() {
    isRendering = true; // 加锁
    try {
        // 加载 CSS (保持不变)
        if (!document.getElementById('inventory-style')) {
            const link = document.createElement('link');
            link.id = 'inventory-style';
            link.rel = 'stylesheet';
            link.href = './modules/inventory/style.css';
            document.head.appendChild(link);
        }
        const response = await fetch('./modules/inventory/index.html');
        const htmlText = await response.text();
        
        // 使用局部变量 tempDiv，不要直接操作全局的 overlay
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlText;
        
        const newOverlay = tempDiv.querySelector('#inventory-overlay'); // 精确获取
        
        if (!newOverlay) {
            console.error("未能找到 #inventory-overlay 元素，请检查 index.html 结构");
            return;
        }
        // 在局部变量上绑定事件
        newOverlay.querySelector('#close-inventory').onclick = hide;
        
        // 赋值给全局变量
        overlay = newOverlay;
        
        refreshList();
    } catch (err) {
        console.error("渲染背包失败:", err);
    } finally {
        isRendering = false; // 解锁
    }
}

export function refreshList() {
    if (!overlay) return;
    const grid = overlay.querySelector('#inventory-grid');
    if (!grid) return;
    
    const items = store.get('inventory') || [];
    grid.innerHTML = '';
    items.slice(0, 3).forEach(item => {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        slot.innerHTML = `
            <span class="item-icon">${item.icon}</span>
            <span class="item-name">${item.name}</span>
        `;
        slot.onclick = () => selectItem(item, slot);
        grid.appendChild(slot);
    });
}

function selectItem(item, slotElement) {
    if (!overlay) return;
    const detailPanel = overlay.querySelector('#item-detail');
    overlay.querySelectorAll('.inventory-slot').forEach(s => s.classList.remove('active'));
    slotElement.classList.add('active');

    overlay.querySelector('#detail-name').textContent = item.name;
    overlay.querySelector('#detail-desc').textContent = item.description;
    detailPanel.style.display = 'block';

    // 核心：点击“查看详情”按钮
    overlay.querySelector('#btn-use-item').onclick = async () => {
        if (item.id === 'hogwarts_letter') {
            hide(); // 先关掉背包，增加沉浸感
            // 动态导入信件插件
            const letterModule = await import('../items/hogwarts_letter/letter.js');
            letterModule.show({ name: '哈利' }); // 这里可以从 store 获取玩家名
        } 
        // --- 新增逻辑 ---
        else if (item.id === 'shopping_list') {
            hide(); // 关掉背包
            const listModule = await import('../items/shopping_list/list.js');
            listModule.show(); 
        } 
        // --- 新增：处理车票点击 ---
        else if (item.id === 'train_ticket') {
            hide();
            const ticketModule = await import('../items/train_ticket/ticket.js');
            ticketModule.show();
        }
        else {
            alert(`你查看了 ${item.name}`);
        }
    };
}

export function hide() {
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
        }, 300);
    }
}