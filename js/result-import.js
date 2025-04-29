// 添加导入功能到结果页面
document.addEventListener('DOMContentLoaded', function() {
    addImportFeatureToResultPage();
});

function addImportFeatureToResultPage() {
    const pageActions = document.querySelector('.page-actions');
    if (!pageActions) return;
    
    // 创建导入按钮
    const importBtn = document.createElement('button');
    importBtn.id = 'import-btn';
    importBtn.className = 'btn btn-secondary';
    importBtn.innerHTML = '<i class="fas fa-file-import"></i> 导入报告';
    
    // 插入到打印按钮之前
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        pageActions.insertBefore(importBtn, printBtn);
    } else {
        pageActions.appendChild(importBtn);
    }
    
    // 添加事件监听
    importBtn.addEventListener('click', showImportModal);
}

function showImportModal() {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'import-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">导入评估记录</div>
                <button class="modal-close" id="import-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p style="margin-bottom:12px;">选择一个JSON文件导入评估记录：</p>
                <input type="file" id="import-file" accept=".json" class="filter-input">
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancel-import">取消</button>
                <button class="btn btn-primary" id="confirm-import">导入</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.add('active');
    
    // 添加事件监听
    document.getElementById('import-close').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    });
    
    document.getElementById('cancel-import').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    });
    
    document.getElementById('confirm-import').addEventListener('click', () => {
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];
        
        if (!file) {
            showToast('导入失败', '请选择要导入的文件', 'error');
            return;
        }
        
        importReportFile(file);
        modal.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    });
}

function importReportFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // 处理多种可能的导入格式
            let newRecord = null;
            
            // 1. 已经是标准格式
            if (importedData.id && (importedData.scores || importedData.totalScore)) {
                newRecord = importedData;
            } 
            // 2. 数组中的第一个元素
            else if (Array.isArray(importedData) && importedData.length > 0 && importedData[0].id) {
                newRecord = importedData[0];
            } 
            // 3. Result页面导出的旧格式
            else if (importedData.report_type === 'container_deployment_assessment' && importedData.project && importedData.scores) {
                // 将旧格式转换为兼容格式
                newRecord = {
                    id: Date.now(),
                    date: importedData.project.assessment_date || importedData.exported_date || new Date().toISOString(),
                    gameName: importedData.project.name || 'Unknown Game',
                    gameVersion: importedData.project.version_type || '',
                    versionNumber: importedData.project.version_number || '',
                    totalScore: importedData.scores.total || 0,
                    sectionScores: importedData.scores.sections || {},
                    scores: importedData.scores.items || {}
                };
                
                if (importedData.configuration) {
                    newRecord.config = importedData.configuration;
                }
            } 
            // 4. 其他未知格式
            else {
                throw new Error("无法识别的数据格式");
            }
            
            // 验证记录格式是否有效
            if (!newRecord || !newRecord.id || typeof newRecord.totalScore === 'undefined') {
                showToast('导入失败', '导入文件中不包含有效的评估数据', 'error');
                return;
            }
            
            // 确保有基本字段
            if (!newRecord.date) {
                newRecord.date = new Date().toISOString();
            }
            
            if (!newRecord.sectionScores) {
                newRecord.sectionScores = {
                    1: { max: 50, current: 0 },
                    2: { max: 30, current: 0 },
                    3: { max: 20, current: 0 }
                };
            }
            
            // 将数据保存到会话存储
            sessionStorage.setItem('currentAssessment', JSON.stringify(newRecord));
            
            // 刷新页面以显示导入的报告
            location.reload();
        } catch (error) {
            console.error('Import error:', error);
            showToast('导入失败', '文件格式无效或损坏，请选择正确的JSON文件', 'error');
        }
    };
    reader.readAsText(file);
}