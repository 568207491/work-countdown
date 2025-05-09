// 初始化 fontOptions 为空数组
let fontOptions = [];
// 读取 data.json 文件
const fs = require('fs');
const path = require('path');
const dataPath = path.join(__dirname, 'data.json');

let nowFont = '汇文明朝体'; 
  
fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
        console.error('读取 data.json 文件时出错:', err);
        return; 
    }
    try { 
        const jsonData = JSON.parse(data);
        // 存储每个字体的名称和路径
        fontOptions = jsonData.map(item => ({
            name: item.name,
            path: item.path
        }));
    } catch (parseError) {
        console.error('解析 data.json 文件时出错:', parseError);
    }
});
// 显示字体选择器
window.showFontSelector = function (font) {
    // 只发送字体名称到主进程
    const fontNames = fontOptions.map(option => option.name);
    ipcRenderer.send('open-font-selector',fontNames);
    // 调用 closeChildMenu 函数关闭顶部二级菜单
    if (typeof window.closeChildMenu === 'function') {
        window.closeChildMenu();
    }
};

// 绑定换字体按钮点击事件
$('#changeFont').on('click', function () {
    showFontSelector(nowFont);
});
  
// 监听选择字体的事件
ipcRenderer.on('select-font', (event, selectedFontName) => {
    // 找到所选字体的路径
    const selectedFont = fontOptions.find(option => option.name === selectedFontName);
    if (selectedFont) {
        const fontPath = selectedFont.path;
        // 动态加载字体
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-family: '${selectedFontName}';
                src: url('${fontPath}');
            } 
        `; 
        document.head.appendChild(style);

        // 应用字体
        $('.comment-font').css('font-family', selectedFontName);
        $('#changeFont p').text(selectedFontName);
        nowFont = selectedFontName;
    }
});
