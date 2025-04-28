/**
 * 高级配置系统设计
 * 支持动态添加/删除评估大类和细项
 */
/**
 * 全局配置函数 - 确保这些在文件开头就定义
 */
// 显示配置面板
window.showConfigPanel = function() {
    const configPanel = document.getElementById('config-panel');
    if (!configPanel) return;
    
    // 检查是否有临时配置
    const tempConfig = sessionStorage.getItem('tempConfig');
    if (tempConfig) {
        try {
            currentConfig = JSON.parse(tempConfig);
        } catch (e) {
            console.error('Failed to load temporary configuration', e);
        }
    }
    
    // 渲染高级配置面板
    renderAdvancedConfigPanel();
    
    // 显示面板
    configPanel.classList.add('active');
};

// 隐藏配置面板
window.hideConfigPanel = function() {
    const configPanel = document.getElementById('config-panel');
    if (configPanel) {
        configPanel.classList.remove('active');
    }
};

// 初始化全局配置变量
window.currentConfig = window.currentConfig || {};

// 从存储加载配置
window.loadConfigFromStorage = function() {
    try {
        const savedConfig = localStorage.getItem('currentAssessmentConfig');
        if (savedConfig) {
            window.currentConfig = JSON.parse(savedConfig);
        } else if (typeof advancedDefaultConfig !== 'undefined') {
            window.currentConfig = JSON.parse(JSON.stringify(advancedDefaultConfig));
        }
    } catch (e) {
        console.error('Failed to load configuration', e);
        if (typeof advancedDefaultConfig !== 'undefined') {
            window.currentConfig = JSON.parse(JSON.stringify(advancedDefaultConfig));
        }
    }
};

// 更灵活的默认配置结构
const advancedDefaultConfig = {
    version: "v" + new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    name: "高级配置v1.0",
    date: new Date().toISOString(),
    
    // 风险等级阈值 - 不变
    gradeThresholds: {
        A: 90, // A级：90分及以上
        B: 75, // B级：75-89分
        C: 60, // C级：60-74分
        D: 0   // D级：60分以下
    },
    
    // 动态部分 - 大类及其细项配置
    sections: [
        {
            id: 1,
            title: "服务端需提供的技术文档",
            maxScore: 50,
            items: [
                { id: "system-architecture", name: "系统架构文档", max: 8 },
                { id: "deployment-requirements", name: "部署需求文档", max: 9 },
                { id: "configuration-management", name: "配置管理文档", max: 8 },
                { id: "database-docs", name: "数据库文档", max: 7 },
                { id: "monitoring-metrics", name: "监控指标文档", max: 6 },
                { id: "version-management", name: "版本管理文档", max: 4 },
                { id: "operation-manual", name: "操作手册", max: 4 },
                { id: "server-merge", name: "合服相关文档", max: 4 }
            ]
        },
        {
            id: 2,
            title: "容器化特定文档",
            maxScore: 30,
            items: [
                { id: "container-orchestration", name: "容器编排需求", max: 7 },
                { id: "persistent-storage", name: "持久化存储方案", max: 6 },
                { id: "network-solution", name: "网络方案", max: 6 },
                { id: "cicd-integration", name: "CI/CD集成", max: 4 },
                { id: "container-image-management", name: "容器镜像管理", max: 4 },
                { id: "performance-test", name: "性能测试报告", max: 3 }
            ]
        },
        {
            id: 3,
            title: "客户端需提供的技术文档",
            maxScore: 20,
            items: [
                { id: "client-version", name: "客户端版本文档", max: 5 },
                { id: "resource-management", name: "资源管理文档", max: 4 },
                { id: "service-discovery", name: "服务发现文档", max: 5 },
                { id: "security-requirements", name: "安全需求文档", max: 4 },
                { id: "client-logs", name: "客户端日志文档", max: 2 }
            ]
        }
        // 用户可以添加更多部分...
    ],
    
    // 缺失项阈值
    missingThreshold: 0.6
};

/**
 * 高级配置UI渲染
 * 创建动态配置界面
 */
