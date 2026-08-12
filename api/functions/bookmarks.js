export async function onRequest(context) {
    // request 包含前端发来的请求信息，env 包含 KV 数据库和环境变量配置
    const { request, env } = context;
    const { method } = request;

    // 1. 处理 GET 请求（前端读取书签）
    if (method === "GET") {
        const data = await env.NAV_DB.get("bookmarks_data");
        // 如果数据库是空的，返回空数组
        return new Response(data || "[]", {
            headers: { "Content-Type": "application/json;charset=UTF-8" }
        });
    }

    // 2. 处理 POST 请求（前端保存/更新书签）
    if (method === "POST") {
        // 获取前端传来的密码
        const authHeader = request.headers.get("Authorization");
        const expectedPassword = env.ADMIN_PASSWORD;

        // 验证密码是否正确
        if (!expectedPassword || authHeader !== `Bearer ${expectedPassword}`) {
            return new Response(JSON.stringify({ error: "密码错误或未设置环境变量" }), { 
                status: 401,
                headers: { "Content-Type": "application/json;charset=UTF-8" }
            });
        }

        try {
            // 获取前端传来的 JSON 字符串并存入 KV 数据库
            const reqData = await request.text();
            await env.NAV_DB.put("bookmarks_data", reqData);
            
            return new Response(JSON.stringify({ success: true }), {
                headers: { "Content-Type": "application/json;charset=UTF-8" }
            });
        } catch (e) {
            return new Response(JSON.stringify({ error: "数据保存失败" }), { status: 500 });
        }
    }

    return new Response("Method Not Allowed", { status: 405 });
}