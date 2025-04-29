/**
 * 游戏上线评估系统 - 服务器备份功能
 * 使用简单的HTTP请求实现数据备份到服务器
 */

const ServerBackup = {
    // 配置
    apiEndpoint: 'https://pinggu.yxzu.cc/backup-api.php',  // 您的服务器地址
    apiKey: 'pK8zU3Xw7vL9qT5bR2dN6mY1aE4cH0jS',  // 与PHP脚本中的密钥一致
    
    // 初始化
    init: function() {
        this.addBackupButtons();
    },
    
    // 添加备份按钮到UI
    addBackupButtons: function() {
        // 如果在历史记录页面，添加备份按钮
        if (document.getElementById('export-all-btn')) {
            const exportAllBtn = document.getElementById('export-all-btn');
            const parentElement = exportAllBtn.parentElement;
            
            // 创建备份到服务器按钮
            const serverBackupBtn = document.createElement('button');
            serverBackupBtn.id = 'server-backup-btn';
            serverBackupBtn.className = 'btn btn-secondary';
            serverBackupBtn.innerHTML = '<i class="fas fa-server"></i> 备份到服务器';
            serverBackupBtn.addEventListener('click', () => this.backupToServer());
            
            // 创建从服务器恢复按钮
            const serverRestoreBtn = document.createElement('button');
            serverRestoreBtn.id = 'server-restore-btn';
            serverRestoreBtn.className = 'btn btn-secondary';
            serverRestoreBtn.innerHTML = '<i class="fas fa-download"></i> 从服务器恢复';
            serverRestoreBtn.addEventListener('click', () => this.restoreFromServer());
            
            // 添加到页面
            parentElement.appendChild(serverBackupBtn);
            parentElement.appendChild(serverRestoreBtn);
        }
    },
    
    // 备份到服务器
    backupToServer: async function() {
        try {
            // 显示进行中提示
            showToast('处理中', '正在备份数据到服务器...', 'info');
            
            // 获取本地存储的所有评估数据
            const assessments = JSON.parse(localStorage.getItem('containerAssessments') || '[]');
            
            // 准备备份数据
            const backupData = {
                timestamp: new Date().toISOString(),
                system_info: {
                    version: '1.0.0',
                    app_name: '游戏上线评估系统'
                },
                assessments: assessments
            };
            
            // 发送POST请求到服务器
            const response = await fetch(`${this.apiEndpoint}?action=upload&key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(backupData)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || '备份失败');
            }
            
            // 显示成功提示
            showToast('备份成功', '数据已成功备份到服务器');
            return true;
        } catch (error) {
            console.error('备份到服务器失败:', error);
            showToast('备份失败', error.message || '请检查网络连接和服务器状态', 'error');
            return false;
        }
    },
    
    // 从服务器恢复
    restoreFromServer: async function() {
        try {
            // 询问确认
            if (!confirm('确定要从服务器恢复数据吗？这将覆盖当前的本地数据。')) {
                return;
            }
            
            // 显示进行中提示
            showToast('处理中', '正在从服务器恢复数据...', 'info');
            
            // 获取最新的备份
            const response = await fetch(`${this.apiEndpoint}?action=latest&key=${this.apiKey}`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '获取备份失败');
            }
            
            const backupData = await response.json();
            
            // 验证数据格式
            if (!backupData.assessments || !Array.isArray(backupData.assessments)) {
                throw new Error('服务器备份数据格式无效');
            }
            
            // 确保评估记录有效
            const validAssessments = backupData.assessments.filter(record => {
                return record && record.id && 
                       (record.gameName || record.gameName === '') && 
                       (typeof record.totalScore !== 'undefined');
            });
            
            if (validAssessments.length === 0) {
                throw new Error('备份中没有有效的评估记录');
            }
            
            // 获取现有本地数据(可选合并)
            const localAssessments = JSON.parse(localStorage.getItem('containerAssessments') || '[]');
            
            // 合并方式1: 完全替换本地数据
            localStorage.setItem('containerAssessments', JSON.stringify(validAssessments));
            
            /* 合并方式2: 合并不重复的数据
            const mergedAssessments = [];
            const addedIds = new Set();
            
            // 先添加服务器数据
            validAssessments.forEach(assessment => {
                if (assessment.id) {
                    mergedAssessments.push(assessment);
                    addedIds.add(assessment.id.toString());
                }
            });
            
            // 再添加本地中不存在于服务器的数据
            localAssessments.forEach(assessment => {
                if (assessment.id && !addedIds.has(assessment.id.toString())) {
                    mergedAssessments.push(assessment);
                }
            });
            
            localStorage.setItem('containerAssessments', JSON.stringify(mergedAssessments));
            */
            
            // 刷新页面或重新加载数据
            if (typeof loadAssessments === 'function') {
                loadAssessments();
                renderTable();
                updateStatistics();
                
                // 更新趋势图表
                if (typeof trendChart !== 'undefined' && trendChart) {
                    trendChart.destroy();
                    initTrendChart();
                }
                
                // 更新分析图表
                if (typeof updateAnalyticsCharts === 'function') {
                    updateAnalyticsCharts();
                }
                
                showToast('恢复成功', `成功从服务器恢复了 ${validAssessments.length} 条评估记录`);
            } else {
                // 如果不在历史记录页面，则重新加载页面
                showToast('恢复成功', '数据已恢复，页面将刷新...');
                setTimeout(() => {
                    location.reload();
                }, 1500);
            }
            
            return true;
        } catch (error) {
            console.error('从服务器恢复失败:', error);
            showToast('恢复失败', error.message || '请检查网络连接和服务器状态', 'error');
            return false;
        }
    },
    
    // 查看备份列表(可选功能)
    viewBackupList: async function() {
        try {
            const response = await fetch(`${this.apiEndpoint}?action=list&key=${this.apiKey}`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '获取备份列表失败');
            }
            
            const result = await response.json();
            console.log('服务器备份列表:', result.backups);
            
            return result.backups;
        } catch (error) {
            console.error('获取备份列表失败:', error);
            return [];
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    ServerBackup.init();
});