// 角色档案模块
// 数据存储 key
const STORAGE_KEY = 'hogwarts_characters';

// 全局状态
let currentEditId = null;  // 当前编辑的角色ID，null表示新建
let pendingDeleteId = null; // 待删除的角色ID

// ==================== 工具函数 ====================

// 获取所有角色
function getCharacters() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// 保存所有角色
function saveCharacters(characters) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 获取单个角色
function getCharacter(id) {
    const characters = getCharacters();
    return characters.find(c => c.id === id);
}

// 保存或更新角色
function saveCharacter(characterData) {
    const characters = getCharacters();
    
    if (characterData.id) {
        // 更新
        const index = characters.findIndex(c => c.id === characterData.id);
        if (index !== -1) {
            characters[index] = characterData;
        }
    } else {
        // 新建
        characterData.id = generateId();
        characterData.createdAt = new Date().toISOString();
        characters.push(characterData);
    }
    
    saveCharacters(characters);
    return characterData;
}

// 删除角色
function deleteCharacter(id) {
    const characters = getCharacters();
    const filtered = characters.filter(c => c.id !== id);
    saveCharacters(filtered);
}

// ==================== UI 渲染 ====================

// 渲染角色列表
function renderCharacterList() {
    const container = document.getElementById('character-list');
    if (!container) return;
    
    const characters = getCharacters();
    
    if (characters.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无角色，点击右上角 + 创建</div>';
        return;
    }
    
    container.innerHTML = characters.map(char => `
        <div class="character-card" data-id="${char.id}">
            <div class="character-card-header">
                <span class="character-name">${escapeHtml(char.name || '未命名')}</span>
                <span class="character-gender">${char.gender || '未设置'}</span>
            </div>
            <div class="character-info-row">
                ${char.birthday ? `<span class="character-info-item">🎂 ${char.birthday}</span>` : ''}
                ${char.bloodline ? `<span class="character-bloodline">${char.bloodline}</span>` : ''}
            </div>
            <div class="character-preview">
                ${char.appearance ? '👤 ' + escapeHtml(char.appearance.substring(0, 30)) + (char.appearance.length > 30 ? '...' : '') : '暂无外貌描述'}
            </div>
            <div class="card-actions">
                <button class="card-btn card-btn-edit" data-action="edit" data-id="${char.id}">✏️ 编辑</button>
                <button class="card-btn card-btn-delete" data-action="delete" data-id="${char.id}">🗑️ 删除</button>
            </div>
        </div>
    `).join('');
    
    // 绑定卡片点击事件（点击卡片主体进入编辑）
    document.querySelectorAll('.character-card').forEach(card => {
        const cardId = card.dataset.id;
        card.addEventListener('click', (e) => {
            // 如果点击的是按钮区域，不触发展开
            if (e.target.closest('.card-actions')) return;
            openEditView(cardId);
        });
    });
    
    // 绑定编辑按钮
    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            openEditView(id);
        });
    });
    
    // 绑定删除按钮
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            showDeleteConfirm(id);
        });
    });
}

// 打开编辑视图
function openEditView(id = null) {
    currentEditId = id;
    const isEditMode = id !== null;
    
    // 更新标题
    const titleEl = document.getElementById('edit-view-title');
    if (titleEl) {
        titleEl.textContent = isEditMode ? '编辑角色' : '新建角色';
    }
    
    // 显示/隐藏删除按钮区域
    const deleteZone = document.getElementById('delete-zone');
    if (deleteZone) {
        deleteZone.style.display = isEditMode ? 'block' : 'none';
    }
    
    // 如果是编辑模式，加载数据
    if (isEditMode) {
        const character = getCharacter(id);
        if (character) {
            document.getElementById('char-name').value = character.name || '';
            document.getElementById('char-gender').value = character.gender || '';
            document.getElementById('char-birthday').value = character.birthday || '';
            document.getElementById('char-bloodline').value = character.bloodline || '';
            document.getElementById('char-appearance').value = character.appearance || '';
            document.getElementById('char-personality').value = character.personality || '';
            document.getElementById('char-family').value = character.family || '';
        }
    } else {
        // 清空表单
        document.getElementById('char-name').value = '';
        document.getElementById('char-gender').value = '';
        document.getElementById('char-birthday').value = '';
        document.getElementById('char-bloodline').value = '';
        document.getElementById('char-appearance').value = '';
        document.getElementById('char-personality').value = '';
        document.getElementById('char-family').value = '';
    }
    
    // 切换视图
    switchView('edit');
}

