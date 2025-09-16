# 后端 ExtractionTask processing_time 字段修复指南

## 🔍 问题描述

**错误信息**: `ExtractionTask` 模型没有 `processing_time` 属性，但用户档案API试图访问它。

**根本原因**: 
- 后端在计算用户统计数据时，试图直接访问 `ExtractionTask.processing_time` 字段
- 但是 `ExtractionTask` 模型中没有定义 `processing_time` 字段
- 应该使用 `completed_at - started_at` 来动态计算处理时间

## 🛠️ 解决方案

### 方案1: 添加计算属性（推荐）

在 `ExtractionTask` 模型中添加一个计算属性：

```python
from datetime import datetime
from django.db import models

class ExtractionTask(models.Model):
    # 现有字段
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    # ... 其他字段
    
    @property
    def processing_time(self):
        """计算处理时间（秒）"""
        if self.started_at and self.completed_at:
            delta = self.completed_at - self.started_at
            return delta.total_seconds()
        return 0
    
    def get_processing_time_ms(self):
        """获取处理时间（毫秒）"""
        return int(self.processing_time * 1000)
```

### 方案2: 修改用户档案视图

在用户档案API视图中修改统计计算逻辑：

```python
def get_user_stats(user):
    """计算用户统计数据"""
    from django.db.models import Count, Avg
    from django.db.models import F, ExpressionWrapper, DurationField
    
    # 获取用户的提取任务
    tasks = ExtractionTask.objects.filter(user=user, status='completed')
    
    # 计算处理时间统计
    tasks_with_time = tasks.annotate(
        processing_duration=ExpressionWrapper(
            F('completed_at') - F('started_at'),
            output_field=DurationField()
        )
    ).filter(
        started_at__isnull=False,
        completed_at__isnull=False
    )
    
    # 统计数据
    total_documents = tasks.count()
    total_extractions = tasks.count()
    successful_extractions = tasks.filter(status='completed').count()
    
    # 计算平均处理时间
    avg_processing = tasks_with_time.aggregate(
        avg_time=Avg('processing_duration')
    )['avg_time']
    
    average_processing_time = 0
    total_processing_time = 0
    
    if avg_processing:
        average_processing_time = avg_processing.total_seconds()
        total_processing_time = sum([
            (task.completed_at - task.started_at).total_seconds()
            for task in tasks_with_time
            if task.completed_at and task.started_at
        ])
    
    return {
        'totalDocuments': total_documents,
        'totalExtractions': total_extractions,
        'successfulExtractions': successful_extractions,
        'successRate': (successful_extractions / total_extractions * 100) if total_extractions > 0 else 0,
        'totalProcessingTime': int(total_processing_time),
        'averageProcessingTime': int(average_processing_time),
        'favoriteDocumentType': 'fund_contract'  # 可以根据实际数据计算
    }
```

### 方案3: 添加数据库字段（如果需要）

如果需要持久化存储处理时间，可以在模型中添加字段：

```python
class ExtractionTask(models.Model):
    # 现有字段
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # 新增字段
    processing_time = models.FloatField(
        null=True, 
        blank=True, 
        help_text="处理时间（秒）"
    )
    
    def save(self, *args, **kwargs):
        # 在保存时自动计算处理时间
        if self.started_at and self.completed_at and not self.processing_time:
            delta = self.completed_at - self.started_at
            self.processing_time = delta.total_seconds()
        super().save(*args, **kwargs)
```

然后运行迁移：
```bash
python manage.py makemigrations
python manage.py migrate
```

## 🔧 立即修复步骤

1. **选择方案1（推荐）**：添加计算属性，无需数据库迁移
2. **修改用户档案视图**：使用动态计算而不是直接访问字段
3. **测试修复**：确保用户档案API正常返回统计数据
4. **重启后端服务**：应用修改

## ✅ 验证修复

修复后，用户档案API应该能正常返回如下格式的数据：

```json
{
  "success": true,
  "code": 200,
  "data": {
    "user": {
      "stats": {
        "totalDocuments": 25,
        "totalExtractions": 50,
        "successfulExtractions": 48,
        "successRate": 96.0,
        "totalProcessingTime": 3600,
        "averageProcessingTime": 72,
        "favoriteDocumentType": "fund_contract"
      }
    }
  }
}
```

## 🚨 注意事项

- 使用方案1最简单，不需要数据库迁移
- 方案2提供了更灵活的统计计算
- 方案3适合需要持久化处理时间的场景
- 建议先使用方案1快速修复，后续可以考虑优化










