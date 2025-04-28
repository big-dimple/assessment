/**
 * 动态评估结果页面
 * 支持动态配置的评估结果页面
 */

/**
 * 初始化动态结果页面
 */
function initDynamicResultPage() {
    // 获取会话存储中的评估数据
    const assessmentData = JSON.parse(sessionStorage.getItem('currentAssessment'));
    if (!assessmentData) {
        showToast('错误', '未找到评估数据，将返回评估页面', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    // 使用评估数据中的配置
    if (assessmentData.config) {
        currentConfig = assessmentData.config;
    }
    
    // 设置页面标题
    document.getElementById('report-title').textContent = `${assessmentData.gameName || '未命名项目'} - 评估报告`;
    
    // 设置报告日期
    const reportDate = new Date(assessmentData.date);
    document.getElementById('report-date').textContent = `生成时间：${reportDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}`;
    
    // 设置项目信息
    document.getElementById('game-name').textContent = assessmentData.gameName || '未指定';
    document.getElementById('game-version').textContent = assessmentData.gameVersion || '-';
    document.getElementById('version-number').textContent = assessmentData.versionNumber || '-';
    
    // 设置总分和等级
    updateScoreDisplay(assessmentData);
    
    // 设置各部分得分
    updateSectionScores(assessmentData);
    
    // 设置雷达图
    renderDynamicRadarChart(assessmentData);
    
    // 设置风险评估
    updateRiskAssessment(assessmentData);
    
    // 设置主要缺失项
    renderMissingItems(assessmentData);
    
    // 设置改进建议
    renderSuggestions(assessmentData);
}

/**
 * 更新分数显示
 */
function updateScoreDisplay(data) {
    const totalScore = data.totalScore || 0;
    document.getElementById('total-score').textContent = totalScore;
    
    // 设置得分环形动画
    const scorePercent = totalScore / 100;
    const scoreLeftEl = document.getElementById('score-fill-left');
    const scoreRightEl = document.getElementById('score-fill-right');
    
    // 计算颜色
    let scoreColor = getScoreColor(totalScore);
    
    // 设置颜色
    scoreLeftEl.style.boxShadow = `inset 0 0 0 10px ${scoreColor}`;
    scoreRightEl.style.boxShadow = `inset 0 0 0 10px ${scoreColor}`;
    
    // 动画设置
    if (scorePercent > 0.5) {
        scoreLeftEl.style.transform = 'rotate(180deg)';
        scoreRightEl.style.transform = `rotate(${scorePercent * 360 - 180}deg)`;
    } else {
        scoreLeftEl.style.transform = `rotate(${scorePercent * 360}deg)`;
        scoreRightEl.style.transform = 'rotate(0deg)';
    }
    
    // 设置等级和风险等级
    const grade = getGradeFromScore(totalScore, data.config);
    const gradeBadge = document.getElementById('grade-badge');
    gradeBadge.textContent = grade + '级';
    gradeBadge.className = `grade-badge grade-${grade.toLowerCase()}`;
    
    let riskText = '';
    switch(grade) {
        case 'A': riskText = '风险等级：低'; break;
        case 'B': riskText = '风险等级：中低'; break;
        case 'C': riskText = '风险等级：中高'; break;
        case 'D': riskText = '风险等级：高'; break;
    }
    document.getElementById('grade-text').textContent = riskText;
    
    // 同步颜色设置
    document.getElementById('total-score').style.color = scoreColor;
}

/**
 * 获取分数颜色
 */
function getScoreColor(score) {
    if (score >= 90) return 'var(--success-color)';
    if (score >= 75) return 'var(--primary-color)';
    if (score >= 60) return 'var(--warning-color)';
    return 'var(--danger-color)';
}

/**
 * 获取等级
 */
function getGradeFromScore(score, config) {
    score = Number(score) || 0;
    
    // 使用评估时的阈值（如果有）
    if (config && config.gradeThresholds) {
        if (score >= config.gradeThresholds.A) return 'A';
        if (score >= config.gradeThresholds.B) return 'B';
        if (score >= config.gradeThresholds.C) return 'C';
        return 'D';
    }
    
    // 默认阈值
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    return 'D';
}

/**
 * 更新各部分得分
 */
function updateSectionScores(data) {
    const { sectionScores } = data;
    
    // 获取部分容器
    const sectionsContainer = document.querySelector('.section-scores');
    if (!sectionsContainer) return;
    
    // 清空容器
    sectionsContainer.innerHTML = '';
    
    // 动态生成部分卡片
    for (const sectionId in sectionScores) {
        if (sectionScores.hasOwnProperty(sectionId)) {
            // 查找部分信息
            const sectionInfo = currentConfig.sections.find(s => s.id == sectionId);
            if (!sectionInfo) continue;
            
            // 计算完成度百分比
            const sectionData = sectionScores[sectionId];
            const percentage = Math.round((sectionData.current / sectionData.max) * 100);
            
            // 创建部分卡片
            const sectionCard = document.createElement('div');
            sectionCard.className = 'section-card';
            
            // 添加图标
            let iconClass = 'fas fa-clipboard-list';
            if (sectionId == 1) iconClass = 'fas fa-server';
            else if (sectionId == 2) iconClass = 'fas fa-cubes';
            else if (sectionId == 3) iconClass = 'fas fa-mobile-alt';
            
            sectionCard.innerHTML = `
                <div class="section-header">
                    <div class="section-title">
                        <i class="${iconClass}"></i> ${sectionInfo.title}
                    </div>
                    <div class="section-score">${sectionData.current}/${sectionData.max}</div>
                </div>
                <div class="section-progress">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                </div>
                <div class="section-percentage">${percentage}%</div>
            `;
            
            sectionsContainer.appendChild(sectionCard);
        }
    }
}

/**
 * 渲染动态雷达图
 */
function renderDynamicRadarChart(data) {
    const ctx = document.getElementById('radar-chart');
    if (!ctx) return;
    
    // 获取部分标题和百分比得分
    const labels = [];
    const scores = [];
    
    for (const sectionId in data.sectionScores) {
        if (data.sectionScores.hasOwnProperty(sectionId)) {
            // 查找部分标题
            const section = currentConfig.sections.find(s => s.id == sectionId);
            if (!section) continue;
            
            labels.push(section.title);
            
            // 计算百分比得分
            const sectionData = data.sectionScores[sectionId];
            const percentage = (sectionData.current / sectionData.max) * 100;
            scores.push(percentage);
        }
    }
    
    // 创建雷达图
    const ctxContext = ctx.getContext('2d');
    new Chart(ctxContext, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: '当前完成度',
                data: scores,
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
            maintainAspectRatio: false,
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
                        stepSize: 20,
                        showLabelBackdrop: false,
                        color: 'var(--text-light)',
                        font: {
                            size: 11
                        }
                    },
                    pointLabels: {
                        font: {
                            size: 14,
                            weight: '500'
                        },
                        color: 'var(--text-color)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `完成度: ${context.raw.toFixed(1)}%`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * 更新风险评估
 */
function updateRiskAssessment(data) {
    const totalScore = data.totalScore || 0;
    const grade = getGradeFromScore(totalScore, data.config);
    
    const riskBox = document.getElementById('risk-box');
    const riskTitle = document.getElementById('risk-title');
    const riskDescription = document.getElementById('risk-description');
    
    // 设置样式
    riskBox.className = `risk-box risk-${grade.toLowerCase()}`;
    
    // 设置标题
    let titleText = '';
    switch(grade) {
        case 'A': titleText = '风险等级：低'; break;
        case 'B': titleText = '风险等级：中低'; break;
        case 'C': titleText = '风险等级：中高'; break;
        case 'D': titleText = '风险等级：高'; break;
    }
    riskTitle.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${titleText}`;
    
    // 设置描述
    let description = '';
    let conclusion = '';
    
    switch(grade) {
        case 'A':
            description = `
                <p>文档准备充分完整，各系统组件间依赖关系清晰，容器化部署所需的所有技术要点都已覆盖。当前状态下可以安排上线，预期不会出现严重问题。</p>
                <p>建议持续关注运行状态，并根据实际运行情况进一步优化容器化配置。</p>
            `;
            conclusion = '该游戏的容器化部署文档准备非常充分，已达到生产环境部署标准。所有关键文档和技术要点均已覆盖，团队对容器化架构有清晰的理解和规划。可以进入下一阶段的部署工作。';
            break;
        case 'B':
            description = `
                <p>文档准备较为充分，但有少量细节缺失。存在一定风险，但通过合理的规划和监控可以有效管理。</p>
                <p>建议补充完善缺失的文档项后再上线，或在上线过程中特别关注相关风险点，并制定应对策略。</p>
            `;
            conclusion = '该游戏的容器化部署文档准备较为充分，大部分关键文档已完备。存在少量需要改进的地方，但不影响整体部署计划。建议在进入正式部署前，补充完善缺失的文档项。';
            break;
        case 'C':
            description = `
                <p>文档准备不足，存在明显风险。虽然勉强可以上线，但在实际运行中可能会遇到较多问题，影响游戏稳定性和用户体验。</p>
                <p>如果必须按期上线，请务必做好应急预案，并在上线后迅速补充完善文档。建议考虑延期上线，优先完善关键文档。</p>
            `;
            conclusion = '该游戏的容器化部署文档存在明显不足，虽然勉强达到最低上线标准，但存在较多风险点。如坚持按期上线，必须制定详细的风险应对措施，并在上线后尽快完善文档。推荐考虑适当延期，优先解决关键文档缺失问题。';
            break;
        case 'D':
            description = `
                <p>文档准备严重不足，核心文档缺失。上线将面临严重风险，包括但不限于系统不稳定、性能问题、数据丢失、服务中断等。</p>
                <p><strong>不建议上线</strong>，必须完善核心文档后再考虑上线。继续推进上线计划可能导致严重后果，影响游戏声誉和商业利益。</p>
            `;
            conclusion = '该游戏的容器化部署文档严重不足，核心技术文档缺失，不符合上线标准。继续推进上线计划将面临严重风险，包括系统不稳定、性能问题和可能的数据丢失。强烈建议暂停上线计划，优先完善核心文档，待达到至少C级标准后再考虑上线。';
            break;
    }
    
    riskDescription.innerHTML = description;
    document.getElementById('assessment-conclusion').innerHTML = `
        <p style="font-weight: 500; margin-bottom: 8px;">评估结论：</p>
        <p>${conclusion}</p>
    `;
}

/**
 * 渲染主要缺失项
 */
function renderMissingItems(data) {
    const missingList = document.getElementById('missing-list');
    if (!missingList) return;
    
    missingList.innerHTML = '';
    
    // 收集所有评估项
    const allItems = [];
    currentConfig.sections.forEach(section => {
        section.items.forEach(item => {
            allItems.push({
                ...item,
                section: section.id,
                sectionTitle: section.title,
                importance: estimateImportance(item.max)
            });
        });
    });
    
    // 计算缺失项
    const missingThreshold = data.config ? data.config.missingThreshold : 0.6;
    const scores = data.scores || {};
    
    const missingItems = allItems.filter(item => {
        const score = scores[item.id] || 0;
        const ratio = score / item.max;
        return ratio < missingThreshold;
    });
    
    // 分配严重程度
    missingItems.forEach(item => {
        const score = scores[item.id] || 0;
        const ratio = score / item.max;
        item.severity = ratio < 0.3 ? 'severe' : (ratio < 0.5 ? 'major' : 'minor');
    });
    
    // 按严重程度和重要性排序
    missingItems.sort((a, b) => {
        const severityOrder = { 'severe': 3, 'major': 2, 'minor': 1 };
        const importanceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        
        // 先按严重程度排序
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        
        // 然后按重要性排序
        return importanceOrder[b.importance] - importanceOrder[a.importance];
    });
    
    // 渲染缺失项
    if (missingItems.length === 0) {
        const li = document.createElement('li');
        li.className = 'missing-item';
        li.innerHTML = `
            <div class="missing-header">
                <div class="missing-name">
                    <i class="fas fa-check-circle" style="color: var(--success-color);"></i> 未发现明显缺失项
                </div>
            </div>
            <p>所有文档项均达到或超过最低要求标准。恭喜！</p>
        `;
        missingList.appendChild(li);
        return;
    }
    
    // 最多显示6项
    const displayItems = missingItems.slice(0, 6);
    displayItems.forEach(item => {
        const li = document.createElement('li');
        li.className = `missing-item missing-item-${item.severity}`;
        
        // 设置图标
        let icon = '';
        let severityText = '';
        
        switch (item.severity) {
            case 'severe':
                icon = '<i class="fas fa-exclamation-circle missing-icon" style="color: var(--danger-color);"></i>';
                severityText = '<span class="severity-tag severity-severe">严重缺失</span>';
                break;
            case 'major':
                icon = '<i class="fas fa-exclamation-triangle missing-icon" style="color: var(--warning-color);"></i>';
                severityText = '<span class="severity-tag severity-major">明显不足</span>';
                break;
            case 'minor':
                icon = '<i class="fas fa-info-circle missing-icon" style="color: var(--primary-color);"></i>';
                severityText = '<span class="severity-tag severity-minor">部分缺失</span>';
                break;
        }
        
        // 设置按模块分类的图标
        let sectionIcon = '';
        switch (item.section) {
            case 1:
                sectionIcon = '<i class="fas fa-server" style="color: var(--text-light); margin-right: 6px;"></i>';
                break;
            case 2:
                sectionIcon = '<i class="fas fa-cubes" style="color: var(--text-light); margin-right: 6px;"></i>';
                break;
            case 3:
                sectionIcon = '<i class="fas fa-mobile-alt" style="color: var(--text-light); margin-right: 6px;"></i>';
                break;
            default:
                sectionIcon = '<i class="fas fa-clipboard-list" style="color: var(--text-light); margin-right: 6px;"></i>';
                break;
        }
        
        // 设置缺失项内容
        li.innerHTML = `
            <div class="missing-header">
                <div class="missing-name">
                    ${icon} ${sectionIcon}${item.name} ${severityText}
                </div>
                <div class="missing-score">${scores[item.id] || 0}/${item.max}</div>
            </div>
        `;
        
        // 添加建议
        const suggestion = generateSuggestion(item);
        const suggestionDiv = document.createElement('div');
        suggestionDiv.style.marginTop = '6px';
        suggestionDiv.style.fontSize = '14px';
        suggestionDiv.textContent = suggestion;
        li.appendChild(suggestionDiv);
        
        missingList.appendChild(li);
    });
    
    // 如果还有更多缺失项
    if (missingItems.length > 6) {
        const more = document.createElement('li');
        more.style.textAlign = 'center';
        more.style.marginTop = '10px';
        more.style.fontSize = '14px';
        more.style.color = 'var(--text-light)';
        more.textContent = `还有 ${missingItems.length - 6} 项文档不达标，需要改进`;
        missingList.appendChild(more);
    }
}

/**
 * 估计评估项的重要性
 */
function estimateImportance(maxScore) {
    if (maxScore >= 7) return 'high';
    if (maxScore >= 4) return 'medium';
    return 'low';
}

/**
 * 生成缺失项改进建议
 */
function generateSuggestion(item) {
    // 对常见项目的具体建议
    const standardSuggestions = {
        'system-architecture': '应提供完整的系统组件关系图和详细的模块功能描述，明确系统间交互流程和技术栈详情。',
        'deployment-requirements': '需详细说明硬件资源需求、软件依赖、网络要求、部署步骤和验证方法。',
        'network-solution': '应详述容器网络模型选择、服务暴露策略、网络隔离需求和负载均衡配置。',
        'persistent-storage': '应说明存储需求估算、卷类型选择、备份策略、数据持久性要求和存储性能参数。',
        'container-orchestration': '需提供容器间依赖关系图、启动顺序策略、扩缩容策略和服务发现配置。',
        'service-discovery': '应详述客户端如何发现和连接到容器化服务、负载均衡策略和故障转移机制。'
    };
    
    // 使用标准建议或生成通用建议
    if (standardSuggestions[item.id]) {
        return standardSuggestions[item.id];
    }
    
    return `请完善${item.name}，确保覆盖所有关键要点，提高文档的完整性和实用性。`;
}

/**
 * 渲染改进建议
 */
function renderSuggestions(data) {
    const suggestionsList = document.getElementById('suggestions-list');
    if (!suggestionsList) return;
    
    suggestionsList.innerHTML = '';
    
    // 获取总分和等级
    const totalScore = data.totalScore || 0;
    const grade = getGradeFromScore(totalScore, data.config);
    
    // 准备建议
    const suggestions = [];
    
    // 1. 通用建议：文档更新机制
    suggestions.push({
        icon: 'fas fa-sync-alt',
        title: '建立文档更新机制',
        content: '建议建立容器化相关文档的定期审核和更新机制，确保文档始终与实际部署环境保持一致，特别是在系统架构发生变化时及时更新相关文档。'
    });
    
    // 2. 基于评分等级的建议
    switch (grade) {
        case 'A':
            suggestions.push({
                icon: 'fas fa-chart-line',
                title: '持续优化容器化配置',
                content: '在完成基本部署后，建议持续监控系统性能指标，根据实际运行数据优化容器资源分配、网络配置和存储策略，进一步提升系统效率和稳定性。'
            });
            break;
        case 'B':
            suggestions.push({
                icon: 'fas fa-tools',
                title: '完善细节文档',
                content: '当前文档准备较为充分，但仍有细节需要完善。建议在上线前补充完善缺失的文档项，特别关注缺失项列表中标记的高优先级文档。'
            });
            break;
        case 'C':
            suggestions.push({
                icon: 'fas fa-exclamation-triangle',
                title: '制定风险控制计划',
                content: '虽然达到了最低上线标准，但当前存在明显风险。建议：1) 组建专门的风险监控小组；2) 准备详细的回滚方案；3) 考虑先在非核心区域小范围部署验证；4) 制定明确的文档补充时间表，并在上线后一周内完成。'
            });
            break;
        case 'D':
            suggestions.push({
                icon: 'fas fa-ban',
                title: '⚠️ 不建议当前状态上线',
                content: '当前文档准备严重不足，上线风险过高。建议组织专项会议，制定详细的文档补充计划，并分配足够的资源和时间完成文档准备工作。在达到至少C级（60分以上）准备程度前，不建议推进上线计划。'
            });
            break;
    }
    
    // 3. 基于各模块得分的建议
    const sectionScores = data.sectionScores;
    
    // 动态分析各部分得分情况
    for (const sectionId in sectionScores) {
        if (sectionScores.hasOwnProperty(sectionId)) {
            const sectionData = sectionScores[sectionId];
            const section = currentConfig.sections.find(s => s.id == sectionId);
            
            if (section && sectionData.current / sectionData.max < 0.7) {
                let iconClass = 'fas fa-clipboard-list';
                if (sectionId == 1) iconClass = 'fas fa-server';
                else if (sectionId == 2) iconClass = 'fas fa-cubes';
                else if (sectionId == 3) iconClass = 'fas fa-mobile-alt';
                
                let title = `完善${section.title}`;
                let content = `${section.title}对容器化部署的成功至关重要，建议重点完善此类别中的文档项，特别是高分值的核心文档，确保部署过程的顺利进行。`;
                
                suggestions.push({
                    icon: iconClass,
                    title,
                    content
                });
            }
        }
    }
    
    // 渲染建议
    suggestions.forEach(suggestion => {
        const div = document.createElement('div');
        div.className = 'suggestion-card';
        div.innerHTML = `
            <div class="suggestion-title">
                <i class="${suggestion.icon}"></i> ${suggestion.title}
            </div>
            <div class="suggestion-content">
                ${suggestion.content}
            </div>
        `;
        suggestionsList.appendChild(div);
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 延迟一些加载，确保其他脚本已初始化
    setTimeout(initDynamicResultPage, 100);
    
    // 设置按钮事件监听
    document.getElementById('print-btn').addEventListener('click', () => {
        window.print();
    });
    
    document.getElementById('export-btn').addEventListener('click', exportReport);
});

/**
 * 导出报告
 */
function exportReport() {
    const assessmentData = JSON.parse(sessionStorage.getItem('currentAssessment'));
    if (!assessmentData) return;
    
    // 准备导出数据
    const exportData = {
        exported_date: new Date().toISOString(),
        report_type: 'container_deployment_assessment',
        project: {
            name: assessmentData.gameName,
            version_type: assessmentData.gameVersion,
            version_number: assessmentData.versionNumber,
            assessment_date: assessmentData.date
        },
        scores: {
            total: assessmentData.totalScore,
            grade: getGradeFromScore(assessmentData.totalScore, assessmentData.config),
            sections: assessmentData.sectionScores,
            items: assessmentData.scores
        },
        configuration: assessmentData.config
    };
    
    // 创建下载链接
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const fileName = `${exportData.project.name || 'project'}_deployment_assessment_${formatDate(new Date())}.json`;
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    showToast('导出成功', '评估报告已导出');
}

/**
 * 格式化日期：YYYYMMDD
 */
function formatDate(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
}