function renderAdvancedConfigPanel() {
    const configPanel = document.getElementById('config-panel');
    if (!configPanel) return;
    
    // 清空现有内容
    const configBody = configPanel.querySelector('.config-body');
    if (!configBody) return;
    configBody.innerHTML = '';
    
    // 基本设置区域
    const basicSettingsSection = document.createElement('div');
    basicSettingsSection.className = 'config-section';
    basicSettingsSection.innerHTML = `
        <div class="config-section-title">
            <i class="fas fa-cog"></i> 基本设置
        </div>
        <div class="config-form-row">
            <label>配置版本名称：</label>
            <input type="text" id="config-name" placeholder="例如：高级配置v1.0" value="${currentConfig.name}">
        </div>
    `;
    configBody.appendChild(basicSettingsSection);
    
    // 风险等级区域
    const riskLevelSection = document.createElement('div');
    riskLevelSection.className = 'config-section';
    riskLevelSection.innerHTML = `
        <div class="config-section-title">
            <i class="fas fa-chart-line"></i> 风险等级阈值
        </div>
        <div class="config-form-row">
            <label>A级阈值：</label>
            <input type="number" id="threshold-a" min="75" max="100" value="${currentConfig.gradeThresholds.A}">
        </div>
        <div class="config-form-row">
            <label>B级阈值：</label>
            <input type="number" id="threshold-b" min="60" max="89" value="${currentConfig.gradeThresholds.B}">
        </div>
        <div class="config-form-row">
            <label>C级阈值：</label>
            <input type="number" id="threshold-c" min="1" max="74" value="${currentConfig.gradeThresholds.C}">
        </div>
        <div class="config-form-row">
            <label>缺失判断阈值：</label>
            <input type="number" id="missing-threshold" min="0.1" max="0.9" step="0.05" value="${currentConfig.missingThreshold}">
        </div>
    `;
    configBody.appendChild(riskLevelSection);
    
    // 动态评估大类区域
    const sectionsContainerDiv = document.createElement('div');
    sectionsContainerDiv.id = 'sections-container';
    configBody.appendChild(sectionsContainerDiv);
    
    // 添加评估大类按钮
    const addSectionBtn = document.createElement('button');
    addSectionBtn.className = 'btn btn-secondary';
    addSectionBtn.style.marginTop = '15px';
    addSectionBtn.innerHTML = '<i class="fas fa-plus"></i> 添加评估类别';
    addSectionBtn.onclick = addNewSection;
    configBody.appendChild(addSectionBtn);
    
    // 重置和验证容器
    const validationDiv = document.createElement('div');
    validationDiv.style.marginTop = '20px';
    validationDiv.style.padding = '10px';
    validationDiv.style.backgroundColor = 'rgba(90, 65, 245, 0.05)';
    validationDiv.style.borderRadius = '4px';
    
    validationDiv.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: 500;">配置验证 <span id="validation-status" style="color: var(--text-light);">(未验证)</span></div>
        <div id="validation-details" style="font-size: 13px; color: var(--text-light);">点击"验证配置"按钮检查配置的有效性。</div>
        <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button id="validate-config-btn" class="btn btn-secondary" style="flex: 1;">
                <i class="fas fa-check-circle"></i> 验证配置
            </button>
            <button id="preview-config-btn" class="btn btn-secondary" style="flex: 1;">
                <i class="fas fa-eye"></i> 预览评估表
            </button>
        </div>
    `;
    configBody.appendChild(validationDiv);
    
    // 渲染所有评估大类
    renderAllSections();
    
    // 添加验证按钮事件
    document.getElementById('validate-config-btn').addEventListener('click', validateConfiguration);
    document.getElementById('preview-config-btn').addEventListener('click', previewAssessmentForm);
    
    // 更新配置操作按钮
    updateConfigActions();
}

/**
 * 渲染所有评估大类
 */
function renderAllSections() {
    const sectionsContainer = document.getElementById('sections-container');
    if (!sectionsContainer) return;
    
    sectionsContainer.innerHTML = '';
    
    // 计算当前总权重
    const totalWeight = currentConfig.sections.reduce((sum, section) => sum + section.maxScore, 0);
    
    // 创建权重总和显示
    const weightSummary = document.createElement('div');
    weightSummary.className = 'config-section-title';
    weightSummary.style.display = 'flex';
    weightSummary.style.justifyContent = 'space-between';
    weightSummary.style.alignItems = 'center';
    weightSummary.style.marginBottom = '15px';
    
    const weightStatus = totalWeight === 100 ? 
        '<span style="color: var(--success-color);">✓ 权重总和: 100</span>' : 
        '<span style="color: var(--danger-color);">✗ 权重总和: ' + totalWeight + ' (应为100)</span>';
    
    weightSummary.innerHTML = `
        <div><i class="fas fa-balance-scale"></i> 评估类别配置</div>
        <div style="font-size: 14px;">${weightStatus}</div>
    `;
    sectionsContainer.appendChild(weightSummary);
    
    // 渲染每个部分
    currentConfig.sections.forEach((section, index) => {
        renderSectionConfig(section, index);
    });
}

/**
 * 渲染单个评估大类配置
 */
function renderSectionConfig(section, index) {
    const sectionsContainer = document.getElementById('sections-container');
    if (!sectionsContainer) return;
    
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'config-section';
    sectionDiv.style.marginBottom = '20px';
    sectionDiv.style.padding = '15px';
    sectionDiv.style.border = '1px solid var(--border-color)';
    sectionDiv.style.borderRadius = 'var(--border-radius)';
    sectionDiv.dataset.sectionIndex = index;
    
    // 部分标题和权重
    const headerDiv = document.createElement('div');
    headerDiv.style.display = 'flex';
    headerDiv.style.justifyContent = 'space-between';
    headerDiv.style.marginBottom = '15px';
    
    headerDiv.innerHTML = `
        <div class="config-form-row" style="flex: 3; margin-bottom: 0;">
            <label style="flex: 1;">类别名称：</label>
            <input type="text" class="section-title-input" value="${section.title}" style="flex: 2;">
        </div>
        <div class="config-form-row" style="flex: 1; margin-bottom: 0; margin-left: 10px;">
            <label style="flex: 1;">权重：</label>
            <input type="number" class="section-weight-input" min="1" max="99" value="${section.maxScore}" style="flex: 1;">
        </div>
    `;
    sectionDiv.appendChild(headerDiv);
    
    // 部分操作按钮
    const actionsDiv = document.createElement('div');
    actionsDiv.style.display = 'flex';
    actionsDiv.style.gap = '10px';
    actionsDiv.style.marginBottom = '15px';
    
    const addItemBtn = document.createElement('button');
    addItemBtn.className = 'btn btn-secondary';
    addItemBtn.style.flex = '1';
    addItemBtn.innerHTML = '<i class="fas fa-plus"></i> 添加评估项';
    addItemBtn.onclick = () => addNewItem(index);
    
    const removeSectionBtn = document.createElement('button');
    removeSectionBtn.className = 'btn btn-danger';
    removeSectionBtn.style.flex = '1';
    removeSectionBtn.innerHTML = '<i class="fas fa-trash"></i> 删除此类别';
    removeSectionBtn.onclick = () => removeSection(index);
    
    // 只有当有多于一个部分时才允许删除
    if (currentConfig.sections.length <= 1) {
        removeSectionBtn.disabled = true;
        removeSectionBtn.title = '至少需要保留一个评估类别';
    }
    
    actionsDiv.appendChild(addItemBtn);
    actionsDiv.appendChild(removeSectionBtn);
    sectionDiv.appendChild(actionsDiv);
    
    // 评估细项表格
    const itemsTable = document.createElement('table');
    itemsTable.style.width = '100%';
    itemsTable.style.borderCollapse = 'collapse';
    itemsTable.style.fontSize = '14px';
    
    // 表格头
    itemsTable.innerHTML = `
        <thead>
            <tr>
                <th style="text-align: left; padding: 8px; border-bottom: 1px solid var(--border-color);">评估项名称</th>
                <th style="text-align: center; padding: 8px; border-bottom: 1px solid var(--border-color);">最高分值</th>
                <th style="text-align: center; padding: 8px; border-bottom: 1px solid var(--border-color);">操作</th>
            </tr>
        </thead>
        <tbody class="items-tbody">
            <!-- 动态生成评估项 -->
        </tbody>
    `;
    sectionDiv.appendChild(itemsTable);
    
    // 计算项目总分
    const itemsTotalMax = section.items.reduce((sum, item) => sum + item.max, 0);
    
    // 显示项目总分
    const itemsSummary = document.createElement('div');
    itemsSummary.style.marginTop = '10px';
    itemsSummary.style.fontSize = '13px';
    itemsSummary.style.color = 'var(--text-light)';
    itemsSummary.style.textAlign = 'right';
    itemsSummary.textContent = `评估项总分: ${itemsTotalMax}分 | 权重最高分: ${section.maxScore}分`;
    sectionDiv.appendChild(itemsSummary);
    
    // 添加到容器
    sectionsContainer.appendChild(sectionDiv);
    
    // 渲染评估项
    const itemsTbody = itemsTable.querySelector('.items-tbody');
    section.items.forEach((item, itemIndex) => {
        const row = document.createElement('tr');
        row.dataset.itemIndex = itemIndex;
        
        row.innerHTML = `
            <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                <input type="text" class="item-name-input" value="${item.name}" style="width: 100%; padding: 5px;">
            </td>
            <td style="padding: 8px; border-bottom: 1px solid var(--border-color); text-align: center;">
                <input type="number" class="item-max-input" min="1" max="20" value="${item.max}" style="width: 60px; padding: 5px; text-align: center;">
            </td>
            <td style="padding: 8px; border-bottom: 1px solid var(--border-color); text-align: center;">
                <button class="btn btn-danger btn-sm remove-item-btn">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;
        
        itemsTbody.appendChild(row);
        
        // 仅当有多于一个项目时才允许删除
        const removeBtn = row.querySelector('.remove-item-btn');
        if (section.items.length <= 1) {
            removeBtn.disabled = true;
            removeBtn.title = '至少需要保留一个评估项';
        } else {
            removeBtn.onclick = () => removeItem(index, itemIndex);
        }
    });
    
    // 监听标题和权重变更
    const titleInput = headerDiv.querySelector('.section-title-input');
    const weightInput = headerDiv.querySelector('.section-weight-input');
    
    titleInput.addEventListener('change', () => {
        currentConfig.sections[index].title = titleInput.value;
        updateTemporaryConfig();
    });
    
    weightInput.addEventListener('change', () => {
        currentConfig.sections[index].maxScore = parseInt(weightInput.value) || 0;
        updateTemporaryConfig();
        renderAllSections(); // 更新权重总和显示
    });
    
    // 监听评估项变更
    itemsTbody.querySelectorAll('.item-name-input').forEach((input, i) => {
        input.addEventListener('change', () => {
            currentConfig.sections[index].items[i].name = input.value;
            updateTemporaryConfig();
        });
    });
    
    itemsTbody.querySelectorAll('.item-max-input').forEach((input, i) => {
        input.addEventListener('change', () => {
            currentConfig.sections[index].items[i].max = parseInt(input.value) || 1;
            updateTemporaryConfig();
            // 更新项目总分显示
            const newTotal = currentConfig.sections[index].items.reduce((sum, item) => sum + item.max, 0);
            itemsSummary.textContent = `评估项总分: ${newTotal}分 | 权重最高分: ${section.maxScore}分`;
        });
    });
}

