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
# 깃허브 페이지는 저장소 맨 위의 index.html을 보여 줌: 완전한 문서로 감싸 휴대폰 화면 크기와 글자 설정을 넣음
page = ('<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<meta name="apple-mobile-web-app-capable" content="yes">\n'
        '<meta name="apple-mobile-web-app-title" content="말랑말랑">\n'
        '<meta name="theme-color" content="#FBF7F1">\n'
        '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}</style>\n'
        '</head>\n<body>\n' + html + '\n</body>\n</html>\n')
(root / 'index.html').write_text(page)
