const { app, BrowserWindow, Menu, ipcMain, dialog, screen, Tray, nativeImage } = require('electron');
const path = require('path');

let mainWindow;
let isWindowAlwaysOnTop = false;
let isMiniVersion = false;
// 保存初始窗口大小
let initialWidth;
let initialHeight;
// 保存窗口原始位置
let originalPosition;
let tray;
let showConfirmDialog = true;
let IsMini = false; // 是否最小化到托盘
// 请求单实例锁
const gotTheLock = app.requestSingleInstanceLock();


let Store;
(async () => {
    Store = (await import('electron-store')).default;
    const store = new Store();
    
    // 监听保存字体的消息
    ipcMain.on('save-selected-font', (event, fontName) => {
        store.set('selectedFont', fontName); 
        // console.log('已存储字体:', fontName); // 添加日志
        // console.log('所有存储的数据:', store.store); // 打印所有数据
    });
 
    // 监听获取字体的消息 
    ipcMain.on('get-selected-font', (event) => {
        const selectedFont = store.get('selectedFont'); 
        // console.log('获取字体请求 - 当前存储的字体:', selectedFont); // 添加日志
        event.sender.send('selected-font-response', selectedFont);
    }); 

    // 监听保存颜色的消息
    ipcMain.on('save-selected-color', (event, Color) => {
        store.set('selectedColor', Color);
        // console.log('已存储颜色:', Color); // 添加日志
        // console.log('所有存储的数据:', store.store); // 打印所有数据
    });
    // 监听获取颜色的消息 
    ipcMain.on('get-selected-color', (event) => {
        const selectedColor = store.get('selectedColor'); 
        // console.log('获取颜色请求 - 当前存储的颜色:', selectedColor); // 添加日志
        event.sender.send('selected-color-response', selectedColor);
    });
})();

