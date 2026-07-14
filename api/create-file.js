// api/create-file.js
// 改为向固定文件追加节点，不再创建新文件
module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const nodes = body.nodes || [];
    // 文件名可用于内部页面命名，但不再创建新文件
    const file_name = body.file_name || 'Untitled';

    const FIGMA_TOKEN = process.env.FIGMA_TOKEN2;
    const FILE_KEY = process.env.FIGMA_FILE_KEY;
    if (!FIGMA_TOKEN || !FILE_KEY) {
      return res.status(500).json({ error: 'Missing FIGMA_TOKEN2 or FIGMA_FILE_KEY' });
    }

    // 为每个节点生成临时 ID
    const nodesWithId = nodes.map((node, i) => ({
      ...node,
      id: `${200 + i}:0`  // 使用 200+ 避免与已有节点冲突
    }));

    // 直接向指定文件添加节点
    const appendResp = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}/nodes`, {
      method: 'POST',
      headers: {
        'X-Figma-Token': FIGMA_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nodes: nodesWithId })
    });

    if (!appendResp.ok) {
      const errText = await appendResp.text();
      return res.status(appendResp.status).json({ error: `Figma append nodes failed: ${errText}` });
    }

    // 生成文件链接（直接链接到该文件）
    const fileUrl = `https://www.figma.com/file/${FILE_KEY}/${file_name.replace(/\s+/g, '-')}`;
    return res.status(200).json({
      message: 'Nodes appended successfully',
      file_key: FILE_KEY,
      file_url: fileUrl
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
