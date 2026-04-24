import store from '../../../js/store.js';

export async function show(params) {
    return new Promise(async (resolve) => {
        // 1. 动态加载 CSS (避免重复加载)
        if (!document.getElementById('style-hogwarts-letter')) {
            const link = document.createElement('link');
            link.id = 'style-hogwarts-letter';
            link.rel = 'stylesheet';
            link.href = './modules/items/hogwarts_letter/letter.css';
            document.head.appendChild(link);
        }

        // 2. 获取 HTML 模板
        const response = await fetch('./modules/items/hogwarts_letter/letter.html');
        const html = await response.text();

        // 3. 准备模态框容器
        let modal = document.getElementById('common-modal-overlay');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'common-modal-overlay';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        // 4. 注入内容并显示
        modal.innerHTML = html;
        modal.classList.add('active');

        // 5. 填充动态数据
        if (params.name) {
            document.getElementById('letter-name').textContent = params.name + ' 先生/女士';
        }

        // 6. 绑定关闭事件
        document.getElementById('btn-close-letter').onclick = () => {
            modal.classList.remove('active');
            // [添加] 阅读完信件后，解锁背包
            store.set('isInventoryUnlocked', true); 
            resolve(); // 告知调用者：信件已读完
        };
    });
}
