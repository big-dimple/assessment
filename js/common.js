/**
 * 手游容器化部署就绪度评估系统 - 通用功能脚本
 * 包含所有页面共用的功能和工具函数
 */

// 确保全局变量即使在config-system.js尚未加载时也能正常工作
if (typeof window.sectionScores === 'undefined') {
    window.sectionScores = {
        1: { max: 50, current: 0 },
        2: { max: 30, current: 0 },
        3: { max: 20, current: 0 }
    };
}

if (typeof window.totalScore === 'undefined') {
    window.totalScore = 0;
}

/**
 * 初始化导航菜单
 */
function initNavigation() {
    // 设置当前活动页面
    const currentPage = window.location.pathname.split('/').pop();
    
    // 重置所有活动状态
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.classList.remove('active');
    });
    
    // 设置当前页面的活动状态
    switch(currentPage) {
        case 'index.html':
            document.getElementById('nav-assessment').classList.add('active');
            break;
        case 'historical-evaluations.html':
            document.getElementById('nav-history-list').classList.add('active');
            openSubmenu('history-submenu', 'history-toggle');
            break;
        case 'help.html':
            document.getElementById('nav-help').classList.add('active');
            break;
        case 'result.html':
            // 结果页面是历史评估的一部分
            document.getElementById('nav-history-list').classList.add('active');
            openSubmenu('history-submenu', 'history-toggle');
            break;
    }
    
    // 折叠菜单切换事件
    const menuToggles = document.querySelectorAll('.menu-toggle');
    menuToggles.forEach(toggle => {
        const submenuId = toggle.nextElementSibling.id;
        toggle.addEventListener('click', () => {
            toggleSubmenu(submenuId, toggle.id);
        });
    });

    // 设置配置面板链接
    document.querySelectorAll('.config-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof window.showConfigPanel === 'function') {
                window.showConfigPanel();
            } else {
                console.error('showConfigPanel function not found');
            }
        });
    });

    // 配置面板关闭按钮
    const configCloseBtn = document.getElementById('config-close');
    if (configCloseBtn) {
        configCloseBtn.addEventListener('click', function() {
            if (typeof window.hideConfigPanel === 'function') {
                window.hideConfigPanel();
            } else {
                document.getElementById('config-panel').classList.remove('active');
            }
        });
    }
}

/**
 * 切换子菜单显示状态
 * @param {string} submenuId - 子菜单ID
 * @param {string} toggleId - 开关ID
 */
function toggleSubmenu(submenuId, toggleId) {
    const submenu = document.getElementById(submenuId);
    const toggle = document.getElementById(toggleId);
    
    if (submenu.classList.contains('open')) {
        submenu.classList.remove('open');
        toggle.classList.remove('open');
    } else {
        submenu.classList.add('open');
        toggle.classList.add('open');
    }
}

/**
 * 打开子菜单
 * @param {string} submenuId - 子菜单ID
 * @param {string} toggleId - 开关ID
 */
function openSubmenu(submenuId, toggleId) {
    const submenu = document.getElementById(submenuId);
    const toggle = document.getElementById(toggleId);
    
    if (submenu && toggle) {
        submenu.classList.add('open');
        toggle.classList.add('open');
    }
}

/**
 * 更新评分
 * 根据当前配置和输入分数计算总分和分类得分
 */
function updateScores() {
    // 如果配置未初始化，先加载配置
    if (typeof currentConfig === 'undefined') {
        console.warn('配置未初始化，使用默认配置');
        return;
    }
    
    // 重置分数
    window.sectionScores[1].current = 0;
    window.sectionScores[2].current = 0;
    window.sectionScores[3].current = 0;
    
    // 计算各部分原始分数
    const rawScores = {1: 0, 2: 0, 3: 0};
    const maxRawScores = {1: 0, 2: 0, 3: 0};
    
    // 收集所有评分输入
    const scoreInputs = document.querySelectorAll('.score-input');
    
    scoreInputs.forEach(input => {
        const section = parseInt(input.dataset.section);
        const score = parseInt(input.value) || 0;
        const max = parseInt(input.dataset.max);
        
        // 添加到原始分数
        rawScores[section] += score;
        maxRawScores[section] += max;
    });
    
    // 根据配置权重计算实际得分
    for (let section = 1; section <= 3; section++) {
        // 计算完成百分比
        const percentage = maxRawScores[section] > 0 ? 
                          rawScores[section] / maxRawScores[section] : 0;
        
        // 应用权重
        const weightedMax = currentConfig.sections[section-1].maxScore;
        window.sectionScores[section].current = Math.round(percentage * weightedMax);
        window.sectionScores[section].max = weightedMax;
    }
    
    // 计算总分
    window.totalScore = window.sectionScores[1].current + window.sectionScores[2].current + window.sectionScores[3].current;
    
    // 更新显示
    updateScoreDisplay();
}

