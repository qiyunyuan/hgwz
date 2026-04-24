import { openApp } from '../../js/main.js';
import { UIBridge } from '../../js/ui_bridge.js'; // 引入桥接器
import * as Inventory from '../inventory/script.js';
import store from '../../js/store.js';
let storyContainer, btnNext, btnReadLetter, timeStatus, locationStatus;
let currentStoryStep = 0;
let isGenerating = false;
let unsubscribeInventory;

export function init() {
    currentStoryStep = 0;
    isGenerating = false;

    storyContainer = document.getElementById('story-container');
    btnNext = document.getElementById('btn-next-story');
    btnReadLetter = document.getElementById('btn-read-letter');
    timeStatus = document.getElementById('time-status');
    locationStatus = document.getElementById('location-status');
    // 1. 返回功能
    document.getElementById('btn-back-chapter').addEventListener('click', () => {
        // 这里可以根据逻辑返回上一级，目前示例是跳回自己或主菜单
        openApp('game_scene'); 
    });
    // 2. 底部“设置”按钮
    document.getElementById('btn-settings').addEventListener('click', () => {
        openApp('system_setting');
    });
    // 3. 底部“属性”按钮
    document.getElementById('btn-attributes').addEventListener('click', () => {
        openApp('character_profile');
    });
    // 4. 行动按键：查看信件
    btnReadLetter.addEventListener('click', async () => {
        const character = window.System.getCurrentCharacter();
        await UIBridge.showItem('hogwarts_letter', { 
            name: character ? character.name : '未知巫师' 
        });
        if (currentStoryStep === 1) {
            btnNext.textContent = "准备前往对角巷";
            btnNext.style.display = 'block';
        }
    });
    
        // 5. 绑定背包按钮
    const btnInv = document.getElementById('btn-inventory');
    if (btnInv) {
        btnInv.addEventListener('click', () => {
            Inventory.show();
        });
    }

// 定义更新 UI 的函数
    const updateInventoryUI = (isUnlocked) => {
        if (btnInv) {
            btnInv.style.display = isUnlocked ? 'flex' : 'none';
        }
    };
    
// 绑定背包点击事件 (只绑定一次！)
    if (btnInv) {
        btnInv.onclick = () => {
            console.log("背包按钮被点击了"); // 添加日志方便调试
            if (typeof Inventory.show === 'function') {
                Inventory.show();
            } else {
                console.error("未能在 Inventory 模块中找到 show 方法");
            }
        };
    }
    // 订阅状态变化
    unsubscribeInventory = store.subscribe('isInventoryUnlocked', (val) => {
        updateInventoryUI(val);
    });
    
    // [添加] 检查当前初始状态（防止从其他页面回来时按钮消失）
    updateInventoryUI(store.get('isInventoryUnlocked'));
    if (btnInv) {
        btnInv.addEventListener('click', () => {
            Inventory.show();
        });
    }

    btnNext.addEventListener('click', handleNextStory);
    setTimeout(() => {
        triggerAIStory('receive_letter');
    }, 500);
}

function handleNextStory() {
    if (isGenerating) return;
    
    if (currentStoryStep === 1) {
        // 触发前往对角巷的剧情
        timeStatus.textContent = "1991年7月 下午";
        locationStatus.textContent = "伦敦街道";
        btnReadLetter.style.display = 'none';
        btnNext.style.display = 'none';
        
        // 界面上加个分隔线
        const divider = document.createElement('hr');
        divider.style.margin = '20px 0';
        divider.style.border = 'none';
        divider.style.borderTop = '1px dashed #bfaea0';
        storyContainer.appendChild(divider);
        
        triggerAIStory('go_to_diagon_alley');
    } else if (currentStoryStep === 2) {
        alert('第一版演示到此结束，后续将接入真实的后端大模型API！');
    }
}

// 模拟向后端AI请求剧情并流式输出（打字机效果）
function triggerAIStory(scenario) {
    isGenerating = true;
    btnNext.style.display = 'none';
    
    // 获取主控信息，用于融合进Prompt
    const character = window.System.getCurrentCharacter() || { name: '你', bloodline: '未知' };
    let mockResponse = "";
    
    // 构造模拟的AI回复（未来这里将替换为真实的 fetch 后端 API）
    if (scenario === 'receive_letter') {
        mockResponse = `清晨，阳光透过窗户洒在房间里。作为一名具有${character.bloodline}血统的年轻巫师，${character.name}正坐在桌前。突然，窗外传来一阵翅膀扑腾的声音。一只褐色的长耳鸮精准地飞入房间，将一封用厚重羊皮纸制作、带有紫色蜡封的信件丢在了你的面前。信封上用翠绿色的墨水写着你的名字。`;
    } else if (scenario === 'go_to_diagon_alley') {
        mockResponse = `读完信后，${character.name}深吸了一口气。按照信上的指示，你需要前往伦敦的破釜酒吧，那里是通往魔法世界对角巷的入口。你收拾好简单的行囊，推开家门，踏上了这段未知的奇妙旅程。伦敦的街道依然熙熙攘攘，但你知道，在某个不起眼的角落，一个完全不同的世界正在等待着你...`;
    }

    const p = document.createElement('p');
    storyContainer.appendChild(p);
    
    let i = 0;
    function stream() {
        if (i < mockResponse.length) {
            p.textContent += mockResponse.charAt(i);
            i++;
            storyContainer.scrollTop = storyContainer.scrollHeight; // 自动滚动到底部
            setTimeout(stream, 40); // 模拟打字速度
        } else {
            // 打字结束
            isGenerating = false;
            currentStoryStep++;
            
            if (scenario === 'receive_letter') {
                btnReadLetter.style.display = 'block'; // 显示查看信件按钮
            } else if (scenario === 'go_to_diagon_alley') {
                btnNext.textContent = "进入破釜酒吧 (Demo结束)";
                btnNext.style.display = 'block';
            }
        }
    }
    
    stream();
}

// [修改] 在销毁模块时取消订阅，防止内存泄漏
export function destroy() {
    isGenerating = false;
    if (unsubscribeInventory) {
        unsubscribeInventory();
    }
}