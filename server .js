const http = require('http');
const https = require('https');

const ZHIPU_API_KEY = 'fc65e8fe3e604cd1bc99d6a0cdd18507.BVfS3uRbfZjanaah';
const MODEL_NAME = 'glm-5.3-flash'; 

http.createServer((req, res) => {
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
                
                // 【核心升级】：让 AI 能够解析备注
                const systemPrompt = reqData.isCounselor 
                    ? `你是一个温柔、高情商的 AI 心理疗愈师。用户会给你提供他今天的心情标签和札记内容。请结合他的文字（如果有的话），给出深深共情、温暖、治愈的回复。不要讲大道理，字数120字以内。` 
                    : `你是一个时间解析助手。请从用户的话中提取出日期(date)、开始时间(start)、结束时间(end)、任务内容(content)和备注(note)。注意：日期格式请输出为 "月-日"（如 "11-25"）。如果没有提到备注，note 字段为空字符串 ""。只返回JSON，不要有其他解释，格式：{"date": "11-25", "start": "14:00", "end": "16:00", "content": "开会", "note": "院系楼2046"}`;

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
                    console.error('转发请求出错:', e);
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
}).listen(3000, () => {
    console.log('====================================');
    console.log('✅ 代理服务器已成功启动在 http://localhost:3000');
    console.log('✅ 已开启备注解析支持！');
    console.log('====================================');
});