/**
 * 动态评估表单生成系统
 * 根据配置动态生成评估表单
 */

/**
 * 动态生成评估表单
 * 根据当前配置重新构建首页的评估表单
 */
function generateDynamicForm() {
    // 1. 首先清除现有表单
    const scoreForm = document.getElementById('score-form');
    if (!scoreForm) return;
    
    scoreForm.innerHTML = '';
    
    // 2. 根据配置生成表单
    currentConfig.sections.forEach(section => {
        // 创建部分卡片
        const sectionCard = document.createElement('div');
        sectionCard.className = 'card';
        
        // 部分标题和总分
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'section-header';
        sectionHeader.innerHTML = `
            <div class="section-title">
                <i class="fas fa-clipboard-list"></i> ${section.title}
            </div>
            <div class="section-total">得分：<span id="section${section.id}-score">0</span>/<span id="section${section.id}-max">${section.maxScore}</span></div>
        `;
        sectionCard.appendChild(sectionHeader);
        
        // 进度条
        const progressDiv = document.createElement('div');
        progressDiv.className = 'section-progress';
        progressDiv.innerHTML = `<div class="progress-bar" id="section${section.id}-progress"></div>`;
        sectionCard.appendChild(progressDiv);
        
        // 评估项网格
        const scoreGrid = document.createElement('div');
        scoreGrid.className = 'score-grid';
        scoreGrid.id = `section${section.id}-grid`;
        
        // 生成每个评估项
        section.items.forEach(item => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'score-item';
            scoreItem.innerHTML = `
                <div class="score-item-header">
                    <div class="score-item-name">${item.name}</div>
                    <div class="score-item-max">满分：${item.max}分</div>
                </div>
                <div class="score-item-input">
                    <input type="number" class="score-input" name="${item.id}" min="0" max="${item.max}" value="0" data-section="${section.id}" data-max="${item.max}">
                    <div class="score-help">
                        <i class="fas fa-info-circle"></i>
                        <div class="tooltip">
                            <strong>评分标准：</strong>评估${item.name}的完整性、准确性和实用性。
                        </div>
                    </div>
                </div>
            `;
            scoreGrid.appendChild(scoreItem);
        });
        
        sectionCard.appendChild(scoreGrid);
        scoreForm.appendChild(sectionCard);
    });
    
    // 3. 添加结果卡片
    const resultCard = document.createElement('div');
    resultCard.className = 'result-card';
    resultCard.innerHTML = `
        <div class="result-header">
            <div class="result-title">评估结果</div>
        </div>
        
        <div class="result-summary">
            <div class="score-display">
                <div class="total-score" id="total-score">0</div>
                <div class="score-label">总分 / 100</div>
                <div class="grade-badge grade-d" id="grade-badge">D级</div>
            </div>
            
            <div class="chart-container">
                <canvas id="radar-chart"></canvas>
            </div>
        </div>
        
        <div class="grade-indicator">
            <div class="grade grade-a" id="grade-a">A级 (90-100) 低风险</div>
            <div class="grade grade-b" id="grade-b">B级 (75-89) 中低风险</div>
            <div class="grade grade-c" id="grade-c">C级 (60-74) 中高风险</div>
            <div class="grade grade-d active" id="grade-d">D级 (<60) 高风险</div>
        </div>
        
        <div class="action-buttons">
            <button type="button" id="save-btn" class="btn btn-secondary">
                <i class="fas fa-save"></i> 保存评估
            </button>
            <button type="button" id="result-btn" class="btn btn-primary">
                <i class="fas fa-file-alt"></i> 查看详细报告
            </button>
        </div>
    `;
    scoreForm.appendChild(resultCard);
    
    // 4. 重新初始化事件监听和图表
    initScoreInputs();
    initButtonEvents();
    initRadarChart();
    updateScores();
}

/**
 * 初始化全局得分对象
 */
function initGlobalScores() {
    // 重置全局分数对象，根据当前配置动态创建
    window.sectionScores = {};
    
    currentConfig.sections.forEach(section => {
        window.sectionScores[section.id] = {
            max: section.maxScore,
            current: 0
        };
    });
    
    window.totalScore = 0;
}

/**
 * 更新雷达图
 * 支持动态部分数量
 */