/**
 * 添加新的评估大类
 */
function addNewSection() {
    // 生成新的部分ID
    const newId = currentConfig.sections.length > 0 ? 
        Math.max(...currentConfig.sections.map(s => s.id)) + 1 : 1;
    
    // 创建新部分
    const newSection = {
        id: newId,
        title: `新评估类别 ${newId}`,
        maxScore: 0, // 初始权重为0
        items: [
            { 
                id: `new-item-${Date.now()}`, 
                name: "新评估项", 
                max: 5 
            }
        ]
    };
    
    // 添加到配置
    currentConfig.sections.push(newSection);
    
    // 更新UI
    renderAllSections();
    updateTemporaryConfig();
}

/**
 * 移除评估大类
 */
function removeSection(index) {
    if (currentConfig.sections.length <= 1) {
        showToast('错误', '至少需要保留一个评估类别', 'error');
        return;
    }
    
    // 移除部分
    currentConfig.sections.splice(index, 1);
    
    // 更新UI
    renderAllSections();
    updateTemporaryConfig();
}

/**
 * 添加新的评估项
 */
function addNewItem(sectionIndex) {
    // 生成新项目ID
    const newId = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // 创建新项目
    const newItem = {
        id: newId,
        name: "新评估项",
        max: 5
    };
    
    // 添加到配置
    currentConfig.sections[sectionIndex].items.push(newItem);
    
    // 更新UI
    renderAllSections();
    updateTemporaryConfig();
}

