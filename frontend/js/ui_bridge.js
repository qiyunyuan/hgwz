/**
 * UI Bridge: 负责动态加载并显示独立的 UI 模块
 */
export const UIBridge = {
    // 显示特定道具
    async showItem(itemId, params = {}) {
        console.log(`[UIBridge] Loading item: ${itemId}`);
        try {
            // 动态导入对应的 JS 模块
            const module = await import(`../modules/items/${itemId}/letter.js`);
            // 调用模块的 show 方法
            return await module.show(params);
        } catch (err) {
            console.error(`[UIBridge] Failed to load item module: ${itemId}`, err);
        }
    },
    
    // 可以在这里扩展其他通用 UI 逻辑，比如 showToast, showConfirm 等
};
