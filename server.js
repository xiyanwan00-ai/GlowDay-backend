const http = require('http');
const https = require('https');

// ⚠️ 确保这里是你的真实 Key
const ZHIPU_API_KEY = 'fc65e8fe3e604cd1bc99d6a0cdd18507.BVfS3uRbfZjanaah';
// ⚠️ 确保这里用的是免费且稳定的模型
const MODEL_NAME = 'glm-5.3-flash'; 

http.createServer((req, res) => {
    // 解决跨域
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/api' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const reqData = JSON.parse(body);
                
                const systemPrompt = reqData.isCounselor 
                    ? `你是一个温柔的心理疗愈师。请结合用户的心情和文字，给出温暖的回复。` 
                    : `你是一个时间解析助手。请提取日期(date)、开始时间(start)、结束时间(end)、任务内容(content)和备注(note)。如果没有备注，note 返回空字符串。只返回JSON，格式：{"date": "11-25", "start": "14:00", "end": "16:00", "content": "开会", "note": "教学楼"}`;

                const postData = JSON.stringify({
                    model: MODEL_NAME,
                    messages: [
                        { role: 'system', content: systemPrompt }, 
                        { role: 'user', content: reqData.prompt }
                    ],
                    temperature: 0.7 
                });

                const options = {
                    hostname: 'open.bigmodel.cn',
                    path: '/api/paas/v4/chat/completions',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${ZHIPU_API_KEY}`,
                        'Content-Length': Buffer.byteLength(postData)
                    }
                };

                const proxyReq = https.request(options, (proxyRes) => {
                    res.writeHead(proxyRes.statusCode, proxyRes.headers);
                    proxyRes.pipe(res);
                });

                proxyReq.on('error', (e) => {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: e.message }));
                });

                proxyReq.write(postData);
                proxyReq.end();

            } catch (err) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: '请求格式错误' }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
}).listen(process.env.PORT || 3000, '0.0.0.0', () => {
    console.log('=========================================');
    // 顺便把打印的地址也改一下，避免误导
    console.log(`🚀 代理服务器已启动在端口: ${process.env.PORT || 3000}`);
    console.log('✅ 请保持此黑框开启，去浏览器刷新网页使用！');
    console.log('=========================================');
});