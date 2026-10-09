# ExcelJS

[![Build status](https://github.com/exceljs/exceljs/workflows/ExcelJS/badge.svg)](https://github.com/exceljs/exceljs/actions?query=workflow%3AExcelJS)
[![Code Quality: Javascript](https://img.shields.io/lgtm/grade/javascript/g/exceljs/exceljs.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/exceljs/exceljs/context:javascript)
[![Total Alerts](https://img.shields.io/lgtm/alerts/g/exceljs/exceljs.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/exceljs/exceljs/alerts)

读取，操作并写入电子表格数据和样式到 XLSX 和 JSON 文件。

一个 Excel 电子表格文件逆向工程项目。

# 安装

```shell
npm install exceljs
```

# 新的功能!

* Merged [fix: styles rendering in case when "numFmt" is present in conditional formatting rules (resolves #1814) #1815](https://github.com/exceljs/exceljs/pull/1815). <br/> Many thanks to [@andreykrupskii](https://github.com/andreykrupskii) for this contribution!
* Merged [inlineStr cell type support #1575 #1576](https://github.com/exceljs/exceljs/pull/1576). <br/> Many thanks to [@drdmitry](https://github.com/drdmitry) for this contribution!
* Merged [Fix parsing of boolean attributes #1849](https://github.com/exceljs/exceljs/pull/1849). <br/> Many thanks to [@bno1](https://github.com/bno1) for this contribution!
* Merged [add optional custom auto-filter to table #1670](https://github.com/exceljs/exceljs/pull/1670). <br/> Many thanks to [@thambley](https://github.com/thambley) for this contribution!
* Merged [Deep copy inherited style #1850](https://github.com/exceljs/exceljs/pull/1850). <br/> Many thanks to [@ikzhr](https://github.com/ikzhr) for this contribution!
* Merged [Upgrade actions/cache and actions/setup-node #1846](https://github.com/exceljs/exceljs/pull/1846). <br/> Many thanks to [@cclauss](https://github.com/cclauss) for this contribution!
* Merged [Check object keys in isEqual #1831](https://github.com/exceljs/exceljs/pull/1831). <br/> Many thanks to [@bno1](https://github.com/bno1) for this contribution!
* Merged [Add v17 to testing workflow #1856](https://github.com/exceljs/exceljs/pull/1856). <br/> Many thanks to [@Siemienik](https://github.com/Siemienik) for this contribution!
* Merged [Upgrade jszip to its latest version to date. This version does not have any vulnerability found by Snyk so far #1895](https://github.com/exceljs/exceljs/pull/1895). <br/> Many thanks to [@ValerioSevilla](https://github.com/ValerioSevilla) for this contribution!
* Merged [Update README.md #1677](https://github.com/exceljs/exceljs/pull/1677). <br/> Many thanks to [@xjrcode](https://github.com/xjrcode) for this contribution!
* Merged [(docs): set prototype of RegExp correctly. #1700](https://github.com/exceljs/exceljs/pull/1700). <br/> Many thanks to [@joeldenning](https://github.com/joeldenning) for this contribution!
* Merged [Added timeouts to github actions #1733](https://github.com/exceljs/exceljs/pull/1733). <br/> Many thanks to [@alexbjorlig](https://github.com/alexbjorlig) for this contribution!
* Merged [fix issue 1676 #1701](https://github.com/exceljs/exceljs/pull/1701). <br/> Many thanks to [@skypesky](https://github.com/skypesky) for this contribution!
* Merged [ExcelJS/ExcelJS#2237 : Update CI Tests, Drop support for Node v8  #2242](https://github.com/exceljs/exceljs/pull/2242). <br/> Many thanks to [@Siemienik](https://github.com/Siemienik) for this contribution!
* Merged [Fix types for getWorksheet() #2223](https://github.com/exceljs/exceljs/pull/2223). <br/> Many thanks to [@hfhchan-plb](https://github.com/hfhchan-plb) for this contribution!
* Merged [add characters cannot be used for worksheet name #2126](https://github.com/exceljs/exceljs/pull/2126). <br/> Many thanks to [@tkm-kj](https://github.com/tkm-kj) for this contribution!
* Merged [Fix issue #1753 Reject promise when workbook reader is writing to temporary file stream and error occurs #1756](https://github.com/exceljs/exceljs/pull/1756). <br/> Many thanks to [@pauliusg](https://github.com/pauliusg) for this contribution!
* Merged [README.md to have correct link for Streaming XLSX #2186](https://github.com/exceljs/exceljs/pull/2186). <br/> Many thanks to [@wulfsolter](https://github.com/wulfsolter) for this contribution!
* Merged [Added a polyfill of promise.finally to support lower versions of Firefox. #1982](https://github.com/exceljs/exceljs/pull/1982). <br/> Many thanks to [@DemoJj](https://github.com/DemoJj) for this contribution!
* Merged [Fix read this.worksheet before assign it #1934](https://github.com/exceljs/exceljs/pull/1934). <br/> Many thanks to [@ZyqGitHub1](https://github.com/ZyqGitHub1) for this contribution!
* Merged [chore: upgrade jszip to ^3.10.1 #2211](https://github.com/exceljs/exceljs/pull/2211). <br/> Many thanks to [@jarrod-cocoon](https://github.com/jarrod-cocoon) for this contribution!
* Merged [fixed spelling error in README.md file #2208](https://github.com/exceljs/exceljs/pull/2208). <br/> Many thanks to [@HugoP27](https://github.com/HugoP27) for this contribution!
* Merged [fix: Fix xlsx.writeFile() not catching error when error occurs #2244](https://github.com/exceljs/exceljs/pull/2244). <br/> Many thanks to [@zurmokeeper](https://github.com/zurmokeeper) for this contribution!
* Merged [Improve worksheets' naming validation logic. #2257](https://github.com/exceljs/exceljs/pull/2257). <br/> Many thanks to [@Siemienik](https://github.com/Siemienik) for this contribution!
* Merged [fix issue 2125 - spliceRows remove last row #2140](https://github.com/exceljs/exceljs/pull/2140). <br/> Many thanks to [@babu-ch](https://github.com/babu-ch) for this contribution!
* Merged [fix: fix the loss of column attributes due to incorrect column order #2222](https://github.com/exceljs/exceljs/pull/2222). <br/> Many thanks to [@cpaiyueyue](https://github.com/cpaiyueyue) for this contribution!
* Merged [Fix: Sheet Properties Types #2327](https://github.com/exceljs/exceljs/pull/2327). <br/> Many thanks to [@albeniraouf](https://github.com/albeniraouf) for this contribution!
* Merged [Use node 18 LTS for tsc, and benchmark. Add node 20. to test matrix. … #2354](https://github.com/exceljs/exceljs/pull/2354). <br/> Many thanks to [@Siemienik](https://github.com/Siemienik) for this contribution!
* Merged [Add missing tooltip attribute to CellHyperlinkValue index.d.ts #2350](https://github.com/exceljs/exceljs/pull/2350). <br/> Many thanks to [@NiklasPor](https://github.com/NiklasPor) for this contribution!
* Merged [Increase resilience to generating large workbooks #2320](https://github.com/exceljs/exceljs/pull/2320). <br/> Many thanks to [@hfhchan-plb](https://github.com/hfhchan-plb) for this contribution!
* Merged [repair all 'c2fo.io' links ('c2fo.github.io') #2324](https://github.com/exceljs/exceljs/pull/2324). <br/> Many thanks to [@justintunev7](https://github.com/justintunev7) for this contribution!
* Merged [fix: fix type definitions about last column, formula values and protection #2309](https://github.com/exceljs/exceljs/pull/2309). <br/> Many thanks to [@gltjk](https://github.com/gltjk) for this contribution!
* Merged [fix: add spinCount field for WorksheetProtection type #2284](https://github.com/exceljs/exceljs/pull/2284). <br/> Many thanks to [@damingerdai](https://github.com/damingerdai) for this contribution!
* Merged [Add type definition for WorksheetModel.merges #2281](https://github.com/exceljs/exceljs/pull/2281). <br/> Many thanks to [@ytjmt](https://github.com/ytjmt) for this contribution!

# 贡献

欢迎贡献！这可以帮助我了解大家需要一些什么功能，或者哪些 bugs 造成了极大的麻烦。

我只有一个请求；如果您提交对错误修复的请求（PR），请添加一个能够解决问题的单元测试或集成测试（在 *spec* 文件夹中）。
即使只是测试失败的请求（PR）也可以 - 我可以分析测试的过程并以此修复代码。

注意：请尽可能避免在请求（PR）中修改软件包版本。
版本一般在发布时会进行更新，任何版本更改很可能导致合并冲突。

明确地说，添加到该库的所有贡献都将包含在该库的 MIT 许可证中。

# 目录

<ul>
  <li><a href="#导入">导入</a></li>
  <li>
    <a href="#接口">接口</a>
    <ul>
      <li><a href="#创建工作簿">创建工作簿</a></li>
      <li><a href="#设置工作簿属性">设置工作簿属性</a></li>
      <li><a href="#工作簿视图">工作簿视图</a></li>
      <li><a href="#添加工作表">添加工作表</a></li>
      <li><a href="#删除工作表">删除工作表</a></li>
      <li><a href="#访问工作表">访问工作表</a></li>
      <li><a href="#工作表状态">工作表状态</a></li>
      <li><a href="#工作表属性">工作表属性</a></li>
      <li><a href="#页面设置">页面设置</a></li>
      <li><a href="#页眉和页脚">页眉和页脚</a></li>
      <li>
        <a href="#工作表视图">工作表视图</a>
        <ul>
          <li><a href="#冻结视图">冻结视图</a></li>
          <li><a href="#拆分视图">拆分视图</a></li>
        </ul>
      </li>
      <li><a href="#自动筛选器">自动筛选器</a></li>
      <li><a href="#列">列</a></li>
      <li><a href="#行">行</a>
        <ul>
          <li><a href="#add-rows">Add Rows</a></li>
          <li><a href="#处理单个单元格">处理单个单元格</a></li>
          <li><a href="#合并单元格">合并单元格</a></li>
          <li><a href="#insert-rows">Insert Rows</a></li>
          <li><a href="#splice">Splice</a></li>
          <li><a href="#重复行">重复行</a></li>
        </ul>
      </li>
      <li><a href="#定义名称">定义名称</a></li>
      <li><a href="#数据验证">数据验证</a></li>
      <li><a href="#单元格注释">单元格注释</a></li>
      <li><a href="#表格">表格</a></li>
      <li><a href="#样式">样式</a>
        <ul>
          <li><a href="#数字格式">数字格式</a></li>
          <li><a href="#字体">字体</a></li>
          <li><a href="#对齐">对齐</a></li>
          <li><a href="#边框">边框</a></li>
          <li><a href="#填充">填充</a></li>
          <li><a href="#富文本">富文本</a></li>
        </ul>
      </li>
      <li><a href="#条件格式化">条件格式化</a></li>
      <li><a href="#大纲级别">大纲级别</a></li>
      <li><a href="#图片">图片</a></li>
      <li><a href="#工作表保护">工作表保护</a></li>
      <li><a href="#文件-io">文件 I/O</a>
        <ul>
          <li><a href="#xlsx">XLSX</a>
            <ul>
              <li><a href="#读-xlsx">读 XLSX</a></li>
              <li><a href="#写-xlsx">写 XLSX</a></li>
            </ul>
          </li>
          <li><a href="#csv">CSV</a>
            <ul>
              <li><a href="#读-csv">读 CSV</a></li>
              <li><a href="#写-csv">写 CSV</a></li>
            </ul>
          </li>
          <li><a href="#流式-io">流式 I/O</a>
            <ul>
              <li><a href="#流式-xlsx">流式 XLSX</a></li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  </li>
  <li><a href="#浏览器">浏览器</a></li>
  <li>
    <a href="#值类型">值类型</a>
    <ul>
      <li><a href="#null-值">Null 值</a></li>
      <li><a href="#合并单元格">合并单元格</a></li>
      <li><a href="#数字值">数字值</a></li>
      <li><a href="#字符串值">字符串值</a></li>
      <li><a href="#日期值">日期值</a></li>
      <li><a href="#超链接值">超链接值</a></li>
      <li>
        <a href="#公式值">公式值</a>
        <ul>
          <li><a href="#共享公式">共享公式</a></li>
          <li><a href="#公式类型">公式类型</a></li>
          <li><a href="#数组公式">数组公式</a></li>
        </ul>
      </li>
      <li><a href="#富文本值">富文本值</a></li>
      <li><a href="#布尔值">布尔值</a></li>
      <li><a href="#错误值">错误值</a></li>
    </ul>
  </li>
  <li><a href="#配置">配置</a></li>
  <li><a href="#已知的问题">已知的问题</a></li>
  <li><a href="#发布历史">发布历史</a></li>
</ul>



# 导入[⬆](#目录)<!-- Link generated with jump2header -->

```javascript
const ExcelJS = require('exceljs');
```

## ES5 导入[⬆](#目录)<!-- Link generated with jump2header -->

要使用 ES5 编译代码，请使用 *dist/es5* 路径。

```javascript
const ExcelJS = require('exceljs/dist/es5');
```

**注意：**ES5 版本对许多 polyfill 都具有隐式依赖，而 exceljs 不再明确添加。
您需要在依赖项中添加 `core-js` 和 `regenerator-runtime`，并在导入 `exceljs` 之前在代码中包含以下引用：

```javascript
// exceljs 所需的 polyfills
require('core-js/modules/es.promise');
require('core-js/modules/es.string.includes');
require('core-js/modules/es.object.assign');
require('core-js/modules/es.object.keys');
require('core-js/modules/es.symbol');
require('core-js/modules/es.symbol.async-iterator');
require('regenerator-runtime/runtime');

const ExcelJS = require('exceljs/dist/es5');
```

对于 IE 11，您还需要一个 polyfill 以支持 unicode regex 模式。 例如，

```js
const rewritePattern = require('regexpu-core');
const {generateRegexpuOptions} = require('@babel/helper-create-regexp-features-plugin/lib/util');

const {RegExp} = global;
try {
  new RegExp('a', 'u');
} catch (err) {
  global.RegExp = function(pattern, flags) {
    if (flags && flags.includes('u')) {
      return new RegExp(rewritePattern(pattern, flags, generateRegexpuOptions({flags, pattern})));
    }
    return new RegExp(pattern, flags);
  };
  global.RegExp.prototype = RegExp.prototype;
}
```

## 浏览器端[⬆](#目录)<!-- Link generated with jump2header -->

ExcelJS 在 *dist/* 文件夹内发布了两个支持浏览器的包：

一个是隐式依赖 `core-js` polyfills 的...
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.26.0/polyfill.js"></script>
<script src="exceljs.js"></script>
```

另一个则没有...
```html
<script src="--your-project's-pollyfills-here--"></script>
<script src="exceljs.bare.js"></script>
```


# 接口[⬆](#目录)<!-- Link generated with jump2header -->

## 创建工作簿[⬆](#目录)<!-- Link generated with jump2header -->

```javascript
const workbook = new ExcelJS.Workbook();
```

## 设置工作簿属性[⬆](#目录)<!-- Link generated with jump2header -->

```javascript
workbook.creator = 'Me';
workbook.lastModifiedBy = 'Her';
workbook.created = new Date(1985, 8, 30);
workbook.modified = new Date();
workbook.lastPrinted = new Date(2016, 9, 27);
```

```javascript
// 将工作簿日期设置为 1904 年日期系统
workbook.properties.date1904 = true;
```

## 设置计算属性[⬆](#目录)<!-- Link generated with jump2header -->

```javascript
// 在加载时强制工作簿计算属性
workbook.calcProperties.fullCalcOnLoad = true;
```

## 工作簿视图[⬆](#目录)<!-- Link generated with jump2header -->

工作簿视图控制在查看工作簿时 Excel 将打开多少个单独的窗口。

```javascript
workbook.views = [
  {
    x: 0, y: 0, width: 10000, height: 20000,
    firstSheet: 0, activeTab: 1, visibility: 'visible'
  }
]
```

## 添加工作表[⬆](#目录)<!-- Link generated with jump2header -->

```javascript
const sheet = workbook.addWorksheet('My Sheet');
```

使用 `addWorksheet` 函数的第二个参数来指定工作表的选项。

示例：

```javascript
// 创建带有红色标签颜色的工作表
const sheet = workbook.addWorksheet('My Sheet', {properties:{tabColor:{argb:'FFC0000'}}});

// 创建一个隐藏了网格线的工作表
const sheet = workbook.addWorksheet('My Sheet', {views: [{showGridLines: false}]});

// 创建一个第一行和列冻结的工作表
const sheet = workbook.addWorksheet('My Sheet', {views:[{xSplit: 1, ySplit:1}]});

// 使用A4设置的页面设置设置创建新工作表 - 横向
const worksheet =  workbook.addWorksheet('My Sheet', {
  pageSetup:{paperSize: 9, orientation:'landscape'}
});

// 创建一个具有页眉页脚的工作表
const sheet = workbook.addWorksheet('My Sheet', {
  headerFooter:{firstHeader: "Hello Exceljs", firstFooter: "Hello World"}
});

// 创建一个冻结了第一行和第一列的工作表
const sheet = workbook.addWorksheet('My Sheet', {views:[{state: 'frozen', xSplit: 1, ySplit:1}]});

```

## 删除工作表[⬆](#目录)<!-- Link generated with jump2header -->

使用工作表的  `id` 从工作簿中删除工作表。

示例：

```javascript
// 创建工作表
const sheet = workbook.addWorksheet('My Sheet');

// 使用工作表 id 删除工作表
workbook.removeWorksheet(sheet.id)
```

## 访问工作表[⬆](#目录)<!-- Link generated with jump2header -->
```javascript
// 遍历所有工作表
// 注意： workbook.worksheets.forEach 仍然是可以正常运行的， 但是以下的方式更好
workbook.eachSheet(function(worksheet, sheetId) {
  // ...
});

// 按 name 提取工作表
const worksheet = workbook.getWorksheet('My Sheet');

// 按 id 提取工作表
const worksheet = workbook.getWorksheet(1);
```

## 工作表状态[⬆](#目录)<!-- Link generated with jump2header -->

```javascript
// 使工作表可见
worksheet.state = 'visible';

// 隐藏工作表
worksheet.state = 'hidden';

// 从“隐藏/取消隐藏”对话框中隐藏工作表
worksheet.state = 'veryHidden';
```

## 工作表属性[⬆](#目录)<!-- Link generated with jump2header -->

工作表支持属性存储，以允许控制工作表的某些功能。

```javascript
// 创建具有属性的新工作表
const worksheet = workbook.addWorksheet('sheet', {properties:{tabColor:{argb:'FF00FF00'}}});

// 创建一个具有属性的可写的新工作表
const worksheetWriter = workbookWriter.addWorksheet('sheet', {properties:{outlineLevelCol:1}});

// 之后调整属性（工作表读写器不支持该操作）
worksheet.properties.outlineLevelCol = 2;
worksheet.properties.defaultRowHeight = 15;
```

**支持的属性**

| 属性名            | 默认值 | 描述 |
| ---------------- | ---------- | ----------- |
| tabColor         | `undefined` | 标签的颜色 |
| outlineLevelCol  | 0          | 工作表列大纲级别 |
| outlineLevelRow  | 0          | 工作表行大纲级别 |
| defaultRowHeight | 15         | 默认行高 |
| defaultColWidth  | (optional) | 默认列宽 |
| dyDescent        | 55         | TBD |

### 工作表尺寸[⬆](#目录)<!-- Link generated with jump2header -->

一些新的尺寸属性已添加到工作表中...

| 属性名              | 描述                                                  |
| ----------------- | ------------------------------------------------------------ |
| rowCount          | 文档的总行数。 等于具有值的最后一行的行号。                  |
| actualRowCount    | 具有值的行数的计数。 如果中间文档行为空，则该行将不包括在计数中。 |
| columnCount       | 文档的总列数。 等于所有行的最大单元数。                      |
| actualColumnCount | 具有值的列数的计数。                                         |


## 页面设置[⬆](#目录)<!-- Link generated with jump2header -->

所有可能影响工作表打印的属性都保存在工作表上的 `pageSetup` 对象中。

```javascript
// 使用 A4 横向的页面设置创建新工作表
const worksheet =  workbook.addWorksheet('sheet', {
  pageSetup:{paperSize: 9, orientation:'landscape'}
});

// 使用适合页面的pageSetup设置创建一个新的工作表编写器
const worksheetWriter = workbookWriter.addWorksheet('sheet', {
  pageSetup:{fitToPage: true, fitToHeight: 5, fitToWidth: 7}
});

// 之后调整页面设置配置
worksheet.pageSetup.margins = {
  left: 0.7, right: 0.7,
  top: 0.75, bottom: 0.75,
  header: 0.3, footer: 0.3
};

// 设置工作表的打印区域
worksheet.pageSetup.printArea = 'A1:G20';

// 通过使用 `&&` 分隔打印区域来设置多个打印区域
worksheet.pageSetup.printArea = 'A1:G10&&A11:G20';

// 在每个打印页面上重复特定的行
worksheet.pageSetup.printTitlesRow = '1:3';

// 在每个打印页面上重复特定列
worksheet.pageSetup.printTitlesColumn = 'A:C';
```

**支持的页面设置配置项**

| 属性名                  | 默认值       | 描述 |
| --------------------- | ------------- | ----------- |
| margins               |               | 页面上的空白边距。 单位为英寸。 |
| orientation           | `'portrait'` | 页面方向 - 即较高 (`'portrait'`) 或者较宽 (`'landscape'`) |
| horizontalDpi         | 4294967295    | 水平方向上的 DPI。默认值为 `-1` |
| verticalDpi           | 4294967295    | 垂直方向上的 DPI。默认值为 `-1` |
| fitToPage             |               | 是否使用 `fitToWidth` 和 `fitToHeight` 或 `scale` 设置。默认基于存在于 `pageSetup` 对象中的设置-如果两者都存在，则 `scale` 优先级高（默认值为 `false`）。 |
| pageOrder             | `'downThenOver'` | 打印页面的顺序-`['downThenOver', 'overThenDown']` 之一 |
| blackAndWhite         | `false`  | 无色打印 |
| draft                 | `false`  | 打印质量较低（墨水） |
| cellComments          | `'None'` | 在何处放置批注-`['atEnd'，'asDisplayed'，'None']`中的一个 |
| errors                | `'displayed'` | 哪里显示错误 -`['dash', 'blank', 'NA', 'displayed']` 之一 |
| scale                 | 100           | 增加或减小打印尺寸的百分比值。 当 `fitToPage` 为 `false` 时激活 |
| fitToWidth            | 1             | 纸张应打印多少页宽。 当 `fitToPage` 为 `true` 时激活 |
| fitToHeight           | 1             | 纸张应打印多少页高。 当 `fitToPage` 为 `true` 时激活 |
| paperSize             |               | 使用哪种纸张尺寸（见下文） |
| showRowColHeaders     | false         | 是否显示行号和列字母 |
| showGridLines         | false         | 是否显示网格线 |
| firstPageNumber       |               | 第一页使用哪个页码 |
| horizontalCentered    | false         | 是否将工作表数据水平居中 |
| verticalCentered      | false         | 是否将工作表数据垂直居中 |

**示例纸张尺寸**

| 属性名                          | 值       |
| ----------------------------- | ----------- |
| Letter                        | `undefined` |
| Legal                         | 5           |
| Executive                     | 7           |
| A3                            | 8           |
| A4                            | 9           |
| A5                            | 11          |
| B5 (JIS)                      | 13          |
| Envelope #10                  | 20          |
| Envelope DL                   | 27          |
| Envelope C5                   | 28          |
| Envelope B5                   | 34          |
| Envelope Monarch              | 37          |
| Double Japan Postcard Rotated | 82          |
| 16K 197x273 mm                | 119         |

## 页眉和页脚[⬆](#目录)<!-- Link generated with jump2header -->

这是添加页眉和页脚的方法。
添加的内容主要是文本，例如时间，简介，文件信息等，您可以设置文本的样式。
此外，您可以为首页和偶数页设置不同的文本。

注意：目前不支持图片。

```javascript
// 创建一个带有页眉和页脚的工作表
var sheet = workbook.addWorksheet('My Sheet', {
  headerFooter:{firstHeader: "Hello Exceljs", firstFooter: "Hello World"}
});

// 创建一个带有页眉和页脚可写的工作表
var worksheetWriter = workbookWriter.addWorksheet('sheet', {
  headerFooter:{firstHeader: "Hello Exceljs", firstFooter: "Hello World"}
});
// 代码中出现的&开头字符对应变量，相关信息可查阅下文的变量表
// 设置页脚(默认居中),结果：“第 2 页，共 16 页”
worksheet.headerFooter.oddFooter = "第 &P 页，共 &N 页";

// 将页脚（默认居中）设置为粗体，结果是：“第2页，共16页”
worksheet.headerFooter.oddFooter = "Page &P of &N";

// 将左页脚设置为 18px 并以斜体显示。 结果：“第2页，共16页”
worksheet.headerFooter.oddFooter = "&LPage &P of &N";

// 将中间标题设置为灰色Aril，结果为：“ 52 exceljs”
worksheet.headerFooter.oddHeader = "&C&KCCCCCC&\"Aril\"52 exceljs";

// 设置页脚的左，中和右文本。 结果：页脚左侧为“ Exceljs”。 页脚中心的“ demo.xlsx”。 页脚右侧的“第2页”
worksheet.headerFooter.oddFooter = "&Lexceljs&C&F&RPage &P";

// 在首页添加不同的页眉和页脚
worksheet.headerFooter.differentFirst = true;
worksheet.headerFooter.firstHeader = "Hello Exceljs";
worksheet.headerFooter.firstFooter = "Hello World"
```

**支持的 headerFooter 设置**

| 属性名             | 默认值 | 描述                                                  |
| ---------------- | ------- | ------------------------------------------------------------ |
| differentFirst   | `false` | 将 `differentFirst` 的值设置为 `true`，这表示第一页的页眉/页脚与其他页不同 |
| differentOddEven | `false` | 将 `differentOddEven` 的值设置为 `true`，表示奇数页和偶数页的页眉/页脚不同 |
| oddHeader        | `null`  | 设置奇数（默认）页面的标题字符串，可以设置格式化字符串       |
| oddFooter        | `null`  | 设置奇数（默认）页面的页脚字符串，可以设置格式化字符串       |
| evenHeader       | `null`  | 设置偶数页的标题字符串，可以设置格式化字符串                 |
| evenFooter       | `null`  | 为偶数页设置页脚字符串，可以设置格式化字符串                 |
| firstHeader      | `null`  | 设置首页的标题字符串，可以设置格式化字符串                   |
| firstFooter      | `null`  | 设置首页的页脚字符串，可以设置格式化字符串                   |

**脚本命令**

| 命令     | 描述 |
| ------------ | ----------- |
| &L           | 将位置设定在左侧 |
| &C           | 将位置设置在中心 |
| &R           | 将位置设定在右边 |
| &P           | 当前页码 |
| &N           | 总页数 |
| &D           | 当前日期 |
| &T           | 当前时间 |
| &G           | 照片 |
| &A           | 工作表名称 |
| &F           | 文件名称 |
| &B           | 加粗文本 |
| &I           | 斜体文本                |
| &U           | 文本下划线 |
| &"font name" | 字体名称，例如＆“ Aril” |
| &font size   | 字体大小，例如12 |
| &KHEXCode    | 字体颜色，例如 &KCCCCCC |

## 工作表视图[⬆](#目录)<!-- Link generated with jump2header -->

现在，工作表支持视图列表，这些视图控制Excel如何显示工作表：

* `frozen` - 顶部和左侧的许多行和列被冻结在适当的位置。 仅右下部分会滚动
* `split` - 该视图分为4个部分，每个部分可半独立滚动。

每个视图还支持各种属性：

| 属性名              | 默认值   | 描述 |
| ----------------- | --------- | ----------- |
| state             | `'normal'` | 控制视图状态 -  `'normal'`, `'frozen'` 或者 `'split'` 之一 |
| rightToLeft       | `false` | 将工作表视图的方向设置为从右到左 |
| activeCell        | `undefined` | 当前选择的单元格 |
| showRuler         | `true` | 在页面布局中显示或隐藏标尺 |
| showRowColHeaders | `true` | 显示或隐藏行标题和列标题（例如，顶部的 A1，B1 和左侧的1,2,3） |
| showGridLines     | `true` | 显示或隐藏网格线（针对未定义边框的单元格显示） |
| zoomScale         | 100       | 用于视图的缩放比例 |
| zoomScaleNormal   | 100       | 正常缩放视图 |
| style             | `undefined` | 演示样式- `pageBreakPreview` 或 `pageLayout` 之一。 注意：页面布局与 `frozen` 视图不兼容 |

### 冻结视图[⬆](#目录)<!-- Link generated with jump2header -->

冻结视图支持以下额外属性：

| 属性名              | 默认值   | 描述 |
| ----------------- | --------- | ----------- |
| xSplit            | 0         | 冻结多少列。要仅冻结行，请将其设置为 `0` 或 `undefined` |
| ySplit            | 0         | 冻结多少行。要仅冻结列，请将其设置为 `0` 或 `undefined` |
| topLeftCell       | special   | 哪个单元格将在右下窗格中的左上角。注意：不能是冻结单元格。默认为第一个未冻结的单元格 |

```javascript
worksheet.views = [
  {state: 'frozen', xSplit: 2, ySplit: 3, topLeftCell: 'G10', activeCell: 'A1'}
];
```

### 拆分视图[⬆](#目录)<!-- Link generated with jump2header -->

拆分视图支持以下额外属性：

| 属性名              | 默认值   | 描述 |
| ----------------- | --------- | ----------- |
| xSplit            | 0         | 从左侧多少个点起，以放置拆分器。要垂直拆分，请将其设置为 `0` 或 `undefined` |
| ySplit            | 0         | 从顶部多少个点起，放置拆分器。要水平拆分，请将其设置为 `0` 或 `undefined`  |
| topLeftCell       | `undefined` | 哪个单元格将在右下窗格中的左上角。 |
| activePane        | `undefined` | 哪个窗格将处于活动状态-`topLeft`，`topRight`，`bottomLeft` 和 `bottomRight` 中的一个 |

```javascript
worksheet.views = [
  {state: 'split', xSplit: 2000, ySplit: 3000, topLeftCell: 'G10', activeCell: 'A1'}
];
```

## 自动筛选器[⬆](#目录)<!-- Link generated with jump2header -->

可以对工作表应用自动筛选器。

```javascript
worksheet.autoFilter = 'A1:C1';
```

尽管范围字符串是 `autoFilter` 的标准形式，但工作表还将支持以下值：

```javascript
// 将自动筛选器设置为从 A1 到 C1
worksheet.autoFilter = {
  from: 'A1',
  to: 'C1',
}

// 将自动筛选器设置为从第3行第1列的单元格到第5行第12列的单元格
worksheet.autoFilter = {
  from: {
    row: 3,
    column: 1
  },
  to: {
    row: 5,
    column: 12
  }
}

// 将自动筛选器设置为从D3到第7行第5列中的单元格
worksheet.autoFilter = {
  from: 'D3',
  to: {
    row: 7,
    column: 5
  }
}
```

## 列[⬆](#目录)<!-- Link generated with jump2header -->

```javascript
// 添加列标题并定义列键和宽度
// 注意：这些列结构仅是构建工作簿的方便之处，除了列宽之外，它们不会完全保留。
worksheet.columns = [
  { header: 'Id', key: 'id', width: 10 },
  { header: 'Name', key: 'name', width: 32 },
  { header: 'D.O.B.', key: 'DOB', width: 10, outlineLevel: 1 }
];

// 通过键，字母和基于1的列号访问单个列
const idCol = worksheet.getColumn('id');
const nameCol = worksheet.getColumn('B');
const dobCol = worksheet.getColumn(3);

// 设置列属性

// 注意：将覆盖 C1 单元格值
dobCol.header = 'Date of Birth';

// 注意：这将覆盖 C1:C2 单元格值
dobCol.header = ['Date of Birth', 'A.K.A. D.O.B.'];

// 从现在开始，此列将以 “dob” 而不是 “DOB” 建立索引
dobCol.key = 'dob';

dobCol.width = 15;

// 如果需要，隐藏列
dobCol.hidden = true;

// 为列设置大纲级别
worksheet.getColumn(4).outlineLevel = 0;
worksheet.getColumn(5).outlineLevel = 1;

// 列支持一个只读字段，以指示基于 `OutlineLevel` 的折叠状态
expect(worksheet.getColumn(4).collapsed).to.equal(false);
expect(worksheet.getColumn(5).collapsed).to.equal(true);

// 遍历此列中的所有当前单元格
dobCol.eachCell(function(cell, rowNumber) {
  // ...
});

// 遍历此列中的所有当前单元格，包括空单元格
dobCol.eachCell({ includeEmpty: true }, function(cell, rowNumber) {
  // ...
});

// 添加一列新值
worksheet.getColumn(6).values = [1,2,3,4,5];

// 添加稀疏列值
worksheet.getColumn(7).values = [,,2,3,,5,,7,,,,11];

// 剪切一列或多列（右边的列向左移动）
// 如果定义了列属性，则会相应地对其进行切割或移动
// 已知问题：如果拼接导致任何合并的单元格移动，结果可能是不可预测的
worksheet.spliceColumns(3,2);

// 删除一列，再插入两列。
// 注意：第4列及以上的列将右移1列。
// 另外：如果工作表中的行数多于列插入项中的值，则行将仍然被插入，就好像值存在一样。
const newCol3Values = [1,2,3,4,5];
const newCol4Values = ['one', 'two', 'three', 'four', 'five'];
worksheet.spliceColumns(3, 1, newCol3Values, newCol4Values);

```

## 行[⬆](#目录)<!-- Link generated with jump2header -->

```javascript
// 获取一个行对象。如果尚不存在，则将返回一个新的空对象
const row = worksheet.getRow(5);

// Get multiple row objects. If it doesn't already exist, new empty ones will be returned
const rows = worksheet.getRows(5, 2); // start, length (>0, else undefined is returned)

// 获取工作表中的最后一个可编辑行（如果没有，则为 `undefined`）
const row = worksheet.lastRow;

// 设置特定的行高
row.height = 42.5;

// 隐藏行
row.hidden = true;

// 为行设置大纲级别
worksheet.getRow(4).outlineLevel = 0;
worksheet.getRow(5).outlineLevel = 1;

// 行支持一个只读字段，以指示基于 `OutlineLevel` 的折叠状态
expect(worksheet.getRow(4).collapsed).to.equal(false);
expect(worksheet.getRow(5).collapsed).to.equal(true);


row.getCell(1).value = 5; // A5 的值设置为5
row.getCell('name').value = 'Zeb'; // B5 的值设置为 “Zeb” - 假设第2列仍按名称键入
row.getCell('C').value = new Date(); // C5 的值设置为当前时间

// 获取行并作为稀疏数组返回
// 注意：接口更改：worksheet.getRow(4) ==> worksheet.getRow(4).values
row = worksheet.getRow(4).values;
expect(row[5]).toEqual('Kyle');

// 通过连续数组分配行值（其中数组元素 0 具有值）
row.values = [1,2,3];
expect(row.getCell(1).value).toEqual(1);
expect(row.getCell(2).value).toEqual(2);
expect(row.getCell(3).value).toEqual(3);

// 通过稀疏数组分配行值（其中数组元素 0 为 `undefined`）
const values = []
values[5] = 7;
values[10] = 'Hello, World!';
row.values = values;
expect(row.getCell(1).value).toBeNull();
expect(row.getCell(5).value).toEqual(7);
expect(row.getCell(10).value).toEqual('Hello, World!');

// 使用列键按对象分配行值
row.values = {
  id: 13,
  name: 'Thing 1',
  dob: new Date()
};

// 在该行下方插入一个分页符
row.addPageBreak();

// 遍历工作表中具有值的所有行
worksheet.eachRow(function(row, rowNumber) {
  console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.values));
});

// 遍历工作表中的所有行（包括空行）
worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
  console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.values));
});

// 连续遍历所有非空单元格
row.eachCell(function(cell, colNumber) {
  console.log('Cell ' + colNumber + ' = ' + cell.value);
});

// 遍历一行中的所有单元格（包括空单元格）
row.eachCell({ includeEmpty: true }, function(cell, colNumber) {
  console.log('Cell ' + colNumber + ' = ' + cell.value);
});

// 提交给流一个完成的行
row.commit();

// 行尺寸
const rowSize = row.cellCount;
const numValues = row.actualCellCount;
```

## Add Rows[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
// Add a couple of Rows by key-value, after the last current row, using the column keys
worksheet.addRow({id: 1, name: 'John Doe', dob: new Date(1970,1,1)});
worksheet.addRow({id: 2, name: 'Jane Doe', dob: new Date(1965,1,7)});

// Add a row by contiguous Array (assign to columns A, B & C)
worksheet.addRow([3, 'Sam', new Date()]);

// Add a row by sparse Array (assign to columns A, E & I)
const rowValues = [];
rowValues[1] = 4;
rowValues[5] = 'Kyle';
rowValues[9] = new Date();
worksheet.addRow(rowValues);

// Add a row with inherited style
// This new row will have same style as last row
// And return as row object
const newRow = worksheet.addRow(rowValues, 'i');

// Add an array of rows
const rows = [
  [5,'Bob',new Date()], // row by array
  {id:6, name: 'Barbara', dob: new Date()}
];
// add new rows and return them as array of row objects
const newRows = worksheet.addRows(rows);

// Add an array of rows with inherited style
// These new rows will have same styles as last row
// and return them as array of row objects
const newRowsStyled = worksheet.addRows(rows, 'i');
```
| Parameter | Description | Default Value |
| -------------- | ----------------- | -------- |
| value/s    | The new row/s values |  |
| style            | 'i' for inherit from row above, 'i+' to include empty cells, 'n' for none | *'n'* |

## 处理单个单元格[⬆](#目录)<!-- Link generated with jump2header -->

```javascript
const cell = worksheet.getCell('C3');

// 修改/添加单个单元格
cell.value = new Date(1968, 5, 1);

// 查询单元格的类型
expect(cell.type).toEqual(Excel.ValueType.Date);

// 使用单元格的字符串值
myInput.value = cell.text;

// 使用 html 安全的字符串进行渲染...
const html = '<div>' + cell.html + '</div>';

```

## 合并单元格[⬆](#目录)<!-- Link generated with jump2header -->

```javascript
// 合并一系列单元格
worksheet.mergeCells('A4:B5');

// ...合并的单元格被链接起来了
worksheet.getCell('B5').value = 'Hello, World!';
expect(worksheet.getCell('B5').value).toBe(worksheet.getCell('A4').value);
expect(worksheet.getCell('B5').master).toBe(worksheet.getCell('A4'));

// ...合并的单元格共享相同的样式对象
expect(worksheet.getCell('B5').style).toBe(worksheet.getCell('A4').style);
worksheet.getCell('B5').style.font = myFonts.arial;
expect(worksheet.getCell('A4').style.font).toBe(myFonts.arial);

// 取消单元格合并将打破链接的样式
worksheet.unMergeCells('A4');
expect(worksheet.getCell('B5').style).not.toBe(worksheet.getCell('A4').style);
expect(worksheet.getCell('B5').style.font).not.toBe(myFonts.arial);

// 按左上，右下合并
worksheet.mergeCells('K10', 'M12');

// 按开始行，开始列，结束行，结束列合并（相当于 K10:M12）
worksheet.mergeCells(10,11,12,13);
```

## Insert Rows[⬆](#目录)<!-- Link generated with jump2header -->

```javascript
insertRow(pos, value, style = 'n')
insertRows(pos, values, style = 'n')

// Insert a couple of Rows by key-value, shifting down rows every time
worksheet.insertRow(1, {id: 1, name: 'John Doe', dob: new Date(1970,1,1)});
worksheet.insertRow(1, {id: 2, name: 'Jane Doe', dob: new Date(1965,1,7)});

// Insert a row by contiguous Array (assign to columns A, B & C)
worksheet.insertRow(1, [3, 'Sam', new Date()]);

// Insert a row by sparse Array (assign to columns A, E & I)
var rowValues = [];
rowValues[1] = 4;
rowValues[5] = 'Kyle';
rowValues[9] = new Date();
// insert new row and return as row object
const insertedRow = worksheet.insertRow(1, rowValues);

// Insert a row, with inherited style
// This new row will have same style as row on top of it
// And return as row object
const insertedRowInherited = worksheet.insertRow(1, rowValues, 'i');

// Insert a row, keeping original style
// This new row will have same style as it was previously
// And return as row object
const insertedRowOriginal = worksheet.insertRow(1, rowValues, 'o');

// Insert an array of rows, in position 1, shifting down current position 1 and later rows by 2 rows
var rows = [
  [5,'Bob',new Date()], // row by array
  {id:6, name: 'Barbara', dob: new Date()}
];
// insert new rows and return them as array of row objects
const insertedRows = worksheet.insertRows(1, rows);

// Insert an array of rows, with inherited style
// These new rows will have same style as row on top of it
// And return them as array of row objects
const insertedRowsInherited = worksheet.insertRows(1, rows, 'i');

// Insert an array of rows, keeping original style
// These new rows will have same style as it was previously in 'pos' position
const insertedRowsOriginal = worksheet.insertRows(1, rows, 'o');

```
| Parameter | Description | Default Value |
| -------------- | ----------------- | -------- |
| pos          | Row number where you want to insert, pushing down all rows from there |  |
| value/s    | The new row/s values |  |
| style            | 'i' for inherit from row above, , 'i+' to include empty cells, 'o' for original style, 'o+' to include empty cells, 'n' for none | *'n'* |

## Splice[⬆](#contents)<!-- Link generated with jump2header -->

```javascript
// Cut one or more rows (rows below are shifted up)
// Known Issue: If a splice causes any merged cells to move, the results may be unpredictable
worksheet.spliceRows(4, 3);

// remove one row and insert two more.
// Note: rows 4 and below will be shifted down by 1 row.
const newRow3Values = [1, 2, 3, 4, 5];
const newRow4Values = ['one', 'two', 'three', 'four', 'five'];
worksheet.spliceRows(3, 1, newRow3Values, newRow4Values);

// Cut one or more cells (cells to the right are shifted left)
// Note: this operation will not affect other rows
row.splice(3, 2);

// remove one cell and insert two more (cells to the right of the cut cell will be shifted right)
row.splice(4, 1, 'new value 1', 'new value 2');
```
| Parameter | Description | Default Value |
| -------------- | ----------------- | -------- |
| start    | Starting point to splice from |  |
| count    | Number of rows/cells to remove |  |
| ...inserts            | New row/cell values to insert |  |

## 重复行[⬆](#目录)<!-- Link generated with jump2header -->

```javascript
duplicateRow(start, amount = 1, insert = true)

const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('duplicateTest');
ws.getCell('A1').value = 'One';
ws.getCell('A2').value = 'Two';
ws.getCell('A3').value = 'Three';
ws.getCell('A4').value = 'Four';

// 该行将重复复制第一行两次，但将替换第二行和第三行
// 如果第三个参数为 true，则它将插入2个新行，其中包含行 “One” 的值和样式
ws.duplicateRow(1,2,false);
```

| 参数 | 描述 | 默认值 |
| -------------- | ----------------- | -------- |
| start          | 要复制的行号（Excel中的第一个是1） |  |
| amount         | 您要复制行的次数 | 1 |
| insert         | 如果要为重复项插入新行，则为 `true`，否则为 `false` 将替换已有行 | `true` |



## 定义名称[⬆](#目录)<!-- Link generated with jump2header -->

单个单元格（或多个单元格组）可以为它们分配名称。名称可用于公式和数据验证（可能还有更多）。

```javascript
// 为单元格分配（或获取）名称（将覆盖该单元具有的其他任何名称）
worksheet.getCell('A1').name = 'PI';
expect(worksheet.getCell('A1').name).to.equal('PI');

// 为单元格分配（或获取）一组名称（单元可以具有多个名称）
worksheet.getCell('A1').names = ['thing1', 'thing2'];
expect(worksheet.getCell('A1').names).to.have.members(['thing1', 'thing2']);

// 从单元格中删除名称
worksheet.getCell('A1').removeName('thing1');
expect(worksheet.getCell('A1').names).to.have.members(['thing2']);
```

## 数据验证[⬆](#目录)<!-- Link generated with jump2header -->

单元格可以定义哪些值有效或无效，并提示用户以帮助指导它们。

验证类型可以是以下之一：

| 类型       | 描述 |
| ---------- | ----------- |
| list       | 定义一组离散的有效值。Excel 将在下拉菜单中提供这些内容，以便于输入 |
| whole      | 该值必须是整数 |
| decimal    | 该值必须是十进制数 |
| textLength | 该值可以是文本，但长度是受控的 |
| custom     | 自定义公式控制有效值 |

对于 `list` 或 `custom` 以外的其他类型，以下运算符会影响验证：

| 运算符              | 描述 |
| --------------------  | ----------- |
| between               | 值必须介于公式结果之间 |
| notBetween            | 值不能介于公式结果之间 |
| equal                 | 值必须等于公式结果 |
| notEqual              | 值不能等于公式结果 |
| greaterThan           | 值必须大于公式结果 |
| lessThan              | 值必须小于公式结果 |
| greaterThanOrEqual    | 值必须大于或等于公式结果 |
| lessThanOrEqual       | 值必须小于或等于公式结果 |

```javascript
// 指定有效值的列表（One，Two，Three，Four）。
// Excel 将提供一个包含这些值的下拉列表。
worksheet.getCell('A1').dataValidation = {
  type: 'list',
  allowBlank: true,
  formulae: ['"One,Two,Three,Four"']
};

// 指定范围内的有效值列表。
// Excel 将提供一个包含这些值的下拉列表。
worksheet.getCell('A1').dataValidation = {
  type: 'list',
  allowBlank: true,
  formulae: ['$D$5:$F$5']
};

// 指定单元格必须为非5的整数。
// 向用户显示适当的错误消息（如果他们弄错了）
worksheet.getCell('A1').dataValidation = {
  type: 'whole',
  operator: 'notEqual',
  showErrorMessage: true,
  formulae: [5],
  errorStyle: 'error',
  errorTitle: 'Five',
  error: 'The value must not be Five'
};

// 指定单元格必须为1.5到7之间的十进制数字。
// 添加“工具提示”以帮助指导用户
worksheet.getCell('A1').dataValidation = {
  type: 'decimal',
  operator: 'between',
  allowBlank: true,
  showInputMessage: true,
  formulae: [1.5, 7],
  promptTitle: 'Decimal',
  prompt: 'The value must between 1.5 and 7'
};

// 指定单元格的文本长度必须小于15
worksheet.getCell('A1').dataValidation = {
  type: 'textLength',
  operator: 'lessThan',
  showErrorMessage: true,
  allowBlank: true,
  formulae: [15]
};

// 指定单元格必须是2016年1月1日之前的日期
worksheet.getCell('A1').dataValidation = {
  type: 'date',
  operator: 'lessThan',
  showErrorMessage: true,
  allowBlank: true,
  formulae: [new Date(2016,0,1)]
};
```

## 单元格注释[⬆](#目录)<!-- Link generated with jump2header -->

将旧样式的注释添加到单元格

```javascript
// 纯文字笔记
worksheet.getCell('A1').note = 'Hello, ExcelJS!';

// 彩色格式化的笔记
ws.getCell('B1').note = {
  texts: [
    {'font': {'size': 12, 'color': {'theme': 0}, 'name': 'Calibri', 'family': 2, 'scheme': 'minor'}, 'text': 'This is '},
    {'font': {'italic': true, 'size': 12, 'color': {'theme': 0}, 'name': 'Calibri', 'scheme': 'minor'}, 'text': 'a'},
    {'font': {'size': 12, 'color': {'theme': 1}, 'name': 'Calibri', 'family': 2, 'scheme': 'minor'}, 'text': ' '},
    {'font': {'size': 12, 'color': {'argb': 'FFFF6600'}, 'name': 'Calibri', 'scheme': 'minor'}, 'text': 'colorful'},
    {'font': {'size': 12, 'color': {'theme': 1}, 'name': 'Calibri', 'family': 2, 'scheme': 'minor'}, 'text': ' text '},
    {'font': {'size': 12, 'color': {'argb': 'FFCCFFCC'}, 'name': 'Calibri', 'scheme': 'minor'}, 'text': 'with'},
    {'font': {'size': 12, 'color': {'theme': 1}, 'name': 'Calibri', 'family': 2, 'scheme': 'minor'}, 'text': ' in-cell '},
    {'font': {'bold': true, 'size': 12, 'color': {'theme': 1}, 'name': 'Calibri', 'family': 2, 'scheme': 'minor'}, 'text': 'format'},
  ],
  margins: {
    insetmode: 'custom',
    inset: [0.25, 0.25, 0.35, 0.35]
  },
  protection: {
    locked: True,
    lockText: False
  },
  editAs: 'twoCells'
};
```

### 单元格批注属性[⬆](#目录)<!-- Link generated with jump2header -->

下表定义了单元格注释已支持的属性。

| Field     | Required | Default Value | Description |
| --------  | -------- | ------------- | ----------- |
| texts     | Y        |               | 评论文字 |
| margins | N        | {}  | 确定自动或自定义设置单元格注释的边距值 |
| protection   | N        | {} | 可以使用保护属性来指定对象和对象文本的锁定状态 |
| editAs   | N        | 'absolute' | 可以使用'editAs'属性来指定注释如何锚定到单元格 |

### 单元格批注页边距[⬆](#目录)<!-- Link generated with jump2header -->

确定单元格批注的页面距设置模式，自动或者自定义模式。

```javascript
ws.getCell('B1').note.margins = {
  insetmode: 'custom',
  inset: [0.25, 0.25, 0.35, 0.35]
}
```

### 已支持的页边距属性[⬆](#目录)<!-- Link generated with jump2header -->

| Property     | Required | Default Value | Description |
| --------  | -------- | ------------- | ----------- |
| insetmode     | N        |    'auto'           | 确定是否自动设置注释边距，并且值是'auto' 或者 'custom' |
| inset | N        | [0.13, 0.13, 0.25, 0.25]  | 批注页边距的值，单位是厘米, 方向是左-上-右-下 |

注意：只有当 ```insetmode```的值设置为'custom'时，```inset```的设置才生效。

### 单元格批注保护[⬆](#目录)<!-- Link generated with jump2header -->

可以使用保护属性来修改单元级别保护。

```javascript
ws.getCell('B1').note.protection = {
  locked: 'False',
  lockText: 'False',
};
```

### 已支持的保护属性[⬆](#目录)<!-- Link generated with jump2header -->

| Property     | Required | Default Value | Description |
| --------  | -------- | ------------- | ----------- |
| locked     | N        |    'True'           | 此元素指定在保护工作表时对象已锁定 |
| lockText | N        | 'True'  | 该元素指定对象的文本已锁定 |


### 单元格批注对象位置属性[⬆](#目录)<!-- Link generated with jump2header -->

单元格注释还可以具有属性 'editAs'，该属性将控制注释如何锚定到单元格。
它可以具有以下值之一：

```javascript
ws.getCell('B1').note.editAs = 'twoCells'
```

| Value     | Description |
| --------- | ----------- |
| twoCells | 它指定注释的大小、位置随单元格而变 |
| oneCells   | 它指定注释的大小固定，位置随单元格而变 |
| absolute  | 这是默认值，它指定注释的大小、位置均固定 |

## 表格[⬆](#目录)<!-- Link generated with jump2header -->

表允许表格内数据的表内操作。

要将表添加到工作表，请定义表模型并调用 `addTable`：

```javascript
// 将表格添加到工作表
ws.addTable({
  name: 'MyTable',
  ref: 'A1',
  headerRow: true,
  totalsRow: true,
  style: {
    theme: 'TableStyleDark3',
    showRowStripes: true,
  },
  columns: [
    {name: 'Date', totalsRowLabel: 'Totals:', filterButton: true},
    {name: 'Amount', totalsRowFunction: 'sum', filterButton: false},
  ],
  rows: [
    [new Date('2019-07-20'), 70.10],
    [new Date('2019-07-21'), 70.60],
    [new Date('2019-07-22'), 70.10],
  ],
});
```

注意：将表格添加到工作表将通过放置表格的标题和行数据来修改工作表。
结果就是表格覆盖的工作表上的所有数据（包括标题和所有的）都将被覆盖。

### 表格属性[⬆](#目录)<!-- Link generated with jump2header -->


下表定义了表格支持的属性。

| 表属性 | 描述       | 是否需要 | 默认值 |
| -------------- | ----------------- | -------- | ------------- |
| name           | 表格名称 | Y |    |
| displayName    | 表格的显示名称 | N | `name` |
| ref            | 表格的左上方单元格 | Y |   |
| headerRow      | 在表格顶部显示标题 | N | true |
| totalsRow      | 在表格底部显示总计 | N | `false` |
| style          | 额外的样式属性 | N | {} |
| columns        | 列定义 | Y |   |
| rows           | 数据行 | Y |   |

### 表格样式属性[⬆](#目录)<!-- Link generated with jump2header -->

下表定义了表格中支持的属性样式属性。

| 样式属性     | 描述       | 是否需要 | 默认值 |
| ------------------ | ----------------- | -------- | ------------- |
| theme              | 桌子的颜色主题 | N |  `'TableStyleMedium2'`  |
| showFirstColumn    | 突出显示第一列（粗体） | N |  `false`  |
| showLastColumn     | 突出显示最后一列（粗体） | N |  `false`  |
| showRowStripes     | 用交替的背景色显示行 | N |  `false`  |
| showColumnStripes  | 用交替的背景色显示列 | N |  `false`  |

### 表格列属性[⬆](#目录)<!-- Link generated with jump2header -->

下表定义了每个表格列中支持的属性。

| 列属性    | 描述       | 是否需要 | 默认值 |
| ------------------ | ----------------- | -------- | ------------- |
| name               | 列名，也用在标题中 | Y |    |
| filterButton       | 切换标题中的过滤器控件 | N |  false  |
| totalsRowLabel     | 用于描述统计行的标签（第一列） | N | `'Total'` |
| totalsRowFunction  | 统计函数名称 | N | `'none'` |
| totalsRowFormula   | 自定义函数的可选公式 | N |   |

### 统计函数[⬆](#目录)<!-- Link generated with jump2header -->

下表列出了由列定义的 `totalsRowFunction` 属性的有效值。如果使用 `'custom'` 以外的任何值，则无需包括关联的公式，因为该公式将被表格插入。

| 统计函数   | 描述       |
| ------------------ | ----------------- |
| none               | 此列没有统计函数 |
| average            | 计算列的平均值 |
| countNums          | 统计数字条目数 |
| count              | 条目数 |
| max                | 此列中的最大值 |
| min                | 此列中的最小值 |
| stdDev             | 该列的标准偏差 |
| var                | 此列的方差 |
| sum                | 此列的条目总数 |
| custom             | 自定义公式。 需要关联的 `totalsRowFormula` 值。 |

### 表格样式主题[⬆](#目录)<!-- Link generated with jump2header -->

有效的主题名称遵循以下模式：

* "TableStyle[Shade][Number]"

Shades（阴影），Number（数字）可以是以下之一：

* Light, 1-21
* Medium, 1-28
* Dark, 1-11

对于无主题，请使用值 `null`。

注意：exceljs 尚不支持自定义表格主题。

### 修改表格[⬆](#目录)<!-- Link generated with jump2header -->

表格支持一组操作函数，这些操作函数允许添加或删除数据以及更改某些属性。由于这些操作中的许多操作可能会对工作表产生副作用，因此更改必须在完成后立即提交。

表中的所有索引值均基于零，因此第一行号和第一列号为 `0`。

**添加或删除标题和统计**

```javascript
const table = ws.getTable('MyTable');

// 打开标题行
table.headerRow = true;

// 关闭统计行
table.totalsRow = false;

// 将表更改提交到工作表中
table.commit();
```

**重定位表**

```javascript
const table = ws.getTable('MyTable');

// 表格左上移至 D4
table.ref = 'D4';

// 将表更改提交到工作表中
table.commit();
```

**添加和删除行**

```javascript
const table = ws.getTable('MyTable');

// 删除前两行
table.removeRows(0, 2);

// 在索引 5 处插入新行
table.addRow([new Date('2019-08-05'), 5, 'Mid'], 5);

// 在表格底部追加新行
table.addRow([new Date('2019-08-10'), 10, 'End']);

// 将表更改提交到工作表中
table.commit();
```

**添加和删除列**

```javascript
const table = ws.getTable('MyTable');

// 删除第二列
table.removeColumns(1, 1);

// 在索引 1 处插入新列（包含数据）
table.addColumn(
  {name: 'Letter', totalsRowFunction: 'custom', totalsRowFormula: 'ROW()', totalsRowResult: 6, filterButton: true},
  ['a', 'b', 'c', 'd'],
  2
);

// 将表更改提交到工作表中
table.commit();
```

**更改列属性**

```javascript
const table = ws.getTable('MyTable');

// 获取第二列的列包装器
const column = table.getColumn(1);

// 设置一些属性
column.name = 'Code';
column.filterButton = true;
column.style = {font:{bold: true, name: 'Comic Sans MS'}};
column.totalsRowLabel = 'Totals';
column.totalsRowFunction = 'custom';
column.totalsRowFormula = 'ROW()';
column.totalsRowResult = 10;

// 将表更改提交到工作表中
table.commit();
```


## 样式[⬆](#目录)<!-- Link generated with jump2header -->

单元格，行和列均支持一组丰富的样式和格式，这些样式和格式会影响单元格的显示方式。

通过分配以下属性来设置样式：

* <a href="#数字格式">numFmt</a>
* <a href="#字体">font</a>
* <a href="#对齐">alignment</a>
* <a href="#边框">border</a>
* <a href="#填充">fill</a>

```javascript
// 为单元格分配样式
ws.getCell('A1').numFmt = '0.00%';

// 将样式应用于工作表列
ws.columns = [
  { header: 'Id', key: 'id', width: 10 },
  { header: 'Name', key: 'name', width: 32, style: { font: { name: 'Arial Black' } } },
  { header: 'D.O.B.', key: 'DOB', width: 10, style: { numFmt: 'dd/mm/yyyy' } }
];

// 将第3列设置为“货币格式”
ws.getColumn(3).numFmt = '"£"#,##0.00;[Red]\-"£"#,##0.00';

// 将第2行设置为 Comic Sans。
ws.getRow(2).font = { name: 'Comic Sans MS', family: 4, size: 16, underline: 'double', bold: true };
```

将样式应用于行或列时，它将应用于该行或列中所有当前存在的单元格。另外，创建的任何新单元格都将从其所属的行和列继承其初始样式。

如果单元格的行和列都定义了特定的样式（例如，字体），则该单元格所在行样式比列样式具有更高优先级。但是，如果行和列定义了不同的样式（例如 `column.numFmt` 和 `row.font`），则单元格将继承行的字体和列的 `numFmt`。


注意：以上所有属性（`numFmt`（字符串）除外）都是 JS 对象结构。如果将同一样式对象分配给多个电子表格实体，则每个实体将共享同一样式对象。如果样式对象后来在电子表格序列化之前被修改，则所有引用该样式对象的实体也将被修改。此行为旨在通过减少创建的JS对象的数量来优先考虑性能。如果希望样式对象是独立的，则需要先对其进行克隆，然后再分配它们。同样，默认情况下，如果电子表格实体共享相似的样式，则从文件（或流）中读取文档时，它们也将引用相同的样式对象。

### 数字格式[⬆](#目录)<!-- Link generated with jump2header -->

```javascript
// 将值显示为“ 1 3/5”
ws.getCell('A1').value = 1.6;
ws.getCell('A1').numFmt = '# ?/?';

// 显示为“ 1.60％”
ws.getCell('B1').value = 0.016;
ws.getCell('B1').numFmt = '0.00%';
```

### 字体

```javascript

// for the wannabe graphic designers out there
ws.getCell('A1').font = {
  name: 'Comic Sans MS',
  family: 4,
  size: 16,
  underline: true,
  bold: true
};

// for the graduate graphic designers...
ws.getCell('A2').font = {
  name: 'Arial Black',
  color: { argb: 'FF00FF00' },
  family: 2,
  size: 14,
  italic: true
};

// 垂直对齐
ws.getCell('A3').font = {
  vertAlign: 'superscript'
};

// 注意：该单元格将存储对分配的字体对象的引用。
// 如果之后更改了字体对象，则单元字体也将更改。
const font = { name: 'Arial', size: 12 };
ws.getCell('A3').font = font;
font.size = 20; // 单元格 A3 现在具有20号字体！

// 从文件或流中读取工作簿后，共享相似字体的单元格可能引用相同的字体对象
```

| 字体属性 | 描述       | 示例值 |
| ------------- | ----------------- | ---------------- |
| name          | 字体名称。 | 'Arial', 'Calibri', etc. |
| family        | 备用字体家族。整数值。 | 1 - Serif, 2 - Sans Serif, 3 - Mono, Others - unknown |
| scheme        | 字体方案。 | 'minor', 'major', 'none' |
| charset       | 字体字符集。整数值。 | 1, 2, etc. |
| size          | 字体大小。整数值。 | 9, 10, 12, 16, etc. |
| color         | 颜色描述，一个包含 ARGB 值的对象。 | { argb: 'FFFF0000'} |
| bold          | 字体 **粗细** | true, false |
| italic        | 字体 *倾斜* | true, false |
| underline     | 字体 <u>下划线</u> 样式 | true, false, 'none', 'single', 'double', 'singleAccounting', 'doubleAccounting' |
| strike        | 字体 <strike>删除线</strike> | true, false |
| outline       | 字体轮廓 | true, false |
| vertAlign     | 垂直对齐 | 'superscript', 'subscript'

### 对齐[⬆](#目录)<!-- Link generated with jump2header -->

```javascript
// 将单元格对齐方式设置为左上，中间居中，右下
ws.getCell('A1').alignment = { vertical: 'top', horizontal: 'left' };
ws.getCell('B1').alignment = { vertical: 'middle', horizontal: 'center' };
ws.getCell('C1').alignment = { vertical: 'bottom', horizontal: 'right' };

// 将单元格设置为自动换行
ws.getCell('D1').alignment = { wrapText: true };

// 将单元格缩进设置为1
ws.getCell('E1').alignment = { indent: 1 };

// 将单元格文本旋转设置为向上30deg，向下45deg和垂直文本
ws.getCell('F1').alignment = { textRotation: 30 };
ws.getCell('G1').alignment = { textRotation: -45 };
ws.getCell('H1').alignment = { textRotation: 'vertical' };
```

**有效的对齐属性值**

| 水平的       | 垂直    | 文本换行 | 自适应 | 缩进  | 阅读顺序 | 文本旋转 |
| ---------------- | ----------- | -------- | ----------- | ------- | ------------ | ------------ |
| left             | top         | true     | true        | integer | rtl          | 0 to 90      |
| center           | middle      | false    | false       |         | ltr          | -1 to -90    |
| right            | bottom      |          |             |         |              | vertical     |
| fill             | distributed |          |             |         |              |              |
| justify          | justify     |          |             |         |              |              |
| centerContinuous |             |          |             |         |              |              |
| distributed      |             |          |             |         |              |              |


### 边框[⬆](#目录)<!-- Link generated with jump2header -->

```javascript
// 在A1周围设置单个细边框
ws.getCell('A1').border = {
  top: {style:'thin'},
  left: {style:'thin'},
  bottom: {style:'thin'},
  right: {style:'thin'}
};

// 在A3周围设置双细绿色边框
ws.getCell('A3').border = {
  top: {style:'double', color: {argb:'FF00FF00'}},
  left: {style:'double', color: {argb:'FF00FF00'}},
  bottom: {style:'double', color: {argb:'FF00FF00'}},
  right: {style:'double', color: {argb:'FF00FF00'}}
};

// 在A5中设置厚红十字边框
ws.getCell('A5').border = {
  diagonal: {up: true, down: true, style:'thick', color: {argb:'FFFF0000'}}
};
```

**有效边框样式**

* thin
* dotted
* dashDot
* hair
* dashDotDot
* slantDashDot
* mediumDashed
* mediumDashDotDot
* mediumDashDot
* medium
* double
* thick

### 填充[⬆](#目录)<!-- Link generated with jump2header -->

```javascript
// 用红色深色垂直条纹填充A1
ws.getCell('A1').fill = {
  type: 'pattern',
  pattern:'darkVertical',
  fgColor:{argb:'FFFF0000'}
};

// 在A2中填充深黄色格子和蓝色背景
ws.getCell('A2').fill = {
  type: 'pattern',
  pattern:'darkTrellis',
  fgColor:{argb:'FFFFFF00'},
  bgColor:{argb:'FF0000FF'}
};

// 从左到右用蓝白蓝渐变填充A3
ws.getCell('A3').fill = {
  type: 'gradient',
  gradient: 'angle',
  degree: 0,
  stops: [
    {position:0, color:{argb:'FF0000FF'}},
    {position:0.5, color:{argb:'FFFFFFFF'}},
    {position:1, color:{argb:'FF0000FF'}}
  ]
};


// 从中心开始用红绿色渐变填充A4
ws.getCell('A4').fill = {
  type: 'gradient',
  gradient: 'path',
  center:{left:0.5,top:0.5},
  stops: [
    {position:0, color:{argb:'FFFF0000'}},
    {position:1, color:{argb:'FF00FF00'}}
  ]
};
```

#### 填充模式[⬆](#目录)<!-- Link generated with jump2header -->

| 属性 | 是否需要 | 描述 |
| -------- | -------- | ----------- |
| type     | Y        | 值: `'pattern'`<br/>指定此填充使用模式 |
| pattern  | Y        | 指定模式类型 (查看下面 <a href="#有效模式类型">有效模式类型</a> ) |
| fgColor  | N        | 指定图案前景色。默认为黑色。 |
| bgColor  | N        | 指定图案背景色。默认为白色。 |

**有效模式类型**

* none
* solid
* darkGray
* mediumGray
* lightGray
* gray125
* gray0625
* darkHorizontal
* darkVertical
* darkDown
* darkUp
* darkGrid
* darkTrellis
* lightHorizontal
* lightVertical
* lightDown
* lightUp
* lightGrid
* lightTrellis

#### 渐变填充[⬆](#目录)<!-- Link generated with jump2header -->

| 属性 | 是否需要 | 描述 |
| -------- | -------- | ----------- |
| type     | Y        | 值: `'gradient'`<br/>指定此填充使用渐变 |
| gradient | Y        | 指定渐变类型。`['angle'，'path']` 之一 |
| degree   | angle    | 对于“角度”渐变，指定渐变的方向。`0` 是从左到右。值从 1-359 顺时针旋转方向 |
| center   | path     | 对于“路径”渐变。指定路径起点的相对坐标。“左”和“顶”值的范围是 0 到 1 |
| stops    | Y        | 指定渐变颜色序列。是包含位置和颜色（从位置 0 开始到位置 1 结束）的对象的数组。中间位置可用于指定路径上的其他颜色。 |

**注意事项**

使用上面的接口，可能会创建使用XLSX编辑器程序无法实现的渐变填充效果。例如，Excel 仅支持0、45、90 和 135 的角度梯度。类似地，stops 的顺序也可能受到 UI 的限制，其中位置 [0,1] 或[0,0.5,1] 是唯一的选择。请谨慎处理此填充，以确保目标 XLSX 查看器支持该填充。

### 富文本[⬆](#目录)<!-- Link generated with jump2header -->

现在，单个单元格支持RTF文本或单元格格式化。富文本值可以控制文本值内任意数量的子字符串的字体属性。有关支持哪些字体属性的详细信息，请参见<a href="font">字体</a>。

```javascript

ws.getCell('A1').value = {
  'richText': [
    {'font': {'size': 12,'color': {'theme': 0},'name': 'Calibri','family': 2,'scheme': 'minor'},'text': 'This is '},
    {'font': {'italic': true,'size': 12,'color': {'theme': 0},'name': 'Calibri','scheme': 'minor'},'text': 'a'},
    {'font': {'size': 12,'color': {'theme': 1},'name': 'Calibri','family': 2,'scheme': 'minor'},'text': ' '},
    {'font': {'size': 12,'color': {'argb': 'FFFF6600'},'name': 'Calibri','scheme': 'minor'},'text': 'colorful'},
    {'font': {'size': 12,'color': {'theme': 1},'name': 'Calibri','family': 2,'scheme': 'minor'},'text': ' text '},
    {'font': {'size': 12,'color': {'argb': 'FFCCFFCC'},'name': 'Calibri','scheme': 'minor'},'text': 'with'},
    {'font': {'size': 12,'color': {'theme': 1},'name': 'Calibri','family': 2,'scheme': 'minor'},'text': ' in-cell '},
    {'font': {'bold': true,'size': 12,'color': {'theme': 1},'name': 'Calibri','family': 2,'scheme': 'minor'},'text': 'format'}
  ]
};

expect(ws.getCell('A1').text).to.equal('This is a colorful text with in-cell format');
expect(ws.getCell('A1').type).to.equal(Excel.ValueType.RichText);

```

### 单元格保护[⬆](#目录)<!-- Link generated with jump2header -->

可以使用保护属性来修改单元级别保护。

```javascript
ws.getCell('A1').protection = {
  locked: false,
  hidden: true,
};
```

**支持的保护属性**

| 属性 | 默认值 | 描述 |
| -------- | ------- | ----------- |
| locked   | `true`    | 指定在工作表受保护的情况下是否将单元格锁定。 |
| hidden   | `false`   | 指定如果工作表受保护，则单元格的公式是否可见。 |

## 条件格式化[⬆](#目录)<!-- Link generated with jump2header -->

条件格式化允许工作表根据单元格值或任意公式显示特定的样式，图标等。

条件格式设置规则是在工作表级别添加的，通常会覆盖一系列单元格。

可以将多个规则应用于给定的单元格范围，并且每个规则都将应用自己的样式。

如果多个规则影响给定的单元格，则规则优先级值将确定如果竞争样式冲突，则哪个规则胜出。优先级值较低的规则获胜。如果没有为给定规则指定优先级值，ExcelJS 将按升序分配它们。

注意：目前，仅支持条件格式设置规则的子集。具体来说，只有格式规则不需要 &lt;extLst&gt 元素内的 XML 呈现。这意味着不支持数据集和三个特定的图标集（3Triangles，3Stars，5Boxes）。

```javascript
// 根据行和列为偶数或奇数向 A1:E7 添加一个棋盘图案
worksheet.addConditionalFormatting({
  ref: 'A1:E7',
  rules: [
    {
      type: 'expression',
      formulae: ['MOD(ROW()+COLUMN(),2)=0'],
      style: {fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: 'FF00FF00'}}},
    }
  ]
})
```

**支持的条件格式设置规则类型**

| 类型         | 描述 |
| ------------ | ----------- |
| expression   | 任何自定义功能均可用于激活规则。 |
| cellIs       | 使用指定的运算符将单元格值与提供的公式进行比较 |
| top10        | 将格式化应用于值在顶部（或底部）范围内的单元格 |
| aboveAverage | 将格式化应用于值高于（或低于）平均值的单元格 |
| colorScale   | 根据其值在范围内的位置将彩色背景应用于单元格 |
| iconSet      | 根据值将一系列图标之一添加到单元格 |
| containsText | 根据单元格是否为特定文本来应用格式 |
| timePeriod   | 根据单元格日期时间值是否在指定范围内应用格式 |

### 表达式[⬆](#目录)<!-- Link generated with jump2header -->

| 属性    | 可选 | 默认值 | 描述 |
| -------- | -------- | ------- | ----------- |
| type     |          |         | `'expression'` |
| priority | Y        | &lt;auto&gt;  | 确定样式的优先顺序 |
| formulae |          |         | 1个包含真/假值的公式字符串数组。要引用单元格值，请使用左上角的单元格地址 |
| style    |          |         | 公式返回 `true` 时要应用的样式结构 |

### Cell Is[⬆](#目录)<!-- Link generated with jump2header -->

| 属性    | 可选 | 默认值 | 描述 |
| -------- | -------- | ------- | ----------- |
| type     |          |         | `'cellIs'` |
| priority | Y        | &lt;auto&gt;  | 确定样式的优先顺序 |
| operator |          |         | 如何将单元格值与公式结果进行比较 |
| formulae |          |         | 1个公式字符串数组，返回要与每个单元格进行比较的值 |
| style    |          |         | 如果比较返回 `true`，则应用样式结构 |

**Cell Is 运算符**

| 运算    | 描述 |
| ----------- | ----------- |
| equal       | 如果单元格值等于公式值，则应用格式 |
| greaterThan | 如果单元格值大于公式值，则应用格式 |
| lessThan    | 如果单元格值小于公式值，则应用格式 |
| between     | 如果单元格值在两个公式值之间（包括两个值），则应用格式 |


### Top 10[⬆](#目录)<!-- Link generated with jump2header -->

| 属性    | 可选 | 默认值 | 描述 |
| -------- | -------- | ------- | ----------- |
| type     |          |         | `'top10'` |
| priority | Y        | &lt;auto&gt;  | 确定样式的优先顺序 |
| rank     | Y        | 10      | 指定格式中包含多少个顶部（或底部）值 |
| percent  | Y        | `false`   | 如果为 true，则等级字段为百分比，而不是绝对值 |
| bottom   | Y        | `false`   | 如果为 true，则包含最低值而不是最高值 |
| style    |          |         | 如果比较返回 true，则应用样式结构 |

### 高于平均值[⬆](#目录)<!-- Link generated with jump2header -->

| 属性         | 可选 | 默认值 | 描述 |
| ------------- | -------- | ------- | ----------- |
| type          |          |         | `'aboveAverage'` |
| priority      | Y        | &lt;auto&gt;  | 确定样式的优先顺序 |
| aboveAverage  | Y        | `false`   | 如果为 true，则等级字段为百分比，而不是绝对值 |
| style         |          |         | 如果比较返回 true，则应用样式结构 |

### 色阶[⬆](#目录)<!-- Link generated with jump2header -->

| 属性         | 可选 | 默认值 | 描述 |
| ------------- | -------- | ------- | ----------- |
| type          |          |         | `'colorScale'` |
| priority      | Y        | &lt;auto&gt;  | 确定样式的优先顺序 |
| cfvo          |          |         | 2到5个条件格式化值对象的数组，指定值范围内的航路点 |
| color         |          |         | 在给定的航路点使用的相应颜色数组 |
| style         |          |         | 如果比较返回 true，则应用样式结构 |

### 图标集[⬆](#目录)<!-- Link generated with jump2header -->

| 属性         | 可选 | 默认值 | 描述 |
| ------------- | -------- | ------- | ----------- |
| type          |          |         | `'iconSet'` |
| priority      | Y        | &lt;auto&gt;  | 确定样式的优先顺序 |
| iconSet       | Y        | 3TrafficLights | 设置使用的图标名称 |
| showValue     |          | true    | 指定应用范围内的单元格是显示图标和单元格值，还是仅显示图标 |
| reverse       |          | false   | 指定是否以保留顺序显示 `iconSet` 中指定的图标集中的图标。 如果 `custom` 等于 `true`，则必须忽略此值 |
| custom        |          | false   | 指定是否使用自定义图标集 |
| cfvo          |          |         | 2到5个条件格式化值对象的数组，指定值范围内的航路点 |
| style         |          |         | 如果比较返回 true，则应用样式结构 |

### 数据条[⬆](#目录)<!-- Link generated with jump2header -->

| 字段      | 可选 | 默认值 | 描述 |
| ---------- | -------- | ------- | ----------- |
| type       |          |         | `'dataBar'` |
| priority   | Y        | &lt;auto&gt;  | 确定样式的优先顺序 |
| minLength  |          | 0       | 指定此条件格式范围内最短数据条的长度 |
| maxLength  |          | 100     | 指定此条件格式范围内最长数据条的长度 |
| showValue  |          | true    | 指定条件格式范围内的单元格是否同时显示数据条和数值或数据条 |
| gradient   |          | true    | 指定数据条是否具有渐变填充 |
| border     |          | true    | 指定数据条是否有边框 |
| negativeBarColorSameAsPositive  |                | true        | 指定数据条是否具有与正条颜色不同的负条颜色 |
| negativeBarBorderColorSameAsPositive  |          | true        | 指定数据条的负边框颜色是否不同于正边框颜色 |
| axisPosition  |       | 'auto'             | 指定数据条的轴位置 |
| direction  |          | 'leftToRight'      | 指定数据条的方向 |
| cfvo          |          |         | 2 到 5 个条件格式化值对象的数组，指定值范围内的航路点 |
| style         |          |         | 如果比较返回 true，则应用样式结构 |

### 包含文字[⬆](#目录)<!-- Link generated with jump2header -->

| 属性    | 可选 | 默认值 | 描述 |
| -------- | -------- | ------- | ----------- |
| type     |          |         | `'containsText'` |
| priority | Y        | &lt;auto&gt;  | 确定样式的优先顺序 |
| operator |          |         | 文本比较类型 |
| text     |          |         | 要搜索的文本 |
| style    |          |         | 如果比较返回 true，则应用样式结构 |

**包含文本运算符**

| 运算符          | 描述 |
| ----------------- | ----------- |
| containsText      | 如果单元格值包含在 `text` 字段中指定的值，则应用格式 |
| containsBlanks    | 如果单元格值包含空格，则应用格式 |
| notContainsBlanks | 如果单元格值不包含空格，则应用格式 |
| containsErrors    | 如果单元格值包含错误，则应用格式 |
| notContainsErrors | 如果单元格值不包含错误，则应用格式 |

### 时间段[⬆](#目录)<!-- Link generated with jump2header -->

| 属性      | 可选 | 默认值 | 描述 |
| ---------- | -------- | ------- | ----------- |
| type       |          |         | `'timePeriod'` |
| priority   | Y        | &lt;auto&gt;  | 确定样式的优先顺序 |
| timePeriod |          |         | 比较单元格值的时间段 |
| style      |          |         | 如果比较返回 true，则应用样式结构 |

**时间段**

| 时间段       | 描述 |
| ----------------- | ----------- |
| lastWeek          | 如果单元格值落在最后一周内，则应用格式 |
| thisWeek          | 如果单元格值在本周下降，则应用格式 |
| nextWeek          | 如果单元格值在下一周下降，则应用格式 |
| yesterday         | 如果单元格值等于昨天，则应用格式 |
| today             | 如果单元格值等于今天，则应用格式 |
| tomorrow          | 如果单元格值等于明天，则应用格式 |
| last7Days         | 如果单元格值在过去7天之内，则应用格式 |
| lastMonth         | 如果单元格值属于上个月，则应用格式 |
| thisMonth         | 如果单元格值在本月下降，则应用格式 |
| nextMonth         | 如果单元格值在下个月下降，则应用格式 |


## 大纲级别[⬆](#目录)<!-- Link generated with jump2header -->

Excel 支持大纲；行或列可以根据用户希望查看的详细程度展开或折叠。

大纲级别可以在列设置中定义：
```javascript
worksheet.columns = [
  { header: 'Id', key: 'id', width: 10 },
  { header: 'Name', key: 'name', width: 32 },
  { header: 'D.O.B.', key: 'DOB', width: 10, outlineLevel: 1 }
];
```

或直接在行或列上
```javascript
worksheet.getColumn(3).outlineLevel = 1;
worksheet.getRow(3).outlineLevel = 1;
```

工作表大纲级别可以在工作表上设置
```javascript
// 设置列大纲级别
worksheet.properties.outlineLevelCol = 1;

// 设置行大纲级别
worksheet.properties.outlineLevelRow = 1;
```

注意：调整行或列上的大纲级别或工作表上的大纲级别将产生副作用，即还修改受属性更改影响的所有行或列的折叠属性。 例如。：
```javascript
worksheet.properties.outlineLevelCol = 1;

worksheet.getColumn(3).outlineLevel = 1;
expect(worksheet.getColumn(3).collapsed).to.be.true;

worksheet.properties.outlineLevelCol = 2;
expect(worksheet.getColumn(3).collapsed).to.be.false;
```

大纲属性可以在工作表上设置

```javascript
worksheet.properties.outlineProperties = {
  summaryBelow: false,
  summaryRight: false,
};
```

## 图片[⬆](#目录)<!-- Link generated with jump2header -->

将图像添加到工作表是一个分为两个步骤的过程。首先，通过 `addImage()` 函数将图像添加到工作簿中，该函数还将返回 `imageId` 值。然后，使用 `imageId`，可以将图像作为平铺背景或覆盖单元格区域添加到工作表中。

注意：从此版本开始，不支持调整或变换图像。

### 将图片添加到工作簿[⬆](#目录)<!-- Link generated with jump2header -->

`Workbook.addImage` 函数支持按文件名或按 `Buffer` 添加图像。请注意，在两种情况下，都必须指定扩展名。有效的扩展名包括 “jpeg”，“png”，“gif”。

```javascript
// 通过文件名将图像添加到工作簿
const imageId1 = workbook.addImage({
  filename: 'path/to/image.jpg',
  extension: 'jpeg',
});

// 通过 buffer 将图像添加到工作簿
const imageId2 = workbook.addImage({
  buffer: fs.readFileSync('path/to.image.png'),
  extension: 'png',
});

// 通过 base64  将图像添加到工作簿
const myBase64Image = "data:image/png;base64,iVBORw0KG...";
const imageId2 = workbook.addImage({
  base64: myBase64Image,
  extension: 'png',
});
```

### 将图片添加到工作表背景[⬆](#目录)<!-- Link generated with jump2header -->

使用 `Workbook.addImage` 中的图像 `ID`，可以使用 `addBackgroundImage` 函数设置工作表的背景

```javascript
// 设置背景
worksheet.addBackgroundImage(imageId1);
```

### 在一定范围内添加图片[⬆](#目录)<!-- Link generated with jump2header -->

使用 `Workbook.addImage` 中的图像 `ID`，可以将图像嵌入工作表中以覆盖一定范围。从该范围计算出的坐标将覆盖从第一个单元格的左上角到第二个单元格的右下角。

```javascript
// 在 B2:D6 上插入图片
worksheet.addImage(imageId2, 'B2:D6');
```

使用结构而不是范围字符串，可以部分覆盖单元格。

请注意，为此使用的坐标系基于零，因此 A1 的左上角将为 `{col：0，row：0}`。单元格的分数可以通过使用浮点数来指定，例如 A1 的中点是 `{col：0.5，row：0.5}`。

```javascript
// 在 B2:D6 的一部分上插入图像
worksheet.addImage(imageId2, {
  tl: { col: 1.5, row: 1.5 },
  br: { col: 3.5, row: 5.5 }
});
```

单元格区域还可以具有属性 `"editAs"`，该属性将控制将图像锚定到单元格的方式。它可以具有以下值之一：

| 值     | 描述 |
| --------- | ----------- |
| `undefined` | 它指定使图像将根据单元格移动和调整其大小 |
| `oneCell`   | 这是默认值。图像将与单元格一起移动，但大小不变动 |
| `absolute`  | 图像将不会随着单元格移动或调整大小 |

```javascript
ws.addImage(imageId, {
  tl: { col: 0.1125, row: 0.4 },
  br: { col: 2.101046875, row: 3.4 },
  editAs: 'oneCell'
});
```

### 将图片添加到单元格[⬆](#目录)<!-- Link generated with jump2header -->

您可以将图像添加到单元格，然后以 96dpi 定义其宽度和高度（以像素为单位）。

```javascript
worksheet.addImage(imageId2, {
  tl: { col: 0, row: 0 },
  ext: { width: 500, height: 200 }
});
```

### 添加带有超链接的图片[⬆](#目录)<!-- Link generated with jump2header -->

您可以将带有超链接的图像添加到单元格，并在图像范围内定义超链接。

```javascript
worksheet.addImage(imageId2, {
  tl: { col: 0, row: 0 },
  ext: { width: 500, height: 200 },
  hyperlinks: {
    hyperlink: 'http://www.somewhere.com',
    tooltip: 'http://www.somewhere.com'
  }
});
```

## 工作表保护[⬆](#目录)<!-- Link generated with jump2header -->

可以通过添加密码来保护工作表免受修改。

```javascript
await worksheet.protect('the-password', options);
```

工作表保护也可以删除：

```javascript
worksheet.unprotect();
```


有关如何修改单个单元格保护的详细信息请查看 <a href="#单元格保护">单元格保护</a>。

**注意：** 当 `protect()` 函数返回一个 Promise 代表它是异步的，当前的实现在主线程上运行，并且在 CPU 上将使用平均大约 600 毫秒。可以通过设置 `spinCount` 进行调整，该值可用于使过程更快或更有弹性。

### 工作表保护选项[⬆](#目录)<!-- Link generated with jump2header -->

| 属性               | 默认值 | 描述 |
| ------------------- | ------- | ----------- |
| selectLockedCells   | `true`    | 允许用户选择锁定的单元格 |
| selectUnlockedCells | `true`    | 允许用户选择未锁定的单元格 |
| formatCells         | `false`   | 允许用户格式化单元格 |
| formatColumns       | `false`   | 允许用户格式化列 |
| formatRows          | `false`   | 允许用户格式化行 |
| insertRows          | `false`   | 允许用户插入行 |
| insertColumns       | `false`   | 允许用户插入列 |
| insertHyperlinks    | `false`   | 允许用户插入超链接 |
| deleteRows          | `false`   | 允许用户删除行 |
| deleteColumns       | `false`   | 允许用户删除列 |
| sort                | `false`   | 允许用户对数据进行排序 |
| autoFilter          | `false`   | 允许用户过滤表中的数据 |
| pivotTables         | `false`   | 允许用户使用数据透视表 |
| spinCount           | 100000  | 保护或取消保护时执行的哈希迭代次数 |


## 文件 I/O[⬆](#目录)<!-- Link generated with jump2header -->

### XLSX[⬆](#目录)<!-- Link generated with jump2header -->

#### 读 XLSX[⬆](#目录)<!-- Link generated with jump2header -->

```javascript
// 从文件读取
const workbook = new Excel.Workbook();
await workbook.xlsx.readFile(filename);
// ... 使用 workbook


// 从流读取
const workbook = new Excel.Workbook();
await workbook.xlsx.read(stream);
// ... 使用 workbook


// 从 buffer 加载
const workbook = new Excel.Workbook();
await workbook.xlsx.load(data);
// ... 使用 workbook
```

#### 写 XLSX

```javascript
// 写入文件
const workbook = createAndFillWorkbook();
await workbook.xlsx.writeFile(filename);

// 写入流
await workbook.xlsx.write(stream);

// 写入 buffer
const buffer = await workbook.xlsx.writeBuffer();
```

### CSV[⬆](#目录)<!-- Link generated with jump2header -->

#### 读 CSV[⬆](#目录)<!-- Link generated with jump2header -->

读取 CSV 文件时支持的选项。

| 属性            |  是否需要   |    类型     | 描述  |
| ---------------- | ----------- | ----------- | ----------- |
| dateFormats      |     N       |  Array      | 指定 dayjs 的日期编码格式。 |
| map              |     N       |  Function   | 自定义`Array.prototype.map()` 回调函数，用于处理数据。 |
| sheetName        |     N       |  String     | 指定工作表名称。 |
| parserOptions    |     N       |  Object     | [parseOptions 选项](https://c2fo.github.io/fast-csv/docs/parsing/options)  @fast-csv/format 模块以写入 csv 数据。 |

```javascript
// 从文件读取
const workbook = new Excel.Workbook();
const worksheet = await workbook.csv.readFile(filename);
// ... 使用 workbook 或 worksheet


// 从流中读取
const workbook = new Excel.Workbook();
const worksheet = await workbook.csv.read(stream);
// ... 使用 workbook 或 worksheet


// 从带有欧洲日期的文件中读取
const workbook = new Excel.Workbook();
const options = {
  dateFormats: ['DD/MM/YYYY']
};
const worksheet = await workbook.csv.readFile(filename, options);
// ... 使用 workbook 或 worksheet


// 从具有自定义值解析的文件中读取
const workbook = new Excel.Workbook();
const options = {
  map(value, index) {
    switch(index) {
      case 0:
        // 第1列是字符串
        return value;
      case 1:
        // 第2列是日期
        return new Date(value);
      case 2:
        // 第3列是公式值的JSON
        return JSON.parse(value);
      default:
        // 其余的是数字
        return parseFloat(value);
    }
  },
  // https://c2fo.github.io/fast-csv/docs/parsing/options
  parserOptions: {
    delimiter: '\t',
    quote: false,
  },
};
const worksheet = await workbook.csv.readFile(filename, options);
// ... 使用 workbook 或 worksheet
```

CSV 解析器使用 [fast-csv](https://www.npmjs.com/package/fast-csv) 读取CSV文件。传递给上述写入函数的选项中的 `formatterOptions` 将传递给 @fast-csv/format 模块以写入 csv 数据。 有关详细信息，请参阅 fast-csv README.md。

使用 npm 模块 [dayjs](https://www.npmjs.com/package/dayjs) 解析日期。如果未提供 `dateFormats` 数组，则使用以下 dateFormats：

* 'YYYY-MM-DD\[T\]HH:mm:ss'
* 'MM-DD-YYYY'
* 'YYYY-MM-DD'

请参阅 [dayjs CustomParseFormat 插件](https://github.com/iamkun/dayjs/blob/HEAD/docs/en/Plugin.md#customparseformat)，以获取有关如何构造 `dateFormat` 的详细信息。

#### 写 CSV[⬆](#目录)<!-- Link generated with jump2header -->

写入 CSV 文件时支持的选项。

| 属性            |  是否需要   |    类型     | 描述 |
| ---------------- | ----------- | ----------- | ----------- |
| dateFormat       |     N       |  String     | 指定 dayjs 的日期编码格式。 |
| dateUTC          |     N       |  Boolean    | 指定 ExcelJS 是否使用`dayjs.utc()`转换时区以解析日期。 |
| encoding         |     N       |  String     | 指定文件编码格式。 |
| includeEmptyRows |     N       |  Boolean    | 指定是否可以写入空行。 |
| map              |     N       |  Function   | 自定义`Array.prototype.map()` 回调函数，用于处理行值。 |
| sheetName        |     N       |  String     | 指定工作表名称。 |
| sheetId          |     N       |  Number     | 指定工作表 ID。 |
| formatterOptions |     N       |  Object     | [formatterOptions 选项](https://c2fo.github.io/fast-csv/docs/formatting/options/) @fast-csv/format 模块写入csv 数据。 |

```javascript

// 写入文件
const workbook = createAndFillWorkbook();
await workbook.csv.writeFile(filename);

// 写入流
// 请注意，您需要提供 sheetName 或 sheetId 以正确导入到 csv
await workbook.csv.write(stream, { sheetName: 'Page name' });

// 使用欧洲日期时间写入文件
const workbook = new Excel.Workbook();
const options = {
  dateFormat: 'DD/MM/YYYY HH:mm:ss',
  dateUTC: true, // 呈现日期时使用 utc
};
await workbook.csv.writeFile(filename, options);


// 使用自定义值格式写入文件
const workbook = new Excel.Workbook();
const options = {
  map(value, index) {
    switch(index) {
      case 0:
        // 第1列是字符串
        return value;
      case 1:
        // 第2列是日期
        return dayjs(value).format('YYYY-MM-DD');
      case 2:
        // 第3列是一个公式，只写结果
        return value.result;
      default:
        // 其余的是数字
        return value;
    }
  },
  // https://c2fo.github.io/fast-csv/docs/formatting/options
  formatterOptions: {
    delimiter: '\t',
    quote: false,
  },
};
await workbook.csv.writeFile(filename, options);

// 写入新 buffer
const buffer = await workbook.csv.writeBuffer();
```

CSV 解析器使用 [fast-csv](https://www.npmjs.com/package/fast-csv) 编写 CSV 文件。传递给上述写入函数的选项中的 `formatterOptions` 将传递给 @fast-csv/format 模块以写入 csv 数据。有关详细信息，请参阅 fast-csv README.md。

日期使用 npm 模块 [dayjs](https://www.npmjs.com/package/dayjs) 格式化。如果未提供 `dateFormat`，则使用 `dayjs.ISO_8601`。编写 CSV 时，您可以提供布尔值 `dateUTC` 为 `true`，以使 ExcelJS 解析日期，而无需使用 `dayjs.utc()` 自动转换时区。

### 流式 I/O[⬆](#目录)<!-- Link generated with jump2header -->

上面记录的文件 I/O 需要在内存中建立整个工作簿，然后才能写入文件。虽然方便，但是由于所需的内存量，它可能会限制文档的大小。

流写入器（或读取器）在生成工作簿或工作表数据时对其进行处理，然后将其转换为文件形式。通常，这在内存上效率要高得多，因为最终的内存占用量，甚至中间的内存占用量都比文档版本要紧凑得多，尤其是当您考虑到行和单元格对象一旦提交就被销毁时，尤其如此。

流式工作簿和工作表的接口几乎与文档版本相同，但实际存在一些细微差别：

* 将工作表添加到工作簿后，将无法将其删除。
* 提交行后，将无法再访问该行，因为该行将从工作表中删除。
* 不支持 `unMergeCells()`。

请注意，可以在不提交任何行的情况下构建整个工作簿。提交工作簿后，所有添加的工作表（包括所有未提交的行）将自动提交。但是，在这种情况下，与文档版本相比收效甚微。

#### 流式 XLSX[⬆](#目录)<!-- Link generated with jump2header -->

##### 流式 XLSX 写入器[⬆](#目录)<!-- Link generated with jump2header -->

流式 XLSX 写入器在 `ExcelJS.stream.xlsx` 命名空间中可用。

构造函数采用带有以下字段的可选 `options` 对象：

| 字段            | 描述 |
| ---------------- | ----------- |
| stream           | 指定要写入 XLSX 工作簿的可写流。 |
| filename         | 如果未指定流，则此字段指定要写入 XLSX 工作簿的文件的路径。 |
| useSharedStrings | 指定是否在工作簿中使用共享字符串。默认为 `false` |
| useStyles        | 指定是否将样式信息添加到工作簿。样式会增加一些性能开销。默认为 `false` |
| zip              | ExcelJS 内部传递给 [Archiver](https://github.com/archiverjs/node-archiver) 的 [Zip选项](https://www.archiverjs.com/global.html#ZipOptions)。默认值为 `undefined` |

如果在选项中未指定 `stream` 或 `filename`，则工作簿编写器将创建一个 StreamBuf 对象，该对象将 XLSX 工作簿的内容存储在内存中。可以通过属性 `workbook.stream` 访问此 StreamBuf 对象，该对象可用于通过 `stream.read()` 直接访问字节，或将内容通过管道传输到另一个流。

```javascript
// 使用样式和共享字符串构造流式 XLSX 工作簿编写器
const options = {
  filename: './streamed-workbook.xlsx',
  useStyles: true,
  useSharedStrings: true
};
const workbook = new Excel.stream.xlsx.WorkbookWriter(options);
```

通常，流式 XLSX 写入器的接口与上述文档工作簿（和工作表）相同，实际上行，单元格和样式对象是相同的。

但是有一些区别...

**构造**

如上所示，WorkbookWriter 通常将要求在构造函数中指定输出流或文件。

**提交数据**

当工作表行准备就绪时，应将其提交，以便可以释放行对象和内容。通常，这将在添加每一行时完成...

```javascript
worksheet.addRow({
   id: i,
   name: theName,
   etc: someOtherDetail
}).commit();
```

WorksheetWriter 在添加行时不提交行的原因是允许单元格跨行合并：
```javascript
worksheet.mergeCells('A1:B2');
worksheet.getCell('A1').value = 'I am merged';
worksheet.getCell('C1').value = 'I am not';
worksheet.getCell('C2').value = 'Neither am I';
worksheet.getRow(2).commit(); // now rows 1 and two are committed.
```

每个工作表完成后，还必须提交：

```javascript
// 完成添加数据。 提交工作表
worksheet.commit();
```

要完成 XLSX 文档，必须提交工作簿。 如果未提交工作簿中的任何工作表，则将在工作簿提交中自动提交它们。

```javascript
// 完成 workbook.
await workbook.commit();
// ... 流已被写入
```

##### 流式 XLSX 阅读器[⬆](#目录)<!-- Link generated with jump2header -->

流式 XLSX 工作簿阅读器可以在ExcelJS.stream.xlsx命名空间中找到。

构造函数包含必需的输入参数和可选的options参数:

| Argument              | Description |
| --------------------- | ----------- |
| input (必需的)        | 指定从中读取XLSX工作簿的文件或可读流的名称|
| options (可选的)      | 指定如何处理读取解析期间发生的事件类型 |
| options.entries       | 指定是否去触发事件(`'emit'`)或者不发出事件(`'ignore'`)，默认值是`'emit'` |
| options.sharedStrings | 指定是否去缓存(`'cache'`)共享字符串，将其插入到相应的单元格值中，或者是否去触发(`'emit'`)或忽略(`'ignore'`)它们，在这两种情况下，单元格值都将是对共享字符串索引的引用。默认值是`'cache'` |
| options.hyperlinks    | 指定是否去缓存超链接(`'cache'`)，将其插入到相应的单元格值中，是否去触发(`'emit'`)或忽略(`'ignore'`)它们。默认值是`'cache'` |
| options.styles        | 指定是否去缓存样式(`'cache'`)，将其插入到相应的行或单元格值中，或是否忽略(`'忽略'`)它们。默认值是`'cache'`  |
| options.worksheets    |指定是否去触发(`'emit'`)或忽略(`'ignore'`)工作表。默认值是`'emit'` |

```js
const workbook = new ExcelJS.stream.xlsx.WorkbookReader('./file.xlsx');
for await (const worksheetReader of workbookReader) {
  for await (const row of worksheetReader) {
    // ...
  }
}
```

请注意，由于性能原因，`worksheetReader`返回一个行数组，而不是单独返回每一行: https://github.com/nodejs/node/issues/31979

###### 迭代遍历所有事件[⬆](#目录)<!-- Link generated with jump2header -->

工作簿上的事件是 'worksheet'、'shared-strings' 和 'hyperlinks'。 工作表上的事件是 'row' 和 'hyperlinks'.

```js
const options = {
  sharedStrings: 'emit',
  hyperlinks: 'emit',
  worksheets: 'emit',
};
const workbook = new ExcelJS.stream.xlsx.WorkbookReader('./file.xlsx', options);
for await (const {eventType, value} of workbook.parse()) {
  switch (eventType) {
    case 'shared-strings':
      // 值是共享字符串
    case 'worksheet':
      // 值是worksheetReader
    case 'hyperlinks':
      // 值是hyperlinksReader
  }
}
```

###### 可读流[⬆](#目录)<!-- Link generated with jump2header -->

我们强烈建议使用异步迭代，但我们也公开了流接口以实现向后兼容性。

```js
const options = {
  sharedStrings: 'emit',
  hyperlinks: 'emit',
  worksheets: 'emit',
};
const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader('./file.xlsx', options);
workbookReader.read();

workbookReader.on('worksheet', worksheet => {
  worksheet.on('row', row => {
  });
});

workbookReader.on('shared-strings', sharedString => {
  // ...
});

workbookReader.on('hyperlinks', hyperlinksReader => {
  // ...
});

workbookReader.on('end', () => {
  // ...
});
workbookReader.on('error', (err) => {
  // ...
});
```

# 浏览器[⬆](#目录)<!-- Link generated with jump2header -->

该库的一部分已被隔离，并经过测试可在浏览器环境中使用。

由于工作簿读写器的流式传输性质，因此未包括这些内容。只能使用基于文档的工作簿（有关详细信息，请参见 <a href="#创建工作簿">创建工作簿</a>）。

例如，在浏览器中使用 ExcelJS 的代码可查看 github 中的<a href="https://github.com/exceljs/exceljs/tree/master/spec/browser"> spec / browser </a>文件夹。

## 预捆绑[⬆](#目录)<!-- Link generated with jump2header -->

以下文件已预先捆绑在一起，并包含在 *dist* 文件夹中。

* exceljs.js
* exceljs.min.js

# 值类型[⬆](#目录)<!-- Link generated with jump2header -->

支持以下值类型。

## Null 值[⬆](#目录)<!-- Link generated with jump2header -->

Enum: `Excel.ValueType.Null`

空值表示没有值，通常在写入文件时将不存储（合并的单元格除外）。可用于从单元格中删除该值。例如：

```javascript
worksheet.getCell('A1').value = null;
```

## 合并单元格[⬆](#目录)<!-- Link generated with jump2header -->

Enum: `Excel.ValueType.Merge`

合并单元格是其值绑定到另一个“主”单元格的单元格。分配给合并单元将导致修改单元格。

## 数字值[⬆](#目录)<!-- Link generated with jump2header -->

Enum: `Excel.ValueType.Number`

一个数字值。

例如：

```javascript
worksheet.getCell('A1').value = 5;
worksheet.getCell('A2').value = 3.14159;
```

## 字符串值[⬆](#目录)<!-- Link generated with jump2header -->

Enum: `Excel.ValueType.String`

一个简单的文本字符串。

例如：

```javascript
worksheet.getCell('A1').value = 'Hello, World!';
```

## 日期值[⬆](#目录)<!-- Link generated with jump2header -->

Enum: `Excel.ValueType.Date`

日期值，由 JavaScript Date 类型表示。

例如：

```javascript
worksheet.getCell('A1').value = new Date(2017, 2, 15);
```

## 超链接值[⬆](#目录)<!-- Link generated with jump2header -->

Enum: `Excel.ValueType.Hyperlink`

具有文本和链接值的 URL。

例如：
```javascript
// 链接到网络
worksheet.getCell('A1').value = {
  text: 'www.mylink.com',
  hyperlink: 'http://www.mylink.com',
  tooltip: 'www.mylink.com'
};

// 内部链接
worksheet.getCell('A1').value = { text: 'Sheet2', hyperlink: '#\'Sheet2\'!A1' };
```

## 公式值[⬆](#目录)<!-- Link generated with jump2header -->

Enum: `Excel.ValueType.Formula`

一个 Excel 公式，用于即时计算值。请注意，虽然单元格类型将为“公式”，但该单元格可能具有一个有效类型值，该值将从结果值中得出。

请注意，ExcelJS 无法处理公式以生成结果，必须提供该公式。

例如：

```javascript
worksheet.getCell('A3').value = { formula: 'A1+A2', result: 7 };
```

单元格还支持便捷的获取器，以访问公式和结果：

```javascript
worksheet.getCell('A3').formula === 'A1+A2';
worksheet.getCell('A3').result === 7;
```

### 共享公式[⬆](#目录)<!-- Link generated with jump2header -->

共享的公式通过减少工作表 xml 中文本的重复来增强 xlsx 文档的压缩。范围中左上角的单元格是指定的母版，它将保留该范围内的所有其他单元格都将引用的公式。然后，其他“从属”单元格可以引用此主单元格，而不必再次重新定义整个公式。请注意，主公式将以常用的 Excel 方式转换为从属单元格，以便对其他单元格的引用将根据从属单元相对于主单元的偏移量向右下移。例如：如果主单元格A2具有引用A1的公式，则如果单元格B2共享A2的公式，则它将引用B1。

可以将主公式与该范围内的从属单元格一起分配给该单元格

```javascript
worksheet.getCell('A2').value = {
  formula: 'A1',
  result: 10,
  shareType: 'shared',
  ref: 'A2:B3'
};
```

可以使用新的值形式将共享公式分配给单元格：

```javascript
worksheet.getCell('B2').value = { sharedFormula: 'A2', result: 10 };
```

这指定单元格B2是将从A2中的公式派生的公式，其结果为10。

公式便捷获取器会将A2中的公式转换为B2中应具有的公式：

```javascript
expect(worksheet.getCell('B2').formula).to.equal('B1');
```

可以使用 `fillFormula` 方法将共享的公式分配到工作表中：

```javascript
// 将 A1 设置为起始编号
worksheet.getCell('A1').value = 1;

// 从 A1 开始以递增计数将 A2 填充到 A10
worksheet.fillFormula('A2:A10', 'A1+1', [2,3,4,5,6,7,8,9,10]);
```

`fillFormula` 也可以使用回调函数来计算每个单元格的值

```javascript
// 从A1开始以递增计数将 A2 填充到 A100
worksheet.fillFormula('A2:A100', 'A1+1', (row, col) => row);
```

### 公式类型[⬆](#目录)<!-- Link generated with jump2header -->

要区分真正的和转换后的公式单元格，请使用 FormulaType getter：

```javascript
worksheet.getCell('A3').formulaType === Enums.FormulaType.Master;
worksheet.getCell('B3').formulaType === Enums.FormulaType.Shared;
```

公式类型具有以下值：

| 名称                       |  值  |
| -------------------------- | ------- |
| Enums.FormulaType.None     |   0     |
| Enums.FormulaType.Master   |   1     |
| Enums.FormulaType.Shared   |   2     |

### 数组公式[⬆](#目录)<!-- Link generated with jump2header -->

在 Excel 中表示共享公式的一种新方法是数组公式。以这种形式，主单元格是唯一包含与公式有关的任何信息的单元格。它包含 shareType 'array' 以及适用于其的单元格范围以及将要复制的公式。其余单元格是具有常规值的常规单元格。

注意：数组公式不会以共享公式的方式转换。因此，如果主单元A2引用A1，则从单元B2也将引用A1。

例如：
```javascript
// 将数组公式分配给 A2:B3
worksheet.getCell('A2').value = {
  formula: 'A1',
  result: 10,
  shareType: 'array',
  ref: 'A2:B3'
};

// 可能没有必要填写工作表中的其余值
```

`fillFormula` 方法也可以用于填充数组公式

```javascript
// 用数组公式 "A1" 填充 A2:B3
worksheet.fillFormula('A2:B3', 'A1', [1,1,1,1], 'array');
```


## 富文本值[⬆](#目录)<!-- Link generated with jump2header -->

Enum: `Excel.ValueType.RichText`

样式丰富的文本。

例如：
```javascript
worksheet.getCell('A1').value = {
  richText: [
    { text: 'This is '},
    {font: {italic: true}, text: 'italic'},
  ]
};
```

## 布尔值[⬆](#目录)<!-- Link generated with jump2header -->

Enum: `Excel.ValueType.Boolean`

例如：

```javascript
worksheet.getCell('A1').value = true;
worksheet.getCell('A2').value = false;
```

## 错误值[⬆](#目录)<!-- Link generated with jump2header -->

Enum: `Excel.ValueType.Error`

例如：

```javascript
worksheet.getCell('A1').value = { error: '#N/A' };
worksheet.getCell('A2').value = { error: '#VALUE!' };
```

当前有效的错误文本值为：

| 名称                           | 值       |
| ------------------------------ | ----------- |
| Excel.ErrorValue.NotApplicable | #N/A        |
| Excel.ErrorValue.Ref           | #REF!       |
| Excel.ErrorValue.Name          | #NAME?      |
| Excel.ErrorValue.DivZero       | #DIV/0!     |
| Excel.ErrorValue.Null          | #NULL!      |
| Excel.ErrorValue.Value         | #VALUE!     |
| Excel.ErrorValue.Num           | #NUM!       |

# 接口变化[⬆](#目录)<!-- Link generated with jump2header -->

我们会尽一切努力创建一个良好的，一致的接口，该接口不会在版本之间不兼容，但令人遗憾的是，为了实现更大的利益，有时需要进行一些更改。

## 0.1.0[⬆](#目录)<!-- Link generated with jump2header -->

### Worksheet.eachRow[⬆](#目录)<!-- Link generated with jump2header -->

在 `Worksheet.eachRow` 的回调函数中的参数已被交换和更改；它是 `function(rowNumber，rowValues)`，现在是 `function(row，rowNumber)`，使它的外观更像 *underscore(`_.each`)方法，并且行对象优先于行号。*

### Worksheet.getRow[⬆](#目录)<!-- Link generated with jump2header -->

此函数已从返回稀疏的单元格数组更改为返回 `Row` 对象。这样可以访问行属性，并有助于管理行样式等。

仍可通过 `Worksheet.getRow(rowNumber).values;` 获得稀疏的单元格值的数组。

## 0.1.1[⬆](#目录)<!-- Link generated with jump2header -->

### cell.model[⬆](#目录)<!-- Link generated with jump2header -->

`cell.styles` 重命名为 `cell.style`

## 0.2.44[⬆](#目录)<!-- Link generated with jump2header -->

从 Bluebird 切换到 Node 原生 Promise 的函数返回的 Promise 如果依赖 Bluebird 的额外功能，则可能会破坏调用代码。

为了减少这种情况的出现，在0.3.0中添加了以下两个更改：

* 默认情况下使用功能更全且仍与浏览器兼容的 promise lib。 该库支持 Bluebird 的许多功能，但占用空间少得多。
* 注入其他 Promise 实现的选项。有关更多详细信息，请参见<a href="#配置">配置</a>部分。



# 配置[⬆](#目录)<!-- Link generated with jump2header -->

ExcelJS现在支持对 Promise 库的依赖项注入。您可以通过在模块中包含以下代码来还原 Bluebird Promise。

```javascript
ExcelJS.config.setValue('promise', require('bluebird'));
```

请注意：我已经使用 bluebird 专门测试了 ExcelJS（直到最近，这是它使用的库）。根据我所做的测试，它不适用于 Q。

# 注意事项[⬆](#目录)<!-- Link generated with jump2header -->

## Dist 文件夹[⬆](#目录)<!-- Link generated with jump2header -->

在发布此模块之前，先对源代码进行编译和其他处理，然后再将它们放置在 *dist/* 文件夹中。该自述文件标识两个文件-浏览器捆绑和压缩版本。除了在 package.json 中指定为  `"main"` 的文件外，不能保证 *dist/* 文件夹的其他内容。


# 已知的问题[⬆](#目录)<!-- Link generated with jump2header -->

## 使用 Puppeteer 进行测试[⬆](#目录)<!-- Link generated with jump2header -->

该 lib 中包含的测试套件包括一个在无头浏览器中执行的小脚本，以验证捆绑的软件包。 在撰写本文时，其表现出该测试在 Windows Linux 子系统中不能很好地进行。

因此，可以通过存在名为 *.disable-test-browser* 的文件来禁用浏览器测试。

```bash
sudo apt-get install libfontconfig
```

## 拼接与合并[⬆](#目录)<!-- Link generated with jump2header -->

如果任何 `splice` 操作影响合并的单元格，则合并组将无法正确移动

# 发布历史[⬆](#目录)<!-- Link generated with jump2header -->

| Version | Changes |
|---------| ------- |
| 0.0.9   | <ul><li><a href="#number-formats">Number Formats</a></li></ul> |
| 0.1.0   | <ul><li>Bug Fixes<ul><li>"&lt;" and "&gt;" text characters properly rendered in xlsx</li></ul></li><li><a href="#columns">Better Column control</a></li><li><a href="#rows">Better Row control</a></li></ul> |
| 0.1.1   | <ul><li>Bug Fixes<ul><li>More textual data written properly to xml (including text, hyperlinks, formula results and format codes)</li><li>Better date format code recognition</li></ul></li><li><a href="#fonts">Cell Font Style</a></li></ul> |
| 0.1.2   | <ul><li>Fixed potential race condition on zip write</li></ul> |
| 0.1.3   | <ul><li><a href="#alignment">Cell Alignment Style</a></li><li><a href="#rows">Row Height</a></li><li>Some Internal Restructuring</li></ul> |
| 0.1.5   | <ul><li>Bug Fixes<ul><li>Now handles 10 or more worksheets in one workbook</li><li>theme1.xml file properly added and referenced</li></ul></li><li><a href="#borders">Cell Borders</a></li></ul> |
| 0.1.6   | <ul><li>Bug Fixes<ul><li>More compatible theme1.xml included in XLSX file</li></ul></li><li><a href="#fills">Cell Fills</a></li></ul> |
| 0.1.8   | <ul><li>Bug Fixes<ul><li>More compatible theme1.xml included in XLSX file</li><li>Fixed filename case issue</li></ul></li><li><a href="#fills">Cell Fills</a></li></ul> |
| 0.1.9   | <ul><li>Bug Fixes<ul><li>Added docProps files to satisfy Mac Excel users</li><li>Fixed filename case issue</li><li>Fixed worksheet id issue</li></ul></li><li><a href="#set-workbook-properties">Core Workbook Properties</a></li></ul> |
| 0.1.10  | <ul><li>Bug Fixes<ul><li>Handles File Not Found error</li></ul></li><li><a href="#csv">CSV Files</a></li></ul> |
| 0.1.11  | <ul><li>Bug Fixes<ul><li>Fixed Vertical Middle Alignment Issue</li></ul></li><li><a href="#styles">Row and Column Styles</a></li><li><a href="#rows">Worksheet.eachRow supports options</a></li><li><a href="#rows">Row.eachCell supports options</a></li><li><a href="#columns">New function Column.eachCell</a></li></ul> |
| 0.2.0   | <ul><li><a href="#streaming-xlxs-writer">Streaming XLSX Writer</a><ul><li>At long last ExcelJS can support writing massive XLSX files in a scalable memory efficient manner. Performance has been optimised and even smaller spreadsheets can be faster to write than the document writer. Options have been added to control the use of shared strings and styles as these can both have a considerable effect on performance</li></ul></li><li><a href="#rows">Worksheet.lastRow</a><ul><li>Access the last editable row in a worksheet.</li></ul></li><li><a href="#rows">Row.commit()</a><ul><li>For streaming writers, this method commits the row (and any previous rows) to the stream. Committed rows will no longer be editable (and are typically deleted from the worksheet object). For Document type workbooks, this method has no effect.</li></ul></li></ul> |
| 0.2.2   | <ul><li><a href="https://pbs.twimg.com/profile_images/2933552754/fc8c70829ee964c5542ae16453503d37.jpeg">One Billion Cells</a><ul><li>Achievement Unlocked: A simple test using ExcelJS has created a spreadsheet with 1,000,000,000 cells. Made using random data with 100,000,000 rows of 10 cells per row. I cannot validate the file yet as Excel will not open it and I have yet to implement the streaming reader but I have every confidence that it is good since 1,000,000 rows loads ok.</li></ul></li></ul> |
| 0.2.3   | <ul><li>Bug Fixes<ul><li><a href="https://github.com/exceljs/exceljs/issues/18">Merge Cell Styles</a><ul><li>Merged cells now persist (and parse) their styles.</li></ul></li></ul></li><li><a href="#streaming-xlxs-writer">Streaming XLSX Writer</a><ul><li>At long last ExcelJS can support writing massive XLSX files in a scalable memory efficient manner. Performance has been optimised and even smaller spreadsheets can be faster to write than the document writer. Options have been added to control the use of shared strings and styles as these can both have a considerable effect on performance</li></ul></li><li><a href="#rows">Worksheet.lastRow</a><ul><li>Access the last editable row in a worksheet.</li></ul></li><li><a href="#rows">Row.commit()</a><ul><li>For streaming writers, this method commits the row (and any previous rows) to the stream. Committed rows will no longer be editable (and are typically deleted from the worksheet object). For Document type workbooks, this method has no effect.</li></ul></li></ul> |
| 0.2.4   | <ul><li>Bug Fixes<ul><li><a href="https://github.com/exceljs/exceljs/issues/27">Worksheets with Ampersand Names</a><ul><li>Worksheet names are now xml-encoded and should work with all xml compatible characters</li></ul></li></ul></li><li><a href="#rows">Row.hidden</a> & <a href="#columns">Column.hidden</a><ul><li>Rows and Columns now support the hidden attribute.</li></ul></li><li><a href="#worksheet">Worksheet.addRows</a><ul><li>New function to add an array of rows (either array or object form) to the end of a worksheet.</li></ul></li></ul> |
| 0.2.6   | <ul><li>Bug Fixes<ul><li><a href="https://github.com/exceljs/exceljs/issues/87">invalid signature: 0x80014</a>: Thanks to <a href="https://github.com/hasanlussa">hasanlussa</a> for the PR</li></ul></li><li><a href="#defined-names">Defined Names</a><ul><li>Cells can now have assigned names which may then be used in formulas.</li></ul></li><li>Converted Bluebird.defer() to new Bluebird(function(resolve, reject){}). Thanks to user <a href="https://github.com/Nishchit14">Nishchit</a> for the Pull Request</li></ul> |
| 0.2.7   | <ul><li><a href="#data-validations">Data Validations</a><ul><li>Cells can now define validations that controls the valid values the cell can have</li></ul></li></ul> |
| 0.2.8   | <ul><li><a href="rich-text">Rich Text Value</a><ul><li>Cells now support <b><i>in-cell</i></b> formatting - Thanks to <a href="https://github.com/pvadam">Peter ADAM</a></li></ul></li><li>Fixed typo in README - Thanks to <a href="https://github.com/MRdNk">MRdNk</a></li><li>Fixing emit in worksheet-reader - Thanks to <a href="https://github.com/alangunning">Alan Gunning</a></li><li>Clearer Docs - Thanks to <a href="https://github.com/miensol">miensol</a></li></ul> |
| 0.2.9   | <ul><li>Fixed "read property 'richText' of undefined error. Thanks to  <a href="https://github.com/james075">james075</a></li></ul> |
| 0.2.10  | <ul><li>Refactoring Complete. All unit and integration tests pass.</li></ul> |
| 0.2.11  | <ul><li><a href="#outline-level">Outline Levels</a>. Thanks to <a href="https://github.com/cricri">cricri</a> for the contribution.</li><li><a href="#worksheet-properties">Worksheet Properties</a></li><li>Further refactoring of worksheet writer.</li></ul> |
| 0.2.12  | <ul><li><a href="#worksheet-views">Sheet Views</a>. Thanks to <a href="https://github.com/cricri">cricri</a> again for the contribution.</li></ul> |
| 0.2.13  | <ul><li>Fix for <a href="https://github.com/exceljs/exceljs/issues">exceljs might be vulnerable for regular expression denial of service</a>. Kudos to <a href="https://github.com/yonjah">yonjah</a> and <a href="https://www.youtube.com/watch?v=wCfE-9bhY2Y">Josh Emerson</a> for the resolution.</li><li>Fix for <a href="https://github.com/exceljs/exceljs/issues/162">Multiple Sheets opens in 'Group' mode in Excel</a>. My bad - overzealous sheet view code.</li><li>Also fix for empty sheet generating invalid xlsx.</li></ul> |
| 0.2.14  | <ul><li>Fix for <a href="https://github.com/exceljs/exceljs/issues">exceljs might be vulnerable for regular expression denial of service</a>. Kudos to <a href="https://github.com/yonjah">yonjah</a> and <a href="https://www.youtube.com/watch?v=wCfE-9bhY2Y">Josh Emerson</a> for the resolution.</li><li>Fixed <a href="https://github.com/exceljs/exceljs/issues/162">Multiple Sheets opens in 'Group' mode in Excel</a> again. Added <a href="#workbook-views">Workbook views</a>.</li><li>Also fix for empty sheet generating invalid xlsx.</li></ul> |
| 0.2.15  | <ul><li>Added <a href="#page-setup">Page Setup Properties</a>. Thanks to <a href="https://github.com/jackkum">Jackkum</a> for the PR</li></ul> |
| 0.2.16  | <ul><li>New <a href="#page-setup">Page Setup</a> Property: Print Area</li></ul> |
| 0.2.17  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/114">Fix a bug on phonetic characters</a>. This fixes an issue related to reading workbooks with phonetic text in. Note phonetic text is not properly supported yet - just properly ignored. Thanks to <a href="https://github.com/zephyrrider">zephyrrider</a> and <a href="https://github.com/gen6033">gen6033</a> for the contribution.</li></ul> |
| 0.2.18  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/175">Fix regression #150: Stream API fails to write XLSX files</a>. Apologies for the regression! Thanks to <a href="https://github.com/danieleds">danieleds</a> for the fix.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/114">Fix a bug on phonetic characters</a>. This fixes an issue related to reading workbooks with phonetic text in. Note phonetic text is not properly supported yet - just properly ignored. Thanks to <a href="https://github.com/zephyrrider">zephyrrider</a> and <a href="https://github.com/gen6033">gen6033</a> for the contribution.</li></ul> |
| 0.2.19  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/119">Update xlsx.js #119</a>. This should make parsing more resilient to open-office documents. Thanks to <a href="https://github.com/nvitaterna">nvitaterna</a> for the contribution.</li></ul> |
| 0.2.20  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/179">Changes from exceljs/exceljs#127 applied to latest version #179</a>. Fixes parsing of defined name values. Thanks to <a href="https://github.com/agdevbridge">agdevbridge</a> and <a href="https://github.com/priitliivak">priitliivak</a> for the contribution.</li></ul> |
| 0.2.21  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/135">color tabs for worksheet-writer #135</a>. Modified the behaviour to print deprecation warning as tabColor has moved into options.properties. Thanks to <a href="https://github.com/ethanlook">ethanlook</a> for the contribution.</li></ul> |
| 0.2.22  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/136">Throw legible error when failing Value.getType() #136</a>. Thanks to <a href="https://github.com/wulfsolter">wulfsolter</a> for the contribution.</li><li>Honourable mention to contributors whose PRs were fixed before I saw them:<ul><li><a href="https://github.com/haoliangyu">haoliangyu</a></li><li><a href="https://github.com/wulfsolter">wulfsolter</a></li></ul></li></ul> |
| 0.2.23  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/137">Fall back to JSON.stringify() if unknown Cell.Type #137</a> with some modification. If a cell value is assigned to an unrecognisable javascript object, the stored value in xlsx and csv files will  be JSON stringified. Note that if the file is read again, no attempt will be made to parse the stringified JSON text. Thanks to <a href="https://github.com/wulfsolter">wulfsolter</a> for the contribution.</li></ul> |
| 0.2.24  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/166">Protect cell fix #166</a>. This does not mean full support for protected cells merely that the parser is not confused by the extra xml. Thanks to <a href="https://github.com/jayflo">jayflo</a> for the contribution.</li></ul> |
| 0.2.25  | <ul><li>Added functions to delete cells, rows and columns from a worksheet. Modelled after the Array splice method, the functions allow cells, rows and columns to be deleted (and optionally inserted). See <a href="#columns">Columns</a> and <a href="#rows">Rows</a> for details.<br />Note: <a href="#splice-vs-merge">Not compatible with cell merges</a></li></ul> |
| 0.2.26  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/184">Update border-xform.js #184</a>Border edges without style will be parsed and rendered as no-border. Thanks to <a href="https://github.com/skumarnk2">skumarnk2</a> for the contribution.</li></ul> |
| 0.2.27  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/187">Pass views to worksheet-writer #187</a>. Now also passes views to worksheet-writer. Thanks to <a href="https://github.com/Temetz">Temetz</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/189">Do not escape xml characters when using shared strings #189</a>. Fixing bug in shared strings. Thanks to <a href="https://github.com/tkirda">tkirda</a> for the contribution.</li></ul> |
| 0.2.28  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/190">Fix tiny bug [Update hyperlink-map.js] #190</a>Thanks to <a href="https://github.com/lszlkss">lszlkss</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/196">fix typo on sheet view showGridLines option #196</a> "showGridlines" should have been "showGridLines". Thanks to <a href="https://github.com/gadiaz1">gadiaz1</a> for the contribution.</li></ul> |
| 0.2.29  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/199">Fire finish event instead of end event on write stream #199</a> and <a href="https://github.com/exceljs/exceljs/pull/200">Listen for finish event on zip stream instead of middle stream #200</a>. Fixes issues with stream completion events. Thanks to <a href="https://github.com/junajan">junajan</a> for the contribution.</li></ul> |
| 0.2.30  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/201">Fix issue #178 #201</a>. Adds the following properties to workbook:<ul><li>title</li><li>subject</li><li>keywords</li><li>category</li><li>description</li><li>company</li><li>manager</li></ul>Thanks to <a href="https://github.com/stavenko">stavenko</a> for the contribution.</li></ul> |
| 0.2.31  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/203">Fix issue #163: the "spans" attribute of the row element is optional #203</a>. Now xlsx parsing will handle documents without row spans. Thanks to <a href="https://github.com/arturas-vitkauskas">arturas-vitkauskas</a> for the contribution.</li></ul> |
| 0.2.32  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/208">Fix issue 206 #208</a>. Fixes issue reading xlsx files that have been printed. Also adds "lastPrinted" property to Workbook. Thanks to <a href="https://github.com/arturas-vitkauskas">arturas-vitkauskas</a> for the contribution.</li></ul> |
| 0.2.33  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/210">Allow styling of cells with no value. #210</a>. Includes Null type cells with style in the rendering parsing. Thanks to <a href="https://github.com/oferns">oferns</a> for the contribution.</li></ul> |
| 0.2.34  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/212">Fix "Unexpected xml node in parseOpen" bug in LibreOffice documents for attributes dc:language and cp:revision #212</a>. Thanks to <a href="https://github.com/jessica-jordan">jessica-jordan</a> for the contribution.</li></ul> |
| 0.2.35  | <ul><li>Fixed <a href="https://github.com/exceljs/exceljs/issues/74">Getting a column/row count #74</a>. <a href="#worksheet-metrics">Worksheet</a> now has rowCount and columnCount properties (and actual variants), <a href="row">Row</a> has cellCount.</li></ul> |
| 0.2.36  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/217">Stream reader fixes #217</a>. Thanks to <a href="https://github.com/kturney">kturney</a> for the contribution.</li></ul> |
| 0.2.37  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/225">Fix output order of Sheet Properties #225</a>. Thanks to <a href="https://github.com/keeneym">keeneym</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/231">remove empty worksheet[0] from _worksheets #231</a>. Thanks to <a href="https://github.com/pookong">pookong</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/232">do not skip empty string in shared strings so that indexes match #232</a>. Thanks again to <a href="https://github.com/pookong">pookong</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/233">use shared strings for streamed writes #233</a>. Thanks again to <a href="https://github.com/pookong">pookong</a> for the contribution.</li></ul> |
| 0.2.38  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/236">Add a comment for issue #216 #236</a>. Thanks to <a href="https://github.com/jsalwen">jsalwen</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/237">Start on support for 1904 based dates #237</a>. Fixed date handling in documents with the 1904 flag set. Thanks to <a href="https://github.com/holm">holm</a> for the contribution.</li></ul> |
| 0.2.39  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/245">Stops Bluebird warning about unreturned promise #245</a>. Thanks to <a href="https://github.com/robinbullocks4rb">robinbullocks4rb</a> for the contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/247">Added missing dependency: col-cache.js #247</a>. Thanks to <a href="https://github.com/Manish2005">Manish2005</a> for the contribution. </li> </ul> |
| 0.2.42  | <ul><li>Browser Compatible!<ul><li>Well mostly. I have added a browser sub-folder that contains a browserified bundle and an index.js that can be used to generate another. See <a href="#browser">Browser</a> section for details.</li></ul></li><li>Fixed corrupted theme.xml. Apologies for letting that through.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/253">[BUGFIX] data validation formulae undefined #253</a>. Thanks to <a href="https://github.com/jayflo">jayflo</a> for the contribution.</li></ul> |
| 0.2.43  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/255">added a (maybe partial) solution to issue 99. i wasn't able to create an appropriate test #255</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/99">Too few data or empty worksheet generate malformed excel file #99</a>. Thanks to <a href="https://github.com/mminuti">mminuti</a> for the contribution.</li></ul> |
| 0.2.44  | <ul><li>Reduced Dependencies.<ul><li>Goodbye lodash, goodbye bluebird. Minified bundle is now just over half what it was in the first version.</li></ul></li></ul> |
| 0.2.45  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/256">Sheets with hyperlinks and data validations are corrupted #256</a>. Thanks to <a href="https://github.com/simon-stoic">simon-stoic</a> for the contribution.</li></ul> |
| 0.2.46  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/259">Exclude character controls from XML output. Fixes #234 #262</a>. Thanks to <a href="https://github.com/holm">holm</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/262">Add support for identifier #259</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/234">Broken XLSX because of "vertical tab" ascii character in a cell #234</a>. Thanks to <a href="https://github.com/NOtherDev">NOtherDev</a> for the contribution.</li></ul> |
| 0.3.0   | <ul><li>Addressed <a href="https://github.com/exceljs/exceljs/issues/266">Breaking change removing bluebird #266</a>. Appologies for any inconvenience.</li><li>Added Promise library dependency injection. See <a href="#config">Config</a> section for more details.</li></ul> |
| 0.3.1   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/279">Update dependencies #279</a>. Thanks to <a href="https://github.com/holm">holm</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/267">Minor fixes for stream handling #267</a>. Thanks to <a href="https://github.com/holm">holm</a> for the contribution.</li><li>Added automated tests in phantomjs for the browserified code.</li></ul> |
| 0.4.0   | <ul><li>Fixed issue <a href="https://github.com/exceljs/exceljs/issues/278">Boolean cell with value ="true" is returned as 1 #278</a>. The fix involved adding two new Call Value types:<ul><li><a href="#boolean-value">Boolean Value</a></li><li><a href="#error-value">Error Value</a></li></ul>Note: Minor version has been bumped up to 4 as this release introduces a couple of interface changes:<ul><li>Boolean cells previously will have returned 1 or 0 will now return true or false</li><li>Error cells that previously returned a string value will now return an error structure</li></ul></li><li>Fixed issue <a href="https://github.com/exceljs/exceljs/issues/280">Code correctness - setters don't return a value #280</a>.</li><li>Addressed issue <a href="https://github.com/exceljs/exceljs/issues/288">v0.3.1 breaks meteor build #288</a>.</li></ul> |
| 0.4.1   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/285">Add support for cp:contentStatus #285</a>. Thanks to <a href="https://github.com/holm">holm</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/286">Fix Valid characters in XML (allow \n and \r when saving) #286</a>. Thanks to <a href="https://github.com/Rycochet">Rycochet</a> for the contribution.</li><li>Fixed <a href="https://github.com/exceljs/exceljs/issues/275">hyperlink with query arguments corrupts workbook #275</a>. The hyperlink target is not escaped before serialising in the xml.</li></ul> |
| 0.4.2   | <ul><li><p>Addressed the following issues:<ul><li><a href="https://github.com/exceljs/exceljs/issues/290">White text and borders being changed to black #290</a></li><li><a href="https://github.com/exceljs/exceljs/issues/261">Losing formatting/pivot table from loaded file #261</a></li><li><a href="https://github.com/exceljs/exceljs/issues/272">Solid fill become black #272</a></li></ul>These issues are potentially caused by a bug that caused colours with zero themes, tints or indexes to be rendered and parsed incorrectly.</p><p>Regarding themes: the theme files stored inside the xlsx container hold important information regarding colours, styles etc and if the theme information from a loaded xlsx file is lost, the results can be unpredictable and undesirable. To address this, when an ExcelJS Workbook parses an XLSX file, it will preserve any theme files it finds and include them when writing to a new XLSX. If this behaviour is not desired, the Workbook class exposes a clearThemes() function which will drop the theme content. Note that this behaviour is only implemented in the document based Workbook class, not the streamed Reader and Writer.</p></li></ul> |
| 0.4.3   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/294">Support error references in cell ranges #294</a>. Thanks to <a href="https://github.com/holm">holm</a> for the contribution.</li></ul> |
| 0.4.4   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/297">Issue with copied cells #297</a>. This merge adds support for shared formulas. Thanks to <a href="https://github.com/muscapades">muscapades</a> for the contribution.</li></ul> |
| 0.4.6   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/304">Correct spelling #304</a>. Thanks to <a href="https://github.com/toanalien">toanalien</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/304">Added support for auto filters #306</a>. This adds <a href="#auto-filters">Auto Filters</a> to the Worksheet. Thanks to <a href="https://github.com/C4rmond4i">C4rmond4i</a> for the contribution.</li><li>Restored NodeJS 4.0.0 compatability by removing the destructuring code. My apologies for any inconvenience.</li></ul> |
| 0.4.9   | <ul><li>Switching to transpiled code for distribution. This will ensure compatability with 4.0.0 and above from here on. And it will also allow use of much more expressive JS code in the lib folder!</li><li><a href="#images">Basic Image Support!</a>Images can now be added to worksheets either as a tiled background or stretched over a range. Note: other features like rotation, etc. are not supported yet and will reqeuire further work.</li></ul> |
| 0.4.10  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/319">Add missing Office Rels #319</a>. Thanks goes to <a href="https://github.com/mauriciovillalobos">mauriciovillalobos</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/320">Add printTitlesRow Support #320</a> Thanks goes to <a href="https://github.com/psellers89">psellers89</a> for the contribution.</li></ul> |
| 0.4.11  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/327">Avoid error on anchor with no media #327</a>. Thanks goes to <a href="https://github.com/holm">holm</a> for the contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/332">Assortment of fixes for streaming read #332</a>. Thanks goes to <a href="https://github.com/holm">holm</a> for the contribution.</li></ul> |
| 0.4.12  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/334">Don’t set address if hyperlink r:id is undefined #334</a>. Thanks goes to <a href="https://github.com/holm">holm</a> for the contribution.</li></ul> |
| 0.4.13  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/343">Issue 296 #343</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/296">Issue with writing newlines #296</a>. Thanks goes to <a href="https://github.com/holly-weisser">holly-weisser</a> for the contribution.</li></ul> |
| 0.4.14  | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/350">Syntax highlighting added ✨ #350</a>. Thanks goes to <a href="https://github.com/rmariuzzo">rmariuzzo</a> for the contribution.</li></ul> |
| 0.5.0   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/356">Fix right to left issues #356</a>. Fixes <a href="https://github.com/exceljs/exceljs/issues/72">Add option to RTL file #72</a> and <a href="https://github.com/exceljs/exceljs/issues/126">Adding an option to set RTL worksheet #126</a>. Big thank you to <a href="https://github.com/alitaheri">alitaheri</a> for this contribution.</li></ul> |
| 0.5.1   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/364">Fix #345 TypeError: Cannot read property 'date1904' of undefined #364</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/345">TypeError: Cannot read property 'date1904' of undefined #345</a>. Thanks to <a href="https://github.com/Diluka">Diluka</a> for this contribution.</li></ul>
| 0.6.0   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/389">Add rowBreaks feature. #389</a>. Thanks to <a href="https://github.com/brucejo75">brucejo75</a> for this contribution.</li></ul> |
| 0.6.1   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/403">Guard null model fields - fix and tests #403</a>. Thanks to <a href="https://github.com/shdd-cjharries">thecjharries</a> for this contribution. Also thanks to <a href="https://github.com/Rycochet">Ryc O'Chet</a> for help with reviewing.</li></ul> |
| 0.6.2   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/396">Add some comments in readme according csv importing #396</a>. Thanks to <a href="https://github.com/Imperat">Michael Lelyakin</a> for this contribution. Also thanks to <a href="https://github.com/planemar">planemar</a> for help with reviewing. This also closes <a href="https://github.com/exceljs/exceljs/issues/395">csv to stream doesn't work #395</a>.</li></ul> |
| 0.7.0   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/407">Impl &lt;xdr:twoCellAnchor editAs=oneCell&gt; #407</a>. Thanks to <a href="https://github.com/Ockejanssen">Ocke Janssen</a> and <a href="https://github.com/kay-ramme">Kay Ramme</a> for this contribution. This change allows control on how images are anchored to cells.</li></ul> |
| 0.7.1   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/423">Don't break when attempting to import a zip file that's not an Excel file (eg. .numbers) #423</a>. Thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. This change makes exceljs more reslilient when opening non-excel files.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/434">Fixes #419 : Updates readme. #434</a>. Thanks to <a href="https://github.com/getsomecoke">Vishnu Kyatannawar</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/436">Don't break when docProps/core.xml contains a &lt;cp:version&gt; tag #436</a>. Thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. This change handles core.xml files with empty version tags.</li></ul>
| 0.8.0   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/442">Add Base64 Image support for the .addImage() method #442</a>. Thanks to <a href="https://github.com/jwmann">James W Mann</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/453">update moment to 2.19.3 #453</a>. Thanks to <a href="https://github.com/cooltoast">Markan Patel</a> for this contribution.</li></ul> |
| 0.8.1   | <ul><li> Merged <a href="https://github.com/exceljs/exceljs/pull/457">Additional information about font family property #457</a>. Thanks to <a href="https://github.com/kayakyakr">kayakyakr</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/459">Fixes #458 #459</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/458">Add style to column causes it to be hidden #458</a>. Thanks to <a href="https://github.com/AJamesPhillips">Alexander James Phillips</a> for this contribution. </li> </ul> |
| 0.8.2   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/466">Don't break when loading an Excel file containing a chartsheet #466</a>. Thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/471">Hotfix/sheet order#257 #471</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/257">Sheet Order #257</a>. Thanks to <a href="https://github.com/robbi">Robbi</a> for this contribution. </li> </ul> |
| 0.8.3   | <ul> <li> Assimilated <a href="https://github.com/exceljs/exceljs/pull/463">fix #79 outdated dependencies in unzip2</a>. Thanks to <a href="https://github.com/jsamr">Jules Sam. Randolph</a> for starting this fix and a really big thanks to <a href="https://github.com/kachkaev">Alexander Kachkaev</a> for finding the final solution. </li> </ul> |
| 0.8.4   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/479">Round Excel date to nearest millisecond when converting to javascript date #479</a>. Thanks to <a href="https://github.com/bjet007">Benoit Jean</a> for this contribution. </li> </ul> |
| 0.8.5   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/485">Bug fix: wb.worksheets/wb.eachSheet caused getWorksheet(0) to return sheet #485</a>. Thanks to <a href="https://github.com/mah110020">mah110020</a> for this contribution. </li> </ul> |
| 0.9.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/489">Feature/issue 424 #489</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/424">No way to control summaryBelow or summaryRight #424</a>. Many thanks to <a href="https://github.com/sarahdmsi">Sarah</a> for this contribution. </li> </ul>  |
| 0.9.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/490">add type definition #490</a>. This adds type definitions to ExcelJS! Many thanks to <a href="https://github.com/taoqf">taoqf</a> for this contribution. </li> </ul> |
| 1.0.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/494">Add Node 8 and Node 9 to continuous integration testing #494</a>. Many thanks to <a href="https://github.com/cooltoast">Markan Patel</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/508">Small README fix #508</a>. Many thanks to <a href="https://github.com/lbguilherme">Guilherme Bernal</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/501">Add support for inlineStr, including rich text #501</a>. Many thanks to <a href="https://github.com/linguamatics-pdenes">linguamatics-pdenes</a> and <a href="https://github.com/robscotts4rb">Rob Scott</a> for their efforts towards this contribution. Since this change is technically a breaking change (the rendered XML for inline strings will change) I'm making this a major release! </li> </ul> |
| 1.0.1   | <ul> <li> Fixed <a href="https://github.com/exceljs/exceljs/issues/520">spliceColumns problem when the number of columns are important #520</a>. </li> </ul> |
| 1.0.2   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/524">Loosen exceljs's dependency requirements for moment #524</a>. Many thanks to <a href="https://github.com/nicoladefranceschi">nicoladefranceschi</a> for this contribution. This change addresses <a href="https://github.com/exceljs/exceljs/issues/517">Ability to use external "moment" package #517</a>. </li> </ul> |
| 1.1.0   | <ul> <li> Addressed <a href="https://github.com/exceljs/exceljs/issues/514">Is there a way inserting values in columns. #514</a>. Added a new getter/setter property to Column to get and set column values (see <a href="#columns">Columns</a> for details). </li> </ul> |
| 1.1.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/532">Include index.d.ts in published packages #532</a>. To fix <a href="https://github.com/exceljs/exceljs/issues/525">TypeScript definitions missing from npm package #525</a>. Many thanks to <a href="https://github.com/saschanaz">Kagami Sascha Rosylight</a> for this contribution. </li> </ul> |
| 1.1.2   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/536">Don't break when docProps/core.xml contains <cp:contentType /> #536</a>. Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> (and reviewers) for this contribution. </li> </ul> |
| 1.1.3   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/537">Try to handle the case where a &lt;c&gt; element is missing an r attribute #537</a>. Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. </li> </ul> |
| 1.2.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/544">Add dateUTC flag to CSV Writing #544</a>. Many thanks to <a href="https://github.com/zgriesinger">Zackery Griesinger</a> for this contribution. </li> </ul> |
| 1.2.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/547">worksheet name is writable #547</a>. Many thanks to <a href="https://github.com/f111fei">xzper</a> for this contribution. </li> </ul> |
| 1.3.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/549">Add CSV write buffer support #549</a>. Many thanks to <a href="https://github.com/jloveridge">Jarom Loveridge</a> for this contribution. </li> </ul> |
| 1.4.2   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/541">Discussion: Customizable row/cell limit #541</a>. Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. </li> </ul> |
| 1.4.3   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/552">Get the right text out of hyperlinked formula cells #552</a>. Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> and <a href="https://github.com/holm">Christian Holm</a> for this contribution. </li> </ul> |
| 1.4.5   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/556">Add test case with a huge file #556</a>. Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> and <a href="https://github.com/holm">Christian Holm</a> for this contribution. </li> </ul> |
| 1.4.6   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/557">Update README.md to reflect correct functionality of row.addPageBreak() #557</a>. Many thanks to <a href="https://github.com/raj7desai">RajDesai</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/558">fix index.d.ts #558</a>. Many thanks to <a href="https://github.com/Diluka">Diluka</a> for this contribution. </li> </ul> |
| 1.4.7   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/562">List /xl/sharedStrings.xml in [Content_Types].xml only if one of the … #562</a>. Many thanks to <a href="https://github.com/priidikvaikla">Priidik Vaikla</a> for this contribution. </li> </ul> |
| 1.4.8   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/562">List /xl/sharedStrings.xml in [Content_Types].xml only if one of the … #562</a>. Many thanks to <a href="https://github.com/priidikvaikla">Priidik Vaikla</a> for this contribution. </li> <li> Fixed issue with above where shared strings were used but the content type was not added. </li> </ul> |
| 1.4.9   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/562">List /xl/sharedStrings.xml in [Content_Types].xml only if one of the … #562</a>. Many thanks to <a href="https://github.com/priidikvaikla">Priidik Vaikla</a> for this contribution. </li> <li> Fixed issue with above where shared strings were used but the content type was not added. </li> <li> Fixed issue <a href="https://github.com/exceljs/exceljs/issues/581">1.4.8 broke writing Excel files with useSharedStrings:true #581</a>. </li> </ul> |
| 1.4.10  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/564">core-xform: Tolerate a missing cp: namespace for the coreProperties element #564</a>. Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. </li> </ul> |
| 1.4.12  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/567">Avoid error on malformed address #567</a>. Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/571">Added a missing Promise&lt;void&gt; in index.d.ts #571</a>. Many thanks to <a href="https://github.com/carboneater">Gabriel Fournier</a> for this contribution. This release should fix <a href="https://github.com/exceljs/exceljs/issues/548">Is workbook.commit() still a promise or not #548</a> </li> </ul> |
| 1.4.13  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/574">Issue #488 #574</a>. Many thanks to <a href="https://github.com/dljenkins">dljenkins</a> for this contribution. This release should fix <a href="https://github.com/exceljs/exceljs/issues/488">Invalid time value Exception #488</a>. </li> </ul> |
| 1.5.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/577">Sheet add state for hidden or show #577</a>. Many thanks to <a href="https://github.com/Hsinfu">Freddie Hsinfu Huang</a> for this contribution. This release should fix <a href="https://github.com/exceljs/exceljs/issues/226">hide worksheet and reorder sheets #226</a>. </li> </ul> |
| 1.5.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/582">Update index.d.ts #582</a>. Many thanks to <a href="https://github.com/hankolsen">hankolsen</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/584">Decode the _x<4 hex chars>_ escape notation in shared strings #584</a>. Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. </li> </ul> |
| 1.6.0   | <ul> <li> Added .html property to Cells to facilitate html-safe rendering. See <a href="#handling-individual-cells">Handling Individual Cells</a> for details. </li> </ul> |
| 1.6.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/587">Fix Issue #488 where dt is an invalid date format. #587</a> to fix  <a href="https://github.com/exceljs/exceljs/issues/488">Invalid time value Exception #488</a>. Many thanks to <a href="https://github.com/ilijaz">Iliya Zubakin</a> for this contribution. </li> </ul> |
| 1.6.2   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/587">Fix Issue #488 where dt is an invalid date format. #587</a> to fix  <a href="https://github.com/exceljs/exceljs/issues/488">Invalid time value Exception #488</a>. Many thanks to <a href="https://github.com/ilijaz">Iliya Zubakin</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/590">drawing element must be below rowBreaks according to spec or corrupt worksheet #590</a> Many thanks to <a href="https://github.com/nevace">Liam Neville</a> for this contribution. </li> </ul> |
| 1.6.3   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/595">set type optional #595</a> Many thanks to <a href="https://github.com/taoqf">taoqf</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/578">Fix some xlsx stream read xlsx not in guaranteed order problem #578</a> Many thanks to <a href="https://github.com/KMethod">KMethod</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/599">Fix formatting issue in README #599</a> Many thanks to <a href="https://github.com/getsomecoke">Vishnu Kyatannawar</a> for this contribution. </li> </ul> |
| 1.7.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/602">Ability to set tooltip for hyperlink #602</a> Many thanks to <a href="https://github.com/kalexey89">Kuznetsov Aleksey</a> for this contribution. </li> </ul> |
| 1.8.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/636">Fix misinterpreted ranges from &lt;definedName&gt; #636</a> Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. </li> </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/640">Add LGTM code quality badges #640</a> Many thanks to <a href="https://github.com/xcorail">Xavier RENE-CORAIL</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/646">Add type definition for Column.values #646</a> Many thanks to <a href="https://github.com/emlai">Emil Laine</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/645">Column.values is missing TypeScript definitions #645</a>. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/663">Update README.md with load() option #663</a> Many thanks to <a href="https://github.com/thinksentient">Joanna Walker</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/677">fixed packages according to npm audit #677</a> Many thanks to <a href="https://github.com/misleadingTitle">Manuel Minuti</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/699">Update index.d.ts #699</a> Many thanks to <a href="https://github.com/rayyen">Ray Yen</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/708">Replaced node-unzip-2 to unzipper package which is more robust #708</a> Many thanks to <a href="https://github.com/johnmalkovich100">johnmalkovich100</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/728">Read worksheet hidden state #728</a> Many thanks to <a href="https://github.com/LesterLyu">Dishu(Lester) Lyu</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/736">add Worksheet.state typescript definition fix #714 #736</a> Many thanks to <a href="https://github.com/ilyes-kechidi">Ilyes Kechidi</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/714">Worksheet State does not exist in index.d.ts #714</a>. </li> </ul> |
| 1.9.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/702">Improvements for images (correct reading/writing possitions) #702</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/650">Image location don't respect Column width #650</a> and <a href="https://github.com/exceljs/exceljs/issues/467">Image position - stretching image #467</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> </li> </ul> |
| 1.9.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/619">Add Typescript support for formulas without results #619</a>. Many thanks to <a href="https://github.com/Wolfchin">Loursin</a> for this contribution. </li> </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/737">Fix existing row styles when using spliceRows #737</a>. Many thanks to <a href="https://github.com/cxam">cxam</a> for this contribution. </li> </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/774">Consistent code quality #774</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> </li> </ul> |
| 1.10.0  | <ul> <li> Fixed effect of splicing rows and columns on defined names </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/746">Add support for adding images anchored to one cell #746</a>. Many thanks to <a href="https://github.com/karlvr">Karl von Randow</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/758">Add vertical align property #758</a>. Many thanks to <a href="https://github.com/MikeZyatkov">MikeZyatkov</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/775">Replace the temp lib to tmp #775</a>. Many thanks to <a href="https://github.com/coldhiber">Ivan Sotnikov</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/780">Replace the temp lib to tmp #775</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/793">Update Worksheet.dimensions return type #793</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/795">One more types fix #795</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> </ul> |
| 1.11.0  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/776">Add the ability to bail out of parsing if the number of columns exceeds a given limit #776</a>. Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/799">Add support for repeated columns on every page when printing. #799</a>. Many thanks to <a href="https://github.com/FreakenK">Jasmin Auger</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/815">Do not use a promise polyfill on modern setups #815</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/807">copy LICENSE to the dist folder #807</a>. Many thanks to <a href="https://github.com/zypA13510">Yuping Zuo</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/813">Avoid unhandled rejection on XML parse error #813</a>. Many thanks to <a href="https://github.com/papandreou">Andreas Lind</a> for this contribution. </li> </ul> |
| 1.12.0  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/819">(chore) increment unzipper to 0.9.12 to address npm advisory 886 #819</a>. Many thanks to <a href="https://github.com/kreig303">Kreig Zimmerman</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/817">docs(README): improve docs #817</a>. Many thanks to <a href="https://github.com/zypA13510">Yuping Zuo</a> for this contribution. </li> <li> <p> Merged <a href="https://github.com/exceljs/exceljs/pull/823">add comment support #529 #823</a>. Many thanks to <a href="https://github.com/ilimei">ilimei</a> for this contribution. </p> <p>This fixes the following issues:</p> <ul> <li><a href="https://github.com/exceljs/exceljs/issues/202">Is it possible to add comment on a cell? #202</a></li> <li><a href="https://github.com/exceljs/exceljs/issues/451">Add comment to cell #451</a></li> <li><a href="https://github.com/exceljs/exceljs/issues/503">Excel add comment on cell #503</a></li> <li><a href="https://github.com/exceljs/exceljs/issues/529">How to add Cell comment #529</a></li> <li><a href="https://github.com/exceljs/exceljs/issues/707">Please add example to how I can insert comments for a cell #707</a></li> </ul> </li> </ul> |
| 1.12.1  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/822">fix issue with print area defined name corrupting file #822</a>. Many thanks to <a href="https://github.com/donaldsonjulia">Julia Donaldson</a> for this contribution. This fixes issue <a href="https://github.com/exceljs/exceljs/issues/664">Defined Names Break/Corrupt Excel File into Repair Mode #664</a>. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/831">Only keep at most 31 characters for sheetname #831</a>. Many thanks to <a href="https://github.com/kaleo211">Xuebin He</a> for this contribution. This fixes issue <a href="https://github.com/exceljs/exceljs/issues/398">Limit worksheet name length to 31 characters #398</a>. </li> </ul> |
| 1.12.2  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/834">add cn doc #834</a> and <a href="https://github.com/exceljs/exceljs/pull/852">update cn doc #852</a>. Many thanks to <a href="https://github.com/loverto">flydragon</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/853">fix minor spelling mistake in readme #853</a>. Many thanks to <a href="https://github.com/ridespirals">John Varga</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/855">Fix defaultRowHeight not working #855</a>. Many thanks to <a href="https://github.com/autukill">autukill</a> for this contribution. This should fix <a href="https://github.com/exceljs/exceljs/issues/422">row height doesn't apply to row #422</a>, <a href="https://github.com/exceljs/exceljs/issues/634">The worksheet.properties.defaultRowHeight can't work!! How to set the rows height, help!! #634</a> and <a href="https://github.com/exceljs/exceljs/issues/696">Default row height doesn't work ? #696</a>. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/854">Always keep first font #854</a>. Many thanks to <a href="https://github.com/dogusev">Dmitriy Gusev</a> for this contribution. This should fix <a href="https://github.com/exceljs/exceljs/issues/816">document scale (width only) is different after read & write #816</a>, <a href="https://github.com/exceljs/exceljs/issues/833">Default font from source document can not be parsed. #833</a> and <a href="https://github.com/exceljs/exceljs/issues/849">Wrong base font: hardcoded Calibri instead of font from the document #849</a>. </li> </ul> |
| 1.13.0  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/862">zip: allow tuning compression for performance or size #862</a>. Many thanks to <a href="https://github.com/myfreeer">myfreeer</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/863">Feat configure headers and footers #863</a>. Many thanks to <a href="https://github.com/autukill">autukill</a> for this contribution. </li> <li> Fixed an issue with defaultRowHeight where the default value resulted in 'customHeight' property being set. </li> </ul> |
| 1.14.0  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/874">Fix header and footer text format error in README.md #874</a>. Many thanks to <a href="https://github.com/autukill">autukill</a> for this contribution. </li> <li> Added Tables. See <a href="#tables">Tables</a> for details. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/887">fix: #877 and #880</a>. Many thanks to <a href="https://github.com/aexei">Alexander Heinrich</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/pull/877">bug: Hyperlink without text crashes write #877</a> and <a href="https://github.com/exceljs/exceljs/pull/880">bug: malformed comment crashes on write #880</a> </li> </ul> |
| 1.15.0  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/889">Add Compression level option to WorkbookWriterOptions for streaming #889</a>. Many thanks to <a href="https://github.com/ABenassi87">Alfredo Benassi</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/903">Feature/Cell Protection #903</a> and <a href="https://github.com/exceljs/exceljs/pull/907">Feature/Sheet Protection #907</a>. Many thanks to <a href="https://github.com/karabaesh">karabaesh</a> for these contributions. </li> </ul> |
| 2.0.1   | <h2>Major Version Change</h2> <p>Introducing async/await to ExcelJS!</p> <p>The new async and await features of JavaScript can help a lot to make code more readable and maintainable. To avoid confusion, particularly with returned promises from async functions, we have had to remove the Promise class configuration option and from v2 onwards ExcelJS will use native Promises. Since this is potentially a breaking change we're bumping the major version for this release.</p> <h2>Changes</h2> <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/829">Introduce async/await #829</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/930">Update index.d.ts #930</a>. Many thanks to <a href="https://github.com/cosmonovallc">cosmonovallc</a> for this contributions. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/940">TS: Add types for addTable function #940</a>. Many thanks to <a href="https://github.com/egmen">egmen</a> for this contributions. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/926">added explicit return types to the type definitions of Worksheet.protect() and Worksheet.unprotect() #926</a>. Many thanks to <a href="https://github.com/drjokepu">Tamas Czinege</a> for this contributions. </li> <li> Dropped dependencies on Promise libraries. </li> </ul> |
| 3.0.0   | <h2>Another Major Version Change</h2> <p>Javascript has changed a lot over the years, and so have the modules and technologies surrounding it. To this end, this major version of ExcelJS changes the structure of the publish artefacts:</p> <h3>Main Export is now the Original Javascript Source</h3> <p>Prior to this release, the transpiled ES5 code was exported as the package main. From now on, the package main comes directly from the lib/ folder. This means a number of dependencies have been removed, including the polyfills.</p> <h3>ES5 and Browserify are Still Included</h3> <p>In order to support those that still require ES5 ready code (e.g. as dependencies in web apps) the source code will still be transpiled and available  in dist/es5.</p> <p>The ES5 code is also browserified and available as dist/exceljs.js or dist/exceljs.min.js</p> <p><i>See the section <a href="#importing">Importing</a> for details</i></p> |
| 3.1.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/873">Uprev fast-csv to latest version which does not use unsafe eval #873</a>. Many thanks to <a href="https://github.com/miketownsend">Mike Townsend</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/906">Exclude Infinity on createInputStream #906</a>. Many thanks to <a href="https://github.com/sophiedophie">Sophie Kwon</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/911">Feature/Add comments/notes to stream writer #911</a>. Many thanks to <a href="https://github.com/brunoargolo">brunoargolo</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/868">Can't add cell comment using streaming WorkbookWriter #868</a> </li> <li> Fixed an issue with reading .xlsx files containing notes. This should resolve the following issues: <ul> <li><a href="https://github.com/exceljs/exceljs/issues/941">Reading comment/note from xlsx #941</a></li> <li><a href="https://github.com/exceljs/exceljs/issues/944">Excel.js doesn't parse comments/notes. #944</a></li> </ul> </li> </ul> |
| 3.2.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/923">Add document for zip options of streaming WorkbookWriter #923</a>. Many thanks to <a href="https://github.com/piglovesyou">Soichi Takamura</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/933">array formula #933</a>. Many thanks to <a href="https://github.com/yoann-antoviaque">yoann-antoviaque</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/932">broken array formula #932</a> and adds <a href="#array-formula">Array Formulae</a> to ExcelJS. </li> </ul> |
| 3.3.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/892">Fix anchor.js #892</a>. Many thanks to <a href="https://github.com/wwojtkowski">Wojciech Wojtkowski</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/896">add xml:space="preserve" for all whitespaces #896</a>. Many thanks to <a href="https://github.com/sebikeller">Sebastian Keller</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/959">Add `shrinkToFit` to document and typing #959</a>. Many thanks to <a href="https://github.com/mozisan">('3')</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/943">shrinkToFit property not on documentation #943</a>. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/980">#951: Force formula re-calculation on file open from Excel #980</a>. Many thanks to <a href="https://github.com/zymon">zymon</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/951">Force formula re-calculation on file open from Excel #951</a>. </li> <li> Fixed <a href="https://github.com/exceljs/exceljs/issues/989">Lib contains class syntax, not compatible with IE11 #989</a>. </li> </ul> |
| 3.3.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1000">Add headerFooter to worksheet model when importing from file #1000</a>. Many thanks to <a href="https://github.com/kigh-ota">Kaiichiro Ota</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1005">Update eslint plugins and configs #1005</a>, <a href="https://github.com/exceljs/exceljs/pull/1006">Drop grunt-lib-phantomjs #1006</a> and <a href="https://github.com/exceljs/exceljs/pull/1007">Rename .browserslintrc.txt to .browserslistrc #1007</a>. Many thanks to <a href="https://github.com/takenspc">Takeshi Kurosawa</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1012">Fix issue #988 #1012</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/988">Can not read excel file #988</a>. Many thanks to <a href="https://github.com/thambley">Todd Hambley</a> for this contribution. </li> </ul> |
| 3.4.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1016">Feature/stream writer add background images #1016</a>. Many thanks to <a href="https://github.com/brunoargolo">brunoargolo</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1019">Fix issue # 991 #1019</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/991">read csv file issue #991</a>. Many thanks to <a href="https://github.com/LibertyNJ">Nathaniel J. Liberty</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1018">Large excels - optimize performance of writing file by excelJS + optimize generated file (MS excel opens it much faster) #1018</a>. Many thanks to <a href="https://github.com/pzawadzki82">Piotr</a> for this contribution. </li> </ul> |
| 3.5.0   | <ul> <li> <a href="#conditional-formatting">Conditional Formatting</a> A subset of Excel Conditional formatting has been implemented! Specifically the formatting rules that do not require XML to be rendered inside an &lt;extLst&gt; node, or in other words everything except databar and three icon sets (3Triangles, 3Stars, 5Boxes). These will be implemented in due course </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1030">remove core-js/ import #1030</a>. Many thanks to <a href="https://github.com/bleuscyther">jeffrey n. carre</a> for this contribution. This change is used to create a new browserified bundle artefact that does not include any polyfills. See <a href="#browserify">Browserify</a> for details. </li> </ul> |
| 3.6.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1042">1041 multiple print areas #1042</a>. Many thanks to <a href="https://github.com/AlexanderPruss">Alexander Pruss</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1058">fix typings for cell.note #1058</a>. Many thanks to <a href="https://github.com/xydens">xydens</a> for this contribution. </li> <li> <a href="#conditional-formatting">Conditional Formatting</a> has been completed. The &lt;extLst&gt; conditional formattings including dataBar and the three iconSet types (3Triangles, 3Stars, 5Boxes) are now available. </li> </ul> |
| 3.6.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1047">Clarify merging cells by row/column numbers #1047</a>. Many thanks to <a href="https://github.com/kendallroth">Kendall Roth</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1048">Fix README mistakes concerning freezing views #1048</a>. Many thanks to <a href="https://github.com/overlookmotel">overlookmotel</a> for this contribution. </li> <li> Merged: <ul> <li><a href="https://github.com/exceljs/exceljs/pull/1073">fix issue #1045 horizontalCentered & verticalCentered in page not working #1073</a></li> <li><a href="https://github.com/exceljs/exceljs/pull/1082">Fix the problem of anchor failure of readme_zh.md file #1082</a></li> <li><a href="https://github.com/exceljs/exceljs/pull/1065">Fix problems caused by case of worksheet names #1065</a></li> </ul> Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> </ul> |
| 3.7.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1076">Fix Issue #1075: Unable to read/write defaultColWidth attribute in &lt;sheetFormatPr&gt; node #1076</a>. Many thanks to <a href="https://github.com/kigh-ota">Kaiichiro Ota</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1078">function duplicateRows added #1078</a> and <a href="https://github.com/exceljs/exceljs/pull/1088">Duplicate rows #1088</a>. Many thanks to <a href="https://github.com/cbeltrangomez84">cbeltrangomez84</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1087">Prevent from unhandled promise rejection durning workbook load #1087</a>. Many thanks to <a href="https://github.com/sohai">Wojtek</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1071">fix issue #899 Support for inserting pictures with hyperlinks #1071</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1089">Update TS definition to reference proper internal libraries #1089</a>. Many thanks to <a href="https://github.com/jakawell">Jesse Kawell</a> for this contribution. </li> </ul> |
| 3.8.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1090">Issue/Corrupt workbook using stream writer with background image #1090</a>. Many thanks to <a href="https://github.com/brunoargolo">brunoargolo</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1092">Fix index.d.ts #1092</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1093">Wait for writing to tmp fiels before handling zip stream close #1093</a>. Many thanks to <a href="https://github.com/sohai">Wojtek</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1095">Support ArrayBuffer as an xlsx.load argument #1095</a>. Many thanks to <a href="https://github.com/sohai">Wojtek</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1099">Export shared strings with RichText #1099</a>. Many thanks to <a href="https://github.com/kigh-ota">Kaiichiro Ota</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1102">Keep borders of merged cells after rewriting an Excel workbook #1102</a>. Many thanks to <a href="https://github.com/kigh-ota">Kaiichiro Ota</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1104">Fix #1103: `editAs` not working #1104</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1105">Fix to issue #1101 #1105</a>. Many thanks to <a href="https://github.com/cbeltrangomez84">Carlos Andres Beltran Gomez</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1107">fix some errors and typos in readme #1107</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1112">Update issue templates #1112</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> </ul> |
| 3.8.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1112">Update issue templates #1112</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1124">Typo: Replace 'allways' with 'always' #1124</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1125">Replace uglify with terser #1125</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1126">Apply codestyles on each commit and run lint:fix #1126</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1127">[WIP] Replace sax with saxes #1127</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1128">Add PR, Feature Request and Question github templates #1128</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1137">fix issue #749 Fix internal link example errors in readme #1137</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> </ul> |
| 3.8.2   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1133">Update @types/node version to latest lts #1133</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1134">fix issue #1118 Adding Data Validation and Conditional Formatting to the same sheet causes corrupt workbook #1134</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1139">Add benchmarking #1139</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1148">fix issue #731 image extensions not be case sensitive #1148</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1169">fix issue #1165 and update index.d.ts #1169</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> </ul> |
| 3.9.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1140">Optimize SAXStream #1140</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1143">fix issue #1057 Fix addConditionalFormatting is not a function error when using Streaming XLSX Writer #1143</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1160">fix issue #204 sets default column width #1160</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1164">Include cell address for Shared Formula master must exist.. error #1164</a>. Many thanks to <a href="https://github.com/noisyscanner">Brad Reed</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1166">Typo in DataValidation examples #1166</a>. Many thanks to <a href="https://github.com/mravey">Matthieu Ravey</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1176">fixes #1175 #1176</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1179">fix issue #1178 and update index.d.ts #1179</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1182">Simple test if typescript is able to compile #1182</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1190">More improvements #1190</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1193">Ensure all node_modules are compatible with IE11 #1193</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1199">fix issue #1194 and update index.d.ts #1199</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/1194">[BUG] TypeScript version doesn't have definition for Worksheet.addConditionalFormatting #1194</a>. </li> Merged <a href="https://github.com/exceljs/exceljs/pull/1204">fix issue #1157 marked Cannot set property #1204</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/1157">[BUG] Cannot set property 'marked' of undefined #1157</a>. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1209">Deprecate createInputStream #1209</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> </li> Merged <a href="https://github.com/exceljs/exceljs/pull/1204">fix issue #1206 #1205 Abnormality of and attributes #1210</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/1205">[BUG] Unlocked cells do not maintain their unlocked status after reading and writing a workbook. #1205</a> and <a href="https://github.com/exceljs/exceljs/issues/1206">[BUG] Unlocked cells lose their vertical and horizontal alignment after a read and write. #1206</a>. </li> </ul> |
| 3.10.0  | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1233">[Chore] Upgrade dependencies #1233</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> </li> Merged <a href="https://github.com/exceljs/exceljs/pull/1220">Fix issue #1198 Absolute path and relative path need to be compatible #1220</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/1198">[BUG] Loading OpenPyXL workbooks #1198</a>. </li> </li> Merged <a href="https://github.com/exceljs/exceljs/pull/1234">Upgrade tmp #1234</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/882">Process doesn't exit < 8.12.0 #882</a>. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1270">New version of dayjs requires explicit `Z` in the date formats #1270</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> </li> Merged <a href="https://github.com/exceljs/exceljs/pull/1280">Fixed #1276 #1280</a>. Many thanks to <a href="https://github.com/Subhajitdas298">Subhajit Das</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/1276">[BUG] Invalid regular expression: /^[ -íŸ¿î€€-ï¿½ð€€-ô¿¿]$/: Range out of order in character class #1276</a>. </li> </li> Merged <a href="https://github.com/exceljs/exceljs/pull/1278">[bugfix] Fix special cell values causing invalid files produced #1278</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/703">Special cell value results invalid file #703</a>. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1208">Re-translation of simplified Chinese documents (zh-cn) #1208</a>. Many thanks to <a href="https://github.com/wang1212">不如怀念</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1208">data-validations-xform: keep formulae if type not exists #1229</a>. Many thanks to <a href="https://github.com/myfreeer">myfreeer</a> for this contribution. </li> </li> Merged <a href="https://github.com/exceljs/exceljs/pull/1257">WorkbookWriter support rowBreaks #1257</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. This fixes <a href="https://github.com/exceljs/exceljs/issues/1248">[BUG] WorkbookWriter doesn't support headerFooter and rowBreaks. #1248</a>. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1289">Fixed ascii only #1289</a>. Many thanks to <a href="https://github.com/Subhajitdas298">Subhajit Das</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1159">Supports setting cell comment properties #1159</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1215">docs: add links to top with jump2header #1215</a>. Many thanks to <a href="https://github.com/strdr4605">Dragoș Străinu</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1310">Fix cell.text return an empty object when cell is empty #1310</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1303">Use rest args instead of slicing arguments #1303</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> </ul> |
| 4.0.1   | <ul> <li> A Major Version Change - The main ExcelJS interface has been migrated from streams based API to Async Iterators making for much cleaner code. While technically a breaking change, most of the API is unchanged For details see <a href="https://github.com/exceljs/exceljs/blob/master/UPGRADE-4.0.md">UPGRADE-4.0.md</a>. </li> <li> This upgrade has come from the following merges: <ul> <li><a href="https://github.com/exceljs/exceljs/pull/1135">[MAJOR VERSION] Async iterators #1135</a></li> <li><a href="https://github.com/exceljs/exceljs/pull/1142">[MAJOR VERSION] Move node v8 support to ES5 imports #1142</a></li> </ul> A lot of work from the team went into this - in particular <a href="https://github.com/alubbe">Andreas Lubbe</a> and <a href="https://github.com/Siemienik">Siemienik Paweł</a>. </li> </ul> |
| 4.1.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1317">Remove const enum and add ErrorValue in index.d.ts #1317</a> Many thanks to  <a href="https://github.com/aplum">Alex Plumley</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1319">update README.md and READEME_zh.md #1319</a> Many thanks to  <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1324">Added insert rows functionality with new style inherit options #1324</a> Many thanks to  <a href="https://github.com/Subhajitdas298">Subhajit Das</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1327">Updated readme for insert rows #1327</a> Many thanks to  <a href="https://github.com/Subhajitdas298">Subhajit Das</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1338">Fix: Async iterators definition #1338</a> Many thanks to  <a href="https://github.com/JuhBoy">Julien - JuH</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1344">[bugfix] Fix special cell values causing invalid files produced(#1339) #1344</a>. This fixes <a href="https://github.com/exceljs/exceljs/pull/1339">[BUG] hasOwnProperty, constructor special words not serialized correctly with stream.xlsx.WorkbookWriter #1339</a>. Many thanks to  <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1334">Fix the error that comment does not delete at spliceColumn #1334</a>. Many thanks to  <a href="https://github.com/sdg9670">sdg9670</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1328">bug fix can not read property date1904 of undefined #1328</a>. Many thanks to  <a href="https://github.com/1328">1328</a> for this contribution. </li> </ul> |
| 4.1.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1356">update index.d.ts #1356</a> Many thanks to <a href="https://github.com/Siemienik">Siemienik Paweł</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1358">Fix styleOption error in index.ts #1358</a>. This fixes <a href="https://github.com/exceljs/exceljs/issues/1357">[BUG] 4.1.0 causes TypeScript compilation errors - addRows styleOption should be optional? #1357</a>. Many thanks to  <a href="https://github.com/sdg9670">sdg9670</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1354">Improved documentation #1354</a> Many thanks to <a href="https://github.com/Subhajitdas298">Subhajit Das</a> for this contribution. </li> </ul> |
| 4.2.0   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1432">Fix issue #1431 Streaming WorkbookReader _parseSharedStrings doesn't handle rich text within shared string nodes #1432</a>. Many thanks to <a href="https://github.com/rheidari">Reza Heidari</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1442">Change typing for colorScale colour to array of colours #1442</a>. Many thanks to <a href="https://github.com/7coil">Leondro Lio</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1443">AddRow/s and InsertRow/s now returning the newly added rows #1443</a>. Many thanks to <a href="https://github.com/Subhajitdas298">Subhajit Das</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1475">fix docs #1475</a>. Many thanks to <a href="https://github.com/kiba-d">Dmytro Kyba</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1360">[bugfix]Fix Issue #1254 and update index.d.ts #1360</a>. This should fix <a href="https://github.com/exceljs/exceljs/issues/1254">[BUG] getSheetValues() typescript definition is incorrect #1254</a>. Many thanks to <a href="https://github.com/Alanscut">Alan Wang</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1262">Fix issue #1261 WorkbookWriter sheet.protect() function doesn't exist #1262</a>. This should fix <a href="https://github.com/exceljs/exceljs/issues/1261">[BUG] WorkbookWriter sheet.protect() function doesn't exist #1261</a>. Many thanks to <a href="https://github.com/rheidari">Reza Heidari</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1405">README: images not supported in streaming mode #1405</a>. Many thanks to <a href="https://github.com/chdh">Christian d'Heureuse</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1477">Run linter with prettier 2 #1477</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1476">Increase the performance of some xml and html helpers #1476</a>. Many thanks to <a href="https://github.com/alubbe">Andreas Lubbe</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1482">Performance improvement in col-cache #1482</a>. Many thanks to <a href="https://github.com/antimatter15">Kevin Kwok</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1481">Fix type definition for DefinedNamesRanges #1481</a>. Many thanks to <a href="https://github.com/antimatter15">Kevin Kwok</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1480">Fixed undefined ref error when setting a data validation that is a range of cells at the worksheet level #1480</a>. Many thanks to <a href="https://github.com/Bene-Graham">Bene-Graham</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1485">add A3 paperSize number #1485</a>. This should fix <a href="https://github.com/exceljs/exceljs/issues/1406">[F] The printing size can be set to A3 #1406</a>. Many thanks to <a href="https://github.com/skypesky">skypesky</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1478">Fix #1364 Incorrect Worksheet Name on Streaming XLSX Reader #1478</a>. This should fix <a href="https://github.com/exceljs/exceljs/issues/1364">[BUG] Incorrect Worksheet Name on Streaming XLSX Reader #1364</a>. Many thanks to <a href="https://github.com/antimatter15">Kevin Kwok</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1466">grunt: skip babel transpile for core-js #1466</a>. Many thanks to <a href="https://github.com/myfreeer">myfreeer</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1486">xlsx: use TextDecoder and TextEncoder in browser #1486</a>. Many thanks to <a href="https://github.com/myfreeer">myfreeer</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1488">Refine typing for Column #1488</a>. This should fix <a href="https://github.com/exceljs/exceljs/issues/1120">[BUG] Typescript error from getColumn.eachCell #1120</a>. Many thanks to <a href="https://github.com/nywleswoey">Selwyn Yeow</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1489">col-cache: optimize for performance #1489</a>. Many thanks to <a href="https://github.com/myfreeer">myfreeer</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1487">Add lastColumn property (fixes #1453) #1487</a>. This should fix <a href="https://github.com/exceljs/exceljs/issues/1453">property of worsheet.lastcolumn #1453</a>. Many thanks to <a href="https://github.com/FliegendeWurst">FliegendeWurst</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1495">Add a test for CSV writeFile encoding #1495</a>. This should close <a href="https://github.com/exceljs/exceljs/issues/1473">[BUG] Export CSV garbled characters #1473</a>. and <a href="https://github.com/exceljs/exceljs/issues/995">Can't get hebrew to display correctly in a generted CSV file #995</a>. Many thanks to <a href="https://github.com/ArtskydJ">Joseph Dykstra</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1496">Clarify `encoding` option is just for `.writeFile` #1496</a>. Many thanks to <a href="https://github.com/ArtskydJ">Joseph Dykstra</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1377">Merge cells after row insert #1377</a>. Many thanks to <a href="https://github.com/curtcommander">Curt Commander</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1484">Fix issue 1474 (to check invalid sheet name) #1484</a>. This should fix <a href="https://github.com/exceljs/exceljs/issues/1474">[BUG] Incorrectly handles '/', ':' characters in sheet name #1474</a>. Many thanks to <a href="https://github.com/skypesky">skypesky</a> for this contribution. </li> </ul> |
| 4.2.1   | <ul> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1550">Typing FillPattern fgColor should be optional #1550</a>. Many thanks to <a href="https://github.com/Andries-Smit">Andries Smit</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1564">Fixed return type on getRows #1564</a>. Many thanks to <a href="https://github.com/pmcilwaine">Paul Mcilwaine</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1599">fix #1598 lint violations #1599</a>. Fixes <a href="https://github.com/exceljs/exceljs/issues/1598">[BUG] npm run lint reports multiple violations #1598</a>. Many thanks to <a href="https://github.com/iva2k">Ilya I</a> for this contribution. </li> <li> Merged <a href="https://github.com/exceljs/exceljs/pull/1606">Fix fullAddress row and col types #1606</a>. Many thanks to <a href="https://github.com/Akxe">Adam Eisenreich</a> for this contribution. </li> </ul> |
| 4.3.0   | <ul><li>Merged <a href="https://github.com/exceljs/exceljs/pull/1656">Add TS declarations of Workbook properties #1656</a>. Many thanks to <a href="https://github.com/kaoths">Tanawit Kritwongwiman</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/201">Fix issue #178 #201</a>. Many thanks to <a href="https://github.com/stavenko">Vasiliy Stavenko</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/1649">doc: add example for solid pattern usage #1649</a>. Many thanks to <a href="https://github.com/fpaupier">fpaupier</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/1629">Add type definition for lastColumn property (fixes #1453) #1629</a>. Fixes <a href="https://github.com/exceljs/exceljs/issues/1453">Add type for property of worsheet.lastcolumn #1453</a>. Many thanks to <a href="https://github.com/masterzeus05">Daniel Gonçalves</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/1599">fix #1598 lint violations #1599</a>. Fixes <a href="https://github.com/exceljs/exceljs/issues/1598">[BUG] npm run lint reports multiple violations #1598</a>. Many thanks to <a href="https://github.com/iva2k">Ilya I</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/1133">Update @types/node version to latest lts #1133</a>. Fixes <a href="https://github.com/exceljs/exceljs/issues/971">ERROR in node_modules/exceljs/index.d.ts(1648,34): error TS2503: Cannot find namespace 'NodeJS'. #971</a> and <a href="https://github.com/exceljs/exceljs/issues/997">ERROR in node_modules/exceljs/index.d.ts(1661,34): error TS2503: Cannot find namespace 'NodeJS'. #997</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Pawel</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/1731">Added Node v16 to the test suite #1731</a>. Many thanks to <a href="https://github.com/alexbjorlig">Alex Bjørlig</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/1708">Readme moment to dayjs #1708</a>. Many thanks to <a href="https://github.com/jerebtw">Jerebtw</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/602">Ability to set tooltip for hyperlink #602</a>. Many thanks to <a href="https://github.com/kalexey89">Aleksey Kuznetsov</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/1574">Fixed conditional format corrupting sheet #1305 #1574</a>. Fixes <a href="https://github.com/exceljs/exceljs/issues/1305">[BUG] Errors when opening file in Excel after saving a file with conditional formatting #1305</a>. Many thanks to <a href="https://github.com/rolandostar">Rolando Romero</a> for this contribution.</li><li>Merged <a href="https://github.com/exceljs/exceljs/pull/702">Improvements for images (correct reading/writing possitions) #702</a>. Many thanks to <a href="https://github.com/Siemienik">Siemienik Pawel</a> for this contribution.</li></ul> |
