require('module-alias/register');
const { request } = require('@octokit/request');

(async () => {
  const req = request.defaults({
    headers: { Authorization: `bearer ${process.argv[2]}` },
  });

  const { data: gists } = await req('GET /gists');

  const dates = gists.map((g) => new Date(g.created_at).getMinutes());

  console.log('dates: ', dates);
})();