// 保存角色
function handleSave() {
    const name = document.getElementById('char-name').value.trim();
    
    if (!name) {
        alert('请填写角色名字');
        return;
    }
    
    const characterData = {
        id: currentEditId,
        name: name,
        gender: document.getElementById('char-gender').value,
        birthday: document.getElementById('char-birthday').value,
        bloodline: document.getElementById('char-bloodline').value,
        appearance: document.getElementById('char-appearance').value,
        personality: document.getElementById('char-personality').value,
        family: document.getElementById('char-family').value,
        updatedAt: new Date().toISOString()
    };
    
    saveCharacter(characterData);
    alert(currentEditId ? '角色已更新' : '角色已创建');
    
    // 返回列表并刷新
    switchView('list');
    renderCharacterList();
}

// 执行删除
function performDelete() {
    if (pendingDeleteId) {
        deleteCharacter(pendingDeleteId);
        closeDeleteModal();
        renderCharacterList();
        alert('角色已删除');
        pendingDeleteId = null;
    }
}

// 显示删除确认弹窗
function showDeleteConfirm(id) {
    const character = getCharacter(id);
    if (!character) return;
    
    pendingDeleteId = id;
    const nameSpan = document.getElementById('delete-char-name');
    if (nameSpan) {
        nameSpan.textContent = character.name || '未命名';
    }
    
    const modal = document.getElementById('delete-confirm-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

// 关闭删除弹窗
window.closeDeleteModal = function() {
    const modal = document.getElementById('delete-confirm-modal');
    if (modal) {
        modal.classList.remove('active');
    }
    pendingDeleteId = null;
};

// 切换视图（list / edit）
function switchView(view) {
    const listView = document.getElementById('character-main-view');
    const editView = document.getElementById('character-edit-view');
    
    if (view === 'list') {
        if (listView) listView.classList.add('active');
        if (editView) editView.classList.remove('active');
    } else {
        if (listView) listView.classList.remove('active');
        if (editView) editView.classList.add('active');
    }
}

// 返回主界面（关闭整个APP）
function backToDesktop() {
    if (window.System && typeof window.System.closeApp === 'function') {
        window.System.closeApp();
    }
}

// HTML转义
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ==================== 初始化 ====================

export function init() {
    console.log('[CharacterProfile] 初始化角色档案模块');
    
    // 确保DOM元素存在后再绑定事件
    setTimeout(() => {
        // 绑定返回桌面按钮
        const backBtn = document.getElementById('btn-back-main');
        if (backBtn) {
            backBtn.addEventListener('click', backToDesktop);
        }
        
        // 绑定新建按钮
        const newBtn = document.getElementById('btn-new-character');
        if (newBtn) {
            newBtn.addEventListener('click', () => openEditView(null));
        }
        
        // 绑定编辑视图的返回按钮
        const editBackBtn = document.getElementById('btn-edit-back');
        if (editBackBtn) {
            editBackBtn.addEventListener('click', () => switchView('list'));
        }
        
        // 绑定保存按钮
        const saveBtn = document.getElementById('btn-save-character');
        if (saveBtn) {
            saveBtn.addEventListener('click', handleSave);
        }
        
        // 绑定删除按钮
        const deleteBtn = document.getElementById('btn-delete-character');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (currentEditId) {
                    showDeleteConfirm(currentEditId);
                }
            });
        }
        
        // 绑定确认删除按钮
        const confirmDeleteBtn = document.getElementById('btn-confirm-delete');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                performDelete();
                // 删除后如果当前在编辑界面，返回列表
                if (currentEditId) {
                    switchView('list');
                    currentEditId = null;
                }
            });
        }
        
        // 渲染角色列表
        renderCharacterList();
    }, 0);
}

export function destroy() {
    console.log('[CharacterProfile] 销毁角色档案模块');
    // 清理全局状态
    currentEditId = null;
    pendingDeleteId = null;
}
