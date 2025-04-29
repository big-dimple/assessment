# 游戏上线评估系统

> 专为游戏团队设计的工具，用于评估游戏项目所需的技术准备工作完成度。本系统帮助研发与运维团队在项目容器化过程中统一标准，识别风险点，提前规避潜在问题。
> 评估新游戏部署前的文档完备性-侧面印证技术准备情况。

**评估打分页**
![评估打分](https://github.com/big-dimple/assessment/releases/download/v1.0.1-alpha/score.jpg)

**历史列表页**
![历史列表](https://github.com/big-dimple/assessment/releases/download/v1.0.1-alpha/list.jpg)

**评估报告页**
![评估报告](https://github.com/big-dimple/assessment/releases/download/v1.0.1-alpha/report.jpg)

- 注意：本系统的评估结果仅作为部署决策的参考依据之一，最终决策应结合实际情况，由项目管理层和技术负责人共同制定。

## 一、系统架构

基于Web的前端应用，采用HTML、CSS和JavaScript实现，数据存储支持本地存储和服务器存储两种模式：
- **本地存储模式**：数据存储在浏览器的localStorage中，有方便的导出导入功能。
- **服务器存储模式**：数据可备份到服务器，防止本地数据丢失。

系统提供评估打分、历史数据分析和帮助指南等功能。

### 文件结构

```
assessment/                                # 评估系统根目录
├── help.html                              # 帮助页面
├── historical-evaluations.html            # 历史评估记录页面
├── index.html                             # 系统首页
├── backup-api.php                         # 服务器备份接口
├── js                                     # JavaScript 脚本目录
│   ├── common.js                          # 通用功能脚本
│   ├── config-system.js                   # 系统配置脚本
│   ├── dynamic-form-system.js             # 动态表单系统脚本
│   ├── dynamic-result-page.js             # 动态结果页面脚本
│   ├── result-import.js                   # 报告导入功能脚本
│   └── server-backup.js                   # 服务器备份功能脚本
├── result.html                            # 结果展示页面
├── static                                 # 静态资源目录
│   ├── css                                # CSS 样式目录
│   │   └── font-awesome                   # Font Awesome 图标库
│   │       ├── all.min.css                # Font Awesome 核心样式
│   │       └── webfonts                   # 字体文件目录
│   └── js                                 # 第三方JavaScript库
│       └── chart.min.js                   # Chart.js图表库(压缩版)
├── styles                                 # 样式目录
│   └── unified-styles.css                 # 统一样式表
└── assessment-backup                      # 服务器备份存储目录
```

## 二、系统部署

### 1. 基础前端部署

由于系统的基础功能为纯前端应用，简单部署只需将所有文件放置在Web服务器的相应目录下即可。这种部署方式支持本地数据存储和导入导出功能。

### 2. 完整部署（含服务器端备份功能）

#### 前提条件

- Linux服务器 (推荐CentOS 7/8 或 Ubuntu 18.04+)
- Nginx Web服务器
- PHP 7.x 或更高版本
- 域名（可选，用于HTTPS配置）

#### 2.1 安装Nginx

**CentOS系统:**
```bash
# 安装Nginx
sudo yum install epel-release
sudo yum install nginx

# 启动Nginx并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx

# 检查Nginx状态
sudo systemctl status nginx
```

**Ubuntu系统:**
```bash
# 安装Nginx
sudo apt update
sudo apt install nginx

# 启动Nginx并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx

# 检查Nginx状态
sudo systemctl status nginx
```

#### 2.2 安装PHP和必要扩展

**CentOS系统:**
```bash
# 安装PHP和必要扩展
sudo yum install php php-fpm php-json php-cli

# 启动PHP-FPM并设置开机自启
sudo systemctl start php-fpm
sudo systemctl enable php-fpm

# 检查PHP-FPM状态
sudo systemctl status php-fpm
```

**Ubuntu系统:**
```bash
# 安装PHP和必要扩展
sudo apt install php-fpm php-json php-cli

# 启动PHP-FPM并设置开机自启
sudo systemctl start php-fpm
sudo systemctl enable php-fpm

# 检查PHP-FPM状态
sudo systemctl status php-fpm
```

#### 2.3 配置PHP-FPM

检查PHP-FPM配置并确认监听方式：
```bash
# 检查PHP-FPM配置
grep "listen =" /etc/php-fpm.d/*.conf    # CentOS
# 或
grep "listen =" /etc/php/*/fpm/pool.d/*.conf    # Ubuntu
```

记录监听地址，一般是 `127.0.0.1:9000` 或 Unix 套接字路径。

#### 2.4 部署评估系统文件

```bash
# 创建网站目录
sudo mkdir -p /var/www/html/assessment

# 将所有文件复制到网站目录
sudo cp -r /path/to/your/files/* /var/www/html/assessment/

# 创建备份目录
sudo mkdir -p /var/www/html/assessment/assessment-backup

# 设置正确的权限
sudo chmod -R 755 /var/www/html/assessment
sudo chown -R nginx:nginx /var/www/html/assessment  # CentOS，Nginx用户
# 或
sudo chown -R www-data:www-data /var/www/html/assessment  # Ubuntu，Nginx用户
```

#### 2.5 为备份目录设置特殊权限

根据您的PHP-FPM运行用户设置备份目录的权限：

```bash
# 查看PHP-FPM运行的用户
ps aux | grep php-fpm

# 设置备份目录权限（根据实际PHP运行用户调整）
sudo chmod -R 755 /var/www/html/assessment/assessment-backup
sudo chown -R apache:apache /var/www/html/assessment/assessment-backup  # 如果PHP以apache用户运行
# 或
sudo chown -R nginx:nginx /var/www/html/assessment/assessment-backup    # 如果PHP以nginx用户运行
# 或
sudo chown -R www-data:www-data /var/www/html/assessment/assessment-backup  # Ubuntu常见用户
```

#### 2.6 配置Nginx站点

创建Nginx站点配置文件：

```bash
# CentOS
sudo nano /etc/nginx/conf.d/assessment.conf

# Ubuntu
sudo nano /etc/nginx/sites-available/assessment
```

以下是基本的Nginx配置（HTTP版本）：

```nginx
server {
    listen 80;
    server_name your_domain.com;  # 替换为你的域名或IP
    root /var/www/html/assessment;
    index index.html index.php;

    # 主路由配置
    location / {
        try_files $uri $uri/ /index.html;
    }

    # PHP处理配置
    location ~ \.php$ {
        try_files $uri =404;
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass 127.0.0.1:9000;  # 替换为你的PHP-FPM地址
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # 保护备份目录，禁止直接访问
    location /assessment-backup {
        deny all;
        return 403;
    }

    # 静态资源缓存控制
    location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

如果您使用Ubuntu，需要创建符号链接：
```bash
sudo ln -s /etc/nginx/sites-available/assessment /etc/nginx/sites-enabled/
```

#### 2.7 测试并重启Nginx

```bash
# 测试Nginx配置语法
sudo nginx -t

# 如果配置正确，重新加载Nginx
sudo systemctl reload nginx
```

#### 2.8 设置HTTPS（可选但推荐）

使用Let's Encrypt获取免费SSL证书：

```bash
# 安装Certbot
# CentOS
sudo yum install certbot python3-certbot-nginx

# Ubuntu
sudo apt install certbot python3-certbot-nginx

# 使用Certbot配置SSL
sudo certbot --nginx -d your_domain.com
```

#### 2.9 测试安装

访问 `http://your_domain.com` 或 `https://your_domain.com`（如果已配置SSL）检查系统是否正常工作。

### 3. 常见问题排查

如果遇到服务器备份功能问题，请检查：

1. **备份目录权限**：确保PHP-FPM用户有权限写入备份目录
   ```bash
   sudo chmod -R 755 /var/www/html/assessment/assessment-backup
   sudo chown -R [php-fpm用户]:[php-fpm组] /var/www/html/assessment/assessment-backup
   ```

2. **PHP错误日志**：查看PHP错误日志获取更多信息
   ```bash
   sudo tail -n 50 /var/log/php-fpm/error.log   # CentOS
   # 或
   sudo tail -n 50 /var/log/php*/error.log      # Ubuntu
   ```

3. **SELinux设置**（仅CentOS）：如果启用了SELinux，需要设置正确的上下文
   ```bash
   sudo semanage fcontext -a -t httpd_sys_rw_content_t "/var/www/html/assessment/assessment-backup(/.*)?"
   sudo restorecon -Rv /var/www/html/assessment/assessment-backup
   ```

## 三、系统使用指南

### 1. 评估打分

**访问路径**：index.html

**主要功能**：
- 填写项目基本信息（游戏名称、版本类型、版本号）
- 为服务端文档、容器化文档和客户端文档各项目进行评分
- 实时查看总分和风险等级
- 保存评估结果
- 查看详细报告

**使用步骤**：
1. 在"项目信息"区域填写游戏名称（必填）、版本类型和版本号
2. 依次为各个文档项目进行评分（0到满分之间）
3. 系统会实时计算总分和显示对应的风险等级
4. 点击"保存评估"按钮将结果保存到历史记录
5. 点击"查看详细报告"查看完整评估报告

### 2. 历史评估与数据分析

**访问路径**：historical-evaluations.html

**主要功能**：
- 查看、筛选和管理历史评估记录
- 导出/导入评估数据
- 服务器备份与恢复数据
- 查看评分趋势、分布等数据分析
- 分析常见缺失项和模块完成度

**使用步骤**：
1. 在"评估列表"标签页查看所有历史评估
2. 使用筛选功能按游戏名称、等级或日期筛选记录
3. 点击记录右侧的"查看报告"按钮查看详细报告
4. 切换到"数据分析"标签页查看统计图表和分析
5. 使用导出/导入功能备份或共享评估数据
6. 使用"备份到服务器"和"从服务器恢复"功能进行数据云备份

### 3. 评估结果查看

**访问路径**：result.html（通常从历史评估页面跳转）

**主要功能**：
- 查看评估的详细得分和评级
- 查看风险评估和评估结论
- 查看主要缺失项和改进建议
- 导入/导出/打印报告

**使用步骤**：
1. 从历史评估页面点击"查看报告"进入结果页面
2. 查看项目信息、总分和风险等级
3. 阅读风险评估和建议
4. 根据需要打印或导出报告
5. 也可通过"导入报告"按钮导入以前导出的单个报告

### 4. 系统配置

**访问路径**：任意页面点击侧边栏的"系统配置"

**主要功能**：
- 调整模块权重（服务端、容器化、客户端文档）
- 设置风险等级阈值（A/B/C/D级）
- 配置缺失项判断标准

**使用步骤**：
1. 点击侧边栏的"系统配置"按钮打开配置面板
2. 根据需要调整各项配置参数
3. 点击"保存配置"应用更改
4. 新的配置将立即生效并应用于当前和未来的评估

**注意事项**：
- 模块权重总和必须为100
- 风险等级阈值必须满足 A > B > C
- 配置更改不会影响已保存的历史评估结果

## 四、数据管理

### 本地存储

系统使用浏览器的localStorage存储以下数据：
- 评估记录（containerAssessments）
- 系统配置（currentAssessmentConfig）

### 数据导入/导出

**导出数据**：
1. **导出所有记录**：
   - 访问历史评估页面
   - 点击"导出所有记录"按钮
   - 系统将生成包含所有评估记录的JSON文件供下载

2. **导出单个报告**：
   - 在结果页面点击"导出报告"按钮
   - 系统将生成当前查看报告的JSON文件供下载

**导入数据**：
1. **导入到历史列表**：
   - 访问历史评估页面
   - 点击"导入记录"按钮
   - 选择之前导出的JSON文件（单个报告或多个记录）
   - 点击"导入"确认操作

2. **导入单个报告**：
   - 在结果页面点击"导入报告"按钮
   - 选择之前导出的报告JSON文件
   - 点击"导入"确认操作

### 服务器备份

**备份到服务器**：
1. 访问历史评估页面
2. 点击"备份到服务器"按钮
3. 系统会将所有评估记录备份到服务器

**从服务器恢复**：
1. 访问历史评估页面
2. 点击"从服务器恢复"按钮
3. 系统会从服务器获取最新备份，并恢复到本地

**注意事项**：
- 服务器备份功能需要正确配置服务器端环境
- 备份文件保存在服务器的assessment-backup目录中
- 恢复操作会覆盖当前所有本地数据

## 五、系统升级与维护

### 1. 前端代码更新

更新前端代码时，请确保：
1. 备份所有用户数据（使用导出功能或服务器备份）
2. 保留自定义配置信息
3. 更新后检查所有功能是否正常工作

### 2. 服务器维护

定期维护服务器：
1. 更新Nginx、PHP到最新稳定版本
2. 备份服务器上的assessment-backup目录
3. 检查日志文件，及时发现并解决潜在问题
4. 设置自动备份脚本，如每周备份一次assessment-backup目录

### 3. 数据清理建议

为保持系统性能，定期清理不再需要的历史评估数据：
1. 导出所有历史评估
2. 使用"清空所有记录"功能清除数据
3. 仅导入需要保留的评估记录