function updateDynamicRadarChart() {
    if (!window.radarChart) return;
    
    // 获取部分标题和百分比得分
    const labels = [];
    const scores = [];
    
    for (const sectionId in window.sectionScores) {
        if (window.sectionScores.hasOwnProperty(sectionId)) {
            // 查找部分标题
            const section = currentConfig.sections.find(s => s.id == sectionId);
            if (section) {
                labels.push(section.title);
                
                // 计算百分比得分
                const percentage = (window.sectionScores[sectionId].current / window.sectionScores[sectionId].max) * 100;
                scores.push(percentage);
            }
        }
    }
    
    // 更新雷达图
    window.radarChart.data.labels = labels;
    window.radarChart.data.datasets[0].data = scores;
    window.radarChart.update();
}

/**
 * 加载评估表单
 * 在页面加载完成后调用
 */
function loadDynamicAssessmentForm() {
    // 确保配置已加载
    if (typeof loadConfigFromStorage === 'function') {
        loadConfigFromStorage();
    }
    
    // 初始化全局评分对象
    initGlobalScores();
    
    // 生成动态表单
    generateDynamicForm();
    
    console.log('动态评估表单已加载');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 延迟一些加载，确保其他脚本已初始化
    setTimeout(loadDynamicAssessmentForm, 100);
});

// 为了兼容更新评分的函数，覆盖原有的updateScores函数
window.originalUpdateScores = window.updateScores || function() {};

window.updateScores = function() {
    // 重置每个部分的得分
    for (const sectionId in window.sectionScores) {
        if (window.sectionScores.hasOwnProperty(sectionId)) {
            window.sectionScores[sectionId].current = 0;
        }
    }
    
    // 计算各部分的原始得分
    const rawScores = {};
    const maxRawScores = {};
    
    // 初始化计数器
    for (const sectionId in window.sectionScores) {
        rawScores[sectionId] = 0;
        maxRawScores[sectionId] = 0;
    }
    
    // 收集所有评分
    const scoreInputs = document.querySelectorAll('.score-input');
    scoreInputs.forEach(input => {
        const sectionId = input.dataset.section;
        const score = parseInt(input.value) || 0;
        const max = parseInt(input.dataset.max) || 0;
        
        rawScores[sectionId] += score;
        maxRawScores[sectionId] += max;
    });
    
    // 计算加权得分
    for (const sectionId in window.sectionScores) {
        if (window.sectionScores.hasOwnProperty(sectionId)) {
            const rawPercentage = maxRawScores[sectionId] > 0 ? 
                rawScores[sectionId] / maxRawScores[sectionId] : 0;
            
            const weightedMax = window.sectionScores[sectionId].max;
            window.sectionScores[sectionId].current = Math.round(rawPercentage * weightedMax);
        }
    }
    
    // 计算总分
    window.totalScore = 0;
    for (const sectionId in window.sectionScores) {
        if (window.sectionScores.hasOwnProperty(sectionId)) {
            window.totalScore += window.sectionScores[sectionId].current;
        }
    }
    
    // 更新显示
    updateScoreDisplay();
};

// 覆盖updateScoreDisplay以支持动态部分
window.originalUpdateScoreDisplay = window.updateScoreDisplay || function() {};

window.updateScoreDisplay = function() {
    // 更新各部分得分显示
    for (const sectionId in window.sectionScores) {
        if (window.sectionScores.hasOwnProperty(sectionId)) {
            const percentage = (window.sectionScores[sectionId].current / window.sectionScores[sectionId].max) * 100;
            
            // 更新得分文本
            const scoreEl = document.getElementById(`section${sectionId}-score`);
            if (scoreEl) {
                scoreEl.textContent = window.sectionScores[sectionId].current;
            }
            
            // 更新最大分值显示
            const maxEl = document.getElementById(`section${sectionId}-max`);
            if (maxEl) {
                maxEl.textContent = window.sectionScores[sectionId].max;
            }
            
            // 更新进度条
            const progressEl = document.getElementById(`section${sectionId}-progress`);
            if (progressEl) {
                progressEl.style.width = `${percentage}%`;
            }
            
            // 更新百分比显示
            const percentageEl = document.getElementById(`section${sectionId}-percentage`);
            if (percentageEl) {
                percentageEl.textContent = `${Math.round(percentage)}%`;
            }
        }
    }
    
    // 更新总分
    const totalScoreEl = document.getElementById('total-score');
    if (totalScoreEl) {
        totalScoreEl.textContent = window.totalScore;
    }
    
    // 更新等级显示
    updateGradeDisplay();
    
    // 更新雷达图
    updateDynamicRadarChart();
};