/**
 * 更新分数显示
 * 更新UI中的分数显示和进度条
 */
function updateScoreDisplay() {
    // 更新各部分得分和进度条
    for (let section = 1; section <= 3; section++) {
        const percentage = (window.sectionScores[section].current / window.sectionScores[section].max) * 100;
        
        // 更新得分文本
        const scoreEl = document.getElementById(`section${section}-score`);
        if (scoreEl) {
            scoreEl.textContent = window.sectionScores[section].current;
        }
        
        // 更新最大分值显示（如果存在）
        const maxEl = document.getElementById(`section${section}-max`);
        if (maxEl) {
            maxEl.textContent = window.sectionScores[section].max;
        }
        
        // 更新进度条
        const progressEl = document.getElementById(`section${section}-progress`);
        if (progressEl) {
            progressEl.style.width = `${percentage}%`;
        }
        
        // 更新百分比显示（如果存在）
        const percentageEl = document.getElementById(`section${section}-percentage`);
        if (percentageEl) {
            percentageEl.textContent = `${Math.round(percentage)}%`;
        }
    }
    
    // 更新总分
    const totalScoreEl = document.getElementById('total-score');
    if (totalScoreEl) {
        totalScoreEl.textContent = window.totalScore;
    }
    
    // 更新等级显示
    updateGradeDisplay();
    
    // 更新雷达图（如果有）
    if (typeof updateRadarChart === 'function') {
        updateRadarChart();
    }
}

/**
 * 更新等级显示
 * 根据当前分数更新UI中的等级显示
 */
function updateGradeDisplay() {
    const grade = getGradeFromScore(window.totalScore);
    
    // 更新等级徽章
    const gradeBadge = document.getElementById('grade-badge');
    if (gradeBadge) {
        gradeBadge.textContent = grade + '级';
        gradeBadge.className = `grade-badge grade-${grade.toLowerCase()}`;
    }
    
    // 更新等级指示器
    const grades = ['a', 'b', 'c', 'd'];
    grades.forEach(g => {
        const gradeEl = document.getElementById(`grade-${g}`);
        if (gradeEl) {
            if (g === grade.toLowerCase()) {
                gradeEl.classList.add('active');
            } else {
                gradeEl.classList.remove('active');
            }
        }
    });
    
    // 更新风险等级文本（如果存在）
    const gradeText = document.getElementById('grade-text');
    if (gradeText) {
        let riskText = '';
        switch(grade) {
            case 'A': riskText = '风险等级：低'; break;
            case 'B': riskText = '风险等级：中低'; break;
            case 'C': riskText = '风险等级：中高'; break;
            case 'D': riskText = '风险等级：高'; break;
        }
        gradeText.textContent = riskText;
    }
}

/**
 * 根据分数获取等级
 * @param {number} score - 总分
 * @returns {string} 等级（A/B/C/D）
 */
function getGradeFromScore(score) {
    score = Number(score) || 0;
    
    // 使用配置中的阈值（如果有）
    if (typeof currentConfig !== 'undefined') {
        if (score >= currentConfig.gradeThresholds.A) return 'A';
        if (score >= currentConfig.gradeThresholds.B) return 'B';
        if (score >= currentConfig.gradeThresholds.C) return 'C';
        return 'D';
    }
    
    // 默认阈值
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    return 'D';
}

/**
 * 显示提示信息
 * @param {string} title - 提示标题
 * @param {string} message - 提示内容
 * @param {string} type - 提示类型（success/error）
 */
function showToast(title, message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    const icon = toast.querySelector('.toast-icon i');
    
    // 设置提示类型
    toast.className = 'toast';
    toast.classList.add(`toast-${type}`);
    
    // 设置图标
    if (type === 'success') {
        icon.className = 'fas fa-check-circle';
    } else {
        icon.className = 'fas fa-exclamation-circle';
    }
    
    // 设置内容
    toast.querySelector('.toast-title').textContent = title;
    toast.querySelector('.toast-message').textContent = message;
    
    // 显示提示
    toast.classList.add('show');
    
    // 3秒后隐藏
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * 初始化标签页切换
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    if (tabButtons.length === 0) return;
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有标签和内容的活动状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // 添加当前标签和内容的活动状态
            this.classList.add('active');
            const tabId = this.dataset.tab;
            const contentEl = document.getElementById(tabId);
            if (contentEl) {
                contentEl.classList.add('active');
            }
            
            // 如果有URL哈希标记，则更新
            if (history.pushState) {
                history.pushState(null, null, `#${tabId}`);
            } else {
                location.hash = `#${tabId}`;
            }
            
            // 如果是分析标签页，更新图表
            if (tabId === 'analytics-summary' && typeof updateAnalyticsCharts === 'function') {
                updateAnalyticsCharts();
            }
        });
    });
    
    // 检查URL哈希并激活对应标签
    const hash = window.location.hash.substring(1);
    if (hash) {
        const tabButton = document.querySelector(`.tab-button[data-tab="${hash}"]`);
        if (tabButton) {
            tabButton.click();
        }
    }
}

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @param {string} format - 格式（默认：YYYYMMDD）
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date, format = 'YYYYMMDD') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    switch (format) {
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        case 'YYYY/MM/DD':
            return `${year}/${month}/${day}`;
        case 'MM/DD/YYYY':
            return `${month}/${day}/${year}`;
        case 'DD/MM/YYYY':
            return `${day}/${month}/${year}`;
        case 'YYYY年MM月DD日':
            return `${year}年${month}月${day}日`;
        default: // YYYYMMDD
            return `${year}${month}${day}`;
    }
}

