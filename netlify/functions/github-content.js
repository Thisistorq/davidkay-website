// Thin authenticated proxy to GitHub's Contents API. admin.html is publicly
// reachable but holds no GitHub credentials itself — every content read/write
// goes through this function instead, which holds the real token as a
// server-side env var the browser never sees.
//
// Two earlier approaches were tried and abandoned before landing on this one
// (kept here so it isn't reinvented on a future site): Netlify's Git Gateway
// hit a platform-level restriction, and embedding the token directly in
// admin.html got it auto-revoked by GitHub's secret-scanning within moments
// of being committed.
//
// Required env vars (Netlify site config, not committed anywhere):
//   GITHUB_TOKEN  — a fine-grained PAT scoped to Contents: read/write on
//                   this one repo only (github.com/settings/tokens, choose
//                   "Fine-grained token", restrict to the single repo)
//   GITHUB_OWNER  — the GitHub username/org, e.g. "Thisistorq"
//   GITHUB_REPO   — the repo name
//   GITHUB_BRANCH — optional, defaults to "main"
//
// This function does NOT itself check who's calling it — admin.html's login
// gate (Netlify Identity) is what restricts who can reach this far. Anyone
// who can hit this endpoint directly could write to the repo, so it should
// never be linked to or called from anywhere other than a logged-in-gated
// admin panel.

exports.handler = async function (event) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';

  if (!token || !owner || !repo) {
    return { statusCode: 500, body: 'GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO not configured' };
  }

  const path = event.queryStringParameters && event.queryStringParameters.path;
  if (!path) {
    return { statusCode: 400, body: 'Missing ?path=' };
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'admin-panel',
  };

  if (event.httpMethod === 'GET') {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      { headers },
    );
    if (!res.ok) {
      return { statusCode: res.status, body: await res.text() };
    }
    const json = await res.json();
    // Only hand back what the client needs — base64 content and the blob
    // sha (required to update the file without overwriting someone else's
    // concurrent change).
    return { statusCode: 200, body: JSON.stringify({ content: json.content, sha: json.sha }) };
  }

  if (event.httpMethod === 'PUT') {
    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, body: 'Invalid JSON body' };
    }
    const { message, content, sha } = payload;
    if (!content) {
      return { statusCode: 400, body: 'Missing content' };
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message || `Update ${path} via admin panel`,
        content,
        sha, // omitted (undefined) entirely when creating a brand-new file
        branch,
      }),
    });
    if (!res.ok) {
      return { statusCode: res.status, body: await res.text() };
    }
    return { statusCode: 200, body: 'ok' };
  }

  return { statusCode: 405, body: 'Method not allowed' };
};
