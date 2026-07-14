// api/create-file.js
module.exports = async (req, res) => {
  // 设置 CORS 头，允许所有来源
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const project_id = body.project_id;
    const file_name = body.file_name || 'Untitled';
    const nodes = body.nodes || [];

    const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
    if (!FIGMA_TOKEN) {
      return res.status(500).json({ error: 'FIGMA_TOKEN not set' });
    }

    const headers = {
      'X-Figma-Token': FIGMA_TOKEN,
      'Content-Type': 'application/json'
    };

    // 创建 Figma 文件
    const createPayload = { name: file_name };
    if (project_id) createPayload.project_id = project_id;

    const createResp = await fetch('https://api.figma.com/v1/files', {
      method: 'POST',
      headers,
      body: JSON.stringify(createPayload)
    });

    if (!createResp.ok) {
      const errText = await createResp.text();
      return res.status(createResp.status).json({ error: `Figma create file failed: ${errText}` });
    }

    const fileData = await createResp.json();
    const fileKey = fileData.key;

    // 添加节点
    const nodesWithId = nodes.map((node, i) => ({
      ...node,
      id: `${100 + i}:0`
    }));

    const appendResp = await fetch(`https://api.figma.com/v1/files/${fileKey}/nodes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ nodes: nodesWithId })
    });

    if (!appendResp.ok) {
      const errText = await appendResp.text();
      return res.status(appendResp.status).json({
        error: `Figma append nodes failed: ${errText}`,
        file_key: fileKey
      });
    }

    const fileUrl = `https://www.figma.com/file/${fileKey}/${file_name.replace(/\s+/g, '-')}`;
    return res.status(200).json({ file_key: fileKey, file_url: fileUrl });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
