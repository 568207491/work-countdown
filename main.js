const { app, BrowserWindow, Menu,ipcMain,dialog,screen } = require('electron');
const path = require('path');
const chokidar = require('chokidar');

let mainWindow;
let isWindowAlwaysOnTop = false;
let isMiniVersion = false;
let isFixedSize = false;
// 保存初始窗口大小
let initialWidth;
let initialHeight;
// 保存窗口原始位置
let originalPosition;


function createWindow() { 
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
        opacity: 1, // 初始透明度为 1
        transparent: true, // 设置窗口透明
        frame: false // 移除默认窗口框架
    });

    mainWindow.loadFile('countdown.html');

    // 默认打开开发者工具
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
    
    // 监听窗口最大化事件
    mainWindow.on('maximize', () => {
        
    });

    [initialWidth, initialHeight] = mainWindow.getSize();
    originalPosition = mainWindow.getPosition();

    // 创建菜单栏
    function createMenuTemplate() { 
        const [width, height] = mainWindow.getSize();
        const template = [
            
        ];

        return template;
    }

    const menu = Menu.buildFromTemplate(createMenuTemplate());
    Menu.setApplicationMenu(menu);
    
    // 监听来自渲染进程的消息
    ipcMain.on('get-part-element', (event) => {
        // 这里可以处理从渲染进程获取的数据
        // 示例：简单地将消息发送回渲染进程
        event.sender.send('part-element-response', '收到元素信息');
    });
   
    // 监听窗口操作事件
    ipcMain.on('minimize-window', () => {
        mainWindow.minimize();
    });

    ipcMain.on('maximize-window', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });

    ipcMain.on('close-window', () => {
        mainWindow.close();
    });
    ipcMain.on('toggle-window-top', () => {
        isWindowAlwaysOnTop = !isWindowAlwaysOnTop;
        // 设置更高的层级
        mainWindow.setAlwaysOnTop(isWindowAlwaysOnTop, 'screen-saver');
        // 发送消息到渲染进程
        mainWindow.webContents.send('toggle-window-top', isWindowAlwaysOnTop);
    });
    
    ipcMain.on('toggle-mini-version', () => {
        isMiniVersion = !isMiniVersion;
        if (isMiniVersion) {
            // 记录原始位置
            originalPosition = mainWindow.getPosition();
            mainWindow.setSize(360, 140);
            mainWindow.setResizable(false);
            // 获取屏幕尺寸
            const { width, height } = screen.getPrimaryDisplay().workAreaSize;
            const miniWidth = 360;
            const miniHeight = 160;
            // 计算右下角位置
            const x = width - miniWidth;
            const y = height - miniHeight;
            // 移动窗口到右下角
            mainWindow.setPosition(x, y);
            isWindowAlwaysOnTop = true;
            // 设置更高的层级
            mainWindow.setAlwaysOnTop(isWindowAlwaysOnTop, 'screen-saver');
        } else {
            // 恢复默认大小
            mainWindow.setSize(initialWidth, initialHeight);
            mainWindow.setResizable(true);
            // 恢复原始位置
            mainWindow.setPosition(originalPosition[0], originalPosition[1]);
            isWindowAlwaysOnTop = false;
           // 设置更高的层级
            mainWindow.setAlwaysOnTop(isWindowAlwaysOnTop, 'screen-saver');
        }
        // 发送消息到渲染进程
        mainWindow.webContents.send('toggle-mini-version', isMiniVersion);
    });
    
} 

app.whenReady().then(() => {
    createWindow();
    
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});    