/**
 * 移除评估项
 */
function removeItem(sectionIndex, itemIndex) {
    if (currentConfig.sections[sectionIndex].items.length <= 1) {
        showToast('错误', '至少需要保留一个评估项', 'error');
        return;
    }
    
    // 移除项目
    currentConfig.sections[sectionIndex].items.splice(itemIndex, 1);
    
    // 更新UI
    renderAllSections();
    updateTemporaryConfig();
}

/**
 * 更新临时配置状态
 */
function updateTemporaryConfig() {
    // 保存临时配置到会话存储，但不应用到系统
    sessionStorage.setItem('tempConfig', JSON.stringify(currentConfig));
}

/**
 * 验证配置有效性
 */
function validateConfiguration() {
    const validationStatus = document.getElementById('validation-status');
    const validationDetails = document.getElementById('validation-details');
    
    // 初始化验证状态
    let isValid = true;
    const issues = [];
    
    // 验证评估大类是否为空
    if (currentConfig.sections.length === 0) {
        isValid = false;
        issues.push('至少需要一个评估类别');
    }
    
    // 验证权重总和是否为100
    const totalWeight = currentConfig.sections.reduce((sum, section) => sum + section.maxScore, 0);
    if (totalWeight !== 100) {
        isValid = false;
        issues.push(`权重总和为${totalWeight}，应该为100`);
    }
    
    // 验证每个部分是否有评估项
    currentConfig.sections.forEach((section, index) => {
        if (section.items.length === 0) {
            isValid = false;
            issues.push(`评估类别"${section.title}"没有评估项`);
        }
        
        // 验证是否有重复ID
        const itemIds = section.items.map(item => item.id);
        const uniqueIds = new Set(itemIds);
        if (itemIds.length !== uniqueIds.size) {
            isValid = false;
            issues.push(`评估类别"${section.title}"中存在重复ID`);
        }
    });
    
    // 验证阈值设置
    const thresholdA = parseInt(document.getElementById('threshold-a').value);
    const thresholdB = parseInt(document.getElementById('threshold-b').value);
    const thresholdC = parseInt(document.getElementById('threshold-c').value);
    
    if (!(thresholdA > thresholdB && thresholdB > thresholdC)) {
        isValid = false;
        issues.push('阈值必须满足 A > B > C');
    }
    
    // 显示验证结果
    if (isValid) {
        validationStatus.textContent = '(验证通过)';
        validationStatus.style.color = 'var(--success-color)';
        validationDetails.innerHTML = '<span style="color: var(--success-color);">✓ 所有检查项通过验证</span>';
    } else {
        validationStatus.textContent = '(验证失败)';
        validationStatus.style.color = 'var(--danger-color)';
        
        let issuesHtml = '<span style="color: var(--danger-color);">发现以下问题：</span><ul style="margin-top: 5px; margin-bottom: 0;">';
        issues.forEach(issue => {
            issuesHtml += `<li style="color: var(--danger-color);">${issue}</li>`;
        });
        issuesHtml += '</ul>';
        
        validationDetails.innerHTML = issuesHtml;
    }
    
    return isValid;
}

