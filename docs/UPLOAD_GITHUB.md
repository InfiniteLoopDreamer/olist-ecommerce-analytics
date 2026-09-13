# 上传到 GitHub

## 上传前确认

| 检查项 | 状态 |
|--------|------|
| 不提交 `data/raw/` 下的大 CSV | 已在 `.gitignore` |
| 不提交 `frontend/node_modules/`、`frontend/dist/` | 已在 `.gitignore` |
| 存在 `frontend/public/data/insights.json` | 演示必需 |
| 存在 `docs/images/` 截图 | README 展示用 |
| 本地可运行 `python scripts/build_insights.py` | 可选 |
| 本地可运行 `cd frontend && npm run build` | 建议验证 |

## 建议步骤

### 1. 新建仓库

在 GitHub 新建空仓库（如 `olist-ecommerce-analytics`），**不要**勾选自动生成 README。

### 2. 推送代码

在本项目根目录执行：

```bash
git init
git add .
git status
# 确认列表中没有 olist_*.csv 等大文件
git commit -m "feat: Olist 巴西电商经营分析"
git branch -M main
git remote add origin https://github.com/<你的用户名>/olist-ecommerce-analytics.git
git push -u origin main
```

### 3. 开启 GitHub Pages

1. 仓库 **Settings → Pages**
2. **Source** 选择 **GitHub Actions**
3. 等待 `Deploy` workflow 跑绿

成功后获得演示地址，例如：

```text
https://<你的用户名>.github.io/olist-ecommerce-analytics/
```

### 4. 回填 README

打开根目录 `README.md`，在 **在线演示** 一节填入：

- GitHub 仓库链接
- GitHub Pages 看板链接

然后提交：

```bash
git add README.md
git commit -m "docs: 添加在线演示链接"
git push
```

## README 预览说明

根目录 `README.md` 为**项目介绍**（结果、架构、ER、模块、截图、运行方式），不含面试话术。

| 文件 | 用途 |
|------|------|
| `docs/images/pipeline.svg` | 数据处理流水线 |
| `docs/images/er-diagram.svg` | 表关联 ER 图 |
| `docs/images/modules.svg` | 看板五模块 |
| `docs/images/metrics-tree.svg` | 指标树 |
| `docs/images/01–05-*.png` | 看板截图与关键图表 |

面试 / 简历内容请放在**项目外**自用笔记，勿提交仓库。

上传后打开仓库首页即可直接预览 README。

## 注意事项

- 勿提交 Kaggle API Key / `.env`
- 原始数据许可为 **CC BY-NC-SA 4.0**，README 已注明来源
- 若 Pages 空白，检查 `frontend/vite.config.ts` 中 `base: './'` 是否保留
