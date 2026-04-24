export async function show(params) {
    return new Promise(async (resolve) => {
        // 1. 动态加载 CSS
        if (!document.getElementById('style-shopping-list')) {
            const link = document.createElement('link');
            link.id = 'style-shopping-list';
            link.rel = 'stylesheet';
            link.href = './modules/items/shopping_list/list.css';
            document.head.appendChild(link);
        }

        // 2. 获取 HTML 模板
        const response = await fetch('./modules/items/shopping_list/list.html');
        const html = await response.text();

        // 3. 准备模态框容器 (复用 letter 的容器逻辑)
        let modal = document.getElementById('common-modal-overlay');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'common-modal-overlay';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        // 4. 注入并显示
        modal.innerHTML = html;
        modal.classList.add('active');

                // --- 新增：标记已查看清单 ---
        import('../../../js/store.js').then(module => {
            const store = module.default;
            store.set('has_viewed_list', true);
            
            // 检查是否可以解锁地图
            if (store.get('has_viewed_ticket')) {
                store.set('is_map_unlocked', true);
            }
        });

        // 5. 绑定关闭事件
        document.getElementById('btn-close-list').onclick = () => {
            modal.classList.remove('active');
            resolve(); 
        };
    });
}