/**
 * 初始化页面
 * 在页面加载完成后调用各种初始化函数
 */
document.addEventListener('DOMContentLoaded', function() {
    // 初始化导航
    initNavigation();
    
    // 初始化标签页（如果存在）
    initTabs();
    
    // 检查URL参数执行特定操作
    checkUrlParams();
    
    // 检查浏览器兼容性
    checkBrowserCompatibility();
    
    // 初始化帮助页面特定功能（如果在帮助页面）
    if (window.location.pathname.includes('help.html') && typeof initHelpPage === 'function') {
        initHelpPage();
    }
});

/**
 * 检查URL参数并执行对应操作
 */
function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    
    // 如果有加载参数，尝试加载指定ID的评估
    const loadId = params.get('load');
    if (loadId && typeof loadAssessmentById === 'function') {
        loadAssessmentById(loadId);
    }
    
    // 如果有分析参数，切换到分析标签页
    if (params.get('analytics') === 'true') {
        const analyticsTab = document.querySelector('.tab-button[data-tab="analytics-summary"]');
        if (analyticsTab) {
            analyticsTab.click();
        }
    }
}

/**
 * 检测浏览器存储可用性
 * @returns {boolean} 是否可用
 */
function isStorageAvailable() {
    try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 检查当前浏览器环境是否支持所需功能
 */
function checkBrowserCompatibility() {
    const issues = [];
    
    // 检查localStorage
    if (!isStorageAvailable()) {
        issues.push('本地存储不可用，评估数据无法保存');
    }
    
    // 检查ES6兼容性
    try {
        new Function('const test = () => {}; class Test {}');
    } catch (e) {
        issues.push('浏览器不支持现代JavaScript功能，可能导致系统异常');
    }
    
    // 如果发现兼容性问题，显示警告
    if (issues.length > 0) {
        console.warn('浏览器兼容性问题:', issues);
        
        // 创建警告框
        const warningDiv = document.createElement('div');
        warningDiv.style.position = 'fixed';
        warningDiv.style.top = '10px';
        warningDiv.style.left = '50%';
        warningDiv.style.transform = 'translateX(-50%)';
        warningDiv.style.padding = '15px 20px';
        warningDiv.style.backgroundColor = '#fff3cd';
        warningDiv.style.color = '#856404';
        warningDiv.style.border = '1px solid #ffeeba';
        warningDiv.style.borderRadius = '4px';
        warningDiv.style.zIndex = '1000';
        warningDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        
        let warningContent = '<strong>浏览器兼容性警告</strong><br>';
        issues.forEach(issue => {
            warningContent += `- ${issue}<br>`;
        });
        warningContent += '请使用最新版Chrome、Firefox或Edge浏览器获得最佳体验。';
        
        warningDiv.innerHTML = warningContent;
        
        // 添加关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '5px';
        closeBtn.style.right = '10px';
        closeBtn.style.border = 'none';
        closeBtn.style.background = 'none';
        closeBtn.style.fontSize = '20px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.color = '#856404';
        
        closeBtn.onclick = function() {
            document.body.removeChild(warningDiv);
        };
        
        warningDiv.appendChild(closeBtn);
        document.body.appendChild(warningDiv);
    }
}

/**
 * 初始化模态框通用功能
 * @param {string} modalId - 模态框ID
 * @param {string} closeId - 关闭按钮ID
 * @param {string} cancelId - 取消按钮ID
 * @param {string} confirmId - 确认按钮ID
 * @param {Function} confirmCallback - 确认回调函数
 */
function initModal(modalId, closeId, cancelId, confirmId, confirmCallback) {
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeId);
    const cancelBtn = document.getElementById(cancelId);
    const confirmBtn = document.getElementById(confirmId);
    
    if (!modal) return;
    
    // 关闭按钮事件
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
    
    // 取消按钮事件
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
    
    // 确认按钮事件
    if (confirmBtn && typeof confirmCallback === 'function') {
        confirmBtn.addEventListener('click', () => {
            confirmCallback();
            modal.classList.remove('active');
        });
    }
}
