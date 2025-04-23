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
    $('body').hover(function(){
        $top.removeClass('hide');
    },function(){
        $top.addClass('hide');
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
  
    $('#color-picker').on('change', function () {
        var selectedColor = $(this).val();
        $('.time-display').css('color', selectedColor);
        $top.addClass('hide');
    });
   
    // 计算时间差并更新显示
    function calculateAndUpdate(text, now, target, endTarget, leftId, rightId, progressId, endMessage, overtimeMessage) {
        if (now > target) {
            if (endTarget && now > endTarget) {
                $('#' + leftId).text(overtimeMessage);
                $('#' + rightId).text('');
            } else {
                $('#' + leftId).text(endMessage);
                $('#' + rightId).text('');
            }
            $('#' + progressId).css('width', '100%');
            return null;
        }
        var diff = target - now;
        var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((diff % (1000 * 60)) / 1000);

        $('#' + leftId).text(`距离${text}剩余时间：${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        $('#' + rightId).text(`共：${(hours * 60 + minutes).toString().padStart(2, '0')}分${seconds.toString().padStart(2, '0')}秒折合为${((hours * 60 + minutes)*60 + seconds).toString()}秒`);

        // 修正进度计算
        var totalDiff = target - new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var progress = (diff / totalDiff) * 100;
        $('#' + progressId).css('width', 100 - progress.toString() + '%');
        return diff;
    }

    // 午休倒计时
    function updateLunchCountdown() {
        var now = new Date();
        var lunchTimeInput = $('#lunch-time').val();
        var lunchEndTimeInput = $('#lunch-end-time').val();
        var lunchStart = new Date();
        var lunchEnd = new Date();

        if (lunchTimeInput) {
            var [hours, minutes] = lunchTimeInput.split(':');
            lunchStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
            lunchStart.setHours(12, 0, 0, 0);
        }

        if (lunchEndTimeInput) {
            var [endHours, endMinutes] = lunchEndTimeInput.split(':');
            lunchEnd.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
        } else {
            lunchEnd.setHours(13, 0, 0, 0);
        }

        var diff = calculateAndUpdate('午休', now, lunchStart, lunchEnd, 'lunch-left', 'lunch-right', 'lunch-progress', '吃饭时间到！', '吃饭时间结束！继续坐牢吧！');
        if (!diff) {
            clearInterval(lunchIntervalId);
        }
    }

    // 下班倒计时
    function updateWorkCountdown() {
        var now = new Date();
        var workTimeInput = $('#work-time').val();
        var workEnd = new Date();

        if (workTimeInput) {
            var [hours, minutes] = workTimeInput.split(':');
            workEnd.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
            workEnd.setHours(17, 30, 0, 0);
        }

        var diff = calculateAndUpdate('下班', now, workEnd, null, 'work-left', 'work-right', 'work-progress', '时间到！', '下班啦！');
        if (!diff) {
            clearInterval(workIntervalId);
        }
    }

    var lunchIntervalId = setInterval(updateLunchCountdown, 1000);
    var workIntervalId = setInterval(updateWorkCountdown, 1000);

    // 初始更新
    updateLunchCountdown();
    updateWorkCountdown();

    // 监听输入框变化，重新启动倒计时
    $('#lunch-time, #lunch-end-time, #work-time').on('change', function() {
        clearInterval(lunchIntervalId);
        clearInterval(workIntervalId);
        lunchIntervalId = setInterval(updateLunchCountdown, 1000);
        workIntervalId = setInterval(updateWorkCountdown, 1000);
        updateLunchCountdown();
        updateWorkCountdown();
    });
});