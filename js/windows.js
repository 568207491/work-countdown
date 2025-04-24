const { ipcRenderer } = require('electron');
        
$(document).ready(function () {

    // 窗口操作函数
    function minimizeWindow() {
        ipcRenderer.send('minimize-window');
    }

    function closeWindow() {
        ipcRenderer.send('close-window');
    }
    function toggleWindowTop() {
        ipcRenderer.send('toggle-window-top');
    }

    function toggleMiniVersion() {
        ipcRenderer.send('toggle-mini-version');
    }

    // 将函数暴露到全局作用域
    window.minimizeWindow = minimizeWindow;
    window.closeWindow = closeWindow;
    window.toggleWindowTop = toggleWindowTop;
    window.toggleMiniVersion = toggleMiniVersion;

    const $part = $('body');
    const $top = $('.custom-header');
    const $miniBtn = $('#miniBtn');
    const $topBtn = $('#topBtn');
    const $opacityPicker = $('#opacity-picker');
    const $opacityValue = $('#opacity-value');
    let openChildMenu = false;

    $('body').hover(function(){
        $top.removeClass('hide');
    },function(){
        if(!openChildMenu) {
            $top.addClass('hide');
        }
    });
    // 点击除.dropdown 元素外的其他元素触发的事件
    $(document).on('click', function (event) {
        if (!$(event.target).closest('.dropdown').length) {
            openChildMenu = false;
            $('.dropdown-content').slideUp();
        }
    });
    

    // 自定义菜单操作
    $('.dropdown-toggle').click(function(){
        openChildMenu = !openChildMenu;
        if(openChildMenu) {
            $(this).siblings('.dropdown-content').slideDown();
        }else {
            $(this).siblings('.dropdown-content').slideUp();
        }
    });
    // 窗口操作函数
    function minimizeWindow() {
        ipcRenderer.send('minimize-window');
    }

    function closeWindow() {
        ipcRenderer.send('close-window');
    }
    // 监听来自主进程的消息
    ipcRenderer.on('toggle-mini-version', (event, isMini) => {
        if (isMini) {
            $miniBtn.addClass('focus');
            $topBtn.addClass('focus');
            $part.addClass('mini');
            $top.addClass('hide');
        } else {
            $miniBtn.removeClass('focus');
            $topBtn.removeClass('focus');
            $part.removeClass('mini');
            $top.removeClass('hide');
        }
    });
    ipcRenderer.on('toggle-window-top', (event, isTop) => {
        if (isTop) {
            $topBtn.addClass('focus');
        } else {
            $topBtn.removeClass('focus');
        }
    }); 

    // 关闭顶部二级菜单
    function closeChildMenu(){
        openChildMenu = false;
        $('.dropdown-content').slideUp();
        $top.addClass('hide');
    }
    // 监听透明度输入框的变化事件
    $opacityPicker.on('change', function () {
        const opacity = $(this).val() / 100;
        const opacityPercent = $(this).val();
        $opacityValue.text(opacityPercent + '%');
        ipcRenderer.send('set-window-opacity', opacity);
        closeChildMenu();
    });
  
    $('#color-picker').on('change', function () {
        var selectedColor = $(this).val();
        $('.comment-color').css('color', selectedColor);
        closeChildMenu();
    });
    
});