/**
 * 预览评估表单
 */
function previewAssessmentForm() {
    // 首先验证配置
    if (!validateConfiguration()) {
        showToast('错误', '配置验证失败，请先修复问题', 'error');
        return;
    }
    
    // 创建预览窗口
    const previewModal = document.createElement('div');
    previewModal.className = 'modal';
    previewModal.style.position = 'fixed';
    previewModal.style.top = '0';
    previewModal.style.left = '0';
    previewModal.style.right = '0';
    previewModal.style.bottom = '0';
    previewModal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    previewModal.style.display = 'flex';
    previewModal.style.alignItems = 'center';
    previewModal.style.justifyContent = 'center';
    previewModal.style.zIndex = '1000';
    
    // 预览内容
    const previewContent = document.createElement('div');
    previewContent.style.backgroundColor = 'var(--white)';
    previewContent.style.borderRadius = 'var(--border-radius)';
    previewContent.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    previewContent.style.width = '90%';
    previewContent.style.maxWidth = '800px';
    previewContent.style.maxHeight = '90vh';
    previewContent.style.overflow = 'auto';
    previewContent.style.padding = '20px';
    
    // 预览标题
    const previewHeader = document.createElement('div');
    previewHeader.style.display = 'flex';
    previewHeader.style.justifyContent = 'space-between';
    previewHeader.style.alignItems = 'center';
    previewHeader.style.marginBottom = '20px';
    previewHeader.style.paddingBottom = '10px';
    previewHeader.style.borderBottom = '1px solid var(--border-color)';
    
    const previewTitle = document.createElement('h3');
    previewTitle.style.margin = '0';
    previewTitle.textContent = '评估表单预览';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'btn btn-secondary';
    closeButton.innerHTML = '<i class="fas fa-times"></i> 关闭';
    closeButton.onclick = () => document.body.removeChild(previewModal);
    
    previewHeader.appendChild(previewTitle);
    previewHeader.appendChild(closeButton);
    previewContent.appendChild(previewHeader);
    
    // 生成预览内容
    currentConfig.sections.forEach(section => {
        // 部分标题
        const sectionTitle = document.createElement('div');
        sectionTitle.style.fontSize = '16px';
        sectionTitle.style.fontWeight = '600';
        sectionTitle.style.marginTop = '20px';
        sectionTitle.style.marginBottom = '15px';
        sectionTitle.innerHTML = `
            <i class="fas fa-clipboard-list"></i> ${section.title}
            <span style="float: right; font-weight: normal; color: var(--text-light);">
                最高得分: ${section.maxScore}分
            </span>
        `;
        previewContent.appendChild(sectionTitle);
        
        // 进度条
        const progressContainer = document.createElement('div');
        progressContainer.style.height = '6px';
        progressContainer.style.backgroundColor = 'var(--secondary-color)';
        progressContainer.style.borderRadius = '3px';
        progressContainer.style.marginBottom = '20px';
        progressContainer.innerHTML = '<div style="height: 100%; width: 0%; background-color: var(--primary-color); border-radius: 3px;"></div>';
        previewContent.appendChild(progressContainer);
        
        // 评估项网格
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
        grid.style.gap = '15px';
        grid.style.marginBottom = '20px';
        
        section.items.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.style.backgroundColor = 'var(--white)';
            itemCard.style.border = '1px solid var(--border-color)';
            itemCard.style.borderRadius = 'var(--border-radius)';
            itemCard.style.padding = '15px';
            
            itemCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div style="font-weight: 500; font-size: 14px;">${item.name}</div>
                    <div style="font-size: 13px; color: var(--text-light);">满分：${item.max}分</div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="number" style="width: 60px; padding: 8px 10px; border: 1px solid var(--border-color); border-radius: 4px; text-align: center;" value="0" min="0" max="${item.max}">
                    <div style="color: var(--text-light); cursor: pointer;">
                        <i class="fas fa-info-circle"></i>
                    </div>
                </div>
            `;
            
            grid.appendChild(itemCard);
        });
        
        previewContent.appendChild(grid);
    });
    
    // 添加到DOM
    previewModal.appendChild(previewContent);
    document.body.appendChild(previewModal);
    
    // 显示模态框
    setTimeout(() => {
        previewModal.style.opacity = '1';
    }, 10);
}

/**
 * 更新配置操作按钮
 */
function updateConfigActions() {
    const configActions = document.querySelector('.config-actions');
    if (!configActions) return;
    
    // 清空现有按钮
    configActions.innerHTML = '';
    
    // 取消按钮
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = '取消';
    cancelBtn.onclick = () => {
        // 恢复原始配置
        loadConfigFromStorage();
        window.hideConfigPanel();
    };
    
    // 重置按钮
    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-secondary';
    resetBtn.textContent = '重置默认';
    resetBtn.onclick = resetToDefaultConfig;
    
    // 保存按钮
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = '保存配置';
    saveBtn.onclick = saveAdvancedConfig;
    
    // 添加按钮
    configActions.appendChild(resetBtn);
    configActions.appendChild(cancelBtn);
    configActions.appendChild(saveBtn);
}

/**
 * 重置为默认配置
 */
function resetToDefaultConfig() {
    if (confirm('确定要重置为默认配置吗？所有自定义设置将丢失。')) {
        currentConfig = JSON.parse(JSON.stringify(advancedDefaultConfig));
        renderAdvancedConfigPanel();
        showToast('重置成功', '已恢复默认配置');
    }
}

/**
 * 保存高级配置
 */
function saveAdvancedConfig() {
    // 首先验证配置
    if (!validateConfiguration()) {
        showToast('错误', '配置验证失败，请先修复问题', 'error');
        return;
    }
    
    // 更新名称
    currentConfig.name = document.getElementById('config-name').value || "高级配置";
    
    // 更新阈值
    currentConfig.gradeThresholds.A = parseInt(document.getElementById('threshold-a').value);
    currentConfig.gradeThresholds.B = parseInt(document.getElementById('threshold-b').value);
    currentConfig.gradeThresholds.C = parseInt(document.getElementById('threshold-c').value);
    currentConfig.missingThreshold = parseFloat(document.getElementById('missing-threshold').value);
    
    // 更新版本和日期
    currentConfig.version = "v" + new Date().toISOString().split('T')[0].replace(/-/g, '.');
    currentConfig.date = new Date().toISOString();
    
    // 保存到本地存储
    localStorage.setItem('currentAssessmentConfig', JSON.stringify(currentConfig));
    
    // 移除临时配置
    sessionStorage.removeItem('tempConfig');
    
    showToast('保存成功', '配置已更新，请刷新页面以应用新配置', 'success');
    
    // 关闭配置面板
    window.hideConfigPanel();
    
    // 提示用户刷新页面
    setTimeout(() => {
        if (confirm('需要刷新页面以应用新配置。现在刷新吗？')) {
            window.location.reload();
        }
    }, 1000);
}

/**
 * 增强型配置系统初始化
 */
function initAdvancedConfigSystem() {
    // 加载配置
    loadConfigFromStorage();
    
    // 覆盖原有的showConfigPanel函数
    window.showConfigPanel = function() {
        const configPanel = document.getElementById('config-panel');
        if (!configPanel) return;
        
        // 检查是否有临时配置
        const tempConfig = sessionStorage.getItem('tempConfig');
        if (tempConfig) {
            try {
                currentConfig = JSON.parse(tempConfig);
            } catch (e) {
                console.error('Failed to load temporary configuration', e);
            }
        }
        
        // 渲染高级配置面板
        renderAdvancedConfigPanel();
        
        // 显示面板
        configPanel.classList.add('active');
    };
    
    // 设置配置面板链接
    document.querySelectorAll('.config-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.showConfigPanel();
        });
    });
}

// 初始化高级配置系统
document.addEventListener('DOMContentLoaded', function() {
    initAdvancedConfigSystem();
});
