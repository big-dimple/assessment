<?php
header('Content-Type: application/json');

// 简单访问验证 - 安全密钥
$valid_key = 'pK8zU3Xw7vL9qT5bR2dN6mY1aE4cH0jS'; // 复杂随机密钥

// 接收到的密钥
$provided_key = isset($_GET['key']) ? $_GET['key'] : '';

// 验证密钥
if($provided_key !== $valid_key) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid access key']);
    exit;
}

// 存储目录
$backup_dir = __DIR__ . '/assessment-backup/';

// 确保目录存在
if(!file_exists($backup_dir)) {
    mkdir($backup_dir, 0755, true);
}

// 处理不同的请求类型
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch($action) {
    // 上传备份
    case 'upload':
        if($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
        }
        
        // 获取原始POST数据
        $input = file_get_contents('php://input');
        if(empty($input)) {
            http_response_code(400);
            echo json_encode(['error' => 'No data provided']);
            break;
        }
        
        // 尝试解析为JSON
        $data = json_decode($input, true);
        if(json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON data']);
            break;
        }
        
        // 生成文件名(基于当前时间)
        $filename = 'assessment_backup_' . date('Ymd_His') . '.json';
        
        // 保存文件
        if(file_put_contents($backup_dir . $filename, $input)) {
            echo json_encode([
                'success' => true,
                'message' => 'Backup saved successfully',
                'filename' => $filename
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save backup']);
        }
        break;
    
    // 获取最新备份
    case 'latest':
        $files = glob($backup_dir . '*.json');
        
        if(empty($files)) {
            http_response_code(404);
            echo json_encode(['error' => 'No backups found']);
            break;
        }
        
        // 按修改时间排序
        usort($files, function($a, $b) {
            return filemtime($b) - filemtime($a);
        });
        
        // 获取最新的文件
        $latest_file = $files[0];
        $content = file_get_contents($latest_file);
        
        if($content === false) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to read backup file']);
            break;
        }
        
        // 设置内容类型为JSON
        header('Content-Type: application/json');
        
        // 直接输出JSON内容
        echo $content;
        break;
    
    // 获取备份列表
    case 'list':
        $files = glob($backup_dir . '*.json');
        $backups = [];
        
        foreach($files as $file) {
            $backups[] = [
                'filename' => basename($file),
                'size' => filesize($file),
                'date' => date('Y-m-d H:i:s', filemtime($file))
            ];
        }
        
        // 按日期排序(最新的在前)
        usort($backups, function($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });
        
        echo json_encode(['backups' => $backups]);
        break;
        
    // 下载指定备份
    case 'download':
        $filename = isset($_GET['filename']) ? $_GET['filename'] : '';
        $filepath = $backup_dir . basename($filename); // 防止目录遍历攻击
        
        if(empty($filename) || !file_exists($filepath)) {
            http_response_code(404);
            echo json_encode(['error' => 'File not found']);
            break;
        }
        
        $content = file_get_contents($filepath);
        
        if($content === false) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to read backup file']);
            break;
        }
        
        // 设置内容类型为JSON
        header('Content-Type: application/json');
        
        // 直接输出JSON内容
        echo $content;
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
}
?>