import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

let markdown;
try { const MarkdownIt=createRequire(import.meta.url)('markdown-it');markdown=new MarkdownIt({html:false,linkify:true});markdown.renderer.rules.image=(tokens,index)=>escapeHtml(tokens[index].content); } catch(error) {if(error.code!=='MODULE_NOT_FOUND')throw error;}
export function prose(text,attachments=[]) {
  if(!markdown)return `<pre>${escapeHtml(text || '')}</pre>`;
  const tokens=markdown.parse(String(text || ''),{});
  for(const token of tokens)for(const child of token.children || [])if(child.type==='link_open') {
    const attachment=attachments.find(a=>a.source===child.attrGet('href'));
    if(attachment)child.attrSet('href',attachment.href);
  }
  return markdown.renderer.render(tokens,markdown.options,{});
}
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function csv(rows) {
  return rows.map(row => row.map(v => `"${String(v ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n') + '\r\n';
}
export function page(title, content, up = '../index.html') {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; media-src 'self'"><title>${escapeHtml(title)}</title><style>body{font:16px system-ui;margin:0;background:#f6f8fa;color:#24292f}header,main{padding:1rem;max-width:1100px;margin:auto}nav,article{background:white;border:1px solid #d0d7de;border-radius:6px;padding:1rem;margin:1rem 0}a{color:#0969da}pre{white-space:pre-wrap;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:.6rem;border-bottom:1px solid #d0d7de}</style><header><a href="${escapeHtml(up)}">Repository archive</a><h1>${escapeHtml(title)}</h1></header><main>${content}</main></html>\n`;
}
const href = value => value.split('/').map(encodeURIComponent).join('/');
export function staticCommentIdentity(comment) {
  const id=String(comment.id ?? '');
  if(id==='body')return 'body';
  if(/^\d+$/.test(id)&&Number.isSafeInteger(Number(id))) {
    if(/#pullrequestreview-/.test(comment.html_url || ''))return `review-${id}`;
    if(/#discussion_r/.test(comment.html_url || ''))return `review-comment-${id}`;
    return id;
  }
  return `comment-${createHash('sha256').update(comment.html_url || JSON.stringify(comment)).digest('hex').slice(0,16)}`;
}
export function attachmentLinks(directory, prefix = '') {
  const index = path.join(directory, 'mirror-index.json');
  if (!fs.existsSync(index)) return [];
  return JSON.parse(fs.readFileSync(index, 'utf8')).files.filter(f => f.kind === 'attachment' && !f.fetchFailed && fs.existsSync(path.join(directory, f.name))).map(f => ({ name: f.name, source: f.source, href: href(prefix + f.name), sha256: f.sha256, size: f.size }));
}
export function generateStatic(snapshot, base, write, { listings = true } = {}) {
  const listingWrite = listings ? write : () => {};
  fs.mkdirSync(base, { recursive: true });
  const repository = `${snapshot.organization || 'wekan'}/${snapshot.repository || 'wekan'}`;
  const releasePath = release => {const folder=path.join(base,'releases');if(fs.existsSync(folder))for(const name of fs.readdirSync(folder)){const index=path.join(folder,name,'mirror-index.json');if(fs.existsSync(index)&&String(JSON.parse(fs.readFileSync(index,'utf8')).key)===String(release.tag_name))return `releases/${name}/index.html`;}return '';};
  const navigation = `<nav>${['issues','pulls','releases','projects'].map(t => `<a href="${t}/index.html">${t}</a>`).join(' · ')}</nav>`;
  listingWrite(path.join(base, 'index.csv'), csv([['type','number','title','state','source','local_path'], ...snapshot.issues.map(i => [i.pull_request || i.pullMetadata ? 'pulls' : 'issues', i.number, i.title, i.state, i.html_url, `${i.pull_request || i.pullMetadata ? 'pulls' : 'issues'}/${i.number}/index.html`]), ...snapshot.releases.map(r => ['releases',r.tag_name,r.name,'',r.html_url,releasePath(r)])]));
  listingWrite(path.join(base, 'index.html'), page(repository, navigation + `<article><h2>${escapeHtml(snapshot.repositoryMetadata?.description || 'Repository mirror')}</h2><p>Offline archive of repository issues, pull requests, releases and linked files.</p><a href="index.csv">Download CSV index</a>${snapshot.projectPageUrl ? '<p><a download href="repository/metadata/projects-page.html">Public projects webpage snapshot</a></p>' : ''}</article>`, 'index.html'));
  for (const type of ['issues','pulls']) {
    const items = snapshot.issues.filter(i => Boolean(i.pull_request || i.pullMetadata) === (type === 'pulls'));
    const folder = path.join(base, type); fs.mkdirSync(folder, { recursive: true });
    const rows = [['number','title','state','author','created_at','updated_at','source','local_path']];
    let table = '<table><tr><th>Number</th><th>Title</th><th>State</th></tr>';
    for (const item of items) {
      rows.push([item.number,item.title,item.state,item.user?.login,item.created_at,item.updated_at,item.html_url,`${item.number}/index.html`]);
      table += `<tr><td>#${item.number}</td><td><a href="${item.number}/index.html">${escapeHtml(item.title)}</a></td><td>${escapeHtml(item.state)}</td></tr>`;
      const directory = path.join(folder, String(item.number)); if (!fs.existsSync(directory)) continue;
      const comments = [{ ...item, id: 'body', body: item.originalBody ?? item.body }, ...(item.commentsToMirror || [])];
      const commentRows = [['comment','author','created_at','body','source','attachment','attachment_source','sha256','size']];
      const article = comments.map(comment => {
        const id = comment.archiveCommentId || staticCommentIdentity(comment);
        const attachments = attachmentLinks(path.join(directory,id), `${id}/`);
        for (const a of attachments.length ? attachments : [{}]) commentRows.push([id,comment.user?.login,comment.created_at,comment.body,comment.html_url,a.href,a.source,a.sha256,a.size]);
        return `<article id="comment-${escapeHtml(id)}"><b>${escapeHtml(comment.user?.login || 'Original author')}</b> <time>${escapeHtml(comment.created_at || '')}</time>${prose(comment.body,attachments)}${attachments.map(a => `${/\.(png|jpe?g|gif|webp)$/i.test(a.name) ? `<p><img style="max-width:100%" alt="${escapeHtml(a.name)}" src="${escapeHtml(a.href)}"></p>` : /\.(mp4|webm|ogv)$/i.test(a.name) ? `<video style="max-width:100%" controls src="${escapeHtml(a.href)}"></video>` : ''}<p><a href="${escapeHtml(a.href)}" download>${escapeHtml(a.name)}</a></p>`).join('')}</article>`;
      }).join('');
      write(path.join(directory, 'index.csv'), csv(commentRows));
      write(path.join(directory, 'index.html'), page(`#${item.number} ${item.title}`, `<p>${escapeHtml(item.state)}</p><a href="index.csv">Comment and attachment CSV</a>${article}`, '../../index.html'));
    }
    listingWrite(path.join(folder,'index.csv'),csv(rows));
    listingWrite(path.join(folder,'index.html'),page(`${repository} ${type}`, `<a href="index.csv">Download CSV index</a>${table}</table>`));
  }
  for (const type of ['releases','projects']) {
    const folder = path.join(base,type); fs.mkdirSync(folder,{recursive:true});
    const rows = [['number','title','source','local_path']]; let table = '<table>';
    for (const name of fs.readdirSync(folder)) {
      const directory = path.join(folder,name); if (!fs.statSync(directory).isDirectory()) continue;
      const metadata = path.join(directory,type === 'projects' ? 'project.json' : 'release.json');
      if (!fs.existsSync(metadata)) continue;
      const item = JSON.parse(fs.readFileSync(metadata,'utf8'));
      if (!listings && !Array.from(snapshot.releases).some(r => r.tag_name === item.tag_name)) continue;
      const title = item.title || item.name || item.tag_name;
      rows.push([item.number || item.tag_name,title,item.url || item.html_url,`${name}/index.html`]);
      table += `<tr><td><a href="${href(name)}/index.html">${escapeHtml(title)}</a></td></tr>`;
      const files = JSON.parse(fs.readFileSync(path.join(directory,'mirror-index.json'),'utf8')).files;
      write(path.join(directory,'index.csv'),csv([['name','source','kind','sha256','size'],...files.map(f=>[f.name,f.source,f.kind,f.sha256,f.size])]));
      write(path.join(directory,'index.html'),page(title, `<pre>${escapeHtml(item.body || item.readme || '')}</pre>${files.map(f=>`<p><a download href="${href(f.name)}">${escapeHtml(f.name)}</a></p>`).join('')}`, '../../index.html'));
    }
    listingWrite(path.join(folder,'index.csv'),csv(rows)); listingWrite(path.join(folder,'index.html'),page(`${repository} ${type}`,`<a href="index.csv">Download CSV index</a>${table}</table>`));
  }
}

export function generateCatalog(root,write) {
  const base=path.join(root,'.tools/mirror'),items=[];
  if(!fs.existsSync(base))return;
  function visit(directory,segments) {
    if(segments.length>7)return;
    if(fs.existsSync(path.join(directory,'issues/index.csv')) && fs.existsSync(path.join(directory,'index.html'))) {
      items.push({host:segments[0],organization:segments.slice(1,-1).join('/'),repository:segments.at(-1),link:segments.join('/')+'/index.html'});return;
    }
    for(const entry of fs.readdirSync(directory,{withFileTypes:true}))if(entry.isDirectory() && entry.name!=='.git')visit(path.join(directory,entry.name),[...segments,entry.name]);
  }
  for(const host of ['github.com','gitlab.com','codeberg.org','sourceforge.net'])if(fs.existsSync(path.join(base,host)))visit(path.join(base,host),[host]);
  const render=(directory,selected,prefix,title)=>{
    fs.mkdirSync(directory,{recursive:true});
    const rows=[['host','organization','repository','local_path'],...selected.map(i=>[i.host,i.organization,i.repository,i.link.slice(prefix.length)])];
    write(path.join(directory,'index.csv'),csv(rows));
    write(path.join(directory,'index.html'),page(title,`<a href="index.csv">CSV catalogue</a><table>${selected.map(i=>`<tr><td>${escapeHtml(i.host)}</td><td>${escapeHtml(i.organization)}</td><td><a href="${escapeHtml(href(i.link.slice(prefix.length)))}">${escapeHtml(i.repository)}</a></td></tr>`).join('')}</table>`,'index.html'));
  };
  const hosts=[...new Set(items.map(i=>i.host))];
  write(path.join(base,'index.csv'),csv([['directory','local_path','repositories'],...hosts.map(host=>[host,`${host}/index.html`,items.filter(i=>i.host===host).length])]));
  write(path.join(base,'index.html'),page('Repository mirror archive',`<a href="index.csv">CSV directory list</a><ul>${hosts.map(host=>`<li><a href="${escapeHtml(host)}/index.html">${escapeHtml(host)}</a></li>`).join('')}</ul>`,'index.html'));
  for(const host of hosts) {
    const directory=path.join(base,host),organizations=[...new Set(items.filter(i=>i.host===host).map(i=>i.organization))];
    write(path.join(directory,'index.csv'),csv([['directory','local_path'],...organizations.map(o=>[o,`${o}/index.html`])]));
    write(path.join(directory,'index.html'),page(host,`<a href="index.csv">CSV directory list</a><ul>${organizations.map(o=>`<li><a href="${escapeHtml(href(o))}/index.html">${escapeHtml(o)}</a></li>`).join('')}</ul>`));
  }
  for(const key of new Set(items.map(i=>`${i.host}/${i.organization}`)))render(path.join(base,...key.split('/')),items.filter(i=>`${i.host}/${i.organization}`===key),key+'/',key);
}
