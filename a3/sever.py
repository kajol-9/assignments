from aiohttp import web
import asyncio
import random

async def api_handler(request):
    api_id = request.match_info.get('id', '0')
    
    # Simulate different behaviors
    # 1. Slow API
    if api_id in ['1', '5']:
        await asyncio.sleep(5) 
    
    # 2. Failing API
    if api_id in ['3', '7']:
        return web.Response(status=500, text=f"API {api_id} Internal Error")
    
    # 3. Normal API
    await asyncio.sleep(random.uniform(0.1, 1.0))
    return web.json_response({"api_id": api_id, "data": f"Response from service {api_id}"})

app = web.Application()
app.add_routes([web.get('/api/{id}', api_handler)])

if __name__ == '__main__':
    print("Starting mock server on http://localhost:8080...")
    web.run_app(app, port=8080)