if (!gotTheLock) {
    // 如果没有获取到锁，说明已有实例在运行，退出当前实例
    app.quit();
} else {
    // 当第二个实例启动时触发该事件
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // 当尝试运行第二个实例时，将现有的主窗口显示出来
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
    function createWindow() {
        mainWindow = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            },
            opacity: 1, // 初始透明度为 1
            transparent: true, // 设置窗口透明
            frame: false, // 移除默认窗口框架
            skipTaskbar: false // 初始时显示在任务栏
        });

        
        mainWindow.loadFile('countdown.html');  

        // 监听来自渲染进程的创建字体选择器窗口的请求
        ipcMain.on('open-font-selector', (event, fontOptions) => {
            const fontWindow = new BrowserWindow({
                parent: mainWindow,
                modal: true,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                },
                transparent: true, // 设置窗口透明
                frame: false, // 移除默认窗口框架
                show: false // 先不显示窗口
            });

            fontWindow.loadFile('fontSelector.html');
            // fontWindow.webContents.openDevTools();
            // 等待字体选择器窗口加载完成后发送字体选项数据
            fontWindow.webContents.on('did-finish-load', () => {
                fontWindow.webContents.send('font-options', fontOptions);
                // 使用 MutationObserver 监听 modal 元素的变化
                fontWindow.webContents.executeJavaScript(`
                    new Promise((resolve) => {
                        const modal = document.getElementById('modal');
                        if (modal && modal.offsetWidth > 0 && modal.offsetHeight > 0) {
                            const width = modal.offsetWidth;
                            const height = modal.offsetHeight;
                            resolve([width, height]);
                        }else {
                            const observer = new MutationObserver((mutationsList) => {
                                const modal = document.getElementById('modal');
                                if (modal && modal.offsetWidth > 0 && modal.offsetHeight > 0) {
                                    const width = modal.offsetWidth;
                                    const height = modal.offsetHeight;
                                    observer.disconnect();
                                    resolve([width, height]);
                                }
                            });

                            const targetNode = document.body;
                            const config = { childList: true, subtree: true };
                            observer.observe(targetNode, config);

                            // 为了避免无限等待，设置一个超时时间
                            setTimeout(() => {
                                observer.disconnect();
                                const modal = document.getElementById('modal');
                                if (modal) {
                                    const width = modal.offsetWidth;
                                    const height = modal.offsetHeight;
                                    resolve([width, height]);
                                } else {
                                    console.error('Modal element not found.');
                                    resolve([0, 0]);
                                }
                            }, 2000); 
                        }
                    });
                `).then((result) => {
                    if (Array.isArray(result) && result.length === 2) {
                        const [width, height] = result;
                        if (width > 0 && height > 0) {
                            // 设置窗口大小为 modal 元素的大小
                            fontWindow.setSize(width, height);
                            // 获取屏幕尺寸
                            const { screen } = require('electron');
                            const primaryDisplay = screen.getPrimaryDisplay();
                            const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
                            // 计算窗口居中时的位置
                            const x = Math.round((screenWidth - width) / 2);
                            const y = Math.round((screenHeight - height) / 2);
                            // 设置窗口位置
                            fontWindow.setPosition(x, y);
                        }
                    } else {
                        console.error('Invalid result from executeJavaScript:', result);
                    }
                    // 显示窗口
                    fontWindow.show();
                }).catch((error) => {
                    console.error('Error getting modal size:', error);
                });
            });
            // 监听字体选择器窗口发送的 select-font 事件，并转发到主窗口
            fontWindow.webContents.on('ipc-message', (event, channel, font) => {
                if (channel === 'select-font') {
                    mainWindow.webContents.send('select-font', font);
                }
            });
        });

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
            if (showConfirmDialog) {
                const options = {
                    type: 'question',
                    buttons: ['最小化到系统托盘', '关闭程序'],
                    title: '确认关闭',
                    // message: '是否切换为迷你版，并最小化到系统托盘？',
                    checkboxLabel: '不再提示',
                    checkboxChecked: false
                };

                dialog.showMessageBox(mainWindow, options).then(({ response, checkboxChecked }) => {
                    showConfirmDialog = !checkboxChecked;
                    if (response === 0) {
                        IsMini = true;
                        mainWindow.hide();
                        createTrayIfNotExists();
                    } else {
                        if (!IsMini) {
                            app.quit();
                        } else {
                            mainWindow.hide();
                            createTrayIfNotExists();
                        }
                    }
                }).catch((err) => {
                    console.log(err);
                });
            } else {
                if (!IsMini) {
                    app.quit();
                } else {
                    mainWindow.hide();
                    createTrayIfNotExists();
                }
            }
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
                // 隐藏任务栏图标
                mainWindow.setSkipTaskbar(true);
                createTrayIfNotExists();
            } else {
                // 恢复默认大小
                mainWindow.setSize(initialWidth, initialHeight);
                mainWindow.setResizable(true);
                // 恢复原始位置
                mainWindow.setPosition(originalPosition[0], originalPosition[1]);
                isWindowAlwaysOnTop = false;
                // 设置更高的层级
                mainWindow.setAlwaysOnTop(isWindowAlwaysOnTop, 'screen-saver');
                // 显示任务栏图标
                mainWindow.setSkipTaskbar(false);
            }
            // 发送消息到渲染进程
            mainWindow.webContents.send('toggle-mini-version', isMiniVersion);
        });

        // 监听设置窗口透明度的事件
        ipcMain.on('set-window-opacity', (event, opacity) => { 
            mainWindow.setOpacity(opacity);
        });

        
    }

    function createTrayIfNotExists() {
        if (!tray) {
            const iconPath = path.join(__dirname, '/build/icon.ico'); 
            const trayIcon = nativeImage.createFromPath(iconPath);
            if (trayIcon.isEmpty()) {
                console.error('Failed to load tray icon:', iconPath);
            }
            tray = new Tray(trayIcon);
            const contextMenu = Menu.buildFromTemplate([
                { label: '显示窗口', click: () => {
                    mainWindow.show();
                    if (!isMiniVersion) {
                        mainWindow.setSkipTaskbar(false); // 显示任务栏图标
                    }
                } },
                { label: '退出程序', click: () => app.quit() }
            ]);
            tray.setToolTip('下班倒计时助手');
            tray.setContextMenu(contextMenu);
            tray.on('click', () => { 
                mainWindow.show();
                if (!isMiniVersion) {
                    mainWindow.setSkipTaskbar(false); // 显示任务栏图标
                }
            });
        }
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

}