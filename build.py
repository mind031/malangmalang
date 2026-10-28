import pathlib
root = pathlib.Path(__file__).parent
src = root / 'src'
html = (src / 'index.html').read_text()
html = html.replace('/*STYLE*/', (src / 'style.css').read_text())
html = html.replace('/*ENGINE*/', (src / 'engine.js').read_text())
html = html.replace('/*APP*/', (src / 'app.js').read_text())
out = root / 'dist'
out.mkdir(exist_ok=True)
(out / 'index.html').write_text(html)
print('built', len(html), 'bytes')
# 깃허브 페이지는 저장소 맨 위의 index.html을 보여 줌
(root / 'index.html').write_text(html)
