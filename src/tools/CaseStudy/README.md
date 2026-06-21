# 高尔夫数据查询站（透视分析 · 全生命周期）

许多帕的逐场高尔夫数据透视查询站，支持 **中 / 한국어 / English** 三语。
路由 `/#/case-study`，首页有「高尔夫数据查询站」featured 卡片入口。

## 能力

- **筛选**：时间范围预设（全部/今年/近半年/近三个月/近四周）+ 自定义日期区间
  + 球场多选搜索 + 洞数 + 仅计差点
- **KPI**：8 张卡片，自带「vs 上一等长周期」环比（按指标方向标红/绿）
- **分组维度**（10 种）：按场 / 日 / 周 / 月 / 季度 / 年 / 球场 / **主-客场** / 洞数 / 标准杆
  （主场 = 全集出场最多的球场，自动识别）
- **难度分析**：按 stroke index 把每洞分难(1-6)/中(7-12)/易(13-18)，算每洞相对标准杆
- **记分卡热力图**：每行一场 × 18 格逐洞相对标准杆配色（鹰/鸟/帕/柏忌/双柏忌/+3），看后九崩盘等模式
- **指标**（17 个，可多选叠加）：场次、平均总杆、+/-、差点值、上球道率、GIR、
  推杆/洞、总推杆、双柏忌+率、标准杆或更好、抓鸟率、Par3/4/5 均杆、最好/最差、复算差点
- **叠加图表**：多指标同图，按数值量级动态分左右轴；折线/柱状切换
- **透视表**：分组 × 指标，可排序，带合计/平均行；按场时退化为含逐洞派生的逐场明细 + 原始链接
- **导出 CSV**：导出当前视图

所有计算在浏览器端基于 `data.json` 的 `rounds` 实时完成，**加新场次无需改页面代码**。

## 文件结构

| 文件 | 作用 |
|---|---|
| `data.json` | **单一数据源** `{ meta, rounds[] }`（脚本生成，勿手改；含逐洞 holeScores/parValues） |
| `index.jsx` | 透视查询站（筛选/分组/指标/图表/表格/导出全实时计算） |
| `i18n.js` | 三语字典 + 月份本地化 |
| `style.css` | 样式（跟随全站深浅色主题） |

## 以后更新数据（持续记录用）

1. 更新 `golfshot-data/golfshot_rounds_raw.json`（含逐洞）和
   `golfshot_handicap_history.json`。
2. 项目根目录跑：
   ```bash
   npm run case-data            # 默认读取 golfshot-data
   npm run case-data -- /路径   # 或指定其它数据源目录
   ```
3. `npm run build` 重新构建并部署。

## 逐场字段（rounds[]）

`seq date year course city tee par rating slope holes gross net toPar diff hcp
eligible fairway gir putts puttsPerHole doublePlus parBetter birdie par3 par4 par5
front9 back9 holeScores parValues id url`

> `holeScores` / `parValues` 已随数据保留，可支撑未来的「记分卡热力图 / 按
> stroke-index 难度分析 / 前九后九」等更细视图。

## 接 Garmin / 其它数据源

让新数据源产出相同字段的逐场记录（尤其 holeScores/parValues）即可，结构不变页面零改动。
新增指标/维度时在 `index.jsx` 的 `MEASURES` / `DIMS` 与 `i18n.js` 补三语标签。
