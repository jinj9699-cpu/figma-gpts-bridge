const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { project_id, file_name, nodes } = req.body;
  const FIGMA_TOKEN = process.env.FIGMA_TOKEN;

  const headers = {
    'X-Figma-Token': FIGMA_TOKEN,
    'Content-Type': 'application/json'
  };

  try {
    // 1. 创建文件
    const createBody = { name: file_name };
    if (project_id) createBody.project_id = project_id;

    const createResp = await fetch('https://api.figma.com/v1/files', {
      method: 'POST',
      headers,
      body: JSON.stringify(createBody)
    });
    const fileData = await createResp.json();
    if (!createResp.ok) throw new Error(fileData.err || 'Create failed');
    const fileKey = fileData.key;

    // 2. 添加节点
    const nodesWithIds = nodes.map((node, i) => ({
      ...node,
      id: `${100 + i}:0`
    }));

    const appendResp = await fetch(`https://api.figma.com/v1/files/${fileKey}/nodes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ nodes: nodesWithIds })
    });
    const appendData = await appendResp.json();
    if (!appendResp.ok) throw new Error(appendData.err || 'Append nodes failed');

    const fileUrl = `https://www.figma.com/file/${fileKey}/${file_name.replace(/\s+/g, '-')}`;
    res.status(200).json({ file_key: fileKey, file_url: fileUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};