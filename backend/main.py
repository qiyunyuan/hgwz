# backend/main.py

import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import httpx

# 从新创建的 prompts 文件中导入逻辑
from prompts.prompts import get_character_info_str, get_system_prompt, get_user_message

app = FastAPI(title="Hogwarts Game Backend")

# 配置存储路径
CONFIG_FILE = os.path.join(os.path.dirname(__file__), "api_config.json")

# 允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 配置管理逻辑 ---

def load_config():
    if not os.path.exists(CONFIG_FILE):
        return {"apis": []}
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_config(config):
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=4, ensure_ascii=False)

@app.get("/api/settings")
async def get_settings():
    return load_config()

@app.post("/api/settings")
async def update_settings(config: Dict[str, Any]):
    save_config(config)
    return {"status": "success"}

@app.get("/api/models")
async def get_remote_models(apiId: str):
    config = load_config()
    api = next((api for api in config.get("apis", []) if api.get("id") == apiId), None)
    if not api:
        raise HTTPException(status_code=404, detail="API 配置未找到")
    
    api_url = api.get("url").rstrip('/')
    api_key = api.get("key")
    
    # 智能处理 URL 拼接 (确保指向 /models)
    base_url = api_url
    if not any(base_url.endswith(s) for s in ['/v1', '/chat/completions']):
        base_url += '/v1'
    
    if base_url.endswith('/chat/completions'):
        endpoint = base_url.replace('/chat/completions', '/models')
    else:
        endpoint = f"{base_url}/models"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(endpoint, headers={"Authorization": f"Bearer {api_key}"}, timeout=20.0)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取模型列表失败: {str(e)}")

# --- 聊天逻辑优化 ---

class ChatRequest(BaseModel):
    character: Dict[str, Any]
    state: Dict[str, Any]
    action: Optional[str] = None

@app.post("/api/chat")
async def chat(request: ChatRequest):
    # 1. 从后端存储读取配置
    config = load_config()
    # 查找当前启用的 API
    active_api = next((api for api in config.get("apis", []) if api.get("enabled")), None)

    if not active_api:
        raise HTTPException(status_code=400, detail="未检测到启用的 API 配置，请前往设置页面配置")
    
    api_url = active_api.get("url")
    api_key = active_api.get("key")
    # 默认使用该 API 下的第一个模型（或根据业务逻辑扩展选择逻辑）
    models = active_api.get("models", [])
    if not models:
        raise HTTPException(status_code=400, detail="该 API 未配置任何模型")
    model = models[0].get("id") or models[0].get("name")
    
    # 2. 从 prompts 模块获取构建好的提示词
    char_info = get_character_info_str(request.character)
    story_step = request.state.get('story_step', '开始')
    
    system_prompt = get_system_prompt(char_info, story_step)
    user_message = get_user_message(request.action)

    # 3. 调用 AI 服务
    try:
        async with httpx.AsyncClient() as client:
            # 智能处理 URL 拼接
            base_url = api_url.rstrip('/')
            if not any(base_url.endswith(s) for s in ['/v1', '/chat/completions']):
                base_url += '/v1'
            
            endpoint = base_url if base_url.endswith('/chat/completions') else f"{base_url}/chat/completions"
            
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "temperature": 0.7
            }
            
            response = await client.post(endpoint, headers=headers, json=payload, timeout=60.0)
            response.raise_for_status()
            result = response.json()
            
            return {"text": result['choices'][0]['message']['content']}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 服务调用失败: {str(e)}")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    # 启动服务
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
