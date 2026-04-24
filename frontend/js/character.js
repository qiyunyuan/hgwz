/**
 * character.js - 角色管理模块
 * 负责角色的加载、选择、保存以及相关的 UI 更新
 */

// 内部状态：当前选中的角色
let currentSelectedCharacter = null;

/**
 * 获取所有已创建的角色（从 localStorage）
 */
export function getCharacters() {
    const STORAGE_KEY = 'hogwarts_characters';
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

/**
 * 保存当前选中的角色到本地存储
 */
export function saveSelectedCharacter(character) {
    if (character) {
        localStorage.setItem('selected_character', JSON.stringify(character));
        currentSelectedCharacter = character;
    } else {
        localStorage.removeItem('selected_character');
        currentSelectedCharacter = null;
    }
}

/**
 * 从本地存储加载当前选中的角色
 */
export function loadSelectedCharacter() {
    const saved = localStorage.getItem('selected_character');
    if (saved) {
        try {
            currentSelectedCharacter = JSON.parse(saved);
        } catch (e) {
            currentSelectedCharacter = null;
        }
    } else {
        currentSelectedCharacter = null;
    }
    updateCharacterDisplay();
}

/**
 * 更新桌面小卡片上的角色展示
 */
export function updateCharacterDisplay() {
    const nameEl = document.getElementById('current-char-name');
    const hintEl = document.querySelector('.mini-hint');
    const avatarEl = document.querySelector('.mini-avatar');
    
    if (!nameEl) return;
    
    if (currentSelectedCharacter && currentSelectedCharacter.name) {
        nameEl.textContent = currentSelectedCharacter.name;
        if (hintEl) hintEl.textContent = '点击切换角色';
        if (avatarEl) {
            const gender = currentSelectedCharacter.gender;
            if (gender === '男') avatarEl.textContent = '🧙‍♂️';
            else if (gender === '女') avatarEl.textContent = '🧙‍♀️';
            else avatarEl.textContent = '✨';
        }
    } else {
        nameEl.textContent = '未选择角色';
        if (hintEl) hintEl.textContent = '点击选择角色';
        if (avatarEl) avatarEl.textContent = '✨';
    }
}

/**
 * 显示角色选择弹窗
 */
export function showCharacterSelectModal() {
    const modal = document.getElementById('character-select-modal');
    const listContainer = document.getElementById('character-select-list');
    
    if (!modal || !listContainer) return;
    
    const characters = getCharacters();
    
    if (characters.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-characters">
                <p>📭 暂无角色</p>
                <p style="font-size: 12px; margin-top: 10px;">请先到「角色档案」中创建角色</p>
            </div>
        `;
    } else {
        listContainer.innerHTML = characters.map(char => `
            <div class="select-character-item" data-id="${char.id}">
                <div class="select-avatar">
                    ${char.gender === '男' ? '🧙‍♂️' : (char.gender === '女' ? '🧙‍♀️' : '✨')}
                </div>
                <div class="select-info">
                    <div class="select-name">${escapeHtml(char.name)}</div>
                    <div class="select-detail">
                        ${char.gender ? `<span>${char.gender}</span>` : ''}
                        ${char.bloodline ? `<span class="select-badge">${char.bloodline}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        // 绑定点击事件
        listContainer.querySelectorAll('.select-character-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                const character = characters.find(c => c.id === id);
                if (character) {
                    selectCharacter(character);
                    closeCharacterSelectModal();
                }
            });
        });
    }
    
    modal.classList.add('active');
}

/**
 * 执行角色选择逻辑
 */
export function selectCharacter(character) {
    saveSelectedCharacter(character);
    updateCharacterDisplay();
    console.log('[System] 已选择角色:', character.name);
    
    // 触发自定义事件，通知其他模块（如游戏场景）角色已切换
    window.dispatchEvent(new CustomEvent('characterChanged', { detail: character }));
}

/**
 * 关闭角色选择弹窗
 */
export function closeCharacterSelectModal() {
    const modal = document.getElementById('character-select-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * 获取当前选中的角色对象（供外部调用）
 */
export function getCurrentCharacter() {
    return currentSelectedCharacter;
}

/**
 * 初始化角色系统的事件监听
 */
export function initCharacterSystem() {
    // 1. 绑定角色选择卡点击事件
    const characterCard = document.getElementById('character-card-mini');
    if (characterCard) {
        characterCard.addEventListener('click', showCharacterSelectModal);
    }
    
    // 2. 绑定弹窗关闭按钮
    const closeBtn = document.getElementById('close-select-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeCharacterSelectModal);
    }
    
    const cancelBtn = document.getElementById('btn-cancel-select');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeCharacterSelectModal);
    }
    
    // 3. 点击弹窗背景关闭
    const modal = document.getElementById('character-select-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCharacterSelectModal();
            }
        });
    }
    
    // 4. 加载已保存的角色
    loadSelectedCharacter();
    
    // 5. 监听 storage 事件（处理多标签页同步或角色档案删除后的同步）
    window.addEventListener('storage', (e) => {
        if (e.key === 'hogwarts_characters') {
            const characters = getCharacters();
            if (currentSelectedCharacter && !characters.find(c => c.id === currentSelectedCharacter.id)) {
                saveSelectedCharacter(null);
                updateCharacterDisplay();
            }
        }
    });
}

/**
 * 内部辅助：HTML 转义，防止 XSS
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
