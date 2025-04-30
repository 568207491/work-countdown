let fontOptions = [
    "微软雅黑",
    "阿里妈妈数黑体 Bold",
    "京东朗正体",
    "hxbnst",
    "阿里妈妈东方大楷",
    "庞门正道体",
    // 可以添加更多字体选项
];
let nowFont = '微软雅黑';
// 显示字体选择器
window.showFontSelector = function (font) {
    ipcRenderer.send('open-font-selector',fontOptions);
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
ipcRenderer.on('select-font', (event, font) => {
    $('.comment-font').css('font-family', font);
    $('#changeFont p').text(font);
    nowFont = font;
});