// 覆盖initRadarChart函数以支持动态数据
window.originalInitRadarChart = window.initRadarChart;

window.initRadarChart = function() {
    const ctx = document.getElementById('radar-chart');
    if (!ctx) return;
    
    // 获取部分标题
    const labels = currentConfig.sections.map(section => section.title);
    
    // 创建雷达图
    window.radarChart = new Chart(ctx.getContext('2d'), {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: '完成度 (%)',
                data: new Array(labels.length).fill(0), // 初始值为0
                fill: true,
                backgroundColor: 'rgba(90, 65, 245, 0.2)',
                borderColor: 'rgba(90, 65, 245, 0.8)',
                pointBackgroundColor: '#5A41F5',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(90, 65, 245)',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    angleLines: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
};

// 覆盖保存评估函数，支持动态部分
window.originalSaveAssessment = window.saveAssessment;

window.saveAssessment = function() {
    const gameNameInput = document.getElementById('game-name');
    if (!gameNameInput) {
        console.error('找不到游戏名称输入框');
        return;
    }
    
    const gameName = gameNameInput.value;
    
    if (!gameName) {
        showToast('错误', '请至少填写游戏名称', 'error');
        return;
    }
    
    // 收集评估数据
    const gameVersionSelect = document.getElementById('game-version');
    const versionNumberInput = document.getElementById('version-number');
    
    const gameVersion = gameVersionSelect ? gameVersionSelect.value : '';
    const versionNumber = versionNumberInput ? versionNumberInput.value : '';
    
    // 收集所有分数
    const scores = {};
    const scoreInputs = document.querySelectorAll('.score-input');
    
    scoreInputs.forEach(input => {
        scores[input.name] = parseInt(input.value) || 0;
    });
    
    // 创建评估记录
    const assessment = {
        id: Date.now(),
        date: new Date().toISOString(),
        gameName,
        gameVersion,
        versionNumber,
        scores,
        totalScore: window.totalScore,
        sectionScores: JSON.parse(JSON.stringify(window.sectionScores)),
        config: JSON.parse(JSON.stringify(currentConfig)) // 保存当前使用的配置
    };
    
    // 获取已有记录
    const savedAssessments = JSON.parse(localStorage.getItem('containerAssessments') || '[]');
    savedAssessments.push(assessment);
    
    // 保存到本地存储
    localStorage.setItem('containerAssessments', JSON.stringify(savedAssessments));
    
    // 更新加载选项
    if (typeof updateLoadOptions === 'function') {
        updateLoadOptions();
    }
    
    showToast('保存成功', '评估已保存到历史记录');
};

// 覆盖查看详细结果函数，支持动态部分
window.originalViewDetailedResults = window.viewDetailedResults;

window.viewDetailedResults = function() {
    const gameNameInput = document.getElementById('game-name');
    if (!gameNameInput) {
        console.error('找不到游戏名称输入框');
        return;
    }
    
    const gameName = gameNameInput.value;
    
    if (!gameName) {
        showToast('错误', '请至少填写游戏名称', 'error');
        return;
    }
    
    // 收集所有分数
    const scores = {};
    const scoreInputs = document.querySelectorAll('.score-input');
    
    scoreInputs.forEach(input => {
        scores[input.name] = parseInt(input.value) || 0;
    });
    
    // 创建评估数据
    const assessment = {
        date: new Date().toISOString(),
        gameName: document.getElementById('game-name').value,
        gameVersion: document.getElementById('game-version').value,
        versionNumber: document.getElementById('version-number').value,
        scores,
        totalScore: window.totalScore,
        sectionScores: JSON.parse(JSON.stringify(window.sectionScores)),
        config: JSON.parse(JSON.stringify(currentConfig)) // 保存当前使用的配置
    };
    
    // 将评估数据存储在会话存储中
    sessionStorage.setItem('currentAssessment', JSON.stringify(assessment));
    
    // 跳转到结果页面
    window.location.href = 'result.html';
};
