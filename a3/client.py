import asyncio
import aiohttp

async def fetch_api(session, api_id, timeout_sec):
    url = f"http://localhost:8080/api/{api_id}"
    try:
        # Set a timeout per API call
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=timeout_sec)) as response:
            if response.status == 200:
                return await response.json()
            else:
                return {"api_id": api_id, "error": f"HTTP {response.status}"}
    except asyncio.TimeoutError:
        return {"api_id": api_id, "error": "Timeout"}
    except Exception as e:
        return {"api_id": api_id, "error": str(e)}

async def get_all_data(timeout_per_api=2.0):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_api(session, i, timeout_per_api) for i in range(1, 11)]
        
        # return_exceptions=True ensures one failure doesn't stop the whole group
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return results